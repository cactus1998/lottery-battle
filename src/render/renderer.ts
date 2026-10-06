import { CONFIG } from '@/engine/config'
import { CLASSES } from '@/engine/classes'
import type { World } from '@/engine/types'
import { type Camera, DEFAULT_CENTER } from './camera'
import type { Effects } from './effects'
import {
  buildGrass,
  buildPixelCanvas,
  buildUnitAtlas,
  FRAME,
  ROW,
  SPRITE_SIZE,
  TOMBSTONE,
  TOMBSTONE_PALETTE,
} from './sprites'

const ARENA = CONFIG.arenaSize
/** 場地四周保留的空間（場地單位），讓站在邊緣的小人頭部與名字不被切掉 */
const TOP_PAD = 50
const SIDE_PAD = 30
const BOTTOM_PAD = 30
const VIEW_W = ARENA + SIDE_PAD * 2
const VIEW_H = ARENA + TOP_PAD + BOTTOM_PAD
/** 草地貼圖一格代表的場地單位 */
const GRASS_CELL = 4

const COLORS = {
  background: '#2f4a26',
  label: '#ffffff',
  labelShadow: 'rgba(0,0,0,0.85)',
  hpBack: 'rgba(0,0,0,0.65)',
  hpFront: '#5ee07a',
  hpMid: '#f2c84b',
  hpLow: '#ff5d5d',
  shadow: 'rgba(0,0,0,0.28)',
  winner: '#ffd34d',
  crit: '#ffd34d',
  damage: '#ffffff',
  active: '#7fe3ff',
  passive: '#c9a8ff',
  stun: '#ffe066',
  arrow: '#6b4a2a',
  arrowHead: '#dfe6ee',
  chargedArrow: '#e0a420',
  chargedArrowHead: '#fff1a8',
  missile: '#b48cff',
  missileTrail: '#7d5cff',
  manaShield: 'rgba(127,184,255,0.55)',
}

/** 受擊後閃白的 tick 數 */
const FLASH_TICKS = 3
/** 攻擊動作持續的 tick 數 */
const ATTACK_TICKS = 8
/** 小人偶在螢幕上至少的高度（px） */
const MIN_SPRITE_SCREEN_PX = 22
/** 場地座標中小人偶的像素大小：身體 8 像素寬 × 3.5 = 28，等於兩倍碰撞半徑 */
const BASE_PIXEL = 3.5

/**
 * Canvas 2D 繪製。只讀 world 與 effects，不修改模擬狀態。
 * 位置用 prev 與目前位置依 alpha 內插，讓 30 tick/s 的模擬在 60Hz 以上的螢幕也平滑。
 */
