export type DrillScreen = 'home' | 'settings' | 'stats' | 'collection' | 'drill' | 'results' | 'unbox'
export type SessionMode = '60s' | '20p' | '30s'

export interface DrillSettings {
  session: SessionMode
  penColor: string
  sound: boolean
  haptics: boolean
}

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary'

export interface Sticker {
  id: string
  name: string
  rarity: Rarity
  bg: string
  pixels: string[]
}

export interface Problem {
  a: number
  b: number
  c: number
  op1: '+' | '−'
  op2: '+' | '−'
  ans: number
}

export interface DrillResult {
  correct: number
  wrong: number
  elapsedSec: number
}

export interface RecentRun {
  when: string
  mode: SessionMode
  correct: number
  total: number
  stars: number
  at: number
}

export interface DrillStats {
  totalStars: number
  drillsCompleted: number
  totalCorrect: number
  totalAttempts: number
  bestPerMin: number
  streak: number
  lastDrillISO: string | null
  lastWeek: number[]
  recentRuns: RecentRun[]
}
