import { ClassPortrait } from '@/components/ClassPortrait'
import { CLASS_IDS, CLASSES } from '@/engine/classes'
import styles from './SetupScreen.module.css'

/** 職業介紹：開打時每位參加者隨機分配到其中一種 */
export function ClassGuide() {
  return (
    <section className={styles.guide} aria-labelledby="class-guide-title">
      <h2 id="class-guide-title">職業（開打時隨機分配）</h2>
      <ul className={styles.classList}>
        {CLASS_IDS.map((id, i) => (
          <li key={id} className={styles.classItem}>
            <ClassPortrait classId={id} hue={(i * 72 + 200) % 360} />
            <div>
              <strong>
                {CLASSES[id].icon} {CLASSES[id].name}
              </strong>
              <p>{CLASSES[id].description}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
