// OnlyCrypto City — server-side board engine (Phase 1 + 2).
// Pure logic only: no I/O, no DB. Routes call these and persist results.
// Board layout lives in game_board; card deck lives in game_cards (Phase 2).

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
  effect_type: 'delta_oc' | 'protect_next_loss' | 'skip_turn' | 'move_to_space' | 'double_next_reward'
  effect_data: Record<string, unknown>
}

// ── Active effects (Phase 2) ──────────────────────────────────────────────────
// Persisted in game_sessions.board_state.active_effects.
// Each effect has rounds_remaining — decremented by tickEffects() each turn.

export type ActiveEffect =
  | { kind: 'protect_next_loss'; rounds_remaining: number }
  | { kind: 'skip_turn'; rounds_remaining: number }
  | { kind: 'double_next_reward'; rounds_remaining: number }
  | { kind: 'buy_discount'; pct: number; rounds_remaining: number }  // Phase 3: knowledge leverage

// Convert a raw board_state entry (could be loose Phase 1 shape) to a typed effect.
export function parseEffect(raw: unknown): ActiveEffect | null {
  if (!raw || typeof raw !== 'object') return null
  const e = raw as Record<string, unknown>
  const rounds = typeof e.rounds_remaining === 'number' ? e.rounds_remaining : 0
  if (rounds <= 0) return null
  switch (e.kind) {
    case 'protect_next_loss':  return { kind: 'protect_next_loss', rounds_remaining: rounds }
    case 'skip_turn':          return { kind: 'skip_turn', rounds_remaining: rounds }
    case 'double_next_reward': return { kind: 'double_next_reward', rounds_remaining: rounds }
    case 'buy_discount': {
      const pct = typeof e.pct === 'number' ? e.pct : 0.10
      return { kind: 'buy_discount', pct, rounds_remaining: rounds }
    }
    default: return null
  }
}

export function parseEffects(raw: unknown): ActiveEffect[] {
  if (!Array.isArray(raw)) return []
  return raw.map(parseEffect).filter((e): e is ActiveEffect => e !== null)
}

// Decrement rounds; remove expired.
export function tickEffects(effects: ActiveEffect[]): ActiveEffect[] {
  return effects
    .map(e => ({ ...e, rounds_remaining: e.rounds_remaining - 1 }))
    .filter(e => e.rounds_remaining > 0) as ActiveEffect[]
}

// Resolve a card's effect_type into an ActiveEffect (null = flat delta_oc only).
export function resolveCardEffect(card: CityCard): ActiveEffect | null {
  switch (card.effect_type) {
    case 'protect_next_loss': {
      const rounds = typeof card.effect_data?.rounds === 'number' ? card.effect_data.rounds : 3
      return { kind: 'protect_next_loss', rounds_remaining: rounds }
    }
    case 'skip_turn': {
      const rounds = typeof card.effect_data?.rounds === 'number' ? card.effect_data.rounds : 1
      return { kind: 'skip_turn', rounds_remaining: rounds }
    }
    case 'double_next_reward': {
      const rounds = typeof card.effect_data?.rounds === 'number' ? card.effect_data.rounds : 2
      return { kind: 'double_next_reward', rounds_remaining: rounds }
    }
    case 'move_to_space':
    case 'delta_oc':
    default:
      return null
  }
}

// Apply active effects to a proposed OCC delta BEFORE calling game_adjust_oc.
// Returns { adjusted, consumedEffects } — consumedEffects are single-use effects
// that should be removed from the array after application.
export function applyActiveEffects(
  deltaOc: number,
  effects: ActiveEffect[],
): { adjusted: number; consumedEffects: ActiveEffect['kind'][] } {
  let adjusted = deltaOc
  const consumed: ActiveEffect['kind'][] = []

  for (const e of effects) {
    if (e.kind === 'protect_next_loss' && deltaOc < 0) {
      // Protection blocks the loss entirely
      adjusted = 0
      consumed.push('protect_next_loss')
      break
    }
    if (e.kind === 'double_next_reward' && deltaOc > 0) {
      adjusted = deltaOc * 2
      consumed.push('double_next_reward')
      break
    }
  }

  return { adjusted, consumedEffects: consumed }
}

// Remove all effects of a given kind (for single-use consumed effects).
export function removeEffects(effects: ActiveEffect[], kinds: ActiveEffect['kind'][]): ActiveEffect[] {
  const set = new Set(kinds)
  return effects.filter(e => !set.has(e.kind))
}

// Hardcoded fallback decks — used when game_cards table is empty or unreachable.
// Do not delete until prod DB seed is confirmed. See migrations/phase2_cards.sql.
export const EVENT_CARDS: CityCard[] = [
  { id: 'ev-xrp-rally',    deck: 'event', text: 'XRP rallies 20% — collect 2 OCC',              delta_oc: 2,    effect_type: 'delta_oc',          effect_data: {} },
  { id: 'ev-bull-begins',  deck: 'event', text: 'Bull market begins — collect 1.5 OCC',          delta_oc: 1.5,  effect_type: 'delta_oc',          effect_data: {} },
  { id: 'ev-rug-pull',     deck: 'event', text: 'Rug pull detected — lose 2 OCC',                delta_oc: -2,   effect_type: 'delta_oc',          effect_data: {} },
  { id: 'ev-defi-exploit', deck: 'event', text: 'DeFi protocol exploited — lose 1.5 OCC',        delta_oc: -1.5, effect_type: 'delta_oc',          effect_data: {} },
  { id: 'ev-bad-risk',     deck: 'event', text: 'Failed to manage risk — pay 1 OCC penalty',     delta_oc: -1,   effect_type: 'delta_oc',          effect_data: {} },
  { id: 'ev-gas-spike',    deck: 'event', text: 'Network fees spike — pay 0.5 OCC',              delta_oc: -0.5, effect_type: 'delta_oc',          effect_data: {} },
]

export const OPPORTUNITY_CARDS: CityCard[] = [
  { id: 'op-cert',    deck: 'opportunity', text: 'Completed a certification — collect 1.5 OCC',           delta_oc: 1.5, effect_type: 'delta_oc', effect_data: {} },
  { id: 'op-airdrop', deck: 'opportunity', text: 'Discovered an airdrop — collect 2 OCC',                 delta_oc: 2,   effect_type: 'delta_oc', effect_data: {} },
  { id: 'op-staking', deck: 'opportunity', text: 'Successfully staked assets — earn 1 OCC yield',         delta_oc: 1,   effect_type: 'delta_oc', effect_data: {} },
  { id: 'op-early',   deck: 'opportunity', text: 'Early investor opportunity pays off — collect 1.5 OCC', delta_oc: 1.5, effect_type: 'delta_oc', effect_data: {} },
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
  | { kind: 'market_crash' }
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
