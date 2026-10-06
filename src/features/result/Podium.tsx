import { ClassIcon } from '@/components/ClassIcon'
import { ClassPortrait } from '@/components/ClassPortrait'
import { CLASSES } from '@/engine/classes'
import type { BattleSettings, RankingRow } from '@/engine/types'
import { prizeForRank } from '@/lib/prizes'
import styles from './Podium.module.css'

type PodiumProps = {
  ranking: RankingRow[]
  settings: BattleSettings
}

const PLACE_CLASS = [styles.first, styles.second, styles.third]

/**
 * 頒獎台：前三名站在高、中、低三個台子上（畫面順序 2・1・3）。
 * DOM 順序維持 1・2・3，螢幕閱讀器依名次朗讀；左右排列交給 CSS `order`。
 */
export function Podium({ ranking, settings }: PodiumProps) {
  const top = ranking.slice(0, 3)

  return (
    <ol className={styles.podium} aria-label="前三名頒獎台">
      {top.map((r, i) => {
        const prize = prizeForRank(settings, r.rank)
        return (
          <li key={r.id} className={`${styles.place} ${PLACE_CLASS[i] ?? ''}`}>
            <div className={styles.standing}>
              {i === 0 && (
                <span className={styles.crown} aria-hidden="true">
                  👑
                </span>
              )}
              <span className={styles.name}>{r.label}</span>
              {prize && <span className={styles.prize}>🎁 {prize}</span>}
              <span className={styles.meta}>
                <ClassIcon classId={r.classId} /> {CLASSES[r.classId].name} · {r.kills} 殺
              </span>
              <ClassPortrait
                classId={r.classId}
                hue={r.hue}
                scale={i === 0 ? 6 : 5}
                frame={i === 0 ? 'attack' : 'stand'}
                className={styles.sprite}
              />
            </div>
            <div className={styles.block}>
              <span className={styles.number}>{r.rank}</span>
              {!r.winner && <span className={styles.notWinner}>未得獎</span>}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
