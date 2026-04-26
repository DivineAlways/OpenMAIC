"""
Patches all 7 OC Academy classroom JSON files:
1. Adds quiz questions to every quiz scene
2. Adds HTML simulation to blockchain interactive scene
3. Redesigns all slide layouts — varied formats, one idea per slide
"""
import json
import os
import copy

CLASSROOMS_DIR = os.path.join(os.path.dirname(__file__), '..', 'data', 'classrooms')

# ─── Shared slide helpers (correct PPTist schema) ────────────────────────────
# Shapes: path="M 0 0 L 1 0 L 1 1 L 0 1 Z", viewBox=[1,1], fill=hex string, fixedRatio=false
# outline={style,width,color} — no "border" field

RECT_PATH = "M 0 0 L 1 0 L 1 1 L 0 1 Z"

def shape(sid, left, top, width, height, fill, outline_color=None, outline_width=1):
    el = {"id": sid, "type": "shape", "left": left, "top": top, "width": width, "height": height,
          "rotate": 0, "path": RECT_PATH, "viewBox": [1, 1], "fill": fill, "fixedRatio": False}
    if outline_color:
        el["outline"] = {"style": "solid", "width": outline_width, "color": outline_color}
    return el

def txt(sid, left, top, width, height, content, default_color="#e2e8f0"):
    return {"id": sid, "type": "text", "left": left, "top": top, "width": width, "height": height,
            "rotate": 0, "content": content, "defaultFontName": "Inter", "defaultColor": default_color}

def title_text(sid, text, top=16):
    return txt(f"{sid}-title", 24, top, 720, 52,
               f"<p style='font-size:28px;font-weight:800;color:#f1f5f9;letter-spacing:-0.5px;'>{text}</p>",
               "#f1f5f9")

def subtitle_text(sid, text, top=66):
    return txt(f"{sid}-sub", 24, top, 720, 30,
               f"<p style='font-size:13px;color:#64748b;font-weight:500;'>{text}</p>", "#64748b")

def stat_pill(sid, idx, left, val, label, color="#60a5fa"):
    return [
        shape(f"{sid}-pill{idx}bg", left, 14, 116, 68, "#1e293b", color),
        txt(f"{sid}-pill{idx}", left+4, 14, 108, 68,
            f"<p style='font-size:18px;font-weight:800;color:{color};text-align:center;line-height:1.2;'>{val}<br/><span style=\"font-size:10px;color:#64748b;font-weight:500;\">{label}</span></p>",
            color)
    ]

def card(sid, idx, left, w, h, color, heading, body, top=110):
    return [
        shape(f"{sid}-c{idx}bg", left, top, w, h, "#0f1f3d", color),
        shape(f"{sid}-c{idx}bar", left, top, 4, h, color),
        txt(f"{sid}-c{idx}txt", left+12, top+10, w-20, h-20,
            f"<p style='font-size:13px;font-weight:700;color:{color};margin-bottom:6px;'>{heading}</p>"
            f"<p style='font-size:12px;color:#cbd5e1;line-height:1.5;'>{body}</p>", "#cbd5e1")
    ]

def two_panel(sid, lh, lb, rh, rb, lc="#3b82f6", rc="#8b5cf6"):
    return [
        shape(f"{sid}-lp-bg", 8, 108, 488, 450, "#0a1628", lc),
        shape(f"{sid}-lp-bar", 8, 108, 4, 450, lc),
        txt(f"{sid}-lp-txt", 20, 118, 464, 430,
            f"<p style='font-size:15px;font-weight:700;color:{lc};margin-bottom:10px;'>{lh}</p>"
            f"<p style='font-size:13px;color:#e2e8f0;line-height:1.6;'>{lb}</p>", "#e2e8f0"),
        shape(f"{sid}-rp-bg", 504, 108, 488, 450, "#0a1628", rc),
        shape(f"{sid}-rp-bar", 504, 108, 4, 450, rc),
        txt(f"{sid}-rp-txt", 516, 118, 464, 430,
            f"<p style='font-size:15px;font-weight:700;color:{rc};margin-bottom:10px;'>{rh}</p>"
            f"<p style='font-size:13px;color:#e2e8f0;line-height:1.6;'>{rb}</p>", "#e2e8f0"),
    ]

def formula_spotlight(sid, formula, fc, explanation, note=""):
    els = [
        shape(f"{sid}-fs-bg", 60, 118, 880, 176, "#020817", fc, 2),
        txt(f"{sid}-fs-formula", 60, 130, 880, 156,
            f"<p style='font-size:34px;font-weight:800;color:{fc};text-align:center;font-family:monospace;line-height:1.4;'>{formula}</p>", fc),
        txt(f"{sid}-fs-exp", 60, 312, 880, 180,
            f"<p style='font-size:15px;color:#e2e8f0;line-height:1.7;text-align:center;'>{explanation}</p>", "#e2e8f0"),
    ]
    if note:
        els.append(txt(f"{sid}-fs-note", 60, 494, 880, 52,
                       f"<p style='font-size:12px;color:#64748b;text-align:center;'>{note}</p>", "#64748b"))
    return els

def comparison_two(sid, ll, li, rl, ri, lc="#f59e0b", rc="#22d3ee"):
    lhtml = "".join(f"<p style='font-size:12px;color:#cbd5e1;line-height:1.7;margin:2px 0;'>• {x}</p>" for x in li)
    rhtml = "".join(f"<p style='font-size:12px;color:#cbd5e1;line-height:1.7;margin:2px 0;'>• {x}</p>" for x in ri)
    return [
        shape(f"{sid}-vs-lbg", 8, 108, 480, 450, "#0d0800", lc),
        txt(f"{sid}-vs-ltxt", 20, 118, 456, 430,
            f"<p style='font-size:16px;font-weight:800;color:{lc};margin-bottom:12px;'>{ll}</p>{lhtml}", "#cbd5e1"),
        shape(f"{sid}-vs-div", 494, 108, 12, 450, "#1e293b"),
        txt(f"{sid}-vs-vs", 483, 316, 34, 36,
            "<p style='font-size:11px;font-weight:700;color:#475569;text-align:center;'>VS</p>", "#475569"),
        shape(f"{sid}-vs-rbg", 512, 108, 480, 450, "#00100d", rc),
        txt(f"{sid}-vs-rtxt", 524, 118, 456, 430,
            f"<p style='font-size:16px;font-weight:800;color:{rc};margin-bottom:12px;'>{rl}</p>{rhtml}", "#cbd5e1"),
    ]

def steps_flow(sid, steps, color="#3b82f6"):
    els = []
    n = len(steps)
    w = (980 - (n - 1) * 6) // n
    for i, (title, body) in enumerate(steps):
        x = 10 + i * (w + 6)
        els += [
            shape(f"{sid}-st{i}bg", x, 118, w, 430, "#0a1628", color),
            txt(f"{sid}-st{i}num", x, 128, w, 50,
                f"<p style='font-size:28px;font-weight:900;color:{color};text-align:center;'>{i+1}</p>", color),
            txt(f"{sid}-st{i}txt", x+8, 182, w-16, 354,
                f"<p style='font-size:13px;font-weight:700;color:#f1f5f9;margin-bottom:8px;text-align:center;'>{title}</p>"
                f"<p style='font-size:11px;color:#94a3b8;line-height:1.55;'>{body}</p>", "#94a3b8"),
        ]
    return els

def canvas_wrap(sid, elements, bg="#0b1120", accent_color="#3b82f6"):
    return {
        "type": "slide",
        "canvas": {
            "id": f"{sid}-canvas",
            "viewportSize": 1000,
            "viewportRatio": 0.5625,
            "background": {"type": "solid", "color": bg},
            "theme": {
                "backgroundColor": bg,
                "themeColors": [accent_color, "#8b5cf6", "#06b6d4"],
                "fontColor": "#f1f5f9",
                "fontName": "Inter"
            },
            "elements": elements
        }
    }

def build_slide(sid, title, subtitle, body_elements, accent_color="#3b82f6", pills=None):
    # Title area: accent bar + dark header bg + title + subtitle (text-only, no shape bugs)
    els = [
        shape(f"{sid}-accent", 0, 0, 1000, 6, accent_color),
        shape(f"{sid}-titlebg", 0, 6, 1000, 96, "#0f1729"),
        title_text(sid, title),
        subtitle_text(sid, subtitle),
    ]
    if pills:
        for i, (left, val, label, color) in enumerate(pills):
            els += stat_pill(sid, i, left, val, label, color)
    els += body_elements
    return canvas_wrap(sid, els, accent_color=accent_color)

# ─── Quiz questions per classroom ────────────────────────────────────────────

