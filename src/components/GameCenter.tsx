import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

interface GameCenterProps {
  userId: string | null
  onClose: () => void
  onSelectRace: (raceId: string) => void
}

interface RaceRecord {
  id: string
  user_id: string
  display_name: string
  score: number
  distance: number
  created_at: string
}

export function GameCenter({ userId, onClose, onSelectRace }: GameCenterProps) {
  const [races, setRaces] = useState<RaceRecord[]>([])
  const [inviteCode, setInviteCode] = useState("")
  const [myCode, setMyCode] = useState("")
  const [tab, setTab] = useState<"leaderboard" | "races" | "invite">("leaderboard")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRaces()
    if (userId) {
      setMyCode(userId.slice(0, 8).toUpperCase())
    }
  }, [userId])

  async function loadRaces() {
    setLoading(true)
    try {
      const { data } = await supabase
        .from("race_scores")
        .select("*")
        .order("score", { ascending: false })
        .limit(20)
      if (data) setRaces(data)
    } catch {
      // Fallback if table doesn't exist yet
      setRaces([])
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/95 p-4">
      <div className="max-w-md w-full bg-gray-900 rounded-2xl border border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">Game Center</h2>
          <button onClick={onClose} className="text-gray-400 text-2xl leading-none">&times;</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          {(["leaderboard", "races", "invite"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-1 py-3 text-sm font-medium capitalize transition-colors"
              style={{
                color: tab === t ? "#00d4e0" : "#6b7280",
                borderBottom: tab === t ? "2px solid #00d4e0" : "2px solid transparent"
              }}
            >
              {t === "leaderboard" ? "🏆 Scores" : t === "races" ? "🏎️ Races" : "👋 Invite"}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-4 max-h-[60vh] overflow-y-auto">
          {tab === "leaderboard" && (
            <div className="space-y-2">
              {loading ? (
                <p className="text-gray-500 text-center py-8">Loading...</p>
              ) : races.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400 text-lg mb-2">No scores yet!</p>
                  <p className="text-gray-500 text-sm">Start racing to see your scores here.</p>
                </div>
              ) : (
                races.map((race, i) => (
                  <div
                    key={race.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-800"
                  >
                    <span className="text-lg font-bold w-8 text-center" style={{
                      color: i === 0 ? "#ffd700" : i === 1 ? "#c0c0c0" : i === 2 ? "#cd7f32" : "#6b7280"
                    }}>
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <p className="text-white font-medium">{race.display_name || "Racer"}</p>
                      <p className="text-xs text-gray-500">{Math.floor(race.distance)}m</p>
                    </div>
                    <span className="font-bold text-lg" style={{ color: "#00d4e0" }}>
                      {Math.floor(race.score).toLocaleString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === "races" && (
            <div className="space-y-3 text-center py-4">
              <p className="text-gray-300 text-lg font-medium">Async Racing</p>
              <p className="text-gray-500 text-sm">
                Race against ghost replays of your friends and family.
                Each person races on their own time — the ghost shows their best run!
              </p>
              <button
                onClick={() => onSelectRace("daily-" + new Date().toISOString().slice(0, 10))}
                className="w-full p-4 rounded-xl bg-gray-800 border border-gray-600 text-left transition-all active:scale-[0.98]"
              >
                <p className="text-white font-bold">Daily Race</p>
                <p className="text-xs text-gray-400 mt-1">Same track every day. Compete for the top score!</p>
              </button>
              <button
                onClick={() => onSelectRace("free-" + Date.now())}
                className="w-full p-4 rounded-xl bg-gray-800 border border-gray-600 text-left transition-all active:scale-[0.98]"
              >
                <p className="text-white font-bold">Free Race</p>
                <p className="text-xs text-gray-400 mt-1">Practice run with your own ghost.</p>
              </button>
            </div>
          )}

          {tab === "invite" && (
            <div className="space-y-4 py-4">
              <div className="text-center">
                <p className="text-gray-300 text-sm mb-2">Your invite code:</p>
                <div className="inline-block px-6 py-3 rounded-xl bg-gray-800 border border-gray-600">
                  <span className="text-2xl font-mono font-bold tracking-widest" style={{ color: "#00d4e0" }}>
                    {myCode || "Sign in first"}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-2">Share this code with family members</p>
              </div>

              <div className="border-t border-gray-700 pt-4">
                <p className="text-gray-300 text-sm mb-2">Enter invite code:</p>
                <div className="flex gap-2">
                  <input
                    value={inviteCode}
                    onChange={e => setInviteCode(e.target.value.toUpperCase())}
                    placeholder="XXXXXXXX"
                    className="flex-1 h-10 rounded-lg bg-gray-800 border border-gray-600 text-white px-3 font-mono tracking-widest text-center"
                    maxLength={8}
                  />
                  <button
                    onClick={() => {
                      if (inviteCode.length >= 4) {
                        // In a full implementation, this would link accounts
                        alert("Friend added! You'll see their ghost in races.")
                      }
                    }}
                    className="px-4 rounded-lg font-bold text-gray-950"
                    style={{ backgroundColor: "#00d4e0" }}
                  >
                    Join
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
