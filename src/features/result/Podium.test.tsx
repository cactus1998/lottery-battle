import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { createWorld, stepUntilEnd } from '@/engine/world'
import { Podium } from './Podium'

function result(n: number, winners: number) {
  return stepUntilEnd(
    createWorld({
      entrants: Array.from({ length: n }, (_, i) => ({ id: i, label: `P${i + 1}` })),
      settings: { winners },
      seed: 11,
    }),
  )
}

describe('Podium', () => {
  it('lists the top three in rank order for screen readers', () => {
    const r = result(10, 1)
    render(<Podium ranking={r.ranking} settings={r.settings} />)
    const items = within(screen.getByRole('list', { name: '前三名頒獎台' })).getAllByRole(
      'listitem',
    )
    expect(items).toHaveLength(3)
    r.ranking.slice(0, 3).forEach((row, i) => {
      expect(items[i]).toHaveTextContent(row.label)
      expect(items[i]).toHaveTextContent(String(row.rank))
    })
  })

  it('marks podium places that did not win', () => {
    const r = result(10, 1)
    render(<Podium ranking={r.ranking} settings={r.settings} />)
    expect(screen.getAllByText('未得獎')).toHaveLength(2)
  })

  it('shows only as many places as there are entrants', () => {
    const r = result(2, 1)
    render(<Podium ranking={r.ranking} settings={r.settings} />)
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
  })

  it('shows the prize for each winning place only', () => {
    const r = result(10, 2)
    render(<Podium ranking={r.ranking} settings={{ ...r.settings, prizes: ['Switch', '禮券'] }} />)
    const items = screen.getAllByRole('listitem')
    expect(items[0]).toHaveTextContent('Switch')
    expect(items[1]).toHaveTextContent('禮券')
    expect(items[2]).toHaveTextContent('未得獎')
  })
})