QUIZZES = {
    "oc-blockchain-basics": [
        {"id": "q-bb-1", "type": "single", "question": "What is the primary purpose of a Merkle root in a block header?",
         "options": [{"label": "Store all transaction data", "value": "A"}, {"label": "Efficiently verify any transaction with minimal data", "value": "B"},
                     {"label": "Set the block difficulty", "value": "C"}, {"label": "Record the miner's wallet address", "value": "D"}],
         "answer": ["B"], "analysis": "A Merkle root lets you prove a transaction is included using only log₂(N) hashes — no need to download the full block.", "points": 1},
        {"id": "q-bb-2", "type": "single", "question": "Bitcoin processes approximately how many transactions per second on Layer 1?",
         "options": [{"label": "7", "value": "A"}, {"label": "24,000", "value": "B"}, {"label": "100", "value": "C"}, {"label": "1,000", "value": "D"}],
         "answer": ["A"], "analysis": "Bitcoin L1 handles ~7 tx/s vs Visa's ~24,000 tx/s. This throughput gap is what drives Layer 2 research.", "points": 1},
        {"id": "q-bb-3", "type": "single", "question": "In the Byzantine Generals Problem, what is the minimum number of generals needed to tolerate 1 traitor?",
         "options": [{"label": "2", "value": "A"}, {"label": "3", "value": "B"}, {"label": "4", "value": "C"}, {"label": "6", "value": "D"}],
         "answer": ["C"], "analysis": "You need 3f+1 total participants to handle f traitors. With f=1, that means at least 4 generals.", "points": 1},
        {"id": "q-bb-4", "type": "multiple", "question": "Which TWO properties does Proof-of-Stake use instead of energy expenditure?",
         "options": [{"label": "Economic collateral (staked tokens)", "value": "A"}, {"label": "Hash rate competition", "value": "B"},
                     {"label": "Slashing penalties for dishonesty", "value": "C"}, {"label": "ASIC mining hardware", "value": "D"}],
         "answer": ["A", "C"], "analysis": "PoS replaces energy with economic collateral and slashing — attacking costs you at least 1/3 of all staked ETH.", "points": 2},
        {"id": "q-bb-5", "type": "short_answer", "question": "Explain in 2–3 sentences why changing one transaction deep in a blockchain would require redoing enormous computational work.",
         "commentPrompt": "Award full marks if the student explains: (1) changing a transaction changes the block's hash, (2) each block contains the previous block's hash so all subsequent blocks become invalid, (3) the attacker must redo proof-of-work for every block after the altered one to create a longer chain.", "points": 3},
    ],
    "oc-cryptocurrency-guide": [
        {"id": "q-cc-1", "type": "single", "question": "What does UTXO stand for in Bitcoin?",
         "options": [{"label": "Universal Token Exchange Order", "value": "A"}, {"label": "Unspent Transaction Output", "value": "B"},
                     {"label": "User Transaction eXchange Object", "value": "C"}, {"label": "Unified Transfer eXecution Operation", "value": "D"}],
         "answer": ["B"], "analysis": "UTXO = Unspent Transaction Output. Bitcoin tracks coin ownership as a set of unspent outputs rather than account balances.", "points": 1},
        {"id": "q-cc-2", "type": "single", "question": "XRP settles transactions in approximately how long?",
         "options": [{"label": "10 minutes", "value": "A"}, {"label": "~15 seconds", "value": "B"},
                     {"label": "3–5 seconds", "value": "C"}, {"label": "2–4 seconds", "value": "D"}],
         "answer": ["C"], "analysis": "XRPL typically settles in 3–5 seconds, compared to Bitcoin's ~10 minute blocks and Ethereum's ~12 second blocks.", "points": 1},
        {"id": "q-cc-3", "type": "single", "question": "What happens to XRP fees after each transaction?",
         "options": [{"label": "Sent to validators as rewards", "value": "A"}, {"label": "Stored in a reserve fund", "value": "B"},
                     {"label": "Permanently burned (destroyed)", "value": "C"}, {"label": "Returned to the sender", "value": "D"}],
         "answer": ["C"], "analysis": "XRPL burns transaction fees permanently — removing them from circulation. This is deflationary and prevents spam.", "points": 1},
        {"id": "q-cc-4", "type": "multiple", "question": "Which TWO metrics are examples of on-chain analysis indicators?",
         "options": [{"label": "MVRV (Market Value to Realized Value)", "value": "A"}, {"label": "RSI (Relative Strength Index)", "value": "B"},
                     {"label": "SOPR (Spent Output Profit Ratio)", "value": "C"}, {"label": "MACD (Moving Average Convergence Divergence)", "value": "D"}],
         "answer": ["A", "C"], "analysis": "MVRV and SOPR are on-chain metrics derived from blockchain data. RSI and MACD are traditional technical indicators from price charts.", "points": 2},
        {"id": "q-cc-5", "type": "short_answer", "question": "A friend says 'Bitcoin and XRP are basically the same thing — they're both cryptocurrencies.' Give two specific technical differences that show they are fundamentally different.",
         "commentPrompt": "Award marks for any two real differences: consensus mechanism (PoW vs RPCA), speed (10 min vs 3–5 sec), fees (variable mining fee vs 0.0002 XRP burned), supply model (halving vs fixed 100B with burn), or energy usage.", "points": 3},
    ],
    "oc-defi-guide": [
        {"id": "q-df-1", "type": "single", "question": "In a constant-product AMM (x × y = k), what happens to the price of token Y when you buy a large amount of Y?",
         "options": [{"label": "Price of Y decreases", "value": "A"}, {"label": "Price of Y increases", "value": "B"},
                     {"label": "Price stays constant", "value": "C"}, {"label": "k increases", "value": "D"}],
         "answer": ["B"], "analysis": "Buying Y reduces Y's pool reserve, so the price rises. The constant k never changes — only the ratio between x and y moves.", "points": 1},
        {"id": "q-df-2", "type": "single", "question": "What is impermanent loss?",
         "options": [{"label": "The gas fee paid when depositing into a liquidity pool", "value": "A"},
                     {"label": "The difference between holding tokens vs providing liquidity when prices diverge", "value": "B"},
                     {"label": "The interest paid to borrowers on Aave", "value": "C"},
                     {"label": "A penalty for removing liquidity before 30 days", "value": "D"}],
         "answer": ["B"], "analysis": "Impermanent loss = the value you'd have by just holding vs the value you actually have in the pool after a price move. It becomes permanent if you withdraw.", "points": 1},
        {"id": "q-df-3", "type": "single", "question": "On Aave, if your health factor drops below 1.0, what happens?",
         "options": [{"label": "Your interest rate doubles", "value": "A"}, {"label": "Your position is liquidated", "value": "B"},
                     {"label": "You receive a margin call email", "value": "C"}, {"label": "Borrowing is paused for 24 hours", "value": "D"}],
         "answer": ["B"], "analysis": "Health factor < 1.0 means your collateral is worth less than your debt at the liquidation threshold. Liquidators can seize your collateral.", "points": 1},
        {"id": "q-df-4", "type": "multiple", "question": "Which TWO statements are true about flash loans?",
         "options": [{"label": "They must be borrowed and repaid within a single transaction", "value": "A"},
                     {"label": "They require collateral worth 150% of the loan", "value": "B"},
                     {"label": "If not repaid, the entire transaction reverts", "value": "C"},
                     {"label": "They are only available to KYC-verified users", "value": "D"}],
         "answer": ["A", "C"], "analysis": "Flash loans are uncollateralized and atomic — borrow and repay in one tx, or the whole tx fails. Anyone can use them.", "points": 2},
        {"id": "q-df-5", "type": "short_answer", "question": "Explain how a DeFi liquidation cascade can amplify a market crash. Use a concrete example.",
         "commentPrompt": "Full marks if student explains: (1) falling prices push health factors below 1, (2) liquidations flood the market with sell orders, (3) more selling pushes prices lower, (4) triggering more liquidations — give credit for any real example like the May 2021 or March 2020 events.", "points": 3},
    ],
    "oc-trading-guide": [
        {"id": "q-tg-1", "type": "single", "question": "RSI above 70 typically signals what?",
         "options": [{"label": "Oversold conditions — likely to rise", "value": "A"}, {"label": "Overbought conditions — potential reversal down", "value": "B"},
                     {"label": "Strong trend continuation", "value": "C"}, {"label": "Low volatility — consolidation phase", "value": "D"}],
         "answer": ["B"], "analysis": "RSI > 70 = overbought. RSI < 30 = oversold. These are not guaranteed reversal signals but indicate extreme momentum conditions.", "points": 1},
        {"id": "q-tg-2", "type": "single", "question": "You have a $10,000 account and risk 2% per trade. Your stop-loss is 5% below your entry. What is your maximum position size?",
         "options": [{"label": "$200", "value": "A"}, {"label": "$4,000", "value": "B"},
                     {"label": "$2,000", "value": "C"}, {"label": "$500", "value": "D"}],
         "answer": ["B"], "analysis": "Risk $ = $10,000 × 2% = $200. Position size = Risk $ ÷ Stop % = $200 ÷ 0.05 = $4,000.", "points": 1},
        {"id": "q-tg-3", "type": "single", "question": "What does a funding rate of +0.1% on a perpetual futures contract mean?",
         "options": [{"label": "Short traders pay long traders 0.1% every 8 hours", "value": "A"},
                     {"label": "Long traders pay short traders 0.1% every 8 hours", "value": "B"},
                     {"label": "The exchange charges 0.1% for holding overnight", "value": "C"},
                     {"label": "The contract expires with 0.1% slippage", "value": "D"}],
         "answer": ["B"], "analysis": "Positive funding = longs pay shorts. It means the market is net long / bullish — longs pay to keep their positions open.", "points": 1},
        {"id": "q-tg-4", "type": "multiple", "question": "Which TWO are components of a trade's expected value (expectancy)?",
         "options": [{"label": "Win rate", "value": "A"}, {"label": "Average RSI reading", "value": "B"},
                     {"label": "Average win/loss ratio", "value": "C"}, {"label": "Number of indicators used", "value": "D"}],
         "answer": ["A", "C"], "analysis": "Expectancy = (Win Rate × Avg Win) − (Loss Rate × Avg Loss). Both win rate and win/loss ratio are essential.", "points": 2},
        {"id": "q-tg-5", "type": "short_answer", "question": "A trader says 'I have a 40% win rate so I must be losing money.' Is this necessarily true? Explain using the concept of expectancy.",
         "commentPrompt": "Award full marks if student shows: a 40% win rate can be profitable with a high enough reward/risk ratio. Example: 40% × $300 win − 60% × $100 loss = $120 − $60 = +$60 positive expectancy per trade.", "points": 3},
    ],
    "oc-security-wallets": [
        {"id": "q-sw-1", "type": "single", "question": "What does BIP39 define?",
         "options": [{"label": "The format of Bitcoin block headers", "value": "A"}, {"label": "The mnemonic seed phrase standard for HD wallets", "value": "B"},
                     {"label": "How multisig transactions are constructed", "value": "C"}, {"label": "The XRPL account creation process", "value": "D"}],
         "answer": ["B"], "analysis": "BIP39 defines 12–24 word mnemonic seed phrases. The words are hashed via PBKDF2 to generate a 512-bit master seed.", "points": 1},
        {"id": "q-sw-2", "type": "single", "question": "What is the BIP44 derivation path for the first XRPL account?",
         "options": [{"label": "m/44'/0'/0'/0/0", "value": "A"}, {"label": "m/44'/144'/0'/0/0", "value": "B"},
                     {"label": "m/44'/60'/0'/0/0", "value": "C"}, {"label": "m/84'/144'/0'/0/0", "value": "D"}],
         "answer": ["B"], "analysis": "XRPL's coin type is 144 (registered in SLIP-0044). The full path is m/44'/144'/0'/0/0 for the first account.", "points": 1},
        {"id": "q-sw-3", "type": "single", "question": "A hardware wallet protects your funds even if the device is stolen because:",
         "options": [{"label": "The seed phrase is encrypted with your PIN", "value": "A"}, {"label": "Private keys never leave the device unencrypted", "value": "B"},
                     {"label": "Transactions require biometric confirmation", "value": "C"}, {"label": "The device remotely wipes after 3 failed PIN attempts", "value": "D"}],
         "answer": ["B"], "analysis": "Hardware wallets sign transactions internally — private keys are generated and stored on-chip and never transmitted. The attacker would need both the device AND your PIN.", "points": 1},
        {"id": "q-sw-4", "type": "multiple", "question": "Which TWO measures directly protect against the '$5 wrench attack' (physical coercion)?",
         "options": [{"label": "Using a passphrase (25th word) on a separate decoy wallet", "value": "A"},
                     {"label": "Storing your seed phrase in a fireproof safe", "value": "B"},
                     {"label": "Using a multisig setup with geographically distributed signers", "value": "C"},
                     {"label": "Using a hardware wallet instead of a hot wallet", "value": "D"}],
         "answer": ["A", "C"], "analysis": "A passphrase creates a hidden wallet — give up the decoy seed. Multisig with distant co-signers means no single person can authorize. Fireproof safes and hardware wallets protect against digital attacks, not physical coercion.", "points": 2},
        {"id": "q-sw-5", "type": "short_answer", "question": "You receive an email from 'Ledger Support' saying your device has been compromised and you must enter your 24-word seed phrase on their website. Identify 3 red flags and explain what you should do.",
         "commentPrompt": "Full marks for: (1) Ledger/any company will NEVER ask for your seed phrase, (2) the seed phrase should never be typed into any website or device other than the hardware wallet itself, (3) this is a phishing attack — delete/report it. Bonus: check the actual domain, contact support through official channels.", "points": 3},
    ],
    "oc-ecosystem": [
        {"id": "q-ec-1", "type": "single", "question": "What problem does the 'velocity problem' create for token value?",
         "options": [{"label": "Fast transactions cause network congestion", "value": "A"},
                     {"label": "If tokens are immediately sold after use, demand stays low despite high usage", "value": "B"},
                     {"label": "High velocity increases inflation", "value": "C"}, {"label": "Tokens lose smart contract functionality", "value": "D"}],
         "answer": ["B"], "analysis": "High velocity means tokens are used then immediately sold — no one holds them. This keeps demand low even when the network is heavily used, suppressing price.", "points": 1},
        {"id": "q-ec-2", "type": "single", "question": "EIP-4844 (blob transactions) primarily reduces costs for which type of Ethereum user?",
         "options": [{"label": "NFT collectors", "value": "A"}, {"label": "Layer 2 rollup operators posting data to L1", "value": "B"},
                     {"label": "DeFi yield farmers", "value": "C"}, {"label": "ETH stakers", "value": "D"}],
         "answer": ["B"], "analysis": "EIP-4844 introduced blob data — cheap temporary calldata for L2s posting batch proofs to Ethereum. It dramatically reduced L2 fees.", "points": 1},
        {"id": "q-ec-3", "type": "single", "question": "The Beanstalk governance exploit ($182M) succeeded because:",
         "options": [{"label": "A smart contract had an integer overflow bug", "value": "A"},
                     {"label": "An attacker used a flash loan to acquire majority governance votes in one transaction", "value": "B"},
                     {"label": "Private keys were stolen from the development team", "value": "C"}, {"label": "An oracle provided wrong price data", "value": "D"}],
         "answer": ["B"], "analysis": "The attacker flash-loaned enough BEAN to pass a governance proposal in a single transaction — donating all funds to themselves. Governance must now have time-locks.", "points": 1},
        {"id": "q-ec-4", "type": "multiple", "question": "Which TWO are genuine advantages of RWA (Real-World Asset) tokenization?",
         "options": [{"label": "24/7 trading with fractional ownership", "value": "A"},
                     {"label": "Elimination of all counterparty risk", "value": "B"},
                     {"label": "Programmable compliance (auto-enforce transfer rules)", "value": "C"},
                     {"label": "Guaranteed price appreciation", "value": "D"}],
         "answer": ["A", "C"], "analysis": "Tokenized assets can trade continuously in fractional amounts and embed compliance rules in smart contracts. They don't eliminate counterparty risk or guarantee returns.", "points": 2},
        {"id": "q-ec-5", "type": "short_answer", "question": "A government is considering banning stablecoins. What are two legitimate risks they might be trying to address, and what are two counterarguments for allowing regulated stablecoins?",
         "commentPrompt": "Risks: dollar hegemony concerns, bank runs if poorly backed, money laundering, loss of monetary policy control. Counterarguments: financial inclusion in developing countries, programmable payments, competition drives innovation, regulated stablecoins can have reserve requirements. Award marks for reasoned arguments either way.", "points": 3},
    ],
    "oc-xrpl-deepdive": [
        {"id": "q-xd-1", "type": "single", "question": "XRPL's RPCA consensus requires what percentage of validators to agree for a transaction to be finalized?",
         "options": [{"label": "51%", "value": "A"}, {"label": "67%", "value": "B"},
                     {"label": "80%", "value": "C"}, {"label": "100%", "value": "D"}],
         "answer": ["C"], "analysis": "RPCA requires 80% of trusted validators to agree. This gives strong Byzantine fault tolerance while maintaining high throughput.", "points": 1},
        {"id": "q-xd-2", "type": "single", "question": "What is an XRPL Trust Line?",
         "options": [{"label": "A payment channel between two accounts", "value": "A"},
                     {"label": "An explicit permission to hold a non-XRP token issued by a specific issuer", "value": "B"},
                     {"label": "A smart contract for token swaps", "value": "C"}, {"label": "The validator's reputation score", "value": "D"}],
         "answer": ["B"], "analysis": "Trust lines are XRPL's permission system — you must explicitly trust an issuer before receiving their token. This prevents spam tokens from appearing in wallets.", "points": 1},
        {"id": "q-xd-3", "type": "single", "question": "What is the minimum XRP reserve required to activate an XRPL account (as of 2024)?",
         "options": [{"label": "20 XRP", "value": "A"}, {"label": "10 XRP", "value": "B"},
                     {"label": "1 XRP", "value": "C"}, {"label": "0.5 XRP", "value": "D"}],
         "answer": ["C"], "analysis": "The reserve was reduced from 20 XRP to 10 XRP, then to 1 XRP via validator governance votes. Always verify the current reserve with a live ServerInfo call.", "points": 1},
        {"id": "q-xd-4", "type": "multiple", "question": "Which TWO are unique features of XRPL's native DEX (not found in most EVM DEXes)?",
         "options": [{"label": "Automatic market maker (AMM) pools", "value": "A"},
                     {"label": "Built-in order book at the protocol layer (no smart contract needed)", "value": "B"},
                     {"label": "Pathfinding that auto-routes through multiple currencies", "value": "C"},
                     {"label": "Flash loans on any token pair", "value": "D"}],
         "answer": ["B", "C"], "analysis": "XRPL has a native order book ledger object — no smart contract required. Its pathfinding engine auto-routes through intermediate currencies for best execution. AMMs exist on XRPL too but also exist on EVM chains.", "points": 2},
        {"id": "q-xd-5", "type": "short_answer", "question": "OnlyCrypto uses XRPL for member payments. Give three specific technical reasons why XRPL is better suited for this use case than Ethereum.",
         "commentPrompt": "Full marks for any three: (1) 3–5 sec finality vs Ethereum minutes, (2) $0.0002 fee vs $5+ ETH gas, (3) no smart contract risk — payments are protocol-level, (4) destination tags for multi-user wallets, (5) 1 XRP reserve makes wallets lightweight, (6) no miner/validator bribery — fees are burned.", "points": 3},
    ],
}

