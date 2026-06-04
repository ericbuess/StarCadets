import { ArcadeButton } from "@/components/arcade/ArcadeButton"
import { PixelSticker } from "./PixelSticker"
import { STICKERS, RARITY_COLOR } from "@/game/drillStickers"

interface Props {
  owned: string[]
  onBack: () => void
}

export function CollectionScreen({ owned, onBack }: Props) {
  return (
    <div style={{
      width: "100%", height: "100%", background: "#0a0a14",
      position: "relative", display: "flex", flexDirection: "column",
      padding: 24, boxSizing: "border-box", overflow: "auto",
    }}>
      {/* grid bg */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: "linear-gradient(#1a1a2e40 1px, transparent 1px), linear-gradient(90deg, #1a1a2e40 1px, transparent 1px)",
        backgroundSize: "60px 60px",
      }} />

      <div style={{ position: "relative", zIndex: 2 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <ArcadeButton variant="muted" size="sm" onClick={onBack}>← BACK</ArcadeButton>
          <div style={{ fontFamily: "'VT323', monospace", fontSize: 22, color: "#8a8aad" }}>
            {owned.length}/{STICKERS.length} COLLECTED
          </div>
        </div>

        <div style={{
          fontFamily: "'Press Start 2P', monospace", fontSize: "clamp(14px, 3vw, 22px)",
          color: "#ffd93d", textShadow: "4px 4px 0 #ff2e63, 8px 8px 0 #b83dff",
          letterSpacing: 2, textAlign: "center", marginBottom: 8,
        }}>HOLO-ARCHIVE</div>
        <div style={{
          fontFamily: "'VT323', monospace", fontSize: 20, color: "#4cf1ff",
          textAlign: "center", letterSpacing: 3, marginBottom: 24,
        }}>★ HEROES OF THE OUTER RIM ALLIANCE ★</div>

        <div style={{
          display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12,
          maxWidth: 500, margin: "0 auto",
        }}>
          {STICKERS.map(s => {
            const isOwned = owned.includes(s.id)
            const glow = RARITY_COLOR[s.rarity]
            return (
              <div key={s.id} style={{
                aspectRatio: "1/1", background: isOwned ? s.bg : "#1a1a2e",
                border: `4px solid ${isOwned ? glow : "#2d2d5c"}`,
                display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "center", padding: 8,
                boxShadow: isOwned ? `0 0 20px ${glow}40` : "none",
                transition: "all 0.3s",
              }}>
                {isOwned ? (
                  <>
                    <PixelSticker pixels={s.pixels} size={80} />
                    <div style={{
                      fontFamily: "'Press Start 2P', monospace", fontSize: 7,
                      color: "#fff", marginTop: 6, textAlign: "center", letterSpacing: 1, lineHeight: 1.4,
                    }}>{s.name}</div>
                    <div style={{
                      fontFamily: "'VT323', monospace", fontSize: 14,
                      color: glow, letterSpacing: 2, textTransform: "uppercase",
                    }}>{s.rarity}</div>
                  </>
                ) : (
                  <div style={{
                    fontFamily: "'Press Start 2P', monospace", fontSize: 28,
                    color: "#2d2d5c",
                  }}>???</div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
