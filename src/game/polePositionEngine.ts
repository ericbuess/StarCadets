export interface RacerState {
  playerX: number // -1 to 1 (left to right on road)
  speed: number
  maxSpeed: number
  position: number // distance along track
  time: number
  score: number
  lap: number
  lapTime: number
  bestLapTime: number
  checkpointTimer: number
  gameOver: boolean
  paused: boolean
  road: RoadSegment[]
  cars: AICar[]
  roadOffset: number
  curvature: number
  targetCurvature: number
  trackLength: number
  particles: RacerParticle[]
  level: number
  turbo: boolean
  turboTimer: number
}

export interface RoadSegment {
  curvature: number
  hill: number
}

export interface AICar {
  x: number // -1 to 1
  z: number // distance relative to player
  speed: number
  color: string
  passed: boolean
}

export interface RacerParticle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  color: string
  size: number
}

const ROAD_LENGTH = 300
const SEGMENT_LENGTH = 5
const AI_CARS_COUNT = 8
const BASE_MAX_SPEED = 280
const CHECKPOINT_TIME = 30

const AI_COLORS = ["#ff2e63", "#3ce67a", "#ffd93d", "#b83dff", "#ff7a1f", "#4cf1ff", "#ff9ec7", "#8a8aad"]

export function createRacerState(): RacerState {
  const road: RoadSegment[] = []
  for (let i = 0; i < ROAD_LENGTH; i++) {
    const section = Math.floor(i / 30)
    let curvature = 0
    let hill = 0
    if (section % 4 === 1) curvature = Math.sin(i * 0.08) * 0.2
    else if (section % 4 === 2) curvature = Math.sin(i * 0.05) * 0.35
    else if (section % 4 === 3) curvature = Math.cos(i * 0.12) * 0.15
    hill = Math.sin(i * 0.03) * 0.2
    road.push({ curvature, hill })
  }

  const cars: AICar[] = []
  for (let i = 0; i < AI_CARS_COUNT; i++) {
    cars.push({
      x: (Math.random() - 0.5) * 1.4,
      z: 200 + i * 80 + Math.random() * 50,
      speed: 140 + Math.random() * 80,
      color: AI_COLORS[i % AI_COLORS.length],
      passed: false,
    })
  }

  return {
    playerX: 0,
    speed: 0,
    maxSpeed: BASE_MAX_SPEED,
    position: 0,
    time: 0,
    score: 0,
    lap: 1,
    lapTime: 0,
    bestLapTime: Infinity,
    checkpointTimer: CHECKPOINT_TIME,
    gameOver: false,
    paused: false,
    road,
    cars,
    roadOffset: 0,
    curvature: 0,
    targetCurvature: 0,
    trackLength: ROAD_LENGTH * SEGMENT_LENGTH,
    particles: [],
    level: 1,
    turbo: false,
    turboTimer: 0,
  }
}

export interface RacerInput {
  left: boolean
  right: boolean
  up: boolean
  down: boolean
}