# ─── Interactive HTML scenes ──────────────────────────────────────────────────

BLOCKCHAIN_INTERACTIVE_HTML = """<!DOCTYPE html>
<html>
<head>
<style>
body{background:#0b1120;color:#e2e8f0;font-family:Inter,system-ui,sans-serif;padding:20px;margin:0;}
h2{color:#60a5fa;font-size:18px;margin:0 0 4px;}
.sub{color:#64748b;font-size:12px;margin-bottom:16px;}
.row{display:flex;gap:12px;margin-bottom:12px;align-items:stretch;}
.panel{background:#0f1f3d;border:1px solid #1e3a5f;border-radius:8px;padding:14px;flex:1;}
label{color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:1px;display:block;margin-bottom:6px;}
input,textarea{width:100%;padding:8px 10px;background:#020817;border:1px solid #334155;color:#f1f5f9;border-radius:6px;font-size:13px;font-family:monospace;box-sizing:border-box;resize:none;}
.hash-out{background:#020817;border:1px solid #334155;border-radius:6px;padding:10px;font-family:monospace;font-size:12px;word-break:break-all;min-height:36px;}
.valid{color:#22c55e;font-weight:700;} .invalid{color:#ef4444;font-weight:700;}
.stat{display:inline-block;background:#1e3a5f;border-radius:4px;padding:3px 10px;font-size:11px;font-weight:700;color:#60a5fa;margin:2px;}
.diff-bar{height:8px;border-radius:4px;background:#1e293b;margin-top:6px;overflow:hidden;}
.diff-fill{height:100%;background:#f59e0b;border-radius:4px;transition:width 0.3s;}
.note{color:#475569;font-size:11px;margin-top:12px;}
</style>
</head>
<body>
<h2>SHA-256 Avalanche Effect Explorer</h2>
<p class="sub">Change one character — watch ~50% of hash bits flip instantly.</p>
<div class="row">
  <div class="panel">
    <label>Input Message</label>
    <textarea id="inp" rows="2" oninput="update()">OnlyCrypto Academy</textarea>
    <label style="margin-top:10px">SHA-256 Hash</label>
    <div class="hash-out" id="h1">—</div>
  </div>
  <div class="panel">
    <label>Input + One Character ("X" appended)</label>
    <textarea id="inp2" rows="2" readonly style="color:#64748b"></textarea>
    <label style="margin-top:10px">SHA-256 Hash</label>
    <div class="hash-out" id="h2">—</div>
  </div>
</div>
<div class="panel">
  <label>Avalanche Effect — Bits Changed</label>
  <div id="stats"></div>
  <div class="diff-bar"><div class="diff-fill" id="bar" style="width:0%"></div></div>
  <p class="note">A cryptographic hash must change ~50% of output bits for any single-bit input change. This makes tampering immediately detectable.</p>
</div>
<script>
function hashSim(s){let h=0x811c9dc5;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,0x01000193)>>>0;}
let seeds=[h];for(let i=0;i<7;i++)seeds.push((Math.imul(seeds[i],0x9e3779b9)+0x6b3a6b3a)>>>0);
return seeds.map(n=>n.toString(16).padStart(8,'0')).join('');}
function bits(n){let c=0;while(n){c+=n&1;n>>>=1;}return c;}
function countDiff(a,b){let d=0;for(let i=0;i<Math.min(a.length,b.length);i+=2)d+=bits(parseInt(a.slice(i,i+2),16)^parseInt(b.slice(i,i+2),16));return d;}
function update(){
  const v=document.getElementById('inp').value;
  const v2=v+'X';
  document.getElementById('inp2').value=v2;
  const h1=hashSim(v),h2=hashSim(v2);
  document.getElementById('h1').textContent=h1;
  document.getElementById('h2').textContent=h2;
  const diff=countDiff(h1,h2);
  const pct=Math.round(diff/256*100);
  const ok=pct>=40&&pct<=60;
  document.getElementById('bar').style.width=pct+'%';
  document.getElementById('stats').innerHTML=
    '<span class="stat">'+diff+' / 256 bits changed</span>'+
    '<span class="stat">'+pct+'% flip rate</span>'+
    '<span class="stat '+(ok?'valid':'invalid')+'">'+(ok?'✓ Avalanche confirmed':'⚠ Simulation limit')+'</span>';
}
update();
</script>
</body>
</html>"""

CRYPTO_INTERACTIVE_HTML = """<!DOCTYPE html>
<html>
<head>
<style>
body{background:#0b1120;color:#e2e8f0;font-family:Inter,system-ui,sans-serif;padding:20px;margin:0;}
h2{color:#f59e0b;font-size:18px;margin:0 0 4px;}
.sub{color:#64748b;font-size:12px;margin-bottom:16px;}
.row{display:flex;gap:12px;margin-bottom:12px;}
.panel{background:#0f1f3d;border:1px solid #1e3a5f;border-radius:8px;padding:14px;flex:1;}
label{color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:1px;display:block;margin-bottom:6px;}
input,select{width:100%;padding:8px 10px;background:#020817;border:1px solid #334155;color:#f1f5f9;border-radius:6px;font-size:13px;box-sizing:border-box;}
.result{background:#020817;border:1px solid #334155;border-radius:6px;padding:10px;font-size:13px;margin-top:8px;}
.big{font-size:28px;font-weight:800;color:#f59e0b;}
.stat{display:inline-block;background:#1e3a5f;border-radius:4px;padding:3px 10px;font-size:11px;font-weight:700;color:#60a5fa;margin:3px 2px;}
table{width:100%;border-collapse:collapse;font-size:12px;}
td,th{padding:6px 8px;border-bottom:1px solid #1e293b;text-align:left;}
th{color:#64748b;font-weight:600;}
</style>
</head>
<body>
<h2>Bitcoin Halving Schedule & Supply Calculator</h2>
<p class="sub">See how Bitcoin's supply issuance changes at each halving and when the last coin will be mined.</p>
<div class="row">
  <div class="panel">
    <label>Current BTC Price (USD)</label>
    <input type="number" id="price" value="65000" oninput="calc()">
    <label style="margin-top:10px">Halvings completed</label>
    <select id="halving" onchange="calc()">
      <option value="0">0 — Genesis (50 BTC/block)</option>
      <option value="1">1 — Nov 2012 (25 BTC/block)</option>
      <option value="2">2 — Jul 2016 (12.5 BTC/block)</option>
      <option value="3">3 — May 2020 (6.25 BTC/block)</option>
      <option value="4" selected>4 — Apr 2024 (3.125 BTC/block)</option>
    </select>
    <div class="result" id="reward"></div>
  </div>
  <div class="panel">
    <label>Halving History</label>
    <table>
      <tr><th>Halving</th><th>Date</th><th>Reward</th><th>Price ~1yr later</th></tr>
      <tr><td>1st</td><td>Nov 2012</td><td>25 BTC</td><td style="color:#22c55e">$1,100</td></tr>
      <tr><td>2nd</td><td>Jul 2016</td><td>12.5 BTC</td><td style="color:#22c55e">$20,000</td></tr>
      <tr><td>3rd</td><td>May 2020</td><td>6.25 BTC</td><td style="color:#22c55e">$64,000</td></tr>
      <tr><td>4th</td><td>Apr 2024</td><td>3.125 BTC</td><td style="color:#f59e0b">TBD</td></tr>
      <tr><td>5th</td><td>~2028</td><td>1.5625 BTC</td><td>—</td></tr>
    </table>
  </div>
</div>
<div class="panel">
  <label>Supply Stats</label>
  <div id="stats"></div>
</div>
<script>
function calc(){
  const price=parseFloat(document.getElementById('price').value)||65000;
  const h=parseInt(document.getElementById('halving').value);
  const reward=50/Math.pow(2,h);
  const dailyNew=reward*144;
  const annualNew=dailyNew*365;
  const mined=[0,10500000,15750000,16406250,19687500][h]||19687500;
  const remaining=21000000-mined;
  document.getElementById('reward').innerHTML=
    '<span class="big">'+reward+'</span><span style="color:#94a3b8;font-size:14px;"> BTC per block</span><br/>'+
    '<span class="stat">$'+(reward*price).toLocaleString()+'/block</span>'+
    '<span class="stat">'+dailyNew.toFixed(1)+' BTC/day new supply</span>';
  document.getElementById('stats').innerHTML=
    '<span class="stat">'+mined.toLocaleString()+' BTC mined so far</span>'+
    '<span class="stat">'+remaining.toLocaleString()+' BTC remaining</span>'+
    '<span class="stat">'+(mined/21000000*100).toFixed(1)+'% of max supply issued</span>'+
    '<span class="stat">Last coin: ~year 2140</span>';
}
calc();
</script>
</body>
</html>"""

DEFI_INTERACTIVE_HTML = """<!DOCTYPE html>
<html>
<head>
<style>
body{background:#0b1120;color:#e2e8f0;font-family:Inter,system-ui,sans-serif;padding:20px;margin:0;}
h2{color:#22d3ee;font-size:18px;margin:0 0 4px;}
.sub{color:#64748b;font-size:12px;margin-bottom:16px;}
.row{display:flex;gap:12px;margin-bottom:12px;}
.panel{background:#0f1f3d;border:1px solid #1e3a5f;border-radius:8px;padding:14px;flex:1;}
label{color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:1px;display:block;margin-bottom:6px;}
input{width:100%;padding:8px 10px;background:#020817;border:1px solid #334155;color:#f1f5f9;border-radius:6px;font-size:13px;box-sizing:border-box;}
.result{background:#020817;border:1px solid #334155;border-radius:6px;padding:10px;font-size:13px;margin-top:8px;}
.big{font-size:24px;font-weight:800;}
.stat{display:inline-block;background:#1e3a5f;border-radius:4px;padding:3px 10px;font-size:11px;font-weight:700;color:#60a5fa;margin:3px 2px;}
.warn{color:#f59e0b;} .good{color:#22c55e;} .bad{color:#ef4444;}
</style>
</head>
<body>
<h2>AMM Swap + Impermanent Loss Calculator</h2>
<p class="sub">Model a Uniswap V2 pool — see price impact, swap output, and impermanent loss.</p>
<div class="row">
  <div class="panel">
    <label>Pool: Token A reserve</label>
    <input type="number" id="ra" value="1000" oninput="calc()">
    <label style="margin-top:8px">Pool: Token B reserve</label>
    <input type="number" id="rb" value="2000000" oninput="calc()">
    <label style="margin-top:8px">You swap: Token A amount</label>
    <input type="number" id="swap" value="10" oninput="calc()">
    <div class="result" id="swap_result"></div>
  </div>
  <div class="panel">
    <label>Impermanent Loss — Price Change %</label>
    <input type="range" id="pchange" min="-90" max="900" value="100" oninput="calcIL()">
    <p style="color:#94a3b8;font-size:12px;margin:4px 0;">Price change: <span id="pval" style="color:#f1f5f9;font-weight:700;">+100%</span></p>
    <div class="result" id="il_result"></div>
  </div>
</div>
<script>
function calc(){
  const ra=parseFloat(document.getElementById('ra').value)||1000;
  const rb=parseFloat(document.getElementById('rb').value)||2000000;
  const dx=parseFloat(document.getElementById('swap').value)||10;
  const k=ra*rb;
  const ra2=ra+dx;
  const rb2=k/ra2;
  const out=rb-rb2;
  const spotPrice=rb/ra;
  const execPrice=out/dx;
  const impact=Math.abs((execPrice-spotPrice)/spotPrice*100);
  document.getElementById('swap_result').innerHTML=
    'Swap <b style="color:#f1f5f9">'+dx+'</b> Token A → <span class="big good">'+out.toFixed(2)+'</span> Token B<br/>'+
    '<span class="stat">Spot price: '+spotPrice.toFixed(2)+'</span>'+
    '<span class="stat">Exec price: '+execPrice.toFixed(2)+'</span>'+
    '<span class="stat '+(impact>1?'warn':'good')+'">Price impact: '+impact.toFixed(2)+'%</span>';
}
function calcIL(){
  const pct=parseInt(document.getElementById('pchange').value);
  document.getElementById('pval').textContent=(pct>=0?'+':'')+pct+'%';
  const P=(100+pct)/100;
  const il=(2*Math.sqrt(P)/(1+P)-1)*100;
  const holdVal=100*(1+pct/200);
  document.getElementById('il_result').innerHTML=
    'Impermanent Loss: <span class="big bad">'+il.toFixed(2)+'%</span><br/>'+
    '<span class="stat">LP value: $'+(100*(2*Math.sqrt(P)/(1+P))).toFixed(2)+'</span>'+
    '<span class="stat">Just holding: $'+holdVal.toFixed(2)+'</span>'+
    (il<-0.5?'<br/><span class="warn" style="font-size:12px;margin-top:6px;display:block;">⚠ IL is permanent if you withdraw at this price ratio</span>':'');
}
calc(); calcIL();
</script>
</body>
</html>"""

