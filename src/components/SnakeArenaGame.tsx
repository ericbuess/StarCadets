import { useRef, useEffect, useCallback, useState } from "react"
import { initArena, updateArena, renderArena } from "@/game/snakeArenaEngine"
import type { ArenaState } from "@/game/snakeArenaEngine"
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
  onGameOver?: (score: number, length: number) => void
  onBackToHub?: () => void
}

export function SnakeArenaGame({ subjects, grade, testMode = false, onToggleTestMode, onGameOver, onBackToHub }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<ArenaState | null>(null)
  const animRef = useRef(0)
  const lastTimeRef = useRef(0)
  const audioInitRef = useRef(false)
  const inputDirRef = useRef<number | null>(null)
  const boostRef = useRef(false)
  const lastEduTimeRef = useRef(0)
  const [isPaused, setIsPaused] = useState(false)
  const [showEducation, setShowEducation] = useState(false)
  const [educationContent, setEducationContent] = useState<EducationContent[]>([])
  const shadow = useShadowSession("snakearena")
  const { reward, onEducationCorrect, dismissReward } = useEducationReward()

  // Joystick state
  const joystickRef = useRef<{
    active: boolean
    centerX: number
    centerY: number
    currentX: number
    currentY: number
  }>({ active: false, centerX: 0, centerY: 0, currentX: 0, currentY: 0 })

  useEffect(() => {
    (document.activeElement as HTMLElement)?.blur()
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let state = initArena()
    stateRef.current = state
    lastEduTimeRef.current = 0
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
        const newState = updateArena(state, dt, inputDirRef.current, boostRef.current)
        if (newState !== state) { state = newState; stateRef.current = state }

        shadow.tickFrame(state.time, state.player.score)

        // Education only triggers on game over, not mid-game

        if (state.gameOver) shadow.finalizeOnce(state.player.score)
      }

      renderArena(ctx, state, canvas.width, canvas.height)

      // Draw joystick overlay if active
      const dpr = window.devicePixelRatio || 1
      const js = joystickRef.current
      if (js.active) {
        ctx.save()
        ctx.scale(dpr, dpr)
        // Outer ring
        ctx.strokeStyle = "rgba(76, 241, 255, 0.3)"
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(js.centerX, js.centerY, 50, 0, Math.PI * 2)
        ctx.stroke()
        // Knob
        const dx = js.currentX - js.centerX
        const dy = js.currentY - js.centerY
        const d = Math.sqrt(dx * dx + dy * dy)
        const maxR = 40
        const ratio = d > maxR ? maxR / d : 1
        const kx = js.centerX + dx * ratio
        const ky = js.centerY + dy * ratio
        ctx.fillStyle = "rgba(76, 241, 255, 0.5)"
        ctx.beginPath()
        ctx.arc(kx, ky, 18, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }

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
        stateRef.current = initArena()
        lastTimeRef.current = 0
        lastEduTimeRef.current = 0
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
      stateRef.current = initArena()
      lastTimeRef.current = 0
      lastEduTimeRef.current = 0
      shadow.restart()
    } else {
      onGameOver?.(Math.floor(state.player.score), state.player.segments.length)
    }
  }, [onGameOver, shadow, onEducationCorrect])

  // Keyboard controls
  const keysRef = useRef({ up: false, down: false, left: false, right: false })

  useEffect(() => {
    const updateKeyDir = () => {
      const k = keysRef.current
      let dx = 0, dy = 0
      if (k.up) dy -= 1
      if (k.down) dy += 1
      if (k.left) dx -= 1
      if (k.right) dx += 1
      if (dx !== 0 || dy !== 0) {
        inputDirRef.current = Math.atan2(dy, dx)
      }
    }

    const down = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp" || e.key === "w") { e.preventDefault(); keysRef.current.up = true; updateKeyDir() }
      if (e.key === "ArrowDown" || e.key === "s") { e.preventDefault(); keysRef.current.down = true; updateKeyDir() }
      if (e.key === "ArrowLeft" || e.key === "a") { e.preventDefault(); keysRef.current.left = true; updateKeyDir() }
      if (e.key === "ArrowRight" || e.key === "d") { e.preventDefault(); keysRef.current.right = true; updateKeyDir() }
      if (e.key === " " || e.key === "Shift") { e.preventDefault(); boostRef.current = true }
      if (e.key === "Escape") setIsPaused(p => !p)
      if (e.key === "Enter") handleTap()
    }
    const up = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp" || e.key === "w") { keysRef.current.up = false; updateKeyDir() }
      if (e.key === "ArrowDown" || e.key === "s") { keysRef.current.down = false; updateKeyDir() }
      if (e.key === "ArrowLeft" || e.key === "a") { keysRef.current.left = false; updateKeyDir() }
      if (e.key === "ArrowRight" || e.key === "d") { keysRef.current.right = false; updateKeyDir() }
      if (e.key === " " || e.key === "Shift") { boostRef.current = false }
    }
    window.addEventListener("keydown", down)
    window.addEventListener("keyup", up)
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up) }
  }, [handleTap])

  // Touch joystick controls
  const onTouchStart = (e: React.TouchEvent) => {
    e.preventDefault()
    if (!audioInitRef.current) { initAudio(); audioInitRef.current = true }

    const state = stateRef.current
    if (state?.gameOver) {
      handleTap()
      return
    }

    const touch = e.touches[0]
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect || !touch) return
    const x = touch.clientX - rect.left
    const y = touch.clientY - rect.top

    joystickRef.current = {
      active: true,
      centerX: x,
      centerY: y,
      currentX: x,
      currentY: y,
    }

    // Two-finger touch = boost
    if (e.touches.length >= 2) {
      boostRef.current = true
    }
  }

  const onTouchMove = (e: React.TouchEvent) => {
    e.preventDefault()
    const touch = e.touches[0]
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect || !touch) return
    const x = touch.clientX - rect.left
    const y = touch.clientY - rect.top

    const js = joystickRef.current
    js.currentX = x
    js.currentY = y

    const dx = x - js.centerX
    const dy = y - js.centerY
    const d = Math.sqrt(dx * dx + dy * dy)
    if (d > 5) {
      inputDirRef.current = Math.atan2(dy, dx)
    }

    // Two-finger touch = boost
    boostRef.current = e.touches.length >= 2
  }

  const onTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault()
    if (e.touches.length === 0) {
      joystickRef.current.active = false
      boostRef.current = false
    } else {
      boostRef.current = e.touches.length >= 2
    }
  }

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{ touchAction: "none" }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseDown={handleTap}
      />
      {/* Boost hint */}
      <div
        className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 pointer-events-none"
        style={{
          fontFamily: "'Press Start 2P', monospace",
          fontSize: 7,
          color: "rgba(76, 241, 255, 0.4)",
          letterSpacing: 1,
        }}
      >
        2-FINGER TOUCH OR SPACE = BOOST
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
