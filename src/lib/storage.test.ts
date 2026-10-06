import { beforeEach, describe, expect, it, vi } from 'vitest'
import { loadStored, saveStored } from './storage'

const isNumberArray = (d: unknown): d is number[] =>
  Array.isArray(d) && d.every((n) => typeof n === 'number')

describe('storage', () => {
  beforeEach(() => localStorage.clear())

  it('round-trips data with the same version', () => {
    expect(saveStored('k', 1, [1, 2])).toBe(true)
    expect(loadStored('k', 1, [], isNumberArray)).toEqual([1, 2])
  })

  it('returns fallback when the version differs', () => {
    saveStored('k', 1, [1])
    expect(loadStored('k', 2, [9], isNumberArray)).toEqual([9])
  })

  it('returns fallback for broken JSON', () => {
    localStorage.setItem('lottery-battle:k', '{oops')
    expect(loadStored('k', 1, [], isNumberArray)).toEqual([])
  })

  it('returns fallback when validation fails', () => {
    saveStored('k', 1, ['x'])
    expect(loadStored('k', 1, [], isNumberArray)).toEqual([])
  })

  it('does not throw when storage is unavailable', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })
    expect(saveStored('k', 1, [1])).toBe(false)
  })
})
