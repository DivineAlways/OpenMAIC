-- OnlyCrypto City Phase 1 — Monopoly board, persistent ownership, OCC ledger
-- See GAME-VISION.md + ARCHITECT/ADR/ADR-005. Run on prod Supabase (krgeexpexiodxkxightz).

-- ── 1. Board layout as data (24-space perimeter, tunable without deploys) ──────
create table if not exists game_board (
  position int primary key check (position >= 0 and position <= 23),
  space_type text not null check (space_type in ('district','corner','event','opportunity')),
  zone_id text unique,            -- null for non-district spaces
  name text not null,
  emoji text,
  color text,
  purchase_price_oc numeric(10,2),
  base_rent_oc numeric(10,2),
  meta jsonb not null default '{}'::jsonb,
  constraint district_has_price check (
    space_type <> 'district' or (zone_id is not null and purchase_price_oc is not null and base_rent_oc is not null)
  )
);

-- ── 2. Persistent district ownership (one owner per district, whole city shared) ──
create table if not exists game_properties (
  id uuid primary key default gen_random_uuid(),
  zone_id text not null unique references game_board(zone_id) on delete restrict,
  user_id uuid not null,
  price_paid_oc numeric(10,2) not null,
  purchased_at timestamptz not null default now()
);
create index if not exists idx_game_properties_user on game_properties(user_id);

-- ── 3. Append-only OCC ledger (balance audit trail; game_player_stats.oc_balance is the cache) ──
create table if not exists game_occ_ledger (
  id bigint generated always as identity primary key,
  user_id uuid not null,
  delta_oc numeric(10,2) not null,
  reason text not null,           -- district_purchase | rent_paid | rent_received | lap_bonus | event | opportunity | quiz_reward | ...
  ref_id text,
  created_at timestamptz not null default now()
);
create index if not exists idx_game_occ_ledger_user on game_occ_ledger(user_id, created_at desc);

-- Lock down: service-role access only (game API routes use the service key; no client access)
alter table game_board enable row level security;
alter table game_properties enable row level security;
alter table game_occ_ledger enable row level security;

-- ── 4. Atomic purchase: balance check + debit + ownership + ledger in one tx ──────
create or replace function game_buy_district(p_user_id uuid, p_zone_id text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_price numeric(10,2);
  v_name text;
  v_balance numeric(10,2);
begin
  select purchase_price_oc, name into v_price, v_name
  from game_board
  where zone_id = p_zone_id and space_type = 'district';

  if v_price is null then
    return jsonb_build_object('ok', false, 'error', 'not_purchasable');
  end if;

  -- Guarded debit: only succeeds if balance covers price (row-level atomic)
  update game_player_stats
     set oc_balance = oc_balance - v_price, updated_at = now()
   where user_id = p_user_id and oc_balance >= v_price;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'insufficient_balance');
  end if;

  -- unique(zone_id) makes the second concurrent buyer fail here;
  -- the exception block rolls back the debit above.
  insert into game_properties (zone_id, user_id, price_paid_oc)
  values (p_zone_id, p_user_id, v_price);

  insert into game_occ_ledger (user_id, delta_oc, reason, ref_id)
  values (p_user_id, -v_price, 'district_purchase', p_zone_id);

  select oc_balance into v_balance from game_player_stats where user_id = p_user_id;
  return jsonb_build_object('ok', true, 'zone_id', p_zone_id, 'name', v_name, 'price', v_price, 'balance', v_balance);
exception when unique_violation then
  return jsonb_build_object('ok', false, 'error', 'already_owned');
end;
$$;

