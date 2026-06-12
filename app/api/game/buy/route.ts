import { NextRequest, NextResponse } from 'next/server'
import { dbGet, dbRpc } from '@/lib/game/supabase'
import { getVerifiedUserId } from '@/lib/game/auth'
import type { BoardSpace } from '@/lib/game/engine'

// POST /api/game/buy — purchase the district the player is standing on.
// Requires the HMAC-signed cookie; all validation + the atomic debit/ownership
// write happen in the game_buy_district Postgres function.
// body: { session_id: string, zone_id: string }
export async function POST(req: NextRequest) {
  const userId = getVerifiedUserId(req)
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized — please re-enter the game from onlycrypto.io', code: 'reauth' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const sessionId = String(body.session_id ?? '')
  const zoneId = String(body.zone_id ?? '')
  if (!sessionId || !zoneId || sessionId.startsWith('guest-')) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  // Player must be standing on this district in their own active session
  const [sessions, spaces] = await Promise.all([
    dbGet('game_sessions', { session_id: `eq.${sessionId}`, select: 'session_id,user_id,completed,board_state' }),
    dbGet<BoardSpace>('game_board', { zone_id: `eq.${zoneId}` }),
  ])
  const session = sessions[0]
  const space = spaces[0]
  if (!session || session.user_id !== userId || session.completed) {
    return NextResponse.json({ error: 'No active session' }, { status: 404 })
  }
  if (!space || space.space_type !== 'district') {
    return NextResponse.json({ error: 'Not a purchasable district' }, { status: 400 })
  }
  if ((session.board_state?.current_position ?? -1) !== space.position) {
    return NextResponse.json({ error: 'You must land on a district to buy it', code: 'not_here' }, { status: 409 })
  }

  const res = await dbRpc('game_buy_district', { p_user_id: userId, p_zone_id: zoneId })
  if (!res) {
    return NextResponse.json({ error: 'Purchase failed — try again' }, { status: 500 })
  }
  if (!res.ok) {
    const status = res.error === 'insufficient_balance' ? 402 : res.error === 'already_owned' ? 409 : 400
    return NextResponse.json({ error: res.error, ...res }, { status })
  }

  return NextResponse.json(res)
}
