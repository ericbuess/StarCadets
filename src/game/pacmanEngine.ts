// Pac-Man — classic maze game with ghosts and power pellets

export type PacmanInput = { up: boolean; down: boolean; left: boolean; right: boolean }

type Dir = 0 | 1 | 2 | 3 // 0=right,1=down,2=left,3=up
const DX = [1, 0, -1, 0]
const DY = [0, 1, 0, -1]

interface Ghost {
  x: number; y: number; dir: Dir; speed: number
  mode: "pen" | "chase" | "frightened" | "eaten"
  color: string; penTimer: number; frightenTimer: number; eatenTimer: number
}

export interface PacmanState {
  player: { x: number; y: number; dir: Dir; nextDir: Dir; mouthAngle: number; mouthOpen: boolean }
  ghosts: Ghost[]
  maze: number[][] // 1=wall, 0=path
  dots: boolean[][]
  powerPellets: { r: number; c: number; active: boolean }[]
  score: number; lives: number; level: number
  gameOver: boolean; paused: boolean; time: number
  width: number; height: number
  dotsLeft: number; deathTimer: number
}

// 15 cols x 13 rows: 1=wall, 0=path, 2=ghost pen
const MAZE_TEMPLATE = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,1,0,0,0,0,0,0,1],
  [1,0,1,1,0,1,0,1,0,1,0,1,1,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,1,1,0,1,0,1,0,1,0,1,1,0,1],
  [1,0,0,0,0,1,2,2,2,1,0,0,0,0,1],
  [1,1,1,1,0,1,2,2,2,1,0,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,1,1,0,1,0,1,0,1,0,1,1,0,1],
  [1,0,0,1,0,0,0,0,0,0,0,1,0,0,1],
  [1,0,1,1,0,1,0,1,0,1,0,1,1,0,1],
  [1,0,0,0,0,0,0,1,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
]
const ROWS = MAZE_TEMPLATE.length
const COLS = MAZE_TEMPLATE[0].length
const GHOST_COLORS = ["#ff2020", "#ffb8ff", "#00f0ff", "#ffb852"]
const PELLET_POS = [[1, 1], [1, 13], [11, 1], [11, 13]] as const

function cloneMaze(): number[][] { return MAZE_TEMPLATE.map(r => [...r]) }

function initDots(maze: number[][]): { dots: boolean[][]; count: number } {
  const dots = maze.map(r => r.map(() => false))
  let count = 0
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      if (maze[r][c] === 0) { dots[r][c] = true; count++ }
  // remove pellet positions and player start from dots
  for (const [pr, pc] of PELLET_POS) dots[pr][pc] = false, count--
  dots[7][7] = false; count-- // player start
  return { dots, count }
}

function makeGhost(i: number): Ghost {
  return {
    x: 6 + i, y: 5.5, dir: 0, speed: 2.5,
    color: GHOST_COLORS[i], mode: "pen", penTimer: 3 + i * 3,
    frightenTimer: 0, eatenTimer: 0,
  }
}

export function createPacmanState(w = 600, h = 400): PacmanState {
  const maze = cloneMaze()
  const { dots, count } = initDots(maze)
  return {
    player: { x: 7, y: 7, dir: 2, nextDir: 2, mouthAngle: 0.3, mouthOpen: true },
    ghosts: [0, 1, 2, 3].map(makeGhost),
    maze, dots,
    powerPellets: PELLET_POS.map(([r, c]) => ({ r, c, active: true })),
    score: 0, lives: 3, level: 1,
    gameOver: false, paused: false, time: 0,
    width: w, height: h, dotsLeft: count, deathTimer: 0,
  }
}

function canMove(maze: number[][], x: number, y: number, dir: Dir): boolean {
  const nx = Math.round(x + DX[dir] * 0.55)
  const ny = Math.round(y + DY[dir] * 0.55)
  if (ny < 0 || ny >= ROWS || nx < 0 || nx >= COLS) return false
  return maze[ny][nx] !== 1
}

function isAligned(v: number): boolean { return Math.abs(v - Math.round(v)) < 0.05 }

