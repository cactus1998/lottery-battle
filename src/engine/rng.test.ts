import { describe, expect, it } from 'vitest'
import { createRng } from './rng'

describe('createRng', () => {
  it('produces the same sequence for the same seed', () => {
    const a = createRng(42)
    const b = createRng(42)
    const seqA = Array.from({ length: 5 }, () => a.next())
    const seqB = Array.from({ length: 5 }, () => b.next())
    expect(seqA).toEqual(seqB)
  })

  it('produces different sequences for different seeds', () => {
    expect(createRng(1).next()).not.toBe(createRng(2).next())
  })

  it('keeps int() within inclusive bounds', () => {
    const rng = createRng(7)
    for (let i = 0; i < 1000; i++) {
      const n = rng.int(1, 6)
      expect(n).toBeGreaterThanOrEqual(1)
      expect(n).toBeLessThanOrEqual(6)
    }
  })
})
