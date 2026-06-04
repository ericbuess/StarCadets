export interface SurferState {
  lane: number // 0=left, 1=center, 2=right
  targetLane: number
  laneX: number // smooth horizontal position
  y: number // vertical position for jump
  vy: number // vertical velocity
  jumping: boolean
  ducking: boolean
  distance: number
  score: number
  speed: number // current forward speed
  baseSpeed: number
  time: number
  gameOver: boolean
  paused: boolean
  obstacles: SurferObstacle[]
  coins: SurferCoin[]
  particles: SurferParticle[]
  spawnTimer: number
  coinTimer: number
  crashTimer: number
  combo: number
  comboTimer: number
  invincible: boolean
  invincibleTimer: number
  magnetActive: boolean
  magnetTimer: number
  level: number
}

export interface SurferObstacle {
  lane: number
  z: number // distance ahead
  type: "barrier" | "train" | "low" // low = must jump, others = dodge
  width: number
  height: number
}

export interface SurferCoin {
  lane: number
  z: number
  y: number // height offset for floating coins
  collected: boolean
}

export interface SurferParticle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  color: string
  size: number
}

export type SurferInput = {
  left: boolean
  right: boolean
  up: boolean
  down: boolean
}

const LANE_WIDTH = 80
const LANES = [-LANE_WIDTH, 0, LANE_WIDTH]
const GROUND_Y = 0
const JUMP_VEL = -520
const GRAVITY = 1400
const LANE_SWITCH_SPEED = 600
const BASE_SPEED = 300
const MAX_SPEED = 700
const SPEED_INCREASE = 8

export function createSurferState(): SurferState {
  return {
    lane: 1,
    targetLane: 1,
    laneX: 0,
    y: GROUND_Y,
    vy: 0,
    jumping: false,
    ducking: false,
    distance: 0,
    score: 0,
    speed: BASE_SPEED,
    baseSpeed: BASE_SPEED,
    time: 0,
    gameOver: false,
    paused: false,
    obstacles: [],
    coins: [],
    particles: [],
    spawnTimer: 0,
    coinTimer: 0,
    crashTimer: 0,
    combo: 0,
    comboTimer: 0,
    invincible: false,
    invincibleTimer: 0,
    magnetActive: false,
    magnetTimer: 0,
    level: 1,
  }
}

