import { CLASSES } from '../classes'
import { CONFIG, DT } from '../config'
import type { Projectile, World } from '../types'
import { applyDamage, applySplash } from './damage'

/**
 * 戰鬥：冷卻結束且目標在攻擊距離內的小人出手。
 * 本 tick 的出手順序用 rng 洗牌後逐一結算；已死亡的小人不能出手，所以不會同歸於盡。
 * 近戰立即命中；遠程產生投射物，命中由 projectileSystem 處理。
 * 回傳 true 表示對戰已結束。
 */
export function combatSystem(world: World): boolean {
  const { units, rng, scratch: ready } = world
  ready.length = 0

  for (let i = 0; i < units.length; i++) {
    const u = units[i]
    if (!u?.alive) continue
    if (u.cooldown > 0) u.cooldown -= DT
    if (u.cooldown > 0) continue
    const t = u.target >= 0 ? units[u.target] : undefined
    if (!t?.alive) continue
    const range = CLASSES[u.classId].range
    const dx = t.x - u.x
    const dy = t.y - u.y
    if (dx * dx + dy * dy <= range * range) ready.push(i)
  }

  // Fisher–Yates 洗牌
  for (let i = ready.length - 1; i > 0; i--) {
    const j = rng.int(0, i)
    const tmp = ready[i] as number
    ready[i] = ready[j] as number
    ready[j] = tmp
  }

  for (const i of ready) {
    const u = units[i]
    if (!u?.alive) continue
    const t = units[u.target]
    if (!t?.alive) continue
    const stats = CLASSES[u.classId]

    const crit = rng.next() < stats.critChance
    const base = rng.int(stats.damageMin, stats.damageMax)
    const damage = crit ? base * stats.critMultiplier : base
    u.lastAttackTick = world.tick
    u.attackCount++
    u.cooldown =
      stats.cooldown + rng.range(-CONFIG.attackCooldownJitter, CONFIG.attackCooldownJitter)

    if (stats.projectileSpeed > 0) {
      spawnProjectile(world, i, u.target, damage, crit)
      continue
    }

    const target = u.target
    if (stats.spinEvery > 0 && u.attackCount % stats.spinEvery === 0) {
      // 旋風斬：主要目標吃滿傷害，周圍其他人吃部分傷害
      world.events.push({ type: 'spin', tick: world.tick, attacker: i, radius: stats.spinRadius })
      if (applyDamage(world, i, target, damage, crit)) return true
      if (applySplash(world, i, u.x, u.y, stats.spinRadius, damage * stats.spinRatio, target)) {
        return true
      }
    } else if (applyDamage(world, i, target, damage, crit)) {
      return true
    }
  }
  return false
}

function spawnProjectile(
  world: World,
  owner: number,
  target: number,
  damage: number,
  crit: boolean,
): void {
  const u = world.units[owner]
  const t = world.units[target]
  if (!u || !t) return
  const stats = CLASSES[u.classId]

  let p: Projectile | undefined = world.projectiles.find((q) => !q.active)
  if (!p) {
    p = {
      active: false,
      kind: 'arrow',
      owner: 0,
      target: 0,
      x: 0,
      y: 0,
      prevX: 0,
      prevY: 0,
      destX: 0,
      destY: 0,
      speed: 0,
      damage: 0,
      crit: false,
      splashRadius: 0,
      splashRatio: 0,
    }
    world.projectiles.push(p)
  }
  p.active = true
  p.kind = stats.splashRadius > 0 ? 'fireball' : 'arrow'
  p.owner = owner
  p.target = target
  p.x = u.x
  p.y = u.y
  p.prevX = u.x
  p.prevY = u.y
  p.destX = t.x
  p.destY = t.y
  p.speed = stats.projectileSpeed
  p.damage = damage
  p.crit = crit
  p.splashRadius = stats.splashRadius
  p.splashRatio = stats.splashRatio
  world.events.push({ type: 'shoot', tick: world.tick, attacker: owner, kind: p.kind })
}
