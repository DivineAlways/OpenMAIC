#!/usr/bin/env python3
"""
Fix 3 issues:
1. College blockchain trilemma scene — subtitle text overlaps title (reduce title font, add margin)
2. HS and College KCs — expand to 7+ questions each
3. Swap/Bridge classrooms — replace slide-format KCs with proper quiz format
"""
import json, os, copy

BASE = os.path.join(os.path.dirname(__file__), '..', 'data', 'classrooms')

def load(name):
    with open(os.path.join(BASE, f'{name}.json')) as f:
        return json.load(f)

def save(name, data):
    path = os.path.join(BASE, f'{name}.json')
    with open(path, 'w') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f'  Saved {name}.json')

def make_quiz_kc(qid, title, questions):
    """Build a proper quiz-format KC scene matching the existing format."""
    q_objects = []
    for i, (question, opts, answer, analysis) in enumerate(questions):
        q_objects.append({
            "id": f"{qid}-q{i+1}",
            "type": "single",
            "question": question,
            "options": [{"label": o, "value": chr(65+j)} for j, o in enumerate(opts)],
            "answer": [chr(65 + opts.index(answer))],
            "analysis": analysis,
            "points": 1
        })
    return {
        "id": qid,
        "type": "slide",
        "title": title,
        "order": 0,
        "content": {
            "type": "quiz",
            "questions": q_objects
        },
        "actions": []
    }


# ─────────────────────────────────────────────
# FIX 1: College blockchain trilemma scene overlap
# The subtitle "The engineering constraints..." is too long for the subtitle slot.
# Fix: shorten subtitle text to fit, keep content unchanged.
# ─────────────────────────────────────────────
def fix_trilemma_overlap():
    d = load('oc-blockchain-basics')
    for scene in d['scenes']:
        if scene['id'] == 'cbb-s10':
            for el in scene['content']['canvas']['elements']:
                if el['id'] == 'cbb-s10-sub':
                    # Shorten subtitle to single line that fits
                    el['content'] = "<p style='font-size:13px;color:#64748b;font-weight:500;'>Advanced consensus design — College Level</p>"
                if el['id'] == 'cbb-s10-title':
                    # Reduce font size so long title fits without overflow
                    el['content'] = "<p style='font-size:22px;font-weight:800;color:#f1f5f9;'>🏛️ Decentralization vs Scalability Trilemma</p>"
            # Also fix the speech action text
            for action in scene['actions']:
                if action.get('id') == 'action_cbb-s10_2':
                    action['text'] = 'Advanced consensus design — College Level'
    save('oc-blockchain-basics', d)


# ─────────────────────────────────────────────
# FIX 2: Expand all HS and College KCs to 7+ questions
# ─────────────────────────────────────────────

