import { useState } from 'react'
import { Button } from '@/components/Button'
import { useAppStore } from '@/store/appStore'
import styles from './HistoryPanel.module.css'

const dateFormat = new Intl.DateTimeFormat('zh-TW', {
  month: 'numeric',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

export function HistoryPanel() {
  const history = useAppStore((s) => s.history)
  const replayHistory = useAppStore((s) => s.replayHistory)
  const clearHistory = useAppStore((s) => s.clearHistory)
  // 兩段式確認，不用 window.confirm
  const [confirming, setConfirming] = useState(false)

  return (
    <section className={styles.panel} aria-labelledby="history-title">
      <div className={styles.header}>
        <h2 id="history-title">最近紀錄</h2>
        {history.length > 0 &&
          (confirming ? (
            <span className={styles.confirm}>
              確定清除？
              <Button
                variant="ghost"
                onClick={() => {
                  clearHistory()
                  setConfirming(false)
                }}
              >
                清除
              </Button>
              <Button variant="ghost" onClick={() => setConfirming(false)}>
                取消
              </Button>
            </span>
          ) : (
            <Button variant="ghost" onClick={() => setConfirming(true)}>
              清除紀錄
            </Button>
          ))}
      </div>

      {history.length === 0 ? (
        <p className={styles.empty}>還沒有紀錄，打完一場就會出現在這裡。</p>
      ) : (
        <ul className={styles.list}>
          {history.map((entry) => (
            <li key={entry.id} className={styles.item}>
              <div className={styles.meta}>
                <span>{dateFormat.format(entry.finishedAt)}</span>
                <span>
                  {entry.entrants.length} 人取 {entry.settings.winners} 名
                </span>
                <span className={styles.seed}>seed {entry.seed}</span>
              </div>
              <div className={styles.winners}>🏆 {entry.winners.join('、')}</div>
              <Button
                onClick={() => replayHistory(entry)}
                aria-label={`重播 ${dateFormat.format(entry.finishedAt)} 的對戰`}
              >
                重播
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
