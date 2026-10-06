import { useEffect, useRef } from 'react'

/** 畫面切換後把焦點移到標題，讓螢幕閱讀器與鍵盤使用者知道換頁了。 */
export function useFocusOnMount<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  useEffect(() => {
    ref.current?.focus()
  }, [])
  return ref
}
