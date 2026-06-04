// Neon Runner — simple tap-to-jump infinite runner engine

export interface RunnerState {
  player: {
    x: number
    y: number
    vy: number
    width: number
    height: number
    grounded: boolean
    ducking: boolean
    doubleJumpAvailable: boolean
    shield: boolean
    shieldTimer: number
    magnetTimer: number
    scoreMultTimer: number
    dead: boolean
  }
  obstacles: RunnerObstacle[]
  powerups: RunnerPowerup[]
  particles: RunnerParticle[]
  ground: RunnerGroundSegment[]
  score: number
  distance: number
  speed: number
  baseSpeed: number
  time: number
  gameOver: boolean
  paused: boolean
}

export interface RunnerObstacle {
  x: number
  y: number
  width: number
  height: number
  type: "spike" | "wall" | "low_bar" | "gap"
  passed: boolean
}

export interface RunnerPowerup {
  x: number
  y: number
  type: "shield" | "double_jump" | "magnet" | "score_mult" | "slow_time"
  collected: boolean
  bobOffset: number
}

export interface RunnerParticle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  color: string
  size: number
}

export interface RunnerGroundSegment {
  x: number
  width: number
  hasGap: boolean
}

const GRAVITY = 1800
const JUMP_FORCE = -620
const GROUND_Y = 380
const PLAYER_X = 120
const BASE_SPEED = 320
const SPEED_INCREMENT = 0.8 // per second
const MAX_SPEED = 800
const OBSTACLE_MIN_GAP = 350
const POWERUP_CHANCE = 0.25

export function createRunnerState(): RunnerState {
  return {
    player: {
      x: PLAYER_X,
      y: GROUND_Y,
      vy: 0,
      width: 28,
      height: 36,
      grounded: true,
      ducking: false,
      doubleJumpAvailable: false,
      shield: false,
      shieldTimer: 0,
      magnetTimer: 0,
      scoreMultTimer: 0,
      dead: false
    },
    obstacles: [],
    powerups: [],
    particles: [],
    ground: [],
    score: 0,
    distance: 0,
    speed: BASE_SPEED,
    baseSpeed: BASE_SPEED,
    time: 0,
    gameOver: false,
    paused: false
  }
}