HS_EXTRA_QUESTIONS = {
    'oc-hs-blockchain': [
        ("What is a hard fork?", [
            "A backwards-compatible software upgrade",
            "A breaking protocol change that can split the chain into two",
            "A type of cryptographic signature",
            "When miners combine their hashing power"
        ], "A breaking protocol change that can split the chain into two",
        "A hard fork introduces incompatible rule changes. Old nodes reject new blocks, splitting the network. Bitcoin Cash was created via a hard fork of Bitcoin in 2017."),
        ("What problem do Layer 2 networks solve?", [
            "They replace Layer 1 entirely",
            "They provide additional private keys",
            "They improve speed and reduce cost while inheriting L1 security",
            "They store wallet seed phrases off-chain"
        ], "They improve speed and reduce cost while inheriting L1 security",
        "L2s like Arbitrum process transactions off-chain then batch-settle on Ethereum L1. Users get fast, cheap transactions while the L1 provides the security guarantee."),
    ],
    'oc-hs-crypto': [
        ("What causes a 'Death Cross' in technical analysis?", [
            "RSI drops below 30",
            "The 50-day MA crosses below the 200-day MA",
            "Volume drops to zero for 24 hours",
            "The MACD line goes negative"
        ], "The 50-day MA crosses below the 200-day MA",
        "A Death Cross occurs when the shorter-term 50-day moving average crosses below the longer-term 200-day MA — historically a bearish signal. The opposite (50 crossing above 200) is the Golden Cross."),
        ("What is 'wash trading'?", [
            "Swapping tokens on a DEX to clean your wallet history",
            "Buying and selling to yourself to create fake trading volume",
            "Transferring tokens between exchanges to avoid detection",
            "Staking tokens to increase liquidity"
        ], "Buying and selling to yourself to create fake trading volume",
        "Wash trading is market manipulation where a trader simultaneously buys and sells the same asset to inflate reported volume. It's used to create the illusion of market interest."),
    ],
    'oc-hs-defi': [
        ("In DeFi lending, what happens when your health factor drops below 1.0?", [
            "You earn bonus rewards",
            "Your position is automatically liquidated",
            "Your interest rate is reduced",
            "The protocol pauses your account"
        ], "Your position is automatically liquidated",
        "A health factor below 1.0 means your collateral value no longer covers your debt at the required ratio. Liquidation bots monitor positions 24/7 and will close your position, taking a discount on the collateral."),
        ("What is an oracle in DeFi?", [
            "A smart contract that stores user passwords",
            "A bridge between two blockchains",
            "A service that feeds real-world price data to smart contracts",
            "A governance token voting system"
        ], "A service that feeds real-world price data to smart contracts",
        "Smart contracts cannot access external data on their own. Oracles (like Chainlink) feed price data, weather events, or other real-world information into contracts. Manipulating an oracle can drain lending protocols."),
    ],
    'oc-hs-trading': [
        ("What does 'going long' mean?", [
            "Holding a position for more than one year",
            "Betting the price will fall",
            "Buying an asset expecting the price to rise",
            "Trading on leverage only"
        ], "Buying an asset expecting the price to rise",
        "Going long means you buy an asset hoping to sell it later at a higher price. It's the most natural form of trading — buy low, sell high. The opposite (short selling) profits when price falls."),
        ("If your risk-reward ratio is 1:3 and you risk $200, what is your target profit?", [
            "$200",
            "$300",
            "$600",
            "$100"
        ], "$600",
        "A 1:3 risk-reward ratio means for every $1 risked, you target $3 in profit. Risking $200 × 3 = $600 target profit. With a 1:3 ratio, you only need to win 25% of trades to break even."),
    ],
    'oc-hs-wallets': [
        ("What is a multi-signature wallet?", [
            "A wallet that supports multiple cryptocurrencies",
            "A wallet requiring M of N keys to sign any transaction",
            "A wallet with two separate seed phrases",
            "A hardware wallet with biometric login"
        ], "A wallet requiring M of N keys to sign any transaction",
        "Multi-sig requires multiple private keys to authorize a transaction. A 2-of-3 setup means any 2 of 3 designated keys must sign. One compromised key cannot drain the wallet — making it ideal for large holdings and DAO treasuries."),
        ("Why is SMS-based 2FA weaker than an authenticator app?", [
            "SMS codes expire faster",
            "Authenticator apps require an internet connection",
            "SIM swap attacks can intercept SMS codes",
            "SMS cannot be used on exchanges"
        ], "SIM swap attacks can intercept SMS codes",
        "SIM swapping is when an attacker convinces your carrier to transfer your phone number to their SIM. Once they have your number, they receive all SMS codes. Authenticator apps (Google Authenticator, Authy) generate codes locally — immune to SIM swaps."),
    ],
    'oc-hs-ecosystem': [
        ("What is Real-World Asset (RWA) tokenization?", [
            "Creating NFTs of physical artwork only",
            "Representing ownership of physical assets as blockchain tokens",
            "Converting stablecoins to fiat currency",
            "Bridging tokens from one chain to another"
        ], "Representing ownership of physical assets as blockchain tokens",
        "RWA tokenization puts real-world assets — real estate, gold, treasury bonds — on-chain as tokens. This makes them tradeable 24/7, divisible into fractional shares, and accessible globally. BlackRock and Franklin Templeton are both active in this space."),
        ("What is the main risk of a governance attack on a DAO?", [
            "The DEX liquidity pool is drained automatically",
            "An attacker acquires enough tokens to pass malicious proposals",
            "Validators reject all governance transactions",
            "The blockchain forks every time a vote is held"
        ], "An attacker acquires enough tokens to pass malicious proposals",
        "If governance token distribution is concentrated, an attacker can buy a controlling stake and pass proposals to drain the treasury or modify contracts in their favor. The Beanstalk protocol lost $182M this way in 2022."),
    ],
    'oc-hs-security': [
        ("What is a SIM swap attack?", [
            "Exchanging one crypto for another via a DEX",
            "Convincing a carrier to transfer your phone number to an attacker's SIM",
            "Installing malware via a USB device",
            "Exploiting a smart contract bug"
        ], "Convincing a carrier to transfer your phone number to an attacker's SIM",
        "SIM swapping lets attackers receive your SMS messages, including 2FA codes. They call your carrier posing as you, request a SIM transfer, then use your number to bypass SMS-based authentication on exchanges."),
        ("Why is a hardware wallet considered the safest option for large holdings?", [
            "It stores funds offline in a bank vault",
            "Private keys never leave the device — transactions are signed internally",
            "It encrypts your seed phrase with a password",
            "It connects to a secure government server for verification"
        ], "Private keys never leave the device — transactions are signed internally",
        "Hardware wallets sign transactions internally on the device. Even if your computer is fully compromised by malware, the attacker cannot approve transactions without physical access to the hardware wallet and its PIN."),
    ],
    'oc-hs-swapbridge': [
        ("What is a DEX aggregator?", [
            "A centralized exchange that lists DEX tokens",
            "A tool that routes your swap across multiple pools for the best price",
            "A bridge that connects two DEXs on different chains",
            "A smart contract that stores liquidity pool rewards"
        ], "A tool that routes your swap across multiple pools for the best price",
        "DEX aggregators like 1inch split your trade across multiple liquidity pools simultaneously to minimize price impact and slippage. Instead of trading against one pool, your order might be filled across five different pools."),
        ("What happened to Ronin bridge that cost $625M?", [
            "A bug in the AMM formula allowed infinite minting",
            "Five of nine validator keys were compromised",
            "The bridge used a faulty oracle for price feeds",
            "Slippage settings were set too high by users"
        ], "Five of nine validator keys were compromised",
        "The Ronin bridge used 9 validators with a 5-of-9 threshold. The attacker compromised Axie Infinity's 4 internal validators plus one external — reaching the 5 required. This centralization of validator control made the attack feasible."),
        ("What does 'impermanent loss' mean for a swap liquidity provider?", [
            "Permanent loss from a failed transaction",
            "Loss from providing liquidity when token prices diverge from deposit ratio",
            "Fees paid to the bridge protocol",
            "Gas wasted on a reverted swap"
        ], "Loss from providing liquidity when token prices diverge from deposit ratio",
        "When you provide liquidity to an AMM and one token's price changes significantly relative to the other, you end up with less of the appreciated token than if you had simply held. The loss is 'impermanent' only if prices return to the original ratio."),
    ],
}

