import { DT } from '@/engine/config'
import type { ClassId } from '@/engine/classes'
import type { BattleConfig, BattleEvent, BattleResult, World } from '@/engine/types'
import { createWorld, getResult, step, stepUntilEnd } from '@/engine/world'
import { Effects } from '@/render/effects'
import { Renderer } from '@/render/renderer'
import type { SoundPlayer } from './sound'

export type Speed = 1 | 2 | 4

export interface KillFeedItem {
  key: string
  killer: string | null
  killerClass: ClassId | null
  victim: string
  victimClass: ClassId
}

export interface Leader {
  id: number
  label: string
  classId: ClassId
  kills: number
}

/** 給 React HUD 的唯讀快照。內容變動時才換新物件，讓 useSyncExternalStore 正確判斷。 */
export interface HudSnapshot {
  elapsedSec: number
  alive: number
  total: number
  winners: number
  paused: boolean
  speed: Speed
  finished: boolean
  /** 延長賽傷害倍率，1 表示尚未進入延長賽 */
  damageMultiplier: number
  killFeed: KillFeedItem[]
  leaders: Leader[]
}

export interface GameControllerOptions {
  speed: Speed
  showFps: boolean
  reducedMotion: boolean
  sound?: SoundPlayer
  /** 分出勝負後經過 finishDelayMs 才呼叫，讓觀眾看到最後一擊 */
  onFinish: (result: BattleResult) => void
  finishDelayMs?: number
}

/** HUD 快照最多每 100ms 更新一次（10Hz） */
const HUD_INTERVAL_MS = 100
const KILL_FEED_SIZE = 5
/** 分頁切回前景時，單幀最多補算這麼多秒，避免一次跑幾百個 tick 卡住 */
const MAX_FRAME_SEC = 0.25

/**
 * 遊戲迴圈。React 之外的普通物件：
 * - 用 requestAnimationFrame 以固定步長推進引擎（accumulator 模式），速度倍率 = 每幀多跑幾個 tick。
 * - 每幀直接呼叫 Renderer 畫 Canvas，不經過 React。
 * - 對 React 只暴露 subscribe / getSnapshot（useSyncExternalStore 的介面）。
 * start / stop 可以重複呼叫，配合 StrictMode 的掛載 → 卸載 → 再掛載。
 */
export class GameController {
  readonly world: World
  private readonly opts: GameControllerOptions
  private readonly effects: Effects
  private renderer: Renderer | null = null
  private readonly listeners = new Set<() => void>()
  private snapshot: HudSnapshot
  private killFeed: KillFeedItem[] = []
  private feedSeq = 0

  private running = false
  private paused = false
  private speed: Speed
  private showFps: boolean
  private rafId = 0
  private lastTime = -1
  private accumulator = 0
  private lastEmit = 0
  private fps = 0
  private fpsFrames = 0
  private fpsSince = 0
  private finishTimer: ReturnType<typeof setTimeout> | null = null
  private finishNotified = false
  private result: BattleResult | null = null
  private onFinish: (result: BattleResult) => void

  constructor(config: BattleConfig, opts: GameControllerOptions) {
    this.world = createWorld(config)
    this.opts = opts
    this.speed = opts.speed
    this.onFinish = opts.onFinish
    this.showFps = opts.showFps
    this.effects = new Effects(opts.reducedMotion)
    this.snapshot = this.buildSnapshot()
  }

  // ---- useSyncExternalStore 介面（箭頭函式，傳出去時 this 不會跑掉） ----

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  getSnapshot = (): HudSnapshot => this.snapshot

  // ---- 生命週期 ----

  start(): void {
    if (this.running) return
    this.running = true
    this.lastTime = -1
    this.rafId = requestAnimationFrame(this.frame)
    if (this.world.finished) this.scheduleFinish()
  }

  stop(): void {
    this.running = false
    cancelAnimationFrame(this.rafId)
    if (this.finishTimer !== null) {
      clearTimeout(this.finishTimer)
      this.finishTimer = null
    }
  }

  attachCanvas(canvas: HTMLCanvasElement): void {
    this.renderer = new Renderer(canvas)
  }

  detachCanvas(): void {
    this.renderer = null
  }

  resize(width: number, height: number, dpr: number): void {
    this.renderer?.resize(width, height, dpr)
    this.render(0)
  }

  // ---- 操作 ----

  setPaused(paused: boolean): void {
    if (this.world.finished || this.paused === paused) return
    this.paused = paused
    this.emit()
  }

  togglePause(): void {
    this.setPaused(!this.paused)
  }

  setSpeed(speed: Speed): void {
    if (this.speed === speed) return
    this.speed = speed
    this.emit()
  }

  /** 讓 React 端更新回呼，不必重建 controller */
  setOnFinish(onFinish: (result: BattleResult) => void): void {
    this.onFinish = onFinish
  }

  setShowFps(show: boolean): void {
    this.showFps = show
  }

