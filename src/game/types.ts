export interface Vec2 {
  x: number
  y: number
}

// ─── Vehicle System ───
export interface VehicleProfile {
  id: string
  name: string
  speed: number       // multiplier 0.5–2.0
  flipRate: number    // multiplier 0.5–2.0
  hangTime: number    // gravity multiplier (lower = more hang) 0.5–1.5
  weight: number      // bounce & crash resistance
  color: string
  accentColor: string
  shape: "sedan" | "sports" | "muscle" | "truck" | "futuristic"
}

export const VEHICLES: VehicleProfile[] = [
  { id: "standard", name: "Street Racer", speed: 1, flipRate: 1, hangTime: 1, weight: 1, color: "#00d4e0", accentColor: "#007a85", shape: "sedan" },
  { id: "sport", name: "Sport Cruiser", speed: 1.15, flipRate: 1.2, hangTime: 0.9, weight: 0.8, color: "#ff2e63", accentColor: "#cc1144", shape: "sports" },
  { id: "muscle", name: "Muscle Machine", speed: 1.3, flipRate: 0.9, hangTime: 1.1, weight: 1.3, color: "#ff8800", accentColor: "#cc6600", shape: "muscle" },
  { id: "truck", name: "Monster Truck", speed: 0.9, flipRate: 0.7, hangTime: 1.3, weight: 1.6, color: "#3ce67a", accentColor: "#22aa55", shape: "truck" },
  { id: "rocket", name: "Rocket Sled", speed: 1.5, flipRate: 1.1, hangTime: 0.6, weight: 0.7, color: "#ffd93d", accentColor: "#ff8800", shape: "futuristic" },
]

// ─── Goal / Challenge System ───
export type GoalType =
  | "reach_distance"
  | "backflip"
  | "double_backflip"
  | "frontflip"
  | "combo"
  | "destroy_enemies"
  | "collect_powerups"
  | "airtime"
  | "speed_run"
  | "survive"

export interface Goal {
  type: GoalType
  label: string
  description: string
  target: number
  current: number
  timeLimit: number   // seconds
  timeRemaining: number
  completed: boolean
  failed: boolean
}

// ─── Projectiles ───
export interface Projectile {
  pos: Vec2
  vel: Vec2
  type: "bullet" | "missile"
  life: number
  damage: number
}

export interface CarState {
  pos: Vec2
  vel: Vec2
  angle: number
  angularVel: number
  wheelBase: number
  width: number
  height: number
  onGround: boolean
  crashed: boolean
  fuel: number
  score: number
  distance: number
  flipCount: number
  frontFlipCount: number
  backFlipCount: number
  currentFlipAngle: number
  isFlipping: boolean
  combo: number
  comboTimer: number
  invincible: boolean
  invincibleTimer: number
  speedBoost: boolean
  speedBoostTimer: number
  hangTimeBoost: boolean
  hangTimeBoostTimer: number
  hasGun: boolean
  gunTimer: number
  gunCooldown: number
  hasMissile: boolean
  missileTimer: number
  missileCooldown: number
  vehicle: VehicleProfile
  totalAirTime: number
  enemiesDestroyed: number
  powerupsCollected: number
  maxSpeed: number
  ghostInputs: InputFrame[]
}

export interface InputFrame {
  time: number
  leftPressed: boolean
  rightPressed: boolean
}

export interface TerrainSegment {
  startX: number
  points: Vec2[]
  type: SegmentType
  disappearTimer?: number
  isDisappearing?: boolean
  disappeared?: boolean
}

export type SegmentType =
  | "flat"
  | "hill"
  | "valley"
  | "loop"
  | "jump"
  | "gap"
  | "disappearing"
  | "narrow"
  | "ramp"

export interface Obstacle {
  pos: Vec2
  width: number
  height: number
  type: "rock" | "barrier" | "spikes"
  destroyed?: boolean
}

export interface Enemy {
  pos: Vec2
  vel: Vec2
  width: number
  height: number
  type: "roller" | "bouncer"
  alive: boolean
  health: number
}

export interface Powerup {
  pos: Vec2
  type: PowerupType
  collected: boolean
  bobOffset: number
}

export type PowerupType =
  | "speed"
  | "invincible"
  | "fuel"
  | "points"
  | "gun"
  | "missile"
  | "hangtime"

export interface Particle {
  pos: Vec2
  vel: Vec2
  life: number
  maxLife: number
  color: string
  size: number
}

export interface GhostFrame {
  time: number
  pos: Vec2
  angle: number
}

export interface GameState {
  car: CarState
  terrain: TerrainSegment[]
  obstacles: Obstacle[]
  enemies: Enemy[]
  powerups: Powerup[]
  particles: Particle[]
  projectiles: Projectile[]
  camera: Vec2
  time: number
  gameOver: boolean
  paused: boolean
  showEducation: boolean
  educationCheckpoint: number
  currentGoal: Goal | null
  goalCount: number
  ghostFrames: GhostFrame[]
  bestGhostFrames: GhostFrame[]
  raceId: string
}

export interface EducationContent {
  type: "quiz" | "flashcard" | "video"
  subject: string
  question?: string
  options?: string[]
  correctAnswer?: number
  explanation?: string
  term?: string
  definition?: string
  videoTitle?: string
  videoContent?: string
}

export interface UserProfile {
  id: string
  displayName: string
  age?: number
  grade?: string
  location?: string
  school?: string
  subjects: string[]
  bestScores: Record<string, number>
}
