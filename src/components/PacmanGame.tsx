import { useRef, useEffect, useCallback, useState } from "react"
import { createPacmanState, updatePacman, renderPacman } from "@/game/pacmanEngine"
import type { PacmanState, PacmanInput } from "@/game/pacmanEngine"
import { initAudio, playCrashSound } from "@/game/audio"
import { getEducationSet } from "@/game/education"
import type { EducationContent } from "@/game/types"
import { EducationOverlay } from "./EducationOverlay"
import { GameControls } from "./GameControls"
import { DPad } from "./TouchControls"
import { ShadowHUD } from "./ShadowHUD"
import { useShadowSession } from "@/hooks/useShadowSession"
import { useEducationReward } from "@/hooks/useEducationReward"
import { StickerReward } from "./StickerReward"
import { LevelUpOverlay } from "./LevelUpOverlay"

interface Props {
  subjects: string[]
  grade?: string
  testMode?: boolean
  onToggleTestMode?: () => void
  onGameOver?: (score: number, distance: number) => void
  onBackToHub?: () => void
}

export function PacmanGame({ subjects, grade, testMode = false, onToggleTestMode, onGameOver, onBackToHub }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<PacmanState | null>(null)
  const inputRef = useRef<PacmanInput>({ up: false, down: false, left: false, right: false })
  const animRef = useRef(0)
  const lastTimeRef = useRef(0)
  const audioInitRef = useRef(false)
  const [isPaused, setIsPaused] = useState(false)
  const [showEducation, setShowEducation] = useState(false)
  const [educationContent, setEducationContent] = useState<EducationContent[]>([])
  const shadow = useShadowSession("pacman")
  const { reward, onEducationCorrect, dismissReward } = useEducationReward()

  useEffect(() => {
    (document.activeElement as HTMLElement)?.blur()
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    let state = createPacmanState()
    stateRef.current = state
    shadow.restart()
    const resize = () => { const d = window.devicePixelRatio || 1; canvas.width = canvas.clientWidth * d; canvas.height = canvas.clientHeight * d }
    resize()
    window.addEventListener("resize", resize)
    const loop = (ts: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = ts
      let dt = (ts - lastTimeRef.current) / 1000; lastTimeRef.current = ts; dt = Math.min(dt, 0.05)
      if (stateRef.current !== state) state = stateRef.current!
      if (!showEducation) {
        const newState = updatePacman(state, dt, inputRef.current)
        if (newState !== state) { state = newState; stateRef.current = state }
        shadow.tickFrame(state.time, state.score)
        if (state.gameOver) shadow.finalizeOnce(state.score)
      }
      renderPacman(ctx, state, canvas.width, canvas.height)
      animRef.current = requestAnimationFrame(loop)
    }
    animRef.current = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(animRef.current); window.removeEventListener("resize", resize) }
  }, [showEducation])

  useEffect(() => { if (stateRef.current) stateRef.current.paused = isPaused }, [isPaused])

  const handleTap = useCallback(() => {
    if (!audioInitRef.current) { initAudio(); audioInitRef.current = true }
    const state = stateRef.current
    if (!state) return
    if (state.gameOver) {
      if (testMode) { stateRef.current = createPacmanState(); lastTimeRef.current = 0; shadow.restart() }
      else { playCrashSound(); setEducationContent(getEducationSet(subjects, grade)); setShowEducation(true) }
    }
  }, [testMode, subjects, grade])

  const handleEducationComplete = useCallback((passed: boolean) => {
    setShowEducation(false)
    const state = stateRef.current
    if (!state) return
    if (passed) { onEducationCorrect(); stateRef.current = createPacmanState(); lastTimeRef.current = 0; shadow.restart() }
    else onGameOver?.(state.score, state.level)
  }, [onGameOver, onEducationCorrect])

  const touchStart = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp" || e.key === "w") { e.preventDefault(); inputRef.current = { up: true, down: false, left: false, right: false } }
      if (e.key === "ArrowDown" || e.key === "s") { e.preventDefault(); inputRef.current = { up: false, down: true, left: false, right: false } }
      if (e.key === "ArrowLeft" || e.key === "a") { e.preventDefault(); inputRef.current = { up: false, down: false, left: true, right: false } }
      if (e.key === "ArrowRight" || e.key === "d") { e.preventDefault(); inputRef.current = { up: false, down: false, left: false, right: true } }
      if (e.key === "Escape") setIsPaused(p => !p)
      if (e.key === "Enter") handleTap()
    }
    window.addEventListener("keydown", down)
    return () => window.removeEventListener("keydown", down)
  }, [handleTap])

  const onTouchStart = (e: React.TouchEvent) => {
    e.preventDefault()
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    handleTap()
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault()
    if (!touchStart.current) return
    const dx = e.changedTouches[0].clientX - touchStart.current.x
    const dy = e.changedTouches[0].clientY - touchStart.current.y
    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 15) inputRef.current = { up: false, down: false, left: false, right: true }
      else if (dx < -15) inputRef.current = { up: false, down: false, left: true, right: false }
    } else {
      if (dy < -15) inputRef.current = { up: true, down: false, left: false, right: false }
      else if (dy > 15) inputRef.current = { up: false, down: true, left: false, right: false }
    }
    touchStart.current = null
  }

  const handleDPad = useCallback((dir: { up: boolean; down: boolean; left: boolean; right: boolean }) => {
    inputRef.current = dir
  }, [])

  return (
    <div className="relative w-full h-full">
      <canvas ref={canvasRef} className="w-full h-full block" style={{ touchAction: "none" }}
        onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} onMouseDown={handleTap} />
      {/* On-screen D-pad for touch devices */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 pointer-events-auto"
        style={{ touchAction: "none" }}>
        <DPad onDirectionChange={handleDPad} size={130} />
      </div>
      <GameControls
        isPaused={isPaused}
        testMode={testMode}
        onTogglePause={() => setIsPaused(p => !p)}
        onToggleTestMode={onToggleTestMode ?? (() => {})}
        onBackToHub={onBackToHub}
      />
      <ShadowHUD />
      {showEducation && <EducationOverlay content={educationContent} onComplete={handleEducationComplete} crashResume={true} testMode={testMode} />}
      {reward.showSticker && <StickerReward onClose={dismissReward} />}
      {reward.showLevelUp && reward.levelUpData && (
        <LevelUpOverlay level={reward.levelUpData.newLevel} unlockedVehicle={reward.levelUpData.unlockedVehicle} onClose={dismissReward} />
      )}
    </div>
  )
}
