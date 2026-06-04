import { useState, useCallback } from "react"
import { addXP, XP_REWARDS } from "@/game/progression"
import type { LevelUpResult } from "@/game/progression"

interface RewardState {
  showSticker: boolean
  showLevelUp: boolean
  levelUpData: LevelUpResult | null
}

export function useEducationReward() {
  const [reward, setReward] = useState<RewardState>({
    showSticker: false,
    showLevelUp: false,
    levelUpData: null,
  })

  const onEducationCorrect = useCallback(() => {
    const result = addXP(XP_REWARDS.educationCorrect)

    if (result.leveled) {
      setReward({ showSticker: false, showLevelUp: true, levelUpData: result })
      return
    }

    // 25% chance of sticker reward on correct answer
    if (Math.random() < 0.25) {
      setReward({ showSticker: true, showLevelUp: false, levelUpData: null })
      return
    }
  }, [])

  const onGameComplete = useCallback(() => {
    const result = addXP(XP_REWARDS.gameComplete)
    if (result.leveled) {
      setReward({ showSticker: false, showLevelUp: true, levelUpData: result })
    }
  }, [])

  const dismissReward = useCallback(() => {
    setReward(prev => {
      if (prev.showLevelUp) {
        // After level up, maybe show sticker too
        if (Math.random() < 0.5) {
          return { showSticker: true, showLevelUp: false, levelUpData: null }
        }
      }
      return { showSticker: false, showLevelUp: false, levelUpData: null }
    })
  }, [])

  return { reward, onEducationCorrect, onGameComplete, dismissReward }
}
