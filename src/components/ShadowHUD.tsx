/**
 * Compact overlay that races the current run against a recorded ghost.
 * Polls the shadow session at ~4Hz so it doesn't tie into each frame.
 */

import { useEffect, useState } from "react"
import { getShadowSnapshot, type ShadowSnapshot } from "@/game/shadowMode"

export function ShadowHUD() {
  const [snap, setSnap] = useState<ShadowSnapshot>(() => getShadowSnapshot())

  useEffect(() => {
    const id = setInterval(() => {
      setSnap(getShadowSnapshot())
    }, 250)
    return () => clearInterval(id)
  }, [])

  if (!snap.active) return null

  const ahead = snap.delta >= 0
  const color = ahead ? "#00ff88" : "#ff5566"
  const glow = ahead ? "rgba(0,255,136,0.4)" : "rgba(255,85,102,0.4)"
  const label = snap.mode === "best" ? "vs BEST" : "vs LAST"
  const deltaText = `${ahead ? "+" : ""}${Math.round(snap.delta).toLocaleString()}`
  const ghostScore = Math.round(snap.ghostScore).toLocaleString()
  const ghostFinal = Math.round(snap.ghostFinalScore).toLocaleString()

  return (
    <div
      className="absolute top-14 right-3 z-20 pointer-events-none select-none"
      style={{
        fontFamily: "monospace",
        backgroundColor: "rgba(5,10,25,0.82)",
        border: `1px solid ${color}`,
        borderRadius: 10,
        padding: "6px 10px",
        boxShadow: `0 0 12px ${glow}`,
        minWidth: 110,
      }}
    >
      <div style={{ fontSize: 9, color: "rgba(255,255,255,0.5)", letterSpacing: 1, textTransform: "uppercase" }}>
        {label}
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color, textShadow: `0 0 6px ${glow}`, lineHeight: 1.1 }}>
        {deltaText}
      </div>
      <div style={{ fontSize: 9, color: "rgba(255,255,255,0.45)", marginTop: 1 }}>
        ghost {ghostScore} / {ghostFinal}
        {snap.ghostFinished && <span style={{ color: "#ffcc00" }}> ✓</span>}
      </div>
    </div>
  )
}
