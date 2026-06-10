import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'OnlyCrypto Academy — Master Crypto & Web3',
  description:
    'Interactive AI-powered crypto education. 25 courses across 3 levels. XRP trading strategy, DeFi, blockchain, and the OnlyCrypto City game. Get instant access for $49.',
}

const COURSES = [
  { emoji: '₿', title: 'Cryptocurrency', desc: 'Markets, tokenomics, halving cycles, on-chain analysis' },
  { emoji: '⛓️', title: 'Blockchain', desc: 'Consensus, Merkle trees, PoW vs PoS vs RPCA, L1 vs L2' },
  { emoji: '🏦', title: 'DeFi', desc: 'AMMs, yield strategies, flash loans, protocol architecture' },
  { emoji: '📊', title: 'Trading', desc: 'RSI, MACD, Kelly Criterion, position sizing, risk management' },
  { emoji: '🔐', title: 'Security & Wallets', desc: 'Seed derivation, multisig, attack vectors, XRPL accounts' },
  { emoji: '🔵', title: 'XRPL Deep Dive', desc: 'RPCA consensus, trust lines, native DEX, ODL, micropayments' },
  { emoji: '🌍', title: 'Real World Crypto', desc: 'RWA tokenization, SEC/MiCA regulation, banking integration' },
  { emoji: '🌉', title: 'Swapping & Bridging', desc: 'Concentrated liquidity, MEV, ZK bridges, advanced settings' },
]

const FEATURES = [
  {
    icon: '🤖',
    title: 'AI-Powered Classrooms',
    desc: 'Ask questions mid-lesson and get instant answers from the AI. Not a pre-recorded video — a live interactive classroom.',
  },
  {
    icon: '🎤',
    title: 'Voice Narrated',
    desc: "Ava's neural voice walks you through every slide. You learn by listening, not just reading.",
  },
  {
    icon: '🏙️',
    title: 'OnlyCrypto City Game',
    desc: 'Earn OC coin while you learn. 5 game modes — Tournament, Duel, Roulette, Pot Room, and Standard.',
  },
  {
    icon: '🏆',
    title: '100-Question Final Exam',
    desc: 'Covers all 3 levels — Elementary, High School, and College. Score 80%+ to earn your certificate.',
  },
  {
    icon: '📚',
    title: 'A–Z Crypto Glossary',
    desc: 'Every term defined clearly, searchable, always up to date. The cheat sheet you always wanted.',
  },
  {
    icon: '🔵',
    title: 'XRPL Trading Strategy',
    desc: 'The XRP Momentum strategy used by OnlyCrypto Pro traders — available here in depth.',
  },
]

