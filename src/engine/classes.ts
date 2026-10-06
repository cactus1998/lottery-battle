export type ClassId = 'swordsman' | 'knight' | 'archer' | 'mage' | 'assassin'

/** 主動技能：每次出手擲一次 rng，小於 activeChance 就觸發 */
export type ActiveSkillId = 'spin' | 'shieldBash' | 'chargedShot' | 'magicMissile' | 'execute'
/** 被動技能：條件或機率觸發 */
export type PassiveSkillId = 'fury' | 'block' | 'mongoose' | 'manaShield' | 'dodge'
export type SkillId = ActiveSkillId | PassiveSkillId

/** 技能顯示名稱（浮字與介紹用） */
export const SKILL_NAMES: Record<SkillId, string> = {
  spin: '旋風斬',
  shieldBash: '盾擊',
  chargedShot: '蓄力射擊',
  magicMissile: '魔法箭',
  execute: '處決',
  fury: '戰意',
  block: '格擋',
  mongoose: '貓鼬',
  manaShield: '魔法盾',
  dodge: '閃避',
}

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
  /** 此半徑內有遠程職業時優先鎖定它，0 表示沒有 */
  huntRadius: number

  activeSkill: ActiveSkillId
  /** 每次出手觸發主動技能的機率 0–1 */
  activeChance: number
  passiveSkill: PassiveSkillId

  /** 旋風斬：主目標全額，半徑內其他人吃 spinRatio */
  spinRadius: number
  spinRatio: number
  /** 盾擊：目標暈眩秒數 */
  stunSec: number
  /** 蓄力射擊：傷害倍率、箭速倍率 */
  chargedDamageMul: number
  chargedSpeedMul: number
  /** 魔法箭：傷害倍率、飛行速度；無視護甲，不能被閃避 / 格擋 */
  missileDamageMul: number
  missileSpeed: number
  /** 處決：目標 HP 比例低於此值才能觸發 */
  executeHpRatio: number

  /** 戰意：HP 比例低於此值時，造成與受到的傷害倍率 */
  furyHpRatio: number
  furyDamageMul: number
  furyTakenMul: number
  /** 格擋 / 閃避：單體攻擊傷害歸零的機率 */
  blockChance: number
  dodgeChance: number
  /** 貓鼬：受近戰傷害後往後閃的機率、距離、冷卻秒數 */
  mongooseChance: number
  mongooseDistance: number
  mongooseCooldown: number
  /** 魔法盾：抵擋一次傷害（處決除外）後的恢復秒數 */
  manaShieldCooldown: number
}

const BASE: Omit<ClassStats, 'name' | 'icon' | 'description' | 'activeSkill' | 'passiveSkill'> = {
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
  huntRadius: 0,
  activeChance: 0,
  spinRadius: 0,
  spinRatio: 0,
  stunSec: 0,
  chargedDamageMul: 1,
  chargedSpeedMul: 1,
  missileDamageMul: 1,
  missileSpeed: 0,
  executeHpRatio: 0,
  furyHpRatio: 0,
  furyDamageMul: 1,
  furyTakenMul: 1,
  blockChance: 0,
  dodgeChance: 0,
  mongooseChance: 0,
  mongooseDistance: 0,
  mongooseCooldown: 0,
  manaShieldCooldown: 0,
}

