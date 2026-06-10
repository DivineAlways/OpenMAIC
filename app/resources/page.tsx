'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ExternalLink,
  BarChart2,
  Search,
  Building2,
  RefreshCw,
  Wallet,
  Newspaper,
  Globe,
  TrendingUp,
  BookOpen,
  Play,
  Map,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  ArrowRight,
  Sun,
  Moon,
  Monitor,
} from 'lucide-react';
import { useTheme } from '@/lib/hooks/use-theme';

// ─── Data ─────────────────────────────────────────────────────────────────────

type Resource = { name: string; url: string; description: string; tag?: string };
type Category = {
  id: string;
  label: string;
  emoji: string;
  icon: React.ReactNode;
  gradient: string;
  borderColor: string;
  bgColor: string;
  textColor: string;
  resources: Resource[];
};

const CATEGORIES: Category[] = [
  {
    id: 'market-data',
    label: 'Market Data',
    emoji: '📊',
    icon: <BarChart2 className="w-5 h-5" />,
    gradient: 'from-blue-500 to-indigo-600',
    borderColor: 'border-blue-500/30',
    bgColor: 'bg-blue-500/10',
    textColor: 'text-blue-400',
    resources: [
      {
        name: 'CoinMarketCap',
        url: 'https://coinmarketcap.com',
        description:
          'Prices, rankings, volume, market cap, and trending coins. The most visited crypto site in the world.',
      },
      {
        name: 'CoinGecko',
        url: 'https://coingecko.com',
        description:
          'Alternative to CMC with deeper raw data, DeFi tracking, and on-chain metrics.',
      },
      {
        name: 'CoinStats',
        url: 'https://coinstats.app',
        description: 'Track your portfolio across multiple exchanges and wallets in one dashboard.',
      },
      {
        name: 'Messari',
        url: 'https://messari.io',
        description:
          'Institutional-level research and asset intelligence used by funds and analysts.',
      },
      {
        name: 'TradingView',
        url: 'https://tradingview.com',
        description:
          'Advanced charting — indicators, strategies, and community ideas for every market.',
      },
    ],
  },
  {
    id: 'explorers',
    label: 'Block Explorers',
    emoji: '🔎',
    icon: <Search className="w-5 h-5" />,
    gradient: 'from-emerald-500 to-teal-600',
    borderColor: 'border-emerald-500/30',
    bgColor: 'bg-emerald-500/10',
    textColor: 'text-emerald-400',
    resources: [
      {
        name: 'Etherscan',
        url: 'https://etherscan.io',
        description: 'Verify any Ethereum transaction, wallet, or smart contract.',
        tag: 'Ethereum',
      },
      {
        name: 'XRPL Explorer',
        url: 'https://livenet.xrpl.org',
        description: 'Explore all XRP Ledger transactions live — wallets, payments, DEX orders.',
        tag: 'XRP',
      },
      {
        name: 'Blockchain.com',
        url: 'https://blockchain.com/explorer',
        description: 'Bitcoin and Ethereum explorer — track any address or transaction.',
        tag: 'Bitcoin',
      },
      {
        name: 'Solscan',
        url: 'https://solscan.io',
        description: 'Solana blockchain explorer for transactions, tokens, and NFTs.',
        tag: 'Solana',
      },
    ],
  },
  {
    id: 'exchanges',
    label: 'Exchanges',
    emoji: '🏦',
    icon: <Building2 className="w-5 h-5" />,
    gradient: 'from-amber-500 to-orange-600',
    borderColor: 'border-amber-500/30',
    bgColor: 'bg-amber-500/10',
    textColor: 'text-amber-400',
    resources: [
      {
        name: 'Coinbase',
        url: 'https://coinbase.com',
        description: 'Most beginner-friendly US exchange. Regulated, insured, easy on-ramp.',
        tag: 'Beginner',
      },
      {
        name: 'Binance',
        url: 'https://binance.com',
        description: 'Largest exchange globally by volume. Hundreds of trading pairs.',
        tag: 'Most Volume',
      },
      {
        name: 'Kraken',
        url: 'https://kraken.com',
        description: 'Strong security reputation. Great for US and EU traders.',
      },
      {
        name: 'Bybit',
        url: 'https://bybit.com',
        description: 'Trading-focused platform with futures, leverage, and pro order types.',
      },
      {
        name: 'BitUnix',
        url: 'https://bitunix.com',
        description: 'Integrated with OnlyCrypto. Used for mirror trading execution.',
        tag: 'OC Partner',
      },
      {
        name: 'OKX',
        url: 'https://okx.com',
        description: 'Full-featured exchange with spot, futures, and built-in Web3 wallet.',
      },
      {
        name: 'KuCoin',
        url: 'https://kucoin.com',
        description: 'Wide altcoin selection. Popular for early-stage token access.',
      },
      {
        name: 'Gemini',
        url: 'https://gemini.com',
        description: 'US-regulated, SOC 2 certified. Favored for compliance-focused users.',
      },
    ],
  },
  {
    id: 'dex',
    label: 'DEX',
    emoji: '🔄',
    icon: <RefreshCw className="w-5 h-5" />,
    gradient: 'from-violet-500 to-purple-600',
    borderColor: 'border-violet-500/30',
    bgColor: 'bg-violet-500/10',
    textColor: 'text-violet-400',
    resources: [
      {
        name: 'Uniswap',
        url: 'https://uniswap.org',
        description: 'Largest DEX on Ethereum. Trade any ERC-20 token directly from your wallet.',
        tag: 'Ethereum',
      },
      {
        name: 'PancakeSwap',
        url: 'https://pancakeswap.finance',
        description: 'Leading DEX on BNB Chain. Lower fees, large DeFi token selection.',
        tag: 'BNB Chain',
      },
      {
        name: 'SushiSwap',
        url: 'https://sushi.com',
        description: 'Multi-chain DEX with swaps, yield farming, and lending across 20+ networks.',
        tag: 'Multi-Chain',
      },
    ],
  },
  {
    id: 'wallets',
    label: 'Wallets',
    emoji: '🔐',
    icon: <Wallet className="w-5 h-5" />,
    gradient: 'from-rose-500 to-red-600',
    borderColor: 'border-rose-500/30',
    bgColor: 'bg-rose-500/10',
    textColor: 'text-rose-400',
    resources: [
      {
        name: 'MetaMask',
        url: 'https://metamask.io',
        description: 'Most widely used Ethereum browser wallet. Essential for DeFi and Web3 dApps.',
        tag: 'Browser',
      },
      {
        name: 'Trust Wallet',
        url: 'https://trustwallet.com',
        description: '100+ blockchains. Beginner-friendly with built-in swap.',
        tag: 'Mobile',
      },
      {
        name: 'Ledger',
        url: 'https://ledger.com',
        description: 'Leading hardware cold wallet. Keys stay offline — the gold standard.',
        tag: 'Hardware',
      },
      {
        name: 'Phantom',
        url: 'https://phantom.app',
        description: 'Go-to wallet for Solana. Clean UI, built-in NFT viewer and swaps.',
        tag: 'Solana',
      },
    ],
  },
  {
    id: 'news',
    label: 'News & Research',
    emoji: '📰',
    icon: <Newspaper className="w-5 h-5" />,
    gradient: 'from-cyan-500 to-sky-600',
    borderColor: 'border-cyan-500/30',
    bgColor: 'bg-cyan-500/10',
    textColor: 'text-cyan-400',
    resources: [
      {
        name: 'CoinDesk',
        url: 'https://coindesk.com',
        description: 'Oldest and most trusted crypto news. Breaking news, analysis, price data.',
        tag: 'News',
      },
      {
        name: 'Cointelegraph',
        url: 'https://cointelegraph.com',
        description: 'Global crypto news covering Bitcoin, altcoins, DeFi, and regulation.',
        tag: 'News',
      },
      {
        name: 'Decrypt',
        url: 'https://decrypt.co',
        description: 'Plain-language journalism. Great for beginners who want news without jargon.',
        tag: 'News',
      },
      {
        name: 'The Block',
        url: 'https://theblock.co',
        description: 'Institutional research, data, and news. Trusted by funds and developers.',
        tag: 'Research',
      },
      {
        name: 'DeFiLlama',
        url: 'https://defillama.com',
        description: 'Tracks Total Value Locked (TVL) across every DeFi protocol and chain.',
        tag: 'DeFi Data',
      },
      {
        name: 'Dune Analytics',
        url: 'https://dune.com',
        description: 'Custom on-chain dashboards using real blockchain data and SQL queries.',
        tag: 'Analytics',
      },
    ],
  },
];

