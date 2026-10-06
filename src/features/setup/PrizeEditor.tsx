import { useEffect, useRef, type KeyboardEvent } from 'react'
import { Button } from '@/components/Button'
import { MAX_PRIZES, useAppStore } from '@/store/appStore'
import styles from './SetupScreen.module.css'

/** 獎品欄位：一個名次一個獎品，由上到下依序是第 1、2、3… 名 */
export function PrizeEditor() {
  const prizes = useAppStore((s) => s.draft.prizes)
  const addPrize = useAppStore((s) => s.addPrize)
  const updatePrize = useAppStore((s) => s.updatePrize)
  const removePrize = useAppStore((s) => s.removePrize)

  // 新增一列後把焦點移到新的輸入框（DOM 操作屬於副作用，放在 effect 裡）
  const prevCount = useRef(prizes.length)
  useEffect(() => {
    const last = prizes.at(-1)
    if (last && prizes.length > prevCount.current) {
      document.getElementById(`prize-${last.id}`)?.focus()
    }
    prevCount.current = prizes.length
  }, [prizes])

  // 在獎品欄按 Enter 新增下一個獎品，而不是送出表單開打
  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>, index: number) {
    if (e.key !== 'Enter' || e.nativeEvent.isComposing) return
    e.preventDefault()
    if (index === prizes.length - 1) addPrize()
    else document.getElementById(`prize-${prizes[index + 1]?.id}`)?.focus()
  }

  return (
    <fieldset className={styles.prizes}>
      <legend>
        獎品
        <span className={styles.legendHint}>
          一個名次一個，最多 {MAX_PRIZES} 個，填幾個就取幾名
        </span>
      </legend>
      <ol className={styles.prizeList}>
        {prizes.map((p, i) => (
          // key 用穩定 id，刪除中間某一列時其他輸入框不會錯位（React 的 key 等同 Vue v-for 的 :key）
          <li key={p.id} className={styles.prizeRow}>
            <label htmlFor={`prize-${p.id}`} className={styles.prizeRank}>
              第 {i + 1} 名
            </label>
            <input
              id={`prize-${p.id}`}
              type="text"
              maxLength={30}
              placeholder="例如：Switch、100 元禮券"
              value={p.name}
              onChange={(e) => updatePrize(p.id, e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, i)}
            />
            <Button
              variant="ghost"
              onClick={() => removePrize(p.id)}
              disabled={prizes.length <= 1}
              aria-label={`刪除第 ${i + 1} 名的獎品`}
            >
              ✕
            </Button>
          </li>
        ))}
      </ol>
      <Button onClick={addPrize} disabled={prizes.length >= MAX_PRIZES}>
        ＋ 新增獎品
      </Button>
    </fieldset>
  )
}
