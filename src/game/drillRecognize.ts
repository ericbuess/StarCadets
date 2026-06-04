export interface Point { x: number; y: number }
export type Stroke = Point[]

// Multiple prototype variants per digit for better matching
const DIGIT_PROTOS: Record<number, string[][]> = {
  0: [
    ['..XXXX..', '.XX..XX.', 'XX....XX', 'XX....XX', 'XX....XX', 'XX....XX', '.XX..XX.', '..XXXX..'],
    ['..XXXX..', '.X....X.', '.X....X.', '.X....X.', '.X....X.', '.X....X.', '.X....X.', '..XXXX..'],
  ],
  1: [
    ['...XX...', '..XXX...', '.XXXX...', '...XX...', '...XX...', '...XX...', '...XX...', '.XXXXXX.'],
    ['....X...', '...XX...', '....X...', '....X...', '....X...', '....X...', '....X...', '....X...'],
    ['..XX....', '..XX....', '..XX....', '..XX....', '..XX....', '..XX....', '..XX....', '..XX....'],
  ],
  2: [
    ['.XXXXX..', 'XX...XX.', '.....XX.', '....XX..', '..XXX...', '.XX.....', 'XX......', 'XXXXXXXX'],
    ['..XXXX..', '.X....X.', '......X.', '.....X..', '...XX...', '..X.....', '.X......', 'XXXXXXX.'],
  ],
  3: [
    ['.XXXXX..', 'XX...XX.', '.....XX.', '...XXX..', '.....XX.', '.....XX.', 'XX...XX.', '.XXXXX..'],
    ['..XXXX..', '.....XX.', '.....XX.', '...XXX..', '.....XX.', '.....XX.', '.....XX.', '..XXXX..'],
  ],
  4: [
    ['....XX..', '...XXX..', '..XXXX..', '.XX.XX..', 'XX..XX..', 'XXXXXXXX', '....XX..', '....XX..'],
    ['.....XX.', '....XXX.', '...X.XX.', '..X..XX.', '.XXXXXXX', '.....XX.', '.....XX.', '.....XX.'],
  ],
  5: [
    ['XXXXXXX.', 'XX......', 'XX......', 'XXXXXX..', '.....XX.', '.....XX.', 'XX..XX..', '.XXXX...'],
    ['.XXXXXX.', '.X......', '.X......', '.XXXXX..', '......X.', '......X.', '.X...X..', '..XXX...'],
  ],
  6: [
    ['..XXXX..', '.XX.....', 'XX......', 'XXXXXX..', 'XX...XX.', 'XX...XX.', 'XX...XX.', '.XXXXX..'],
    ['..XXX...', '.X......', 'X.......', 'XXXXX...', 'X....X..', 'X....X..', 'X....X..', '.XXXX...'],
  ],
  7: [
    ['XXXXXXXX', '.....XX.', '....XX..', '...XX...', '...XX...', '..XX....', '..XX....', '..XX....'],
    ['XXXXXXX.', '......X.', '.....X..', '....X...', '...X....', '...X....', '..X.....', '..X.....'],
  ],
  8: [
    ['.XXXXX..', 'XX...XX.', 'XX...XX.', '.XXXXX..', 'XX...XX.', 'XX...XX.', 'XX...XX.', '.XXXXX..'],
    ['..XXX...', '.X...X..', '.X...X..', '..XXX...', '.X...X..', '.X...X..', '.X...X..', '..XXX...'],
  ],
  9: [
    ['.XXXXX..', 'XX...XX.', 'XX...XX.', '.XXXXXX.', '.....XX.', '.....XX.', '....XX..', '.XXXX...'],
    ['..XXXX..', '.X....X.', '.X....X.', '..XXXXX.', '......X.', '......X.', '.....X..', '..XXX...'],
  ],
}

interface BBox { minX: number; minY: number; maxX: number; maxY: number; w: number; h: number }

function getBBox(points: Point[]): BBox | null {
  if (!points.length) return null
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const p of points) {
    if (p.x < minX) minX = p.x
    if (p.y < minY) minY = p.y
    if (p.x > maxX) maxX = p.x
    if (p.y > maxY) maxY = p.y
  }
  return { minX, minY, maxX, maxY, w: maxX - minX, h: maxY - minY }
}

function dilate(grid: number[][]): number[][] {
  const out: number[][] = Array.from({ length: 8 }, () => Array(8).fill(0))
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      if (grid[y][x]) {
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const ny = y + dy, nx = x + dx
            if (ny >= 0 && ny < 8 && nx >= 0 && nx < 8) out[ny][nx] = 1
          }
        }
      }
    }
  }
  return out
}

