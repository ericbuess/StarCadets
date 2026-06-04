// Frogger — grid-based road-crossing with neon aesthetic

export interface FroggerInput {
  up: boolean
  down: boolean
  left: boolean
  right: boolean
}

interface Lane {
  y: number
  type: "safe" | "road" | "river" | "home"
  objects: LaneObject[]
  speed: number
  direction: 1 | -1
}

interface LaneObject {
  x: number
  width: number
  kind: "car" | "truck" | "log" | "lilypad"
}

export interface FroggerState {
  player: { col: number; row: number; moveCD: number; riding: boolean; deathTimer: number }
  lanes: Lane[]
  homeSlots: boolean[]
  score: number
  lives: number
  level: number
  gameOver: boolean
  paused: boolean
  time: number
  timer: number
  width: number
  height: number
}

const COLS = 15
const ROWS = 13
const MOVE_CD = 0.15
const ATTEMPT_TIME = 30
const BG = "#0a0a1a"
const CYAN = "#00f0ff"

function makeLanes(level: number): Lane[] {
  const sp = 1 + level * 0.08
  const lanes: Lane[] = []
  for (let r = 0; r < ROWS; r++) {
    if (r === 0) {
      lanes.push({ y: r, type: "home", objects: [], speed: 0, direction: 1 })
    } else if (r >= 1 && r <= 5) {
      const dir: 1 | -1 = r % 2 === 0 ? 1 : -1
      const spd = (40 + r * 12) * sp
      const objs: LaneObject[] = []
      const kind: "log" | "lilypad" = r <= 3 ? "log" : "lilypad"
      const w = kind === "log" ? 3 : 1.5
      const count = kind === "log" ? 2 : 3
      for (let i = 0; i < count; i++) {
        objs.push({ x: (i * COLS) / count + 1, width: w, kind })
      }
      lanes.push({ y: r, type: "river", objects: objs, speed: spd, direction: dir })
    } else if (r === 6) {
      lanes.push({ y: r, type: "safe", objects: [], speed: 0, direction: 1 })
    } else if (r >= 7 && r <= 11) {
      const dir: 1 | -1 = r % 2 === 0 ? 1 : -1
      const spd = (30 + (r - 6) * 15) * sp
      const kind: "car" | "truck" = r % 3 === 0 ? "truck" : "car"
      const w = kind === "truck" ? 2.5 : 1.5
      const count = kind === "truck" ? 2 : 3
      const objs: LaneObject[] = []
      for (let i = 0; i < count; i++) {
        objs.push({ x: (i * COLS) / count + 2, width: w, kind })
      }
      lanes.push({ y: r, type: "road", objects: objs, speed: spd, direction: dir })
    } else {
      lanes.push({ y: r, type: "safe", objects: [], speed: 0, direction: 1 })
    }
  }
  return lanes
}

export function createFroggerState(): FroggerState {
  return {
    player: { col: 7, row: ROWS - 1, moveCD: 0, riding: false, deathTimer: 0 },
    lanes: makeLanes(1),
    homeSlots: [false, false, false, false, false],
    score: 0, lives: 3, level: 1,
    gameOver: false, paused: false, time: 0, timer: ATTEMPT_TIME,
    width: 600, height: 400,
  }
}

function resetPlayer(state: FroggerState) {
  state.player.col = 7
  state.player.row = ROWS - 1
  state.player.moveCD = 0
  state.player.riding = false
  state.player.deathTimer = 0
  state.timer = ATTEMPT_TIME
}

function killPlayer(state: FroggerState) {
  state.player.deathTimer = 0.6
  state.lives--
  if (state.lives <= 0) state.gameOver = true
}

