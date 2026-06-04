import { useState, useEffect } from "react"
import { ArcadeButton } from "@/components/arcade/ArcadeButton"
import { StarFieldBg } from "@/components/arcade/StarFieldBg"
import { starsFromCorrect, accuracy, perMin } from "@/game/drillScoring"
import type { DrillResult } from "@/types/drill"

interface Props {
  result: DrillResult
  onPlayAgain: () => void
  onHome: () => void
  onClaim: () => void
  hasReward: boolean
}

export function DrillResultsScreen({ result, onPlayAgain, onHome, onClaim, hasReward }: Props) {
  const stars = starsFromCorrect(result.correct)
  const acc = accuracy(result.correct, result.correct + result.wrong)
  const rate = perMin(result.correct, result.elapsedSec)
  const [revealedStars, setRevealedStars] = useState(0)

  useEffect(() => {
    if (revealedStars < stars) {
      const t = setTimeout(() => setRevealedStars(s => s + 1), 400)
      return () => clearTimeout(t)
    }
  }, [revealedStars, stars])

  return (
    <div style={{
      width: "100%", height: "100%", background: "#0a0a14",
      position: "relative", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", padding: 24, boxSizing: "border-box",
    }}>
      <StarFieldBg count={40} />

      <div style={{ position: "relative", zIndex: 2, textAlign: "center", width: "100%", maxWidth: 500 }}>
        <div style={{
          fontFamily: "'Press Start 2P', monospace", fontSize: "clamp(20px, 5vw, 36px)",
          color: "#ffd93d", textShadow: "4px 4px 0 #ff2e63, 8px 8px 0 #b83dff",
          letterSpacing: 2, marginBottom: 20,
        }}>MISSION CLEAR!</div>

        {/* Star rating */}
        <div style={{ display: "flex", justifyContent: "center", gap: 12, marginBottom: 24 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{
              fontSize: 48, transition: "all 0.4s",
              transform: i <= revealedStars ? "scale(1.2)" : "scale(0.7)",
              opacity: i <= revealedStars ? 1 : 0.2,
              filter: i <= revealedStars ? "drop-shadow(0 0 12px #ffd93d)" : "none",
            }}>⭐</div>
          ))}
        </div>

        {/* Stat grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
          {[
            { label: "DIRECT HITS", value: result.correct, color: "#3ce67a" },
            { label: "ACCURACY", value: `${acc}%`, color: "#4cf1ff" },
            { label: "PER MINUTE", value: rate, color: "#ffd93d" },
            { label: "BEST COMBO", value: result.correct, color: "#ff7a1f" },
          ].map(s => (
            <div key={s.label} style={{
              background: "#1a1a2e", border: "4px solid #2d2d5c", padding: 14, textAlign: "center",
            }}>
              <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: "#8a8aad", letterSpacing: 1 }}>{s.label}</div>
              <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 24, color: s.color, marginTop: 6 }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
          {hasReward && (
            <ArcadeButton variant="yellow" size="lg" onClick={onClaim}>★ OPEN CRATE ★</ArcadeButton>
          )}
          <ArcadeButton variant="green" onClick={onPlayAgain}>PLAY AGAIN</ArcadeButton>
          <ArcadeButton variant="muted" size="sm" onClick={onHome}>HOME</ArcadeButton>
        </div>
      </div>
    </div>
  )
}
