import { useState, useEffect, useRef } from "react"
import { STICKERS, PALETTE, RARITY_COLOR } from "@/game/drillStickers"
import { loadProgression, saveProgression } from "@/game/progression"
import { playCelebrationSound } from "@/game/audio"
import type { Sticker } from "@/types/drill"

interface Props {
  onClose: () => void
}

const pixel = "'Press Start 2P', monospace"
const vt = "'VT323', monospace"

function pickSticker(): Sticker {
  const roll = Math.random()
  let pool: Sticker[]
  if (roll < 0.02) pool = STICKERS.filter(s => s.rarity === "legendary")
  else if (roll < 0.10) pool = STICKERS.filter(s => s.rarity === "epic")
  else if (roll < 0.30) pool = STICKERS.filter(s => s.rarity === "rare")
  else pool = STICKERS.filter(s => s.rarity === "common")
  if (!pool.length) pool = STICKERS.filter(s => s.rarity === "common")
  return pool[Math.floor(Math.random() * pool.length)]
}

function MiniPixelSticker({ sticker, size = 64 }: { sticker: Sticker; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const cvs = canvasRef.current
    if (!cvs) return
    const ctx = cvs.getContext("2d")
    if (!ctx) return
    const rows = sticker.pixels
    const cols = Math.max(...rows.map(r => r.length))
    const ps = Math.floor(size / Math.max(rows.length, cols))
    cvs.width = cols * ps
    cvs.height = rows.length * ps
    ctx.clearRect(0, 0, cvs.width, cvs.height)
    for (let y = 0; y < rows.length; y++) {
      for (let x = 0; x < rows[y].length; x++) {
        const ch = rows[y][x]
        if (ch === "." || ch === " ") continue
        ctx.fillStyle = PALETTE[ch] || "#888"
        ctx.fillRect(x * ps, y * ps, ps, ps)
      }
    }
  }, [sticker, size])
  return <canvas ref={canvasRef} style={{ width: size, height: size, imageRendering: "pixelated" }} />
}

export function StickerReward({ onClose }: Props) {
  const [phase, setPhase] = useState<"spin" | "reveal">("spin")
  const [spinIndex, setSpinIndex] = useState(0)
  const [sticker, setSticker] = useState<Sticker | null>(null)
  const [isNew, setIsNew] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const won = pickSticker()
    setSticker(won)

    const prog = loadProgression()
    const alreadyOwned = prog.stickersOwned.includes(won.id)
    setIsNew(!alreadyOwned)
    if (!alreadyOwned) {
      prog.stickersOwned.push(won.id)
      saveProgression(prog)
    }

    let speed = 80
    let ticks = 0
    const maxTicks = 20

    intervalRef.current = setInterval(() => {
      ticks++
      setSpinIndex(i => (i + 1) % STICKERS.length)
      if (ticks >= maxTicks) {
        if (intervalRef.current) clearInterval(intervalRef.current)
        setPhase("reveal")
        playCelebrationSound()
      } else if (ticks > 12) {
        if (intervalRef.current) clearInterval(intervalRef.current)
        speed += 60
        intervalRef.current = setInterval(() => {
          ticks++
          setSpinIndex(i => (i + 1) % STICKERS.length)
          if (ticks >= maxTicks) {
            if (intervalRef.current) clearInterval(intervalRef.current)
            setPhase("reveal")
            playCelebrationSound()
          }
        }, speed)
      }
    }, speed)

    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [])

  const displaySticker = phase === "reveal" ? sticker : STICKERS[spinIndex % STICKERS.length]

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(10,10,20,0.92)",
    }} onClick={phase === "reveal" ? onClose : undefined}>
      <div style={{
        maxWidth: 300, width: "90%", textAlign: "center",
        background: "#1a1a2e", border: "4px solid #ffd93d",
        padding: 20, position: "relative",
      }}>
        {/* Title */}
        <div style={{
          fontFamily: pixel, fontSize: 10, color: "#ffd93d",
          letterSpacing: 2, marginBottom: 16,
          textShadow: "2px 2px 0 #ff2e63",
        }}>
          {phase === "spin" ? "★ STICKER EARNED ★" : "★ YOU GOT ★"}
        </div>

        {/* Slot machine display */}
        <div style={{
          width: 120, height: 120, margin: "0 auto",
          background: displaySticker?.bg || "#0a0a14",
          border: "4px solid #0a0a14",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: phase === "reveal" ? `0 0 30px ${RARITY_COLOR[sticker?.rarity || "common"]}60` : "none",
          transition: "box-shadow 0.3s",
        }}>
          {displaySticker && <MiniPixelSticker sticker={displaySticker} size={96} />}
        </div>

        {/* Name + rarity */}
        {phase === "reveal" && sticker && (
          <div style={{ marginTop: 12 }}>
            <div style={{
              fontFamily: pixel, fontSize: 10, color: "#fff",
              letterSpacing: 1,
            }}>{sticker.name}</div>
            <div style={{
              fontFamily: pixel, fontSize: 8, marginTop: 4,
              color: RARITY_COLOR[sticker.rarity],
              textTransform: "uppercase",
            }}>
              {isNew ? `★ NEW ${sticker.rarity} ★` : sticker.rarity}
            </div>
            <div style={{
              fontFamily: vt, fontSize: 18, color: "#8a8aad",
              marginTop: 12,
            }}>TAP TO CONTINUE</div>
          </div>
        )}

        {phase === "spin" && (
          <div style={{
            fontFamily: vt, fontSize: 20, color: "#4cf1ff",
            marginTop: 8, animation: "sc-bounce 0.5s ease-in-out infinite",
          }}>...</div>
        )}
      </div>
    </div>
  )
}
