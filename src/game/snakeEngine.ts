// Classic Snake — grid-based snake game with arcade styling

export type Direction = "up" | "down" | "left" | "right"

interface SnakeSegment {
  x: number
  y: number
}

export interface SnakeState {
  snake: SnakeSegment[]
  direction: Direction
  nextDirection: Direction
  food: { x: number; y: number }
  gridW: number
  gridH: number
  score: number
  foodEaten: number
  gameOver: boolean
  paused: boolean
  time: number
  moveTimer: number
  moveInterval: number // seconds between moves
  growing: boolean
  particles: SnakeParticle[]
}

interface SnakeParticle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  color: string
  size: number
}

const BASE_INTERVAL = 0.15 // seconds
const MIN_INTERVAL = 0.055
const SPEED_DECREASE = 0.004 // interval decrease per food eaten

function randomFood(gridW: number, gridH: number, snake: SnakeSegment[]): { x: number; y: number } {
  let x: number, y: number
  let attempts = 0
  do {
    x = Math.floor(Math.random() * gridW)
    y = Math.floor(Math.random() * gridH)
    attempts++
  } while (snake.some(s => s.x === x && s.y === y) && attempts < 500)
  return { x, y }
}

export function initSnake(gridW = 20, gridH = 20): SnakeState {
  const cx = Math.floor(gridW / 2)
  const cy = Math.floor(gridH / 2)
  const snake: SnakeSegment[] = [
    { x: cx, y: cy },
    { x: cx - 1, y: cy },
    { x: cx - 2, y: cy },
  ]
  return {
    snake,
    direction: "right",
    nextDirection: "right",
    food: randomFood(gridW, gridH, snake),
    gridW, gridH,
    score: 0,
    foodEaten: 0,
    gameOver: false,
    paused: false,
    time: 0,
    moveTimer: 0,
    moveInterval: BASE_INTERVAL,
    growing: false,
    particles: [],
  }
}

export function changeDirection(state: SnakeState, dir: Direction): void {
  const opposites: Record<Direction, Direction> = {
    up: "down", down: "up", left: "right", right: "left"
  }
  if (dir !== opposites[state.direction]) {
    state.nextDirection = dir
  }
}

function spawnFoodParticles(x: number, y: number): SnakeParticle[] {
  const particles: SnakeParticle[] = []
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI * 2 * i) / 8 + Math.random() * 0.5
    particles.push({
      x, y,
      vx: Math.cos(angle) * (2 + Math.random() * 3),
      vy: Math.sin(angle) * (2 + Math.random() * 3),
      life: 0.6 + Math.random() * 0.3,
      maxLife: 0.6 + Math.random() * 0.3,
      color: Math.random() > 0.5 ? "#00ff88" : "#4cf1ff",
      size: 2 + Math.random() * 2,
    })
  }
  return particles
}

export function updateSnake(state: SnakeState, dt: number): SnakeState {
  if (state.gameOver || state.paused) return state
  dt = Math.min(dt, 0.1)
  state.time += dt

  // Update particles
  for (let i = state.particles.length - 1; i >= 0; i--) {
    const p = state.particles[i]
    p.x += p.vx * dt
    p.y += p.vy * dt
    p.life -= dt
    if (p.life <= 0) state.particles.splice(i, 1)
  }

  state.moveTimer += dt
  if (state.moveTimer < state.moveInterval) return state
  state.moveTimer -= state.moveInterval

  // Apply direction
  state.direction = state.nextDirection

  // Calculate new head position
  const head = state.snake[0]
  let nx = head.x
  let ny = head.y

  switch (state.direction) {
    case "up": ny--; break
    case "down": ny++; break
    case "left": nx--; break
    case "right": nx++; break
  }

  // Wall collision
  if (nx < 0 || nx >= state.gridW || ny < 0 || ny >= state.gridH) {
    state.gameOver = true
    return state
  }

  // Self collision
  if (state.snake.some(s => s.x === nx && s.y === ny)) {
    state.gameOver = true
    return state
  }

  // Move snake
  state.snake.unshift({ x: nx, y: ny })

  // Check food
  if (nx === state.food.x && ny === state.food.y) {
    state.foodEaten++
    // Score multiplier increases with length
    const multiplier = 1 + Math.floor(state.foodEaten / 5) * 0.5
    state.score += Math.round(10 * multiplier)
    state.growing = true
    // Speed up
    state.moveInterval = Math.max(MIN_INTERVAL, BASE_INTERVAL - state.foodEaten * SPEED_DECREASE)
    // Particles
    state.particles.push(...spawnFoodParticles(nx, ny))
    // New food
    state.food = randomFood(state.gridW, state.gridH, state.snake)
  }

  if (!state.growing) {
    state.snake.pop()
  } else {
    state.growing = false
  }

  return state
}

