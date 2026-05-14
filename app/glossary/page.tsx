'use client';

import { useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ArrowLeft, BookOpen, AlertTriangle, Link2, ChevronDown, ChevronUp } from 'lucide-react';

// ─── A–Z Glossary Database ───────────────────────────────────────────────────
const GLOSSARY: Record<string, {
  definition: string;
  example: string;
  risk?: string;
  related: string[];
  level: 'Elementary' | 'High School' | 'College';
}> = {
  'Airdrop': { definition: 'Free distribution of tokens to wallet addresses, usually as a marketing or community reward.', example: 'Uniswap airdropped 400 UNI tokens to every address that had used the protocol before a certain date.', risk: 'Scam airdrops may require connecting your wallet — never approve unknown token contracts.', related: ['Token', 'Wallet', 'Smart Contract'], level: 'Elementary' },
  'Altcoin': { definition: 'Any cryptocurrency other than Bitcoin. Includes Ethereum, XRP, Solana, and thousands more.', example: 'When Bitcoin drops 10%, altcoins often drop 20–30% — they tend to amplify Bitcoin\'s moves.', related: ['Bitcoin', 'Cryptocurrency', 'Market Cap'], level: 'Elementary' },
  'AMM': { definition: 'Automated Market Maker — a smart contract that sets token prices using a mathematical formula instead of matching buyers and sellers.', example: 'Uniswap uses x × y = k. When you buy ETH from the pool, the ETH supply drops and price rises automatically.', risk: 'AMM pools expose liquidity providers to impermanent loss when token prices diverge.', related: ['Liquidity Pool', 'DEX', 'Impermanent Loss', 'x × y = k'], level: 'High School' },
  'APY': { definition: 'Annual Percentage Yield — the real rate of return including compound interest over one year.', example: 'A DeFi protocol offering 20% APY means $1,000 grows to $1,200 after one year if rates hold constant.', risk: 'DeFi APYs are variable and can drop to near zero overnight if liquidity migrates.', related: ['Yield Farming', 'Staking', 'DeFi'], level: 'High School' },
  'Address': { definition: 'A unique identifier for a crypto wallet — like a bank account number. Anyone can send funds to it.', example: 'An Ethereum address looks like: 0x742d35Cc6634C0532925a3b8D4C9C3f...', risk: 'Always double-check addresses before sending. There is no undo in crypto.', related: ['Wallet', 'Private Key', 'Public Key'], level: 'Elementary' },
  'Bitcoin': { definition: 'The first and largest cryptocurrency by market cap. Created in 2008 by Satoshi Nakamoto. Hard cap of 21 million coins.', example: 'Bitcoin was worth $0.01 in 2009 and reached over $100,000 in 2024.', related: ['Blockchain', 'Proof of Work', 'Satoshi'], level: 'Elementary' },
  'Block': { definition: 'A batch of verified transactions grouped together and added to the blockchain. Each block references the previous one via its hash.', example: 'Bitcoin produces one block roughly every 10 minutes, containing ~2,000 transactions.', related: ['Blockchain', 'Hash', 'Miner'], level: 'Elementary' },
  'Blockchain': { definition: 'A distributed ledger where data is stored in linked blocks across thousands of computers. Immutable and transparent.', example: 'Every Bitcoin transaction ever made is recorded on the blockchain — viewable by anyone at blockchain.com.', related: ['Block', 'Node', 'Decentralization', 'Consensus'], level: 'Elementary' },
  'Bridge': { definition: 'A protocol that moves tokens between two different blockchains by locking them on one chain and minting equivalents on another.', example: 'Bridging ETH from Ethereum to Arbitrum: ETH is locked in a contract on Ethereum, WETH is minted on Arbitrum.', risk: 'Bridges are high-value targets. Over $2B was stolen from bridges in 2022 including Ronin ($625M) and Wormhole ($320M).', related: ['Wrapped Token', 'Cross-Chain', 'Smart Contract', 'MEV'], level: 'High School' },
  'Bull Market': { definition: 'A sustained period of rising prices and positive investor sentiment. In crypto, typically defined as a 20%+ rise from recent lows.', example: '2020–2021 was a major bull market: Bitcoin rose from $4,000 to nearly $69,000.', related: ['Bear Market', 'Market Cycle', 'FOMO'], level: 'High School' },
  'Bear Market': { definition: 'A sustained period of falling prices. Typically defined as a 20%+ decline from recent highs.', example: '2022 was a crypto bear market — Bitcoin fell from $69,000 to under $16,000.', related: ['Bull Market', 'Market Cycle', 'Volatility'], level: 'High School' },
  'Candlestick': { definition: 'A chart element showing open, high, low, and close price for a time period. Green = price rose. Red = price fell.', example: 'A green daily candlestick means the closing price was higher than the opening price that day.', related: ['Technical Analysis', 'Support', 'Resistance', 'Volume'], level: 'High School' },
  'CEX': { definition: 'Centralized Exchange — a company-run platform where you trade crypto. The company holds your funds. Examples: Coinbase, Binance, Kraken.', example: 'Coinbase is a CEX. You create an account, verify your ID, deposit funds, and the exchange holds them.', risk: 'CEXs can be hacked, go bankrupt, or freeze withdrawals. "Not your keys, not your coins."', related: ['DEX', 'Custodial Wallet', 'KYC'], level: 'Elementary' },
  'Cold Wallet': { definition: 'A crypto wallet that is not connected to the internet. Private keys are stored on a physical device (hardware wallet) or paper.', example: 'Ledger Nano X and Trezor Model T are popular cold wallets. Signing a transaction requires physical confirmation on the device.', related: ['Hot Wallet', 'Hardware Wallet', 'Private Key', 'Seed Phrase'], level: 'High School' },
  'Coin': { definition: 'A cryptocurrency that operates on its own blockchain. Distinct from tokens which run on existing blockchains.', example: 'BTC (Bitcoin), ETH (Ethereum), and XRP are coins — they each have their own blockchain.', related: ['Token', 'Altcoin', 'Blockchain'], level: 'Elementary' },
  'Consensus': { definition: 'The mechanism by which all nodes in a blockchain network agree on the valid state of the ledger.', example: 'Bitcoin uses Proof of Work for consensus. XRPL uses RPCA. Ethereum uses Proof of Stake.', related: ['Proof of Work', 'Proof of Stake', 'RPCA', 'Validator'], level: 'Elementary' },
  'Collateralization': { definition: 'Locking assets as security for a loan. In DeFi, you must over-collateralize — locking $150 to borrow $100.', example: 'On Aave, you deposit 1 ETH ($3,000) as collateral and borrow up to $2,100 USDC (70% LTV).', risk: 'If collateral value drops below the liquidation threshold, bots will liquidate your position.', related: ['DeFi', 'Lending Protocol', 'Health Factor', 'Liquidation'], level: 'College' },
  'Cryptographic Hashing': { definition: 'A one-way mathematical function that converts any input into a fixed-length output (hash). Deterministic and collision-resistant.', example: 'SHA-256("hello") = 2cf24dba5fb0a... — changing even one character completely changes the output.', related: ['SHA-256', 'Block', 'Merkle Tree'], level: 'College' },
  'DAO': { definition: 'Decentralized Autonomous Organization — a group governed by token holders via on-chain voting, with rules written in smart contracts.', example: 'Uniswap DAO governs the Uniswap protocol. UNI holders vote on fee structures, treasury spending, and upgrades.', risk: 'Governance attacks: an attacker can buy enough tokens to pass malicious proposals (Beanstalk: $182M lost).', related: ['Governance Token', 'Smart Contract', 'Token'], level: 'High School' },
  'DeFi': { definition: 'Decentralized Finance — financial services (lending, trading, earning yield) built on blockchains using smart contracts, with no company in the middle.', example: 'On Aave (DeFi), you can earn 5% APY on USDC deposits. A traditional bank might offer 0.5%.', risk: 'Smart contract bugs, oracle manipulation, and admin key risk can result in total loss of funds.', related: ['Smart Contract', 'AMM', 'Yield Farming', 'Liquidity Pool'], level: 'Elementary' },
  'DEX': { definition: 'Decentralized Exchange — a protocol where users trade directly from their wallets via smart contracts. No company, no account, no ID.', example: 'Uniswap is a DEX. You connect MetaMask, select tokens, and the smart contract executes the swap automatically.', related: ['AMM', 'CEX', 'Liquidity Pool', 'Swap'], level: 'Elementary' },
  'ECDSA': { definition: 'Elliptic Curve Digital Signature Algorithm — the cryptographic method used to sign transactions, proving wallet ownership without revealing the private key.', example: 'When you approve a MetaMask transaction, ECDSA creates a signature using your private key that the network can verify.', related: ['Private Key', 'Public Key', 'Cryptographic Hashing'], level: 'College' },
  'Fiat': { definition: 'Government-issued currency not backed by a commodity. USD, EUR, GBP are fiat currencies.', example: 'When you deposit dollars into Coinbase to buy Bitcoin, those dollars are fiat currency.', related: ['Stablecoin', 'Cryptocurrency', 'Inflation'], level: 'Elementary' },
  'FOMO': { definition: 'Fear Of Missing Out — the emotional impulse to buy during a price spike because you fear missing gains.', example: 'When Bitcoin broke $60,000 in 2021, retail FOMO drove millions of new buyers — many bought at the top.', risk: 'FOMO-driven buying typically occurs near market peaks. Trading on emotion is the fastest way to lose money.', related: ['Bull Market', 'Volatility', 'Trading Psychology'], level: 'Elementary' },
  'Fork': { definition: 'A change to a blockchain\'s protocol. Soft forks are backwards-compatible. Hard forks are not — they can split the chain into two.', example: 'Bitcoin Cash was created by a hard fork of Bitcoin in 2017 over a block size disagreement.', related: ['Blockchain', 'Consensus', 'Governance'], level: 'High School' },
  'Gas': { definition: 'The fee paid to validators/miners to process a transaction on a blockchain. Measured in the chain\'s native token.', example: 'Sending ETH on Ethereum might cost $2–$50 in gas depending on network congestion. On XRPL, it costs $0.0002.', related: ['Transaction', 'Validator', 'XRPL', 'Layer 2'], level: 'Elementary' },
  'Governance Token': { definition: 'A token that gives holders the right to vote on protocol decisions — fee changes, treasury spending, upgrades.', example: 'Holding UNI (Uniswap) lets you vote on protocol proposals. 1 UNI = 1 vote.', risk: 'Whale domination: large holders can pass proposals against the community\'s interest.', related: ['DAO', 'Token', 'Decentralization'], level: 'College' },
  'Hash': { definition: 'A fixed-length digital fingerprint of data. Any change to input data produces a completely different hash.', example: 'Each Bitcoin block contains the hash of the previous block — this links them in an unbreakable chain.', related: ['Cryptographic Hashing', 'Block', 'SHA-256'], level: 'Elementary' },
  'Health Factor': { definition: 'A DeFi lending metric showing how safe a borrowing position is. Below 1.0 triggers automatic liquidation.', example: 'You borrow on Aave with a health factor of 1.5. If ETH price drops 33%, your health factor hits 1.0 and you get liquidated.', risk: 'Market volatility can rapidly drop health factors. Monitor positions during high volatility.', related: ['Collateralization', 'Liquidation', 'Aave', 'DeFi'], level: 'College' },
  'Hot Wallet': { definition: 'A crypto wallet connected to the internet. Convenient for frequent use but more vulnerable to online attacks.', example: 'MetaMask, Trust Wallet, and exchange accounts are hot wallets. Good for daily use, not for long-term storage.', risk: 'Internet-connected wallets are exposed to phishing, malware, and browser exploits.', related: ['Cold Wallet', 'Seed Phrase', 'Private Key'], level: 'High School' },
  'Impermanent Loss': { definition: 'The loss experienced by liquidity providers when the price ratio of pooled tokens changes from when they deposited.', example: 'You deposit ETH + USDC 50/50. ETH doubles. You now hold less ETH than if you had just held — that difference is impermanent loss.', risk: 'The loss becomes permanent when you withdraw. Stablecoin pairs minimize IL since prices stay close.', related: ['AMM', 'Liquidity Pool', 'Yield Farming', 'DeFi'], level: 'High School' },
  'Inflation': { definition: 'In crypto: when a token\'s supply increases over time, potentially diluting existing holders. Opposite of deflationary.', example: 'Many PoS networks inflate supply by 2–5% annually to pay validators. If demand doesn\'t grow equally, price is diluted.', related: ['Tokenomics', 'Staking', 'Deflationary'], level: 'High School' },
  'KYC': { definition: 'Know Your Customer — identity verification required by regulated exchanges to comply with anti-money-laundering laws.', example: 'To withdraw more than $1,000/day from Coinbase, you must complete KYC: upload a government ID and selfie.', related: ['CEX', 'Fiat', 'Regulation'], level: 'Elementary' },
  'Layer 1': { definition: 'The base blockchain — Bitcoin, Ethereum, XRP Ledger. Provides security and decentralization but has limited transaction throughput.', example: 'Ethereum L1 processes ~15 TPS. Its L2 networks (Arbitrum, Optimism) process thousands of TPS.', related: ['Layer 2', 'Blockchain', 'Trilemma', 'Scalability'], level: 'High School' },
  'Layer 2': { definition: 'A network built on top of a Layer 1 to improve speed and reduce costs. Periodically settles batches back to L1 for security.', example: 'Arbitrum is an Ethereum L2. Transactions cost $0.05 vs $5 on mainnet, with same security guarantees.', related: ['Layer 1', 'Rollup', 'Scalability'], level: 'High School' },
  'Ledger': { definition: 'A record-keeping system. In crypto, a distributed ledger is shared across thousands of computers with no central controller.', example: 'The Bitcoin ledger records every BTC transaction since 2009. It\'s public, immutable, and held by thousands of nodes.', related: ['Blockchain', 'Node', 'Immutability'], level: 'Elementary' },
  'Leverage': { definition: 'Borrowing capital to amplify trading positions. 10× leverage means $1,000 controls a $10,000 position.', example: '10× leverage on a 5% BTC price drop results in a 50% loss. A 10% drop liquidates the entire position.', risk: 'Leverage amplifies losses equally to gains. Most retail traders lose money using leverage.', related: ['Liquidation', 'Futures', 'Margin', 'Risk Management'], level: 'High School' },
  'Liquidation': { definition: 'When a leveraged or collateralized position is automatically closed because losses have reached the maximum allowed.', example: 'On a 10× leverage long, a 10% price drop triggers liquidation — the exchange closes your position and keeps the collateral.', risk: 'Liquidations cascade: mass liquidations push price down further, triggering more liquidations.', related: ['Leverage', 'Health Factor', 'Collateralization'], level: 'High School' },
  'Liquidity': { definition: 'How easily an asset can be bought or sold without significantly moving its price.', example: 'Bitcoin is highly liquid — you can sell $1M with minimal price impact. A small altcoin might move 10% on a $10k sale.', related: ['Liquidity Pool', 'Slippage', 'Market Cap'], level: 'High School' },
  'Liquidity Pool': { definition: 'A smart contract holding reserves of two tokens that enables DEX trading via the AMM formula.', example: 'The ETH/USDC Uniswap pool holds ~$300M. Anyone can trade against it or deposit to earn fees.', risk: 'LP positions are subject to impermanent loss and smart contract risk.', related: ['AMM', 'DEX', 'Impermanent Loss', 'Yield Farming'], level: 'Elementary' },
  'MACD': { definition: 'Moving Average Convergence Divergence — a momentum indicator. Bullish when MACD line crosses above signal line.', example: 'When MACD crosses above its signal line on Bitcoin\'s weekly chart, it has historically preceded major bull runs.', related: ['RSI', 'Moving Average', 'Technical Analysis'], level: 'High School' },
  'Market Cap': { definition: 'Total value of a cryptocurrency. Calculated as: current price × circulating supply.', example: 'BTC at $100,000 × 19.5M supply = $1.95T market cap. Larger market cap generally = lower volatility.', related: ['Circulating Supply', 'Tokenomics', 'Altcoin'], level: 'High School' },
  'Merkle Tree': { definition: 'A binary tree of hashes where every leaf is a transaction hash and every parent node is a hash of its two children, up to a single Merkle Root stored in the block header. Lets anyone prove a transaction is in a block with just a handful of hashes — no need to download the full block.', example: 'Bitcoin blocks hold ~2,000 transactions. A Merkle proof needs only ~11 hashes (log₂ 2000 ≈ 11) to prove any single transaction is included — 99.5% less data than sending the whole block.', related: ['Hash', 'Block', 'Cryptographic Hashing', 'Transaction'], level: 'High School' },
  'MEV': { definition: 'Maximal Extractable Value — profit extracted by block validators by reordering, inserting, or censoring transactions.', example: 'A sandwich attack: bot front-runs your large swap, your swap executes at a worse price, bot back-runs and profits.', risk: 'MEV costs Ethereum users an estimated $1B+ annually. Use private mempools to protect against sandwich attacks.', related: ['Bridge', 'DEX', 'Slippage', 'Swap'], level: 'College' },
  'Mining': { definition: 'The process of competing to solve a cryptographic puzzle to add the next block and earn a block reward. Used in Proof of Work.', example: 'Bitcoin miners run specialized ASIC hardware 24/7, consuming enormous electricity to earn BTC block rewards.', related: ['Proof of Work', 'Hash', 'Block', 'Validator'], level: 'Elementary' },
  'Moving Average': { definition: 'A technical indicator that smooths price data by averaging closing prices over a set period (e.g., 50-day MA, 200-day MA).', example: 'The Golden Cross (50MA crossing above 200MA) on Bitcoin has historically signaled the start of bull markets.', related: ['MACD', 'RSI', 'Technical Analysis', 'Trend'], level: 'High School' },
  'Multi-Signature': { definition: 'A wallet requiring M signatures from N total keys to authorize a transaction (e.g., 2-of-3 multisig).', example: 'A DAO treasury uses 3-of-5 multisig: any three of five keyholders must sign to move funds.', related: ['Cold Wallet', 'Security', 'XRPL'], level: 'High School' },
  'NFT': { definition: 'Non-Fungible Token — a unique token on a blockchain representing ownership of a digital (or physical) item.', example: 'A concert ticket as an NFT: verifiable, transferable, and anti-counterfeit. The organizer can verify authenticity instantly.', related: ['Token', 'Smart Contract', 'Blockchain'], level: 'Elementary' },
  'Node': { definition: 'A computer that participates in a blockchain network by storing a copy of the ledger and validating transactions.', example: 'There are over 15,000 Bitcoin full nodes worldwide. Anyone can run one on a regular computer.', related: ['Validator', 'Blockchain', 'Decentralization'], level: 'Elementary' },
  'ODL': { definition: 'On-Demand Liquidity — Ripple\'s product using XRP as a bridge currency to eliminate pre-funded nostro accounts in cross-border payments.', example: 'A US bank uses ODL: USD converts to XRP (seconds), XRP converts to PHP, recipient gets pesos — no pre-funding needed.', related: ['XRP', 'XRPL', 'Cross-Border Payments', 'Bridge Currency'], level: 'College' },
  'Oracle': { definition: 'A service that provides real-world data (like price feeds) to smart contracts, which cannot access external data on their own.', example: 'Chainlink is the most used oracle. DeFi lending protocols use Chainlink price feeds to determine collateral values.', risk: 'Oracle manipulation: if a price feed is manipulated, lending protocols can be drained. Happened to Mango Markets ($117M).', related: ['Smart Contract', 'DeFi', 'MEV'], level: 'College' },
  'Private Key': { definition: 'A secret number that proves ownership of a crypto wallet and authorizes transactions. Never share it with anyone.', example: 'A private key looks like: 5KYZdUEo39z3FPrtuX2QbbwGnNP5zTd7yyr2SC1j299sBCnWjss', risk: 'Anyone with your private key has full, irrevocable control of your wallet. There is no recovery if compromised.', related: ['Public Key', 'Seed Phrase', 'Wallet', 'ECDSA'], level: 'Elementary' },
  'Proof of Stake': { definition: 'A consensus mechanism where validators lock (stake) crypto as collateral. Selected to validate blocks proportionally to their stake.', example: 'Ethereum uses PoS. Validators stake 32 ETH minimum. Dishonest behavior causes "slashing" — loss of staked ETH.', related: ['Proof of Work', 'Validator', 'Staking', 'Consensus'], level: 'Elementary' },
  'Proof of Work': { definition: 'A consensus mechanism where miners compete to solve cryptographic puzzles. The winner adds the next block and earns a reward.', example: 'Bitcoin uses PoW. Mining consumes enormous electricity — the Bitcoin network uses more power than some countries.', related: ['Mining', 'Proof of Stake', 'Consensus', 'Hash'], level: 'Elementary' },
  'Public Key': { definition: 'Derived from the private key, used to generate your wallet address. Can be shared publicly — it cannot be used to spend funds.', example: 'Your wallet address is a hashed version of your public key. Sharing your address is safe; sharing your private key is not.', related: ['Private Key', 'Address', 'ECDSA'], level: 'Elementary' },
  'Rollup': { definition: 'A Layer 2 scaling solution that processes transactions off-chain and submits compressed proofs to L1 for security.', example: 'Arbitrum batches 1,000 transactions into one L1 submission — users get fast cheap txs, Ethereum provides security.', related: ['Layer 2', 'Layer 1', 'ZK Proof', 'Scalability'], level: 'High School' },
  'RPCA': { definition: 'Ripple Protocol Consensus Algorithm — XRPL\'s unique consensus mechanism using a trusted validator set instead of mining or staking.', example: 'XRPL reaches consensus in 3–5 seconds using ~150 validators worldwide. No energy-intensive mining required.', related: ['XRP', 'XRPL', 'Consensus', 'Validator'], level: 'College' },
  'RSI': { definition: 'Relative Strength Index — a momentum indicator from 0–100. Above 70 = overbought (potential sell). Below 30 = oversold (potential buy).', example: 'When Bitcoin\'s weekly RSI hit 90 in Dec 2017, it signaled extreme overbought conditions — BTC fell 84% over the next year.', related: ['MACD', 'Moving Average', 'Technical Analysis'], level: 'High School' },
  'Rug Pull': { definition: 'A scam where developers abandon a project and steal investor funds after building hype and liquidity.', example: 'Squid Game token (2021): promoted with fake partnerships, price pumped 230,000% — team drained the liquidity and disappeared.', risk: 'Red flags: anonymous team, no audit, unrealistic APY promises, can\'t sell tokens.', related: ['Scam', 'DeFi', 'Liquidity Pool'], level: 'Elementary' },
  'Seed Phrase': { definition: '12 or 24 words that can fully regenerate your crypto wallet on any device. Anyone who has it controls all your funds.', example: 'Example (never use): "witch collapse practice feed shame open despair creek road again ice" — 12 words generate your entire wallet.', risk: 'Never store digitally. Never photograph. Never share. This is the master key to everything.', related: ['Private Key', 'Wallet', 'Non-Custodial'], level: 'Elementary' },
  'SHA-256': { definition: 'Secure Hash Algorithm 256 — the cryptographic hash function used by Bitcoin for mining and block creation.', example: 'Bitcoin miners try trillions of SHA-256 hashes per second to find a hash below the network\'s target difficulty.', related: ['Hash', 'Mining', 'Proof of Work', 'Cryptographic Hashing'], level: 'College' },
  'Slippage': { definition: 'The difference between the expected price of a trade and the actual price at execution, caused by market movement or low liquidity.', example: 'You try to swap $50,000 of a low-liquidity token at $1.00. It executes at $0.93 due to price impact. That\'s 7% slippage.', related: ['Liquidity', 'AMM', 'DEX', 'Price Impact'], level: 'High School' },
  'Smart Contract': { definition: 'Self-executing code on a blockchain that automatically enforces agreement terms when conditions are met. No intermediary needed.', example: 'An escrow smart contract: holds buyer\'s funds until delivery is confirmed, then auto-releases to seller — no bank needed.', risk: 'Smart contract bugs are permanent and unforgiving. Over $3B was lost to DeFi exploits in 2022.', related: ['DeFi', 'Ethereum', 'Solidity', 'Oracle'], level: 'Elementary' },
  'Staking': { definition: 'Locking crypto in a protocol to support network security (PoS) or earn yield. Locked funds may have unbonding periods.', example: 'Staking ETH on Lido earns ~4% APY. Your staked ETH secures Ethereum\'s PoS consensus.', risk: 'Slashing risk in PoS: validator misbehavior causes partial loss of staked funds.', related: ['Proof of Stake', 'Validator', 'APY', 'Yield Farming'], level: 'Elementary' },
  'Stablecoin': { definition: 'A cryptocurrency designed to maintain a stable value, typically pegged 1:1 to the US dollar.', example: 'USDC and USDT are fiat-backed stablecoins. DAI is crypto-collateralized. All aim to stay at $1.00.', risk: 'Algorithmic stablecoins (UST) can de-peg catastrophically — $40B lost in the Terra/LUNA collapse in 2022.', related: ['Fiat', 'DeFi', 'Collateralization', 'Yield Farming'], level: 'Elementary' },
  'Support': { definition: 'A price level where buying pressure consistently prevents further decline. Price tends to bounce at support.', example: '$30,000 was major Bitcoin support in 2022 — price repeatedly bounced from that level before eventually breaking down.', related: ['Resistance', 'Technical Analysis', 'Candlestick'], level: 'High School' },
  'Swap': { definition: 'Exchanging one cryptocurrency for another, either on a CEX or via a DEX smart contract.', example: 'Swapping 1 ETH for ~3,200 USDC on Uniswap: the AMM pool executes the trade, deducting a 0.3% fee.', related: ['DEX', 'AMM', 'Slippage', 'Bridge'], level: 'Elementary' },
  'Token': { definition: 'A digital asset built on an existing blockchain (like Ethereum) rather than having its own. Distinct from coins.', example: 'USDT is a token on Ethereum, Tron, and other chains. It doesn\'t have its own blockchain.', related: ['Coin', 'Smart Contract', 'Tokenomics'], level: 'Elementary' },
  'Tokenomics': { definition: 'The economic design of a cryptocurrency: total supply, emission schedule, burn mechanisms, vesting, and utility requirements.', example: 'Bitcoin\'s tokenomics: 21M max supply, halvings every 4 years, no pre-mine — designed for predictable scarcity.', related: ['Market Cap', 'Inflation', 'Governance Token', 'Deflationary'], level: 'High School' },
  'Transaction': { definition: 'A record of value transfer on a blockchain. Signed by the sender\'s private key and permanently recorded once confirmed.', example: 'Sending 100 XRP from wallet A to wallet B is one transaction. It settles on XRPL in 3–5 seconds.', related: ['Block', 'Gas', 'Private Key', 'Address'], level: 'Elementary' },
  'Trust Line': { definition: 'An XRPL-specific mechanism that allows accounts to hold non-XRP tokens by explicitly trusting the issuer up to a set limit.', example: 'To hold USDC on XRPL, you create a trust line to the USDC issuer with a limit of, say, $10,000.', related: ['XRPL', 'RPCA', 'Token'], level: 'College' },
  'Validator': { definition: 'A node that participates in consensus by verifying transactions and voting on or proposing new blocks.', example: 'XRPL has ~150 validators worldwide. Ethereum has over 900,000 validators staking 32 ETH each.', related: ['Node', 'Consensus', 'Proof of Stake', 'RPCA'], level: 'Elementary' },
  'Volatility': { definition: 'The degree of price variation over time. High volatility = large, rapid price swings. Bitcoin is far more volatile than stocks.', example: 'Bitcoin moved +10% and -12% in a single week in October 2023. Apple stock rarely moves more than 3% in a week.', related: ['Risk Management', 'Trading', 'Bull Market'], level: 'Elementary' },
  'Volume': { definition: 'The total amount of an asset traded over a given period. High volume confirms price moves; low volume suggests weakness.', example: 'Bitcoin\'s price broke $60,000 on 5× average volume — a strong confirmation signal. A low-volume breakout would be suspicious.', related: ['Technical Analysis', 'Liquidity', 'Candlestick'], level: 'High School' },
  'Wallet': { definition: 'Software or hardware that stores private keys and allows you to manage and send crypto. The "wallet" doesn\'t hold coins — the blockchain does.', example: 'MetaMask is a browser wallet. Ledger is a hardware wallet. Both give you access to the same blockchain addresses.', related: ['Private Key', 'Seed Phrase', 'Cold Wallet', 'Hot Wallet'], level: 'Elementary' },
  'Web3': { definition: 'The next generation of the internet built on blockchain: users own their data, identity, and digital assets instead of corporations.', example: 'Web2: Facebook owns your data. Web3: your social graph is stored on a blockchain — you control it and can take it anywhere.', related: ['Blockchain', 'DAO', 'NFT', 'DeFi'], level: 'Elementary' },
  'Whale': { definition: 'A large crypto holder whose trades can significantly move market prices. In BTC, typically 1,000+ BTC.', example: 'When a whale moves 10,000 BTC from cold storage to an exchange, the market often interprets it as an upcoming sell.', related: ['Market Cap', 'Liquidity', 'Order Book'], level: 'High School' },
  'Wrapped Token': { definition: 'A token representing another asset on a different blockchain, maintaining a 1:1 peg via a bridge or custodian.', example: 'WBTC (Wrapped Bitcoin) is Bitcoin represented on Ethereum — 1 WBTC = 1 BTC, held in custody by BitGo.', risk: 'If the bridge holding the underlying asset is hacked, wrapped tokens lose their backing and value.', related: ['Bridge', 'Cross-Chain', 'Token'], level: 'High School' },
  'XRP': { definition: 'The native digital asset of the XRP Ledger. Used for transaction fees, as a bridge currency in ODL, and as collateral.', example: 'Sending $1M via XRP from the US to Japan takes 3 seconds and costs $0.0002 — vs 3 days and 5% fees via wire transfer.', related: ['XRPL', 'ODL', 'RPCA', 'Bridge Currency'], level: 'Elementary' },
  'XRPL': { definition: 'XRP Ledger — a decentralized blockchain optimized for payments and asset exchange. Features native DEX, AMM, and trust lines.', example: 'XRPL settles 1,500 TPS with 3–5 second finality and sub-cent fees. Multiple central banks are piloting CBDCs on XRPL.', related: ['XRP', 'RPCA', 'ODL', 'Trust Line', 'Native DEX'], level: 'Elementary' },
  'Yield Farming': { definition: 'Moving crypto across DeFi protocols to maximize returns, often combining LP fees, staking rewards, and token emissions.', example: 'Deposit USDC into Curve, earn CRV tokens, stake CRV for veCRV, use veCRV to boost LP rewards — multi-layer yield farming.', risk: 'Smart contract risk compounds across every protocol in the chain. One hack can wipe the entire strategy.', related: ['APY', 'Liquidity Pool', 'DeFi', 'Impermanent Loss'], level: 'High School' },
  'ZK Proof': { definition: 'Zero-Knowledge Proof — a cryptographic method to prove something is true without revealing the underlying data.', example: 'A ZK bridge proves "this account had 1 ETH on Ethereum" without revealing the full transaction history.', related: ['Rollup', 'Bridge', 'Cryptographic Hashing', 'Layer 2'], level: 'College' },
};

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const LEVEL_COLORS: Record<string, string> = {
  'Elementary': 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
  'High School': 'text-amber-400 bg-amber-400/10 border-amber-400/30',
  'College': 'text-blue-400 bg-blue-400/10 border-blue-400/30',
};

