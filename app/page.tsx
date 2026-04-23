'use client';

import { useRouter } from 'next/navigation';
import { useTheme } from '@/lib/hooks/use-theme';
import { Sun, Moon, Monitor, User } from 'lucide-react';
import { useState } from 'react';
import { useUserProfileStore } from '@/lib/store/user-profile';

const COURSES = [
  {
    id: 'oc-blockchain-basics',
    title: 'Blockchain Foundations',
    description:
      'SHA-256, Merkle trees, Proof-of-Work vs Proof-of-Stake, Byzantine fault tolerance, and the blockchain trilemma.',
    level: 'Beginner',
    scenes: 9,
    emoji: '⛓️',
    gradient: 'from-violet-600 to-purple-700',
    badge: 'bg-violet-500/20 text-violet-300',
  },
  {
    id: 'oc-cryptocurrency-guide',
    title: 'Cryptocurrency Guide',
    description:
      'UTXO model, secp256k1 elliptic-curve cryptography, mining economics, altcoins, and on-chain analysis.',
    level: 'Beginner',
    scenes: 8,
    emoji: '₿',
    gradient: 'from-amber-500 to-orange-600',
    badge: 'bg-amber-500/20 text-amber-300',
  },
  {
    id: 'oc-defi-guide',
    title: 'DeFi Explained',
    description:
      'AMM x×y=k, impermanent loss formula, Aave health factors, yield strategies, flash loans, and MEV.',
    level: 'Intermediate',
    scenes: 8,
    emoji: '🏦',
    gradient: 'from-emerald-500 to-teal-600',
    badge: 'bg-emerald-500/20 text-emerald-300',
  },
  {
    id: 'oc-trading-guide',
    title: 'Trading Fundamentals',
    description:
      'Order books, RSI/MACD/Bollinger, Kelly Criterion, perpetuals, Sharpe ratio, and trading psychology.',
    level: 'Intermediate',
    scenes: 8,
    emoji: '📊',
    gradient: 'from-blue-500 to-indigo-600',
    badge: 'bg-blue-500/20 text-blue-300',
  },
  {
    id: 'oc-security-wallets',
    title: 'Security & Wallets',
    description:
      'BIP39/44 seed derivation, wallet types, attack vectors, multisig setups, and XRPL account security.',
    level: 'Intermediate',
    scenes: 7,
    emoji: '🔐',
    gradient: 'from-red-500 to-rose-600',
    badge: 'bg-red-500/20 text-red-300',
  },
  {
    id: 'oc-ecosystem',
    title: 'Crypto in the Real World',
    description:
      'Tokenomics, Layer-2 rollups, governance systems, RWA tokenization, and institutional crypto adoption.',
    level: 'Advanced',
    scenes: 7,
    emoji: '🌍',
    gradient: 'from-cyan-500 to-sky-600',
    badge: 'bg-cyan-500/20 text-cyan-300',
  },
  {
    id: 'oc-xrpl-deepdive',
    title: 'XRPL Deep Dive',
    description:
      'RPCA consensus, trust lines, native DEX + AMM, pathfinding, ODL, and why OnlyCrypto runs on XRPL.',
    level: 'Advanced',
    scenes: 8,
    emoji: '🔵',
    gradient: 'from-sky-400 to-blue-600',
    badge: 'bg-sky-500/20 text-sky-300',
  },
];

const LEVEL_ORDER: Record<string, number> = { Beginner: 0, Intermediate: 1, Advanced: 2 };

