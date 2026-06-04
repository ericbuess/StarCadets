import type { CarState, GameState, Particle, Vec2, VehicleProfile, PowerupType } from "./types"
import { VEHICLES } from "./types"
import { getTerrainHeightAt } from "./terrain"

const BASE_GRAVITY = 580
const BASE_DRIVE_FORCE = 500
const BASE_FLIP_TORQUE = 8
const BASE_MAX_SPEED = 550
const FRICTION = 0.99
const ANGULAR_FRICTION = 0.96
const CAR_WIDTH = 50
const CAR_HEIGHT = 22
const LAUNCH_BOOST = 1.25
const MIN_LAUNCH_SPEED = 80

export function createCar(vehicle?: VehicleProfile): CarState {
  const v = vehicle || VEHICLES[0]
  return {
    pos: { x: 100, y: 200 },
    vel: { x: 0, y: 0 },
    angle: 0,
    angularVel: 0,
    wheelBase: 40,
    width: CAR_WIDTH,
    height: CAR_HEIGHT,
    onGround: false,
    crashed: false,
    fuel: 100,
    score: 0,
    distance: 0,
    flipCount: 0,
    frontFlipCount: 0,
    backFlipCount: 0,
    currentFlipAngle: 0,
    isFlipping: false,
    combo: 0,
    comboTimer: 0,
    invincible: false,
    invincibleTimer: 0,
    speedBoost: false,
    speedBoostTimer: 0,
    hangTimeBoost: false,
    hangTimeBoostTimer: 0,
    hasGun: false,
    gunTimer: 0,
    gunCooldown: 0,
    hasMissile: false,
    missileTimer: 0,
    missileCooldown: 0,
    vehicle: v,
    totalAirTime: 0,
    enemiesDestroyed: 0,
    powerupsCollected: 0,
    maxSpeed: 0,
    ghostInputs: []
  }
}

