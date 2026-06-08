import { NextRequest, NextResponse } from 'next/server'
import { dbGet, dbInsert, dbPatch, dbUpsert } from '@/lib/game/supabase'
import { getLevel } from '@/lib/game/types'

const MAX_WAGER = 50
const MIN_WAGER = 2
const PLATFORM_CUT_PCT = 0.05
const QUESTIONS_PER_DUEL = 5

function getUserId(req: NextRequest): string | null {
  const cookie = req.cookies.get('openmaic_access')
  if (!cookie?.value?.startsWith('sso.')) return null
  return cookie.value.split('.')[1] ?? null
}

// GET — find open duels waiting for opponent (matchmaking)
export async function GET(req: NextRequest) {
  const userId = getUserId(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const duelId = req.nextUrl.searchParams.get('duel_id')
  if (duelId) {
    const duels = await dbGet('game_duels', {
      'duel_id': `eq.${duelId}`,
      'or': `(challenger_id.eq.${userId},opponent_id.eq.${userId})`,
    })
    return NextResponse.json({ duel: duels[0] ?? null })
  }

  // List open duels (waiting for opponent) not created by this user
  const openDuels = await dbGet('game_duels', {
    'status': 'eq.waiting',
    'challenger_id': `neq.${userId}`,
    'order': 'created_at.asc',
    'limit': '10',
  })

  return NextResponse.json({ open_duels: openDuels })
}

// POST — create a duel challenge
export async function POST(req: NextRequest) {
  const userId = getUserId(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { wager_oc } = await req.json()

  if (!wager_oc || wager_oc < MIN_WAGER || wager_oc > MAX_WAGER) {
    return NextResponse.json({ error: `Wager must be ${MIN_WAGER}–${MAX_WAGER} OC` }, { status: 400 })
  }

  // Check OC balance
  const statsRows = await dbGet('game_player_stats', { 'user_id': `eq.${userId}` })
  const stats = statsRows[0]
  if ((stats?.oc_balance ?? 0) < wager_oc) {
    return NextResponse.json({ error: 'Insufficient OC balance' }, { status: 400 })
  }

  // Draw questions
  const allQuestions = await dbGet('game_quiz_questions', { 'active': 'eq.true', 'limit': '100' })
  const shuffled = allQuestions.sort(() => Math.random() - 0.5).slice(0, QUESTIONS_PER_DUEL)
  const questionsForDuel = shuffled.map((q: any) => ({
    question_id: q.question_id,
    question_text: q.question_text,
    options: q.options,
  })) // Never include correct_index in stored questions

  // Deduct wager and create duel
  await dbUpsert('game_player_stats', {
    user_id: userId,
    oc_balance: (stats?.oc_balance ?? 0) - wager_oc,
    updated_at: new Date().toISOString(),
  }, 'user_id')

  const duel = await dbInsert('game_duels', {
    challenger_id: userId,
    wager_oc,
    status: 'waiting',
    questions: shuffled.map((q: any) => ({
      ...q, correct_index: q.correct_index,
    })),
  })

  return NextResponse.json({ duel })
}

// PATCH — join a duel, submit answers, or cancel
export async function PATCH(req: NextRequest) {
  const userId = getUserId(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { action, duel_id, answers, time_ms } = await req.json()

  if (action === 'join') {
    const duels = await dbGet('game_duels', { 'duel_id': `eq.${duel_id}`, 'status': 'eq.waiting' })
    const duel = duels[0]
    if (!duel) return NextResponse.json({ error: 'Duel not available' }, { status: 404 })
    if (duel.challenger_id === userId) return NextResponse.json({ error: 'Cannot duel yourself' }, { status: 400 })

    const statsRows = await dbGet('game_player_stats', { 'user_id': `eq.${userId}` })
    const stats = statsRows[0]
    if ((stats?.oc_balance ?? 0) < duel.wager_oc) {
      return NextResponse.json({ error: 'Insufficient OC balance' }, { status: 400 })
    }

    await Promise.all([
      dbPatch('game_duels', { duel_id: `eq.${duel_id}` }, {
        opponent_id: userId,
        status: 'active',
        started_at: new Date().toISOString(),
      }),
      dbUpsert('game_player_stats', {
        user_id: userId,
        oc_balance: (stats?.oc_balance ?? 0) - duel.wager_oc,
        updated_at: new Date().toISOString(),
      }, 'user_id'),
    ])

    return NextResponse.json({ ok: true, duel: { ...duel, opponent_id: userId, status: 'active' } })
  }

  if (action === 'submit') {
    const duels = await dbGet('game_duels', { 'duel_id': `eq.${duel_id}` })
    const duel = duels[0]
    if (!duel || !['waiting', 'active'].includes(duel.status)) {
      return NextResponse.json({ error: 'Duel not active' }, { status: 400 })
    }

    const questions: any[] = duel.questions ?? []
    let score = 0
    const answerRecords = []

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      const selected = answers?.[i] ?? -1
      const correct = selected === q.correct_index
      if (correct) score++
      answerRecords.push({
        duel_id,
        user_id: userId,
        question_index: i,
        selected_index: selected,
        correct,
        time_ms: time_ms ?? 0,
      })
    }

    // Save answers
    for (const a of answerRecords) {
      await dbInsert('game_duel_answers', a)
    }

    const isChallenger = duel.challenger_id === userId
    const updateField = isChallenger
      ? { challenger_score: score, challenger_time_ms: time_ms ?? 0 }
      : { opponent_score: score, opponent_time_ms: time_ms ?? 0 }

    await dbPatch('game_duels', { duel_id: `eq.${duel_id}` }, updateField)

    // Check if both players have submitted
    const updatedDuels = await dbGet('game_duels', { 'duel_id': `eq.${duel_id}` })
    const updated = updatedDuels[0]
    const bothSubmitted = updated.challenger_score > 0 || updated.opponent_score > 0

    let result = null
    if (bothSubmitted && updated.opponent_id) {
      // Determine winner
      let winnerId: string
      if (updated.challenger_score > updated.opponent_score) {
        winnerId = updated.challenger_id
      } else if (updated.opponent_score > updated.challenger_score) {
        winnerId = updated.opponent_id
      } else {
        // Tie: fastest wins
        winnerId = updated.challenger_time_ms <= updated.opponent_time_ms
          ? updated.challenger_id
          : updated.opponent_id
      }

      const pot = updated.wager_oc * 2
      const platformCut = Math.round(pot * PLATFORM_CUT_PCT * 100) / 100
      const winnerPayout = pot - platformCut

      await dbPatch('game_duels', { duel_id: `eq.${duel_id}` }, {
        status: 'finished',
        winner_id: winnerId,
        platform_cut: platformCut,
        finished_at: new Date().toISOString(),
      })

      // Award winner
      const winnerStats = await dbGet('game_player_stats', { 'user_id': `eq.${winnerId}` })
      const ws = winnerStats[0]
      await dbUpsert('game_player_stats', {
        user_id: winnerId,
        oc_balance: (ws?.oc_balance ?? 0) + winnerPayout,
        duel_wins: (ws?.duel_wins ?? 0) + 1,
        updated_at: new Date().toISOString(),
      }, 'user_id')

      result = { winner_id: winnerId, payout: winnerPayout, platform_cut: platformCut }
    }

    return NextResponse.json({ ok: true, score, result })
  }

  if (action === 'cancel') {
    const duels = await dbGet('game_duels', { 'duel_id': `eq.${duel_id}`, 'challenger_id': `eq.${userId}`, 'status': 'eq.waiting' })
    if (!duels[0]) return NextResponse.json({ error: 'Cannot cancel' }, { status: 400 })

    // Refund
    const stats = (await dbGet('game_player_stats', { 'user_id': `eq.${userId}` }))[0]
    await Promise.all([
      dbPatch('game_duels', { duel_id: `eq.${duel_id}` }, { status: 'cancelled' }),
      dbUpsert('game_player_stats', {
        user_id: userId,
        oc_balance: (stats?.oc_balance ?? 0) + duels[0].wager_oc,
        updated_at: new Date().toISOString(),
      }, 'user_id'),
    ])

    return NextResponse.json({ ok: true, refunded: duels[0].wager_oc })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
