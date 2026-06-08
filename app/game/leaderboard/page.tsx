'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { LEVEL_NAMES } from '@/lib/game/types'

interface LeaderboardEntry {
  rank: number
  user_id: string
  display_name: string
  total_xp: number
  level: number
  oc_earned_week: number
  tournament_wins: number
  duel_wins: number
  pot_wins: number
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [type, setType] = useState<'xp' | 'weekly'>('xp')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/game/leaderboard?type=${type}`)
      .then(r => r.json())
      .then(d => { if (d.leaderboard) setLeaderboard(d.leaderboard) })
      .finally(() => setLoading(false))
  }, [type])

  const medals = ['🥇', '🥈', '🥉']

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="border-b border-white/10 px-6 py-3 flex items-center justify-between text-sm">
        <Link href="/game" className="text-white/40 hover:text-white transition-colors">← Hub</Link>
        <h1 className="font-bold">Leaderboard</h1>
        <div />
      </div>

      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🏆</div>
          <p className="text-white/50 text-sm">Top players across all game modes</p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-white/5 rounded-xl p-1 mb-8">
          {[
            { key: 'xp', label: 'All-Time XP' },
            { key: 'weekly', label: 'This Week OC' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setType(t.key as any)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                type === t.key ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white/70'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center text-white/30 py-20">Loading...</div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center text-white/30 py-20">
            <p className="text-4xl mb-3">🌟</p>
            <p>No players yet — be the first!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {leaderboard.map(entry => (
              <div
                key={entry.user_id}
                className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${
                  entry.rank <= 3
                    ? 'bg-amber-500/5 border-amber-500/20'
                    : 'bg-white/3 border-white/8 hover:bg-white/5'
                }`}
              >
                <div className="w-8 text-center text-lg font-bold">
                  {entry.rank <= 3 ? medals[entry.rank - 1] : entry.rank}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{entry.display_name}</div>
                  <div className="text-white/40 text-xs">
                    Level {entry.level} · {LEVEL_NAMES[entry.level] ?? 'OG'}
                  </div>
                </div>
                <div className="text-right">
                  {type === 'xp' ? (
                    <>
                      <div className="font-bold text-blue-400">{entry.total_xp.toLocaleString()} XP</div>
                      <div className="text-white/30 text-xs">{entry.oc_earned_week.toFixed(1)} OC this week</div>
                    </>
                  ) : (
                    <>
                      <div className="font-bold text-amber-400">{entry.oc_earned_week.toFixed(1)} OC</div>
                      <div className="text-white/30 text-xs">{entry.total_xp.toLocaleString()} XP total</div>
                    </>
                  )}
                </div>
                <div className="flex gap-2 text-xs text-white/30 ml-2">
                  {entry.tournament_wins > 0 && <span title="Tournament wins">🏆{entry.tournament_wins}</span>}
                  {entry.duel_wins > 0 && <span title="Duel wins">⚔️{entry.duel_wins}</span>}
                  {entry.pot_wins > 0 && <span title="Pot wins">💰{entry.pot_wins}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
