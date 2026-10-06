import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { BattleConfig, BattleResult } from '@/engine/types'
import { killUnit } from '@/engine/systems/death'
import { createWorld, stepUntilEnd } from '@/engine/world'
import { GameController, type GameControllerOptions } from './GameController'

const config: BattleConfig = {
  entrants: Array.from({ length: 12 }, (_, i) => ({ id: i, label: String(i + 1) })),
  settings: { winners: 2 },
  seed: 77,
}

let frames: Map<number, FrameRequestCallback>
let nextId: number
let now: number

/** 推進 n 幀，每幀 16ms */
function runFrames(n: number, frameMs = 16): void {
  for (let i = 0; i < n; i++) {
    now += frameMs
    const pending = [...frames.values()]
    frames.clear()
    for (const cb of pending) cb(now)
  }
}

function makeController(overrides: Partial<GameControllerOptions> = {}) {
  const onFinish = vi.fn<(r: BattleResult) => void>()
  const controller = new GameController(config, {
    speed: 1,
    showFps: false,
    reducedMotion: true,
    onFinish,
    finishDelayMs: 0,
    ...overrides,
  })
  return { controller, onFinish }
}

describe('GameController', () => {
  beforeEach(() => {
    frames = new Map()
    nextId = 1
    now = 0
    vi.useFakeTimers()
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      const id = nextId++
      frames.set(id, cb)
      return id
    })
    vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id))
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('advances about 30 ticks per second at 1x', () => {
    const { controller } = makeController()
    controller.start()
    runFrames(63) // 約 1 秒
    expect(controller.world.tick).toBeGreaterThanOrEqual(29)
    expect(controller.world.tick).toBeLessThanOrEqual(31)
  })

  it('runs 4 times as many ticks at 4x', () => {
    const { controller } = makeController({ speed: 4 })
    controller.start()
    runFrames(63)
    expect(controller.world.tick).toBeGreaterThanOrEqual(118)
  })

  it('does not advance while paused', () => {
    const { controller } = makeController()
    controller.start()
    runFrames(10)
    controller.setPaused(true)
    const tick = controller.world.tick
    runFrames(30)
    expect(controller.world.tick).toBe(tick)
    expect(controller.getSnapshot().paused).toBe(true)
  })

  it('stops the loop on stop() and resumes on start() (StrictMode remount)', () => {
    const { controller } = makeController()
    controller.start()
    controller.stop()
    controller.start()
    expect(frames.size).toBe(1)
    controller.stop()
    expect(frames.size).toBe(0)
  })

  it('caps catch-up after the tab was hidden', () => {
    const { controller } = makeController()
    controller.start()
    runFrames(1)
    runFrames(1, 10_000) // 分頁背景 10 秒
    expect(controller.world.tick).toBeLessThanOrEqual(8)
  })

  it('returns the same snapshot object when nothing changed', () => {
    const { controller } = makeController()
    expect(controller.getSnapshot()).toBe(controller.getSnapshot())
    controller.setSpeed(1)
    expect(controller.getSnapshot()).toBe(controller.getSnapshot())
  })

  it('notifies subscribers when the speed changes', () => {
    const { controller } = makeController()
    const listener = vi.fn()
    controller.subscribe(listener)
    controller.setSpeed(2)
    expect(listener).toHaveBeenCalledTimes(1)
    expect(controller.getSnapshot().speed).toBe(2)
  })

  it('skipToEnd reports the same result as the engine', () => {
    const { controller, onFinish } = makeController()
    controller.skipToEnd()
    expect(onFinish).toHaveBeenCalledTimes(1)
    expect(onFinish.mock.calls[0]?.[0]).toEqual(stepUntilEnd(createWorld(config)))
  })

  it('calls onFinish once after the battle ends during play', () => {
    const { controller, onFinish } = makeController({ speed: 4 })
    controller.start()
    for (let i = 0; i < 400 && !controller.world.finished; i++) runFrames(60)
    vi.runAllTimers()
    runFrames(5)
    vi.runAllTimers()
    expect(onFinish).toHaveBeenCalledTimes(1)
    expect(onFinish.mock.calls[0]?.[0].ranking.filter((r) => r.winner)).toHaveLength(2)
  })

  it('records kills in the kill feed (max 5)', () => {
    const { controller } = makeController({ speed: 4 })
    controller.start()
    for (let i = 0; i < 20; i++) runFrames(60)
    const feed = controller.getSnapshot().killFeed
    expect(feed.length).toBeGreaterThan(0)
    expect(feed.length).toBeLessThanOrEqual(5)
  })

  it('slows the simulation down during the final showdown', () => {
    const normal = makeController().controller
    const showdown = makeController().controller
    // 只剩得獎人數 + 2 人：進入決戰時刻
    for (let i = 0; i < 8; i++) killUnit(showdown.world, i, null)
    normal.start()
    showdown.start()
    const t0 = normal.world.tick
    const s0 = showdown.world.tick
    runFrames(120)
    expect(showdown.getSnapshot().drama).not.toBe('none')
    expect(showdown.world.tick - s0).toBeLessThan((normal.world.tick - t0) * 0.85)
  })
})