export function updateRunner(state: RunnerState, dt: number, tapActive: boolean): void {
  if (state.paused || state.gameOver) return
  const { player } = state

  if (player.dead) {
    state.gameOver = true
    return
  }

  state.time += dt
  state.speed = Math.min(MAX_SPEED, state.baseSpeed + state.time * SPEED_INCREMENT)

  // Jump logic
  if (tapActive && player.grounded) {
    player.vy = JUMP_FORCE
    player.grounded = false
    emitJumpParticles(state)
  } else if (tapActive && !player.grounded && player.doubleJumpAvailable) {
    player.vy = JUMP_FORCE * 0.85
    player.doubleJumpAvailable = false
    emitJumpParticles(state)
  }

  // Gravity
  player.vy += GRAVITY * dt
  player.y += player.vy * dt

  // Ground collision
  if (player.y >= GROUND_Y) {
    // Check if over a gap
    const overGap = isOverGap(state, player.x)
    if (overGap) {
      // Falling into gap
      if (player.y > GROUND_Y + 400) {
        killPlayer(state)
      }
    } else {
      player.y = GROUND_Y
      player.vy = 0
      if (!player.grounded) {
        player.doubleJumpAvailable = false
      }
      player.grounded = true
    }
  } else {
    player.grounded = false
  }

  // Scroll everything left
  const scrollDx = state.speed * dt

  // Update obstacles
  for (const obs of state.obstacles) {
    obs.x -= scrollDx
  }

  // Update powerups
  for (const pw of state.powerups) {
    pw.x -= scrollDx
  }

  // Update ground segments
  for (const seg of state.ground) {
    seg.x -= scrollDx
  }

  // Score + distance
  state.distance += scrollDx
  const mult = player.scoreMultTimer > 0 ? 3 : 1
  state.score += scrollDx * 0.05 * mult

  // Power-up timers
  if (player.shieldTimer > 0) {
    player.shieldTimer -= dt
    if (player.shieldTimer <= 0) player.shield = false
  }
  if (player.magnetTimer > 0) player.magnetTimer -= dt
  if (player.scoreMultTimer > 0) player.scoreMultTimer -= dt

  // Generate obstacles
  generateRunnerContent(state)

  // Magnet: attract nearby powerups
  if (player.magnetTimer > 0) {
    for (const pw of state.powerups) {
      if (pw.collected) continue
      const dx = player.x - pw.x
      const dy = player.y - pw.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < 200) {
        pw.x += dx * 3 * dt
        pw.y += dy * 3 * dt
      }
    }
  }

  // Collision detection
  for (const obs of state.obstacles) {
    if (obs.passed) continue
    if (obs.x + obs.width < player.x - player.width / 2) {
      obs.passed = true
      state.score += 50 * mult
      continue
    }
    if (obs.type === "gap") continue // gaps handled by ground logic
    if (checkRunnerCollision(player, obs)) {
      if (player.shield) {
        player.shield = false
        player.shieldTimer = 0
        obs.passed = true
        emitShieldBreakParticles(state, obs.x, obs.y)
      } else {
        killPlayer(state)
        return
      }
    }
  }

  // Powerup collection
  for (const pw of state.powerups) {
    if (pw.collected) continue
    const dx = player.x - pw.x
    const dy = (player.y - player.height / 2) - pw.y
    if (Math.abs(dx) < 30 && Math.abs(dy) < 30) {
      pw.collected = true
      applyRunnerPowerup(state, pw.type)
      emitPowerupCollectParticles(state, pw.x, pw.y, pw.type)
    }
  }

  // Cleanup off-screen
  state.obstacles = state.obstacles.filter(o => o.x > -200)
  state.powerups = state.powerups.filter(p => p.x > -200)
  state.ground = state.ground.filter(g => g.x + g.width > -200)

  // Update particles
  state.particles = state.particles.filter(p => {
    p.x += p.vx * dt
    p.y += p.vy * dt
    p.vy += 400 * dt
    p.life -= dt
    return p.life > 0
  })
}

function isOverGap(state: RunnerState, x: number): boolean {
  for (const obs of state.obstacles) {
    if (obs.type === "gap" && x > obs.x && x < obs.x + obs.width) {
      return true
    }
  }
  return false
}

function killPlayer(state: RunnerState): void {
  state.player.dead = true
  emitDeathParticles(state)
}

function checkRunnerCollision(
  player: RunnerState["player"],
  obs: RunnerObstacle
): boolean {
  const px = player.x
  const py = player.y - player.height / 2
  const pw = player.width / 2
  const ph = player.height / 2

  const ox = obs.x + obs.width / 2
  const oy = obs.y - obs.height / 2
  const ow = obs.width / 2
  const oh = obs.height / 2

  return Math.abs(px - ox) < pw + ow && Math.abs(py - oy) < ph + oh
}

function applyRunnerPowerup(state: RunnerState, type: RunnerPowerup["type"]): void {
  switch (type) {
    case "shield":
      state.player.shield = true
      state.player.shieldTimer = 8
      break
    case "double_jump":
      state.player.doubleJumpAvailable = true
      break
    case "magnet":
      state.player.magnetTimer = 10
      break
    case "score_mult":
      state.player.scoreMultTimer = 8
      break
    case "slow_time":
      state.baseSpeed = Math.max(200, state.speed * 0.6)
      setTimeout(() => { state.baseSpeed = BASE_SPEED }, 4000)
      break
  }
}

let lastObstacleX = 600