type LessonStep = { title: string; body: string };
type Lesson = {
  tool: string;
  url: string;
  emoji: string;
  headline: string;
  gradient: string;
  steps: LessonStep[];
};

const TOOL_LESSONS: Lesson[] = [
  {
    tool: 'CoinMarketCap',
    url: 'https://coinmarketcap.com',
    emoji: '📊',
    gradient: 'from-blue-500 to-indigo-600',
    headline: 'How to read CoinMarketCap like a pro',
    steps: [
      {
        title: 'Market Cap vs Price',
        body: 'Price alone is meaningless. A $0.001 coin with 1 trillion supply has the same market cap as a $1,000 coin with 1 million supply. Market Cap is the real size of a project.',
      },
      {
        title: 'Volume vs Market Cap ratio',
        body: 'Healthy coins trade 5–20% of their market cap per day. If 24h volume is more than 50% of market cap, something unusual is happening — a listing, news event, or manipulation.',
      },
      {
        title: 'Circulating vs Total Supply',
        body: 'If circulating supply is 10% of total supply, 90% of coins will eventually hit the market. That is massive future sell pressure. Always check the inflation schedule.',
      },
      {
        title: 'Trending section',
        body: 'The Trending tab shows what retail is piling into right now. Professionals use this as a signal — either to ride momentum early, or to avoid at peak hype.',
      },
    ],
  },
  {
    tool: 'Etherscan',
    url: 'https://etherscan.io',
    emoji: '🔍',
    gradient: 'from-emerald-500 to-teal-600',
    headline: 'How to verify any transaction on Etherscan',
    steps: [
      {
        title: 'Search a wallet address',
        body: 'Paste any Ethereum address into the search bar. You see every transaction ever made — in and out — with timestamps, amounts, and counterparties.',
      },
      {
        title: 'Read a transaction',
        body: 'Click any Tx Hash. You see: Status (Success/Fail), Block number, From/To addresses, Value sent, and Gas Used. "Fail" means gas was still charged but nothing changed.',
      },
      {
        title: 'Check token approvals',
        body: 'Go to a wallet → Token Approvals tab. This shows every smart contract you have given permission to spend your tokens. Revoke anything you do not recognize.',
      },
      {
        title: 'Verify a smart contract',
        body: 'Click any contract address → Contract tab → Read Contract. Verified contracts show source code. Unverified contracts are a red flag — you cannot see what the code does.',
      },
    ],
  },
  {
    tool: 'Dune Analytics',
    url: 'https://dune.com',
    emoji: '🧠',
    gradient: 'from-violet-500 to-purple-600',
    headline: 'How to track smart money using Dune Analytics',
    steps: [
      {
        title: 'What Dune shows',
        body: 'Dune lets analysts write SQL queries directly against blockchain data. The results become public dashboards — real-time on-chain intelligence anyone can read for free.',
      },
      {
        title: 'Find whale wallet dashboards',
        body: 'Search "whale wallets" or "smart money" in Dune explore. These track wallets with historically profitable trades — see what they bought before price moved.',
      },
      {
        title: 'DEX volume and liquidity flows',
        body: 'Search for dashboards tracking Uniswap or Curve volume by token. When a token DEX volume spikes 5x with no news, that is smart money accumulating before a catalyst.',
      },
      {
        title: 'NFT and token minting activity',
        body: 'Mint dashboards show who is buying new token launches at what price. Early wallets that mint and hold (vs flip) are often insiders and early believers worth watching.',
      },
    ],
  },
  {
    tool: 'TradingView',
    url: 'https://tradingview.com',
    emoji: '📈',
    gradient: 'from-cyan-500 to-sky-600',
    headline: 'How to use TradingView for crypto analysis',
    steps: [
      {
        title: 'Setting up a chart',
        body: 'Search any ticker (e.g. XRPUSD, BTCUSDT). Switch timeframes: 1D for trend, 4H for entry zones, 1H for timing. Candlesticks show open/high/low/close — the full picture per period.',
      },
      {
        title: 'Support and resistance',
        body: 'Draw horizontal lines at price levels where the chart reversed multiple times. Price bouncing off support = potential buy zone. Rejection at resistance = potential sell zone.',
      },
      {
        title: 'RSI — is it overbought?',
        body: 'Add the RSI indicator. Above 70 = overbought. Below 30 = oversold. RSI divergence (price makes new high, RSI does not) often precedes reversals.',
      },
      {
        title: 'Volume confirmation',
        body: 'A price move with high volume is real. A price move with low volume is weak and likely to reverse. Always check if volume confirms the move before acting.',
      },
    ],
  },
];

