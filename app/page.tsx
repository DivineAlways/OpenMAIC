'use client';

import { useRouter } from 'next/navigation';
import { useTheme } from '@/lib/hooks/use-theme';
import { Sun, Moon, Monitor, User, RotateCcw, CheckCircle2, GraduationCap, Star, Trophy } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useUserProfileStore } from '@/lib/store/user-profile';
import { getProgress } from '@/lib/utils/course-progress';

const ELEMENTARY_COURSES = [
  { id: 'oc-elem-blockchain', title: 'What is Blockchain?', description: 'The shared digital notebook explained in plain language. No prior knowledge needed.', scenes: 4, emoji: '🔗', gradient: 'from-emerald-500 to-teal-600' },
  { id: 'oc-elem-crypto', title: 'What is Cryptocurrency?', description: 'Digital money, famous coins like BTC, ETH & XRP, and how to stay safe.', scenes: 3, emoji: '🪙', gradient: 'from-amber-500 to-orange-600' },
  { id: 'oc-elem-defi', title: 'What is DeFi?', description: 'Banking without banks — smart contracts explained with a vending machine analogy.', scenes: 3, emoji: '🏗️', gradient: 'from-green-500 to-emerald-600' },
  { id: 'oc-elem-trading', title: 'Intro to Trading', description: 'Buy low, sell high, and how copy trading lets you follow experts automatically.', scenes: 3, emoji: '📈', gradient: 'from-blue-500 to-indigo-600' },
  { id: 'oc-elem-wallets', title: 'Wallets & Safety', description: 'Public vs private keys, hot vs cold wallets, and seed phrase rules every beginner must know.', scenes: 3, emoji: '👛', gradient: 'from-red-500 to-rose-600' },
  { id: 'oc-elem-ecosystem', title: 'The Crypto World', description: 'NFTs, DAOs, Web3, and how crypto is being used in the real world today.', scenes: 3, emoji: '🌍', gradient: 'from-cyan-500 to-sky-600' },
  { id: 'oc-elem-security', title: 'Staying Safe in Crypto', description: 'Common scams explained simply, 2FA setup, and a safety checklist for beginners.', scenes: 3, emoji: '🛡️', gradient: 'from-rose-500 to-red-600' },
  { id: 'oc-elem-vault', title: 'Beginner Video Vault', description: 'How to learn from crypto videos + a starter glossary of terms you\'ll hear everywhere.', scenes: 3, emoji: '🎬', gradient: 'from-violet-500 to-purple-600' },
];

const COLLEGE_COURSES = [
  { id: 'oc-blockchain-basics', title: 'Blockchain Foundations', description: 'SHA-256, Merkle trees, Proof-of-Work vs Proof-of-Stake, Byzantine fault tolerance, and the blockchain trilemma.', level: 'Beginner', scenes: 9, emoji: '⛓️', gradient: 'from-violet-600 to-purple-700' },
  { id: 'oc-cryptocurrency-guide', title: 'Cryptocurrency Guide', description: 'UTXO model, secp256k1 elliptic-curve cryptography, mining economics, altcoins, and on-chain analysis.', level: 'Beginner', scenes: 8, emoji: '₿', gradient: 'from-amber-500 to-orange-600' },
  { id: 'oc-defi-guide', title: 'DeFi Explained', description: 'AMM x×y=k, impermanent loss formula, Aave health factors, yield strategies, flash loans, and MEV.', level: 'Intermediate', scenes: 8, emoji: '🏦', gradient: 'from-emerald-500 to-teal-600' },
  { id: 'oc-trading-guide', title: 'Trading Fundamentals', description: 'Order books, RSI/MACD/Bollinger, Kelly Criterion, perpetuals, Sharpe ratio, and trading psychology.', level: 'Intermediate', scenes: 8, emoji: '📊', gradient: 'from-blue-500 to-indigo-600' },
  { id: 'oc-security-wallets', title: 'Security & Wallets', description: 'BIP39/44 seed derivation, wallet types, attack vectors, multisig setups, and XRPL account security.', level: 'Intermediate', scenes: 7, emoji: '🔐', gradient: 'from-red-500 to-rose-600' },
  { id: 'oc-ecosystem', title: 'Crypto in the Real World', description: 'Tokenomics, Layer-2 rollups, governance systems, RWA tokenization, and institutional crypto adoption.', level: 'Advanced', scenes: 7, emoji: '🌍', gradient: 'from-cyan-500 to-sky-600' },
  { id: 'oc-xrpl-deepdive', title: 'XRPL Deep Dive', description: 'RPCA consensus, trust lines, native DEX + AMM, pathfinding, ODL, and why OnlyCrypto runs on XRPL.', level: 'Advanced', scenes: 8, emoji: '🔵', gradient: 'from-sky-400 to-blue-600' },
];