function generateRunnerContent(state: RunnerState): void {
  const rightEdge = 900 // canvas width assumption

  // Ensure ground segments exist
  const lastGround = state.ground[state.ground.length - 1]
  const groundEnd = lastGround ? lastGround.x + lastGround.width : 0
  if (groundEnd < rightEdge + 400) {
    state.ground.push({ x: groundEnd, width: 600, hasGap: false })
  }

  // Generate obstacles ahead
  const farthestObs = state.obstacles.length > 0
    ? Math.max(...state.obstacles.map(o => o.x))
    : lastObstacleX

  if (farthestObs < rightEdge + 300) {
    const gap = OBSTACLE_MIN_GAP + Math.random() * 200
    const newX = farthestObs + gap
    const difficulty = Math.min(state.distance / 5000, 1)
    const roll = Math.random()

    if (roll < 0.35) {
      // Spike — must jump over
      state.obstacles.push({
        x: newX, y: GROUND_Y, width: 20, height: 30,
        type: "spike", passed: false
      })
    } else if (roll < 0.6) {
      // Wall — must jump over
      const h = 35 + Math.random() * 25
      state.obstacles.push({
        x: newX, y: GROUND_Y, width: 24, height: h,
        type: "wall", passed: false
      })
    } else if (roll < 0.8) {
      // Low bar — elevated bar that must be jumped over (like a hurdle)
      state.obstacles.push({
        x: newX, y: GROUND_Y, width: 40, height: 25,
        type: "low_bar", passed: false
      })
    } else if (difficulty > 0.3) {
      // Gap in ground
      const gapWidth = 60 + Math.random() * 60
      state.obstacles.push({
        x: newX, y: GROUND_Y, width: gapWidth, height: 400,
        type: "gap", passed: false
      })
    } else {
      state.obstacles.push({
        x: newX, y: GROUND_Y, width: 20, height: 30,
        type: "spike", passed: false
      })
    }

    lastObstacleX = newX

    // Maybe spawn a powerup near the obstacle
    if (Math.random() < POWERUP_CHANCE) {
      const types: RunnerPowerup["type"][] = ["shield", "double_jump", "magnet", "score_mult", "slow_time"]
      state.powerups.push({
        x: newX + gap * 0.3 + Math.random() * 100,
        y: GROUND_Y - 60 - Math.random() * 40,
        type: types[Math.floor(Math.random() * types.length)],
        collected: false,
        bobOffset: Math.random() * Math.PI * 2
      })
    }
  }
}

export function resetRunnerGeneration(): void {
  lastObstacleX = 600
}

// ─── Rendering ───

