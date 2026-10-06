import { BattleScreen } from '@/features/battle/BattleScreen'
import { HistoryPanel } from '@/features/history/HistoryPanel'
import { ResultScreen } from '@/features/result/ResultScreen'
import { SetupScreen } from '@/features/setup/SetupScreen'
import { useAppStore } from '@/store/appStore'

/** 畫面切換：依 store 的 phase 決定顯示哪一個（相當於沒有 router 的 v-if / v-else-if）。 */
export default function App() {
  const phase = useAppStore((s) => s.phase)
  const battle = useAppStore((s) => s.battle)
  const battleKey = useAppStore((s) => s.battleKey)
  const result = useAppStore((s) => s.result)

  return (
    <main className="app">
      {phase === 'battle' && battle ? (
        // key 改變 = 卸載舊元件、掛載新元件，重播時會得到全新的 GameController
        <BattleScreen key={battleKey} battle={battle} />
      ) : phase === 'result' && result ? (
        <ResultScreen result={result} />
      ) : (
        <>
          <SetupScreen />
          <HistoryPanel />
        </>
      )}
    </main>
  )
}
