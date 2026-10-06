import { describe, expect, it } from 'vitest'
import { CLASS_IDS } from '@/engine/classes'
import { composeFrame, FRAME, frameLayers, SPRITE_SIZE, TOMBSTONE } from './sprites'

describe('sprites', () => {
  it.each(CLASS_IDS)('%s layers are all 16×16', (classId) => {
    for (const frame of Object.keys(FRAME) as (keyof typeof FRAME)[]) {
      for (const l of frameLayers(classId, frame)) {
        expect(l).toHaveLength(SPRITE_SIZE)
        for (const row of l) expect(row).toHaveLength(SPRITE_SIZE)
      }
    }
  })

  it('attack frame differs from stand frame for every class', () => {
    for (const classId of CLASS_IDS) {
      expect(composeFrame(frameLayers(classId, 'attack'))).not.toEqual(
        composeFrame(frameLayers(classId, 'stand')),
      )
    }
  })

  it('tombstone rows have equal width', () => {
    for (const row of TOMBSTONE) expect(row).toHaveLength(8)
  })
})
