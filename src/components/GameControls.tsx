interface Props {
  isPaused: boolean
  testMode: boolean
  onTogglePause: () => void
  onToggleTestMode: () => void
  onBackToHub?: () => void
}

const pixel = "'Press Start 2P', monospace"

export function GameControls({ isPaused, testMode, onTogglePause, onToggleTestMode, onBackToHub }: Props) {
  return (
    <>
      {/* Top-right buttons */}
      <div style={{
        position: "absolute", top: 12, right: 12, zIndex: 10,
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <button onClick={onToggleTestMode} style={{
          height: 32, padding: "0 10px",
          fontFamily: pixel, fontSize: 7, letterSpacing: 1,
          background: testMode ? "rgba(255,46,99,0.4)" : "rgba(26,26,46,0.7)",
          border: `2px solid ${testMode ? "#ff2e63" : "#2d2d5c"}`,
          color: testMode ? "#ff2e63" : "#8a8aad", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {testMode ? "SKIP Q" : "TEST"}
        </button>
        <button onClick={onTogglePause} style={{
          width: 40, height: 40,
          background: "rgba(26,26,46,0.7)", border: "2px solid #4cf1ff",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#4cf1ff", fontSize: 18, cursor: "pointer",
        }}>
          {isPaused ? "\u25B6" : "\u23F8"}
        </button>
      </div>

      {/* Pause overlay */}
      {isPaused && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 20,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(10,10,20,0.85)",
        }}>
          <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 14, width: 240 }}>
            <div style={{
              fontFamily: pixel, fontSize: 24, color: "#ffd93d",
              textShadow: "3px 3px 0 #ff2e63, 6px 6px 0 #b83dff",
            }}>PAUSED</div>
            <button onClick={onTogglePause} style={{
              background: "#ffd93d", border: "4px solid #ffd93d",
              padding: "14px 0", cursor: "pointer",
              fontFamily: pixel, fontSize: 10, color: "#0a0a14",
              boxShadow: "0 0 16px #ffd93d30, inset 0 -4px 0 #cc9900",
            }}>RESUME</button>
            <button onClick={onToggleTestMode} style={{
              background: testMode ? "rgba(255,46,99,0.2)" : "transparent",
              border: `4px solid ${testMode ? "#ff2e63" : "#2d2d5c"}`,
              padding: "12px 0", cursor: "pointer",
              fontFamily: pixel, fontSize: 8, color: testMode ? "#ff2e63" : "#8a8aad",
            }}>{testMode ? "TEST: ON" : "TEST: OFF"}</button>
            <button onClick={onBackToHub} style={{
              background: "#1a1a2e", border: "4px solid #2d2d5c",
              padding: "12px 0", cursor: "pointer",
              fontFamily: pixel, fontSize: 8, color: "#8a8aad",
            }}>← BACK TO HUB</button>
          </div>
        </div>
      )}
    </>
  )
}