export function renderRunner(
  ctx: CanvasRenderingContext2D,
  state: RunnerState,
  w: number,
  h: number
): void {
  const dpr = window.devicePixelRatio || 1

  // Background
  ctx.fillStyle = "#0a0a1a"
  ctx.fillRect(0, 0, w, h)

  // Stars
  for (let i = 0; i < 50; i++) {
    const sx = (42 * (i + 1) * 7919) % w
    const sy = (42 * (i + 1) * 104729) % (h * 0.7)
    ctx.fillStyle = `rgba(255,255,255,${0.2 + (i % 4) * 0.1})`
    ctx.fillRect(sx, sy, 1.5 * dpr, 1.5 * dpr)
  }

  // Ground line
  ctx.strokeStyle = "#00f0ff"
  ctx.lineWidth = 4 * dpr
  ctx.shadowColor = "#00f0ff"
  ctx.shadowBlur = 15

  ctx.beginPath()
  let drawX = 0
  while (drawX < w) {
    const overGap = isOverGap(state, drawX + state.player.x - PLAYER_X)
    if (!overGap) {
      // Check if there's a gap obstacle at this screen position
      let inGap = false
      for (const obs of state.obstacles) {
        if (obs.type === "gap" && drawX >= obs.x && drawX < obs.x + obs.width) {
          inGap = true
          break
        }
      }
      if (!inGap) {
        ctx.moveTo(drawX, GROUND_Y * dpr)
        ctx.lineTo(Math.min(drawX + 10, w), GROUND_Y * dpr)
      }
    }
    drawX += 10
  }
  ctx.stroke()

  // Ground fill below
  ctx.shadowBlur = 0
  ctx.fillStyle = "rgba(0, 240, 255, 0.03)"
  ctx.fillRect(0, GROUND_Y * dpr, w, h - GROUND_Y * dpr)

  // Inner bright ground line
  ctx.strokeStyle = "#ffffff"
  ctx.lineWidth = 1.5 * dpr
  ctx.shadowColor = "#ffffff"
  ctx.shadowBlur = 5
  ctx.beginPath()
  drawX = 0
  while (drawX < w) {
    let inGap = false
    for (const obs of state.obstacles) {
      if (obs.type === "gap" && drawX >= obs.x && drawX < obs.x + obs.width) {
        inGap = true
        break
      }
    }
    if (!inGap) {
      ctx.moveTo(drawX, GROUND_Y * dpr)
      ctx.lineTo(Math.min(drawX + 10, w), GROUND_Y * dpr)
    }
    drawX += 10
  }
  ctx.stroke()
  ctx.shadowBlur = 0

  // Obstacles
  for (const obs of state.obstacles) {
    if (obs.x > w / dpr + 50 || obs.x < -50) continue
    if (obs.passed && obs.type !== "gap") continue
    renderRunnerObstacle(ctx, obs, state.time, dpr)
  }

  // Powerups
  for (const pw of state.powerups) {
    if (pw.collected || pw.x > w / dpr + 50 || pw.x < -50) continue
    renderRunnerPowerup(ctx, pw, state.time, dpr)
  }

  // Player
  renderRunnerPlayer(ctx, state, dpr)

  // Particles
  for (const p of state.particles) {
    const alpha = p.life / p.maxLife
    ctx.save()
    ctx.globalAlpha = alpha
    ctx.fillStyle = p.color
    ctx.shadowColor = p.color
    ctx.shadowBlur = 6
    ctx.fillRect(p.x * dpr - p.size, p.y * dpr - p.size, p.size * 2, p.size * 2)
    ctx.restore()
  }

  // HUD
  ctx.shadowBlur = 0
  ctx.fillStyle = "#ffffff"
  ctx.font = `bold ${18 * dpr}px monospace`
  ctx.textAlign = "left"
  ctx.shadowColor = "#00f0ff"
  ctx.shadowBlur = 8
  ctx.fillText(`${Math.floor(state.score)}`, 20 * dpr, 35 * dpr)

  ctx.font = `${12 * dpr}px monospace`
  ctx.fillStyle = "#888888"
  ctx.shadowBlur = 0
  ctx.fillText(`${Math.floor(state.distance / 10)}m`, 20 * dpr, 55 * dpr)

  // Active powerup indicators
  let indY = 35 * dpr
  ctx.font = `bold ${11 * dpr}px monospace`
  ctx.textAlign = "right"
  if (state.player.shield) {
    ctx.fillStyle = "#ffff00"
    ctx.fillText(`SHIELD ${state.player.shieldTimer.toFixed(1)}s`, (w / dpr - 15) * dpr, indY)
    indY += 16 * dpr
  }
  if (state.player.doubleJumpAvailable) {
    ctx.fillStyle = "#00ff88"
    ctx.fillText("DOUBLE JUMP", (w / dpr - 15) * dpr, indY)
    indY += 16 * dpr
  }
  if (state.player.magnetTimer > 0) {
    ctx.fillStyle = "#ff00ff"
    ctx.fillText(`MAGNET ${state.player.magnetTimer.toFixed(1)}s`, (w / dpr - 15) * dpr, indY)
    indY += 16 * dpr
  }
  if (state.player.scoreMultTimer > 0) {
    ctx.fillStyle = "#ff8800"
    ctx.fillText(`3x SCORE ${state.player.scoreMultTimer.toFixed(1)}s`, (w / dpr - 15) * dpr, indY)
  }

  // Speed indicator
  ctx.fillStyle = "rgba(255,255,255,0.2)"
  ctx.font = `${10 * dpr}px monospace`
  ctx.textAlign = "left"
  ctx.fillText(`${Math.floor(state.speed)} px/s`, 20 * dpr, (h / dpr - 15) * dpr)

  // Death overlay
  if (state.player.dead) {
    ctx.fillStyle = "rgba(255, 0, 0, 0.25)"
    ctx.fillRect(0, 0, w, h)

    ctx.fillStyle = "#ffffff"
    ctx.font = `bold ${32 * dpr}px monospace`
    ctx.textAlign = "center"
    ctx.shadowColor = "#ff0000"
    ctx.shadowBlur = 20
    ctx.fillText("CRASHED!", w / 2, h / 2 - 30 * dpr)

    ctx.font = `${16 * dpr}px monospace`
    ctx.fillStyle = "#cccccc"
    ctx.shadowBlur = 0
    ctx.fillText(`Score: ${Math.floor(state.score)}`, w / 2, h / 2 + 10 * dpr)
    ctx.fillText(`Distance: ${Math.floor(state.distance / 10)}m`, w / 2, h / 2 + 35 * dpr)

    ctx.fillStyle = "#00f0ff"
    ctx.font = `bold ${18 * dpr}px monospace`
    ctx.fillText("TAP TO CONTINUE", w / 2, h / 2 + 80 * dpr)
  }
}

