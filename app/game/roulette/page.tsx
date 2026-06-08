'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Scenario {
  scenario_id: string
  description: string
  context?: string
  options: string[]
  real_date?: string
}

interface RouletteSession {
  session_id: string
  rounds_played: number
  total_wagered: number
  total_won: number
}

type Phase = 'loading' | 'start' | 'wagering' | 'revealing' | 'done' | 'error'

const WAGER_OPTIONS = [1, 2, 5, 10, 20]

export default function RoulettePage() {
  const [phase, setPhase] = useState<Phase>('loading')
  const [session, setSession] = useState<RouletteSession | null>(null)
  const [scenario, setScenario] = useState<Scenario | null>(null)
  const [wager, setWager] = useState(5)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [result, setResult] = useState<any>(null)
  const [roundsRemaining, setRoundsRemaining] = useState(5)
  const [dailyRemaining, setDailyRemaining] = useState(50)
  const [balance, setBalance] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    // Load player balance
    fetch('/api/game/stats').then(r => r.json()).then(d => {
      if (d.stats) setBalance(d.stats.oc_balance)
    })
    setPhase('start')
  }, [])

  async function startSession() {
    setPhase('loading')
    const res = await fetch('/api/game/roulette')
    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Could not start session')
      setPhase('error')
      return
    }
    setSession(data.session)
    setScenario(data.scenario)
    setRoundsRemaining(data.rounds_remaining)
    setDailyRemaining(data.daily_remaining ?? 50)
    setPhase('wagering')
  }

  async function submitPrediction() {
    if (selectedOption === null || !session || !scenario) return
    setSubmitting(true)
    const res = await fetch('/api/game/roulette', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: session.session_id,
        scenario_id: scenario.scenario_id,
        prediction_index: selectedOption,
        wager_oc: wager,
      }),
    })
    const data = await res.json()
    setSubmitting(false)
    if (!res.ok) {
      setError(data.error ?? 'Submission failed')
      return
    }
    setResult(data)
    setBalance(data.new_balance)
    setRoundsRemaining(data.rounds_remaining)
    setPhase('revealing')
  }

  async function nextRound() {
    if (roundsRemaining <= 0) {
      setPhase('done')
      return
    }
    setPhase('loading')
    setResult(null)
    setSelectedOption(null)
    const res = await fetch(`/api/game/roulette?session_id=${session?.session_id}`)
    const data = await res.json()
    if (!res.ok || data.done) {
      setPhase('done')
      return
    }
    setScenario(data.scenario)
    setRoundsRemaining(data.rounds_remaining)
    setPhase('wagering')
  }

  if (phase === 'loading') {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-white/40 animate-pulse text-lg">Loading...</div>
      </div>
    )
  }

  if (phase === 'error') {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center text-center px-6">
        <div>
          <div className="text-5xl mb-4">⚠️</div>
          <p className="text-red-400 text-lg mb-6">{error}</p>
          <Link href="/game" className="text-white/60 hover:text-white text-sm">← Back to Game Hub</Link>
        </div>
      </div>
    )
  }

  if (phase === 'start') {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center px-6">
        <div className="max-w-lg text-center">
          <div className="text-7xl mb-6">🎰</div>
          <h1 className="text-3xl font-bold mb-3">Crypto Roulette</h1>
          <p className="text-white/60 mb-2">Predict real historical crypto market events.</p>
          <p className="text-white/60 mb-8">Correct prediction = 1.9× your wager. Wrong = you lose your wager.</p>

          <div className="bg-white/5 border border-white/10 rounded-xl p-5 mb-8 text-left">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-white/40">Rounds per session</span><div className="font-bold mt-1">5</div></div>
              <div><span className="text-white/40">Max wager per round</span><div className="font-bold mt-1">20 OC</div></div>
              <div><span className="text-white/40">Daily wager limit</span><div className="font-bold mt-1">50 OC</div></div>
              <div><span className="text-white/40">Your OC balance</span><div className="font-bold mt-1 text-amber-400">{balance !== null ? `${Number(balance).toFixed(1)} OC` : '—'}</div></div>
            </div>
          </div>

          <button
            onClick={startSession}
            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-4 rounded-xl transition-colors"
          >
            Start Session
          </button>
          <Link href="/game" className="block mt-4 text-white/40 hover:text-white text-sm transition-colors">← Back</Link>
        </div>
      </div>
    )
  }

  if (phase === 'done') {
    const totalNet = (session?.total_won ?? 0) - (session?.total_wagered ?? 0)
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center px-6">
        <div className="max-w-lg text-center">
          <div className="text-6xl mb-4">{totalNet >= 0 ? '🎉' : '📉'}</div>
          <h2 className="text-2xl font-bold mb-6">Session Complete</h2>
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-white/40 text-xs mb-1">Wagered</div>
                <div className="font-bold">{Number(session?.total_wagered ?? 0).toFixed(1)} OC</div>
              </div>
              <div>
                <div className="text-white/40 text-xs mb-1">Won</div>
                <div className="font-bold text-green-400">{Number(session?.total_won ?? 0).toFixed(1)} OC</div>
              </div>
              <div>
                <div className="text-white/40 text-xs mb-1">Net</div>
                <div className={`font-bold ${totalNet >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {totalNet >= 0 ? '+' : ''}{totalNet.toFixed(1)} OC
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-3 justify-center">
            <button onClick={() => { setSession(null); setPhase('start') }} className="bg-purple-600 hover:bg-purple-500 text-white font-semibold px-6 py-3 rounded-lg transition-colors">
              Play Again
            </button>
            <Link href="/game" className="bg-white/10 hover:bg-white/15 text-white font-semibold px-6 py-3 rounded-lg transition-colors">
              Back to Hub
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Top bar */}
      <div className="border-b border-white/10 px-6 py-3 flex items-center justify-between text-sm">
        <Link href="/game" className="text-white/40 hover:text-white transition-colors">← Hub</Link>
        <div className="flex gap-6 text-white/50">
          <span>Round {(session?.rounds_played ?? 0) + (phase === 'revealing' ? 0 : 0) + 1} / 5</span>
          <span className="text-amber-400">{balance !== null ? `${Number(balance).toFixed(1)} OC` : '—'}</span>
        </div>
        <div className="text-white/30">{roundsRemaining} rounds left</div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🎰</div>
          <h1 className="text-2xl font-bold">Crypto Roulette</h1>
        </div>

        {/* Scenario card */}
        {scenario && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-7 mb-8">
            {scenario.context && (
              <div className="text-xs text-white/40 bg-white/5 rounded-lg px-3 py-2 mb-5 font-mono">
                📅 {scenario.context}
              </div>
            )}
            <p className="text-lg font-medium leading-relaxed mb-2">{scenario.description}</p>
          </div>
        )}

        {phase === 'wagering' && (
          <>
            {/* Options */}
            <div className="space-y-3 mb-8">
              {scenario?.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedOption(i)}
                  className={`w-full text-left px-5 py-4 rounded-xl border transition-all font-medium ${
                    selectedOption === i
                      ? 'border-purple-500 bg-purple-500/20 text-white'
                      : 'border-white/10 bg-white/5 text-white/70 hover:border-white/30 hover:bg-white/8'
                  }`}
                >
                  <span className="text-white/40 mr-3">{['A', 'B', 'C'][i]}.</span>
                  {opt}
                </button>
              ))}
            </div>

            {/* Wager */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-5 mb-6">
              <div className="text-sm text-white/50 mb-3">Your wager</div>
              <div className="flex gap-2 mb-3">
                {WAGER_OPTIONS.map(w => (
                  <button
                    key={w}
                    onClick={() => setWager(w)}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                      wager === w
                        ? 'bg-purple-600 text-white'
                        : 'bg-white/10 text-white/60 hover:bg-white/15'
                    }`}
                  >
                    {w}
                  </button>
                ))}
              </div>
              <div className="text-xs text-white/30 text-center">
                Win = {(wager * 1.9).toFixed(1)} OC · Lose = −{wager} OC
              </div>
            </div>

            <button
              onClick={submitPrediction}
              disabled={selectedOption === null || submitting}
              className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-colors"
            >
              {submitting ? 'Submitting...' : 'Lock In Prediction'}
            </button>
          </>
        )}

        {phase === 'revealing' && result && (
          <div className="text-center">
            <div className={`text-6xl mb-4 ${result.correct ? '' : ''}`}>
              {result.correct ? '✅' : '❌'}
            </div>
            <h2 className={`text-2xl font-bold mb-4 ${result.correct ? 'text-green-400' : 'text-red-400'}`}>
              {result.correct ? `Correct! +${result.payout_oc.toFixed(1)} OC` : `Wrong. −${wager} OC`}
            </h2>

            <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8 text-left">
              <div className="text-sm font-semibold text-white/60 mb-2">What actually happened:</div>
              <p className="text-white/90 leading-relaxed">{result.explanation}</p>
            </div>

            {roundsRemaining > 0 ? (
              <button onClick={nextRound} className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-8 py-3 rounded-xl transition-colors">
                Next Round ({roundsRemaining} left)
              </button>
            ) : (
              <button onClick={() => setPhase('done')} className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-8 py-3 rounded-xl transition-colors">
                See Results
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