export function updateFrogger(state: FroggerState, dt: number, input: FroggerInput): void {
  if (state.gameOver || state.paused) return
  state.time += dt

  if (state.player.deathTimer > 0) {
    state.player.deathTimer -= dt
    if (state.player.deathTimer <= 0) resetPlayer(state)
    return
  }

  // Timer
  state.timer -= dt
  if (state.timer <= 0) { killPlayer(state); return }

  // River riding: move player WITH their log before objects move
  const preLane = state.lanes[state.player.row]
  if (preLane.type === "river") {
    const preCellW = state.width / COLS
    const prePx = state.player.col
    for (const obj of preLane.objects) {
      if (prePx + 0.5 >= obj.x && prePx - 0.5 <= obj.x + obj.width) {
        state.player.col += preLane.speed * preLane.direction * dt / preCellW
        state.player.riding = true
        break
      }
    }
  }

  // Move objects
  for (const lane of state.lanes) {
    for (const obj of lane.objects) {
      obj.x += lane.speed * lane.direction * dt / (state.width / COLS)
      if (lane.direction === 1 && obj.x > COLS + obj.width) obj.x = -obj.width
      if (lane.direction === -1 && obj.x + obj.width < 0) obj.x = COLS + obj.width
    }
  }

  // Input
  state.player.moveCD -= dt
  if (state.player.moveCD <= 0) {
    let moved = false
    if (input.up && state.player.row > 0) { state.player.row--; moved = true }
    else if (input.down && state.player.row < ROWS - 1) { state.player.row++; moved = true }
    else if (input.left && state.player.col > 0) { state.player.col--; moved = true }
    else if (input.right && state.player.col < COLS - 1) { state.player.col++; moved = true }
    if (moved) {
      state.player.moveCD = MOVE_CD
      if (input.up) state.score += 10
    }
  }

  const lane = state.lanes[state.player.row]
  const px = state.player.col

  // Home row
  if (lane.type === "home") {
    const slotPositions = [1, 4, 7, 10, 13]
    let landed = false
    for (let i = 0; i < 5; i++) {
      if (Math.abs(px - slotPositions[i]) <= 1.0 && !state.homeSlots[i]) {
        state.homeSlots[i] = true
        state.score += 50 + Math.floor(state.timer) * 2
        landed = true
        resetPlayer(state)
        break
      }
    }
    if (!landed) killPlayer(state)
    if (state.homeSlots.every(Boolean)) {
      state.level++
      state.homeSlots.fill(false)
      state.lanes = makeLanes(state.level)
      state.score += 200
      resetPlayer(state)
    }
    return
  }

  // River collision — drift already applied above (before objects move)
  if (lane.type === "river") {
    let onObj = false
    for (const obj of lane.objects) {
      if (px + 0.5 >= obj.x && px - 0.5 <= obj.x + obj.width) {
        onObj = true
        break
      }
    }
    if (!onObj) { state.player.riding = false; killPlayer(state) }
    if (state.player.col < -1 || state.player.col > COLS) killPlayer(state)
    return
  }

  state.player.riding = false

  // Road collision
  if (lane.type === "road") {
    for (const obj of lane.objects) {
      if (px + 0.5 >= obj.x && px - 0.5 <= obj.x + obj.width) {
        killPlayer(state)
        return
      }
    }
  }
}

const OBJ_COLORS: Record<string, [string, string]> = {
  car: ["#ff2244", "#ff3333"], truck: ["#ff6600", "#ff8800"],
  log: ["#22aa44", "#00ff44"], lilypad: ["#00cc66", "#00ff88"],
}

function glowRect(ctx: CanvasRenderingContext2D, fill: string, glow: string, x: number, y: number, w: number, h: number) {
  ctx.shadowColor = glow; ctx.shadowBlur = 8; ctx.fillStyle = fill
  ctx.fillRect(x, y, w, h); ctx.shadowBlur = 0
}

