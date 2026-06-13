/**
 * Guards the game rewards disclosure + OCC disclaimer required by ADR-005
 * "Compliance & disclosures" (main repo) before OnlyCrypto City launches.
 * Fails if anyone edits or removes a required statement.
 */

import { describe, it, expect } from 'vitest'
import {
  GAME_REWARDS_STATEMENTS,
  OCC_DISCLAIMER_STATEMENTS,
  GAME_REWARDS_TEXT,
  OCC_DISCLAIMER_TEXT,
} from '@/components/game-rewards-disclosure'

const REQUIRED_REWARDS = [
  'Rewards may change.',
  'OCC values may fluctuate.',
  'Participation does not guarantee rewards.',
]

const REQUIRED_OCC = [
  'OCC is a utility token.',
  'OCC is not guaranteed to increase in value.',
  'OCC should not be purchased with an expectation of profit.',
  'Digital assets involve risk.',
]

describe('game rewards disclosure (ADR-005)', () => {
  it('contains exactly the three required rewards statements', () => {
    expect([...GAME_REWARDS_STATEMENTS]).toEqual(REQUIRED_REWARDS)
  })

  it('contains exactly the four required OCC statements', () => {
    expect([...OCC_DISCLAIMER_STATEMENTS]).toEqual(REQUIRED_OCC)
  })

  for (const statement of [...REQUIRED_REWARDS, ...REQUIRED_OCC]) {
    it(`rendered text includes: "${statement}"`, () => {
      expect(`${GAME_REWARDS_TEXT} ${OCC_DISCLAIMER_TEXT}`).toContain(statement)
    })
  }
})