type TrainingStep = {
  step: string;
  action: string;
  detail: string;
  link?: { label: string; url: string };
};
type Training = {
  id: string;
  emoji: string;
  title: string;
  subtitle: string;
  gradient: string;
  steps: TrainingStep[];
};

const LIVE_TRAINING: Training[] = [
  {
    id: 'buy-crypto',
    emoji: '🏦',
    gradient: 'from-amber-500 to-orange-600',
    title: 'How to Buy Your First Crypto',
    subtitle: 'Coinbase → your wallet in under 10 minutes',
    steps: [
      {
        step: '1',
        action: 'Create a Coinbase account',
        detail:
          'Go to coinbase.com → Sign Up. Complete KYC with a government ID — takes 1–5 minutes.',
        link: { label: 'Open Coinbase', url: 'https://coinbase.com' },
      },
      {
        step: '2',
        action: 'Add a payment method',
        detail:
          'Connect a bank account (ACH — free, 3–5 days) or debit card (instant, ~1.5% fee). Debit is faster for your first buy.',
      },
      {
        step: '3',
        action: 'Buy XRP or USDC',
        detail:
          'Search XRP → Buy. Start small — $20–$50 to learn the flow. USDC is a stablecoin always worth $1 — good for parking funds without price risk.',
      },
      {
        step: '4',
        action: 'Check your portfolio',
        detail:
          'Assets tab shows your balance. You now own crypto. But it is on Coinbase — they hold the keys. The next walkthrough moves it to your own wallet.',
      },
    ],
  },
  {
    id: 'setup-wallet',
    emoji: '👛',
    gradient: 'from-violet-500 to-purple-600',
    title: 'How to Set Up a Non-Custodial Wallet',
    subtitle: 'Take real ownership of your crypto',
    steps: [
      {
        step: '1',
        action: 'Download MetaMask or Trust Wallet',
        detail:
          'MetaMask for desktop (Chrome extension) or Trust Wallet for mobile. Only download from official sources.',
        link: { label: 'Get MetaMask', url: 'https://metamask.io' },
      },
      {
        step: '2',
        action: 'Write down your seed phrase',
        detail:
          'You will see 12 words. Write them on paper. Never type them, never screenshot them, never share them. This phrase = complete control of your funds.',
      },
      {
        step: '3',
        action: 'Send a small test transfer',
        detail:
          'Send $5 worth of crypto from Coinbase to your wallet address. Confirm it arrives. Only then send larger amounts. Always test first.',
      },
      {
        step: '4',
        action: 'You now self-custody',
        detail:
          'Your keys, your coins. No company can freeze your wallet or block withdrawals. You are fully responsible — which is the point.',
      },
    ],
  },
  {
    id: 'connect-dex',
    emoji: '🔄',
    gradient: 'from-emerald-500 to-teal-600',
    title: 'How to Connect to a DEX',
    subtitle: 'Trade directly from your wallet — no account needed',
    steps: [
      {
        step: '1',
        action: 'Go to Uniswap',
        detail:
          'Open app.uniswap.org in the same browser where MetaMask is installed. Never use a link from a tweet or DM — always type the URL.',
        link: { label: 'Open Uniswap', url: 'https://app.uniswap.org' },
      },
      {
        step: '2',
        action: 'Connect your wallet',
        detail:
          'Click "Connect Wallet" → MetaMask → Approve connection. You are not giving Uniswap permission to spend anything yet — just to see your address.',
      },
      {
        step: '3',
        action: 'Execute a swap',
        detail:
          'Select the token you have and the token you want. Review rate and price impact. Approve the token spend → Confirm swap. Settles on-chain in seconds.',
      },
      {
        step: '4',
        action: 'Watch it on Etherscan',
        detail:
          'Copy your Tx Hash from MetaMask → paste into etherscan.io. Watch it go from Pending → Success. That is your on-chain proof of execution.',
      },
    ],
  },
  {
    id: 'follow-trader',
    emoji: '🪞',
    gradient: 'from-blue-500 to-violet-600',
    title: 'How to Follow a Trader on OnlyCrypto',
    subtitle: 'Mirror a professional — earn XRP automatically',
    steps: [
      {
        step: '1',
        action: 'Browse the Marketplace',
        detail:
          'Log in at onlycrypto.io → Marketplace. Each trader card shows strategy, win rate, total followers, and monthly performance.',
        link: { label: 'Open Marketplace', url: 'https://onlycrypto.io/dashboard/marketplace' },
      },
      {
        step: '2',
        action: 'Pick a trader',
        detail:
          'Look for consistent returns over 90+ days, not just one big month. Read their profile — what markets do they trade? What is their risk level?',
      },
      {
        step: '3',
        action: 'Click Follow',
        detail:
          'Hit Follow on any trader profile. Their trades now mirror into your account proportionally. The system executes automatically.',
      },
      {
        step: '4',
        action: 'Watch your XRP grow',
        detail:
          'Payouts in XRP are processed automatically. Track your balance in the Wallet tab. No active trading required — the trader does the work.',
      },
    ],
  },
];

