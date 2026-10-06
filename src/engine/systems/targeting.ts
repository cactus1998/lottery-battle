import { CLASSES } from '../classes'
import { CONFIG, DT } from '../config'
import type { World } from '../types'

/** 每隔 retargetInterval 秒，或目標死亡時，重新鎖定目標。 */
export function targetingSystem(world: World): void {
  const { units, grid } = world
  for (let i = 0; i < units.length; i++) {
    const u = units[i]
    if (!u?.alive) continue
    u.retargetTimer -= DT
    const current = u.target >= 0 ? units[u.target] : undefined
    if (u.retargetTimer <= 0 || !current?.alive) {
      const huntRadius = CLASSES[u.classId].huntRadius
      const hunted = huntRadius > 0 ? nearestRanged(world, i, huntRadius) : -1
      u.target = hunted >= 0 ? hunted : grid.nearest(units, i)
      u.retargetTimer = CONFIG.retargetInterval
    }
  }
}

/** 半徑內最近的遠程職業（弓箭手、法師）；同距離取索引小者，與格子內順序無關。 */
function nearestRanged(world: World, self: number, radius: number): number {
  const { units, grid, neighbors } = world
  const me = units[self]
  if (!me) return -1
  grid.queryInto(me.x, me.y, radius, neighbors)
  let best = -1
  let bestD2 = radius * radius
  for (const j of neighbors) {
    if (j === self) continue
    const u = units[j]
    if (!u?.alive || CLASSES[u.classId].projectileSpeed === 0) continue
    const dx = u.x - me.x
    const dy = u.y - me.y
    const d2 = dx * dx + dy * dy
    if (d2 < bestD2 || (d2 === bestD2 && j < best)) {
      best = j
      bestD2 = d2
    }
  }
  return best
}
