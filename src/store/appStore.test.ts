import { beforeEach, describe, expect, it } from 'vitest'
import { createWorld, stepUntilEnd } from '@/engine/world'
import type { BattleConfig } from '@/engine/types'
import { HISTORY_LIMIT, resetAppStore, useAppStore } from './appStore'

const config: BattleConfig = {
  entrants: Array.from({ length: 5 }, (_, i) => ({ id: i, label: `P${i}` })),
  settings: { winners: 1 },
  seed: 123,
}

const finish = () => useAppStore.getState().finishBattle(stepUntilEnd(createWorld(config)))

describe('appStore', () => {
  beforeEach(() => {
    localStorage.clear()
    resetAppStore()
  })

  it('moves through setup → battle → result', () => {
    const s = useAppStore.getState()
    s.startBattle(config)
    expect(useAppStore.getState().phase).toBe('battle')
    finish()
    expect(useAppStore.getState().phase).toBe('result')
    expect(useAppStore.getState().result?.ranking).toHaveLength(5)
  })

  it('records history for new battles but not for replays', () => {
    useAppStore.getState().startBattle(config)
    finish()
    expect(useAppStore.getState().history).toHaveLength(1)
    useAppStore.getState().replay()
    expect(useAppStore.getState().battle?.seed).toBe(123)
    finish()
    expect(useAppStore.getState().history).toHaveLength(1)
  })

  it('persists history to localStorage', () => {
    useAppStore.getState().startBattle(config)
    finish()
    expect(localStorage.getItem('lottery-battle:history')).toContain('P')
  })

  it(`keeps at most ${HISTORY_LIMIT} entries`, () => {
    for (let i = 0; i < HISTORY_LIMIT + 3; i++) {
      useAppStore.getState().startBattle({ ...config, seed: i })
      finish()
    }
    expect(useAppStore.getState().history).toHaveLength(HISTORY_LIMIT)
  })

  it('bumps battleKey so the battle screen remounts on replay', () => {
    useAppStore.getState().startBattle(config)
    const key = useAppStore.getState().battleKey
    useAppStore.getState().replay()
    expect(useAppStore.getState().battleKey).toBe(key + 1)
  })

  it('rematch keeps entrants but changes seed', () => {
    useAppStore.getState().startBattle(config)
    useAppStore.getState().rematch()
    const battle = useAppStore.getState().battle
    expect(battle?.entrants).toEqual(config.entrants)
    expect(battle?.replay).toBe(false)
  })
})
