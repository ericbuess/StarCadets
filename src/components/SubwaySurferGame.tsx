import { useRef, useEffect, useCallback, useState } from "react"
import { createSurferState, updateSurfer, renderSurfer } from "@/game/subwaySurferEngine"
import type { SurferState, SurferInput } from "@/game/subwaySurferEngine"
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

interface Props {
  subjects: string[]
  grade?: string
  testMode?: boolean
  onToggleTestMode?: () => void
  onGameOver?: (score: number, distance: number) => void
  onBackToHub?: () => void
}

export function SubwaySurferGame({ subjects, grade, testMode = false, onToggleTestMode, onGameOver, onBackToHub }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<SurferState | null>(null)
  const inputRef = useRef<SurferInput>({ left: false, right: false, up: false, down: false })
  const animRef = useRef(0)
  const lastTimeRef = useRef(0)
  const audioInitRef = useRef(false)
  const [isPaused, setIsPaused] = useState(false)
  const [showEducation, setShowEducation] = useState(false)
  const [educationContent, setEducationContent] = useState<EducationContent[]>([])
  const shadow = useShadowSession("subwaysurfer")
  const { reward, onEducationCorrect, dismissReward } = useEducationReward()

  useEffect(() => {
    (document.activeElement as HTMLElement)?.blur()
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    let state = createSurferState()
    stateRef.current = state
    shadow.restart()

    const resize = () => {
      const d = window.devicePixelRatio || 1
      canvas.width = canvas.clientWidth * d
      canvas.height = canvas.clientHeight * d
    }
    resize()
    window.addEventListener("resize", resize)

    const loop = (ts: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = ts
      let dt = (ts - lastTimeRef.current) / 1000
      lastTimeRef.current = ts
      dt = Math.min(dt, 0.05)

      if (stateRef.current !== state) state = stateRef.current!
      if (!showEducation) {
        const newState = updateSurfer(state, dt, inputRef.current)
        if (newState !== state) { state = newState; stateRef.current = state }
        shadow.tickFrame(state.time, state.score)
        if (state.gameOver) shadow.finalizeOnce(state.score)
      }
      renderSurfer(ctx, state, canvas.width, canvas.height)
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
      if (testMode) { stateRef.current = createSurferState(); lastTimeRef.current = 0; shadow.restart() }
      else { playCrashSound(); setEducationContent(getEducationSet(subjects, grade)); setShowEducation(true) }
    }
  }, [testMode, subjects, grade])

  const handleEducationComplete = useCallback((passed: boolean) => {
    setShowEducation(false)
    const state = stateRef.current
    if (!state) return
    if (passed) {
      onEducationCorrect()
      stateRef.current = createSurferState()
      lastTimeRef.current = 0
      shadow.restart()
    } else {
      onGameOver?.(Math.floor(state.score), Math.floor(state.distance))
    }
  }, [onGameOver, onEducationCorrect])

  const touchStart = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a") { e.preventDefault(); inputRef.current.left = true }
      if (e.key === "ArrowRight" || e.key === "d") { e.preventDefault(); inputRef.current.right = true }
      if (e.key === "ArrowUp" || e.key === "w" || e.key === " ") { e.preventDefault(); inputRef.current.up = true }
      if (e.key === "ArrowDown" || e.key === "s") { e.preventDefault(); inputRef.current.down = true }
      if (e.key === "Escape") setIsPaused(p => !p)
      if (e.key === "Enter") handleTap()
    }
    const up = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a") inputRef.current.left = false
      if (e.key === "ArrowRight" || e.key === "d") inputRef.current.right = false
      if (e.key === "ArrowUp" || e.key === "w" || e.key === " ") inputRef.current.up = false
      if (e.key === "ArrowDown" || e.key === "s") inputRef.current.down = false
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
    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 20) inputRef.current.right = true
      else if (dx < -20) inputRef.current.left = true
    } else {
      if (dy < -20) inputRef.current.up = true
      else if (dy > 20) inputRef.current.down = true
    }
    touchStart.current = null
  }

  return (
    <div className="relative w-full h-full">
      <canvas ref={canvasRef} className="w-full h-full block" style={{ touchAction: "none" }}
        onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} onMouseDown={handleTap} />
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