TRADING_INTERACTIVE_HTML = """<!DOCTYPE html>
<html>
<head>
<style>
body{background:#0b1120;color:#e2e8f0;font-family:Inter,system-ui,sans-serif;padding:20px;margin:0;}
h2{color:#3b82f6;font-size:18px;margin:0 0 4px;}
.sub{color:#64748b;font-size:12px;margin-bottom:16px;}
.row{display:flex;gap:12px;margin-bottom:12px;}
.panel{background:#0f1f3d;border:1px solid #1e3a5f;border-radius:8px;padding:14px;flex:1;}
label{color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:1px;display:block;margin-bottom:6px;}
input{width:100%;padding:8px 10px;background:#020817;border:1px solid #334155;color:#f1f5f9;border-radius:6px;font-size:13px;box-sizing:border-box;}
.result{background:#020817;border:1px solid #334155;border-radius:6px;padding:10px;font-size:13px;margin-top:8px;}
.big{font-size:26px;font-weight:800;}
.stat{display:inline-block;background:#1e3a5f;border-radius:4px;padding:3px 10px;font-size:11px;font-weight:700;color:#60a5fa;margin:3px 2px;}
.good{color:#22c55e;} .bad{color:#ef4444;} .warn{color:#f59e0b;}
</style>
</head>
<body>
<h2>Position Size + Expectancy Calculator</h2>
<p class="sub">Build a risk-managed trade plan. See position size, R/R ratio, and trade expectancy.</p>
<div class="row">
  <div class="panel">
    <label>Account Size ($)</label>
    <input type="number" id="account" value="10000" oninput="calc()">
    <label style="margin-top:8px">Risk per trade (%)</label>
    <input type="number" id="risk_pct" value="2" step="0.1" oninput="calc()">
    <label style="margin-top:8px">Entry price ($)</label>
    <input type="number" id="entry" value="100" oninput="calc()">
    <label style="margin-top:8px">Stop-loss price ($)</label>
    <input type="number" id="stop" value="95" oninput="calc()">
    <label style="margin-top:8px">Target price ($)</label>
    <input type="number" id="target" value="115" oninput="calc()">
    <div class="result" id="pos_result"></div>
  </div>
  <div class="panel">
    <label>Expectancy Calculator — Win Rate (%)</label>
    <input type="range" id="wr" min="20" max="80" value="40" oninput="calcExp()">
    <p style="color:#94a3b8;font-size:12px;margin:4px 0;">Win rate: <span id="wrval" style="color:#f1f5f9;font-weight:700;">40%</span></p>
    <label style="margin-top:8px">Average win ($)</label>
    <input type="number" id="avg_win" value="300" oninput="calcExp()">
    <label style="margin-top:8px">Average loss ($)</label>
    <input type="number" id="avg_loss" value="100" oninput="calcExp()">
    <div class="result" id="exp_result"></div>
  </div>
</div>
<script>
function calc(){
  const acc=parseFloat(document.getElementById('account').value)||10000;
  const rp=parseFloat(document.getElementById('risk_pct').value)||2;
  const entry=parseFloat(document.getElementById('entry').value)||100;
  const stop=parseFloat(document.getElementById('stop').value)||95;
  const target=parseFloat(document.getElementById('target').value)||115;
  const riskDollar=acc*rp/100;
  const stopPct=Math.abs((entry-stop)/entry*100);
  const posSize=stopPct>0?riskDollar/(stopPct/100):0;
  const units=posSize/entry;
  const rr=(target-entry)/Math.abs(entry-stop);
  document.getElementById('pos_result').innerHTML=
    'Risk $: <span class="big warn">$'+riskDollar.toFixed(0)+'</span><br/>'+
    '<span class="stat">Position size: $'+posSize.toFixed(0)+'</span>'+
    '<span class="stat">Units: '+units.toFixed(2)+'</span>'+
    '<span class="stat '+(rr>=2?'good':'warn')+'">R/R ratio: '+rr.toFixed(2)+'R</span>'+
    (rr<1?'<br/><span class="bad" style="font-size:11px;">⚠ R/R below 1 — skip this trade</span>':'');
}
function calcExp(){
  const wr=parseInt(document.getElementById('wr').value);
  document.getElementById('wrval').textContent=wr+'%';
  const win=parseFloat(document.getElementById('avg_win').value)||300;
  const loss=parseFloat(document.getElementById('avg_loss').value)||100;
  const exp=(wr/100*win)-((100-wr)/100*loss);
  document.getElementById('exp_result').innerHTML=
    'Expectancy per trade: <span class="big '+(exp>=0?'good':'bad')+'">$'+exp.toFixed(2)+'</span><br/>'+
    '<span class="stat">Win '+wr+'% × $'+win+' = $'+(wr/100*win).toFixed(0)+'</span>'+
    '<span class="stat">Loss '+(100-wr)+'% × $'+loss+' = $'+((100-wr)/100*loss).toFixed(0)+'</span>'+
    (exp>0?'<br/><span class="good" style="font-size:11px;">✓ Positive expectancy — profitable system if consistent</span>':
           '<br/><span class="bad" style="font-size:11px;">✗ Negative expectancy — fix win rate or R/R ratio</span>');
}
calc(); calcExp();
</script>
</body>
</html>"""

SECURITY_INTERACTIVE_HTML = """<!DOCTYPE html>
<html>
<head>
<style>
body{background:#0b1120;color:#e2e8f0;font-family:Inter,system-ui,sans-serif;padding:20px;margin:0;}
h2{color:#ef4444;font-size:18px;margin:0 0 4px;}
.sub{color:#64748b;font-size:12px;margin-bottom:16px;}
.row{display:flex;gap:12px;margin-bottom:12px;}
.panel{background:#0f1f3d;border:1px solid #1e3a5f;border-radius:8px;padding:14px;flex:1;}
label{color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:1px;display:block;margin-bottom:6px;}
input,select{width:100%;padding:8px 10px;background:#020817;border:1px solid #334155;color:#f1f5f9;border-radius:6px;font-size:13px;box-sizing:border-box;}
.result{background:#020817;border:1px solid #334155;border-radius:6px;padding:10px;font-size:13px;margin-top:8px;}
.big{font-size:20px;font-weight:800;}
.stat{display:inline-block;background:#1e3a5f;border-radius:4px;padding:3px 10px;font-size:11px;font-weight:700;color:#60a5fa;margin:3px 2px;}
.good{color:#22c55e;} .bad{color:#ef4444;} .warn{color:#f59e0b;}
.quiz-q{background:#0a1628;border-left:3px solid #ef4444;padding:10px;margin:8px 0;border-radius:4px;}
.btn{background:#ef4444;color:#fff;border:none;padding:6px 16px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:700;margin-top:8px;}
</style>
</head>
<body>
<h2>Wallet Security Strength Checker</h2>
<p class="sub">Score your wallet setup against best practices. Spot weaknesses before attackers do.</p>
<div class="row">
  <div class="panel" style="flex:1.2">
    <label>Your custody setup</label>
    <select id="custody" onchange="score()">
      <option value="0">Exchange only (no self-custody)</option>
      <option value="1">Hot wallet (MetaMask / XUMM)</option>
      <option value="2" selected>Hardware wallet (Ledger / Trezor)</option>
      <option value="3">Hardware wallet + passphrase (25th word)</option>
    </select>
    <label style="margin-top:8px">Seed phrase storage</label>
    <select id="seed" onchange="score()">
      <option value="0">Screenshot / photo on phone</option>
      <option value="0">Digital file on computer</option>
      <option value="1">Paper in drawer</option>
      <option value="2" selected>Paper in safe</option>
      <option value="3">Metal backup (Cryptosteel)</option>
    </select>
    <label style="margin-top:8px">Two-factor auth</label>
    <select id="twofa" onchange="score()">
      <option value="0">SMS only</option>
      <option value="1" selected>Authenticator app (TOTP)</option>
      <option value="2">Hardware key (YubiKey)</option>
    </select>
    <label style="margin-top:8px">Holdings publicly disclosed?</label>
    <select id="opsec" onchange="score()">
      <option value="0">Yes — social media / flex</option>
      <option value="1" selected>Friends/family know roughly</option>
      <option value="2">Nobody knows</option>
    </select>
    <div class="result" id="score_result"></div>
  </div>
  <div class="panel">
    <label>Phishing Detector — Spot the scam</label>
    <div class="quiz-q" id="quiz_q"></div>
    <button class="btn" onclick="nextQ()">Next scenario</button>
    <div class="result" id="quiz_ans" style="margin-top:8px;display:none;"></div>
  </div>
</div>
<script>
const scenarios=[
  {q:"You get an email: 'Your Ledger device has been compromised. Enter your 24-word seed at ledger-secure-verify.com'",a:"🚨 SCAM — Ledger will NEVER ask for your seed phrase. Real hardware wallets never need you to type your seed online. Delete immediately.",bad:true},
  {q:"MetaMask popup: 'New site wants to connect to your wallet: opensea-nft-claim.io — Click Approve'",a:"⚠ SUSPICIOUS — Always verify the exact domain. Fake sites mimic real ones. If you didn't initiate this, close the popup. Check opensea.io directly.",bad:true},
  {q:"A DM: 'Hi! I'm from Binance support. I see your account has suspicious activity. Can you verify your account number and 2FA code?'",a:"🚨 SCAM — Exchanges never DM first. They NEVER ask for 2FA codes. This is social engineering. Report and block.",bad:true},
  {q:"You're sending XRP and the destination field shows a different address than you pasted",a:"🚨 CLIPBOARD HIJACKER — Malware replaced your copy-pasted address. Always verify the last 6 characters of addresses before confirming. Use whitelist features.",bad:true},
  {q:"Airdrop claim: 'You have 5,000 FREE tokens! Connect wallet to claim — just approve the token access transaction'",a:"🚨 DRAIN SCAM — Approving token access gives the contract permission to transfer ALL your tokens. Never approve unlimited token allowances from unknown sites.",bad:true},
];
let qi=0;
function nextQ(){
  document.getElementById('quiz_ans').style.display='none';
  const s=scenarios[qi%scenarios.length];
  document.getElementById('quiz_q').innerHTML='<p style="font-size:12px;color:#f1f5f9;line-height:1.5;">'+s.q+'</p>';
  document.getElementById('quiz_ans').innerHTML='<p style="font-size:12px;line-height:1.5;color:'+(s.bad?'#ef4444':'#22c55e')+'">'+s.a+'</p>';
  setTimeout(()=>document.getElementById('quiz_ans').style.display='block',400);
  qi++;
}
function score(){
  const c=parseInt(document.getElementById('custody').value);
  const s=parseInt(document.getElementById('seed').value);
  const t=parseInt(document.getElementById('twofa').value);
  const o=parseInt(document.getElementById('opsec').value);
  const total=c+s+t+o;
  const max=3+3+2+2;
  const pct=Math.round(total/max*100);
  const grade=pct>=80?['A','good','Strong setup — keep it up']:pct>=60?['B','warn','Good but room to improve']:pct>=40?['C','warn','Several risks — improve seed storage and 2FA']:['D','bad','High risk — move funds off exchange ASAP'];
  document.getElementById('score_result').innerHTML=
    'Security score: <span class="big '+grade[1]+'">'+grade[0]+' ('+pct+'%)</span><br/>'+
    '<span class="stat">Custody: '+c+'/3</span><span class="stat">Seed: '+s+'/3</span><span class="stat">2FA: '+t+'/2</span><span class="stat">OpSec: '+o+'/2</span><br/>'+
    '<span style="font-size:11px;color:#94a3b8;margin-top:4px;display:block;">'+grade[2]+'</span>';
}
score(); nextQ();
</script>
</body>
</html>"""

