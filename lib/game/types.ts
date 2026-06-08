export type GameMode = 'standard' | 'practice' | 'tournament' | 'duel' | 'roulette' | 'pot'

export type ZoneId =
  | 'blockchain-basics'
  | 'xrpl-ledger'
  | 'wallet-security'
  | 'trading-psychology'
  | 'risk-management'
  | 'technical-analysis'
  | 'defi-district'
  | 'nft-marketplace'
  | 'ai-trading-lab'
  | 'liquidity-pool'
  | 'tokenomics-tower'
  | 'dao-governance'
  | 'metaverse-city'
  | 'wealth-mindset'
  | 'bear-market'
  | 'bull-market'

export interface Zone {
  id: ZoneId
  name: string
  emoji: string
  topic: string
  color: string
  unlocked: boolean
  completed: boolean
  classroomId?: string
}

export interface PlayerStats {
  user_id: string
  total_xp: number
  level: number
  oc_balance: number
  oc_earned_today: number
  oc_earned_week: number
  tournament_wins: number
  duel_wins: number
  pot_wins: number
}

export interface GameSession {
  session_id: string
  user_id: string
  mode: 'standard' | 'practice'
  started_at: string
  ended_at?: string
  xp_earned: number
  oc_earned: number
  score: number
  zones_completed: string[]
  board_state?: BoardState
  completed: boolean
}

export interface BoardState {
  current_position: number
  assets: string[]
  oc_balance: number
  xp: number
  active_effects: Effect[]
}

export interface Effect {
  type: string
  value: number
  rounds_remaining: number
}

export interface QuizQuestion {
  question_id: string
  zone: ZoneId
  question_text: string
  options: string[]
  correct_index: number
  difficulty: 'easy' | 'medium' | 'hard'
  explanation?: string
}

export interface GameEvent {
  event_id: string
  event_type: 'bull' | 'bear' | 'skill'
  name: string
  description: string
  effect: Record<string, any>
}

export interface GameAsset {
  id: string
  label: string
  cost: number
  description: string
  benefit: string
  icon: string
}

export interface Tournament {
  tournament_id: string
  name: string
  entry_fee_oc: number
  max_players: number
  start_at: string
  end_at: string
  status: 'open' | 'active' | 'finished' | 'cancelled'
  pot_total: number
}

export interface Duel {
  duel_id: string
  challenger_id: string
  opponent_id?: string
  wager_oc: number
  status: 'waiting' | 'active' | 'finished' | 'cancelled' | 'timeout'
  winner_id?: string
  challenger_score: number
  opponent_score: number
  questions?: QuizQuestion[]
}

export interface RouletteScenario {
  scenario_id: string
  description: string
  context?: string
  options: string[]
  correct_index: number
  explanation: string
  real_date?: string
}

export interface PotRoom {
  room_id: string
  room_level: 'rookie' | 'pro' | 'whale'
  entry_fee_oc: number
  max_players: number
  min_players: number
  status: 'open' | 'active' | 'finished' | 'cancelled'
  pot_total: number
  winner_id?: string
  winner_payout?: number
}

export const LEVEL_THRESHOLDS = [0, 500, 1500, 3000, 6000, 12000, 25000, 50000, 100000]

export function getLevel(xp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) return i + 1
  }
  return 1
}

export const LEVEL_NAMES = [
  '', 'Rookie', 'Learner', 'Holder', 'Trader',
  'Analyst', 'Strategist', 'Architect', 'Visionary', 'OnlyCrypto OG'
]

export const XP_REWARDS = {
  correct_answer: 50,
  wrong_answer: -10,
  perfect_zone: 200,
  good_decision: 150,
  bad_decision: -100,
  complete_board: 500,
  first_time_zone: 25,
}

export const OC_REWARDS = {
  correct_answer: 0.5,
  perfect_zone: 2,
  good_decision: 1,
  complete_board: 5,
}

export const DAILY_OC_CAP = 50
export const SESSION_OC_CAP = 25

