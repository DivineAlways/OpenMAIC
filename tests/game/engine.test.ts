import { describe, it, expect } from 'vitest'
import {
  BOARD_SIZE,
  rollDice,
  advance,
  drawCard,
  resolveSpace,
  EVENT_CARDS,
  OPPORTUNITY_CARDS,
  MARKET_CRASH_POSITION,
  GO_TO_CRASH_POSITION,
  FREE_STAKING_POSITION,
  STAKING_BONUS_OC,
  type BoardSpace,
} from '@/lib/game/engine'

function space(position: number, space_type: BoardSpace['space_type'], zone_id: string | null = null): BoardSpace {
  return { position, space_type, zone_id, name: 'X', emoji: null, color: null, purchase_price_oc: null, base_rent_oc: null }
}

describe('rollDice', () => {
  it('returns 1..6 across the rand range', () => {
    expect(rollDice(() => 0)).toBe(1)
    expect(rollDice(() => 0.999999)).toBe(6)
    expect(rollDice(() => 0.5)).toBe(4)
  })
})

describe('advance', () => {
  it('moves forward without wrapping', () => {
    expect(advance(0, 5)).toEqual({ position: 5, passedStart: false })
  })

  it('wraps around the 24-space board and flags passing START', () => {
    expect(advance(22, 4)).toEqual({ position: 2, passedStart: true })
  })

  it('landing exactly on START counts as passing it', () => {
    expect(advance(BOARD_SIZE - 2, 2)).toEqual({ position: 0, passedStart: true })
  })

  it('never passes START on a normal mid-board move', () => {
    expect(advance(10, 6)).toEqual({ position: 16, passedStart: false })
  })
})

describe('drawCard', () => {
  it('draws from the requested deck', () => {
    expect(drawCard('event', () => 0)).toBe(EVENT_CARDS[0])
    expect(drawCard('opportunity', () => 0.999999)).toBe(OPPORTUNITY_CARDS[OPPORTUNITY_CARDS.length - 1])
  })

  it('decks only contain matching deck tags', () => {
    expect(EVENT_CARDS.every(c => c.deck === 'event')).toBe(true)
    expect(OPPORTUNITY_CARDS.every(c => c.deck === 'opportunity')).toBe(true)
  })
})

describe('resolveSpace', () => {
  it('districts trigger the district flow', () => {
    expect(resolveSpace(space(1, 'district', 'blockchain-basics'))).toEqual({ kind: 'district' })
  })

  it('event and opportunity spaces draw from the right deck', () => {
    expect(resolveSpace(space(9, 'event'))).toEqual({ kind: 'card', deck: 'event' })
    expect(resolveSpace(space(3, 'opportunity'))).toEqual({ kind: 'card', deck: 'opportunity' })
  })

  it('corners resolve by position', () => {
    expect(resolveSpace(space(0, 'corner'))).toEqual({ kind: 'start' })
    expect(resolveSpace(space(MARKET_CRASH_POSITION, 'corner'))).toEqual({ kind: 'market_crash' })
    expect(resolveSpace(space(FREE_STAKING_POSITION, 'corner'))).toEqual({ kind: 'free_staking', bonus_oc: STAKING_BONUS_OC })
    expect(resolveSpace(space(GO_TO_CRASH_POSITION, 'corner'))).toEqual({ kind: 'go_to_crash', move_to: MARKET_CRASH_POSITION })
  })
})
