import { describe, it, expect } from 'vitest'
import {
  BOARD_SIZE,
  rollDice,
  advance,
  drawCard,
  resolveSpace,
  resolveCardEffect,
  applyActiveEffects,
  tickEffects,
  removeEffects,
  parseEffects,
  parseEffect,
  EVENT_CARDS,
  OPPORTUNITY_CARDS,
  MARKET_CRASH_POSITION,
  GO_TO_CRASH_POSITION,
  FREE_STAKING_POSITION,
  STAKING_BONUS_OC,
  type BoardSpace,
  type ActiveEffect,
  type CityCard,
} from '@/lib/game/engine'

function space(position: number, space_type: BoardSpace['space_type'], zone_id: string | null = null): BoardSpace {
  return { position, space_type, zone_id, name: 'X', emoji: null, color: null, purchase_price_oc: null, base_rent_oc: null }
}

function card(overrides: Partial<CityCard> = {}): CityCard {
  return {
    id: 'test',
    deck: 'event',
    text: 'Test card',
    delta_oc: 0,
    effect_type: 'delta_oc',
    effect_data: {},
    ...overrides,
  }
}

// ── Phase 1 tests (preserved) ────────────────────────────────────────────────

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

// ── Phase 2 tests: effect system ─────────────────────────────────────────────

describe('resolveCardEffect', () => {
  it('delta_oc cards produce null (no lasting effect)', () => {
    expect(resolveCardEffect(card({ effect_type: 'delta_oc', delta_oc: -2 }))).toBeNull()
  })

  it('protect_next_loss produces a protection effect', () => {
    const effect = resolveCardEffect(card({ effect_type: 'protect_next_loss', effect_data: { rounds: 3 } }))
    expect(effect).toEqual({ kind: 'protect_next_loss', rounds_remaining: 3 })
  })

  it('skip_turn produces a skip effect with default 1 round', () => {
    const effect = resolveCardEffect(card({ effect_type: 'skip_turn', effect_data: {} }))
    expect(effect).toEqual({ kind: 'skip_turn', rounds_remaining: 1 })
  })

  it('double_next_reward produces a double effect', () => {
    const effect = resolveCardEffect(card({ effect_type: 'double_next_reward', effect_data: { rounds: 2 } }))
    expect(effect).toEqual({ kind: 'double_next_reward', rounds_remaining: 2 })
  })

  it('move_to_space produces null (handled immediately, no lasting state)', () => {
    expect(resolveCardEffect(card({ effect_type: 'move_to_space' }))).toBeNull()
  })
})

describe('applyActiveEffects', () => {
  it('passes through a delta with no effects', () => {
    const { adjusted, consumedEffects } = applyActiveEffects(2, [])
    expect(adjusted).toBe(2)
    expect(consumedEffects).toEqual([])
  })

  it('protect_next_loss blocks a negative delta and marks itself consumed', () => {
    const effects: ActiveEffect[] = [{ kind: 'protect_next_loss', rounds_remaining: 2 }]
    const { adjusted, consumedEffects } = applyActiveEffects(-2, effects)
    expect(adjusted).toBe(0)
    expect(consumedEffects).toContain('protect_next_loss')
  })

  it('protect_next_loss does NOT block a positive delta', () => {
    const effects: ActiveEffect[] = [{ kind: 'protect_next_loss', rounds_remaining: 2 }]
    const { adjusted, consumedEffects } = applyActiveEffects(2, effects)
    expect(adjusted).toBe(2)
    expect(consumedEffects).toEqual([])
  })

  it('double_next_reward doubles a positive delta and marks itself consumed', () => {
    const effects: ActiveEffect[] = [{ kind: 'double_next_reward', rounds_remaining: 1 }]
    const { adjusted, consumedEffects } = applyActiveEffects(1.5, effects)
    expect(adjusted).toBe(3)
    expect(consumedEffects).toContain('double_next_reward')
  })

  it('double_next_reward does NOT apply to a negative delta', () => {
    const effects: ActiveEffect[] = [{ kind: 'double_next_reward', rounds_remaining: 1 }]
    const { adjusted, consumedEffects } = applyActiveEffects(-1, effects)
    expect(adjusted).toBe(-1)
    expect(consumedEffects).toEqual([])
  })
})

describe('tickEffects', () => {
  it('decrements rounds_remaining by 1', () => {
    const effects: ActiveEffect[] = [
      { kind: 'protect_next_loss', rounds_remaining: 3 },
      { kind: 'skip_turn', rounds_remaining: 1 },
    ]
    const ticked = tickEffects(effects)
    expect(ticked).toHaveLength(1)
    expect(ticked[0]).toEqual({ kind: 'protect_next_loss', rounds_remaining: 2 })
  })

  it('removes effects when rounds_remaining reaches 0', () => {
    const effects: ActiveEffect[] = [{ kind: 'skip_turn', rounds_remaining: 1 }]
    expect(tickEffects(effects)).toHaveLength(0)
  })

  it('handles empty array', () => {
    expect(tickEffects([])).toEqual([])
  })
})

describe('removeEffects', () => {
  it('removes all effects of the given kinds', () => {
    const effects: ActiveEffect[] = [
      { kind: 'protect_next_loss', rounds_remaining: 2 },
      { kind: 'skip_turn', rounds_remaining: 1 },
      { kind: 'double_next_reward', rounds_remaining: 2 },
    ]
    const result = removeEffects(effects, ['protect_next_loss', 'skip_turn'])
    expect(result).toHaveLength(1)
    expect(result[0].kind).toBe('double_next_reward')
  })

  it('is safe with empty kinds list', () => {
    const effects: ActiveEffect[] = [{ kind: 'skip_turn', rounds_remaining: 1 }]
    expect(removeEffects(effects, [])).toEqual(effects)
  })
})

describe('parseEffect / parseEffects', () => {
  it('parses a valid effect', () => {
    expect(parseEffect({ kind: 'skip_turn', rounds_remaining: 2 })).toEqual({ kind: 'skip_turn', rounds_remaining: 2 })
  })

  it('returns null for expired effects (rounds <= 0)', () => {
    expect(parseEffect({ kind: 'skip_turn', rounds_remaining: 0 })).toBeNull()
  })

  it('returns null for unknown effect kinds', () => {
    expect(parseEffect({ kind: 'teleport', rounds_remaining: 5 })).toBeNull()
  })

  it('returns null for non-object input', () => {
    expect(parseEffect(null)).toBeNull()
    expect(parseEffect('string')).toBeNull()
    expect(parseEffect(42)).toBeNull()
  })

  it('parseEffects filters out nulls and expired', () => {
    const raw = [
      { kind: 'protect_next_loss', rounds_remaining: 3 },
      { kind: 'unknown_effect', rounds_remaining: 5 },
      { kind: 'skip_turn', rounds_remaining: 0 },
      null,
    ]
    const effects = parseEffects(raw)
    expect(effects).toHaveLength(1)
    expect(effects[0].kind).toBe('protect_next_loss')
  })

  it('parseEffects handles non-array input gracefully', () => {
    expect(parseEffects(null)).toEqual([])
    expect(parseEffects(undefined)).toEqual([])
    expect(parseEffects('invalid')).toEqual([])
  })
})
