import { useEffect } from 'react'
import { Button } from '@/components/Button'
import type { Speed } from '@/game/GameController'
import { useGameSnapshot } from '@/game/useGameSnapshot'
import { useFocusOnMount } from '@/hooks/useFocusOnMount'
import { useAppStore, type ActiveBattle } from '@/store/appStore'
import { Arena } from './Arena'
import { BattleHud } from './BattleHud'
import styles from './BattleScreen.module.css'
import { useBattleController } from './useBattleController'

const SPEEDS: Speed[] = [1, 2, 4]

type BattleScreenProps = {
  battle: ActiveBattle
}

export function BattleScreen({ battle }: BattleScreenProps) {
  const prefs = useAppStore((s) => s.prefs)
  const setPrefs = useAppStore((s) => s.setPrefs)
  const finishBattle = useAppStore((s) => s.finishBattle)
  const backToSetup = useAppStore((s) => s.backToSetup)
  const headingRef = useFocusOnMount<HTMLHeadingElement>()

  const { controller, sound } = useBattleController(battle, prefs, finishBattle)
  // HUD 只在 controller 發出新快照時 re-render（≤ 10 次/秒）
  const hud = useGameSnapshot(controller)

  // 操作直接呼叫 controller（外部系統），同時把偏好寫回 store；不用 effect 去同步
  function changeSpeed(speed: Speed) {
    controller.setSpeed(speed)
    setPrefs({ speed })
  }

  function toggleMute() {
    const muted = !prefs.muted
    sound.setMuted(muted)
    setPrefs({ muted })
  }

  function toggleFps() {
    controller.setShowFps(!prefs.showFps)
    setPrefs({ showFps: !prefs.showFps })
  }

  // 鍵盤快捷鍵：listener 是外部系統，用 effect 掛上並在 cleanup 移除。
  // handler 每次 render 都是新的函式，所以依賴陣列要列出它用到的東西。
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      const target = e.target as HTMLElement | null
      if (target?.closest('input, textarea, select')) return
      if (e.key === ' ') {
        // 焦點在按鈕上時讓瀏覽器自己處理空白鍵點擊，避免觸發兩次
        if (target?.closest('button')) return
        e.preventDefault()
        controller.togglePause()
      } else if (e.key === '1' || e.key === '2' || e.key === '4') {
        const speed = Number(e.key) as Speed
        controller.setSpeed(speed)
        setPrefs({ speed })
      } else if (e.key === 's' || e.key === 'S') {
        controller.skipToEnd()
      } else if (e.key === 'm' || e.key === 'M') {
        const muted = !useAppStore.getState().prefs.muted
        sound.setMuted(muted)
        setPrefs({ muted })
      } else if (e.key === 'f' || e.key === 'F') {
        const showFps = !useAppStore.getState().prefs.showFps
        controller.setShowFps(showFps)
        setPrefs({ showFps })
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [controller, sound, setPrefs])

  return (
    <section className={styles.screen} aria-labelledby="battle-title">
      <header className={styles.header}>
        <h1 id="battle-title" ref={headingRef} tabIndex={-1}>
          {battle.replay ? '重播中' : '大亂鬥進行中'}
        </h1>
        <span className={styles.seed}>seed {battle.seed}</span>
      </header>

      <div className={styles.layout}>
        <div className={styles.stage}>
          <Arena controller={controller} />

          <div className={styles.controls} role="toolbar" aria-label="對戰控制">
            <Button
              variant="primary"
              onClick={() => controller.togglePause()}
              disabled={hud.finished}
              aria-keyshortcuts="Space"
            >
              {hud.paused ? '▶ 繼續' : '⏸ 暫停'}
            </Button>
            <div className={styles.speedGroup} role="group" aria-label="速度">
              {SPEEDS.map((s) => (
                <Button
                  key={s}
                  aria-pressed={hud.speed === s}
                  aria-keyshortcuts={String(s)}
                  onClick={() => changeSpeed(s)}
                >
                  {s}x
                </Button>
              ))}
            </div>
            <Button onClick={() => controller.skipToEnd()} aria-keyshortcuts="S">
              ⏭ 直接看結果
            </Button>
            <Button
              variant="ghost"
              onClick={toggleMute}
              aria-pressed={!prefs.muted}
              aria-keyshortcuts="M"
            >
              {prefs.muted ? '🔇 音效關' : '🔊 音效開'}
            </Button>
            <Button
              variant="ghost"
              onClick={toggleFps}
              aria-pressed={prefs.showFps}
              aria-keyshortcuts="F"
            >
              FPS
            </Button>
            <Button variant="ghost" onClick={backToSetup}>
              放棄這場
            </Button>
          </div>
          <p className={styles.hint}>
            快捷鍵：Space 暫停 · 1 / 2 / 4 速度 · S 看結果 · M 音效 · F FPS
          </p>
        </div>
        <BattleHud hud={hud} />
      </div>
    </section>
  )
}
