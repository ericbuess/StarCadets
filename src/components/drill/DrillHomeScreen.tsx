import { ArcadeButton } from "@/components/arcade/ArcadeButton"
import { StarFieldBg } from "@/components/arcade/StarFieldBg"

interface Props {
  playerName: string
  totalStars: number
  totalStickers: number
  onStart: () => void
  onSettings: () => void
  onStats: () => void
  onCollection: () => void
  onBack: () => void
}

export function DrillHomeScreen({ playerName, totalStars, totalStickers, onStart, onSettings, onStats, onCollection, onBack }: Props) {
  return (
    <div style={{
      width: "100%", height: "100%",
      background: "linear-gradient(180deg,#0a0a14 0%, #1a0a3e 60%, #3d1a6e 100%)",
      position: "relative", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", padding: 24, boxSizing: "border-box",
    }}>
      <StarFieldBg count={40} />

      <div style={{ position: "relative", zIndex: 2, textAlign: "center", width: "100%", maxWidth: 500 }}>
        {/* HUD */}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
          <div style={{
            background: "#1a1a2e", border: "4px solid #4cf1ff", padding: "8px 14px",
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <div style={{
              width: 32, height: 32, background: "#ffd93d", border: "3px solid #0a0a14",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "'Press Start 2P', monospace", fontSize: 14, color: "#0a0a14",
            }}>A</div>
            <div>
              <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: "#4cf1ff", letterSpacing: 1 }}>CADET</div>
              <div style={{ fontFamily: "'VT323', monospace", fontSize: 20, color: "#fff" }}>{playerName || "RECRUIT"}</div>
            </div>
          </div>
          <div style={{
            background: "#1a1a2e", border: "4px solid #ffd93d", padding: "8px 14px",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <span style={{ fontSize: 20 }}>⭐</span>
            <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 16, color: "#ffd93d" }}>{totalStars}</span>
          </div>
        </div>

        {/* Title */}
        <div style={{
          fontFamily: "'Press Start 2P', monospace", fontSize: "clamp(20px, 6vw, 36px)",
          color: "#ffd93d", textShadow: "4px 4px 0 #ff2e63, 8px 8px 0 #b83dff, 12px 12px 0 #0a0a14",
          letterSpacing: 2, animation: "sc-bounce 3s ease-in-out infinite", marginBottom: 8,
        }}>STAR CADETS</div>
        <div style={{
          fontFamily: "'VT323', monospace", fontSize: 22, color: "#4cf1ff",
          letterSpacing: 3, marginBottom: 32,
        }}>★ ACADEMY OF THE OUTER RIM ★</div>

        {/* Play button */}
        <div style={{ marginBottom: 24 }}>
          <ArcadeButton variant="pink" size="lg" onClick={onStart}>▶ PLAY!</ArcadeButton>
          <div style={{
            fontFamily: "'VT323', monospace", fontSize: 18, color: "#8a8aad",
            marginTop: 8, animation: "sc-blink 1.5s infinite",
          }}>BEGIN YOUR TRAINING</div>
        </div>

        {/* Nav tiles */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <button onClick={onCollection} style={{
            background: "#1a1a2e", border: "4px solid #b83dff", padding: 14,
            cursor: "pointer", textAlign: "center",
          }}>
            <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 9, color: "#b83dff", letterSpacing: 1 }}>HOLO-ARCHIVE</div>
            <div style={{ fontFamily: "'VT323', monospace", fontSize: 20, color: "#8a8aad", marginTop: 4 }}>{totalStickers}/9 COLLECTED</div>
          </button>
          <button onClick={onStats} style={{
            background: "#1a1a2e", border: "4px solid #3da5ff", padding: 14,
            cursor: "pointer", textAlign: "center",
          }}>
            <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 9, color: "#3da5ff", letterSpacing: 1 }}>FLIGHT LOG</div>
            <div style={{ fontFamily: "'VT323', monospace", fontSize: 20, color: "#8a8aad", marginTop: 4 }}>VIEW STATS</div>
          </button>
        </div>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 16 }}>
          <ArcadeButton variant="cyan" size="sm" onClick={onSettings}>BRIEFING</ArcadeButton>
          <ArcadeButton variant="muted" size="sm" onClick={onBack}>← HUB</ArcadeButton>
        </div>

        <div style={{
          fontFamily: "'VT323', monospace", fontSize: 18, color: "#8a8aad60",
          marginTop: 20, letterSpacing: 2,
        }}>A LONG TIME AGO, IN A MATH CLASS FAR, FAR AWAY…</div>
      </div>
    </div>
  )
}