function moveEntity(x: number, y: number, dir: Dir, speed: number, dt: number, maze: number[][]): { x: number; y: number } {
  let nx = x + DX[dir] * speed * dt
  let ny = y + DY[dir] * speed * dt
  // snap to grid center on cross-axis
  if (DX[dir] !== 0) ny = ny + (Math.round(ny) - ny) * Math.min(1, 10 * dt)
  if (DY[dir] !== 0) nx = nx + (Math.round(nx) - nx) * Math.min(1, 10 * dt)
  // wall collision
  const tnx = Math.round(nx + DX[dir] * 0.45)
  const tny = Math.round(ny + DY[dir] * 0.45)
  if (tnx < 0 || tnx >= COLS || tny < 0 || tny >= ROWS || maze[tny][tnx] === 1) {
    nx = Math.round(x); ny = Math.round(y)
  }
  return { x: nx, y: ny }
}

function ghostTarget(g: Ghost, gi: number, px: number, py: number, pdir: Dir): { tx: number; ty: number } {
  if (g.mode === "frightened") return { tx: Math.random() * COLS, ty: Math.random() * ROWS }
  switch (gi) {
    case 0: return { tx: px, ty: py } // chase directly
    case 1: return { tx: px + DX[pdir] * 4, ty: py + DY[pdir] * 4 } // ahead
    case 2: return { tx: Math.random() * COLS, ty: Math.random() * ROWS } // random
    default: return { tx: 1, ty: 1 } // patrol corner
  }
}

function bestDir(maze: number[][], x: number, y: number, tx: number, ty: number, cur: Dir): Dir {
  const rev = ((cur + 2) % 4) as Dir
  let best: Dir = cur; let bestD = Infinity
  for (let d = 0; d < 4; d++) {
    if (d === rev) continue
    if (!canMove(maze, Math.round(x), Math.round(y), d as Dir)) continue
    const ex = Math.round(x) + DX[d], ey = Math.round(y) + DY[d]
    const dist = (ex - tx) ** 2 + (ey - ty) ** 2
    if (dist < bestD) { bestD = dist; best = d as Dir }
  }
  return best
}

export function updatePacman(state: PacmanState, dt: number, input: PacmanInput): PacmanState {
  if (state.gameOver || state.paused) return state
  dt = Math.min(dt, 0.05)
  state.time += dt

  // death animation
  if (state.deathTimer > 0) {
    state.deathTimer -= dt
    if (state.deathTimer <= 0) {
      state.lives--
      if (state.lives <= 0) { state.gameOver = true; return state }
      state.player.x = 7; state.player.y = 7; state.player.dir = 2
      state.ghosts = [0, 1, 2, 3].map(makeGhost)
    }
    return state
  }

  const p = state.player
  // input
  if (input.up) p.nextDir = 3
  else if (input.down) p.nextDir = 1
  else if (input.left) p.nextDir = 2
  else if (input.right) p.nextDir = 0

  // try turning
  if (isAligned(p.x) && isAligned(p.y) && canMove(state.maze, Math.round(p.x), Math.round(p.y), p.nextDir))
    p.dir = p.nextDir

  // move player
  const speed = 4
  if (canMove(state.maze, p.x, p.y, p.dir)) {
    const m = moveEntity(p.x, p.y, p.dir, speed, dt, state.maze)
    p.x = m.x; p.y = m.y
  }

  // mouth animation
  p.mouthAngle += (p.mouthOpen ? 3 : -3) * dt
  if (p.mouthAngle > 0.35) p.mouthOpen = false
  if (p.mouthAngle < 0.02) p.mouthOpen = true

  // eat dots
  const pr = Math.round(p.y), pc = Math.round(p.x)
  if (pr >= 0 && pr < ROWS && pc >= 0 && pc < COLS && state.dots[pr][pc]) {
    state.dots[pr][pc] = false; state.score += 10; state.dotsLeft--
  }

  // eat power pellets
  for (const pp of state.powerPellets) {
    if (pp.active && Math.round(p.y) === pp.r && Math.round(p.x) === pp.c) {
      pp.active = false; state.score += 50
      for (const g of state.ghosts) {
        if (g.mode === "chase") { g.mode = "frightened"; g.frightenTimer = 8 }
      }
    }
  }

  // next level
  if (state.dotsLeft <= 0) {
    state.level++
    const maze = cloneMaze()
    const { dots, count } = initDots(maze)
    state.maze = maze; state.dots = dots; state.dotsLeft = count
    state.powerPellets = PELLET_POS.map(([r, c]) => ({ r, c, active: true }))
    state.ghosts = [0, 1, 2, 3].map(i => { const g = makeGhost(i); g.speed += state.level * 0.3; return g })
    state.player.x = 7; state.player.y = 7
    return state
  }

  // update ghosts
  const levelSpeed = 2.5 + state.level * 0.3
  for (let i = 0; i < state.ghosts.length; i++) {
    const g = state.ghosts[i]
    if (g.mode === "pen") {
      g.penTimer -= dt
      if (g.penTimer <= 0) { g.mode = "chase"; g.x = 7; g.y = 5; g.dir = 3 }
      continue
    }
    if (g.mode === "frightened") {
      g.frightenTimer -= dt
      if (g.frightenTimer <= 0) g.mode = "chase"
    }
    if (g.mode === "eaten") {
      g.eatenTimer -= dt
      if (g.eatenTimer <= 0) { g.mode = "chase"; g.x = 7; g.y = 5 }
    }
    const spd = g.mode === "frightened" ? levelSpeed * 0.5 : g.mode === "eaten" ? levelSpeed * 2 : levelSpeed
    // choose direction at intersections
    if (isAligned(g.x) && isAligned(g.y)) {
      const { tx, ty } = ghostTarget(g, i, p.x, p.y, p.dir)
      g.dir = bestDir(state.maze, g.x, g.y, tx, ty, g.dir)
    }
    const m = moveEntity(g.x, g.y, g.dir, spd, dt, state.maze)
    g.x = m.x; g.y = m.y

    // collision with player
    const dx = g.x - p.x, dy = g.y - p.y
    if (dx * dx + dy * dy < 0.5) {
      if (g.mode === "frightened") {
        state.score += 200; g.mode = "eaten"; g.x = 7; g.y = 5.5; g.eatenTimer = 2
      } else if (g.mode === "chase") {
        state.deathTimer = 1
      }
    }
  }

  return state
}

