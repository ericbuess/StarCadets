import { useState, useEffect } from "react"
import { DrillHomeScreen } from "./DrillHomeScreen"
import { DrillSettingsScreen } from "./DrillSettingsScreen"
import { DrillScreen } from "./DrillScreen"
import { DrillResultsScreen } from "./DrillResultsScreen"
import { UnboxScreen } from "./UnboxScreen"
import { CollectionScreen } from "./CollectionScreen"
import { DrillStatsScreen } from "./DrillStatsScreen"
import { ScanlineOverlay } from "@/components/arcade/ScanlineOverlay"
import { STICKERS } from "@/game/drillStickers"
import { starsFromCorrect, perMin } from "@/game/drillScoring"
import {
  loadDrillSettings, saveDrillSettings,
  loadDrillOwned, saveDrillOwned,
  loadDrillStats, saveDrillStats,
  loadPlayerName, calendarDayDiff,
} from "@/game/drillStorage"
import type { DrillScreen as DrillScreenType, DrillSettings, DrillStats, DrillResult, RecentRun } from "@/types/drill"
import type { Sticker } from "@/types/drill"

interface Props {
  onBackToHub: () => void
}

function formatRecentLabel(at: number, now: number): string {
  const days = Math.floor((startOfDay(now) - startOfDay(at)) / 86_400_000)
  if (days <= 0) return "TODAY"
  if (days === 1) return "YDAY"
  return `${days}D AGO`
}

function startOfDay(ms: number): number {
  const d = new Date(ms)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

function dayOfWeekIndex(ms: number): number {
  const dow = new Date(ms).getDay()
  return (dow + 6) % 7
}

function bumpWeek(week: number[], at: number, delta: number): number[] {
  const out = [...week]
  const idx = dayOfWeekIndex(at)
  out[idx] = (out[idx] ?? 0) + delta
  return out
}

export function DrillGame({ onBackToHub }: Props) {
  const [screen, setScreen] = useState<DrillScreenType>("home")
  const [settings, setSettings] = useState<DrillSettings>(() => loadDrillSettings())
  const [owned, setOwned] = useState<string[]>(() => loadDrillOwned())
  const [stats, setStats] = useState<DrillStats>(() => loadDrillStats())
  const [playerName] = useState(() => loadPlayerName())
  const [lastResult, setLastResult] = useState<DrillResult | null>(null)
  const [pendingReward, setPendingReward] = useState<Sticker | null>(null)

  useEffect(() => { saveDrillSettings(settings) }, [settings])
  useEffect(() => { saveDrillOwned(owned) }, [owned])
  useEffect(() => { saveDrillStats(stats) }, [stats])

  const handleFinish = (result: DrillResult) => {
    setLastResult(result)
    const now = Date.now()
    const nowISO = new Date(now).toISOString()
    const gained = starsFromCorrect(result.correct)
    const rate = perMin(result.correct, result.elapsedSec)
    const total = result.correct + result.wrong
    const daysSince = calendarDayDiff(stats.lastDrillISO, nowISO)
    let nextStreak = stats.streak
    if (!Number.isFinite(daysSince)) nextStreak = 1
    else if (daysSince === 0) nextStreak = Math.max(stats.streak, 1)
    else if (daysSince === 1) nextStreak = stats.streak + 1
    else nextStreak = 1

    const recent: RecentRun = {
      when: formatRecentLabel(now, now), mode: settings.session,
      correct: result.correct, total, stars: gained, at: now,
    }
    const nextRecent = [recent, ...stats.recentRuns].slice(0, 8).map(r => ({
      ...r, when: formatRecentLabel(r.at, now),
    }))

    setStats({
      totalStars: stats.totalStars + gained,
      drillsCompleted: stats.drillsCompleted + 1,
      totalCorrect: stats.totalCorrect + result.correct,
      totalAttempts: stats.totalAttempts + total,
      bestPerMin: Math.max(stats.bestPerMin, rate),
      streak: nextStreak,
      lastDrillISO: nowISO,
      lastWeek: bumpWeek(stats.lastWeek, now, result.correct),
      recentRuns: nextRecent,
    })

    const locked = STICKERS.filter(s => !owned.includes(s.id))
    const reward = locked.length && result.correct > 0
      ? locked[Math.floor(Math.random() * locked.length)] : null
    setPendingReward(reward)
    setScreen("results")
  }

  const claimReward = () => {
    if (pendingReward && !owned.includes(pendingReward.id)) {
      setOwned(o => [...o, pendingReward.id])
    }
    setPendingReward(null)
    setScreen("collection")
  }

  let content
  switch (screen) {
    case "home":
      content = (
        <DrillHomeScreen
          playerName={playerName} totalStars={stats.totalStars}
          totalStickers={owned.length}
          onStart={() => setScreen("settings")}
          onSettings={() => setScreen("settings")}
          onStats={() => setScreen("stats")}
          onCollection={() => setScreen("collection")}
          onBack={onBackToHub}
        />
      )
      break
    case "settings":
      content = (
        <DrillSettingsScreen
          settings={settings}
          onUpdate={fn => setSettings(fn)}
          onBack={() => setScreen("home")}
          onStart={() => setScreen("drill")}
        />
      )
      break
    case "drill":
      content = <DrillScreen settings={settings} onFinish={handleFinish} onExit={() => setScreen("home")} />
      break
    case "results":
      content = lastResult ? (
        <DrillResultsScreen
          result={lastResult}
          onPlayAgain={() => setScreen("drill")}
          onHome={() => setScreen("home")}
          onClaim={() => setScreen("unbox")}
          hasReward={pendingReward !== null}
        />
      ) : <div />
      break
    case "unbox":
      content = pendingReward ? (
        <UnboxScreen sticker={pendingReward} onDone={claimReward} />
      ) : <div />
      break
    case "collection":
      content = <CollectionScreen owned={owned} onBack={() => setScreen("home")} />
      break
    case "stats":
      content = <DrillStatsScreen stats={stats} onBack={() => setScreen("home")} />
      break
  }

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      {content}
      <ScanlineOverlay />
    </div>
  )
}