COL_EXTRA_QUESTIONS = {
    'oc-blockchain-basics': [
        ("What is the role of a hash function in blockchain security?", [
            "It encrypts private keys for storage",
            "It converts input data into a fixed-length output — changing any input completely changes the output",
            "It validates transactions by checking wallet balances",
            "It connects blocks to the consensus layer"
        ], "It converts input data into a fixed-length output — changing any input completely changes the output",
        "Hash functions like SHA-256 are deterministic and collision-resistant. In blockchain, each block's hash depends on its data AND the previous block's hash — creating an unbreakable chain. Altering any historical block changes all subsequent hashes, immediately detectable by nodes."),
        ("Why does the XRPL use a small trusted validator set rather than thousands of validators?", [
            "To reduce transaction fees to zero",
            "To achieve fast consensus with lower communication overhead",
            "To allow smart contracts to execute faster",
            "To enable proof of work without mining hardware"
        ], "To achieve fast consensus with lower communication overhead",
        "RPCA consensus with ~150 validators achieves 3-5 second finality because communication overhead is manageable. PoS Ethereum with 900,000+ validators achieves higher decentralization but requires more complex aggregation to reach consensus efficiently."),
        ("What makes a 'ZK rollup' more secure than an 'optimistic rollup'?", [
            "ZK rollups use more validators per transaction",
            "ZK rollups provide cryptographic proofs of validity rather than relying on fraud proofs",
            "ZK rollups cost less gas on the destination chain",
            "ZK rollups do not require any interaction with Layer 1"
        ], "ZK rollups provide cryptographic proofs of validity rather than relying on fraud proofs",
        "Optimistic rollups assume validity and allow a challenge window (7 days on Arbitrum). ZK rollups submit a cryptographic validity proof with every batch — the L1 contract mathematically verifies it. No waiting period, no trust assumption needed."),
    ],
    'oc-cryptocurrency-guide': [
        ("What is the UTXO model?", [
            "A staking mechanism used by Ethereum validators",
            "Unspent Transaction Outputs — Bitcoin tracks individual coin units not account balances",
            "A token standard for governance on Ethereum",
            "The fee calculation model for XRPL transactions"
        ], "Unspent Transaction Outputs — Bitcoin tracks individual coin units not account balances",
        "Bitcoin doesn't store balances in accounts. It tracks unspent outputs from previous transactions. To spend, you consume UTXOs as inputs and create new outputs. Your 'balance' is the sum of all UTXOs you can unlock with your private key."),
        ("What is a 'governance attack' and which protocol suffered one for $182M?", [
            "A 51% mining attack — Bitcoin in 2014",
            "An oracle manipulation — Mango Markets in 2022",
            "Buying enough tokens to pass malicious governance proposals — Beanstalk in 2022",
            "A reentrancy exploit — The DAO in 2016"
        ], "Buying enough tokens to pass malicious governance proposals — Beanstalk in 2022",
        "Beanstalk's attacker used a flash loan to acquire a supermajority of governance tokens, passed a malicious proposal to drain the treasury, and repaid the flash loan — all in one transaction. $182M was stolen. This exposed the risk of low-quorum, immediate-execution governance."),
        ("What does 'deflationary tokenomics' mean?", [
            "The token price always decreases over time",
            "The circulating supply decreases over time through burning mechanisms",
            "The token is pegged to a deflationary fiat currency",
            "Staking rewards decrease each year"
        ], "The circulating supply decreases over time through burning mechanisms",
        "Deflationary tokens reduce circulating supply over time. Ethereum burns base fees (EIP-1559) — periods of high demand can make ETH deflationary. BNB burns quarterly based on revenue. Scarcity from burning can support price if demand is stable or growing."),
    ],
    'oc-defi-guide': [
        ("What is the x × y = k formula and what does it guarantee?", [
            "It sets the interest rate based on utilization",
            "It ensures the product of two token reserves stays constant, automatically adjusting price",
            "It calculates impermanent loss for LP positions",
            "It determines the liquidation price for a collateralized position"
        ], "It ensures the product of two token reserves stays constant, automatically adjusting price",
        "In a Uniswap-style AMM with reserves x and y, x × y must equal k (a constant). When you buy token y (reducing y), x must increase to keep k constant. This automatically raises the price of y. No order book needed — the math prices the market."),
        ("What caused the UST/LUNA collapse in May 2022?", [
            "A smart contract bug in the Terra protocol",
            "A death spiral where UST de-peg triggered LUNA hyperinflation which further broke the peg",
            "An oracle manipulation attack on the price feed",
            "A governance vote to pause all withdrawals"
        ], "A death spiral where UST de-peg triggered LUNA hyperinflation which further broke the peg",
        "UST maintained its peg by allowing 1 UST to be burned to mint $1 of LUNA. When a large seller broke the peg, people rushed to burn UST for LUNA and sell — hyperinflating LUNA supply, destroying its value, making the UST backing worthless. $40B evaporated in 72 hours."),
        ("What is MEV (Maximal Extractable Value)?", [
            "The maximum APY achievable through yield farming",
            "The maximum amount a validator can earn from block rewards",
            "Profit extracted by reordering or inserting transactions within a block",
            "The fee limit set by the protocol for flash loans"
        ], "Profit extracted by reordering or inserting transactions within a block",
        "MEV is extracted by validators or bots who can see pending transactions and manipulate ordering. Sandwich attacks front-run large swaps. Arbitrage bots exploit price differences across pools. Liquidation bots race to liquidate underwater positions. Estimated $1B+ extracted annually on Ethereum."),
    ],
    'oc-trading-guide': [
        ("What is the Kelly Criterion formula?", [
            "f = (win_rate × avg_win) - loss_rate",
            "f = (bp - q) / b",
            "f = sharpe_ratio / volatility",
            "f = expected_value / risk_per_trade"
        ], "f = (bp - q) / b",
        "The Kelly Criterion gives the optimal fraction of capital to bet: f = (bp - q) / b, where b = odds ratio (profit/loss), p = probability of winning, q = probability of losing (1-p). In practice, traders use 25-50% of Kelly to reduce variance."),
        ("What is backtesting, and what is its main risk?", [
            "Testing a strategy on live markets with small position sizes — main risk is slippage",
            "Testing a strategy on historical data — main risk is overfitting to past conditions",
            "Comparing two strategies against each other — main risk is survivorship bias",
            "Running a strategy on paper only — main risk is emotional deviation"
        ], "Testing a strategy on historical data — main risk is overfitting to past conditions",
        "Backtesting simulates a strategy on historical price data. The main danger is overfitting — tuning parameters so precisely to past data that the strategy has no predictive power on new data. A strategy with perfect backtest results often fails in live trading."),
        ("What does the Sharpe Ratio measure?", [
            "The total return of a portfolio over one year",
            "Risk-adjusted return — return per unit of volatility taken",
            "The maximum drawdown from peak to trough",
            "The correlation between two trading strategies"
        ], "Risk-adjusted return — return per unit of volatility taken",
        "Sharpe Ratio = (Portfolio Return - Risk-Free Rate) / Standard Deviation of Returns. A Sharpe above 1.0 is considered good — you're earning more return per unit of risk taken. A strategy earning 50% but with extreme volatility may have a worse Sharpe than one earning 20% steadily."),
    ],
    'oc-security-wallets': [
        ("What is the BIP39 standard?", [
            "A Bitcoin improvement proposal defining the HD wallet derivation path",
            "The standard for generating mnemonic seed phrases from entropy",
            "A protocol for multi-signature wallet coordination",
            "The encryption standard used for hardware wallet storage"
        ], "The standard for generating mnemonic seed phrases from entropy",
        "BIP39 defines how a random sequence of bits (entropy) maps to a specific set of human-readable words from a 2,048-word list. These words, in order, can regenerate your entire HD wallet tree on any BIP39-compatible device."),
        ("What is a reentrancy attack in smart contract security?", [
            "When a validator submits the same transaction twice",
            "When an external contract repeatedly calls back into the vulnerable contract before the first call finishes",
            "When a miner front-runs a smart contract deployment",
            "When a governance proposal is submitted multiple times"
        ], "When an external contract repeatedly calls back into the vulnerable contract before the first call finishes",
        "The DAO hack (2016, $60M) exploited reentrancy. The victim contract sent ETH before updating its balance. The attacker's contract called back into the victim mid-execution, draining funds repeatedly before the balance was zeroed. The fix: always update state before external calls (checks-effects-interactions pattern)."),
        ("What makes XRPL's native multi-signing different from multisig on Ethereum?", [
            "XRPL multisig requires a hardware wallet for each signer",
            "XRPL multi-signing is a first-class protocol feature, not a smart contract",
            "XRPL multisig is limited to 2-of-3 configurations",
            "XRPL multisig only works for XRP, not issued tokens"
        ], "XRPL multi-signing is a first-class protocol feature, not a smart contract",
        "On Ethereum, multisig is implemented via smart contracts (Gnosis Safe). On XRPL, multi-signing is built directly into the ledger protocol — any account can require M-of-N signatures natively, without deploying additional contracts. This reduces attack surface and gas costs."),
    ],
    'oc-ecosystem': [
        ("What is the EU's MiCA regulation?", [
            "A US SEC rule classifying all tokens as securities",
            "The EU's comprehensive crypto regulatory framework effective from 2024",
            "A G20 agreement to ban algorithmic stablecoins",
            "A FATF standard for crypto KYC requirements"
        ], "The EU's comprehensive crypto regulatory framework effective from 2024",
        "MiCA (Markets in Crypto-Assets) is the world's most comprehensive crypto regulatory framework. It covers issuance of crypto-assets, stablecoin rules (e-money tokens, asset-referenced tokens), and licensing for CASPs. It creates legal certainty for the EU crypto market."),
        ("Why does Ripple's ODL eliminate the need for pre-funded nostro accounts?", [
            "It uses a stablecoin pegged to both currencies",
            "XRP acts as a real-time bridge so funds convert and settle in seconds — no pre-funding needed",
            "It routes payments through the SWIFT network using XRP as collateral",
            "ODL uses Layer 2 channels that hold liquidity off-chain"
        ], "XRP acts as a real-time bridge so funds convert and settle in seconds — no pre-funding needed",
        "Traditional cross-border payments require banks to pre-fund accounts (nostro) in every currency corridor — locking up trillions. ODL converts USD to XRP, transmits instantly, converts to destination currency — the whole process takes seconds. No idle pre-funded capital required."),
        ("What is the 'Howey Test' used for in US crypto regulation?", [
            "To determine if a crypto exchange needs a banking license",
            "To classify whether a token is a security based on investment contract criteria",
            "To measure the market cap threshold for institutional reporting",
            "To calculate the tax rate on crypto capital gains"
        ], "To classify whether a token is a security based on investment contract criteria",
        "The Howey Test (from a 1946 Supreme Court case) determines if something is an 'investment contract' — a security. Criteria: investment of money, in a common enterprise, with expectation of profit, from efforts of others. The SEC applies this to tokens — if they pass all four criteria, they're securities subject to SEC regulation."),
    ],
    'oc-xrpl-deepdive': [
        ("What is a 'trust line' on the XRP Ledger?", [
            "A validator reputation score used in RPCA consensus",
            "An account setting that allows holding non-XRP tokens up to a set limit",
            "A cross-chain bridge between XRPL and Ethereum",
            "A smart contract for automated payments"
        ], "An account setting that allows holding non-XRP tokens up to a set limit",
        "Trust lines are XRPL's mechanism for holding issued currencies. To hold USDC on XRPL, you create a trust line to the USDC issuer allowing up to your chosen limit. The issuer can't send you more than your limit. This prevents unwanted token receipt and makes XRPL's token system permission-based."),
        ("How does XRPL's native DEX differ from Uniswap?", [
            "XRPL DEX uses a bonding curve while Uniswap uses an order book",
            "XRPL DEX is built into the ledger protocol with a native order book — no smart contract layer",
            "XRPL DEX only supports XRP pairs while Uniswap supports any ERC-20",
            "XRPL DEX uses proof of work for trade settlement"
        ], "XRPL DEX is built into the ledger protocol with a native order book — no smart contract layer",
        "XRPL's DEX is consensus-layer functionality — every node processes it natively. No smart contract deployment required. This eliminates MEV sandwich attacks (order execution is deterministic in consensus), reduces attack surface, and allows the AMM and order book to combine liquidity in a single trade path."),
        ("What is XRPL's pathfinding and why is it powerful?", [
            "A routing algorithm that finds the cheapest gas path for transactions",
            "A protocol that atomically converts through intermediate currencies to settle in the recipient's currency",
            "A bridge protocol connecting XRPL to Ethereum",
            "An algorithm that selects which validators process each transaction"
        ], "A protocol that atomically converts through intermediate currencies to settle in the recipient's currency",
        "XRPL pathfinding enables one transaction to route through multiple currency conversions atomically. Sending USD to someone who wants EUR might route USD → XRP → EUR in a single transaction. All steps succeed or all fail — no partial execution risk. This is the infrastructure for ODL and global real-time settlement."),
    ],
    'oc-col-swapbridge': [
        ("What is concentrated liquidity (Uniswap V3)?", [
            "Liquidity spread evenly across all possible prices",
            "Capital deployed only within a specific chosen price range for higher efficiency",
            "A bridge design using concentrated validator sets",
            "A ZK proof method for verifying swap validity"
        ], "Capital deployed only within a specific chosen price range for higher efficiency",
        "Uniswap V3 LPs choose a price range for their capital. This concentrates liquidity where trades actually happen, earning more fees. A V3 position in the $1,800-$2,200 ETH range provides the same depth as a V2 position 4,000× larger — but suffers higher impermanent loss if price exits the range."),
        ("Why is XRPL's DEX immune to MEV sandwich attacks?", [
            "XRPL uses a private mempool that bots cannot access",
            "Transactions are ordered deterministically during consensus — bots cannot reorder them",
            "XRPL charges prohibitively high fees that make front-running unprofitable",
            "XRPL DEX uses ZK proofs that hide transaction details"
        ], "Transactions are ordered deterministically during consensus — bots cannot reorder them",
        "XRPL has no mempool in the traditional sense — transactions are submitted directly to validators and ordered deterministically during the consensus round. There's no opportunity for bots to observe pending transactions and insert front-running orders before them."),
        ("What is the key trade-off of a ZK bridge vs an optimistic bridge?", [
            "ZK bridges are cheaper but less secure",
            "ZK bridges provide instant cryptographic finality but are more computationally expensive",
            "Optimistic bridges are faster but require trusted validators",
            "ZK bridges require a 7-day challenge window while optimistic bridges are instant"
        ], "ZK bridges provide instant cryptographic finality but are more computationally expensive",
        "ZK bridges submit validity proofs with every batch — mathematically proven correct, no waiting period. Optimistic bridges assume validity and allow 7 days for fraud proofs. ZK is faster and more trustless but generating ZK proofs is computationally intensive and expensive, which is why ZK bridges are still maturing in production."),
    ],
}