export function updatePhysics(
  state: GameState,
  dt: number,
  leftPressed: boolean,
  rightPressed: boolean
): Particle[] {
  const { car, terrain } = state
  const newParticles: Particle[] = []
  const v = car.vehicle

  if (car.crashed || state.paused || state.showEducation) return newParticles

  // Record input for ghost replay
  car.ghostInputs.push({ time: state.time, leftPressed, rightPressed })

  // Record ghost frame
  if (state.time % 3 < 1) {
    state.ghostFrames.push({ time: state.time, pos: { ...car.pos }, angle: car.angle })
  }

  // Vehicle-scaled constants
  const driveForce = BASE_DRIVE_FORCE * v.speed * (car.speedBoost ? 1.8 : 1)
  const flipTorque = BASE_FLIP_TORQUE * v.flipRate
  const gravity = BASE_GRAVITY * v.hangTime * (car.hangTimeBoost ? 0.4 : 1)
  const maxSpd = BASE_MAX_SPEED * v.speed * (car.speedBoost ? 1.5 : 1)

  // Apply driving force — along terrain surface when grounded, horizontal+flip in air
  if (car.onGround) {
    const groundData = getTerrainHeightAt(terrain, car.pos.x)
    const tanX = groundData.found ? -groundData.normal.y : 1
    const tanY = groundData.found ? groundData.normal.x : 0
    if (rightPressed) {
      car.vel.x += driveForce * tanX * dt
      car.vel.y += driveForce * tanY * dt
    }
    if (leftPressed) {
      car.vel.x -= driveForce * 0.5 * tanX * dt
      car.vel.y -= driveForce * 0.5 * tanY * dt
    }
  } else {
    if (rightPressed) {
      car.vel.x += driveForce * 0.3 * dt
      car.angularVel += flipTorque * dt
    }
    if (leftPressed) {
      car.vel.x -= driveForce * 0.15 * dt
      car.angularVel -= flipTorque * dt
    }
  }

  // Clamp speed
  car.vel.x = Math.max(-maxSpd * 0.3, Math.min(maxSpd, car.vel.x))
  car.maxSpeed = Math.max(car.maxSpeed, Math.abs(car.vel.x))

  // Gravity — reduced when rising for floatier jumps
  const gravityMult = (!car.onGround && car.vel.y < 0) ? 0.6 : 1
  car.vel.y += gravity * gravityMult * dt

  // Update position
  car.pos.x += car.vel.x * dt
  car.pos.y += car.vel.y * dt
  car.angle += car.angularVel * dt

  // Track air time
  if (!car.onGround) {
    car.totalAirTime += dt
  }

  // Track flips — differentiate front vs back
  if (!car.onGround) {
    car.currentFlipAngle += car.angularVel * dt
    if (car.currentFlipAngle >= Math.PI * 2) {
      car.flipCount++
      car.frontFlipCount++
      car.currentFlipAngle -= Math.PI * 2
      car.score += 500 * (car.combo + 1)
      car.combo++
      car.comboTimer = 2
      emitFlipParticles(newParticles, car.pos)
    } else if (car.currentFlipAngle <= -Math.PI * 2) {
      car.flipCount++
      car.backFlipCount++
      car.currentFlipAngle += Math.PI * 2
      car.score += 600 * (car.combo + 1) // back flips worth more
      car.combo++
      car.comboTimer = 2
      emitFlipParticles(newParticles, car.pos)
    }
  }

  // Combo decay
  if (car.comboTimer > 0) {
    car.comboTimer -= dt
    if (car.comboTimer <= 0) car.combo = 0
  }

  // Power-up timers
  if (car.invincibleTimer > 0) { car.invincibleTimer -= dt; if (car.invincibleTimer <= 0) car.invincible = false }
  if (car.speedBoostTimer > 0) { car.speedBoostTimer -= dt; if (car.speedBoostTimer <= 0) car.speedBoost = false }
  if (car.hangTimeBoostTimer > 0) { car.hangTimeBoostTimer -= dt; if (car.hangTimeBoostTimer <= 0) car.hangTimeBoost = false }
  if (car.gunTimer > 0) { car.gunTimer -= dt; if (car.gunTimer <= 0) car.hasGun = false }
  if (car.missileTimer > 0) { car.missileTimer -= dt; if (car.missileTimer <= 0) car.hasMissile = false }
  if (car.gunCooldown > 0) car.gunCooldown -= dt
  if (car.missileCooldown > 0) car.missileCooldown -= dt

  // Auto-fire weapons toward nearest enemy
  if (car.hasGun && car.gunCooldown <= 0) {
    const nearestEnemy = findNearestEnemy(state, car.pos)
    if (nearestEnemy && Math.abs(nearestEnemy.pos.x - car.pos.x) < 600) {
      fireProjectile(state, car.pos, nearestEnemy.pos, "bullet")
      car.gunCooldown = 0.2
    }
  }
  if (car.hasMissile && car.missileCooldown <= 0) {
    const nearestEnemy = findNearestEnemy(state, car.pos)
    if (nearestEnemy && Math.abs(nearestEnemy.pos.x - car.pos.x) < 800) {
      fireProjectile(state, car.pos, nearestEnemy.pos, "missile")
      car.missileCooldown = 1.0
    }
  }

  // Update projectiles
  updateProjectiles(state, dt, newParticles)

  // Ground collision
  const frontWheel = {
    x: car.pos.x + Math.cos(car.angle) * car.wheelBase * 0.5,
    y: car.pos.y + Math.sin(car.angle) * car.wheelBase * 0.5
  }
  const rearWheel = {
    x: car.pos.x - Math.cos(car.angle) * car.wheelBase * 0.5,
    y: car.pos.y - Math.sin(car.angle) * car.wheelBase * 0.5
  }

  const frontGround = getTerrainHeightAt(terrain, frontWheel.x)
  const rearGround = getTerrainHeightAt(terrain, rearWheel.x)
  const centerGround = getTerrainHeightAt(terrain, car.pos.x)

  const wasOnGround = car.onGround
  car.onGround = false

  if (centerGround.found && car.pos.y >= centerGround.y - car.height * 0.5) {
    car.pos.y = centerGround.y - car.height * 0.5
    car.onGround = true

    // Get terrain slope angle
    let slopeAngle = 0
    if (frontGround.found && rearGround.found && frontGround.y < 700 && rearGround.y < 700) {
      slopeAngle = Math.atan2(frontGround.y - rearGround.y, car.wheelBase)
    }

    if (!wasOnGround) {
      // Landing — check angle relative to terrain slope (more forgiving)
      const landingAngle = Math.abs(normalizeAngle(car.angle - slopeAngle))
      const crashThreshold = Math.PI * 0.5 / v.weight
      if (landingAngle > crashThreshold && !car.invincible) {
        car.crashed = true
        emitCrashParticles(newParticles, car.pos)
        return newParticles
      }

      if (car.flipCount > 0 && !car.isFlipping) {
        car.score += car.flipCount * 200
      }
      car.flipCount = 0
      car.currentFlipAngle = 0
    }

    // Align to terrain
    car.angle = lerp(car.angle, slopeAngle, 0.25)

    // Project velocity along surface tangent (KEY: preserves slope momentum for ramp launches)
    const tanX = Math.cos(slopeAngle)
    const tanY = Math.sin(slopeAngle)
    const velDot = car.vel.x * tanX + car.vel.y * tanY
    car.vel.x = velDot * tanX * FRICTION
    car.vel.y = velDot * tanY * FRICTION

    car.angularVel *= 0.8

    // Drive particles
    if (Math.abs(car.vel.x) > 50 && (rightPressed || leftPressed)) {
      newParticles.push({
        pos: { x: car.pos.x - Math.sign(car.vel.x) * 20, y: car.pos.y + 10 },
        vel: { x: -car.vel.x * 0.2 + (Math.random() - 0.5) * 50, y: -Math.random() * 50 },
        life: 0.5, maxLife: 0.5, color: "#888888", size: Math.random() * 3 + 1
      })
    }
  } else {
    car.angularVel *= ANGULAR_FRICTION

    // Ramp launch — just left the ground from a slope
    if (wasOnGround) {
      const speed = Math.sqrt(car.vel.x * car.vel.x + car.vel.y * car.vel.y)
      if (speed > MIN_LAUNCH_SPEED && car.vel.y < 0) {
        car.vel.y *= LAUNCH_BOOST
      }
    }
  }

  // Loop segment support — closest-point collision for inverted/steep loop surfaces
  if (!car.onGround) {
    for (const seg of terrain) {
      if (seg.type !== "loop" || seg.disappeared) continue
      const pts = seg.points
      if (pts.length < 4) continue
      if (car.pos.x < pts[0].x - 20 || car.pos.x > pts[pts.length - 1].x + 20) continue

      const loopStart = Math.floor(pts.length * 0.15)
      const loopEnd = Math.floor(pts.length * 0.85)
      let closestDist = Infinity
      let closestIdx = loopStart
      for (let i = loopStart; i < loopEnd; i++) {
        const d = Math.sqrt((car.pos.x - pts[i].x) ** 2 + (car.pos.y - pts[i].y) ** 2)
        if (d < closestDist) { closestDist = d; closestIdx = i }
      }

      const speed = Math.sqrt(car.vel.x ** 2 + car.vel.y ** 2)
      if (closestDist < car.height * 2.5 && speed > 250) {
        const pt = pts[closestIdx]
        let nx = 0, ny = -1
        if (closestIdx > 0 && closestIdx < pts.length - 1) {
          const tdx = pts[closestIdx + 1].x - pts[closestIdx - 1].x
          const tdy = pts[closestIdx + 1].y - pts[closestIdx - 1].y
          const tlen = Math.sqrt(tdx * tdx + tdy * tdy) || 1
          nx = tdy / tlen
          ny = -tdx / tlen
        }
        car.pos.x = pt.x + nx * car.height * 0.6
        car.pos.y = pt.y + ny * car.height * 0.6
        car.onGround = true
        if (closestIdx < pts.length - 1) {
          const targetAngle = Math.atan2(pts[closestIdx + 1].y - pt.y, pts[closestIdx + 1].x - pt.x)
          car.angle = lerp(car.angle, targetAngle, 0.35)
        }
        if (closestIdx > 0 && closestIdx < pts.length - 1) {
          const tdx = pts[closestIdx + 1].x - pts[closestIdx - 1].x
          const tdy = pts[closestIdx + 1].y - pts[closestIdx - 1].y
          const tlen = Math.sqrt(tdx * tdx + tdy * tdy) || 1
          const tx = tdx / tlen, ty = tdy / tlen
          const vd = car.vel.x * tx + car.vel.y * ty
          const desiredSpeed = Math.max(Math.abs(vd), speed * 0.95)
          const dir = vd >= 0 ? 1 : -1
          car.vel.x = dir * desiredSpeed * tx
          car.vel.y = dir * desiredSpeed * ty
        }
        break
      }
    }
  }

  // Handle disappearing terrain
  for (const seg of terrain) {
    if (seg.type === "disappearing" && !seg.disappeared) {
      const pts = seg.points
      if (pts.length > 0 && car.pos.x >= pts[0].x && car.pos.x <= pts[pts.length - 1].x) {
        if (car.onGround) {
          seg.isDisappearing = true
          if (seg.disappearTimer !== undefined) {
            seg.disappearTimer -= dt
            if (seg.disappearTimer <= 0) seg.disappeared = true
          }
        }
      }
    }
  }

  // Fall death
  if (car.pos.y > 1200) car.crashed = true

  // Update distance and score
  car.distance = Math.max(car.distance, car.pos.x)
  car.score += Math.max(0, car.vel.x) * dt * 0.1

  // Check obstacles
  for (const obs of state.obstacles) {
    if (obs.destroyed) continue
    if (checkCollision(car.pos, car.width, car.height, obs.pos, obs.width, obs.height)) {
      if (car.invincible) {
        obs.destroyed = true
        car.score += 100
        emitDestroyParticles(newParticles, obs.pos, "#ff8800")
      } else {
        car.crashed = true
        emitCrashParticles(newParticles, car.pos)
      }
    }
  }

  // Check enemies
  for (const enemy of state.enemies) {
    if (!enemy.alive) continue
    enemy.pos.x += enemy.vel.x * dt
    if (enemy.type === "bouncer") enemy.pos.y += Math.sin(state.time * 3) * 2

    if (checkCollision(car.pos, car.width, car.height, enemy.pos, enemy.width, enemy.height)) {
      if (car.invincible || (car.vel.y > 0 && car.pos.y < enemy.pos.y)) {
        enemy.alive = false
        car.vel.y = -300
        car.score += 300
        car.enemiesDestroyed++
        emitDestroyParticles(newParticles, enemy.pos, "#ff00ff")
      } else {
        car.crashed = true
      }
    }
  }

  // Check powerups
  for (const pw of state.powerups) {
    if (pw.collected) continue
    const dist = Math.sqrt((car.pos.x - pw.pos.x) ** 2 + (car.pos.y - pw.pos.y) ** 2)
    if (dist < 40) {
      pw.collected = true
      car.powerupsCollected++
      applyPowerup(car, pw.type)
      emitPowerupParticles(newParticles, pw.pos, pw.type)
    }
  }

  return newParticles
}

