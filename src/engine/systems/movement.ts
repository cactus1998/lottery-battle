import { CLASSES } from '../classes'
import { CONFIG, DT } from '../config'
import type { World } from '../types'

const MIN_GAP = CONFIG.unitRadius * 2
const LIMIT_MIN = CONFIG.unitRadius
const LIMIT_MAX = CONFIG.arenaSize - CONFIG.unitRadius

/**
 * 移動：
 * - 近戰走向目標，停在攻擊距離內一點點，避免在邊界來回抖動。
 * - 遠程走到射程內就停下；目標太靠近（retreatRange 內）時往反方向後退。
 * - 暈眩中不主動移動（仍會被碰撞分離推開）。
 * 之後做一次簡單的碰撞分離，避免小人疊在一起。
 */
export function movementSystem(world: World): void {
  const { units } = world

  for (const u of units) {
    if (!u.alive || u.stunTimer > 0) continue
    const t = u.target >= 0 ? units[u.target] : undefined
    if (!t?.alive) continue
    const stats = CLASSES[u.classId]

    const dx = t.x - u.x
    const dy = t.y - u.y
    const dist = Math.hypot(dx, dy)
    u.facing = Math.atan2(dy, dx)
    if (dist === 0) continue

    const step = stats.speed * DT
    const stopAt = stats.range * 0.85
    if (dist > stopAt) {
      const move = Math.min(step, dist - stopAt)
      u.x += (dx / dist) * move
      u.y += (dy / dist) * move
    } else if (dist < stats.retreatRange) {
      // 後退速度打七折，近戰追得上，避免無限風箏
      u.x -= (dx / dist) * step * 0.7
      u.y -= (dy / dist) * step * 0.7
    }
  }

  // 分離兩次：人群擠在一起時一次推不開
  separate(world)
  separate(world)
}

function separate(world: World): void {
  const { units, grid, neighbors } = world
  for (let i = 0; i < units.length; i++) {
    const a = units[i]
    if (!a?.alive) continue
    grid.queryInto(a.x, a.y, MIN_GAP, neighbors)
    for (const j of neighbors) {
      if (j <= i) continue
      const b = units[j]
      if (!b?.alive) continue
      const dx = b.x - a.x
      const dy = b.y - a.y
      const d2 = dx * dx + dy * dy
      if (d2 >= MIN_GAP * MIN_GAP) continue
      const d = Math.sqrt(d2)
      // 完全重疊時用固定方向推開，維持決定性
      const nx = d > 0 ? dx / d : 1
      const ny = d > 0 ? dy / d : 0
      const push = (MIN_GAP - d) / 2
      a.x -= nx * push
      a.y -= ny * push
      b.x += nx * push
      b.y += ny * push
    }
  }
  for (const u of units) {
    if (!u.alive) continue
    u.x = u.x < LIMIT_MIN ? LIMIT_MIN : u.x > LIMIT_MAX ? LIMIT_MAX : u.x
    u.y = u.y < LIMIT_MIN ? LIMIT_MIN : u.y > LIMIT_MAX ? LIMIT_MAX : u.y
  }
}
