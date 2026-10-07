import type { ClassId, SkillId } from './classes'
import type { Rng } from './rng'
import type { SpatialGrid } from './spatialGrid'

export interface Entrant {
  /** 在名單中的順序，同時是 unit 在 world.units 的索引 */
  id: number
  label: string
}

export interface BattleSettings {
  /** 得獎名額：名次前幾名得獎。對戰一律打到剩一人，不影響結束時機 */
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
  /** 暈眩剩餘秒數，> 0 時不移動、不出手、冷卻不倒數 */
  stunTimer: number
  /** 貓鼬冷卻剩餘秒數 */
  mongooseCooldown: number
  /** 魔法盾恢復剩餘秒數，<= 0 表示護盾可用 */
  shieldCooldown: number
  /** 戰意是否已啟動（只觸發一次事件） */
  fury: boolean
}

export type ProjectileKind = 'arrow' | 'chargedArrow' | 'fireball' | 'missile'

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
  /** 魔法箭：無視護甲、不能被閃避 / 格擋 */
  pierce: boolean
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
  /** 技能觸發：unit 是發動者（格擋、閃避、貓鼬、魔法盾是受擊者），x / y 是發動位置 */
  | { type: 'skill'; tick: number; unit: number; skill: SkillId; x: number; y: number }
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
