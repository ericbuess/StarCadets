// Brick Breaker — classic breakout with neon glow and power-ups

export interface BrickBreakerState {
  paddle: { x: number; y: number; w: number; h: number }
  paddleColor: string
  balls: Ball[]
  bricks: Brick[]
  particles: BBParticle[]
  powerups: FallingPowerup[]
  score: number
  lives: number
  level: number
  combo: number
  comboTimer: number
  gameOver: boolean
  paused: boolean
  time: number
  timeBonus: number
  width: number
  height: number
}

interface Ball {
  x: number; y: number; vx: number; vy: number; radius: number; speed: number
}

interface Brick {
  x: number; y: number; w: number; h: number; color: string; alive: boolean; hasPowerup: boolean
}

interface BBParticle {
  x: number; y: number; vx: number; vy: number; life: number; maxLife: number; color: string
}

interface FallingPowerup {
  x: number; y: number; vy: number; type: "wide" | "multi" | "slow"
  collected: boolean
}

const NEON = ["#ff00ff", "#ff4488", "#ff8800", "#ffcc00", "#00ff88", "#00f0ff"]
const PW = 70, PH = 10, BR = 5, BASE_SPD = 220, B_ROWS = 5, B_COLS = 9, B_PAD = 4
const MIN_PAD_W = PW * 0.6 // paddle shrinks to 60% of original at most

function makeBall(w: number, h: number, speed: number): Ball {
  const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.8
  return {
    x: w / 2, y: h - 40,
    vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
    radius: BR, speed,
  }
}

function generateBricks(level: number, w: number): Brick[] {
  const rows = Math.min(B_ROWS + Math.floor(level / 2), 8), cols = B_COLS
  const bw = (w - B_PAD * (cols + 1)) / cols, bh = 14, bricks: Brick[] = []
  // Power-up chance decreases by 1% per level, minimum 4%
  const puChance = Math.max(0.04, 0.12 - (level - 1) * 0.01)
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) bricks.push({
    x: B_PAD + c * (bw + B_PAD), y: 30 + r * (bh + B_PAD), w: bw, h: bh,
    color: NEON[r % NEON.length], alive: true, hasPowerup: Math.random() < puChance,
  })
  return bricks
}

export function createBrickBreakerState(w = 600, h = 400): BrickBreakerState {
  const savedColor = typeof localStorage !== "undefined" ? localStorage.getItem("sc_paddle_color") : null
  return {
    paddle: { x: w / 2 - PW / 2, y: h - 22, w: PW, h: PH },
    paddleColor: savedColor || "#00f0ff",
    balls: [makeBall(w, h, BASE_SPD)],
    bricks: generateBricks(1, w),
    particles: [],
    powerups: [],
    score: 0, lives: 3, level: 1,
    combo: 0, comboTimer: 0,
    gameOver: false, paused: false,
    time: 0, timeBonus: 0,
    width: w, height: h,
  }
}

