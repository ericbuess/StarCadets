// Tetris — classic block-stacking puzzle with neon aesthetic

export interface TetrisInput {
  left: boolean; right: boolean; down: boolean; rotate: boolean; drop: boolean
}

interface TetrisPiece {
  type: number; x: number; y: number; rot: number
}

interface TetrisParticle {
  x: number; y: number; vx: number; vy: number; life: number; color: string
}

export interface TetrisState {
  grid: number[][]
  currentPiece: TetrisPiece
  nextPiece: TetrisPiece
  score: number; lines: number; level: number
  gameOver: boolean; paused: boolean; time: number
  width: number; height: number
  moveTimer: number; dropTimer: number
  inputCooldowns: { left: number; right: number; rotate: number; drop: number }
  particles: TetrisParticle[]
  clearAnim: number
  clearRows: number[]
}

const COLS = 10, ROWS = 20
const NEON: string[] = [
  "", "#00f0ff", "#f0f000", "#a040ff", "#00ff60", "#ff3030", "#3060ff", "#ff8020"
]
// Compact: each shape = 4 rotations, each rotation = 4 [col,row] offsets
const SHAPES: number[][][][] = [
  [[0,1],[1,1],[2,1],[3,1]], [[1,0],[1,1],[1,2],[1,3]], [[0,1],[1,1],[2,1],[3,1]], [[1,0],[1,1],[1,2],[1,3]],  // I
  [[0,0],[1,0],[0,1],[1,1]], [[0,0],[1,0],[0,1],[1,1]], [[0,0],[1,0],[0,1],[1,1]], [[0,0],[1,0],[0,1],[1,1]],  // O
  [[0,1],[1,1],[2,1],[1,0]], [[1,0],[1,1],[1,2],[0,1]], [[0,0],[1,0],[2,0],[1,1]], [[0,0],[0,1],[0,2],[1,1]],  // T
  [[1,0],[2,0],[0,1],[1,1]], [[0,0],[0,1],[1,1],[1,2]], [[1,0],[2,0],[0,1],[1,1]], [[0,0],[0,1],[1,1],[1,2]],  // S
  [[0,0],[1,0],[1,1],[2,1]], [[1,0],[0,1],[1,1],[0,2]], [[0,0],[1,0],[1,1],[2,1]], [[1,0],[0,1],[1,1],[0,2]],  // Z
  [[0,0],[0,1],[1,1],[2,1]], [[0,0],[1,0],[0,1],[0,2]], [[0,0],[1,0],[2,0],[2,1]], [[1,0],[1,1],[0,2],[1,2]],  // J
  [[2,0],[0,1],[1,1],[2,1]], [[0,0],[0,1],[0,2],[1,2]], [[0,0],[1,0],[2,0],[0,1]], [[0,0],[1,0],[1,1],[1,2]],  // L
].reduce<number[][][][]>((acc, _, i, arr) => {
  if (i % 4 === 0) acc.push(arr.slice(i, i + 4))
  return acc
}, [])

function cells(p: TetrisPiece): [number, number][] {
  return SHAPES[p.type][p.rot].map(([c, r]) => [p.x + c, p.y + r])
}

function fits(grid: number[][], p: TetrisPiece): boolean {
  return cells(p).every(([c, r]) => c >= 0 && c < COLS && r < ROWS && (r < 0 || grid[r][c] === 0))
}

function randType(): number { return Math.floor(Math.random() * 7) }

function spawn(type: number): TetrisPiece {
  return { type, x: 3, y: -1, rot: 0 }
}

function dropSpeed(level: number): number {
  return Math.max(0.05, 0.8 - level * 0.07)
}