const JOURNEY_STEPS = [
  {
    step: '01',
    emoji: '📚',
    label: 'Learn the Basics',
    detail:
      'Blockchain, wallets, crypto, DeFi. Take the Elementary courses on this platform first.',
    gradient: 'from-violet-500 to-purple-600',
  },
  {
    step: '02',
    emoji: '🏦',
    label: 'Open an Exchange',
    detail: 'Sign up on Coinbase or Kraken. Complete KYC. Connect your bank or debit card.',
    gradient: 'from-amber-500 to-orange-600',
  },
  {
    step: '03',
    emoji: '🪙',
    label: 'Buy First Crypto',
    detail: 'Start with $20–$50. Buy XRP or USDC. Learn the interface without risking much.',
    gradient: 'from-yellow-500 to-amber-600',
  },
  {
    step: '04',
    emoji: '👛',
    label: 'Set Up a Wallet',
    detail: 'Download MetaMask. Write down your seed phrase. Send a small test transfer.',
    gradient: 'from-emerald-500 to-teal-600',
  },
  {
    step: '05',
    emoji: '🛡️',
    label: 'Learn Security',
    detail:
      'Learn what phishing looks like. Never share your seed phrase. Use hardware for large amounts.',
    gradient: 'from-rose-500 to-red-600',
  },
  {
    step: '06',
    emoji: '📊',
    label: 'Track Your Assets',
    detail:
      'Set up CoinGecko or CoinStats. Read your portfolio performance. Know what you own and why.',
    gradient: 'from-blue-500 to-indigo-600',
  },
  {
    step: '07',
    emoji: '🔄',
    label: 'Enter DeFi & Trading',
    detail: 'Connect to Uniswap. Try a small swap. Follow a trader on OnlyCrypto.',
    gradient: 'from-cyan-500 to-sky-600',
  },
  {
    step: '08',
    emoji: '🚀',
    label: 'Scale with Systems',
    detail:
      'Use mirror trading to earn passively. Stack knowledge with High School and College courses.',
    gradient: 'from-fuchsia-500 to-pink-600',
  },
];

