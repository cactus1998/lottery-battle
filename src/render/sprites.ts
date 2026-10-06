import type { ClassId } from '@/engine/classes'

/**
 * 像素小人偶。每個職業由幾層 16×16 像素圖疊成（腳、身體、頭、帽子、武器），
 * 身上衣服的顏色依每個人的色相不同，帽子與武器依職業區分。
 * 圖層用字元表示，'.' 為透明，其他字元對照 palette 取色。
 */

export const SPRITE_SIZE = 16

type Layer = readonly string[]

/** 16 列的空白圖層，只填入指定列 */
function layer(rows: Record<number, string>): Layer {
  return Array.from({ length: SPRITE_SIZE }, (_, i) => rows[i] ?? '.'.repeat(SPRITE_SIZE))
}

// ---- 共用身體（面向右） ----

const HEAD = layer({
  2: '....oooooo......',
  3: '...osssssso.....',
  4: '...osssssso.....',
  5: '...osssseso.....',
  6: '...osssssso.....',
  7: '....oooooo......',
})

const TORSO = layer({
  8: '...obbbbbbo.....',
  9: '..sobbbbbbos....',
  10: '...oddddddo.....',
  11: '...obbbbbbo.....',
})

const LEGS_STAND = layer({
  12: '....ll..ll......',
  13: '....ll..ll......',
  14: '....oo..oo......',
})

const LEGS_WALK_A = layer({
  12: '...ll....ll.....',
  13: '...ll.....ll....',
  14: '...oo.....oo....',
})

const LEGS_WALK_B = layer({
  12: '.....llll.......',
  13: '.....ll.ll......',
  14: '.....oo.oo......',
})

// ---- 職業外觀 ----

interface ClassLook {
  hat: Layer
  weapon: Layer
  weaponAttack: Layer
  palette: Record<string, string>
}

const LOOKS: Record<ClassId, ClassLook> = {
  swordsman: {
    hat: layer({
      1: '.....hhhh.......',
      2: '....hhhhhh......',
      3: '..HoHHHHHHo.....',
      4: '..H.............',
    }),
    weapon: layer({
      3: '............w...',
      4: '............w...',
      5: '............w...',
      6: '............w...',
      7: '............w...',
      8: '...........ggg..',
      9: '............g...',
    }),
    weaponAttack: layer({
      8: '...........g....',
      9: '..........gwwwww',
      10: '...........g....',
    }),
    palette: { h: '#7a4a24', H: '#d63b3b', w: '#e6edf3', g: '#d9a63a' },
  },
  knight: {
    hat: layer({
      0: '.....HH.........',
      1: '....hHHhh.......',
      2: '...hhhhhhhh.....',
      3: '...hhhhhhhh.....',
      4: '...hhhhhhoh.....',
      5: '...hh...........',
    }),
    weapon: layer({
      7: '.........KKKK...',
      8: '.........KkkK...',
      9: '.........KkkK...',
      10: '.........KkkK...',
      11: '..........KK....',
    }),
    weaponAttack: layer({
      6: '...........gwww.',
      7: '.........KKKK...',
      8: '.........KkkK...',
      9: '.........KkkK...',
      10: '.........KkkK...',
      11: '..........KK....',
    }),
    palette: {
      h: '#b4bcc7',
      H: '#d63b3b',
      K: '#6b7685',
      k: '#3d6fd6',
      w: '#e6edf3',
      g: '#d9a63a',
    },
  },
  archer: {
    hat: layer({
      1: '.....hhh........',
      2: '....hhhhhh......',
      3: '...hhhhhhhh.....',
      4: '...hhHHHHHh.....',
      5: '...h............',
      6: '...h............',
      7: '..hh............',
    }),
    weapon: layer({
      5: '............n...',
      6: '............fn..',
      7: '............fn..',
      8: '............fn..',
      9: '............fn..',
      10: '............fn..',
      11: '............n...',
    }),
    weaponAttack: layer({
      5: '............n...',
      6: '...........f.n..',
      7: '...........f.n..',
      8: '..........wwwwg.',
      9: '...........f.n..',
      10: '...........f.n..',
      11: '............n...',
    }),
    palette: { h: '#3f8a3a', H: '#2b5f28', n: '#8a5a2b', f: '#ece6d2', w: '#cfd6dd', g: '#9aa3ad' },
  },
  mage: {
    hat: layer({
      0: '.....h..........',
      1: '.....hh.........',
      2: '....hhhh........',
      3: '....hhHhh.......',
      4: '..HHHHHHHHHH....',
    }),
    weapon: layer({
      2: '...........OOO..',
      3: '...........OOO..',
      4: '............n...',
      5: '............n...',
      6: '............n...',
      7: '............n...',
      8: '............n...',
      9: '............n...',
      10: '............n...',
      11: '............n...',
      12: '............n...',
      13: '............n...',
    }),
    weaponAttack: layer({
      1: '............P...',
      2: '..........POOOP.',
      3: '...........OOO..',
      4: '..........P.n.P.',
      5: '............n...',
      6: '............n...',
      7: '............n...',
      8: '............n...',
      9: '............n...',
      10: '............n...',
      11: '............n...',
      12: '............n...',
      13: '............n...',
    }),
    palette: { h: '#6a3fc2', H: '#f2c84b', n: '#7a4f2a', O: '#5fd3ff', P: '#fff6a8' },
  },
  assassin: {
    hat: layer({
      1: '.....hhhh.......',
      2: '....hhhhhh......',
      3: '...hhhhhhhh.....',
      4: '...hhhhhhhh.....',
      6: '...hHHHHHHh.....',
      7: '..hh............',
    }),
    weapon: layer({
      9: '...........g....',
      10: '...........w....',
      11: '...........w....',
    }),
    weaponAttack: layer({
      9: '...........gwww.',
    }),
    palette: { h: '#3a3846', H: '#22212b', w: '#dfe6ee', g: '#7a5a3a' },
  },
}

