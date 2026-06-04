import { useEffect, useRef, useState } from "react"
import { DrawCanvas } from "./DrawCanvas"
import { StarFieldBg } from "@/components/arcade/StarFieldBg"
import { genProblem } from "@/game/drillProblems"
import type { DrillResult, DrillSettings, Problem } from "@/types/drill"

interface Props {
  settings: DrillSettings
  onFinish: (r: DrillResult) => void
  onExit: () => void
}

type UiState = "drawing" | "correct" | "wrong"

export function DrillScreen({ settings, onFinish, onExit }: Props) {
  const totalTime = settings.session === "60s" ? 60 : settings.session === "30s" ? 30 : 999
  const totalProblems = settings.session === "20p" ? 20 : 999
  const [timeLeft, setTimeLeft] = useState(totalTime)
  const [_problems, setProblems] = useState<Problem[]>(() => [genProblem()])
  const [idx, setIdx] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [wrong, setWrong] = useState(0)
  const [state, setState] = useState<UiState>("drawing")
  const [combo, setCombo] = useState(0)
  const [lastGuess, setLastGuess] = useState<number | null>(null)
  const [shake, setShake] = useState(false)
  const [canvasKey, setCanvasKey] = useState(0)
  const [currentGuess, setCurrentGuess] = useState<number | null>(null)
  const [keypadValue, setKeypadValue] = useState("")
  const [showCanvas, setShowCanvas] = useState(false)
  const finishedRef = useRef(false)

  const current = _problems[idx]

  useEffect(() => {
    if (settings.session === "20p") return
    if (finishedRef.current) return
    if (timeLeft <= 0) {
      finishedRef.current = true
      onFinish({ correct, wrong, elapsedSec: totalTime })
      return
    }
    const t = setTimeout(() => setTimeLeft(x => x - 1), 1000)
    return () => clearTimeout(t)
  }, [timeLeft, settings.session, correct, wrong, totalTime, onFinish])

  useEffect(() => {
    if (finishedRef.current) return
    if (settings.session === "20p" && correct >= totalProblems) {
      finishedRef.current = true
      onFinish({ correct, wrong, elapsedSec: totalTime - timeLeft })
    }
  }, [correct, settings.session, totalProblems, wrong, totalTime, timeLeft, onFinish])

  const nextProblem = () => {
    setProblems(p => [...p, genProblem()])
    setIdx(i => i + 1)
    setState("drawing")
    setLastGuess(null)
    setCurrentGuess(null)
    setKeypadValue("")
    setCanvasKey(k => k + 1)
  }

  const gradeAnswer = (n: number) => {
    if (state !== "drawing") return
    setLastGuess(n)
    if (n === current.ans) {
      setState("correct")
      setCorrect(c => c + 1)
      setCombo(c => c + 1)
      setTimeout(nextProblem, 1000)
    } else {
      setState("wrong")
      setWrong(w => w + 1)
      setCombo(0)
      setShake(true)
      setTimeout(() => setShake(false), 500)
      setTimeout(() => { setState("drawing"); setKeypadValue(""); setCurrentGuess(null); setCanvasKey(k => k + 1) }, 1200)
    }
  }

  const handleSubmit = () => {
    if (state !== "drawing") return
    if (keypadValue.length > 0 && keypadValue !== "-") {
      const n = parseInt(keypadValue, 10)
      if (!Number.isNaN(n)) gradeAnswer(n)
    } else if (currentGuess !== null) {
      gradeAnswer(currentGuess)
    }
  }

  const handleKeypadTap = (digit: string) => {
    if (state !== "drawing") return
    if (digit === "DEL") {
      setKeypadValue(v => v.slice(0, -1))
    } else if (digit === "NEG") {
      setKeypadValue(v => v.startsWith("-") ? v.slice(1) : "-" + v)
    } else {
      if (keypadValue.replace("-", "").length >= 3) return
      setKeypadValue(v => v + digit)
    }
  }

  const progress = settings.session === "20p"
    ? correct / totalProblems
    : (totalTime - timeLeft) / totalTime

  const timerColor = timeLeft > 20 ? "#3ce67a" : timeLeft > 10 ? "#ffd93d" : "#ff2e63"

  const answerDisplay = keypadValue.length > 0 ? keypadValue : currentGuess !== null ? String(currentGuess) : ""
  const canSubmit = answerDisplay.length > 0 && answerDisplay !== "-"

  return (
    <div style={{
      width: "100%", height: "100%",
      background: "linear-gradient(180deg,#0a0a14 0%, #1a0a3e 100%)",
      position: "relative", padding: "12px 16px", boxSizing: "border-box",
      display: "flex", flexDirection: "column",
      animation: shake ? "sc-shake 0.4s" : "none", overflow: "hidden",
    }}>
      <StarFieldBg count={20} />

      {/* HUD bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, position: "relative", zIndex: 2, flexWrap: "wrap" }}>
        <button onClick={onExit} style={{
          background: "#1a1a2e", border: "3px solid #8a8aad",
          fontFamily: "'Press Start 2P', monospace", fontSize: 8,
          color: "#fff", padding: "6px 10px", cursor: "pointer", letterSpacing: 1,
        }}>×</button>

        <div style={{
          flex: 1, minWidth: 120, background: "#1a1a2e", border: `3px solid ${timerColor}`,
          padding: "4px 8px", display: "flex", alignItems: "center", gap: 8,
          boxShadow: `0 0 12px ${timerColor}40`,
        }}>
          <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 12, color: timerColor, width: 48, textAlign: "center" }}>
            {settings.session === "20p" ? `${correct}/${totalProblems}` : `${timeLeft}s`}
          </div>
          <div style={{ flex: 1, height: 10, background: "#0a0a14", border: "2px solid #2d2d5c", position: "relative" }}>
            <div style={{
              position: "absolute", left: 0, top: 0, bottom: 0,
              width: `${Math.min(100, progress * 100)}%`,
              background: timerColor, transition: "width 0.9s linear",
            }} />
          </div>
        </div>

        <div style={{ background: "#1a1a2e", border: "3px solid #3ce67a", padding: "4px 10px", display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: "#3ce67a" }}>✓</span>
          <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 14, color: "#fff" }}>{correct}</span>
        </div>

        {combo >= 2 && (
          <div style={{
            background: "#ff7a1f", border: "3px solid #0a0a14", padding: "4px 8px",
            animation: "sc-pulse 0.6s infinite",
          }}>
            <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 10, color: "#fff" }}>x{combo}</span>
          </div>
        )}
      </div>

      {/* Equation card */}
      <div style={{
        background: "#1a1a2e", border: "4px solid #ffd93d",
        padding: "16px 16px", textAlign: "center", position: "relative", zIndex: 2,
        boxShadow: "0 0 30px rgba(255,217,61,0.2)",
        marginBottom: 8,
        display: "flex", alignItems: "center", justifyContent: "center",
        minHeight: "clamp(56px, 12vw, 80px)",
      }}>
        <div style={{
          fontFamily: "'Press Start 2P', monospace",
          fontSize: "clamp(22px, 7vw, 44px)", color: "#fff",
          letterSpacing: 4, display: "flex", alignItems: "center", justifyContent: "center",
          gap: "clamp(6px, 2.5vw, 14px)", lineHeight: 1,
        }}>
          <span style={{ color: "#ffd93d", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{current.a}</span>
          <span style={{ color: "#4cf1ff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "1em" }}>{current.op1}</span>
          <span style={{ color: "#ffd93d", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{current.b}</span>
          <span style={{ color: "#4cf1ff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "1em" }}>{current.op2}</span>
          <span style={{ color: "#ffd93d", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{current.c}</span>
          <span style={{ color: "#ff9ec7", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "1em" }}>=</span>
          <span style={{
            color: answerDisplay.length > 0 ? "#3ce67a" : "#3ce67a60",
            minWidth: "clamp(30px, 8vw, 60px)", textAlign: "center",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
          }}>
            {answerDisplay.length > 0 ? answerDisplay : "?"}
          </span>
        </div>
      </div>

      {/* Input area */}
      <div style={{
        flex: 1, position: "relative", zIndex: 2, display: "flex", flexDirection: "column", minHeight: 0, gap: 6,
      }}>
        {/* Drawing canvas (collapsible) */}
        {showCanvas && (
          <div style={{
            height: 160, background: "#0a0a14", border: "3px solid #4cf1ff",
            position: "relative", overflow: "hidden", flexShrink: 0,
          }}>
            <div style={{
              position: "absolute", inset: 0, pointerEvents: "none",
              backgroundImage: "linear-gradient(#1a2a4e 1px, transparent 1px), linear-gradient(90deg, #1a2a4e 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }} />
            <DrawCanvas key={canvasKey} width={760} height={160}
              onGuessChange={(g) => { setCurrentGuess(g); if (g !== null) setKeypadValue("") }}
              strokeColor={settings.penColor}
              disabled={state !== "drawing"} />
          </div>
        )}

        {/* Draw toggle */}
        <button onClick={() => setShowCanvas(c => !c)} style={{
          fontFamily: "'Press Start 2P', monospace", fontSize: 7,
          background: showCanvas ? "#4cf1ff15" : "transparent",
          border: `2px solid ${showCanvas ? "#4cf1ff" : "#2d2d5c"}`,
          color: showCanvas ? "#4cf1ff" : "#8a8aad",
          padding: "4px 10px", cursor: "pointer", letterSpacing: 1,
          alignSelf: "center", flexShrink: 0,
        }}>{showCanvas ? "▼ HIDE DRAWING PAD" : "✎ SHOW DRAWING PAD"}</button>

        {/* Number keypad - always visible */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 5, flex: 1, minHeight: 0 }}>
          {["7", "8", "9", "DEL", "4", "5", "6", "NEG", "1", "2", "3", "0"].map(k => (
            <button key={k} onClick={() => { handleKeypadTap(k); setCurrentGuess(null) }} disabled={state !== "drawing"}
              style={{
                background: k === "DEL" ? "#ff2e6320" : k === "NEG" ? "#b83dff20" : "#1a1a2e",
                border: `3px solid ${k === "DEL" ? "#ff2e63" : k === "NEG" ? "#b83dff" : "#2d2d5c"}`,
                fontFamily: "'Press Start 2P', monospace",
                fontSize: k === "DEL" || k === "NEG" ? 12 : 22,
                color: k === "DEL" ? "#ff2e63" : k === "NEG" ? "#b83dff" : "#fff",
                cursor: state === "drawing" ? "pointer" : "default",
                display: "flex", alignItems: "center", justifyContent: "center",
                minHeight: 44,
              }}>
              {k === "DEL" ? "←" : k === "NEG" ? "±" : k}
            </button>
          ))}
        </div>

        {/* Feedback overlays */}
        {state === "correct" && (
          <div style={{
            position: "absolute", inset: 0, background: "rgba(60,230,122,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center",
            pointerEvents: "none", borderRadius: 4,
          }}>
            <div style={{
              background: "#3ce67a", border: "4px solid #0a0a14",
              padding: "10px 24px", boxShadow: "0 0 30px #3ce67a",
            }}>
              <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "clamp(16px, 4vw, 28px)", color: "#0a0a14", letterSpacing: 3 }}>
                ✓ DIRECT HIT!
              </div>
            </div>
          </div>
        )}
        {state === "wrong" && (
          <div style={{
            position: "absolute", inset: 0, background: "rgba(255,46,99,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 6,
            pointerEvents: "none", borderRadius: 4,
          }}>
            <div style={{
              background: "#ff2e63", border: "4px solid #0a0a14",
              padding: "10px 20px", boxShadow: "0 0 20px #ff2e63",
            }}>
              <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "clamp(14px, 3.5vw, 22px)", color: "#fff", letterSpacing: 2 }}>
                ✗ MISSED!
              </div>
            </div>
            <div style={{ fontFamily: "'VT323', monospace", fontSize: 20, color: "#ffd93d", letterSpacing: 2 }}>
              {lastGuess !== null && `YOU TYPED ${lastGuess} · `}ANSWER: {current.ans}
            </div>
          </div>
        )}

        {/* SUBMIT button */}
        {state === "drawing" && (
          <button onClick={handleSubmit} disabled={!canSubmit}
            style={{
              width: "100%", padding: "12px 0", flexShrink: 0,
              background: canSubmit ? "#3ce67a" : "#2d2d5c",
              border: `4px solid ${canSubmit ? "#3ce67a" : "#2d2d5c"}`,
              fontFamily: "'Press Start 2P', monospace", fontSize: 14,
              color: canSubmit ? "#0a0a14" : "#8a8aad",
              cursor: canSubmit ? "pointer" : "default",
              boxShadow: canSubmit ? "0 0 20px #3ce67a40, inset 0 -4px 0 #2aa055" : "none",
              letterSpacing: 2,
            }}>
            {canSubmit ? `SUBMIT: ${answerDisplay}` : "ENTER ANSWER"}
          </button>
        )}
      </div>
    </div>
  )
}
