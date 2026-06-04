import type { DrillSettings, DrillStats } from '@/types/drill'

const PREFIX = 'sc_'
const key = (k: string) => PREFIX + k

const DEFAULT_SETTINGS: DrillSettings = {
  session: '60s',
  penColor: '#4cf1ff',
  sound: true,
  haptics: true,
}

const DEFAULT_STATS: DrillStats = {
  totalStars: 0,
  drillsCompleted: 0,
  totalCorrect: 0,
  totalAttempts: 0,
  bestPerMin: 0,
  streak: 0,
  lastDrillISO: null,
  lastWeek: [0, 0, 0, 0, 0, 0, 0],
  recentRuns: [],
}

export function loadDrillSettings(): DrillSettings {
  try {
    const s = localStorage.getItem(key('settings'))
    if (s) return { ...DEFAULT_SETTINGS, ...JSON.parse(s) }
  } catch { /* ignore */ }
  return { ...DEFAULT_SETTINGS }
}

export function saveDrillSettings(s: DrillSettings) {
  localStorage.setItem(key('settings'), JSON.stringify(s))
}

export function loadDrillOwned(): string[] {
  try {
    const s = localStorage.getItem(key('owned'))
    if (s) return JSON.parse(s)
  } catch { /* ignore */ }
  return []
}

export function saveDrillOwned(ids: string[]) {
  localStorage.setItem(key('owned'), JSON.stringify(ids))
}

export function loadDrillStats(): DrillStats {
  try {
    const s = localStorage.getItem(key('stats'))
    if (s) return { ...DEFAULT_STATS, ...JSON.parse(s) }
  } catch { /* ignore */ }
  return { ...DEFAULT_STATS }
}

export function saveDrillStats(s: DrillStats) {
  localStorage.setItem(key('stats'), JSON.stringify(s))
}

export function loadPlayerName(): string {
  try {
    const s = localStorage.getItem(key('playerName'))
    if (s) return s
  } catch { /* ignore */ }
  return ''
}

export function calendarDayDiff(isoA: string | null, isoB: string): number {
  if (!isoA) return Infinity
  const a = new Date(isoA), b = new Date(isoB)
  a.setHours(0, 0, 0, 0)
  b.setHours(0, 0, 0, 0)
  return Math.floor((b.getTime() - a.getTime()) / 86_400_000)
}
