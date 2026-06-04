// Snake Arena — snake.io style game with AI snakes, dots, boost, minimap

export interface Vec2 { x: number; y: number }

interface ArenaSnakeSegment { x: number; y: number }

export interface ArenaSnake {
  id: number
  segments: ArenaSnakeSegment[]
  direction: number // radians
  targetDirection: number
  speed: number
  baseSpeed: number
  boosting: boolean
  boostEnergy: number
  alive: boolean
  color: string
  name: string
  score: number
  turnRate: number
}

interface ArenaDot {
  x: number
  y: number
  color: string
  size: number
  value: number
}

interface ArenaParticle {
  x: number; y: number
  vx: number; vy: number
  life: number; maxLife: number
  color: string; size: number
}

export interface ArenaState {
  player: ArenaSnake
  aiSnakes: ArenaSnake[]
  dots: ArenaDot[]
  particles: ArenaParticle[]
  arenaSize: number
  time: number
  gameOver: boolean
  paused: boolean
  camera: Vec2
  moveTimer: number
}

const ARENA_SIZE = 100
const DOT_COUNT = 300
const AI_COUNT = 5
const SEGMENT_SPACING = 0.4
const BASE_SPEED = 8
const BOOST_SPEED = 14
const BOOST_DRAIN = 6 // energy/sec
const BOOST_REGEN = 2 // energy/sec (when not boosting)
const MAX_BOOST_ENERGY = 100
const TURN_SPEED = 4.5 // radians/sec
const HEAD_RADIUS = 0.5
const BODY_RADIUS = 0.35

const AI_NAMES = ["ALPHA", "BRAVO", "CHARLIE", "DELTA", "ECHO", "FOXTROT"]
const SNAKE_COLORS = ["#ff2e63", "#ffd93d", "#b83dff", "#ff8800", "#00f0ff", "#3ce67a"]

function randomPos(margin = 5): Vec2 {
  return {
    x: margin + Math.random() * (ARENA_SIZE - margin * 2),
    y: margin + Math.random() * (ARENA_SIZE - margin * 2),
  }
}

function randomDot(): ArenaDot {
  const pos = randomPos(2)
  const colors = ["#ff2e63", "#ffd93d", "#4cf1ff", "#3ce67a", "#b83dff", "#ff8800"]
  return {
    x: pos.x, y: pos.y,
    color: colors[Math.floor(Math.random() * colors.length)],
    size: 0.15 + Math.random() * 0.15,
    value: 1,
  }
}

function createSnake(id: number, isPlayer: boolean): ArenaSnake {
  const pos = randomPos(10)
  const dir = Math.random() * Math.PI * 2
  const startLen = isPlayer ? 10 : 8 + Math.floor(Math.random() * 6)
  const segments: ArenaSnakeSegment[] = []
  for (let i = 0; i < startLen; i++) {
    segments.push({
      x: pos.x - Math.cos(dir) * i * SEGMENT_SPACING,
      y: pos.y - Math.sin(dir) * i * SEGMENT_SPACING,
    })
  }
  return {
    id,
    segments,
    direction: dir,
    targetDirection: dir,
    speed: BASE_SPEED,
    baseSpeed: BASE_SPEED,
    boosting: false,
    boostEnergy: MAX_BOOST_ENERGY,
    alive: true,
    color: isPlayer ? "#00ff88" : SNAKE_COLORS[id % SNAKE_COLORS.length],
    name: isPlayer ? "YOU" : AI_NAMES[id % AI_NAMES.length],
    score: startLen,
    turnRate: TURN_SPEED,
  }
}

export function initArena(): ArenaState {
  const player = createSnake(0, true)
  const aiSnakes: ArenaSnake[] = []
  for (let i = 0; i < AI_COUNT; i++) {
    aiSnakes.push(createSnake(i + 1, false))
  }
  const dots: ArenaDot[] = []
  for (let i = 0; i < DOT_COUNT; i++) {
    dots.push(randomDot())
  }
  return {
    player,
    aiSnakes,
    dots,
    particles: [],
    arenaSize: ARENA_SIZE,
    time: 0,
    gameOver: false,
    paused: false,
    camera: { x: player.segments[0].x, y: player.segments[0].y },
    moveTimer: 0,
  }
}