export function updateBrickBreaker(state: BrickBreakerState, dt: number, paddleX: number): void {
  if (state.paused || state.gameOver) return
  state.time += dt
  const { paddle, width: W, height: H } = state

  // Time-based speed bonus: +5 px/s every 30 seconds
  state.timeBonus = Math.floor(state.time / 30) * 5

  // Paddle shrinkage: every 45s shrink by 5%, minimum 60% of original
  const shrinkFactor = Math.pow(0.95, Math.floor(state.time / 45))
  const targetPadW = Math.max(MIN_PAD_W, PW * shrinkFactor)
  // Only shrink, don't override power-up widening unless we're smaller
  if (paddle.w > targetPadW) paddle.w = targetPadW

  // Move paddle (paddleX is 0-1 normalized)
  paddle.x = Math.max(0, Math.min(W - paddle.w, paddleX * W - paddle.w / 2))

  // Combo decay
  if (state.comboTimer > 0) { state.comboTimer -= dt; if (state.comboTimer <= 0) state.combo = 0 }

  // Update balls
  const deadBalls: number[] = []
  for (let bi = 0; bi < state.balls.length; bi++) {
    const b = state.balls[bi]
    b.x += b.vx * dt; b.y += b.vy * dt

    // Wall bounces
    if (b.x - b.radius < 0) { b.x = b.radius; b.vx = Math.abs(b.vx) }
    if (b.x + b.radius > W) { b.x = W - b.radius; b.vx = -Math.abs(b.vx) }
    if (b.y - b.radius < 0) { b.y = b.radius; b.vy = Math.abs(b.vy) }

    // Off bottom
    if (b.y > H + 10) { deadBalls.push(bi); continue }

    // Paddle collision
    if (b.vy > 0 && b.y + b.radius >= paddle.y && b.y + b.radius <= paddle.y + paddle.h + 4
      && b.x >= paddle.x && b.x <= paddle.x + paddle.w) {
      const hit = (b.x - paddle.x) / paddle.w  // 0..1
      const angle = -Math.PI / 2 + (hit - 0.5) * 1.2
      b.vx = Math.cos(angle) * b.speed; b.vy = Math.sin(angle) * b.speed
      b.y = paddle.y - b.radius
    }

    // Brick collision
    for (const br of state.bricks) {
      if (!br.alive) continue
      if (b.x + b.radius > br.x && b.x - b.radius < br.x + br.w
        && b.y + b.radius > br.y && b.y - b.radius < br.y + br.h) {
        br.alive = false
        // Reflect
        const overlapX = Math.min(b.x + b.radius - br.x, br.x + br.w - (b.x - b.radius))
        const overlapY = Math.min(b.y + b.radius - br.y, br.y + br.h - (b.y - b.radius))
        if (overlapX < overlapY) b.vx = -b.vx; else b.vy = -b.vy

        // Score with combo
        state.combo++; state.comboTimer = 1.5
        state.score += 10 * Math.min(state.combo, 5)

        // Speed up slightly (include time bonus, cap at 400)
        b.speed = Math.min(b.speed + 2, 400)
        const effectiveSpeed = Math.min(b.speed + state.timeBonus, 400)
        const sp = effectiveSpeed / Math.sqrt(b.vx * b.vx + b.vy * b.vy)
        b.vx *= sp; b.vy *= sp

        // Particles
        for (let i = 0; i < 6; i++) {
          const a = Math.random() * Math.PI * 2, spd = 40 + Math.random() * 80
          state.particles.push({
            x: br.x + br.w / 2, y: br.y + br.h / 2,
            vx: Math.cos(a) * spd, vy: Math.sin(a) * spd,
            life: 0.4 + Math.random() * 0.3, maxLife: 0.7, color: br.color,
          })
        }

        // Drop power-up
        if (br.hasPowerup) {
          const types: FallingPowerup["type"][] = ["wide", "multi", "slow"]
          state.powerups.push({
            x: br.x + br.w / 2, y: br.y + br.h,
            vy: 80, type: types[Math.floor(Math.random() * types.length)],
            collected: false,
          })
        }
        break // one brick per frame per ball
      }
    }
  }

  // Remove dead balls
  for (let i = deadBalls.length - 1; i >= 0; i--) state.balls.splice(deadBalls[i], 1)
  if (state.balls.length === 0) {
    state.lives--
    if (state.lives <= 0) { state.gameOver = true } else {
      const respawnSpeed = Math.min(BASE_SPD + state.level * 10 + state.timeBonus, 400)
      state.balls.push(makeBall(W, H, respawnSpeed))
      // Reset paddle width but still respect time-based shrinkage
      const shrinkF = Math.pow(0.95, Math.floor(state.time / 45))
      paddle.w = Math.max(MIN_PAD_W, PW * shrinkF)
    }
  }

  // Power-ups fall & collect
  for (const pu of state.powerups) {
    if (pu.collected) continue
    pu.y += pu.vy * dt
    if (pu.y > H) { pu.collected = true; continue }
    if (pu.y + 8 >= paddle.y && pu.x >= paddle.x && pu.x <= paddle.x + paddle.w) {
      pu.collected = true
      if (pu.type === "wide") paddle.w = Math.min(paddle.w + 30, 150)
      else if (pu.type === "multi") {
        const src = state.balls[0]
        if (src) {
          state.balls.push({ ...src, vx: src.vx + 40, vy: src.vy - 20, speed: src.speed })
          state.balls.push({ ...src, vx: src.vx - 40, vy: src.vy - 20, speed: src.speed })
        }
      } else if (pu.type === "slow") {
        for (const bl of state.balls) {
          bl.speed = Math.max(bl.speed * 0.7, 140)
          const sp = bl.speed / Math.sqrt(bl.vx * bl.vx + bl.vy * bl.vy)
          bl.vx *= sp; bl.vy *= sp
        }
      }
    }
  }
  state.powerups = state.powerups.filter(p => !p.collected && p.y <= H)

  // Particles
  state.particles = state.particles.filter(p => {
    p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; return p.life > 0
  })

  // Next level
  if (!state.gameOver && state.bricks.every(b => !b.alive)) {
    state.level++
    state.bricks = generateBricks(state.level, W)
    const lvlSpeed = Math.min(BASE_SPD + state.level * 10 + state.timeBonus, 400)
    state.balls = [makeBall(W, H, lvlSpeed)]
    // Reset paddle width but still respect time-based shrinkage
    const shrinkF = Math.pow(0.95, Math.floor(state.time / 45))
    paddle.w = Math.max(MIN_PAD_W, PW * shrinkF)
  }
}

