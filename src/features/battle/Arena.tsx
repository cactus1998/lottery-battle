import { useEffect, useRef } from 'react'
import type { GameController } from '@/game/GameController'
import styles from './BattleScreen.module.css'

type ArenaProps = {
  controller: GameController
}

/**
 * Canvas 容器。React 只負責放一個 <canvas>，之後每幀由 GameController 直接繪製，
 * 這個元件本身在對戰中不會 re-render。
 */
export function Arena({ controller }: ArenaProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const wrapper = wrapperRef.current
    const canvas = canvasRef.current
    if (!wrapper || !canvas) return

    controller.attachCanvas(canvas)
    const resize = () => {
      const { width, height } = wrapper.getBoundingClientRect()
      controller.resize(width, height, window.devicePixelRatio || 1)
    }
    resize()

    if (typeof ResizeObserver === 'undefined') {
      return () => controller.detachCanvas()
    }
    const observer = new ResizeObserver(resize)
    observer.observe(wrapper)
    return () => {
      observer.disconnect()
      controller.detachCanvas()
    }
  }, [controller])

  return (
    <div ref={wrapperRef} className={styles.arena}>
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        role="img"
        aria-label="競技場：小人們正在混戰"
      />
    </div>
  )
}
