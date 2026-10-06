import { useEffect, useState } from 'react'
import type { BattleConfig, BattleResult } from '@/engine/types'
import { GameController } from '@/game/GameController'
import { SoundPlayer } from '@/game/sound'
import type { Prefs } from '@/store/appStore'

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  )
}

/**
 * 建立並管理這場對戰的 GameController 與音效。
 *
 * - `useState(() => new X())` 的惰性初始化：只在第一次 render 建立，之後每次 render 拿到同一個實例
 *   （React 元件函式每次 render 都重跑，直接 `new` 會每次都建一個新的；Vue 的 setup() 只跑一次所以不用想這件事）。
 * - useEffect 只負責「啟動 / 停止迴圈」這個外部副作用；StrictMode 開發模式會 start → stop → start，
 *   controller 設計成可以重複啟停。
 * - 要開新的一場（重播）由上層換 key 讓整個元件重新掛載。
 */
export function useBattleController(
  config: BattleConfig,
  initialPrefs: Prefs,
  onFinish: (result: BattleResult) => void,
) {
  const [sound] = useState(() => new SoundPlayer(initialPrefs.muted))
  const [controller] = useState(
    () =>
      new GameController(config, {
        speed: initialPrefs.speed,
        showFps: initialPrefs.showFps,
        reducedMotion: prefersReducedMotion(),
        sound,
        onFinish,
      }),
  )

  // 每次 render 的 onFinish 可能是新函式，交給 controller 更新，避免它呼叫到舊的（stale closure）
  useEffect(() => {
    controller.setOnFinish(onFinish)
  }, [controller, onFinish])

  useEffect(() => {
    controller.start()
    return () => controller.stop()
  }, [controller])

  useEffect(() => {
    // 上次開著音效：嘗試建立 AudioContext（瀏覽器可能要等使用者互動後才允許播放）
    if (!sound.muted) sound.setMuted(false)
    return () => sound.dispose()
  }, [sound])

  return { controller, sound }
}