function renderRunnerPlayer(ctx: CanvasRenderingContext2D, state: RunnerState, dpr: number): void {
  const { player } = state
  const px = player.x * dpr
  const py = (player.y - player.height) * dpr
  const pw = player.width * dpr
  const ph = player.height * dpr

  ctx.save()

  // Shield aura
  if (player.shield) {
    ctx.strokeStyle = "rgba(255,255,0,0.4)"
    ctx.lineWidth = 3 * dpr
    ctx.beginPath()
    ctx.arc(px, py + ph / 2, pw * 0.9 + Math.sin(state.time * 6) * 3, 0, Math.PI * 2)
    ctx.stroke()
  }

  // Body glow
  ctx.shadowColor = player.shield ? "#ffff00" : player.scoreMultTimer > 0 ? "#ff8800" : "#00f0ff"
  ctx.shadowBlur = 15

  // Running figure
  const bodyColor = player.shield
    ? `hsl(${(state.time * 200) % 360}, 100%, 60%)`
    : player.scoreMultTimer > 0 ? "#ff8800" : "#00f0ff"

  ctx.fillStyle = bodyColor

  // Head
  ctx.beginPath()
  ctx.arc(px, py + 8 * dpr, 7 * dpr, 0, Math.PI * 2)
  ctx.fill()

  // Body
  ctx.fillRect(px - 4 * dpr, py + 14 * dpr, 8 * dpr, 14 * dpr)

  // Legs — animated running
  const legAnim = Math.sin(state.time * 12) * 6
  ctx.lineWidth = 3 * dpr
  ctx.strokeStyle = bodyColor
  ctx.beginPath()
  ctx.moveTo(px, py + 28 * dpr)
  ctx.lineTo(px + legAnim * dpr, py + ph)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(px, py + 28 * dpr)
  ctx.lineTo(px - legAnim * dpr, py + ph)
  ctx.stroke()

  // Arms
  const armAnim = Math.sin(state.time * 12 + Math.PI) * 5
  ctx.beginPath()
  ctx.moveTo(px, py + 16 * dpr)
  ctx.lineTo(px + armAnim * dpr + 8 * dpr, py + 22 * dpr)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(px, py + 16 * dpr)
  ctx.lineTo(px - armAnim * dpr - 8 * dpr, py + 22 * dpr)
  ctx.stroke()

  ctx.shadowBlur = 0
  ctx.restore()
}