def add_questions_to_kc(classroom_name, extra_questions):
    d = load(classroom_name)
    kc = d['scenes'][-1]
    if kc['content']['type'] != 'quiz':
        print(f'  WARNING: {classroom_name} KC is not quiz type — skipping')
        return
    existing = kc['content']['questions']
    base_id = existing[-1]['id'].rsplit('-', 1)[0] if existing else 'q-gen'
    for i, (question, opts, answer, analysis) in enumerate(extra_questions):
        new_id = f"{base_id}-x{i+1}"
        existing.append({
            "id": new_id,
            "type": "single",
            "question": question,
            "options": [{"label": o, "value": chr(65+j)} for j, o in enumerate(opts)],
            "answer": [chr(65 + opts.index(answer))],
            "analysis": analysis,
            "points": 1
        })
    print(f'  {classroom_name}: {len(existing)} questions')
    save(classroom_name, d)


# ─────────────────────────────────────────────
# FIX 3: Replace slide-format KCs with proper quiz format in swap/bridge classrooms
# ─────────────────────────────────────────────

ELEM_SWAPBRIDGE_KC = [
    ("What is swapping in crypto?", [
        "Staking your crypto for yield",
        "Exchanging one cryptocurrency for another",
        "Moving funds from a hot wallet to a cold wallet",
        "Confirming a pending transaction"
    ], "Exchanging one cryptocurrency for another",
    "Swapping means trading one crypto directly for another — for example, exchanging ETH for USDC. It can be done on a CEX (like Coinbase) or a DEX (like Uniswap) where a smart contract executes the trade automatically."),

    ("What does a bridge do?", [
        "Connects a crypto wallet to a bank account",
        "Speeds up transactions on a single blockchain",
        "Moves tokens between two different blockchains",
        "Converts crypto to stablecoins"
    ], "Moves tokens between two different blockchains",
    "Blockchains are separate networks that don't communicate natively. A bridge locks your tokens on Chain A and mints equivalent tokens on Chain B, allowing you to use your assets on a different network."),

    ("On a DEX swap, who holds your funds during the trade?", [
        "The exchange company",
        "A bank escrow",
        "No one — the smart contract executes it and you keep custody",
        "The liquidity pool manager"
    ], "No one — the smart contract executes it and you keep custody",
    "DEX swaps are trustless. You connect your own wallet, the smart contract executes the trade, and you receive the new token directly. No company ever holds your funds — unlike a CEX where the platform has custody."),

    ("What is the most common beginner mistake when bridging?", [
        "Choosing a DEX instead of a CEX",
        "Sending on the wrong network",
        "Using a hardware wallet",
        "Setting slippage too low"
    ], "Sending on the wrong network",
    "The most common expensive mistake: sending ETH on Ethereum mainnet to an address that expects ETH on Arbitrum. The funds appear lost because the receiving wallet isn't watching the right network. Always verify the network on both the sending and receiving side before confirming."),

    ("Why are bridges high-value hack targets?", [
        "They charge the highest swap fees",
        "They are built on outdated technology",
        "They lock large amounts of tokens in smart contracts",
        "They are not audited"
    ], "They lock large amounts of tokens in smart contracts",
    "Bridges aggregate enormous amounts of locked tokens — making them attractive targets. The Ronin bridge held $625M when hacked. The Wormhole bridge had $320M stolen. Only use bridges that are audited, battle-tested, and widely used by the community."),
]