function rasterize(strokes: Stroke[]): { grid: number[][]; bbox: BBox } | null {
  const allPts = strokes.flat()
  const bbox = getBBox(allPts)
  if (!bbox || (bbox.w < 3 && bbox.h < 3)) return null

  // Normalize to square aspect ratio with padding
  const size = Math.max(bbox.w, bbox.h, 10)
  const padX = (size - bbox.w) / 2 + 4
  const padY = (size - bbox.h) / 2 + 4
  const W = size + 8
  const H = size + 8

  const grid: number[][] = Array.from({ length: 8 }, () => Array(8).fill(0))
  for (const stroke of strokes) {
    for (let i = 0; i < stroke.length - 1; i++) {
      const a = stroke[i], b = stroke[i + 1]
      const dist = Math.hypot(b.x - a.x, b.y - a.y)
      const steps = Math.max(1, Math.ceil(dist / 2))
      for (let s = 0; s <= steps; s++) {
        const t = s / steps
        const x = a.x + (b.x - a.x) * t - bbox.minX + padX
        const y = a.y + (b.y - a.y) * t - bbox.minY + padY
        const gx = Math.floor((x / W) * 8)
        const gy = Math.floor((y / H) * 8)
        if (gx >= 0 && gx < 8 && gy >= 0 && gy < 8) grid[gy][gx] = 1
      }
    }
  }
  return { grid, bbox }
}

function matchScore(grid: number[][], proto: string[]): number {
  let match = 0
  let protoFilled = 0
  let drawnFilled = 0
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const drawn = grid[y][x]
      const template = proto[y][x] === 'X' ? 1 : 0
      if (drawn === template) match++
      if (template) protoFilled++
      if (drawn) drawnFilled++
    }
  }
  const hamming = match / 64
  // Penalize extreme fill differences
  const fillRatio = protoFilled > 0 ? drawnFilled / protoFilled : 1
  const fillPenalty = fillRatio > 2.5 || fillRatio < 0.3 ? 0.9 : 1.0
  return hamming * fillPenalty
}

function recognizeDigit(strokes: Stroke[]): { digit: number; score: number } | null {
  const r = rasterize(strokes)
  if (!r) return null

  const dilated = dilate(r.grid)

  let best: { digit: number; score: number } | null = null
  for (const [d, variants] of Object.entries(DIGIT_PROTOS)) {
    for (const proto of variants) {
      const rawScore = matchScore(r.grid, proto)
      const dilScore = matchScore(dilated, proto)
      const score = Math.max(rawScore, dilScore * 0.97)
      if (!best || score > best.score) {
        best = { digit: parseInt(d, 10), score }
      }
    }
  }
  return best && best.score > 0.50 ? best : null
}

export function recognizeNumber(strokes: Stroke[]): number | null {
  if (!strokes.length) return null

  const perStrokeBBox = strokes.map(s => getBBox(s))
  let hasMinus = false
  const digitStrokes: { stroke: Stroke; bbox: BBox }[] = []

  for (let i = 0; i < strokes.length; i++) {
    const b = perStrokeBBox[i]
    if (!b) continue
    if (b.w > 15 && b.h < 15 && b.w > b.h * 2) {
      hasMinus = true
    } else {
      digitStrokes.push({ stroke: strokes[i], bbox: b })
    }
  }

  if (!digitStrokes.length) return null

  digitStrokes.sort((a, b) => a.bbox.minX - b.bbox.minX)

  const allBBox = getBBox(digitStrokes.flatMap(ds => ds.stroke))
  const gapThreshold = allBBox ? allBBox.w * 0.18 + 12 : 25

  const clusters: { strokes: Stroke[]; bbox: BBox }[] = []
  for (const ds of digitStrokes) {
    const last = clusters[clusters.length - 1]
    if (last && ds.bbox.minX < last.bbox.maxX + gapThreshold) {
      last.strokes.push(ds.stroke)
      last.bbox.maxX = Math.max(last.bbox.maxX, ds.bbox.maxX)
      last.bbox.minX = Math.min(last.bbox.minX, ds.bbox.minX)
      last.bbox.minY = Math.min(last.bbox.minY, ds.bbox.minY)
      last.bbox.maxY = Math.max(last.bbox.maxY, ds.bbox.maxY)
      last.bbox.w = last.bbox.maxX - last.bbox.minX
      last.bbox.h = last.bbox.maxY - last.bbox.minY
    } else {
      clusters.push({ strokes: [ds.stroke], bbox: { ...ds.bbox } })
    }
  }

  const digits: number[] = []
  for (const c of clusters) {
    const result = recognizeDigit(c.strokes)
    if (!result) return null
    digits.push(result.digit)
  }

  const n = parseInt(digits.join(''), 10)
  if (Number.isNaN(n)) return null
  return hasMinus ? -n : n
}
