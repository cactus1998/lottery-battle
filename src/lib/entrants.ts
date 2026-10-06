import { MAX_ENTRANTS, MIN_ENTRANTS } from '@/engine/config'
import type { Entrant } from '@/engine/types'

export interface ParseResult {
  entrants: Entrant[]
  errors: string[]
  warnings: string[]
}

/** 解析排除清單，例如 "3, 5, 10-12"。無法解析的片段回報在 invalid。 */
export function parseExclude(text: string): { numbers: Set<number>; invalid: string[] } {
  const numbers = new Set<number>()
  const invalid: string[] = []
  for (const raw of text.split(/[,，\s]+/)) {
    const part = raw.trim()
    if (!part) continue
    const range = /^(\d+)\s*[-~]\s*(\d+)$/.exec(part)
    if (range) {
      const a = Number(range[1])
      const b = Number(range[2])
      const [lo, hi] = a <= b ? [a, b] : [b, a]
      // 避免使用者輸入超大範圍卡住
      if (hi - lo > 10_000) {
        invalid.push(part)
        continue
      }
      for (let n = lo; n <= hi; n++) numbers.add(n)
    } else if (/^\d+$/.test(part)) {
      numbers.add(Number(part))
    } else {
      invalid.push(part)
    }
  }
  return { numbers, invalid }
}

function validateCount(count: number, errors: string[]): void {
  if (count < MIN_ENTRANTS) errors.push(`至少需要 ${MIN_ENTRANTS} 位參加者`)
  if (count > MAX_ENTRANTS) errors.push(`最多 ${MAX_ENTRANTS} 位參加者（目前 ${count} 位）`)
}

export function parseRange(startText: string, endText: string, excludeText: string): ParseResult {
  const errors: string[] = []
  const warnings: string[] = []
  const start = Number(startText)
  const end = Number(endText)

  if (startText.trim() === '' || endText.trim() === '') {
    errors.push('請輸入起始與結束號碼')
    return { entrants: [], errors, warnings }
  }
  if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || end < 0) {
    errors.push('號碼必須是 0 以上的整數')
    return { entrants: [], errors, warnings }
  }
  if (start > end) {
    errors.push('起始號碼不能大於結束號碼')
    return { entrants: [], errors, warnings }
  }
  if (end - start + 1 > 10_000) {
    errors.push(`最多 ${MAX_ENTRANTS} 位參加者（目前 ${end - start + 1} 位）`)
    return { entrants: [], errors, warnings }
  }

  const { numbers: excluded, invalid } = parseExclude(excludeText)
  if (invalid.length > 0) warnings.push(`無法辨識的排除項目：${invalid.join('、')}`)

  const entrants: Entrant[] = []
  for (let n = start; n <= end; n++) {
    if (!excluded.has(n)) entrants.push({ id: entrants.length, label: String(n) })
  }
  validateCount(entrants.length, errors)
  return { entrants: errors.length > 0 ? [] : entrants, errors, warnings }
}

export function parseList(text: string): ParseResult {
  const errors: string[] = []
  const warnings: string[] = []
  const seen = new Set<string>()
  const entrants: Entrant[] = []
  let duplicates = 0

  for (const line of text.split(/\r?\n/)) {
    const label = line.trim()
    if (!label) continue
    if (seen.has(label)) {
      duplicates++
      continue
    }
    seen.add(label)
    entrants.push({ id: entrants.length, label })
  }
  if (duplicates > 0) warnings.push(`已略過 ${duplicates} 個重複名稱`)
  validateCount(entrants.length, errors)
  return { entrants: errors.length > 0 ? [] : entrants, errors, warnings }
}

/** 由 seed 文字欄位取得 seed：空白回傳 null（由呼叫端產生亂數），非法值回傳 NaN。 */
export function parseSeed(text: string): number | null {
  const trimmed = text.trim()
  if (!trimmed) return null
  return /^\d{1,10}$/.test(trimmed) && Number(trimmed) <= 0xffffffff ? Number(trimmed) : NaN
}
