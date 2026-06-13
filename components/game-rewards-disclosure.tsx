// Required disclosures per ADR-005 "Compliance & disclosures" (main repo) and
// GAME-VISION.md — shown on every /game/* page via app/game/layout.tsx.
// tests/game/disclosure.test.ts guards these lists.

export const GAME_REWARDS_STATEMENTS = [
  'Rewards may change.',
  'OCC values may fluctuate.',
  'Participation does not guarantee rewards.',
] as const

export const OCC_DISCLAIMER_STATEMENTS = [
  'OCC is a utility token.',
  'OCC is not guaranteed to increase in value.',
  'OCC should not be purchased with an expectation of profit.',
  'Digital assets involve risk.',
] as const

export const GAME_REWARDS_TEXT = GAME_REWARDS_STATEMENTS.join(' ')
export const OCC_DISCLAIMER_TEXT = OCC_DISCLAIMER_STATEMENTS.join(' ')

export function GameRewardsDisclosure() {
  return (
    <footer className="bg-[#0a0a0f] border-t border-white/5 px-6 py-6">
      <div className="max-w-3xl mx-auto text-center space-y-1.5">
        <p className="text-xs text-white/30 leading-relaxed">{GAME_REWARDS_TEXT}</p>
        <p className="text-xs text-white/30 leading-relaxed">{OCC_DISCLAIMER_TEXT}</p>
      </div>
    </footer>
  )
}
