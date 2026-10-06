const PREFIX = 'lottery-battle:'

interface Envelope<T> {
  version: number
  data: T
}

/**
 * 讀取 localStorage。格式 `{ version, data }`；不存在、JSON 壞掉、版本不符、
 * 未通過 validate，或瀏覽器禁止存取時，一律回傳 fallback。
 */
export function loadStored<T>(
  key: string,
  version: number,
  fallback: T,
  validate: (data: unknown) => data is T,
): T {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (!raw) return fallback
    const parsed = JSON.parse(raw) as Partial<Envelope<unknown>>
    if (parsed.version !== version || !validate(parsed.data)) return fallback
    return parsed.data
  } catch {
    return fallback
  }
}

/** 寫入 localStorage，失敗（容量滿、隱私模式）時回傳 false 不拋錯。 */
export function saveStored<T>(key: string, version: number, data: T): boolean {
  try {
    const envelope: Envelope<T> = { version, data }
    localStorage.setItem(PREFIX + key, JSON.stringify(envelope))
    return true
  } catch {
    return false
  }
}

export function removeStored(key: string): void {
  try {
    localStorage.removeItem(PREFIX + key)
  } catch {
    // 無法存取時不需處理
  }
}
