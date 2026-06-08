'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

interface Tournament {
  tournament_id: string
  name: string
  entry_fee_oc: number
  max_players: number
  start_at: string
  end_at: string
  status: 'open' | 'active' | 'finished' | 'cancelled'
  pot_total: number
  entered: boolean
}

interface MyEntry {
  tournament_id: string
  score: number
  rank: number | null
  payout_oc: number
  paid_out: boolean
}

type Phase = 'loading' | 'lobby' | 'playing' | 'submitted' | 'error'

const SAMPLE_QUESTIONS = [
  { q: 'What makes a blockchain immutable?', options: ['Central servers delete old data', 'Each block contains the hash of the previous block', 'Governments regulate changes', 'Miners vote on changes'], correct: 1, exp: 'Each block contains the cryptographic hash of the previous block — changing any block invalidates all blocks after it.' },
  { q: 'How fast does XRP Ledger typically settle a transaction?', options: ['10 minutes', '1 hour', '3–5 seconds', '30 seconds'], correct: 2, exp: 'XRPL settles in 3–5 seconds — one of the fastest settlement times of any major blockchain.' },
  { q: 'What does FOMO stand for in trading?', options: ['Fear Of Market Operations', 'Fear Of Missing Out', 'First On Market Offer', 'Future Of Money Operations'], correct: 1, exp: 'FOMO (Fear Of Missing Out) causes traders to buy at peaks when everyone else is hyped.' },
  { q: 'What is a stop-loss order?', options: ['An order to buy more when price drops', 'An automatic sell at a set price to limit losses', 'A fee charged by exchanges', 'A limit order at your profit target'], correct: 1, exp: 'A stop-loss automatically closes your position at a set price — limiting your maximum loss.' },
  { q: 'What is impermanent loss?', options: ['A permanent loss when a DeFi project is hacked', 'Temporary loss for liquidity providers when asset prices diverge', 'A trading loss you cannot recover', 'Fees paid to DeFi protocols'], correct: 1, exp: 'Impermanent loss occurs when providing liquidity and the price of your deposited assets changes relative to each other.' },
  { q: 'What is a seed phrase?', options: ['A password for your exchange account', '12–24 words that can restore your entire wallet', 'A transaction confirmation code', 'A security question answer'], correct: 1, exp: 'A seed phrase is generated when you create a wallet. Anyone with these words controls your crypto.' },
  { q: 'What is the maximum supply of Bitcoin?', options: ['Unlimited', '100 million', '21 million', '1 billion'], correct: 2, exp: 'Bitcoin has a hard cap of 21 million coins — this scarcity is a core part of its value proposition.' },
  { q: 'What does a bearish engulfing candlestick signal?', options: ['Continuation of uptrend', 'Potential reversal from up to down', 'A sideways market ahead', 'Breakout above resistance'], correct: 1, exp: 'A bearish engulfing pattern suggests sellers have overtaken buyers — a potential reversal downward.' },
  { q: 'What is yield farming?', options: ['Mining crypto with solar panels', 'Earning returns by providing liquidity in DeFi', 'Growing a portfolio of farming tokens', 'A type of NFT project'], correct: 1, exp: 'Yield farming involves deploying crypto into DeFi protocols to earn returns through lending or liquidity provision.' },
  { q: 'What is a rug pull?', options: ['A yield farming strategy', 'Developers abandoning a project and taking investor funds', 'A carpet cleaning service accepting crypto', 'When price increases 100x'], correct: 1, exp: 'A rug pull is when DeFi developers suddenly withdraw all funds and disappear — leaving investors with worthless tokens.' },
]

