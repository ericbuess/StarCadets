import { useState, useEffect } from "react"
import { loadProgression, xpIntoCurrentLevel } from "@/game/progression"

const pixel = "'Press Start 2P', monospace"
const vt = "'VT323', monospace"

export function XPDisplay() {
  const [prog, setProg] = useState(loadProgression)

  useEffect(() => {
    const interval = setInterval(() => setProg(loadProgression()), 2000)
    return () => clearInterval(interval)
  }, [])

  const { current, needed } = xpIntoCurrentLevel(prog.xp)
  const pct = needed > 0 ? Math.min(100, (current / needed) * 100) : 100

  return (
    <div style={{
      background: "#1a1a2e", border: "4px solid #b83dff", padding: 10,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 28, height: 28, background: "#b83dff",
            border: "3px solid #0a0a14",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: pixel, fontSize: 12, color: "#fff",
          }}>{prog.level}</div>
          <span style={{
            fontFamily: pixel, fontSize: 7, color: "#b83dff", letterSpacing: 1,
          }}>LEVEL</span>
        </div>
        <span style={{
          fontFamily: vt, fontSize: 18, color: "#8a8aad",
        }}>{current}/{needed} XP</span>
      </div>
      <div style={{ height: 8, background: "#0a0a14", border: "2px solid #2d2d5c", overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${pct}%`,
          background: "linear-gradient(90deg, #b83dff, #4cf1ff)",
          transition: "width 0.5s ease",
          boxShadow: "0 0 8px rgba(184,61,255,0.5)",
        }} />
      </div>
      <div style={{
        fontFamily: vt, fontSize: 16, color: "#8a8aad60",
        textAlign: "center", marginTop: 4,
      }}>TOTAL XP: {prog.xp}</div>
    </div>
  )
}
