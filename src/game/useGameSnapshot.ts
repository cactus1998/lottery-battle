import { useSyncExternalStore } from 'react'
import type { GameController, HudSnapshot } from './GameController'

/**
 * 訂閱 GameController 的 HUD 快照。
 * 等同 Vue 裡把外部物件包成 shallowRef + 手動觸發：controller 呼叫 listener 時 React 才 re-render。
 */
export function useGameSnapshot(controller: GameController): HudSnapshot {
  return useSyncExternalStore(controller.subscribe, controller.getSnapshot)
}