export default function TournamentPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [myEntries, setMyEntries] = useState<MyEntry[]>([])
  const [balance, setBalance] = useState<number | null>(null)
  const [level, setLevel] = useState(1)
  const [loading, setLoading] = useState(true)
  const [phase, setPhase] = useState<Phase>('loading')
  const [activeTournament, setActiveTournament] = useState<Tournament | null>(null)
  const [entering, setEntering] = useState<string | null>(null)
  const [message, setMessage] = useState<{ text: string; type: 'ok' | 'error' } | null>(null)

  // Playing state
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [selected, setSelected] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [startTime, setStartTime] = useState(0)
  const [totalTimeMs, setTotalTimeMs] = useState(0)
  const [score, setScore] = useState(0)

  const load = useCallback(async () => {
    const [tRes, sRes] = await Promise.all([
      fetch('/api/game/tournament'),
      fetch('/api/game/stats'),
    ])
    const [tData, sData] = await Promise.all([tRes.json(), sRes.json()])
    if (tData.tournaments) setTournaments(tData.tournaments)
    if (tData.my_entries) setMyEntries(tData.my_entries)
    if (sData.stats) { setBalance(sData.stats.oc_balance); setLevel(sData.stats.level) }
    setLoading(false)
    setPhase('lobby')
  }, [])

  useEffect(() => { load() }, [load])

  async function enterTournament(t: Tournament) {
    setEntering(t.tournament_id)
    setMessage(null)
    const res = await fetch('/api/game/tournament', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tournament_id: t.tournament_id }),
    })
    const data = await res.json()
    setEntering(null)
    if (!res.ok) { setMessage({ text: data.error ?? 'Could not enter', type: 'error' }); return }
    setMessage({ text: `Entered! Entry fee: ${t.entry_fee_oc} OC deducted.`, type: 'ok' })
    setActiveTournament(t)
    await load()
  }

  function startPlaying(t: Tournament) {
    setActiveTournament(t)
    setCurrentQ(0)
    setAnswers([])
    setSelected(null)
    setRevealed(false)
    setScore(0)
    setStartTime(Date.now())
    setTotalTimeMs(0)
    setPhase('playing')
  }

  function selectAnswer(idx: number) {
    if (revealed) return
    setSelected(idx)
    setRevealed(true)
    if (idx === SAMPLE_QUESTIONS[currentQ].correct) setScore(s => s + 1)
  }

  async function nextQuestion() {
    const newAnswers = [...answers, selected ?? -1]
    setAnswers(newAnswers)

    if (currentQ >= SAMPLE_QUESTIONS.length - 1) {
      // Done — submit score
      const elapsed = Date.now() - startTime
      setTotalTimeMs(elapsed)
      await fetch('/api/game/tournament', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tournament_id: activeTournament?.tournament_id,
          score,
          answer_time_ms: elapsed,
        }),
      })
      setPhase('submitted')
      return
    }
    setCurrentQ(q => q + 1)
    setSelected(null)
    setRevealed(false)
  }

  // ── LOBBY ───────────────────────────────────────────────────────────────────
  if (phase === 'loading' || loading) {
    return <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center"><div className="text-white/40 animate-pulse text-lg">Loading tournaments...</div></div>
  }

  if (phase === 'submitted') {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <div className="text-6xl mb-4">🏆</div>
          <h2 className="text-2xl font-bold mb-2">Score Submitted!</h2>
          <p className="text-white/50 mb-8">You scored <span className="text-white font-bold">{score}/{SAMPLE_QUESTIONS.length}</span> in {(totalTimeMs / 1000).toFixed(1)}s</p>
          <div className="bg-white/5 border border-white/10 rounded-xl p-5 mb-8 text-sm text-white/60 text-left">
            <p>Your score is on the leaderboard. Prize payouts are distributed when the tournament ends. Check back then to see your rank and payout.</p>
          </div>
          <div className="flex gap-3 justify-center">
            <button onClick={() => { setPhase('lobby'); load() }} className="bg-amber-600 hover:bg-amber-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors">Back to Tournaments</button>
            <Link href="/game" className="bg-white/10 hover:bg-white/15 text-white font-semibold px-6 py-3 rounded-xl transition-colors">Game Hub</Link>
          </div>
        </div>
      </div>
    )
  }

  if (phase === 'playing') {
    const q = SAMPLE_QUESTIONS[currentQ]
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white">
        <div className="border-b border-white/10 px-6 py-3 flex items-center justify-between text-sm">
          <span className="text-amber-400 font-medium">🏆 {activeTournament?.name}</span>
          <span className="text-white/40">Question {currentQ + 1} / {SAMPLE_QUESTIONS.length}</span>
          <span className="text-white/40">Score: {score}</span>
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-white/10">
          <div className="h-1 bg-amber-500 transition-all" style={{ width: `${((currentQ) / SAMPLE_QUESTIONS.length) * 100}%` }} />
        </div>
        <div className="max-w-2xl mx-auto px-6 py-10">
          <h2 className="text-xl font-semibold mb-8 leading-relaxed">{q.q}</h2>
          <div className="space-y-3 mb-8">
            {q.options.map((opt, i) => {
              let cls = 'border-white/10 bg-white/5 text-white/70 hover:border-white/30 hover:bg-white/8'
              if (revealed) {
                if (i === q.correct) cls = 'border-green-500 bg-green-500/20 text-white'
                else if (i === selected) cls = 'border-red-500 bg-red-500/20 text-white'
                else cls = 'border-white/5 bg-white/3 text-white/30'
              } else if (selected === i) cls = 'border-amber-500 bg-amber-500/20 text-white'
              return (
                <button key={i} onClick={() => selectAnswer(i)} disabled={revealed}
                  className={`w-full text-left px-5 py-4 rounded-xl border transition-all ${cls}`}>
                  <span className="text-white/30 mr-3">{['A','B','C','D'][i]}.</span>{opt}
                </button>
              )
            })}
          </div>
          {revealed && (
            <div className={`rounded-xl p-5 mb-6 ${selected === q.correct ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
              <div className={`font-semibold mb-2 ${selected === q.correct ? 'text-green-400' : 'text-red-400'}`}>
                {selected === q.correct ? '✓ Correct!' : '✗ Wrong'}
              </div>
              <p className="text-white/70 text-sm">{q.exp}</p>
            </div>
          )}
          {revealed && (
            <button onClick={nextQuestion} className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-4 rounded-xl transition-colors">
              {currentQ >= SAMPLE_QUESTIONS.length - 1 ? 'Submit Score' : 'Next Question →'}
            </button>
          )}
        </div>
      </div>
    )
  }

  // Lobby
  const enteredIds = new Set(myEntries.map(e => e.tournament_id))

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="border-b border-white/10 px-6 py-3 flex items-center justify-between text-sm">
        <Link href="/game" className="text-white/40 hover:text-white transition-colors">← Hub</Link>
        <span className="text-amber-400 font-medium">{balance !== null ? `${Number(balance).toFixed(1)} OC` : '—'}</span>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="text-center mb-10">
          <div className="text-5xl mb-3">🏆</div>
          <h1 className="text-3xl font-bold mb-2">Tournaments</h1>
          <p className="text-white/50">Compete against all players. Top 3 split the pot. Level 4+ required.</p>
        </div>

        {level < 4 && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-5 mb-8 text-amber-300 text-sm text-center">
            You are Level {level}. Reach Level 4 to enter tournaments. Keep playing Standard mode to earn XP.
          </div>
        )}

        {message && (
          <div className={`rounded-xl px-5 py-4 mb-6 text-sm font-medium ${message.type === 'ok' ? 'bg-green-500/10 border border-green-500/30 text-green-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'}`}>
            {message.text}
          </div>
        )}

        {tournaments.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">📅</div>
            <h2 className="text-xl font-semibold mb-2 text-white/70">No Active Tournaments</h2>
            <p className="text-white/40 text-sm mb-8">Tournaments run weekly. Check back soon or practice in Standard mode to be ready.</p>
            {/* Demo tournament for testing */}
            <div className="bg-white/5 border border-amber-500/30 rounded-2xl p-6 text-left max-w-lg mx-auto">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">Demo Tournament</div>
                  <h3 className="font-bold text-lg">Crypto Basics Challenge</h3>
                  <p className="text-white/40 text-sm">10 questions · All levels · Practice mode</p>
                </div>
                <div className="text-right">
                  <div className="text-white/40 text-xs">Entry</div>
                  <div className="text-amber-400 font-bold">Free</div>
                </div>
              </div>
              <button
                onClick={() => startPlaying({ tournament_id: 'demo', name: 'Crypto Basics Challenge', entry_fee_oc: 0, max_players: 100, start_at: new Date().toISOString(), end_at: new Date().toISOString(), status: 'open', pot_total: 0, entered: false })}
                className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 rounded-xl transition-colors"
              >
                Play Demo Tournament
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {tournaments.map(t => {
              const entered = enteredIds.has(t.tournament_id)
              const myEntry = myEntries.find(e => e.tournament_id === t.tournament_id)
              const isOpen = t.status === 'open'
              const isActive = t.status === 'active'
              const startDate = new Date(t.start_at)
              const endDate = new Date(t.end_at)

              return (
                <div key={t.tournament_id} className="bg-white/5 border border-amber-500/20 rounded-2xl p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className={`text-xs font-bold uppercase tracking-wider mb-1 ${isOpen ? 'text-green-400' : isActive ? 'text-amber-400' : 'text-white/30'}`}>
                        {t.status}
                      </div>
                      <h3 className="font-bold text-lg">{t.name}</h3>
                      <p className="text-white/40 text-sm">
                        {startDate.toLocaleDateString()} → {endDate.toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-white/40 text-xs">Prize Pool</div>
                      <div className="text-amber-400 font-bold text-xl">{Number(t.pot_total).toFixed(0)} OC</div>
                      <div className="text-white/30 text-xs">{t.entry_fee_oc} OC entry</div>
                    </div>
                  </div>

                  <div className="text-xs text-white/40 mb-4">
                    Prize split: 1st 60% · 2nd 30% · 3rd 10% · Platform 10%
                  </div>

                  {myEntry && (
                    <div className="bg-white/5 rounded-lg px-4 py-2 mb-4 text-sm flex gap-4">
                      {myEntry.score > 0 && <span>Score: <span className="text-white font-bold">{myEntry.score}</span></span>}
                      {myEntry.rank && <span>Rank: <span className="text-amber-400 font-bold">#{myEntry.rank}</span></span>}
                      {myEntry.payout_oc > 0 && <span>Payout: <span className="text-green-400 font-bold">{myEntry.payout_oc} OC</span></span>}
                    </div>
                  )}

                  <div className="flex gap-3">
                    {!entered && isOpen && level >= 4 && (
                      <button
                        onClick={() => enterTournament(t)}
                        disabled={entering === t.tournament_id}
                        className="flex-1 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white font-bold py-3 rounded-xl transition-colors"
                      >
                        {entering === t.tournament_id ? 'Entering...' : `Enter for ${t.entry_fee_oc} OC`}
                      </button>
                    )}
                    {entered && !myEntry?.score && isActive && (
                      <button
                        onClick={() => startPlaying(t)}
                        className="flex-1 bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 rounded-xl transition-colors"
                      >
                        Play Now →
                      </button>
                    )}
                    {entered && myEntry?.score && (
                      <div className="flex-1 bg-green-500/10 border border-green-500/30 rounded-xl py-3 text-center text-green-400 text-sm font-medium">
                        ✓ Score submitted — awaiting results
                      </div>
                    )}
                    {entered && isOpen && (
                      <div className="flex-1 bg-white/5 border border-white/10 rounded-xl py-3 text-center text-white/40 text-sm">
                        Entered — tournament starts {startDate.toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className="mt-10 bg-white/5 border border-white/10 rounded-xl p-5 text-sm text-white/40">
          <p className="font-semibold text-white/60 mb-2">How Tournaments Work</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>Pay the entry fee to join. Your fee goes into the prize pool.</li>
            <li>When the tournament window opens, answer all 10 questions as fast as you can.</li>
            <li>Highest score wins. Ties broken by fastest total answer time.</li>
            <li>Top 3 players split the pool: 60% / 30% / 10%. Platform keeps 10%.</li>
            <li>Level 4+ required. One entry per tournament per account.</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