export function updateSurfer(state: SurferState, dt: number, input: SurferInput): SurferState {
  if (state.paused || state.gameOver) return state
  state.time += dt

  // Lane switching
  if (input.left && state.targetLane > 0) {
    state.targetLane--
    input.left = false
  }
  if (input.right && state.targetLane < 2) {
    state.targetLane++
    input.right = false
  }

  // Jump
  if (input.up && !state.jumping) {
    state.jumping = true
    state.vy = JUMP_VEL
    state.ducking = false
    input.up = false
  }

  // Duck
  state.ducking = input.down && !state.jumping

  // Smooth lane movement
  const targetX = LANES[state.targetLane]
  const dx = targetX - state.laneX
  if (Math.abs(dx) < 2) {
    state.laneX = targetX
    state.lane = state.targetLane
  } else {
    state.laneX += Math.sign(dx) * LANE_SWITCH_SPEED * dt
  }

  // Vertical physics
  if (state.jumping) {
    state.vy += GRAVITY * dt
    state.y += state.vy * dt
    if (state.y >= GROUND_Y) {
      state.y = GROUND_Y
      state.vy = 0
      state.jumping = false
    }
  }

  // Speed increases over time
  state.speed = Math.min(MAX_SPEED, state.baseSpeed + state.distance * 0.02)
  state.distance += state.speed * dt
  state.score += state.speed * dt * 0.1

  // Level up every 500m
  const newLevel = Math.floor(state.distance / 500) + 1
  if (newLevel > state.level) {
    state.level = newLevel
    state.baseSpeed = Math.min(MAX_SPEED - 100, BASE_SPEED + newLevel * SPEED_INCREASE)
  }

  // Timers
  if (state.comboTimer > 0) {
    state.comboTimer -= dt
    if (state.comboTimer <= 0) state.combo = 0
  }
  if (state.invincibleTimer > 0) {
    state.invincibleTimer -= dt
    if (state.invincibleTimer <= 0) state.invincible = false
  }
  if (state.magnetTimer > 0) {
    state.magnetTimer -= dt
    if (state.magnetTimer <= 0) state.magnetActive = false
  }

  // Spawn obstacles
  state.spawnTimer -= dt
  if (state.spawnTimer <= 0) {
    const spawnInterval = Math.max(0.6, 1.8 - state.level * 0.08)
    state.spawnTimer = spawnInterval + Math.random() * 0.5

    const lane = Math.floor(Math.random() * 3)
    const roll = Math.random()
    let type: SurferObstacle["type"] = "barrier"
    if (roll < 0.3) type = "low"
    else if (roll < 0.5) type = "train"

    state.obstacles.push({
      lane,
      z: 1200,
      type,
      width: type === "train" ? 60 : 50,
      height: type === "low" ? 25 : type === "train" ? 100 : 60,
    })

    // Sometimes spawn in adjacent lane too
    if (Math.random() < 0.3 && state.level > 2) {
      const otherLane = (lane + (Math.random() < 0.5 ? 1 : 2)) % 3
      state.obstacles.push({
        lane: otherLane,
        z: 1200,
        type: Math.random() < 0.4 ? "low" : "barrier",
        width: 50,
        height: Math.random() < 0.4 ? 25 : 60,
      })
    }
  }

  // Spawn coins
  state.coinTimer -= dt
  if (state.coinTimer <= 0) {
    state.coinTimer = 0.3 + Math.random() * 0.4
    const coinLane = Math.floor(Math.random() * 3)
    const coinY = Math.random() < 0.3 ? -40 : 0
    state.coins.push({ lane: coinLane, z: 1200, y: coinY, collected: false })
  }

  // Move obstacles toward player
  state.obstacles = state.obstacles.filter(o => {
    o.z -= state.speed * dt
    if (o.z < -100) return false

    // Collision check
    if (o.z > -20 && o.z < 40) {
      const playerLane = state.lane
      const playerX = state.laneX
      const obsX = LANES[o.lane]
      const xDist = Math.abs(playerX - obsX)

      if (xDist < 50) {
        const canDuck = o.type === "barrier" && state.ducking
        const canJump = o.type === "low" && state.y < -30
        if (!canDuck && !canJump && !state.invincible && playerLane === o.lane) {
          state.gameOver = true
          emitCrashParticles(state, playerX, state.y)
        }
      }
    }
    return true
  })

  // Move and collect coins
  state.coins = state.coins.filter(c => {
    c.z -= state.speed * dt
    if (c.z < -50) return false
    if (c.collected) return false

    const coinX = LANES[c.lane]
    const playerX = state.laneX
    const dist = Math.abs(playerX - coinX) + Math.abs(c.z)
    const magnetRange = state.magnetActive ? 200 : 50

    if (dist < magnetRange && c.z > -20 && c.z < 60) {
      if (state.magnetActive && dist < 200) {
        c.lane = state.targetLane
        c.z = Math.max(0, c.z - state.speed * dt * 2)
      }
      if (dist < 50) {
        c.collected = true
        state.score += 10 * (state.combo + 1)
        state.combo++
        state.comboTimer = 2
        emitCoinParticles(state, coinX, c.y)
      }
    }
    return true
  })

  // Update particles
  state.particles = state.particles.filter(p => {
    p.x += p.vx * dt
    p.y += p.vy * dt
    p.vy += 400 * dt
    p.life -= dt
    return p.life > 0
  })

  return state
}

function emitCrashParticles(state: SurferState, x: number, y: number) {
  for (let i = 0; i < 20; i++) {
    state.particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 300,
      vy: -Math.random() * 400,
      life: 1, maxLife: 1,
      color: ["#ff4400", "#ff8800", "#ffcc00"][Math.floor(Math.random() * 3)],
      size: 3 + Math.random() * 4,
    })
  }
}

function emitCoinParticles(state: SurferState, x: number, y: number) {
  for (let i = 0; i < 5; i++) {
    state.particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 100,
      vy: -Math.random() * 150,
      life: 0.5, maxLife: 0.5,
      color: "#ffd93d",
      size: 2 + Math.random() * 2,
    })
  }
}

function projectZ(z: number, ch: number, vanishY: number): { y: number; scale: number } {
  const maxDist = 1200
  const t = Math.max(0, Math.min(1, z / maxDist))
  const y = ch - (ch - vanishY) * t
  const scale = Math.max(0.02, 1 - t * 0.95)
  return { y, scale }
}