export function renderFrogger(ctx: CanvasRenderingContext2D, state: FroggerState, w: number, h: number): void {
  const dpr = window.devicePixelRatio || 1
  ctx.save()
  ctx.scale(dpr, dpr)
  const cw = w / dpr, ch = h / dpr, cellW = cw / COLS, cellH = ch / ROWS

  ctx.fillStyle = BG
  ctx.fillRect(0, 0, cw, ch)

  for (const lane of state.lanes) {
    const ly = lane.y * cellH
    if (lane.type === "river") {
      ctx.fillStyle = "#0a1a3a"; ctx.fillRect(0, ly, cw, cellH)
      ctx.shadowColor = "#0055aa"; ctx.shadowBlur = 6
      ctx.fillStyle = "rgba(0,80,180,0.15)"; ctx.fillRect(0, ly, cw, cellH)
      ctx.shadowBlur = 0
    } else if (lane.type === "road") {
      ctx.fillStyle = "#1a1a2a"; ctx.fillRect(0, ly, cw, cellH)
      ctx.strokeStyle = "rgba(255,255,255,0.1)"
      ctx.setLineDash([cellW * 0.3, cellW * 0.5])
      ctx.beginPath(); ctx.moveTo(0, ly + cellH / 2); ctx.lineTo(cw, ly + cellH / 2)
      ctx.stroke(); ctx.setLineDash([])
    } else if (lane.type === "home") {
      ctx.fillStyle = "#0a2a1a"; ctx.fillRect(0, ly, cw, cellH)
      for (let i = 0; i < 5; i++) {
        const sx = [1, 4, 7, 10, 13][i] * cellW, filled = state.homeSlots[i]
        ctx.fillStyle = filled ? "#00ff88" : "rgba(0,240,255,0.2)"
        ctx.shadowColor = filled ? "#00ff88" : CYAN; ctx.shadowBlur = filled ? 10 : 4
        ctx.fillRect(sx - cellW * 0.4, ly + 2, cellW * 0.8, cellH - 4); ctx.shadowBlur = 0
      }
    }
    for (const obj of lane.objects) {
      const ox = obj.x * cellW, ow = obj.width * cellW, oy = lane.y * cellH + 2, oh = cellH - 4
      const [fill, glow] = OBJ_COLORS[obj.kind]
      if (obj.kind === "lilypad") {
        ctx.shadowColor = glow; ctx.shadowBlur = 6; ctx.fillStyle = fill
        ctx.beginPath(); ctx.ellipse(ox + ow / 2, oy + oh / 2, ow / 2, oh / 2, 0, 0, Math.PI * 2)
        ctx.fill(); ctx.shadowBlur = 0
      } else glowRect(ctx, fill, glow, ox, oy, ow, oh)
    }
  }

  // Player
  if (state.player.deathTimer <= 0) {
    const px = state.player.col * cellW + cellW / 2, py = state.player.row * cellH + cellH / 2
    ctx.shadowColor = CYAN; ctx.shadowBlur = 12; ctx.fillStyle = CYAN
    ctx.beginPath(); ctx.arc(px, py, cellW * 0.35, 0, Math.PI * 2); ctx.fill()
    ctx.shadowBlur = 0; ctx.fillStyle = BG; ctx.beginPath()
    ctx.arc(px - 3, py - 2, 2, 0, Math.PI * 2); ctx.arc(px + 3, py - 2, 2, 0, Math.PI * 2)
    ctx.fill()
  }

  // HUD
  ctx.shadowBlur = 0; ctx.font = "bold 14px monospace"; ctx.fillStyle = CYAN
  ctx.textAlign = "left"; ctx.fillText(`SCORE ${state.score}`, 8, 16)
  ctx.textAlign = "center"; ctx.fillText(`LVL ${state.level}`, cw / 2, 16)
  ctx.textAlign = "right"; ctx.fillStyle = "#ff3366"
  ctx.fillText("\u2665".repeat(state.lives), cw - 8, 16)
  const tPct = Math.max(0, state.timer / ATTEMPT_TIME)
  ctx.fillStyle = "rgba(0,240,255,0.15)"; ctx.fillRect(0, ch - 4, cw, 4)
  ctx.fillStyle = tPct > 0.25 ? CYAN : "#ff3333"
  ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 4
  ctx.fillRect(0, ch - 4, cw * tPct, 4); ctx.shadowBlur = 0

  if (state.gameOver) {
    ctx.fillStyle = "rgba(10,10,26,0.85)"; ctx.fillRect(0, 0, cw, ch)
    ctx.fillStyle = CYAN; ctx.shadowColor = CYAN; ctx.shadowBlur = 16
    ctx.font = "bold 28px monospace"; ctx.textAlign = "center"
    ctx.fillText("GAME OVER", cw / 2, ch / 2 - 20)
    ctx.font = "bold 18px monospace"; ctx.fillText(`SCORE: ${state.score}`, cw / 2, ch / 2 + 14)
    ctx.shadowBlur = 0; ctx.font = "14px monospace"; ctx.fillStyle = "rgba(0,240,255,0.6)"
    ctx.fillText("TAP TO CONTINUE", cw / 2, ch / 2 + 44)
  }
  ctx.restore()
}
