'use client'

// OnlyCrypto City — Monopoly Classic board (Phase 1 + 2 + 3).
// Server-authoritative: /api/game/turn rolls and resolves; /api/game/buy purchases;
// /api/game/answer grades and awards OCC. This page renders state only.

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { XP_REWARDS, LEVEL_NAMES, getLevel } from '@/lib/game/types'

type GamePhase = 'loading' | 'board' | 'buy-offer' | 'card' | 'zone-quiz' | 'zone-result' | 'done'

interface BoardSpace {
  position: number
  space_type: 'district' | 'corner' | 'event' | 'opportunity'
  zone_id: string | null
  name: string
  emoji: string | null
  color: string | null
  purchase_price_oc: number | null
  base_rent_oc: number | null
}

interface OwnerInfo { user_id: string; name: string; mine: boolean }

// Phase 3: questions no longer include correct_index (stripped server-side)
interface PublicQuestion {
  question_id: string
  zone: string
  question_text: string
  options: string[]
  difficulty?: string
}

interface AnswerResult {
  correct: boolean
  explanation?: string
  oc_awarded: number
  balance: number
  quiz_streak: number
  effects_applied: string[]
  active_effects: unknown[]
}

interface TurnResult {
  dice: number
  position: number
  turn: number
  passed_start: boolean
  lap_bonus: number
  staking_bonus?: number
  moved_to_crash?: boolean
  skipped?: boolean
  space: BoardSpace
  card: { deck: string; text: string; delta_oc: number; applied?: number; pending?: boolean; effect_type?: string; effect_applied?: string } | null
  rent: { amount: number; to: string } | null
  can_buy: boolean
  owner: { mine: boolean; name?: string } | null
  questions: PublicQuestion[] | null
  pending_penalty: number | null
  active_effects: unknown[]
  balance: number | null
  error?: string
  code?: string
}

// 7×7 perimeter, classic Monopoly orientation: START bottom-right, counterclockwise.
function gridCell(position: number): { row: number; col: number } {
  if (position <= 6) return { row: 7, col: 7 - position }
  if (position <= 11) return { row: 7 - (position - 6), col: 1 }
  if (position === 12) return { row: 1, col: 1 }
  if (position <= 17) return { row: 1, col: position - 11 }
  if (position === 18) return { row: 1, col: 7 }
  return { row: position - 17, col: 7 }
}

const DICE_FACES = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅']

function effectLabel(kind: string): string {
  switch (kind) {
    case 'protect_next_loss': return '🛡️ Protected from next loss'
    case 'skip_turn': return '⏭️ Skip next turn'
    case 'double_next_reward': return '⚡ Double next reward'
    case 'buy_discount': return '🏷️ 10% buy discount earned!'
    case 'own_district_bonus': return '🏠 District owner bonus!'
    default: return kind
  }
}

