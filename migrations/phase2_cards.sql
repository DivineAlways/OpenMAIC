-- OnlyCrypto City Phase 2 — Card decks engine (Market Event + Crypto Opportunity)
-- All OCC mutations remain in game_adjust_oc (Phase 1). This migration adds the
-- tunable card deck table and a safe random-draw function.
-- Run on prod Supabase (krgeexpexiodxkxightz) after phase1_city_board.sql.

-- ── 1. Card deck table ─────────────────────────────────────────────────────────
create table if not exists game_cards (
  id text primary key,                        -- stable slug, e.g. 'ev-xrp-rally'
  deck text not null check (deck in ('event', 'opportunity')),
  text text not null,
  delta_oc numeric(10,2) not null default 0,
  -- effect_type controls what happens BEYOND a flat OCC delta.
  -- 'delta_oc'          — plain gain/loss, no lasting state
  -- 'protect_next_loss' — shields player from the next negative board event
  -- 'skip_turn'         — player's next turn is skipped
  -- 'move_to_space'     — move player to a specific board position
  -- 'double_next_reward' — doubles OCC on next positive credit
  effect_type text not null default 'delta_oc'
    check (effect_type in ('delta_oc','protect_next_loss','skip_turn','move_to_space','double_next_reward')),
  effect_data jsonb not null default '{}'::jsonb,  -- e.g. {"position": 12} for move_to_space
  active boolean not null default true
);

alter table game_cards enable row level security;
revoke all on table game_cards from public, anon, authenticated;
grant select, insert, update, delete on table game_cards to service_role;

-- ── 2. Atomic random-draw function (no correct_index to hide, but SECURITY DEFINER
--        keeps the card pool inaccessible to the anon key so players can't pre-read
--        the deck order). ──────────────────────────────────────────────────────────
create or replace function game_draw_card(p_deck text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_card game_cards%rowtype;
begin
  select * into v_card
  from game_cards
  where deck = p_deck and active = true
  order by random()
  limit 1;

  if not found then
    return null;
  end if;

  return jsonb_build_object(
    'id',          v_card.id,
    'deck',        v_card.deck,
    'text',        v_card.text,
    'delta_oc',    v_card.delta_oc,
    'effect_type', v_card.effect_type,
    'effect_data', v_card.effect_data
  );
end;
$$;

revoke all on function game_draw_card(text) from public, anon, authenticated;
grant execute on function game_draw_card(text) to service_role;

-- ── 3. Seed Market Event deck (12 cards — mix of positive and negative) ─────────
-- Negative cards are the economy's primary OCC sink on the board.
insert into game_cards (id, deck, text, delta_oc, effect_type, effect_data) values
  -- Positive events
  ('ev-xrp-rally',      'event', 'XRP rallies 20% overnight — collect 2 OCC',                                          2.00,  'delta_oc',          '{}'),
  ('ev-bull-begins',    'event', 'Bull market confirmed — Bitcoin breaks ATH, collect 1.5 OCC',                         1.50,  'delta_oc',          '{}'),
  ('ev-etf-approved',   'event', 'Spot crypto ETF approved — institutions flood in, collect 2.5 OCC',                   2.50,  'delta_oc',          '{}'),
  ('ev-halving-hype',   'event', 'Bitcoin halving triggers supply shock — collect 1 OCC',                                1.00,  'delta_oc',          '{}'),
  ('ev-defi-boom',      'event', 'DeFi TVL reaches new record — your portfolio benefits, collect 1 OCC',                 1.00,  'delta_oc',          '{}'),
  -- Protective event
  ('ev-cold-storage',   'event', 'You moved assets to cold storage just in time — protect your next loss',               0.00,  'protect_next_loss', '{"rounds": 3}'),
  -- Negative events (OCC sinks)
  ('ev-rug-pull',       'event', 'Rug pull detected — project vanishes with investor funds, lose 2 OCC',                -2.00, 'delta_oc',          '{}'),
  ('ev-defi-exploit',   'event', 'DeFi protocol exploited — $50M drained, lose 1.5 OCC',                               -1.50, 'delta_oc',          '{}'),
  ('ev-bad-risk',       'event', 'Ignored stop-loss — position blew up, pay 1 OCC penalty',                            -1.00, 'delta_oc',          '{}'),
  ('ev-gas-spike',      'event', 'Network congestion — gas fees spike 10x, pay 0.5 OCC',                               -0.50, 'delta_oc',          '{}'),
  ('ev-liquidation',    'event', 'Over-leveraged position liquidated — lose 2 OCC',                                     -2.00, 'delta_oc',          '{}'),
  ('ev-flash-crash',    'event', 'Flash crash wipes 30% in minutes — lose 1.5 OCC',                                    -1.50, 'delta_oc',          '{}')
on conflict (id) do update set
  text = excluded.text, delta_oc = excluded.delta_oc,
  effect_type = excluded.effect_type, effect_data = excluded.effect_data;

-- ── 4. Seed Crypto Opportunity deck (10 cards — primarily positive, one skip-turn risk) ──
insert into game_cards (id, deck, text, delta_oc, effect_type, effect_data) values
  ('op-cert',           'opportunity', 'Completed an on-chain certification — collect 1.5 OCC',                         1.50, 'delta_oc',          '{}'),
  ('op-airdrop',        'opportunity', 'Discovered a legitimate airdrop — collect 2 OCC',                               2.00, 'delta_oc',          '{}'),
  ('op-staking',        'opportunity', 'Successfully staked assets — earn 1 OCC yield',                                  1.00, 'delta_oc',          '{}'),
  ('op-early-inv',      'opportunity', 'Early investor in a promising project — collect 2 OCC',                          2.00, 'delta_oc',          '{}'),
  ('op-yield-farm',     'opportunity', 'Yield farming strategy pays off — collect 1 OCC',                                1.00, 'delta_oc',          '{}'),
  ('op-whitelist',      'opportunity', 'Whitelisted for a premium NFT mint — collect 1.5 OCC',                           1.50, 'delta_oc',          '{}'),
  ('op-dao-grant',      'opportunity', 'DAO grants you a development bounty — collect 2.5 OCC',                          2.50, 'delta_oc',          '{}'),
  ('op-double-reward',  'opportunity', 'Trading bot executes perfect arbitrage — double your next OCC reward',            0.00, 'double_next_reward', '{"rounds": 2}'),
  ('op-hodl-diamond',   'opportunity', 'Diamond hands paid off during the dip — collect 1 OCC',                          1.00, 'delta_oc',          '{}'),
  ('op-scam-warning',   'opportunity', 'You fell for a scam link — skip your next turn while you recover',                0.00, 'skip_turn',          '{"rounds": 1}')
on conflict (id) do update set
  text = excluded.text, delta_oc = excluded.delta_oc,
  effect_type = excluded.effect_type, effect_data = excluded.effect_data;
