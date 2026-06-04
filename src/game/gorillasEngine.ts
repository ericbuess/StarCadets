export interface Building {
  x: number
  w: number
  h: number
  color: string
  windows: { x: number; y: number; lit: boolean }[]
  damage: boolean[][]
}

export interface Gorilla {
  x: number
  y: number
  alive: boolean
  wins: number
  isAI: boolean
}

export interface Banana {
  x: number
  y: number
  vx: number
  vy: number
  active: boolean
  rotation: number
  trail: { x: number; y: number }[]
}

export interface Explosion {
  x: number
  y: number
  radius: number
  timer: number
  maxTimer: number
}

export interface GorillasState {
  buildings: Building[]
  gorillas: [Gorilla, Gorilla]
  banana: Banana
  wind: number
  turn: 0 | 1
  angle: number
  power: number
  phase: "aiming" | "flying" | "exploding" | "roundOver" | "gameOver"
  roundWinner: 0 | 1 | -1
  explosion: Explosion | null
  roundsToWin: number
  gravity: number
  W: number
  H: number
  time: number
  aiThinking: boolean
  aiTimer: number
  score: number
}

const BUILDING_COLORS = ["#2d4a7a", "#4a2d6a", "#3a5a3a", "#6a4a2a", "#5a2a4a", "#2a5a6a"]
const WINDOW_COLOR_LIT = "#ffd93d"
const WINDOW_COLOR_OFF = "#1a1a2e"

function randomBuildings(W: number, H: number): Building[] {
  const buildings: Building[] = []
  let cx = 0
  while (cx < W) {
    const w = 40 + Math.random() * 50
    const h = 80 + Math.random() * (H * 0.45)
    const color = BUILDING_COLORS[Math.floor(Math.random() * BUILDING_COLORS.length)]
    const windows: Building["windows"] = []
    const cols = Math.floor((w - 8) / 12)
    const rows = Math.floor((h - 10) / 16)
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        windows.push({
          x: 6 + c * 12,
          y: 8 + r * 16,
          lit: Math.random() > 0.4,
        })
      }
    }
    const damageGrid: boolean[][] = []
    const dRows = Math.ceil(h / 4)
    const dCols = Math.ceil(w / 4)
    for (let r = 0; r < dRows; r++) {
      damageGrid.push(new Array(dCols).fill(false))
    }
    buildings.push({ x: cx, w, h, color, windows, damage: damageGrid })
    cx += w + 2
  }
  return buildings
}

function placeGorilla(buildings: Building[], side: "left" | "right", W: number): Gorilla {
  const range = side === "left"
    ? buildings.filter(b => b.x + b.w / 2 < W * 0.35)
    : buildings.filter(b => b.x + b.w / 2 > W * 0.65)
  const b = range.length > 0 ? range[Math.floor(Math.random() * range.length)] : buildings[side === "left" ? 0 : buildings.length - 1]
  return {
    x: b.x + b.w / 2,
    y: b.h,
    alive: true,
    wins: 0,
    isAI: side === "right",
  }
}

export function initGorillas(W: number, H: number): GorillasState {
  const buildings = randomBuildings(W, H)
  const g0 = placeGorilla(buildings, "left", W)
  const g1 = placeGorilla(buildings, "right", W)
  g0.isAI = false
  g1.isAI = true
  return {
    buildings,
    gorillas: [g0, g1],
    banana: { x: 0, y: 0, vx: 0, vy: 0, active: false, rotation: 0, trail: [] },
    wind: (Math.random() - 0.5) * 60,
    turn: 0,
    angle: 45,
    power: 50,
    phase: "aiming",
    roundWinner: -1,
    explosion: null,
    roundsToWin: 3,
    gravity: 200,
    W,
    H,
    time: 0,
    aiThinking: false,
    aiTimer: 0,
    score: 0,
  }
}