function applyPowerup(car: CarState, type: PowerupType) {
  switch (type) {
    case "speed":
      car.speedBoost = true; car.speedBoostTimer = 6; break
    case "invincible":
      car.invincible = true; car.invincibleTimer = 6; break
    case "fuel":
      car.fuel = Math.min(100, car.fuel + 30); break
    case "points":
      car.score += 1000; break
    case "gun":
      car.hasGun = true; car.gunTimer = 10; break
    case "missile":
      car.hasMissile = true; car.missileTimer = 12; break
    case "hangtime":
      car.hangTimeBoost = true; car.hangTimeBoostTimer = 8; break
  }
}

function findNearestEnemy(state: GameState, pos: Vec2) {
  let nearest = null
  let minDist = Infinity
  for (const e of state.enemies) {
    if (!e.alive) continue
    const d = Math.abs(e.pos.x - pos.x) + Math.abs(e.pos.y - pos.y)
    if (d < minDist) { minDist = d; nearest = e }
  }
  return nearest
}

function fireProjectile(state: GameState, from: Vec2, to: Vec2, type: "bullet" | "missile") {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const len = Math.sqrt(dx * dx + dy * dy) || 1
  const speed = type === "bullet" ? 800 : 500
  state.projectiles.push({
    pos: { x: from.x, y: from.y - 5 },
    vel: { x: (dx / len) * speed, y: (dy / len) * speed },
    type,
    life: type === "bullet" ? 1 : 2,
    damage: type === "bullet" ? 1 : 3
  })
}

