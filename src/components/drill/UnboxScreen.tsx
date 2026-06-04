import { useState, useEffect, useRef } from "react"
import { ArcadeButton } from "@/components/arcade/ArcadeButton"
import { PixelSticker } from "./PixelSticker"
import { STICKERS, RARITY_COLOR } from "@/game/drillStickers"
import type { Sticker } from "@/types/drill"

interface Props {
  sticker: Sticker
  onDone: () => void
}

export function UnboxScreen({ sticker, onDone }: Props) {
  const [phase, setPhase] = useState<"spinning" | "reveal">("spinning")
  const [spinIdx, setSpinIdx] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    let speed = 80
    let count = 0
    const maxSpins = 20

    const tick = () => {
      setSpinIdx(i => (i + 1) % STICKERS.length)
      count++
      if (count >= maxSpins) {
        if (intervalRef.current) clearInterval(intervalRef.current)
        setPhase("reveal")
        return
      }
      if (count > maxSpins - 6) {
        speed += 60
        if (intervalRef.current) clearInterval(intervalRef.current)
        intervalRef.current = setInterval(tick, speed)
      }
    }
    intervalRef.current = setInterval(tick, speed)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [])

  const glowColor = RARITY_COLOR[sticker.rarity] || "#8a8aad"
  const shown = phase === "reveal" ? sticker : STICKERS[spinIdx % STICKERS.length]

  return (
    <div style={{
      width: "100%", height: "100%", background: "#0a0a14",
      position: "relative", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", overflow: "hidden",
    }}>
      {/* Radial beams */}
      {phase === "reveal" && (
        <div style={{
          position: "absolute", inset: "-50%",
          background: `conic-gradient(from 0deg, transparent, ${glowColor}20, transparent, ${glowColor}20, transparent, ${glowColor}20, transparent, ${glowColor}20, transparent)`,
          animation: "sc-spin 8s linear infinite",
        }} />
      )}

      <div style={{ position: "relative", zIndex: 2, textAlign: "center" }}>
        <div style={{
          fontFamily: "'Press Start 2P', monospace", fontSize: "clamp(10px, 3vw, 14px)",
          color: "#4cf1ff", letterSpacing: 2, marginBottom: 24,
        }}>
          {phase === "spinning" ? "◆ SUPPLY CRATE INCOMING ◆" : "★ RECRUIT ACQUIRED ★"}
        </div>

        {/* Sticker display */}
        <div style={{
          width: 200, height: 200, margin: "0 auto 20px",
          background: shown.bg, border: `6px solid ${phase === "reveal" ? glowColor : "#2d2d5c"}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: phase === "reveal" ? `0 0 60px ${glowColor}, 0 0 120px ${glowColor}40` : "none",
          transition: "all 0.3s",
        }}>
          <PixelSticker pixels={shown.pixels} size={160} />
        </div>

        {phase === "reveal" && (
          <>
            <div style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: "clamp(14px, 4vw, 22px)", color: "#fff", letterSpacing: 2,
              textShadow: `4px 4px 0 ${glowColor}`, marginBottom: 8,
            }}>{sticker.name}</div>
            <div style={{
              fontFamily: "'VT323', monospace", fontSize: 24,
              color: glowColor, letterSpacing: 3, textTransform: "uppercase", marginBottom: 24,
            }}>{sticker.rarity}</div>
            <ArcadeButton variant="yellow" onClick={onDone}>FILE IN ARCHIVE!</ArcadeButton>
          </>
        )}
      </div>
    </div>
  )
}
