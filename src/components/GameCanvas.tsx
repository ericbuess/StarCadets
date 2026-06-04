import { useRef, useEffect, useCallback, useState } from "react"
import type { GameState, GhostFrame, VehicleProfile } from "@/game/types"
import { createCar, updatePhysics, updateParticles } from "@/game/physics"
import { generateSegment } from "@/game/terrain"
import { renderGame } from "@/game/renderer"
import { generateGoal, updateGoalProgress } from "@/game/goals"
import { musicPlayer } from "@/game/music"
import {
  initAudio,
  playCrashSound,
  playFlipSound,
  playPowerupSound,
  playEngineSound,
  playCelebrationSound
} from "@/game/audio"
import { getEducationSet } from "@/game/education"
import type { EducationContent } from "@/game/types"
import { EducationOverlay } from "./EducationOverlay"

interface GameCanvasProps {
  subjects: string[]
  grade?: string
  vehicle?: VehicleProfile
  onScoreUpdate?: (score: number, distance: number) => void
  onGameOver?: (score: number, distance: number, ghostFrames: GhostFrame[]) => void
  bestGhost?: GhostFrame[]
  raceId?: string
  musicEnabled?: boolean
  testMode?: boolean
  onToggleTestMode?: () => void
  onBackToHub?: () => void
}

