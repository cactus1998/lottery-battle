import { afterEach, describe, expect, it } from 'vitest'
import { CLASSES, type ClassId, type ClassStats, type SkillId } from '../classes'
import { CONFIG, DT } from '../config'
import type { World } from '../types'
import { createWorld, step, stepUntilEnd } from '../world'
import { combatSystem } from './combat'
import { applyDamage, applySplash, HIT_MELEE, HIT_SINGLE } from './damage'
import { movementSystem } from './movement'
import { projectileSystem } from './projectiles'

/** 測試中暫時覆寫的職業數值，afterEach 還原 */
const overrides: [ClassId, Partial<ClassStats>][] = []

function patch(id: ClassId, values: Partial<ClassStats>): void {
  const stats = CLASSES[id]
  const backup: Partial<ClassStats> = {}
  for (const key of Object.keys(values) as (keyof ClassStats)[]) {
    ;(backup as Record<string, unknown>)[key] = stats[key]
  }
  overrides.push([id, backup])
  Object.assign(stats, values)
}

afterEach(() => {
  for (const [id, backup] of overrides.reverse()) Object.assign(CLASSES[id], backup)
  overrides.length = 0
})

/**
 * 建立指定職業與位置的小 world：全員冷卻歸零、不會自然觸發技能以外的隨機，
 * 由測試手動指定目標。winners = 0 讓對戰不會因為死人而結束。
 */
function arena(units: { classId: ClassId; x: number; y: number }[]): World {
  const world = createWorld({
    entrants: units.map((_, i) => ({ id: i, label: String(i + 1) })),
    settings: { winners: 0 },
    seed: 42,
  })
  world.finished = false
  units.forEach((spec, i) => {
    const u = world.units[i]!
    const stats = CLASSES[spec.classId]
    Object.assign(u, {
      classId: spec.classId,
      x: spec.x,
      y: spec.y,
      prevX: spec.x,
      prevY: spec.y,
      hp: stats.maxHp,
      maxHp: stats.maxHp,
      cooldown: 0,
      target: -1,
      retargetTimer: 999,
    })
  })
  world.grid.rebuild(world.units)
  return world
}

function skills(world: World): SkillId[] {
  return world.events.flatMap((e) => (e.type === 'skill' ? [e.skill] : []))
}

/** 只讓 attacker 出手：其他人的冷卻設很大 */
function onlyAttacker(world: World, attacker: number, target: number): void {
  for (const u of world.units) u.cooldown = 999
  const a = world.units[attacker]!
  a.cooldown = 0
  a.target = target
}