export const GAME_ASSETS: GameAsset[] = [
  { id: 'mining-rig',       label: 'Mining Rig',           cost: 5,  description: '+1 OC per round passively',                    benefit: 'passive_oc_1',      icon: '⚙️' },
  { id: 'validator-node',   label: 'Validator Node',        cost: 10, description: '+2 OC per round + governance vote',           benefit: 'passive_oc_2',      icon: '🔗' },
  { id: 'trading-bot',      label: 'Trading Bot',           cost: 8,  description: 'Doubles OC reward on next correct answer',    benefit: 'double_next',       icon: '🤖' },
  { id: 'nft-collection',   label: 'NFT Collection',        cost: 6,  description: '+badge unlock + avatar upgrade',              benefit: 'badge_unlock',      icon: '🎨' },
  { id: 'liquidity-pool',   label: 'Liquidity Pool',        cost: 12, description: '+3 OC per round (variable, can drop)',        benefit: 'passive_oc_3',      icon: '💧' },
  { id: 'defi-vault',       label: 'DeFi Vault',            cost: 15, description: 'Protects 50% of OC if you hit a bad event',  benefit: 'protection_50',     icon: '🏦' },
  { id: 'ai-agent',         label: 'AI Agent',              cost: 20, description: 'Gives you a hint on next challenge',         benefit: 'hint',              icon: '🧠' },
  { id: 'academy-badge',    label: 'Academy Badge',         cost: 3,  description: 'Unlocks a new district',                    benefit: 'unlock_district',   icon: '🎓' },
  { id: 'dao-membership',   label: 'DAO Membership',        cost: 7,  description: 'Vote on next event card drawn',              benefit: 'dao_vote',          icon: '🗳️' },
  { id: 'treasury-wallet',  label: 'Treasury Wallet',       cost: 25, description: 'Store OC safe — earn 10% bonus at end',     benefit: 'treasury_bonus',    icon: '💎' },
]

export const ALL_ZONES: Zone[] = [
  { id: 'blockchain-basics',  name: 'Blockchain Basics',     emoji: '🔗', topic: 'How blockchains work',          color: '#3b82f6', unlocked: true,  completed: false, classroomId: 'oc-elem-blockchain' },
  { id: 'xrpl-ledger',        name: 'XRP Ledger District',   emoji: '💧', topic: 'XRP, XRPL, Ripple',            color: '#06b6d4', unlocked: true,  completed: false, classroomId: 'oc-hs-blockchain' },
  { id: 'wallet-security',    name: 'Wallet Security HQ',    emoji: '🔐', topic: 'Keys, custody, security',       color: '#f59e0b', unlocked: true,  completed: false, classroomId: 'oc-elem-security' },
  { id: 'trading-psychology', name: 'Trading Psychology',    emoji: '🧠', topic: 'Emotions and decisions',        color: '#8b5cf6', unlocked: true,  completed: false, classroomId: 'oc-elem-trading' },
  { id: 'risk-management',    name: 'Risk Management',       emoji: '⚖️',  topic: 'Position sizing, stop losses',  color: '#ef4444', unlocked: true,  completed: false, classroomId: 'oc-hs-trading' },
  { id: 'technical-analysis', name: 'Technical Analysis',    emoji: '📊', topic: 'Charts and patterns',           color: '#10b981', unlocked: true,  completed: false, classroomId: 'oc-trading-guide' },
  { id: 'defi-district',      name: 'DeFi District',         emoji: '🏗️',  topic: 'Protocols, liquidity',         color: '#f97316', unlocked: true,  completed: false, classroomId: 'oc-elem-defi' },
  { id: 'nft-marketplace',    name: 'NFT Marketplace',       emoji: '🎨', topic: 'NFTs and collections',          color: '#ec4899', unlocked: true,  completed: false },
  { id: 'ai-trading-lab',     name: 'AI Trading Lab',        emoji: '🤖', topic: 'AI tools and trading bots',    color: '#6366f1', unlocked: false, completed: false },
  { id: 'liquidity-pool',     name: 'Liquidity Pool Zone',   emoji: '💦', topic: 'AMMs and liquidity pools',     color: '#14b8a6', unlocked: false, completed: false, classroomId: 'oc-defi-guide' },
  { id: 'tokenomics-tower',   name: 'Tokenomics Tower',      emoji: '🏛️',  topic: 'Supply, inflation, utility',   color: '#a855f7', unlocked: false, completed: false, classroomId: 'oc-elem-crypto' },
  { id: 'dao-governance',     name: 'DAO Governance',        emoji: '🗳️', topic: 'Voting and DAOs',               color: '#64748b', unlocked: false, completed: false },
  { id: 'metaverse-city',     name: 'Metaverse City',        emoji: '🌐', topic: 'Virtual economies',            color: '#0ea5e9', unlocked: false, completed: false },
  { id: 'wealth-mindset',     name: 'Wealth Mindset',        emoji: '💡', topic: 'Psychology of wealth',         color: '#eab308', unlocked: false, completed: false },
  { id: 'bear-market',        name: 'Bear Market Survival',  emoji: '🐻', topic: 'Downturns and strategy',       color: '#dc2626', unlocked: false, completed: false },
  { id: 'bull-market',        name: 'Bull Market Strategy',  emoji: '🐂', topic: 'Uptrends and profit taking',   color: '#16a34a', unlocked: false, completed: false },
]