function angleDiff(a: number, b: number): number {
  let d = b - a
  while (d > Math.PI) d -= Math.PI * 2
  while (d < -Math.PI) d += Math.PI * 2
  return d
}

function dist(a: Vec2, b: Vec2): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)
}

function moveSnake(snake: ArenaSnake, dt: number) {
  if (!snake.alive) return

  // Smooth turn toward target direction
  const diff = angleDiff(snake.direction, snake.targetDirection)
  const maxTurn = snake.turnRate * dt
  if (Math.abs(diff) < maxTurn) {
    snake.direction = snake.targetDirection
  } else {
    snake.direction += Math.sign(diff) * maxTurn
  }

  // Boost
  if (snake.boosting && snake.boostEnergy > 0 && snake.segments.length > 5) {
    snake.speed = BOOST_SPEED
    snake.boostEnergy -= BOOST_DRAIN * dt
    if (snake.boostEnergy <= 0) {
      snake.boostEnergy = 0
      snake.boosting = false
    }
    // Shrink slowly while boosting
    if (Math.random() < dt * 3 && snake.segments.length > 5) {
      snake.segments.pop()
      snake.score = Math.max(0, snake.score - 0.5)
    }
  } else {
    snake.speed = snake.baseSpeed
    if (!snake.boosting && snake.boostEnergy < MAX_BOOST_ENERGY) {
      snake.boostEnergy = Math.min(MAX_BOOST_ENERGY, snake.boostEnergy + BOOST_REGEN * dt)
    }
  }

  // Move head
  const head = snake.segments[0]
  const moveD = snake.speed * dt
  head.x += Math.cos(snake.direction) * moveD
  head.y += Math.sin(snake.direction) * moveD

  // Clamp to arena
  head.x = Math.max(0.5, Math.min(ARENA_SIZE - 0.5, head.x))
  head.y = Math.max(0.5, Math.min(ARENA_SIZE - 0.5, head.y))

  // Move body segments to follow
  for (let i = 1; i < snake.segments.length; i++) {
    const prev = snake.segments[i - 1]
    const seg = snake.segments[i]
    const dx = seg.x - prev.x
    const dy = seg.y - prev.y
    const d = Math.sqrt(dx * dx + dy * dy)
    if (d > SEGMENT_SPACING) {
      const ratio = SEGMENT_SPACING / d
      seg.x = prev.x + dx * ratio
      seg.y = prev.y + dy * ratio
    }
  }
}

function growSnake(snake: ArenaSnake, amount: number) {
  const tail = snake.segments[snake.segments.length - 1]
  const prev = snake.segments.length >= 2 ? snake.segments[snake.segments.length - 2] : tail
  for (let i = 0; i < amount; i++) {
    const dx = tail.x - prev.x
    const dy = tail.y - prev.y
    const d = Math.sqrt(dx * dx + dy * dy) || 1
    snake.segments.push({
      x: tail.x + (dx / d) * SEGMENT_SPACING,
      y: tail.y + (dy / d) * SEGMENT_SPACING,
    })
  }
  snake.score += amount
}

function killSnake(snake: ArenaSnake, dots: ArenaDot[], particles: ArenaParticle[]) {
  snake.alive = false
  // Drop dots from body
  for (let i = 0; i < snake.segments.length; i += 2) {
    const seg = snake.segments[i]
    dots.push({
      x: seg.x + (Math.random() - 0.5) * 0.5,
      y: seg.y + (Math.random() - 0.5) * 0.5,
      color: snake.color,
      size: 0.2,
      value: 2,
    })
  }
  // Death particles
  for (let i = 0; i < 12; i++) {
    const angle = Math.random() * Math.PI * 2
    const head = snake.segments[0]
    particles.push({
      x: head.x, y: head.y,
      vx: Math.cos(angle) * (3 + Math.random() * 5),
      vy: Math.sin(angle) * (3 + Math.random() * 5),
      life: 0.5 + Math.random() * 0.5,
      maxLife: 1,
      color: snake.color,
      size: 0.2 + Math.random() * 0.2,
    })
  }
}