describe('active skills', () => {
  it('spin hits the target fully and nearby enemies partially', () => {
    patch('swordsman', { activeChance: 1, critChance: 0, damageMin: 20, damageMax: 20 })
    patch('knight', { armor: 0, blockChance: 0 })
    const world = arena([
      { classId: 'swordsman', x: 500, y: 500 },
      { classId: 'knight', x: 530, y: 500 },
      { classId: 'knight', x: 500, y: 530 },
      { classId: 'knight', x: 800, y: 800 },
    ])
    onlyAttacker(world, 0, 1)
    combatSystem(world)
    const [, main, near, far] = world.units
    const stats = CLASSES.swordsman
    expect(skills(world)).toContain('spin')
    expect(main!.maxHp - main!.hp).toBe(20)
    expect(near!.maxHp - near!.hp).toBe(Math.round(20 * stats.spinRatio))
    expect(far!.hp).toBe(far!.maxHp)
  })

  it('shield bash stuns the target: no movement or attacks until the stun ends', () => {
    patch('knight', { activeChance: 1, critChance: 0 })
    patch('swordsman', { activeChance: 0 })
    const world = arena([
      { classId: 'knight', x: 500, y: 500 },
      { classId: 'swordsman', x: 530, y: 500 },
    ])
    onlyAttacker(world, 0, 1)
    combatSystem(world)
    const victim = world.units[1]!
    expect(skills(world)).toContain('shieldBash')
    expect(victim.stunTimer).toBe(CLASSES.knight.stunSec)

    // 讓受害者想追打：目標設成騎士並拉開距離
    victim.target = 0
    victim.cooldown = 0
    victim.x = 700
    const ticks = Math.floor(CLASSES.knight.stunSec / DT) - 1
    for (let i = 0; i < ticks; i++) {
      world.units[0]!.cooldown = 999
      movementSystem(world)
      combatSystem(world)
    }
    expect(victim.x).toBe(700)
    expect(victim.lastAttackTick).toBe(-100)

    for (let i = 0; i < 3; i++) {
      world.units[0]!.cooldown = 999
      combatSystem(world)
      movementSystem(world)
    }
    expect(victim.stunTimer).toBeLessThanOrEqual(0)
    expect(victim.x).toBeLessThan(700)
  })

  it('repeated stuns take the longer duration instead of stacking', () => {
    patch('knight', { activeChance: 1 })
    const world = arena([
      { classId: 'knight', x: 500, y: 500 },
      { classId: 'swordsman', x: 530, y: 500 },
    ])
    world.units[1]!.stunTimer = 5
    onlyAttacker(world, 0, 1)
    combatSystem(world)
    // 同 tick 先倒數一次，盾擊的較短暈眩不覆蓋
    expect(world.units[1]!.stunTimer).toBeCloseTo(5 - DT)
  })

  it('charged shot fires a faster, stronger arrow', () => {
    patch('archer', { activeChance: 1, critChance: 0, damageMin: 20, damageMax: 20 })
    const world = arena([
      { classId: 'archer', x: 500, y: 500 },
      { classId: 'knight', x: 600, y: 500 },
    ])
    onlyAttacker(world, 0, 1)
    combatSystem(world)
    const stats = CLASSES.archer
    const p = world.projectiles.find((q) => q.active)
    expect(skills(world)).toContain('chargedShot')
    expect(p).toMatchObject({
      kind: 'chargedArrow',
      damage: 20 * stats.chargedDamageMul,
      speed: stats.projectileSpeed * stats.chargedSpeedMul,
    })
  })

  it('magic missile ignores armor and cannot be blocked, and does not explode', () => {
    patch('mage', { activeChance: 1, critChance: 0, damageMin: 20, damageMax: 20 })
    patch('knight', { blockChance: 1, activeChance: 0 })
    const world = arena([
      { classId: 'mage', x: 500, y: 500 },
      { classId: 'knight', x: 560, y: 500 },
    ])
    onlyAttacker(world, 0, 1)
    combatSystem(world)
    expect(skills(world)).toContain('magicMissile')
    expect(world.projectiles.find((p) => p.active)?.kind).toBe('missile')
    const knight = world.units[1]!
    for (let i = 0; i < 30 && knight.hp === knight.maxHp; i++) projectileSystem(world)
    expect(knight.maxHp - knight.hp).toBe(Math.round(20 * CLASSES.mage.missileDamageMul))
    expect(world.events.some((e) => e.type === 'explode')).toBe(false)
    expect(skills(world)).not.toContain('block')
  })

  it('execute kills a low-HP target and cannot be blocked', () => {
    patch('assassin', { activeChance: 1 })
    patch('knight', { blockChance: 1 })
    const world = arena([
      { classId: 'assassin', x: 500, y: 500 },
      { classId: 'knight', x: 530, y: 500 },
    ])
    const victim = world.units[1]!
    victim.hp = Math.floor(victim.maxHp * CLASSES.assassin.executeHpRatio)
    onlyAttacker(world, 0, 1)
    combatSystem(world)
    expect(skills(world)).toContain('execute')
    expect(victim.alive).toBe(false)
  })

  it('execute does not trigger on a healthy target', () => {
    patch('assassin', { activeChance: 1 })
    const world = arena([
      { classId: 'assassin', x: 500, y: 500 },
      { classId: 'knight', x: 530, y: 500 },
    ])
    onlyAttacker(world, 0, 1)
    combatSystem(world)
    expect(skills(world)).not.toContain('execute')
  })
})

