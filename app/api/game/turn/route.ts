import { NextRequest, NextResponse } from 'next/server'
import { dbGet, dbPatch, dbRpc, getUserId } from '@/lib/game/supabase'
import { getVerifiedUserId } from '@/lib/game/auth'
import {
  type BoardSpace,
  rollDice,
  advance,
  drawCard,
  resolveSpace,
  LAP_BONUS_OC,
} from '@/lib/game/engine'
import { getZoneQuestions } from '@/lib/game/questions'
import { DAILY_OC_CAP } from '@/lib/game/types'

// POST /api/game/turn — server-authoritative turn: roll, move, resolve the landing.
// The client never decides dice, cards, rent, or OCC amounts.
//
// body: { session_id: string, position?: number }
//   - standard sessions: position comes from game_sessions.board_state (DB-trusted)
//   - practice/guest sessions ('guest-*'): stateless — client supplies position,
//     nothing is persisted and no OCC moves.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const sessionId = String(body.session_id ?? '')
  const isPractice = sessionId.startsWith('guest-')

  // OCC moves require the signed cookie; practice mode is lenient (no OCC at stake).
  const userId = isPractice ? getUserId(req) : getVerifiedUserId(req)
  if (!isPractice && !userId) {
    return NextResponse.json({ error: 'Unauthorized — please re-enter the game from onlycrypto.io', code: 'reauth' }, { status: 401 })
  }

  const board = await dbGet<BoardSpace>('game_board', { order: 'position.asc' })
  if (board.length === 0) return NextResponse.json({ error: 'Board not configured' }, { status: 500 })

  // ── Load position ────────────────────────────────────────────────────────────
  let position = 0
  let turn = 0
  let session: any = null
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
  }

  // ── Roll + move (server-side) ────────────────────────────────────────────────
  const dice = rollDice()
  const moved = advance(position, dice)
  let newPosition = moved.position
  const passedStart = moved.passedStart

  let space = board[newPosition]
  const action = resolveSpace(space)

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
  }

  // ── Stats snapshot (cap checks + balance reporting) ─────────────────────────
  const statsRows = !isPractice && userId ? await dbGet('game_player_stats', { user_id: `eq.${userId}` }) : []
  const stats = statsRows[0]
  const today = new Date().toISOString().slice(0, 10)
  const todayOc = stats?.last_daily_reset === today ? Number(stats?.oc_earned_today ?? 0) : 0
  const underDailyCap = todayOc < DAILY_OC_CAP

  // ── Lap bonus ────────────────────────────────────────────────────────────────
  if (passedStart && !isPractice && userId && underDailyCap) {
    const adj = await dbRpc('game_adjust_oc', { p_user: userId, p_amount: LAP_BONUS_OC, p_reason: 'lap_bonus', p_ref: sessionId })
    if (adj?.ok) {
      result.lap_bonus = Number(adj.applied ?? 0)
      result.balance = Number(adj.balance)
    }
  } else if (passedStart && isPractice) {
    result.lap_bonus = LAP_BONUS_OC // cosmetic in practice
  }

  // ── Resolve landing ──────────────────────────────────────────────────────────
  if (action.kind === 'go_to_crash') {
    newPosition = action.move_to
    space = board[newPosition]
    result.moved_to_crash = true
  }

  if (action.kind === 'free_staking') {
    if (!isPractice && userId && underDailyCap) {
      const adj = await dbRpc('game_adjust_oc', { p_user: userId, p_amount: action.bonus_oc, p_reason: 'staking_bonus', p_ref: sessionId })
      if (adj?.ok) {
        result.staking_bonus = Number(adj.applied ?? 0)
        result.balance = Number(adj.balance)
      }
    } else if (isPractice) {
      result.staking_bonus = action.bonus_oc
    }
  }

  if (action.kind === 'card') {
    const card = drawCard(action.deck)
    result.card = { deck: card.deck, text: card.text, delta_oc: card.delta_oc }
    if (!isPractice && userId) {
      // negative cards always apply; positive ones respect the daily cap
      if (card.delta_oc < 0 || underDailyCap) {
        const adj = await dbRpc('game_adjust_oc', { p_user: userId, p_amount: card.delta_oc, p_reason: card.deck, p_ref: card.id })
        if (adj?.ok) {
          result.card.applied = Number(adj.applied ?? 0)
          result.balance = Number(adj.balance)
        }
      } else {
        result.card.applied = 0
      }
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

    // Knowledge challenge on every district landing (grading client-side this phase)
    result.questions = getZoneQuestions(space.zone_id, 3)
  }

  // ── Persist + report ─────────────────────────────────────────────────────────
  if (!isPractice && session) {
    await dbPatch('game_sessions', { session_id: `eq.${sessionId}` }, {
      board_state: {
        ...(session.board_state ?? {}),
        current_position: newPosition,
        turn: turn + 1,
      },
    })
  }

  if (result.balance === null && !isPractice && userId) {
    result.balance = Number(stats?.oc_balance ?? 0)
  }

  result.space = space
  result.position = newPosition
  result.turn = turn + 1
  return NextResponse.json(result)
}
