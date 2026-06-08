'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'

interface OpenDuel {
  duel_id: string
  challenger_id: string
  wager_oc: number
  created_at: string
}

interface ActiveDuel {
  duel_id: string
  wager_oc: number
  questions: Array<{ question_text: string; options: string[]; question_id: string }>
  is_challenger: boolean
}

type Phase = 'loading' | 'lobby' | 'creating' | 'waiting' | 'playing' | 'result' | 'error'

const WAGER_OPTIONS = [2, 5, 10, 25, 50]
const QUESTION_TIME_LIMIT = 15 // seconds

export default function DuelPage() {
  const [phase, setPhase] = useState<Phase>('loading')
  const [openDuels, setOpenDuels] = useState<OpenDuel[]>([])
  const [balance, setBalance] = useState<number | null>(null)
  const [wager, setWager] = useState(5)
  const [activeDuel, setActiveDuel] = useState<ActiveDuel | null>(null)
  const [duelId, setDuelId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ text: string; type: 'ok' | 'error' } | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  // Playing state
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [selected, setSelected] = useState<number | null>(null)
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME_LIMIT)
  const [startTime, setStartTime] = useState(0)
  const [totalMs, setTotalMs] = useState(0)
  const [score, setScore] = useState(0)
  const [result, setResult] = useState<any>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const load = useCallback(async () => {
    const [duelRes, statsRes] = await Promise.all([
      fetch('/api/game/duel'),
      fetch('/api/game/stats'),
    ])
    const [duelData, statsData] = await Promise.all([duelRes.json(), statsRes.json()])
    if (duelData.open_duels) setOpenDuels(duelData.open_duels)
    if (statsData.stats) setBalance(statsData.stats.oc_balance)
    setPhase('lobby')
  }, [])

  useEffect(() => { load() }, [load])

  // Timer for each question
  useEffect(() => {
    if (phase !== 'playing' || selected !== null) return
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!)
          autoAdvance()
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current!)
  }, [phase, currentQ, selected])

  function autoAdvance() {
    handleAnswer(-1)
  }

  function handleAnswer(idx: number) {
    if (selected !== null) return
    clearInterval(timerRef.current!)
    setSelected(idx)
    if (activeDuel && idx === (activeDuel.questions[currentQ] as any).correct_index) {
      setScore(s => s + 1)
    }
    // Auto-advance after 1.5s
    setTimeout(() => nextQuestion(idx), 1500)
  }

  async function nextQuestion(answeredIdx: number) {
    const newAnswers = [...answers, answeredIdx]
    setAnswers(newAnswers)

    if (!activeDuel || currentQ >= activeDuel.questions.length - 1) {
      // Submit
      const elapsed = Date.now() - startTime
      setTotalMs(elapsed)
      const res = await fetch('/api/game/duel', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submit',
          duel_id: duelId,
          answers: newAnswers,
          time_ms: elapsed,
        }),
      })
      const data = await res.json()
      setResult(data)
      setPhase('result')
      return
    }
    setCurrentQ(q => q + 1)
    setSelected(null)
    setTimeLeft(QUESTION_TIME_LIMIT)
  }

  async function createDuel() {
    setActionLoading(true)
    setMessage(null)
    const res = await fetch('/api/game/duel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wager_oc: wager }),
    })
    const data = await res.json()
    setActionLoading(false)
    if (!res.ok) { setMessage({ text: data.error ?? 'Could not create duel', type: 'error' }); return }
    setDuelId(data.duel.duel_id)
    setPhase('waiting')
    // Poll for opponent
    pollForOpponent(data.duel.duel_id)
  }

  async function joinDuel(d: OpenDuel) {
    setActionLoading(true)
    setMessage(null)
    const res = await fetch('/api/game/duel', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'join', duel_id: d.duel_id }),
    })
    const data = await res.json()
    setActionLoading(false)
    if (!res.ok) { setMessage({ text: data.error ?? 'Could not join duel', type: 'error' }); return }
    setDuelId(d.duel_id)
    // Start playing with duel questions
    const duelData = await fetch(`/api/game/duel?duel_id=${d.duel_id}`).then(r => r.json())
    startDuel(duelData.duel, false)
  }

  function pollForOpponent(id: string) {
    const interval = setInterval(async () => {
      const data = await fetch(`/api/game/duel?duel_id=${id}`).then(r => r.json())
      if (data.duel?.status === 'active') {
        clearInterval(interval)
        startDuel(data.duel, true)
      }
    }, 2000)
    // Timeout after 60s
    setTimeout(() => {
      clearInterval(interval)
      if (phase === 'waiting') {
        cancelDuel(id)
      }
    }, 60000)
  }

  async function cancelDuel(id: string) {
    await fetch('/api/game/duel', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'cancel', duel_id: id }),
    })
    setMessage({ text: 'No opponent found — OC refunded.', type: 'ok' })
    setPhase('lobby')
    load()
  }

  function startDuel(duel: any, isChallenger: boolean) {
    setActiveDuel({
      duel_id: duel.duel_id,
      wager_oc: duel.wager_oc,
      questions: duel.questions ?? [],
      is_challenger: isChallenger,
    })
    setCurrentQ(0)
    setAnswers([])
    setSelected(null)
    setScore(0)
    setTimeLeft(QUESTION_TIME_LIMIT)
    setStartTime(Date.now())
    setPhase('playing')
  }

  // ── RENDER ──────────────────────────────────────────────────────────────────

  if (phase === 'loading') {
    return <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center"><div className="text-white/40 animate-pulse">Loading...</div></div>
  }

  if (phase === 'waiting') {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <div className="text-6xl mb-4 animate-pulse">⚔️</div>
          <h2 className="text-xl font-bold mb-2">Waiting for Opponent...</h2>
          <p className="text-white/50 mb-2">Your duel is open. Another player can join.</p>
          <p className="text-white/30 text-sm mb-8">Auto-cancels if no one joins in 60 seconds.</p>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-8 text-center">
            <div className="text-white/40 text-xs mb-1">Wager</div>
            <div className="text-amber-400 font-bold text-2xl">{wager} OC</div>
          </div>
          <button onClick={() => cancelDuel(duelId!)} className="bg-white/10 hover:bg-white/15 text-white font-semibold px-6 py-3 rounded-xl transition-colors">
            Cancel & Refund
          </button>
        </div>
      </div>
    )
  }

  if (phase === 'playing' && activeDuel) {
    const q = activeDuel.questions[currentQ]
    const timerPct = (timeLeft / QUESTION_TIME_LIMIT) * 100

    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white">
        <div className="border-b border-white/10 px-6 py-3 flex items-center justify-between text-sm">
          <span className="text-red-400 font-bold">⚔️ DUEL — {wager} OC</span>
          <span className="text-white/40">Q {currentQ + 1}/5</span>
          <span className={`font-bold ${timeLeft <= 5 ? 'text-red-400 animate-pulse' : 'text-white/60'}`}>{timeLeft}s</span>
        </div>
        {/* Timer bar */}
        <div className="h-1 bg-white/10">
          <div className="h-1 bg-red-500 transition-all duration-1000" style={{ width: `${timerPct}%` }} />
        </div>
        <div className="max-w-2xl mx-auto px-6 py-10">
          <h2 className="text-xl font-semibold mb-8 leading-relaxed">{q?.question_text}</h2>
          <div className="space-y-3">
            {q?.options?.map((opt: string, i: number) => {
              let cls = 'border-white/10 bg-white/5 text-white/70 hover:border-white/30 hover:bg-white/8 cursor-pointer'
              if (selected !== null) {
                if (i === selected) cls = 'border-blue-500 bg-blue-500/20 text-white cursor-default'
                else cls = 'border-white/5 bg-white/3 text-white/30 cursor-default'
              }
              return (
                <button key={i} onClick={() => handleAnswer(i)} disabled={selected !== null}
                  className={`w-full text-left px-5 py-4 rounded-xl border transition-all ${cls}`}>
                  <span className="text-white/30 mr-3">{['A','B','C','D'][i]}.</span>{opt}
                </button>
              )
            })}
          </div>
          {selected !== null && (
            <p className="text-white/30 text-sm text-center mt-6">Advancing...</p>
          )}
        </div>
      </div>
    )
  }

  if (phase === 'result') {
    const won = result?.result?.winner_id && result?.score !== undefined
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <div className="text-6xl mb-4">{score >= 3 ? '🏆' : '📉'}</div>
          <h2 className="text-2xl font-bold mb-6">Duel Complete</h2>
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8 grid grid-cols-2 gap-4 text-center">
            <div><div className="text-white/40 text-xs mb-1">Your Score</div><div className="font-bold text-xl">{result?.score ?? score}/5</div></div>
            <div><div className="text-white/40 text-xs mb-1">Time</div><div className="font-bold text-xl">{(totalMs/1000).toFixed(1)}s</div></div>
            {result?.result && (
              <div className="col-span-2">
                <div className="text-white/40 text-xs mb-1">Payout</div>
                <div className={`font-bold text-xl ${result.result.payout ? 'text-green-400' : 'text-red-400'}`}>
                  {result.result.winner_id ? `+${result.result.payout?.toFixed(1) ?? '0'} OC` : '−' + wager + ' OC'}
                </div>
              </div>
            )}
          </div>
          <p className="text-white/40 text-sm mb-8">Result depends on both players' answers. Check your OC balance for the final outcome.</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => { setPhase('lobby'); load() }} className="bg-red-600 hover:bg-red-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors">Duel Again</button>
            <Link href="/game" className="bg-white/10 hover:bg-white/15 text-white font-semibold px-6 py-3 rounded-xl transition-colors">Hub</Link>
          </div>
        </div>
      </div>
    )
  }

  // Lobby
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="border-b border-white/10 px-6 py-3 flex items-center justify-between text-sm">
        <Link href="/game" className="text-white/40 hover:text-white transition-colors">← Hub</Link>
        <span className="text-amber-400 font-medium">{balance !== null ? `${Number(balance).toFixed(1)} OC` : '—'}</span>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="text-center mb-10">
          <div className="text-5xl mb-3">⚔️</div>
          <h1 className="text-3xl font-bold mb-2">Head-to-Head Duel</h1>
          <p className="text-white/50">Challenge another player. 5 questions. Fastest and most correct wins the pot.</p>
        </div>

        {message && (
          <div className={`rounded-xl px-5 py-4 mb-6 text-sm font-medium ${message.type === 'ok' ? 'bg-green-500/10 border border-green-500/30 text-green-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'}`}>
            {message.text}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6 mb-10">
          {/* Create a duel */}
          <div className="bg-white/5 border border-red-500/20 rounded-2xl p-6">
            <h2 className="font-bold text-lg mb-1">Challenge Someone</h2>
            <p className="text-white/40 text-sm mb-6">Open a duel. Anyone can join. Winner takes the pot.</p>

            <div className="mb-5">
              <div className="text-sm text-white/50 mb-3">Your wager</div>
              <div className="grid grid-cols-5 gap-2">
                {WAGER_OPTIONS.map(w => (
                  <button key={w} onClick={() => setWager(w)}
                    className={`py-2.5 rounded-lg text-sm font-bold transition-all ${wager === w ? 'bg-red-600 text-white' : 'bg-white/10 text-white/60 hover:bg-white/15'}`}>
                    {w}
                  </button>
                ))}
              </div>
              <div className="text-xs text-white/30 text-center mt-2">
                Pot = {wager * 2} OC · Platform takes {(wager * 2 * 0.05).toFixed(1)} OC · Winner gets {(wager * 2 * 0.95).toFixed(1)} OC
              </div>
            </div>

            <button onClick={createDuel} disabled={actionLoading || (balance !== null && balance < wager)}
              className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white font-bold py-3 rounded-xl transition-colors">
              {actionLoading ? 'Creating...' : `Create Duel — ${wager} OC`}
            </button>
            {balance !== null && balance < wager && (
              <p className="text-red-400 text-xs text-center mt-2">Insufficient OC balance</p>
            )}
          </div>

          {/* Join an open duel */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="font-bold text-lg mb-1">Join Open Duel</h2>
            <p className="text-white/40 text-sm mb-6">Jump into a duel someone else created.</p>

            {openDuels.length === 0 ? (
              <div className="text-center py-8 text-white/30">
                <p className="text-3xl mb-2">🎯</p>
                <p className="text-sm">No open duels right now.</p>
                <p className="text-xs mt-1">Create one and wait for a challenger!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {openDuels.slice(0, 5).map(d => (
                  <div key={d.duel_id} className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3">
                    <div>
                      <div className="font-semibold text-sm">{d.wager_oc} OC wager</div>
                      <div className="text-white/30 text-xs">Win {(d.wager_oc * 2 * 0.95).toFixed(1)} OC</div>
                    </div>
                    <button onClick={() => joinDuel(d)} disabled={actionLoading || (balance !== null && balance < d.wager_oc)}
                      className="bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors">
                      Join
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-5 text-sm text-white/40">
          <p className="font-semibold text-white/60 mb-2">Rules</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>Both players answer the same 5 questions simultaneously — 15 seconds per question</li>
            <li>Most correct answers wins. Tie = fastest total time wins</li>
            <li>Wager range: 2–50 OC. Platform takes 5% of the pot</li>
            <li>Disconnecting mid-duel forfeits your wager</li>
            <li>Cannot duel the same player twice within 1 hour</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