export function createTetrisState(w = 600, h = 400): TetrisState {
  return {
    grid: Array.from({ length: ROWS }, () => Array(COLS).fill(0)),
    currentPiece: spawn(randType()),
    nextPiece: spawn(randType()),
    score: 0, lines: 0, level: 0,
    gameOver: false, paused: false, time: 0,
    width: w, height: h,
    moveTimer: 0, dropTimer: 0,
    inputCooldowns: { left: 0, right: 0, rotate: 0, drop: 0 },
    particles: [], clearAnim: 0, clearRows: [],
  }
}

function lock(state: TetrisState): void {
  for (const [c, r] of cells(state.currentPiece)) {
    if (r >= 0 && r < ROWS) state.grid[r][c] = state.currentPiece.type + 1
  }
  // Find full rows
  const full: number[] = []
  for (let r = 0; r < ROWS; r++) {
    if (state.grid[r].every(v => v !== 0)) full.push(r)
  }
  if (full.length > 0) {
    state.clearRows = full
    state.clearAnim = 0.35
    const pts = [0, 100, 300, 500, 800]
    state.score += (pts[full.length] ?? 800) * (state.level + 1)
    state.lines += full.length
    state.level = Math.floor(state.lines / 10)
    // Spawn particles for cleared rows
    const cellW = state.width * 0.4 / COLS
    const cellH = (state.height - 40) / ROWS
    const boardX = state.width * 0.3 - (COLS * cellW) / 2 + state.width * 0.05
    const boardY = 20
    for (const row of full) {
      for (let c = 0; c < COLS; c++) {
        const color = NEON[state.grid[row][c]] ?? "#00f0ff"
        for (let p = 0; p < 3; p++) {
          state.particles.push({
            x: boardX + c * cellW + cellW / 2,
            y: boardY + row * cellH + cellH / 2,
            vx: (Math.random() - 0.5) * 200,
            vy: (Math.random() - 0.5) * 200,
            life: 0.5 + Math.random() * 0.3,
            color,
          })
        }
      }
    }
  }
  // Advance piece
  state.currentPiece = { ...state.nextPiece, x: 3, y: -1 }
  state.nextPiece = spawn(randType())
  if (!fits(state.grid, state.currentPiece)) state.gameOver = true
}

function tryMove(grid: number[][], p: TetrisPiece, dx: number, dy: number): boolean {
  const next = { ...p, x: p.x + dx, y: p.y + dy }
  if (fits(grid, next)) { p.x = next.x; p.y = next.y; return true }
  return false
}

function tryRotate(grid: number[][], p: TetrisPiece): boolean {
  const next = { ...p, rot: (p.rot + 1) % 4 }
  if (fits(grid, next)) { p.rot = next.rot; return true }
  // Wall kicks: try shifting left/right
  for (const dx of [1, -1, 2, -2]) {
    const kicked = { ...next, x: next.x + dx }
    if (fits(grid, kicked)) { p.rot = kicked.rot; p.x = kicked.x; return true }
  }
  return false
}

function ghostY(grid: number[][], p: TetrisPiece): number {
  let gy = p.y
  while (fits(grid, { ...p, y: gy + 1 })) gy++
  return gy
}

