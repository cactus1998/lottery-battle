/** 可重現的亂數產生器（mulberry32）。同一個 seed 一定產生同一串數字，讓同一場對戰可以重播。 */
export interface Rng {
  /** [0, 1) 浮點數 */
  next(): number
  /** [min, max] 整數 */
  int(min: number, max: number): number
  /** [min, max) 浮點數 */
  range(min: number, max: number): number
}

export function createRng(seed: number): Rng {
  let a = seed >>> 0
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  return {
    next,
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    range: (min, max) => min + next() * (max - min),
  }
}

/** 產生新的隨機 seed（只在開局時呼叫一次，引擎內部一律用 Rng）。 */
export function randomSeed(): number {
  return crypto.getRandomValues(new Uint32Array(1))[0] ?? 1
}
