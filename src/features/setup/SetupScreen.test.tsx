import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { resetAppStore, useAppStore } from '@/store/appStore'
import { SetupScreen } from './SetupScreen'

describe('SetupScreen', () => {
  beforeEach(() => {
    localStorage.clear()
    resetAppStore()
  })

  it('shows the entrant count for the default range', () => {
    render(<SetupScreen />)
    expect(screen.getByText('共 30 位參加者，取 1 名')).toBeInTheDocument()
  })

  it('starts a battle with the parsed range, exclusions and seed', async () => {
    const user = userEvent.setup()
    render(<SetupScreen />)
    const end = screen.getByLabelText('結束號碼')
    await user.clear(end)
    await user.type(end, '10')
    await user.type(screen.getByLabelText('排除號碼（選填）'), '3, 5')
    await user.type(screen.getByLabelText(/seed/), '42')
    await user.click(screen.getByRole('button', { name: '開打！' }))

    const { phase, battle } = useAppStore.getState()
    expect(phase).toBe('battle')
    expect(battle?.seed).toBe(42)
    expect(battle?.entrants.map((e) => e.label)).toEqual(['1', '2', '4', '6', '7', '8', '9', '10'])
  })

  it('switches to list mode and disables start until enough names', async () => {
    const user = userEvent.setup()
    render(<SetupScreen />)
    await user.click(screen.getByLabelText('貼上名單'))
    const start = screen.getByRole('button', { name: '開打！' })
    expect(start).toBeDisabled()
    await user.type(screen.getByLabelText(/參加名單/), '小明{enter}小華')
    expect(start).toBeEnabled()
    expect(screen.getByText('共 2 位參加者，取 1 名')).toBeInTheDocument()
  })

  it('uses one prize per rank and sets winners to the prize count', async () => {
    const user = userEvent.setup()
    render(<SetupScreen />)
    const first = screen.getByLabelText('第 1 名')
    await user.clear(first)
    await user.type(first, 'Switch')
    await user.click(screen.getByRole('button', { name: '＋ 新增獎品' }))
    await user.type(screen.getByLabelText('第 2 名'), '禮券')
    expect(screen.getByText('共 30 位參加者，取 2 名')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '開打！' }))
    expect(useAppStore.getState().battle?.settings).toEqual({
      winners: 2,
      prizes: ['Switch', '禮券'],
    })
  })

  it('focuses the new prize input and adds a row on Enter', async () => {
    const user = userEvent.setup()
    render(<SetupScreen />)
    await user.click(screen.getByRole('button', { name: '＋ 新增獎品' }))
    expect(screen.getByLabelText('第 2 名')).toHaveFocus()
    await user.keyboard('禮券{Enter}')
    expect(screen.getByLabelText('第 3 名')).toHaveFocus()
    expect(useAppStore.getState().phase).toBe('setup')
  })

  it('blocks empty prize names', async () => {
    const user = userEvent.setup()
    render(<SetupScreen />)
    await user.click(screen.getByRole('button', { name: '＋ 新增獎品' }))
    expect(screen.getByText('第 2 名的獎品還沒填')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '開打！' })).toBeDisabled()
  })

  it('allows at most 10 prizes and keeps at least one', async () => {
    const user = userEvent.setup()
    render(<SetupScreen />)
    expect(screen.getByRole('button', { name: '刪除第 1 名的獎品' })).toBeDisabled()
    const add = screen.getByRole('button', { name: '＋ 新增獎品' })
    for (let i = 0; i < 12; i++) await user.click(add)
    expect(screen.getAllByRole('button', { name: /刪除第 \d+ 名的獎品/ })).toHaveLength(10)
    expect(add).toBeDisabled()
  })

  it('removes the right prize row', async () => {
    const user = userEvent.setup()
    render(<SetupScreen />)
    await user.click(screen.getByRole('button', { name: '＋ 新增獎品' }))
    await user.type(screen.getByLabelText('第 2 名'), '禮券')
    await user.click(screen.getByRole('button', { name: '刪除第 1 名的獎品' }))
    expect(screen.getByLabelText('第 1 名')).toHaveValue('禮券')
  })

  it('blocks prize count > entrants', async () => {
    const user = userEvent.setup()
    render(<SetupScreen />)
    const end = screen.getByLabelText('結束號碼')
    await user.clear(end)
    await user.type(end, '2')
    await user.click(screen.getByRole('button', { name: '＋ 新增獎品' }))
    await user.type(screen.getByLabelText('第 2 名'), '禮券')
    // 獎品數等於人數可以開打
    expect(screen.getByRole('button', { name: '開打！' })).toBeEnabled()
    await user.click(screen.getByRole('button', { name: '＋ 新增獎品' }))
    await user.type(screen.getByLabelText('第 3 名'), '貼紙')
    expect(screen.getByText('獎品有 3 個，參加者至少要 3 位')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '開打！' })).toBeDisabled()
  })

  it('rejects an invalid seed', async () => {
    const user = userEvent.setup()
    render(<SetupScreen />)
    await user.type(screen.getByLabelText(/seed/), 'abc')
    expect(screen.getByText(/seed 必須是/)).toBeInTheDocument()
  })
})