function TermCard({ term, data }: { term: string; data: typeof GLOSSARY[string] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-white/8 bg-gray-900/60 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-white">{term}</span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${LEVEL_COLORS[data.level]}`}>
            {data.level}
          </span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-500 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />}
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">
          <div className="flex gap-2">
            <BookOpen className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
            <p className="text-sm text-gray-300 leading-relaxed">{data.definition}</p>
          </div>
          <div className="flex gap-2">
            <span className="text-[10px] font-black text-violet-400 uppercase tracking-widest mt-0.5 shrink-0 w-4 text-center">eg</span>
            <p className="text-sm text-gray-400 italic leading-relaxed">{data.example}</p>
          </div>
          {data.risk && (
            <div className="flex gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
              <p className="text-sm text-amber-200/80 leading-relaxed">{data.risk}</p>
            </div>
          )}
          {data.related.length > 0 && (
            <div className="flex gap-2 flex-wrap items-center">
              <Link2 className="w-3.5 h-3.5 text-gray-500 shrink-0" />
              {data.related.map(r => (
                <button
                  key={r}
                  onClick={() => {
                    const el = document.getElementById(`term-${r.replace(/\s+/g, '-')}`);
                    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    el?.classList.add('ring-2', 'ring-violet-400');
                    setTimeout(() => el?.classList.remove('ring-2', 'ring-violet-400'), 2000);
                  }}
                  className="text-xs text-violet-400 hover:text-violet-300 underline decoration-dotted transition-colors"
                >
                  {r}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function GlossaryPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [activeLevel, setActiveLevel] = useState<string>('All');
  const letterRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return Object.entries(GLOSSARY)
      .filter(([term, data]) => {
        const matchesLevel = activeLevel === 'All' || data.level === activeLevel;
        const matchesQuery = !q || term.toLowerCase().includes(q) || data.definition.toLowerCase().includes(q);
        return matchesLevel && matchesQuery;
      })
      .sort(([a], [b]) => a.localeCompare(b));
  }, [query, activeLevel]);

  const byLetter = useMemo(() => {
    const map: Record<string, [string, typeof GLOSSARY[string]][]> = {};
    for (const [term, data] of filtered) {
      const letter = term[0].toUpperCase();
      if (!map[letter]) map[letter] = [];
      map[letter].push([term, data]);
    }
    return map;
  }, [filtered]);

  const activeLetters = new Set(Object.keys(byLetter));

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-gray-950/90 backdrop-blur-xl border-b border-white/5 px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.push('/')} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-400" />
        </button>
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-violet-400" />
          <span className="font-black text-white tracking-tight">A–Z Glossary</span>
        </div>
        <span className="ml-auto text-xs text-gray-500">{filtered.length} terms</span>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search any term, concept, or keyword..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-800/80 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all"
          />
        </div>

        {/* Level filter */}
        <div className="flex gap-2 flex-wrap">
          {['All', 'Elementary', 'High School', 'College'].map(l => (
            <button
              key={l}
              onClick={() => setActiveLevel(l)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeLevel === l
                  ? l === 'All' ? 'bg-violet-500 text-white' :
                    l === 'Elementary' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' :
                    l === 'High School' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' :
                    'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                  : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
              }`}
            >
              {l}
            </button>
          ))}
        </div>

        {/* A–Z jump bar */}
        <div className="flex flex-wrap gap-1">
          {LETTERS.map(l => (
            <button
              key={l}
              disabled={!activeLetters.has(l)}
              onClick={() => letterRefs.current[l]?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className={`w-7 h-7 rounded text-xs font-bold transition-all ${
                activeLetters.has(l)
                  ? 'bg-white/10 text-white hover:bg-violet-500/30 hover:text-violet-300'
                  : 'text-gray-700 cursor-default'
              }`}
            >
              {l}
            </button>
          ))}
        </div>

        {/* Terms grouped by letter */}
        {Object.keys(byLetter).sort().map(letter => (
          <div key={letter} ref={el => { letterRefs.current[letter] = el; }}>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl font-black text-violet-400">{letter}</span>
              <div className="flex-1 h-px bg-white/5" />
            </div>
            <div className="space-y-2">
              {byLetter[letter].map(([term, data]) => (
                <div key={term} id={`term-${term.replace(/\s+/g, '-')}`}>
                  <TermCard term={term} data={data} />
                </div>
              ))}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-20 text-gray-600">
            <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-bold">No terms found</p>
            <p className="text-sm mt-1">Try a different search or clear the filter</p>
          </div>
        )}
      </div>
    </div>
  );
}
