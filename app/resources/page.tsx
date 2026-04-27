'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, ExternalLink, BarChart2, Search, Building2,
  RefreshCw, Wallet, Newspaper, Globe, TrendingUp,
  BookOpen, Play, Map, AlertTriangle, ChevronDown, ChevronUp,
  CheckCircle2, ArrowRight
} from 'lucide-react';

// ─── Toolkit Data ─────────────────────────────────────────────────────────────

type Resource = { name: string; url: string; description: string; tag?: string };

type Category = {
  id: string; label: string; emoji: string; icon: React.ReactNode;
  borderColor: string; bgColor: string; textColor: string; resources: Resource[];
};

const CATEGORIES: Category[] = [
  {
    id: 'market-data', label: 'Market Data & Research', emoji: '📊',
    icon: <BarChart2 className="w-5 h-5" />,
    borderColor: 'border-blue-500/30', bgColor: 'bg-blue-500/10', textColor: 'text-blue-400',
    resources: [
      { name: 'CoinMarketCap', url: 'https://coinmarketcap.com', description: 'Prices, rankings, volume, market cap, and trending coins. The most visited crypto site in the world.' },
      { name: 'CoinGecko', url: 'https://coingecko.com', description: 'Alternative to CMC with deeper raw data, DeFi tracking, and on-chain metrics.' },
      { name: 'CoinStats', url: 'https://coinstats.app', description: 'Track your portfolio across multiple exchanges and wallets in one dashboard.' },
      { name: 'Messari', url: 'https://messari.io', description: 'Institutional-level research, reports, and asset intelligence used by funds and analysts.' },
      { name: 'TradingView', url: 'https://tradingview.com', description: 'Advanced charting for traders — indicators, strategies, and community ideas for every market.' },
    ],
  },
  {
    id: 'explorers', label: 'Block Explorers', emoji: '🔎',
    icon: <Search className="w-5 h-5" />,
    borderColor: 'border-emerald-500/30', bgColor: 'bg-emerald-500/10', textColor: 'text-emerald-400',
    resources: [
      { name: 'Etherscan', url: 'https://etherscan.io', description: 'Verify any Ethereum transaction, wallet, or smart contract. The definitive Ethereum explorer.', tag: 'Ethereum' },
      { name: 'XRPL Explorer', url: 'https://livenet.xrpl.org', description: 'Explore all XRP Ledger transactions live — wallets, payments, DEX orders, and trust lines.', tag: 'XRP' },
      { name: 'Blockchain.com', url: 'https://blockchain.com/explorer', description: 'Bitcoin and Ethereum explorer — track any BTC address or transaction in real time.', tag: 'Bitcoin' },
      { name: 'Solscan', url: 'https://solscan.io', description: 'Solana blockchain explorer for transactions, tokens, NFTs, and programs.', tag: 'Solana' },
    ],
  },
  {
    id: 'exchanges', label: 'Exchanges (CEX)', emoji: '🏦',
    icon: <Building2 className="w-5 h-5" />,
    borderColor: 'border-amber-500/30', bgColor: 'bg-amber-500/10', textColor: 'text-amber-400',
    resources: [
      { name: 'Coinbase', url: 'https://coinbase.com', description: 'The most beginner-friendly US exchange. Regulated, insured, easy on-ramp for new users.', tag: 'Beginner Friendly' },
      { name: 'Binance', url: 'https://binance.com', description: 'The largest crypto exchange globally by volume. Hundreds of trading pairs and tools.', tag: 'Most Volume' },
      { name: 'Kraken', url: 'https://kraken.com', description: 'Known for strong security reputation and clean interface. Great for US and EU traders.' },
      { name: 'Bybit', url: 'https://bybit.com', description: 'Trading-focused platform with futures, leverage, and professional order types.' },
      { name: 'BitUnix', url: 'https://bitunix.com', description: 'Integrated with the OnlyCrypto ecosystem. Used for mirror trading and copy trade execution.', tag: 'OC Partner' },
      { name: 'OKX', url: 'https://okx.com', description: 'Full-featured exchange with spot, futures, and a built-in Web3 wallet.' },
      { name: 'KuCoin', url: 'https://kucoin.com', description: 'Wide selection of altcoins. Popular for early-stage token access before major listings.' },
      { name: 'Gemini', url: 'https://gemini.com', description: 'US-regulated exchange with SOC 2 certification. Favored for institutional and compliance-focused users.' },
    ],
  },
  {
    id: 'dex', label: 'Decentralized Exchanges (DEX)', emoji: '🔄',
    icon: <RefreshCw className="w-5 h-5" />,
    borderColor: 'border-violet-500/30', bgColor: 'bg-violet-500/10', textColor: 'text-violet-400',
    resources: [
      { name: 'Uniswap', url: 'https://uniswap.org', description: 'The largest DEX on Ethereum. Trade any ERC-20 token directly from your wallet — no account, no ID.', tag: 'Ethereum' },
      { name: 'PancakeSwap', url: 'https://pancakeswap.finance', description: 'Leading DEX on BNB Chain. Lower fees than Ethereum, large selection of DeFi tokens.', tag: 'BNB Chain' },
      { name: 'SushiSwap', url: 'https://sushi.com', description: 'Multi-chain DEX with swaps, yield farming, and lending across 20+ networks.', tag: 'Multi-Chain' },
    ],
  },
  {
    id: 'wallets', label: 'Wallets', emoji: '🔐',
    icon: <Wallet className="w-5 h-5" />,
    borderColor: 'border-rose-500/30', bgColor: 'bg-rose-500/10', textColor: 'text-rose-400',
    resources: [
      { name: 'MetaMask', url: 'https://metamask.io', description: 'The most widely used Ethereum browser wallet. Essential for interacting with DeFi and Web3 dApps.', tag: 'Browser Extension' },
      { name: 'Trust Wallet', url: 'https://trustwallet.com', description: 'Mobile wallet supporting 100+ blockchains. Owned by Binance — beginner-friendly with built-in swap.', tag: 'Mobile' },
      { name: 'Ledger', url: 'https://ledger.com', description: 'The leading hardware cold wallet. Your private keys stay offline — the gold standard for security.', tag: 'Hardware' },
      { name: 'Phantom', url: 'https://phantom.app', description: 'The go-to wallet for Solana. Clean interface, built-in NFT viewer and token swaps.', tag: 'Solana' },
    ],
  },
  {
    id: 'news', label: 'News, Media & DeFi Tools', emoji: '📰',
    icon: <Newspaper className="w-5 h-5" />,
    borderColor: 'border-cyan-500/30', bgColor: 'bg-cyan-500/10', textColor: 'text-cyan-400',
    resources: [
      { name: 'CoinDesk', url: 'https://coindesk.com', description: 'One of the oldest and most trusted crypto news publications. Breaking news, analysis, and price data.', tag: 'News' },
      { name: 'Cointelegraph', url: 'https://cointelegraph.com', description: 'Global crypto news covering Bitcoin, altcoins, DeFi, regulation, and market analysis.', tag: 'News' },
      { name: 'Decrypt', url: 'https://decrypt.co', description: 'Plain-language crypto journalism. Great for beginners who want news without the jargon.', tag: 'News' },
      { name: 'The Block', url: 'https://theblock.co', description: 'Institutional crypto research, data, and news. Trusted by funds and developers.', tag: 'Research' },
      { name: 'DeFiLlama', url: 'https://defillama.com', description: 'Tracks Total Value Locked (TVL) across every DeFi protocol and chain — the DeFi leaderboard.', tag: 'DeFi Data' },
      { name: 'Dune Analytics', url: 'https://dune.com', description: 'Build or explore custom on-chain dashboards using SQL. Powered by real blockchain data.', tag: 'Analytics' },
    ],
  },
];