-- ── 5. Rent transfer: pay what you can (Monopoly-style), both ledger legs in one tx ──
create or replace function game_pay_rent(p_payer uuid, p_owner uuid, p_amount numeric, p_zone_id text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_balance numeric(10,2);
  v_paid numeric(10,2);
begin
  if p_payer = p_owner or p_amount is null or p_amount <= 0 then
    return jsonb_build_object('ok', true, 'paid', 0);
  end if;

  -- ensure both rows exist before locking (no-op if present)
  insert into game_player_stats (user_id) values (p_payer), (p_owner)
  on conflict (user_id) do nothing;

  -- deterministic lock order prevents deadlock on crossed payments
  if p_payer < p_owner then
    perform 1 from game_player_stats where user_id = p_payer for update;
    perform 1 from game_player_stats where user_id = p_owner for update;
  else
    perform 1 from game_player_stats where user_id = p_owner for update;
    perform 1 from game_player_stats where user_id = p_payer for update;
  end if;

  select oc_balance into v_balance from game_player_stats where user_id = p_payer;

  v_paid := least(p_amount, greatest(v_balance, 0));
  if v_paid <= 0 then
    return jsonb_build_object('ok', true, 'paid', 0, 'balance', v_balance);
  end if;

  update game_player_stats set oc_balance = oc_balance - v_paid, updated_at = now()
   where user_id = p_payer;

  update game_player_stats set oc_balance = oc_balance + v_paid, updated_at = now()
   where user_id = p_owner;

  insert into game_occ_ledger (user_id, delta_oc, reason, ref_id) values
    (p_payer, -v_paid, 'rent_paid', p_zone_id),
    (p_owner,  v_paid, 'rent_received', p_zone_id);

  select oc_balance into v_balance from game_player_stats where user_id = p_payer;
  return jsonb_build_object('ok', true, 'paid', v_paid, 'balance', v_balance);
end;
$$;

-- ── 6. Small board credits/debits (lap bonus, event/opportunity cards), clamped at 0 ──
create or replace function game_adjust_oc(p_user uuid, p_amount numeric, p_reason text, p_ref text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_balance numeric(10,2);
  v_applied numeric(10,2);
begin
  if p_amount is null or p_amount = 0 then
    return jsonb_build_object('ok', true, 'applied', 0);
  end if;

  insert into game_player_stats (user_id) values (p_user)
  on conflict (user_id) do nothing;

  select oc_balance into v_balance from game_player_stats where user_id = p_user for update;

  if p_amount < 0 then
    v_applied := -least(-p_amount, greatest(v_balance, 0));  -- never go below 0
  else
    v_applied := p_amount;
  end if;

  if v_applied <> 0 then
    -- Positive credits count toward the daily/weekly earn counters (with date
    -- rollover) so board income shares the same DAILY_OC_CAP as quiz rewards —
    -- otherwise lap bonuses / cards are an uncapped farmable faucet.
    if v_applied > 0 then
      update game_player_stats
         set oc_balance = oc_balance + v_applied,
             oc_earned_today = case when last_daily_reset = current_date then oc_earned_today + v_applied else v_applied end,
             last_daily_reset = current_date,
             oc_earned_week = oc_earned_week + v_applied,
             updated_at = now()
       where user_id = p_user;
    else
      update game_player_stats set oc_balance = oc_balance + v_applied, updated_at = now()
       where user_id = p_user;
    end if;
    insert into game_occ_ledger (user_id, delta_oc, reason, ref_id)
    values (p_user, v_applied, p_reason, p_ref);
  end if;

  select oc_balance into v_balance from game_player_stats where user_id = p_user;
  return jsonb_build_object('ok', true, 'applied', v_applied, 'balance', v_balance);
end;
$$;

-- ── 6b. Lock down RPC surface: SECURITY DEFINER functions must NOT be callable
--        with the public anon key (PostgREST exposes every public function at
--        /rest/v1/rpc/<name> with EXECUTE granted to PUBLIC by default).
revoke all on function game_buy_district(uuid, text) from public, anon, authenticated;
revoke all on function game_pay_rent(uuid, uuid, numeric, text) from public, anon, authenticated;
revoke all on function game_adjust_oc(uuid, numeric, text, text) from public, anon, authenticated;

grant execute on function game_buy_district(uuid, text) to service_role;
grant execute on function game_pay_rent(uuid, uuid, numeric, text) to service_role;
grant execute on function game_adjust_oc(uuid, numeric, text, text) to service_role;

-- Note: faucet credits (quiz, lap bonus, cards, staking) count toward
-- oc_earned_today/oc_earned_week inside game_adjust_oc. Rent transfers are
-- zero-sum between players and intentionally bypass the counters.

-- ── 7. Seed the 24-space board (idempotent) ────────────────────────────────────
insert into game_board (position, space_type, zone_id, name, emoji, color, purchase_price_oc, base_rent_oc) values
  (0,  'corner',      null,                 'START',                 '🏁', '#3b82f6', null, null),
  (1,  'district',    'blockchain-basics',  'Blockchain Basics',     '🔗', '#3b82f6', 10, 1),
  (2,  'district',    'xrpl-ledger',        'XRP Ledger District',   '💧', '#06b6d4', 10, 1),
  (3,  'opportunity', null,                 'Crypto Opportunity',    '🎁', '#22c55e', null, null),
  (4,  'district',    'wallet-security',    'Wallet Security HQ',    '🔐', '#f59e0b', 15, 1.5),
  (5,  'district',    'trading-psychology', 'Trading Psychology',    '🧠', '#8b5cf6', 15, 1.5),
  (6,  'corner',      null,                 'Market Crash',          '📉', '#ef4444', null, null),
  (7,  'district',    'risk-management',    'Risk Management',       '⚖️', '#ef4444', 20, 2),
  (8,  'district',    'technical-analysis', 'Technical Analysis',    '📊', '#10b981', 20, 2),
  (9,  'event',       null,                 'Market Event',          '⚡', '#f97316', null, null),
  (10, 'district',    'defi-district',      'DeFi District',         '🏗️', '#f97316', 25, 2.5),
  (11, 'district',    'nft-marketplace',    'NFT Marketplace',       '🎨', '#ec4899', 25, 2.5),
  (12, 'corner',      null,                 'Free Staking',          '🪙', '#22c55e', null, null),
  (13, 'district',    'ai-trading-lab',     'AI Trading Lab',        '🤖', '#6366f1', 30, 3),
  (14, 'district',    'liquidity-pool',     'Liquidity Pool Plaza',  '💦', '#14b8a6', 30, 3),
  (15, 'opportunity', null,                 'Crypto Opportunity',    '🎁', '#22c55e', null, null),
  (16, 'district',    'tokenomics-tower',   'Tokenomics Tower',      '🏛️', '#a855f7', 35, 3.5),
  (17, 'district',    'dao-governance',     'DAO Governance Hall',   '🗳️', '#64748b', 35, 3.5),
  (18, 'corner',      null,                 'Go To Crash',           '🚨', '#dc2626', null, null),
  (19, 'district',    'wealth-mindset',     'Wealth Mindset Blvd',   '💡', '#eab308', 40, 4),
  (20, 'district',    'bear-market',        'Bear Market District',  '🐻', '#dc2626', 40, 4),
  (21, 'event',       null,                 'Market Event',          '⚡', '#f97316', null, null),
  (22, 'district',    'bull-market',        'Bull Market Blvd',      '🐂', '#16a34a', 50, 5),
  (23, 'district',    'metaverse-city',     'Metaverse Square',      '🌐', '#0ea5e9', 50, 5)
on conflict (position) do nothing;
