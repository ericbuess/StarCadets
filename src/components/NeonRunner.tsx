import { useRef, useEffect, useCallback, useState } from "react"
import {
  createRunnerState,
  updateRunner,
  renderRunner,
  resetRunnerGeneration
} from "@/game/runnerEngine"
import type { RunnerState } from "@/game/runnerEngine"
import { initAudio, playCrashSound, playPowerupSound, playCheckpointSound } from "@/game/audio"
import { getEducationSet } from "@/game/education"
import type { EducationContent } from "@/game/types"
import { EducationOverlay } from "./EducationOverlay"
import { GameControls } from "./GameControls"
import { ShadowHUD } from "./ShadowHUD"
import { useShadowSession } from "@/hooks/useShadowSession"

interface NeonRunnerProps {
  subjects: string[]
  grade?: string
  testMode?: boolean
  onToggleTestMode?: () => void
  onGameOver?: (score: number, distance: number) => void
  onBackToHub?: () => void
}

export function NeonRunner({
  subjects,
  grade,
  testMode = false,
  onToggleTestMode,
  onGameOver,
  onBackToHub
}: NeonRunnerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<RunnerState | null>(null)
  const tapRef = useRef(false)
  const animRef = useRef(0)
  const lastTimeRef = useRef(0)
  const audioInitRef = useRef(false)
  const prevPowerupsRef = useRef(0)
  const [isPaused, setIsPaused] = useState(false)
  const [showEducation, setShowEducation] = useState(false)
  const [educationContent, setEducationContent] = useState<EducationContent[]>([])
  const shadow = useShadowSession("neonrunner")

  const initGame = useCallback(() => {
    resetRunnerGeneration()
    const state = createRunnerState()
    stateRef.current = state
    prevPowerupsRef.current = 0
    return state
  }, [])

  useEffect(() => {
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
        updateRunner(state, dt, tapRef.current)

        // Sound effects
        const collected = state.powerups.filter(p => p.collected).length
        if (collected > prevPowerupsRef.current) {
          playPowerupSound()
          prevPowerupsRef.current = collected
        }

        if (state.player.dead && !state.gameOver) {
          playCrashSound()
          state.gameOver = true
        }

        shadow.tickFrame(state.time, state.score)
        if (state.gameOver) shadow.finalizeOnce(state.score)
      }

      renderRunner(ctx, state, canvas.width, canvas.height)
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
    if (!audioInitRef.current) {
      initAudio()
      audioInitRef.current = true
    }

    const state = stateRef.current
    if (!state) return

    if (state.gameOver) {
      if (testMode) {
        // Test mode — restart immediately
        const newState = createRunnerState()
        resetRunnerGeneration()
        Object.assign(state, newState)
        prevPowerupsRef.current = 0
        lastTimeRef.current = 0
        shadow.restart()
      } else {
        // Show education on crash
        const content = getEducationSet(subjects, grade)
        setEducationContent(content)
        setShowEducation(true)
      }
      return
    }

    tapRef.current = true
  }, [testMode, subjects, grade])

  const handleRelease = useCallback(() => {
    tapRef.current = false
  }, [])

  const handleEducationComplete = useCallback((passed: boolean) => {
    setShowEducation(false)
    const state = stateRef.current
    if (!state) return

    if (passed) {
      // Restart the game
      playCheckpointSound()
      const newState = createRunnerState()
      resetRunnerGeneration()
      Object.assign(state, newState)
      prevPowerupsRef.current = 0
      lastTimeRef.current = 0
      shadow.restart()
    } else {
      // Failed education — game over for real
      onGameOver?.(Math.floor(state.score), Math.floor(state.distance / 10))
    }
  }, [onGameOver])

  // Keyboard
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "ArrowUp" || e.key === "w") {
        e.preventDefault()
        handleTap()
      }
      if (e.key === "Escape") setIsPaused(p => !p)
    }
    const up = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "ArrowUp" || e.key === "w") {
        handleRelease()
      }
    }
    window.addEventListener("keydown", down)
    window.addEventListener("keyup", up)
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up) }
  }, [handleTap, handleRelease])

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{ touchAction: "none" }}
        onTouchStart={(e) => { e.preventDefault(); handleTap() }}
        onTouchEnd={(e) => { e.preventDefault(); handleRelease() }}
        onMouseDown={handleTap}
        onMouseUp={handleRelease}
      />

      <GameControls
        isPaused={isPaused}
        testMode={testMode}
        onTogglePause={() => setIsPaused(p => !p)}
        onToggleTestMode={onToggleTestMode ?? (() => {})}
        onBackToHub={onBackToHub}
      />

      <ShadowHUD />

      {/* Education overlay */}
      {showEducation && (
        <EducationOverlay
          content={educationContent}
          onComplete={handleEducationComplete}
          crashResume={true}
          testMode={testMode}
        />
      )}
    </div>
  )
}