export function renderPacman(ctx: CanvasRenderingContext2D, state: PacmanState, w: number, h: number) {
  const dpr = window.devicePixelRatio || 1
  ctx.save()
  ctx.scale(dpr, dpr)
  const cw = w / dpr, ch = h / dpr
  ctx.clearRect(0, 0, cw, ch)
  ctx.fillStyle = "#0a0a1a"
  ctx.fillRect(0, 0, cw, ch)

  // Use square cells — fit the maze inside the canvas with padding for HUD
  const hudH = 22
  const cs = Math.min((cw - 4) / COLS, (ch - hudH - 4) / ROWS)
  const cellW = cs, cellH = cs
  const ox = (cw - cs * COLS) / 2 // offset to center horizontally
  const oy = hudH + (ch - hudH - cs * ROWS) / 2 // offset below HUD

  // draw maze walls
  ctx.strokeStyle = "#0066ff"
  ctx.lineWidth = 2
  ctx.shadowColor = "#0066ff"
  ctx.shadowBlur = 6
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (state.maze[r][c] !== 1) continue
      const x = ox + c * cellW, y = oy + r * cellH
      // draw edges adjacent to paths
      if (r > 0 && state.maze[r - 1][c] !== 1) line(ctx, x, y, x + cellW, y)
      if (r < ROWS - 1 && state.maze[r + 1][c] !== 1) line(ctx, x, y + cellH, x + cellW, y + cellH)
      if (c > 0 && state.maze[r][c - 1] !== 1) line(ctx, x, y, x, y + cellH)
      if (c < COLS - 1 && state.maze[r][c + 1] !== 1) line(ctx, x + cellW, y, x + cellW, y + cellH)
    }
  }
  ctx.shadowBlur = 0

  // dots
  ctx.fillStyle = "#00f0ff"
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      if (state.dots[r][c]) {
        ctx.beginPath()
        ctx.arc(ox + c * cellW + cellW / 2, oy + r * cellH + cellH / 2, Math.max(1.5, cs * 0.08), 0, Math.PI * 2)
        ctx.fill()
      }

  // power pellets (pulsing)
  const pulse = 0.6 + 0.4 * Math.sin(state.time * 6)
  for (const pp of state.powerPellets) {
    if (!pp.active) continue
    ctx.shadowColor = "#00f0ff"
    ctx.shadowBlur = 10 * pulse
    ctx.fillStyle = `rgba(0,240,255,${pulse})`
    ctx.beginPath()
    ctx.arc(ox + pp.c * cellW + cellW / 2, oy + pp.r * cellH + cellH / 2, cs * 0.3 * pulse + cs * 0.1, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.shadowBlur = 0

  // player (pac-man with mouth)
  if (state.deathTimer <= 0) {
    const px = ox + state.player.x * cellW + cellW / 2
    const py = oy + state.player.y * cellH + cellH / 2
    const angle = [0, Math.PI / 2, Math.PI, -Math.PI / 2][state.player.dir]
    const mouth = state.player.mouthAngle * Math.PI
    ctx.shadowColor = "#ffff00"
    ctx.shadowBlur = 8
    ctx.fillStyle = "#ffff00"
    ctx.beginPath()
    ctx.arc(px, py, cs * 0.38, angle + mouth, angle + Math.PI * 2 - mouth)
    ctx.lineTo(px, py)
    ctx.fill()
    ctx.shadowBlur = 0
  }

  // ghosts
  for (const g of state.ghosts) {
    if (g.mode === "pen") continue
    const gx = ox + g.x * cellW + cellW / 2
    const gy = oy + g.y * cellH + cellH / 2
    const r = cs * 0.36
    const color = g.mode === "frightened" ? "#2020ff" : g.mode === "eaten" ? "#555" : g.color
    ctx.shadowColor = color
    ctx.shadowBlur = 8
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(gx, gy - r * 0.15, r, Math.PI, 0)
    ctx.lineTo(gx + r, gy + r * 0.6)
    // wavy bottom
    for (let i = 0; i < 3; i++) {
      const wx = gx + r - (r * 2 * (i + 0.5)) / 3
      ctx.quadraticCurveTo(wx + r / 3, gy + r * 0.2, wx, gy + r * 0.6)
    }
    ctx.closePath()
    ctx.fill()
    // eyes
    ctx.shadowBlur = 0
    ctx.fillStyle = "#fff"
    ctx.beginPath()
    ctx.arc(gx - r * 0.3, gy - r * 0.2, r * 0.22, 0, Math.PI * 2)
    ctx.arc(gx + r * 0.3, gy - r * 0.2, r * 0.22, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = "#111"
    ctx.beginPath()
    ctx.arc(gx - r * 0.25 + DX[g.dir] * 2, gy - r * 0.2 + DY[g.dir] * 2, r * 0.12, 0, Math.PI * 2)
    ctx.arc(gx + r * 0.35 + DX[g.dir] * 2, gy - r * 0.2 + DY[g.dir] * 2, r * 0.12, 0, Math.PI * 2)
    ctx.fill()
  }

  // HUD — drawn at top of canvas, above the maze
  ctx.shadowBlur = 0
  ctx.fillStyle = "#00f0ff"
  const fontSize = Math.max(10, Math.min(14, cs * 0.7))
  ctx.font = `bold ${fontSize}px monospace`
  ctx.textAlign = "left"
  ctx.fillText(`SCORE ${state.score}`, ox, hudH - 6)
  ctx.textAlign = "right"
  ctx.fillText(`LIVES ${"●".repeat(state.lives)}  LVL ${state.level}`, ox + cs * COLS, hudH - 6)
  ctx.textAlign = "left"

  // game over overlay
  if (state.gameOver) {
    ctx.fillStyle = "rgba(0,0,0,0.7)"
    ctx.fillRect(0, 0, cw, ch)
    ctx.fillStyle = "#ff2020"
    ctx.shadowColor = "#ff2020"
    ctx.shadowBlur = 20
    ctx.font = `bold ${Math.max(18, cs * 1.4)}px monospace`
    ctx.textAlign = "center"
    ctx.fillText("GAME OVER", cw / 2, ch / 2 - 10)
    ctx.shadowBlur = 0
    ctx.fillStyle = "#00f0ff"
    ctx.font = `${Math.max(12, cs * 0.9)}px monospace`
    ctx.fillText(`SCORE: ${state.score}`, cw / 2, ch / 2 + 20)
    ctx.fillStyle = "rgba(0,240,255," + (0.5 + 0.5 * Math.sin(state.time * 4)) + ")"
    ctx.font = `${Math.max(10, cs * 0.7)}px monospace`
    ctx.fillText("TAP TO CONTINUE", cw / 2, ch / 2 + 48)
    ctx.textAlign = "left"
  }

  ctx.restore()
}

function line(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) {
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke()
}
