import type { FormEvent } from 'react'
import { Button } from '@/components/Button'
import { MAX_ENTRANTS } from '@/engine/config'
import { randomSeed } from '@/engine/rng'
import { useFocusOnMount } from '@/hooks/useFocusOnMount'
import { parseList, parseRange, parseSeed } from '@/lib/entrants'
import { useAppStore } from '@/store/appStore'
import { ClassGuide } from './ClassGuide'
import { PrizeEditor } from './PrizeEditor'
import styles from './SetupScreen.module.css'

export function SetupScreen() {
  const draft = useAppStore((s) => s.draft)
  const updateDraft = useAppStore((s) => s.updateDraft)
  const startBattle = useAppStore((s) => s.startBattle)
  const headingRef = useFocusOnMount<HTMLHeadingElement>()

  // 衍生資料在 render 時直接算（相當於 Vue 的 computed），不另存 state、不用 useEffect 同步
  const parsed =
    draft.mode === 'range'
      ? parseRange(draft.rangeStart, draft.rangeEnd, draft.exclude)
      : parseList(draft.listText)
  const count = parsed.entrants.length
  const seed = parseSeed(draft.seedText)

  const errors = [...parsed.errors]
  const prizeNames = draft.prizes.map((p) => p.name.trim())
  const winners = prizeNames.length
  prizeNames.forEach((name, i) => {
    if (!name) errors.push(`第 ${i + 1} 名的獎品還沒填`)
  })
  if (count > 0 && winners >= count) {
    errors.push(`獎品有 ${winners} 個，參加者至少要 ${winners + 1} 位`)
  }
  if (Number.isNaN(seed)) errors.push('seed 必須是 0 – 4294967295 的整數')
  const canStart = count > 0 && errors.length === 0

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!canStart) return
    startBattle({
      entrants: parsed.entrants,
      settings: { winners, prizes: prizeNames },
      seed: seed ?? randomSeed(),
    })
  }

  return (
    <section className={styles.screen} aria-labelledby="setup-title">
      <header className={styles.hero}>
        <h1 id="setup-title" ref={headingRef} tabIndex={-1}>
          抽獎大亂鬥
        </h1>
        <p>每個號碼都是一個小人偶，隨機抽到職業後丟進競技場混戰，最後站著的就是得獎者。</p>
      </header>

      <form className={styles.card} onSubmit={handleSubmit} noValidate>
        <fieldset className={styles.modeSwitch}>
          <legend className="visually-hidden">名單來源</legend>
          {(
            [
              ['range', '號碼範圍'],
              ['list', '貼上名單'],
            ] as const
          ).map(([value, text]) => (
            <label key={value} className={styles.modeOption}>
              <input
                type="radio"
                name="mode"
                value={value}
                checked={draft.mode === value}
                onChange={() => updateDraft({ mode: value })}
              />
              <span>{text}</span>
            </label>
          ))}
        </fieldset>

        {draft.mode === 'range' ? (
          <div className={styles.rangeGrid}>
            <label className={styles.field}>
              <span>起始號碼</span>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={draft.rangeStart}
                onChange={(e) => updateDraft({ rangeStart: e.target.value })}
              />
            </label>
            <label className={styles.field}>
              <span>結束號碼</span>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={draft.rangeEnd}
                onChange={(e) => updateDraft({ rangeEnd: e.target.value })}
              />
            </label>
            <label className={`${styles.field} ${styles.wide}`}>
              <span>排除號碼（選填）</span>
              <input
                type="text"
                placeholder="例如 4, 13, 20-25"
                value={draft.exclude}
                onChange={(e) => updateDraft({ exclude: e.target.value })}
              />
            </label>
          </div>
        ) : (
          <label className={styles.field}>
            <span>參加名單（一行一位，最多 {MAX_ENTRANTS} 位）</span>
            <textarea
              rows={8}
              placeholder={'小明\n小華\n小美'}
              value={draft.listText}
              onChange={(e) => updateDraft({ listText: e.target.value })}
            />
          </label>
        )}

        <PrizeEditor />

        <label className={styles.field}>
          <span>seed（選填，同 seed 可重現結果）</span>
          <input
            type="text"
            inputMode="numeric"
            placeholder="留空自動產生"
            value={draft.seedText}
            onChange={(e) => updateDraft({ seedText: e.target.value })}
          />
        </label>

        <div className={styles.summary} aria-live="polite">
          <strong>{count > 0 ? `共 ${count} 位參加者，取 ${winners} 名` : '尚未有參加者'}</strong>
          {errors.length > 0 && (
            <ul className={styles.errors}>
              {errors.map((msg) => (
                <li key={msg}>{msg}</li>
              ))}
            </ul>
          )}
          {parsed.warnings.length > 0 && (
            <ul className={styles.warnings}>
              {parsed.warnings.map((msg) => (
                <li key={msg}>{msg}</li>
              ))}
            </ul>
          )}
        </div>

        <Button type="submit" variant="primary" size="lg" disabled={!canStart}>
          開打！
        </Button>
      </form>

      <ClassGuide />
    </section>
  )
}
