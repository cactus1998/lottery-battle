import { CLASSES } from '../classes'
import { CONFIG, DT } from '../config'
import type { Projectile, ProjectileKind, World } from '../types'
import { applyDamage, applySplash, HIT_MELEE, HIT_SINGLE, HIT_TRUE, pushSkill } from './damage'

/**
 * 戰鬥：冷卻結束且目標在攻擊距離內的小人出手。
 * 本 tick 的出手順序用 rng 洗牌後逐一結算；已死亡的小人不能出手，所以不會同歸於盡。
 * 暈眩中的小人不出手、冷卻不倒數（貓鼬與魔法盾的冷卻照常倒數）。
 * 每次出手的擲骰順序固定：爆擊 → 傷害 → 冷卻抖動 → 主動技能。
 * 近戰立即命中；遠程產生投射物，命中由 projectileSystem 處理。
 * 回傳 true 表示對戰已結束。
 */
export function combatSystem(world: World): boolean {
  const { units, rng, scratch: ready } = world
  ready.length = 0

  for (let i = 0; i < units.length; i++) {
    const u = units[i]
    if (!u?.alive) continue
    if (u.mongooseCooldown > 0) u.mongooseCooldown -= DT
    if (u.shieldCooldown > 0) u.shieldCooldown -= DT
    if (u.stunTimer > 0) {
      u.stunTimer -= DT
      continue
    }
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
    const target = u.target
    const t = units[target]
    if (!t?.alive) continue
    const stats = CLASSES[u.classId]

    const crit = rng.next() < stats.critChance
    const base = rng.int(stats.damageMin, stats.damageMax)
    let damage = crit ? base * stats.critMultiplier : base
    if (u.fury) damage *= stats.furyDamageMul
    u.lastAttackTick = world.tick
    u.attackCount++
    u.cooldown =
      stats.cooldown + rng.range(-CONFIG.attackCooldownJitter, CONFIG.attackCooldownJitter)

    // 處決只在目標殘血時擲骰
    const canTrigger =
      stats.activeChance > 0 &&
      (stats.activeSkill !== 'execute' || t.hp <= t.maxHp * stats.executeHpRatio)
    const skill = canTrigger && rng.next() < stats.activeChance

    if (stats.projectileSpeed > 0) {
      let kind: ProjectileKind = stats.splashRadius > 0 ? 'fireball' : 'arrow'
      let speed = stats.projectileSpeed
      let shot = damage
      let splashRadius = stats.splashRadius
      let splashRatio = stats.splashRatio
      let pierce = false
      if (skill && stats.activeSkill === 'chargedShot') {
        kind = 'chargedArrow'
        shot *= stats.chargedDamageMul
        speed *= stats.chargedSpeedMul
      } else if (skill && stats.activeSkill === 'magicMissile') {
        // 魔法箭取代火球：不爆炸，改為無視護甲且無法閃避格擋
        kind = 'missile'
        shot *= stats.missileDamageMul
        speed = stats.missileSpeed
        splashRadius = 0
        splashRatio = 0
        pierce = true
      }
      if (skill) pushSkill(world, i, stats.activeSkill)
      spawnProjectile(world, i, target, kind, shot, crit, speed, splashRadius, splashRatio, pierce)
      continue
    }

    if (!skill) {
      if (applyDamage(world, i, target, damage, crit, HIT_SINGLE | HIT_MELEE)) return true
      continue
    }

    pushSkill(world, i, stats.activeSkill)
    switch (stats.activeSkill) {
      case 'spin':
        // 旋風斬：主要目標吃滿傷害，周圍其他人吃部分傷害
        world.events.push({ type: 'spin', tick: world.tick, attacker: i, radius: stats.spinRadius })
        if (applyDamage(world, i, target, damage, crit, HIT_SINGLE | HIT_MELEE)) return true
        if (
          applySplash(
            world,
            i,
            u.x,
            u.y,
            stats.spinRadius,
            damage * stats.spinRatio,
            target,
            HIT_MELEE,
          )
        ) {
          return true
        }
        break
      case 'shieldBash': {
        const hpBefore = t.hp
        if (applyDamage(world, i, target, damage, crit, HIT_SINGLE | HIT_MELEE)) return true
        // 被格擋 / 閃避時不暈眩；重複暈眩取較大值，不疊加
        if (t.alive && t.hp < hpBefore && stats.stunSec > t.stunTimer) t.stunTimer = stats.stunSec
        break
      }
      case 'execute':
        if (applyDamage(world, i, target, t.hp, false, HIT_TRUE)) return true
        break
      default:
        if (applyDamage(world, i, target, damage, crit, HIT_SINGLE | HIT_MELEE)) return true
    }
  }
  return false
}

function spawnProjectile(
  world: World,
  owner: number,
  target: number,
  kind: ProjectileKind,
  damage: number,
  crit: boolean,
  speed: number,
  splashRadius: number,
  splashRatio: number,
  pierce: boolean,
): void {
  const u = world.units[owner]
  const t = world.units[target]
  if (!u || !t) return

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
      pierce: false,
    }
    world.projectiles.push(p)
  }
  p.active = true
  p.kind = kind
  p.owner = owner
  p.target = target
  p.x = u.x
  p.y = u.y
  p.prevX = u.x
  p.prevY = u.y
  p.destX = t.x
  p.destY = t.y
  p.speed = speed
  p.damage = damage
  p.crit = crit
  p.splashRadius = splashRadius
  p.splashRatio = splashRatio
  p.pierce = pierce
  world.events.push({ type: 'shoot', tick: world.tick, attacker: owner, kind })
}
