import { useRef, useEffect, useCallback, useState } from "react"
import { createBrickBreakerState, updateBrickBreaker, renderBrickBreaker } from "@/game/brickBreakerEngine"
import type { BrickBreakerState } from "@/game/brickBreakerEngine"
import { initAudio, playCrashSound } from "@/game/audio"
import { getEducationSet } from "@/game/education"
import type { EducationContent } from "@/game/types"
import { EducationOverlay } from "./EducationOverlay"
import { GameControls } from "./GameControls"
import { ShadowHUD } from "./ShadowHUD"
import { useShadowSession } from "@/hooks/useShadowSession"
import { useEducationReward } from "@/hooks/useEducationReward"
import { StickerReward } from "./StickerReward"
import { LevelUpOverlay } from "./LevelUpOverlay"

const PADDLE_COLORS = ["#00f0ff", "#ff00ff", "#3ce67a", "#ffd93d", "#ff2e63", "#ff7a1f", "#b83dff", "#fff"]

interface Props {
  subjects: string[]
  grade?: string
  testMode?: boolean
  onToggleTestMode?: () => void
  onGameOver?: (score: number, distance: number) => void
  onBackToHub?: () => void
}

export function BrickBreakerGame({ subjects, grade, testMode = false, onToggleTestMode, onGameOver, onBackToHub }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<BrickBreakerState | null>(null)
  const paddleXRef = useRef(0.5)
  const animRef = useRef(0)
  const lastTimeRef = useRef(0)
  const audioInitRef = useRef(false)
  const lastEducationTimeRef = useRef(0)
  const [isPaused, setIsPaused] = useState(false)
  const [showEducation, setShowEducation] = useState(false)
  const [educationContent, setEducationContent] = useState<EducationContent[]>([])
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [paddleColor, setPaddleColor] = useState(() => localStorage.getItem("sc_paddle_color") || "#00f0ff")
  const shadow = useShadowSession("brickbreaker")
  const { reward, onEducationCorrect, dismissReward } = useEducationReward()

  useEffect(() => {
    (document.activeElement as HTMLElement)?.blur()
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const state = createBrickBreakerState()
    stateRef.current = state
    shadow.restart()

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      canvas.width = canvas.clientWidth * dpr
      canvas.height = canvas.clientHeight * dpr
    }
    resize()
    window.addEventListener("resize", resize)

    const loop = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp
      let dt = (timestamp - lastTimeRef.current) / 1000
      lastTimeRef.current = timestamp
      dt = Math.min(dt, 0.05)
      if (!showEducation) {
        updateBrickBreaker(state, dt, paddleXRef.current)
        shadow.tickFrame(state.time, state.score)
        if (state.gameOver) shadow.finalizeOnce(state.score)

        // Education only triggers on game over, not mid-game
      }
      renderBrickBreaker(ctx, state, canvas.width, canvas.height)
      animRef.current = requestAnimationFrame(loop)
    }
    animRef.current = requestAnimationFrame(loop)

    return () => { cancelAnimationFrame(animRef.current); window.removeEventListener("resize", resize) }
  }, [showEducation])

  useEffect(() => { if (stateRef.current) stateRef.current.paused = isPaused }, [isPaused])

  const handleMove = useCallback((clientX: number) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    paddleXRef.current = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
  }, [])

  const handleTap = useCallback(() => {
    if (!audioInitRef.current) { initAudio(); audioInitRef.current = true }
    const state = stateRef.current
    if (!state) return
    if (state.gameOver) {
      if (testMode) {
        Object.assign(state, createBrickBreakerState())
        lastTimeRef.current = 0
        lastEducationTimeRef.current = 0
        shadow.restart()
      } else {
        playCrashSound()
        setEducationContent(getEducationSet(subjects, grade))
        setShowEducation(true)
      }
    }
  }, [testMode, subjects, grade])

  const handleEducationComplete = useCallback((passed: boolean) => {
    setShowEducation(false)
    const state = stateRef.current
    if (!state) return
    if (passed) {
      onEducationCorrect()
      Object.assign(state, createBrickBreakerState())
      lastTimeRef.current = 0
      lastEducationTimeRef.current = 0
      shadow.restart()
    } else {
      onGameOver?.(state.score, state.level)
    }
  }, [onGameOver, onEducationCorrect])

  const handleColorChange = useCallback((color: string) => {
    setPaddleColor(color)
    localStorage.setItem("sc_paddle_color", color)
    if (stateRef.current) stateRef.current.paddleColor = color
  }, [])

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") paddleXRef.current = Math.max(0, paddleXRef.current - 0.05)
      if (e.key === "ArrowRight") paddleXRef.current = Math.min(1, paddleXRef.current + 0.05)
      if (e.key === "Escape") setIsPaused(p => !p)
      if (e.key === "Enter") handleTap()
    }
    window.addEventListener("keydown", down)
    return () => window.removeEventListener("keydown", down)
  }, [handleTap])

  return (
    <div className="relative w-full h-full">
      <canvas ref={canvasRef} className="w-full h-full block" style={{ touchAction: "none" }}
        onTouchStart={(e) => { e.preventDefault(); handleMove(e.touches[0].clientX); handleTap() }}
        onTouchMove={(e) => { e.preventDefault(); handleMove(e.touches[0].clientX) }}
        onMouseMove={(e) => handleMove(e.clientX)}
        onMouseDown={handleTap}
      />
      <GameControls
        isPaused={isPaused}
        testMode={testMode}
        onTogglePause={() => setIsPaused(p => !p)}
        onToggleTestMode={onToggleTestMode ?? (() => {})}
        onBackToHub={onBackToHub}
      />
      <ShadowHUD />

      {/* Paddle color picker */}
      <button
        onClick={() => setShowColorPicker(p => !p)}
        className="absolute top-2 left-2 z-30 w-8 h-8 rounded-full border-2 border-white/30 cursor-pointer"
        style={{ background: paddleColor, boxShadow: `0 0 8px ${paddleColor}` }}
        title="Change paddle color"
      />
      {showColorPicker && (
        <div className="absolute top-12 left-2 z-30 flex gap-1.5 p-2 rounded-lg" style={{ background: "rgba(10,10,20,0.95)", border: "2px solid #2d2d5c" }}>
          {PADDLE_COLORS.map(c => (
            <button
              key={c}
              onClick={() => { handleColorChange(c); setShowColorPicker(false) }}
              className="w-7 h-7 rounded-full cursor-pointer border-2 transition-transform hover:scale-110"
              style={{
                background: c,
                borderColor: c === paddleColor ? "#fff" : "transparent",
                boxShadow: `0 0 6px ${c}`,
              }}
            />
          ))}
        </div>
      )}

      {showEducation && <EducationOverlay content={educationContent} onComplete={handleEducationComplete} crashResume={true} testMode={testMode} />}
      {reward.showSticker && <StickerReward onClose={dismissReward} />}
      {reward.showLevelUp && reward.levelUpData && (
        <LevelUpOverlay level={reward.levelUpData.newLevel} unlockedVehicle={reward.levelUpData.unlockedVehicle} onClose={dismissReward} />
      )}
    </div>
  )
}
