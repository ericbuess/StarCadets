import { ArcadeButton } from "@/components/arcade/ArcadeButton"
import type { DrillSettings, SessionMode } from "@/types/drill"

interface Props {
  settings: DrillSettings
  onUpdate: (fn: (s: DrillSettings) => DrillSettings) => void
  onBack: () => void
  onStart: () => void
}

const SESSIONS: { mode: SessionMode; label: string; sub: string }[] = [
  { mode: "60s", label: "60 SECONDS", sub: "HOW MANY CAN YOU GET?" },
  { mode: "20p", label: "20 PROBLEMS", sub: "HOW FAST CAN YOU GO?" },
  { mode: "30s", label: "30-SECOND SPRINT", sub: "FOR RECKLESS PILOTS" },
]

const PEN_COLORS = [
  { color: "#4cf1ff", name: "CYAN" },
  { color: "#3ce67a", name: "GREEN" },
  { color: "#ff2e63", name: "PINK" },
  { color: "#ffd93d", name: "YELLOW" },
  { color: "#b83dff", name: "PURPLE" },
  { color: "#ffffff", name: "WHITE" },
]

export function DrillSettingsScreen({ settings, onUpdate, onBack, onStart }: Props) {
  return (
    <div style={{
      width: "100%", height: "100%",
      background: "linear-gradient(180deg,#0a0a14 0%, #1a0a3e 60%, #3d1a6e 100%)",
      position: "relative", display: "flex", flexDirection: "column",
      padding: 24, boxSizing: "border-box", overflow: "auto",
    }}>
      <div style={{ position: "relative", zIndex: 2 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <ArcadeButton variant="muted" size="sm" onClick={onBack}>← BACK</ArcadeButton>
        </div>

        <div style={{
          fontFamily: "'Press Start 2P', monospace", fontSize: "clamp(12px, 3vw, 18px)",
          color: "#ffd93d", textShadow: "2px 2px 0 #ff2e63",
          letterSpacing: 2, textAlign: "center", marginBottom: 24,
        }}>MISSION BRIEFING</div>

        {/* Session mode */}
        <div style={{ background: "#1a1a2e", border: "4px solid #2d2d5c", padding: 16, marginBottom: 16, maxWidth: 500, margin: "0 auto 16px" }}>
          <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 9, color: "#4cf1ff", letterSpacing: 2, marginBottom: 12 }}>MISSION LENGTH</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {SESSIONS.map(s => (
              <button key={s.mode} onClick={() => onUpdate(prev => ({ ...prev, session: s.mode }))}
                style={{
                  background: settings.session === s.mode ? "#ffd93d15" : "transparent",
                  border: `3px solid ${settings.session === s.mode ? "#ffd93d" : "#2d2d5c"}`,
                  padding: "10px 14px", cursor: "pointer", textAlign: "left",
                  boxShadow: settings.session === s.mode ? "0 0 20px rgba(255,217,61,0.2)" : "none",
                }}>
                <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 10, color: "#fff", letterSpacing: 1 }}>{s.label}</div>
                <div style={{ fontFamily: "'VT323', monospace", fontSize: 18, color: "#8a8aad", marginTop: 2 }}>{s.sub}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Pen color */}
        <div style={{ background: "#1a1a2e", border: "4px solid #2d2d5c", padding: 16, marginBottom: 16, maxWidth: 500, margin: "0 auto 16px" }}>
          <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 9, color: "#4cf1ff", letterSpacing: 2, marginBottom: 12 }}>INK COLOUR</div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {PEN_COLORS.map(p => (
              <button key={p.color} onClick={() => onUpdate(prev => ({ ...prev, penColor: p.color }))}
                style={{
                  width: 44, height: 44, background: p.color, cursor: "pointer",
                  border: settings.penColor === p.color ? "4px solid #fff" : "4px solid #0a0a14",
                  boxShadow: settings.penColor === p.color ? `0 0 16px ${p.color}` : "none",
                }} title={p.name} />
            ))}
          </div>
        </div>

        {/* Start button */}
        <div style={{ textAlign: "center", marginTop: 20 }}>
          <ArcadeButton variant="pink" size="lg" onClick={onStart}>▶ START MISSION!</ArcadeButton>
          <div style={{
            fontFamily: "'VT323', monospace", fontSize: 18, color: "#8a8aad",
            marginTop: 8, animation: "sc-blink 1.5s infinite",
          }}>BEGIN YOUR TRAINING</div>
        </div>
      </div>
    </div>
  )
}