function updateAI(ai: ArenaSnake, player: ArenaSnake, allSnakes: ArenaSnake[], dots: ArenaDot[], _time: number) {
  if (!ai.alive) return

  const head = ai.segments[0]

  // Find nearest dot
  let nearestDot: ArenaDot | null = null
  let nearestDotDist = Infinity
  for (const dot of dots) {
    const d = dist(head, dot)
    if (d < nearestDotDist) {
      nearestDotDist = d
      nearestDot = dot
    }
  }

  // Find nearest danger (other snake heads/bodies)
  let dangerDir: number | null = null
  let dangerDist = Infinity
  const allActive = [player, ...allSnakes].filter(s => s.alive && s.id !== ai.id)
  for (const other of allActive) {
    for (let i = 0; i < other.segments.length; i++) {
      const seg = other.segments[i]
      const d = dist(head, seg)
      if (d < 3 && d < dangerDist) {
        dangerDist = d
        dangerDir = Math.atan2(head.y - seg.y, head.x - seg.x) // away from danger
      }
    }
  }

  // Check wall proximity
  const wallMargin = 3
  let wallDir: number | null = null
  if (head.x < wallMargin) wallDir = 0 // push right
  else if (head.x > ARENA_SIZE - wallMargin) wallDir = Math.PI
  if (head.y < wallMargin) wallDir = Math.PI / 2
  else if (head.y > ARENA_SIZE - wallMargin) wallDir = -Math.PI / 2

  // Prioritize: wall avoidance > danger avoidance > food seeking
  if (wallDir !== null) {
    ai.targetDirection = wallDir
  } else if (dangerDir !== null && dangerDist < 2) {
    ai.targetDirection = dangerDir
    ai.boosting = dangerDist < 1.5
  } else if (nearestDot && nearestDotDist < 15) {
    ai.targetDirection = Math.atan2(nearestDot.y - head.y, nearestDot.x - head.x)
    ai.boosting = false
  } else {
    // Wander
    ai.targetDirection += (Math.random() - 0.5) * 0.5
    ai.boosting = false
  }
}

function checkSnakeCollision(snake: ArenaSnake, other: ArenaSnake): boolean {
  if (!snake.alive || !other.alive) return false
  const head = snake.segments[0]
  // Check head vs other's body (skip other's head)
  for (let i = 1; i < other.segments.length; i++) {
    const seg = other.segments[i]
    const d = dist(head, seg)
    if (d < HEAD_RADIUS + BODY_RADIUS) return true
  }
  return false
}

export function updateArena(state: ArenaState, dt: number, inputDir: number | null, boosting: boolean): ArenaState {
  if (state.gameOver || state.paused) return state
  dt = Math.min(dt, 0.05)
  state.time += dt

  // Update particles
  for (let i = state.particles.length - 1; i >= 0; i--) {
    const p = state.particles[i]
    p.x += p.vx * dt
    p.y += p.vy * dt
    p.vx *= 0.95
    p.vy *= 0.95
    p.life -= dt
    if (p.life <= 0) state.particles.splice(i, 1)
  }

  // Player input
  if (state.player.alive && inputDir !== null) {
    state.player.targetDirection = inputDir
  }
  state.player.boosting = boosting && state.player.alive

  // Move player
  moveSnake(state.player, dt)

  // Update AI
  for (const ai of state.aiSnakes) {
    updateAI(ai, state.player, state.aiSnakes, state.dots, state.time)
    moveSnake(ai, dt)
  }

  // All active snakes
  const allSnakes = [state.player, ...state.aiSnakes]

  // Eat dots
  for (const snake of allSnakes) {
    if (!snake.alive) continue
    const head = snake.segments[0]
    for (let i = state.dots.length - 1; i >= 0; i--) {
      const dot = state.dots[i]
      if (dist(head, dot) < HEAD_RADIUS + dot.size + 0.2) {
        growSnake(snake, dot.value)
        state.dots.splice(i, 1)
      }
    }
  }

  // Replenish dots
  while (state.dots.length < DOT_COUNT) {
    state.dots.push(randomDot())
  }

  // Check collisions — snake head vs other snakes' bodies (no self-collision, snake.io style)
  for (const snake of allSnakes) {
    if (!snake.alive) continue
    for (const other of allSnakes) {
      if (!other.alive || snake.id === other.id) continue
      if (checkSnakeCollision(snake, other)) {
        killSnake(snake, state.dots, state.particles)
      }
    }
  }

  // Player dead = game over
  if (!state.player.alive) {
    state.gameOver = true
  }

  // Respawn dead AI
  for (let i = 0; i < state.aiSnakes.length; i++) {
    if (!state.aiSnakes[i].alive) {
      state.aiSnakes[i] = createSnake(i + 1, false)
    }
  }

  // Camera follows player smoothly
  if (state.player.alive) {
    const head = state.player.segments[0]
    state.camera.x += (head.x - state.camera.x) * Math.min(1, 6 * dt)
    state.camera.y += (head.y - state.camera.y) * Math.min(1, 6 * dt)
  }

  return state
}