export function GameCanvas({
  subjects,
  grade,
  vehicle,
  onScoreUpdate,
  onGameOver,
  bestGhost = [],
  raceId = "default",
  musicEnabled = true,
  testMode = false,
  onToggleTestMode: _onToggleTestMode,
  onBackToHub
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<GameState | null>(null)
  const leftPressedRef = useRef(false)
  const rightPressedRef = useRef(false)
  const animFrameRef = useRef(0)
  const lastTimeRef = useRef(0)
  const audioInitRef = useRef(false)
  const prevFlipCountRef = useRef(0)
  const prevPowerupCountRef = useRef(0)
  const engineSoundTimerRef = useRef(0)
  // Goal tracking refs
  const goalStartRef = useRef({
    distance: 0, frontFlips: 0, backFlips: 0, combo: 0,
    enemiesDestroyed: 0, powerupsCollected: 0, airTime: 0,
    maxSpeed: 0, surviveTimer: 0
  })

  const [showEducation, setShowEducation] = useState(false)
  const [educationContent, setEducationContent] = useState<EducationContent[]>([])
  const [crashResume, setCrashResume] = useState(false)
  const [isPaused, setIsPaused] = useState(false)

  const initGame = useCallback(() => {
    const car = createCar(vehicle)
    const firstGoal = generateGoal(0, 0)
    const state: GameState = {
      car,
      terrain: [],
      obstacles: [],
      enemies: [],
      powerups: [],
      particles: [],
      projectiles: [],
      camera: { x: 0, y: 0 },
      time: 0,
      gameOver: false,
      paused: false,
      showEducation: false,
      educationCheckpoint: 0,
      currentGoal: firstGoal,
      goalCount: 0,
      ghostFrames: [],
      bestGhostFrames: bestGhost,
      raceId
    }

    // Generate initial terrain
    let startX = -200
    let lastY = 400
    for (let i = 0; i < 15; i++) {
      if (i < 3) {
        const pts = []
        for (let j = 0; j <= 30; j++) {
          pts.push({ x: startX + (j / 30) * 600, y: lastY })
        }
        state.terrain.push({ startX, points: pts, type: "flat" })
        startX += 600
      } else {
        const { segment, obstacles, powerups, enemies } = generateSegment(startX, lastY, startX)
        state.terrain.push(segment)
        state.obstacles.push(...obstacles)
        state.powerups.push(...powerups)
        state.enemies.push(...enemies)
        const lastPt = segment.points[segment.points.length - 1]
        if (lastPt && lastPt.y < 700) lastY = lastPt.y
        startX += 600
      }
    }

    // Init goal tracking
    goalStartRef.current = {
      distance: car.distance,
      frontFlips: car.frontFlipCount,
      backFlips: car.backFlipCount,
      combo: car.combo,
      enemiesDestroyed: car.enemiesDestroyed,
      powerupsCollected: car.powerupsCollected,
      airTime: car.totalAirTime,
      maxSpeed: car.maxSpeed,
      surviveTimer: 0
    }

    stateRef.current = state
    prevFlipCountRef.current = 0
    prevPowerupCountRef.current = 0
    return state
  }, [bestGhost, raceId, vehicle])

  // Game loop
  useEffect(() => {
    initGame()

    // Start music
    if (musicEnabled) {
      musicPlayer.play()
    }

    const loop = (timestamp: number) => {
      if (!stateRef.current) return
      const state = stateRef.current
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr

      if (lastTimeRef.current === 0) lastTimeRef.current = timestamp
      let dt = (timestamp - lastTimeRef.current) / 1000
      lastTimeRef.current = timestamp
      dt = Math.min(dt, 0.05)

      if (!state.paused && !state.showEducation && !state.car.crashed) {
        state.time += dt

        // Physics
        const newParticles = updatePhysics(state, dt, leftPressedRef.current, rightPressedRef.current)
        state.particles.push(...newParticles)
        state.particles = updateParticles(state.particles, dt)

        // Audio feedback
        if (state.car.flipCount > prevFlipCountRef.current) {
          playFlipSound()
          prevFlipCountRef.current = state.car.flipCount
        }
        const collectedCount = state.powerups.filter(p => p.collected).length
        if (collectedCount > prevPowerupCountRef.current) {
          playPowerupSound()
          prevPowerupCountRef.current = collectedCount
        }
        engineSoundTimerRef.current += dt
        if (engineSoundTimerRef.current > 0.15 && Math.abs(state.car.vel.x) > 30) {
          playEngineSound(Math.abs(state.car.vel.x))
          engineSoundTimerRef.current = 0
        }

        // ─── Goal system ───
        if (state.currentGoal && !state.currentGoal.completed && !state.currentGoal.failed) {
          const result = updateGoalProgress(state.currentGoal, state.car, dt, goalStartRef.current)
          goalStartRef.current.surviveTimer = result.surviveTimer

          if (result.completed) {
            // Goal passed! Award bonus and generate next goal
            playCelebrationSound()
            state.car.score += 500 + state.goalCount * 100
            state.goalCount++

            // Generate new goal after a brief delay (handled by setting completed)
            setTimeout(() => {
              if (!stateRef.current) return
              const difficulty = Math.min(stateRef.current.goalCount / 15, 1)
              stateRef.current.currentGoal = generateGoal(stateRef.current.goalCount, difficulty)
              goalStartRef.current = {
                distance: stateRef.current.car.distance,
                frontFlips: stateRef.current.car.frontFlipCount,
                backFlips: stateRef.current.car.backFlipCount,
                combo: stateRef.current.car.combo,
                enemiesDestroyed: stateRef.current.car.enemiesDestroyed,
                powerupsCollected: stateRef.current.car.powerupsCollected,
                airTime: stateRef.current.car.totalAirTime,
                maxSpeed: stateRef.current.car.maxSpeed,
                surviveTimer: 0
              }
            }, 1500)
          }

          if (result.failed) {
            // Goal failed — just generate next goal (education only on crash)
            const difficulty = Math.min(state.goalCount / 15, 1)
            state.currentGoal = generateGoal(state.goalCount, difficulty)
          }
        }

        // Camera follow
        state.camera.x += (state.car.pos.x - state.camera.x) * 0.08
        state.camera.y += (state.car.pos.y - state.camera.y) * 0.05

        // Generate more terrain
        const lastSeg = state.terrain[state.terrain.length - 1]
        if (lastSeg) {
          const lastPt = lastSeg.points[lastSeg.points.length - 1]
          if (lastPt && state.car.pos.x > lastPt.x - 3000) {
            let segStartX = lastPt.x
            let segLastY = lastPt.y < 700 ? lastPt.y : 400
            for (let i = 0; i < 5; i++) {
              const { segment, obstacles, powerups, enemies } = generateSegment(segStartX, segLastY, state.car.distance)
              state.terrain.push(segment)
              state.obstacles.push(...obstacles)
              state.powerups.push(...powerups)
              state.enemies.push(...enemies)
              const lp = segment.points[segment.points.length - 1]
              if (lp && lp.y < 700) segLastY = lp.y
              segStartX += 600
            }
          }
        }

        // Cleanup
        state.terrain = state.terrain.filter(seg => {
          const lp = seg.points[seg.points.length - 1]
          return !lp || lp.x > state.car.pos.x - 2000
        })
        state.obstacles = state.obstacles.filter(o => !o.destroyed && o.pos.x > state.car.pos.x - 1000)
        state.enemies = state.enemies.filter(e => e.alive && e.pos.x > state.car.pos.x - 1000)
        state.powerups = state.powerups.filter(p => !p.collected && p.pos.x > state.car.pos.x - 1000)

        onScoreUpdate?.(Math.floor(state.car.score), Math.floor(state.car.distance))

        // Crash
        if (state.car.crashed) {
          playCrashSound()
        }
      }

      renderGame(ctx, state, canvas.width, canvas.height, leftPressedRef.current, rightPressedRef.current)
      animFrameRef.current = requestAnimationFrame(loop)
    }

    animFrameRef.current = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(animFrameRef.current)
      musicPlayer.stop()
    }
  }, [initGame, subjects, grade, onScoreUpdate, musicEnabled])

  // Touch / Mouse handlers
  const handlePointerDown = useCallback((clientX: number) => {
    if (!audioInitRef.current) {
      initAudio()
      if (musicEnabled) musicPlayer.play()
      audioInitRef.current = true
    }

    const state = stateRef.current
    if (!state) return

    if (state.car.crashed) {
      if (testMode) {
        // Test mode — skip education, resume immediately
        state.car.crashed = false
        state.car.vel = { x: 0, y: 0 }
        state.car.angle = 0
        state.car.angularVel = 0
        state.car.pos.y -= 50
        const difficulty = Math.min(state.goalCount / 15, 1)
        state.currentGoal = generateGoal(state.goalCount, difficulty)
        return
      }
      const content = getEducationSet(subjects, grade)
      setEducationContent(content)
      setCrashResume(true)
      setShowEducation(true)
      state.showEducation = true
      return
    }

    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const relX = clientX - rect.left
    if (relX < rect.width / 2) leftPressedRef.current = true
    else rightPressedRef.current = true
  }, [subjects, grade, musicEnabled])

  const handlePointerUp = useCallback((clientX: number) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const relX = clientX - rect.left
    if (relX < rect.width / 2) leftPressedRef.current = false
    else rightPressedRef.current = false
  }, [])

  const handleAllUp = useCallback(() => {
    leftPressedRef.current = false
    rightPressedRef.current = false
  }, [])

  // Keyboard
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a") leftPressedRef.current = true
      if (e.key === "ArrowRight" || e.key === "d") rightPressedRef.current = true
      if (e.key === "Escape") setIsPaused(p => !p)
      // M to cycle music
      if (e.key === "m") musicPlayer.nextTrack()
      if (!audioInitRef.current) { initAudio(); audioInitRef.current = true }
    }
    const up = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a") leftPressedRef.current = false
      if (e.key === "ArrowRight" || e.key === "d") rightPressedRef.current = false
    }
    window.addEventListener("keydown", down)
    window.addEventListener("keyup", up)
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up) }
  }, [])

  useEffect(() => {
    if (stateRef.current) stateRef.current.paused = isPaused
  }, [isPaused])

  const handleEducationComplete = useCallback((passed: boolean) => {
    setShowEducation(false)
    const state = stateRef.current
    if (!state) return
    state.showEducation = false

    if (passed) {
      if (crashResume) {
        state.car.crashed = false
        state.car.vel = { x: 0, y: 0 }
        state.car.angle = 0
        state.car.angularVel = 0
        state.car.pos.y -= 50
      }
      // Generate next goal after education
      const difficulty = Math.min(state.goalCount / 15, 1)
      state.currentGoal = generateGoal(state.goalCount, difficulty)
      goalStartRef.current = {
        distance: state.car.distance,
        frontFlips: state.car.frontFlipCount,
        backFlips: state.car.backFlipCount,
        combo: state.car.combo,
        enemiesDestroyed: state.car.enemiesDestroyed,
        powerupsCollected: state.car.powerupsCollected,
        airTime: state.car.totalAirTime,
        maxSpeed: state.car.maxSpeed,
        surviveTimer: 0
      }
    } else {
      if (crashResume) {
        onGameOver?.(Math.floor(state.car.score), Math.floor(state.car.distance), state.ghostFrames)
      }
    }
  }, [crashResume, onGameOver])

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{ touchAction: "none" }}
        onTouchStart={(e) => {
          e.preventDefault()
          for (let i = 0; i < e.touches.length; i++) handlePointerDown(e.touches[i].clientX)
        }}
        onTouchEnd={(e) => {
          e.preventDefault()
          if (e.touches.length === 0) { handleAllUp() }
          else {
            const canvas = canvasRef.current
            if (canvas) {
              const rect = canvas.getBoundingClientRect()
              leftPressedRef.current = false
              rightPressedRef.current = false
              for (let i = 0; i < e.touches.length; i++) {
                const relX = e.touches[i].clientX - rect.left
                if (relX < rect.width / 2) leftPressedRef.current = true
                else rightPressedRef.current = true
              }
            }
          }
        }}
        onMouseDown={(e) => handlePointerDown(e.clientX)}
        onMouseUp={(e) => handlePointerUp(e.clientX)}
        onMouseLeave={handleAllUp}
      />

      {/* Top-right buttons */}
      <div className="absolute top-3 right-3 flex gap-2 z-10">
        <button
          onClick={() => musicPlayer.nextTrack()}
          className="w-10 h-10 rounded-full bg-gray-800/70 flex items-center justify-center text-white text-sm"
          title="Next track (M)"
        >
          ♪
        </button>
        <button
          onClick={() => setIsPaused(p => !p)}
          className="w-10 h-10 rounded-full bg-gray-800/70 flex items-center justify-center text-white text-lg"
        >
          {isPaused ? "▶" : "⏸"}
        </button>
      </div>

      {/* Pause overlay */}
      {isPaused && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-950/80 z-20">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold text-white">Paused</h2>

            {/* Music selector */}
            <div className="bg-gray-900 rounded-xl p-4 space-y-2">
              <p className="text-sm text-gray-400">Music Track</p>
              <div className="flex items-center justify-center gap-3">
                <button onClick={() => musicPlayer.prevTrack()} className="text-white text-xl px-2">◀</button>
                <span className="text-white font-medium min-w-[140px]">{musicPlayer.trackName}</span>
                <button onClick={() => musicPlayer.nextTrack()} className="text-white text-xl px-2">▶</button>
              </div>
            </div>

            <div className="flex flex-col gap-3 w-56">
              <button
                onClick={() => setIsPaused(false)}
                className="px-8 py-3 rounded-xl font-bold text-gray-950"
                style={{ backgroundColor: "#00d4e0" }}
              >
                Resume
              </button>
              <button
                onClick={onBackToHub}
                className="px-8 py-3 bg-gray-800 text-gray-300 font-semibold rounded-xl"
              >
                Back to Games
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Education overlay */}
      {showEducation && (
        <EducationOverlay
          content={educationContent}
          onComplete={handleEducationComplete}
          crashResume={crashResume}
          testMode={testMode}
        />
      )}
    </div>
  )
}