export function launchBanana(state: GorillasState): void {
  const g = state.gorillas[state.turn]
  const angleRad = (state.turn === 0)
    ? (state.angle * Math.PI) / 180
    : ((180 - state.angle) * Math.PI) / 180
  const speed = state.power * 4
  state.banana = {
    x: g.x,
    y: g.y + 10,
    vx: Math.cos(angleRad) * speed,
    vy: Math.sin(angleRad) * speed,
    active: true,
    rotation: 0,
    trail: [],
  }
  state.phase = "flying"
}

function applyExplosion(state: GorillasState, ex: number, ey: number, radius: number): void {
  for (const b of state.buildings) {
    const bTop = state.H - b.h
    for (let r = 0; r < b.damage.length; r++) {
      for (let c = 0; c < b.damage[r].length; c++) {
        const px = b.x + c * 4 + 2
        const py = bTop + r * 4 + 2
        const dx = px - ex
        const dy = py - ey
        if (dx * dx + dy * dy < radius * radius) {
          b.damage[r][c] = true
        }
      }
    }
  }
}

function checkGorillaHit(state: GorillasState, bx: number, by: number): number {
  for (let i = 0; i < 2; i++) {
    const g = state.gorillas[i]
    const gScreenY = state.H - g.y - 10
    const dx = bx - g.x
    const dy = by - gScreenY
    if (Math.abs(dx) < 16 && Math.abs(dy) < 20) return i
  }
  return -1
}

function checkBuildingHit(state: GorillasState, bx: number, by: number): boolean {
  for (const b of state.buildings) {
    if (bx >= b.x && bx <= b.x + b.w) {
      const bTop = state.H - b.h
      if (by >= bTop) {
        const row = Math.floor((by - bTop) / 4)
        const col = Math.floor((bx - b.x) / 4)
        if (row >= 0 && row < b.damage.length && col >= 0 && col < b.damage[0].length) {
          if (!b.damage[row][col]) return true
        }
      }
    }
  }
  return false
}

export function aiCalculateShot(state: GorillasState): { angle: number; power: number } {
  const ai = state.gorillas[1]
  const target = state.gorillas[0]
  const dx = target.x - ai.x
  const dy = (target.y - ai.y)
  const dist = Math.sqrt(dx * dx + dy * dy)
  const baseAngle = Math.atan2(dist * 0.4 + dy, Math.abs(dx)) * (180 / Math.PI)
  const basePower = Math.min(95, Math.max(30, dist / 4 + Math.abs(state.wind) * 0.3))
  const angle = Math.max(10, Math.min(80, baseAngle + (Math.random() - 0.5) * 20))
  const power = Math.max(20, Math.min(95, basePower + (Math.random() - 0.5) * 20))
  return { angle, power }
}

export function newRound(state: GorillasState): void {
  const W = state.W
  const H = state.H
  state.buildings = randomBuildings(W, H)
  const g0 = placeGorilla(state.buildings, "left", W)
  const g1 = placeGorilla(state.buildings, "right", W)
  g0.wins = state.gorillas[0].wins
  g1.wins = state.gorillas[1].wins
  g0.isAI = false
  g1.isAI = true
  state.gorillas = [g0, g1]
  state.wind = (Math.random() - 0.5) * 60
  state.turn = state.roundWinner === -1 ? 0 : (state.roundWinner === 0 ? 1 : 0)
  state.angle = 45
  state.power = 50
  state.phase = "aiming"
  state.roundWinner = -1
  state.explosion = null
  state.banana.active = false
  state.aiThinking = false
  state.aiTimer = 0
}

