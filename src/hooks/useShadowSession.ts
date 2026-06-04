/**
 * React hook that manages a shadow-mode recording session for a game.
 *
 * Usage:
 *   const shadow = useShadowSession("neonrunner")
 *   // each frame:
 *   shadow.tickFrame(state.time, state.score)
 *   // once, when the game ends:
 *   shadow.finalizeOnce(state.score)
 *   // when the player restarts:
 *   shadow.restart()
 *
 * Then render <ShadowHUD /> somewhere in the game's JSX.
 */

import { useEffect, useRef } from "react"
import { startSession, endSession, tick, finalize } from "@/game/shadowMode"

export interface ShadowSessionHandle {
  tickFrame: (time: number, score: number) => void
  finalizeOnce: (finalScore: number) => void
  restart: () => void
}

export function useShadowSession(gameId: string): ShadowSessionHandle {
  const finalizedRef = useRef(false)

  useEffect(() => {
    startSession(gameId)
    finalizedRef.current = false
    return () => endSession()
  }, [gameId])

  const handleRef = useRef<ShadowSessionHandle>({
    tickFrame: (time, score) => tick(time, score),
    finalizeOnce: (finalScore) => {
      if (finalizedRef.current) return
      finalizedRef.current = true
      finalize(finalScore)
    },
    restart: () => {
      startSession(gameId)
      finalizedRef.current = false
    },
  })

  // Keep restart's gameId binding fresh if it ever changes
  handleRef.current.restart = () => {
    startSession(gameId)
    finalizedRef.current = false
  }

  return handleRef.current
}
