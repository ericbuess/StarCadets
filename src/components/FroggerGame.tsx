import { useRef, useEffect, useCallback, useState } from "react"
import { createFroggerState, updateFrogger, renderFrogger } from "@/game/froggerEngine"
import type { FroggerState, FroggerInput } from "@/game/froggerEngine"
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

export function FroggerGame({ subjects, grade, testMode = false, onToggleTestMode, onGameOver, onBackToHub }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<FroggerState | null>(null)
  const inputRef = useRef<FroggerInput>({ up: false, down: false, left: false, right: false })
  const animRef = useRef(0)
  const lastTimeRef = useRef(0)
  const audioInitRef = useRef(false)
  const [isPaused, setIsPaused] = useState(false)
  const [showEducation, setShowEducation] = useState(false)
  const [educationContent, setEducationContent] = useState<EducationContent[]>([])
  const shadow = useShadowSession("frogger")
  const { reward, onEducationCorrect, dismissReward } = useEducationReward()

  useEffect(() => {
    (document.activeElement as HTMLElement)?.blur()
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const state = createFroggerState()
    stateRef.current = state
    shadow.restart()
    const resize = () => { const d = window.devicePixelRatio || 1; canvas.width = canvas.clientWidth * d; canvas.height = canvas.clientHeight * d }
    resize()
    window.addEventListener("resize", resize)
    const loop = (ts: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = ts
      let dt = (ts - lastTimeRef.current) / 1000; lastTimeRef.current = ts; dt = Math.min(dt, 0.05)
      if (!showEducation) {
        updateFrogger(state, dt, inputRef.current)
        shadow.tickFrame(state.time, state.score)
        if (state.gameOver) shadow.finalizeOnce(state.score)
      }
      renderFrogger(ctx, state, canvas.width, canvas.height)
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
      if (testMode) { Object.assign(state, createFroggerState()); lastTimeRef.current = 0; shadow.restart() }
      else { playCrashSound(); setEducationContent(getEducationSet(subjects, grade)); setShowEducation(true) }
    }
  }, [testMode, subjects, grade])

  const handleEducationComplete = useCallback((passed: boolean) => {
    setShowEducation(false)
    const state = stateRef.current
    if (!state) return
    if (passed) { onEducationCorrect(); Object.assign(state, createFroggerState()); lastTimeRef.current = 0; shadow.restart() }
    else onGameOver?.(state.score, state.level)
  }, [onGameOver, onEducationCorrect])

  // Touch swipe handling
  const touchStart = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp" || e.key === "w") { e.preventDefault(); inputRef.current.up = true }
      if (e.key === "ArrowDown" || e.key === "s") { e.preventDefault(); inputRef.current.down = true }
      if (e.key === "ArrowLeft" || e.key === "a") { e.preventDefault(); inputRef.current.left = true }
      if (e.key === "ArrowRight" || e.key === "d") { e.preventDefault(); inputRef.current.right = true }
      if (e.key === "Escape") setIsPaused(p => !p)
      if (e.key === "Enter") handleTap()
    }
    const up = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp" || e.key === "w") inputRef.current.up = false
      if (e.key === "ArrowDown" || e.key === "s") inputRef.current.down = false
      if (e.key === "ArrowLeft" || e.key === "a") inputRef.current.left = false
      if (e.key === "ArrowRight" || e.key === "d") inputRef.current.right = false
    }
    window.addEventListener("keydown", down)
    window.addEventListener("keyup", up)
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up) }
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
    const threshold = 20
    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > threshold) { inputRef.current.right = true; setTimeout(() => { inputRef.current.right = false }, 100) }
      else if (dx < -threshold) { inputRef.current.left = true; setTimeout(() => { inputRef.current.left = false }, 100) }
    } else {
      if (dy < -threshold) { inputRef.current.up = true; setTimeout(() => { inputRef.current.up = false }, 100) }
      else if (dy > threshold) { inputRef.current.down = true; setTimeout(() => { inputRef.current.down = false }, 100) }
    }
    touchStart.current = null
  }

  const handleDPad = useCallback((dir: { up: boolean; down: boolean; left: boolean; right: boolean }) => {
    inputRef.current.up = dir.up
    inputRef.current.down = dir.down
    inputRef.current.left = dir.left
    inputRef.current.right = dir.right
  }, [])

  return (
    <div className="relative w-full h-full">
      <canvas ref={canvasRef} className="w-full h-full block" style={{ touchAction: "none" }}
        onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} onMouseDown={handleTap} />
      {/* On-screen D-pad for touch */}
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