export function updateTetris(state: TetrisState, dt: number, input: TetrisInput): TetrisState {
  if (state.gameOver || state.paused) return state
  state.time += dt
  const cd = state.inputCooldowns
  cd.left = Math.max(0, cd.left - dt)
  cd.right = Math.max(0, cd.right - dt)
  cd.rotate = Math.max(0, cd.rotate - dt)
  cd.drop = Math.max(0, cd.drop - dt)

  // Clear animation
  if (state.clearAnim > 0) {
    state.clearAnim -= dt
    if (state.clearAnim <= 0) {
      for (const row of state.clearRows.sort((a, b) => b - a)) {
        state.grid.splice(row, 1)
        state.grid.unshift(Array(COLS).fill(0))
      }
      state.clearRows = []
    }
    // Update particles during animation
    state.particles = state.particles.filter(p => { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; return p.life > 0 })
    return state
  }

  // Update particles
  state.particles = state.particles.filter(p => { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; return p.life > 0 })

  const piece = state.currentPiece
  // Input handling
  if (input.left && cd.left <= 0) { tryMove(state.grid, piece, -1, 0); cd.left = 0.15 }
  if (input.right && cd.right <= 0) { tryMove(state.grid, piece, 1, 0); cd.right = 0.15 }
  if (input.rotate && cd.rotate <= 0) { tryRotate(state.grid, piece); cd.rotate = 0.22 }
  if (input.drop && cd.drop <= 0) {
    piece.y = ghostY(state.grid, piece)
    lock(state)
    cd.drop = 0.3
    return state
  }

  // Drop
  const speed = input.down ? 0.05 : dropSpeed(state.level)
  state.dropTimer += dt
  if (state.dropTimer >= speed) {
    state.dropTimer = 0
    if (!tryMove(state.grid, piece, 0, 1)) {
      state.moveTimer += dt
      if (state.moveTimer > 0.4) { lock(state); state.moveTimer = 0 }
    } else {
      state.moveTimer = 0
    }
  }
  return state
}