HS_SWAPBRIDGE_KC_FULL = [
    ("What formula governs AMM swap pricing?", [
        "p = supply / demand",
        "x × y = k",
        "price = fees / volume",
        "APY = rewards / TVL"
    ], "x × y = k",
    "The constant product formula x × y = k ensures that as you buy one token (reducing its reserve), the other token's quantity must increase proportionally to keep the product constant. This automatically adjusts the price — no order book needed."),

    ("What is a wrapped token?", [
        "A token with extra security features",
        "A representation of one token on a different blockchain",
        "A stablecoin pegged to another crypto",
        "A governance token for bridges"
    ], "A representation of one token on a different blockchain",
    "Wrapped tokens (like WBTC or WETH) represent an asset on a chain where it doesn't natively exist. They maintain a 1:1 peg with the original, backed by locked assets held by the bridge. If the bridge is exploited, wrapped tokens can lose their backing."),

    ("What made the Ronin bridge hack possible?", [
        "Slippage was set too high",
        "Five of nine validator keys were compromised",
        "The wrapped tokens were minted incorrectly",
        "The DEX aggregator routed poorly"
    ], "Five of nine validator keys were compromised",
    "Ronin used a 5-of-9 multisig where Axie Infinity controlled 4 validators. The attacker compromised all 4 plus one external validator — reaching the 5-of-9 threshold. This centralization made the entire $625M vulnerable to a single coordinated attack."),

    ("What is price impact in a DEX swap?", [
        "The fee charged by the protocol",
        "How much your trade moves the pool's price",
        "The difference between CEX and DEX prices",
        "Gas cost on the destination chain"
    ], "How much your trade moves the pool's price",
    "Price impact is the percentage by which your trade shifts the token ratio in the pool. Large trades against small pools have high impact. Always check the price impact before confirming — above 1% is significant, above 3% is a red flag for smaller tokens."),

    ("What is a DEX aggregator?", [
        "A centralized exchange that lists DEX tokens",
        "A tool that routes your swap across multiple pools for the best price",
        "A bridge that connects two DEXs on different chains",
        "A smart contract that stores liquidity pool rewards"
    ], "A tool that routes your swap across multiple pools for the best price",
    "Aggregators like 1inch split your order across multiple pools simultaneously to minimize slippage and find the best execution price. On large trades, this can save significant amounts compared to trading against a single pool."),

    ("What is impermanent loss in a swap liquidity pool?", [
        "Gas fees lost on a failed transaction",
        "Loss from providing liquidity when token prices diverge from deposit ratio",
        "The bridge fee on cross-chain transfers",
        "Slippage from a large market order"
    ], "Loss from providing liquidity when token prices diverge from deposit ratio",
    "When you provide liquidity and token prices move relative to each other, the AMM rebalances your position — leaving you with more of the fallen token and less of the risen one. Compared to just holding, you end up worse off. Stablecoin pairs minimize IL since both prices stay close to $1."),

    ("Why does bridging on Ethereum mainnet cost more than bridging on XRPL?", [
        "XRPL has faster validators",
        "Ethereum charges per-computation gas fees that can spike with congestion — XRPL charges a flat fee under $0.01",
        "XRPL bridges are subsidized by Ripple",
        "Ethereum bridges require more validator signatures"
    ], "Ethereum charges per-computation gas fees that can spike with congestion — XRPL charges a flat fee under $0.01",
    "Ethereum's gas model charges for every computational operation, and fees spike during congestion — a bridge transaction can cost $30–$100. XRPL charges a fixed 'drops' fee (fractions of XRP) regardless of network load, making it ideal for high-frequency or small-value cross-chain operations."),
]

