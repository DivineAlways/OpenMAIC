'use client'

// OnlyCrypto City — Monopoly Classic board (Phase 1).
// Server-authoritative: /api/game/turn rolls and resolves; /api/game/buy purchases.
// This page renders state — it never computes OCC.

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { XP_REWARDS, LEVEL_NAMES, getLevel, type QuizQuestion } from '@/lib/game/types'

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

interface TurnResult {
  dice: number
  position: number
  turn: number
  passed_start: boolean
  lap_bonus: number
  staking_bonus?: number
  moved_to_crash?: boolean
  space: BoardSpace
  card: { deck: string; text: string; delta_oc: number; applied?: number } | null
  rent: { amount: number; to: string } | null
  can_buy: boolean
  owner: { mine: boolean; name?: string } | null
  questions: QuizQuestion[] | null
  balance: number | null
  error?: string
  code?: string
}

// 7×7 perimeter, classic Monopoly orientation: START bottom-right, counterclockwise.
function gridCell(position: number): { row: number; col: number } {
  if (position <= 6) return { row: 7, col: 7 - position }          // bottom: right → left
  if (position <= 11) return { row: 7 - (position - 6), col: 1 }   // left: bottom → top
  if (position === 12) return { row: 1, col: 1 }                   // top-left corner
  if (position <= 17) return { row: 1, col: position - 11 }        // top: left → right
  if (position === 18) return { row: 1, col: 7 }                   // top-right corner
  return { row: position - 17, col: 7 }                            // right: top → bottom
}