const HIGH_SCHOOL_COURSES = [
  { id: 'oc-hs-blockchain', title: 'Blockchain Intermediate', description: 'Mining mechanics, PoW vs PoS vs RPCA consensus, hash functions, Merkle trees, and the blockchain trilemma.', scenes: 4, emoji: '⛓️', gradient: 'from-amber-500 to-orange-600' },
  { id: 'oc-hs-crypto', title: 'Crypto Markets', description: 'Market cap tiers, tokenomics, Bitcoin halving cycles, reading price action, and evaluating altcoins.', scenes: 4, emoji: '🪙', gradient: 'from-yellow-500 to-amber-600' },
  { id: 'oc-hs-defi', title: 'DeFi Mechanics', description: 'Liquidity pools, AMM x·y=k formula, impermanent loss, yield farming, smart contract risks, and XRPL.', scenes: 4, emoji: '🏦', gradient: 'from-orange-500 to-amber-600' },
  { id: 'oc-hs-trading', title: 'Technical Trading', description: 'Candlestick patterns, support & resistance, RSI & MACD, order types, risk-reward ratio, and copy trading.', scenes: 4, emoji: '📊', gradient: 'from-amber-600 to-yellow-600' },
  { id: 'oc-hs-wallets', title: 'Wallets & Keys', description: 'BIP39 seed phrase cryptography, private/public key derivation, hot vs cold storage, and attack vectors.', scenes: 4, emoji: '🔐', gradient: 'from-orange-600 to-red-600' },
  { id: 'oc-hs-ecosystem', title: 'Crypto Ecosystem', description: 'L1 vs L2, rollup types, cross-chain bridges, DAOs, RWA tokenization, and institutional adoption.', scenes: 4, emoji: '🌍', gradient: 'from-amber-500 to-yellow-500' },
  { id: 'oc-hs-security', title: 'Security', description: 'Phishing deep dive, rug pull red flags, smart contract exploits, OPSEC, SIM swaps, CEX vs DEX risks.', scenes: 4, emoji: '🛡️', gradient: 'from-red-500 to-orange-600' },
];

const COLLEGE_LEVEL_ORDER: Record<string, number> = { Beginner: 0, Intermediate: 1, Advanced: 2 };

type Level = 'elementary' | 'highschool' | 'college';

function LevelProgressBar({ completedIds, courseIds, label }: {
  completedIds: string[]; courseIds: string[]; label: string;
}) {
  const done = courseIds.filter(id => completedIds.includes(id)).length;
  const total = courseIds.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-gray-500 font-medium">{label} Progress</span>
        <span className="text-xs font-bold text-gray-400">{done}/{total} completed · {pct}%</span>
      </div>
      <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-violet-500 rounded-full transition-[width] duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function CourseCard({ id, emoji, gradient, title, description, badge, scenes, completed, onClick }: {
  id: string; emoji: string; gradient: string; title: string; description: string;
  badge?: string; scenes: number; completed?: boolean; onClick: () => void;
}) {
  return (
    <button
      key={id}
      onClick={onClick}
      className={`group relative text-left rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/40 ${
        completed
          ? 'bg-violet-950/40 border border-violet-500/30 hover:border-violet-500/50'
          : 'bg-gray-900 border border-white/5 hover:border-white/20'
      }`}
    >
      <div className={`h-1.5 bg-gradient-to-r ${gradient}`} />
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-2xl shadow-lg`}>
            {emoji}
          </div>
          <div className="flex flex-col items-end gap-1.5">
            {completed && (
              <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-violet-500/15 text-violet-400">
                <CheckCircle2 className="w-3 h-3" /> Done
              </span>
            )}
            {badge && !completed && (
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                badge === 'Beginner' ? 'bg-green-500/10 text-green-400' :
                badge === 'Intermediate' ? 'bg-yellow-500/10 text-yellow-400' :
                'bg-red-500/10 text-red-400'
              }`}>{badge}</span>
            )}
            <span className="text-xs text-gray-500">{scenes} scenes</span>
          </div>
        </div>
        <h3 className="text-base font-bold text-white mb-2">{title}</h3>
        <p className="text-sm text-gray-400 leading-relaxed line-clamp-3">{description}</p>
      </div>
      <div className="px-5 pb-5">
        <div className={`w-full py-2.5 rounded-xl bg-gradient-to-r ${gradient} text-white text-sm font-bold text-center opacity-0 group-hover:opacity-100 transition-all duration-200 -translate-y-1 group-hover:translate-y-0`}>
          {completed ? 'Review Lesson →' : 'Start Lesson →'}
        </div>
      </div>
    </button>
  );
}

