import type { Unit } from './types'

/**
 * 均勻格子空間索引。每 tick 依存活小人位置重建，找最近敵人時由近到遠一圈圈搜尋，
 * 300 人時避免 O(n²)。格子陣列建立後重用，不在每 tick 配置新陣列。
 */
export class SpatialGrid {
  readonly cellSize: number
  readonly cols: number
  private readonly cells: number[][]

  constructor(size: number, cellSize: number) {
    this.cellSize = cellSize
    this.cols = Math.ceil(size / cellSize)
    this.cells = Array.from({ length: this.cols * this.cols }, () => [])
  }

  private cellCoord(v: number): number {
    const c = Math.floor(v / this.cellSize)
    return c < 0 ? 0 : c >= this.cols ? this.cols - 1 : c
  }

  rebuild(units: readonly Unit[]): void {
    for (const cell of this.cells) cell.length = 0
    for (let i = 0; i < units.length; i++) {
      const u = units[i]
      if (!u?.alive) continue
      this.cells[this.cellCoord(u.y) * this.cols + this.cellCoord(u.x)]?.push(i)
    }
  }

  /** 回傳離 units[self] 最近的其他存活小人索引；同距離取索引小者。沒有則回傳 -1。 */
  nearest(units: readonly Unit[], self: number): number {
    const me = units[self]
    if (!me) return -1
    const cx = this.cellCoord(me.x)
    const cy = this.cellCoord(me.y)
    let best = -1
    let bestD2 = Infinity

    for (let r = 0; r < this.cols; r++) {
      for (let gy = cy - r; gy <= cy + r; gy++) {
        if (gy < 0 || gy >= this.cols) continue
        const onEdgeRow = gy === cy - r || gy === cy + r
        // 只走這一圈的邊界格子
        const step = onEdgeRow || r === 0 ? 1 : 2 * r
        for (let gx = cx - r; gx <= cx + r; gx += step) {
          if (gx < 0 || gx >= this.cols) continue
          const cell = this.cells[gy * this.cols + gx]
          if (!cell) continue
          for (const j of cell) {
            if (j === self) continue
            const u = units[j]
            if (!u?.alive) continue
            const dx = u.x - me.x
            const dy = u.y - me.y
            const d2 = dx * dx + dy * dy
            if (d2 < bestD2 || (d2 === bestD2 && j < best)) {
              best = j
              bestD2 = d2
            }
          }
        }
      }
      // 尚未搜尋的格子距離至少 r * cellSize
      const reach = r * this.cellSize
      if (best !== -1 && bestD2 <= reach * reach) break
    }
    return best
  }

  /**
   * 把 (x, y) 周圍 radius 涵蓋格子內的索引寫進 out（會先清空），呼叫端自行判斷精確距離。
   * 用呼叫端提供的陣列，熱迴圈內不配置新陣列。
   */
  queryInto(x: number, y: number, radius: number, out: number[]): number[] {
    out.length = 0
    const x0 = this.cellCoord(x - radius)
    const x1 = this.cellCoord(x + radius)
    const y0 = this.cellCoord(y - radius)
    const y1 = this.cellCoord(y + radius)
    for (let gy = y0; gy <= y1; gy++) {
      for (let gx = x0; gx <= x1; gx++) {
        const cell = this.cells[gy * this.cols + gx]
        if (!cell) continue
        for (const j of cell) out.push(j)
      }
    }
    return out
  }
}
