import { ClassIcon } from '@/components/ClassIcon'
import type { HudSnapshot } from '@/game/GameController'
import styles from './BattleScreen.module.css'

type BattleHudProps = {
  hud: HudSnapshot
}

function formatTime(sec: number): string {
  const s = Math.floor(sec)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export function BattleHud({ hud }: BattleHudProps) {
  return (
    <aside className={styles.hud} aria-label="戰況">
      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>存活</span>
          <span className={styles.statValue}>
            {hud.alive}
            <small> / {hud.total}</small>
          </span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>時間</span>
          <span className={styles.statValue}>{formatTime(hud.elapsedSec)}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>取</span>
          <span className={styles.statValue}>{hud.winners} 名</span>
        </div>
      </div>

      {hud.finished ? (
        <p className={styles.banner}>勝負已分！</p>
      ) : hud.damageMultiplier > 1 ? (
        <p className={`${styles.banner} ${styles.zone}`}>延長賽：傷害 ×{hud.damageMultiplier}</p>
      ) : null}

      <div>
        <h2 className={styles.hudTitle}>擊殺王</h2>
        {hud.leaders.length === 0 ? (
          <p className={styles.muted}>尚無擊殺</p>
        ) : (
          <ol className={styles.leaders}>
            {hud.leaders.map((l) => (
              <li key={l.id}>
                <span className={styles.name}>
                  <ClassIcon classId={l.classId} /> {l.label}
                </span>
                <span>{l.kills} 殺</span>
              </li>
            ))}
          </ol>
        )}
      </div>

      <div>
        <h2 className={styles.hudTitle}>戰報</h2>
        {hud.killFeed.length === 0 ? (
          <p className={styles.muted}>雙方對峙中…</p>
        ) : (
          <ul className={styles.feed}>
            {hud.killFeed.map((k) => (
              <li key={k.key}>
                {k.killer === null ? (
                  <>
                    <ClassIcon classId={k.victimClass} />{' '}
                    <span className={styles.name}>{k.victim}</span> 倒下了
                  </>
                ) : (
                  <>
                    {k.killerClass && <ClassIcon classId={k.killerClass} />}{' '}
                    <span className={styles.name}>{k.killer}</span> 擊倒{' '}
                    <ClassIcon classId={k.victimClass} />{' '}
                    <span className={styles.name}>{k.victim}</span>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  )
}
