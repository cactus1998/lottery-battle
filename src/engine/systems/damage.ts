import { CLASSES, type SkillId } from '../classes'
import { CONFIG } from '../config'
import type { World } from '../types'
import { killUnit } from './death'

/** applyDamage 的旗標，用位元組合避免每次命中配置物件 */
export const HIT_SINGLE = 1 // 單體主要傷害：可以被閃避 / 格擋
export const HIT_MELEE = 2 // 近戰：可以觸發貓鼬
export const HIT_TRUE = 4 // 真實傷害（處決）：無視護甲、延長賽倍率、閃避、格擋與魔法盾
export const HIT_PIERCE = 8 // 魔法箭：無視護甲，不能被閃避 / 格擋（魔法盾仍可擋）

const LIMIT_MIN = CONFIG.unitRadius
const LIMIT_MAX = CONFIG.arenaSize - CONFIG.unitRadius

/**
 * 對單一目標造成傷害：魔法盾 → 閃避 / 格擋 → 套用護甲、戰意與延長賽倍率 → 記錄事件、判定死亡，
 * 受擊後處理戰意啟動與貓鼬。擲骰順序固定：閃避 / 格擋 → 貓鼬。
 * 攻擊者可能已經死亡（投射物在飛行途中主人陣亡），擊殺仍算在攻擊者身上。
 * 回傳 true 表示對戰已結束，呼叫端應立即停止本 tick 的處理。
 */
export function applyDamage(
  world: World,
  attacker: number,
  target: number,
  rawDamage: number,
  crit: boolean,
  flags = 0,
): boolean {
  const t = world.units[target]
  if (!t?.alive) return world.finished
  const stats = CLASSES[t.classId]
  const trueDamage = (flags & HIT_TRUE) !== 0
  const pierce = (flags & HIT_PIERCE) !== 0

  if (!trueDamage && stats.passiveSkill === 'manaShield' && t.shieldCooldown <= 0) {
    t.shieldCooldown = stats.manaShieldCooldown
    pushSkill(world, target, 'manaShield')
    return false
  }

  if (!trueDamage && !pierce && (flags & HIT_SINGLE) !== 0) {
    const evade =
      stats.passiveSkill === 'dodge'
        ? stats.dodgeChance
        : stats.passiveSkill === 'block'
          ? stats.blockChance
          : 0
    if (evade > 0 && world.rng.next() < evade) {
      pushSkill(world, target, stats.passiveSkill)
      return false
    }
  }

  const armor = pierce ? 0 : stats.armor
  const taken = t.fury ? stats.furyTakenMul : 1
  const damage = trueDamage
    ? Math.max(1, Math.round(rawDamage))
    : Math.max(1, Math.round(rawDamage * (1 - armor) * taken * world.damageMultiplier))
  t.hp -= damage
  t.lastHitTick = world.tick
  const a = world.units[attacker]
  if (a) a.damageDealt += damage
  world.events.push({ type: 'hit', tick: world.tick, attacker, target, damage, crit })
  if (t.hp <= 0) return killUnit(world, target, attacker)

  if (stats.passiveSkill === 'fury' && !t.fury && t.hp <= t.maxHp * stats.furyHpRatio) {
    t.fury = true
    pushSkill(world, target, 'fury')
  }
  if (
    stats.passiveSkill === 'mongoose' &&
    (flags & HIT_MELEE) !== 0 &&
    t.mongooseCooldown <= 0 &&
    a &&
    world.rng.next() < stats.mongooseChance
  ) {
    dash(world, target, a.x, a.y, stats.mongooseDistance)
    t.mongooseCooldown = stats.mongooseCooldown
  }
  return false
}

/** 貓鼬：朝遠離 (fromX, fromY) 的方向瞬移，夾在場地內；同步 prev 位置讓畫面不內插滑行 */
function dash(world: World, index: number, fromX: number, fromY: number, distance: number): void {
  const u = world.units[index]
  if (!u) return
  pushSkill(world, index, 'mongoose')
  const dx = u.x - fromX
  const dy = u.y - fromY
  const d = Math.hypot(dx, dy)
  // 完全重疊時用固定方向，維持決定性
  const nx = d > 0 ? dx / d : 1
  const ny = d > 0 ? dy / d : 0
  const x = u.x + nx * distance
  const y = u.y + ny * distance
  u.x = x < LIMIT_MIN ? LIMIT_MIN : x > LIMIT_MAX ? LIMIT_MAX : x
  u.y = y < LIMIT_MIN ? LIMIT_MIN : y > LIMIT_MAX ? LIMIT_MAX : y
  u.prevX = u.x
  u.prevY = u.y
}

export function pushSkill(world: World, unit: number, skill: SkillId): void {
  const u = world.units[unit]
  if (!u) return
  world.events.push({ type: 'skill', tick: world.tick, unit, skill, x: u.x, y: u.y })
}

/**
 * 對 (x, y) 半徑內的所有存活者造成範圍傷害（排除 attacker 與 exclude）。範圍傷害不能閃避 / 格擋，
 * flags 不應包含 HIT_SINGLE。
 * 依格子查詢結果的索引順序結算，維持決定性。回傳 true 表示對戰已結束。
 */
export function applySplash(
  world: World,
  attacker: number,
  x: number,
  y: number,
  radius: number,
  rawDamage: number,
  exclude: number,
  flags = 0,
): boolean {
  const { units, grid, neighbors } = world
  grid.queryInto(x, y, radius, neighbors)
  // 格子內順序取決於 rebuild 時的索引順序，排序後結算
  neighbors.sort((a, b) => a - b)
  const r2 = radius * radius
  for (const j of neighbors) {
    if (j === attacker || j === exclude) continue
    const u = units[j]
    if (!u?.alive) continue
    const dx = u.x - x
    const dy = u.y - y
    if (dx * dx + dy * dy > r2) continue
    if (applyDamage(world, attacker, j, rawDamage, false, flags)) return true
  }
  return false
}
