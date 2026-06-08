'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ALL_ZONES, GAME_ASSETS, XP_REWARDS, OC_REWARDS, LEVEL_NAMES, getLevel, type Zone, type QuizQuestion, type GameAsset } from '@/lib/game/types'

type GamePhase = 'loading' | 'board' | 'zone-quiz' | 'zone-result' | 'event' | 'market' | 'done'

interface SessionState {
  session_id: string
  position: number
  xp: number
  oc: number
  assets: string[]
  zones_completed: string[]
  turn: number
  active_effects: any[]
}

const BOARD_QUESTIONS: Record<string, QuizQuestion[]> = {
  'blockchain-basics': [
    { question_id: 'bb1', zone: 'blockchain-basics', question_text: 'What makes a blockchain different from a regular database?', options: ['It stores data on one central computer', 'Thousands of computers hold the same copy — no single entity controls it', 'Only the government can access it', 'It deletes data after 30 days'], correct_index: 1, difficulty: 'easy', explanation: 'A blockchain is decentralized — copies exist across thousands of nodes worldwide, making it extremely difficult to tamper with.' },
    { question_id: 'bb2', zone: 'blockchain-basics', question_text: 'Once a transaction is recorded on the blockchain, what can you do to it?', options: ['Edit it any time', 'Delete it if you are the sender', 'Nothing — it stays there permanently', 'Move it to another block'], correct_index: 2, difficulty: 'easy', explanation: 'Blockchain records are immutable — once confirmed, they cannot be altered or deleted.' },
    { question_id: 'bb3', zone: 'blockchain-basics', question_text: 'What is a cryptographic hash?', options: ['A type of wallet password', 'A unique fixed-length fingerprint of any data', 'A transaction fee', 'A type of mining algorithm'], correct_index: 1, difficulty: 'medium', explanation: 'A hash is a mathematical function that converts any input into a fixed-length output. Any change to the input produces a completely different hash.' },
    { question_id: 'bb4', zone: 'blockchain-basics', question_text: 'What does "decentralization" mean in blockchain?', options: ['The network is controlled by one company', 'No single point of control — power is distributed across many nodes', 'Transactions happen in a central bank', 'Only developers can validate transactions'], correct_index: 1, difficulty: 'easy', explanation: 'Decentralization means no single entity controls the network — it is maintained by thousands of independent participants.' },
    { question_id: 'bb5', zone: 'blockchain-basics', question_text: 'What links blocks together in a blockchain?', options: ['Phone numbers', 'A cryptographic hash of the previous block', 'Bank account numbers', 'Email addresses'], correct_index: 1, difficulty: 'medium', explanation: 'Each block contains the hash of the previous block — this chain of hashes is what makes the blockchain tamper-evident.' },
  ],
  'xrpl-ledger': [
    { question_id: 'xl1', zone: 'xrpl-ledger', question_text: 'How fast does XRP Ledger typically settle a transaction?', options: ['10 minutes', '3–5 seconds', '24 hours', '1 week'], correct_index: 1, difficulty: 'easy', explanation: 'XRPL settles transactions in 3–5 seconds, compared to Bitcoin\'s 10 minutes or Ethereum\'s ~15 seconds.' },
    { question_id: 'xl2', zone: 'xrpl-ledger', question_text: 'What is the primary use case of XRP?', options: ['Store of value like gold', 'Bridge currency for fast, low-cost cross-border payments', 'Smart contract execution', 'NFT creation'], correct_index: 1, difficulty: 'easy', explanation: 'XRP is designed as a bridge currency — banks and payment providers use it to move money across borders instantly and cheaply.' },
    { question_id: 'xl3', zone: 'xrpl-ledger', question_text: 'What consensus mechanism does XRPL use?', options: ['Proof of Work', 'Proof of Stake', 'Federated Byzantine Agreement', 'Delegated Proof of Stake'], correct_index: 2, difficulty: 'hard', explanation: 'XRPL uses the XRP Ledger Consensus Protocol (based on Federated Byzantine Agreement) — no mining required, making it extremely energy efficient.' },
    { question_id: 'xl4', zone: 'xrpl-ledger', question_text: 'Who created the XRP Ledger?', options: ['Satoshi Nakamoto', 'Vitalik Buterin', 'Jed McCaleb, Chris Larsen, and Arthur Britto', 'The US Federal Reserve'], correct_index: 2, difficulty: 'medium', explanation: 'XRPL was created in 2012 by Jed McCaleb, Chris Larsen, and Arthur Britto — and later developed by Ripple Labs.' },
    { question_id: 'xl5', zone: 'xrpl-ledger', question_text: 'What is the base reserve requirement on XRPL?', options: ['100 XRP', '20 XRP', '10 XRP', '1 XRP'], correct_index: 3, difficulty: 'medium', explanation: 'XRPL requires a minimum balance (reserve) to activate a wallet. This is currently 1 XRP, though it can be adjusted by validators.' },
  ],
  'wallet-security': [
    { question_id: 'ws1', zone: 'wallet-security', question_text: 'What is a seed phrase?', options: ['A password for your exchange account', 'A sequence of 12–24 words that can restore your entire wallet', 'A type of transaction fee', 'A security question answer'], correct_index: 1, difficulty: 'easy', explanation: 'A seed phrase (or recovery phrase) is generated when you create a wallet. Anyone with these words can access your crypto.' },
    { question_id: 'ws2', zone: 'wallet-security', question_text: 'What should you NEVER do with your seed phrase?', options: ['Write it down on paper', 'Store it offline in a safe place', 'Share it with anyone — even support staff', 'Memorize it'], correct_index: 2, difficulty: 'easy', explanation: 'Never share your seed phrase with anyone. No legitimate support staff will ever ask for it.' },
    { question_id: 'ws3', zone: 'wallet-security', question_text: 'What is a hardware wallet?', options: ['A physical device that stores your private keys offline', 'An exchange account', 'A mobile app wallet', 'A paper printout of your address'], correct_index: 0, difficulty: 'easy', explanation: 'A hardware wallet (like Ledger or Trezor) stores your private keys offline — making it immune to online hacks.' },
    { question_id: 'ws4', zone: 'wallet-security', question_text: 'What is a phishing attack?', options: ['A type of trading strategy', 'A fake website or message designed to steal your credentials', 'A method to hack blockchain nodes', 'A DeFi protocol exploit'], correct_index: 1, difficulty: 'medium', explanation: 'Phishing attacks use fake websites, emails, or messages that look legitimate to trick you into entering your credentials or seed phrase.' },
    { question_id: 'ws5', zone: 'wallet-security', question_text: 'What does "not your keys, not your coins" mean?', options: ['You need to buy a physical key to access crypto', 'If you don\'t control your private keys, you don\'t truly own your crypto', 'Coins must be kept on exchanges for safety', 'Private keys are stored by the government'], correct_index: 1, difficulty: 'easy', explanation: 'If your crypto is on an exchange, the exchange holds the private keys — meaning they control your coins. FTX users learned this the hard way.' },
  ],
  'trading-psychology': [
    { question_id: 'tp1', zone: 'trading-psychology', question_text: 'What does FOMO stand for?', options: ['Fear Of Missing Out', 'Future Of Market Operations', 'First On Market Offer', 'Fear Of Margin Operations'], correct_index: 0, difficulty: 'easy', explanation: 'FOMO (Fear Of Missing Out) causes traders to buy at the top when everyone else is hyped — one of the most common emotional trading mistakes.' },
    { question_id: 'tp2', zone: 'trading-psychology', question_text: 'You\'re up 300% on a trade. The market starts turning. What do you do?', options: ['Hold — it will keep going up', 'Take at least partial profits and protect your gains', 'Buy more — the trend is your friend', 'Wait for a new all-time high to sell'], correct_index: 1, difficulty: 'medium', explanation: 'Disciplined traders take profits. Greed causes traders to hold through reversals and give back all their gains. Partial profit-taking locks in value.' },
    { question_id: 'tp3', zone: 'trading-psychology', question_text: 'What is confirmation bias in trading?', options: ['Confirming your identity before trading', 'Only seeking information that confirms your existing view', 'Getting confirmation from two sources before entering a trade', 'A type of technical analysis signal'], correct_index: 1, difficulty: 'medium', explanation: 'Confirmation bias causes traders to ignore evidence that contradicts their position and only look for information that confirms what they already believe.' },
    { question_id: 'tp4', zone: 'trading-psychology', question_text: 'What is the best approach when the market is going against your trade?', options: ['Average down — buy more to lower your cost basis', 'Close the position and accept the loss', 'Ignore it — it will bounce back', 'Add more leverage to recover faster'], correct_index: 1, difficulty: 'hard', explanation: 'Accepting a planned loss and closing a position is better than averaging down, ignoring risk management, or adding leverage — which can compound losses catastrophically.' },
    { question_id: 'tp5', zone: 'trading-psychology', question_text: 'What is "revenge trading"?', options: ['Trading against the market maker', 'Making impulsive trades after a loss trying to recover quickly', 'A type of arbitrage strategy', 'Trading the same asset twice in one day'], correct_index: 1, difficulty: 'medium', explanation: 'Revenge trading happens after a loss — traders make impulsive, larger positions trying to "get their money back." This almost always leads to larger losses.' },
  ],
  'risk-management': [
    { question_id: 'rm1', zone: 'risk-management', question_text: 'You have $1,000 to trade. Your max risk per trade is 2%. How much can you lose on one trade?', options: ['$200', '$20', '$50', '$100'], correct_index: 1, difficulty: 'easy', explanation: '2% of $1,000 = $20. This rule keeps any single loss from being catastrophic to your account.' },
    { question_id: 'rm2', zone: 'risk-management', question_text: 'What is a stop-loss order?', options: ['An order to buy more when price drops', 'An automatic sell trigger at a set price to limit losses', 'A limit order at your target profit', 'A fee charged by exchanges'], correct_index: 1, difficulty: 'easy', explanation: 'A stop-loss automatically closes your position if price falls to a set level — limiting your loss to a predetermined amount.' },
    { question_id: 'rm3', zone: 'risk-management', question_text: 'What is position sizing?', options: ['The physical size of your trading screen', 'Determining how much of your capital to allocate to each trade', 'The number of assets in your portfolio', 'Setting the maximum leverage allowed'], correct_index: 1, difficulty: 'medium', explanation: 'Position sizing determines how much of your capital goes into each trade — proper sizing ensures no single loss destroys your account.' },
    { question_id: 'rm4', zone: 'risk-management', question_text: 'What is a risk-to-reward ratio?', options: ['The ratio of your wins to losses', 'How much you risk compared to how much you stand to gain', 'The volatility of an asset', 'The spread on an exchange'], correct_index: 1, difficulty: 'medium', explanation: 'A 1:3 risk-to-reward means risking $1 to potentially make $3. Good traders only take trades where the potential reward significantly outweighs the risk.' },
    { question_id: 'rm5', zone: 'risk-management', question_text: 'What is the #1 rule of risk management?', options: ['Always use maximum leverage', 'Never invest more than you can afford to lose', 'Follow influencers for the best trades', 'Buy low, sell high — it\'s guaranteed'], correct_index: 1, difficulty: 'easy', explanation: 'Never invest money you cannot afford to lose. Crypto markets are extremely volatile. Only trade with capital whose loss would not affect your life.' },
  ],
  'technical-analysis': [
    { question_id: 'ta1', zone: 'technical-analysis', question_text: 'What does a series of higher highs and higher lows indicate?', options: ['A downtrend', 'An uptrend', 'A sideways market', 'A reversal is coming'], correct_index: 1, difficulty: 'easy', explanation: 'Higher highs and higher lows is the definition of an uptrend — each rally reaches higher and each pullback stays above the previous pullback.' },
    { question_id: 'ta2', zone: 'technical-analysis', question_text: 'What is support?', options: ['A level where price tends to fall', 'A level where price tends to find buying pressure and bounce', 'The peak of a bull run', 'A trading platform feature'], correct_index: 1, difficulty: 'easy', explanation: 'Support is a price level where buying pressure tends to overcome selling pressure — price bounces off support as buyers step in.' },
    { question_id: 'ta3', zone: 'technical-analysis', question_text: 'What does a bearish engulfing candlestick pattern signal?', options: ['Continuation of an uptrend', 'Potential reversal from up to down', 'A sideways market ahead', 'A breakout above resistance'], correct_index: 1, difficulty: 'hard', explanation: 'A bearish engulfing pattern occurs when a red candle completely engulfs the previous green candle — suggesting sellers have overtaken buyers and a reversal may follow.' },
    { question_id: 'ta4', zone: 'technical-analysis', question_text: 'What is the RSI (Relative Strength Index) used for?', options: ['Measuring transaction speed', 'Identifying overbought and oversold conditions', 'Calculating trading fees', 'Setting stop-loss levels'], correct_index: 1, difficulty: 'medium', explanation: 'RSI measures momentum on a scale of 0–100. Above 70 is generally considered overbought; below 30 is considered oversold.' },
    { question_id: 'ta5', zone: 'technical-analysis', question_text: 'What is a "breakout"?', options: ['When a trader exits their position', 'When price moves decisively through a key support or resistance level', 'A type of exchange hack', 'When a coin launches on a new exchange'], correct_index: 1, difficulty: 'medium', explanation: 'A breakout occurs when price moves through a key level (support or resistance) with momentum — often signaling the start of a new trend.' },
  ],
  'defi-district': [
    { question_id: 'dd1', zone: 'defi-district', question_text: 'What does DeFi stand for?', options: ['Digital Finance', 'Decentralized Finance', 'Defined Finance', 'Default Finance'], correct_index: 1, difficulty: 'easy', explanation: 'DeFi (Decentralized Finance) refers to financial services built on blockchain smart contracts — no banks, no intermediaries.' },
    { question_id: 'dd2', zone: 'defi-district', question_text: 'What is a smart contract?', options: ['A legal contract about crypto signed by lawyers', 'Self-executing code on a blockchain that runs automatically when conditions are met', 'An exchange\'s terms of service', 'A type of crypto wallet'], correct_index: 1, difficulty: 'easy', explanation: 'Smart contracts are programs stored on a blockchain that automatically execute when predetermined conditions are met — no middlemen needed.' },
    { question_id: 'dd3', zone: 'defi-district', question_text: 'What is impermanent loss?', options: ['Money lost permanently when a DeFi protocol is hacked', 'Temporary loss experienced by liquidity providers when asset prices diverge', 'A trading loss that cannot be recovered', 'Fees paid to DeFi protocols'], correct_index: 1, difficulty: 'hard', explanation: 'Impermanent loss occurs when providing liquidity to an AMM and the price of your deposited assets changes relative to each other — you would have been better off just holding.' },
    { question_id: 'dd4', zone: 'defi-district', question_text: 'What is yield farming?', options: ['Mining cryptocurrency with solar panels', 'Earning returns by providing liquidity or lending in DeFi protocols', 'Growing a portfolio of farming tokens', 'A type of NFT project'], correct_index: 1, difficulty: 'medium', explanation: 'Yield farming involves putting crypto assets to work in DeFi protocols to earn returns — through lending, providing liquidity, or staking.' },
    { question_id: 'dd5', zone: 'defi-district', question_text: 'What is a rug pull?', options: ['A type of yield farming strategy', 'When developers abandon a project and take investor funds', 'A carpet cleaning service that accepts crypto', 'When token price increases 100x'], correct_index: 1, difficulty: 'easy', explanation: 'A rug pull is when DeFi project developers suddenly withdraw all funds from the liquidity pool and disappear — leaving investors with worthless tokens.' },
  ],
  'nft-marketplace': [
    { question_id: 'nm1', zone: 'nft-marketplace', question_text: 'What does NFT stand for?', options: ['Non-Fungible Token', 'New Finance Technology', 'Network For Trading', 'Non-Financial Token'], correct_index: 0, difficulty: 'easy', explanation: 'NFT stands for Non-Fungible Token. "Non-fungible" means unique and not interchangeable — each NFT is one-of-a-kind.' },
    { question_id: 'nm2', zone: 'nft-marketplace', question_text: 'What gives an NFT its value?', options: ['It is always backed by gold', 'Scarcity, community, utility, and perceived value', 'The cost of the image file', 'Government certification'], correct_index: 1, difficulty: 'medium', explanation: 'NFT value comes from scarcity (limited supply), community (strong holder base), utility (access, games, events), and perceived value.' },
    { question_id: 'nm3', zone: 'nft-marketplace', question_text: 'What is a royalty in the context of NFTs?', options: ['A fee paid to exchange platforms', 'A percentage of secondary sales that goes back to the original creator', 'A type of NFT rarity trait', 'The initial minting cost'], correct_index: 1, difficulty: 'medium', explanation: 'NFT royalties allow creators to earn a percentage every time their NFT is resold — creating ongoing income from secondary market activity.' },
    { question_id: 'nm4', zone: 'nft-marketplace', question_text: 'What is "minting" an NFT?', options: ['Creating and recording an NFT on the blockchain for the first time', 'Selling an NFT on a marketplace', 'Converting crypto to NFTs', 'Burning an old NFT'], correct_index: 0, difficulty: 'easy', explanation: 'Minting is the process of creating an NFT — publishing it to a blockchain, where it receives a unique identifier and becomes permanently recorded.' },
    { question_id: 'nm5', zone: 'nft-marketplace', question_text: 'What is a "floor price" for an NFT collection?', options: ['The maximum price ever paid', 'The lowest listed price for any NFT in a collection', 'The average price of all NFTs in a collection', 'The original mint price'], correct_index: 1, difficulty: 'easy', explanation: 'The floor price is the minimum price you would pay to own any NFT from a collection — it represents the baseline value of the entire collection.' },
  ],
}

