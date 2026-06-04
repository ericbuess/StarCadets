const STORAGE_KEY = "sc_progression"

export interface ProgressionState {
  xp: number
  level: number
  totalCorrect: number
  totalAnswered: number
  stickersOwned: string[]
  vehiclesUnlocked: string[]
  lastRewardXP: number
}

const XP_PER_LEVEL = 100

export function xpForLevel(level: number): number {
  return level * XP_PER_LEVEL
}

export function levelFromXP(xp: number): number {
  let level = 0
  let needed = 0
  while (needed + xpForLevel(level + 1) <= xp) {
    level++
    needed += xpForLevel(level)
  }
  return level
}

export function xpIntoCurrentLevel(xp: number): { current: number; needed: number } {
  let consumed = 0
  let level = 0
  while (consumed + xpForLevel(level + 1) <= xp) {
    level++
    consumed += xpForLevel(level)
  }
  return { current: xp - consumed, needed: xpForLevel(level + 1) }
}

export const XP_REWARDS = {
  educationCorrect: 15,
  educationWrong: 2,
  drillCorrect: 5,
  gameComplete: 25,
  streakBonus: 10,
} as const

export interface LevelUpResult {
  leveled: boolean
  oldLevel: number
  newLevel: number
  xpGained: number
  unlockedVehicle: string | null
  unlockedSticker: string | null
}

const VEHICLE_UNLOCK_LEVELS: Record<string, number> = {
  "standard": 0,
  "sport": 3,
  "muscle": 5,
  "truck": 8,
  "rocket": 12,
}

export function getVehicleUnlockLevel(vehicleId: string): number {
  return VEHICLE_UNLOCK_LEVELS[vehicleId] ?? 0
}

export function isVehicleUnlocked(vehicleId: string, level: number): boolean {
  return level >= getVehicleUnlockLevel(vehicleId)
}

export function loadProgression(): ProgressionState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      return { ...defaultProgression(), ...parsed }
    }
  } catch { /* ignore */ }
  return defaultProgression()
}

function defaultProgression(): ProgressionState {
  return {
    xp: 0,
    level: 0,
    totalCorrect: 0,
    totalAnswered: 0,
    stickersOwned: [],
    vehiclesUnlocked: ["standard"],
    lastRewardXP: 0,
  }
}

export function saveProgression(state: ProgressionState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function addXP(amount: number): LevelUpResult {
  const state = loadProgression()
  const oldLevel = state.level
  state.xp += amount
  state.level = levelFromXP(state.xp)

  let unlockedVehicle: string | null = null
  for (const [vid, reqLevel] of Object.entries(VEHICLE_UNLOCK_LEVELS)) {
    if (state.level >= reqLevel && !state.vehiclesUnlocked.includes(vid)) {
      state.vehiclesUnlocked.push(vid)
      unlockedVehicle = vid
    }
  }

  saveProgression(state)
  return {
    leveled: state.level > oldLevel,
    oldLevel,
    newLevel: state.level,
    xpGained: amount,
    unlockedVehicle,
    unlockedSticker: null,
  }
}

export function recordEducationAnswer(correct: boolean): LevelUpResult {
  const state = loadProgression()
  state.totalAnswered++
  if (correct) state.totalCorrect++
  saveProgression(state)
  return addXP(correct ? XP_REWARDS.educationCorrect : XP_REWARDS.educationWrong)
}