// ─── Tool-Based Learning Modules ──────────────────────────────────────────────

type LessonStep = { title: string; body: string };
type Lesson = { tool: string; url: string; emoji: string; headline: string; steps: LessonStep[] };

const TOOL_LESSONS: Lesson[] = [
  {
    tool: 'CoinMarketCap', url: 'https://coinmarketcap.com', emoji: '📊',
    headline: 'How to read CoinMarketCap like a pro',
    steps: [
      { title: 'Market Cap vs Price', body: 'Price alone is meaningless. A $0.001 coin with 1 trillion supply has the same market cap as a $1,000 coin with 1 million supply. Always look at Market Cap — that\'s the real size of a project.' },
      { title: 'Volume vs Market Cap ratio', body: 'Healthy coins trade 5–20% of their market cap per day. If 24h volume is more than 50% of market cap, something unusual is happening — a listing, news event, or manipulation.' },
      { title: 'Circulating vs Total Supply', body: 'If circulating supply is 10% of total supply, 90% of coins will eventually hit the market. That\'s massive future sell pressure. Always check the inflation schedule.' },
      { title: 'Trending section', body: 'The Trending tab shows what retail is piling into right now. Professionals use this as a signal — either to ride momentum early, or to avoid at peak hype.' },
    ],
  },
  {
    tool: 'Etherscan', url: 'https://etherscan.io', emoji: '🔍',
    headline: 'How to verify any transaction on Etherscan',
    steps: [
      { title: 'Search a wallet address', body: 'Paste any Ethereum address into the search bar. You see every transaction ever made — in and out — with timestamps, amounts, and counterparties. Nothing is hidden on a public blockchain.' },
      { title: 'Read a transaction', body: 'Click any Tx Hash to open a transaction. You\'ll see: Status (Success/Fail), Block number (when it was confirmed), From/To addresses, Value (ETH sent), and Gas Used. "Success" means it executed. "Fail" means gas was still charged but nothing changed.' },
      { title: 'Check token approvals', body: 'Go to a wallet → Token Approvals tab. This shows every smart contract you\'ve given permission to spend your tokens. Revoke anything you don\'t recognize — this is how many wallets get drained.' },
      { title: 'Verify a smart contract', body: 'Click any contract address → Contract tab → Read Contract. Verified contracts show their source code. Unverified contracts are a red flag — you can\'t see what the code actually does.' },
    ],
  },
  {
    tool: 'Dune Analytics', url: 'https://dune.com', emoji: '🧠',
    headline: 'How to track smart money using Dune Analytics',
    steps: [
      { title: 'What Dune shows', body: 'Dune lets analysts write SQL queries directly against blockchain data. The results become public dashboards — real-time on-chain intelligence anyone can read for free.' },
      { title: 'Find whale wallet dashboards', body: 'Search "whale wallets" or "smart money" in Dune\'s explore tab. These dashboards track wallets with historically profitable trades — you can see what they bought before price moved.' },
      { title: 'DEX volume and liquidity flows', body: 'Search for dashboards tracking Uniswap or Curve volume by token. When a token\'s DEX volume spikes 5x with no news, that\'s smart money accumulating before a catalyst.' },
      { title: 'NFT and token minting activity', body: 'Mint dashboards show who is buying new token launches and at what price. Early wallets that mint and hold (vs flip) are often the insiders and early believers worth watching.' },
    ],
  },
  {
    tool: 'TradingView', url: 'https://tradingview.com', emoji: '📈',
    headline: 'How to use TradingView for crypto analysis',
    steps: [
      { title: 'Setting up a chart', body: 'Search any ticker (e.g. XRPUSD, BTCUSDT). Switch timeframes: 1D for trend, 4H for entry zones, 1H for timing. Candlestick charts show open/high/low/close — the full picture per period.' },
      { title: 'Support and resistance', body: 'Draw horizontal lines at price levels where the chart reversed multiple times. These are the zones traders watch. Price bouncing off support = potential buy zone. Price rejected at resistance = potential sell zone.' },
      { title: 'RSI — is it overbought?', body: 'Add the RSI indicator. Above 70 = overbought (price may cool). Below 30 = oversold (price may bounce). RSI divergence (price makes new high, RSI doesn\'t) often precedes reversals.' },
      { title: 'Volume confirmation', body: 'A price move with high volume is real. A price move with low volume is weak — likely to reverse. Always check if volume confirms the move before acting on it.' },
    ],
  },
];

