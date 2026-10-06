export type SoundName =
  'hit' | 'crit' | 'kill' | 'arrow' | 'fireball' | 'explode' | 'spin' | 'overtime' | 'finish'

interface ToneSpec {
  freq: number
  endFreq: number
  duration: number
  type: OscillatorType
  gain: number
}

const TONES: Record<SoundName, ToneSpec> = {
  hit: { freq: 320, endFreq: 180, duration: 0.05, type: 'square', gain: 0.03 },
  crit: { freq: 620, endFreq: 260, duration: 0.09, type: 'square', gain: 0.05 },
  kill: { freq: 220, endFreq: 60, duration: 0.18, type: 'sawtooth', gain: 0.06 },
  arrow: { freq: 900, endFreq: 500, duration: 0.06, type: 'triangle', gain: 0.025 },
  fireball: { freq: 200, endFreq: 420, duration: 0.15, type: 'sawtooth', gain: 0.03 },
  explode: { freq: 120, endFreq: 40, duration: 0.25, type: 'sawtooth', gain: 0.06 },
  spin: { freq: 500, endFreq: 250, duration: 0.12, type: 'triangle', gain: 0.04 },
  overtime: { freq: 140, endFreq: 90, duration: 0.6, type: 'triangle', gain: 0.08 },
  finish: { freq: 523, endFreq: 1046, duration: 0.5, type: 'triangle', gain: 0.08 },
}

/** 同一種音效的最短間隔（毫秒），300 人混戰時避免爆音 */
const MIN_INTERVAL: Record<SoundName, number> = {
  hit: 70,
  crit: 90,
  kill: 90,
  arrow: 80,
  fireball: 90,
  explode: 90,
  spin: 90,
  overtime: 0,
  finish: 0,
}

/**
 * 用 Web Audio 振盪器即時合成的音效，不需載入音檔。
 * AudioContext 在第一次取消靜音時才建立（瀏覽器要求使用者互動後才能播放）。
 */
export class SoundPlayer {
  private ctx: AudioContext | null = null
  private readonly lastPlayed: Partial<Record<SoundName, number>> = {}
  muted: boolean

  constructor(muted: boolean) {
    this.muted = muted
  }

  setMuted(muted: boolean): void {
    this.muted = muted
    if (!muted && !this.ctx && typeof AudioContext !== 'undefined') {
      this.ctx = new AudioContext()
    }
    void this.ctx?.resume()
  }

  play(name: SoundName): void {
    const ctx = this.ctx
    if (this.muted || !ctx || ctx.state !== 'running') return
    const now = performance.now()
    const last = this.lastPlayed[name] ?? 0
    if (now - last < MIN_INTERVAL[name]) return
    this.lastPlayed[name] = now

    const spec = TONES[name]
    const t = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = spec.type
    osc.frequency.setValueAtTime(spec.freq, t)
    osc.frequency.exponentialRampToValueAtTime(spec.endFreq, t + spec.duration)
    gain.gain.setValueAtTime(spec.gain, t)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + spec.duration)
    osc.connect(gain).connect(ctx.destination)
    osc.start(t)
    osc.stop(t + spec.duration)
  }

  dispose(): void {
    void this.ctx?.close()
    this.ctx = null
  }
}
