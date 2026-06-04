/**
 * AI controllers for each game + frame recording/replay for shadow mode.
 *
 * Each AI function takes the current game state and returns the input
 * the AI "player" would press that frame.
 *
 * Shadow mode records player inputs each frame and replays them as a ghost.
 */

import type { AsteroidsInput } from "./asteroidsEngine"
import type { FroggerInput } from "./froggerEngine"
import type { PacmanInput } from "./pacmanEngine"
import type { TetrisInput } from "./tetrisEngine"

// ─── Frame Recording (Shadow Mode) ───

export interface RecordedFrame {
  t: number           // time in seconds since game start
  input: unknown      // the raw input for that frame
  score: number       // score at this frame
  x?: number          // optional position for visual ghost
  y?: number
}

export interface GameReplay {
  gameId: string
  frames: RecordedFrame[]
  finalScore: number
  timestamp: number
}

const REPLAY_KEY_PREFIX = "edu_replay_"

export function saveReplay(gameId: string, replay: GameReplay, mode: "last" | "best") {
  const key = `${REPLAY_KEY_PREFIX}${gameId}_${mode}`
  // For best, only save if score is higher
  if (mode === "best") {
    const existing = loadReplay(gameId, "best")
    if (existing && existing.finalScore >= replay.finalScore) return
  }
  // Downsample to save storage — keep every 3rd frame
  const downsampled = { ...replay, frames: replay.frames.filter((_, i) => i % 3 === 0) }
  try {
    localStorage.setItem(key, JSON.stringify(downsampled))
  } catch {
    // Storage full — drop old replays
  }
}

export function loadReplay(gameId: string, mode: "last" | "best"): GameReplay | null {
  try {
    const saved = localStorage.getItem(`${REPLAY_KEY_PREFIX}${gameId}_${mode}`)
    if (saved) return JSON.parse(saved)
  } catch { /* ignore */ }
  return null
}

// ─── Runner AI ───

export function runnerAI(state: { player: { x: number; grounded: boolean }; obstacles: { x: number; type: string; passed: boolean }[] }): boolean {
  if (!state.player.grounded) return false
  for (const obs of state.obstacles) {
    if (obs.passed) continue
    const dist = obs.x - state.player.x
    if (dist > -15 && dist < 180) return true
  }
  return false
}

// ─── Asteroids AI ───

interface AsteroidsAIState {
  ship: { x: number; y: number; angle: number; vx: number; vy: number; dead: boolean }
  asteroids: { x: number; y: number; vx: number; vy: number; radius: number }[]
  width: number; height: number
}

export function asteroidsAI(state: AsteroidsAIState): AsteroidsInput {
  const { ship, asteroids } = state
  if (ship.dead) return { left: false, right: false, thrust: false, shoot: false }

  // Find nearest asteroid
  let nearest = null as null | typeof asteroids[0]
  let nearDist = Infinity
  for (const a of asteroids) {
    let dx = a.x - ship.x
    let dy = a.y - ship.y
    // Handle wrapping
    if (Math.abs(dx) > state.width / 2) dx = dx > 0 ? dx - state.width : dx + state.width
    if (Math.abs(dy) > state.height / 2) dy = dy > 0 ? dy - state.height : dy + state.height
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist < nearDist) { nearDist = dist; nearest = a }
  }

  if (!nearest) return { left: false, right: false, thrust: false, shoot: false }

  // Aim at nearest asteroid
  let dx = nearest.x - ship.x
  let dy = nearest.y - ship.y
  if (Math.abs(dx) > state.width / 2) dx = dx > 0 ? dx - state.width : dx + state.width
  if (Math.abs(dy) > state.height / 2) dy = dy > 0 ? dy - state.height : dy + state.height
  const targetAngle = Math.atan2(dy, dx)
  let angleDiff = targetAngle - ship.angle
  while (angleDiff > Math.PI) angleDiff -= Math.PI * 2
  while (angleDiff < -Math.PI) angleDiff += Math.PI * 2

  const aiming = Math.abs(angleDiff) < 0.3
  const tooClose = nearDist < 80

  return {
    left: angleDiff < -0.05,
    right: angleDiff > 0.05,
    thrust: tooClose ? false : nearDist > 120,
    shoot: aiming,
  }
}