function renderRunnerObstacle(ctx: CanvasRenderingContext2D, obs: RunnerObstacle, time: number, dpr: number): void {
  ctx.save()
  const x = obs.x * dpr
  const y = obs.y * dpr

  switch (obs.type) {
    case "spike":
      ctx.fillStyle = "#ff4444"
      ctx.shadowColor = "#ff4444"
      ctx.shadowBlur = 10
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(x + obs.width * dpr / 2, y - obs.height * dpr)
      ctx.lineTo(x + obs.width * dpr, y)
      ctx.closePath()
      ctx.fill()
      break
    case "wall":
      ctx.fillStyle = "#cc4444"
      ctx.shadowColor = "#ff4444"
      ctx.shadowBlur = 8
      ctx.fillRect(x, y - obs.height * dpr, obs.width * dpr, obs.height * dpr)
      ctx.fillStyle = "#ffcc00"
      for (let i = 0; i < 2; i++) {
        ctx.fillRect(x + 2 * dpr, y - obs.height * dpr + i * 10 * dpr + 2 * dpr, obs.width * dpr - 4 * dpr, 3 * dpr)
      }
      break
    case "low_bar":
      ctx.fillStyle = "#ff8800"
      ctx.shadowColor = "#ff8800"
      ctx.shadowBlur = 10
      ctx.fillRect(x, (obs.y - obs.height) * dpr, obs.width * dpr, obs.height * dpr * 0.4)
      // Posts
      ctx.fillRect(x, obs.y * dpr - obs.height * dpr, 3 * dpr, obs.height * dpr)
      ctx.fillRect(x + obs.width * dpr - 3 * dpr, obs.y * dpr - obs.height * dpr, 3 * dpr, obs.height * dpr)
      break
    case "gap":
      // Draw danger marks at edges
      ctx.fillStyle = `rgba(255, 68, 68, ${0.3 + Math.sin(time * 4) * 0.2})`
      ctx.fillRect(x, y * dpr, 4 * dpr, 20 * dpr)
      ctx.fillRect(x + obs.width * dpr - 4 * dpr, y * dpr, 4 * dpr, 20 * dpr)
      break
  }
  ctx.shadowBlur = 0
  ctx.restore()
}

function renderRunnerPowerup(ctx: CanvasRenderingContext2D, pw: RunnerPowerup, time: number, dpr: number): void {
  const bobY = Math.sin(time * 3 + pw.bobOffset) * 6
  const x = pw.x * dpr
  const y = (pw.y + bobY) * dpr

  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(time * 2)

  const colors: Record<RunnerPowerup["type"], string> = {
    shield: "#ffff00",
    double_jump: "#00ff88",
    magnet: "#ff00ff",
    score_mult: "#ff8800",
    slow_time: "#00aaff"
  }
  const icons: Record<RunnerPowerup["type"], string> = {
    shield: "S",
    double_jump: "J",
    magnet: "M",
    score_mult: "x3",
    slow_time: "T"
  }

  const color = colors[pw.type]
  ctx.fillStyle = color
  ctx.shadowColor = color
  ctx.shadowBlur = 12

  const s = 10 * dpr
  ctx.beginPath()
  ctx.moveTo(0, -s)
  ctx.lineTo(s, 0)
  ctx.lineTo(0, s)
  ctx.lineTo(-s, 0)
  ctx.closePath()
  ctx.fill()

  ctx.fillStyle = "#ffffff"
  ctx.font = `bold ${8 * dpr}px monospace`
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.rotate(-time * 2)
  ctx.shadowBlur = 0
  ctx.fillText(icons[pw.type], 0, 0)

  ctx.restore()
}

// ─── Particle emitters ───

function emitJumpParticles(state: RunnerState): void {
  for (let i = 0; i < 6; i++) {
    state.particles.push({
      x: state.player.x, y: GROUND_Y,
      vx: (Math.random() - 0.5) * 100, vy: -Math.random() * 80,
      life: 0.4, maxLife: 0.4, color: "#00f0ff", size: 2
    })
  }
}

function emitDeathParticles(state: RunnerState): void {
  for (let i = 0; i < 20; i++) {
    state.particles.push({
      x: state.player.x, y: state.player.y - state.player.height / 2,
      vx: (Math.random() - 0.5) * 300, vy: -Math.random() * 300,
      life: 1.2, maxLife: 1.2,
      color: ["#ff4400", "#ff8800", "#ffcc00"][Math.floor(Math.random() * 3)],
      size: 3
    })
  }
}

function emitShieldBreakParticles(state: RunnerState, x: number, y: number): void {
  for (let i = 0; i < 10; i++) {
    state.particles.push({
      x, y: y - 15,
      vx: (Math.random() - 0.5) * 200, vy: -Math.random() * 200,
      life: 0.6, maxLife: 0.6, color: "#ffff00", size: 3
    })
  }
}

function emitPowerupCollectParticles(state: RunnerState, x: number, y: number, _type: RunnerPowerup["type"]): void {
  for (let i = 0; i < 8; i++) {
    state.particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 150, vy: -Math.random() * 150,
      life: 0.5, maxLife: 0.5, color: "#ffffff", size: 2
    })
  }
}