export function renderArena(ctx: CanvasRenderingContext2D, state: ArenaState, w: number, h: number) {
  const dpr = window.devicePixelRatio || 1
  ctx.save()
  ctx.scale(dpr, dpr)
  const cw = w / dpr
  const ch = h / dpr

  // Background
  ctx.fillStyle = "#0a0a14"
  ctx.fillRect(0, 0, cw, ch)

  // Viewport scale: how many arena units visible
  const viewRange = 25
  const scale = Math.min(cw, ch) / viewRange
  const camX = state.camera.x
  const camY = state.camera.y

  function toScreen(ax: number, ay: number): [number, number] {
    return [
      cw / 2 + (ax - camX) * scale,
      ch / 2 + (ay - camY) * scale,
    ]
  }

  // Draw arena boundary grid
  ctx.save()
  ctx.strokeStyle = "rgba(76, 241, 255, 0.08)"
  ctx.lineWidth = 1
  const gridStep = 5
  for (let gx = 0; gx <= ARENA_SIZE; gx += gridStep) {
    const [sx1, sy1] = toScreen(gx, 0)
    const [sx2, sy2] = toScreen(gx, ARENA_SIZE)
    ctx.beginPath(); ctx.moveTo(sx1, sy1); ctx.lineTo(sx2, sy2); ctx.stroke()
  }
  for (let gy = 0; gy <= ARENA_SIZE; gy += gridStep) {
    const [sx1, sy1] = toScreen(0, gy)
    const [sx2, sy2] = toScreen(ARENA_SIZE, gy)
    ctx.beginPath(); ctx.moveTo(sx1, sy1); ctx.lineTo(sx2, sy2); ctx.stroke()
  }
  ctx.restore()

  // Draw arena border
  const [bx1, by1] = toScreen(0, 0)
  const [bx2, by2] = toScreen(ARENA_SIZE, ARENA_SIZE)
  ctx.strokeStyle = "#ff2e6360"
  ctx.lineWidth = 3
  ctx.shadowColor = "#ff2e63"
  ctx.shadowBlur = 10
  ctx.strokeRect(bx1, by1, bx2 - bx1, by2 - by1)
  ctx.shadowBlur = 0

  // Draw dots
  for (const dot of state.dots) {
    const [dx, dy] = toScreen(dot.x, dot.y)
    if (dx < -20 || dx > cw + 20 || dy < -20 || dy > ch + 20) continue
    const pulse = 0.7 + 0.3 * Math.sin(state.time * 3 + dot.x * 0.5)
    ctx.fillStyle = dot.color
    ctx.globalAlpha = 0.8 * pulse
    ctx.beginPath()
    ctx.arc(dx, dy, dot.size * scale * pulse, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1

  // Draw particles
  for (const p of state.particles) {
    const [px, py] = toScreen(p.x, p.y)
    if (px < -20 || px > cw + 20 || py < -20 || py > ch + 20) continue
    ctx.globalAlpha = p.life / p.maxLife
    ctx.fillStyle = p.color
    ctx.beginPath()
    ctx.arc(px, py, p.size * scale, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1

  // Draw snakes
  const allSnakes = [state.player, ...state.aiSnakes]
  for (const snake of allSnakes) {
    if (!snake.alive) continue
    drawSnake(ctx, snake, toScreen, scale, state.time)
  }

  // Minimap
  drawMinimap(ctx, state, cw, ch)

  // Leaderboard
  drawLeaderboard(ctx, state, cw)

  // Boost meter (player)
  if (state.player.alive) {
    drawBoostMeter(ctx, state.player, cw, ch)
  }

  // Score display
  if (state.player.alive) {
    ctx.fillStyle = "#4cf1ff"
    ctx.font = "bold 14px 'Press Start 2P', monospace"
    ctx.textAlign = "left"
    ctx.fillText(`SCORE ${Math.floor(state.player.score)}`, 12, 22)
    ctx.font = "18px 'VT323', monospace"
    ctx.fillStyle = "#8a8aad"
    ctx.fillText(`LENGTH ${state.player.segments.length}`, 12, 40)
  }

  // Game over overlay
  if (state.gameOver) {
    ctx.fillStyle = "rgba(0,0,0,0.75)"
    ctx.fillRect(0, 0, cw, ch)

    ctx.fillStyle = "#ff2e63"
    ctx.shadowColor = "#ff2e63"
    ctx.shadowBlur = 20
    ctx.font = "bold 22px 'Press Start 2P', monospace"
    ctx.textAlign = "center"
    ctx.fillText("GAME OVER", cw / 2, ch / 2 - 30)
    ctx.shadowBlur = 0

    ctx.fillStyle = "#4cf1ff"
    ctx.font = "16px 'Press Start 2P', monospace"
    ctx.fillText(`SCORE: ${Math.floor(state.player.score)}`, cw / 2, ch / 2 + 4)

    ctx.fillStyle = "#00ff88"
    ctx.font = "20px 'VT323', monospace"
    ctx.fillText(`MAX LENGTH: ${state.player.segments.length}`, cw / 2, ch / 2 + 30)

    ctx.fillStyle = `rgba(76, 241, 255, ${0.5 + 0.5 * Math.sin(state.time * 4)})`
    ctx.font = "10px 'Press Start 2P', monospace"
    ctx.fillText("TAP TO CONTINUE", cw / 2, ch / 2 + 60)
    ctx.textAlign = "left"
  }

  ctx.restore()
}

function drawSnake(
  ctx: CanvasRenderingContext2D,
  snake: ArenaSnake,
  toScreen: (x: number, y: number) => [number, number],
  scale: number,
  _time: number,
) {
  const segs = snake.segments

  // Draw body from tail to head
  for (let i = segs.length - 1; i >= 1; i--) {
    const [sx, sy] = toScreen(segs[i].x, segs[i].y)
    const t = i / segs.length
    const radius = BODY_RADIUS * scale * (0.6 + 0.4 * (1 - t))

    // Fade body color toward darker
    ctx.globalAlpha = 0.6 + 0.4 * (1 - t)
    ctx.fillStyle = snake.color
    ctx.beginPath()
    ctx.arc(sx, sy, radius, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1

  // Draw head
  const [hx, hy] = toScreen(segs[0].x, segs[0].y)
  const headR = HEAD_RADIUS * scale

  // Glow effect
  if (snake.boosting) {
    ctx.shadowColor = snake.color
    ctx.shadowBlur = 15
  }
  ctx.fillStyle = snake.color
  ctx.beginPath()
  ctx.arc(hx, hy, headR, 0, Math.PI * 2)
  ctx.fill()
  ctx.shadowBlur = 0

  // Eyes
  const eyeOff = headR * 0.35
  const eyeR = headR * 0.25
  const ex1 = hx + Math.cos(snake.direction - 0.5) * eyeOff
  const ey1 = hy + Math.sin(snake.direction - 0.5) * eyeOff
  const ex2 = hx + Math.cos(snake.direction + 0.5) * eyeOff
  const ey2 = hy + Math.sin(snake.direction + 0.5) * eyeOff
  ctx.fillStyle = "#fff"
  ctx.beginPath()
  ctx.arc(ex1, ey1, eyeR, 0, Math.PI * 2)
  ctx.arc(ex2, ey2, eyeR, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = "#0a0a14"
  ctx.beginPath()
  ctx.arc(ex1 + Math.cos(snake.direction) * eyeR * 0.3, ey1 + Math.sin(snake.direction) * eyeR * 0.3, eyeR * 0.5, 0, Math.PI * 2)
  ctx.arc(ex2 + Math.cos(snake.direction) * eyeR * 0.3, ey2 + Math.sin(snake.direction) * eyeR * 0.3, eyeR * 0.5, 0, Math.PI * 2)
  ctx.fill()

  // Name tag
  ctx.fillStyle = snake.color
  ctx.font = "bold 10px 'Press Start 2P', monospace"
  ctx.textAlign = "center"
  ctx.globalAlpha = 0.8
  ctx.fillText(snake.name, hx, hy - headR - 6)
  // Length below name
  ctx.font = "14px 'VT323', monospace"
  ctx.fillStyle = "#fff"
  ctx.fillText(String(snake.segments.length), hx, hy - headR - 16)
  ctx.globalAlpha = 1
  ctx.textAlign = "left"

  // Boost trail
  if (snake.boosting) {
    for (let i = 1; i < Math.min(6, segs.length); i++) {
      const [tx, ty] = toScreen(segs[i].x, segs[i].y)
      ctx.globalAlpha = 0.3 * (1 - i / 6)
      ctx.fillStyle = "#fff"
      ctx.beginPath()
      ctx.arc(tx, ty, BODY_RADIUS * scale * 0.5, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1
  }
}

function drawMinimap(ctx: CanvasRenderingContext2D, state: ArenaState, cw: number, ch: number) {
  const mmSize = Math.min(100, cw * 0.2)
  const mmX = cw - mmSize - 10
  const mmY = ch - mmSize - 10
  const mmScale = mmSize / ARENA_SIZE

  // Background
  ctx.fillStyle = "rgba(10, 10, 20, 0.8)"
  ctx.fillRect(mmX, mmY, mmSize, mmSize)
  ctx.strokeStyle = "#4cf1ff40"
  ctx.lineWidth = 1
  ctx.strokeRect(mmX, mmY, mmSize, mmSize)

  // Snakes
  const allSnakes = [state.player, ...state.aiSnakes]
  for (const snake of allSnakes) {
    if (!snake.alive) continue
    const head = snake.segments[0]
    const sx = mmX + head.x * mmScale
    const sy = mmY + head.y * mmScale
    ctx.fillStyle = snake.color
    ctx.beginPath()
    ctx.arc(sx, sy, snake.id === 0 ? 3 : 2, 0, Math.PI * 2)
    ctx.fill()
  }

  // Camera viewport
  const viewRange = 25
  const halfView = viewRange / 2
  ctx.strokeStyle = "#ffffff40"
  ctx.lineWidth = 0.5
  ctx.strokeRect(
    mmX + (state.camera.x - halfView) * mmScale,
    mmY + (state.camera.y - halfView) * mmScale,
    viewRange * mmScale,
    viewRange * mmScale,
  )
}

function drawLeaderboard(ctx: CanvasRenderingContext2D, state: ArenaState, cw: number) {
  const allSnakes = [state.player, ...state.aiSnakes].filter(s => s.alive)
  allSnakes.sort((a, b) => b.segments.length - a.segments.length)

  const top = allSnakes.slice(0, 5)
  const lbX = cw - 10
  const lbY = 14

  ctx.textAlign = "right"
  ctx.font = "bold 7px 'Press Start 2P', monospace"
  ctx.fillStyle = "#8a8aad"
  ctx.fillText("LEADERBOARD", lbX, lbY)

  for (let i = 0; i < top.length; i++) {
    const s = top[i]
    const y = lbY + 16 + i * 16
    ctx.fillStyle = s.color
    ctx.font = "bold 7px 'Press Start 2P', monospace"
    ctx.fillText(`${s.name} ${s.segments.length}`, lbX, y)
  }
  ctx.textAlign = "left"
}

function drawBoostMeter(ctx: CanvasRenderingContext2D, player: ArenaSnake, cw: number, ch: number) {
  const mW = 120
  const mH = 8
  const mX = (cw - mW) / 2
  const mY = ch - 24

  // Background
  ctx.fillStyle = "rgba(10, 10, 20, 0.7)"
  ctx.fillRect(mX - 2, mY - 2, mW + 4, mH + 4)
  ctx.strokeStyle = "#4cf1ff40"
  ctx.lineWidth = 1
  ctx.strokeRect(mX - 2, mY - 2, mW + 4, mH + 4)

  // Fill
  const pct = player.boostEnergy / MAX_BOOST_ENERGY
  const barColor = player.boosting ? "#ffd93d" : "#4cf1ff"
  ctx.fillStyle = `${barColor}40`
  ctx.fillRect(mX, mY, mW, mH)
  ctx.fillStyle = barColor
  ctx.fillRect(mX, mY, mW * pct, mH)

  // Label
  ctx.fillStyle = "#8a8aad"
  ctx.font = "7px 'Press Start 2P', monospace"
  ctx.textAlign = "center"
  ctx.fillText("BOOST", cw / 2, mY - 4)
  ctx.textAlign = "left"
}