// ─── Brick Breaker AI ───

interface BrickBreakerAIState {
  balls: { x: number; y: number; vy: number }[]
  width: number
}

export function brickBreakerAI(state: BrickBreakerAIState): number {
  // Track the lowest falling ball
  let targetX = state.width / 2
  let lowestY = -1
  for (const b of state.balls) {
    if (b.vy > 0 && b.y > lowestY) {
      lowestY = b.y
      targetX = b.x
    }
  }
  if (lowestY < 0 && state.balls.length > 0) {
    targetX = state.balls[0].x
  }
  return targetX / state.width // normalized 0-1
}

// ─── Frogger AI ───

interface FroggerAIState {
  player: { col: number; row: number; moveCD: number; deathTimer: number }
  lanes: { type: string; objects: { x: number; width: number; kind: string }[]; speed: number; direction: 1 | -1 }[]
  gameOver: boolean
}

const FROGGER_COLS = 15

export function froggerAI(state: FroggerAIState): FroggerInput {
  const none: FroggerInput = { up: false, down: false, left: false, right: false }
  if (state.gameOver || state.player.deathTimer > 0 || state.player.moveCD > 0) return none

  const { player, lanes } = state
  const row = player.row
  const col = player.col

  // If at home row, check
  if (row === 0) return none

  // Check if safe to move up
  const nextRow = row - 1
  if (nextRow < 0) return none

  const nextLane = lanes[nextRow]
  if (!nextLane) return none

  if (nextLane.type === "safe" || nextLane.type === "home") {
    return { up: true, down: false, left: false, right: false }
  }

  if (nextLane.type === "road") {
    // Check if any car is near the column we'd move to
    let safe = true
    for (const obj of nextLane.objects) {
      if (col + 0.5 >= obj.x - 1 && col - 0.5 <= obj.x + obj.width + 1) {
        safe = false
        break
      }
    }
    if (safe) return { up: true, down: false, left: false, right: false }
    // Wait or dodge sideways
    if (col < FROGGER_COLS - 1) return { up: false, down: false, left: false, right: true }
    return { up: false, down: false, left: true, right: false }
  }

  if (nextLane.type === "river") {
    // Check if there's a log/lilypad to land on
    for (const obj of nextLane.objects) {
      if (col >= obj.x - 0.5 && col <= obj.x + obj.width + 0.5) {
        return { up: true, down: false, left: false, right: false }
      }
    }
    // Move sideways to align with a log
    const closestObj = nextLane.objects.reduce((best, obj) => {
      const center = obj.x + obj.width / 2
      return Math.abs(center - col) < Math.abs(best - col) ? center : best
    }, FROGGER_COLS / 2)
    if (closestObj > col + 0.5) return { up: false, down: false, left: false, right: true }
    if (closestObj < col - 0.5) return { up: false, down: false, left: true, right: false }
    return { up: true, down: false, left: false, right: false }
  }

  return { up: true, down: false, left: false, right: false }
}

// ─── Pac-Man AI ───

interface PacmanAIState {
  player: { x: number; y: number; dir: 0 | 1 | 2 | 3 }
  ghosts: { x: number; y: number; mode: string }[]
  dots: boolean[][]
  maze: number[][]
  powerPellets: { r: number; c: number; active: boolean }[]
}

const PM_DX = [1, 0, -1, 0]
const PM_DY = [0, 1, 0, -1]

