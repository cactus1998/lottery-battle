import { CONFIG } from '@/engine/config'
import type { World } from '@/engine/types'

const ARENA = CONFIG.arenaSize

/** 預設鏡頭中心（場地座標），配合 renderer 上方多留的空間 */
export const DEFAULT_CENTER = { x: ARENA / 2, y: 490 }
/** 決戰時鏡頭框住存活者時四周保留的空間 */
const FRAME_PADDING = 140
const MAX_ZOOM = 2.4
/** 最後一擊鏡頭衝刺的放大倍率 */
const PUNCH_ZOOM = 2.8
/** 跟隨速度：數字越大越快到位 */
const FOLLOW_RATE = 2.5
const PUNCH_RATE = 7

/** 可視範圍（場地座標，含 renderer 四周保留的空間），鏡頭不會拍到範圍外 */
const VIEW_MIN_X = -30
const VIEW_MAX_X = ARENA + 30
const VIEW_MIN_Y = -50
const VIEW_MAX_Y = ARENA + 30

/** 依縮放倍率限制鏡頭中心，讓畫面邊緣不超出可視範圍 */
export function clampTarget(t: CameraTarget): CameraTarget {
  const halfW = (VIEW_MAX_X - VIEW_MIN_X) / 2 / t.zoom
  const halfH = (VIEW_MAX_Y - VIEW_MIN_Y) / 2 / t.zoom
  const clamp = (v: number, min: number, max: number) =>
    min > max ? (min + max) / 2 : Math.min(Math.max(v, min), max)
  return {
    zoom: t.zoom,
    x: clamp(t.x, VIEW_MIN_X + halfW, VIEW_MAX_X - halfW),
    y: clamp(t.y, VIEW_MIN_Y + halfH, VIEW_MAX_Y - halfH),
  }
}

export interface CameraTarget {
  x: number
  y: number
  zoom: number
}

/** 框住所有存活者的鏡頭目標；只剩一個人時以他為中心放到最大 */
export function frameAlive(world: World): CameraTarget {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const u of world.units) {
    if (!u.alive) continue
    minX = Math.min(minX, u.x)
    maxX = Math.max(maxX, u.x)
    minY = Math.min(minY, u.y)
    maxY = Math.max(maxY, u.y)
  }
  if (minX === Infinity) return { ...DEFAULT_CENTER, zoom: 1 }
  const w = maxX - minX + FRAME_PADDING * 2
  const h = maxY - minY + FRAME_PADDING * 2
  const zoom = Math.min(MAX_ZOOM, Math.max(1, ARENA / Math.max(w, h)))
  // 人物是從腳往上畫，中心稍微往上移讓頭部也在畫面內
  return { x: (minX + maxX) / 2, y: (minY + maxY) / 2 - 15, zoom }
}

/**
 * 鏡頭：每幀以指數平滑靠近目標，看起來像攝影機慢慢推近。
 * 純畫面效果，不影響模擬。
 */
export class Camera {
  x = DEFAULT_CENTER.x
  y = DEFAULT_CENTER.y
  zoom = 1
  private target: CameraTarget = { ...DEFAULT_CENTER, zoom: 1 }
  private rate = FOLLOW_RATE

  /** 回到全場 */
  reset(): void {
    this.follow({ ...DEFAULT_CENTER, zoom: 1 })
  }

  follow(target: CameraTarget): void {
    this.target = clampTarget(target)
    this.rate = FOLLOW_RATE
  }

  /** 最後一擊：快速衝向某個位置 */
  punch(x: number, y: number): void {
    this.target = clampTarget({ x, y: y - 15, zoom: PUNCH_ZOOM })
    this.rate = PUNCH_RATE
  }

  update(dt: number): void {
    const k = 1 - Math.exp(-dt * this.rate)
    this.x += (this.target.x - this.x) * k
    this.y += (this.target.y - this.y) * k
    this.zoom += (this.target.zoom - this.zoom) * k
  }
}
