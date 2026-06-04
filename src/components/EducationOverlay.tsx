import { useState, useRef, useEffect, useCallback } from "react"
import type { EducationContent } from "@/game/types"
import { playCorrectSound, playWrongSound, playCelebrationSound } from "@/game/audio"
import { markQuestionMastered } from "@/game/education"

interface EducationOverlayProps {
  content: EducationContent[]
  onComplete: (passed: boolean) => void
  crashResume?: boolean
  testMode?: boolean
}

type Phase = "video" | "flashcards" | "quiz" | "complete"

const pixel = "'Press Start 2P', monospace"
const vt = "'VT323', monospace"

export function EducationOverlay({ content, onComplete, crashResume, testMode }: EducationOverlayProps) {
  const [phase, setPhase] = useState<Phase>("video")
  const [currentIndex, setCurrentIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [flashcardProgress, setFlashcardProgress] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showExplanation, setShowExplanation] = useState(false)
  const [quizScore, setQuizScore] = useState(0)
  const [quizTotal, setQuizTotal] = useState(0)
  const [scratchPadActive, setScratchPadActive] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawingRef = useRef(false)
  const lastPointRef = useRef<{ x: number; y: number } | null>(null)

  const videos = content.filter(c => c.type === "video")
  const flashcards = content.filter(c => c.type === "flashcard")
  const quizzes = content.filter(c => c.type === "quiz")

  useEffect(() => {
    if (videos.length > 0) setPhase("video")
    else if (flashcards.length > 0) setPhase("flashcards")
    else if (quizzes.length > 0) setPhase("quiz")
    else setPhase("complete")
  }, [videos.length, flashcards.length, quizzes.length])

  const clearScratchPad = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }, [])

  const getPos = (e: React.TouchEvent | React.MouseEvent): { x: number; y: number } | null => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    if ("touches" in e) {
      const touch = e.touches[0]
      if (!touch) return null
      return { x: touch.clientX - rect.left, y: touch.clientY - rect.top }
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top }
  }

  const startDraw = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault()
    drawingRef.current = true
    lastPointRef.current = getPos(e)
  }

  const draw = (e: React.TouchEvent | React.MouseEvent) => {
    if (!drawingRef.current) return
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const pos = getPos(e)
    if (!pos || !lastPointRef.current) return

    ctx.beginPath()
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.strokeStyle = "#4cf1ff"
    ctx.lineWidth = 3
    ctx.lineCap = "round"
    ctx.stroke()
    lastPointRef.current = pos
  }

  const endDraw = () => {
    drawingRef.current = false
    lastPointRef.current = null
  }

  const advancePhase = () => {
    if (phase === "video") {
      if (flashcards.length > 0) {
        setPhase("flashcards")
        setCurrentIndex(0)
        setFlipped(false)
        setFlashcardProgress(0)
      } else if (quizzes.length > 0) {
        setPhase("quiz")
        setCurrentIndex(0)
      } else {
        setPhase("complete")
      }
    } else if (phase === "flashcards") {
      if (quizzes.length > 0) {
        setPhase("quiz")
        setCurrentIndex(0)
        setSelectedAnswer(null)
        setShowExplanation(false)
      } else {
        setPhase("complete")
      }
    } else if (phase === "quiz") {
      setPhase("complete")
    }
  }

  const handleFlashcardNext = () => {
    if (!flipped) {
      setFlipped(true)
      return
    }
    const newProgress = flashcardProgress + 1
    setFlashcardProgress(newProgress)
    if (currentIndex + 1 < flashcards.length) {
      setCurrentIndex(currentIndex + 1)
      setFlipped(false)
    } else {
      advancePhase()
    }
  }

  const handleQuizAnswer = (idx: number) => {
    if (selectedAnswer !== null) return
    setSelectedAnswer(idx)
    setShowExplanation(true)
    const quiz = quizzes[currentIndex]
    const newTotal = quizTotal + 1
    setQuizTotal(newTotal)
    const isCorrect = idx === quiz.correctAnswer
    if (isCorrect) {
      setQuizScore(quizScore + 1)
      playCorrectSound()
      if (quiz.question) markQuestionMastered(quiz.subject, quiz.question)
    } else {
      playWrongSound()
    }
    try {
      const saved = localStorage.getItem("edu_educationProgress")
      const progress = saved ? JSON.parse(saved) : { answered: 0, correct: 0 }
      progress.answered++
      if (isCorrect) progress.correct++
      localStorage.setItem("edu_educationProgress", JSON.stringify(progress))
    } catch { /* ignore */ }
  }

  const handleQuizNext = () => {
    if (currentIndex + 1 < quizzes.length) {
      setCurrentIndex(currentIndex + 1)
      setSelectedAnswer(null)
      setShowExplanation(false)
      clearScratchPad()
    } else {
      const passed = quizScore / quizTotal >= 0.5 || quizTotal === 0
      if (passed) playCelebrationSound()
      setPhase("complete")
    }
  }

  if (phase === "complete") {
    const passed = quizTotal === 0 || quizScore / quizTotal >= 0.5
    return (
      <div style={{
        position: "fixed", inset: 0, zIndex: 50,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(10,10,20,0.95)", padding: 16,
      }}>
        <div style={{ maxWidth: 400, width: "100%", textAlign: "center" }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>{passed ? "🎉" : "📚"}</div>
          <div style={{
            fontFamily: pixel, fontSize: 20, color: "#ffd93d",
            textShadow: "3px 3px 0 #ff2e63, 6px 6px 0 #b83dff",
            marginBottom: 12,
          }}>{passed ? "GREAT JOB!" : "KEEP STUDYING!"}</div>
          {quizTotal > 0 && (
            <div style={{ fontFamily: pixel, fontSize: 14, color: "#4cf1ff", marginBottom: 12 }}>
              SCORE: {quizScore}/{quizTotal}
            </div>
          )}
          <div style={{ fontFamily: vt, fontSize: 20, color: "#8a8aad", marginBottom: 20 }}>
            {passed
              ? crashResume ? "You passed! Resuming from where you crashed." : "You've earned your way forward. Keep racing!"
              : "You need 50% to pass. Try again!"}
          </div>
          <button onClick={() => onComplete(passed)} style={{
            background: "#ffd93d", border: "4px solid #ffd93d",
            padding: "14px 32px", cursor: "pointer",
            fontFamily: pixel, fontSize: 12, color: "#0a0a14",
            boxShadow: "0 0 20px #ffd93d40, inset 0 -4px 0 #cc9900",
          }}>{passed ? (crashResume ? "RESUME!" : "CONTINUE!") : "TRY AGAIN"}</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 50,
      display: "flex", flexDirection: "column",
      background: "rgba(10,10,20,0.95)", padding: 16, overflowY: "auto",
    }}>
      {/* Phase indicator + skip */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 16 }}>
        {["video", "flashcards", "quiz"].map(p => (
          <div key={p} style={{
            padding: "6px 12px",
            fontFamily: pixel, fontSize: 7, letterSpacing: 1,
            background: phase === p ? "#4cf1ff" : "#1a1a2e",
            border: `3px solid ${phase === p ? "#4cf1ff" : "#2d2d5c"}`,
            color: phase === p ? "#0a0a14" : "#8a8aad",
          }}>
            {p === "video" ? "LESSON" : p === "flashcards" ? "CARDS" : "QUIZ"}
          </div>
        ))}
        {testMode && (
          <button onClick={() => onComplete(true)} style={{
            marginLeft: 12, padding: "6px 14px",
            fontFamily: pixel, fontSize: 7, letterSpacing: 1,
            background: "#ff2e6320", border: "3px solid #ff2e63",
            color: "#ff2e63", cursor: "pointer",
          }}>SKIP</button>
        )}
      </div>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ maxWidth: 500, width: "100%" }}>

          {/* VIDEO PHASE */}
          {phase === "video" && videos.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{
                fontFamily: pixel, fontSize: 14, color: "#ffd93d",
                textShadow: "2px 2px 0 #ff2e63", textAlign: "center",
              }}>{videos[0].videoTitle}</div>
              <div style={{
                background: "#1a1a2e", border: "4px solid #2d2d5c", padding: 20,
                maxHeight: "50vh", overflowY: "auto",
              }}>
                <div style={{ fontFamily: vt, fontSize: 22, color: "#ccc", whiteSpace: "pre-line", lineHeight: 1.5 }}>
                  {videos[0].videoContent}
                </div>
              </div>
              <div style={{ textAlign: "center" }}>
                <button onClick={advancePhase} style={{
                  background: "#4cf1ff", border: "4px solid #4cf1ff",
                  padding: "12px 28px", cursor: "pointer",
                  fontFamily: pixel, fontSize: 10, color: "#0a0a14",
                  boxShadow: "0 0 16px #4cf1ff30, inset 0 -4px 0 #00a0b0",
                }}>GOT IT! NEXT →</button>
              </div>
            </div>
          )}

          {/* FLASHCARD PHASE */}
          {phase === "flashcards" && flashcards.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ fontFamily: vt, fontSize: 20, color: "#8a8aad", textAlign: "center" }}>
                CARD {currentIndex + 1} OF {flashcards.length}
              </div>
              <button onClick={handleFlashcardNext} style={{
                width: "100%", minHeight: 200,
                background: flipped ? "#4cf1ff10" : "#1a1a2e",
                border: `4px solid ${flipped ? "#4cf1ff" : "#2d2d5c"}`,
                padding: 24, cursor: "pointer", textAlign: "center",
              }}>
                {!flipped ? (
                  <>
                    <div style={{ fontFamily: pixel, fontSize: 7, color: "#8a8aad", letterSpacing: 1, marginBottom: 12 }}>TERM</div>
                    <div style={{ fontFamily: pixel, fontSize: 16, color: "#fff" }}>{flashcards[currentIndex].term}</div>
                    <div style={{ fontFamily: vt, fontSize: 18, color: "#8a8aad60", marginTop: 16 }}>TAP TO REVEAL</div>
                  </>
                ) : (
                  <>
                    <div style={{ fontFamily: pixel, fontSize: 7, color: "#4cf1ff", letterSpacing: 1, marginBottom: 12 }}>DEFINITION</div>
                    <div style={{ fontFamily: vt, fontSize: 22, color: "#ccc" }}>{flashcards[currentIndex].definition}</div>
                    <div style={{ fontFamily: vt, fontSize: 18, color: "#8a8aad60", marginTop: 16 }}>TAP TO CONTINUE</div>
                  </>
                )}
              </button>
              <div style={{ display: "flex", justifyContent: "center", gap: 6 }}>
                {flashcards.map((_, i) => (
                  <div key={i} style={{
                    width: 8, height: 8,
                    background: i < flashcardProgress ? "#4cf1ff" : i === currentIndex ? "#fff" : "#2d2d5c",
                  }} />
                ))}
              </div>
            </div>
          )}

          {/* QUIZ PHASE */}
          {phase === "quiz" && quizzes.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontFamily: vt, fontSize: 20, color: "#8a8aad" }}>
                  QUESTION {currentIndex + 1} OF {quizzes.length}
                </span>
                <span style={{ fontFamily: pixel, fontSize: 10, color: "#4cf1ff" }}>
                  {quizScore}/{quizTotal}
                </span>
              </div>

              <div style={{ background: "#1a1a2e", border: "4px solid #2d2d5c", padding: 16 }}>
                <div style={{ fontFamily: pixel, fontSize: 7, color: "#8a8aad", letterSpacing: 1, marginBottom: 6 }}>
                  {quizzes[currentIndex].subject}
                </div>
                <div style={{ fontFamily: vt, fontSize: 24, color: "#fff" }}>
                  {quizzes[currentIndex].question}
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {quizzes[currentIndex].options?.map((opt, i) => {
                  const isSelected = selectedAnswer === i
                  const isCorrect = i === quizzes[currentIndex].correctAnswer
                  let borderColor = "#2d2d5c"
                  let bgColor = "transparent"
                  if (showExplanation) {
                    if (isCorrect) { borderColor = "#3ce67a"; bgColor = "#3ce67a15" }
                    else if (isSelected && !isCorrect) { borderColor = "#ff2e63"; bgColor = "#ff2e6315" }
                  } else if (isSelected) {
                    borderColor = "#4cf1ff"
                  }
                  return (
                    <button key={i} onClick={() => handleQuizAnswer(i)} disabled={selectedAnswer !== null}
                      style={{
                        width: "100%", textAlign: "left", padding: "12px 16px",
                        background: bgColor, border: `3px solid ${borderColor}`,
                        cursor: selectedAnswer !== null ? "default" : "pointer",
                      }}>
                      <span style={{ fontFamily: pixel, fontSize: 10, color: "#8a8aad", marginRight: 12 }}>
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span style={{ fontFamily: vt, fontSize: 22, color: "#fff" }}>{opt}</span>
                    </button>
                  )
                })}
              </div>

              {showExplanation && (
                <div style={{ background: "#1a1a2e", border: "4px solid #2d2d5c", padding: 14 }}>
                  <div style={{ fontFamily: vt, fontSize: 20, color: "#ccc" }}>
                    {quizzes[currentIndex].explanation}
                  </div>
                </div>
              )}

              {/* Scratch Pad */}
              <div>
                <button onClick={() => setScratchPadActive(!scratchPadActive)} style={{
                  background: "#1a1a2e", border: "3px solid #2d2d5c",
                  padding: "6px 12px", cursor: "pointer",
                  fontFamily: pixel, fontSize: 7, color: "#8a8aad",
                  marginBottom: 8,
                }}>{scratchPadActive ? "HIDE" : "SHOW"} SCRATCH PAD</button>
                {scratchPadActive && (
                  <div style={{ position: "relative" }}>
                    <canvas
                      ref={canvasRef}
                      width={400} height={150}
                      style={{
                        width: "100%", touchAction: "none",
                        background: "#0a0a14", border: "3px solid #2d2d5c",
                      }}
                      onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw}
                      onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
                    />
                    <button onClick={clearScratchPad} style={{
                      position: "absolute", top: 8, right: 8,
                      background: "#1a1a2e", border: "2px solid #2d2d5c",
                      padding: "4px 8px", cursor: "pointer",
                      fontFamily: pixel, fontSize: 6, color: "#8a8aad",
                    }}>CLEAR</button>
                  </div>
                )}
              </div>

              {showExplanation && (
                <div style={{ textAlign: "center" }}>
                  <button onClick={handleQuizNext} style={{
                    background: "#4cf1ff", border: "4px solid #4cf1ff",
                    padding: "12px 28px", cursor: "pointer",
                    fontFamily: pixel, fontSize: 10, color: "#0a0a14",
                    boxShadow: "0 0 16px #4cf1ff30, inset 0 -4px 0 #00a0b0",
                  }}>{currentIndex + 1 < quizzes.length ? "NEXT →" : "FINISH"}</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
