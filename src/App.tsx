import { useState, useEffect, useCallback } from "react"
import { Toaster, toast } from "sonner"
import { GameCanvas } from "@/components/GameCanvas"
import { NeonRunner } from "@/components/NeonRunner"
import { AsteroidsGame } from "@/components/AsteroidsGame"
import { BrickBreakerGame } from "@/components/BrickBreakerGame"
import { FroggerGame } from "@/components/FroggerGame"
import { PacmanGame } from "@/components/PacmanGame"
import { TetrisGame } from "@/components/TetrisGame"
import { GorillasGame } from "@/components/GorillasGame"
import { SnakeGame } from "@/components/SnakeGame"
import { SnakeArenaGame } from "@/components/SnakeArenaGame"
import { SubwaySurferGame } from "@/components/SubwaySurferGame"
import { PolePositionGame } from "@/components/PolePositionGame"
import { DrillGame } from "@/components/drill/DrillGame"
import { SettingsPanel } from "@/components/SettingsPanel"
import { QAPanel } from "@/components/QAPanel"
import { XPDisplay } from "@/components/XPDisplay"
import type { UserSettings } from "@/components/SettingsPanel"
import type { GhostFrame, VehicleProfile } from "@/game/types"
import { VEHICLES } from "@/game/types"
import { loadProgression, isVehicleUnlocked, getVehicleUnlockLevel } from "@/game/progression"
import { STICKERS, RARITY_COLOR, PALETTE } from "@/game/drillStickers"

type Screen = "hub" | "eduracer" | "neonrunner" | "asteroids" | "brickbreaker" | "frogger" | "pacman" | "tetris" | "mathdrill" | "gorillas" | "snake" | "snakearena" | "subwaysurfer" | "poleposition" | "settings" | "vehicles" | "stickers" | "qa"

interface GameScore {
  gameId: string
  score: number
  distance: number
  timestamp: number
}

const DEFAULT_SETTINGS: UserSettings = {
  displayName: "",
  age: "",
  grade: "",
  location: "",
  school: "",
  subjects: [],
  soundEnabled: true
}

function loadSettings(): UserSettings {
  try {
    const saved = localStorage.getItem("eduRacer_settings")
    if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) }
  } catch { /* ignore */ }
  return DEFAULT_SETTINGS
}

function saveSettings(s: UserSettings) {
  localStorage.setItem("eduRacer_settings", JSON.stringify(s))
}

function loadScores(): GameScore[] {
  try {
    const saved = localStorage.getItem("edu_gameScores")
    if (saved) return JSON.parse(saved)
  } catch { /* ignore */ }
  return []
}

function saveScore(gameId: string, score: number, distance: number) {
  const scores = loadScores()
  scores.push({ gameId, score, distance, timestamp: Date.now() })
  // Keep last 50
  if (scores.length > 50) scores.splice(0, scores.length - 50)
  localStorage.setItem("edu_gameScores", JSON.stringify(scores))
}

function getBestScore(gameId: string): GameScore | null {
  const scores = loadScores().filter(s => s.gameId === gameId)
  if (scores.length === 0) return null
  return scores.reduce((best, s) => s.score > best.score ? s : best)
}

function getRecentScores(gameId: string, limit = 3): GameScore[] {
  return loadScores().filter(s => s.gameId === gameId).slice(-limit).reverse()
}

function loadBestGhost(): GhostFrame[] {
  try {
    const saved = localStorage.getItem("eduRacer_bestGhost")
    if (saved) return JSON.parse(saved)
  } catch { /* ignore */ }
  return []
}

function saveBestGhost(frames: GhostFrame[], score: number) {
  const best = getBestScore("eduracer")
  if (!best || score > best.score) {
    localStorage.setItem("eduRacer_bestGhost", JSON.stringify(frames))
  }
}

function loadEducationProgress(): { answered: number; correct: number } {
  try {
    const saved = localStorage.getItem("edu_educationProgress")
    if (saved) return JSON.parse(saved)
  } catch { /* ignore */ }
  return { answered: 0, correct: 0 }
}

