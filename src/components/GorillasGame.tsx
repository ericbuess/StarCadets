import { useRef, useEffect, useState, useCallback } from "react"
import {
  initGorillas, updateGorillas, renderGorillas, launchBanana, newRound,
  type GorillasState,
} from "@/game/gorillasEngine"
import { initAudio } from "@/game/audio"
import { getEducationSet } from "@/game/education"
import type { EducationContent } from "@/game/types"
import { EducationOverlay } from "./EducationOverlay"
import { GameControls } from "./GameControls"
import { useEducationReward } from "@/hooks/useEducationReward"
import { StickerReward } from "./StickerReward"
import { LevelUpOverlay } from "./LevelUpOverlay"

interface Props {
  subjects: string[]
  grade?: string
  testMode?: boolean
  onToggleTestMode?: () => void
  onGameOver?: (score: number, rounds: number) => void
  onBackToHub?: () => void
}

const pixel = "'Press Start 2P', monospace"
const vt = "'VT323', monospace"

export function GorillasGame({ subjects, grade, testMode = false, onToggleTestMode, onGameOver, onBackToHub }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<GorillasState | null>(null)
  const animRef = useRef(0)
  const lastTimeRef = useRef(0)
  const audioInitRef = useRef(false)
  const roundCountRef = useRef(0)
  const prevPlayerTurnRef = useRef(false)

  const [isPaused, setIsPaused] = useState(false)
  const [showEducation, setShowEducation] = useState(false)
  const [educationContent, setEducationContent] = useState<EducationContent[]>([])
  const [angle, setAngle] = useState(45)
  const [power, setPower] = useState(50)
  const [phase, setPhase] = useState<string>("aiming")
  const [scores, setScores] = useState([0, 0])
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState(-1)
  const [showRoundWin, setShowRoundWin] = useState(false)
  const { reward, onEducationCorrect, dismissReward } = useEducationReward()

  const triggerEducation = useCallback(() => {
    if (testMode) return
    const content = getEducationSet(subjects, grade)
    if (content.length > 0) {
      setEducationContent(content)
      setShowEducation(true)
    }
  }, [subjects, grade, testMode])

  useEffect(() => {
    (document.activeElement as HTMLElement)?.blur()
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      canvas.width = canvas.clientWidth * dpr
      canvas.height = canvas.clientHeight * dpr
    }
    resize()
    window.addEventListener("resize", resize)

    const GW = 480
    const GH = 320
    const state = initGorillas(GW, GH)
    stateRef.current = state

    const loop = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp
      let dt = (timestamp - lastTimeRef.current) / 1000
      lastTimeRef.current = timestamp
      dt = Math.min(dt, 0.05)

      if (!isPaused && !showEducation) {
        updateGorillas(state, dt)
        setPhase(state.phase)
        const isPlayerTurnNow = state.phase === "aiming" && state.turn === 0
        if (isPlayerTurnNow && !prevPlayerTurnRef.current) {
          setAngle(45)
          setPower(50)
        }
        prevPlayerTurnRef.current = isPlayerTurnNow
        setScores([state.gorillas[0].wins, state.gorillas[1].wins])

        if (state.phase === "roundOver") {
          setShowRoundWin(true)
          roundCountRef.current++
          if (roundCountRef.current % 2 === 0) {
            setTimeout(() => triggerEducation(), 500)
          }
        }

        if (state.phase === "gameOver") {
          setGameOver(true)
          setWinner(state.gorillas[0].wins >= state.roundsToWin ? 0 : 1)
        }
      }

      resize()
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      renderGorillas(ctx, state, canvas.width, canvas.height)

      animRef.current = requestAnimationFrame(loop)
    }
    animRef.current = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(animRef.current)
      window.removeEventListener("resize", resize)
    }
  }, [isPaused, showEducation, triggerEducation])

  const handleFire = () => {
    if (!audioInitRef.current) { initAudio(); audioInitRef.current = true }
    const state = stateRef.current
    if (!state || state.phase !== "aiming" || state.gorillas[state.turn].isAI) return
    state.angle = angle
    state.power = power
    launchBanana(state)
  }

  const handleContinueRound = () => {
    const state = stateRef.current
    if (!state) return
    setShowRoundWin(false)
    newRound(state)
    setPhase("aiming")
    setAngle(45)
    setPower(50)
  }

  const handleEducationComplete = (passed: boolean) => {
    setShowEducation(false)
    if (passed) {
      onEducationCorrect()
    } else if (!testMode) {
      onGameOver?.(stateRef.current?.score || 0, roundCountRef.current)
    }
  }

  const handleRestart = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const state = initGorillas(480, 320)
    stateRef.current = state
    roundCountRef.current = 0
    setGameOver(false)
    setWinner(-1)
    setShowRoundWin(false)
    setPhase("aiming")
    setAngle(45)
    setPower(50)
    setScores([0, 0])
  }

  const isPlayerTurn = stateRef.current?.turn === 0 && phase === "aiming"

  return (
    <div style={{ width: "100%", height: "100%", position: "relative", background: "#0a0a14" }}>
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />

      <GameControls
        isPaused={isPaused}
        testMode={testMode}
        onTogglePause={() => setIsPaused(p => !p)}
        onToggleTestMode={onToggleTestMode ?? (() => {})}
        onBackToHub={onBackToHub}
      />

      {/* Aiming controls */}
      {isPlayerTurn && !isPaused && !showEducation && !showRoundWin && !gameOver && (
        <div style={{
          position: "absolute", bottom: "25%", left: 8, right: 8,
          display: "flex", alignItems: "flex-end", gap: 8,
          zIndex: 30,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <span style={{ fontFamily: pixel, fontSize: 7, color: "#4cf1ff", width: 42 }}>ANGLE</span>
              <button onClick={() => setAngle(a => Math.max(5, a - 5))} style={btnStyle}>-</button>
              <input type="range" min={5} max={85} value={angle}
                onChange={e => setAngle(Number(e.target.value))}
                style={{ flex: 1, accentColor: "#4cf1ff" }} />
              <button onClick={() => setAngle(a => Math.min(85, a + 5))} style={btnStyle}>+</button>
              <span style={{ fontFamily: vt, fontSize: 20, color: "#4cf1ff", width: 36, textAlign: "right" }}>{angle}°</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontFamily: pixel, fontSize: 7, color: "#ff7a1f", width: 42 }}>POWER</span>
              <button onClick={() => setPower(p => Math.max(10, p - 5))} style={btnStyle}>-</button>
              <input type="range" min={10} max={100} value={power}
                onChange={e => setPower(Number(e.target.value))}
                style={{ flex: 1, accentColor: "#ff7a1f" }} />
              <button onClick={() => setPower(p => Math.min(100, p + 5))} style={btnStyle}>+</button>
              <span style={{ fontFamily: vt, fontSize: 20, color: "#ff7a1f", width: 36, textAlign: "right" }}>{power}</span>
            </div>
          </div>
          <button onClick={handleFire} style={{
            background: "#3ce67a", border: "4px solid #0a0a14", padding: "12px 20px",
            fontFamily: pixel, fontSize: 12, color: "#0a0a14", cursor: "pointer",
            boxShadow: "0 4px 0 #1a8a4a",
          }}>FIRE!</button>
        </div>
      )}

      {/* AI thinking indicator */}
      {phase === "aiming" && stateRef.current?.gorillas[stateRef.current.turn]?.isAI && !isPaused && (
        <div style={{
          position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
          fontFamily: pixel, fontSize: 10, color: "#ff2e63",
          textShadow: "0 0 10px #ff2e63",
          animation: "sc-bounce 1s ease-in-out infinite",
        }}>AI AIMING...</div>
      )}

      {/* Round win overlay */}
      {showRoundWin && !showEducation && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 50,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(10,10,20,0.85)",
        }} onClick={handleContinueRound}>
          <div style={{ textAlign: "center" }}>
            <div style={{
              fontFamily: pixel, fontSize: 18, color: "#ffd93d",
              textShadow: "3px 3px 0 #ff2e63",
            }}>{stateRef.current?.roundWinner === 0 ? "YOU WIN!" : "AI WINS!"}</div>
            <div style={{
              fontFamily: vt, fontSize: 24, color: "#8a8aad", marginTop: 8,
            }}>Round {roundCountRef.current}</div>
            <div style={{
              fontFamily: pixel, fontSize: 10, color: "#3ce67a", marginTop: 4,
            }}>P1: {scores[0]}  -  AI: {scores[1]}</div>
            <div style={{
              fontFamily: vt, fontSize: 20, color: "#4cf1ff", marginTop: 16,
            }}>TAP TO CONTINUE</div>
          </div>
        </div>
      )}

      {/* Game over */}
      {gameOver && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 50,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(10,10,20,0.9)",
        }}>
          <div style={{ textAlign: "center" }}>
            <div style={{
              fontFamily: pixel, fontSize: 14, color: "#ffd93d",
              textShadow: "3px 3px 0 #ff2e63, 6px 6px 0 #b83dff",
            }}>GAME OVER</div>
            <div style={{
              fontFamily: pixel, fontSize: 20, color: winner === 0 ? "#3ce67a" : "#ff2e63",
              marginTop: 12,
            }}>{winner === 0 ? "YOU WIN!" : "AI WINS!"}</div>
            <div style={{
              fontFamily: vt, fontSize: 22, color: "#fff", marginTop: 8,
            }}>Final Score: {scores[0]} - {scores[1]}</div>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 20 }}>
              <button onClick={handleRestart} style={{
                background: "#3ce67a", border: "4px solid #0a0a14", padding: "10px 20px",
                fontFamily: pixel, fontSize: 9, color: "#0a0a14", cursor: "pointer",
              }}>PLAY AGAIN</button>
              <button onClick={() => onBackToHub?.()} style={{
                background: "#2d2d5c", border: "4px solid #0a0a14", padding: "10px 20px",
                fontFamily: pixel, fontSize: 9, color: "#fff", cursor: "pointer",
              }}>BACK TO HUB</button>
            </div>
          </div>
        </div>
      )}

      {showEducation && (
        <EducationOverlay content={educationContent} onComplete={handleEducationComplete} testMode={testMode} />
      )}
      {reward.showSticker && <StickerReward onClose={dismissReward} />}
      {reward.showLevelUp && reward.levelUpData && (
        <LevelUpOverlay level={reward.levelUpData.newLevel} unlockedVehicle={reward.levelUpData.unlockedVehicle} onClose={dismissReward} />
      )}
    </div>
  )
}

const btnStyle: React.CSSProperties = {
  width: 28, height: 28, background: "#1a1a2e", border: "3px solid #2d2d5c",
  fontFamily: "'VT323', monospace", fontSize: 20, color: "#fff", cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center", padding: 0,
}
