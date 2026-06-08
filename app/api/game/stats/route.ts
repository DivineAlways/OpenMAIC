import { NextRequest, NextResponse } from 'next/server'
import { dbGet, dbUpsert } from '@/lib/game/supabase'
import { getLevel, LEVEL_THRESHOLDS, DAILY_OC_CAP } from '@/lib/game/types'

function getUserId(req: NextRequest): string | null {
  const cookie = req.cookies.get('openmaic_access')
  if (!cookie?.value?.startsWith('sso.')) return null
  const parts = cookie.value.split('.')
  return parts[1] ?? null
}

export async function GET(req: NextRequest) {
  const userId = getUserId(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rows = await dbGet('game_player_stats', { 'user_id': `eq.${userId}` })

  if (rows.length === 0) {
    // Auto-create stats row for new players
    const newStats = await dbUpsert('game_player_stats', {
      user_id: userId,
      total_xp: 0,
      level: 1,
      oc_balance: 0,
      oc_earned_today: 0,
      oc_earned_week: 0,
    }, 'user_id')
    return NextResponse.json({ stats: newStats })
  }

  const stats = rows[0]
  // Reset daily cap if needed
  const today = new Date().toISOString().slice(0, 10)
  if (stats.last_daily_reset !== today) {
    stats.oc_earned_today = 0
    await dbUpsert('game_player_stats', { user_id: userId, oc_earned_today: 0, last_daily_reset: today }, 'user_id')
  }

  const level = getLevel(stats.total_xp)
  const nextLevelXp = LEVEL_THRESHOLDS[level] ?? null
  const currentLevelXp = LEVEL_THRESHOLDS[level - 1] ?? 0
  const progressPct = nextLevelXp
    ? Math.round(((stats.total_xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100)
    : 100

  return NextResponse.json({
    stats: { ...stats, level },
    progression: { next_level_xp: nextLevelXp, progress_pct: progressPct },
    daily_oc_remaining: Math.max(0, DAILY_OC_CAP - (stats.oc_earned_today ?? 0)),
  })
}