function GameBoard() {
  const searchParams = useSearchParams()
  const mode = (searchParams.get('mode') ?? 'standard') as 'standard' | 'practice'
  const practice = mode === 'practice'

  const [gamePhase, setGamePhase] = useState<GamePhase>('loading')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [board, setBoard] = useState<BoardSpace[]>([])
  const [owners, setOwners] = useState<Record<string, OwnerInfo>>({})
  const [myProperties, setMyProperties] = useState<string[]>([])
  const [balance, setBalance] = useState<number>(0)
  const [position, setPosition] = useState(0)
  const [turn, setTurn] = useState(0)
  const [diceValue, setDiceValue] = useState<number | null>(null)
  const [rolling, setRolling] = useState(false)
  const [lastTurn, setLastTurn] = useState<TurnResult | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [buying, setBuying] = useState(false)

  // quiz state — Phase 3: no correct_index client-side
  const [questions, setQuestions] = useState<PublicQuestion[]>([])
  const [qIndex, setQIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [answerRevealed, setAnswerRevealed] = useState(false)
  const [lastAnswer, setLastAnswer] = useState<AnswerResult | null>(null)
  const [quizCorrect, setQuizCorrect] = useState(0)
  const [submittingAnswer, setSubmittingAnswer] = useState(false)
  const [sessionXP, setSessionXP] = useState(0)
  const [zonesCompleted, setZonesCompleted] = useState<string[]>([])

  useEffect(() => {
    startGame()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function startGame() {
    const [sessionRes, boardRes] = await Promise.all([
      fetch('/api/game/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      }),
      fetch('/api/game/board'),
    ])
    const sessionData = await sessionRes.json()
    if (!sessionRes.ok) {
      if (sessionRes.status === 401) {
        window.location.href = 'https://onlycrypto.io/api/academy/game-link'
        return
      }
      setMessage(sessionData.error ?? 'Could not start game')
      setGamePhase('done')
      return
    }
    if (!sessionData.session) {
      setMessage('Could not create game session. Please try again.')
      setGamePhase('done')
      return
    }
    setSessionId(sessionData.session.session_id)

    const boardData = await boardRes.json().catch(() => null)
    if (boardData?.board?.length) {
      setBoard(boardData.board)
      setOwners(boardData.owners ?? {})
      if (boardData.me) {
        setBalance(boardData.me.oc_balance ?? 0)
        setMyProperties(boardData.me.properties ?? [])
      }
    }
    setPosition(0)
    setGamePhase('board')
  }

  async function handleRoll() {
    if (rolling || !sessionId) return
    setRolling(true)
    setMessage(null)
    setLastTurn(null)

    const turnPromise = fetch('/api/game/turn', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, position }),
    })

    let ticks = 0
    const spin = setInterval(() => {
      setDiceValue(Math.floor(Math.random() * 6) + 1)
      ticks++
    }, 100)

    let res: Response
    try {
      res = await turnPromise
    } catch {
      clearInterval(spin)
      setRolling(false)
      setMessage('Connection problem — try rolling again.')
      return
    }
    if (ticks < 8) await new Promise(r => setTimeout(r, (8 - ticks) * 100))
    clearInterval(spin)

    const data: TurnResult = await res.json().catch(() => ({ error: 'Bad response' }) as TurnResult)
    setRolling(false)

    if (!res.ok) {
      if (res.status === 401 && data.code === 'reauth') {
        window.location.href = 'https://onlycrypto.io/api/academy/game-link'
        return
      }
      setMessage(data.error ?? 'Turn failed — try again.')
      return
    }

    // Skip-turn effect
    if ((data as any).skipped) {
      setMessage((data as any).reason ?? 'Your turn was skipped!')
      setTurn(prev => prev + 1)
      return
    }

    setDiceValue(data.dice)
    setPosition(data.position)
    setTurn(data.turn)
    setLastTurn(data)
    if (data.balance !== null && data.balance !== undefined) setBalance(data.balance)
    setQuestions(data.questions ?? [])

    if (data.card) {
      setGamePhase('card')
    } else if (data.can_buy) {
      setGamePhase('buy-offer')
    } else if (data.questions && data.questions.length > 0) {
      startQuiz(data.questions)
    } else {
      setGamePhase('board')
    }
  }

  function startQuiz(qs: PublicQuestion[]) {
    setQuestions(qs)
    setQIndex(0)
    setQuizCorrect(0)
    setSelectedAnswer(null)
    setAnswerRevealed(false)
    setLastAnswer(null)
    setGamePhase('zone-quiz')
  }

  async function handleBuy() {
    if (!lastTurn?.space.zone_id || !sessionId || buying) return
    setBuying(true)
    const res = await fetch('/api/game/buy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, zone_id: lastTurn.space.zone_id }),
    })
    const data = await res.json().catch(() => ({}))
    setBuying(false)

    if (res.ok && data.ok) {
      setBalance(Number(data.balance))
      setMyProperties(prev => [...prev, lastTurn.space.zone_id!])
      setOwners(prev => ({ ...prev, [lastTurn.space.zone_id!]: { user_id: 'me', name: 'You', mine: true } }))
      setMessage(`🏠 You now own ${lastTurn.space.name}!`)
    } else if (res.status === 401) {
      window.location.href = 'https://onlycrypto.io/api/academy/game-link'
      return
    } else {
      setMessage(
        data.error === 'insufficient_balance'
          ? `Not enough OCC — ${lastTurn.space.name} costs ${lastTurn.space.purchase_price_oc} OCC.`
          : data.error === 'already_owned'
          ? 'Someone beat you to it — this district was just purchased.'
          : 'Purchase failed — try again.'
      )
    }
    afterBuyDecision()
  }

  function afterBuyDecision() {
    if (questions.length > 0) startQuiz(questions)
    else setGamePhase('board')
  }

  function dismissCard() {
    // After card is dismissed: if there were questions queued, start the quiz
    if (questions.length > 0) startQuiz(questions)
    else setGamePhase('board')
  }

  // Phase 3: submit answer to server — no local grading
  async function selectAnswer(index: number) {
    if (answerRevealed || selectedAnswer !== null || submittingAnswer) return
    if (!sessionId || practice) {
      // Practice mode: no server call, just mark selected (no correct_index to reveal)
      setSelectedAnswer(index)
      setAnswerRevealed(true)
      setSessionXP(prev => Math.max(0, prev + XP_REWARDS.correct_answer))
      return
    }
    const q = questions[qIndex]
    if (!q) return

    setSelectedAnswer(index)
    setSubmittingAnswer(true)

    const res = await fetch('/api/game/answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, question_id: q.question_id, answer_index: index }),
    })
    const data: AnswerResult = await res.json().catch(() => ({ correct: false, oc_awarded: 0, balance, quiz_streak: 0, effects_applied: [], active_effects: [] }))
    setSubmittingAnswer(false)
    setAnswerRevealed(true)
    setLastAnswer(data)

    if (data.correct) {
      setQuizCorrect(prev => prev + 1)
      setSessionXP(prev => Math.max(0, prev + XP_REWARDS.correct_answer))
    } else {
      setSessionXP(prev => Math.max(0, prev + XP_REWARDS.wrong_answer))
    }
    if (data.balance !== undefined) setBalance(data.balance)
  }

  function nextQuestion() {
    if (qIndex >= questions.length - 1) {
      const zone = lastTurn?.space.zone_id
      if (zone && !zonesCompleted.includes(zone)) setZonesCompleted(prev => [...prev, zone])
      if (quizCorrect >= questions.length) {
        setSessionXP(prev => prev + XP_REWARDS.perfect_zone)
      }
      setGamePhase('zone-result')
      return
    }
    setQIndex(prev => prev + 1)
    setSelectedAnswer(null)
    setAnswerRevealed(false)
    setLastAnswer(null)
  }

  async function endGame() {
    if (sessionId) {
      await fetch('/api/game/session', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          score: sessionXP,
          zones_completed: zonesCompleted,
          xp_earned: sessionXP,
          // oc_earned intentionally omitted — server handles OCC
        }),
      })
    }
    setGamePhase('done')
  }

  // ── RENDER ──────────────────────────────────────────────────────────────────

  if (gamePhase === 'loading') {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-white/40 animate-pulse text-lg">Setting up OnlyCrypto City...</div>
      </div>
    )
  }

  if (gamePhase === 'done') {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <div className="text-6xl mb-4">🏙️</div>
          <h2 className="text-2xl font-bold mb-6">Game Over</h2>
          {message && <p className="text-red-400 mb-4">{message}</p>}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8 grid grid-cols-2 gap-4">
            <div>
              <div className="text-white/40 text-xs mb-1">XP Earned</div>
              <div className="font-bold text-blue-400 text-xl">{sessionXP}</div>
            </div>
            <div>
              <div className="text-white/40 text-xs mb-1">OCC Balance</div>
              <div className="font-bold text-amber-400 text-xl">{balance.toFixed(1)}</div>
            </div>
            <div>
              <div className="text-white/40 text-xs mb-1">Level</div>
              <div className="font-bold">{getLevel(sessionXP)} — {LEVEL_NAMES[getLevel(sessionXP)]}</div>
            </div>
            <div>
              <div className="text-white/40 text-xs mb-1">Districts Owned</div>
              <div className="font-bold text-green-400">{myProperties.length}</div>
            </div>
          </div>
          <div className="flex gap-3 justify-center">
            <button onClick={() => window.location.reload()} className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors">
              Play Again
            </button>
            <Link href="/game" className="bg-white/10 hover:bg-white/15 text-white font-semibold px-6 py-3 rounded-xl transition-colors">
              Game Hub
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (gamePhase === 'zone-quiz' && questions[qIndex]) {
    const q = questions[qIndex]
    const pendingPenalty = lastTurn?.pending_penalty ?? null
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white">
        <div className="border-b border-white/10 px-6 py-3 flex items-center justify-between text-sm">
          <span className="text-white/40">{lastTurn?.space.emoji} {lastTurn?.space.name}</span>
          <div className="flex gap-4 text-white/50">
            <span className="text-blue-400">{sessionXP} XP</span>
            {!practice && <span className="text-amber-400">{balance.toFixed(1)} OCC</span>}
          </div>
        </div>
        <div className="max-w-2xl mx-auto px-6 py-10">
          <div className="text-xs text-white/30 mb-2">Knowledge Challenge — Question {qIndex + 1} of {questions.length}</div>
          {pendingPenalty !== null && pendingPenalty < 0 && !answerRevealed && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-2 mb-4 text-xs text-amber-300">
              ⚠️ Pending penalty: {Math.abs(pendingPenalty).toFixed(1)} OCC — answer correctly to halve it
            </div>
          )}
          <h2 className="text-xl font-semibold mb-8 leading-relaxed">{q.question_text}</h2>
          <div className="space-y-3 mb-8">
            {q.options.map((opt: string, i: number) => {
              let cls = 'border-white/10 bg-white/5 text-white/70 hover:border-white/30 hover:bg-white/8'
              if (answerRevealed && lastAnswer) {
                if (lastAnswer.correct && i === selectedAnswer) cls = 'border-green-500 bg-green-500/20 text-white'
                else if (!lastAnswer.correct && i === selectedAnswer) cls = 'border-red-500 bg-red-500/20 text-white'
                else cls = 'border-white/5 bg-white/3 text-white/30'
              } else if (selectedAnswer === i) {
                cls = 'border-blue-500 bg-blue-500/20 text-white'
              }
              return (
                <button key={i} onClick={() => selectAnswer(i)} disabled={answerRevealed || submittingAnswer}
                  className={`w-full text-left px-5 py-4 rounded-xl border transition-all ${cls} ${submittingAnswer ? 'opacity-60 cursor-wait' : ''}`}>
                  <span className="text-white/30 mr-3">{['A', 'B', 'C', 'D'][i]}.</span>
                  {opt}
                </button>
              )
            })}
          </div>

          {answerRevealed && lastAnswer && (
            <div className={`rounded-xl p-5 mb-4 ${lastAnswer.correct ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
              <div className={`font-semibold mb-2 ${lastAnswer.correct ? 'text-green-400' : 'text-red-400'}`}>
                {lastAnswer.correct ? '✓ Correct!' : '✗ Wrong'}
                {lastAnswer.oc_awarded > 0 && <span className="ml-2 text-amber-400 text-sm">+{lastAnswer.oc_awarded.toFixed(2)} OCC</span>}
              </div>
              {lastAnswer.explanation && <p className="text-white/70 text-sm">{lastAnswer.explanation}</p>}
              {lastAnswer.effects_applied.length > 0 && (
                <div className="mt-3 space-y-1">
                  {lastAnswer.effects_applied.map(e => (
                    <div key={e} className="text-xs text-amber-300">{effectLabel(e)}</div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Practice mode: no server answer — just allow continue */}
          {answerRevealed && practice && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4 text-sm text-white/60">
              Practice mode — answers are not graded. Play standard mode to earn OCC.
            </div>
          )}

          {answerRevealed && (
            <button onClick={nextQuestion} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-colors">
              {qIndex >= questions.length - 1 ? 'Finish Challenge' : 'Next Question'}
            </button>
          )}
        </div>
      </div>
    )
  }

  if (gamePhase === 'zone-result') {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <div className="text-5xl mb-4">{lastTurn?.space.emoji}</div>
          <h2 className="text-xl font-bold mb-2">{lastTurn?.space.name}</h2>
          <p className="text-white/50 mb-8">{quizCorrect} of {questions.length} correct</p>
          <div className="bg-white/5 border border-white/10 rounded-xl p-5 mb-8 grid grid-cols-2 gap-4 text-center">
            <div><div className="text-white/40 text-xs mb-1">Session XP</div><div className="font-bold text-blue-400">{sessionXP}</div></div>
            {!practice && <div><div className="text-white/40 text-xs mb-1">OCC Balance</div><div className="font-bold text-amber-400">{balance.toFixed(1)}</div></div>}
          </div>
          <div className="flex gap-3 justify-center">
            <button onClick={() => setGamePhase('board')} className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-xl transition-colors">
              Continue
            </button>
            <button onClick={endGame} className="bg-white/10 hover:bg-white/15 text-white font-semibold px-6 py-3 rounded-xl transition-colors">
              End Game
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── BOARD VIEW (+ buy/card modals) ─────────────────────────────────────────
  const currentSpace = board[position]

  return (
    <div className="min-h-screen text-white" style={{ background: 'radial-gradient(ellipse at 50% 0%, #3a2414 0%, #241407 55%, #160c04 100%)' }}>
      <div className="border-b border-[#5a3c22]/60 px-4 py-3 flex items-center justify-between text-sm" style={{ background: 'rgba(20,11,4,0.6)' }}>
        <Link href="/game" className="text-[#cdb68a]/60 hover:text-[#f0e3c0] transition-colors">← Hub</Link>
        <div className="flex gap-4 md:gap-5 flex-wrap justify-end">
          {!practice && <span className="text-amber-400 font-semibold">{balance.toFixed(1)} OCC</span>}
          <span className="text-sky-300 font-medium">{sessionXP} XP</span>
          <span className="text-emerald-400 font-medium">🏠 {myProperties.length}</span>
          <span className="text-[#cdb68a]/50">Turn {turn}</span>
        </div>
        <button onClick={endGame} className="text-[#cdb68a]/40 hover:text-[#f0e3c0] text-xs transition-colors">End Game</button>
      </div>

      <div className="max-w-5xl mx-auto px-2 md:px-6 py-4 md:py-8">
        {practice && (
          <div className="text-center text-xs text-amber-400/80 mb-3">Practice mode — no OCC is earned or spent</div>
        )}

        {/* Monopoly perimeter board — parchment on wood */}
        <div className="mx-auto rounded-lg p-2 md:p-3 shadow-2xl" style={{ maxWidth: 'min(92vw, 780px)', background: 'linear-gradient(135deg, #6b4a28, #4a3018)', boxShadow: '0 24px 60px rgba(0,0,0,0.6)' }}>
          <div className="grid gap-[3px] rounded" style={{ gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gridTemplateRows: 'repeat(7, minmax(0, 1fr))', aspectRatio: '1 / 1', background: '#3d2a16' }}>
            {board.map(space => {
              const { row, col } = gridCell(space.position)
              const isHere = position === space.position
              const owner = space.zone_id ? owners[space.zone_id] : undefined
              const isCorner = space.space_type === 'corner'
              return (
                <div key={space.position}
                  style={{
                    gridRow: row,
                    gridColumn: col,
                    background: isHere ? '#fdf6dd' : isCorner ? '#e7dcba' : '#f0e7c8',
                    outline: isHere ? '2px solid #b45309' : owner?.mine ? '2px solid #15803d' : owner ? '2px solid #b45309aa' : 'none',
                    outlineOffset: '-2px',
                  }}
                  className="relative rounded-sm flex flex-col overflow-hidden text-center">
                  {space.space_type === 'district' && (
                    <div className="h-2 md:h-2.5 w-full shrink-0 border-b border-black/25" style={{ backgroundColor: space.color ?? '#666' }} />
                  )}
                  <div className="flex-1 flex flex-col items-center justify-center px-0.5 py-0.5">
                    <div className="text-base md:text-2xl leading-none">{space.emoji}</div>
                    <div className="text-[8px] md:text-[10px] font-bold uppercase tracking-tight leading-tight mt-0.5 line-clamp-2 text-[#3a2a15]">{space.name}</div>
                    {space.space_type === 'district' && (
                      <div className="text-[8px] md:text-[10px] mt-0.5 font-semibold">
                        {owner
                          ? <span className={owner.mine ? 'text-green-700' : 'text-amber-700'}>{owner.mine ? '★ YOURS' : `★ ${owner.name.slice(0, 8)}`}</span>
                          : <span className="text-[#7a6845]">{Number(space.purchase_price_oc)} OCC</span>}
                      </div>
                    )}
                  </div>
                  {isHere && (
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 text-[9px] bg-red-600 text-white px-1.5 py-0.5 rounded-full font-bold z-10 shadow">
                      YOU
                    </div>
                  )}
                </div>
              )
            })}

            {/* Center: dark skyline panel */}
            <div style={{ gridRow: '2 / 7', gridColumn: '2 / 7', background: '#f0e7c8' }} className="relative rounded-sm flex flex-col items-center justify-center px-4 overflow-hidden">
              <svg viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full">
                <rect width="400" height="240" fill="#1c1812" />
                <g fill="#2e2418">
                  <rect x="0" y="120" width="34" height="120" />
                  <rect x="40" y="84" width="26" height="156" />
                  <rect x="72" y="140" width="38" height="100" />
                  <rect x="116" y="60" width="30" height="180" />
                  <rect x="152" y="110" width="24" height="130" />
                  <rect x="182" y="44" width="36" height="196" />
                  <rect x="224" y="96" width="26" height="144" />
                  <rect x="256" y="70" width="32" height="170" />
                  <rect x="294" y="128" width="24" height="112" />
                  <rect x="324" y="88" width="30" height="152" />
                  <rect x="360" y="138" width="40" height="102" />
                  <polygon points="197,20 203,20 203,44 197,44" />
                </g>
                <g fill="#caa64a" opacity="0.5">
                  <rect x="48" y="96" width="4" height="5" /><rect x="56" y="110" width="4" height="5" />
                  <rect x="124" y="74" width="4" height="5" /><rect x="132" y="92" width="4" height="5" />
                  <rect x="190" y="60" width="4" height="5" /><rect x="202" y="80" width="4" height="5" /><rect x="196" y="120" width="4" height="5" />
                  <rect x="264" y="84" width="4" height="5" /><rect x="272" y="104" width="4" height="5" />
                  <rect x="332" y="100" width="4" height="5" /><rect x="340" y="124" width="4" height="5" />
                </g>
              </svg>
              <div className="relative flex flex-col items-center">
                <div className="text-center mb-3 md:mb-4">
                  <div className="text-lg md:text-3xl font-black tracking-wide" style={{ color: '#f0e3c0', textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>
                    ONLYCRYPTO<span className="text-amber-400">CITY</span>
                  </div>
                  <div className="text-[10px] md:text-xs tracking-widest mt-1" style={{ color: '#cdb68a' }}>LEARN · PLAY · EARN · BUILD</div>
                </div>
                <div className="text-5xl md:text-7xl mb-3 select-none" style={{ transform: rolling ? 'rotate(20deg)' : 'none', transition: 'transform 0.1s', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.6))' }}>
                  {diceValue ? DICE_FACES[diceValue] : '🎲'}
                </div>
                <button onClick={handleRoll} disabled={rolling}
                  className="bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-extrabold px-8 md:px-10 py-3 md:py-4 rounded-lg text-base md:text-lg transition-colors shadow-lg uppercase tracking-wide">
                  {rolling ? 'Rolling…' : 'Roll Dice'}
                </button>
                {lastTurn && !rolling && (
                  <div className="text-[11px] md:text-sm mt-3 text-center space-y-0.5" style={{ color: '#cdb68a' }}>
                    <div>Rolled {lastTurn.dice} → {currentSpace?.emoji} {currentSpace?.name}</div>
                    {lastTurn.lap_bonus > 0 && <div className="text-green-400">🏁 Passed START +{lastTurn.lap_bonus} OCC</div>}
                    {(lastTurn.staking_bonus ?? 0) > 0 && <div className="text-green-400">🪙 Free Staking +{lastTurn.staking_bonus} OCC</div>}
                    {lastTurn.moved_to_crash && <div className="text-red-400">🚨 Sent to Market Crash!</div>}
                    {lastTurn.rent && lastTurn.rent.amount > 0 && <div className="text-red-400">Paid {lastTurn.rent.amount} OCC rent to {lastTurn.rent.to}</div>}
                    {lastTurn.card?.effect_applied && <div className="text-amber-300">{effectLabel(lastTurn.card.effect_applied)}</div>}
                  </div>
                )}
                {message && <div className="text-amber-300 text-xs md:text-sm mt-3 text-center max-w-xs">{message}</div>}
              </div>
            </div>
          </div>
        </div>

        {/* Card legend */}
        <div className="mx-auto mt-4 md:mt-6 grid grid-cols-1 md:grid-cols-3 gap-3" style={{ maxWidth: 'min(92vw, 780px)' }}>
          <div className="rounded-lg p-3 text-xs" style={{ background: 'rgba(30,18,8,0.7)', border: '1px solid rgba(90,60,34,0.4)' }}>
            <div className="font-bold mb-1" style={{ color: '#f97316' }}>⚡ Market Events</div>
            <p style={{ color: '#cdb68a99' }}>Land on an event space to draw a Market Event card — bull runs, exploits, gas spikes, and more.</p>
          </div>
          <div className="rounded-lg p-3 text-xs" style={{ background: 'rgba(30,18,8,0.7)', border: '1px solid rgba(90,60,34,0.4)' }}>
            <div className="font-bold mb-1" style={{ color: '#22c55e' }}>🎁 Crypto Opportunities</div>
            <p style={{ color: '#cdb68a99' }}>Airdrop! Staking yield! DAO grant! Opportunity cards reward good behavior and crypto knowledge.</p>
          </div>
          <div className="rounded-lg p-3 text-xs" style={{ background: 'rgba(30,18,8,0.7)', border: '1px solid rgba(90,60,34,0.4)' }}>
            <div className="font-bold mb-1" style={{ color: '#60a5fa' }}>🧠 Knowledge Leverage</div>
            <p style={{ color: '#cdb68a99' }}>3/3 correct = 10% buy discount. Correct answer halves a negative event penalty. Education wins.</p>
          </div>
        </div>

        {/* Card draw modal */}
        {gamePhase === 'card' && lastTurn?.card && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
            <div className="max-w-sm w-full rounded-2xl p-6 text-center shadow-2xl"
              style={{ background: lastTurn.card.deck === 'event' ? 'linear-gradient(135deg,#431407,#7c2d12)' : 'linear-gradient(135deg,#052e16,#14532d)', border: `1px solid ${lastTurn.card.deck === 'event' ? '#f97316' : '#22c55e'}55` }}>
              <div className="text-4xl mb-3">{lastTurn.card.deck === 'event' ? '⚡' : '🎁'}</div>
              <div className="text-xs tracking-widest uppercase mb-2 opacity-60" style={{ color: lastTurn.card.deck === 'event' ? '#fb923c' : '#4ade80' }}>
                {lastTurn.card.deck === 'event' ? 'Market Event' : 'Crypto Opportunity'}
              </div>
              <p className="text-white font-semibold text-lg leading-snug mb-4">{lastTurn.card.text}</p>
              {lastTurn.card.pending && lastTurn.card.delta_oc < 0 && (
                <div className="bg-amber-500/20 border border-amber-500/40 rounded-lg px-3 py-2 mb-3 text-xs text-amber-300">
                  ⚠️ Penalty of {Math.abs(lastTurn.card.delta_oc).toFixed(1)} OCC pending — answer the knowledge challenge correctly to halve it
                </div>
              )}
              {lastTurn.card.effect_applied && (
                <div className="bg-white/10 rounded-lg px-3 py-2 mb-3 text-xs text-white/70">
                  {effectLabel(lastTurn.card.effect_applied)}
                </div>
              )}
              {lastTurn.card.applied !== undefined && lastTurn.card.applied !== 0 && !lastTurn.card.pending && (
                <div className={`text-sm font-bold mb-3 ${lastTurn.card.applied > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {lastTurn.card.applied > 0 ? '+' : ''}{lastTurn.card.applied.toFixed(2)} OCC
                </div>
              )}
              <button onClick={dismissCard}
                className="w-full py-3 rounded-xl font-bold text-white transition-colors"
                style={{ background: lastTurn.card.deck === 'event' ? '#ea580c' : '#16a34a' }}>
                {questions.length > 0 ? 'Continue to Knowledge Challenge' : 'Continue'}
              </button>
            </div>
          </div>
        )}

        {/* Buy offer modal */}
        {gamePhase === 'buy-offer' && lastTurn?.space && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
            <div className="max-w-sm w-full rounded-2xl p-6 text-center shadow-2xl" style={{ background: 'linear-gradient(135deg,#0c1445,#1e3a8a)', border: '1px solid #3b82f655' }}>
              <div className="text-4xl mb-2">{lastTurn.space.emoji}</div>
              <h3 className="text-white font-bold text-xl mb-1">{lastTurn.space.name}</h3>
              <p className="text-white/50 text-sm mb-4">Purchase this district?</p>
              <div className="bg-white/10 rounded-xl p-4 mb-5 grid grid-cols-2 gap-3 text-sm">
                <div><div className="text-white/40 text-xs mb-0.5">Price</div><div className="font-bold text-amber-400">{lastTurn.space.purchase_price_oc} OCC</div></div>
                <div><div className="text-white/40 text-xs mb-0.5">Rent earned</div><div className="font-bold text-green-400">{lastTurn.space.base_rent_oc} OCC</div></div>
                <div><div className="text-white/40 text-xs mb-0.5">Your balance</div><div className="font-bold">{balance.toFixed(1)} OCC</div></div>
                <div><div className="text-white/40 text-xs mb-0.5">After purchase</div><div className={`font-bold ${balance - (lastTurn.space.purchase_price_oc ?? 0) < 0 ? 'text-red-400' : 'text-white'}`}>{(balance - (lastTurn.space.purchase_price_oc ?? 0)).toFixed(1)} OCC</div></div>
              </div>
              <div className="flex gap-3">
                <button onClick={handleBuy} disabled={buying || balance < (lastTurn.space.purchase_price_oc ?? 0)}
                  className="flex-1 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  {buying ? 'Buying…' : 'Buy District'}
                </button>
                <button onClick={afterBuyDecision} className="flex-1 py-3 rounded-xl font-semibold text-white/70 bg-white/10 hover:bg-white/15 transition-colors">
                  Pass
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function GamePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center"><div className="text-white/40 animate-pulse">Loading…</div></div>}>
      <GameBoard />
    </Suspense>
  )
}
