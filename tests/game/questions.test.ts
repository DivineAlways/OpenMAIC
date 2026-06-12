import { describe, it, expect } from 'vitest'
import { BOARD_QUESTIONS, getZoneQuestions, getZoneQuestionsPublic } from '@/lib/game/questions'

describe('question bank', () => {
  it('every question has a valid correct_index and 4 options', () => {
    for (const [zone, pool] of Object.entries(BOARD_QUESTIONS)) {
      for (const q of pool) {
        expect(q.options.length, `${zone}/${q.question_id}`).toBe(4)
        expect(q.correct_index).toBeGreaterThanOrEqual(0)
        expect(q.correct_index).toBeLessThan(4)
      }
    }
  })

  it('returns n distinct questions from a zone pool', () => {
    const qs = getZoneQuestions('blockchain-basics', 3)
    expect(qs).toHaveLength(3)
    expect(new Set(qs.map(q => q.question_id)).size).toBe(3)
    expect(qs.every(q => q.zone === 'blockchain-basics')).toBe(true)
  })

  it('caps at pool size when asking for more than exists', () => {
    const pool = BOARD_QUESTIONS['xrpl-ledger']
    expect(getZoneQuestions('xrpl-ledger', 99)).toHaveLength(pool.length)
  })

  it('returns empty for zones without questions in local bank', () => {
    expect(getZoneQuestions('nonexistent-zone', 3)).toEqual([])
  })

  it('is deterministic with a fixed rand', () => {
    const a = getZoneQuestions('defi-district', 3, () => 0.42)
    const b = getZoneQuestions('defi-district', 3, () => 0.42)
    expect(a.map(q => q.question_id)).toEqual(b.map(q => q.question_id))
  })
})

describe('getZoneQuestionsPublic — Phase 3 security', () => {
  it('strips correct_index from returned questions', () => {
    const qs = getZoneQuestionsPublic('blockchain-basics', 3)
    expect(qs.length).toBeGreaterThan(0)
    for (const q of qs) {
      expect(q).not.toHaveProperty('correct_index')
    }
  })

  it('still returns question_id, question_text, and options', () => {
    const qs = getZoneQuestionsPublic('xrpl-ledger', 2)
    for (const q of qs) {
      expect(q).toHaveProperty('question_id')
      expect(q).toHaveProperty('question_text')
      expect(q).toHaveProperty('options')
      expect(q.options).toHaveLength(4)
    }
  })

  it('returns empty array for unknown zone', () => {
    expect(getZoneQuestionsPublic('unknown-zone', 3)).toEqual([])
  })

  it('correct_index is never present in any public question', () => {
    for (const zoneId of Object.keys(BOARD_QUESTIONS)) {
      const qs = getZoneQuestionsPublic(zoneId, 5)
      for (const q of qs) {
        expect('correct_index' in q).toBe(false)
      }
    }
  })
})
