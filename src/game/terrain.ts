import type { TerrainSegment, Obstacle, Powerup, Enemy, Vec2, SegmentType, PowerupType } from "./types"

const SEGMENT_WIDTH = 600

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function randomRange(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

function pickSegmentType(distance: number): SegmentType {
  // More variety as distance increases
  const difficulty = Math.min(distance / 5000, 1)
  const roll = Math.random()

  if (roll < 0.12) return "flat"
  if (roll < 0.30) return "hill"
  if (roll < 0.38) return "valley"
  if (roll < 0.52) return "ramp"
  if (roll < 0.62) return "jump"
  if (roll < 0.70 && difficulty > 0.2) return "gap"
  if (roll < 0.78 && difficulty > 0.3) return "narrow"
  if (roll < 0.86 && difficulty > 0.4) return "disappearing"
  if (roll < 0.95 && difficulty > 0.5) return "loop"
  return "ramp"
}

function generateSegmentPoints(type: SegmentType, startX: number, startY: number): Vec2[] {
  const points: Vec2[] = []
  const steps = 40

  switch (type) {
    case "flat": {
      for (let i = 0; i <= steps; i++) {
        const t = i / steps
        points.push({
          x: startX + t * SEGMENT_WIDTH,
          y: startY + Math.sin(t * Math.PI * 2) * 5
        })
      }
      break
    }
    case "hill": {
      const height = randomRange(80, 170)
      for (let i = 0; i <= steps; i++) {
        const t = i / steps
        // Steeper upslope, gentler downslope — good for launches
        const hillShape = t < 0.4
          ? Math.sin((t / 0.4) * Math.PI * 0.5) // steep ramp up
          : Math.sin(0.5 * Math.PI + ((t - 0.4) / 0.6) * Math.PI * 0.5) // gentle descent
        points.push({
          x: startX + t * SEGMENT_WIDTH,
          y: startY - hillShape * height
        })
      }
      break
    }
    case "valley": {
      const depth = randomRange(40, 100)
      for (let i = 0; i <= steps; i++) {
        const t = i / steps
        points.push({
          x: startX + t * SEGMENT_WIDTH,
          y: startY + Math.sin(t * Math.PI) * depth
        })
      }
      break
    }
    case "ramp": {
      const height = randomRange(80, 180)
      for (let i = 0; i <= steps; i++) {
        const t = i / steps
        if (t < 0.6) {
          // Curved ramp up (parabolic for smooth launch)
          const rampT = t / 0.6
          points.push({
            x: startX + t * SEGMENT_WIDTH,
            y: startY - rampT * rampT * height * 0.6 - rampT * height * 0.4
          })
        } else if (t < 0.65) {
          // Sharp lip at top for launch
          points.push({
            x: startX + t * SEGMENT_WIDTH,
            y: startY - height
          })
        } else {
          // Drop off
          const dropT = (t - 0.65) / 0.35
          points.push({
            x: startX + t * SEGMENT_WIDTH,
            y: startY - height + dropT * height * 0.5
          })
        }
      }
      break
    }
    case "jump": {
      const jumpHeight = randomRange(100, 160)
      for (let i = 0; i <= steps; i++) {
        const t = i / steps
        if (t < 0.35) {
          // Curved ramp up for natural launch
          const rampT = t / 0.35
          points.push({
            x: startX + t * SEGMENT_WIDTH,
            y: startY - Math.sin(rampT * Math.PI * 0.5) * jumpHeight
          })
        } else if (t < 0.65) {
          // Gap (no ground)
          points.push({
            x: startX + t * SEGMENT_WIDTH,
            y: startY + 800
          })
        } else {
          // Landing ramp — curved for smooth catch
          const landT = (t - 0.65) / 0.35
          const landY = startY - jumpHeight * (1 - landT) * 0.8
          points.push({
            x: startX + t * SEGMENT_WIDTH,
            y: landY + Math.sin(landT * Math.PI * 0.5) * jumpHeight * 0.6
          })
        }
      }
      break
    }
    case "gap": {
      const gapStart = randomRange(0.3, 0.4)
      const gapEnd = randomRange(0.6, 0.7)
      for (let i = 0; i <= steps; i++) {
        const t = i / steps
        if (t > gapStart && t < gapEnd) {
          points.push({ x: startX + t * SEGMENT_WIDTH, y: startY + 800 })
        } else {
          points.push({ x: startX + t * SEGMENT_WIDTH, y: startY })
        }
      }
      break
    }
    case "narrow": {
      for (let i = 0; i <= steps; i++) {
        const t = i / steps
        const bump = Math.sin(t * Math.PI * 4) * 15
        points.push({
          x: startX + t * SEGMENT_WIDTH,
          y: startY + bump
        })
      }
      break
    }
    case "disappearing": {
      for (let i = 0; i <= steps; i++) {
        const t = i / steps
        points.push({
          x: startX + t * SEGMENT_WIDTH,
          y: startY + Math.sin(t * Math.PI) * 10
        })
      }
      break
    }
    case "loop": {
      const radius = 120
      const cx = startX + SEGMENT_WIDTH * 0.5
      const cy = startY - radius
      const loopSteps = steps * 3
      for (let i = 0; i <= loopSteps; i++) {
        const t = i / loopSteps
        if (t < 0.2) {
          // Approach ramp — curved uphill for speed entry
          const rampT = t / 0.2
          const rampCurve = Math.sin(rampT * Math.PI * 0.5)
          points.push({
            x: startX + rampT * SEGMENT_WIDTH * 0.25,
            y: lerp(startY, startY - radius * 0.4, rampCurve)
          })
        } else if (t < 0.8) {
          // Loop circle — high resolution for smooth following
          const loopT = (t - 0.2) / 0.6
          const angle = -Math.PI / 2 + loopT * Math.PI * 2
          points.push({
            x: cx + Math.cos(angle) * radius,
            y: cy + Math.sin(angle) * radius
          })
        } else {
          // Exit ramp — smooth descent
          const exitT = (t - 0.8) / 0.2
          const exitCurve = Math.sin(exitT * Math.PI * 0.5)
          points.push({
            x: startX + SEGMENT_WIDTH * 0.75 + exitT * SEGMENT_WIDTH * 0.25,
            y: lerp(startY - radius * 0.4, startY, exitCurve)
          })
        }
      }
      break
    }
  }

  return points
}

export function generateSegment(startX: number, prevEndY: number, distance: number): {
  segment: TerrainSegment
  obstacles: Obstacle[]
  powerups: Powerup[]
  enemies: Enemy[]
} {
  const type = pickSegmentType(distance)
  const points = generateSegmentPoints(type, startX, prevEndY)

  const obstacles: Obstacle[] = []
  const powerups: Powerup[] = []
  const enemies: Enemy[] = []

  // Add obstacles on some segments — always preceded by a ramp so players can jump over
  if (type !== "gap" && type !== "jump" && type !== "loop" && Math.random() < 0.4) {
    // Place obstacle in latter half so there's room for a ramp before it
    const idx = Math.floor(points.length * randomRange(0.5, 0.8))
    if (idx < points.length && idx > 6) {
      const p = points[idx]
      if (p.y < prevEndY + 500) {
        // Build a ramp before the obstacle for jumping over it
        const rampLen = 5
        const rampHeight = 35 + Math.random() * 25
        for (let r = 0; r < rampLen; r++) {
          const rampIdx = idx - rampLen - 1 + r
          if (rampIdx >= 0 && rampIdx < points.length) {
            const rt = r / (rampLen - 1)
            points[rampIdx].y -= Math.sin(rt * Math.PI) * rampHeight
          }
        }

        obstacles.push({
          pos: { x: p.x + 20, y: p.y - 18 },
          width: 22,
          height: 22,
          type: Math.random() < 0.5 ? "rock" : "barrier"
        })
      }
    }
  }

  // Add powerups — more variety, higher spawn rate
  if (Math.random() < 0.45) {
    const idx = Math.floor(points.length * randomRange(0.2, 0.8))
    if (idx < points.length) {
      const p = points[idx]
      if (p.y < prevEndY + 500) {
        // Common powerups + rare weapon/vehicle pickups
        const roll = Math.random()
        let pwType: PowerupType
        if (roll < 0.20) pwType = "speed"
        else if (roll < 0.35) pwType = "invincible"
        else if (roll < 0.45) pwType = "fuel"
        else if (roll < 0.55) pwType = "points"
        else if (roll < 0.65) pwType = "hangtime"
        else if (roll < 0.80) pwType = "gun"
        else pwType = "missile"
        powerups.push({
          pos: { x: p.x, y: p.y - 50 },
          type: pwType,
          collected: false,
          bobOffset: Math.random() * Math.PI * 2
        })
      }
    }
  }

  // Add enemies — more frequently, on more terrain types
  if (distance > 1000 && Math.random() < 0.35 && type !== "gap" && type !== "jump") {
    const idx = Math.floor(points.length * 0.5)
    if (idx < points.length) {
      const p = points[idx]
      if (p.y < prevEndY + 500) {
        enemies.push({
          pos: { x: p.x, y: p.y - 20 },
          vel: { x: randomRange(-60, 60), y: 0 },
          width: 30,
          height: 30,
          type: Math.random() < 0.5 ? "roller" : "bouncer",
          alive: true,
          health: distance > 5000 ? 3 : distance > 3000 ? 2 : 1
        })
      }
    }
  }

  return {
    segment: {
      startX,
      points,
      type,
      disappearTimer: type === "disappearing" ? 3 : undefined,
      isDisappearing: false,
      disappeared: false
    },
    obstacles,
    powerups,
    enemies
  }
}

export function getTerrainHeightAt(segments: TerrainSegment[], x: number): { y: number; normal: Vec2; found: boolean } {
  for (const seg of segments) {
    if (seg.disappeared) continue
    const pts = seg.points
    if (pts.length < 2) continue
    if (x < pts[0].x || x > pts[pts.length - 1].x) continue

    for (let i = 0; i < pts.length - 1; i++) {
      if (x >= pts[i].x && x <= pts[i + 1].x) {
        const t = (x - pts[i].x) / (pts[i + 1].x - pts[i].x)
        const y = lerp(pts[i].y, pts[i + 1].y, t)

        // If it's a gap (y > 700), treat as no ground
        if (y > 700) {
          return { y: 9999, normal: { x: 0, y: -1 }, found: false }
        }

        // Calculate normal
        const dx = pts[i + 1].x - pts[i].x
        const dy = pts[i + 1].y - pts[i].y
        const len = Math.sqrt(dx * dx + dy * dy)
        const normal = { x: dy / len, y: -dx / len }

        return { y, normal, found: true }
      }
    }
  }
  return { y: 9999, normal: { x: 0, y: -1 }, found: false }
}

export function generateEducationSegment(startX: number, prevEndY: number): TerrainSegment {
  const points: Vec2[] = []
  const steps = 60
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    points.push({
      x: startX + t * SEGMENT_WIDTH * 2,
      y: prevEndY
    })
  }
  return {
    startX,
    points,
    type: "flat"
  }
}