// ─── Live Environment Training ────────────────────────────────────────────────

type TrainingStep = { step: string; action: string; detail: string; link?: { label: string; url: string } };
type Training = { id: string; emoji: string; title: string; subtitle: string; steps: TrainingStep[] };

const LIVE_TRAINING: Training[] = [
  {
    id: 'buy-crypto',
    emoji: '🏦', title: 'How to Buy Your First Crypto', subtitle: 'Coinbase → your wallet in under 10 minutes',
    steps: [
      { step: '1', action: 'Create a Coinbase account', detail: 'Go to coinbase.com → Sign Up. You\'ll need a government ID for KYC verification. This takes 1–5 minutes.', link: { label: 'Open Coinbase', url: 'https://coinbase.com' } },
      { step: '2', action: 'Add a payment method', detail: 'Connect a bank account (ACH — free but 3–5 days) or a debit card (instant, ~1.5% fee). For your first buy, debit card is faster.' },
      { step: '3', action: 'Buy XRP or USDC', detail: 'Search XRP → Buy. Start small — $20–$50 to learn the flow. USDC is a stablecoin ($1 always) — good for parking funds without price risk.' },
      { step: '4', action: 'Check your portfolio', detail: 'Assets tab shows your balance. You now own crypto. But it\'s on Coinbase — they hold the keys. The next step moves it to your own wallet.' },
    ],
  },
  {
    id: 'setup-wallet',
    emoji: '👛', title: 'How to Set Up a Non-Custodial Wallet', subtitle: 'Take real ownership of your crypto',
    steps: [
      { step: '1', action: 'Download MetaMask or Trust Wallet', detail: 'MetaMask for desktop (Chrome extension) or Trust Wallet for mobile. Only download from official sources — metamask.io or trustwallet.com.', link: { label: 'Get MetaMask', url: 'https://metamask.io' } },
      { step: '2', action: 'Write down your seed phrase', detail: 'You\'ll see 12 words. Write them on paper. Never type them, never screenshot them, never share them. This phrase = complete control of your funds. Lose it = lose everything.' },
      { step: '3', action: 'Send a small test transfer', detail: 'Send $5 worth of crypto from Coinbase to your wallet address. Confirm it arrives. Only then send larger amounts. Always test first.' },
      { step: '4', action: 'You now self-custody', detail: 'Your keys, your coins. No company can freeze your wallet or block withdrawals. You\'re fully responsible — which is the point.' },
    ],
  },
  {
    id: 'connect-dex',
    emoji: '🔄', title: 'How to Connect to a DEX', subtitle: 'Trade directly from your wallet — no account needed',
    steps: [
      { step: '1', action: 'Go to Uniswap', detail: 'Open app.uniswap.org in the same browser where MetaMask is installed. Never use a link from a tweet or DM — always type the URL.', link: { label: 'Open Uniswap', url: 'https://app.uniswap.org' } },
      { step: '2', action: 'Connect your wallet', detail: 'Click "Connect Wallet" → MetaMask → Approve connection. You\'re not giving Uniswap permission to spend anything yet — just to see your address.' },
      { step: '3', action: 'Execute a swap', detail: 'Select the token you have (e.g. ETH) and the token you want. Review the rate and price impact. Approve the token spend → Confirm swap. The trade settles on-chain in seconds.' },
      { step: '4', action: 'Watch the transaction on Etherscan', detail: 'Copy your Tx Hash from MetaMask → paste into etherscan.io. You\'ll see it go from Pending → Success. This is your proof of execution on the blockchain.' },
    ],
  },
  {
    id: 'follow-trader',
    emoji: '🪞', title: 'How to Follow a Trader on OnlyCrypto', subtitle: 'Mirror a professional — earn XRP automatically',
    steps: [
      { step: '1', action: 'Browse the Marketplace', detail: 'Log in at onlycrypto.io → Marketplace. Each trader card shows their strategy, win rate, total followers, and monthly performance.', link: { label: 'Open Marketplace', url: 'https://onlycrypto.io/dashboard/marketplace' } },
      { step: '2', action: 'Pick a trader', detail: 'Look for consistent returns over 90+ days, not just one big month. Read their profile — what markets do they trade? What is their risk level?' },
      { step: '3', action: 'Click Follow', detail: 'Hit Follow on any trader profile. Their trades now mirror into your account proportionally. You don\'t need to do anything — the system executes automatically.' },
      { step: '4', action: 'Watch your XRP grow', detail: 'Payouts in XRP are processed automatically. Track your balance in the dashboard Wallet tab. No active trading required — the trader does the work, you earn proportionally.' },
    ],
  },
];

