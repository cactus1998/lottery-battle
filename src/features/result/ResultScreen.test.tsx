import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { BattleConfig } from '@/engine/types'
import { createWorld, stepUntilEnd } from '@/engine/world'
import { resetAppStore, useAppStore } from '@/store/appStore'
import { formatResultText } from './formatResult'
import { ResultScreen } from './ResultScreen'

const config: BattleConfig = {
  entrants: Array.from({ length: 8 }, (_, i) => ({ id: i, label: `P${i + 1}` })),
  settings: { winners: 2 },
  seed: 5,
}
const result = stepUntilEnd(createWorld(config))

describe('ResultScreen', () => {
  beforeEach(() => {
    localStorage.clear()
    resetAppStore()
    useAppStore.getState().startBattle(config)
    useAppStore.getState().finishBattle(result)
  })

  it('shows each winner and the full ranking table', () => {
    render(<ResultScreen result={result} />)
    const podium = screen.getAllByRole('list')[0]!
    const winners = result.ranking.filter((r) => r.winner)
    for (const w of winners) expect(within(podium).getByText(w.label)).toBeInTheDocument()
    // 表頭 1 列 + 8 位參加者
    expect(screen.getAllByRole('row')).toHaveLength(9)
    expect(screen.getByText(`seed ${result.seed}`)).toBeInTheDocument()
  })

  it('replays with the same seed', async () => {
    const user = userEvent.setup()
    render(<ResultScreen result={result} />)
    await user.click(screen.getByRole('button', { name: '重播這場' }))
    const { phase, battle } = useAppStore.getState()
    expect(phase).toBe('battle')
    expect(battle?.seed).toBe(5)
    expect(battle?.replay).toBe(true)
  })

  it('copies the result text', async () => {
    const user = userEvent.setup()
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue()
    render(<ResultScreen result={result} />)
    await user.click(screen.getByRole('button', { name: '複製結果' }))
    expect(writeText).toHaveBeenCalledWith(formatResultText(result))
    expect(await screen.findByText('已複製到剪貼簿')).toBeInTheDocument()
  })
})