export function updateGorillas(state: GorillasState, dt: number): void {
  state.time += dt

  if (state.phase === "exploding" && state.explosion) {
    state.explosion.timer -= dt
    if (state.explosion.timer <= 0) {
      if (state.roundWinner >= 0) {
        const w = state.roundWinner as 0 | 1
        state.gorillas[w].wins++
        if (state.gorillas[w].wins >= state.roundsToWin) {
          state.phase = "gameOver"
          state.score = state.gorillas[0].wins * 100
        } else {
          state.phase = "roundOver"
        }
      } else {
        state.turn = state.turn === 0 ? 1 : 0
        state.phase = "aiming"
        state.angle = 45
        state.power = 50
        state.aiThinking = false
        state.aiTimer = 0
      }
    }
    return
  }

  if (state.phase === "aiming" && state.gorillas[state.turn].isAI) {
    if (!state.aiThinking) {
      state.aiThinking = true
      state.aiTimer = 1.2 + Math.random() * 0.8
      const shot = aiCalculateShot(state)
      state.angle = shot.angle
      state.power = shot.power
    }
    state.aiTimer -= dt
    if (state.aiTimer <= 0) {
      launchBanana(state)
    }
    return
  }

  if (state.phase !== "flying" || !state.banana.active) return

  const b = state.banana
  b.vy -= state.gravity * dt
  b.vx += state.wind * dt * 0.5
  b.x += b.vx * dt
  b.y += b.vy * dt
  b.rotation += dt * 8

  b.trail.push({ x: b.x, y: state.H - b.y })
  if (b.trail.length > 40) b.trail.shift()

  const screenX = b.x
  const screenY = state.H - b.y

  if (screenY > state.H || screenX < -50 || screenX > state.W + 50) {
    b.active = false
    state.turn = state.turn === 0 ? 1 : 0
    state.phase = "aiming"
    state.angle = 45
    state.power = 50
    state.aiThinking = false
    state.aiTimer = 0
    return
  }

  const hitGorilla = checkGorillaHit(state, screenX, screenY)
  if (hitGorilla >= 0 && hitGorilla !== state.turn) {
    b.active = false
    state.roundWinner = state.turn as 0 | 1
    state.explosion = { x: screenX, y: screenY, radius: 30, timer: 1.0, maxTimer: 1.0 }
    applyExplosion(state, screenX, screenY, 30)
    state.phase = "exploding"
    return
  }

  if (checkBuildingHit(state, screenX, screenY) || screenY >= state.H - 2) {
    b.active = false
    state.explosion = { x: screenX, y: screenY, radius: 22, timer: 0.8, maxTimer: 0.8 }
    applyExplosion(state, screenX, screenY, 22)
    state.phase = "exploding"
    return
  }
}