export function renderBrickBreaker(
  ctx: CanvasRenderingContext2D, state: BrickBreakerState, w: number, h: number
): void {
  const dpr = window.devicePixelRatio || 1
  const sx = w / state.width, sy = h / state.height

  // Background
  ctx.fillStyle = "#0a0a1a"; ctx.fillRect(0, 0, w, h)

  // Stars
  for (let i = 0; i < 40; i++) {
    const x = ((i * 7919 + 42) % state.width) * sx
    const y = ((i * 104729 + 42) % state.height) * sy
    ctx.fillStyle = `rgba(255,255,255,${0.15 + (i % 5) * 0.06})`
    ctx.fillRect(x, y, 1.5 * dpr, 1.5 * dpr)
  }

  // Bricks
  for (const br of state.bricks) {
    if (!br.alive) continue
    ctx.fillStyle = br.color; ctx.shadowColor = br.color; ctx.shadowBlur = 6
    ctx.fillRect(br.x * sx, br.y * sy, br.w * sx - 1, br.h * sy - 1)
  }
  ctx.shadowBlur = 0

  // Paddle
  const { paddle } = state
  ctx.fillStyle = state.paddleColor; ctx.shadowColor = state.paddleColor; ctx.shadowBlur = 10
  const px = paddle.x * sx, py = paddle.y * sy, pw = paddle.w * sx, ph = paddle.h * sy
  const pr = 4 * Math.min(sx, sy)
  ctx.beginPath(); ctx.moveTo(px + pr, py); ctx.lineTo(px + pw - pr, py)
  ctx.quadraticCurveTo(px + pw, py, px + pw, py + pr); ctx.lineTo(px + pw, py + ph - pr)
  ctx.quadraticCurveTo(px + pw, py + ph, px + pw - pr, py + ph); ctx.lineTo(px + pr, py + ph)
  ctx.quadraticCurveTo(px, py + ph, px, py + ph - pr); ctx.lineTo(px, py + pr)
  ctx.quadraticCurveTo(px, py, px + pr, py); ctx.closePath()
  ctx.fill(); ctx.shadowBlur = 0

  // Balls
  for (const b of state.balls) {
    ctx.fillStyle = "#fff"; ctx.shadowColor = state.paddleColor; ctx.shadowBlur = 12
    ctx.beginPath(); ctx.arc(b.x * sx, b.y * sy, b.radius * Math.min(sx, sy), 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.shadowBlur = 0

  // Power-ups
  const puColors: Record<string, string> = { wide: "#00ff88", multi: "#ff00ff", slow: "#ffcc00" }
  for (const pu of state.powerups) {
    ctx.fillStyle = puColors[pu.type] || "#fff"; ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 6
    ctx.beginPath(); ctx.arc(pu.x * sx, pu.y * sy, 6 * Math.min(sx, sy), 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = "#000"; ctx.font = `bold ${8 * dpr}px monospace`; ctx.textAlign = "center"
    ctx.fillText(pu.type[0].toUpperCase(), pu.x * sx, pu.y * sy + 3 * dpr)
  }
  ctx.shadowBlur = 0

  // Particles
  for (const p of state.particles) {
    ctx.globalAlpha = p.life / p.maxLife; ctx.fillStyle = p.color
    ctx.fillRect(p.x * sx - 1.5, p.y * sy - 1.5, 3, 3)
  }
  ctx.globalAlpha = 1

  // HUD
  ctx.fillStyle = "#fff"; ctx.font = `bold ${16 * dpr}px monospace`; ctx.textAlign = "left"
  ctx.shadowColor = "#00f0ff"; ctx.shadowBlur = 6
  ctx.fillText(`${state.score}`, 15 * dpr, 20 * dpr); ctx.shadowBlur = 0
  ctx.font = `${12 * dpr}px monospace`; ctx.fillStyle = "#888"
  ctx.fillText(`LVL ${state.level}`, 15 * dpr, 38 * dpr)
  if (state.combo > 1) {
    ctx.fillStyle = "#ffcc00"; ctx.fillText(`x${state.combo}`, 15 * dpr, 54 * dpr)
  }

  // Lives
  ctx.fillStyle = state.paddleColor
  for (let i = 0; i < state.lives; i++) {
    ctx.beginPath()
    ctx.arc(w - 15 * dpr - i * 18 * dpr, 15 * dpr, 5 * dpr, 0, Math.PI * 2); ctx.fill()
  }

  // Game over overlay
  if (state.gameOver) {
    ctx.fillStyle = "rgba(0,0,0,0.6)"; ctx.fillRect(0, 0, w, h)
    ctx.textAlign = "center"; ctx.shadowColor = "#ff0000"; ctx.shadowBlur = 15
    ctx.fillStyle = "#fff"; ctx.font = `bold ${28 * dpr}px monospace`
    ctx.fillText("GAME OVER", w / 2, h / 2 - 15 * dpr); ctx.shadowBlur = 0
    ctx.font = `${14 * dpr}px monospace`; ctx.fillStyle = "#aaa"
    ctx.fillText(`Score: ${state.score}`, w / 2, h / 2 + 15 * dpr)
    ctx.fillStyle = state.paddleColor; ctx.fillText("TAP TO CONTINUE", w / 2, h / 2 + 45 * dpr)
  }
}
