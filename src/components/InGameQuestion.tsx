import { useState, useEffect, useRef } from "react"
import type { EducationContent } from "@/game/types"
import { playCorrectSound, playWrongSound } from "@/game/audio"
import { recordEducationAnswer } from "@/game/progression"
import { markQuestionMastered } from "@/game/education"

interface Props {
  question: EducationContent
  timeLimit?: number
  onResult: (correct: boolean, xpGained: number) => void
}

const pixel = "'Press Start 2P', monospace"
const vt = "'VT323', monospace"

export function InGameQuestion({ question, timeLimit = 15, onResult }: Props) {
  const [selected, setSelected] = useState<number | null>(null)
  const [timeLeft, setTimeLeft] = useState(timeLimit)
  const [answered, setAnswered] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!)
          if (!answered) {
            setAnswered(true)
            playWrongSound()
            const result = recordEducationAnswer(false)
            setTimeout(() => onResult(false, result.xpGained), 1200)
          }
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [onResult, answered])

  const handleAnswer = (idx: number) => {
    if (answered) return
    setSelected(idx)
    setAnswered(true)
    if (timerRef.current) clearInterval(timerRef.current)

    const correct = idx === question.correctAnswer
    if (correct) {
      playCorrectSound()
      if (question.question) markQuestionMastered(question.subject, question.question)
    } else {
      playWrongSound()
    }

    const result = recordEducationAnswer(correct)
    setTimeout(() => onResult(correct, result.xpGained), correct ? 800 : 1500)
  }

  if (question.type !== "quiz" || !question.options) return null

  const timerPct = (timeLeft / timeLimit) * 100
  const timerColor = timeLeft > 7 ? "#3ce67a" : timeLeft > 3 ? "#ffd93d" : "#ff2e63"

  return (
    <div style={{
      position: "absolute", bottom: 12, left: 8, right: 8, zIndex: 40,
      background: "rgba(10,10,20,0.95)", border: "3px solid #4cf1ff",
      padding: 10, maxWidth: 420, margin: "0 auto",
      boxShadow: "0 0 20px rgba(76,241,255,0.3)",
    }}>
      {/* Timer bar */}
      <div style={{ height: 4, background: "#0a0a14", marginBottom: 8, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${timerPct}%`, background: timerColor,
          transition: "width 1s linear, background 0.3s",
        }} />
      </div>

      {/* Question */}
      <div style={{
        fontFamily: vt, fontSize: 18, color: "#fff", marginBottom: 8, lineHeight: 1.3,
      }}>{question.question}</div>

      {/* Options - 2x2 grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        {question.options.map((opt, i) => {
          const isCorrect = i === question.correctAnswer
          const isSelected = selected === i
          let bg = "#1a1a2e"
          let border = "#2d2d5c"
          let color = "#fff"
          if (answered) {
            if (isCorrect) { bg = "#3ce67a20"; border = "#3ce67a"; color = "#3ce67a" }
            else if (isSelected) { bg = "#ff2e6320"; border = "#ff2e63"; color = "#ff2e63" }
          }
          const label = String.fromCharCode(65 + i)
          return (
            <button key={i} onClick={() => handleAnswer(i)}
              disabled={answered}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                background: bg, border: `2px solid ${border}`,
                padding: "6px 8px", cursor: answered ? "default" : "pointer",
                textAlign: "left",
              }}>
              <span style={{
                fontFamily: pixel, fontSize: 8, color: "#4cf1ff",
                width: 16, textAlign: "center", flexShrink: 0,
              }}>{label}</span>
              <span style={{ fontFamily: vt, fontSize: 16, color }}>{opt}</span>
            </button>
          )
        })}
      </div>

      {/* Result feedback */}
      {answered && (
        <div style={{
          textAlign: "center", marginTop: 6,
          fontFamily: pixel, fontSize: 8,
          color: selected === question.correctAnswer ? "#3ce67a" : "#ff2e63",
        }}>
          {selected === question.correctAnswer ? "✓ CORRECT! +15 XP" : timeLeft === 0 ? "⏰ TIME'S UP!" : "✗ WRONG"}
        </div>
      )}
    </div>
  )
}
