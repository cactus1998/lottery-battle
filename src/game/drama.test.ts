import { describe, expect, it } from 'vitest'
import { killUnit } from '@/engine/systems/death'
import { createWorld } from '@/engine/world'
import { dramaLevel } from './drama'

function world(n: number, winners: number) {
  return createWorld({
    entrants: Array.from({ length: n }, (_, i) => ({ id: i, label: String(i + 1) })),
    settings: { winners },
    seed: 1,
  })
}

describe('dramaLevel', () => {
  it('is none while many are alive', () => {
    expect(dramaLevel(world(10, 1))).toBe('none')
  })

  it('becomes final when winners + 2 remain', () => {
    const w = world(10, 1)
    for (let i = 0; i < 7; i++) killUnit(w, i, null)
    expect(w.aliveCount).toBe(3)
    expect(dramaLevel(w)).toBe('final')
  })

  it('becomes matchPoint when one kill away and someone is low on HP', () => {
    const w = world(10, 1)
    for (let i = 0; i < 8; i++) killUnit(w, i, null)
    expect(dramaLevel(w)).toBe('final')
    const u = w.units[9]!
    u.hp = u.maxHp * 0.2
    expect(dramaLevel(w)).toBe('matchPoint')
  })

  it('does not start in final for tiny battles before anyone falls', () => {
    expect(dramaLevel(world(3, 1))).toBe('none')
  })

  it('is finished once the battle ends', () => {
    const w = world(3, 1)
    killUnit(w, 0, null)
    killUnit(w, 1, null)
    expect(dramaLevel(w)).toBe('finished')
  })
})
