# OnlyCrypto City — Game Vision

> **"Monopoly for the Blockchain Generation"**
> A game where people learn blockchain, crypto, trading, DeFi, risk management, and
> wealth-building principles while competing to build the most successful crypto city.

Set by Divinity, 2026-06-12. This document is the north star for all OnlyCrypto City
development. The current dice/quiz MVP stays as a building block, but the destination
is a full educational crypto city-building board game powered by OCC — **not** a quiz app.

---

## Development Philosophy (non-negotiable ordering)

1. **The game loop comes first.**
2. **The board game comes first.**
3. **The fun comes first.**
4. **The economy comes first.**
5. The metaverse layer is built around the game later — never metaverse-first.

The objective is something people genuinely want to play, not another educational quiz app.

---

## Core Vision

### Districts (the "properties")
The board is made of educational and ecosystem districts. The 16 zones already in
`lib/game/types.ts` map 1:1 to this vision:

| District | Status in code |
|---|---|
| Blockchain Basics | `blockchain-basics` ✅ |
| XRP Ledger District | `xrpl-ledger` ✅ |
| Wallet Security | `wallet-security` ✅ |
| Trading Psychology | `trading-psychology` ✅ |
| Risk Management | `risk-management` ✅ |
| Technical Analysis | `technical-analysis` ✅ |
| DeFi District | `defi-district` ✅ |
| NFT Marketplace | `nft-marketplace` ✅ |
| AI Trading Lab | `ai-trading-lab` ✅ |
| Liquidity Pool Plaza | `liquidity-pool` ✅ |
| Tokenomics Tower | `tokenomics-tower` ✅ |
| DAO Governance Hall | `dao-governance` ✅ |
| Wealth Mindset Boulevard | `wealth-mindset` ✅ |
| Bear Market District | `bear-market` ✅ |
| Bull Market Boulevard | `bull-market` ✅ |
| Metaverse Square | `metaverse-city` ✅ |

### Property ownership
- Land on a district → option to **purchase it with OCC** (e.g. Risk Management District, 50 OCC).
- Ownership is **persistent across sessions** (not per-game-session like today).
- Other players landing on an owned district pay fees / generate rewards / trigger events.

### Property upgrades (instead of houses/hotels)
Crypto-themed upgrade assets: Learning Centers, Trading Labs, Validator Nodes,
DeFi Vaults, AI Research Centers, NFT Studios, Mining Facilities.
Each upgrade increases value and strategic advantage.
(`GAME_ASSETS` in `lib/game/types.ts` is the seed for this — currently defined but unused.)

### Knowledge Challenges (existing quiz system slots in here)
Landing on specific spaces triggers educational questions.
- Correct → earn OCC, unlock bonuses, reduce penalties, increase rewards.
- Incorrect → missed opportunities or reduced rewards.
- **Education becomes part of winning** — e.g. answering correctly lowers a purchase
  price, dodges a penalty, or boosts rent.

### Market Event Cards (replaces "Chance")
"XRP rallies 20% — collect OCC" · "Bull market begins" · "Rug pull detected — lose OCC" ·
"Failed to manage risk — pay penalty" · "DeFi protocol exploited — lose assets".
Teach real-world concepts while creating gameplay variety.
(`GameEvent` type with `bull | bear | skill` already exists — not wired in.)

### Crypto Opportunity Cards (replaces Community Chest)
"Completed certification — collect OCC" · "Discovered an airdrop" ·
"Successfully staked assets — earn yield" · "Early investor opportunity".
Reinforce positive blockchain and financial behaviors.

### OCC Economy
OCC is the native currency: property purchases, upgrades, tournament entries,
digital assets, avatar upgrades, premium features, special events.
The game must create **actual utility for OCC**.

### Tournaments
Scheduled, entry-fee tournaments. Example: 10 OCC entry × 100 players → pool split
**70% prize pool / 20% burn / 10% liquidity**. Creates demand + deflationary pressure.

---

## Current MVP — What Exists Today (2026-06-12)

Lives in this repo (`OpenMAIC`, deployed at learn.onlycrypto.io), reached via SSO
from onlycrypto.io (`/api/academy/game-link`).

