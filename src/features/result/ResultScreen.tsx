import { useState } from 'react'
import { Button } from '@/components/Button'
import { ClassIcon } from '@/components/ClassIcon'
import { ClassPortrait } from '@/components/ClassPortrait'
import { CLASSES } from '@/engine/classes'
import type { BattleResult } from '@/engine/types'
import { useFocusOnMount } from '@/hooks/useFocusOnMount'
import { prizeForRank } from '@/lib/prizes'
import { useAppStore } from '@/store/appStore'
import { formatDuration, formatResultText } from './formatResult'
import { Podium } from './Podium'
import styles from './ResultScreen.module.css'

type ResultScreenProps = {
  result: BattleResult
}

type CopyState = 'idle' | 'copied' | 'failed'

export function ResultScreen({ result }: ResultScreenProps) {
  const replay = useAppStore((s) => s.replay)
  const rematch = useAppStore((s) => s.rematch)
  const backToSetup = useAppStore((s) => s.backToSetup)
  const headingRef = useFocusOnMount<HTMLHeadingElement>()
  const [copyState, setCopyState] = useState<CopyState>('idle')

  const winners = result.ranking.filter((r) => r.winner)
  // 前三名在頒獎台上，得獎人數超過 3 時其餘列在下方
  const otherWinners = winners.filter((w) => w.rank > 3)
  const hasPrizes = winners.some((w) => prizeForRank(result.settings, w.rank))
  const killKing = result.ranking.reduce((best, r) => (r.kills > best.kills ? r : best))
  const firstOut = result.ranking.at(-1)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(formatResultText(result))
      setCopyState('copied')
    } catch {
      setCopyState('failed')
    }
  }

  return (
    <section className={styles.screen} aria-labelledby="result-title">
      <header className={styles.header}>
        <h1 id="result-title" ref={headingRef} tabIndex={-1}>
          得獎名單
        </h1>
        <p className={styles.meta}>
          {result.total} 人參戰 · 取 {result.settings.winners} 名 · 對戰{' '}
          {formatDuration(result.durationSec)} ·{' '}
          <span className={styles.mono}>seed {result.seed}</span>
        </p>
      </header>

      {/* 只在這裡用 live region 宣布得獎者 */}
      <p className="visually-hidden" aria-live="polite">
        得獎者：{winners.map((w) => w.label).join('、')}
      </p>

      <Podium ranking={result.ranking} settings={result.settings} />

      {otherWinners.length > 0 && (
        <section className={styles.others} aria-labelledby="other-winners-title">
          <h2 id="other-winners-title">其他得獎者</h2>
          <ol className={styles.otherList}>
            {otherWinners.map((w) => (
              <li key={w.id}>
                <span className={styles.otherRank}>{w.rank}</span>
                <ClassPortrait classId={w.classId} hue={w.hue} scale={2} />
                <span className={styles.otherName}>{w.label}</span>
                {prizeForRank(result.settings, w.rank) && (
                  <span className={styles.prize}>🎁 {prizeForRank(result.settings, w.rank)}</span>
                )}
                <span className={styles.detail}>
                  <ClassIcon classId={w.classId} /> {w.kills} 殺
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}

      <ul className={styles.trivia}>
        {killKing.kills > 0 && (
          <li>
            擊殺王：
            <ClassIcon classId={killKing.classId} /> <strong>{killKing.label}</strong>（
            {killKing.kills} 殺）
          </li>
        )}
        {firstOut && !firstOut.winner && (
          <li>
            第一個出局：
            <ClassIcon classId={firstOut.classId} /> <strong>{firstOut.label}</strong>（
            {formatDuration(firstOut.survivedSec)}）
          </li>
        )}
      </ul>

      <div className={styles.actions}>
        <Button variant="primary" onClick={rematch}>
          同名單再來一場
        </Button>
        <Button onClick={replay}>重播這場</Button>
        <Button onClick={handleCopy}>複製結果</Button>
        <Button variant="ghost" onClick={backToSetup}>
          重新設定
        </Button>
        <span className={styles.copyStatus} role="status">
          {copyState === 'copied'
            ? '已複製到剪貼簿'
            : copyState === 'failed'
              ? '複製失敗，請手動選取'
              : ''}
        </span>
      </div>

      <details className={styles.details} open={result.total <= 50}>
        <summary>完整名次（{result.total} 人）</summary>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">名次</th>
                <th scope="col">名稱</th>
                <th scope="col" className={styles.classCell}>
                  職業
                </th>
                {hasPrizes && (
                  <th scope="col" className={styles.prizeCell}>
                    獎品
                  </th>
                )}
                <th scope="col">擊殺</th>
                <th scope="col">傷害</th>
                <th scope="col">存活</th>
              </tr>
            </thead>
            <tbody>
              {result.ranking.map((r) => (
                <tr key={r.id} className={r.winner ? styles.winnerRow : undefined}>
                  <td>{r.rank}</td>
                  <td className={styles.nameCell}>{r.label}</td>
                  <td className={styles.classCell}>
                    <ClassIcon classId={r.classId} /> {CLASSES[r.classId].name}
                  </td>
                  {hasPrizes && (
                    <td className={styles.prizeCell}>
                      {prizeForRank(result.settings, r.rank) ?? ''}
                    </td>
                  )}
                  <td>{r.kills}</td>
                  <td>{r.damageDealt}</td>
                  <td>{formatDuration(r.survivedSec)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  )
}