export function updateRacer(state: RacerState, dt: number, input: RacerInput): RacerState {
  if (state.paused || state.gameOver) return state
  state.time += dt

  // Steering
  const steerSpeed = 2.5 * (state.speed / state.maxSpeed)
  if (input.left) state.playerX -= steerSpeed * dt
  if (input.right) state.playerX += steerSpeed * dt

  // Acceleration / braking
  const effectiveMax = state.turbo ? state.maxSpeed * 1.3 : state.maxSpeed
  if (input.up) {
    state.speed = Math.min(effectiveMax, state.speed + 200 * dt)
  } else if (input.down) {
    state.speed = Math.max(0, state.speed - 300 * dt)
  } else {
    state.speed = Math.max(0, state.speed - 50 * dt)
  }

  // Off-road friction
  if (Math.abs(state.playerX) > 0.9) {
    state.speed *= (1 - 1.5 * dt)
    state.playerX = Math.max(-1.2, Math.min(1.2, state.playerX))
    if (Math.abs(state.playerX) > 1.1 && state.speed > 50) {
      state.particles.push({
        x: state.playerX > 0 ? 0.8 : -0.8,
        y: 0.9,
        vx: (Math.random() - 0.5) * 100,
        vy: -Math.random() * 100,
        life: 0.5, maxLife: 0.5,
        color: "#886644", size: 3,
      })
    }
  }

  // Road curvature push
  const segIdx = Math.floor(state.position / SEGMENT_LENGTH) % ROAD_LENGTH
  state.targetCurvature = state.road[segIdx].curvature
  state.curvature += (state.targetCurvature - state.curvature) * 3 * dt
  state.playerX += state.curvature * (state.speed / state.maxSpeed) * 1.2 * dt

  // Position
  state.position += state.speed * dt
  state.roadOffset = state.position % SEGMENT_LENGTH

  // Checkpoint timer
  state.checkpointTimer -= dt
  if (state.checkpointTimer <= 0) {
    state.gameOver = true
    return state
  }

  // Lap check
  state.lapTime += dt
  if (state.position > state.trackLength * state.lap) {
    if (state.lapTime < state.bestLapTime) state.bestLapTime = state.lapTime
    state.lap++
    state.lapTime = 0
    state.checkpointTimer = Math.max(15, CHECKPOINT_TIME - state.lap * 2)
    state.score += 1000 * state.lap
    state.level = state.lap
    state.maxSpeed = Math.min(450, BASE_MAX_SPEED + state.lap * 15)
  }

  // Turbo timer
  if (state.turboTimer > 0) {
    state.turboTimer -= dt
    if (state.turboTimer <= 0) state.turbo = false
  }

  // AI cars
  for (const car of state.cars) {
    car.z -= (state.speed - car.speed) * dt

    // Wrap around
    if (car.z < -50) {
      car.z = 400 + Math.random() * 200
      car.x = (Math.random() - 0.5) * 1.4
      car.speed = 140 + Math.random() * 80 + state.level * 10
      car.passed = false
    }
    if (car.z > 800) {
      car.z = -30
    }

    // Collision
    if (car.z > -10 && car.z < 15 && Math.abs(car.x - state.playerX) < 0.25) {
      state.speed *= 0.3
      car.z = 30
      for (let i = 0; i < 8; i++) {
        state.particles.push({
          x: state.playerX, y: 0.7,
          vx: (Math.random() - 0.5) * 200,
          vy: -Math.random() * 200,
          life: 0.6, maxLife: 0.6,
          color: "#ff8800", size: 3,
        })
      }
    }

    // Score for passing cars
    if (!car.passed && car.z < 0) {
      car.passed = true
      state.score += 50
    }
  }

  state.score += state.speed * dt * 0.05

  // Particles
  state.particles = state.particles.filter(p => {
    p.x += p.vx * dt * 0.01
    p.y += p.vy * dt * 0.01
    p.life -= dt
    return p.life > 0
  })

  return state
}

