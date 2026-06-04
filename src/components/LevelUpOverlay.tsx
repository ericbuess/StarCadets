import { useEffect } from "react"
import { playCelebrationSound } from "@/game/audio"
import { getVehicleUnlockLevel } from "@/game/progression"

interface Props {
  level: number
  unlockedVehicle: string | null
  onClose: () => void
}

const pixel = "'Press Start 2P', monospace"
const vt = "'VT323', monospace"

import { VEHICLES } from "@/game/types"

const VEHICLE_NAMES: Record<string, string> = Object.fromEntries(
  VEHICLES.map(v => [v.id, v.name])
)

export function LevelUpOverlay({ level, unlockedVehicle, onClose }: Props) {
  useEffect(() => { playCelebrationSound() }, [])

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(10,10,20,0.92)",
    }} onClick={onClose}>
      <div style={{
        maxWidth: 320, width: "90%", textAlign: "center",
        background: "#1a1a2e", border: "4px solid #ffd93d",
        padding: 24, position: "relative",
      }}>
        <div style={{
          fontFamily: pixel, fontSize: 8, color: "#4cf1ff",
          letterSpacing: 2, marginBottom: 8,
        }}>★ PROMOTION ★</div>

        <div style={{
          fontFamily: pixel, fontSize: 24, color: "#ffd93d",
          textShadow: "3px 3px 0 #ff2e63, 6px 6px 0 #b83dff",
          animation: "sc-bounce 2s ease-in-out infinite",
        }}>LEVEL {level}</div>

        <div style={{
          fontFamily: vt, fontSize: 22, color: "#fff",
          marginTop: 8,
        }}>RANK INCREASED!</div>

        {unlockedVehicle && (
          <div style={{
            marginTop: 16, padding: 12,
            background: "#b83dff15", border: "3px solid #b83dff",
          }}>
            <div style={{
              fontFamily: pixel, fontSize: 7, color: "#b83dff",
              letterSpacing: 1, marginBottom: 4,
            }}>VEHICLE UNLOCKED</div>
            <div style={{
              fontFamily: pixel, fontSize: 12, color: "#fff",
            }}>{VEHICLE_NAMES[unlockedVehicle] || unlockedVehicle.toUpperCase()}</div>
            <div style={{
              fontFamily: vt, fontSize: 16, color: "#8a8aad",
              marginTop: 4,
            }}>Unlocked at Level {getVehicleUnlockLevel(unlockedVehicle)}</div>
          </div>
        )}

        <div style={{
          fontFamily: vt, fontSize: 18, color: "#8a8aad",
          marginTop: 16,
        }}>TAP TO CONTINUE</div>
      </div>
    </div>
  )
}