const DICE_FACES = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅']

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

  // quiz state
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [qIndex, setQIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [answerRevealed, setAnswerRevealed] = useState(false)
  const [quizCorrect, setQuizCorrect] = useState(0)
  const [sessionXP, setSessionXP] = useState(0)
  const [sessionQuizOC, setSessionQuizOC] = useState(0)
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

    // request the server turn while the dice spins
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
    // let the spin run at least ~0.8s so it feels like a roll
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

    setDiceValue(data.dice)
    setPosition(data.position)
    setTurn(data.turn)
    setLastTurn(data)
    if (data.balance !== null && data.balance !== undefined) setBalance(data.balance)
    // always reset — a zone with an empty pool must not replay last turn's quiz
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

  function startQuiz(qs: QuizQuestion[]) {
    setQuestions(qs)
    setQIndex(0)
    setQuizCorrect(0)
    setSelectedAnswer(null)
    setAnswerRevealed(false)
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
    setGamePhase('board')
  }

  function selectAnswer(index: number) {
    if (answerRevealed || selectedAnswer !== null) return
    setSelectedAnswer(index)
    setAnswerRevealed(true)
    const q = questions[qIndex]
    const correct = q && index === q.correct_index
    setSessionXP(prev => Math.max(0, prev + (correct ? XP_REWARDS.correct_answer : XP_REWARDS.wrong_answer)))
    if (correct) {
      setQuizCorrect(prev => prev + 1)
      if (!practice) setSessionQuizOC(prev => Math.min(25, prev + 0.5))
    }
  }

  function nextQuestion() {
    if (qIndex >= questions.length - 1) {
      const zone = lastTurn?.space.zone_id
      if (zone && !zonesCompleted.includes(zone)) setZonesCompleted(prev => [...prev, zone])
      if (quizCorrect >= questions.length) {
        setSessionXP(prev => prev + XP_REWARDS.perfect_zone)
        if (!practice) setSessionQuizOC(prev => Math.min(25, prev + 2))
      }
      setGamePhase('zone-result')
      return
    }
    setQIndex(prev => prev + 1)
    setSelectedAnswer(null)
    setAnswerRevealed(false)
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
          oc_earned: sessionQuizOC,
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
              <div className="text-white/40 text-xs mb-1">Quiz OCC Earned</div>
              <div className="font-bold text-amber-400 text-xl">{sessionQuizOC.toFixed(1)}</div>
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
          <div className="text-xs text-white/30 mb-6">Knowledge Challenge — Question {qIndex + 1} of {questions.length}</div>
          <h2 className="text-xl font-semibold mb-8 leading-relaxed">{q.question_text}</h2>
          <div className="space-y-3 mb-8">
            {q.options.map((opt, i) => {
              let cls = 'border-white/10 bg-white/5 text-white/70 hover:border-white/30 hover:bg-white/8'
              if (answerRevealed) {
                if (i === q.correct_index) cls = 'border-green-500 bg-green-500/20 text-white'
                else if (i === selectedAnswer) cls = 'border-red-500 bg-red-500/20 text-white'
                else cls = 'border-white/5 bg-white/3 text-white/30'
              } else if (selectedAnswer === i) {
                cls = 'border-blue-500 bg-blue-500/20 text-white'
              }
              return (
                <button key={i} onClick={() => selectAnswer(i)} disabled={answerRevealed}
                  className={`w-full text-left px-5 py-4 rounded-xl border transition-all ${cls}`}>
                  <span className="text-white/30 mr-3">{['A', 'B', 'C', 'D'][i]}.</span>
                  {opt}
                </button>
              )
            })}
          </div>

          {answerRevealed && (
            <div className={`rounded-xl p-5 mb-6 ${selectedAnswer === q.correct_index ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
              <div className={`font-semibold mb-2 ${selectedAnswer === q.correct_index ? 'text-green-400' : 'text-red-400'}`}>
                {selectedAnswer === q.correct_index ? '✓ Correct!' : '✗ Wrong'}
              </div>
              {q.explanation && <p className="text-white/70 text-sm">{q.explanation}</p>}
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
            {!practice && <div><div className="text-white/40 text-xs mb-1">Quiz OCC (pending)</div><div className="font-bold text-amber-400">{sessionQuizOC.toFixed(1)}</div></div>}
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
  // Crypto Monopoly Classic: wooden table, parchment board, dark skyline center.
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
                  {/* classic Monopoly color band */}
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

            {/* Center: dark skyline panel, like the classic board art */}
            <div style={{ gridRow: '2 / 7', gridColumn: '2 / 7', background: '#f0e7c8' }} className="relative rounded-sm flex flex-col items-center justify-center px-4 overflow-hidden">
              <svg viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full">
                <rect width="400" height="240" fill="#1c1812" />
                {/* skyline silhouette */}
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
                {/* lit windows */}
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
                  </div>
                )}
                {message && <div className="text-amber-300 text-xs md:text-sm mt-3 text-center max-w-xs">{message}</div>}
              </div>
            </div>
          </div>
        </div>

        {/* Card legend — like the mockup's example cards */}
        <div className="mx-auto mt-4 md:mt-6 grid grid-cols-1 md:grid-cols-3 gap-3" style={{ maxWidth: 'min(92vw, 780px)' }}>
          {[
            { head: 'MARKET EVENT', color: '#b91c1c', icon: '⚡', text: 'XRP pumps 20%! Collect OCC — or a rug pull costs you.' },
            { head: 'KNOWLEDGE CHALLENGE', color: '#1d4ed8', icon: '🎓', text: 'Land on a district and answer 3 questions to earn rewards.' },
            { head: 'CRYPTO OPPORTUNITY', color: '#15803d', icon: '🎁', text: 'Airdrops, staking yield, and early-investor bonuses.' },
          ].map(c => (
            <div key={c.head} className="rounded-md overflow-hidden shadow-lg" style={{ background: '#f0e7c8' }}>
              <div className="px-3 py-1.5 text-[10px] md:text-xs font-extrabold tracking-wider text-white" style={{ background: c.color }}>{c.head}</div>
              <div className="px-3 py-2.5 text-[11px] md:text-xs text-[#3a2a15] flex items-center gap-2">
                <span className="text-xl">{c.icon}</span>{c.text}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Buy offer modal — parchment deed card */}
      {gamePhase === 'buy-offer' && lastTurn?.space && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center px-6 z-50">
          <div className="rounded-lg overflow-hidden max-w-sm w-full text-center shadow-2xl" style={{ background: '#f0e7c8' }}>
            <div className="px-4 py-2 border-b border-black/25" style={{ backgroundColor: lastTurn.space.color ?? '#666' }}>
              <span className="text-xs font-extrabold tracking-widest text-white uppercase">Title Deed</span>
            </div>
            <div className="p-6">
              <div className="text-5xl mb-3">{lastTurn.space.emoji}</div>
              <h3 className="text-xl font-extrabold mb-1 uppercase tracking-wide text-[#2b2118]">{lastTurn.space.name}</h3>
              <p className="text-[#6b5b3d] text-sm mb-5">Unowned district — buy it and collect {Number(lastTurn.space.base_rent_oc)} OCC rent when other players land here.</p>
              <div className="rounded-md p-4 mb-3 flex justify-between text-sm border border-[#c9b88e]" style={{ background: '#e7dcba' }}>
                <span className="text-[#6b5b3d] font-semibold">Price</span>
                <span className="font-extrabold text-amber-700">{Number(lastTurn.space.purchase_price_oc)} OCC</span>
              </div>
              <div className="flex justify-between text-xs text-[#8a7752] mb-5 px-1">
                <span>Your balance</span>
                <span>{balance.toFixed(1)} OCC</span>
              </div>
              <div className="flex gap-3">
                <button onClick={handleBuy} disabled={buying || balance < Number(lastTurn.space.purchase_price_oc)}
                  className="flex-1 bg-green-700 hover:bg-green-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold py-3 rounded-md transition-colors uppercase tracking-wide text-sm">
                  {buying ? 'Buying…' : 'Buy District'}
                </button>
                <button onClick={afterBuyDecision} disabled={buying}
                  className="flex-1 bg-[#3a2a15] hover:bg-[#4d3a22] text-[#f0e3c0] font-bold py-3 rounded-md transition-colors uppercase tracking-wide text-sm">
                  Skip
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Market Event / Crypto Opportunity card modal — classic deck card */}
      {gamePhase === 'card' && lastTurn?.card && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center px-6 z-50">
          <div className="rounded-lg overflow-hidden max-w-sm w-full text-center shadow-2xl" style={{ background: '#f0e7c8' }}>
            <div className="px-4 py-2 border-b border-black/25" style={{ background: lastTurn.card.deck === 'event' ? '#b91c1c' : '#15803d' }}>
              <span className="text-xs font-extrabold tracking-widest text-white uppercase">
                {lastTurn.card.deck === 'event' ? 'Market Event' : 'Crypto Opportunity'}
              </span>
            </div>
            <div className="p-6">
              <div className="text-5xl mb-3">{lastTurn.card.deck === 'event' ? '⚡' : '🎁'}</div>
              <p className="text-lg font-bold mb-4 text-[#2b2118]">{lastTurn.card.text}</p>
              {!practice && (
                <div className={`text-sm font-extrabold mb-5 ${(lastTurn.card.applied ?? lastTurn.card.delta_oc) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  {(lastTurn.card.applied ?? 0) >= 0 ? '+' : ''}{(lastTurn.card.applied ?? 0).toFixed(1)} OCC
                  {lastTurn.card.applied === 0 && lastTurn.card.delta_oc > 0 && ' (daily cap reached)'}
                </div>
              )}
              <button onClick={dismissCard} className="w-full bg-amber-500 hover:bg-amber-400 text-black font-extrabold py-3 rounded-md transition-colors uppercase tracking-wide">
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function PlayPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center"><div className="text-white/40 animate-pulse">Loading...</div></div>}>
      <GameBoard />
    </Suspense>
  )
}
