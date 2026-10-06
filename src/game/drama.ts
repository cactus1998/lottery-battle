import type { World } from '@/engine/types'

/**
 * 結尾的戲劇效果階段（純畫面節奏，不影響模擬結果）：
 * - none：一般對戰
 * - final：決戰時刻，剩下得獎人數 + 2 人以內
 * - matchPoint：賽點，只差一人就分出勝負，且有人血量偏低
 * - finished：勝負已分
 */
export type DramaLevel = 'none' | 'final' | 'matchPoint' | 'finished'

/** 進入決戰時刻時，比得獎人數多幾人 */
export const FINAL_EXTRA = 2
/** 賽點時，存活者最低血量比例低於此值才觸發 */
export const MATCH_POINT_HP = 0.35

/** 各階段的遊戲速度倍率（乘在使用者選的 1x / 2x / 4x 上） */
export const DRAMA_TIME_SCALE: Record<DramaLevel, number> = {
  none: 1,
  final: 0.7,
  matchPoint: 0.4,
  finished: 1,
}

export function dramaLevel(world: World): DramaLevel {
  if (world.finished) return 'finished'
  const { winners } = world.settings
  // 人數本來就很少（例如 3 人取 1 名）時，一開場就是決戰太早，至少要淘汰過一人
  if (world.units.length <= winners + FINAL_EXTRA && world.deathOrder.length === 0) return 'none'
  if (world.aliveCount > winners + FINAL_EXTRA) return 'none'
  if (world.aliveCount === winners + 1) {
    for (const u of world.units) {
      if (u.alive && u.hp / u.maxHp < MATCH_POINT_HP) return 'matchPoint'
    }
  }
  return 'final'
}