// ─── User Journey Map ─────────────────────────────────────────────────────────

const JOURNEY_STEPS = [
  { step: '01', emoji: '📚', label: 'Learn the Basics', detail: 'Blockchain, wallets, crypto, DeFi. Take the Elementary courses on this platform first.' },
  { step: '02', emoji: '🏦', label: 'Open an Exchange Account', detail: 'Sign up on Coinbase or Kraken. Complete KYC. Connect your bank account or debit card.' },
  { step: '03', emoji: '🪙', label: 'Buy Your First Crypto', detail: 'Start with $20–$50. Buy XRP or USDC. Learn the interface without risking much.' },
  { step: '04', emoji: '👛', label: 'Set Up a Wallet', detail: 'Download MetaMask or Trust Wallet. Write down your seed phrase. Send a small test transfer.' },
  { step: '05', emoji: '🛡️', label: 'Understand Security', detail: 'Learn what phishing looks like. Never share your seed phrase. Use a hardware wallet for large amounts.' },
  { step: '06', emoji: '📊', label: 'Track Your Assets', detail: 'Set up CoinGecko or CoinStats. Learn to read your portfolio performance. Know what you own and why.' },
  { step: '07', emoji: '🔄', label: 'Enter DeFi & Trading', detail: 'Connect to Uniswap. Try a small swap. Learn how AMMs work. Follow a trader on OnlyCrypto.' },
  { step: '08', emoji: '🚀', label: 'Scale with Systems', detail: 'Use mirror trading to earn passively. Stack knowledge with the High School and College courses. Build your strategy.' },
];

