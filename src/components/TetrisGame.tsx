import { useRef, useEffect, useCallback, useState } from "react"
import { createTetrisState, updateTetris, renderTetris } from "@/game/tetrisEngine"
import type { TetrisState, TetrisInput } from "@/game/tetrisEngine"
import { initAudio, playCrashSound } from "@/game/audio"
import { getEducationSet } from "@/game/education"
import type { EducationContent } from "@/game/types"
import { EducationOverlay } from "./EducationOverlay"
import { GameControls } from "./GameControls"
import { ActionButton, LRControls } from "./TouchControls"
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

export function TetrisGame({ subjects, grade, testMode = false, onToggleTestMode, onGameOver, onBackToHub }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<TetrisState | null>(null)
  const inputRef = useRef<TetrisInput>({ left: false, right: false, down: false, rotate: false, drop: false })
  const animRef = useRef(0)
  const lastTimeRef = useRef(0)
  const audioInitRef = useRef(false)
  const [isPaused, setIsPaused] = useState(false)
  const [showEducation, setShowEducation] = useState(false)
  const [educationContent, setEducationContent] = useState<EducationContent[]>([])
  const shadow = useShadowSession("tetris")
  const { reward, onEducationCorrect, dismissReward } = useEducationReward()

  useEffect(() => {
    (document.activeElement as HTMLElement)?.blur()
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    let state = createTetrisState()
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
        const newState = updateTetris(state, dt, inputRef.current)
        if (newState !== state) { state = newState; stateRef.current = state }
        shadow.tickFrame(state.time, state.score)
        if (state.gameOver) shadow.finalizeOnce(state.score)
      }
      renderTetris(ctx, state, canvas.width, canvas.height)
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
      if (testMode) { stateRef.current = createTetrisState(); lastTimeRef.current = 0; shadow.restart() }
      else { playCrashSound(); setEducationContent(getEducationSet(subjects, grade)); setShowEducation(true) }
    }
  }, [testMode, subjects, grade])

  const handleEducationComplete = useCallback((passed: boolean) => {
    setShowEducation(false)
    const state = stateRef.current
    if (!state) return
    if (passed) { onEducationCorrect(); stateRef.current = createTetrisState(); lastTimeRef.current = 0; shadow.restart() }
    else onGameOver?.(state.score, state.lines)
  }, [onGameOver, onEducationCorrect])

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a") { inputRef.current.left = true; e.preventDefault() }
      if (e.key === "ArrowRight" || e.key === "d") { inputRef.current.right = true; e.preventDefault() }
      if (e.key === "ArrowDown" || e.key === "s") { inputRef.current.down = true; e.preventDefault() }
      if (e.key === "ArrowUp" || e.key === "w") { inputRef.current.rotate = true; e.preventDefault() }
      if (e.key === " ") { inputRef.current.drop = true; e.preventDefault() }
      if (e.key === "Escape") setIsPaused(p => !p)
      if (e.key === "Enter") handleTap()
    }
    const up = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a") inputRef.current.left = false
      if (e.key === "ArrowRight" || e.key === "d") inputRef.current.right = false
      if (e.key === "ArrowDown" || e.key === "s") inputRef.current.down = false
      if (e.key === "ArrowUp" || e.key === "w") inputRef.current.rotate = false
      if (e.key === " ") inputRef.current.drop = false
    }
    window.addEventListener("keydown", down)
    window.addEventListener("keyup", up)
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up) }
  }, [handleTap])

  const touchStart = useRef<{ x: number; y: number } | null>(null)
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
    if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) {
      // Tap = rotate
      inputRef.current.rotate = true
      setTimeout(() => { inputRef.current.rotate = false }, 100)
    } else if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > threshold) { inputRef.current.right = true; setTimeout(() => { inputRef.current.right = false }, 100) }
      else { inputRef.current.left = true; setTimeout(() => { inputRef.current.left = false }, 100) }
    } else {
      if (dy > threshold) { inputRef.current.drop = true; setTimeout(() => { inputRef.current.drop = false }, 100) }
    }
    touchStart.current = null
  }

  return (
    <div className="relative w-full h-full">
      <canvas ref={canvasRef} className="w-full h-full block" style={{ touchAction: "none" }}
        onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} onMouseDown={handleTap} />
      {/* On-screen controls for touch */}
      <div className="absolute bottom-4 left-4 z-10 pointer-events-auto" style={{ touchAction: "none" }}>
        <LRControls
          onLeft={(p) => { inputRef.current.left = p }}
          onRight={(p) => { inputRef.current.right = p }}
          onDown={(p) => { inputRef.current.down = p }}
          size={48}
        />
      </div>
      <div className="absolute bottom-4 right-4 z-10 flex items-end gap-3 pointer-events-auto"
        style={{ touchAction: "none" }}>
        <ActionButton label="ROT" color="#aa44ff" size={48}
          onDown={() => { inputRef.current.rotate = true }}
          onUp={() => { inputRef.current.rotate = false }} />
        <ActionButton label="DROP" color="#ff3030" size={48}
          onDown={() => { inputRef.current.drop = true }}
          onUp={() => { inputRef.current.drop = false }} />
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
