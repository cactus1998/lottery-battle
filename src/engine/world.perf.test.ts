import { expect, it } from 'vitest'
import { createWorld, step } from './world'

/**
 * step() 耗時量測（/perf-audit 用）。目標 300 人 ≤ 2ms；斷言放寬到 p95 < 5ms，避免機器忙碌時誤報。
 * 量測 300 人開場後前 300 個 tick（人數最多、最耗時的階段）。
 */
it('steps 300 entrants within budget', () => {
  const world = createWorld({
    entrants: Array.from({ length: 300 }, (_, i) => ({ id: i, label: String(i + 1) })),
    settings: { winners: 1 },
    seed: 2026,
  })
  const samples: number[] = []
  for (let i = 0; i < 300 && !world.finished; i++) {
    const t0 = performance.now()
    step(world)
    samples.push(performance.now() - t0)
    world.events.length = 0
  }
  samples.sort((a, b) => a - b)
  const mean = samples.reduce((s, v) => s + v, 0) / samples.length
  const p95 = samples[Math.floor(samples.length * 0.95)] ?? 0
  console.info(`step() 300 entrants: mean ${mean.toFixed(3)}ms, p95 ${p95.toFixed(3)}ms`)
  expect(p95).toBeLessThan(5)
})
