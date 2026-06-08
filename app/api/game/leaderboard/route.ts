import { NextRequest, NextResponse } from 'next/server'
import { getUserId } from '@/lib/game/supabase'
import { dbGet } from '@/lib/game/supabase'

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get('type') ?? 'xp'

  const orderField = type === 'weekly' ? 'oc_earned_week' : 'total_xp'

  const rows = await dbGet('game_player_stats', {
    'order': `${orderField}.desc`,
    'limit': '20',
    'select': 'user_id,total_xp,level,oc_earned_week,tournament_wins,duel_wins,pot_wins',
  })

  // Get usernames from users table
  const userIds = rows.map((r: any) => r.user_id)
  let usernames: Record<string, string> = {}

  if (userIds.length > 0) {
    const users = await dbGet('users', {
      'id': `in.(${userIds.join(',')})`,
      'select': 'id,full_name,username',
    })
    for (const u of users) {
      usernames[u.id] = u.username || u.full_name || 'Player'
    }
  }

  const leaderboard = rows.map((r: any, i: number) => ({
    rank: i + 1,
    user_id: r.user_id,
    display_name: usernames[r.user_id] ?? 'Player',
    total_xp: r.total_xp,
    level: r.level,
    oc_earned_week: r.oc_earned_week,
    tournament_wins: r.tournament_wins,
    duel_wins: r.duel_wins,
    pot_wins: r.pot_wins,
  }))

  return NextResponse.json({ leaderboard, type })
}