function updateProjectiles(state: GameState, dt: number, particles: Particle[]) {
  state.projectiles = state.projectiles.filter(p => {
    p.pos.x += p.vel.x * dt
    p.pos.y += p.vel.y * dt
    p.life -= dt

    // Missile tracking — curve toward nearest enemy
    if (p.type === "missile") {
      const nearest = findNearestEnemy(state, p.pos)
      if (nearest) {
        const dx = nearest.pos.x - p.pos.x
        const dy = nearest.pos.y - p.pos.y
        const len = Math.sqrt(dx * dx + dy * dy) || 1
        p.vel.x += (dx / len) * 400 * dt
        p.vel.y += (dy / len) * 400 * dt
      }
      // Trail particles
      particles.push({
        pos: { ...p.pos },
        vel: { x: (Math.random() - 0.5) * 50, y: (Math.random() - 0.5) * 50 },
        life: 0.3, maxLife: 0.3, color: "#ff8800", size: 2
      })
    }

    // Check hit enemies
    for (const enemy of state.enemies) {
      if (!enemy.alive) continue
      if (checkCollision(p.pos, 8, 8, enemy.pos, enemy.width, enemy.height)) {
        enemy.health -= p.damage
        if (enemy.health <= 0) {
          enemy.alive = false
          state.car.score += 300
          state.car.enemiesDestroyed++
          emitDestroyParticles(particles, enemy.pos, "#ff00ff")
        }
        p.life = 0
        return false
      }
    }

    // Check hit obstacles
    for (const obs of state.obstacles) {
      if (obs.destroyed) continue
      if (checkCollision(p.pos, 8, 8, obs.pos, obs.width, obs.height)) {
        obs.destroyed = true
        state.car.score += 100
        emitDestroyParticles(particles, obs.pos, "#ff8800")
        p.life = 0
        return false
      }
    }

    return p.life > 0
  })
}

