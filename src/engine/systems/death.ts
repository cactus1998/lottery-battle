import type { World } from '../types'

/**
 * 淘汰一個小人並檢查勝負。回傳 true 表示對戰已結束，呼叫端應立即停止本 tick 的處理，
 * 確保存活人數不會低於得獎人數。
 */
export function killUnit(world: World, victim: number, killer: number | null): boolean {
  const unit = world.units[victim]
  if (!unit?.alive) return world.finished
  unit.alive = false
  unit.hp = 0
  unit.deathTick = world.tick
  unit.target = -1
  world.aliveCount--
  world.deathOrder.push(victim)
  if (killer !== null) {
    const k = world.units[killer]
    if (k) k.kills++
  }
  world.events.push({ type: 'kill', tick: world.tick, killer, victim })

  if (world.aliveCount <= world.settings.winners) {
    world.finished = true
    world.events.push({ type: 'finish', tick: world.tick })
  }
  return world.finished
}