export function renderSnake(ctx: CanvasRenderingContext2D, state: SnakeState, w: number, h: number) {
  const dpr = window.devicePixelRatio || 1
  ctx.save()
  ctx.scale(dpr, dpr)
  const cw = w / dpr
  const ch = h / dpr

  // Background
  ctx.fillStyle = "#0a0a14"
  ctx.fillRect(0, 0, cw, ch)

  // Calculate cell size and offsets
  const hudH = 28
  const padding = 4
  const cs = Math.min((cw - padding * 2) / state.gridW, (ch - hudH - padding * 2) / state.gridH)
  const ox = (cw - cs * state.gridW) / 2
  const oy = hudH + (ch - hudH - cs * state.gridH) / 2

  // Draw grid lines (subtle)
  ctx.strokeStyle = "rgba(76, 241, 255, 0.06)"
  ctx.lineWidth = 0.5
  for (let x = 0; x <= state.gridW; x++) {
    ctx.beginPath()
    ctx.moveTo(ox + x * cs, oy)
    ctx.lineTo(ox + x * cs, oy + state.gridH * cs)
    ctx.stroke()
  }
  for (let y = 0; y <= state.gridH; y++) {
    ctx.beginPath()
    ctx.moveTo(ox, oy + y * cs)
    ctx.lineTo(ox + state.gridW * cs, oy + y * cs)
    ctx.stroke()
  }

  // Draw border
  ctx.strokeStyle = "#4cf1ff40"
  ctx.lineWidth = 2
  ctx.strokeRect(ox - 1, oy - 1, state.gridW * cs + 2, state.gridH * cs + 2)

  // Draw food (pulsing)
  const pulse = 0.7 + 0.3 * Math.sin(state.time * 6)
  const fx = ox + state.food.x * cs + cs / 2
  const fy = oy + state.food.y * cs + cs / 2
  ctx.shadowColor = "#ff2e63"
  ctx.shadowBlur = 12 * pulse
  ctx.fillStyle = "#ff2e63"
  ctx.beginPath()
  ctx.arc(fx, fy, cs * 0.35 * pulse, 0, Math.PI * 2)
  ctx.fill()
  // Inner glow
  ctx.fillStyle = "#ffaacc"
  ctx.beginPath()
  ctx.arc(fx, fy, cs * 0.15, 0, Math.PI * 2)
  ctx.fill()
  ctx.shadowBlur = 0

  // Draw particles
  for (const p of state.particles) {
    const alpha = p.life / p.maxLife
    ctx.globalAlpha = alpha
    ctx.fillStyle = p.color
    ctx.shadowColor = p.color
    ctx.shadowBlur = 4
    const px = ox + p.x * cs + cs / 2
    const py = oy + p.y * cs + cs / 2
    ctx.fillRect(px - p.size / 2, py - p.size / 2, p.size, p.size)
  }
  ctx.globalAlpha = 1
  ctx.shadowBlur = 0

  // Draw snake
  for (let i = state.snake.length - 1; i >= 0; i--) {
    const seg = state.snake[i]
    const sx = ox + seg.x * cs
    const sy = oy + seg.y * cs
    const t = i / Math.max(1, state.snake.length - 1) // 0 = head, 1 = tail

    if (i === 0) {
      // Head — brightest
      ctx.shadowColor = "#00ff88"
      ctx.shadowBlur = 10
      ctx.fillStyle = "#00ff88"
      ctx.fillRect(sx + 1, sy + 1, cs - 2, cs - 2)
      // Eyes
      ctx.shadowBlur = 0
      ctx.fillStyle = "#0a0a14"
      const eyeR = cs * 0.12
      let ex1: number, ey1: number, ex2: number, ey2: number
      switch (state.direction) {
        case "right":
          ex1 = sx + cs * 0.65; ey1 = sy + cs * 0.3
          ex2 = sx + cs * 0.65; ey2 = sy + cs * 0.7
          break
        case "left":
          ex1 = sx + cs * 0.35; ey1 = sy + cs * 0.3
          ex2 = sx + cs * 0.35; ey2 = sy + cs * 0.7
          break
        case "up":
          ex1 = sx + cs * 0.3; ey1 = sy + cs * 0.35
          ex2 = sx + cs * 0.7; ey2 = sy + cs * 0.35
          break
        case "down":
        default:
          ex1 = sx + cs * 0.3; ey1 = sy + cs * 0.65
          ex2 = sx + cs * 0.7; ey2 = sy + cs * 0.65
          break
      }
      ctx.beginPath()
      ctx.arc(ex1, ey1, eyeR, 0, Math.PI * 2)
      ctx.arc(ex2, ey2, eyeR, 0, Math.PI * 2)
      ctx.fill()
    } else {
      // Body — gradient from green to teal
      const g = Math.round(255 - t * 100)
      const b = Math.round(136 + t * 80)
      ctx.fillStyle = `rgb(0, ${g}, ${b})`
      ctx.shadowColor = `rgb(0, ${g}, ${b})`
      ctx.shadowBlur = 4
      const inset = 1.5 + t * 0.5
      ctx.fillRect(sx + inset, sy + inset, cs - inset * 2, cs - inset * 2)
    }
  }
  ctx.shadowBlur = 0

  // HUD
  const fontSize = Math.max(10, Math.min(14, cs * 0.7))
  ctx.fillStyle = "#4cf1ff"
  ctx.font = `bold ${fontSize}px 'Press Start 2P', monospace`
  ctx.textAlign = "left"
  ctx.fillText(`SCORE ${state.score}`, ox, hudH - 8)
  ctx.textAlign = "right"
  ctx.font = `${fontSize}px 'VT323', monospace`
  ctx.fillText(`LENGTH ${state.snake.length}  SPEED ${Math.round((1 / state.moveInterval) * 10) / 10}/s`, ox + cs * state.gridW, hudH - 8)
  ctx.textAlign = "left"

  // Game over overlay
  if (state.gameOver) {
    ctx.fillStyle = "rgba(0,0,0,0.75)"
    ctx.fillRect(0, 0, cw, ch)
    ctx.fillStyle = "#ff2e63"
    ctx.shadowColor = "#ff2e63"
    ctx.shadowBlur = 20
    ctx.font = `bold ${Math.max(18, cs * 1.5)}px 'Press Start 2P', monospace`
    ctx.textAlign = "center"
    ctx.fillText("GAME OVER", cw / 2, ch / 2 - 20)
    ctx.shadowBlur = 0
    ctx.fillStyle = "#4cf1ff"
    ctx.font = `${Math.max(14, cs * 1)}px 'Press Start 2P', monospace`
    ctx.fillText(`SCORE: ${state.score}`, cw / 2, ch / 2 + 12)
    ctx.fillStyle = "#00ff88"
    ctx.font = `${Math.max(12, cs * 0.8)}px 'VT323', monospace`
    ctx.fillText(`LENGTH: ${state.snake.length}`, cw / 2, ch / 2 + 36)
    // Blink prompt
    ctx.fillStyle = `rgba(76, 241, 255, ${0.5 + 0.5 * Math.sin(state.time * 4)})`
    ctx.font = `${Math.max(10, cs * 0.6)}px 'Press Start 2P', monospace`
    ctx.fillText("TAP TO CONTINUE", cw / 2, ch / 2 + 64)
    ctx.textAlign = "left"
  }

  ctx.restore()
}
