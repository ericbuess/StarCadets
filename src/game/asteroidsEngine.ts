// Asteroids — classic space shooter with wrap-around screen

export interface AsteroidsState {
  ship: {
    x: number
    y: number
    angle: number
    vx: number
    vy: number
    dead: boolean
    invincible: number
    thrustOn: boolean
  }
  asteroids: Asteroid[]
  bullets: Bullet[]
  particles: AsteroidParticle[]
  score: number
  lives: number
  level: number
  gameOver: boolean
  paused: boolean
  time: number
  width: number
  height: number
}

interface Asteroid {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  size: "large" | "medium" | "small"
  angle: number
  rotSpeed: number
  vertices: number[]
}

interface Bullet {
  x: number
  y: number
  vx: number
  vy: number
  life: number
}

interface AsteroidParticle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  color: string
}

const SHIP_ACCEL = 300
const SHIP_FRICTION = 0.98
const SHIP_ROTATE = 4.5
const BULLET_SPEED = 500
const BULLET_LIFE = 1.2
const SHIP_RADIUS = 12

function makeAsteroidVertices(): number[] {
  const count = 8 + Math.floor(Math.random() * 5)
  const verts: number[] = []
  for (let i = 0; i < count; i++) {
    verts.push(0.7 + Math.random() * 0.6)
  }
  return verts
}

function spawnAsteroid(
  w: number, h: number,
  size: "large" | "medium" | "small",
  x?: number, y?: number
): Asteroid {
  const radius = size === "large" ? 40 : size === "medium" ? 22 : 12
  const speed = size === "large" ? 40 + Math.random() * 40
    : size === "medium" ? 60 + Math.random() * 50
    : 80 + Math.random() * 60
  const angle = Math.random() * Math.PI * 2

  return {
    x: x ?? (Math.random() < 0.5 ? 0 : w),
    y: y ?? Math.random() * h,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    radius,
    size,
    angle: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() - 0.5) * 3,
    vertices: makeAsteroidVertices(),
  }
}

export function createAsteroidsState(w = 600, h = 400): AsteroidsState {
  const asteroids: Asteroid[] = []
  for (let i = 0; i < 4; i++) {
    asteroids.push(spawnAsteroid(w, h, "large"))
  }

  return {
    ship: {
      x: w / 2,
      y: h / 2,
      angle: -Math.PI / 2,
      vx: 0,
      vy: 0,
      dead: false,
      invincible: 3,
      thrustOn: false,
    },
    asteroids,
    bullets: [],
    particles: [],
    score: 0,
    lives: 3,
    level: 1,
    gameOver: false,
    paused: false,
    time: 0,
    width: w,
    height: h,
  }
}

export interface AsteroidsInput {
  left: boolean
  right: boolean
  thrust: boolean
  shoot: boolean
}

let shootCooldown = 0