export class Renderer {
  private readonly canvas: HTMLCanvasElement
  private readonly ctx: CanvasRenderingContext2D | null
  private width = 0
  private height = 0
  private dpr = 1
  private readonly atlases: HTMLCanvasElement[] = []
  private grass: HTMLCanvasElement | null = null
  private tomb: HTMLCanvasElement | null = null
  /** 名字寬度快取（依字級失效），避免每幀 measureText */
  private labelWidths: number[] = []
  private labelFont = ''
  /** 依 y 排序的繪製順序，重用陣列 */
  private readonly order: number[] = []

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
  }

  resize(cssWidth: number, cssHeight: number, dpr: number): void {
    this.width = cssWidth
    this.height = cssHeight
    this.dpr = dpr
    this.canvas.width = Math.max(1, Math.round(cssWidth * dpr))
    this.canvas.height = Math.max(1, Math.round(cssHeight * dpr))
  }

  private atlas(world: World, index: number): HTMLCanvasElement | null {
    let a = this.atlases[index]
    if (!a) {
      const u = world.units[index]
      if (!u) return null
      a = buildUnitAtlas(u.classId, u.hue)
      this.atlases[index] = a
    }
    return a
  }

  private labelWidth(ctx: CanvasRenderingContext2D, index: number, label: string): number {
    if (ctx.font !== this.labelFont) {
      this.labelFont = ctx.font
      this.labelWidths = []
    }
    let w = this.labelWidths[index]
    if (w === undefined) {
      w = ctx.measureText(label).width
      this.labelWidths[index] = w
    }
    return w
  }

  draw(
    world: World,
    alpha: number,
    effects: Effects,
    camera: Camera | null,
    fps: number | null,
  ): void {
    const ctx = this.ctx
    if (!ctx || this.width === 0) return

    // 鏡頭：zoom = 1 且中心在預設位置時，整個場地剛好放進畫面
    const zoom = camera?.zoom ?? 1
    const camX = camera?.x ?? DEFAULT_CENTER.x
    const camY = camera?.y ?? DEFAULT_CENTER.y
    const scale = Math.min(this.width / VIEW_W, this.height / VIEW_H) * zoom
    const offsetX = this.width / 2 - camX * scale
    const offsetY = this.height / 2 - camY * scale
    const shakeX = effects.shake > 0 ? (Math.random() - 0.5) * effects.shake : 0
    const shakeY = effects.shake > 0 ? (Math.random() - 0.5) * effects.shake : 0

    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
    ctx.fillStyle = COLORS.background
    ctx.fillRect(0, 0, this.width, this.height)

    // 之後的繪製都使用場地座標
    ctx.setTransform(
      this.dpr * scale,
      0,
      0,
      this.dpr * scale,
      this.dpr * (offsetX + shakeX),
      this.dpr * (offsetY + shakeY),
    )
    ctx.imageSmoothingEnabled = false

    // 場地座標中一個 sprite 像素的大小：畫面越小放越大，確保看得清楚
    const px = Math.max(BASE_PIXEL, MIN_SPRITE_SCREEN_PX / SPRITE_SIZE / scale)

    this.drawGround(ctx)
    this.drawTombs(ctx, world, px)
    this.drawRings(ctx, effects)
    this.drawUnits(ctx, world, alpha, px, scale)
    this.drawProjectiles(ctx, world, alpha, px)
    this.drawParticles(ctx, effects, scale)

    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
    this.drawOverlays(ctx, effects)
    if (effects.bannerTime > 0) this.drawBanner(ctx, effects.banner, effects.bannerTime)
    if (fps !== null) {
      ctx.font = '12px ui-monospace, monospace'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'top'
      ctx.fillStyle = COLORS.label
      ctx.fillText(`${fps} FPS`, 8, 8)
    }
  }

  private drawGround(ctx: CanvasRenderingContext2D): void {
    if (!this.grass) this.grass = buildGrass(ARENA / GRASS_CELL)
    ctx.drawImage(this.grass, 0, 0, ARENA, ARENA)
  }

  private drawTombs(ctx: CanvasRenderingContext2D, world: World, px: number): void {
    if (!this.tomb) this.tomb = buildPixelCanvas(TOMBSTONE, TOMBSTONE_PALETTE)
    const size = 8 * px * 0.8
    ctx.globalAlpha = 0.85
    for (const u of world.units) {
      if (u.alive) continue
      ctx.drawImage(this.tomb, u.x - size / 2, u.y - size * 0.8, size, size)
    }
    ctx.globalAlpha = 1
  }

  private drawRings(ctx: CanvasRenderingContext2D, effects: Effects): void {
    for (const r of effects.rings) {
      const t = 1 - r.life / r.maxLife
      ctx.globalAlpha = Math.max(0, 1 - t)
      ctx.beginPath()
      ctx.arc(r.x, r.y, r.radius * (0.4 + 0.6 * t), 0, Math.PI * 2)
      ctx.strokeStyle = r.color
      ctx.lineWidth = 4
      ctx.stroke()
    }
    ctx.globalAlpha = 1
  }

  private drawUnits(
    ctx: CanvasRenderingContext2D,
    world: World,
    alpha: number,
    px: number,
    scale: number,
  ): void {
    const { units, tick, finished } = world
    const size = SPRITE_SIZE * px

    // 依 y 由上往下畫，下方的人蓋住上方的人
    const order = this.order
    order.length = 0
    for (let i = 0; i < units.length; i++) if (units[i]?.alive) order.push(i)
    order.sort((a, b) => (units[a]?.y ?? 0) - (units[b]?.y ?? 0))

    // 陰影
    ctx.fillStyle = COLORS.shadow
    ctx.beginPath()
    for (const i of order) {
      const u = units[i]
      if (!u) continue
      const x = u.prevX + (u.x - u.prevX) * alpha
      const y = u.prevY + (u.y - u.prevY) * alpha
      ctx.moveTo(x + size * 0.28, y + size * 0.2)
      ctx.ellipse(x, y + size * 0.2, size * 0.28, size * 0.09, 0, 0, Math.PI * 2)
    }
    ctx.fill()

    const fontSize = Math.max(10 / scale, px * 6)
    ctx.font = `700 ${fontSize}px system-ui, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'

    for (const i of order) {
      const u = units[i]
      if (!u) continue
      const x = u.prevX + (u.x - u.prevX) * alpha
      const y = u.prevY + (u.y - u.prevY) * alpha
      const atlas = this.atlas(world, i)
      const top = y - size * 0.75
      const left = x - size / 2

      if (finished) {
        ctx.beginPath()
        ctx.ellipse(x, y + size * 0.2, size * 0.45, size * 0.16, 0, 0, Math.PI * 2)
        ctx.strokeStyle = COLORS.winner
        ctx.lineWidth = px * 1.5
        ctx.stroke()
      }

      if (atlas) {
        const moved = (u.x - u.prevX) ** 2 + (u.y - u.prevY) ** 2 > 0.01
        const walkFrame = (Math.floor(tick / 5) + i) % 2 === 0 ? FRAME.walkA : FRAME.walkB
        const frame =
          tick - u.lastAttackTick < ATTACK_TICKS ? FRAME.attack : moved ? walkFrame : FRAME.stand
        const right = Math.cos(u.facing) >= 0
        const flash = tick - u.lastHitTick < FLASH_TICKS
        const row = flash ? (right ? ROW.flashRight : ROW.flashLeft) : right ? ROW.right : ROW.left
        ctx.drawImage(
          atlas,
          frame * SPRITE_SIZE,
          row * SPRITE_SIZE,
          SPRITE_SIZE,
          SPRITE_SIZE,
          left,
          top,
          size,
          size,
        )
      }

      // 血條
      if (u.hp < u.maxHp) {
        const ratio = Math.max(0, u.hp / u.maxHp)
        const barW = size * 0.7
        const barH = Math.max(px * 1.2, 2)
        const bx = x - barW / 2
        const by = top - barH - px * 0.5
        ctx.fillStyle = COLORS.hpBack
        ctx.fillRect(bx - px * 0.3, by - px * 0.3, barW + px * 0.6, barH + px * 0.6)
        ctx.fillStyle = ratio < 0.3 ? COLORS.hpLow : ratio < 0.6 ? COLORS.hpMid : COLORS.hpFront
        ctx.fillRect(bx, by, barW * ratio, barH)
      }

      if (u.stunTimer > 0) this.drawStun(ctx, x, top - px * 3, px, tick)
      // 魔法盾可用時身上一圈淡藍光
      if (u.shieldCooldown <= 0 && CLASSES[u.classId].passiveSkill === 'manaShield') {
        ctx.strokeStyle = COLORS.manaShield
        ctx.lineWidth = px * 0.8
        ctx.beginPath()
        ctx.arc(x, y - size * 0.3, size * 0.55, 0, Math.PI * 2)
        ctx.stroke()
      }

      // 號碼
      const label = u.label.length > 6 ? `${u.label.slice(0, 5)}…` : u.label
      const ly = Math.min(top + size, ARENA + BOTTOM_PAD - fontSize)
      // 名字不超出畫面左右邊界
      const half = this.labelWidth(ctx, i, label) / 2
      const lx = Math.min(Math.max(x, -SIDE_PAD + half), ARENA + SIDE_PAD - half)
      ctx.fillStyle = COLORS.labelShadow
      ctx.fillText(label, lx + px * 0.5, ly + px * 0.5)
      ctx.fillStyle = COLORS.label
      ctx.fillText(label, lx, ly)
    }
  }

  /** 暈眩：頭上三顆繞圈的星星 */
  private drawStun(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    px: number,
    tick: number,
  ): void {
    ctx.fillStyle = COLORS.stun
    const s = px * 1.6
    for (let k = 0; k < 3; k++) {
      const a = tick * 0.25 + (k * Math.PI * 2) / 3
      const sx = x + Math.cos(a) * px * 4
      const sy = y + Math.sin(a) * px * 1.5
      ctx.fillRect(sx - s / 2, sy - s / 2, s, s)
    }
  }

  private drawProjectiles(
    ctx: CanvasRenderingContext2D,
    world: World,
    alpha: number,
    px: number,
  ): void {
    for (const p of world.projectiles) {
      if (!p.active) continue
      const x = p.prevX + (p.x - p.prevX) * alpha
      // 投射物從胸口高度飛出
      const y = p.prevY + (p.y - p.prevY) * alpha - SPRITE_SIZE * px * 0.35
      const dx = p.x - p.prevX
      const dy = p.y - p.prevY
      const len = Math.hypot(dx, dy) || 1
      const ux = dx / len
      const uy = dy / len

      if (p.kind === 'arrow' || p.kind === 'chargedArrow') {
        // 蓄力箭：更長、更粗、金色
        const charged = p.kind === 'chargedArrow'
        const tail = px * (charged ? 11 : 7)
        ctx.strokeStyle = charged ? COLORS.chargedArrow : COLORS.arrow
        ctx.lineWidth = px * (charged ? 1.6 : 0.9)
        ctx.beginPath()
        ctx.moveTo(x - ux * tail, y - uy * tail)
        ctx.lineTo(x, y)
        ctx.stroke()
        const head = charged ? px * 1.5 : px
        ctx.fillStyle = charged ? COLORS.chargedArrowHead : COLORS.arrowHead
        ctx.fillRect(x - head, y - head, head * 2, head * 2)
      } else if (p.kind === 'missile') {
        // 魔法箭：紫色光球加拖尾
        const r = px * 2.2
        ctx.fillStyle = COLORS.missileTrail
        for (let k = 1; k <= 3; k++) {
          ctx.globalAlpha = 0.5 - k * 0.12
          ctx.beginPath()
          ctx.arc(x - ux * r * k * 1.6, y - uy * r * k * 1.6, r * (1 - k * 0.2), 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.globalAlpha = 1
        ctx.fillStyle = COLORS.missile
        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#ffffff'
        ctx.beginPath()
        ctx.arc(x, y, r * 0.45, 0, Math.PI * 2)
        ctx.fill()
      } else {
        const r = px * 3
        ctx.globalAlpha = 0.35
        ctx.fillStyle = '#ff8a2a'
        ctx.beginPath()
        ctx.arc(x - ux * r, y - uy * r, r * 1.6, 0, Math.PI * 2)
        ctx.fill()
        ctx.globalAlpha = 1
        ctx.fillStyle = '#ff5a1f'
        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#fff1a8'
        ctx.beginPath()
        ctx.arc(x, y, r * 0.5, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }

  private drawParticles(ctx: CanvasRenderingContext2D, effects: Effects, scale: number): void {
    for (const p of effects.particles) {
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife)
      ctx.fillStyle = p.color
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size)
    }
    ctx.globalAlpha = 1

    const base = Math.max(11 / scale, 12)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    for (const f of effects.floaters) {
      ctx.globalAlpha = Math.max(0, f.life / f.maxLife)
      const big = f.style !== 'damage'
      ctx.font = `800 ${big ? base * 1.4 : base}px system-ui, sans-serif`
      const text = f.style === 'crit' ? `${f.text}!` : f.text
      ctx.fillStyle = 'rgba(0,0,0,0.7)'
      ctx.fillText(text, f.x + 1.5, f.y + 1.5)
      ctx.fillStyle = COLORS[f.style]
      ctx.fillText(text, f.x, f.y)
    }
    ctx.globalAlpha = 1
  }

  /** 畫面座標的疊加效果：決戰暗角、最後一擊閃光與大字 */
  private drawOverlays(ctx: CanvasRenderingContext2D, effects: Effects): void {
    const w = this.width
    const h = this.height
    if (effects.vignette > 0.01) {
      const g = ctx.createRadialGradient(
        w / 2,
        h / 2,
        Math.min(w, h) * 0.3,
        w / 2,
        h / 2,
        Math.max(w, h) * 0.75,
      )
      g.addColorStop(0, 'rgba(0,0,0,0)')
      g.addColorStop(1, `rgba(40,0,0,${(0.65 * effects.vignette).toFixed(3)})`)
      ctx.fillStyle = g
      ctx.fillRect(0, 0, w, h)
    }
    if (effects.flash > 0) {
      ctx.fillStyle = `rgba(255,255,255,${(effects.flash * 0.85).toFixed(3)})`
      ctx.fillRect(0, 0, w, h)
    }
    if (effects.finalTime > 0) {
      // 前 0.25 秒從大縮到正常，最後 0.6 秒淡出
      const shown = 2.6 - effects.finalTime
      const pop = shown < 0.25 ? 1.6 - (shown / 0.25) * 0.6 : 1
      ctx.globalAlpha = Math.min(1, effects.finalTime / 0.6)
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      const size = Math.max(28, Math.min(w, h) * 0.09) * pop
      ctx.font = `900 ${size}px system-ui, sans-serif`
      ctx.lineWidth = size * 0.12
      ctx.strokeStyle = 'rgba(0,0,0,0.85)'
      ctx.strokeText(effects.finalTitle, w / 2, h * 0.24)
      ctx.fillStyle = '#ffd34d'
      ctx.fillText(effects.finalTitle, w / 2, h * 0.24)
      if (effects.finalSubtitle) {
        const sub = Math.max(14, size * 0.38)
        ctx.font = `800 ${sub}px system-ui, sans-serif`
        ctx.lineWidth = sub * 0.15
        ctx.strokeText(effects.finalSubtitle, w / 2, h * 0.24 + size * 0.8)
        ctx.fillStyle = '#ffffff'
        ctx.fillText(effects.finalSubtitle, w / 2, h * 0.24 + size * 0.8)
      }
      ctx.globalAlpha = 1
    }
  }

  private drawBanner(ctx: CanvasRenderingContext2D, text: string, remaining: number): void {
    ctx.globalAlpha = Math.min(1, remaining)
    ctx.font = '800 22px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = 'rgba(0,0,0,0.6)'
    ctx.fillRect(0, this.height / 2 - 24, this.width, 48)
    ctx.fillStyle = '#ffcf4a'
    ctx.fillText(text, this.width / 2, this.height / 2)
    ctx.globalAlpha = 1
  }
}