// ─── Particle emitters ───

function emitFlipParticles(particles: Particle[], pos: Vec2) {
  for (let i = 0; i < 15; i++) {
    particles.push({
      pos: { x: pos.x, y: pos.y },
      vel: { x: (Math.random() - 0.5) * 300, y: (Math.random() - 0.5) * 300 },
      life: 1, maxLife: 1,
      color: ["#00f0ff", "#ff00ff", "#ffff00", "#00ff00"][Math.floor(Math.random() * 4)],
      size: Math.random() * 4 + 2
    })
  }
}

function emitCrashParticles(particles: Particle[], pos: Vec2) {
  for (let i = 0; i < 30; i++) {
    particles.push({
      pos: { x: pos.x, y: pos.y },
      vel: { x: (Math.random() - 0.5) * 400, y: -Math.random() * 400 },
      life: 1.5, maxLife: 1.5,
      color: ["#ff4400", "#ff8800", "#ffcc00"][Math.floor(Math.random() * 3)],
      size: Math.random() * 6 + 3
    })
  }
}

function emitDestroyParticles(particles: Particle[], pos: Vec2, color: string) {
  for (let i = 0; i < 12; i++) {
    particles.push({
      pos: { ...pos },
      vel: { x: (Math.random() - 0.5) * 300, y: -Math.random() * 300 },
      life: 0.8, maxLife: 0.8, color, size: Math.random() * 4 + 2
    })
  }
}

function emitPowerupParticles(particles: Particle[], pos: Vec2, type: PowerupType) {
  const color = getPowerupColor(type)
  for (let i = 0; i < 12; i++) {
    particles.push({
      pos: { ...pos },
      vel: { x: (Math.random() - 0.5) * 200, y: -Math.random() * 200 },
      life: 0.8, maxLife: 0.8, color, size: Math.random() * 4 + 2
    })
  }
}

export function getPowerupColor(type: PowerupType): string {
  switch (type) {
    case "speed": return "#00ff00"
    case "invincible": return "#ffff00"
    case "fuel": return "#00aaff"
    case "points": return "#ff00ff"
    case "gun": return "#ff4444"
    case "missile": return "#ff8800"
    case "hangtime": return "#8855ff"
    default:
      return "#ffffff"
  }
}

function checkCollision(
  pos1: Vec2, w1: number, h1: number,
  pos2: Vec2, w2: number, h2: number
): boolean {
  return Math.abs(pos1.x - pos2.x) < (w1 + w2) * 0.5 &&
    Math.abs(pos1.y - pos2.y) < (h1 + h2) * 0.5
}

function normalizeAngle(angle: number): number {
  while (angle > Math.PI) angle -= Math.PI * 2
  while (angle < -Math.PI) angle += Math.PI * 2
  return angle
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

export function updateParticles(particles: Particle[], dt: number): Particle[] {
  return particles.filter(p => {
    p.pos.x += p.vel.x * dt
    p.pos.y += p.vel.y * dt
    p.vel.y += 200 * dt
    p.life -= dt
    return p.life > 0
  })
}
