import { expect, it } from 'vitest'
import { createWorld, stepUntilEnd } from './world'

/**
 * golden test：固定 seed 與名單的結果。
 * 改動平衡數值或系統順序造成這裡失敗時，先確認變化是刻意的，再更新期望值（見 game-engine skill）。
 */
it('produces the recorded ranking for seed 20261006', () => {
  const result = stepUntilEnd(
    createWorld({
      entrants: Array.from({ length: 16 }, (_, i) => ({ id: i, label: String(i + 1) })),
      settings: { winners: 3 },
      seed: 20261006,
    }),
  )
  expect({ ticks: result.ticks, order: result.ranking.map((r) => `${r.label}:${r.classId}`) })
    .toMatchInlineSnapshot(`
      {
        "order": [
          "2:swordsman",
          "12:knight",
          "11:swordsman",
          "10:knight",
          "1:swordsman",
          "13:archer",
          "8:assassin",
          "6:assassin",
          "7:archer",
          "16:knight",
          "4:mage",
          "15:assassin",
          "14:mage",
          "3:archer",
          "5:mage",
          "9:archer",
        ],
        "ticks": 1378,
      }
    `)
})