type RiskItem = { title: string; icon: string; body: string; lesson: string };
const RISK_ITEMS: RiskItem[] = [
  {
    title: 'How people lose money in crypto',
    icon: '💸',
    body: 'The most common losses are not from hacks — they are from bad decisions. Buying at the top because of FOMO. Selling at the bottom from fear. Using leverage without understanding it. Sending to the wrong address. Falling for "guaranteed returns." Every one of these is avoidable with education.',
    lesson:
      'Slow down. The best traders do not rush. If you feel urgency, that is usually a manipulation signal.',
  },
  {
    title: 'The FTX Collapse — Why Custody Matters',
    icon: '🏦',
    body: 'FTX was the second-largest crypto exchange in the world. In November 2022, it collapsed in 72 hours. Over $8 billion in customer funds disappeared — not because coins crashed, but because the exchange secretly used customer funds for risky bets.',
    lesson:
      '"Not your keys, not your coins" is not a slogan — it is a rule. Crypto on an exchange is the exchange\'s asset until you withdraw it to your own wallet.',
  },
  {
    title: 'Why Self-Custody Matters',
    icon: '🔑',
    body: 'Self-custody means you hold the private keys. No company can freeze your funds or go bankrupt with your money. The tradeoff: you are 100% responsible. Lose your seed phrase — lose your crypto forever. There is no "forgot password."',
    lesson:
      'Store your seed phrase on paper — not digital. Keep two copies in two different physical locations. Never photograph it.',
  },
  {
    title: 'Rug Pulls — How to Spot Them',
    icon: '🚨',
    body: 'Developers create a token, hype it on social media, wait for buyers to pile in, then drain the liquidity pool and disappear. Red flags: anonymous team, no audit, locked liquidity for only 30 days, unrealistic APY promises, and bought followers.',
    lesson:
      'Before buying any new token: check if liquidity is locked for 1+ years, read the contract on Etherscan, verify the team is doxxed, and search the name + "scam" on Twitter.',
  },
  {
    title: 'Leverage — The Fastest Way to Zero',
    icon: '⚠️',
    body: '10x leverage means a 10% move against you = total loss. 100x leverage = a 1% move wipes you. Crypto moves 5–20% daily. Most retail traders using leverage lose their entire position within weeks.',
    lesson:
      'Never use leverage until you are consistently profitable without it. Most professionals use 2–3x maximum, only on high-conviction setups.',
  },
];

