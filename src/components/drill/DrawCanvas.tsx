import { useEffect, useRef, useState, useCallback } from "react"
import { recognizeNumber, type Point, type Stroke } from "@/game/drillRecognize"

interface Props {
  width: number
  height: number
  onGuessChange?: (n: number | null) => void
  strokeColor?: string
  disabled?: boolean
}

export function DrawCanvas({
  width,
  height,
  onGuessChange,
  strokeColor = "#4cf1ff",
  disabled = false,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const strokesRef = useRef<Stroke[]>([])
  const currentRef = useRef<Stroke | null>(null)
  const guessTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [guess, setGuess] = useState<number | null>(null)
  const [strokeCount, setStrokeCount] = useState(0)

  const redraw = useCallback(() => {
    const cvs = canvasRef.current
    if (!cvs) return
    const ctx = cvs.getContext("2d")
    if (!ctx) return
    ctx.clearRect(0, 0, cvs.width, cvs.height)
    ctx.lineWidth = 10
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    ctx.strokeStyle = strokeColor
    ctx.shadowColor = strokeColor
    ctx.shadowBlur = 4
    const all: Stroke[] = [...strokesRef.current]
    if (currentRef.current) all.push(currentRef.current)
    for (const stroke of all) {
      if (stroke.length < 2) continue
      ctx.beginPath()
      ctx.moveTo(stroke[0].x, stroke[0].y)
      for (let i = 1; i < stroke.length; i++) ctx.lineTo(stroke[i].x, stroke[i].y)
      ctx.stroke()
    }
    ctx.shadowBlur = 0
  }, [strokeColor])

  const updateGuess = useCallback(() => {
    if (guessTimerRef.current) clearTimeout(guessTimerRef.current)
    guessTimerRef.current = setTimeout(() => {
      const n = recognizeNumber(strokesRef.current)
      setGuess(n)
      onGuessChange?.(n)
    }, 250)
  }, [onGuessChange])

  const clear = useCallback(() => {
    strokesRef.current = []
    currentRef.current = null
    setGuess(null)
    setStrokeCount(0)
    onGuessChange?.(null)
    if (guessTimerRef.current) clearTimeout(guessTimerRef.current)
    redraw()
  }, [redraw, onGuessChange])

  const undo = useCallback(() => {
    if (strokesRef.current.length === 0) return
    strokesRef.current.pop()
    setStrokeCount(strokesRef.current.length)
    if (guessTimerRef.current) clearTimeout(guessTimerRef.current)
    redraw()
    if (strokesRef.current.length > 0) {
      updateGuess()
    } else {
      setGuess(null)
      onGuessChange?.(null)
    }
  }, [redraw, updateGuess, onGuessChange])

  useEffect(() => { redraw() }, [strokeColor, redraw])

  const getPt = (e: React.MouseEvent | React.TouchEvent): Point => {
    const cvs = canvasRef.current!
    const rect = cvs.getBoundingClientRect()
    const t = "touches" in e ? e.touches[0] : (e as React.MouseEvent)
    return {
      x: (t.clientX - rect.left) * (cvs.width / rect.width),
      y: (t.clientY - rect.top) * (cvs.height / rect.height),
    }
  }

  const start = (e: React.MouseEvent | React.TouchEvent) => {
    if (disabled) return
    e.preventDefault()
    currentRef.current = [getPt(e)]
    if (guessTimerRef.current) clearTimeout(guessTimerRef.current)
  }

  const move = (e: React.MouseEvent | React.TouchEvent) => {
    if (!currentRef.current) return
    e.preventDefault()
    currentRef.current.push(getPt(e))
    redraw()
  }

  const end = (e?: React.MouseEvent | React.TouchEvent) => {
    if (!currentRef.current) return
    if (e) e.preventDefault()
    if (currentRef.current.length >= 2) {
      strokesRef.current.push(currentRef.current)
      setStrokeCount(strokesRef.current.length)
    }
    currentRef.current = null
    redraw()
    updateGuess()
  }

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onMouseDown={start}
        onMouseMove={move}
        onMouseUp={end}
        onMouseLeave={end}
        onTouchStart={start}
        onTouchMove={move}
        onTouchEnd={end}
        style={{ width: "100%", height: "100%", display: "block", touchAction: "none", cursor: disabled ? "not-allowed" : "crosshair" }}
      />
      <div style={{
        position: "absolute", top: 8, right: 8,
        display: "flex", gap: 6,
      }}>
        {strokeCount > 0 && (
          <button
            onClick={undo}
            style={{
              fontFamily: "'Press Start 2P', monospace", fontSize: 8,
              background: "#ff7a1f", color: "#0a0a14",
              border: "3px solid #0a0a14", padding: "6px 10px",
              cursor: "pointer", letterSpacing: 1,
            }}
          >UNDO</button>
        )}
        <button
          onClick={clear}
          style={{
            fontFamily: "'Press Start 2P', monospace", fontSize: 8,
            background: "#2d2d5c", color: "#fff",
            border: "3px solid #0a0a14", padding: "6px 10px",
            cursor: "pointer", letterSpacing: 1,
          }}
        >CLEAR</button>
      </div>
      {guess !== null && (
        <div style={{
          position: "absolute", top: 8, left: 8,
          fontFamily: "'Press Start 2P', monospace", fontSize: 10,
          background: "#ffd93d", color: "#0a0a14", padding: "6px 10px",
          border: "3px solid #0a0a14",
        }}>= {guess}</div>
      )}
    </div>
  )
}
