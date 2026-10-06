import { CONFIG, DT } from '../config'
import type { World } from '../types'
import { applyDamage, applySplash } from './damage'

const HIT_RADIUS = CONFIG.unitRadius

/**
 * 投射物：追蹤目標目前位置飛行，抵達時命中。
 * 目標在飛行途中死亡時，飛到最後已知位置：火球照樣爆炸，箭矢直接消失。
 * 依物件池索引順序結算，維持決定性。回傳 true 表示對戰已結束。
 */
export function projectileSystem(world: World): boolean {
  const { units, projectiles } = world
  for (const p of projectiles) {
    if (!p.active) continue
    p.prevX = p.x
    p.prevY = p.y

    const t = units[p.target]
    if (t?.alive) {
      p.destX = t.x
      p.destY = t.y
    }
    const dx = p.destX - p.x
    const dy = p.destY - p.y
    const dist = Math.hypot(dx, dy)
    const step = p.speed * DT
    if (dist > step + HIT_RADIUS) {
      p.x += (dx / dist) * step
      p.y += (dy / dist) * step
      continue
    }

    p.x = p.destX
    p.y = p.destY
    p.active = false
    const targetAlive = t?.alive === true

    if (p.splashRadius > 0) {
      world.events.push({
        type: 'explode',
        tick: world.tick,
        x: p.x,
        y: p.y,
        radius: p.splashRadius,
      })
      if (targetAlive && applyDamage(world, p.owner, p.target, p.damage, p.crit)) return true
      if (
        applySplash(world, p.owner, p.x, p.y, p.splashRadius, p.damage * p.splashRatio, p.target)
      ) {
        return true
      }
    } else if (targetAlive && applyDamage(world, p.owner, p.target, p.damage, p.crit)) {
      return true
    }
  }
  return false
}
