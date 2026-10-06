import { CONFIG, DT } from '../config'
import type { World } from '../types'

const { startTime, interval } = CONFIG.overtime

/** 依時間計算延長賽傷害倍率：startTime 前為 1，之後每 interval 秒 +1。 */
export function damageMultiplierAt(time: number): number {
  if (time < startTime) return 1
  return 2 + Math.floor((time - startTime) / interval)
}

export function overtimeSystem(world: World): void {
  const next = damageMultiplierAt(world.tick * DT)
  if (next !== world.damageMultiplier) {
    world.damageMultiplier = next
    world.events.push({ type: 'overtime', tick: world.tick, multiplier: next })
  }
}