function App() {
  const [screen, setScreen] = useState<Screen>("hub")
  const [settings, setSettings] = useState<UserSettings>(loadSettings)
  const [bestGhost] = useState<GhostFrame[]>(loadBestGhost)
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleProfile>(VEHICLES[0])
  const [testMode, setTestMode] = useState(false)

  useEffect(() => {
    document.body.style.overflow = "hidden"
    document.body.style.position = "fixed"
    document.body.style.width = "100%"
    document.body.style.height = "100%"
    return () => {
      document.body.style.overflow = ""
      document.body.style.position = ""
      document.body.style.width = ""
      document.body.style.height = ""
    }
  }, [])

  const handleSettingsSave = (newSettings: UserSettings) => {
    setSettings(newSettings)
    saveSettings(newSettings)
    setScreen("hub")
    toast.success("Settings saved!")
  }

  const handleEduRacerGameOver = useCallback((score: number, distance: number, ghostFrames: GhostFrame[]) => {
    saveScore("eduracer", score, distance)
    saveBestGhost(ghostFrames, score)
    setScreen("hub")
  }, [])

  const handleRunnerGameOver = useCallback((score: number, distance: number) => {
    saveScore("neonrunner", score, distance)
    setScreen("hub")
  }, [])

  const makeGameOverHandler = useCallback((gameId: string) => (score: number, secondary: number) => {
    saveScore(gameId, score, secondary)
    setScreen("hub")
  }, [])

  return (
    <>
      <Toaster position="top-center" theme="dark" />

      {screen === "eduracer" ? (
        <div className="fixed inset-0 bg-gray-950">
          <GameCanvas
            subjects={settings.subjects}
            grade={settings.grade}
            vehicle={selectedVehicle}
            onGameOver={handleEduRacerGameOver}
            bestGhost={bestGhost}
            raceId={"free-" + Date.now()}
            musicEnabled={settings.soundEnabled}
            testMode={testMode}
            onToggleTestMode={() => setTestMode(t => !t)}
            onBackToHub={() => setScreen("hub")}
          />
        </div>
      ) : screen === "neonrunner" ? (
        <div className="fixed inset-0 bg-gray-950">
          <NeonRunner
            subjects={settings.subjects}
            grade={settings.grade}
            testMode={testMode}
            onToggleTestMode={() => setTestMode(t => !t)}
            onGameOver={handleRunnerGameOver}
            onBackToHub={() => setScreen("hub")}
          />
        </div>
      ) : screen === "asteroids" ? (
        <div className="fixed inset-0 bg-gray-950">
          <AsteroidsGame
            subjects={settings.subjects} grade={settings.grade} testMode={testMode}
            onToggleTestMode={() => setTestMode(t => !t)}
            onGameOver={makeGameOverHandler("asteroids")} onBackToHub={() => setScreen("hub")}
          />
        </div>
      ) : screen === "brickbreaker" ? (
        <div className="fixed inset-0 bg-gray-950">
          <BrickBreakerGame
            subjects={settings.subjects} grade={settings.grade} testMode={testMode}
            onToggleTestMode={() => setTestMode(t => !t)}
            onGameOver={makeGameOverHandler("brickbreaker")} onBackToHub={() => setScreen("hub")}
          />
        </div>
      ) : screen === "frogger" ? (
        <div className="fixed inset-0 bg-gray-950">
          <FroggerGame
            subjects={settings.subjects} grade={settings.grade} testMode={testMode}
            onToggleTestMode={() => setTestMode(t => !t)}
            onGameOver={makeGameOverHandler("frogger")} onBackToHub={() => setScreen("hub")}
          />
        </div>
      ) : screen === "pacman" ? (
        <div className="fixed inset-0 bg-gray-950">
          <PacmanGame
            subjects={settings.subjects} grade={settings.grade} testMode={testMode}
            onToggleTestMode={() => setTestMode(t => !t)}
            onGameOver={makeGameOverHandler("pacman")} onBackToHub={() => setScreen("hub")}
          />
        </div>
      ) : screen === "tetris" ? (
        <div className="fixed inset-0 bg-gray-950">
          <TetrisGame
            subjects={settings.subjects} grade={settings.grade} testMode={testMode}
            onToggleTestMode={() => setTestMode(t => !t)}
            onGameOver={makeGameOverHandler("tetris")} onBackToHub={() => setScreen("hub")}
          />
        </div>
      ) : screen === "gorillas" ? (
        <div className="fixed inset-0 bg-gray-950">
          <GorillasGame
            subjects={settings.subjects} grade={settings.grade} testMode={testMode}
            onToggleTestMode={() => setTestMode(t => !t)}
            onGameOver={makeGameOverHandler("gorillas")} onBackToHub={() => setScreen("hub")}
          />
        </div>
      ) : screen === "snake" ? (
        <div className="fixed inset-0 bg-gray-950">
          <SnakeGame
            subjects={settings.subjects} grade={settings.grade} testMode={testMode}
            onToggleTestMode={() => setTestMode(t => !t)}
            onGameOver={makeGameOverHandler("snake")} onBackToHub={() => setScreen("hub")}
          />
        </div>
      ) : screen === "snakearena" ? (
        <div className="fixed inset-0 bg-gray-950">
          <SnakeArenaGame
            subjects={settings.subjects} grade={settings.grade} testMode={testMode}
            onToggleTestMode={() => setTestMode(t => !t)}
            onGameOver={makeGameOverHandler("snakearena")} onBackToHub={() => setScreen("hub")}
          />
        </div>
      ) : screen === "subwaysurfer" ? (
        <div className="fixed inset-0 bg-gray-950">
          <SubwaySurferGame
            subjects={settings.subjects} grade={settings.grade} testMode={testMode}
            onToggleTestMode={() => setTestMode(t => !t)}
            onGameOver={makeGameOverHandler("subwaysurfer")} onBackToHub={() => setScreen("hub")}
          />
        </div>
      ) : screen === "poleposition" ? (
        <div className="fixed inset-0 bg-gray-950">
          <PolePositionGame
            subjects={settings.subjects} grade={settings.grade} testMode={testMode}
            onToggleTestMode={() => setTestMode(t => !t)}
            onGameOver={makeGameOverHandler("poleposition")} onBackToHub={() => setScreen("hub")}
          />
        </div>
      ) : screen === "mathdrill" ? (
        <div className="fixed inset-0" style={{ background: "#0a0a14" }}>
          <DrillGame onBackToHub={() => setScreen("hub")} />
        </div>
      ) : (
        <div className="fixed inset-0 text-white overflow-y-auto select-none"
          style={{
            touchAction: "pan-y",
            background: "radial-gradient(ellipse at 20% 20%, rgba(184,61,255,0.15), transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(76,241,255,0.12), transparent 50%), linear-gradient(180deg,#06060c 0%, #0d0820 100%)",
            backgroundAttachment: "fixed",
          }}>

          {/* Starfield background */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {Array.from({ length: 50 }).map((_, i) => (
              <div key={i} className="absolute" style={{
                width: 2, height: 2, background: "#fff",
                left: `${(i * 37) % 100}%`, top: `${(i * 53 + i * 7) % 100}%`,
                opacity: 0.15 + (i % 5) * 0.1,
                animation: `sc-twinkle ${2 + (i % 4)}s ease-in-out infinite ${(i * 0.3) % 4}s`
              }} />
            ))}
          </div>

          {screen === "hub" && <GameHub
            settings={settings}
            testMode={testMode}
            selectedVehicle={selectedVehicle}
            onPlay={(gameId) => setScreen(gameId as Screen)}
            onSettings={() => setScreen("settings")}
            onVehicles={() => setScreen("vehicles")}
            onStickers={() => setScreen("stickers")}
            onToggleTestMode={() => setTestMode(t => !t)}
            onQA={() => setScreen("qa")}
          />}

          {screen === "settings" && (
            <SettingsPanel settings={settings} onSave={handleSettingsSave} onClose={() => setScreen("hub")} />
          )}

          {screen === "qa" && (
            <QAPanel onClose={() => setScreen("hub")} />
          )}

          {screen === "vehicles" && (
            <VehiclePicker
              selected={selectedVehicle}
              onSelect={(v) => { setSelectedVehicle(v); toast.success(`Selected ${v.name}`) }}
              onClose={() => setScreen("hub")}
            />
          )}
          {screen === "stickers" && (
            <StickerCollection onClose={() => setScreen("hub")} />
          )}
        </div>
      )}
    </>
  )
}

// ─── Game Hub ───

interface GameHubProps {
  settings: UserSettings
  testMode: boolean
  selectedVehicle: VehicleProfile
  onPlay: (gameId: string) => void
  onSettings: () => void
  onVehicles: () => void
  onStickers: () => void
  onToggleTestMode: () => void
  onQA: () => void
}

interface GameDef {
  id: string
  name: string
  description: string
  status: "playable" | "in_development" | "coming_soon"
  color: string
  icon: string
  controls: string
}

const GAMES: GameDef[] = [
  {
    id: "neonrunner",
    name: "Neon Runner",
    description: "Tap to jump! Dodge obstacles in this infinite runner.",
    status: "playable",
    color: "#00f0ff",
    icon: "R",
    controls: "Tap / Space to jump"
  },
  {
    id: "asteroids",
    name: "Asteroids",
    description: "Blast asteroids in classic space combat.",
    status: "playable",
    color: "#88ff00",
    icon: "A",
    controls: "Arrows = move, Space = shoot"
  },
  {
    id: "brickbreaker",
    name: "Brick Breaker",
    description: "Smash bricks with a bouncing ball.",
    status: "playable",
    color: "#ff4488",
    icon: "B",
    controls: "Move mouse/touch = paddle"
  },
  {
    id: "frogger",
    name: "Frogger",
    description: "Cross roads and rivers to reach home.",
    status: "playable",
    color: "#00ff88",
    icon: "F",
    controls: "Arrows / Swipe to move"
  },
  {
    id: "pacman",
    name: "Pac-Man",
    description: "Eat dots, avoid ghosts, grab power pellets.",
    status: "playable",
    color: "#ffff00",
    icon: "P",
    controls: "Arrows / Swipe to move"
  },
  {
    id: "tetris",
    name: "Tetris",
    description: "Stack and clear lines with falling blocks.",
    status: "playable",
    color: "#aa44ff",
    icon: "T",
    controls: "Arrows = move, Up = rotate"
  },
  {
    id: "mathdrill",
    name: "Math Drill",
    description: "3-number speed drill — draw answers with Apple Pencil!",
    status: "playable",
    color: "#ffd93d",
    icon: "✎",
    controls: "Draw with pencil / mouse"
  },
  {
    id: "gorillas",
    name: "Gorillas",
    description: "Throw exploding bananas to destroy buildings and hit the enemy!",
    status: "playable",
    color: "#ffa500",
    icon: "G",
    controls: "Angle + Power = aim, Fire = throw"
  },
  {
    id: "snake",
    name: "Snake",
    description: "Classic snake — eat food, grow long, don't crash!",
    status: "playable",
    color: "#00ff44",
    icon: "S",
    controls: "Arrows / Swipe to move"
  },
  {
    id: "snakearena",
    name: "Snake Arena",
    description: "Snake.io style — grow bigger than AI snakes in the arena!",
    status: "playable",
    color: "#44ffaa",
    icon: "🐍",
    controls: "Drag / Arrows to steer"
  },
  {
    id: "subwaysurfer",
    name: "Neon Dash",
    description: "Dodge trains and barriers in this endless lane runner!",
    status: "playable",
    color: "#4cf1ff",
    icon: "D",
    controls: "Swipe / Arrows = move, Up = jump"
  },
  {
    id: "poleposition",
    name: "Hyper Circuit",
    description: "Pseudo-3D racing — dodge traffic and beat the clock!",
    status: "playable",
    color: "#ff2e63",
    icon: "H",
    controls: "Arrows = steer/accel/brake"
  },
  {
    id: "eduracer",
    name: "EduRacer",
    description: "2D physics racer with flips, ramps, loops and weapons.",
    status: "playable",
    color: "#ff8800",
    icon: "E",
    controls: "Right = go/flip, Left = brake"
  },
  {
    id: "wordblast",
    name: "Word Blast",
    description: "Spell words fast to blast through space.",
    status: "coming_soon",
    color: "#ff00ff",
    icon: "W",
    controls: "Type to spell"
  }
]

function GameHub({ settings, testMode, onPlay, onSettings, onVehicles, onStickers, onToggleTestMode, onQA }: GameHubProps) {
  const eduProgress = loadEducationProgress()
  const accuracy = eduProgress.answered > 0
    ? Math.round((eduProgress.correct / eduProgress.answered) * 100) : 0

  return (
    <div className="relative z-10 max-w-lg mx-auto px-4 py-6" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Cadet Badge + Star counter */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{
          background: "#1a1a2e", border: "4px solid #4cf1ff", padding: "8px 14px",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <div style={{
            width: 32, height: 32, background: "#ffd93d", border: "3px solid #0a0a14",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "'Press Start 2P', monospace", fontSize: 14, color: "#0a0a14",
          }}>A</div>
          <div>
            <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: "#4cf1ff", letterSpacing: 1 }}>CADET</div>
            <div style={{ fontFamily: "'VT323', monospace", fontSize: 20, color: "#fff" }}>
              {settings.displayName || "RECRUIT"}
            </div>
          </div>
        </div>
        <div style={{
          background: "#1a1a2e", border: "4px solid #ffd93d", padding: "8px 14px",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <span style={{ fontSize: 18 }}>⭐</span>
          <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 14, color: "#ffd93d" }}>
            {eduProgress.correct}
          </span>
        </div>
      </div>

      {/* Title */}
      <div style={{ textAlign: "center" }}>
        <div style={{
          fontFamily: "'Press Start 2P', monospace", fontSize: "clamp(20px, 6vw, 36px)",
          color: "#ffd93d", textShadow: "4px 4px 0 #ff2e63, 8px 8px 0 #b83dff, 12px 12px 0 #0a0a14",
          letterSpacing: 2, animation: "sc-bounce 3s ease-in-out infinite",
        }}>STAR CADETS</div>
        <div style={{
          fontFamily: "'VT323', monospace", fontSize: 22, color: "#4cf1ff",
          letterSpacing: 3, marginTop: 4,
        }}>★ ACADEMY OF THE OUTER RIM ★</div>
      </div>

      {/* Education Progress */}
      <div style={{
        background: "#1a1a2e", border: "4px solid #2d2d5c", padding: 14,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: "#4cf1ff", letterSpacing: 1 }}>
            TRAINING LOG
          </span>
          <span style={{ fontFamily: "'VT323', monospace", fontSize: 18, color: "#8a8aad" }}>
            {eduProgress.answered} DRILLS
          </span>
        </div>
        <div style={{ height: 8, background: "#0a0a14", border: "2px solid #2d2d5c", overflow: "hidden" }}>
          <div style={{
            height: "100%", transition: "width 0.3s",
            width: `${accuracy}%`,
            background: accuracy > 70 ? "#3ce67a" : accuracy > 40 ? "#ffd93d" : "#ff2e63",
            boxShadow: `0 0 8px ${accuracy > 70 ? "#3ce67a" : accuracy > 40 ? "#ffd93d" : "#ff2e63"}40`,
          }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
          <span style={{ fontFamily: "'VT323', monospace", fontSize: 18, color: "#8a8aad" }}>
            {settings.subjects.length > 0 ? settings.subjects.join(", ") : "ALL SUBJECTS"}
          </span>
          <span style={{
            fontFamily: "'Press Start 2P', monospace", fontSize: 12,
            color: accuracy > 70 ? "#3ce67a" : accuracy > 40 ? "#ffd93d" : "#ff2e63",
          }}>{accuracy}%</span>
        </div>
      </div>

      {/* XP / Level */}
      <XPDisplay />

      {/* Game Cards */}
      <div>
        <div style={{
          fontFamily: "'Press Start 2P', monospace", fontSize: 9, color: "#8a8aad",
          letterSpacing: 2, marginBottom: 12,
        }}>SELECT MISSION</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {GAMES.map(game => (
            <GameCard key={game.id} game={game} onPlay={onPlay} />
          ))}
        </div>
      </div>

      {/* Bottom nav */}
      <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
        <button onClick={onVehicles} style={{
          flex: 1, background: "#1a1a2e", border: "4px solid #b83dff", padding: "10px 14px",
          cursor: "pointer", fontFamily: "'Press Start 2P', monospace", fontSize: 9,
          color: "#b83dff", letterSpacing: 1,
        }}>VEHICLES</button>
        <button onClick={onStickers} style={{
          flex: 1, background: "#1a1a2e", border: "4px solid #ffd93d", padding: "10px 14px",
          cursor: "pointer", fontFamily: "'Press Start 2P', monospace", fontSize: 9,
          color: "#ffd93d", letterSpacing: 1,
        }}>STICKERS</button>
        <button onClick={onSettings} style={{
          flex: 1, background: "#1a1a2e", border: "4px solid #4cf1ff", padding: "10px 14px",
          cursor: "pointer", fontFamily: "'Press Start 2P', monospace", fontSize: 9,
          color: "#4cf1ff", letterSpacing: 1,
        }}>SETTINGS</button>
      </div>

      {/* Test mode + QA */}
      <div style={{ display: "flex", justifyContent: "center", gap: 10 }}>
        <button onClick={onToggleTestMode} style={{
          background: testMode ? "rgba(255,46,99,0.15)" : "transparent",
          border: `3px solid ${testMode ? "#ff2e63" : "#2d2d5c"}`,
          padding: "6px 14px", cursor: "pointer",
          fontFamily: "'Press Start 2P', monospace", fontSize: 7,
          color: testMode ? "#ff2e63" : "#8a8aad", letterSpacing: 1,
        }}>{testMode ? "TEST ON" : "TEST"}</button>
        <button onClick={onQA} style={{
          background: "transparent", border: "3px solid #2d2d5c",
          padding: "6px 14px", cursor: "pointer",
          fontFamily: "'Press Start 2P', monospace", fontSize: 7,
          color: "#8a8aad", letterSpacing: 1,
        }}>QA</button>
      </div>

      <div style={{
        fontFamily: "'VT323', monospace", fontSize: 18, color: "#8a8aad60",
        textAlign: "center", letterSpacing: 2, paddingBottom: 20,
      }}>A LONG TIME AGO, IN A MATH CLASS FAR, FAR AWAY…</div>
    </div>
  )
}

function GameCard({ game, onPlay }: { game: GameDef; onPlay: (id: string) => void }) {
  const best = getBestScore(game.id)
  const recent = getRecentScores(game.id, 2)
  const isPlayable = game.status === "playable"
  const isDev = game.status === "in_development"
  const isLocked = isDev || game.status === "coming_soon"

  const statusLabel = isDev ? "⚙ IN DEV" : game.status === "coming_soon" ? "SOON" : null

  const handleClick = () => {
    if (isPlayable) {
      onPlay(game.id)
    } else if (isDev) {
      toast("This mission is still in development — check back soon!", { duration: 2500 })
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={game.status === "coming_soon"}
      style={{
        width: "100%", textAlign: "left",
        background: isLocked ? "#0d0d1a" : "#1a1a2e",
        border: `4px solid ${isLocked ? "#2d2d5c" : game.color + "60"}`,
        padding: 14, cursor: game.status === "coming_soon" ? "default" : "pointer",
        opacity: isLocked ? 0.45 : 1,
        boxShadow: isPlayable ? `0 0 12px ${game.color}15` : "none",
        display: "flex", alignItems: "center", gap: 14,
        filter: isLocked ? "saturate(0.3)" : "none",
      }}
    >
      {/* Icon */}
      <div style={{
        width: 48, height: 48, flexShrink: 0,
        background: `${game.color}20`, border: `3px solid ${game.color}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'Press Start 2P', monospace", fontSize: 18, color: game.color,
      }}>{game.icon}</div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{
            fontFamily: "'Press Start 2P', monospace", fontSize: 10,
            color: isLocked ? "#8a8aad" : "#fff", letterSpacing: 1,
          }}>{game.name.toUpperCase()}</span>
          {statusLabel && (
            <span style={{
              fontFamily: "'Press Start 2P', monospace", fontSize: 6,
              color: isDev ? "#ff7a1f" : "#8a8aad",
              background: isDev ? "#ff7a1f15" : "#ffffff10",
              border: `2px solid ${isDev ? "#ff7a1f40" : "#2d2d5c"}`,
              padding: "2px 6px",
            }}>{statusLabel}</span>
          )}
        </div>
        <div style={{ fontFamily: "'VT323', monospace", fontSize: 18, color: "#8a8aad", marginTop: 2 }}>
          {game.description}
        </div>

        {best && (
          <div style={{ display: "flex", gap: 16, marginTop: 4 }}>
            <div>
              <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 6, color: "#8a8aad" }}>BEST </span>
              <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 10, color: game.color }}>
                {Math.floor(best.score).toLocaleString()}
              </span>
            </div>
            {recent.length > 0 && (
              <div>
                <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 6, color: "#8a8aad" }}>RECENT </span>
                <span style={{ fontFamily: "'VT323', monospace", fontSize: 18, color: "#fff" }}>
                  {recent.map(s => Math.floor(s.score).toLocaleString()).join(", ")}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {isPlayable ? (
        <div style={{
          width: 36, height: 36, flexShrink: 0,
          background: `${game.color}20`, border: `3px solid ${game.color}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 16, color: game.color,
        }}>▶</div>
      ) : isDev ? (
        <div style={{
          width: 36, height: 36, flexShrink: 0,
          background: "#ff7a1f15", border: "3px solid #ff7a1f40",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 16, color: "#ff7a1f",
        }}>⚙</div>
      ) : null}
    </button>
  )
}

