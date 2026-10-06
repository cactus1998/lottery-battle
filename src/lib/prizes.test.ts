import { describe, expect, it } from 'vitest'
import { prizeForRank } from './prizes'

describe('prizeForRank', () => {
  const settings = { winners: 2, prizes: ['Switch', '禮券'] }

  it('maps rank n to the n-th prize', () => {
    expect(prizeForRank(settings, 1)).toBe('Switch')
    expect(prizeForRank(settings, 2)).toBe('禮券')
  })

  it('returns undefined beyond the winner count', () => {
    expect(prizeForRank(settings, 3)).toBeUndefined()
  })

  it('handles old results without prizes', () => {
    expect(prizeForRank({ winners: 1 }, 1)).toBeUndefined()
  })
})
