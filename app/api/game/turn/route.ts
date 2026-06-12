import { NextRequest, NextResponse } from 'next/server'
import { dbGet, dbPatch, dbRpc, getUserId } from '@/lib/game/supabase'
import { getVerifiedUserId } from '@/lib/game/auth'
import {
  type BoardSpace,
  type CityCard,
  type ActiveEffect,
  rollDice,
  advance,
  drawCard,
  resolveSpace,
  resolveCardEffect,
  applyActiveEffects,
  removeEffects,
  tickEffects,
  parseEffects,
  LAP_BONUS_OC,
} from '@/lib/game/engine'
import { getZoneQuestionsPublic } from '@/lib/game/questions'
import { DAILY_OC_CAP } from '@/lib/game/types'

// POST /api/game/turn — server-authoritative turn: roll, move, resolve the landing.
// Phase 2: draws cards from game_cards DB table; applies/persists active effects.
// Phase 3: returns questions WITHOUT correct_index; grading moved to /api/game/answer.
//
// body: { session_id: string, position?: number }
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const sessionId = String(body.session_id ?? '')
  const isPractice = sessionId.startsWith('guest-')

  const userId = isPractice ? getUserId(req) : getVerifiedUserId(req)
  if (!isPractice && !userId) {
    return NextResponse.json({ error: 'Unauthorized — please re-enter the game from onlycrypto.io', code: 'reauth' }, { status: 401 })
  }

  const board = await dbGet<BoardSpace>('game_board', { order: 'position.asc' })
  if (board.length === 0) return NextResponse.json({ error: 'Board not configured' }, { status: 500 })

  // ── Load session state ───────────────────────────────────────────────────────
  let position = 0
  let turn = 0
  let session: any = null
  let activeEffects: ActiveEffect[] = []

  if (isPractice) {
    position = Number.isInteger(body.position) && body.position >= 0 && body.position < board.length ? body.position : 0
  } else {
    const sessions = await dbGet('game_sessions', { session_id: `eq.${sessionId}`, select: 'session_id,user_id,completed,board_state,mode' })
    session = sessions[0]
    if (!session || session.user_id !== userId) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }
    if (session.completed) {
      return NextResponse.json({ error: 'Session already ended' }, { status: 409 })
    }
    position = session.board_state?.current_position ?? 0
    turn = session.board_state?.turn ?? 0
    activeEffects = parseEffects(session.board_state?.active_effects)
  }

  // ── Check skip_turn effect ───────────────────────────────────────────────────
  const skipEffect = activeEffects.find(e => e.kind === 'skip_turn')
  if (skipEffect && !isPractice && session) {
    const ticked = tickEffects(activeEffects)
    await dbPatch('game_sessions', { session_id: `eq.${sessionId}` }, {
      board_state: {
        ...(session.board_state ?? {}),
        turn: turn + 1,
        active_effects: ticked,
      },
    })
    return NextResponse.json({
      skipped: true,
      reason: 'You fell for a scam — skip this turn while you recover.',
      position,
      turn: turn + 1,
      active_effects: ticked,
    })
  }

  // ── Roll + move ──────────────────────────────────────────────────────────────
  const dice = rollDice()
  const moved = advance(position, dice)
  let newPosition = moved.position
  const passedStart = moved.passedStart

  let space = board[newPosition]
  const action = resolveSpace(space)

  // ── Stats snapshot ───────────────────────────────────────────────────────────
  const statsRows = !isPractice && userId ? await dbGet('game_player_stats', { user_id: `eq.${userId}` }) : []
  const stats = statsRows[0]
  const today = new Date().toISOString().slice(0, 10)
  const todayOc = stats?.last_daily_reset === today ? Number(stats?.oc_earned_today ?? 0) : 0
  const underDailyCap = todayOc < DAILY_OC_CAP

  const result: any = {
    dice,
    passed_start: passedStart,
    lap_bonus: 0,
    space: null,
    card: null,
    rent: null,
    can_buy: false,
    owner: null,
    questions: null,
    balance: null,
    active_effects: activeEffects,
    pending_penalty: null,
  }

  // ── Lap bonus ────────────────────────────────────────────────────────────────
  if (passedStart && !isPractice && userId && underDailyCap) {
    const { adjusted, consumedEffects } = applyActiveEffects(LAP_BONUS_OC, activeEffects)
    activeEffects = removeEffects(activeEffects, consumedEffects)
    const adj = await dbRpc('game_adjust_oc', { p_user: userId, p_amount: adjusted, p_reason: 'lap_bonus', p_ref: sessionId })
    if (adj?.ok) {
      result.lap_bonus = Number(adj.applied ?? 0)
      result.balance = Number(adj.balance)
    }
  } else if (passedStart && isPractice) {
    result.lap_bonus = LAP_BONUS_OC
  }

  // ── Resolve landing ──────────────────────────────────────────────────────────
  if (action.kind === 'go_to_crash') {
    newPosition = action.move_to
    space = board[newPosition]
    result.moved_to_crash = true
  }

  if (action.kind === 'free_staking') {
    if (!isPractice && userId && underDailyCap) {
      const { adjusted, consumedEffects } = applyActiveEffects(action.bonus_oc, activeEffects)
      activeEffects = removeEffects(activeEffects, consumedEffects)
      const adj = await dbRpc('game_adjust_oc', { p_user: userId, p_amount: adjusted, p_reason: 'staking_bonus', p_ref: sessionId })
      if (adj?.ok) {
        result.staking_bonus = Number(adj.applied ?? 0)
        result.balance = Number(adj.balance)
      }
    } else if (isPractice) {
      result.staking_bonus = action.bonus_oc
    }
  }

  if (action.kind === 'card') {
    // Try DB first; fall back to hardcoded deck if table is empty/unreachable
    let card: CityCard | null = null
    const dbCard = await dbRpc<Record<string, unknown>>('game_draw_card', { p_deck: action.deck })
    if (dbCard && dbCard.id) {
      card = {
        id: String(dbCard.id),
        deck: action.deck,
        text: String(dbCard.text),
        delta_oc: Number(dbCard.delta_oc ?? 0),
        effect_type: (dbCard.effect_type as CityCard['effect_type']) ?? 'delta_oc',
        effect_data: (dbCard.effect_data as Record<string, unknown>) ?? {},
      }
    } else {
      const { drawCard: fallbackDraw } = await import('@/lib/game/engine')
      card = fallbackDraw(action.deck)
    }

    const cardEffect = resolveCardEffect(card)
    result.card = { deck: card.deck, text: card.text, delta_oc: card.delta_oc, effect_type: card.effect_type }

    if (!isPractice && userId) {
      if (card.delta_oc !== 0) {
        if (card.delta_oc < 0) {
          // Pending-then-maybe flow: store negative penalty in board_state.
          // /api/game/answer applies it (halved on correct answer) after the quiz.
          // If no quiz on this space, apply immediately.
          result.pending_penalty = card.delta_oc
          result.card.pending = true
        } else if (underDailyCap) {
          const { adjusted, consumedEffects } = applyActiveEffects(card.delta_oc, activeEffects)
          activeEffects = removeEffects(activeEffects, consumedEffects)
          const adj = await dbRpc('game_adjust_oc', { p_user: userId, p_amount: adjusted, p_reason: card.deck, p_ref: card.id })
          if (adj?.ok) {
            result.card.applied = Number(adj.applied ?? 0)
            result.balance = Number(adj.balance)
          }
        } else {
          result.card.applied = 0
        }
      }
    }

    // Add lasting effects to active stack
    if (cardEffect) {
      activeEffects = [...activeEffects, cardEffect]
      result.card.effect_applied = cardEffect.kind
    }
  }

  if (action.kind === 'district' && space.zone_id) {
    const props = await dbGet('game_properties', { zone_id: `eq.${space.zone_id}`, select: 'user_id' })
    const ownerId = props[0]?.user_id ?? null

    if (!ownerId) {
      result.can_buy = !isPractice
    } else if (ownerId === userId) {
      result.owner = { mine: true }
    } else {
      const users = await dbGet('users', { id: `eq.${ownerId}`, select: 'id,username,full_name' })
      result.owner = { mine: false, name: users[0]?.username || users[0]?.full_name || 'Player' }
      if (!isPractice && userId) {
        const rent = await dbRpc('game_pay_rent', {
          p_payer: userId,
          p_owner: ownerId,
          p_amount: Number(space.base_rent_oc ?? 0),
          p_zone_id: space.zone_id,
        })
        if (rent?.ok) {
          result.rent = { amount: Number(rent.paid ?? 0), to: result.owner.name }
          result.balance = Number(rent.balance)
        }
      }
    }

    // Phase 3: fetch questions from DB (strips correct_index server-side).
    // Falls back to local bank with correct_index stripped.
    const dbQuestions = await dbRpc<unknown[]>('game_pick_questions', { p_zone: space.zone_id, p_n: 3 })
    if (dbQuestions && Array.isArray(dbQuestions) && dbQuestions.length > 0) {
      result.questions = dbQuestions
    } else {
      result.questions = getZoneQuestionsPublic(space.zone_id, 3)
    }
  }

  // ── Tick effects + persist ───────────────────────────────────────────────────
  // Don't tick yet if there's a pending_penalty — the quiz resolves it first.
  // The answer route ticks after grading.
  const effectsToSave = result.pending_penalty !== null ? activeEffects : tickEffects(activeEffects)

  if (!isPractice && session) {
    await dbPatch('game_sessions', { session_id: `eq.${sessionId}` }, {
      board_state: {
        ...(session.board_state ?? {}),
        current_position: newPosition,
        current_zone_id: space.zone_id ?? null,
        turn: turn + 1,
        active_effects: effectsToSave,
        pending_penalty: result.pending_penalty ?? null,
        quiz_streak: 0,  // reset streak at start of each turn's quiz
      },
    })
  }

  if (result.balance === null && !isPractice && userId) {
    result.balance = Number(stats?.oc_balance ?? 0)
  }

  result.space = space
  result.position = newPosition
  result.turn = turn + 1
  result.active_effects = effectsToSave
  return NextResponse.json(result)
}