const BASE_PALETTE: Record<string, string> = {
  o: '#1d1a24',
  s: '#f3c7a1',
  e: '#1d1a24',
  l: '#4b3a2c',
}

export const TOMBSTONE: Layer = [
  '..oooo..',
  '.oSSSSo.',
  'oSSoSSSo',
  'oSoooSSo',
  'oSSoSSSo',
  'oSSoSSSo',
  'oSSSSSSo',
  'oooooooo',
]

export const TOMBSTONE_PALETTE: Record<string, string> = { o: '#2a2833', S: '#8e8a99' }

/** 動作幀順序（atlas 的欄） */
export const FRAME = { stand: 0, walkA: 1, walkB: 2, attack: 3 } as const
export type FrameName = keyof typeof FRAME
const FRAME_COUNT = 4

/** atlas 的列：0 面右、1 面左、2 面右受擊白、3 面左受擊白 */
export const ROW = { right: 0, left: 1, flashRight: 2, flashLeft: 3 } as const

function hexToRgb(hex: string): [number, number, number] {
  const n = Number.parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => {
    const k = (n + h / 30) % 12
    return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))))
  }
  return [f(0), f(8), f(4)]
}

export function frameLayers(classId: ClassId, frame: FrameName): Layer[] {
  const look = LOOKS[classId]
  const legs = frame === 'walkA' ? LEGS_WALK_A : frame === 'walkB' ? LEGS_WALK_B : LEGS_STAND
  const weapon = frame === 'attack' ? look.weaponAttack : look.weapon
  return [legs, TORSO, HEAD, look.hat, weapon]
}

/** 合併圖層成單一 16×16 字元圖（後面的圖層蓋過前面） */
export function composeFrame(layers: Layer[]): string[] {
  const out = Array.from({ length: SPRITE_SIZE }, () => Array<string>(SPRITE_SIZE).fill('.'))
  for (const l of layers) {
    for (let y = 0; y < SPRITE_SIZE; y++) {
      const row = l[y] ?? ''
      for (let x = 0; x < SPRITE_SIZE; x++) {
        const c = row[x]
        if (c && c !== '.') (out[y] as string[])[x] = c
      }
    }
  }
  return out.map((r) => r.join(''))
}

