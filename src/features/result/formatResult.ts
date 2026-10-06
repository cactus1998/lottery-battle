import { CLASSES } from '@/engine/classes'
import type { BattleResult } from '@/engine/types'

export function formatDuration(sec: number): string {
  return `${sec.toFixed(1)} 秒`
}

/** 複製到剪貼簿用的純文字結果 */
export function formatResultText(result: BattleResult): string {
  const winners = result.ranking.filter((r) => r.winner)
  const lines = [
    `號碼大亂鬥結果（${result.total} 人取 ${result.settings.winners} 名，seed ${result.seed}）`,
    ...winners.map(
      (r) => `第 ${r.rank} 名：${r.label}（${CLASSES[r.classId].name}，${r.kills} 殺）`,
    ),
    `對戰時間 ${formatDuration(result.durationSec)}`,
  ]
  return lines.join('\n')
}
