import { NextRequest, NextResponse } from 'next/server'
import { dbGet, dbPatch, dbRpc } from '@/lib/game/supabase'
import { getVerifiedUserId } from '@/lib/game/auth'
import {
  type ActiveEffect,
  parseEffects,
  tickEffects,
  removeEffects,
  applyActiveEffects,
} from '@/lib/game/engine'
import { BOARD_QUESTIONS } from '@/lib/game/questions'
import { DAILY_OC_CAP } from '@/lib/game/types'

const QUIZ_OC_CORRECT = 0.5
const OWN_DISTRICT_BONUS = 0.5
const BUY_DISCOUNT_PCT = 0.10

// POST /api/game/answer — server-side answer grading (Phase 3).
// Closes the spoofable session-PATCH OCC faucet from Phase 1.
// Applies knowledge leverage mechanics:
//   • 3/3 correct this turn  → buy_discount effect (10% off next purchase)
//   • 3/3 on own district   → +0.5 OCC bonus
//   • correct answer        → pending_penalty halved (pending-then-maybe flow)
//
// body: { session_id, question_id, answer_index }
export async function POST(req: NextRequest) {
  const userId = getVerifiedUserId(req)
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized — please re-enter the game from onlycrypto.io', code: 'reauth' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const sessionId = String(body.session_id ?? '')
  const questionId = String(body.question_id ?? '')
  const answerIndex = Number(body.answer_index ?? -1)

  if (!sessionId || sessionId.startsWith('guest-') || !questionId || answerIndex < 0 || answerIndex > 3) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  // ── Load session ─────────────────────────────────────────────────────────────
  const sessions = await dbGet('game_sessions', {
    session_id: `eq.${sessionId}`,
    select: 'session_id,user_id,completed,board_state',
  })
  const session = sessions[0]
  if (!session || session.user_id !== userId || session.completed) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  const boardState = session.board_state ?? {}
  let activeEffects: ActiveEffect[] = parseEffects(boardState.active_effects)
  const pendingPenalty: number = typeof boardState.pending_penalty === 'number' ? boardState.pending_penalty : 0
  const currentZoneId: string | null = boardState.current_zone_id ?? null
  let quizStreak: number = typeof boardState.quiz_streak === 'number' ? boardState.quiz_streak : 0

  // ── Grade the answer — DB first, local fallback ───────────────────────────────
  let correct = false
  let explanation: string | undefined

  const gradeResult = await dbRpc<Record<string, unknown>>('game_grade_answer', {
    p_question_id: questionId,
    p_answer_index: answerIndex,
  })

  if (gradeResult?.ok) {
    correct = Boolean(gradeResult.correct)
    explanation = typeof gradeResult.explanation === 'string' ? gradeResult.explanation : undefined
  } else {
    // Local fallback: search all zones for this question_id
    let found = false
    for (const questions of Object.values(BOARD_QUESTIONS)) {
      const q = questions.find(q => q.question_id === questionId)
      if (q) {
        correct = answerIndex === q.correct_index
        explanation = q.explanation
        found = true
        break
      }
    }
    if (!found) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }
  }

  // ── Stats for daily cap check ─────────────────────────────────────────────────
  const statsRows = await dbGet('game_player_stats', { user_id: `eq.${userId}` })
  const stats = statsRows[0]
  const today = new Date().toISOString().slice(0, 10)
  const todayOc = stats?.last_daily_reset === today ? Number(stats?.oc_earned_today ?? 0) : 0
  const underDailyCap = todayOc < DAILY_OC_CAP

  let ocAwarded = 0
  let balance: number = Number(stats?.oc_balance ?? 0)
  const effectsApplied: string[] = []

  // ── Apply pending_penalty (halved on correct answer) ──────────────────────────
  let resolvedPenalty = pendingPenalty
  if (pendingPenalty < 0) {
    if (correct) {
      resolvedPenalty = pendingPenalty / 2  // correct answer halves the penalty
    }
    // Check protect_next_loss before applying penalty
    const { adjusted, consumedEffects } = applyActiveEffects(resolvedPenalty, activeEffects)
    activeEffects = removeEffects(activeEffects, consumedEffects)
    if (consumedEffects.length > 0) effectsApplied.push(...consumedEffects)

    if (adjusted !== 0) {
      const adj = await dbRpc('game_adjust_oc', { p_user: userId, p_amount: adjusted, p_reason: 'event_penalty', p_ref: sessionId })
      if (adj?.ok) balance = Number(adj.balance)
    }
  }

  // ── Award OCC for correct answer ──────────────────────────────────────────────
  if (correct && underDailyCap) {
    const { adjusted, consumedEffects } = applyActiveEffects(QUIZ_OC_CORRECT, activeEffects)
    activeEffects = removeEffects(activeEffects, consumedEffects)
    if (consumedEffects.length > 0) effectsApplied.push(...consumedEffects)

    const adj = await dbRpc('game_adjust_oc', { p_user: userId, p_amount: adjusted, p_reason: 'quiz_correct', p_ref: questionId })
    if (adj?.ok) {
      ocAwarded = Number(adj.applied ?? 0)
      balance = Number(adj.balance)
    }
  }

  // ── Track quiz streak and apply knowledge leverage ────────────────────────────
  if (correct) {
    quizStreak += 1
  }

  if (quizStreak >= 3) {
    // 10% buy discount on next purchase
    const alreadyHasDiscount = activeEffects.some(e => e.kind === 'buy_discount')
    if (!alreadyHasDiscount) {
      activeEffects = [...activeEffects, { kind: 'buy_discount', pct: BUY_DISCOUNT_PCT, rounds_remaining: 1 }]
      effectsApplied.push('buy_discount')
    }

    // Bonus if player owns the current district
    if (currentZoneId && underDailyCap) {
      const props = await dbGet('game_properties', { zone_id: `eq.${currentZoneId}`, select: 'user_id' })
      if (props[0]?.user_id === userId) {
        const adj = await dbRpc('game_adjust_oc', { p_user: userId, p_amount: OWN_DISTRICT_BONUS, p_reason: 'own_district_bonus', p_ref: currentZoneId })
        if (adj?.ok) {
          balance = Number(adj.balance)
          effectsApplied.push('own_district_bonus')
        }
      }
    }
  }

  // ── Tick effects + persist board state ───────────────────────────────────────
  const ticked = tickEffects(activeEffects)

  await dbPatch('game_sessions', { session_id: `eq.${sessionId}` }, {
    board_state: {
      ...boardState,
      active_effects: ticked,
      pending_penalty: null,  // resolved
      quiz_streak: quizStreak,
    },
  })

  return NextResponse.json({
    correct,
    explanation,
    oc_awarded: ocAwarded,
    balance,
    quiz_streak: quizStreak,
    effects_applied: effectsApplied,
    active_effects: ticked,
  })
}
