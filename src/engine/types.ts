import type { ClassId } from './classes'
import type { Rng } from './rng'
import type { SpatialGrid } from './spatialGrid'

export interface Entrant {
  /** 在名單中的順序，同時是 unit 在 world.units 的索引 */
  id: number
  label: string
}

export interface BattleSettings {
  /** 存活人數降到這個數字時對戰結束 */
  winners: number
  /** 依名次的獎品名稱（第 i 個給第 i + 1 名）。只供畫面顯示，引擎不使用 */
  prizes?: string[]
}

export interface BattleConfig {
  entrants: Entrant[]
  settings: BattleSettings
  seed: number
}

export interface Unit {
  id: number
  label: string
  classId: ClassId
  /** 色相 0–360，由索引決定 */
  hue: number
  x: number
  y: number
  /** 上一個 tick 的位置，畫面內插用 */
  prevX: number
  prevY: number
  facing: number
  hp: number
  maxHp: number
  alive: boolean
  /** 目前目標的索引，-1 表示沒有 */
  target: number
  retargetTimer: number
  cooldown: number
  attackCount: number
  kills: number
  damageDealt: number
  deathTick: number
  lastHitTick: number
  lastAttackTick: number
}

export type ProjectileKind = 'arrow' | 'fireball'

/** 投射物放在物件池重用，active = false 的可再利用 */
export interface Projectile {
  active: boolean
  kind: ProjectileKind
  owner: number
  target: number
  x: number
  y: number
  prevX: number
  prevY: number
  /** 目標死亡時飛往最後已知位置 */
  destX: number
  destY: number
  speed: number
  damage: number
  crit: boolean
  splashRadius: number
  splashRatio: number
}

export type BattleEvent =
  | {
      type: 'hit'
      tick: number
      attacker: number
      target: number
      damage: number
      crit: boolean
    }
  | { type: 'kill'; tick: number; killer: number | null; victim: number }
  | { type: 'shoot'; tick: number; attacker: number; kind: ProjectileKind }
  | { type: 'explode'; tick: number; x: number; y: number; radius: number }
  | { type: 'spin'; tick: number; attacker: number; radius: number }
  | { type: 'overtime'; tick: number; multiplier: number }
  | { type: 'finish'; tick: number }

export interface World {
  seed: number
  settings: BattleSettings
  tick: number
  units: Unit[]
  projectiles: Projectile[]
  aliveCount: number
  finished: boolean
  /** 延長賽傷害倍率，1 表示尚未進入延長賽 */
  damageMultiplier: number
  /** 依死亡先後排列的 unit 索引 */
  deathOrder: number[]
  /** 本 tick 以來累積的事件，由 GameController 取走後清空 */
  events: BattleEvent[]
  rng: Rng
  grid: SpatialGrid
  /** 暫存陣列（攻擊順序、鄰近查詢），避免每 tick 配置 */
  scratch: number[]
  neighbors: number[]
}

export interface RankingRow {
  rank: number
  id: number
  label: string
  classId: ClassId
  /** 小人偶衣服色相，結果頁畫小人偶用 */
  hue: number
  kills: number
  damageDealt: number
  /** 存活秒數（得獎者為整場時長） */
  survivedSec: number
  winner: boolean
}

export interface BattleResult {
  seed: number
  settings: BattleSettings
  ticks: number
  durationSec: number
  total: number
  ranking: RankingRow[]
}
