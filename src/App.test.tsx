import { StrictMode } from 'react'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { resetAppStore, useAppStore } from './store/appStore'

describe('App flow', () => {
  let frames: Map<number, FrameRequestCallback>

  beforeEach(() => {
    localStorage.clear()
    resetAppStore()
    frames = new Map()
    let id = 0
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      frames.set(++id, cb)
      return id
    })
    vi.stubGlobal('cancelAnimationFrame', (n: number) => frames.delete(n))
  })

  afterEach(() => vi.unstubAllGlobals())

  it('goes setup → battle → result → history under StrictMode', async () => {
    const user = userEvent.setup()
    render(
      <StrictMode>
        <App />
      </StrictMode>,
    )

    await user.click(screen.getByRole('button', { name: '開打！' }))
    expect(screen.getByRole('heading', { name: '大亂鬥進行中' })).toBeInTheDocument()
    // StrictMode 掛載兩次後只剩一個 rAF 迴圈
    expect(frames.size).toBe(1)

    await user.click(screen.getByRole('button', { name: /直接看結果/ }))
    expect(screen.getByRole('heading', { name: '得獎名單' })).toBeInTheDocument()
    // 離開對戰畫面後迴圈停止
    expect(frames.size).toBe(0)

    await user.click(screen.getByRole('button', { name: '重新設定' }))
    expect(screen.getByText(/30 人取 1/)).toBeInTheDocument()
    expect(useAppStore.getState().history).toHaveLength(1)
  })

  it('toggles pause with the Space key', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: '開打！' }))
    act(() => {
      ;(document.activeElement as HTMLElement | null)?.blur()
    })
    await user.keyboard(' ')
    expect(screen.getByRole('button', { name: /繼續/ })).toBeInTheDocument()
    await user.keyboard(' ')
    expect(screen.getByRole('button', { name: /暫停/ })).toBeInTheDocument()
  })

  it('changes speed with number keys and remembers it', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: '開打！' }))
    await user.keyboard('4')
    expect(screen.getByRole('button', { name: '4x' })).toHaveAttribute('aria-pressed', 'true')
    expect(useAppStore.getState().prefs.speed).toBe(4)
  })
})
