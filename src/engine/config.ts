/** 模擬步長：固定 30 tick / 秒。引擎內所有時間都從 tick 換算。 */
export const TICKS_PER_SECOND = 30
export const DT = 1 / TICKS_PER_SECOND

export const MIN_ENTRANTS = 2
export const MAX_ENTRANTS = 300
export const MAX_WINNERS = 10

/** 平衡數值集中在這裡與 classes.ts，改動會影響 golden test（見 game-engine skill）。 */
export const CONFIG = {
  arenaSize: 1000,
  spawnMargin: 30,
  /** 碰撞半徑：約等於小人偶身體寬度的一半，兩人中心至少相距 2 倍，畫面上不會疊在一起 */
  unitRadius: 14,
  attackCooldownJitter: 0.1,
  retargetInterval: 0.5,
  /** 空間格子邊長，用來加速找最近敵人 */
  gridCellSize: 50,
  /**
   * 延長賽：超過 startTime 秒後，每 interval 秒全員傷害倍率 +1（2 倍、3 倍…），
   * 確保沒有毒圈也一定會結束。
   */
  overtime: {
    startTime: 90,
    interval: 30,
  },
  /** 安全上限：超過此 tick 數依 HP 強制結算 */
  maxTicks: 300 * TICKS_PER_SECOND,
} as const
