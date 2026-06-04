import { useRef, useEffect, useCallback, useState } from "react"
import {
  createAsteroidsState,
  updateAsteroids,
  renderAsteroids,
  resetAsteroidsShootCooldown,
} from "@/game/asteroidsEngine"
import type { AsteroidsState, AsteroidsInput } from "@/game/asteroidsEngine"
import { initAudio, playCrashSound, playPowerupSound } from "@/game/audio"
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

interface AsteroidsGameProps {
  subjects: string[]
  grade?: string
  testMode?: boolean
  onToggleTestMode?: () => void
  onGameOver?: (score: number, distance: number) => void
  onBackToHub?: () => void
}

export function AsteroidsGame({
  subjects, grade, testMode = false, onToggleTestMode, onGameOver, onBackToHub
}: AsteroidsGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<AsteroidsState | null>(null)
  const inputRef = useRef<AsteroidsInput>({ left: false, right: false, thrust: false, shoot: false })
  const animRef = useRef(0)
  const lastTimeRef = useRef(0)
  const audioInitRef = useRef(false)
  const prevScoreRef = useRef(0)
  const [isPaused, setIsPaused] = useState(false)
  const [showEducation, setShowEducation] = useState(false)
  const [educationContent, setEducationContent] = useState<EducationContent[]>([])
  const shadow = useShadowSession("asteroids")
  const { reward, onEducationCorrect, dismissReward } = useEducationReward()

  const initGame = useCallback(() => {
    resetAsteroidsShootCooldown()
    const state = createAsteroidsState()
    stateRef.current = state
    prevScoreRef.current = 0
    return state
  }, [])

  useEffect(() => {
    (document.activeElement as HTMLElement)?.blur()
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const state = initGame()
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

      if (!state.paused && !showEducation) {
        updateAsteroids(state, dt, inputRef.current)

        if (state.score > prevScoreRef.current + 100) {
          playPowerupSound()
          prevScoreRef.current = state.score
        }

        shadow.tickFrame(state.time, state.score)
        if (state.gameOver) shadow.finalizeOnce(state.score)
      }

      renderAsteroids(ctx, state, canvas.width, canvas.height)
      animRef.current = requestAnimationFrame(loop)
    }
    animRef.current = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(animRef.current)
      window.removeEventListener("resize", resize)
    }
  }, [initGame, showEducation])

  useEffect(() => {
    if (stateRef.current) stateRef.current.paused = isPaused
  }, [isPaused])

  const handleTap = useCallback(() => {
    if (!audioInitRef.current) { initAudio(); audioInitRef.current = true }
    const state = stateRef.current
    if (!state) return

    if (state.gameOver) {
      if (testMode) {
        Object.assign(state, createAsteroidsState())
        resetAsteroidsShootCooldown()
        prevScoreRef.current = 0
        lastTimeRef.current = 0
        shadow.restart()
      } else {
        playCrashSound()
        const content = getEducationSet(subjects, grade)
        setEducationContent(content)
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
      Object.assign(state, createAsteroidsState())
      resetAsteroidsShootCooldown()
      prevScoreRef.current = 0
      lastTimeRef.current = 0
      shadow.restart()
    } else {
      onGameOver?.(state.score, state.level)
    }
  }, [onGameOver, onEducationCorrect])

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a") inputRef.current.left = true
      if (e.key === "ArrowRight" || e.key === "d") inputRef.current.right = true
      if (e.key === "ArrowUp" || e.key === "w") inputRef.current.thrust = true
      if (e.key === " " || e.key === "f") { e.preventDefault(); inputRef.current.shoot = true }
      if (e.key === "Escape") setIsPaused(p => !p)
      if (e.key === "Enter") handleTap()
    }
    const up = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a") inputRef.current.left = false
      if (e.key === "ArrowRight" || e.key === "d") inputRef.current.right = false
      if (e.key === "ArrowUp" || e.key === "w") inputRef.current.thrust = false
      if (e.key === " " || e.key === "f") inputRef.current.shoot = false
    }
    window.addEventListener("keydown", down)
    window.addEventListener("keyup", up)
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up) }
  }, [handleTap])

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{ touchAction: "none" }}
        onMouseDown={() => { inputRef.current.shoot = true; handleTap() }}
        onMouseUp={() => { inputRef.current.shoot = false }}
      />

      {/* On-screen controls for touch devices */}
      <div className="absolute bottom-4 left-4 z-10 flex items-end gap-4 pointer-events-auto"
        style={{ touchAction: "none" }}>
        <LRControls
          onLeft={(p) => { inputRef.current.left = p }}
          onRight={(p) => { inputRef.current.right = p }}
        />
      </div>
      <div className="absolute bottom-4 right-4 z-10 flex items-end gap-3 pointer-events-auto"
        style={{ touchAction: "none" }}>
        <ActionButton label="THRUST" color="#ff8800" size={52}
          onDown={() => { inputRef.current.thrust = true }}
          onUp={() => { inputRef.current.thrust = false }} />
        <ActionButton label="FIRE" color="#ff2244" size={52}
          onDown={() => { inputRef.current.shoot = true; handleTap() }}
          onUp={() => { inputRef.current.shoot = false }} />
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
        <EducationOverlay content={educationContent} onComplete={handleEducationComplete} crashResume={true} testMode={testMode} />
      )}

      {reward.showSticker && <StickerReward onClose={dismissReward} />}
      {reward.showLevelUp && reward.levelUpData && (
        <LevelUpOverlay level={reward.levelUpData.newLevel} unlockedVehicle={reward.levelUpData.unlockedVehicle} onClose={dismissReward} />
      )}
    </div>
  )
}
