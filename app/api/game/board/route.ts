import { NextRequest, NextResponse } from 'next/server'
import { dbGet, getUserId } from '@/lib/game/supabase'
import type { BoardSpace } from '@/lib/game/engine'

// GET /api/game/board — board layout + ownership + caller's wallet snapshot.
// Read-only: lenient auth (legacy cookies fine); guests see the board unowned-style.
export async function GET(req: NextRequest) {
  const userId = getUserId(req)

  const [board, properties, statsRows] = await Promise.all([
    dbGet<BoardSpace>('game_board', { order: 'position.asc' }),
    dbGet('game_properties', { select: 'zone_id,user_id,price_paid_oc,purchased_at' }),
    userId ? dbGet('game_player_stats', { user_id: `eq.${userId}`, select: 'oc_balance,total_xp,level' }) : Promise.resolve([]),
  ])

  // Display names for current owners
  const ownerIds = [...new Set(properties.map((p: any) => p.user_id))]
  let names: Record<string, string> = {}
  if (ownerIds.length > 0) {
    const users = await dbGet('users', { id: `in.(${ownerIds.join(',')})`, select: 'id,username,full_name' })
    for (const u of users) names[u.id] = u.username || u.full_name || 'Player'
  }

  const owners: Record<string, { user_id: string; name: string; mine: boolean }> = {}
  for (const p of properties as any[]) {
    owners[p.zone_id] = {
      user_id: p.user_id,
      name: names[p.user_id] ?? 'Player',
      mine: p.user_id === userId,
    }
  }

  const stats = statsRows[0]
  return NextResponse.json({
    board,
    owners,
    me: userId
      ? {
          user_id: userId,
          oc_balance: Number(stats?.oc_balance ?? 0),
          level: stats?.level ?? 1,
          properties: (properties as any[]).filter(p => p.user_id === userId).map(p => p.zone_id),
        }
      : null,
  })
}
