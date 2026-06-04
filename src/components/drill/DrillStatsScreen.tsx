import { ArcadeButton } from "@/components/arcade/ArcadeButton"
import { StarFieldBg } from "@/components/arcade/StarFieldBg"
import { accuracy } from "@/game/drillScoring"
import type { DrillStats } from "@/types/drill"

interface Props {
  stats: DrillStats
  onBack: () => void
}

const DAYS = ["M", "T", "W", "T", "F", "S", "S"]

export function DrillStatsScreen({ stats, onBack }: Props) {
  const acc = accuracy(stats.totalCorrect, stats.totalAttempts)
  const maxWeek = Math.max(1, ...stats.lastWeek)

  return (
    <div style={{
      width: "100%", height: "100%", background: "#0a0a14",
      position: "relative", display: "flex", flexDirection: "column",
      padding: 24, boxSizing: "border-box", overflow: "auto",
    }}>
      <StarFieldBg count={15} />

      <div style={{ position: "relative", zIndex: 2 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <ArcadeButton variant="muted" size="sm" onClick={onBack}>← BACK</ArcadeButton>
        </div>

        <div style={{
          fontFamily: "'Press Start 2P', monospace", fontSize: "clamp(14px, 3vw, 22px)",
          color: "#ffd93d", textShadow: "4px 4px 0 #ff2e63, 8px 8px 0 #b83dff",
          letterSpacing: 2, textAlign: "center", marginBottom: 24,
        }}>FLIGHT LOG</div>

        {/* Stat tiles */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20, maxWidth: 500, margin: "0 auto 20px" }}>
          {[
            { label: "TOTAL STARS", value: `★ ${stats.totalStars}`, color: "#ffd93d" },
            { label: "DRILLS", value: stats.drillsCompleted, color: "#4cf1ff" },
            { label: "ACCURACY", value: `${acc}%`, color: "#3ce67a" },
            { label: "BEST /MIN", value: stats.bestPerMin, color: "#ff7a1f" },
          ].map(s => (
            <div key={s.label} style={{ background: "#1a1a2e", border: "4px solid #2d2d5c", padding: 14, textAlign: "center" }}>
              <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: "#8a8aad", letterSpacing: 1 }}>{s.label}</div>
              <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 22, color: s.color, marginTop: 6 }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Streak */}
        <div style={{
          background: "#1a1a2e", border: "4px solid #ff7a1f", padding: "12px 16px",
          textAlign: "center", marginBottom: 20, maxWidth: 500, margin: "0 auto 20px",
          boxShadow: stats.streak >= 3 ? "0 0 20px rgba(255,122,31,0.4)" : "none",
        }}>
          <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 9, color: "#8a8aad", letterSpacing: 1 }}>TRAINING STREAK</div>
          <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 36, color: "#ff7a1f", marginTop: 4 }}>
            {stats.streak >= 3 ? "🔥 " : ""}{stats.streak} {stats.streak === 1 ? "DAY" : "DAYS"}
          </div>
        </div>

        {/* Weekly chart */}
        <div style={{ background: "#1a1a2e", border: "4px solid #2d2d5c", padding: 16, maxWidth: 500, margin: "0 auto 20px" }}>
          <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 9, color: "#8a8aad", letterSpacing: 1, marginBottom: 12 }}>THIS WEEK</div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 80 }}>
            {stats.lastWeek.map((v, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{
                  width: "100%", height: Math.max(4, (v / maxWeek) * 60),
                  background: v > 0 ? "#4cf1ff" : "#2d2d5c",
                  boxShadow: v > 0 ? "0 0 8px #4cf1ff40" : "none",
                  transition: "height 0.3s",
                }} />
                <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: "#8a8aad" }}>{DAYS[i]}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent runs */}
        {stats.recentRuns.length > 0 && (
          <div style={{ background: "#1a1a2e", border: "4px solid #2d2d5c", padding: 16, maxWidth: 500, margin: "0 auto" }}>
            <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 9, color: "#8a8aad", letterSpacing: 1, marginBottom: 12 }}>RECENT MISSIONS</div>
            {stats.recentRuns.slice(0, 5).map((r, i) => (
              <div key={i} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "8px 0", borderBottom: i < stats.recentRuns.length - 1 ? "1px dashed #2d2d5c" : "none",
              }}>
                <span style={{ fontFamily: "'VT323', monospace", fontSize: 20, color: "#8a8aad" }}>{r.when}</span>
                <span style={{ fontFamily: "'VT323', monospace", fontSize: 20, color: "#fff" }}>{r.correct}/{r.total}</span>
                <span style={{ fontFamily: "'VT323', monospace", fontSize: 20, color: "#ffd93d" }}>{"⭐".repeat(r.stars)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
