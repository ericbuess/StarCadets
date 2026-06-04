import type { Goal, GoalType, CarState } from "./types"

interface GoalTemplate {
  type: GoalType
  label: string
  description: string
  targetRange: [number, number]
  timeLimitRange: [number, number]
  minGoalCount: number // minimum goals completed before this can appear
}

const GOAL_TEMPLATES: GoalTemplate[] = [
  { type: "reach_distance", label: "Road Runner", description: "Travel {target}m", targetRange: [300, 800], timeLimitRange: [30, 60], minGoalCount: 0 },
  { type: "reach_distance", label: "Long Haul", description: "Travel {target}m", targetRange: [800, 2000], timeLimitRange: [45, 90], minGoalCount: 3 },
  { type: "frontflip", label: "Flip Master", description: "Do {target} front flip(s)", targetRange: [1, 3], timeLimitRange: [30, 50], minGoalCount: 0 },
  { type: "backflip", label: "Reverse Spin", description: "Do {target} back flip(s)", targetRange: [1, 3], timeLimitRange: [30, 50], minGoalCount: 0 },
  { type: "double_backflip", label: "Double Trouble", description: "Do a double backflip!", targetRange: [1, 1], timeLimitRange: [40, 60], minGoalCount: 2 },
  { type: "combo", label: "Combo King", description: "Reach a {target}x combo", targetRange: [2, 5], timeLimitRange: [35, 60], minGoalCount: 1 },
  { type: "destroy_enemies", label: "Enemy Down", description: "Destroy {target} enemies", targetRange: [1, 4], timeLimitRange: [40, 70], minGoalCount: 2 },
  { type: "collect_powerups", label: "Power Collector", description: "Collect {target} powerups", targetRange: [2, 5], timeLimitRange: [35, 60], minGoalCount: 1 },
  { type: "airtime", label: "Hang Time", description: "Stay airborne for {target}s total", targetRange: [3, 8], timeLimitRange: [30, 50], minGoalCount: 1 },
  { type: "speed_run", label: "Speed Demon", description: "Reach {target} speed", targetRange: [350, 500], timeLimitRange: [25, 45], minGoalCount: 2 },
  { type: "survive", label: "Survivor", description: "Survive for {target}s without crashing", targetRange: [20, 45], timeLimitRange: [25, 50], minGoalCount: 0 },
]

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function generateGoal(goalCount: number, difficulty: number): Goal {
  // Filter to goals available at this point
  const available = GOAL_TEMPLATES.filter(t => t.minGoalCount <= goalCount)
  const template = available[Math.floor(Math.random() * available.length)]

  // Scale target with difficulty (0–1)
  const diffScale = 0.6 + difficulty * 0.8
  const rawTarget = randomInt(template.targetRange[0], template.targetRange[1])
  const target = Math.round(rawTarget * diffScale)

  // Scale time — harder goals get slightly less time
  const rawTime = randomInt(template.timeLimitRange[0], template.timeLimitRange[1])
  const timeLimit = Math.max(20, Math.round(rawTime * (1.1 - difficulty * 0.3)))

  return {
    type: template.type,
    label: template.label,
    description: template.description.replace("{target}", String(target)),
    target,
    current: 0,
    timeLimit,
    timeRemaining: timeLimit,
    completed: false,
    failed: false,
  }
}

export function updateGoalProgress(goal: Goal, car: CarState, dt: number, prevCar: {
  frontFlips: number
  backFlips: number
  combo: number
  enemiesDestroyed: number
  powerupsCollected: number
  airTime: number
  maxSpeed: number
  distance: number
  surviveTimer: number
}): { completed: boolean; failed: boolean; surviveTimer: number } {
  if (goal.completed || goal.failed) return { completed: goal.completed, failed: goal.failed, surviveTimer: prevCar.surviveTimer }

  // Count down timer
  goal.timeRemaining -= dt
  if (goal.timeRemaining <= 0) {
    goal.timeRemaining = 0
    goal.failed = true
    return { completed: false, failed: true, surviveTimer: 0 }
  }

  let surviveTimer = prevCar.surviveTimer

  switch (goal.type) {
    case "reach_distance": {
      const distTraveled = car.distance - prevCar.distance
      goal.current = Math.floor(distTraveled)
      break
    }
    case "frontflip": {
      goal.current = car.frontFlipCount - prevCar.frontFlips
      break
    }
    case "backflip": {
      goal.current = car.backFlipCount - prevCar.backFlips
      break
    }
    case "double_backflip": {
      // A double backflip = 2 consecutive backflips in one air session
      // Tracked via currentFlipAngle — if angle < -4π, that's a double
      if (!car.onGround && car.currentFlipAngle < -Math.PI * 4) {
        goal.current = 1
      }
      break
    }
    case "combo": {
      goal.current = Math.max(goal.current, car.combo)
      break
    }
    case "destroy_enemies": {
      goal.current = car.enemiesDestroyed - prevCar.enemiesDestroyed
      break
    }
    case "collect_powerups": {
      goal.current = car.powerupsCollected - prevCar.powerupsCollected
      break
    }
    case "airtime": {
      if (!car.onGround) {
        const newAir = car.totalAirTime - prevCar.airTime
        goal.current = Math.floor(newAir * 10) / 10
      }
      break
    }
    case "speed_run": {
      goal.current = Math.floor(Math.abs(car.vel.x))
      break
    }
    case "survive": {
      if (!car.crashed) {
        surviveTimer += dt
        goal.current = Math.floor(surviveTimer)
      }
      break
    }
  }

  if (goal.current >= goal.target) {
    goal.completed = true
    return { completed: true, failed: false, surviveTimer }
  }

  return { completed: false, failed: false, surviveTimer }
}