export function pacmanAI(state: PacmanAIState): PacmanInput {
  const none: PacmanInput = { up: false, down: false, left: false, right: false }
  const { player, ghosts, dots, maze } = state
  const px = Math.round(player.x)
  const py = Math.round(player.y)

  // Find nearest dot
  let nearDot = null as null | { r: number; c: number; dist: number }
  for (let r = 0; r < dots.length; r++) {
    for (let c = 0; c < dots[r].length; c++) {
      if (!dots[r][c]) continue
      const dist = Math.abs(r - py) + Math.abs(c - px)
      if (!nearDot || dist < nearDot.dist) nearDot = { r, c, dist }
    }
  }

  // Check for active power pellets
  for (const pp of state.powerPellets) {
    if (!pp.active) continue
    const dist = Math.abs(pp.r - py) + Math.abs(pp.c - px)
    if (!nearDot || dist < nearDot.dist + 3) {
      nearDot = { r: pp.r, c: pp.c, dist }
    }
  }

  if (!nearDot) return none

  // Check ghost danger — avoid directions that move toward non-frightened ghosts
  const dangerDirs = new Set<number>()
  for (const g of ghosts) {
    if (g.mode !== "chase") continue
    const gdx = g.x - player.x
    const gdy = g.y - player.y
    const gd = Math.sqrt(gdx * gdx + gdy * gdy)
    if (gd < 4) {
      // Ghost is close — which direction is it?
      if (gdx > 0.5) dangerDirs.add(0)  // right
      if (gdy > 0.5) dangerDirs.add(1)  // down
      if (gdx < -0.5) dangerDirs.add(2) // left
      if (gdy < -0.5) dangerDirs.add(3) // up
    }
  }

  // Pick direction toward target dot, avoiding danger
  const targetDx = nearDot.c - px
  const targetDy = nearDot.r - py

  const preferred: number[] = []
  if (targetDx > 0) preferred.push(0)
  if (targetDx < 0) preferred.push(2)
  if (targetDy > 0) preferred.push(1)
  if (targetDy < 0) preferred.push(3)

  // Try preferred dirs first, skip dangerous ones
  for (const d of preferred) {
    if (dangerDirs.has(d)) continue
    const nx = px + PM_DX[d]
    const ny = py + PM_DY[d]
    if (ny >= 0 && ny < maze.length && nx >= 0 && nx < maze[0].length && maze[ny][nx] !== 1) {
      return dirToInput(d)
    }
  }

  // Fall back to any safe dir
  for (let d = 0; d < 4; d++) {
    if (dangerDirs.has(d)) continue
    const nx = px + PM_DX[d]
    const ny = py + PM_DY[d]
    if (ny >= 0 && ny < maze.length && nx >= 0 && nx < maze[0].length && maze[ny][nx] !== 1) {
      return dirToInput(d)
    }
  }

  return none
}

function dirToInput(d: number): PacmanInput {
  return {
    right: d === 0,
    down: d === 1,
    left: d === 2,
    up: d === 3,
  }
}

// ─── Tetris AI ───

interface TetrisAIState {
  grid: number[][]
  currentPiece: { type: number; x: number; y: number; rot: number }
  dropTimer: number
}

// Simple Tetris AI: try to place piece in the position that creates the fewest holes
// and the lowest max height
export function tetrisAI(state: TetrisAIState): TetrisInput {
  const none: TetrisInput = { left: false, right: false, down: false, rotate: false, drop: false }
  const piece = state.currentPiece

  // Compute target: find best column and rotation
  const target = findBestPlacement(state.grid, piece.type)
  if (!target) return { ...none, down: true }

  // Rotate toward target rotation
  if (piece.rot !== target.rot) {
    return { ...none, rotate: true }
  }

  // Move toward target column
  if (piece.x < target.x) return { ...none, right: true }
  if (piece.x > target.x) return { ...none, left: true }

  // In position — hard drop
  return { ...none, drop: true }
}