describe('passive skills', () => {
  it('dodge negates single-target damage but not splash', () => {
    patch('assassin', { dodgeChance: 1 })
    const world = arena([
      { classId: 'knight', x: 500, y: 500 },
      { classId: 'assassin', x: 530, y: 500 },
    ])
    const victim = world.units[1]!
    applyDamage(world, 0, 1, 50, false, HIT_SINGLE)
    expect(victim.hp).toBe(victim.maxHp)
    expect(skills(world)).toEqual(['dodge'])

    applySplash(world, 0, 500, 500, 100, 50, -1)
    expect(victim.hp).toBeLessThan(victim.maxHp)
  })

  it('block negates single-target damage', () => {
    patch('knight', { blockChance: 1 })
    const world = arena([
      { classId: 'swordsman', x: 500, y: 500 },
      { classId: 'knight', x: 530, y: 500 },
    ])
    applyDamage(world, 0, 1, 50, false, HIT_SINGLE | HIT_MELEE)
    expect(world.units[1]!.hp).toBe(world.units[1]!.maxHp)
    expect(skills(world)).toEqual(['block'])
  })

  it('fury triggers once below the HP threshold, boosting damage dealt and taken', () => {
    patch('swordsman', { activeChance: 0, critChance: 0, damageMin: 20, damageMax: 20 })
    patch('knight', { armor: 0, blockChance: 0, activeChance: 0 })
    const world = arena([
      { classId: 'swordsman', x: 500, y: 500 },
      { classId: 'knight', x: 530, y: 500 },
    ])
    const warrior = world.units[0]!
    const stats = CLASSES.swordsman
    const hit = warrior.maxHp - Math.floor(warrior.maxHp * stats.furyHpRatio)
    applyDamage(world, 1, 0, hit, false)
    expect(warrior.fury).toBe(true)
    const before = warrior.hp
    applyDamage(world, 1, 0, 100, false)
    expect(before - warrior.hp).toBe(Math.round(100 * stats.furyTakenMul))
    expect(skills(world).filter((s) => s === 'fury')).toHaveLength(1)

    const knight = world.units[1]!
    onlyAttacker(world, 0, 1)
    combatSystem(world)
    expect(knight.maxHp - knight.hp).toBe(Math.round(20 * stats.furyDamageMul))
  })

  it('mongoose dashes the ranger away from a melee attacker, then cools down', () => {
    patch('archer', { mongooseChance: 1 })
    const world = arena([
      { classId: 'swordsman', x: 500, y: 500 },
      { classId: 'archer', x: 520, y: 500 },
    ])
    const ranger = world.units[1]!
    applyDamage(world, 0, 1, 10, false, HIT_SINGLE | HIT_MELEE)
    expect(skills(world)).toContain('mongoose')
    expect(ranger.x).toBeCloseTo(520 + CLASSES.archer.mongooseDistance)
    expect(ranger.prevX).toBe(ranger.x)
    expect(ranger.mongooseCooldown).toBe(CLASSES.archer.mongooseCooldown)

    world.events.length = 0
    applyDamage(world, 0, 1, 10, false, HIT_SINGLE | HIT_MELEE)
    expect(skills(world)).not.toContain('mongoose')
  })

  it('mongoose is clamped inside the arena', () => {
    patch('archer', { mongooseChance: 1 })
    const edge = CONFIG.arenaSize - 20
    const world = arena([
      { classId: 'swordsman', x: edge - 20, y: 500 },
      { classId: 'archer', x: edge, y: 500 },
    ])
    applyDamage(world, 0, 1, 10, false, HIT_MELEE)
    expect(world.units[1]!.x).toBe(CONFIG.arenaSize - CONFIG.unitRadius)
  })

  it('mongoose does not trigger from ranged damage', () => {
    patch('archer', { mongooseChance: 1 })
    const world = arena([
      { classId: 'mage', x: 400, y: 500 },
      { classId: 'archer', x: 520, y: 500 },
    ])
    applyDamage(world, 0, 1, 10, false, HIT_SINGLE)
    expect(skills(world)).not.toContain('mongoose')
  })

  it('mana shield absorbs one hit including splash, then recharges', () => {
    const world = arena([
      { classId: 'swordsman', x: 500, y: 500 },
      { classId: 'mage', x: 530, y: 500 },
    ])
    const mage = world.units[1]!
    applySplash(world, 0, 500, 500, 100, 50, -1)
    expect(mage.hp).toBe(mage.maxHp)
    expect(skills(world)).toEqual(['manaShield'])
    expect(mage.shieldCooldown).toBe(CLASSES.mage.manaShieldCooldown)

    applyDamage(world, 0, 1, 50, false, HIT_SINGLE)
    expect(mage.hp).toBeLessThan(mage.maxHp)

    mage.shieldCooldown = 0
    const hp = mage.hp
    applyDamage(world, 0, 1, 50, false, HIT_SINGLE)
    expect(mage.hp).toBe(hp)
  })

  it('mana shield does not stop execute', () => {
    patch('assassin', { activeChance: 1 })
    const world = arena([
      { classId: 'assassin', x: 500, y: 500 },
      { classId: 'mage', x: 530, y: 500 },
    ])
    const mage = world.units[1]!
    mage.hp = Math.floor(mage.maxHp * CLASSES.assassin.executeHpRatio)
    onlyAttacker(world, 0, 1)
    combatSystem(world)
    expect(mage.alive).toBe(false)
  })
})

describe('determinism with skills', () => {
  it('replays the same skill events, ranking and ticks for the same seed', () => {
    const run = () => {
      const world = createWorld({
        entrants: Array.from({ length: 40 }, (_, i) => ({ id: i, label: String(i + 1) })),
        settings: { winners: 3 },
        seed: 77,
      })
      const log: string[] = []
      while (!world.finished) {
        step(world)
        for (const e of world.events)
          if (e.type === 'skill') log.push(`${e.tick}:${e.unit}:${e.skill}`)
        world.events.length = 0
      }
      return { log, result: stepUntilEnd(world) }
    }
    const a = run()
    const b = run()
    expect(a.log.length).toBeGreaterThan(0)
    expect(a).toEqual(b)
  })
})