COL_SWAPBRIDGE_KC_FULL = [
    ("What is a sandwich attack in MEV?", [
        "Two bridges wrapping the same token simultaneously",
        "A bot front-runs then back-runs your swap to profit from your price impact",
        "A failed bridge transaction between two chains",
        "Splitting a swap across multiple pools to avoid detection"
    ], "A bot front-runs then back-runs your swap to profit from your price impact",
    "The attacker's bot sees your pending swap, buys the same token before you (raising the price), lets your swap execute at the worse price, then immediately sells (back-runs). Your swap paid the price increase — the bot pocketed the difference. Estimated $1B+ is extracted this way annually on Ethereum."),

    ("What makes ZK bridges the most secure bridge design?", [
        "They use a large multisig validator set",
        "They have longer fraud proof windows",
        "They use cryptographic validity proofs to verify source chain state",
        "They require no gas on the destination chain"
    ], "They use cryptographic validity proofs to verify source chain state",
    "ZK bridges submit a zero-knowledge validity proof with every batch proving the transactions were correctly executed on the source chain. The destination chain contract mathematically verifies the proof — no trust in validators, no waiting period. The most trustless design but computationally expensive."),

    ("What is Uniswap V3's concentrated liquidity?", [
        "Liquidity spread evenly across the entire price curve",
        "Capital deployed only within a chosen price range for higher fee efficiency",
        "A ZK proof method for verifying swap validity",
        "A bridge design using locked and minted tokens"
    ], "Capital deployed only within a chosen price range for higher fee efficiency",
    "V3 LPs specify a price range (e.g., ETH $1,800-$2,200). All capital earns fees only when price is in range — up to 4,000× more efficient than V2 for the same capital. Trade-off: higher impermanent loss if price exits the range, and active management is required."),

    ("What makes XRPL's DEX immune to MEV sandwich attacks?", [
        "XRPL uses a private mempool that bots cannot access",
        "Transactions are ordered deterministically in consensus — no bot can insert orders between them",
        "XRPL charges fees that make front-running unprofitable",
        "XRPL DEX uses ZK proofs that hide transaction details"
    ], "Transactions are ordered deterministically in consensus — no bot can insert orders between them",
    "XRPL has no traditional mempool. Transactions are submitted to validators and ordered deterministically during the consensus round. There's no window for bots to observe pending transactions and insert front-running orders — the protocol eliminates the MEV attack surface at the consensus layer."),

    ("What is the key trade-off of ZK vs optimistic bridges?", [
        "ZK bridges are cheaper but less secure",
        "ZK bridges provide instant cryptographic finality but are more computationally expensive to generate proofs",
        "Optimistic bridges are faster but need trusted validators",
        "ZK bridges require a 7-day challenge window while optimistic bridges are instant"
    ], "ZK bridges provide instant cryptographic finality but are more computationally expensive to generate proofs",
    "Optimistic bridges assume validity and allow fraud challenges for 7 days — you must wait before funds are fully available. ZK bridges are mathematically verified immediately — no waiting period. But generating ZK proofs requires significant computation, increasing costs and slowing throughput."),

    ("What is slippage tolerance and why does setting it too high risk MEV?", [
        "The maximum time allowed for a swap to confirm",
        "The maximum price movement accepted between signing and execution — too high leaves room for bots to extract",
        "The minimum liquidity required in a pool before trading",
        "The deadline setting for bridge transactions"
    ], "The maximum price movement accepted between signing and execution — too high leaves room for bots to extract",
    "Slippage tolerance sets the worst price you'll accept. A 10% tolerance means your swap can execute up to 10% worse than shown. Bots will deliberately sandwich your transaction to extract exactly up to your tolerance. Setting tight slippage (0.1–0.5%) limits extraction but risks reverts on volatile pairs."),

    ("What is the 'lock and mint' bridge model?", [
        "Locking tokens in one DEX and minting them in another DEX on the same chain",
        "Locking tokens in a source chain contract and minting wrapped equivalents on the destination chain",
        "Locking tokens for staking and minting receipt tokens",
        "Locking governance tokens to mint voting rights"
    ], "Locking tokens in a source chain contract and minting wrapped equivalents on the destination chain",
    "In lock-and-mint, your tokens are held in a smart contract on Chain A. An equivalent wrapped token is minted on Chain B. When you return, you burn the wrapped tokens on Chain B and unlock the originals on Chain A. WBTC on Ethereum is the most used example — 1 BTC locked per 1 WBTC minted."),
]


