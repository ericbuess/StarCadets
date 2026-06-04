import type { GameState, Vec2, Powerup, Enemy, Obstacle, PowerupType } from "./types"
import { getPowerupColor } from "./physics"
import { musicPlayer } from "./music"

const GLOW_COLOR = "#00f0ff"
const GLOW_COLOR_ALT = "#ff00ff"
const BG_COLOR = "#0a0a1a"

export function renderGame(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  canvasWidth: number,
  canvasHeight: number,
  leftPressed: boolean,
  rightPressed: boolean
) {
  const { car, terrain, obstacles, enemies, powerups, particles, projectiles, camera } = state

  ctx.fillStyle = BG_COLOR
  ctx.fillRect(0, 0, canvasWidth, canvasHeight)

  // Stars background
  ctx.save()
  const starSeed = 42
  for (let i = 0; i < 80; i++) {
    const sx = ((starSeed * (i + 1) * 7919) % canvasWidth + camera.x * 0.05 * (i % 3 + 1)) % canvasWidth
    const sy = ((starSeed * (i + 1) * 104729) % (canvasHeight * 0.6))
    const brightness = 0.3 + (i % 5) * 0.15
    ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`
    ctx.fillRect(sx, sy, 1.5, 1.5)
  }
  ctx.restore()

  ctx.save()
  ctx.translate(-camera.x + canvasWidth * 0.3, -camera.y + canvasHeight * 0.6)

  // Terrain
  for (const seg of terrain) {
    if (seg.disappeared) continue
    const pts = seg.points
    if (pts.length < 2) continue
    const segEnd = pts[pts.length - 1].x
    if (segEnd < camera.x - 200 || pts[0].x > camera.x + canvasWidth + 200) continue

    ctx.save()
    if (seg.isDisappearing) {
      const alpha = seg.disappearTimer !== undefined ? Math.max(0, seg.disappearTimer / 3) : 1
      ctx.globalAlpha = alpha * (0.5 + Math.sin(state.time * 10) * 0.5)
    }

    ctx.beginPath()
    ctx.moveTo(pts[0].x, pts[0].y)
    for (let i = 1; i < pts.length; i++) {
      if (pts[i].y > 700 || pts[i - 1].y > 700) { ctx.moveTo(pts[i].x, pts[i].y); continue }
      ctx.lineTo(pts[i].x, pts[i].y)
    }

    ctx.strokeStyle = seg.type === "disappearing" ? "#ff4400" : GLOW_COLOR
    ctx.lineWidth = 12
    ctx.shadowColor = seg.type === "disappearing" ? "#ff4400" : GLOW_COLOR
    ctx.shadowBlur = 20
    ctx.stroke()
    ctx.strokeStyle = "#ffffff"
    ctx.lineWidth = 3
    ctx.shadowBlur = 10
    ctx.stroke()
    ctx.shadowBlur = 0
    ctx.restore()
  }

  // Obstacles
  for (const obs of obstacles) {
    if (obs.destroyed) continue
    if (obs.pos.x < camera.x - 200 || obs.pos.x > camera.x + canvasWidth + 200) continue
    renderObstacle(ctx, obs)
  }

  // Enemies
  for (const enemy of enemies) {
    if (!enemy.alive) continue
    if (enemy.pos.x < camera.x - 200 || enemy.pos.x > camera.x + canvasWidth + 200) continue
    renderEnemy(ctx, enemy, state.time)
  }

  // Powerups
  for (const pw of powerups) {
    if (pw.collected) continue
    if (pw.pos.x < camera.x - 200 || pw.pos.x > camera.x + canvasWidth + 200) continue
    renderPowerup(ctx, pw, state.time)
  }

  // Projectiles
  for (const proj of projectiles) {
    ctx.save()
    ctx.translate(proj.pos.x, proj.pos.y)
    if (proj.type === "bullet") {
      ctx.fillStyle = "#ff4444"
      ctx.shadowColor = "#ff4444"
      ctx.shadowBlur = 8
      ctx.fillRect(-4, -2, 8, 4)
    } else {
      ctx.fillStyle = "#ff8800"
      ctx.shadowColor = "#ff8800"
      ctx.shadowBlur = 12
      const angle = Math.atan2(proj.vel.y, proj.vel.x)
      ctx.rotate(angle)
      ctx.beginPath()
      ctx.moveTo(8, 0)
      ctx.lineTo(-6, -4)
      ctx.lineTo(-3, 0)
      ctx.lineTo(-6, 4)
      ctx.closePath()
      ctx.fill()
    }
    ctx.restore()
  }

  // Ghost
  if (state.bestGhostFrames.length > 0) {
    const ghostFrame = findNearestGhostFrame(state.bestGhostFrames, state.time)
    if (ghostFrame) {
      ctx.save()
      ctx.globalAlpha = 0.3
      ctx.translate(ghostFrame.pos.x, ghostFrame.pos.y)
      ctx.rotate(ghostFrame.angle)
      ctx.fillStyle = "#ffffff"
      ctx.shadowColor = "#ffffff"
      ctx.shadowBlur = 10
      ctx.fillRect(-car.width / 2, -car.height / 2, car.width, car.height)
      ctx.restore()
    }
  }

  // Car
  renderCar(ctx, state)

  // Particles
  for (const p of particles) {
    const alpha = p.life / p.maxLife
    ctx.save()
    ctx.globalAlpha = alpha
    ctx.fillStyle = p.color
    ctx.shadowColor = p.color
    ctx.shadowBlur = 8
    ctx.fillRect(p.pos.x - p.size / 2, p.pos.y - p.size / 2, p.size, p.size)
    ctx.restore()
  }

  ctx.restore()

  // HUD
  renderHUD(ctx, state, canvasWidth, canvasHeight, leftPressed, rightPressed)
}

function renderCar(ctx: CanvasRenderingContext2D, state: GameState) {
  const { car } = state
  const v = car.vehicle

  ctx.save()
  ctx.translate(car.pos.x, car.pos.y)
  ctx.rotate(car.angle)

  // Glow based on active powerups
  if (car.invincible) { ctx.shadowColor = "#ffff00"; ctx.shadowBlur = 30 }
  else if (car.speedBoost) { ctx.shadowColor = "#00ff00"; ctx.shadowBlur = 20 }
  else if (car.hangTimeBoost) { ctx.shadowColor = "#8855ff"; ctx.shadowBlur = 20 }
  else { ctx.shadowColor = v.color; ctx.shadowBlur = 15 }

  const bodyColor = car.invincible
    ? `hsl(${(state.time * 200) % 360}, 100%, 60%)`
    : car.speedBoost ? "#00ff88" : v.color

  // Draw vehicle body — proper side-view car silhouettes
  const w = car.width, h = car.height
  const hw = w / 2, hh = h / 2
  ctx.fillStyle = bodyColor

  switch (v.shape) {
    case "sedan": {
      ctx.beginPath()
      ctx.moveTo(-hw, hh)
      ctx.lineTo(-hw, -hh * 0.2)
      ctx.lineTo(-hw * 0.4, -hh * 0.2)
      ctx.lineTo(-hw * 0.25, -hh * 1.1)
      ctx.lineTo(hw * 0.3, -hh * 1.1)
      ctx.lineTo(hw * 0.5, -hh * 0.2)
      ctx.lineTo(hw, -hh * 0.2)
      ctx.lineTo(hw + 3, hh * 0.4)
      ctx.lineTo(hw, hh)
      ctx.closePath()
      ctx.fill()
      ctx.fillStyle = "rgba(100,200,255,0.3)"
      ctx.beginPath()
      ctx.moveTo(-hw * 0.35, -hh * 0.2)
      ctx.lineTo(-hw * 0.2, -hh)
      ctx.lineTo(hw * 0.25, -hh)
      ctx.lineTo(hw * 0.45, -hh * 0.2)
      ctx.closePath()
      ctx.fill()
      break
    }
    case "sports": {
      ctx.beginPath()
      ctx.moveTo(-hw - 2, hh)
      ctx.lineTo(-hw, -hh * 0.1)
      ctx.lineTo(-hw * 0.2, -hh * 0.1)
      ctx.lineTo(-hw * 0.05, -hh * 0.9)
      ctx.lineTo(hw * 0.35, -hh * 0.9)
      ctx.lineTo(hw * 0.55, -hh * 0.1)
      ctx.lineTo(hw + 5, -hh * 0.1)
      ctx.lineTo(hw + 5, hh * 0.3)
      ctx.lineTo(hw, hh)
      ctx.closePath()
      ctx.fill()
      ctx.fillStyle = v.accentColor
      ctx.fillRect(-hw * 0.6, hh * 0.2, w * 0.15, hh * 0.4)
      ctx.fillStyle = "rgba(100,200,255,0.35)"
      ctx.beginPath()
      ctx.moveTo(-hw * 0.15, -hh * 0.1)
      ctx.lineTo(0, -hh * 0.8)
      ctx.lineTo(hw * 0.3, -hh * 0.8)
      ctx.lineTo(hw * 0.5, -hh * 0.1)
      ctx.closePath()
      ctx.fill()
      break
    }
    case "muscle": {
      ctx.beginPath()
      ctx.moveTo(-hw - 3, hh)
      ctx.lineTo(-hw, -hh * 0.3)
      ctx.lineTo(-hw * 0.35, -hh * 0.3)
      ctx.lineTo(-hw * 0.25, -hh * 1.0)
      ctx.lineTo(hw * 0.2, -hh * 1.0)
      ctx.lineTo(hw * 0.4, -hh * 0.3)
      ctx.lineTo(hw + 4, -hh * 0.3)
      ctx.lineTo(hw + 4, hh * 0.3)
      ctx.lineTo(hw, hh)
      ctx.closePath()
      ctx.fill()
      ctx.fillStyle = v.accentColor
      ctx.beginPath()
      ctx.moveTo(hw + 4, -hh * 0.3)
      ctx.lineTo(hw + 7, -hh * 0.5)
      ctx.lineTo(hw + 7, hh * 0.1)
      ctx.lineTo(hw + 4, hh * 0.3)
      ctx.closePath()
      ctx.fill()
      ctx.fillStyle = "rgba(100,200,255,0.3)"
      ctx.beginPath()
      ctx.moveTo(-hw * 0.3, -hh * 0.3)
      ctx.lineTo(-hw * 0.2, -hh * 0.9)
      ctx.lineTo(hw * 0.15, -hh * 0.9)
      ctx.lineTo(hw * 0.35, -hh * 0.3)
      ctx.closePath()
      ctx.fill()
      break
    }
    case "truck": {
      ctx.beginPath()
      ctx.moveTo(-hw - 2, hh + 4)
      ctx.lineTo(-hw, -hh * 0.5)
      ctx.lineTo(-hw * 0.3, -hh * 0.5)
      ctx.lineTo(-hw * 0.15, -hh * 1.4)
      ctx.lineTo(hw * 0.3, -hh * 1.4)
      ctx.lineTo(hw * 0.4, -hh * 0.5)
      ctx.lineTo(hw + 2, -hh * 0.5)
      ctx.lineTo(hw + 2, hh + 4)
      ctx.closePath()
      ctx.fill()
      ctx.fillStyle = v.accentColor
      ctx.fillRect(-hw * 0.5, hh * 0.2, hw, hh * 0.6)
      ctx.fillStyle = "rgba(100,200,255,0.3)"
      ctx.beginPath()
      ctx.moveTo(-hw * 0.25, -hh * 0.5)
      ctx.lineTo(-hw * 0.1, -hh * 1.2)
      ctx.lineTo(hw * 0.25, -hh * 1.2)
      ctx.lineTo(hw * 0.35, -hh * 0.5)
      ctx.closePath()
      ctx.fill()
      break
    }
    case "futuristic": {
      ctx.beginPath()
      ctx.moveTo(-hw, hh * 0.6)
      ctx.lineTo(-hw + 3, -hh * 0.1)
      ctx.lineTo(-hw * 0.1, -hh * 0.6)
      ctx.lineTo(hw * 0.2, -hh * 0.6)
      ctx.lineTo(hw + 8, -hh * 0.1)
      ctx.lineTo(hw + 8, hh * 0.3)
      ctx.lineTo(hw, hh * 0.6)
      ctx.closePath()
      ctx.fill()
      ctx.fillStyle = v.accentColor
      ctx.beginPath()
      ctx.moveTo(-hw - 5, hh * 0.1)
      ctx.lineTo(-hw, -hh * 0.1)
      ctx.lineTo(-hw, hh * 0.6)
      ctx.lineTo(-hw - 5, hh * 0.6)
      ctx.closePath()
      ctx.fill()
      ctx.fillStyle = "rgba(100,255,200,0.4)"
      ctx.beginPath()
      ctx.moveTo(-hw * 0.05, -hh * 0.1)
      ctx.lineTo(0, -hh * 0.5)
      ctx.lineTo(hw * 0.15, -hh * 0.5)
      ctx.lineTo(hw + 5, -hh * 0.1)
      ctx.closePath()
      ctx.fill()
      break
    }
  }

  // Headlight
  ctx.fillStyle = "#ffffff"
  ctx.shadowColor = "#ffffff"
  ctx.shadowBlur = 10
  ctx.fillRect(car.width / 2 - 4, -car.height * 0.2, 4, car.height * 0.4)
  // Tail light
  ctx.fillStyle = "#ff0000"
  ctx.shadowColor = "#ff0000"
  ctx.shadowBlur = 8
  ctx.fillRect(-car.width / 2, -car.height * 0.2, 3, car.height * 0.4)
  ctx.shadowBlur = 0

  // Wheels
  const wheelY = car.height / 2 + 3
  const wheelR = v.shape === "truck" ? 11 : v.shape === "futuristic" ? 6 : 8
  ctx.fillStyle = "#222222"
  ctx.strokeStyle = "#555555"
  ctx.lineWidth = 2
  ctx.beginPath(); ctx.arc(car.wheelBase * 0.4, wheelY, wheelR, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
  ctx.beginPath(); ctx.arc(-car.wheelBase * 0.4, wheelY, wheelR, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
  // Hubcaps
  ctx.fillStyle = "#444444"
  ctx.beginPath(); ctx.arc(car.wheelBase * 0.4, wheelY, wheelR * 0.4, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.arc(-car.wheelBase * 0.4, wheelY, wheelR * 0.4, 0, Math.PI * 2); ctx.fill()

  // Speed boost flames
  if (car.speedBoost) {
    for (let i = 0; i < 3; i++) {
      const flameLen = 10 + Math.random() * 20
      ctx.fillStyle = ["#ff4400", "#ff8800", "#ffcc00"][i]
      ctx.globalAlpha = 0.8
      ctx.beginPath()
      ctx.moveTo(-car.width / 2, -car.height * 0.3 + i * 5)
      ctx.lineTo(-car.width / 2 - flameLen, 0)
      ctx.lineTo(-car.width / 2, car.height * 0.3 - i * 5)
      ctx.fill()
    }
    ctx.globalAlpha = 1
  }

  // Gun indicator
  if (car.hasGun) {
    ctx.fillStyle = "#ff4444"
    ctx.shadowColor = "#ff4444"
    ctx.shadowBlur = 6
    ctx.fillRect(car.width / 2 - 2, -car.height * 0.15, 12, 3)
    ctx.shadowBlur = 0
  }
  // Missile indicator
  if (car.hasMissile) {
    ctx.fillStyle = "#ff8800"
    ctx.shadowColor = "#ff8800"
    ctx.shadowBlur = 6
    ctx.beginPath()
    ctx.moveTo(car.width / 2 + 10, -car.height * 0.4)
    ctx.lineTo(car.width / 2 + 2, -car.height * 0.5)
    ctx.lineTo(car.width / 2 + 2, -car.height * 0.3)
    ctx.fill()
    ctx.shadowBlur = 0
  }

  // Hang time aura
  if (car.hangTimeBoost && !car.onGround) {
    ctx.strokeStyle = "rgba(136,85,255,0.4)"
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(0, 0, car.width * 0.6 + Math.sin(state.time * 6) * 5, 0, Math.PI * 2)
    ctx.stroke()
  }

  ctx.restore()
}

function renderObstacle(ctx: CanvasRenderingContext2D, obs: Obstacle) {
  ctx.save()
  ctx.translate(obs.pos.x, obs.pos.y)
  ctx.fillStyle = obs.type === "rock" ? "#665544" : "#cc4444"
  ctx.shadowColor = obs.type === "rock" ? "#886655" : "#ff4444"
  ctx.shadowBlur = 10
  if (obs.type === "rock") {
    ctx.beginPath()
    ctx.moveTo(0, -obs.height / 2)
    ctx.lineTo(obs.width / 2, obs.height / 4)
    ctx.lineTo(obs.width / 3, obs.height / 2)
    ctx.lineTo(-obs.width / 3, obs.height / 2)
    ctx.lineTo(-obs.width / 2, obs.height / 4)
    ctx.closePath()
    ctx.fill()
  } else {
    ctx.fillRect(-obs.width / 2, -obs.height / 2, obs.width, obs.height)
    ctx.fillStyle = "#ffcc00"
    for (let i = 0; i < 3; i++) ctx.fillRect(-obs.width / 2 + 2, -obs.height / 2 + i * 8 + 2, obs.width - 4, 3)
  }
  ctx.restore()
}

function renderEnemy(ctx: CanvasRenderingContext2D, enemy: Enemy, time: number) {
  ctx.save()
  ctx.translate(enemy.pos.x, enemy.pos.y)
  if (enemy.type === "roller") {
    ctx.rotate(time * 3)
    ctx.fillStyle = "#ff00ff"
    ctx.shadowColor = GLOW_COLOR_ALT
    ctx.shadowBlur = 15
    ctx.beginPath()
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2
      const r = i % 2 === 0 ? enemy.width / 2 : enemy.width / 3
      ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r)
    }
    ctx.closePath()
    ctx.fill()
  } else {
    ctx.translate(0, Math.sin(time * 5) * 10)
    ctx.fillStyle = "#ff4444"
    ctx.shadowColor = "#ff4444"
    ctx.shadowBlur = 12
    ctx.beginPath()
    ctx.arc(0, 0, enemy.width / 2, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(-6, -5, 5, 5)
    ctx.fillRect(2, -5, 5, 5)
    ctx.fillStyle = "#000000"
    ctx.fillRect(-4, -3, 2, 2)
    ctx.fillRect(4, -3, 2, 2)
  }
  // Health bar for enemies with health > 1
  if (enemy.health > 1) {
    ctx.shadowBlur = 0
    ctx.fillStyle = "rgba(255,0,0,0.6)"
    ctx.fillRect(-12, -enemy.height / 2 - 8, 24, 4)
    ctx.fillStyle = "#00ff00"
    ctx.fillRect(-12, -enemy.height / 2 - 8, 24 * (enemy.health / 3), 4)
  }
  ctx.restore()
}

function renderPowerup(ctx: CanvasRenderingContext2D, pw: Powerup, time: number) {
  const bobY = Math.sin(time * 3 + pw.bobOffset) * 8
  ctx.save()
  ctx.translate(pw.pos.x, pw.pos.y + bobY)
  ctx.rotate(time * 2)

  const color = getPowerupColor(pw.type)
  ctx.fillStyle = color
  ctx.shadowColor = color
  ctx.shadowBlur = 15

  const size = 12
  ctx.beginPath()
  ctx.moveTo(0, -size)
  ctx.lineTo(size, 0)
  ctx.lineTo(0, size)
  ctx.lineTo(-size, 0)
  ctx.closePath()
  ctx.fill()

  ctx.fillStyle = "#ffffff"
  ctx.font = `bold 10px monospace`
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.rotate(-time * 2)
  ctx.fillText(getPowerupIcon(pw.type), 0, 0)
  ctx.restore()
}

function getPowerupIcon(type: PowerupType): string {
  switch (type) {
    case "speed": return "S"
    case "invincible": return "I"
    case "fuel": return "F"
    case "points": return "P"
    case "gun": return "G"
    case "missile": return "M"
    case "hangtime": return "H"
    default:
      return "?"
  }
}

function renderHUD(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  w: number,
  h: number,
  leftPressed: boolean,
  rightPressed: boolean
) {
  const { car } = state
  const dpr = window.devicePixelRatio || 1

  ctx.save()

  // Score
  ctx.fillStyle = "#ffffff"
  ctx.font = `bold ${20 * dpr}px monospace`
  ctx.textAlign = "left"
  ctx.shadowColor = GLOW_COLOR
  ctx.shadowBlur = 10
  ctx.fillText(`Score: ${Math.floor(car.score)}`, 20 * dpr, 40 * dpr)

  // Distance
  ctx.font = `${14 * dpr}px monospace`
  ctx.fillStyle = "#aaaaaa"
  ctx.fillText(`${Math.floor(car.distance)}m`, 20 * dpr, 62 * dpr)

  // Vehicle name
  ctx.font = `${11 * dpr}px monospace`
  ctx.fillStyle = car.vehicle.color
  ctx.fillText(car.vehicle.name, 20 * dpr, 80 * dpr)

  // Combo
  if (car.combo > 0) {
    ctx.fillStyle = "#ffff00"
    ctx.font = `bold ${18 * dpr}px monospace`
    ctx.shadowColor = "#ffff00"
    ctx.fillText(`${car.combo}x COMBO!`, 20 * dpr, 102 * dpr)
  }

  // ─── GOAL DISPLAY (center top) ───
  const goal = state.currentGoal
  if (goal && !goal.completed && !goal.failed) {
    const gx = w / 2
    const gy = 20 * dpr

    // Goal background
    ctx.fillStyle = "rgba(0,0,0,0.6)"
    const goalW = 280 * dpr
    ctx.beginPath()
    ctx.roundRect(gx - goalW / 2, gy - 5 * dpr, goalW, 55 * dpr, 8 * dpr)
    ctx.fill()

    // Goal label
    ctx.fillStyle = "#ffcc00"
    ctx.font = `bold ${13 * dpr}px monospace`
    ctx.textAlign = "center"
    ctx.shadowColor = "#ffcc00"
    ctx.shadowBlur = 6
    ctx.fillText(goal.label, gx, gy + 12 * dpr)

    // Goal description + progress
    ctx.fillStyle = "#ffffff"
    ctx.font = `${12 * dpr}px monospace`
    ctx.shadowBlur = 0
    ctx.fillText(`${goal.description}`, gx, gy + 28 * dpr)

    // Progress bar
    const barW = 200 * dpr
    const barH = 6 * dpr
    const barX = gx - barW / 2
    const barY = gy + 34 * dpr
    ctx.fillStyle = "rgba(255,255,255,0.15)"
    ctx.fillRect(barX, barY, barW, barH)
    const progress = Math.min(1, goal.current / goal.target)
    ctx.fillStyle = progress >= 1 ? "#00ff00" : GLOW_COLOR
    ctx.shadowColor = progress >= 1 ? "#00ff00" : GLOW_COLOR
    ctx.shadowBlur = 6
    ctx.fillRect(barX, barY, barW * progress, barH)

    // Timer — turns red when low
    const timerColor = goal.timeRemaining < 10 ? "#ff4444" : goal.timeRemaining < 20 ? "#ffcc00" : "#ffffff"
    ctx.fillStyle = timerColor
    ctx.font = `bold ${14 * dpr}px monospace`
    ctx.shadowColor = timerColor
    ctx.shadowBlur = goal.timeRemaining < 10 ? 10 : 0
    ctx.fillText(`${Math.ceil(goal.timeRemaining)}s`, gx + goalW / 2 - 25 * dpr, gy + 12 * dpr)

    // Progress fraction
    ctx.fillStyle = "#aaaaaa"
    ctx.font = `${10 * dpr}px monospace`
    ctx.shadowBlur = 0
    ctx.fillText(`${Math.floor(goal.current)} / ${goal.target}`, gx, gy + 48 * dpr)
  } else if (goal && goal.completed) {
    ctx.fillStyle = "#00ff00"
    ctx.font = `bold ${16 * dpr}px monospace`
    ctx.textAlign = "center"
    ctx.shadowColor = "#00ff00"
    ctx.shadowBlur = 15
    ctx.fillText("GOAL COMPLETE!", w / 2, 35 * dpr)
  }

  ctx.shadowBlur = 0

  // ─── Active powerup indicators (right side) ───
  let rightY = 35 * dpr
  const indicators: { label: string; timer: number; color: string }[] = []
  if (car.invincible) indicators.push({ label: "SHIELD", timer: car.invincibleTimer, color: "#ffff00" })
  if (car.speedBoost) indicators.push({ label: "BOOST", timer: car.speedBoostTimer, color: "#00ff00" })
  if (car.hangTimeBoost) indicators.push({ label: "HANG TIME", timer: car.hangTimeBoostTimer, color: "#8855ff" })
  if (car.hasGun) indicators.push({ label: "GUN", timer: car.gunTimer, color: "#ff4444" })
  if (car.hasMissile) indicators.push({ label: "MISSILE", timer: car.missileTimer, color: "#ff8800" })

  for (const ind of indicators) {
    ctx.fillStyle = ind.color
    ctx.font = `bold ${12 * dpr}px monospace`
    ctx.textAlign = "right"
    ctx.fillText(`${ind.label} ${ind.timer.toFixed(1)}s`, w - 15 * dpr, rightY)
    rightY += 18 * dpr
  }

  // ─── Music indicator (bottom right, above touch labels) ───
  if (musicPlayer.isPlaying) {
    ctx.fillStyle = "rgba(255,255,255,0.3)"
    ctx.font = `${10 * dpr}px monospace`
    ctx.textAlign = "right"
    ctx.fillText(`♪ ${musicPlayer.trackName}`, w - 15 * dpr, h - 50 * dpr)
  }

  // ─── Touch zone indicators ───
  ctx.fillStyle = leftPressed ? "rgba(255, 100, 100, 0.12)" : "rgba(255, 100, 100, 0.05)"
  ctx.fillRect(0, 0, w / 2, h)
  ctx.fillStyle = rightPressed ? "rgba(100, 255, 100, 0.12)" : "rgba(100, 255, 100, 0.05)"
  ctx.fillRect(w / 2, 0, w / 2, h)

  ctx.font = `${12 * dpr}px monospace`
  ctx.textAlign = "center"
  ctx.fillStyle = "rgba(255,255,255,0.12)"
  ctx.fillText("← BRAKE / FLIP BACK", w * 0.25, h - 20 * dpr)
  ctx.fillText("GO / FLIP FORWARD →", w * 0.75, h - 20 * dpr)

  // ─── Crash overlay ───
  if (car.crashed) {
    ctx.fillStyle = "rgba(255, 0, 0, 0.3)"
    ctx.fillRect(0, 0, w, h)

    ctx.fillStyle = "#ffffff"
    ctx.font = `bold ${36 * dpr}px monospace`
    ctx.textAlign = "center"
    ctx.shadowColor = "#ff0000"
    ctx.shadowBlur = 20
    ctx.fillText("CRASHED!", w / 2, h / 2 - 40 * dpr)

    ctx.font = `${18 * dpr}px monospace`
    ctx.fillStyle = "#cccccc"
    ctx.shadowBlur = 0
    ctx.fillText(`Score: ${Math.floor(car.score)}`, w / 2, h / 2 + 10 * dpr)
    ctx.fillText(`Distance: ${Math.floor(car.distance)}m`, w / 2, h / 2 + 40 * dpr)

    ctx.fillStyle = GLOW_COLOR
    ctx.font = `bold ${20 * dpr}px monospace`
    ctx.fillText("TAP TO CONTINUE", w / 2, h / 2 + 90 * dpr)
    ctx.font = `${14 * dpr}px monospace`
    ctx.fillStyle = "#aaaaaa"
    ctx.fillText("(Pass a lesson to resume!)", w / 2, h / 2 + 115 * dpr)
  }

  ctx.restore()
}

function findNearestGhostFrame(frames: { time: number; pos: Vec2; angle: number }[], time: number) {
  if (frames.length === 0) return null
  let closest = frames[0]
  let minDiff = Math.abs(frames[0].time - time)
  for (const f of frames) {
    const diff = Math.abs(f.time - time)
    if (diff < minDiff) { minDiff = diff; closest = f }
  }
  return closest
}
