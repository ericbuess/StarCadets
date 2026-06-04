import { PALETTE } from "@/game/drillStickers"

interface Props {
  pixels: string[]
  size?: number
}

export function PixelSticker({ pixels, size = 64 }: Props) {
  const rows = pixels.length
  const cols = Math.max(...pixels.map(r => r.length))
  const cellSize = size / Math.max(rows, cols)

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
      style={{ imageRendering: "pixelated" }}>
      {pixels.map((row, y) =>
        row.split("").map((ch, x) => {
          if (ch === ".") return null
          const color = PALETTE[ch] || "#fff"
          return (
            <rect key={`${y}-${x}`}
              x={x * cellSize} y={y * cellSize}
              width={cellSize + 0.5} height={cellSize + 0.5}
              fill={color} />
          )
        })
      )}
    </svg>
  )
}
