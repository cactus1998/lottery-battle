import { create } from 'zustand'
import { MAX_WINNERS } from '@/engine/config'
import { randomSeed } from '@/engine/rng'
import type { BattleConfig, BattleResult, BattleSettings } from '@/engine/types'
import type { Speed } from '@/game/GameController'
import { loadStored, removeStored, saveStored } from '@/lib/storage'

export type Phase = 'setup' | 'battle' | 'result'

export interface SetupDraft {
  mode: 'range' | 'list'
  rangeStart: string
  rangeEnd: string
  exclude: string
  listText: string
  /** 一個名次一個獎品，獎品數量 = 得獎人數 */
  prizes: PrizeDraft[]
  seedText: string
}

export interface PrizeDraft {
  /** 穩定的 key，刪除中間某一列時不會讓其他輸入框錯位 */
  id: number
  name: string
}

export interface HistoryEntry {
  id: string
  finishedAt: number
  seed: number
  settings: BattleSettings
  entrants: string[]
  winners: string[]
  durationSec: number
}

export interface Prefs {
  speed: Speed
  muted: boolean
  showFps: boolean
}

export interface ActiveBattle extends BattleConfig {
  /** 重播不會再寫一筆歷史紀錄 */
  replay: boolean
}

export const HISTORY_LIMIT = 20
/** 獎品最多 10 種，與得獎人數上限相同 */
export const MAX_PRIZES = MAX_WINNERS
const HISTORY_KEY = 'history'
const HISTORY_VERSION = 1
const PREFS_KEY = 'prefs'
const PREFS_VERSION = 1

const DEFAULT_DRAFT: SetupDraft = {
  mode: 'range',
  rangeStart: '1',
  rangeEnd: '30',
  exclude: '',
  listText: '',
  prizes: [{ id: 1, name: '頭獎' }],
  seedText: '',
}

const DEFAULT_PREFS: Prefs = { speed: 1, muted: true, showFps: false }

function isHistory(data: unknown): data is HistoryEntry[] {
  return (
    Array.isArray(data) &&
    data.every(
      (e: Partial<HistoryEntry>) =>
        typeof e?.id === 'string' &&
        typeof e.seed === 'number' &&
        Array.isArray(e.entrants) &&
        Array.isArray(e.winners) &&
        typeof e.settings?.winners === 'number',
    )
  )
}

function isPrefs(data: unknown): data is Prefs {
  const p = data as Partial<Prefs> | null
  return (
    !!p &&
    (p.speed === 1 || p.speed === 2 || p.speed === 4) &&
    typeof p.muted === 'boolean' &&
    typeof p.showFps === 'boolean'
  )
}

interface AppState {
  phase: Phase
  draft: SetupDraft
  battle: ActiveBattle | null
  /** 每開一場就 +1，作為 BattleScreen 的 key，讓重播時重新建立 GameController */
  battleKey: number
  result: BattleResult | null
  history: HistoryEntry[]
  prefs: Prefs

  updateDraft: (patch: Partial<SetupDraft>) => void
  addPrize: () => void
  updatePrize: (id: number, name: string) => void
  removePrize: (id: number) => void
  startBattle: (config: BattleConfig) => void
  finishBattle: (result: BattleResult) => void
  /** 同 seed 重播，結果會完全相同 */
  replay: () => void
  /** 同名單、新 seed 再開一場 */
  rematch: () => void
  backToSetup: () => void
  replayHistory: (entry: HistoryEntry) => void
  clearHistory: () => void
  setPrefs: (patch: Partial<Prefs>) => void
}

export const useAppStore = create<AppState>()((set, get) => ({
  phase: 'setup',
  draft: DEFAULT_DRAFT,
  battle: null,
  battleKey: 0,
  result: null,
  history: loadStored(HISTORY_KEY, HISTORY_VERSION, [], isHistory),
  prefs: loadStored(PREFS_KEY, PREFS_VERSION, DEFAULT_PREFS, isPrefs),

  updateDraft: (patch) => set((s) => ({ draft: { ...s.draft, ...patch } })),

  addPrize: () =>
    set((s) => {
      if (s.draft.prizes.length >= MAX_PRIZES) return s
      const id = Math.max(0, ...s.draft.prizes.map((p) => p.id)) + 1
      return { draft: { ...s.draft, prizes: [...s.draft.prizes, { id, name: '' }] } }
    }),

  updatePrize: (id, name) =>
    set((s) => ({
      draft: {
        ...s.draft,
        prizes: s.draft.prizes.map((p) => (p.id === id ? { ...p, name } : p)),
      },
    })),

  removePrize: (id) =>
    set((s) => {
      if (s.draft.prizes.length <= 1) return s
      return { draft: { ...s.draft, prizes: s.draft.prizes.filter((p) => p.id !== id) } }
    }),

  startBattle: (config) =>
    set((s) => ({
      phase: 'battle',
      battle: { ...config, replay: false },
      battleKey: s.battleKey + 1,
      result: null,
    })),

  finishBattle: (result) => {
    const { battle, history } = get()
    if (!battle) return
    let nextHistory = history
    if (!battle.replay) {
      const entry: HistoryEntry = {
        id: crypto.randomUUID(),
        finishedAt: Date.now(),
        seed: result.seed,
        settings: result.settings,
        entrants: battle.entrants.map((e) => e.label),
        winners: result.ranking.filter((r) => r.winner).map((r) => r.label),
        durationSec: result.durationSec,
      }
      nextHistory = [entry, ...history].slice(0, HISTORY_LIMIT)
      saveStored(HISTORY_KEY, HISTORY_VERSION, nextHistory)
    }
    set({ phase: 'result', result, history: nextHistory })
  },

  replay: () => {
    const { battle } = get()
    if (!battle) return
    set((s) => ({
      phase: 'battle',
      battle: { ...battle, replay: true },
      battleKey: s.battleKey + 1,
      result: null,
    }))
  },

  rematch: () => {
    const { battle } = get()
    if (!battle) return
    get().startBattle({ entrants: battle.entrants, settings: battle.settings, seed: randomSeed() })
  },

  backToSetup: () => set({ phase: 'setup', result: null }),

  replayHistory: (entry) =>
    set((s) => ({
      phase: 'battle',
      battle: {
        entrants: entry.entrants.map((label, id) => ({ id, label })),
        settings: entry.settings,
        seed: entry.seed,
        replay: true,
      },
      battleKey: s.battleKey + 1,
      result: null,
    })),

  clearHistory: () => {
    removeStored(HISTORY_KEY)
    set({ history: [] })
  },

  setPrefs: (patch) => {
    const prefs = { ...get().prefs, ...patch }
    saveStored(PREFS_KEY, PREFS_VERSION, prefs)
    set({ prefs })
  },
}))

/** 測試用：回到初始狀態 */
export function resetAppStore(): void {
  useAppStore.setState({
    phase: 'setup',
    draft: DEFAULT_DRAFT,
    battle: null,
    battleKey: 0,
    result: null,
    history: [],
    prefs: DEFAULT_PREFS,
  })
}
