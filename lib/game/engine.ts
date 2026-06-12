// OnlyCrypto City — server-side board engine (Phase 1).
// Pure logic only: no I/O, no DB. Routes call these and persist results.
// Board layout itself lives in the game_board table (see migrations/phase1_city_board.sql).

export const BOARD_SIZE = 24
export const LAP_BONUS_OC = 2
export const STAKING_BONUS_OC = 1
export const MARKET_CRASH_POSITION = 6
export const GO_TO_CRASH_POSITION = 18
export const FREE_STAKING_POSITION = 12
export const START_POSITION = 0

export interface BoardSpace {
  position: number
  space_type: 'district' | 'corner' | 'event' | 'opportunity'
  zone_id: string | null
  name: string
  emoji: string | null
  color: string | null
  purchase_price_oc: number | null
  base_rent_oc: number | null
}

export interface CityCard {
  id: string
  deck: 'event' | 'opportunity'
  text: string
  delta_oc: number
}

// Market Event deck ("Chance") — small, flavor-first; full deck engine is Phase 2.
export const EVENT_CARDS: CityCard[] = [
  { id: 'ev-xrp-rally',    deck: 'event', text: 'XRP rallies 20% — collect 2 OCC',                       delta_oc: 2 },
  { id: 'ev-bull-begins',  deck: 'event', text: 'Bull market begins — collect 1.5 OCC',                  delta_oc: 1.5 },
  { id: 'ev-rug-pull',     deck: 'event', text: 'Rug pull detected — lose 2 OCC',                        delta_oc: -2 },
  { id: 'ev-defi-exploit', deck: 'event', text: 'DeFi protocol exploited — lose 1.5 OCC',                delta_oc: -1.5 },
  { id: 'ev-bad-risk',     deck: 'event', text: 'Failed to manage risk — pay 1 OCC penalty',             delta_oc: -1 },
  { id: 'ev-gas-spike',    deck: 'event', text: 'Network fees spike — pay 0.5 OCC',                      delta_oc: -0.5 },
]

// Crypto Opportunity deck ("Community Chest") — positive reinforcement.
export const OPPORTUNITY_CARDS: CityCard[] = [
  { id: 'op-cert',    deck: 'opportunity', text: 'Completed a certification — collect 1.5 OCC',          delta_oc: 1.5 },
  { id: 'op-airdrop', deck: 'opportunity', text: 'Discovered an airdrop — collect 2 OCC',                delta_oc: 2 },
  { id: 'op-staking', deck: 'opportunity', text: 'Successfully staked assets — earn 1 OCC yield',        delta_oc: 1 },
  { id: 'op-early',   deck: 'opportunity', text: 'Early investor opportunity pays off — collect 1.5 OCC', delta_oc: 1.5 },
]

export function rollDice(rand: () => number = Math.random): number {
  return Math.floor(rand() * 6) + 1
}

export function advance(position: number, dice: number): { position: number; passedStart: boolean } {
  const raw = position + dice
  return { position: raw % BOARD_SIZE, passedStart: raw >= BOARD_SIZE }
}

export function drawCard(deck: 'event' | 'opportunity', rand: () => number = Math.random): CityCard {
  const cards = deck === 'event' ? EVENT_CARDS : OPPORTUNITY_CARDS
  return cards[Math.floor(rand() * cards.length)]
}

// Landing resolution — what happens on a space, independent of who/where.
export type LandingAction =
  | { kind: 'start' }
  | { kind: 'market_crash' }                       // visiting only (Phase 1)
  | { kind: 'free_staking'; bonus_oc: number }
  | { kind: 'go_to_crash'; move_to: number }
  | { kind: 'card'; deck: 'event' | 'opportunity' }
  | { kind: 'district' }

export function resolveSpace(space: BoardSpace): LandingAction {
  switch (space.space_type) {
    case 'district':
      return { kind: 'district' }
    case 'event':
      return { kind: 'card', deck: 'event' }
    case 'opportunity':
      return { kind: 'card', deck: 'opportunity' }
    case 'corner':
      if (space.position === FREE_STAKING_POSITION) return { kind: 'free_staking', bonus_oc: STAKING_BONUS_OC }
      if (space.position === GO_TO_CRASH_POSITION) return { kind: 'go_to_crash', move_to: MARKET_CRASH_POSITION }
      if (space.position === MARKET_CRASH_POSITION) return { kind: 'market_crash' }
      return { kind: 'start' }
  }
}