const T_COLS = 10
const T_ROWS = 20
const T_SHAPES: number[][][][] = [
  [[0,1],[1,1],[2,1],[3,1]], [[1,0],[1,1],[1,2],[1,3]], [[0,1],[1,1],[2,1],[3,1]], [[1,0],[1,1],[1,2],[1,3]],
  [[0,0],[1,0],[0,1],[1,1]], [[0,0],[1,0],[0,1],[1,1]], [[0,0],[1,0],[0,1],[1,1]], [[0,0],[1,0],[0,1],[1,1]],
  [[0,1],[1,1],[2,1],[1,0]], [[1,0],[1,1],[1,2],[0,1]], [[0,0],[1,0],[2,0],[1,1]], [[0,0],[0,1],[0,2],[1,1]],
  [[1,0],[2,0],[0,1],[1,1]], [[0,0],[0,1],[1,1],[1,2]], [[1,0],[2,0],[0,1],[1,1]], [[0,0],[0,1],[1,1],[1,2]],
  [[0,0],[1,0],[1,1],[2,1]], [[1,0],[0,1],[1,1],[0,2]], [[0,0],[1,0],[1,1],[2,1]], [[1,0],[0,1],[1,1],[0,2]],
  [[0,0],[0,1],[1,1],[2,1]], [[0,0],[1,0],[0,1],[0,2]], [[0,0],[1,0],[2,0],[2,1]], [[1,0],[1,1],[0,2],[1,2]],
  [[2,0],[0,1],[1,1],[2,1]], [[0,0],[0,1],[0,2],[1,2]], [[0,0],[1,0],[2,0],[0,1]], [[0,0],[1,0],[1,1],[1,2]],
].reduce<number[][][][]>((acc, _, i, arr) => {
  if (i % 4 === 0) acc.push(arr.slice(i, i + 4))
  return acc
}, [])

function findBestPlacement(grid: number[][], pieceType: number): { x: number; rot: number } | null {
  let bestScore = -Infinity
  let bestX = 3
  let bestRot = 0

  for (let rot = 0; rot < 4; rot++) {
    const shape = T_SHAPES[pieceType][rot]
    for (let x = -1; x < T_COLS; x++) {
      // Check if placement is valid
      const cells = shape.map(([c, r]) => [x + c, r])
      if (cells.some(([c]) => c < 0 || c >= T_COLS)) continue

      // Find landing y
      let y = 0
      while (y < T_ROWS) {
        const landed = cells.some(([c, r]) => {
          const ry = y + r
          return ry >= T_ROWS || (ry >= 0 && grid[ry][c] !== 0)
        })
        if (landed) break
        y++
      }
      y--

      // Score the placement
      const placed = cells.map(([c, r]) => [c, y + r])
      if (placed.some(([, r]) => r < 0)) continue

      // Count completed lines
      const tempGrid = grid.map(row => [...row])
      for (const [c, r] of placed) {
        if (r >= 0 && r < T_ROWS) tempGrid[r][c] = 1
      }
      let lines = 0
      for (let r = 0; r < T_ROWS; r++) {
        if (tempGrid[r].every(v => v !== 0)) lines++
      }

      // Count holes (empty cells with filled cells above)
      let holes = 0
      for (let c = 0; c < T_COLS; c++) {
        let filled = false
        for (let r = 0; r < T_ROWS; r++) {
          if (tempGrid[r][c] !== 0) filled = true
          else if (filled) holes++
        }
      }

      // Height penalty
      const maxH = placed.reduce((h, [, r]) => Math.max(h, T_ROWS - r), 0)

      const score = lines * 100 - holes * 30 - maxH * 2
      if (score > bestScore) {
        bestScore = score
        bestX = x
        bestRot = rot
      }
    }
  }

  return { x: bestX, rot: bestRot }
}

// ─── AI Audit Results ───

export interface AIAuditResult {
  gameId: string
  framesPlayed: number
  finalScore: number
  maxScore: number
  died: boolean
  diedAtFrame: number | null
  physicsErrors: string[]
  scoreAnomalies: string[]
  passed: boolean
}