function rollDice(): number {
  return Math.floor(Math.random() * 6) + 1
}

function GameBoard() {
  const searchParams = useSearchParams()
  const mode = (searchParams.get('mode') ?? 'standard') as 'standard' | 'practice'

  const [gamePhase, setGamePhase] = useState<GamePhase>('loading')
  const [session, setSession] = useState<SessionState | null>(null)
  const [zones, setZones] = useState<Zone[]>(ALL_ZONES)
  const [currentZone, setCurrentZone] = useState<Zone | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [zoneQuestionsAnswered, setZoneQuestionsAnswered] = useState(0)
  const [zoneCorrect, setZoneCorrect] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [answerRevealed, setAnswerRevealed] = useState(false)
  const [diceValue, setDiceValue] = useState<number | null>(null)
  const [rolling, setRolling] = useState(false)
  const [sessionXP, setSessionXP] = useState(0)
  const [sessionOC, setSessionOC] = useState(0)
  const [message, setMessage] = useState<string | null>(null)
  const [level, setLevel] = useState(1)

  useEffect(() => {
    startGame()
  }, [])

  async function startGame() {
    const res = await fetch('/api/game/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode }),
    })
    const data = await res.json()
    if (!res.ok) {
      setMessage(data.error ?? 'Could not start game')
      setGamePhase('done')
      return
    }
    setSession({
      session_id: data.session.session_id,
      position: 0,
      xp: 0,
      oc: 0,
      assets: [],
      zones_completed: [],
      turn: 0,
      active_effects: [],
    })
    if (data.zones) setZones(data.zones)
    setLevel(data.level ?? 1)
    setGamePhase('board')
  }

  async function handleRoll() {
    if (rolling || !session) return
    setRolling(true)
    setDiceValue(null)

    // Animate dice
    let ticks = 0
    const interval = setInterval(() => {
      setDiceValue(rollDice())
      ticks++
      if (ticks >= 8) {
        clearInterval(interval)
        const final = rollDice()
        setDiceValue(final)
        setRolling(false)
        const newPos = (session.position + final) % ALL_ZONES.length
        const newSession = { ...session, position: newPos, turn: session.turn + 1 }
        setSession(newSession)
        enterZone(newPos, newSession)
      }
    }, 100)
  }

  function enterZone(position: number, currentSession: SessionState) {
    const zone = zones[position]
    if (!zone) return
    setCurrentZone(zone)

    const questions = BOARD_QUESTIONS[zone.id]
    if (!questions || questions.length === 0) {
      // Zone has no questions yet — skip
      setGamePhase('board')
      return
    }

    const q = questions[Math.floor(Math.random() * questions.length)]
    setCurrentQuestion(q)
    setQuestionIndex(0)
    setZoneQuestionsAnswered(0)
    setZoneCorrect(0)
    setSelectedAnswer(null)
    setAnswerRevealed(false)
    setGamePhase('zone-quiz')
  }

  function selectAnswer(index: number) {
    if (answerRevealed || selectedAnswer !== null) return
    setSelectedAnswer(index)
    setAnswerRevealed(true)

    const correct = currentQuestion && index === currentQuestion.correct_index
    const xpGain = correct ? XP_REWARDS.correct_answer : XP_REWARDS.wrong_answer
    const ocGain = correct && mode !== 'practice' ? OC_REWARDS.correct_answer : 0

    setSessionXP(prev => Math.max(0, prev + xpGain))
    setSessionOC(prev => Math.min(25, prev + ocGain))
    if (correct) setZoneCorrect(prev => prev + 1)
    setZoneQuestionsAnswered(prev => prev + 1)
  }

  function nextQuestion() {
    if (!currentZone) return
    const questions = BOARD_QUESTIONS[currentZone.id] ?? []

    // 3 questions per zone visit
    if (zoneQuestionsAnswered >= 2) {
      // Zone complete
      const perfect = zoneCorrect + (selectedAnswer === currentQuestion?.correct_index ? 1 : 0) >= 3
      if (perfect) {
        setSessionXP(prev => prev + XP_REWARDS.perfect_zone)
        if (mode !== 'practice') setSessionOC(prev => Math.min(25, prev + OC_REWARDS.perfect_zone))
      }
      setGamePhase('zone-result')
      return
    }

    const nextQ = questions[Math.floor(Math.random() * questions.length)]
    setCurrentQuestion(nextQ)
    setSelectedAnswer(null)
    setAnswerRevealed(false)
    setZoneQuestionsAnswered(prev => prev + 1)
  }

  async function endGame() {
    if (!session) return
    const updatedZones = session.zones_completed.includes(currentZone?.id ?? '')
      ? session.zones_completed
      : [...session.zones_completed, currentZone?.id ?? '']

    await fetch('/api/game/session', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: session.session_id,
        score: sessionXP,
        zones_completed: updatedZones,
        xp_earned: sessionXP,
        oc_earned: sessionOC,
      }),
    })
    setGamePhase('done')
  }

  // ── RENDER ──────────────────────────────────────────────────────────────────

  if (gamePhase === 'loading') {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-white/40 animate-pulse text-lg">Setting up your game...</div>
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
              <div className="text-white/40 text-xs mb-1">OC Earned</div>
              <div className="font-bold text-amber-400 text-xl">{sessionOC.toFixed(1)}</div>
            </div>
            <div>
              <div className="text-white/40 text-xs mb-1">Level</div>
              <div className="font-bold">{getLevel(sessionXP)} — {LEVEL_NAMES[getLevel(sessionXP)]}</div>
            </div>
            <div>
              <div className="text-white/40 text-xs mb-1">Zones Visited</div>
              <div className="font-bold">{session?.turn ?? 0}</div>
            </div>
          </div>
          <div className="flex gap-3 justify-center">
            <button onClick={startGame} className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors">
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

  if (gamePhase === 'zone-quiz' && currentQuestion) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white">
        <div className="border-b border-white/10 px-6 py-3 flex items-center justify-between text-sm">
          <span className="text-white/40">{currentZone?.emoji} {currentZone?.name}</span>
          <div className="flex gap-4 text-white/50">
            <span className="text-blue-400">{sessionXP} XP</span>
            {mode !== 'practice' && <span className="text-amber-400">{sessionOC.toFixed(1)} OC</span>}
          </div>
        </div>
        <div className="max-w-2xl mx-auto px-6 py-10">
          <div className="text-xs text-white/30 mb-6">Question {zoneQuestionsAnswered + 1} of 3</div>
          <h2 className="text-xl font-semibold mb-8 leading-relaxed">{currentQuestion.question_text}</h2>
          <div className="space-y-3 mb-8">
            {currentQuestion.options.map((opt, i) => {
              let cls = 'border-white/10 bg-white/5 text-white/70 hover:border-white/30 hover:bg-white/8'
              if (answerRevealed) {
                if (i === currentQuestion.correct_index) cls = 'border-green-500 bg-green-500/20 text-white'
                else if (i === selectedAnswer) cls = 'border-red-500 bg-red-500/20 text-white'
                else cls = 'border-white/5 bg-white/3 text-white/30'
              } else if (selectedAnswer === i) {
                cls = 'border-blue-500 bg-blue-500/20 text-white'
              }
              return (
                <button
                  key={i}
                  onClick={() => selectAnswer(i)}
                  disabled={answerRevealed}
                  className={`w-full text-left px-5 py-4 rounded-xl border transition-all ${cls}`}
                >
                  <span className="text-white/30 mr-3">{['A', 'B', 'C', 'D'][i]}.</span>
                  {opt}
                </button>
              )
            })}
          </div>

          {answerRevealed && (
            <div className={`rounded-xl p-5 mb-6 ${selectedAnswer === currentQuestion.correct_index ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
              <div className={`font-semibold mb-2 ${selectedAnswer === currentQuestion.correct_index ? 'text-green-400' : 'text-red-400'}`}>
                {selectedAnswer === currentQuestion.correct_index ? '✓ Correct!' : '✗ Wrong'}
              </div>
              {currentQuestion.explanation && (
                <p className="text-white/70 text-sm">{currentQuestion.explanation}</p>
              )}
            </div>
          )}

          {answerRevealed && (
            <button onClick={nextQuestion} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-colors">
              {zoneQuestionsAnswered >= 2 ? 'Finish Zone' : 'Next Question'}
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
          <div className="text-5xl mb-4">{currentZone?.emoji}</div>
          <h2 className="text-xl font-bold mb-2">{currentZone?.name}</h2>
          <p className="text-white/50 mb-8">Zone complete</p>
          <div className="bg-white/5 border border-white/10 rounded-xl p-5 mb-8 grid grid-cols-2 gap-4 text-center">
            <div><div className="text-white/40 text-xs mb-1">Session XP</div><div className="font-bold text-blue-400">{sessionXP}</div></div>
            {mode !== 'practice' && <div><div className="text-white/40 text-xs mb-1">Session OC</div><div className="font-bold text-amber-400">{sessionOC.toFixed(1)}</div></div>}
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

  // ── BOARD VIEW ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Top bar */}
      <div className="border-b border-white/10 px-6 py-3 flex items-center justify-between text-sm">
        <Link href="/game" className="text-white/40 hover:text-white transition-colors">← Hub</Link>
        <div className="flex gap-5">
          <span className="text-blue-400 font-medium">{sessionXP} XP</span>
          {mode !== 'practice' && <span className="text-amber-400 font-medium">{sessionOC.toFixed(1)} OC</span>}
          <span className="text-white/40">Turn {session?.turn ?? 0}</span>
        </div>
        <button onClick={endGame} className="text-white/30 hover:text-white/60 text-xs transition-colors">End Game</button>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold mb-1">OnlyCrypto City</h1>
          <p className="text-white/40 text-sm">
            {session ? `Position: ${zones[session.position]?.emoji} ${zones[session.position]?.name}` : ''}
          </p>
        </div>

        {/* Zone Grid */}
        <div className="grid grid-cols-4 gap-2 mb-8">
          {zones.map((zone, i) => {
            const isCurrentPosition = session?.position === i
            const isCompleted = session?.zones_completed.includes(zone.id)
            return (
              <div
                key={zone.id}
                className={`relative rounded-xl p-3 text-center transition-all border ${
                  isCurrentPosition
                    ? 'border-white/60 bg-white/15 scale-105 shadow-lg shadow-white/10'
                    : isCompleted
                    ? 'border-green-500/30 bg-green-500/5'
                    : zone.unlocked
                    ? 'border-white/10 bg-white/3 hover:bg-white/5'
                    : 'border-white/5 bg-white/2 opacity-40'
                }`}
              >
                {isCurrentPosition && (
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full font-bold">
                    YOU
                  </div>
                )}
                <div className="text-2xl mb-1">{zone.emoji}</div>
                <div className="text-xs font-medium truncate text-white/80">{zone.name.split(' ')[0]}</div>
                {!zone.unlocked && <div className="text-xs text-white/20 mt-0.5">🔒</div>}
                {isCompleted && <div className="text-xs text-green-400 mt-0.5">✓</div>}
              </div>
            )
          })}
        </div>

        {/* Dice + Roll */}
        <div className="text-center">
          <div className="text-6xl mb-4 transition-all" style={{ transform: rolling ? 'rotate(360deg)' : 'none', transition: rolling ? 'transform 0.1s' : 'none' }}>
            {diceValue === 1 ? '⚀' : diceValue === 2 ? '⚁' : diceValue === 3 ? '⚂' : diceValue === 4 ? '⚃' : diceValue === 5 ? '⚄' : diceValue === 6 ? '⚅' : '🎲'}
          </div>
          <button
            onClick={handleRoll}
            disabled={rolling}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold px-10 py-4 rounded-xl text-lg transition-colors"
          >
            {rolling ? 'Rolling...' : 'Roll Dice'}
          </button>
          {diceValue && !rolling && (
            <p className="text-white/40 text-sm mt-2">Rolled {diceValue} — moved to {zones[session?.position ?? 0]?.name}</p>
          )}
        </div>
      </div>
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