export default function HomePage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [themeOpen, setThemeOpen] = useState(false);
  const { nickname, setNickname } = useUserProfileStore();
  const [nameInput, setNameInput] = useState(nickname);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-gray-950/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-xs font-black">
            OC
          </div>
          <span className="font-bold text-white text-sm tracking-tight">OC Academy</span>
        </div>
        <div className="relative">
          <button
            onClick={() => setThemeOpen((o) => !o)}
            className="p-2 rounded-full text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            {theme === 'light' && <Sun className="w-4 h-4" />}
            {theme === 'dark' && <Moon className="w-4 h-4" />}
            {theme === 'system' && <Monitor className="w-4 h-4" />}
          </button>
          {themeOpen && (
            <div className="absolute top-full mt-2 right-0 bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden z-50 min-w-[140px]">
              {(['light', 'dark', 'system'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setTheme(t);
                    setThemeOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-700 transition-colors flex items-center gap-2 capitalize"
                >
                  {t === 'light' && <Sun className="w-4 h-4" />}
                  {t === 'dark' && <Moon className="w-4 h-4" />}
                  {t === 'system' && <Monitor className="w-4 h-4" />}
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Hero */}
      <div className="px-6 pt-14 pb-10 text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 text-blue-400 text-sm font-medium mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          Interactive AI Classrooms
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
          Master Crypto &amp; Web3
        </h1>
        <p className="text-gray-400 text-lg leading-relaxed mb-8">
          University-level courses taught by AI instructors. Real formulas, real statistics, live
          simulations.
        </p>

        {/* Name input */}
        <div className="flex items-center gap-3 max-w-sm mx-auto">
          <div className="flex-1 relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Your name (optional)"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onBlur={() => setNickname(nameInput.trim())}
              onKeyDown={(e) => e.key === 'Enter' && setNickname(nameInput.trim())}
              className="w-full pl-9 pr-4 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all"
            />
          </div>
          {nickname && (
            <div className="text-sm text-gray-400 shrink-0">
              Welcome, <span className="text-white font-semibold">{nickname}</span> 👋
            </div>
          )}
        </div>
      </div>

      {/* Course Grid */}
      <main className="max-w-6xl mx-auto px-6 pb-20">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500">
            {COURSES.length} Courses Available
          </h2>
          <div className="flex gap-2 text-xs">
            {(['Beginner', 'Intermediate', 'Advanced'] as const).map((lvl) => (
              <span
                key={lvl}
                className={`px-2.5 py-1 rounded-full font-medium ${
                  lvl === 'Beginner'
                    ? 'bg-green-500/10 text-green-400'
                    : lvl === 'Intermediate'
                      ? 'bg-yellow-500/10 text-yellow-400'
                      : 'bg-red-500/10 text-red-400'
                }`}
              >
                {lvl}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {COURSES.sort((a, b) => LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level]).map((course) => (
            <button
              key={course.id}
              onClick={() => router.push(`/classroom/${course.id}`)}
              className="group relative text-left bg-gray-900 border border-white/5 rounded-2xl overflow-hidden hover:border-white/20 hover:shadow-2xl hover:shadow-black/40 transition-all duration-300 hover:-translate-y-1"
            >
              {/* Gradient top bar */}
              <div className={`h-1.5 bg-gradient-to-r ${course.gradient}`} />

              <div className="p-5">
                {/* Icon + badge row */}
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${course.gradient} flex items-center justify-center text-2xl shadow-lg`}
                  >
                    {course.emoji}
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        course.level === 'Beginner'
                          ? 'bg-green-500/10 text-green-400'
                          : course.level === 'Intermediate'
                            ? 'bg-yellow-500/10 text-yellow-400'
                            : 'bg-red-500/10 text-red-400'
                      }`}
                    >
                      {course.level}
                    </span>
                    <span className="text-xs text-gray-500">{course.scenes} scenes</span>
                  </div>
                </div>

                <h3 className="text-base font-bold text-white mb-2 group-hover:text-white transition-colors">
                  {course.title}
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed line-clamp-3">
                  {course.description}
                </p>
              </div>

              {/* Start CTA */}
              <div className="px-5 pb-5">
                <div
                  className={`w-full py-2.5 rounded-xl bg-gradient-to-r ${course.gradient} text-white text-sm font-bold text-center opacity-0 group-hover:opacity-100 transition-all duration-200 -translate-y-1 group-hover:translate-y-0`}
                >
                  Start Lesson →
                </div>
              </div>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