// ─── Risk & Reality Layer ─────────────────────────────────────────────────────

type RiskItem = { title: string; icon: string; body: string; lesson: string };

const RISK_ITEMS: RiskItem[] = [
  {
    title: 'How people lose money in crypto',
    icon: '💸',
    body: 'The most common losses are not from hacks — they\'re from bad decisions. Buying at the top because of FOMO. Selling at the bottom because of fear. Using leverage without understanding it. Sending to the wrong address. Falling for a "guaranteed returns" offer. Every one of these is avoidable with education.',
    lesson: 'Slow down. The best traders don\'t rush. If you feel urgency, that\'s usually a manipulation signal.',
  },
  {
    title: 'The FTX Collapse — Why Custody Matters',
    icon: '🏦',
    body: 'FTX was the second-largest crypto exchange in the world. In November 2022, it collapsed in 72 hours. Over $8 billion in customer funds disappeared. People who held crypto on FTX lost everything — not because their coins crashed, but because the exchange secretly used customer funds as collateral for risky bets.',
    lesson: '"Not your keys, not your coins" is not a slogan — it\'s a rule. Any crypto sitting on an exchange is the exchange\'s asset, not yours, until you withdraw it to your own wallet.',
  },
  {
    title: 'Why custody matters',
    icon: '🔑',
    body: 'Self-custody means you hold the private keys to your own wallet. No company can freeze your funds, block withdrawals, or go bankrupt with your money. The tradeoff: you are 100% responsible. Lose your seed phrase — lose your crypto forever. There is no "forgot password."',
    lesson: 'Store your seed phrase on paper (not digital). Keep two copies in two different physical locations. Never photograph it.',
  },
  {
    title: 'Rug pulls and how to spot them',
    icon: '🚨',
    body: 'A rug pull is when developers create a token, hype it on social media, wait for buyers to pile in, then drain the liquidity pool and disappear. Common red flags: anonymous team, no audit, locked liquidity for only 30 days, unrealistic APY promises, and social accounts with bought followers.',
    lesson: 'Before buying any new token: check if liquidity is locked for 1+ years, read the contract on Etherscan, verify the team is doxxed, and search the name + "scam" or "rug" on Twitter.',
  },
  {
    title: 'Leverage — the fastest way to zero',
    icon: '⚠️',
    body: '10x leverage means a 10% move against you = total loss. 100x leverage = a 1% move wipes your position. Crypto moves 5–20% daily. Most retail traders who use leverage lose their entire position within weeks. Exchanges offer 100x leverage because the fees on liquidations are extremely profitable for them.',
    lesson: 'Never use leverage until you are consistently profitable without it. Most professionals use 2–3x maximum, only on high-conviction setups.',
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function ResourceCard({ resource, textColor }: { resource: Resource; textColor: string }) {
  return (
    <a href={resource.url} target="_blank" rel="noopener noreferrer"
      className="group flex flex-col gap-2 p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-bold text-white">{resource.name}</span>
          {resource.tag && (
            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${textColor} border-current opacity-70`}>
              {resource.tag}
            </span>
          )}
        </div>
        <ExternalLink className="w-3.5 h-3.5 shrink-0 mt-0.5 opacity-40 group-hover:opacity-100 transition-all" />
      </div>
      <p className="text-xs text-gray-400 leading-relaxed">{resource.description}</p>
    </a>
  );
}

function SectionHeader({ emoji, label, count, borderColor, bgColor, textColor, icon }: {
  emoji: string; label: string; count?: number;
  borderColor: string; bgColor: string; textColor: string; icon: React.ReactNode;
}) {
  return (
    <div className={`flex items-center gap-3 p-4 rounded-2xl border ${borderColor} ${bgColor}`}>
      <div className={textColor}>{icon}</div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Section</p>
        <h2 className={`text-base font-black ${textColor}`}>{emoji} {label}</h2>
      </div>
      {count !== undefined && <span className="ml-auto text-xs font-bold text-gray-500">{count} tools</span>}
    </div>
  );
}

function LessonCard({ lesson }: { lesson: Lesson }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-white/10 bg-white/5 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-3 p-4 hover:bg-white/5 transition-all text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{lesson.emoji}</span>
          <div>
            <p className="text-sm font-bold text-white">{lesson.headline}</p>
            <a
              href={lesson.url} target="_blank" rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="text-[11px] text-violet-400 hover:text-violet-300 flex items-center gap-1 mt-0.5"
            >
              {lesson.tool} <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-500 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />}
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3">
          {lesson.steps.map((s, i) => (
            <div key={i} className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[10px] font-black text-violet-400">{i + 1}</span>
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
    <div className="border border-white/10 bg-white/5 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-3 p-4 hover:bg-white/5 transition-all text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{training.emoji}</span>
          <div>
            <p className="text-sm font-bold text-white">{training.title}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">{training.subtitle}</p>
          </div>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-500 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />}
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3">
          {training.steps.map((s) => (
            <div key={s.step} className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[10px] font-black text-cyan-400">{s.step}</span>
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-white mb-1">{s.action}</p>
                <p className="text-xs text-gray-400 leading-relaxed">{s.detail}</p>
                {s.link && (
                  <a href={s.link.url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-2 text-[11px] font-bold text-cyan-400 hover:text-cyan-300 transition-colors">
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
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const displayed = activeCategory
    ? CATEGORIES.filter(c => c.id === activeCategory)
    : CATEGORIES;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Sticky nav */}
      <div className="sticky top-0 z-20 bg-gray-950/90 backdrop-blur-md border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
          <button onClick={() => router.push('/')}
            className="p-2 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-violet-400" />
            <span className="text-sm font-black uppercase tracking-widest text-white">Crypto Toolkit & Resources</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-16">

        {/* ── Hero ── */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-violet-400">
            <TrendingUp className="w-3.5 h-3.5" />
            OnlyCrypto Academy
          </div>
          <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tight">Industry Toolkit</h1>
          <p className="text-gray-400 max-w-2xl text-sm leading-relaxed">
            Every tool, lesson, and walkthrough a serious crypto participant needs — from market data and exchanges
            to step-by-step environment training, your full journey map, and the real risks nobody talks about.
          </p>
        </div>

        {/* ── OC Integration callout ── */}
        <div className="rounded-2xl border border-violet-500/30 bg-violet-500/10 p-6 space-y-2">
          <p className="text-xs font-black uppercase tracking-widest text-violet-400">OnlyCrypto Integration</p>
          <p className="text-sm text-gray-300 leading-relaxed">
            Instead of guessing which trader to follow on an exchange —{' '}
            <span className="text-white font-bold">mirror proven traders on OnlyCrypto</span> and earn XRP automatically.
            Instead of learning to trade alone —{' '}
            <span className="text-white font-bold">let the system work for you</span> while you build knowledge below.
          </p>
        </div>

        {/* ══════════════════════════════════════════════════════════
            SECTION 1 — TOOLKIT LINKS
        ══════════════════════════════════════════════════════════ */}
        <section className="space-y-8">
          <SectionHeader
            emoji="🌐" label="Industry Tools Directory" icon={<Globe className="w-5 h-5" />}
            borderColor="border-violet-500/30" bgColor="bg-violet-500/10" textColor="text-violet-400"
          />
          <p className="text-sm text-gray-400">Click any card to open the tool directly. These are the platforms every crypto participant uses.</p>

          {/* Category filter pills */}
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setActiveCategory(null)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                activeCategory === null ? 'bg-violet-500 border-violet-500 text-white' : 'border-white/20 text-gray-400 hover:border-white/40 hover:text-white'
              }`}>
              All Tools
            </button>
            {CATEGORIES.map(cat => (
              <button key={cat.id} onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                  activeCategory === cat.id ? `${cat.bgColor} ${cat.borderColor} ${cat.textColor}` : 'border-white/20 text-gray-400 hover:border-white/40 hover:text-white'
                }`}>
                {cat.emoji} {cat.label}
              </button>
            ))}
          </div>

          <div className="space-y-10">
            {displayed.map(cat => (
              <div key={cat.id} className="space-y-4">
                <div className={`flex items-center gap-3 p-4 rounded-2xl border ${cat.borderColor} ${cat.bgColor}`}>
                  <div className={cat.textColor}>{cat.icon}</div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Category</p>
                    <h3 className={`text-base font-black ${cat.textColor}`}>{cat.emoji} {cat.label}</h3>
                  </div>
                  <span className="ml-auto text-xs font-bold text-gray-500">{cat.resources.length} tools</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {cat.resources.map(r => (
                    <ResourceCard key={r.name} resource={r} textColor={cat.textColor} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════
            SECTION 2 — TOOL-BASED LEARNING MODULES
        ══════════════════════════════════════════════════════════ */}
        <section className="space-y-6">
          <SectionHeader
            emoji="🧩" label="Tool-Based Learning Modules" icon={<BookOpen className="w-5 h-5" />}
            borderColor="border-violet-500/30" bgColor="bg-violet-500/10" textColor="text-violet-400"
          />
          <p className="text-sm text-gray-400">
            Don't just know the tools exist — know how to use them. Click any lesson to expand the full walkthrough.
          </p>
          <div className="space-y-3">
            {TOOL_LESSONS.map(lesson => (
              <LessonCard key={lesson.tool} lesson={lesson} />
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════
            SECTION 3 — LIVE ENVIRONMENT TRAINING
        ══════════════════════════════════════════════════════════ */}
        <section className="space-y-6">
          <SectionHeader
            emoji="🧪" label="Live Environment Training" icon={<Play className="w-5 h-5" />}
            borderColor="border-cyan-500/30" bgColor="bg-cyan-500/10" textColor="text-cyan-400"
          />
          <p className="text-sm text-gray-400">
            Step-by-step walkthroughs for real actions in real systems. Start from zero and work through each one in order.
          </p>
          <div className="space-y-3">
            {LIVE_TRAINING.map(training => (
              <TrainingCard key={training.id} training={training} />
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════
            SECTION 4 — USER JOURNEY MAP
        ══════════════════════════════════════════════════════════ */}
        <section className="space-y-6">
          <SectionHeader
            emoji="🧭" label="Your Crypto Journey Map" icon={<Map className="w-5 h-5" />}
            borderColor="border-emerald-500/30" bgColor="bg-emerald-500/10" textColor="text-emerald-400"
          />
          <p className="text-sm text-gray-400">
            A clear path from zero to operating confidently in the crypto economy. Follow this sequence — don't skip steps.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {JOURNEY_STEPS.map((j, i) => (
              <div key={j.step}
                className="relative p-4 rounded-xl border border-white/10 bg-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">{j.step}</span>
                  <span className="text-xl">{j.emoji}</span>
                </div>
                <p className="text-sm font-bold text-white">{j.label}</p>
                <p className="text-xs text-gray-400 leading-relaxed">{j.detail}</p>
                {i < JOURNEY_STEPS.length - 1 && (
                  <div className="hidden lg:flex absolute -right-1.5 top-1/2 -translate-y-1/2 z-10">
                    <ArrowRight className="w-3 h-3 text-emerald-500/50" />
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <p className="text-sm text-gray-300 leading-relaxed">
              <span className="font-bold text-white">You don't have to do this alone.</span> OnlyCrypto lets you skip the guesswork on step 7 by following traders who are already in the market. While you're learning steps 1–6, your account is already working on step 7.
            </p>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════
            SECTION 5 — RISK & REALITY LAYER
        ══════════════════════════════════════════════════════════ */}
        <section className="space-y-6">
          <SectionHeader
            emoji="🧠" label="Risk & Reality — What Nobody Tells You" icon={<AlertTriangle className="w-5 h-5" />}
            borderColor="border-rose-500/30" bgColor="bg-rose-500/10" textColor="text-rose-400"
          />
          <p className="text-sm text-gray-400">
            This section builds trust — because knowing how people lose money is just as important as knowing how to make it.
          </p>
          <div className="space-y-4">
            {RISK_ITEMS.map(item => (
              <div key={item.title} className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{item.icon}</span>
                  <h3 className="text-sm font-bold text-white">{item.title}</h3>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed">{item.body}</p>
                <div className="flex items-start gap-2 bg-rose-500/10 border border-rose-500/20 rounded-lg p-3">
                  <span className="text-rose-400 text-xs font-black uppercase tracking-widest shrink-0 mt-0.5">Key Lesson</span>
                  <p className="text-xs text-rose-200/80 leading-relaxed">{item.lesson}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Bottom CTA ── */}
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center space-y-4">
          <p className="text-2xl font-black uppercase tracking-tight">You&apos;re Building Your Stack</p>
          <p className="text-sm text-gray-400 max-w-lg mx-auto leading-relaxed">
            The tools above are how crypto professionals operate. The courses on this platform teach you how to use them.
            The OnlyCrypto mirror trading system is how you start earning XRP while you learn.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <a href="https://onlycrypto.io" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-500 hover:bg-violet-600 text-white text-xs font-black uppercase tracking-widest transition-colors">
              <ExternalLink className="w-3.5 h-3.5" />
              Open Dashboard
            </a>
            <button onClick={() => router.push('/')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/20 text-gray-300 hover:bg-white/5 text-xs font-black uppercase tracking-widest transition-colors">
              Back to Courses
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