// ─── Tab config ───────────────────────────────────────────────────────────────

type TabId = 'tools' | 'learn' | 'training' | 'journey' | 'risk';
const TABS: { id: TabId; emoji: string; label: string }[] = [
  { id: 'tools', emoji: '🌐', label: 'Tools' },
  { id: 'learn', emoji: '🧩', label: 'Learn' },
  { id: 'training', emoji: '🧪', label: 'Training' },
  { id: 'journey', emoji: '🧭', label: 'Journey' },
  { id: 'risk', emoji: '🧠', label: 'Risk' },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function ToolCard({
  resource,
  gradient,
  textColor,
}: {
  resource: Resource;
  gradient: string;
  textColor: string;
}) {
  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative text-left rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/40 bg-gray-900 border border-white/5 hover:border-white/20 flex flex-col"
    >
      <div className={`h-1.5 bg-gradient-to-r ${gradient}`} />
      <div className="p-5 flex-1">
        <div className="flex items-start justify-between mb-3">
          <div
            className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-lg shadow-lg`}
          >
            {resource.name.charAt(0)}
          </div>
          <div className="flex flex-col items-end gap-1">
            {resource.tag && (
              <span
                className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${textColor} border-current opacity-70`}
              >
                {resource.tag}
              </span>
            )}
            <ExternalLink className="w-3.5 h-3.5 text-gray-600 group-hover:text-gray-400 transition-colors" />
          </div>
        </div>
        <h3 className="text-sm font-bold text-white mb-1.5">{resource.name}</h3>
        <p className="text-xs text-gray-400 leading-relaxed">{resource.description}</p>
      </div>
      <div className="px-5 pb-4">
        <div
          className={`w-full py-2 rounded-xl bg-gradient-to-r ${gradient} text-white text-xs font-bold text-center opacity-0 group-hover:opacity-100 transition-all duration-200 -translate-y-1 group-hover:translate-y-0`}
        >
          Open Site →
        </div>
      </div>
    </a>
  );
}

