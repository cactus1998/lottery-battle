export type ClassId = 'swordsman' | 'knight' | 'archer' | 'mage' | 'assassin'

export interface ClassStats {
  name: string
  icon: string
  description: string
  maxHp: number
  /** 移動速度（單位 / 秒） */
  speed: number
  /** 中心距離小於此值即可攻擊 */
  range: number
  /** 遠程職業和目標距離小於此值時會後退拉開 */
  retreatRange: number
  damageMin: number
  damageMax: number
  cooldown: number
  critChance: number
  critMultiplier: number
  /** 受到傷害減免比例 0–1 */
  armor: number
  /** 投射物速度，0 表示近戰立即命中 */
  projectileSpeed: number
  /** 命中時對周圍造成的範圍傷害半徑，0 表示沒有 */
  splashRadius: number
  /** 範圍傷害對非主要目標的比例 */
  splashRatio: number
  /** 每第 N 次攻擊發動旋風斬，0 表示沒有 */
  spinEvery: number
  spinRadius: number
  spinRatio: number
  /** 此半徑內有遠程職業時優先鎖定它，0 表示沒有 */
  huntRadius: number
}

const BASE: Omit<ClassStats, 'name' | 'icon' | 'description'> = {
  maxHp: 400,
  speed: 60,
  range: 34,
  retreatRange: 0,
  damageMin: 15,
  damageMax: 22,
  cooldown: 1,
  critChance: 0.1,
  critMultiplier: 2,
  armor: 0,
  projectileSpeed: 0,
  splashRadius: 0,
  splashRatio: 0,
  spinEvery: 0,
  spinRadius: 0,
  spinRatio: 0,
  huntRadius: 0,
}

/** 職業數值。調整後用 class-balance 測試確認各職業勝率接近（見 game-engine skill）。 */
export const CLASSES: Record<ClassId, ClassStats> = {
  swordsman: {
    ...BASE,
    name: '劍士',
    icon: '⚔️',
    description: '均衡近戰，每第 3 刀使出旋風斬傷害周圍所有人',
    maxHp: 780,
    speed: 60,
    damageMin: 17,
    damageMax: 24,
    cooldown: 1,
    spinEvery: 3,
    spinRadius: 46,
    spinRatio: 0.8,
  },
  knight: {
    ...BASE,
    name: '騎士',
    icon: '🛡️',
    description: '厚重盔甲減免 25% 傷害，移動較慢',
    maxHp: 640,
    speed: 48,
    damageMin: 15,
    damageMax: 21,
    cooldown: 1.1,
    armor: 0.25,
  },
  archer: {
    ...BASE,
    name: '弓箭手',
    icon: '🏹',
    description: '遠距離射箭，敵人靠近時會後退拉開距離',
    maxHp: 500,
    speed: 56,
    range: 135,
    retreatRange: 70,
    damageMin: 14,
    damageMax: 19,
    cooldown: 1.15,
    critChance: 0.15,
    projectileSpeed: 420,
  },
  mage: {
    ...BASE,
    name: '法師',
    icon: '🔮',
    description: '施放火球，爆炸波及周圍所有人',
    maxHp: 520,
    speed: 50,
    range: 125,
    retreatRange: 60,
    damageMin: 22,
    damageMax: 30,
    cooldown: 1.5,
    projectileSpeed: 260,
    splashRadius: 50,
    splashRatio: 0.55,
  },
  assassin: {
    ...BASE,
    name: '刺客',
    icon: '🗡️',
    description: '移動飛快、容易爆擊，會優先刺殺附近的弓箭手與法師',
    maxHp: 680,
    speed: 88,
    damageMin: 13,
    damageMax: 19,
    cooldown: 0.55,
    critChance: 0.35,
    critMultiplier: 2.2,
    huntRadius: 220,
  },
}

export const CLASS_IDS = Object.keys(CLASSES) as ClassId[]