/**
 * 產生某個小人的 sprite atlas：寬 4 幀 × 16，高 4 列 × 16（面右、面左、受擊白兩方向）。
 * 用 ImageData 一次寫入，300 人開場時建立也只要數毫秒。
 */
export function buildUnitAtlas(classId: ClassId, hue: number): HTMLCanvasElement {
  const look = LOOKS[classId]
  const colors: Record<string, [number, number, number]> = {}
  for (const [k, v] of Object.entries({ ...BASE_PALETTE, ...look.palette })) colors[k] = hexToRgb(v)
  colors.b = hslToRgb(hue, 0.65, 0.55)
  colors.d = hslToRgb(hue, 0.6, 0.35)

  const width = SPRITE_SIZE * FRAME_COUNT
  const height = SPRITE_SIZE * 4
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas
  const image = ctx.createImageData(width, height)
  const data = image.data

  const put = (px: number, py: number, rgb: [number, number, number]) => {
    const i = (py * width + px) * 4
    data[i] = rgb[0]
    data[i + 1] = rgb[1]
    data[i + 2] = rgb[2]
    data[i + 3] = 255
  }

  for (const [name, col] of Object.entries(FRAME) as [FrameName, number][]) {
    const pixels = composeFrame(frameLayers(classId, name))
    for (let y = 0; y < SPRITE_SIZE; y++) {
      for (let x = 0; x < SPRITE_SIZE; x++) {
        const c = pixels[y]?.[x]
        if (!c || c === '.') continue
        const rgb = colors[c] ?? [255, 0, 255]
        const ox = col * SPRITE_SIZE
        const mx = SPRITE_SIZE - 1 - x
        put(ox + x, ROW.right * SPRITE_SIZE + y, rgb)
        put(ox + mx, ROW.left * SPRITE_SIZE + y, rgb)
        put(ox + x, ROW.flashRight * SPRITE_SIZE + y, [255, 255, 255])
        put(ox + mx, ROW.flashLeft * SPRITE_SIZE + y, [255, 255, 255])
      }
    }
  }
  ctx.putImageData(image, 0, 0)
  return canvas
}

export function buildPixelCanvas(
  rows: readonly string[],
  palette: Record<string, string>,
): HTMLCanvasElement {
  const h = rows.length
  const w = rows[0]?.length ?? 0
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const c = rows[y]?.[x]
      if (!c || c === '.') continue
      ctx.fillStyle = palette[c] ?? '#ff00ff'
      ctx.fillRect(x, y, 1, 1)
    }
  }
  return canvas
}

/** 像素風草地：以 4 個場地單位為一格的小圖，畫面放大時關閉平滑保持像素感 */
export function buildGrass(cells: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = cells
  canvas.height = cells
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas
  ctx.fillStyle = '#4f8a3c'
  ctx.fillRect(0, 0, cells, cells)
  // 視覺用的固定亂數，每次產生同一片草地
  let seed = 12345
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed / 4294967296
  }
  const tones = ['#5a9644', '#467d35', '#62a04b', '#3f7330']
  for (let i = 0; i < cells * cells * 0.35; i++) {
    ctx.fillStyle = tones[Math.floor(rand() * tones.length)] ?? '#4f8a3c'
    ctx.fillRect(Math.floor(rand() * cells), Math.floor(rand() * cells), 1, 1)
  }
  const flowers = ['#f5e663', '#ffffff', '#f28fb0']
  for (let i = 0; i < cells * 0.6; i++) {
    ctx.fillStyle = flowers[Math.floor(rand() * flowers.length)] ?? '#ffffff'
    ctx.fillRect(Math.floor(rand() * cells), Math.floor(rand() * cells), 1, 1)
  }
  // 外框泥土邊
  ctx.fillStyle = '#6b4f32'
  ctx.fillRect(0, 0, cells, 2)
  ctx.fillRect(0, cells - 2, cells, 2)
  ctx.fillRect(0, 0, 2, cells)
  ctx.fillRect(cells - 2, 0, 2, cells)
  return canvas
}
