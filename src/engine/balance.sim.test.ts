/// <reference types="node" />
import { writeFileSync } from 'node:fs'
import { it } from 'vitest'
import { CLASS_IDS, type ClassId } from './classes'
import { CONFIG } from './config'
import type { BattleResult } from './types'
import { createWorld, stepUntilEnd } from './world'

/**
 * 職業平衡模擬（見 docs/PRD-class-balance.md）。預設 skip，調平衡時執行：
 *   BALANCE=1 npx vitest run src/engine/balance.sim.test.ts
 * 可用 BALANCE_SIZES=10,20,30 指定多人局人數、BALANCE_SEEDS=100 指定每種人數的場數、
 * BALANCE_DUELS=2000 指定 2 人局場數（0 表示不跑），BALANCE_OUT=<路徑> 另存結果到檔案。
 */
const enabled = Boolean(process.env.BALANCE)
const SIZES = (process.env.BALANCE_SIZES ?? '10,20,30,100,300').split(',').map(Number)
const SEEDS = Number(process.env.BALANCE_SEEDS ?? 100)
const DUELS = Number(process.env.BALANCE_DUELS ?? 2000)

function run(count: number, seed: number, winners: number): BattleResult {
  return stepUntilEnd(
    createWorld({
      entrants: Array.from({ length: count }, (_, i) => ({ id: i, label: String(i + 1) })),
      settings: { winners },
      seed,
    }),
  )
}

const pad = (v: string | number, n: number) => String(v).padStart(n)

it.skipIf(!enabled)(
  'balance simulation',
  () => {
    const out: string[] = []

    if (DUELS > 0) {
      const wins = {} as Record<ClassId, Record<ClassId, number>>
      for (const a of CLASS_IDS) {
        wins[a] = {} as Record<ClassId, number>
        for (const b of CLASS_IDS) wins[a][b] = 0
      }
      for (let seed = 1; seed <= DUELS; seed++) {
        const r = run(2, seed, 1)
        const w = r.ranking[0]?.classId
        const l = r.ranking[1]?.classId
        if (w && l && w !== l) wins[w][l]++
      }
      out.push(`\n=== 1v1（2 人局 ${DUELS} 場）勝率：列對欄`)
      out.push('          ' + CLASS_IDS.map((c) => pad(c.slice(0, 8), 10)).join(''))
      let worst = 0.5
      for (const a of CLASS_IDS) {
        const cells = CLASS_IDS.map((b) => {
          if (a === b) return pad('-', 10)
          const total = wins[a][b] + wins[b][a]
          const rate = total ? wins[a][b] / total : 0.5
          if (Math.abs(rate - 0.5) > Math.abs(worst - 0.5)) worst = rate
          return pad(`${(rate * 100).toFixed(0)}%(${total})`, 10)
        })
        out.push(a.padEnd(10) + cells.join(''))
      }
      out.push(`最偏組合勝率 ${(Math.max(worst, 1 - worst) * 100).toFixed(1)}%`)
    }

    const pooled = {} as Record<ClassId, { win: number; top3: number; share: number }>
    for (const c of CLASS_IDS) pooled[c] = { win: 0, top3: 0, share: 0 }
    let pooledGames = 0

    for (const n of SIZES) {
      const s = {} as Record<
        ClassId,
        { cnt: number; win: number; top3: number; pct: number; kills: number }
      >
      for (const c of CLASS_IDS) s[c] = { cnt: 0, win: 0, top3: 0, pct: 0, kills: 0 }
      let total = 0
      let max = 0
      let forced = 0
      for (let i = 1; i <= SEEDS; i++) {
        const r = run(n, i * 7919, 3)
        total += r.durationSec
        max = Math.max(max, r.durationSec)
        if (r.ticks >= CONFIG.maxTicks) forced++
        for (const row of r.ranking) {
          const x = s[row.classId]
          x.cnt++
          x.kills += row.kills
          x.pct += (n - row.rank) / (n - 1)
          if (row.rank === 1) x.win++
          if (row.rank <= 3) x.top3++
        }
      }
      out.push(
        `\n=== ${n} 人 × ${SEEDS} 場｜平均 ${(total / SEEDS).toFixed(1)}s 最長 ${max.toFixed(1)}s｜強制結算 ${forced}`,
      )
      out.push('職業        冠軍率  冠軍/期望  前3/期望  名次分位  場均擊殺')
      for (const c of CLASS_IDS) {
        const x = s[c]
        const share = x.cnt / (n * SEEDS)
        if (n <= 30) {
          pooled[c].win += x.win
          pooled[c].top3 += x.top3
          pooled[c].share += share * SEEDS
        }
        out.push(
          c.padEnd(10) +
            pad(`${((x.win / SEEDS) * 100).toFixed(0)}%`, 8) +
            pad((x.win / SEEDS / share).toFixed(2), 11) +
            pad((x.top3 / (3 * SEEDS * share)).toFixed(2), 10) +
            pad((x.pct / x.cnt).toFixed(3), 10) +
            pad((x.kills / x.cnt).toFixed(2), 10),
        )
      }
      if (n <= 30) pooledGames += SEEDS
    }

    if (pooledGames > 0) {
      out.push(`\n=== 30 人以下合計 ${pooledGames} 場`)
      out.push('職業        冠軍數  期望    前3/期望')
      for (const c of CLASS_IDS) {
        const x = pooled[c]
        out.push(
          c.padEnd(10) +
            pad(x.win, 8) +
            pad(x.share.toFixed(0), 6) +
            pad((x.top3 / (3 * x.share)).toFixed(2), 12),
        )
      }
    }

    const text = out.join('\n')
    if (process.env.BALANCE_OUT) writeFileSync(process.env.BALANCE_OUT, text)
    console.log(text)
  },
  3_600_000,
)
