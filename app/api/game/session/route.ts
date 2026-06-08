import { NextRequest, NextResponse } from 'next/server'
import { dbGet, dbInsert, dbPatch, dbUpsert } from '@/lib/game/supabase'
import { getLevel, XP_REWARDS, OC_REWARDS, SESSION_OC_CAP, DAILY_OC_CAP, ALL_ZONES } from '@/lib/game/types'

function getUserId(req: NextRequest): string | null {
  const cookie = req.cookies.get('openmaic_access')
  if (!cookie?.value?.startsWith('sso.')) return null
  return cookie.value.split('.')[1] ?? null
}

// POST /api/game/session — start a new session
export async function POST(req: NextRequest) {
  const userId = getUserId(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { mode = 'standard' } = await req.json().catch(() => ({}))

  // Check user is a paid member for standard mode
  const users = await dbGet('users', { 'id': `eq.${userId}`, 'select': 'id,is_paid' })
  if (!users[0]) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  if (mode === 'standard' && !users[0].is_paid) {
    return NextResponse.json({ error: 'Active membership required', code: 'not_paid' }, { status: 403 })
  }

  // Check daily OC cap
  const statsRows = await dbGet('game_player_stats', { 'user_id': `eq.${userId}` })
  const stats = statsRows[0]
  const today = new Date().toISOString().slice(0, 10)
  if (stats && stats.last_daily_reset === today && (stats.oc_earned_today ?? 0) >= DAILY_OC_CAP) {
    return NextResponse.json({ error: 'Daily OC limit reached — come back tomorrow', code: 'daily_cap' }, { status: 429 })
  }

  // Get unlocked zones based on player level and academy completions
  const level = stats ? getLevel(stats.total_xp) : 1
  const zones = ALL_ZONES.map(z => ({
    ...z,
    unlocked: z.unlocked || level >= 5,
  }))

  // Draw initial questions for first 8 zones
  const activeZoneIds = zones.filter(z => z.unlocked).slice(0, 8).map(z => z.id)

  const session = await dbInsert('game_sessions', {
    user_id: userId,
    mode,
    board_state: {
      current_position: 0,
      assets: [],
      oc_balance: 0,
      xp: 0,
      active_effects: [],
    },
  })

  return NextResponse.json({ session, zones, level })
}

// PATCH /api/game/session — end session and award XP + OC
export async function PATCH(req: NextRequest) {
  const userId = getUserId(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { session_id, score, zones_completed, xp_earned, oc_earned: rawOc, board_state } = await req.json()

  // Enforce session OC cap
  const oc_earned = Math.min(rawOc ?? 0, SESSION_OC_CAP)

  // Get current stats
  const statsRows = await dbGet('game_player_stats', { 'user_id': `eq.${userId}` })
  const stats = statsRows[0] ?? { total_xp: 0, oc_balance: 0, oc_earned_today: 0, oc_earned_week: 0 }

  const today = new Date().toISOString().slice(0, 10)
  const todayOc = stats.last_daily_reset === today ? (stats.oc_earned_today ?? 0) : 0
  const cappedOc = Math.min(oc_earned, DAILY_OC_CAP - todayOc)

  const newXp = (stats.total_xp ?? 0) + (xp_earned ?? 0)
  const newLevel = getLevel(newXp)

  await Promise.all([
    // Update session
    dbPatch('game_sessions', { session_id: `eq.${session_id}` }, {
      ended_at: new Date().toISOString(),
      score: score ?? 0,
      zones_completed: zones_completed ?? [],
      xp_earned: xp_earned ?? 0,
      oc_earned: cappedOc,
      board_state,
      completed: true,
    }),
    // Update player stats
    dbUpsert('game_player_stats', {
      user_id: userId,
      total_xp: newXp,
      level: newLevel,
      oc_balance: (stats.oc_balance ?? 0) + cappedOc,
      oc_earned_today: todayOc + cappedOc,
      oc_earned_week: (stats.oc_earned_week ?? 0) + cappedOc,
      last_daily_reset: today,
      updated_at: new Date().toISOString(),
    }, 'user_id'),
  ])

  return NextResponse.json({
    ok: true,
    xp_earned: xp_earned ?? 0,
    oc_earned: cappedOc,
    new_level: newLevel,
    leveled_up: newLevel > getLevel(stats.total_xp ?? 0),
  })
}
