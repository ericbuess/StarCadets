/**
 * Shadow mode — record the current run's score-over-time, then replay a
 * previous run (last or best) as a "ghost" the player can race against.
 *
 * Design:
 * - Only one run is active at a time, so a module-level singleton session
 *   is fine (avoids per-game prop plumbing).
 * - Each game calls `startSession(gameId)` on mount, `tick(time, score)`
 *   each frame, and `finalize(finalScore)` on game over.
 * - The ShadowHUD component polls `getCurrentGhostScore()` / `getCurrentScore()`
 *   at ~4Hz to display a non-distracting comparison overlay.
 */

export type ShadowMode = "off" | "last" | "best"

interface ScoreSample {
  t: number       // seconds since start of run
  s: number       // score at time t
}

interface SavedReplay {
  gameId: string
  samples: ScoreSample[]
  finalScore: number
  timestamp: number
}

// ─── Persistence ───

const MODE_KEY = "edu_shadowMode"
const REPLAY_KEY = (gameId: string, mode: "last" | "best") => `edu_replay_${gameId}_${mode}`
const SAMPLE_INTERVAL = 0.1 // record a sample at most every 100ms of game time

export function getShadowMode(): ShadowMode {
  try {
    const m = localStorage.getItem(MODE_KEY)
    if (m === "last" || m === "best" || m === "off") return m
  } catch { /* ignore */ }
  return "off"
}

export function setShadowMode(mode: ShadowMode) {
  try { localStorage.setItem(MODE_KEY, mode) } catch { /* ignore */ }
}

function loadReplay(gameId: string, mode: "last" | "best"): SavedReplay | null {
  try {
    const raw = localStorage.getItem(REPLAY_KEY(gameId, mode))
    if (!raw) return null
    const parsed = JSON.parse(raw) as SavedReplay
    if (!parsed.samples || parsed.samples.length === 0) return null
    return parsed
  } catch { return null }
}

function saveReplay(replay: SavedReplay, slot: "last" | "best") {
  try {
    localStorage.setItem(REPLAY_KEY(replay.gameId, slot), JSON.stringify(replay))
  } catch { /* storage full — ignore */ }
}

export function hasReplay(gameId: string, mode: "last" | "best"): boolean {
  return loadReplay(gameId, mode) !== null
}

export function getBestReplayScore(gameId: string): number | null {
  return loadReplay(gameId, "best")?.finalScore ?? null
}

// ─── Session ───

interface Session {
  gameId: string
  samples: ScoreSample[]
  lastSampleT: number
  activeReplay: SavedReplay | null
  activeMode: ShadowMode
  currentScore: number
  currentTime: number
}

let session: Session | null = null

export function startSession(gameId: string): void {
  const mode = getShadowMode()
  const activeReplay =
    mode === "last" ? loadReplay(gameId, "last")
    : mode === "best" ? loadReplay(gameId, "best")
    : null
  session = {
    gameId,
    samples: [{ t: 0, s: 0 }],
    lastSampleT: 0,
    activeReplay,
    activeMode: mode,
    currentScore: 0,
    currentTime: 0,
  }
}

export function endSession(): void {
  session = null
}

export function tick(time: number, score: number): void {
  if (!session) return
  session.currentTime = time
  session.currentScore = score
  if (time - session.lastSampleT >= SAMPLE_INTERVAL) {
    session.samples.push({ t: time, s: score })
    session.lastSampleT = time
  }
}

export function finalize(finalScore: number): void {
  if (!session) return
  // Push final sample
  session.samples.push({ t: session.currentTime, s: finalScore })
  const replay: SavedReplay = {
    gameId: session.gameId,
    samples: session.samples,
    finalScore,
    timestamp: Date.now(),
  }
  // Always save as "last"
  saveReplay(replay, "last")
  // Save as "best" if it beats the existing best
  const existingBest = loadReplay(session.gameId, "best")
  if (!existingBest || finalScore > existingBest.finalScore) {
    saveReplay(replay, "best")
  }
}

// ─── Ghost lookup ───

/**
 * Linear interpolation of the ghost's score at time `t`. Returns 0 if the
 * ghost hadn't started scoring yet, or the final score if `t` is past the
 * ghost's run length.
 */
function ghostScoreAt(replay: SavedReplay, t: number): number {
  const samples = replay.samples
  if (samples.length === 0) return 0
  if (t <= samples[0].t) return samples[0].s
  if (t >= samples[samples.length - 1].t) return samples[samples.length - 1].s
  // Binary search would be faster, but linear is fine for ~hundreds of samples
  for (let i = 1; i < samples.length; i++) {
    if (samples[i].t >= t) {
      const a = samples[i - 1], b = samples[i]
      const span = b.t - a.t
      if (span <= 0) return b.s
      const frac = (t - a.t) / span
      return a.s + (b.s - a.s) * frac
    }
  }
  return samples[samples.length - 1].s
}

export interface ShadowSnapshot {
  active: boolean         // shadow mode is on AND a replay is loaded
  mode: ShadowMode
  currentScore: number
  ghostScore: number
  ghostFinalScore: number
  delta: number           // current - ghost (positive = ahead)
  ghostFinished: boolean  // true when current time is past the ghost's run
}

export function getShadowSnapshot(): ShadowSnapshot {
  if (!session) {
    return { active: false, mode: "off", currentScore: 0, ghostScore: 0, ghostFinalScore: 0, delta: 0, ghostFinished: false }
  }
  const replay = session.activeReplay
  if (!replay) {
    return { active: false, mode: session.activeMode, currentScore: session.currentScore, ghostScore: 0, ghostFinalScore: 0, delta: 0, ghostFinished: false }
  }
  const ghost = ghostScoreAt(replay, session.currentTime)
  const lastT = replay.samples[replay.samples.length - 1].t
  return {
    active: true,
    mode: session.activeMode,
    currentScore: session.currentScore,
    ghostScore: ghost,
    ghostFinalScore: replay.finalScore,
    delta: session.currentScore - ghost,
    ghostFinished: session.currentTime >= lastT,
  }
}