function LessonCard({ lesson }: { lesson: Lesson }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={`group relative rounded-2xl overflow-hidden transition-all duration-300 bg-gray-900 border ${open ? 'border-white/20' : 'border-white/5 hover:border-white/15'}`}
    >
      <div className={`h-1.5 bg-gradient-to-r ${lesson.gradient}`} />
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-4 p-5 text-left"
      >
        <div
          className={`w-12 h-12 rounded-xl bg-gradient-to-br ${lesson.gradient} flex items-center justify-center text-2xl shadow-lg shrink-0`}
        >
          {lesson.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white">{lesson.headline}</p>
          <a
            href={lesson.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-[11px] text-violet-400 hover:text-violet-300 mt-0.5"
          >
            {lesson.tool} <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
        <div className="shrink-0 w-7 h-7 rounded-full bg-white/5 flex items-center justify-center">
          {open ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </button>
      {open && (
        <div className="px-5 pb-5 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="h-px bg-white/5" />
          {lesson.steps.map((s, i) => (
            <div key={i} className="flex gap-3">
              <div
                className={`w-6 h-6 rounded-full bg-gradient-to-br ${lesson.gradient} flex items-center justify-center shrink-0 mt-0.5 shadow-sm`}
              >
                <span className="text-[10px] font-black text-white">{i + 1}</span>
              </div>
              <div>
                <p className="text-xs font-bold text-white mb-1">{s.title}</p>
                <p className="text-xs text-gray-400 leading-relaxed">{s.body}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TrainingCard({ training }: { training: Training }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={`group relative rounded-2xl overflow-hidden transition-all duration-300 bg-gray-900 border ${open ? 'border-white/20' : 'border-white/5 hover:border-white/15'}`}
    >
      <div className={`h-1.5 bg-gradient-to-r ${training.gradient}`} />
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-4 p-5 text-left"
      >
        <div
          className={`w-12 h-12 rounded-xl bg-gradient-to-br ${training.gradient} flex items-center justify-center text-2xl shadow-lg shrink-0`}
        >
          {training.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white">{training.title}</p>
          <p className="text-[11px] text-gray-500 mt-0.5">{training.subtitle}</p>
        </div>
        <div className="shrink-0 w-7 h-7 rounded-full bg-white/5 flex items-center justify-center">
          {open ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </button>
      {open && (
        <div className="px-5 pb-5 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="h-px bg-white/5" />
          {training.steps.map((s) => (
            <div key={s.step} className="flex gap-3">
              <div
                className={`w-6 h-6 rounded-full bg-gradient-to-br ${training.gradient} flex items-center justify-center shrink-0 mt-0.5 shadow-sm`}
              >
                <span className="text-[10px] font-black text-white">{s.step}</span>
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-white mb-1">{s.action}</p>
                <p className="text-xs text-gray-400 leading-relaxed">{s.detail}</p>
                {s.link && (
                  <a
                    href={s.link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-2 text-[11px] font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    {s.link.label} <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ResourcesPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [themeOpen, setThemeOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('tools');
  const [activeCat, setActiveCat] = useState<string | null>(null);

  const displayedCats = activeCat ? CATEGORIES.filter((c) => c.id === activeCat) : CATEGORIES;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* ── Header (matches homepage) ── */}
      <header className="sticky top-0 z-10 bg-gray-950/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/courses')}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-white/10 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
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

      {/* ── Hero ── */}
      <div className="px-6 pt-14 pb-10 text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-1.5 text-violet-400 text-sm font-medium mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
          Crypto Toolkit & Resources
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
          Your Full Crypto Stack
        </h1>
        <p className="text-gray-400 text-lg leading-relaxed">
          Tools. Lessons. Live walkthroughs. Your journey map. And the risks nobody talks about.
        </p>
      </div>

      {/* ── Section Tabs ── */}
      <div className="sticky top-[73px] z-10 bg-gray-950/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex overflow-x-auto scrollbar-hide">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 px-5 py-4 text-sm font-bold whitespace-nowrap transition-colors ${
                  activeTab === tab.id ? 'text-white' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <span>{tab.emoji}</span>
                <span>{tab.label}</span>
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-500 rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {/* ══ TAB: TOOLS ══ */}
        {activeTab === 'tools' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div>
              <h2 className="text-2xl font-black tracking-tight mb-1">Industry Tools Directory</h2>
              <p className="text-gray-400 text-sm">
                Click any card to open the tool directly. These are the platforms every crypto
                participant uses.
              </p>
            </div>

            {/* OC callout */}
            <div className="rounded-2xl border border-violet-500/30 bg-violet-500/10 p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-lg shrink-0">
                🪞
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-violet-400 mb-1">
                  OnlyCrypto Advantage
                </p>
                <p className="text-sm text-gray-300 leading-relaxed">
                  Instead of guessing which trader to follow on these exchanges —{' '}
                  <span className="text-white font-bold">mirror proven traders on OnlyCrypto</span>{' '}
                  and earn XRP automatically while you learn.
                </p>
              </div>
            </div>

            {/* Category filter pills */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveCat(null)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                  activeCat === null
                    ? 'bg-violet-500 border-violet-500 text-white'
                    : 'border-white/20 text-gray-400 hover:border-white/40 hover:text-white'
                }`}
              >
                All
              </button>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCat(activeCat === cat.id ? null : cat.id)}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                    activeCat === cat.id
                      ? `${cat.bgColor} ${cat.borderColor} ${cat.textColor}`
                      : 'border-white/20 text-gray-400 hover:border-white/40 hover:text-white'
                  }`}
                >
                  {cat.emoji} {cat.label}
                </button>
              ))}
            </div>

            {/* Category grids */}
            {displayedCats.map((cat) => (
              <div key={cat.id} className="space-y-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-xl bg-gradient-to-br ${cat.gradient} flex items-center justify-center text-base shadow-md`}
                  >
                    {cat.emoji}
                  </div>
                  <div>
                    <h3 className={`text-sm font-black ${cat.textColor}`}>{cat.label}</h3>
                    <p className="text-[10px] text-gray-600 font-medium">
                      {cat.resources.length} tools
                    </p>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {cat.resources.map((r) => (
                    <ToolCard
                      key={r.name}
                      resource={r}
                      gradient={cat.gradient}
                      textColor={cat.textColor}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ══ TAB: LEARN ══ */}
        {activeTab === 'learn' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div>
              <h2 className="text-2xl font-black tracking-tight mb-1">
                Tool-Based Learning Modules
              </h2>
              <p className="text-gray-400 text-sm">
                Don&apos;t just know the tools exist — know how to actually use them. Expand any
                lesson below.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {TOOL_LESSONS.map((lesson) => (
                <LessonCard key={lesson.tool} lesson={lesson} />
              ))}
            </div>
          </div>
        )}

        {/* ══ TAB: TRAINING ══ */}
        {activeTab === 'training' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div>
              <h2 className="text-2xl font-black tracking-tight mb-1">Live Environment Training</h2>
              <p className="text-gray-400 text-sm">
                Step-by-step walkthroughs for real actions in real systems. Work through each one in
                order.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {LIVE_TRAINING.map((training) => (
                <TrainingCard key={training.id} training={training} />
              ))}
            </div>
          </div>
        )}

        {/* ══ TAB: JOURNEY ══ */}
        {activeTab === 'journey' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div>
              <h2 className="text-2xl font-black tracking-tight mb-1">Your Crypto Journey Map</h2>
              <p className="text-gray-400 text-sm">
                A clear 8-step path from zero to operating confidently in the crypto economy.
                Don&apos;t skip steps.
              </p>
            </div>

            {/* Journey cards — same pattern as CourseCard */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {JOURNEY_STEPS.map((j, i) => (
                <div
                  key={j.step}
                  className="group relative rounded-2xl overflow-hidden bg-gray-900 border border-white/5 hover:border-white/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/40"
                >
                  <div className={`h-1.5 bg-gradient-to-r ${j.gradient}`} />
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${j.gradient} flex items-center justify-center text-2xl shadow-lg`}
                      >
                        {j.emoji}
                      </div>
                      <span
                        className={`text-xs font-black px-2.5 py-0.5 rounded-full bg-gradient-to-r ${j.gradient} text-white opacity-80`}
                      >
                        {j.step}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-white mb-2">{j.label}</h3>
                    <p className="text-xs text-gray-400 leading-relaxed">{j.detail}</p>
                  </div>
                  {i < JOURNEY_STEPS.length - 1 && (
                    <div className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 items-center justify-center">
                      <ArrowRight className="w-3.5 h-3.5 text-gray-600" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-sm text-gray-300 leading-relaxed">
                <span className="font-bold text-white">You don&apos;t have to do this alone.</span>{' '}
                OnlyCrypto lets you skip the guesswork on step 7 by following traders already in the
                market. While you learn steps 1–6, your account is already working on step 7.
              </p>
            </div>
          </div>
        )}

        {/* ══ TAB: RISK ══ */}
        {activeTab === 'risk' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div>
              <h2 className="text-2xl font-black tracking-tight mb-1">Risk & Reality</h2>
              <p className="text-gray-400 text-sm">
                Knowing how people lose money is just as important as knowing how to make it.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {RISK_ITEMS.map((item) => (
                <div
                  key={item.title}
                  className="group relative rounded-2xl overflow-hidden bg-gray-900 border border-white/5 hover:border-rose-500/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/40"
                >
                  <div className="h-1.5 bg-gradient-to-r from-rose-500 to-red-600" />
                  <div className="p-5 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center text-2xl shadow-lg shrink-0">
                        {item.icon}
                      </div>
                      <h3 className="text-sm font-bold text-white">{item.title}</h3>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">{item.body}</p>
                    <div className="flex items-start gap-2 bg-rose-500/10 border border-rose-500/20 rounded-xl p-3">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-rose-200/80 leading-relaxed">{item.lesson}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Bottom CTA (all tabs) ── */}
        <div className="mt-16 rounded-3xl overflow-hidden">
          <div className="bg-gradient-to-br from-violet-900/60 via-purple-900/40 to-gray-900 border border-violet-500/20 p-10 text-center space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-3xl mx-auto shadow-xl shadow-violet-500/30">
              🚀
            </div>
            <div>
              <h3 className="text-2xl font-black tracking-tight mb-2">
                You&apos;re Building Your Stack
              </h3>
              <p className="text-sm text-gray-400 max-w-lg mx-auto leading-relaxed">
                The tools above are how crypto professionals operate. The courses on this platform
                teach you how to use them. The OnlyCrypto mirror trading system is how you start
                earning XRP while you learn.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              <a
                href="https://onlycrypto.io"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white text-sm font-bold transition-all shadow-lg shadow-violet-500/25"
              >
                <ExternalLink className="w-4 h-4" />
                Open Dashboard
              </a>
              <button
                onClick={() => router.push('/courses')}
                className="flex items-center gap-2 px-6 py-3 rounded-xl border border-white/20 text-gray-300 hover:bg-white/5 text-sm font-bold transition-all"
              >
                <BookOpen className="w-4 h-4" />
                Back to Courses
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
