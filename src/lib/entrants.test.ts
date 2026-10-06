import { describe, expect, it } from 'vitest'
import { parseExclude, parseList, parseRange, parseSeed } from './entrants'

describe('parseRange', () => {
  it('creates one entrant per number', () => {
    const { entrants, errors } = parseRange('1', '5', '')
    expect(errors).toEqual([])
    expect(entrants.map((e) => e.label)).toEqual(['1', '2', '3', '4', '5'])
    expect(entrants.map((e) => e.id)).toEqual([0, 1, 2, 3, 4])
  })

  it('skips excluded numbers and ranges', () => {
    const { entrants } = parseRange('1', '10', '2, 5-7，9')
    expect(entrants.map((e) => e.label)).toEqual(['1', '3', '4', '8', '10'])
  })

  it('warns about unknown exclude parts but still parses', () => {
    const { entrants, warnings } = parseRange('1', '3', 'abc')
    expect(entrants).toHaveLength(3)
    expect(warnings[0]).toContain('abc')
  })

  it.each([
    ['', '5', '請輸入'],
    ['5', '1', '不能大於'],
    ['1.5', '3', '整數'],
    ['1', '1', '至少'],
    ['1', '301', '最多'],
    ['1', '99999999', '最多'],
  ])('rejects start=%s end=%s', (start, end, message) => {
    const { entrants, errors } = parseRange(start, end, '')
    expect(entrants).toEqual([])
    expect(errors.join()).toContain(message)
  })

  it('rejects when exclusions leave fewer than 2', () => {
    expect(parseRange('1', '3', '1-2').errors.join()).toContain('至少')
  })
})

describe('parseList', () => {
  it('ignores blank lines and trims names', () => {
    const { entrants } = parseList('  小明 \n\n小華\r\n小美\n')
    expect(entrants.map((e) => e.label)).toEqual(['小明', '小華', '小美'])
  })

  it('removes duplicates with a warning', () => {
    const { entrants, warnings } = parseList('A\nB\nA\nA')
    expect(entrants.map((e) => e.label)).toEqual(['A', 'B'])
    expect(warnings[0]).toContain('2')
  })

  it('rejects more than 300 names', () => {
    const text = Array.from({ length: 301 }, (_, i) => `p${i}`).join('\n')
    expect(parseList(text).errors.join()).toContain('最多')
  })
})

describe('parseExclude', () => {
  it('accepts reversed ranges', () => {
    expect([...parseExclude('5-3').numbers]).toEqual([3, 4, 5])
  })
})

describe('parseSeed', () => {
  it('returns null for blank, number for digits, NaN otherwise', () => {
    expect(parseSeed(' ')).toBeNull()
    expect(parseSeed('123')).toBe(123)
    expect(parseSeed('abc')).toBeNaN()
    expect(parseSeed('99999999999')).toBeNaN()
  })
})
