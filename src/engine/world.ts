import { CLASS_IDS, CLASSES, type ClassId } from './classes'
import { CONFIG, DT } from './config'
import { createRng } from './rng'
import { SpatialGrid } from './spatialGrid'
import { combatSystem } from './systems/combat'
import { killUnit } from './systems/death'
import { movementSystem } from './systems/movement'
import { targetingSystem } from './systems/targeting'
import { overtimeSystem } from './systems/overtime'
import { projectileSystem } from './systems/projectiles'
import type { BattleConfig, BattleResult, RankingRow, Unit, World } from './types'

/** 黃金角分配色相，相鄰號碼顏色差異大 */
const GOLDEN_ANGLE = 137.508

/**
 * 職業分配：每種職業先各發 floor(n / 5) 張，餘數從洗牌後的職業清單取不重複的幾種，
 * 整副牌再用 rng 洗牌依序發給參加者。各職業人數最多差 1，每人拿到任一職業的機率相同。
 */
function dealClasses(count: number, rng: World['rng']): ClassId[] {
  const shuffle = <T>(arr: T[]): T[] => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = rng.int(0, i)
      const tmp = arr[i] as T
      arr[i] = arr[j] as T
      arr[j] = tmp
    }
    return arr
  }
  const full = Math.floor(count / CLASS_IDS.length) * CLASS_IDS.length
  const deck = Array.from({ length: full }, (_, i) => CLASS_IDS[i % CLASS_IDS.length] as ClassId)
  deck.push(...shuffle([...CLASS_IDS]).slice(0, count - full))
  return shuffle(deck)
}

export function createWorld({ entrants, settings, seed }: BattleConfig): World {
  const rng = createRng(seed)
  const { arenaSize, spawnMargin, retargetInterval } = CONFIG
  const classes = dealClasses(entrants.length, rng)

  const units: Unit[] = entrants.map((e, i) => {
    const classId = classes[i] as ClassId
    const stats = CLASSES[classId]
    const x = rng.range(spawnMargin, arenaSize - spawnMargin)
    const y = rng.range(spawnMargin, arenaSize - spawnMargin)
    return {
      id: i,
      label: e.label,
      classId,
      hue: (i * GOLDEN_ANGLE) % 360,
      x,
      y,
      prevX: x,
      prevY: y,
      facing: rng.range(-Math.PI, Math.PI),
      hp: stats.maxHp,
      maxHp: stats.maxHp,
      alive: true,
      target: -1,
      // 錯開每個人的節奏，避免全部在同一個 tick 動作
      retargetTimer: rng.range(0, retargetInterval),
      cooldown: rng.range(0, stats.cooldown),
      attackCount: 0,
      kills: 0,
      damageDealt: 0,
      deathTick: -1,
      lastHitTick: -100,
      lastAttackTick: -100,
      stunTimer: 0,
      mongooseCooldown: 0,
      shieldCooldown: 0,
      fury: false,
    }
  })

  const world: World = {
    seed,
    settings,
    tick: 0,
    units,
    projectiles: [],
    aliveCount: units.length,
    finished: units.length <= settings.winners,
    damageMultiplier: 1,
    deathOrder: [],
    events: [],
    rng,
    grid: new SpatialGrid(arenaSize, CONFIG.gridCellSize),
    scratch: [],
    neighbors: [],
  }
  world.grid.rebuild(units)
  return world
}

/** 推進一個 tick。系統順序固定：overtime → targeting → movement → combat → projectiles。 */
export function step(world: World): void {
  if (world.finished) return
  world.tick++

  for (const u of world.units) {
    u.prevX = u.x
    u.prevY = u.y
  }

  overtimeSystem(world)
  world.grid.rebuild(world.units)
  targetingSystem(world)
  movementSystem(world)
  world.grid.rebuild(world.units)
  if (combatSystem(world)) return
  if (projectileSystem(world)) return

  if (world.tick >= CONFIG.maxTicks) forceFinish(world)
}

/** 安全網：超過 maxTicks 時依 HP 由低到高淘汰，直到剩下得獎人數。 */
function forceFinish(world: World): void {
  const alive = world.units.filter((u) => u.alive).sort((a, b) => a.hp - b.hp || b.id - a.id)
  for (const u of alive) {
    if (killUnit(world, u.id, null)) break
  }
}

/** 直接跑到結束（「看結果」與測試用），回傳結果。 */
export function stepUntilEnd(world: World): BattleResult {
  while (!world.finished) step(world)
  world.events.length = 0
  return getResult(world)
}

export function getResult(world: World): BattleResult {
  const durationSec = world.tick * DT
  const survivors = world.units
    .filter((u) => u.alive)
    .sort((a, b) => b.hp - a.hp || b.kills - a.kills || a.id - b.id)
  const fallen = [...world.deathOrder].reverse().map((i) => world.units[i] as Unit)

  const ranking: RankingRow[] = [...survivors, ...fallen].map((u, i) => ({
    rank: i + 1,
    id: u.id,
    label: u.label,
    classId: u.classId,
    hue: u.hue,
    kills: u.kills,
    damageDealt: Math.round(u.damageDealt),
    survivedSec: u.alive ? durationSec : u.deathTick * DT,
    winner: u.alive,
  }))

  return {
    seed: world.seed,
    settings: world.settings,
    ticks: world.tick,
    durationSec,
    total: world.units.length,
    ranking,
  }
}