const RESUME_KEY = 'oc_last_course';

function getLastCourse(): { id: string; title: string; level: string } | null {
  try {
    const raw = localStorage.getItem(RESUME_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveLastCourse(id: string, title: string, level: string) {
  try { localStorage.setItem(RESUME_KEY, JSON.stringify({ id, title, level })); } catch {}
}

export default function HomePage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [themeOpen, setThemeOpen] = useState(false);
  const { nickname, setNickname } = useUserProfileStore();
  const [nameInput, setNameInput] = useState(nickname);
  const [activeLevel, setActiveLevel] = useState<Level>('elementary');
  const [lastCourse, setLastCourse] = useState<{ id: string; title: string; level: string } | null>(null);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [showGraduation, setShowGraduation] = useState(false);
  const [showHSGraduation, setShowHSGraduation] = useState(false);
  const [showCollegeGraduation, setShowCollegeGraduation] = useState(false);

  const ELEMENTARY_IDS = ELEMENTARY_COURSES.map(c => c.id);
  const HS_IDS = HIGH_SCHOOL_COURSES.map(c => c.id);
  const COLLEGE_IDS = COLLEGE_COURSES.map(c => c.id);

  useEffect(() => {
    const prev = getProgress().completedIds;
    setLastCourse(getLastCourse());
    setCompletedIds(prev);
  }, []);

  // Show graduation modal the first time all Elementary courses are complete
  useEffect(() => {
    if (completedIds.length === 0) return;
    const allElemDone = ELEMENTARY_IDS.every(id => completedIds.includes(id));
    if (allElemDone && !localStorage.getItem('oc_grad_elementary')) {
      localStorage.setItem('oc_grad_elementary', '1');
      setShowGraduation(true);
      return;
    }
    const allHSDone = HS_IDS.every(id => completedIds.includes(id));
    if (allHSDone && !localStorage.getItem('oc_grad_highschool')) {
      localStorage.setItem('oc_grad_highschool', '1');
      setShowHSGraduation(true);
      return;
    }
    const allCollegeDone = COLLEGE_IDS.every(id => completedIds.includes(id));
    if (allCollegeDone && !localStorage.getItem('oc_grad_college')) {
      localStorage.setItem('oc_grad_college', '1');
      setShowCollegeGraduation(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completedIds]);

  const goToCourse = (id: string, title: string, level: string) => {
    saveLastCourse(id, title, level);
    router.push(`/classroom/${id}`);
  };

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
                <button key={t} onClick={() => { setTheme(t); setThemeOpen(false); }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-700 transition-colors flex items-center gap-2 capitalize">
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
          Three learning levels. Start where you are. Level up at your own pace.
        </p>
        <div className="flex items-center gap-3 max-w-sm mx-auto">
          <div className="flex-1 relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input type="text" placeholder="Your name (optional)" value={nameInput}
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

      {/* Resume Banner */}
      {lastCourse && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 mb-4">
          <div className="flex items-center justify-between gap-4 bg-violet-500/10 border border-violet-500/30 rounded-2xl px-5 py-3.5">
            <div className="flex items-center gap-3">
              <RotateCcw className="w-4 h-4 text-violet-400 shrink-0" />
              <div>
                <p className="text-sm font-bold text-white">Resume where you left off</p>
                <p className="text-xs text-gray-400 capitalize">{lastCourse.title} — {lastCourse.level}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => goToCourse(lastCourse.id, lastCourse.title, lastCourse.level)}
                className="px-4 py-1.5 bg-violet-500 hover:bg-violet-600 text-white text-xs font-bold rounded-lg transition-colors"
              >
                Continue
              </button>
              <button
                onClick={() => setLastCourse(null)}
                className="px-3 py-1.5 text-gray-500 hover:text-gray-300 text-xs transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Level Selector */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
{/* Elementary */}
        <button onClick={() => setActiveLevel('elementary')}
          className={`p-3 sm:p-4 rounded-2xl border text-left transition-all ${activeLevel === 'elementary' ? 'border-emerald-500/60 bg-emerald-500/10 shadow-lg' : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'}`}
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-xl sm:text-2xl shrink-0">🌱</span>
            <div className="flex-1 min-w-0 overflow-hidden">
              <p className={`font-black text-sm ${activeLevel === 'elementary' ? 'text-emerald-400' : 'text-white'}`}>Elementary</p>
              <p className="text-xs text-gray-500 truncate">Brand new to crypto</p>
            </div>
            {activeLevel === 'elementary' && <div className="h-2 w-2 rounded-full bg-emerald-400 shrink-0 ml-auto" />}
          </div>
        </button>
{/* High School */}
        <button onClick={() => setActiveLevel('highschool')}
          className={`p-3 sm:p-4 rounded-2xl border text-left transition-all ${activeLevel === 'highschool' ? 'border-amber-500/60 bg-amber-500/10 shadow-lg' : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'}`}
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-xl sm:text-2xl shrink-0">📚</span>
            <div className="flex-1 min-w-0 overflow-hidden">
              <p className={`font-black text-sm ${activeLevel === 'highschool' ? 'text-amber-400' : 'text-white'}`}>High School</p>
              <p className="text-xs text-gray-500 truncate">Some basics down</p>
            </div>
            {activeLevel === 'highschool' && <div className="h-2 w-2 rounded-full bg-amber-400 shrink-0 ml-auto" />}
          </div>
        </button>
{/* College */}
        <button onClick={() => setActiveLevel('college')}
          className={`p-3 sm:p-4 rounded-2xl border text-left transition-all ${activeLevel === 'college' ? 'border-blue-500/60 bg-blue-500/10 shadow-lg' : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'}`}
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-xl sm:text-2xl shrink-0">🎓</span>
            <div className="flex-1 min-w-0 overflow-hidden">
              <p className={`font-black text-sm ${activeLevel === 'college' ? 'text-blue-400' : 'text-white'}`}>College</p>
              <p className="text-xs text-gray-500 truncate">Ready to go deep</p>
            </div>
            {activeLevel === 'college' && <div className="h-2 w-2 rounded-full bg-blue-400 shrink-0 ml-auto" />}
          </div>
        </button>
        </div>
      </div>

      {/* Course Grid */}
      <main className="max-w-6xl mx-auto px-6 pb-20">
        {activeLevel === 'elementary' && (
          <>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500">🌱 Elementary — {ELEMENTARY_COURSES.length} Classrooms</h2>
                <p className="text-xs text-gray-600 mt-1">Plain language, real examples, no prior knowledge needed</p>
              </div>
            </div>
            <LevelProgressBar
              completedIds={completedIds}
              courseIds={ELEMENTARY_COURSES.map(c => c.id)}
              label="Elementary"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {ELEMENTARY_COURSES.map((course) => (
                <CourseCard key={course.id} {...course} completed={completedIds.includes(course.id)} onClick={() => goToCourse(course.id, course.title, 'elementary')} />
              ))}
            </div>
          </>
        )}

        {activeLevel === 'highschool' && (
          <>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500">📚 High School — {HIGH_SCHOOL_COURSES.length} Classrooms</h2>
                <p className="text-xs text-gray-600 mt-1">Real terminology, practical concepts, and intermediate mechanics</p>
              </div>
            </div>
            <LevelProgressBar
              completedIds={completedIds}
              courseIds={HIGH_SCHOOL_COURSES.map(c => c.id)}
              label="High School"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {HIGH_SCHOOL_COURSES.map((course) => (
                <CourseCard key={course.id} {...course} completed={completedIds.includes(course.id)} onClick={() => goToCourse(course.id, course.title, 'highschool')} />
              ))}
            </div>
          </>
        )}

        {activeLevel === 'college' && (
          <>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500">🎓 College — {COLLEGE_COURSES.length} Classrooms</h2>
                <p className="text-xs text-gray-600 mt-1">Deep technical content — formulas, real statistics, live simulations</p>
              </div>
              <div className="flex gap-2 text-xs">
                {(['Beginner', 'Intermediate', 'Advanced'] as const).map((lvl) => (
                  <span key={lvl} className={`px-2.5 py-1 rounded-full font-medium ${
                    lvl === 'Beginner' ? 'bg-green-500/10 text-green-400' :
                    lvl === 'Intermediate' ? 'bg-yellow-500/10 text-yellow-400' :
                    'bg-red-500/10 text-red-400'
                  }`}>{lvl}</span>
                ))}
              </div>
            </div>
            <LevelProgressBar
              completedIds={completedIds}
              courseIds={COLLEGE_COURSES.map(c => c.id)}
              label="College"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {COLLEGE_COURSES.sort((a, b) => COLLEGE_LEVEL_ORDER[a.level] - COLLEGE_LEVEL_ORDER[b.level]).map((course) => (
                <CourseCard key={course.id} {...course} badge={course.level} completed={completedIds.includes(course.id)} onClick={() => goToCourse(course.id, course.title, 'college')} />
              ))}
            </div>
          </>
        )}
      </main>

      {/* Graduation ceremony — Elementary */}
      {showGraduation && (
        <GraduationModal
          title="Elementary Graduated!"
          subtitle="Level Complete"
          body="You completed all 8 Elementary courses. You now understand blockchain, crypto, DeFi, trading, wallets, and Web3 — from scratch. That's real knowledge."
          unlockText="High School level is now unlocked"
          ctaLabel="Start High School Level"
          onCta={() => { setShowGraduation(false); setActiveLevel('highschool'); }}
          onClose={() => setShowGraduation(false)}
          accentClass="from-violet-500 to-indigo-600"
          shadowClass="shadow-violet-500/20"
          borderClass="border-violet-500/40"
          textClass="text-violet-400"
        />
      )}

      {/* Graduation ceremony — High School */}
      {showHSGraduation && (
        <GraduationModal
          title="High School Graduated!"
          subtitle="Level Complete"
          body="You completed all 7 High School courses. You can read charts, understand tokenomics, evaluate DeFi protocols, and know how to stay safe on-chain. Serious knowledge."
          unlockText="College level is now unlocked"
          ctaLabel="Start College Level"
          onCta={() => { setShowHSGraduation(false); setActiveLevel('college'); }}
          onClose={() => setShowHSGraduation(false)}
          accentClass="from-amber-500 to-orange-600"
          shadowClass="shadow-amber-500/20"
          borderClass="border-amber-500/40"
          textClass="text-amber-400"
        />
      )}

      {/* Graduation ceremony — College */}
      {showCollegeGraduation && (
        <GraduationModal
          title="College Graduated!"
          subtitle="Full Curriculum Complete"
          body="You completed the entire OC Academy — all 22 courses across Elementary, High School, and College. You now have institutional-grade crypto knowledge. That's elite."
          unlockText="You've mastered the full OnlyCrypto curriculum"
          ctaLabel="Back to Dashboard"
          onCta={() => setShowCollegeGraduation(false)}
          onClose={() => setShowCollegeGraduation(false)}
          accentClass="from-blue-500 to-cyan-500"
          shadowClass="shadow-blue-500/20"
          borderClass="border-blue-500/40"
          textClass="text-blue-400"
        />
      )}
    </div>
  );
}

function GraduationModal({
  title, subtitle, body, unlockText, ctaLabel, onCta, onClose,
  accentClass, shadowClass, borderClass, textClass,
}: {
  title: string; subtitle: string; body: string; unlockText: string;
  ctaLabel: string; onCta: () => void; onClose: () => void;
  accentClass: string; shadowClass: string; borderClass: string; textClass: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
      <div className={`relative bg-gray-900 border ${borderClass} rounded-3xl p-8 max-w-md w-full text-center shadow-2xl ${shadowClass} overflow-hidden`}>
        {[...Array(18)].map((_, i) => (
          <span
            key={i}
            className="absolute rounded-full animate-ping"
            style={{
              width: `${6 + (i % 4) * 3}px`,
              height: `${6 + (i % 4) * 3}px`,
              top: `${Math.sin(i * 1.4) * 40 + 50}%`,
              left: `${(i / 18) * 100}%`,
              background: ['#a78bfa','#34d399','#60a5fa','#fbbf24','#f472b6'][i % 5],
              animationDuration: `${1.2 + (i % 5) * 0.3}s`,
              animationDelay: `${(i % 6) * 0.1}s`,
              opacity: 0.7,
            }}
          />
        ))}
        <div className="relative z-10">
          <div className="flex items-center justify-center mb-4">
            <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${accentClass} flex items-center justify-center shadow-2xl`}>
              <GraduationCap className="w-12 h-12 text-white" />
            </div>
          </div>
          <div className="flex items-center justify-center gap-1 mb-2">
            {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />)}
          </div>
          <p className={`text-xs font-black uppercase tracking-widest ${textClass} mb-1`}>{subtitle}</p>
          <h2 className="text-3xl font-black text-white mb-3">{title}</h2>
          <p className="text-gray-400 text-sm mb-2 leading-relaxed">{body}</p>
          <div className={`flex items-center justify-center gap-2 mb-6 text-emerald-400 text-sm font-bold`}>
            <Trophy className="w-4 h-4" />
            {unlockText}
          </div>
          <div className="flex flex-col gap-3">
            <button
              onClick={onCta}
              className={`w-full py-3.5 px-6 bg-gradient-to-r ${accentClass} text-white font-bold rounded-2xl transition-opacity hover:opacity-90 flex items-center justify-center gap-2`}
            >
              {ctaLabel}
              <CheckCircle2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
            >
              Celebrate later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