/** 職業數值。調整後用 class-balance 測試確認各職業勝率接近（見 game-engine skill）。 */
export const CLASSES: Record<ClassId, ClassStats> = {
  swordsman: {
    ...BASE,
    name: '戰士',
    icon: '⚔️',
    description: '均衡近戰，殘血時拚命',
    maxHp: 740,
    speed: 60,
    damageMin: 17,
    damageMax: 24,
    cooldown: 1,
    activeSkill: 'spin',
    activeChance: 0.35,
    spinRadius: 46,
    spinRatio: 0.6,
    passiveSkill: 'fury',
    furyHpRatio: 0.5,
    furyDamageMul: 1.5,
    furyTakenMul: 1.15,
  },
  knight: {
    ...BASE,
    name: '騎士',
    icon: '🛡️',
    description: '厚重盔甲減免 15% 傷害，移動較慢',
    maxHp: 630,
    speed: 48,
    damageMin: 15,
    damageMax: 21,
    cooldown: 1.1,
    armor: 0.15,
    activeSkill: 'shieldBash',
    activeChance: 0.15,
    stunSec: 0.8,
    passiveSkill: 'block',
    blockChance: 0.08,
  },
  archer: {
    ...BASE,
    name: '遊俠',
    icon: '🏹',
    description: '遠距離射箭，被貼近會後退',
    maxHp: 540,
    speed: 56,
    range: 140,
    retreatRange: 70,
    damageMin: 15,
    damageMax: 21,
    cooldown: 1.15,
    critChance: 0.15,
    projectileSpeed: 420,
    activeSkill: 'chargedShot',
    activeChance: 0.25,
    chargedDamageMul: 1.8,
    chargedSpeedMul: 1.6,
    passiveSkill: 'mongoose',
    mongooseChance: 0.4,
    mongooseDistance: 60,
    mongooseCooldown: 3,
  },
  mage: {
    ...BASE,
    name: '法師',
    icon: '🔮',
    description: '火球爆炸波及周圍所有人',
    maxHp: 600,
    speed: 50,
    range: 125,
    retreatRange: 60,
    damageMin: 22,
    damageMax: 30,
    cooldown: 1.5,
    projectileSpeed: 260,
    splashRadius: 50,
    splashRatio: 0.55,
    activeSkill: 'magicMissile',
    activeChance: 0.35,
    missileDamageMul: 1.2,
    missileSpeed: 520,
    passiveSkill: 'manaShield',
    manaShieldCooldown: 6,
  },
  assassin: {
    ...BASE,
    name: '刺客',
    icon: '🗡️',
    description: '移動飛快、容易爆擊，優先刺殺遠程',
    maxHp: 660,
    speed: 88,
    damageMin: 13,
    damageMax: 19,
    cooldown: 0.55,
    critChance: 0.35,
    critMultiplier: 2.2,
    huntRadius: 220,
    activeSkill: 'execute',
    activeChance: 0.3,
    executeHpRatio: 0.15,
    passiveSkill: 'dodge',
    dodgeChance: 0.1,
  },
}

export const CLASS_IDS = Object.keys(CLASSES) as ClassId[]

const pct = (v: number) => `${Math.round(v * 100)}%`

/** 技能說明文字，由數值產生，調平衡後不會和數值不一致 */
export function describeSkills(id: ClassId): { active: string; passive: string } {
  const c = CLASSES[id]
  const chance = pct(c.activeChance)
  const active: Record<ActiveSkillId, string> = {
    spin: `${chance} 機率旋風斬，周圍敵人受到 ${pct(c.spinRatio)} 傷害`,
    shieldBash: `${chance} 機率盾擊，讓目標暈眩 ${c.stunSec} 秒`,
    chargedShot: `${chance} 機率蓄力射擊，射出更快的強力箭，傷害 ×${c.chargedDamageMul}`,
    magicMissile: `${chance} 機率改射魔法箭，傷害 ×${c.missileDamageMul}，無視護甲且無法閃避格擋`,
    execute: `目標 HP 剩 ${pct(c.executeHpRatio)} 以下時，${chance} 機率直接處決`,
  }
  const passive: Record<PassiveSkillId, string> = {
    fury: `HP 剩 ${pct(c.furyHpRatio)} 以下時造成傷害 ×${c.furyDamageMul}，但受到傷害 ×${c.furyTakenMul}`,
    block: `${pct(c.blockChance)} 機率格擋單體攻擊`,
    mongoose: `被近戰打到時 ${pct(c.mongooseChance)} 機率往後閃 ${c.mongooseDistance} 距離（冷卻 ${c.mongooseCooldown} 秒）`,
    manaShield: `開場帶護盾，抵擋一次任何傷害（處決除外），破盾後 ${c.manaShieldCooldown} 秒恢復`,
    dodge: `${pct(c.dodgeChance)} 機率閃避單體攻擊`,
  }
  return { active: active[c.activeSkill], passive: passive[c.passiveSkill] }
}