// ─── Vehicle Picker ───

function VehiclePicker({ selected, onSelect, onClose }: {
  selected: VehicleProfile
  onSelect: (v: VehicleProfile) => void
  onClose: () => void
}) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 50,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(10,10,20,0.95)", padding: 16, overflowY: "auto",
    }}>
      <div style={{
        maxWidth: 500, width: "100%", background: "#1a1a2e",
        border: "4px solid #b83dff", padding: 20,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <span style={{
            fontFamily: "'Press Start 2P', monospace", fontSize: 14,
            color: "#ffd93d", textShadow: "2px 2px 0 #ff2e63",
          }}>VEHICLE BAY</span>
          <button onClick={onClose} style={{
            background: "transparent", border: "3px solid #2d2d5c",
            padding: "4px 10px", cursor: "pointer",
            fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: "#8a8aad",
          }}>✕</button>
        </div>
        <div style={{ maxHeight: "60vh", overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
          {VEHICLES.map(v => {
            const isSelected = selected.id === v.id
            const prog = loadProgression()
            const unlocked = isVehicleUnlocked(v.id, prog.level)
            const reqLevel = getVehicleUnlockLevel(v.id)
            return (
              <button key={v.id} onClick={() => unlocked ? onSelect(v) : toast(`Reach Level ${reqLevel} to unlock!`, { duration: 2000 })}
                style={{
                  display: "flex", alignItems: "center", gap: 14, padding: 12,
                  background: isSelected ? `${v.color}15` : "transparent",
                  border: `3px solid ${isSelected ? v.color : "#2d2d5c"}`,
                  cursor: unlocked ? "pointer" : "default", textAlign: "left",
                  boxShadow: isSelected ? `0 0 16px ${v.color}30` : "none",
                  opacity: unlocked ? 1 : 0.4,
                  filter: unlocked ? "none" : "saturate(0.3)",
                }}>
                <div style={{
                  width: 48, height: 36, flexShrink: 0,
                  background: `${v.color}30`, border: `3px solid ${v.color}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {unlocked ? (
                    <div style={{ width: 28, height: 14, background: v.color }} />
                  ) : (
                    <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 10, color: "#8a8aad" }}>🔒</span>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 10, color: unlocked ? "#fff" : "#8a8aad" }}>{v.name.toUpperCase()}</span>
                    {!unlocked && (
                      <span style={{
                        fontFamily: "'Press Start 2P', monospace", fontSize: 6,
                        color: "#ff7a1f", background: "#ff7a1f15", border: "2px solid #ff7a1f40",
                        padding: "2px 6px",
                      }}>LVL {reqLevel}</span>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                    <StatBar label="SPD" value={v.speed} color="#3ce67a" />
                    <StatBar label="FLIP" value={v.flipRate} color="#4cf1ff" />
                    <StatBar label="HANG" value={2 - v.hangTime} color="#b83dff" />
                    <StatBar label="ARM" value={v.weight} color="#ff7a1f" />
                  </div>
                </div>
                {isSelected && unlocked && (
                  <span style={{
                    fontFamily: "'Press Start 2P', monospace", fontSize: 7,
                    background: v.color, color: "#0a0a14", padding: "4px 8px",
                  }}>ACTIVE</span>
                )}
              </button>
            )
          })}
        </div>
        <div style={{
          fontFamily: "'VT323', monospace", fontSize: 18, color: "#8a8aad",
          textAlign: "center", marginTop: 12,
        }}>VEHICLE APPLIES TO EDURACER</div>
      </div>
    </div>
  )
}

function StatBar({ label, value, color }: { label: string; value: number; color: string }) {
  const pct = Math.min(100, (value / 2) * 100)
  return (
    <div style={{ flex: 1 }}>
      <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 6, color: "#8a8aad" }}>{label}</div>
      <div style={{ height: 4, background: "#0a0a14", border: "1px solid #2d2d5c", overflow: "hidden", marginTop: 2 }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}

function MiniSticker({ pixels, size = 64 }: { pixels: string[]; size?: number }) {
  const rows = pixels.length
  const cols = Math.max(...pixels.map(r => r.length))
  const cs = size / Math.max(rows, cols)
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ imageRendering: "pixelated" }}>
      {pixels.map((row, y) =>
        row.split("").map((ch, x) => {
          if (ch === ".") return null
          return <rect key={`${y}-${x}`} x={x * cs} y={y * cs} width={cs + 0.5} height={cs + 0.5} fill={PALETTE[ch] || "#fff"} />
        })
      )}
    </svg>
  )
}

function StickerCollection({ onClose }: { onClose: () => void }) {
  const prog = loadProgression()
  const owned = prog.stickersOwned
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 50,
      background: "rgba(10,10,20,0.97)", padding: 16, overflowY: "auto",
    }}>
      <div style={{ maxWidth: 500, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <button onClick={onClose} style={{
            background: "#1a1a2e", border: "3px solid #8a8aad", padding: "6px 12px",
            cursor: "pointer", fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: "#fff",
          }}>← BACK</button>
          <div style={{ fontFamily: "'VT323', monospace", fontSize: 22, color: "#8a8aad" }}>
            {owned.length}/{STICKERS.length}
          </div>
        </div>

        <div style={{
          fontFamily: "'Press Start 2P', monospace", fontSize: "clamp(14px, 3vw, 22px)",
          color: "#ffd93d", textShadow: "4px 4px 0 #ff2e63, 8px 8px 0 #b83dff",
          letterSpacing: 2, textAlign: "center", marginBottom: 8,
        }}>HOLO-ARCHIVE</div>
        <div style={{
          fontFamily: "'VT323', monospace", fontSize: 20, color: "#4cf1ff",
          textAlign: "center", letterSpacing: 3, marginBottom: 24,
        }}>★ HEROES OF THE OUTER RIM ALLIANCE ★</div>

        <div style={{
          display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12,
        }}>
          {STICKERS.map(s => {
            const isOwned = owned.includes(s.id)
            const glow = RARITY_COLOR[s.rarity]
            return (
              <div key={s.id} style={{
                aspectRatio: "1/1", background: isOwned ? s.bg : "#1a1a2e",
                border: `4px solid ${isOwned ? glow : "#2d2d5c"}`,
                display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "center", padding: 8,
                boxShadow: isOwned ? `0 0 20px ${glow}40` : "none",
              }}>
                {isOwned ? (
                  <>
                    <MiniSticker pixels={s.pixels} size={80} />
                    <div style={{
                      fontFamily: "'Press Start 2P', monospace", fontSize: 7,
                      color: "#fff", marginTop: 6, textAlign: "center", letterSpacing: 1, lineHeight: 1.4,
                    }}>{s.name}</div>
                    <div style={{
                      fontFamily: "'VT323', monospace", fontSize: 14,
                      color: glow, letterSpacing: 2, textTransform: "uppercase",
                    }}>{s.rarity}</div>
                  </>
                ) : (
                  <div style={{
                    fontFamily: "'Press Start 2P', monospace", fontSize: 28, color: "#2d2d5c",
                  }}>???</div>
                )}
              </div>
            )
          })}
        </div>

        <div style={{
          fontFamily: "'VT323', monospace", fontSize: 18, color: "#8a8aad",
          textAlign: "center", marginTop: 20, marginBottom: 20,
        }}>ANSWER QUESTIONS IN ANY GAME TO EARN STICKERS</div>
      </div>
    </div>
  )
}

export default App
