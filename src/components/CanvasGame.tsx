import { useRef, useEffect, useCallback, useState } from "react"
import { initAudio, playCrashSound } from "@/game/audio"
import { getEducationSet } from "@/game/education"
import type { EducationContent } from "@/game/types"
import { EducationOverlay } from "./EducationOverlay"

interface CanvasGameProps<S, I> {
  createState: () => S
  updateState: (state: S, dt: number, input: I) => void
  renderState: (ctx: CanvasRenderingContext2D, state: S, w: number, h: number) => void
  getDefaultInput: () => I
  setupInput: (input: I, onTap: () => void, onPause: () => void) => (() => void)
  isGameOver: (state: S) => boolean
  getScore: (state: S) => { score: number; secondary: number }
  setPaused: (state: S, paused: boolean) => void
  subjects: string[]
  grade?: string
  testMode?: boolean
  onGameOver?: (score: number, distance: number) => void
  onBackToHub?: () => void
}

export function CanvasGame<S, I>({
  createState, updateState, renderState, getDefaultInput, setupInput,
  isGameOver, getScore, setPaused: setStatePaused,
  subjects, grade, testMode = false, onGameOver, onBackToHub
}: CanvasGameProps<S, I>) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<S | null>(null)
  const inputRef = useRef<I>(getDefaultInput())
  const animRef = useRef(0)
  const lastTimeRef = useRef(0)
  const audioInitRef = useRef(false)
  const [isPaused, setIsPaused] = useState(false)
  const [showEducation, setShowEducation] = useState(false)
  const [educationContent, setEducationContent] = useState<EducationContent[]>([])

  const initGame = useCallback(() => {
    const state = createState()
    stateRef.current = state
    return state
  }, [createState])

  const handleTap = useCallback(() => {
    if (!audioInitRef.current) { initAudio(); audioInitRef.current = true }
    const state = stateRef.current
    if (!state) return

    if (isGameOver(state)) {
      if (testMode) {
        stateRef.current = createState()
        lastTimeRef.current = 0
      } else {
        playCrashSound()
        setEducationContent(getEducationSet(subjects, grade))
        setShowEducation(true)
      }
    }
  }, [testMode, subjects, grade, isGameOver, createState])

  useEffect(() => {
    (document.activeElement as HTMLElement)?.blur()
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const state = initGame()

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

      const currentState = stateRef.current ?? state
      if (!showEducation) {
        updateState(currentState, dt, inputRef.current)
      }

      renderState(ctx, currentState, canvas.width, canvas.height)
      animRef.current = requestAnimationFrame(loop)
    }
    animRef.current = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(animRef.current)
      window.removeEventListener("resize", resize)
    }
  }, [initGame, showEducation, updateState, renderState])

  useEffect(() => {
    if (stateRef.current) setStatePaused(stateRef.current, isPaused)
  }, [isPaused, setStatePaused])

  useEffect(() => {
    const cleanup = setupInput(
      inputRef.current,
      handleTap,
      () => setIsPaused(p => !p)
    )
    return cleanup
  }, [setupInput, handleTap])

  const handleEducationComplete = useCallback((passed: boolean) => {
    setShowEducation(false)
    const state = stateRef.current
    if (!state) return

    if (passed) {
      stateRef.current = createState()
      lastTimeRef.current = 0
    } else {
      const { score, secondary } = getScore(state)
      onGameOver?.(score, secondary)
    }
  }, [onGameOver, createState, getScore])

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{ touchAction: "none" }}
        onTouchStart={(e) => { e.preventDefault(); handleTap() }}
        onTouchEnd={(e) => { e.preventDefault() }}
        onMouseDown={handleTap}
      />

      <div className="absolute top-3 right-3 flex gap-2 z-10">
        <button onClick={() => setIsPaused(p => !p)}
          className="w-10 h-10 rounded-full bg-gray-800/70 flex items-center justify-center text-white text-lg">
          {isPaused ? "▶" : "⏸"}
        </button>
      </div>

      {isPaused && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-950/80 z-20">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold text-white">Paused</h2>
            <div className="flex flex-col gap-3 w-56">
              <button onClick={() => setIsPaused(false)}
                className="px-8 py-3 rounded-xl font-bold text-gray-950"
                style={{ backgroundColor: "#00d4e0" }}>Resume</button>
              <button onClick={onBackToHub}
                className="px-8 py-3 bg-gray-800 text-gray-300 font-semibold rounded-xl">Back to Games</button>
            </div>
          </div>
        </div>
      )}

      {showEducation && (
        <EducationOverlay content={educationContent} onComplete={handleEducationComplete} crashResume={true} testMode={testMode} />
      )}
    </div>
  )
}