ECOSYSTEM_INTERACTIVE_HTML = """<!DOCTYPE html>
<html>
<head>
<style>
body{background:#0b1120;color:#e2e8f0;font-family:Inter,system-ui,sans-serif;padding:20px;margin:0;}
h2{color:#f59e0b;font-size:18px;margin:0 0 4px;}
.sub{color:#64748b;font-size:12px;margin-bottom:16px;}
.row{display:flex;gap:12px;margin-bottom:12px;}
.panel{background:#0f1f3d;border:1px solid #1e3a5f;border-radius:8px;padding:14px;flex:1;}
label{color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:1px;display:block;margin-bottom:6px;}
input,select{width:100%;padding:8px 10px;background:#020817;border:1px solid #334155;color:#f1f5f9;border-radius:6px;font-size:13px;box-sizing:border-box;}
.result{background:#020817;border:1px solid #334155;border-radius:6px;padding:10px;font-size:13px;margin-top:8px;}
.big{font-size:24px;font-weight:800;color:#f59e0b;}
.stat{display:inline-block;background:#1e3a5f;border-radius:4px;padding:3px 10px;font-size:11px;font-weight:700;color:#60a5fa;margin:3px 2px;}
.bar-wrap{background:#1e293b;border-radius:4px;height:14px;margin:4px 0;overflow:hidden;}
.bar-fill{height:100%;border-radius:4px;transition:width 0.4s;}
</style>
</head>
<body>
<h2>Tokenomics Analyzer</h2>
<p class="sub">Evaluate a token's supply design. Flag red flags and green flags in the tokenomics.</p>
<div class="row">
  <div class="panel">
    <label>Team + VC allocation (%)</label>
    <input type="range" id="team" min="0" max="80" value="20" oninput="analyze()">
    <div style="display:flex;justify-content:space-between;font-size:11px;color:#64748b;"><span>0%</span><span id="teamv" style="color:#f1f5f9;font-weight:700;">20%</span><span>80%</span></div>
    <label style="margin-top:10px">Vesting period (months)</label>
    <input type="range" id="vest" min="0" max="48" value="12" oninput="analyze()">
    <div style="display:flex;justify-content:space-between;font-size:11px;color:#64748b;"><span>0mo</span><span id="vestv" style="color:#f1f5f9;font-weight:700;">12mo</span><span>48mo</span></div>
    <label style="margin-top:10px">Revenue sharing with holders?</label>
    <select id="rev" onchange="analyze()">
      <option value="0">No — pure speculation</option>
      <option value="1">Governance only</option>
      <option value="2" selected>Partial fee distribution</option>
      <option value="3">Direct revenue share</option>
    </select>
    <label style="margin-top:10px">Supply model</label>
    <select id="supply" onchange="analyze()">
      <option value="0">Inflationary (no cap)</option>
      <option value="1">Inflationary with burn</option>
      <option value="2" selected>Fixed cap</option>
      <option value="3">Fixed cap + burn</option>
    </select>
    <div class="result" id="analysis"></div>
  </div>
  <div class="panel">
    <label>L2 Cost Comparison</label>
    <p style="font-size:12px;color:#94a3b8;margin:4px 0 12px;">Cost per transaction on different networks:</p>
    <div id="l2bars"></div>
    <div class="result" style="margin-top:12px;font-size:11px;color:#64748b;">
      Data: April 2026 averages. L2 fees vary with Ethereum gas prices. XRPL fees are fixed and burned.
    </div>
  </div>
</div>
<script>
const l2data=[
  {name:'Ethereum L1',cost:3.50,color:'#ef4444'},
  {name:'Arbitrum',cost:0.02,color:'#3b82f6'},
  {name:'Optimism',cost:0.015,color:'#a855f7'},
  {name:'Base',cost:0.01,color:'#22d3ee'},
  {name:'XRPL',cost:0.0002,color:'#22c55e'},
];
function drawL2(){
  const max=l2data[0].cost;
  document.getElementById('l2bars').innerHTML=l2data.map(d=>`
    <div style="margin-bottom:8px;">
      <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:2px;"><span>${d.name}</span><span style="color:${d.color};font-weight:700;">$${d.cost}</span></div>
      <div class="bar-wrap"><div class="bar-fill" style="width:${Math.max(d.cost/max*100,1)}%;background:${d.color};"></div></div>
    </div>`).join('');
}
function analyze(){
  const team=parseInt(document.getElementById('team').value);
  const vest=parseInt(document.getElementById('vest').value);
  const rev=parseInt(document.getElementById('rev').value);
  const supply=parseInt(document.getElementById('supply').value);
  document.getElementById('teamv').textContent=team+'%';
  document.getElementById('vestv').textContent=vest+'mo';
  let score=0, flags=[], green=[];
  if(team>50){flags.push('🚨 >50% to team — extreme dump risk');}
  else if(team>30){flags.push('⚠ >30% to team — watch unlock schedule');}
  else{score+=2;green.push('✓ Team allocation reasonable');}
  if(vest<6){flags.push('🚨 Short vesting — insiders can dump quickly');}
  else if(vest>=24){score+=2;green.push('✓ Strong vesting (2+ years)');}
  else{score+=1;green.push('✓ Moderate vesting');}
  score+=rev; if(rev>=2)green.push('✓ Token holders share in revenue');
  score+=supply; if(supply>=2)green.push('✓ Fixed or deflationary supply');
  const grade=score>=7?'Strong':score>=5?'Moderate':score>=3?'Weak':'Avoid';
  const color=score>=7?'#22c55e':score>=5?'#f59e0b':score>=3?'#f97316':'#ef4444';
  document.getElementById('analysis').innerHTML=
    'Score: <span style="font-size:20px;font-weight:800;color:'+color+';">'+grade+' ('+score+'/9)</span><br/>'+
    flags.map(f=>'<p style="font-size:11px;color:#ef4444;margin:2px 0;">'+f+'</p>').join('')+
    green.map(g=>'<p style="font-size:11px;color:#22c55e;margin:2px 0;">'+g+'</p>').join('');
}
drawL2(); analyze();
</script>
</body>
</html>"""

XRPL_INTERACTIVE_HTML = """<!DOCTYPE html>
<html>
<head>
<style>
body{background:#0b1120;color:#e2e8f0;font-family:Inter,system-ui,sans-serif;padding:20px;margin:0;}
h2{color:#22d3ee;font-size:18px;margin:0 0 4px;}
.sub{color:#64748b;font-size:12px;margin-bottom:16px;}
.row{display:flex;gap:12px;margin-bottom:12px;}
.panel{background:#0f1f3d;border:1px solid #1e3a5f;border-radius:8px;padding:14px;flex:1;}
label{color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:1px;display:block;margin-bottom:6px;}
input,select{width:100%;padding:8px 10px;background:#020817;border:1px solid #334155;color:#f1f5f9;border-radius:6px;font-size:13px;box-sizing:border-box;}
.result{background:#020817;border:1px solid #334155;border-radius:6px;padding:10px;font-size:13px;margin-top:8px;}
.big{font-size:22px;font-weight:800;color:#22d3ee;}
.stat{display:inline-block;background:#1e3a5f;border-radius:4px;padding:3px 10px;font-size:11px;font-weight:700;color:#60a5fa;margin:3px 2px;}
.good{color:#22c55e;} .bad{color:#ef4444;}
table{width:100%;border-collapse:collapse;font-size:11px;}
td,th{padding:5px 7px;border-bottom:1px solid #1e293b;text-align:left;}
th{color:#64748b;font-weight:600;}
</style>
</head>
<body>
<h2>XRPL Fee & Reserve Calculator</h2>
<p class="sub">Calculate transaction costs and account reserves for OnlyCrypto member payments.</p>
<div class="row">
  <div class="panel">
    <label>Payment amount (XRP)</label>
    <input type="number" id="amount" value="99" step="0.1" oninput="calc()">
    <label style="margin-top:8px">Number of transactions per month</label>
    <input type="number" id="txcount" value="100" oninput="calc()">
    <label style="margin-top:8px">XRP price (USD)</label>
    <input type="number" id="xrpprice" value="2.20" step="0.01" oninput="calc()">
    <div class="result" id="fee_result"></div>
  </div>
  <div class="panel">
    <label>Account Reserve Breakdown</label>
    <select id="trustlines" onchange="calcReserve()">
      <option value="0">0 trust lines</option>
      <option value="1">1 trust line</option>
      <option value="3" selected>3 trust lines</option>
      <option value="5">5 trust lines</option>
    </select>
    <div class="result" id="reserve_result" style="margin-top:8px;"></div>
    <label style="margin-top:12px">vs. Traditional Wire Transfer</label>
    <table>
      <tr><th>Method</th><th>Cost</th><th>Time</th></tr>
      <tr><td>XRPL</td><td class="good">$0.0002</td><td class="good">3–5 sec</td></tr>
      <tr><td>PayPal</td><td class="bad">2.9% + $0.30</td><td>Instant (but holds)</td></tr>
      <tr><td>SWIFT Wire</td><td class="bad">$15–$45</td><td class="bad">2–5 days</td></tr>
      <tr><td>Stripe</td><td class="bad">2.9% + $0.30</td><td>2 day settlement</td></tr>
    </table>
  </div>
</div>
<script>
const XRP_FEE=0.000012;
function calc(){
  const amt=parseFloat(document.getElementById('amount').value)||99;
  const n=parseInt(document.getElementById('txcount').value)||100;
  const price=parseFloat(document.getElementById('xrpprice').value)||2.20;
  const totalFeeXRP=XRP_FEE*n;
  const totalFeeUSD=totalFeeXRP*price;
  const amtUSD=amt*price;
  const altFee=amtUSD*0.029+0.30;
  const savings=(altFee-XRP_FEE*price)*n;
  document.getElementById('fee_result').innerHTML=
    'Per tx fee: <span class="big">$'+(XRP_FEE*price).toFixed(6)+'</span><br/>'+
    '<span class="stat">'+n+' tx/month: $'+totalFeeUSD.toFixed(4)+'</span>'+
    '<span class="stat good">vs PayPal: save $'+savings.toFixed(2)+'/mo</span><br/>'+
    '<span class="stat">Payment value: $'+amtUSD.toFixed(2)+'</span>'+
    '<span class="stat">Fee = '+(XRP_FEE/amt*100).toFixed(6)+'% of payment</span>';
}
function calcReserve(){
  const tl=parseInt(document.getElementById('trustlines').value)||0;
  const baseReserve=1;
  const ownerReserve=0.2;
  const total=baseReserve+tl*ownerReserve;
  document.getElementById('reserve_result').innerHTML=
    'Required reserve: <span class="big">'+total.toFixed(1)+' XRP</span><br/>'+
    '<span class="stat">Base: 1 XRP</span>'+
    '<span class="stat">Trust lines: '+tl+' × 0.2 XRP</span><br/>'+
    '<span style="font-size:11px;color:#64748b;">Reserve is locked but not destroyed — returned if objects deleted.</span>';
}
calc(); calcReserve();
</script>
</body>
</html>"""

INTERACTIVE_HTML_MAP = {
    "oc-blockchain-basics": BLOCKCHAIN_INTERACTIVE_HTML,
    "oc-cryptocurrency-guide": CRYPTO_INTERACTIVE_HTML,
    "oc-defi-guide": DEFI_INTERACTIVE_HTML,
    "oc-trading-guide": TRADING_INTERACTIVE_HTML,
    "oc-security-wallets": SECURITY_INTERACTIVE_HTML,
    "oc-ecosystem": ECOSYSTEM_INTERACTIVE_HTML,
    "oc-xrpl-deepdive": XRPL_INTERACTIVE_HTML,
}

# ─── Slide redesigns per classroom ───────────────────────────────────────────