export function renderRacer(
  ctx: CanvasRenderingContext2D,
  state: RacerState,
  cw: number,
  ch: number
) {
  const dpr = window.devicePixelRatio || 1
  const horizonY = ch * 0.4
  const roadW = cw * 0.5
  const drawSegs = 100

  // Sky gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY)
  skyGrad.addColorStop(0, "#050518")
  skyGrad.addColorStop(0.7, "#0d0830")
  skyGrad.addColorStop(1, "#1a1040")
  ctx.fillStyle = skyGrad
  ctx.fillRect(0, 0, cw, horizonY + 2)

  // Stars
  for (let i = 0; i < 40; i++) {
    const sx = (42 * (i + 1) * 7919) % cw
    const sy = (42 * (i + 1) * 104729) % (horizonY * 0.85)
    ctx.fillStyle = `rgba(255,255,255,${0.2 + (i % 4) * 0.12})`
    ctx.fillRect(sx, sy, 1.5 * dpr, 1.5 * dpr)
  }

  // Mountains on horizon
  ctx.fillStyle = "#0d0820"
  ctx.beginPath()
  ctx.moveTo(0, horizonY)
  for (let x = 0; x <= cw; x += 30) {
    const mh = 15 + Math.sin(x * 0.008 + 1) * 20 + Math.sin(x * 0.02) * 10
    ctx.lineTo(x, horizonY - mh)
  }
  ctx.lineTo(cw, horizonY)
  ctx.fill()

  // Road rendering
  const segStart = Math.floor(state.position / SEGMENT_LENGTH)
  const segXPositions: number[] = []
  const segYPositions: number[] = []
  const segScales: number[] = []

  let accumCurve = 0
  for (let i = 0; i <= drawSegs; i++) {
    const segI = (segStart + i) % ROAD_LENGTH
    const seg = state.road[segI]

    const perspective = i / drawSegs
    const pSq = perspective * perspective
    const y = ch - (ch - horizonY) * pSq
    const scale = 1 - pSq * 0.95

    accumCurve += seg.curvature * scale * 0.6
    const x = cw / 2 + accumCurve * 60 - state.playerX * roadW * scale * 0.5

    segXPositions.push(x)
    segYPositions.push(y)
    segScales.push(scale)
  }

  // Draw from far to near
  for (let i = drawSegs - 1; i >= 0; i--) {
    const x = segXPositions[i]
    const y = segYPositions[i]
    const scale = segScales[i]
    const nx = segXPositions[i + 1] ?? x
    const ny = segYPositions[i + 1] ?? y
    const ns = segScales[i + 1] ?? scale
    const w = roadW * scale
    const nw = roadW * ns

    // Ground strips
    const groundColor = Math.floor((segStart + i) / 4) % 2 === 0 ? "#1a2e1a" : "#15251a"
    ctx.fillStyle = groundColor
    ctx.fillRect(0, ny, cw, y - ny + 1)

    // Road trapezoid
    const roadColor = Math.floor((segStart + i) / 4) % 2 === 0 ? "#333346" : "#2c2c3e"
    ctx.fillStyle = roadColor
    ctx.beginPath()
    ctx.moveTo(x - w / 2, y)
    ctx.lineTo(x + w / 2, y)
    ctx.lineTo(nx + nw / 2, ny)
    ctx.lineTo(nx - nw / 2, ny)
    ctx.fill()

    // Rumble strips as trapezoids
    const rumbleW = w * 0.06
    const nRumbleW = nw * 0.06
    const rumbleColor = Math.floor((segStart + i) / 3) % 2 === 0 ? "#ff2e63" : "#ffffff"
    ctx.fillStyle = rumbleColor
    // Left rumble
    ctx.beginPath()
    ctx.moveTo(x - w / 2 - rumbleW, y)
    ctx.lineTo(x - w / 2, y)
    ctx.lineTo(nx - nw / 2, ny)
    ctx.lineTo(nx - nw / 2 - nRumbleW, ny)
    ctx.fill()
    // Right rumble
    ctx.beginPath()
    ctx.moveTo(x + w / 2, y)
    ctx.lineTo(x + w / 2 + rumbleW, y)
    ctx.lineTo(nx + nw / 2 + nRumbleW, ny)
    ctx.lineTo(nx + nw / 2, ny)
    ctx.fill()

    // Center dashes
    if (Math.floor((segStart + i) / 5) % 2 === 0 && scale > 0.08) {
      ctx.fillStyle = "#ffffff50"
      const dashW = Math.max(1, w * 0.012)
      const dashH = Math.max(1, y - ny)
      ctx.fillRect(x - dashW / 2, ny, dashW, dashH)
    }
  }

  // AI Cars (draw far to near for correct overlap)
  for (let i = drawSegs - 1; i >= 0; i--) {
    for (const car of state.cars) {
      const carSeg = Math.floor(car.z / SEGMENT_LENGTH)
      if (carSeg !== i || car.z <= 0) continue
      const scale = segScales[i]
      if (scale < 0.04) continue

      const x = segXPositions[i]
      const y = segYPositions[i]
      const w = roadW * scale
      const carScale = scale * 2.5
      const carW = 30 * carScale * dpr
      const carH = 18 * carScale * dpr
      const carX = x + car.x * w * 0.4
      const carY = y - carH

      ctx.fillStyle = car.color
      ctx.shadowColor = car.color
      ctx.shadowBlur = 8 * carScale

      // Car shape (rear view)
      ctx.beginPath()
      ctx.moveTo(carX - carW / 2, carY + carH)
      ctx.lineTo(carX - carW / 2, carY + carH * 0.4)
      ctx.lineTo(carX - carW * 0.3, carY + carH * 0.4)
      ctx.lineTo(carX - carW * 0.25, carY)
      ctx.lineTo(carX + carW * 0.25, carY)
      ctx.lineTo(carX + carW * 0.3, carY + carH * 0.4)
      ctx.lineTo(carX + carW / 2, carY + carH * 0.4)
      ctx.lineTo(carX + carW / 2, carY + carH)
      ctx.closePath()
      ctx.fill()

      // Windshield
      ctx.fillStyle = "rgba(0,0,0,0.4)"
      ctx.beginPath()
      ctx.moveTo(carX - carW * 0.22, carY + carH * 0.42)
      ctx.lineTo(carX - carW * 0.18, carY + carH * 0.08)
      ctx.lineTo(carX + carW * 0.18, carY + carH * 0.08)
      ctx.lineTo(carX + carW * 0.22, carY + carH * 0.42)
      ctx.fill()

      // Taillights
      ctx.fillStyle = "#ff2e63"
      ctx.fillRect(carX - carW / 2, carY + carH * 0.75, carW * 0.15, carH * 0.12)
      ctx.fillRect(carX + carW * 0.35, carY + carH * 0.75, carW * 0.15, carH * 0.12)
      ctx.shadowBlur = 0
    }
  }

  // Player car — large, centered
  const pCarW = 80 * dpr
  const pCarH = 48 * dpr
  const pCarX = cw / 2
  const pCarY = ch - 50 * dpr

  ctx.save()
  ctx.translate(pCarX, pCarY)

  const bodyColor = state.turbo ? `hsl(${(state.time * 200) % 360}, 100%, 60%)` : "#4cf1ff"
  ctx.fillStyle = bodyColor
  ctx.shadowColor = bodyColor
  ctx.shadowBlur = 15

  // Main body (rear view — wider at bottom)
  ctx.beginPath()
  ctx.moveTo(-pCarW / 2, pCarH * 0.4)
  ctx.lineTo(-pCarW / 2, -pCarH * 0.05)
  ctx.lineTo(-pCarW * 0.3, -pCarH * 0.05)
  ctx.lineTo(-pCarW * 0.22, -pCarH * 0.5)
  ctx.lineTo(pCarW * 0.22, -pCarH * 0.5)
  ctx.lineTo(pCarW * 0.3, -pCarH * 0.05)
  ctx.lineTo(pCarW / 2, -pCarH * 0.05)
  ctx.lineTo(pCarW / 2, pCarH * 0.4)
  ctx.closePath()
  ctx.fill()

  // Windshield
  ctx.fillStyle = "rgba(100,200,255,0.3)"
  ctx.beginPath()
  ctx.moveTo(-pCarW * 0.22, -pCarH * 0.05)
  ctx.lineTo(-pCarW * 0.16, -pCarH * 0.42)
  ctx.lineTo(pCarW * 0.16, -pCarH * 0.42)
  ctx.lineTo(pCarW * 0.22, -pCarH * 0.05)
  ctx.fill()

  // Wheels
  ctx.shadowBlur = 0
  ctx.fillStyle = "#1a1a1a"
  ctx.fillRect(-pCarW / 2 - 5, pCarH * 0.05, 8, pCarH * 0.32)
  ctx.fillRect(pCarW / 2 - 3, pCarH * 0.05, 8, pCarH * 0.32)
  // Hubcaps
  ctx.fillStyle = "#444"
  ctx.fillRect(-pCarW / 2 - 4, pCarH * 0.12, 6, pCarH * 0.1)
  ctx.fillRect(pCarW / 2 - 2, pCarH * 0.12, 6, pCarH * 0.1)

  // Accent stripes
  ctx.fillStyle = "#ff2e63"
  ctx.fillRect(-pCarW / 2, pCarH * 0.3, pCarW, pCarH * 0.05)

  ctx.restore()

  // Particles
  for (const p of state.particles) {
    const alpha = p.life / p.maxLife
    ctx.globalAlpha = alpha
    ctx.fillStyle = p.color
    const px = cw / 2 + p.x * cw * 0.3
    const py = ch * p.y
    ctx.fillRect(px - p.size, py - p.size, p.size * 2, p.size * 2)
  }
  ctx.globalAlpha = 1

  // HUD
  ctx.textAlign = "left"
  ctx.fillStyle = "#fff"
  ctx.font = `bold ${18 * dpr}px monospace`
  ctx.shadowColor = "#4cf1ff"
  ctx.shadowBlur = 8
  ctx.fillText(`${Math.floor(state.speed)} KPH`, 16 * dpr, 32 * dpr)

  ctx.font = `${14 * dpr}px monospace`
  ctx.fillStyle = "#ffd93d"
  ctx.shadowColor = "#ffd93d"
  ctx.fillText(`Score: ${Math.floor(state.score)}`, 16 * dpr, 52 * dpr)
  ctx.shadowBlur = 0

  ctx.fillStyle = "#8a8aad"
  ctx.fillText(`LAP ${state.lap}`, 16 * dpr, 72 * dpr)

  // Timer
  const timerColor = state.checkpointTimer > 10 ? "#3ce67a" : state.checkpointTimer > 5 ? "#ffd93d" : "#ff2e63"
  ctx.textAlign = "center"
  ctx.fillStyle = timerColor
  ctx.font = `bold ${22 * dpr}px monospace`
  ctx.shadowColor = timerColor
  ctx.shadowBlur = state.checkpointTimer < 5 ? 15 : 6
  ctx.fillText(`${Math.ceil(state.checkpointTimer)}`, cw / 2, 32 * dpr)
  ctx.shadowBlur = 0

  // Speed bar
  ctx.textAlign = "right"
  ctx.fillStyle = "#8a8aad"
  ctx.font = `${10 * dpr}px monospace`
  ctx.fillText("SPD", cw - 16 * dpr, 22 * dpr)
  const spdPct = state.speed / state.maxSpeed
  const barW = 80 * dpr
  const barH = 8 * dpr
  ctx.fillStyle = "#0a0a14"
  ctx.fillRect(cw - 16 * dpr - barW, 28 * dpr, barW, barH)
  ctx.fillStyle = spdPct > 0.8 ? "#ff2e63" : spdPct > 0.5 ? "#ffd93d" : "#3ce67a"
  ctx.fillRect(cw - 16 * dpr - barW, 28 * dpr, barW * spdPct, barH)

  // Game over
  if (state.gameOver) {
    ctx.fillStyle = "rgba(10,10,20,0.75)"
    ctx.fillRect(0, 0, cw, ch)

    ctx.textAlign = "center"
    ctx.fillStyle = "#ff2e63"
    ctx.font = `bold ${28 * dpr}px monospace`
    ctx.shadowColor = "#ff2e63"
    ctx.shadowBlur = 15
    ctx.fillText("TIME'S UP!", cw / 2, ch / 2 - 40 * dpr)

    ctx.shadowBlur = 0
    ctx.fillStyle = "#ffd93d"
    ctx.font = `${16 * dpr}px monospace`
    ctx.fillText(`Score: ${Math.floor(state.score)}`, cw / 2, ch / 2)
    ctx.fillStyle = "#4cf1ff"
    ctx.fillText(`Laps: ${state.lap - 1}`, cw / 2, ch / 2 + 25 * dpr)

    ctx.fillStyle = "#4cf1ff"
    ctx.font = `bold ${16 * dpr}px monospace`
    ctx.fillText("TAP TO CONTINUE", cw / 2, ch / 2 + 70 * dpr)
  }
}
