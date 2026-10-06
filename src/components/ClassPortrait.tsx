import { useEffect, useRef } from 'react'
import type { ClassId } from '@/engine/classes'
import { buildUnitAtlas, SPRITE_SIZE } from '@/render/sprites'

type ClassPortraitProps = {
  classId: ClassId
  hue?: number
  /** 每個 sprite 像素放大倍數 */
  scale?: number
}

/** 把小人偶的站立幀畫在小 canvas 上，用於職業介紹 */
export function ClassPortrait({ classId, hue = 210, scale = 4 }: ClassPortraitProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    const atlas = buildUnitAtlas(classId, hue)
    ctx.imageSmoothingEnabled = false
    ctx.clearRect(0, 0, SPRITE_SIZE * scale, SPRITE_SIZE * scale)
    ctx.drawImage(
      atlas,
      0,
      0,
      SPRITE_SIZE,
      SPRITE_SIZE,
      0,
      0,
      SPRITE_SIZE * scale,
      SPRITE_SIZE * scale,
    )
  }, [classId, hue, scale])

  return (
    <canvas
      ref={canvasRef}
      width={SPRITE_SIZE * scale}
      height={SPRITE_SIZE * scale}
      aria-hidden="true"
      style={{ imageRendering: 'pixelated' }}
    />
  )
}
