import { describe, expect, it } from 'vitest'
import { killUnit } from '@/engine/systems/death'
import { createWorld } from '@/engine/world'
import { Camera, clampTarget, DEFAULT_CENTER, frameAlive } from './camera'

describe('camera', () => {
  it('frames the alive units and zooms in when they are close together', () => {
    const w = createWorld({
      entrants: Array.from({ length: 5 }, (_, i) => ({ id: i, label: String(i) })),
      settings: { winners: 1 },
      seed: 2,
    })
    for (let i = 0; i < 3; i++) killUnit(w, i, null)
    w.units[3]!.x = 400
    w.units[3]!.y = 400
    w.units[4]!.x = 480
    w.units[4]!.y = 420
    const t = frameAlive(w)
    expect(t.x).toBeCloseTo(440)
    expect(t.zoom).toBeGreaterThan(1.5)
  })

  it('moves smoothly toward its target', () => {
    const cam = new Camera()
    cam.follow({ x: 200, y: 200, zoom: 2 })
    cam.update(0.1)
    expect(cam.x).toBeLessThan(DEFAULT_CENTER.x)
    expect(cam.x).toBeGreaterThan(200)
    for (let i = 0; i < 100; i++) cam.update(0.1)
    expect(cam.zoom).toBeCloseTo(2)
  })

  it('keeps the view inside the arena near the edges', () => {
    const t = clampTarget({ x: 0, y: 0, zoom: 2 })
    expect(t.x).toBeCloseTo(-30 + 530 / 2)
    expect(t.y).toBeCloseTo(-50 + 540 / 2)
    expect(clampTarget({ ...DEFAULT_CENTER, zoom: 1 })).toEqual({ ...DEFAULT_CENTER, zoom: 1 })
  })
})
