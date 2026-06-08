import { NextRequest, NextResponse } from 'next/server'
import { getUserId } from '@/lib/game/supabase'
import { dbGet, dbInsert, dbPatch, dbUpsert } from '@/lib/game/supabase'
import { getLevel } from '@/lib/game/types'

const PLATFORM_CUT_PCT = 0.1
const PRIZE_SPLITS = [0.6, 0.3, 0.1] // top 3


// GET — list open tournaments + player's entries
export async function GET(req: NextRequest) {
  const userId = getUserId(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [tournaments, entries] = await Promise.all([
    dbGet('game_tournaments', { 'status': 'in.(open,active)', 'order': 'start_at.asc' }),
    dbGet('game_tournament_entries', { 'user_id': `eq.${userId}`, 'select': 'tournament_id,score,rank,payout_oc,paid_out' }),
  ])

  const enteredIds = new Set(entries.map((e: any) => e.tournament_id))

  return NextResponse.json({
    tournaments: tournaments.map((t: any) => ({
      ...t,
      entered: enteredIds.has(t.tournament_id),
    })),
    my_entries: entries,
  })
}

// POST — enter a tournament
export async function POST(req: NextRequest) {
  const userId = getUserId(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { tournament_id } = await req.json()

  // Get tournament
  const tournaments = await dbGet('game_tournaments', { 'tournament_id': `eq.${tournament_id}` })
  const t = tournaments[0]
  if (!t) return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })
  if (t.status !== 'open') return NextResponse.json({ error: 'Tournament not open for entries' }, { status: 400 })

  // Check player level (Level 4+ required)
  const statsRows = await dbGet('game_player_stats', { 'user_id': `eq.${userId}` })
  const stats = statsRows[0]
  const level = stats ? getLevel(stats.total_xp) : 1
  if (level < 4) {
    return NextResponse.json({ error: 'Level 4+ required for tournaments', code: 'level_gate' }, { status: 403 })
  }

  // Check OC balance
  if ((stats?.oc_balance ?? 0) < t.entry_fee_oc) {
    return NextResponse.json({ error: 'Insufficient OC balance' }, { status: 400 })
  }

  // Check not already entered
  const existing = await dbGet('game_tournament_entries', {
    'tournament_id': `eq.${tournament_id}`,
    'user_id': `eq.${userId}`,
  })
  if (existing.length > 0) return NextResponse.json({ error: 'Already entered' }, { status: 400 })

  // Deduct entry fee + update pot
  await Promise.all([
    dbUpsert('game_player_stats', {
      user_id: userId,
      oc_balance: (stats.oc_balance ?? 0) - t.entry_fee_oc,
      updated_at: new Date().toISOString(),
    }, 'user_id'),
    dbPatch('game_tournaments', { tournament_id: `eq.${tournament_id}` }, {
      pot_total: parseFloat(t.pot_total) + t.entry_fee_oc,
    }),
    dbInsert('game_tournament_entries', { tournament_id, user_id: userId }),
  ])

  return NextResponse.json({ ok: true, entry_fee_paid: t.entry_fee_oc })
}

// PATCH — submit score (called when player finishes their tournament game)
export async function PATCH(req: NextRequest) {
  const userId = getUserId(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { tournament_id, score, answer_time_ms } = await req.json()

  await dbPatch('game_tournament_entries', {
    'tournament_id': `eq.${tournament_id}`,
    'user_id': `eq.${userId}`,
  }, { score: score ?? 0, answer_time_ms: answer_time_ms ?? 0 })

  return NextResponse.json({ ok: true })
}
