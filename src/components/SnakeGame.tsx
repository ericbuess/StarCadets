import { useRef, useEffect, useCallback, useState } from "react"
import { initSnake, updateSnake, changeDirection, renderSnake } from "@/game/snakeEngine"
import type { SnakeState, Direction } from "@/game/snakeEngine"
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
  onGameOver?: (score: number, length: number) => void
  onBackToHub?: () => void
}

export function SnakeGame({ subjects, grade, testMode = false, onToggleTestMode, onGameOver, onBackToHub }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<SnakeState | null>(null)
  const animRef = useRef(0)
  const lastTimeRef = useRef(0)
  const audioInitRef = useRef(false)
  const foodCountRef = useRef(0) // track food eaten for education overlay timing
  const [isPaused, setIsPaused] = useState(false)
  const [showEducation, setShowEducation] = useState(false)
  const [educationContent, setEducationContent] = useState<EducationContent[]>([])
  const shadow = useShadowSession("snake")
  const { reward, onEducationCorrect, dismissReward } = useEducationReward()

  useEffect(() => {
    (document.activeElement as HTMLElement)?.blur()
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let state = initSnake(20, 20)
    stateRef.current = state
    foodCountRef.current = 0
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
      dt = Math.min(dt, 0.1)

      if (stateRef.current !== state) state = stateRef.current!
      if (!showEducation) {
        const newState = updateSnake(state, dt)
        if (newState !== state) { state = newState; stateRef.current = state }

        shadow.tickFrame(state.time, state.score)

        if (state.gameOver) shadow.finalizeOnce(state.score)
      }

      renderSnake(ctx, state, canvas.width, canvas.height)
      animRef.current = requestAnimationFrame(loop)
    }
    animRef.current = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(animRef.current)
      window.removeEventListener("resize", resize)
    }
  }, [showEducation]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (stateRef.current) stateRef.current.paused = isPaused
  }, [isPaused])

  const handleTap = useCallback(() => {
    if (!audioInitRef.current) { initAudio(); audioInitRef.current = true }
    const state = stateRef.current
    if (!state) return
    if (state.gameOver) {
      if (testMode) {
        stateRef.current = initSnake(20, 20)
        foodCountRef.current = 0
        lastTimeRef.current = 0
        shadow.restart()
      } else {
        playCrashSound()
        setEducationContent(getEducationSet(subjects, grade))
        setShowEducation(true)
      }
    }
  }, [testMode, subjects, grade, shadow])

  const handleEducationComplete = useCallback((passed: boolean) => {
    setShowEducation(false)
    const state = stateRef.current
    if (!state) return
    if (passed) {
      onEducationCorrect()
      stateRef.current = initSnake(20, 20)
      foodCountRef.current = 0
      lastTimeRef.current = 0
      shadow.restart()
    } else {
      onGameOver?.(state.score, state.snake.length)
    }
  }, [onGameOver, shadow, onEducationCorrect])

  const touchStart = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const state = stateRef.current
      if (!state) return
      if (e.key === "ArrowUp" || e.key === "w") { e.preventDefault(); changeDirection(state, "up") }
      if (e.key === "ArrowDown" || e.key === "s") { e.preventDefault(); changeDirection(state, "down") }
      if (e.key === "ArrowLeft" || e.key === "a") { e.preventDefault(); changeDirection(state, "left") }
      if (e.key === "ArrowRight" || e.key === "d") { e.preventDefault(); changeDirection(state, "right") }
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
    const state = stateRef.current
    if (!state) return
    const dx = e.changedTouches[0].clientX - touchStart.current.x
    const dy = e.changedTouches[0].clientY - touchStart.current.y
    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 15) changeDirection(state, "right")
      else if (dx < -15) changeDirection(state, "left")
    } else {
      if (dy < -15) changeDirection(state, "up")
      else if (dy > 15) changeDirection(state, "down")
    }
    touchStart.current = null
  }

  const handleDPad = useCallback((dir: { up: boolean; down: boolean; left: boolean; right: boolean }) => {
    const state = stateRef.current
    if (!state) return
    let d: Direction | null = null
    if (dir.up) d = "up"
    else if (dir.down) d = "down"
    else if (dir.left) d = "left"
    else if (dir.right) d = "right"
    if (d) changeDirection(state, d)
  }, [])

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{ touchAction: "none" }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onMouseDown={handleTap}
      />
      {/* On-screen D-pad for touch devices */}
      <div
        className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 pointer-events-auto"
        style={{ touchAction: "none" }}
      >
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
      {showEducation && (
        <EducationOverlay
          content={educationContent}
          onComplete={handleEducationComplete}
          crashResume={stateRef.current?.gameOver}
          testMode={testMode}
        />
      )}
      {reward.showSticker && <StickerReward onClose={dismissReward} />}
      {reward.showLevelUp && reward.levelUpData && (
        <LevelUpOverlay level={reward.levelUpData.newLevel} unlockedVehicle={reward.levelUpData.unlockedVehicle} onClose={dismissReward} />
      )}
    </div>
  )
}