export function renderSurfer(
  ctx: CanvasRenderingContext2D,
  state: SurferState,
  cw: number,
  ch: number
) {
  const dpr = window.devicePixelRatio || 1
  const cx = cw / 2
  const vanishY = ch * 0.35
  const trackBottomW = cw * 0.85
  const laneW = trackBottomW / 3

  // Sky
  const skyGrad = ctx.createLinearGradient(0, 0, 0, vanishY)
  skyGrad.addColorStop(0, "#050510")
  skyGrad.addColorStop(1, "#0d0825")
  ctx.fillStyle = skyGrad
  ctx.fillRect(0, 0, cw, ch)

  // Stars
  for (let i = 0; i < 50; i++) {
    const sx = (42 * (i + 1) * 7919) % cw
    const sy = (42 * (i + 1) * 104729) % (vanishY * 0.9)
    ctx.fillStyle = `rgba(255,255,255,${0.15 + (i % 5) * 0.1})`
    ctx.fillRect(sx, sy, 1.5 * dpr, 1.5 * dpr)
  }

  // Cityscape with perspective
  const buildingColors = ["#0e0e22", "#12122a", "#0a0a1e"]
  const buildScroll = (state.distance * 0.3) % (cw * 2)
  for (let i = 0; i < 20; i++) {
    const bw = 30 + (i * 37) % 50
    const bh = 40 + (i * 67) % 140
    let bx = ((i * 97 + 20) % (cw + 200)) - 100 - buildScroll
    bx = ((bx % (cw + 200)) + cw + 200) % (cw + 200) - 100
    const by = vanishY - bh * 0.3
    ctx.fillStyle = buildingColors[i % 3]
    ctx.fillRect(bx, by, bw, bh)
    ctx.fillStyle = `rgba(76,241,255,${0.08 + (i % 3) * 0.04})`
    for (let wy = 8; wy < bh - 10; wy += 14) {
      for (let wx = 4; wx < bw - 4; wx += 10) {
        if ((i * 31 + wy * 7 + wx * 13) % 5 > 1) ctx.fillRect(bx + wx, by + wy, 5, 7)
      }
    }
  }

  // Ground plane
  const groundGrad = ctx.createLinearGradient(0, vanishY, 0, ch)
  groundGrad.addColorStop(0, "#0d0d1e")
  groundGrad.addColorStop(1, "#1a1a2e")
  ctx.fillStyle = groundGrad
  ctx.fillRect(0, vanishY, cw, ch - vanishY)

  // Draw perspective track with scanlines
  const numLines = 60
  for (let i = numLines; i >= 0; i--) {
    const z = (i / numLines) * 1200
    const { y, scale } = projectZ(z, ch, vanishY)
    const nextZ = ((i + 1) / numLines) * 1200
    const next = projectZ(nextZ, ch, vanishY)
    const w = trackBottomW * scale
    const nw = trackBottomW * next.scale

    const stripe = Math.floor((state.distance + z) / 60) % 2
    ctx.fillStyle = stripe ? "#1e1e34" : "#22223a"
    ctx.beginPath()
    ctx.moveTo(cx - w / 2, y)
    ctx.lineTo(cx + w / 2, y)
    ctx.lineTo(cx + nw / 2, next.y)
    ctx.lineTo(cx - nw / 2, next.y)
    ctx.fill()
  }

  // Track edges (glowing rails)
  ctx.lineWidth = 3 * dpr
  ctx.strokeStyle = "#4cf1ff"
  ctx.shadowColor = "#4cf1ff"
  ctx.shadowBlur = 10
  for (const side of [-1, 1]) {
    ctx.beginPath()
    for (let i = 0; i <= 40; i++) {
      const z = (i / 40) * 1200
      const { y, scale } = projectZ(z, ch, vanishY)
      const x = cx + side * (trackBottomW * scale) / 2
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
  }
  ctx.shadowBlur = 0

  // Lane dividers (dashed)
  ctx.strokeStyle = "#4cf1ff25"
  ctx.lineWidth = 2 * dpr
  const dashLen = 40
  for (const laneDiv of [-1, 1]) {
    ctx.beginPath()
    for (let i = 0; i <= 80; i++) {
      const z = (i / 80) * 1200
      const segDist = (state.distance + z) % (dashLen * 2)
      if (segDist > dashLen) continue
      const { y, scale } = projectZ(z, ch, vanishY)
      const x = cx + laneDiv * (laneW * scale) / 2
      const nextI = Math.min(80, i + 1)
      const nz = (nextI / 80) * 1200
      const n = projectZ(nz, ch, vanishY)
      const nx = cx + laneDiv * (laneW * n.scale) / 2
      ctx.moveTo(x, y)
      ctx.lineTo(nx, n.y)
    }
    ctx.stroke()
  }

  // Sort drawables by z (far to near)
  const drawables: Array<{ z: number; draw: () => void }> = []

  // Obstacles
  for (const o of state.obstacles) {
    if (o.z < -50 || o.z > 1200) continue
    const oz = o.z
    drawables.push({ z: oz, draw: () => {
      const { y, scale } = projectZ(oz, ch, vanishY)
      const laneOffset = (o.lane - 1) * laneW * scale
      const ox = cx + laneOffset
      const ow = o.width * scale * 1.8
      const oh = o.height * scale * 1.8

      if (o.type === "train") {
        ctx.fillStyle = "#ff4444"
        ctx.shadowColor = "#ff4444"
        ctx.shadowBlur = 10 * scale
        ctx.fillRect(ox - ow / 2, y - oh, ow, oh)
        ctx.fillStyle = "#aa2222"
        ctx.fillRect(ox - ow / 2, y - oh, ow, oh * 0.25)
        ctx.fillStyle = "#ffcc00"
        ctx.fillRect(ox - ow * 0.2, y - oh + oh * 0.08, ow * 0.4, oh * 0.12)
        ctx.shadowBlur = 0
      } else if (o.type === "low") {
        const lowH = oh * 0.35
        ctx.fillStyle = "#ff8800"
        ctx.shadowColor = "#ff8800"
        ctx.shadowBlur = 8 * scale
        ctx.fillRect(ox - ow / 2, y - lowH, ow, lowH)
        ctx.fillStyle = "#cc6600"
        ctx.fillRect(ox - ow * 0.45, y - lowH, ow * 0.9, lowH * 0.3)
        ctx.shadowBlur = 0
      } else {
        ctx.fillStyle = "#b83dff"
        ctx.shadowColor = "#b83dff"
        ctx.shadowBlur = 10 * scale
        ctx.fillRect(ox - ow / 2, y - oh, ow, oh)
        ctx.fillStyle = "#8a20cc"
        ctx.fillRect(ox - ow / 2 + ow * 0.08, y - oh + oh * 0.08, ow * 0.84, oh * 0.35)
        ctx.fillStyle = "#ff2e6380"
        ctx.fillRect(ox - ow * 0.35, y - oh * 0.15, ow * 0.7, oh * 0.08)
        ctx.shadowBlur = 0
      }
    }})
  }

  // Coins
  for (const c of state.coins) {
    if (c.collected || c.z < -50 || c.z > 1200) continue
    const cz = c.z
    drawables.push({ z: cz, draw: () => {
      const { y, scale } = projectZ(cz, ch, vanishY)
      const laneOffset = (c.lane - 1) * laneW * scale
      const coinX = cx + laneOffset
      const coinY = y - 25 * scale + c.y * scale + Math.sin(state.time * 5 + cz) * 4 * scale
      const coinR = 10 * scale

      if (coinR < 1) return
      ctx.fillStyle = "#ffd93d"
      ctx.shadowColor = "#ffd93d"
      ctx.shadowBlur = 10 * scale
      ctx.beginPath()
      ctx.arc(coinX, coinY, coinR, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = "#ff8800"
      ctx.beginPath()
      ctx.arc(coinX, coinY, coinR * 0.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0
    }})
  }

  // Sort far to near, draw
  drawables.sort((a, b) => b.z - a.z)
  for (const d of drawables) d.draw()

  // Player at z=0
  const playerScale = 1.0
  const playerLaneOffset = state.laneX * (laneW / LANE_WIDTH) * playerScale
  const playerX = cx + playerLaneOffset
  const playerBaseY = ch - ch * 0.08
  const jumpOffset = state.y * playerScale * 1.5
  const playerY = playerBaseY + jumpOffset
  const pH = (state.ducking ? 35 : 65) * dpr * 0.6
  const pW = 45 * dpr * 0.6

  ctx.save()
  ctx.translate(playerX, playerY)

  if (state.invincible) {
    ctx.shadowColor = `hsl(${(state.time * 200) % 360}, 100%, 60%)`
    ctx.shadowBlur = 25
  }

  // Shadow on ground
  ctx.fillStyle = "rgba(0,0,0,0.3)"
  ctx.beginPath()
  ctx.ellipse(0, 0, pW * 0.7, pW * 0.2, 0, 0, Math.PI * 2)
  ctx.fill()

  // Body
  const bodyColor = state.invincible ? `hsl(${(state.time * 200) % 360}, 100%, 60%)` : "#4cf1ff"
  ctx.fillStyle = bodyColor
  ctx.beginPath()
  ctx.roundRect(-pW / 2, -pH, pW, pH, 6 * dpr)
  ctx.fill()

  // Visor
  ctx.fillStyle = "#0a0a14"
  ctx.fillRect(-pW * 0.38, -pH + pH * 0.12, pW * 0.76, pH * 0.2)
  ctx.fillStyle = "#3ce67a"
  ctx.fillRect(-pW * 0.32, -pH + pH * 0.15, pW * 0.64, pH * 0.13)

  // Jetpack
  ctx.fillStyle = "#ff2e63"
  ctx.fillRect(-pW / 2 - 5 * dpr, -pH + pH * 0.3, 5 * dpr, pH * 0.45)
  ctx.fillRect(pW / 2, -pH + pH * 0.3, 5 * dpr, pH * 0.45)

  // Belt
  ctx.fillStyle = "#ffd93d"
  ctx.fillRect(-pW / 2, -pH * 0.4, pW, pH * 0.06)

  ctx.shadowBlur = 0
  ctx.restore()

  // Particles (in screen space)
  for (const p of state.particles) {
    const alpha = p.life / p.maxLife
    ctx.globalAlpha = alpha
    ctx.fillStyle = p.color
    const px = cx + p.x * (laneW / LANE_WIDTH)
    const py = playerBaseY + p.y
    ctx.fillRect(px - p.size * dpr, py - p.size * dpr, p.size * 2 * dpr, p.size * 2 * dpr)
  }
  ctx.globalAlpha = 1

  // HUD
  ctx.fillStyle = "#ffffff"
  ctx.font = `bold ${18 * dpr}px monospace`
  ctx.textAlign = "left"
  ctx.shadowColor = "#4cf1ff"
  ctx.shadowBlur = 8
  ctx.fillText(`${Math.floor(state.distance)}m`, 16 * dpr, 32 * dpr)

  ctx.font = `${14 * dpr}px monospace`
  ctx.fillStyle = "#ffd93d"
  ctx.shadowColor = "#ffd93d"
  ctx.fillText(`${Math.floor(state.score)}`, 16 * dpr, 52 * dpr)
  ctx.shadowBlur = 0

  if (state.combo > 1) {
    ctx.fillStyle = "#3ce67a"
    ctx.font = `bold ${16 * dpr}px monospace`
    ctx.textAlign = "right"
    ctx.fillText(`x${state.combo}`, cw - 16 * dpr, 32 * dpr)
  }

  ctx.fillStyle = "#8a8aad"
  ctx.font = `${12 * dpr}px monospace`
  ctx.textAlign = "right"
  ctx.fillText(`LVL ${state.level}`, cw - 16 * dpr, 52 * dpr)

  // Game over
  if (state.gameOver) {
    ctx.fillStyle = "rgba(10,10,20,0.7)"
    ctx.fillRect(0, 0, cw, ch)

    ctx.textAlign = "center"
    ctx.fillStyle = "#ffffff"
    ctx.font = `bold ${28 * dpr}px monospace`
    ctx.shadowColor = "#ff2e63"
    ctx.shadowBlur = 15
    ctx.fillText("GAME OVER", cw / 2, ch / 2 - 30 * dpr)

    ctx.font = `${16 * dpr}px monospace`
    ctx.shadowBlur = 0
    ctx.fillStyle = "#ffd93d"
    ctx.fillText(`Score: ${Math.floor(state.score)}`, cw / 2, ch / 2 + 10 * dpr)
    ctx.fillStyle = "#4cf1ff"
    ctx.fillText(`Distance: ${Math.floor(state.distance)}m`, cw / 2, ch / 2 + 35 * dpr)

    ctx.fillStyle = "#4cf1ff"
    ctx.font = `bold ${16 * dpr}px monospace`
    ctx.fillText("TAP TO CONTINUE", cw / 2, ch / 2 + 75 * dpr)
  }
}
