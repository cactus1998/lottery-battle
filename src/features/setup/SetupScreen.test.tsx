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
    expect(screen.getByText('共 30 位參加者')).toBeInTheDocument()
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
    expect(screen.getByText('共 2 位參加者')).toBeInTheDocument()
  })

  it('blocks winners >= entrants', async () => {
    const user = userEvent.setup()
    render(<SetupScreen />)
    const end = screen.getByLabelText('結束號碼')
    await user.clear(end)
    await user.type(end, '3')
    const winners = screen.getByLabelText('得獎人數')
    await user.clear(winners)
    await user.type(winners, '3')
    expect(screen.getByText('得獎人數需介於 1 到 2')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '開打！' })).toBeDisabled()
  })

  it('rejects an invalid seed', async () => {
    const user = userEvent.setup()
    render(<SetupScreen />)
    await user.type(screen.getByLabelText(/seed/), 'abc')
    expect(screen.getByText(/seed 必須是/)).toBeInTheDocument()
  })
})
