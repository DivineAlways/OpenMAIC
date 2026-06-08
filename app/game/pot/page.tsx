'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface PotRoom {
  room_id: string
  room_level: 'rookie' | 'pro' | 'whale'
  entry_fee_oc: number
  pot_total: number
  player_count: number
  max_players: number
  min_players: number
  status: string
  entered: boolean
}

const LEVEL_CONFIG = {
  rookie: { label: 'Rookie Room', emoji: '🐣', color: 'from-slate-600 to-slate-700', border: 'border-slate-500/40', entry: 2 },
  pro:    { label: 'Pro Room',    emoji: '⚡', color: 'from-blue-600 to-indigo-700',  border: 'border-blue-500/40',  entry: 10 },
  whale:  { label: 'Whale Room',  emoji: '🐋', color: 'from-purple-600 to-violet-700',border: 'border-purple-500/40',entry: 50 },
}

export default function PotRoomPage() {
  const [rooms, setRooms] = useState<PotRoom[]>([])
  const [balance, setBalance] = useState<number | null>(null)
  const [level, setLevel] = useState(1)
  const [loading, setLoading] = useState(true)
  const [entering, setEntering] = useState<string | null>(null)
  const [message, setMessage] = useState<{ text: string; type: 'ok' | 'error' } | null>(null)

  async function load() {
    const [potRes, statsRes] = await Promise.all([
      fetch('/api/game/pot'),
      fetch('/api/game/stats'),
    ])
    const [potData, statsData] = await Promise.all([potRes.json(), statsRes.json()])
    if (potData.rooms) setRooms(potData.rooms)
    if (statsData.stats) {
      setBalance(statsData.stats.oc_balance)
      setLevel(statsData.stats.level)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function enterRoom(roomLevel: 'rookie' | 'pro' | 'whale') {
    setEntering(roomLevel)
    setMessage(null)
    const res = await fetch('/api/game/pot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ room_level: roomLevel }),
    })
    const data = await res.json()
    setEntering(null)
    if (!res.ok) {
      setMessage({ text: data.error ?? 'Could not enter room', type: 'error' })
      return
    }
    setMessage({ text: `Entered! Waiting for other players...`, type: 'ok' })
    await load()
  }

  const roomsByLevel = (level: string) => rooms.filter(r => r.room_level === level)

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="border-b border-white/10 px-6 py-3 flex items-center justify-between text-sm">
        <Link href="/game" className="text-white/40 hover:text-white transition-colors">← Hub</Link>
        <span className="text-amber-400 font-medium">{balance !== null ? `${Number(balance).toFixed(1)} OC` : '—'}</span>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="text-center mb-10">
          <div className="text-5xl mb-3">💰</div>
          <h1 className="text-3xl font-bold mb-2">Pot Room</h1>
          <p className="text-white/50">Answer 10 questions. Highest score wins the entire pot.</p>
        </div>

        {message && (
          <div className={`rounded-xl px-5 py-4 mb-6 text-sm font-medium ${
            message.type === 'ok' ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                                  : 'bg-red-500/10 border border-red-500/30 text-red-400'
          }`}>
            {message.text}
          </div>
        )}

        {loading ? (
          <div className="text-center text-white/30 py-20">Loading rooms...</div>
        ) : (
          <div className="space-y-6">
            {(Object.keys(LEVEL_CONFIG) as ('rookie' | 'pro' | 'whale')[]).map(lvl => {
              const cfg = LEVEL_CONFIG[lvl]
              const lvlRooms = roomsByLevel(lvl)
              const activeRoom = lvlRooms[0]
              const playerCount = activeRoom?.player_count ?? 0
              const pot = activeRoom?.pot_total ?? 0
              const entered = activeRoom?.entered ?? false

              return (
                <div key={lvl} className={`bg-white/5 border ${cfg.border} rounded-2xl p-6`}>
                  <div className="flex items-start justify-between mb-5">
                    <div>
                      <div className="text-2xl mb-1">{cfg.emoji}</div>
                      <h2 className="text-lg font-bold">{cfg.label}</h2>
                      <p className="text-white/40 text-sm">{cfg.entry} OC entry · Winner takes all · 10 questions</p>
                    </div>
                    {pot > 0 && (
                      <div className="text-right">
                        <div className="text-white/40 text-xs">Current Pot</div>
                        <div className="text-amber-400 font-bold text-xl">{Number(pot).toFixed(0)} OC</div>
                      </div>
                    )}
                  </div>

                  {/* Player count bar */}
                  <div className="mb-5">
                    <div className="flex justify-between text-xs text-white/40 mb-1">
                      <span>{playerCount} / 20 players</span>
                      <span>Starts when {activeRoom?.min_players ?? 3}+ join (max 20)</span>
                    </div>
                    <div className="bg-white/10 rounded-full h-1.5">
                      <div
                        className="bg-gradient-to-r from-amber-500 to-orange-500 h-1.5 rounded-full transition-all"
                        style={{ width: `${(playerCount / 20) * 100}%` }}
                      />
                    </div>
                  </div>

                  {entered ? (
                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-3 text-green-400 text-sm text-center">
                      ✓ You're in — waiting for the room to fill
                    </div>
                  ) : (
                    <button
                      onClick={() => enterRoom(lvl)}
                      disabled={entering === lvl}
                      className="w-full bg-white/10 hover:bg-white/15 disabled:opacity-40 text-white font-semibold py-3 rounded-xl transition-colors"
                    >
                      {entering === lvl ? 'Entering...' : `Enter for ${cfg.entry} OC`}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <div className="mt-10 bg-white/5 border border-white/10 rounded-xl p-5 text-sm text-white/40">
          <p className="font-semibold text-white/60 mb-2">Rules</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>Rookie Room (2 OC): open to all levels</li>
            <li>Pro Room (10 OC): Level 3+ required</li>
            <li>Whale Room (50 OC): Level 6+ required</li>
            <li>You can only enter rooms within 2 levels of your player level</li>
            <li>Game starts automatically when the room is full or after 10 minutes with 3+ players</li>
            <li>Disconnecting after the room starts forfeits your entry fee</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
