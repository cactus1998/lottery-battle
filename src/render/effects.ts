import type { BattleEvent, World } from '@/engine/types'

/**
 * 純視覺特效（粒子、傷害數字、爆炸與旋風斬光圈、鏡頭震動、橫幅）。
 * 不影響對戰結果，所以可以用 Math.random 與真實時間。
 * 座標使用引擎的場地座標，由 renderer 換算到畫面。
 */
export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  color: string
  size: number
}

export interface Floater {
  x: number
  y: number
  text: string
  life: number
  maxLife: number
  crit: boolean
}

export interface Ring {
  x: number
  y: number
  radius: number
  life: number
  maxLife: number
  color: string
}

const MAX_PARTICLES = 800
const MAX_FLOATERS = 60
const MAX_RINGS = 80
/** 存活人數超過這個值時，只顯示爆擊的傷害數字，避免畫面被數字淹沒 */
const SHOW_ALL_DAMAGE_BELOW = 60
const FIRE_COLORS = ['#ffcf4a', '#ff8a2a', '#ff5a1f', '#fff1a8']

export class Effects {
  readonly particles: Particle[] = []
  readonly floaters: Floater[] = []
  readonly rings: Ring[] = []
  shake = 0
  banner = ''
  bannerTime = 0
  /** 白色閃光強度 0–1 */
  flash = 0
  /** 決戰時畫面四周變暗的強度 0–1（平滑變化） */
  vignette = 0
  vignetteTarget = 0
  /** 最後一擊大字 */
  finalTitle = ''
  finalSubtitle = ''
  finalTime = 0
  /** 本 tick 最近一次擊殺，最後一擊特效用 */
  private lastKill: { killer: number | null; victim: number } | null = null

  private readonly reducedMotion: boolean

  constructor(reducedMotion: boolean) {
    this.reducedMotion = reducedMotion
  }

  handle(event: BattleEvent, world: World): void {
    switch (event.type) {
      case 'hit': {
        const target = world.units[event.target]
        if (!target) return
        if (event.crit || world.aliveCount <= SHOW_ALL_DAMAGE_BELOW) {
          this.addFloater(target.x, target.y - 30, String(event.damage), event.crit)
        }
        if (event.crit && !this.reducedMotion) this.shake = Math.min(this.shake + 1.5, 6)
        break
      }
      case 'kill': {
        const victim = world.units[event.victim]
        if (!victim) return
        this.lastKill = { killer: event.killer, victim: event.victim }
        this.burst(victim.x, victim.y - 8, `hsl(${victim.hue.toFixed(0)} 70% 60%)`, 14)
        this.burst(victim.x, victim.y - 8, '#ffffff', 4)
        if (!this.reducedMotion) this.shake = Math.min(this.shake + 2.5, 8)
        break
      }
      case 'explode':
        this.addRing(event.x, event.y, event.radius, '#ff8a2a', 0.35)
        for (let i = 0; i < (this.reducedMotion ? 3 : 10); i++) {
          const color = FIRE_COLORS[Math.floor(Math.random() * FIRE_COLORS.length)] ?? '#ff8a2a'
          this.burst(event.x, event.y, color, 1, 120)
        }
        if (!this.reducedMotion) this.shake = Math.min(this.shake + 1, 6)
        break
      case 'spin': {
        const u = world.units[event.attacker]
        if (u) this.addRing(u.x, u.y - 6, event.radius, '#e6edf3', 0.25)
        break
      }
      case 'overtime':
        this.showBanner(`延長賽！傷害 ×${event.multiplier}`)
        break
      case 'finish':
        this.finalBlow(world)
        for (const u of world.units) {
          if (u.alive) this.burst(u.x, u.y - 10, '#ffd34d', 30)
        }
        break
      case 'shoot':
        break
    }
  }

  /** 最後一擊：衝擊波、大量粒子、閃光、強震與大字 */
  private finalBlow(world: World): void {
    const kill = this.lastKill
    const victim = kill ? world.units[kill.victim] : undefined
    const killer = kill?.killer != null ? world.units[kill.killer] : undefined
    if (victim) {
      this.addRing(victim.x, victim.y - 10, 90, '#ffffff', 0.6)
      this.addRing(victim.x, victim.y - 10, 160, '#ffd34d', 0.9)
      this.burst(victim.x, victim.y - 10, '#ffffff', 40, 220)
      this.burst(victim.x, victim.y - 10, `hsl(${victim.hue.toFixed(0)} 80% 60%)`, 40, 260)
    }
    if (!this.reducedMotion) {
      this.flash = 1
      this.shake = 16
    }
    this.finalTitle = '最後一擊！'
    this.finalSubtitle = victim
      ? killer
        ? `${killer.label} 擊倒 ${victim.label}`
        : `${victim.label} 倒下了`
      : ''
    this.finalTime = 2.6
  }

  showBanner(text: string): void {
    this.banner = text
    this.bannerTime = 2.5
  }

  private addFloater(x: number, y: number, text: string, crit: boolean): void {
    if (this.floaters.length >= MAX_FLOATERS) this.floaters.shift()
    this.floaters.push({ x, y, text, crit, life: 0.8, maxLife: 0.8 })
  }

  private addRing(x: number, y: number, radius: number, color: string, life: number): void {
    if (this.rings.length >= MAX_RINGS) this.rings.shift()
    this.rings.push({ x, y, radius, color, life, maxLife: life })
  }

  private burst(x: number, y: number, color: string, count: number, speedMax = 90): void {
    const n = this.reducedMotion ? Math.ceil(count / 3) : count
    for (let i = 0; i < n && this.particles.length < MAX_PARTICLES; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 30 + Math.random() * speedMax
      const life = 0.35 + Math.random() * 0.4
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life,
        maxLife: life,
        color,
        size: 2 + Math.random() * 3,
      })
    }
  }

  /** 以真實經過秒數更新（暫停時不呼叫） */
  update(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i] as Particle
      p.life -= dt
      if (p.life <= 0) {
        this.particles.splice(i, 1)
        continue
      }
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.vx *= 0.9
      p.vy *= 0.9
    }
    for (let i = this.floaters.length - 1; i >= 0; i--) {
      const f = this.floaters[i] as Floater
      f.life -= dt
      if (f.life <= 0) {
        this.floaters.splice(i, 1)
        continue
      }
      if (!this.reducedMotion) f.y -= 30 * dt
    }
    for (let i = this.rings.length - 1; i >= 0; i--) {
      const r = this.rings[i] as Ring
      r.life -= dt
      if (r.life <= 0) this.rings.splice(i, 1)
    }
    this.shake = Math.max(0, this.shake - dt * 20)
    this.flash = Math.max(0, this.flash - dt * 2.5)
    this.finalTime = Math.max(0, this.finalTime - dt)
    this.vignette += (this.vignetteTarget - this.vignette) * (1 - Math.exp(-dt * 3))
    this.bannerTime = Math.max(0, this.bannerTime - dt)
  }
}
