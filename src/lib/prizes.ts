import type { BattleSettings } from '@/engine/types'

/** 第 rank 名的獎品；沒有設定或超出得獎名次時回傳 undefined */
export function prizeForRank(settings: BattleSettings, rank: number): string | undefined {
  if (rank > settings.winners) return undefined
  const prize = settings.prizes?.[rank - 1]?.trim()
  return prize ? prize : undefined
}