export function updateAsteroids(
  state: AsteroidsState,
  dt: number,
  input: AsteroidsInput
): void {
  if (state.paused || state.gameOver) return
  state.time += dt

  const { ship } = state
  const W = state.width
  const H = state.height

  // Ship rotation
  if (!ship.dead) {
    if (input.left) ship.angle -= SHIP_ROTATE * dt
    if (input.right) ship.angle += SHIP_ROTATE * dt

    // Thrust
    ship.thrustOn = input.thrust
    if (input.thrust) {
      ship.vx += Math.cos(ship.angle) * SHIP_ACCEL * dt
      ship.vy += Math.sin(ship.angle) * SHIP_ACCEL * dt
    }

    // Friction
    ship.vx *= SHIP_FRICTION
    ship.vy *= SHIP_FRICTION

    // Move
    ship.x += ship.vx * dt
    ship.y += ship.vy * dt

    // Wrap
    ship.x = ((ship.x % W) + W) % W
    ship.y = ((ship.y % H) + H) % H

    // Shoot
    shootCooldown -= dt
    if (input.shoot && shootCooldown <= 0) {
      state.bullets.push({
        x: ship.x + Math.cos(ship.angle) * 15,
        y: ship.y + Math.sin(ship.angle) * 15,
        vx: Math.cos(ship.angle) * BULLET_SPEED + ship.vx * 0.3,
        vy: Math.sin(ship.angle) * BULLET_SPEED + ship.vy * 0.3,
        life: BULLET_LIFE,
      })
      shootCooldown = 0.15
    }

    // Invincibility timer
    if (ship.invincible > 0) ship.invincible -= dt
  }

  // Update bullets
  for (const b of state.bullets) {
    b.x += b.vx * dt
    b.y += b.vy * dt
    b.x = ((b.x % W) + W) % W
    b.y = ((b.y % H) + H) % H
    b.life -= dt
  }
  state.bullets = state.bullets.filter(b => b.life > 0)

  // Update asteroids
  for (const a of state.asteroids) {
    a.x += a.vx * dt
    a.y += a.vy * dt
    a.x = ((a.x % W) + W) % W
    a.y = ((a.y % H) + H) % H
    a.angle += a.rotSpeed * dt
  }

  // Bullet-asteroid collisions
  const newAsteroids: Asteroid[] = []
  const toRemoveBullets = new Set<number>()
  const toRemoveAsteroids = new Set<number>()

  for (let bi = 0; bi < state.bullets.length; bi++) {
    const b = state.bullets[bi]
    for (let ai = 0; ai < state.asteroids.length; ai++) {
      if (toRemoveAsteroids.has(ai)) continue
      const a = state.asteroids[ai]
      const dx = b.x - a.x
      const dy = b.y - a.y
      if (dx * dx + dy * dy < a.radius * a.radius) {
        toRemoveBullets.add(bi)
        toRemoveAsteroids.add(ai)

        // Score
        state.score += a.size === "large" ? 20 : a.size === "medium" ? 50 : 100

        // Split
        if (a.size === "large") {
          newAsteroids.push(spawnAsteroid(W, H, "medium", a.x, a.y))
          newAsteroids.push(spawnAsteroid(W, H, "medium", a.x, a.y))
        } else if (a.size === "medium") {
          newAsteroids.push(spawnAsteroid(W, H, "small", a.x, a.y))
          newAsteroids.push(spawnAsteroid(W, H, "small", a.x, a.y))
        }

        // Particles
        for (let i = 0; i < 8; i++) {
          const ang = Math.random() * Math.PI * 2
          const spd = 40 + Math.random() * 80
          state.particles.push({
            x: a.x, y: a.y,
            vx: Math.cos(ang) * spd,
            vy: Math.sin(ang) * spd,
            life: 0.5 + Math.random() * 0.3,
            maxLife: 0.8,
            color: "#00f0ff",
          })
        }
        break
      }
    }
  }

  state.bullets = state.bullets.filter((_, i) => !toRemoveBullets.has(i))
  state.asteroids = state.asteroids.filter((_, i) => !toRemoveAsteroids.has(i))
  state.asteroids.push(...newAsteroids)

  // Ship-asteroid collision
  if (!ship.dead && ship.invincible <= 0) {
    for (const a of state.asteroids) {
      const dx = ship.x - a.x
      const dy = ship.y - a.y
      if (dx * dx + dy * dy < (SHIP_RADIUS + a.radius) * (SHIP_RADIUS + a.radius) * 0.6) {
        // Hit!
        state.lives--
        if (state.lives <= 0) {
          ship.dead = true
          state.gameOver = true
        } else {
          ship.invincible = 2
          ship.x = W / 2
          ship.y = H / 2
          ship.vx = 0
          ship.vy = 0
        }

        // Death particles
        for (let i = 0; i < 12; i++) {
          const ang = Math.random() * Math.PI * 2
          const spd = 50 + Math.random() * 100
          state.particles.push({
            x: ship.x, y: ship.y,
            vx: Math.cos(ang) * spd,
            vy: Math.sin(ang) * spd,
            life: 0.8, maxLife: 0.8,
            color: "#ff4444",
          })
        }
        break
      }
    }
  }

  // Update particles
  state.particles = state.particles.filter(p => {
    p.x += p.vx * dt
    p.y += p.vy * dt
    p.life -= dt
    return p.life > 0
  })

  // Next level if all asteroids destroyed
  if (state.asteroids.length === 0 && !state.gameOver) {
    state.level++
    const count = 3 + state.level
    for (let i = 0; i < count; i++) {
      const a = spawnAsteroid(W, H, "large")
      // Keep away from ship
      const dx = a.x - ship.x
      const dy = a.y - ship.y
      if (Math.sqrt(dx * dx + dy * dy) < 100) {
        a.x = (ship.x + W / 2) % W
      }
      state.asteroids.push(a)
    }
  }
}

export function resetAsteroidsShootCooldown(): void {
  shootCooldown = 0
}

