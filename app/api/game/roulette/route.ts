import { NextRequest, NextResponse } from 'next/server'
import { getUserId } from '@/lib/game/supabase'
import { dbGet, dbInsert, dbPatch, dbUpsert } from '@/lib/game/supabase'

const MAX_ROUNDS_PER_SESSION = 5
const DAILY_WAGER_CAP = 50
const PAYOUT_MULTIPLIER = 1.9


// GET — fetch a random scenario + current session state
export async function GET(req: NextRequest) {
  const userId = getUserId(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sessionId = req.nextUrl.searchParams.get('session_id')

  // Check if active session has remaining rounds
  if (sessionId) {
    const sessions = await dbGet('game_roulette_sessions', { 'session_id': `eq.${sessionId}`, 'user_id': `eq.${userId}` })
    const session = sessions[0]
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    if (session.rounds_played >= MAX_ROUNDS_PER_SESSION) {
      return NextResponse.json({ session, done: true, rounds_remaining: 0 })
    }

    // Get a scenario not played in this session
    const playedRounds = await dbGet('game_roulette_rounds', { 'session_id': `eq.${sessionId}`, 'select': 'scenario_id' })
    const playedIds = playedRounds.map((r: any) => r.scenario_id)
    const scenarios = await dbGet('game_roulette_scenarios', { 'active': 'eq.true' })
    const available = scenarios.filter((s: any) => !playedIds.includes(s.scenario_id))
    if (available.length === 0) return NextResponse.json({ error: 'No more scenarios' }, { status: 404 })

    const scenario = available[Math.floor(Math.random() * available.length)]
    return NextResponse.json({
      session,
      scenario: { ...scenario, correct_index: undefined }, // never send answer
      rounds_remaining: MAX_ROUNDS_PER_SESSION - session.rounds_played,
    })
  }

  // Start new session — check daily wager cap
  const today = new Date().toISOString().slice(0, 10)
  const todaySessions = await dbGet('game_roulette_sessions', {
    'user_id': `eq.${userId}`,
    'created_at': `gte.${today}T00:00:00.000Z`,
    'select': 'total_wagered',
  })
  const todayWagered = todaySessions.reduce((sum: number, s: any) => sum + parseFloat(s.total_wagered ?? 0), 0)
  if (todayWagered >= DAILY_WAGER_CAP) {
    return NextResponse.json({ error: 'Daily wager limit reached', daily_cap: DAILY_WAGER_CAP }, { status: 429 })
  }

  const newSession = await dbInsert('game_roulette_sessions', { user_id: userId })
  const scenarios = await dbGet('game_roulette_scenarios', { 'active': 'eq.true' })
  const scenario = scenarios[Math.floor(Math.random() * scenarios.length)]

  return NextResponse.json({
    session: newSession,
    scenario: { ...scenario, correct_index: undefined },
    rounds_remaining: MAX_ROUNDS_PER_SESSION,
    daily_remaining: DAILY_WAGER_CAP - todayWagered,
  })
}

// POST — submit a prediction
export async function POST(req: NextRequest) {
  const userId = getUserId(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { session_id, scenario_id, prediction_index, wager_oc } = await req.json()
  if (!session_id || !scenario_id || prediction_index === undefined || !wager_oc) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  // Validate wager
  if (wager_oc < 1 || wager_oc > 20) {
    return NextResponse.json({ error: 'Wager must be between 1 and 20 OC' }, { status: 400 })
  }

  // Get session
  const sessions = await dbGet('game_roulette_sessions', { 'session_id': `eq.${session_id}`, 'user_id': `eq.${userId}` })
  const session = sessions[0]
  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  if (session.rounds_played >= MAX_ROUNDS_PER_SESSION) {
    return NextResponse.json({ error: 'Session complete' }, { status: 400 })
  }

  // Check player OC balance
  const statsRows = await dbGet('game_player_stats', { 'user_id': `eq.${userId}` })
  const stats = statsRows[0]
  if (!stats || (stats.oc_balance ?? 0) < wager_oc) {
    return NextResponse.json({ error: 'Insufficient OC balance' }, { status: 400 })
  }

  // Get scenario with answer
  const scenarios = await dbGet('game_roulette_scenarios', { 'scenario_id': `eq.${scenario_id}` })
  const scenario = scenarios[0]
  if (!scenario) return NextResponse.json({ error: 'Scenario not found' }, { status: 404 })

  const correct = prediction_index === scenario.correct_index
  const payout_oc = correct ? Math.round(wager_oc * PAYOUT_MULTIPLIER * 100) / 100 : 0
  const net = payout_oc - wager_oc

  // Record round
  await dbInsert('game_roulette_rounds', {
    session_id,
    user_id: userId,
    scenario_id,
    wager_oc,
    prediction_index,
    correct,
    payout_oc,
  })

  // Update session totals
  await dbPatch('game_roulette_sessions', { session_id: `eq.${session_id}` }, {
    rounds_played: session.rounds_played + 1,
    total_wagered: (parseFloat(session.total_wagered) + wager_oc).toFixed(2),
    total_won: (parseFloat(session.total_won) + payout_oc).toFixed(2),
  })

  // Update player OC balance
  await dbUpsert('game_player_stats', {
    user_id: userId,
    oc_balance: Math.max(0, (stats.oc_balance ?? 0) + net),
    updated_at: new Date().toISOString(),
  }, 'user_id')

  return NextResponse.json({
    correct,
    correct_index: scenario.correct_index,
    explanation: scenario.explanation,
    payout_oc,
    net,
    rounds_remaining: MAX_ROUNDS_PER_SESSION - (session.rounds_played + 1),
    new_balance: Math.max(0, (stats.oc_balance ?? 0) + net),
  })
}
