'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { LEVEL_NAMES } from '@/lib/game/types'

interface PlayerStats {
  total_xp: number
  level: number
  oc_balance: number
  tournament_wins: number
  duel_wins: number
  pot_wins: number
}

const MODES = [
  {
    id: 'standard',
    href: '/game/play',
    label: 'Standard',
    emoji: '🏙️',
    tagline: 'Learn through all 16 zones',
    detail: 'Solo play · Up to 25 OC per session · XP + badges',
    color: 'from-blue-600 to-indigo-700',
    border: 'border-blue-500/40',
    phase: 'Live',
    phaseColor: 'bg-green-500/20 text-green-400',
  },
  {
    id: 'practice',
    href: '/game/play?mode=practice',
    label: 'Practice',
    emoji: '📚',
    tagline: 'Learn without risking OC',
    detail: 'Free · No OC rewards · All zones accessible',
    color: 'from-slate-600 to-slate-700',
    border: 'border-slate-500/40',
    phase: 'Live',
    phaseColor: 'bg-green-500/20 text-green-400',
  },
  {
    id: 'tournament',
    href: '/game/tournament',
    label: 'Tournament',
    emoji: '🏆',
    tagline: 'Compete for the prize pool',
    detail: '5 OC entry · Top 3 split · Level 4+ required',
    color: 'from-amber-600 to-orange-700',
    border: 'border-amber-500/40',
    phase: 'Phase 2',
    phaseColor: 'bg-amber-500/20 text-amber-400',
  },
  {
    id: 'duel',
    href: '/game/duel',
    label: 'Head-to-Head Duel',
    emoji: '⚔️',
    tagline: '1v1 — winner takes all',
    detail: '2–50 OC wager · 5 questions · Fastest time breaks ties',
    color: 'from-red-600 to-rose-700',
    border: 'border-red-500/40',
    phase: 'Phase 3',
    phaseColor: 'bg-red-500/20 text-red-400',
  },
  {
    id: 'roulette',
    href: '/game/roulette',
    label: 'Crypto Roulette',
    emoji: '🎰',
    tagline: 'Predict real crypto history',
    detail: '1–20 OC wager · 1.9x payout · 5 rounds · Real events',
    color: 'from-purple-600 to-violet-700',
    border: 'border-purple-500/40',
    phase: 'Phase 3',
    phaseColor: 'bg-purple-500/20 text-purple-400',
  },
  {
    id: 'pot',
    href: '/game/pot',
    label: 'Pot Room',
    emoji: '💰',
    tagline: 'Winner takes the entire pot',
    detail: 'Rookie 2 OC · Pro 10 OC · Whale 50 OC · Up to 20 players',
    color: 'from-emerald-600 to-teal-700',
    border: 'border-emerald-500/40',
    phase: 'Phase 4',
    phaseColor: 'bg-emerald-500/20 text-emerald-400',
  },
]

export default function GameHome() {
  const [stats, setStats] = useState<PlayerStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/game/stats')
      .then(r => r.json())
      .then(d => { if (d.stats) setStats(d.stats) })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-white/50 hover:text-white text-sm transition-colors">
          ← Academy
        </Link>
        <Link href="/game/leaderboard" className="text-white/50 hover:text-white text-sm transition-colors">
          Leaderboard →
        </Link>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Hero */}
        <div className="text-center mb-14">
          <div className="text-6xl mb-4">🏙️</div>
          <h1 className="text-4xl font-bold mb-3">OnlyCrypto City</h1>
          <p className="text-white/60 text-lg max-w-xl mx-auto">
            Learn blockchain and trading through real challenges. Earn OC coin. Compete with members worldwide.
          </p>
        </div>

        {/* Player Stats Bar */}
        {!loading && stats && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-5 mb-10 flex flex-wrap gap-6 justify-between items-center">
            <div>
              <div className="text-white/40 text-xs uppercase tracking-wider mb-1">Level</div>
              <div className="font-bold text-lg">
                {stats.level} <span className="text-white/50 font-normal text-sm">— {LEVEL_NAMES[stats.level] ?? 'OG'}</span>
              </div>
            </div>
            <div>
              <div className="text-white/40 text-xs uppercase tracking-wider mb-1">Total XP</div>
              <div className="font-bold text-lg">{stats.total_xp.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-white/40 text-xs uppercase tracking-wider mb-1">OC Balance</div>
              <div className="font-bold text-lg text-amber-400">{Number(stats.oc_balance).toFixed(1)} OC</div>
            </div>
            <div className="flex gap-4 text-sm text-white/50">
              <span>🏆 {stats.tournament_wins} tournament wins</span>
              <span>⚔️ {stats.duel_wins} duel wins</span>
              <span>💰 {stats.pot_wins} pot wins</span>
            </div>
          </div>
        )}

        {!loading && !stats && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-5 mb-10 text-center text-amber-300">
            Sign in through OnlyCrypto to track your progress and earn OC rewards.
          </div>
        )}

        {/* Mode Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {MODES.map(mode => (
            <Link
              key={mode.id}
              href={mode.href}
              className={`group relative bg-white/5 border ${mode.border} rounded-xl p-6 hover:bg-white/8 transition-all hover:scale-[1.02] hover:shadow-lg`}
            >
              <div className="flex items-start justify-between mb-4">
                <span className="text-3xl">{mode.emoji}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${mode.phaseColor}`}>
                  {mode.phase}
                </span>
              </div>
              <h2 className="font-bold text-lg mb-1">{mode.label}</h2>
              <p className="text-white/70 text-sm mb-3">{mode.tagline}</p>
              <p className="text-white/40 text-xs">{mode.detail}</p>
              <div className={`absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r ${mode.color} rounded-b-xl opacity-0 group-hover:opacity-100 transition-opacity`} />
            </Link>
          ))}
        </div>

        {/* How It Works */}
        <div className="mt-16 border-t border-white/10 pt-12">
          <h2 className="text-xl font-bold text-center mb-8 text-white/80">How It Works</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { step: '1', label: 'Choose a mode', emoji: '🎮' },
              { step: '2', label: 'Answer crypto challenges', emoji: '🧠' },
              { step: '3', label: 'Earn XP and OC coin', emoji: '💰' },
              { step: '4', label: 'Level up and compete', emoji: '🏆' },
            ].map(s => (
              <div key={s.step}>
                <div className="text-3xl mb-2">{s.emoji}</div>
                <div className="text-white/40 text-xs mb-1">Step {s.step}</div>
                <div className="text-sm text-white/80">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