export function renderTetris(ctx: CanvasRenderingContext2D, state: TetrisState, w: number, h: number): void {
  const dpr = window.devicePixelRatio || 1
  ctx.save()
  ctx.scale(dpr, dpr)
  const cw = w / dpr, ch = h / dpr

  // Background
  ctx.fillStyle = "#0a0a1a"
  ctx.fillRect(0, 0, cw, ch)

  const cellW = cw * 0.4 / COLS
  const cellH = (ch - 40) / ROWS
  const cs = Math.min(cellW, cellH)
  const boardW = cs * COLS
  const boardH = cs * ROWS
  const bx = cw * 0.3 - boardW / 2 + cw * 0.05
  const by = 20

  // Grid lines
  ctx.strokeStyle = "rgba(0,240,255,0.07)"
  ctx.lineWidth = 0.5
  for (let r = 0; r <= ROWS; r++) {
    ctx.beginPath(); ctx.moveTo(bx, by + r * cs); ctx.lineTo(bx + boardW, by + r * cs); ctx.stroke()
  }
  for (let c = 0; c <= COLS; c++) {
    ctx.beginPath(); ctx.moveTo(bx + c * cs, by); ctx.lineTo(bx + c * cs, by + boardH); ctx.stroke()
  }

  // Board border glow
  ctx.shadowColor = "#00f0ff"
  ctx.shadowBlur = 8
  ctx.strokeStyle = "rgba(0,240,255,0.3)"
  ctx.lineWidth = 1.5
  ctx.strokeRect(bx, by, boardW, boardH)
  ctx.shadowBlur = 0

  // Placed cells
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const v = state.grid[r][c]
      if (v === 0) continue
      const flash = state.clearRows.includes(r)
      drawCell(ctx, bx + c * cs, by + r * cs, cs, flash ? "#ffffff" : NEON[v], flash ? 1 : 0.4)
    }
  }

  // Ghost piece
  if (!state.gameOver) {
    const gy = ghostY(state.grid, state.currentPiece)
    const ghost = { ...state.currentPiece, y: gy }
    const color = NEON[state.currentPiece.type + 1]
    for (const [c, r] of cells(ghost)) {
      if (r >= 0) {
        ctx.strokeStyle = color
        ctx.globalAlpha = 0.25
        ctx.strokeRect(bx + c * cs + 1, by + r * cs + 1, cs - 2, cs - 2)
        ctx.globalAlpha = 1
      }
    }

    // Current piece
    for (const [c, r] of cells(state.currentPiece)) {
      if (r >= 0) drawCell(ctx, bx + c * cs, by + r * cs, cs, color, 0.6)
    }
  }

  // Particles
  for (const p of state.particles) {
    ctx.globalAlpha = Math.max(0, p.life * 2)
    ctx.fillStyle = p.color
    ctx.shadowColor = p.color
    ctx.shadowBlur = 4
    ctx.fillRect(p.x - 2, p.y - 2, 4, 4)
  }
  ctx.globalAlpha = 1
  ctx.shadowBlur = 0

  // Side panel
  const px = bx + boardW + cw * 0.06
  ctx.fillStyle = "#00f0ff"
  ctx.font = `bold ${Math.round(cs * 0.9)}px monospace`
  ctx.fillText("NEXT", px, by + cs)

  // Next piece preview
  const nextColor = NEON[state.nextPiece.type + 1]
  const previewCs = cs * 0.75
  for (const [c, r] of SHAPES[state.nextPiece.type][0]) {
    drawCell(ctx, px + c * previewCs, by + cs * 1.5 + r * previewCs, previewCs, nextColor, 0.5)
  }

  // Score / lines / level
  const infoY = by + cs * 5.5
  ctx.fillStyle = "rgba(0,240,255,0.5)"
  ctx.font = `${Math.round(cs * 0.65)}px monospace`
  ctx.fillText("SCORE", px, infoY)
  ctx.fillStyle = "#00f0ff"
  ctx.font = `bold ${Math.round(cs * 0.85)}px monospace`
  ctx.fillText(String(state.score), px, infoY + cs)

  ctx.fillStyle = "rgba(0,240,255,0.5)"
  ctx.font = `${Math.round(cs * 0.65)}px monospace`
  ctx.fillText("LINES", px, infoY + cs * 2.3)
  ctx.fillStyle = "#00f0ff"
  ctx.fillText(String(state.lines), px, infoY + cs * 3.1)

  ctx.fillStyle = "rgba(0,240,255,0.5)"
  ctx.fillText("LEVEL", px, infoY + cs * 4.2)
  ctx.fillStyle = "#00f0ff"
  ctx.fillText(String(state.level), px, infoY + cs * 5)

  // Game over overlay
  if (state.gameOver) {
    ctx.fillStyle = "rgba(10,10,26,0.85)"
    ctx.fillRect(0, 0, cw, ch)
    ctx.textAlign = "center"
    ctx.shadowColor = "#00f0ff"
    ctx.shadowBlur = 20
    ctx.fillStyle = "#00f0ff"
    ctx.font = `bold ${Math.round(cw * 0.06)}px monospace`
    ctx.fillText("GAME OVER", cw / 2, ch * 0.4)
    ctx.shadowBlur = 8
    ctx.font = `${Math.round(cw * 0.035)}px monospace`
    ctx.fillText(`SCORE: ${state.score}`, cw / 2, ch * 0.52)
    ctx.globalAlpha = 0.5 + 0.5 * Math.sin(state.time * 4)
    ctx.font = `${Math.round(cw * 0.025)}px monospace`
    ctx.fillText("TAP TO CONTINUE", cw / 2, ch * 0.65)
    ctx.globalAlpha = 1
    ctx.textAlign = "start"
    ctx.shadowBlur = 0
  }
  ctx.restore()
}

function drawCell(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, color: string, glow: number): void {
  const m = 1
  ctx.fillStyle = color
  ctx.globalAlpha = 0.15
  ctx.shadowColor = color
  ctx.shadowBlur = s * glow
  ctx.fillRect(x + m, y + m, s - m * 2, s - m * 2)
  ctx.globalAlpha = 0.85
  ctx.shadowBlur = s * glow * 0.5
  ctx.fillRect(x + m + 1, y + m + 1, s - m * 2 - 2, s - m * 2 - 2)
  ctx.globalAlpha = 1
  ctx.shadowBlur = 0
  // Inner highlight
  ctx.fillStyle = "rgba(255,255,255,0.15)"
  ctx.fillRect(x + m + 1, y + m + 1, s - m * 2 - 2, 1.5)
  ctx.fillRect(x + m + 1, y + m + 1, 1.5, s - m * 2 - 2)
}
