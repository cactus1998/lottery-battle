import { useEffect, useRef } from 'react'
import type { ClassId } from '@/engine/classes'
import { buildUnitAtlas, FRAME, type FrameName, SPRITE_SIZE } from '@/render/sprites'

type ClassPortraitProps = {
  classId: ClassId
  hue?: number
  /** 每個 sprite 像素放大倍數 */
  scale?: number
  /** 動作幀：站立或攻擊姿勢 */
  frame?: FrameName
  className?: string
}

/** 把小人偶的某一幀畫在小 canvas 上，用於職業介紹與頒獎台 */
export function ClassPortrait({
  classId,
  hue = 210,
  scale = 4,
  frame = 'stand',
  className,
}: ClassPortraitProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    const atlas = buildUnitAtlas(classId, hue)
    const size = SPRITE_SIZE * scale
    ctx.imageSmoothingEnabled = false
    ctx.clearRect(0, 0, size, size)
    ctx.drawImage(atlas, FRAME[frame] * SPRITE_SIZE, 0, SPRITE_SIZE, SPRITE_SIZE, 0, 0, size, size)
  }, [classId, hue, scale, frame])

  return (
    <canvas
      ref={canvasRef}
      className={className}
      width={SPRITE_SIZE * scale}
      height={SPRITE_SIZE * scale}
      aria-hidden="true"
      style={{ imageRendering: 'pixelated' }}
    />
  )
}