  /** 不播動畫，直接算到結束並立即回報結果 */
  skipToEnd(): void {
    if (this.finishNotified) return
    if (!this.world.finished) {
      this.result = stepUntilEnd(this.world)
      this.killFeed = []
    }
    this.notifyFinish()
  }

  // ---- 迴圈 ----

  private frame = (now: number): void => {
    if (!this.running) return
    this.rafId = requestAnimationFrame(this.frame)

    const elapsed = this.lastTime < 0 ? 0 : Math.min((now - this.lastTime) / 1000, MAX_FRAME_SEC)
    this.lastTime = now
    this.trackFps(now)

    if (!this.paused) {
      if (!this.world.finished) {
        this.accumulator += elapsed * this.speed
        while (this.accumulator >= DT && !this.world.finished) {
          step(this.world)
          this.consumeEvents()
          this.accumulator -= DT
        }
        if (this.world.finished) {
          this.accumulator = 0
          this.result = getResult(this.world)
          this.scheduleFinish()
        }
      }
      this.effects.update(elapsed)
    }

    this.render(this.world.finished ? 1 : this.accumulator / DT)
    if (now - this.lastEmit >= HUD_INTERVAL_MS) {
      this.lastEmit = now
      this.emit()
    }
  }

  private render(alpha: number): void {
    this.renderer?.draw(this.world, alpha, this.effects, this.showFps ? this.fps : null)
  }

  private trackFps(now: number): void {
    this.fpsFrames++
    if (now - this.fpsSince >= 1000) {
      this.fps = Math.round((this.fpsFrames * 1000) / (now - this.fpsSince || 1))
      this.fpsFrames = 0
      this.fpsSince = now
    }
  }

  private consumeEvents(): void {
    const { world } = this
    for (const event of world.events) {
      this.effects.handle(event, world)
      this.playSound(event)
      if (event.type === 'kill') this.pushKill(event)
    }
    world.events.length = 0
  }

  private playSound(event: BattleEvent): void {
    const sound = this.opts.sound
    if (!sound) return
    if (event.type === 'hit') sound.play(event.crit ? 'crit' : 'hit')
    else if (event.type === 'kill') sound.play('kill')
    else if (event.type === 'shoot') sound.play(event.kind === 'arrow' ? 'arrow' : 'fireball')
    else if (event.type === 'explode') sound.play('explode')
    else if (event.type === 'spin') sound.play('spin')
    else if (event.type === 'overtime') sound.play('overtime')
    else if (event.type === 'finish') sound.play('finish')
  }

  private pushKill(event: Extract<BattleEvent, { type: 'kill' }>): void {
    const { units } = this.world
    const killer = event.killer === null ? undefined : units[event.killer]
    const victim = units[event.victim]
    const item: KillFeedItem = {
      key: `k${this.feedSeq++}`,
      killer: killer?.label ?? null,
      killerClass: killer?.classId ?? null,
      victim: victim?.label ?? '?',
      victimClass: victim?.classId ?? 'swordsman',
    }
    this.killFeed = [item, ...this.killFeed].slice(0, KILL_FEED_SIZE)
  }

  private scheduleFinish(): void {
    if (this.finishNotified || this.finishTimer !== null) return
    this.emit()
    this.finishTimer = setTimeout(() => {
      this.finishTimer = null
      this.notifyFinish()
    }, this.opts.finishDelayMs ?? 1800)
  }

  private notifyFinish(): void {
    if (this.finishNotified) return
    this.finishNotified = true
    if (this.finishTimer !== null) {
      clearTimeout(this.finishTimer)
      this.finishTimer = null
    }
    this.emit()
    this.onFinish(this.result ?? getResult(this.world))
  }

  // ---- 快照 ----

  private buildSnapshot(): HudSnapshot {
    const { world } = this
    const leaders = world.units
      .filter((u) => u.kills > 0)
      .sort((a, b) => b.kills - a.kills || a.id - b.id)
      .slice(0, 3)
      .map((u) => ({ id: u.id, label: u.label, classId: u.classId, kills: u.kills }))
    return {
      elapsedSec: world.tick * DT,
      alive: world.aliveCount,
      total: world.units.length,
      winners: world.settings.winners,
      paused: this.paused,
      speed: this.speed,
      finished: world.finished,
      damageMultiplier: world.damageMultiplier,
      killFeed: this.killFeed,
      leaders,
    }
  }

  private emit(): void {
    const next = this.buildSnapshot()
    const prev = this.snapshot
    // 內容沒變就保留原物件，避免 React 多餘的 re-render
    if (
      prev.elapsedSec === next.elapsedSec &&
      prev.paused === next.paused &&
      prev.speed === next.speed &&
      prev.finished === next.finished &&
      prev.alive === next.alive &&
      prev.damageMultiplier === next.damageMultiplier &&
      prev.killFeed === next.killFeed
    ) {
      return
    }
    this.snapshot = next
    for (const listener of this.listeners) listener()
  }
}
