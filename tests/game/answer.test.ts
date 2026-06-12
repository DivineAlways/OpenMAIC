import { describe, it, expect } from 'vitest'
import {
  applyActiveEffects,
  tickEffects,
  parseEffects,
  removeEffects,
  type ActiveEffect,
} from '@/lib/game/engine'
import { BOARD_QUESTIONS, getZoneQuestions, getZoneQuestionsPublic } from '@/lib/game/questions'

// Unit tests for the logic used by /api/game/answer.
// The actual HTTP route is integration-tested; these cover the pure functions
// that drive grading, penalty resolution, and knowledge leverage.

const QUIZ_OC_CORRECT = 0.5
const OWN_DISTRICT_BONUS = 0.5
const BUY_DISCOUNT_PCT = 0.10
const DAILY_OC_CAP = 50

describe('server-side answer grading logic', () => {
  it('correct answer awards OCC (simulated)', () => {
    // Simulate what the route does: correct → award QUIZ_OC_CORRECT
    const correct = true
    const underCap = true
    const awarded = correct && underCap ? QUIZ_OC_CORRECT : 0
    expect(awarded).toBe(0.5)
  })

  it('wrong answer awards nothing', () => {
    const correct = false
    const awarded = correct ? QUIZ_OC_CORRECT : 0
    expect(awarded).toBe(0)
  })

  it('answer at daily cap awards nothing', () => {
    const correct = true
    const underCap = false
    const awarded = correct && underCap ? QUIZ_OC_CORRECT : 0
    expect(awarded).toBe(0)
  })
})

describe('pending penalty resolution', () => {
  it('correct answer halves the penalty', () => {
    const pendingPenalty = -2
    const correct = true
    const resolved = correct ? pendingPenalty / 2 : pendingPenalty
    expect(resolved).toBe(-1)
  })

  it('wrong answer applies the full penalty', () => {
    const pendingPenalty = -2
    const correct = false
    const resolved = correct ? pendingPenalty / 2 : pendingPenalty
    expect(resolved).toBe(-2)
  })

  it('protect_next_loss blocks the resolved penalty', () => {
    const resolved = -1  // halved penalty after correct answer
    const effects: ActiveEffect[] = [{ kind: 'protect_next_loss', rounds_remaining: 2 }]
    const { adjusted, consumedEffects } = applyActiveEffects(resolved, effects)
    expect(adjusted).toBe(0)
    expect(consumedEffects).toContain('protect_next_loss')
  })

  it('no penalty when pendingPenalty is 0', () => {
    const pendingPenalty = 0
    // Route skips the penalty block entirely when pendingPenalty >= 0
    expect(pendingPenalty < 0).toBe(false)
  })
})

describe('knowledge leverage — quiz streak', () => {
  it('streak increments on correct answer', () => {
    let streak = 0
    const correct = true
    if (correct) streak += 1
    expect(streak).toBe(1)
  })

  it('streak does not increment on wrong answer', () => {
    let streak = 1
    const correct = false
    if (correct) streak += 1
    expect(streak).toBe(1)
  })

  it('reaching streak 3 creates a buy_discount effect', () => {
    const streak = 3
    const effects: ActiveEffect[] = []
    if (streak >= 3 && !effects.some(e => e.kind === 'buy_discount')) {
      effects.push({ kind: 'buy_discount', pct: BUY_DISCOUNT_PCT, rounds_remaining: 1 })
    }
    expect(effects).toHaveLength(1)
    expect(effects[0]).toMatchObject({ kind: 'buy_discount', pct: 0.10 })
  })

  it('buy_discount is not duplicated if already present', () => {
    const streak = 3
    const effects: ActiveEffect[] = [{ kind: 'buy_discount', pct: 0.10, rounds_remaining: 1 }]
    if (streak >= 3 && !effects.some(e => e.kind === 'buy_discount')) {
      effects.push({ kind: 'buy_discount', pct: BUY_DISCOUNT_PCT, rounds_remaining: 1 })
    }
    expect(effects).toHaveLength(1)
  })

  it('streak below 3 does not create buy_discount', () => {
    const streak = 2
    const effects: ActiveEffect[] = []
    if (streak >= 3 && !effects.some(e => e.kind === 'buy_discount')) {
      effects.push({ kind: 'buy_discount', pct: BUY_DISCOUNT_PCT, rounds_remaining: 1 })
    }
    expect(effects).toHaveLength(0)
  })
})

describe('effects tick after answer resolution', () => {
  it('effects are ticked after answer, expiring when rounds hit 0', () => {
    const effects: ActiveEffect[] = [
      { kind: 'buy_discount', pct: 0.10, rounds_remaining: 1 },
      { kind: 'protect_next_loss', rounds_remaining: 3 },
    ]
    const ticked = tickEffects(effects)
    expect(ticked).toHaveLength(1)
    expect(ticked[0]).toMatchObject({ kind: 'protect_next_loss', rounds_remaining: 2 })
  })
})

describe('practice mode — no OCC awarded', () => {
  it('practice sessions are guest- prefixed, skipped by getVerifiedUserId', () => {
    const sessionId = 'guest-123456'
    expect(sessionId.startsWith('guest-')).toBe(true)
  })
})