def make_blockchain_slides():
    slides = {}

    # S1 — What Is a Blockchain (hero + two panel)
    sid = "bb-s1"
    slides[sid] = build_slide(sid, "What Is a Blockchain?", "A cryptographically linked, append-only distributed ledger",
        two_panel(sid,
            "The Core Structure",
            "Each block contains:<br/>• Previous block's hash (linking the chain)<br/>• Merkle root of all transactions<br/>• Timestamp + nonce<br/><br/>Changing block N invalidates every block after it — an attacker must redo all downstream proof-of-work.",
            "Why It Matters",
            "Bitcoin: ~17,000 nodes worldwide<br/>No CEO, no server to shut down<br/><br/>Throughput reality:<br/>• Bitcoin: 7 tx/s<br/>• Ethereum L1: ~15 tx/s<br/>• Visa: ~24,000 tx/s<br/><br/>This gap is why Layer 2 networks exist.",
            "#3b82f6", "#8b5cf6"
        ),
        "#3b82f6",
        pills=[(724, "17K+", "Nodes", "#60a5fa"), (858, "600 GB", "Chain size", "#60a5fa")]
    )

    # S2 — Hash Functions (formula spotlight)
    sid = "bb-s2"
    els = formula_spotlight(sid, "SHA-256(input) → 256-bit digest", "#f59e0b",
        "Pre-image resistant · Collision resistant · Avalanche effect<br/><br/>Change one character → ~50% of output bits flip<br/>This is why any tampering is immediately detectable",
        "Quantum note: Grover's algorithm halves the effective security — 256-bit SHA-256 gives 128-bit quantum security, still considered safe."
    )
    slides[sid] = build_slide(sid, "Cryptographic Hash Functions", "The one-way mathematical trap that makes blockchain tamper-proof", els, "#f59e0b")

    # S3 — Merkle Trees (steps flow)
    sid = "bb-s3"
    els = steps_flow(sid, [
        ("Transactions", "1,000s of transactions in a block — too large to transmit fully"),
        ("Pair & Hash", "Hash pairs repeatedly up a binary tree until one root hash remains"),
        ("Merkle Root", "Only 32 bytes stored in the block header — represents all transactions"),
        ("Proof Path", "Prove any tx is included with just log₂(N) hashes — no full block needed"),
    ], "#22d3ee")
    slides[sid] = build_slide(sid, "Merkle Trees — Efficient Verification", "Prove a transaction exists with just a few hashes", els, "#22d3ee",
        pills=[(830, "log₂N", "Proof size", "#22d3ee")]
    )

    # S4 — PoW vs PoS (comparison)
    sid = "bb-s4"
    els = comparison_two(sid,
        "⛏ Proof of Work",
        ["Energy = security cost (unforgeable)", "Miners compete on hash rate", "Difficulty adjusts every 2016 blocks", "Attack cost = 51% of global hashrate", "700 exahashes/sec on Bitcoin", "Proven 15-year security record"],
        "🪙 Proof of Stake",
        ["Collateral = security cost", "Validators chosen by stake weight", "Slashing destroys dishonest stake", "Attack cost = 1/3 of all staked ETH", "~$24B at stake on Ethereum", "90%+ energy reduction vs PoW"],
        "#f59e0b", "#22d3ee"
    )
    slides[sid] = build_slide(sid, "Consensus: Proof-of-Work vs Proof-of-Stake", "Two fundamentally different answers to the same question", els, "#3b82f6")

    # S5 — Byzantine Fault Tolerance (formula + cards)
    sid = "bb-s5"
    els = formula_spotlight(sid, "Need: 3f + 1 honest nodes to tolerate f traitors", "#ef4444",
        "With 1 traitor you need 4 total — with 100 traitors you need 301 total<br/><br/>Bitcoin solves this probabilistically with PoW<br/>XRPL solves it with 80% trusted-validator threshold",
        "Named after the 1982 Lamport, Shostak & Pease paper. Every blockchain consensus is solving a variant of this problem."
    )
    slides[sid] = build_slide(sid, "Byzantine Fault Tolerance", "How blockchains achieve agreement despite dishonest participants", els, "#ef4444",
        pills=[(830, "80%", "XRPL threshold", "#ef4444")]
    )

    # S6 — Trilemma (three cards, but with a real layout)
    sid = "bb-s6"
    els = []
    items = [
        (8, "#3b82f6", "🔒 Security", "Resistant to 51% attacks, double-spend, Sybil attacks. Bitcoin and Ethereum both prioritize this — compromise here risks everything."),
        (336, "#22d3ee", "⚡ Scalability", "High transactions per second with low fees. Achieved via sharding, rollups, or larger blocks. Ethereum targets 100K+ tx/s via L2 rollups."),
        (664, "#a855f7", "🌐 Decentralization", "No single control point. More nodes = more resilient. Bitcoin's 17K+ nodes make it uncensorable — but slower."),
    ]
    for left, color, heading, body in items:
        els += card(sid, len(els)//3, left, 320, 438, color, heading, body)
    slides[sid] = build_slide(sid, "The Blockchain Trilemma", "Every blockchain picks two — no one has solved all three yet", els, "#8b5cf6")

    # S7 — Smart Contracts (two panel)
    sid = "bb-s7"
    els = two_panel(sid,
        "What Is a Smart Contract?",
        "Code deployed to Ethereum that runs exactly as written — forever. No CEO can modify it. No server can shut it down.<br/><br/>Once deployed, the contract is immutable. This is both the power and the danger.<br/><br/>The DAO hack (2016): $60M stolen from immutable code.",
        "The Gas System",
        "Every computation costs gas — prevents infinite loops and DoS.<br/><br/>EIP-1559 (Aug 2021):<br/>• Base fee burned permanently<br/>• 3.5M+ ETH destroyed since launch<br/>• ETH becomes deflationary under high demand<br/><br/>Gas price = Base Fee + Priority Tip",
        "#f59e0b", "#3b82f6"
    )
    slides[sid] = build_slide(sid, "Smart Contracts & the EVM", "Self-executing code that no one can stop — or fix", els, "#f59e0b")

    return slides

def make_crypto_slides():
    slides = {}

    sid = "cg-s1"
    els = two_panel(sid,
        "Bitcoin's UTXO Model",
        "Bitcoin has no 'accounts'. It tracks Unspent Transaction Outputs (UTXOs).<br/><br/>To send 1 BTC you consume existing UTXOs and create new ones — like breaking a $20 bill into change.<br/><br/>Privacy benefit: each tx uses fresh outputs. Privacy risk: UTXO graph analysis can trace flows.",
        "XRP vs ETH: Key Numbers",
        "XRP: 3–5 sec finality · $0.0002 fee · 1,500 tx/s<br/>ETH: ~12 sec · $1–$20 fee · ~15 tx/s L1<br/><br/>Both burn fees permanently (XRP burns all, ETH burns base fee).<br/><br/>XRP supply: 100B fixed, ~57B in circulation. ETH: no hard cap.",
        "#f59e0b", "#22d3ee"
    )
    slides[sid] = build_slide(sid, "Bitcoin & XRP Fundamentals", "UTXO model, supply mechanics, and what makes XRP different", els, "#f59e0b",
        pills=[(830, "$0.0002", "XRP fee", "#f59e0b")]
    )

    sid = "cg-s2"
    els = formula_spotlight(sid, "secp256k1: y² = x³ + 7 (mod p)", "#a855f7",
        "Your private key is a random 256-bit number. Your public key is derived via elliptic curve multiplication.<br/>Reversing this (finding private from public) is the Elliptic Curve Discrete Log Problem — computationally infeasible.",
        "256-bit private key = 2²⁵⁶ possible values. More than atoms in the observable universe. Brute-force is physically impossible."
    )
    slides[sid] = build_slide(sid, "Public-Key Cryptography", "The math that makes your wallet address provably yours", els, "#a855f7")

    sid = "cg-s3"
    els = steps_flow(sid, [
        ("Difficulty Target", "Network sets a target: hash must start with N zeros"),
        ("Nonce Search", "Miners increment a nonce billions of times per second"),
        ("Block Found", "First miner to hit the target broadcasts the block"),
        ("Reward", "Block subsidy (currently 3.125 BTC) + all tx fees"),
        ("Adjustment", "Every 2016 blocks, difficulty adjusts to maintain 10-min average"),
    ], "#f59e0b")
    slides[sid] = build_slide(sid, "Bitcoin Mining Economics", "700 exahashes per second competing for 3.125 BTC", els, "#f59e0b",
        pills=[(830, "700 EH/s", "Global hashrate", "#f59e0b")]
    )

    sid = "cg-s4"
    els = comparison_two(sid,
        "📈 On-Chain Analysis",
        ["MVRV: Market cap ÷ Realized cap — above 3.5 = historically overheated", "SOPR: Profit ratio of moved coins — above 1 = profit-taking", "Exchange inflow spikes = sell pressure", "Long-term holder supply = conviction metric", "NVT: Network Value to Transactions ratio"],
        "📊 Technical Analysis",
        ["RSI > 70 = overbought, < 30 = oversold", "MACD crossover signals momentum shift", "Bollinger Band squeeze = volatility incoming", "Support/resistance = prior price memory", "Volume confirmation = move has conviction"],
        "#22d3ee", "#3b82f6"
    )
    slides[sid] = build_slide(sid, "Reading the Market", "On-chain metrics vs technical analysis — what each reveals", els, "#22d3ee")

    sid = "cg-s5"
    els = []
    halvings = [
        (8, "#f59e0b", "2009 Genesis", "50 BTC/block · ~$0/BTC · miners = early adopters"),
        (252, "#f59e0b", "2012 — 1st Halving", "25 BTC/block · Price rose from $12 → $1,100 in 12 months"),
        (496, "#3b82f6", "2016 — 2nd Halving", "12.5 BTC/block · Preceded 2017 bull run to $20K"),
        (740, "#22d3ee", "2020 — 3rd Halving", "6.25 BTC/block · 2021 peak: $69K"),
    ]
    for left, color, heading, body in halvings:
        els += card(sid, len(els)//3, left, 244, 430, color, heading, body)
    slides[sid] = build_slide(sid, "Bitcoin Halving Schedule", "Every ~4 years, supply issuance cuts in half", els, "#f59e0b",
        pills=[(830, "3.125", "BTC/block now", "#f59e0b")]
    )

    sid = "cg-s6"
    els = two_panel(sid,
        "Altcoin Landscape",
        "Smart contract platforms: ETH, SOL, AVAX<br/>Layer 2s: Arbitrum, Optimism, Base<br/>Privacy: Monero (ring sigs), Zcash (zk-SNARKs)<br/>Payments: XRP, Stellar, Litecoin<br/><br/>Evaluation checklist:<br/>• Who controls the validator set?<br/>• Is the code audited?<br/>• What is the tokenomics / unlock schedule?",
        "Market Cycles",
        "Bitcoin dominance → altseason pattern:<br/>1. BTC pumps (risk-on, store of value)<br/>2. ETH follows (smart contract demand)<br/>3. Altcoins rotate up (speculation)<br/>4. Meme coins peak (euphoria top)<br/><br/>MVRV > 3.5 has historically marked cycle tops. Patience is the edge.",
        "#3b82f6", "#a855f7"
    )
    slides[sid] = build_slide(sid, "Altcoins & Market Cycles", "Understanding the rotation and knowing where we are", els, "#3b82f6")

    sid = "cg-s7"
    els = steps_flow(sid, [
        ("Custody", "Who holds your keys? Exchange = their keys. Self-custody = your keys. Not your keys, not your coins."),
        ("Exchange Safety", "Use regulated exchanges. Enable 2FA. Whitelist withdraw addresses. Don't keep trading stacks on exchange."),
        ("DCA Strategy", "Dollar-cost averaging removes timing risk. Invest fixed $ weekly regardless of price."),
        ("Tax Reality", "Every swap, sale, or spend is a taxable event in most jurisdictions. Track cost basis from day one."),
    ], "#22d3ee")
    slides[sid] = build_slide(sid, "Owning Crypto Responsibly", "Custody, security, strategy, and taxes", els, "#22d3ee")

    return slides

def make_defi_slides():
    slides = {}

    sid = "df-s1"
    els = formula_spotlight(sid, "x × y = k", "#22d3ee",
        "x = Token A reserve · y = Token B reserve · k = constant<br/><br/>Buy Token B → x increases, y decreases → Token B price rises<br/>The curve never touches zero — infinite slippage before reserves empty",
        "Uniswap V2 uses this formula. V3 concentrates liquidity in price ranges for 4,000× better capital efficiency."
    )
    slides[sid] = build_slide(sid, "How AMMs Work", "The math behind every decentralized swap", els, "#22d3ee",
        pills=[(830, "$1B+", "Daily DEX vol", "#22d3ee")]
    )

    sid = "df-s2"
    els = formula_spotlight(sid, "IL = 2√P / (1+P) − 1", "#ef4444",
        "P = price ratio change between the two tokens<br/><br/>2× price divergence = 5.7% IL · 5× divergence = 25.5% IL<br/>IL is only 'impermanent' if prices return to entry ratio — otherwise it becomes permanent loss",
        "IL only applies to AMM LPs. Order book LPs and single-sided vaults have different risk profiles."
    )
    slides[sid] = build_slide(sid, "Impermanent Loss", "Why providing liquidity is not free money", els, "#ef4444")

    sid = "df-s3"
    els = two_panel(sid,
        "Aave: Lending Protocol",
        "Supply collateral → borrow up to LTV limit<br/><br/>Health Factor = Collateral × Liq. Threshold ÷ Debt<br/><br/>Health Factor < 1.0 → liquidation<br/><br/>Liquidators repay your debt and receive your collateral at a 5–15% discount. They race to liquidate first.",
        "Liquidation Cascade",
        "ETH drops 30% in an hour:<br/>1. Thousands of health factors hit <1.0<br/>2. Liquidation bots sell collateral on DEXes<br/>3. Selling pushes ETH lower<br/>4. More positions become undercollateralized<br/>5. Cascade accelerates<br/><br/>May 2021: $600M liquidated in hours.",
        "#a855f7", "#ef4444"
    )
    slides[sid] = build_slide(sid, "Lending & Liquidations", "How collateralized borrowing works — and how it fails", els, "#a855f7")

    sid = "df-s4"
    els = steps_flow(sid, [
        ("Borrow", "Flash loan $1M USDC from Aave — no collateral required"),
        ("Arbitrage", "Buy underpriced token on DEX A, sell on DEX B where price is higher"),
        ("Repay", "Return $1M + 0.09% fee in same transaction"),
        ("Profit", "Keep the arbitrage spread minus gas fees — typical: $500–$50K"),
        ("Revert", "If repayment fails for any reason, entire tx reverts — zero risk to protocol"),
    ], "#f59e0b")
    slides[sid] = build_slide(sid, "Flash Loans & MEV", "Uncollateralized loans that exist for a single transaction", els, "#f59e0b",
        pills=[(830, "0 collateral", "required", "#f59e0b")]
    )

    sid = "df-s5"
    els = two_panel(sid,
        "Yield Strategies",
        "Simple: Supply to Aave → earn supply APY<br/>Medium: LP on Uniswap → earn trading fees + rewards<br/>Advanced: Leveraged yield farming → borrow to amplify yield<br/><br/>Risk ladder: as yield increases, so does smart contract risk, liquidation risk, and IL.",
        "Smart Contract Risk",
        "Every DeFi protocol is code — code has bugs:<br/>• Reentrancy: The DAO ($60M, 2016)<br/>• Oracle manipulation: Mango Markets ($114M, 2022)<br/>• Logic error: Beanstalk ($182M, 2022)<br/><br/>Audit ≠ safe. Multiple audits help. Bug bounties help more. Never risk more than you can lose.",
        "#22d3ee", "#ef4444"
    )
    slides[sid] = build_slide(sid, "Yield & Risk", "Every percentage point of yield has a corresponding risk", els, "#22d3ee")

    sid = "df-s6"
    els = []
    items = [
        (8, "#22d3ee", "DEX Aggregators", "1inch, Paraswap — split orders across multiple DEXes for best price. Saves 0.5–5% on large trades."),
        (336, "#a855f7", "Liquid Staking", "Stake ETH → receive stETH (liquid). Earn 3–4% APY while keeping liquidity for DeFi. Lido: $20B+ TVL."),
        (664, "#f59e0b", "Real Yield", "Protocols sharing actual revenue with token holders. GMX: trading fees → GLP stakers. Sustainable vs inflationary yield."),
    ]
    for left, color, heading, body in items:
        els += card(sid, len(els)//3, left, 320, 438, color, heading, body)
    slides[sid] = build_slide(sid, "DeFi Ecosystem", "Key primitives beyond basic swaps and lending", els, "#3b82f6")

    sid = "df-s7"
    els = two_panel(sid,
        "DeFi vs TradFi",
        "DeFi advantages:<br/>• 24/7 operation, no closing times<br/>• Non-custodial — you keep your keys<br/>• Permissionless — no KYC required<br/>• Composable — protocols stack like Lego<br/>• Transparent — all code is public",
        "DeFi risks:",
        "• Smart contract bugs (no insurance)<br/>• No chargebacks — mistakes are permanent<br/>• Regulatory uncertainty in most countries<br/>• Gas fees can eat small positions<br/>• UI/UX still early — easy to make costly errors<br/><br/>Never invest more than you understand.",
        "#3b82f6", "#ef4444"
    )
    slides[sid] = build_slide(sid, "DeFi: Opportunity & Risk", "The most powerful financial infrastructure — with no safety net", els, "#3b82f6")

    return slides

def make_trading_slides():
    slides = {}

    sid = "tg-s1"
    els = two_panel(sid,
        "Order Book Mechanics",
        "Bids: buyers waiting at price levels<br/>Asks: sellers waiting at price levels<br/>Spread: gap between best bid & ask<br/><br/>Market order: execute immediately at current price<br/>Limit order: wait until price reaches your level<br/><br/>Large walls in the order book = support/resistance.<br/>Watch for 'walls' being pulled right before a move.",
        "Reading Candlesticks",
        "Each candle = Open · High · Low · Close<br/><br/>Patterns that matter:<br/>• Doji: indecision — buyers/sellers balanced<br/>• Hammer: reversal signal at support<br/>• Engulfing: strong momentum shift<br/>• Long wick: price rejection at that level<br/><br/>Patterns need volume confirmation to be reliable.",
        "#3b82f6", "#22d3ee"
    )
    slides[sid] = build_slide(sid, "Market Structure", "How price is formed and how to read it", els, "#3b82f6")

    sid = "tg-s2"
    els = two_panel(sid,
        "RSI & MACD",
        "RSI = avg gain / avg loss over 14 periods<br/>• >70: overbought (potential reversal)<br/>• <30: oversold (potential bounce)<br/>• Divergence: price makes new high, RSI doesn't = bearish signal<br/><br/>MACD = 12-day EMA − 26-day EMA<br/>Signal line = 9-day EMA of MACD<br/>Crossover above signal line = bullish",
        "Bollinger Bands",
        "Middle: 20-day moving average<br/>Upper/Lower: ±2 standard deviations<br/><br/>Squeeze = low volatility → breakout incoming<br/>Touch of upper band = overbought<br/>Touch of lower band = oversold<br/><br/>Bands expand during trends, contract during consolidation. Width = volatility indicator.",
        "#a855f7", "#f59e0b"
    )
    slides[sid] = build_slide(sid, "Technical Indicators", "What RSI, MACD, and Bollinger Bands actually measure", els, "#a855f7")

    sid = "tg-s3"
    els = formula_spotlight(sid, "Position Size = Risk $ ÷ Stop %", "#22d3ee",
        "Risk $ = Account × Risk Per Trade (e.g. 2%)<br/>Stop % = Distance from entry to stop-loss<br/><br/>Example: $10K account, 2% risk, 5% stop<br/>→ Risk $ = $200 · Position = $200 ÷ 0.05 = $4,000",
        "Kelly Criterion: f = (bp − q) / b where b=odds, p=win rate, q=loss rate. Use half-Kelly in practice to account for estimation error."
    )
    slides[sid] = build_slide(sid, "Position Sizing", "The single most important skill in trading", els, "#22d3ee")

    sid = "tg-s4"
    els = formula_spotlight(sid, "Expectancy = (W% × Avg Win) − (L% × Avg Loss)", "#3b82f6",
        "A 40% win rate CAN be profitable with high reward/risk<br/>Example: 40% × $300 − 60% × $100 = +$60 per trade<br/><br/>Most traders blow up not from bad win rates — from letting losers run and cutting winners short.",
        "Sharpe Ratio = (Return − Risk-Free Rate) / Standard Deviation. A Sharpe > 1.0 is considered good. Most retail traders have negative Sharpe."
    )
    slides[sid] = build_slide(sid, "Trading Expectancy", "Profitable trading is about math, not prediction", els, "#3b82f6")

    sid = "tg-s5"
    els = two_panel(sid,
        "Perpetual Futures",
        "Perpetuals have no expiry — unlike monthly futures.<br/><br/>Funding rate keeps price anchored to spot:<br/>• Positive funding (>0): Longs pay shorts — market is net long<br/>• Negative funding (<0): Shorts pay longs — market is net short<br/><br/>High positive funding = crowd is long = contrarian short signal.",
        "Liquidation Mechanics",
        "10× leverage on $1,000 = $10,000 position<br/>A 10% adverse move = 100% loss (liquidation)<br/><br/>Liquidation price = Entry × (1 − 1/Leverage)<br/><br/>Exchange liquidation cascade: bots liquidate the largest positions first, pushing price further, liquidating more.<br/>$1B+ liquidated in single-day events.",
        "#f59e0b", "#ef4444"
    )
    slides[sid] = build_slide(sid, "Perpetual Futures & Leverage", "The most dangerous — and most used — crypto instrument", els, "#f59e0b")

    sid = "tg-s6"
    els = []
    items = [
        (8, "#3b82f6", "Copy Trading", "Follow proven traders automatically. Risk: traders change strategy, over-optimized past performance, slippage on large follower bases."),
        (336, "#ef4444", "Trading Psychology", "Fear → early exits. Greed → holding losers. Revenge trading → blowups. The edge is discipline, not prediction."),
        (664, "#22d3ee", "OnlyCrypto Traders", "Verified traders on platform. Track record is public. Followers share in profit. Copy-stop on drawdown threshold."),
    ]
    for left, color, heading, body in items:
        els += card(sid, len(els)//3, left, 320, 438, color, heading, body)
    slides[sid] = build_slide(sid, "Copy Trading & Psychology", "Systematic edges and the hardest part — your own mind", els, "#3b82f6")

    sid = "tg-s7"
    els = steps_flow(sid, [
        ("Journal Every Trade", "Entry reason, size, stop, target. Review weekly. Patterns reveal edge — and mistakes."),
        ("Max 2% Risk Per Trade", "Lose 10 trades in a row at 2% = still 82% of capital. At 10% risk = 35% left."),
        ("Plan Before Entry", "Know your stop and target before you enter. No plan = emotion decides."),
        ("Review Weekly", "Calculate expectancy, win rate, avg R. If negative expectancy after 50+ trades — change strategy."),
    ], "#a855f7")
    slides[sid] = build_slide(sid, "Building a Trading System", "Rules that remove emotion from the equation", els, "#a855f7")

    return slides

def make_security_slides():
    slides = {}

    sid = "sw-s1"
    els = steps_flow(sid, [
        ("Entropy Source", "128–256 bits of randomness from a secure source"),
        ("Word Mapping", "2,048-word BIP39 wordlist maps bits to words"),
        ("12–24 Words", "Your seed phrase — the master key to all accounts"),
        ("PBKDF2 Hash", "Seed phrase + optional passphrase → 512-bit master seed"),
        ("HD Tree", "BIP32 derives unlimited child keys from master seed"),
    ], "#3b82f6")
    slides[sid] = build_slide(sid, "BIP39 — Seed Phrase Standard", "How 12 words become the key to your entire wallet", els, "#3b82f6")

    sid = "sw-s2"
    els = formula_spotlight(sid, "m / 44' / 144' / 0' / 0 / 0", "#22d3ee",
        "m = master seed · 44' = BIP44 purpose · 144' = XRPL coin type<br/>0' = account 0 · 0 = external chain · 0 = address index<br/><br/>Bitcoin uses coin type 0 · Ethereum uses 60 · XRPL uses 144",
        "Hardened derivation (marked with ') means child keys cannot be derived from the parent public key — extra security layer."
    )
    slides[sid] = build_slide(sid, "BIP44 Derivation Paths", "The address structure that organizes your entire wallet", els, "#22d3ee")

    sid = "sw-s3"
    els = comparison_two(sid,
        "🔥 Hot Wallets",
        ["Connected to internet", "Private key in software/browser", "Convenient for daily use", "MetaMask, XUMM, Coinbase Wallet", "Vulnerable to malware, phishing", "Only keep small amounts"],
        "🔒 Cold Wallets",
        ["Never connected to internet", "Private key on dedicated hardware", "Sign transactions offline", "Ledger, Trezor, Coldcard", "Physical theft = only vector", "Store majority of holdings"],
        "#ef4444", "#22d3ee"
    )
    slides[sid] = build_slide(sid, "Hot vs Cold Storage", "Not your keys, not your coins — and how to hold your keys", els, "#22d3ee")

    sid = "sw-s4"
    els = two_panel(sid,
        "The $5 Wrench Attack",
        "No amount of cryptography protects you from physical coercion.<br/><br/>Solutions:<br/>• Passphrase (25th word): Create a hidden wallet. Give up the decoy wallet with small funds.<br/>• Multisig: No single person can authorize. Co-signers in different locations.<br/>• Never disclose holdings publicly.",
        "Common Attack Vectors",
        "• Phishing: Fake Ledger/MetaMask emails asking for seed phrase (NEVER share)<br/>• Clipboard hijacking: Malware swaps your copy-pasted address<br/>• SIM swap: Attacker controls your phone number, defeats SMS 2FA<br/>• Fake wallets: Downloaded from unofficial sources<br/><br/>Hardware key always beats SMS 2FA.",
        "#ef4444", "#f59e0b"
    )
    slides[sid] = build_slide(sid, "Attack Vectors & Defenses", "The threats are real — here is how to counter them", els, "#ef4444")

    sid = "sw-s5"
    els = steps_flow(sid, [
        ("M-of-N Setup", "Require M signatures from N total keys. 2-of-3 means any 2 of 3 signers can authorize."),
        ("Geographic Split", "Store keys in different cities/countries. No single point of failure."),
        ("Hardware Keys", "Each signer uses a hardware wallet. No single device controls funds."),
        ("Timelock", "Optional: add a time delay to large transactions for review window."),
    ], "#a855f7")
    slides[sid] = build_slide(sid, "Multisig Security", "For serious holdings: no single point of failure", els, "#a855f7",
        pills=[(830, "2-of-3", "Most common", "#a855f7")]
    )

    sid = "sw-s6"
    els = []
    items = [
        (8, "#3b82f6", "XRPL Account Flags", "RequireDestTag: prevents lost funds from missing tags. DisableMasterKey: force multisig, deactivate master key. Blackhole: set signer weight to 0 — irrecoverable."),
        (336, "#22d3ee", "Destination Tags", "Required for exchange deposits. Tag identifies which user on a shared wallet address. Missing tag = lost funds — many exchanges cannot recover."),
        (664, "#a855f7", "Account Reserve", "1 XRP minimum reserve to activate account. Each trust line and offer costs additional reserve. Reserve is returned if objects are deleted."),
    ]
    for left, color, heading, body in items:
        els += card(sid, len(els)//3, left, 320, 438, color, heading, body)
    slides[sid] = build_slide(sid, "XRPL Account Security", "Platform-specific features every OnlyCrypto member should know", els, "#3b82f6")

    sid = "sw-s7"
    els = steps_flow(sid, [
        ("Generate Offline", "Use a hardware wallet or air-gapped device to generate keys. Never on an internet-connected machine."),
        ("Write on Metal", "Paper burns and floods. Cryptosteel or similar metal backups survive house fires."),
        ("Test Restore", "Before storing any funds, test restoring from your seed phrase. Verify it works."),
        ("Secure Location", "Separate your seed from your hardware wallet. Bank vault, trusted family member, or geographic split."),
    ], "#22d3ee")
    slides[sid] = build_slide(sid, "Seed Phrase Best Practices", "The checklist every crypto holder must follow", els, "#22d3ee")

    return slides

def make_ecosystem_slides():
    slides = {}

    sid = "ce-s1"
    els = two_panel(sid,
        "Tokenomics Fundamentals",
        "Supply: Fixed cap (BTC: 21M) vs inflationary (ETH pre-merge) vs deflationary (XRP burn)<br/><br/>Distribution: Pre-mine, fair launch, VC allocation, team vesting<br/><br/>Stock-to-Flow (S2F): Scarcity model — higher ratio = more scarce. Bitcoin S2F after halving: ~100 (like gold).<br/><br/>Red flag: >50% token supply controlled by team/VCs with short unlock schedule.",
        "The Velocity Problem",
        "High usage ≠ high token value if velocity is high.<br/><br/>Example: A token used to pay for AI queries — users buy, use, immediately sell. Price stays low despite massive usage.<br/><br/>Solutions: Staking (lock supply), governance rights, fee burning, required holdings.<br/><br/>Best tokenomics: token holders benefit directly from protocol revenue.",
        "#f59e0b", "#ef4444"
    )
    slides[sid] = build_slide(sid, "Tokenomics", "Why most tokens fail and what makes the good ones work", els, "#f59e0b")

    sid = "ce-s2"
    els = formula_spotlight(sid, "L2 cost = blob_data_size × blob_base_fee", "#22d3ee",
        "EIP-4844 (Dencun, March 2024) introduced blob transactions — cheap, temporary calldata for L2s<br/><br/>Before EIP-4844: L2 tx cost $0.30–$3.00<br/>After EIP-4844: L2 tx cost $0.001–$0.01<br/><br/>Blob data is pruned after ~18 days — only the commitment (hash) stays permanent",
        "Target: Ethereum aims for 100,000+ tx/s via L2 rollups. Blobs are a major step toward that goal."
    )
    slides[sid] = build_slide(sid, "Layer 2 Rollups", "How Ethereum scales to mass adoption without sacrificing security", els, "#22d3ee",
        pills=[(830, "100×", "Fee reduction", "#22d3ee")]
    )

    sid = "ce-s3"
    els = comparison_two(sid,
        "Optimistic Rollups",
        ["Assume transactions are valid by default", "7-day challenge period for fraud proofs", "Cheaper to run, simpler tech", "Arbitrum, Optimism, Base", "Withdrawal delay = 7 days to L1", "Good for general smart contracts"],
        "ZK Rollups",
        ["Mathematical proof of every state transition", "Instant finality — no challenge period", "More expensive to generate proofs", "zkSync, StarkNet, Polygon zkEVM", "Withdrawals are fast (minutes)", "Better for privacy, payments"],
        "#3b82f6", "#a855f7"
    )
    slides[sid] = build_slide(sid, "Rollup Types", "Optimistic vs ZK — the two dominant scaling approaches", els, "#3b82f6")

    sid = "ce-s4"
    els = two_panel(sid,
        "On-Chain Governance Risks",
        "Beanstalk (2022): Attacker flash-loaned majority governance tokens, passed a malicious proposal, drained $182M — all in one transaction.<br/><br/>Fix: Time-locks on governance execution (give community time to veto). No governance execution in same block as proposal.<br/><br/>Voter apathy: Most token holders never vote → small groups control protocol decisions.",
        "Stablecoin Types & Risks",
        "Fiat-backed (USDC, USDT): Centralized, requires trust in issuer. Regulated.<br/>Crypto-backed (DAI): Over-collateralized, can de-peg in cascades.<br/>Algorithmic (UST): Collapsed $40B in 2022 — no collateral, pure game theory.<br/><br/>Rule: Algo stablecoins are not stable. They are time-bombs waiting for a bank run.",
        "#ef4444", "#f59e0b"
    )
    slides[sid] = build_slide(sid, "Governance & Stablecoins", "The two most underestimated risks in crypto ecosystems", els, "#ef4444")

    sid = "ce-s5"
    els = []
    items = [
        (8, "#3b82f6", "RWA Tokenization", "$7B+ market in 2024. BlackRock BUIDL fund: $500M+ tokenized treasuries. Fractional ownership of real estate, bonds, art. Settlement in seconds vs T+2."),
        (336, "#22d3ee", "Institutional Entry", "BlackRock Bitcoin ETF: $10B+ AUM in first year. Fidelity, VanEck, Franklin Templeton all launch products. CME futures volume > spot in 2024."),
        (664, "#a855f7", "CBDCs", "China e-CNY: $250B+ transactions. EU digital euro: 2026 target. Privacy concern: programmable money can be censored, expired, geo-restricted."),
    ]
    for left, color, heading, body in items:
        els += card(sid, len(els)//3, left, 320, 438, color, heading, body)
    slides[sid] = build_slide(sid, "Real-World Adoption", "Where blockchain is actually being used at scale today", els, "#3b82f6",
        pills=[(830, "$7B+", "RWA market", "#3b82f6")]
    )

    sid = "ce-s6"
    els = steps_flow(sid, [
        ("NFTs & Digital Ownership", "ERC-721 tokens: unique IDs on-chain. Ownership is public, transferable, programmable. Beyond JPEGs: event tickets, game items, music rights."),
        ("Web3 Identity", "ENS (Ethereum Name Service): human-readable wallet addresses. Soulbound tokens: non-transferable credentials, degrees, reputation."),
        ("DePIN", "Decentralized Physical Infrastructure: Helium (wireless), Render (GPU compute), Hivemapper (maps). Token incentives build physical networks."),
        ("AI + Crypto", "Compute markets (Bittensor), verifiable AI output (zk-proofs of model runs), agent economies paying each other in crypto."),
    ], "#a855f7")
    slides[sid] = build_slide(sid, "Emerging Crypto Categories", "NFTs, Web3 identity, DePIN, and AI convergence", els, "#a855f7")

    sid = "ce-s7"
    els = two_panel(sid,
        "Regulatory Landscape",
        "USA: SEC vs CFTC jurisdiction battle. ETF approval = milestone. Most tokens may be securities under Howey test.<br/><br/>EU: MiCA (Markets in Crypto-Assets) — comprehensive framework live 2024. Stablecoin issuers need banking license.<br/><br/>Pattern: Regulation follows adoption. Clear rules → institutional entry → mainstream adoption.",
        "Where OnlyCrypto Fits",
        "XRPL payments: settled in 3–5 seconds, $0.0002 fee — financial infrastructure at crypto speed.<br/><br/>Copy trading: access to professional strategies without managing keys or active trading.<br/><br/>Educator pool: sustainable model — members learn and earn simultaneously.<br/><br/>The platform runs on real infrastructure — not promises.",
        "#22d3ee", "#3b82f6"
    )
    slides[sid] = build_slide(sid, "Regulation & The Big Picture", "Where crypto is heading and where OnlyCrypto fits in", els, "#22d3ee")

    return slides

def make_xrpl_slides():
    slides = {}

    sid = "xd-s1"
    els = steps_flow(sid, [
        ("Propose", "Any validator proposes a candidate set of transactions"),
        ("Threshold", "80% of trusted validators must agree on the same set"),
        ("Apply", "Agreed transactions applied to ledger state simultaneously"),
        ("Close", "Ledger version closed with new state hash and sequence number"),
        ("Finality", "3–5 seconds: irreversible. No forks. No reorganizations."),
    ], "#22d3ee")
    slides[sid] = build_slide(sid, "RPCA Consensus", "How XRPL achieves 3–5 second finality with no miners", els, "#22d3ee",
        pills=[(830, "80%", "Required threshold", "#22d3ee")]
    )

    sid = "xd-s2"
    els = two_panel(sid,
        "Trust Lines",
        "You cannot receive an IOUtoken on XRPL unless you explicitly create a trust line to the issuer.<br/><br/>Trust line = bilateral agreement: max credit, freeze rights, rippling settings.<br/><br/>This prevents spam tokens appearing in wallets without consent — unlike ERC-20 tokens that can be airdropped to anyone.",
        "Rippling",
        "Rippling = allow your IOUs to be passed through to other accounts that trust the same issuer.<br/><br/>Example: Alice trusts USD/Bank. Bob trusts USD/Bank. Alice can send Bob USD without Bank moving any actual money — the ledger adjusts IOU balances.<br/><br/>Disable rippling on personal accounts — only issuers need it.",
        "#3b82f6", "#a855f7"
    )
    slides[sid] = build_slide(sid, "Trust Lines & Rippling", "XRPL's permission system for tokens and credit", els, "#3b82f6")

    sid = "xd-s3"
    els = two_panel(sid,
        "Native Order Book DEX",
        "XRPL has a fully functional order book built into the ledger protocol — no smart contract needed.<br/><br/>Any two assets with a common bridge currency can be traded.<br/><br/>Offers (orders) live on-ledger. Auto-bridging via XRP automatically routes through XRP when it improves the rate.",
        "AMM (Added 2024)",
        "XRPL AMM Proposal (XLS-30) went live 2024.<br/><br/>Constant-function AMM alongside the order book. LPs deposit both sides, earn trading fees.<br/><br/>Continuous Auction Mechanism (CAM): fee rises during high volatility to compensate LPs for IL — first AMM to implement this automatically.",
        "#22d3ee", "#f59e0b"
    )
    slides[sid] = build_slide(sid, "XRPL Native DEX + AMM", "Protocol-level trading — no smart contracts, no external risk", els, "#22d3ee")

    sid = "xd-s4"
    els = formula_spotlight(sid, "Path: USD → XRP → EUR (auto-bridged)", "#f59e0b",
        "XRPL pathfinding finds the best route across multiple currencies and order books automatically.<br/><br/>ODL (On-Demand Liquidity) uses XRP as a bridge:<br/>Sender deposits USD → XRP purchased → XRP sent to Mexico → XRP sold → recipient receives MXN<br/>Total time: 3–5 seconds. No pre-funded accounts needed.",
        "RippleNet ODL processed $15B+ in cross-border payments in 2023. Traditional SWIFT settlement: 2–5 business days."
    )
    slides[sid] = build_slide(sid, "Pathfinding & ODL", "How XRPL routes payments across currencies in seconds", els, "#f59e0b",
        pills=[(830, "$15B+", "ODL volume 2023", "#f59e0b")]
    )

    sid = "xd-s5"
    els = comparison_two(sid,
        "XRPL",
        ["1 XRP account reserve (was 20, voted down)", "0.0002 XRP per transaction (burned)", "3–5 second finality, no forks", "1,500 tx/s native (50K+ with AMM)", "No smart contracts = no contract bugs", "Leaderless consensus — no mining pools"],
        "Ethereum",
        ["No account reserve needed", "$1–$20+ gas fees (variable)", "~12 second blocks, reorg risk exists", "~15 tx/s L1 (100K+ via L2s)", "Smart contracts = programmable but risky", "33 validators control >50% of stake"],
        "#22d3ee", "#a855f7"
    )
    slides[sid] = build_slide(sid, "XRPL vs Ethereum", "Different design choices, different trade-offs", els, "#3b82f6")

    sid = "xd-s6"
    els = two_panel(sid,
        "XRPL Hooks (Coming)",
        "Hooks = lightweight logic attached to accounts — triggered on send/receive.<br/><br/>Unlike Ethereum's full EVM, Hooks are deliberately limited: no loops, no storage, deterministic execution.<br/><br/>Use cases: auto-convert received XRP to RLUSD, block incoming transactions from unknown senders, auto-route to savings.",
        "Federated Sidechains",
        "XRPL can bridge to EVM-compatible sidechains (XRPL EVM Sidechain).<br/><br/>Solidity contracts run on the sidechain, settle to XRPL mainnet.<br/><br/>Best of both worlds: Ethereum ecosystem tools (MetaMask, Hardhat) with XRPL's speed and cost for final settlement.",
        "#22d3ee", "#f59e0b"
    )
    slides[sid] = build_slide(sid, "XRPL's Roadmap", "Hooks, sidechains, and what's coming next", els, "#22d3ee")

    sid = "xd-s7"
    els = steps_flow(sid, [
        ("Member Pays", "Member sends XRP to OnlyCrypto hot wallet with destination tag identifying their account"),
        ("Watcher Detects", "XRPL watcher confirms tx on-ledger: amount, tag, finality in <5 seconds"),
        ("DB Updated", "Supabase updated: subscription activated, payout queue populated"),
        ("Payouts Sent", "XRPL sends referral commissions, rank bonuses, trader payouts — all in XRP, all on-chain"),
        ("Cost", "$0.0002 total in fees. 0 chargebacks. 0 bank delays. Fully auditable on-chain."),
    ], "#3b82f6")
    slides[sid] = build_slide(sid, "OnlyCrypto on XRPL", "How every member payment flows through the ledger", els, "#3b82f6",
        pills=[(830, "$0.0002", "Per payment", "#3b82f6")]
    )

    return slides

# ─── Main patch function ──────────────────────────────────────────────────────

SLIDE_BUILDERS = {
    "oc-blockchain-basics": make_blockchain_slides,
    "oc-cryptocurrency-guide": make_crypto_slides,
    "oc-defi-guide": make_defi_slides,
    "oc-trading-guide": make_trading_slides,
    "oc-security-wallets": make_security_slides,
    "oc-ecosystem": make_ecosystem_slides,
    "oc-xrpl-deepdive": make_xrpl_slides,
}

def patch_classroom(filename):
    path = os.path.join(CLASSROOMS_DIR, filename)
    classroom_id = filename.replace(".json", "")

    with open(path) as f:
        data = json.load(f)

    slides = SLIDE_BUILDERS[classroom_id]()
    quiz_questions = QUIZZES.get(classroom_id, [])
    patched_scenes = 0
    quiz_patched = False
    interactive_patched = False

    # Insert interactive scene before quiz if not present
    has_interactive = any(s["type"] == "interactive" for s in data["scenes"])
    if not has_interactive and classroom_id in INTERACTIVE_HTML_MAP:
        prefix = classroom_id.split("-")[1][:2]  # e.g. "cr", "de", "tr", "se", "ec", "xr"
        new_interactive = {
            "id": f"{prefix}-interactive",
            "type": "interactive",
            "title": "Interactive Simulation",
            "content": {"type": "interactive", "html": INTERACTIVE_HTML_MAP[classroom_id]},
            "actions": []
        }
        # Insert before last scene (quiz)
        data["scenes"].insert(-1, new_interactive)
        interactive_patched = True

    for scene in data["scenes"]:
        sid = scene["id"]

        # Patch slide scenes
        if scene["type"] == "slide" and sid in slides:
            scene["content"] = slides[sid]
            patched_scenes += 1

        # Patch quiz scenes
        elif scene["type"] == "quiz":
            scene["content"] = {"type": "quiz", "questions": quiz_questions}
            quiz_patched = True

        # Patch existing interactive scenes (blockchain-basics)
        elif scene["type"] == "interactive" and not scene["content"].get("html"):
            html = INTERACTIVE_HTML_MAP.get(classroom_id, "")
            scene["content"] = {"type": "interactive", "html": html}
            interactive_patched = True

    with open(path, "w") as f:
        json.dump(data, f, indent=2)

    print(f"✓ {classroom_id}: {patched_scenes} slides redesigned, quiz={'✓' if quiz_patched else '—'}, interactive={'✓' if interactive_patched else '—'}")

if __name__ == "__main__":
    for fn in [
        "oc-blockchain-basics.json",
        "oc-cryptocurrency-guide.json",
        "oc-defi-guide.json",
        "oc-trading-guide.json",
        "oc-security-wallets.json",
        "oc-ecosystem.json",
        "oc-xrpl-deepdive.json",
    ]:
        patch_classroom(fn)
    print("\nAll classrooms patched.")