export function renderAsteroids(
  ctx: CanvasRenderingContext2D,
  state: AsteroidsState,
  w: number,
  h: number
): void {
  const dpr = window.devicePixelRatio || 1
  const sx = w / state.width
  const sy = h / state.height

  // Background
  ctx.fillStyle = "#0a0a1a"
  ctx.fillRect(0, 0, w, h)

  // Stars
  for (let i = 0; i < 40; i++) {
    const x = ((i * 7919 + 42) % state.width) * sx
    const y = ((i * 104729 + 42) % state.height) * sy
    ctx.fillStyle = `rgba(255,255,255,${0.15 + (i % 5) * 0.06})`
    ctx.fillRect(x, y, 1.5 * dpr, 1.5 * dpr)
  }

  // Asteroids
  for (const a of state.asteroids) {
    ctx.save()
    ctx.translate(a.x * sx, a.y * sy)
    ctx.rotate(a.angle)
    ctx.strokeStyle = "#888"
    ctx.lineWidth = 2 * dpr
    ctx.shadowColor = "#00f0ff"
    ctx.shadowBlur = 4

    ctx.beginPath()
    const n = a.vertices.length
    for (let i = 0; i <= n; i++) {
      const ang = (i / n) * Math.PI * 2
      const r = a.radius * a.vertices[i % n] * Math.min(sx, sy)
      const px = Math.cos(ang) * r
      const py = Math.sin(ang) * r
      if (i === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    }
    ctx.closePath()
    ctx.stroke()
    ctx.shadowBlur = 0
    ctx.restore()
  }

  // Bullets
  for (const b of state.bullets) {
    ctx.fillStyle = "#00f0ff"
    ctx.shadowColor = "#00f0ff"
    ctx.shadowBlur = 8
    ctx.beginPath()
    ctx.arc(b.x * sx, b.y * sy, 2.5 * dpr, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.shadowBlur = 0

  // Ship
  const { ship } = state
  if (!ship.dead) {
    const blink = ship.invincible > 0 && Math.floor(state.time * 10) % 2 === 0
    if (!blink) {
      ctx.save()
      ctx.translate(ship.x * sx, ship.y * sy)
      ctx.rotate(ship.angle)

      // Thrust flame
      if (ship.thrustOn) {
        ctx.fillStyle = `hsl(${30 + Math.random() * 20}, 100%, 60%)`
        ctx.beginPath()
        ctx.moveTo(-8 * dpr, -5 * dpr)
        ctx.lineTo(-16 * dpr - Math.random() * 6 * dpr, 0)
        ctx.lineTo(-8 * dpr, 5 * dpr)
        ctx.closePath()
        ctx.fill()
      }

      ctx.strokeStyle = "#00f0ff"
      ctx.lineWidth = 2 * dpr
      ctx.shadowColor = "#00f0ff"
      ctx.shadowBlur = 10
      ctx.beginPath()
      ctx.moveTo(15 * dpr, 0)
      ctx.lineTo(-10 * dpr, -9 * dpr)
      ctx.lineTo(-6 * dpr, 0)
      ctx.lineTo(-10 * dpr, 9 * dpr)
      ctx.closePath()
      ctx.stroke()
      ctx.shadowBlur = 0
      ctx.restore()
    }
  }

  // Particles
  for (const p of state.particles) {
    const alpha = p.life / p.maxLife
    ctx.globalAlpha = alpha
    ctx.fillStyle = p.color
    ctx.fillRect(p.x * sx - 1.5, p.y * sy - 1.5, 3, 3)
  }
  ctx.globalAlpha = 1

  // HUD
  ctx.fillStyle = "#fff"
  ctx.font = `bold ${16 * dpr}px monospace`
  ctx.textAlign = "left"
  ctx.shadowColor = "#00f0ff"
  ctx.shadowBlur = 6
  ctx.fillText(`${state.score}`, 15 * dpr, 25 * dpr)
  ctx.shadowBlur = 0

  // Lives
  ctx.font = `${12 * dpr}px monospace`
  ctx.fillStyle = "#888"
  ctx.fillText(`LVL ${state.level}`, 15 * dpr, 45 * dpr)

  for (let i = 0; i < state.lives; i++) {
    ctx.save()
    ctx.translate((w - 25 * dpr - i * 22 * dpr), 22 * dpr)
    ctx.rotate(-Math.PI / 2)
    ctx.strokeStyle = "#00f0ff"
    ctx.lineWidth = 1.5 * dpr
    ctx.beginPath()
    ctx.moveTo(8 * dpr, 0)
    ctx.lineTo(-5 * dpr, -5 * dpr)
    ctx.lineTo(-3 * dpr, 0)
    ctx.lineTo(-5 * dpr, 5 * dpr)
    ctx.closePath()
    ctx.stroke()
    ctx.restore()
  }

  // Game over
  if (state.gameOver) {
    ctx.fillStyle = "rgba(0,0,0,0.6)"
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = "#fff"
    ctx.font = `bold ${28 * dpr}px monospace`
    ctx.textAlign = "center"
    ctx.shadowColor = "#ff0000"
    ctx.shadowBlur = 15
    ctx.fillText("GAME OVER", w / 2, h / 2 - 15 * dpr)
    ctx.shadowBlur = 0
    ctx.font = `${14 * dpr}px monospace`
    ctx.fillStyle = "#aaa"
    ctx.fillText(`Score: ${state.score}`, w / 2, h / 2 + 15 * dpr)
    ctx.fillStyle = "#00f0ff"
    ctx.fillText("TAP TO CONTINUE", w / 2, h / 2 + 45 * dpr)
  }
}