export function renderGorillas(ctx: CanvasRenderingContext2D, state: GorillasState, W: number, H: number): void {
  const scaleX = W / state.W
  const scaleY = H / state.H

  ctx.save()
  ctx.scale(scaleX, scaleY)

  // Sky gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, state.H)
  skyGrad.addColorStop(0, "#0a0a2e")
  skyGrad.addColorStop(0.5, "#1a1040")
  skyGrad.addColorStop(1, "#2a1a50")
  ctx.fillStyle = skyGrad
  ctx.fillRect(0, 0, state.W, state.H)

  // Stars
  ctx.fillStyle = "#fff"
  for (let i = 0; i < 30; i++) {
    const sx = (i * 137 + 50) % state.W
    const sy = (i * 89 + 20) % (state.H * 0.4)
    ctx.globalAlpha = 0.3 + (i % 5) * 0.15
    ctx.fillRect(sx, sy, 2, 2)
  }
  ctx.globalAlpha = 1

  // Buildings
  for (const b of state.buildings) {
    const bTop = state.H - b.h
    ctx.fillStyle = b.color
    ctx.fillRect(b.x, bTop, b.w, b.h)

    // Draw damage (holes)
    for (let r = 0; r < b.damage.length; r++) {
      for (let c = 0; c < b.damage[r].length; c++) {
        if (b.damage[r][c]) {
          ctx.fillStyle = "#0a0a2e"
          ctx.fillRect(b.x + c * 4, bTop + r * 4, 4, 4)
        }
      }
    }

    // Windows
    for (const win of b.windows) {
      const wy = bTop + win.y
      const wx = b.x + win.x
      const row = Math.floor(win.y / 4)
      const col = Math.floor(win.x / 4)
      const damaged = row < b.damage.length && col < b.damage[0]?.length && b.damage[row][col]
      if (!damaged) {
        ctx.fillStyle = win.lit ? WINDOW_COLOR_LIT : WINDOW_COLOR_OFF
        ctx.fillRect(wx, wy, 8, 10)
      }
    }
  }

  // Gorillas
  for (let i = 0; i < 2; i++) {
    const g = state.gorillas[i]
    const gx = g.x
    const gy = state.H - g.y
    ctx.fillStyle = "#8B4513"
    // Body
    ctx.fillRect(gx - 10, gy - 20, 20, 20)
    // Head
    ctx.fillRect(gx - 8, gy - 32, 16, 14)
    // Eyes
    ctx.fillStyle = "#fff"
    ctx.fillRect(gx - 5, gy - 28, 4, 4)
    ctx.fillRect(gx + 1, gy - 28, 4, 4)
    ctx.fillStyle = "#000"
    ctx.fillRect(gx - 4, gy - 27, 2, 2)
    ctx.fillRect(gx + 2, gy - 27, 2, 2)
    // Arms
    ctx.fillStyle = "#8B4513"
    ctx.fillRect(gx - 16, gy - 18, 6, 14)
    ctx.fillRect(gx + 10, gy - 18, 6, 14)
    // Legs
    ctx.fillRect(gx - 8, gy, 7, 8)
    ctx.fillRect(gx + 1, gy, 7, 8)

    // Turn indicator
    if (state.phase === "aiming" && state.turn === i) {
      ctx.fillStyle = "#ffd93d"
      ctx.fillRect(gx - 3, gy - 40, 6, 4)
      ctx.fillRect(gx - 1, gy - 36, 2, 2)
    }
  }

  // Banana trail
  if (state.banana.trail.length > 1) {
    ctx.strokeStyle = "#ffd93d40"
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(state.banana.trail[0].x, state.banana.trail[0].y)
    for (let i = 1; i < state.banana.trail.length; i++) {
      ctx.lineTo(state.banana.trail[i].x, state.banana.trail[i].y)
    }
    ctx.stroke()
  }

  // Banana
  if (state.banana.active) {
    const bx = state.banana.x
    const by = state.H - state.banana.y
    ctx.save()
    ctx.translate(bx, by)
    ctx.rotate(state.banana.rotation)
    ctx.fillStyle = "#ffd93d"
    ctx.beginPath()
    ctx.arc(0, 0, 5, 0, Math.PI, false)
    ctx.fill()
    ctx.fillStyle = "#ffaa00"
    ctx.fillRect(-2, -1, 4, 2)
    ctx.restore()
  }

  // Explosion
  if (state.explosion) {
    const e = state.explosion
    const progress = 1 - e.timer / e.maxTimer
    const r = e.radius * (0.5 + progress * 0.5)
    ctx.globalAlpha = 1 - progress
    const grad = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, r)
    grad.addColorStop(0, "#ffd93d")
    grad.addColorStop(0.4, "#ff7a1f")
    grad.addColorStop(0.8, "#ff2e63")
    grad.addColorStop(1, "transparent")
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.arc(e.x, e.y, r, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = 1
  }

  // Wind indicator
  ctx.fillStyle = "#4cf1ff"
  ctx.font = "12px 'VT323', monospace"
  ctx.textAlign = "center"
  const windStr = state.wind > 0 ? `WIND >>> ${Math.abs(state.wind).toFixed(0)}` : state.wind < 0 ? `${Math.abs(state.wind).toFixed(0)} <<< WIND` : "WIND: CALM"
  ctx.fillText(windStr, state.W / 2, 20)

  // Score
  ctx.font = "bold 14px 'VT323', monospace"
  ctx.fillStyle = "#3ce67a"
  ctx.textAlign = "left"
  ctx.fillText(`P1: ${state.gorillas[0].wins}`, 10, 40)
  ctx.textAlign = "right"
  ctx.fillStyle = "#ff2e63"
  ctx.fillText(`AI: ${state.gorillas[1].wins}`, state.W - 10, 40)

  ctx.restore()
}