- **`/game`** hub → modes: Play (standard/practice), Tournament, Duel, Roulette, Pot
- **`/game/play`**: dice roll → land on one of 16 zones (4×4 grid) → 3 quiz questions
  → XP + OC rewards → end-of-game summary
- **Questions**: hardcoded client-side in `app/game/play/page.tsx` for 8 of 16 zones
- **Rewards**: XP (`XP_REWARDS`) + OC (`OC_REWARDS`), daily cap 50 OC, session cap 25 OC
- **Persistence**: `game_player_stats`, `game_sessions` tables (Supabase)
- **Tournaments/Duels/Pot**: separate quiz modes with entry fees & pots — already OCC sinks

### Gaps vs the vision

| Vision element | Current state |
|---|---|
| District ownership (buy with OCC, persistent) | ❌ none — `BoardState.assets` exists but per-session and unused |
| Rent / fees when others land on your district | ❌ none — no cross-player interaction on the board |
| Upgrades (Learning Center → Validator Node …) | ❌ `GAME_ASSETS` defined, no buy/market phase rendered |
| Market Event cards | ❌ `GameEvent` type + `'event'` game phase declared, never reached |
| Crypto Opportunity cards | ❌ none |
| Monopoly-style perimeter board with corners/card spaces | ❌ 4×4 grid of zones only |
| Knowledge challenges affecting board outcomes | ⚠️ quizzes give flat OC/XP only — no gameplay leverage |
| Tournament 70/20/10 split (prize/burn/liquidity) | ⚠️ pots exist; no burn or liquidity allocation |
| Server-authoritative engine | ❌ dice, question selection, and answer grading run **client-side**; client reports `oc_earned` to the server (capped, but spoofable up to the caps) |

---

## Architecture Principles (decided now, before building)

1. **Server-authoritative game engine.** Dice rolls, card draws, question selection,
   answer grading, and every OCC mutation happen in API routes — the client renders
   state, it never computes rewards. (Today's client-computed rewards are acceptable
   for the MVP only because of the caps; this must be fixed before property ownership
   makes OCC balances strategically valuable.)
2. **OCC ledger, not balance edits.** Every OCC credit/debit is an append-only row
   (`game_occ_ledger`) with a reason code; balances are derived. Same discipline as the
   platform payout queue. Atomic conditional updates (DO/Vercel run multiple instances).
3. **Question bank in the database**, not in client bundles. Correct answers never ship
   to the browser before the player answers.
4. **The board is data.** Board layout, district prices, rent tables, upgrade tracks,
   and card decks live in config/DB — game designers tune the economy without code deploys.
5. **Persistent world state separated from session state.** Ownership/upgrades persist
   (`game_properties`); a play session references them.
6. **Economy must have sinks ≥ sources.** Every new OCC faucet ships with a sink.
   Burn percentages and caps are config, reviewed against the OCC whitepaper.

---

## Phased Roadmap (board game first — no metaverse)

### Phase 1 — Monopoly board + ownership core
Perimeter board (16 districts + 4 corners + event/opportunity spaces), server-side
dice + movement, **buy districts with OCC**, persistent ownership, basic rent when
landing on owned districts. Single shared world (every member plays on one city) or
per-league boards — decide in plan phase.

### Phase 2 — Card decks + events engine
Market Event deck + Crypto Opportunity deck, effect resolution engine
(gain/lose OCC, protect, skip, move), deck content in DB.

### Phase 3 — Upgrades + knowledge leverage
Upgrade tracks per district; knowledge challenges gate/discount upgrades, reduce
penalties, boost rent. Server-side question bank with per-zone pools (fill the 8 missing
zones). Education becomes strategy.

### Phase 4 — Economy hardening + tournaments
OCC sources/sinks balance sheet, tournament engine with 70/20/10 split, burn ledger,
seasons + leaderboard resets, anti-abuse (rate limits, anomaly alerts).

### Phase 5 — Multiplayer depth
Async multiplayer on the shared board (rent between players, trades), duels integrated
as board encounters; real-time rooms later.

### Later — Metaverse layer
Only after the board game is fun and the economy is stable.

---

## Team note
If additional developers, designers, game specialists, or consultants are needed,
they can be brought in as the project grows.