def replace_swapbridge_kc(classroom_name, questions):
    d = load(classroom_name)
    kc = d['scenes'][-1]
    # Replace with proper quiz format
    kc_new = make_quiz_kc(
        f"kc-{classroom_name}",
        kc['title'],
        questions
    )
    kc_new['order'] = kc['order']
    d['scenes'][-1] = kc_new
    save(classroom_name, d)


if __name__ == '__main__':
    print('=== Fix 1: College trilemma overlap ===')
    fix_trilemma_overlap()

    print('\n=== Fix 2: Expand HS KCs to 7+ questions ===')
    for name, extras in HS_EXTRA_QUESTIONS.items():
        add_questions_to_kc(name, extras)

    print('\n=== Fix 2: Expand College KCs to 7+ questions ===')
    for name, extras in COL_EXTRA_QUESTIONS.items():
        add_questions_to_kc(name, extras)

    print('\n=== Fix 3: Replace swap/bridge slide KCs with proper quiz format ===')
    replace_swapbridge_kc('oc-elem-swapbridge', ELEM_SWAPBRIDGE_KC)
    replace_swapbridge_kc('oc-hs-swapbridge', HS_SWAPBRIDGE_KC_FULL)
    replace_swapbridge_kc('oc-col-swapbridge', COL_SWAPBRIDGE_KC_FULL)

    print('\nAll fixes applied.')
