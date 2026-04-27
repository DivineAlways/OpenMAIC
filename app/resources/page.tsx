'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, ExternalLink, BarChart2, Search, Building2,
  RefreshCw, Wallet, Newspaper, Globe, TrendingUp
} from 'lucide-react';

type Resource = {
  name: string;
  url: string;
  description: string;
  tag?: string;
};

type Category = {
  id: string;
  label: string;
  emoji: string;
  icon: React.ReactNode;
  color: string;
  borderColor: string;
  bgColor: string;
  textColor: string;
  resources: Resource[];
};

const CATEGORIES: Category[] = [
  {
    id: 'market-data',
    label: 'Market Data & Research',
    emoji: '📊',
    icon: <BarChart2 className="w-5 h-5" />,
    color: 'from-blue-500 to-indigo-600',
    borderColor: 'border-blue-500/30',
    bgColor: 'bg-blue-500/10',
    textColor: 'text-blue-400',
    resources: [
      { name: 'CoinMarketCap', url: 'https://coinmarketcap.com', description: 'Prices, rankings, volume, market cap, and trending coins. The most visited crypto site in the world.' },
      { name: 'CoinGecko', url: 'https://coingecko.com', description: 'Alternative to CMC with deeper raw data, DeFi tracking, and on-chain metrics.' },
      { name: 'CoinStats', url: 'https://coinstats.app', description: 'Track your portfolio across multiple exchanges and wallets in one dashboard.' },
      { name: 'Messari', url: 'https://messari.io', description: 'Institutional-level research, reports, and asset intelligence used by funds and analysts.' },
      { name: 'TradingView', url: 'https://tradingview.com', description: 'Advanced charting for traders — indicators, strategies, and community ideas for every market.' },
    ],
  },
  {
    id: 'explorers',
    label: 'Block Explorers',
    emoji: '🔎',
    icon: <Search className="w-5 h-5" />,
    color: 'from-emerald-500 to-teal-600',
    borderColor: 'border-emerald-500/30',
    bgColor: 'bg-emerald-500/10',
    textColor: 'text-emerald-400',
    resources: [
      { name: 'Etherscan', url: 'https://etherscan.io', description: 'Verify any Ethereum transaction, wallet, or smart contract. The definitive Ethereum explorer.', tag: 'Ethereum' },
      { name: 'XRPL Explorer', url: 'https://livenet.xrpl.org', description: 'Explore all XRP Ledger transactions live — wallets, payments, DEX orders, and trust lines.', tag: 'XRP' },
      { name: 'Blockchain.com', url: 'https://blockchain.com/explorer', description: 'Bitcoin and Ethereum explorer — track any BTC address or transaction in real time.', tag: 'Bitcoin' },
      { name: 'Solscan', url: 'https://solscan.io', description: 'Solana blockchain explorer for transactions, tokens, NFTs, and programs.', tag: 'Solana' },
    ],
  },
  {
    id: 'exchanges',
    label: 'Exchanges (CEX)',
    emoji: '🏦',
    icon: <Building2 className="w-5 h-5" />,
    color: 'from-amber-500 to-orange-600',
    borderColor: 'border-amber-500/30',
    bgColor: 'bg-amber-500/10',
    textColor: 'text-amber-400',
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
    id: 'dex',
    label: 'Decentralized Exchanges (DEX)',
    emoji: '🔄',
    icon: <RefreshCw className="w-5 h-5" />,
    color: 'from-violet-500 to-purple-600',
    borderColor: 'border-violet-500/30',
    bgColor: 'bg-violet-500/10',
    textColor: 'text-violet-400',
    resources: [
      { name: 'Uniswap', url: 'https://uniswap.org', description: 'The largest DEX on Ethereum. Trade any ERC-20 token directly from your wallet — no account, no ID.', tag: 'Ethereum' },
      { name: 'PancakeSwap', url: 'https://pancakeswap.finance', description: 'Leading DEX on BNB Chain. Lower fees than Ethereum, large selection of DeFi tokens.', tag: 'BNB Chain' },
      { name: 'SushiSwap', url: 'https://sushi.com', description: 'Multi-chain DEX with swaps, yield farming, and lending across 20+ networks.', tag: 'Multi-Chain' },
    ],
  },
  {
    id: 'wallets',
    label: 'Wallets',
    emoji: '🔐',
    icon: <Wallet className="w-5 h-5" />,
    color: 'from-rose-500 to-red-600',
    borderColor: 'border-rose-500/30',
    bgColor: 'bg-rose-500/10',
    textColor: 'text-rose-400',
    resources: [
      { name: 'MetaMask', url: 'https://metamask.io', description: 'The most widely used Ethereum browser wallet. Essential for interacting with DeFi and Web3 dApps.', tag: 'Browser Extension' },
      { name: 'Trust Wallet', url: 'https://trustwallet.com', description: 'Mobile wallet supporting 100+ blockchains. Owned by Binance — beginner-friendly with built-in swap.', tag: 'Mobile' },
      { name: 'Ledger', url: 'https://ledger.com', description: 'The leading hardware cold wallet. Your private keys stay offline — the gold standard for security.', tag: 'Hardware' },
      { name: 'Phantom', url: 'https://phantom.app', description: 'The go-to wallet for Solana. Clean interface, built-in NFT viewer and token swaps.', tag: 'Solana' },
    ],
  },
  {
    id: 'news',
    label: 'News, Media & DeFi Tools',
    emoji: '📰',
    icon: <Newspaper className="w-5 h-5" />,
    color: 'from-cyan-500 to-sky-600',
    borderColor: 'border-cyan-500/30',
    bgColor: 'bg-cyan-500/10',
    textColor: 'text-cyan-400',
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

function ResourceCard({ resource, textColor }: { resource: Resource; textColor: string }) {
  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col gap-2 p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-bold text-white group-hover:text-white transition-colors">
            {resource.name}
          </span>
          {resource.tag && (
            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${textColor} border-current opacity-70`}>
              {resource.tag}
            </span>
          )}
        </div>
        <ExternalLink className={`w-3.5 h-3.5 shrink-0 mt-0.5 opacity-40 group-hover:opacity-100 group-hover:${textColor} transition-all`} />
      </div>
      <p className="text-xs text-gray-400 leading-relaxed">{resource.description}</p>
    </a>
  );
}

export default function ResourcesPage() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const displayed = activeCategory
    ? CATEGORIES.filter(c => c.id === activeCategory)
    : CATEGORIES;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Top nav */}
      <div className="sticky top-0 z-20 bg-gray-950/90 backdrop-blur-md border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
          <button
            onClick={() => router.push('/')}
            className="p-2 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-violet-400" />
            <span className="text-sm font-black uppercase tracking-widest text-white">Crypto Toolkit</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-10">

        {/* Hero */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-violet-400">
            <TrendingUp className="w-3.5 h-3.5" />
            OnlyCrypto Academy
          </div>
          <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tight">
            Industry Toolkit
          </h1>
          <p className="text-gray-400 max-w-2xl text-sm leading-relaxed">
            Every tool a serious crypto participant needs — from market data and block explorers to
            exchanges and wallets. Click any card to open the site directly.
          </p>
        </div>

        {/* OC Integration callout */}
        <div className="rounded-2xl border border-violet-500/30 bg-violet-500/10 p-6 space-y-2">
          <p className="text-xs font-black uppercase tracking-widest text-violet-400">OnlyCrypto Integration</p>
          <p className="text-sm text-gray-300 leading-relaxed">
            Instead of guessing which trader to follow on an exchange — <span className="text-white font-bold">mirror proven traders on OnlyCrypto</span> and earn XRP automatically.
            Instead of learning to trade alone — <span className="text-white font-bold">let the system work for you</span> while you learn at your own pace below.
          </p>
        </div>

        {/* Category filter pills */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveCategory(null)}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${
              activeCategory === null
                ? 'bg-violet-500 border-violet-500 text-white'
                : 'border-white/20 text-gray-400 hover:border-white/40 hover:text-white'
            }`}
          >
            All Tools
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                activeCategory === cat.id
                  ? `${cat.bgColor} ${cat.borderColor} ${cat.textColor}`
                  : 'border-white/20 text-gray-400 hover:border-white/40 hover:text-white'
              }`}
            >
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>

        {/* Category sections */}
        <div className="space-y-10">
          {displayed.map(cat => (
            <section key={cat.id} className="space-y-4">
              {/* Section header */}
              <div className={`flex items-center gap-3 p-4 rounded-2xl border ${cat.borderColor} ${cat.bgColor}`}>
                <div className={`${cat.textColor}`}>{cat.icon}</div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Category</p>
                  <h2 className={`text-base font-black ${cat.textColor}`}>
                    {cat.emoji} {cat.label}
                  </h2>
                </div>
                <span className="ml-auto text-xs font-bold text-gray-500">{cat.resources.length} tools</span>
              </div>

              {/* Resource cards grid */}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {cat.resources.map(r => (
                  <ResourceCard key={r.name} resource={r} textColor={cat.textColor} />
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Bottom callout */}
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center space-y-4">
          <p className="text-2xl font-black uppercase tracking-tight">You&apos;re Building Your Stack</p>
          <p className="text-sm text-gray-400 max-w-lg mx-auto leading-relaxed">
            The tools above are how crypto professionals operate. The courses on this platform teach you how to use them.
            The OnlyCrypto mirror trading system is how you start earning XRP while you learn.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <a
              href="https://onlycrypto.io"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-500 hover:bg-violet-600 text-white text-xs font-black uppercase tracking-widest transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open Dashboard
            </a>
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/20 text-gray-300 hover:bg-white/5 text-xs font-black uppercase tracking-widest transition-colors"
            >
              Back to Courses
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