const ACCESS_URL = 'https://onlycrypto.io/academy/access'
const OC_JOIN_URL = 'https://onlycrypto.io/auth/signup?ref=divinity2'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#080810] text-white">
      {/* Nav */}
      <nav className="border-b border-white/5 px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-xs font-black">
            OC
          </div>
          <span className="font-bold text-white tracking-tight">OnlyCrypto Academy</span>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="https://onlycrypto.io"
            className="text-sm text-gray-400 hover:text-white transition-colors hidden sm:block"
          >
            OnlyCrypto.io
          </a>
          <a
            href={ACCESS_URL}
            className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-bold text-sm transition-colors"
          >
            Get Access — $49
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 text-blue-400 text-sm font-medium mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          Interactive AI-Powered Crypto Education
        </div>
        <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-5 leading-tight">
          Master Crypto &amp; Web3<br />
          <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
            in 25 Courses
          </span>
        </h1>
        <p className="text-gray-400 text-xl leading-relaxed mb-10 max-w-2xl mx-auto">
          Three learning levels. AI that answers your questions mid-lesson. An XRP trading strategy, a crypto city game, and a 100-question final exam. One price. Lifetime access.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href={ACCESS_URL}
            className="w-full sm:w-auto px-10 py-4 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-black text-base uppercase tracking-widest transition-colors shadow-xl shadow-blue-500/20"
          >
            Get Instant Access — $49
          </a>
          <a
            href="https://onlycrypto.io/auth/signup?ref=divinity2"
            className="w-full sm:w-auto px-10 py-4 rounded-xl border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-white font-bold text-base transition-colors"
          >
            Join OnlyCrypto (includes academy)
          </a>
        </div>
        <p className="text-xs text-gray-600 mt-4">
          Already a Pro member?{' '}
          <a href="https://onlycrypto.io/dashboard" className="text-blue-400 hover:underline">
            Log in to OnlyCrypto → Enter Academy
          </a>
        </p>
      </section>

      {/* Stats bar */}
      <div className="border-y border-white/5 bg-white/[0.02] py-6">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {[
            { value: '25', label: 'Courses' },
            { value: '3', label: 'Levels' },
            { value: '100', label: 'Exam Questions' },
            { value: '$49', label: 'One-Time Access' },
          ].map(({ value, label }) => (
            <div key={label}>
              <div className="text-3xl font-black text-white">{value}</div>
              <div className="text-xs text-gray-500 mt-1 uppercase tracking-widest">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Levels */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <h2 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-8 text-center">Three Learning Levels</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { emoji: '🌱', name: 'Elementary', color: 'emerald', desc: '9 courses — brand new to crypto. Plain language, real examples, no jargon.', tag: 'Start Here' },
            { emoji: '📚', name: 'High School', color: 'amber', desc: '8 courses — some basics down. Real terminology, practical concepts.', tag: 'Level Up' },
            { emoji: '🎓', name: 'College', color: 'blue', desc: '8 courses — ready to go deep. Formulas, simulations, advanced mechanics.', tag: 'Go Deep' },
          ].map(({ emoji, name, color, desc, tag }) => (
            <div
              key={name}
              className={`p-5 rounded-2xl border border-${color}-500/20 bg-${color}-500/5`}
            >
              <div className="text-3xl mb-3">{emoji}</div>
              <div className="flex items-center gap-2 mb-2">
                <span className={`font-black text-${color}-400`}>{name}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-${color}-500/10 text-${color}-400 border border-${color}-500/20`}>{tag}</span>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* What's inside — courses */}
      <section className="max-w-4xl mx-auto px-6 pb-16">
        <h2 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-8 text-center">What You&apos;ll Learn</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {COURSES.map(({ emoji, title, desc }) => (
            <div
              key={title}
              className="flex items-start gap-4 p-4 rounded-xl border border-white/5 bg-white/[0.03] hover:border-white/10 transition-colors"
            >
              <span className="text-2xl shrink-0">{emoji}</span>
              <div>
                <p className="font-bold text-white text-sm">{title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-white/5 bg-white/[0.02] py-16">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-8 text-center">What Makes It Different</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ icon, title, desc }) => (
              <div key={title} className="p-5 rounded-2xl border border-white/5 bg-white/[0.03]">
                <div className="text-3xl mb-3">{icon}</div>
                <h3 className="font-bold text-white text-sm mb-1.5">{title}</h3>
                <p className="text-xs text-gray-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-3xl mx-auto px-6 py-20">
        <h2 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-10 text-center">Choose Your Path</h2>
        <div className="grid sm:grid-cols-2 gap-6">
          {/* Standalone */}
          <div className="relative p-7 rounded-2xl border border-blue-500/40 bg-blue-500/5">
            <div className="absolute -top-3 left-6">
              <span className="text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full bg-blue-500 text-white">
                Academy Only
              </span>
            </div>
            <div className="mt-2 mb-5">
              <div className="flex items-end gap-2 mb-1">
                <span className="text-4xl font-black text-white">$49</span>
                <span className="text-gray-500 text-sm mb-1">one-time</span>
              </div>
              <p className="text-sm text-gray-400">Full academy access. No subscription. Pay once, learn forever.</p>
            </div>
            <ul className="space-y-2.5 mb-7">
              {[
                '25 AI-powered courses (all 3 levels)',
                'OnlyCrypto City game (all 5 modes)',
                '100-question final exam + certificate',
                'A–Z crypto glossary',
                'XRP Momentum trading strategy',
                'Lifetime access',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-gray-300">
                  <svg className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
            <a
              href={ACCESS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center py-3.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-black uppercase tracking-widest text-xs transition-colors"
            >
              Buy Access — $49
            </a>
          </div>

          {/* Pro membership */}
          <div className="p-7 rounded-2xl border border-white/10 bg-white/[0.03]">
            <div className="mb-5">
              <div className="flex items-end gap-2 mb-1">
                <span className="text-4xl font-black text-white">$249</span>
                <span className="text-gray-500 text-sm mb-1">/month</span>
              </div>
              <p className="text-sm text-gray-400">Full OnlyCrypto Pro membership — academy included plus trading signals, referral income, and more.</p>
            </div>
            <ul className="space-y-2.5 mb-7">
              {[
                'Everything in Academy Only',
                '3 professional traders to follow',
                'Live trading signals + session access',
                'Referral commissions (up to $50/member)',
                'OCC token rewards',
                'Network of 1,000+ crypto members',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-gray-300">
                  <svg className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
            <a
              href="https://onlycrypto.io/auth/signup?ref=divinity2"
              className="block w-full text-center py-3.5 rounded-xl border border-white/10 hover:border-white/20 hover:bg-white/5 text-white font-bold text-xs uppercase tracking-widest transition-colors"
            >
              Join OnlyCrypto Pro →
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-10 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-[10px] font-black">
            OC
          </div>
          <span className="font-bold text-sm text-gray-400">OnlyCrypto Academy</span>
        </div>
        <p className="text-xs text-gray-600">
          by{' '}
          <a href="https://onlycrypto.io" className="text-gray-500 hover:text-white transition-colors">
            OnlyCrypto.io
          </a>
          {' '}·{' '}
          <a href="https://onlycrypto.io/academy/whitelabel" className="text-gray-500 hover:text-white transition-colors">
            White-Label Licensing
          </a>
        </p>
      </footer>
    </div>
  )
}
