import { CLASSES } from '../classes'
import type { World } from '../types'
import { killUnit } from './death'

/**
 * 對單一目標造成傷害：套用護甲與延長賽倍率、記錄事件、判定死亡。
 * 攻擊者可能已經死亡（投射物在飛行途中主人陣亡），擊殺仍算在攻擊者身上。
 * 回傳 true 表示對戰已結束，呼叫端應立即停止本 tick 的處理。
 */
export function applyDamage(
  world: World,
  attacker: number,
  target: number,
  rawDamage: number,
  crit: boolean,
): boolean {
  const t = world.units[target]
  if (!t?.alive) return world.finished
  const armor = CLASSES[t.classId].armor
  const damage = Math.max(1, Math.round(rawDamage * (1 - armor) * world.damageMultiplier))
  t.hp -= damage
  t.lastHitTick = world.tick
  const a = world.units[attacker]
  if (a) a.damageDealt += damage
  world.events.push({ type: 'hit', tick: world.tick, attacker, target, damage, crit })
  return t.hp <= 0 && killUnit(world, target, attacker)
}

/**
 * 對 (x, y) 半徑內的所有存活者造成範圍傷害（排除 attacker 與 exclude）。
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
    if (applyDamage(world, attacker, j, rawDamage, false)) return true
  }
  return false
}
