import { describe, expect, it } from 'vitest'
import { CONFIG } from './config'
import { damageMultiplierAt } from './systems/overtime'
import { SpatialGrid } from './spatialGrid'
import type { BattleConfig, Entrant } from './types'
import { createWorld, step, stepUntilEnd } from './world'

function entrants(n: number): Entrant[] {
  return Array.from({ length: n }, (_, i) => ({ id: i, label: String(i + 1) }))
}

function config(n: number, winners = 1, seed = 1): BattleConfig {
  return { entrants: entrants(n), settings: { winners }, seed }
}

describe('createWorld', () => {
  it('spawns every entrant alive inside the arena', () => {
    const world = createWorld(config(50))
    expect(world.units).toHaveLength(50)
    for (const u of world.units) {
      expect(u.alive).toBe(true)
      expect(u.hp).toBe(u.maxHp)
      expect(u.x).toBeGreaterThanOrEqual(CONFIG.spawnMargin)
      expect(u.x).toBeLessThanOrEqual(CONFIG.arenaSize - CONFIG.spawnMargin)
    }
  })

  it('places units identically for the same seed', () => {
    const a = createWorld(config(10, 1, 99))
    const b = createWorld(config(10, 1, 99))
    expect(a.units.map((u) => [u.x, u.y])).toEqual(b.units.map((u) => [u.x, u.y]))
  })
})

describe('stepUntilEnd', () => {
  it('is deterministic for the same seed', () => {
    const a = stepUntilEnd(createWorld(config(40, 3, 7)))
    const b = stepUntilEnd(createWorld(config(40, 3, 7)))
    expect(a).toEqual(b)
  })

  it('gives different results for different seeds', () => {
    const a = stepUntilEnd(createWorld(config(40, 1, 1)))
    const b = stepUntilEnd(createWorld(config(40, 1, 2)))
    expect(a.ranking.map((r) => r.id)).not.toEqual(b.ranking.map((r) => r.id))
  })

  it('matches stepping tick by tick', () => {
    const world = createWorld(config(30, 2, 5))
    while (!world.finished) step(world)
    const viaLoop = world.tick
    const viaEnd = stepUntilEnd(createWorld(config(30, 2, 5))).ticks
    expect(viaLoop).toBe(viaEnd)
  })

  it.each([
    [2, 1],
    [10, 9],
    [50, 3],
    [300, 1],
    [300, 10],
  ])('ends with exactly the winner count (%i entrants, %i winners)', (n, winners) => {
    const result = stepUntilEnd(createWorld(config(n, winners, n * 31 + winners)))
    expect(result.ranking.filter((r) => r.winner)).toHaveLength(winners)
    expect(result.ranking).toHaveLength(n)
    expect(result.ranking.map((r) => r.rank)).toEqual(Array.from({ length: n }, (_, i) => i + 1))
    // 延長賽保證在 maxTicks 安全上限前就結束
    expect(result.ticks).toBeLessThan(CONFIG.maxTicks)
  })

  it('ranks later deaths higher', () => {
    const result = stepUntilEnd(createWorld(config(20, 1, 3)))
    const fallen = result.ranking.filter((r) => !r.winner)
    for (let i = 1; i < fallen.length; i++) {
      expect(fallen[i - 1]!.survivedSec).toBeGreaterThanOrEqual(fallen[i]!.survivedSec)
    }
  })

  it('counts every kill exactly once', () => {
    const result = stepUntilEnd(createWorld(config(60, 1, 11)))
    const kills = result.ranking.reduce((sum, r) => sum + r.kills, 0)
    // 被毒圈淘汰的不算任何人的擊殺
    expect(kills).toBeLessThanOrEqual(59)
    expect(kills).toBeGreaterThan(0)
  })

  it('fights down to a single survivor regardless of prize count', () => {
    const world = createWorld(config(30, 4, 7))
    const result = stepUntilEnd(world)
    expect(world.aliveCount).toBe(1)
    expect(result.ranking.filter((r) => r.winner).map((r) => r.rank)).toEqual([1, 2, 3, 4])
    // 第 2 名是最後倒下的人
    expect(result.ranking[1]!.id).toBe(world.deathOrder.at(-1))
  })

  it('does nothing with a single entrant', () => {
    const world = createWorld(config(1, 1))
    expect(world.finished).toBe(true)
    step(world)
    expect(world.tick).toBe(0)
  })
})

describe('classes', () => {
  it('deals classes evenly (counts differ by at most 1)', () => {
    const world = createWorld(config(23))
    const counts = new Map<string, number>()
    for (const u of world.units) counts.set(u.classId, (counts.get(u.classId) ?? 0) + 1)
    expect(counts.size).toBe(5)
    const values = [...counts.values()]
    expect(Math.max(...values) - Math.min(...values)).toBeLessThanOrEqual(1)
  })

  it('assigns the same classes for the same seed', () => {
    const a = createWorld(config(30, 1, 8)).units.map((u) => u.classId)
    const b = createWorld(config(30, 1, 8)).units.map((u) => u.classId)
    expect(a).toEqual(b)
  })
})

describe('overtime', () => {
  it('doubles damage after the overtime start', () => {
    expect(damageMultiplierAt(CONFIG.overtime.startTime - 1)).toBe(1)
    expect(damageMultiplierAt(CONFIG.overtime.startTime)).toBe(2)
    expect(damageMultiplierAt(CONFIG.overtime.startTime + CONFIG.overtime.interval)).toBe(3)
  })
})

describe('SpatialGrid.nearest', () => {
  it('finds the closest alive unit, matching brute force', () => {
    const world = createWorld(config(200, 1, 42))
    const grid = new SpatialGrid(CONFIG.arenaSize, CONFIG.gridCellSize)
    world.units[5]!.alive = false
    grid.rebuild(world.units)
    for (let i = 0; i < world.units.length; i += 7) {
      const me = world.units[i]!
      let best = -1
      let bestD2 = Infinity
      world.units.forEach((u, j) => {
        if (j === i || !u.alive) return
        const d2 = (u.x - me.x) ** 2 + (u.y - me.y) ** 2
        if (d2 < bestD2) {
          best = j
          bestD2 = d2
        }
      })
      expect(grid.nearest(world.units, i)).toBe(best)
    }
  })
})
