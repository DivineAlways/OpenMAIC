#!/usr/bin/env python3
"""
Expand existing classrooms with new scenes from curriculum spec.
New scenes are inserted BEFORE the final Knowledge Check scene.
Run: python3 scripts/expand-curriculum.py
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
    print(f'  Saved {name}.json ({len(data["scenes"])} scenes)')

def make_scene(sid, title, color, subtitle, body_html, cards):
    """Build a standard slide scene with title, subtitle, body text, and info cards."""
    elements = [
        {"id": f"{sid}-bar","type":"shape","left":0,"top":0,"width":1000,"height":6,"rotate":0,
         "path":"M 0 0 L 1 0 L 1 1 L 0 1 Z","viewBox":[1,1],"fill":color,"fixedRatio":False},
        {"id": f"{sid}-hbg","type":"shape","left":0,"top":6,"width":1000,"height":96,"rotate":0,
         "path":"M 0 0 L 1 0 L 1 1 L 0 1 Z","viewBox":[1,1],"fill":"#0f1729","fixedRatio":False},
        {"id": f"{sid}-title","type":"text","left":24,"top":16,"width":800,"height":52,"rotate":0,
         "content":f"<p style='font-size:28px;font-weight:800;color:#f1f5f9;'>{title}</p>",
         "defaultFontName":"Inter","defaultColor":"#f1f5f9"},
        {"id": f"{sid}-sub","type":"text","left":24,"top":66,"width":800,"height":30,"rotate":0,
         "content":f"<p style='font-size:13px;color:#64748b;font-weight:500;'>{subtitle}</p>",
         "defaultFontName":"Inter","defaultColor":"#64748b"},
        {"id": f"{sid}-body","type":"text","left":24,"top":120,"width":950,"height":260,"rotate":0,
         "content":body_html,
         "defaultFontName":"Inter","defaultColor":"#cbd5e1"},
    ]
    # Place cards below body
    card_x = 24
    card_w = min(210, 900 // max(len(cards),1) - 10)
    card_gap = card_w + 14
    for i, (card_title, card_text) in enumerate(cards):
        x = card_x + i * card_gap
        elements.append({"id":f"{sid}-box{i+1}","type":"shape","left":x,"top":400,"width":card_w,"height":100,
            "rotate":0,"path":"M 0 0 L 1 0 L 1 1 L 0 1 Z","viewBox":[1,1],"fill":f"{color}20","fixedRatio":False,
            "outline":{"style":"solid","width":1,"color":color}})
        elements.append({"id":f"{sid}-ct{i+1}","type":"text","left":x+8,"top":415,"width":card_w-16,"height":70,
            "rotate":0,"content":f"<p style='font-size:12px;font-weight:700;color:{color};text-align:center;'>{card_title}<br/><span style=\"font-weight:400;color:#94a3b8;\">{card_text}</span></p>",
            "defaultFontName":"Inter","defaultColor":color})

    # Build actions
    actions = [
        {"id":f"action_{sid}_0","type":"spotlight","elementId":f"{sid}-title"},
        {"id":f"action_{sid}_1","type":"speech","text": _strip(title)},
        {"id":f"action_{sid}_2","type":"spotlight","elementId":f"{sid}-sub"},
        {"id":f"action_{sid}_3","type":"speech","text":_strip(subtitle)},
        {"id":f"action_{sid}_4","type":"spotlight","elementId":f"{sid}-body"},
        {"id":f"action_{sid}_5","type":"speech","text":_strip(body_html)},
    ]
    for i, (card_title, card_text) in enumerate(cards):
        actions.append({"id":f"action_{sid}_{6+i*2}","type":"spotlight","elementId":f"{sid}-ct{i+1}"})
        actions.append({"id":f"action_{sid}_{7+i*2}","type":"speech","text":_strip(f"{card_title}. {card_text}")})

    return {
        "id": sid,
        "type": "slide",
        "title": _strip(title),
        "order": 0,
        "content": {
            "type": "slide",
            "canvas": {
                "id": f"{sid}-canvas",
                "viewportSize": 1000,
                "viewportRatio": 0.5625,
                "background": {"type":"solid","color":"#0b1120"},
                "theme": {
                    "backgroundColor":"#0b1120",
                    "themeColors":[color,"#3b82f6","#8b5cf6"],
                    "fontColor":"#f1f5f9",
                    "fontName":"Inter"
                },
                "elements": elements
            }
        },
        "actions": actions
    }

import re
def _strip(html):
    """Strip HTML tags for speech text."""
    text = re.sub(r'<[^>]+>', ' ', html)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def insert_before_kc(classroom, new_scenes):
    """Insert new scenes before the final Knowledge Check scene."""
    scenes = classroom['scenes']
    kc = scenes[-1]
    # Fix order fields
    for i, s in enumerate(scenes[:-1]):
        s['order'] = i
    start_order = len(scenes) - 1
    for i, s in enumerate(new_scenes):
        s['order'] = start_order + i
    kc['order'] = start_order + len(new_scenes)
    classroom['scenes'] = scenes[:-1] + new_scenes + [kc]
    return classroom


# ─────────────────────────────────────────────
# ELEMENTARY EXPANSIONS
# ─────────────────────────────────────────────

def expand_elem_blockchain():
    d = load('oc-elem-blockchain')
    color = '#10b981'
    new_scenes = [
        make_scene('eb-s5','📓 What is a Ledger?',color,
            'The original record-keeping system — and why crypto improved it',
            "<p style='font-size:17px;color:#cbd5e1;line-height:1.8;'>A <b style='color:#10b981;'>ledger</b> is just a record book. Banks have always used ledgers to track who has what money. The problem? <b style='color:#f1f5f9;'>You have to trust the bank</b> not to change the records.</p><br/><p style='font-size:17px;color:#cbd5e1;line-height:1.8;'>Blockchain replaces the bank's private ledger with a <b style='color:#10b981;'>public ledger</b> that thousands of computers all hold at once. No single person controls it — so no one can cheat.</p>",
            [('📒 Traditional Ledger','One bank controls it'),('🌐 Blockchain Ledger','Everyone holds a copy'),('🔒 Immutable','Once written, it stays'),('✅ Trustless','No middleman needed')]),
        make_scene('eb-s6','🖥️ Nodes & Validators',color,
            'The volunteers who keep the network running',
            "<p style='font-size:17px;color:#cbd5e1;line-height:1.8;'>A <b style='color:#10b981;'>node</b> is any computer that participates in the blockchain network. Right now, there are thousands of nodes around the world running Bitcoin and Ethereum software 24 hours a day.</p><br/><p style='font-size:17px;color:#cbd5e1;line-height:1.8;'><b style='color:#f1f5f9;'>Validators</b> are special nodes that check transactions and confirm they are valid before adding them to the chain. They are the referees of the network — and they earn crypto rewards for doing it right.</p>",
            [('🖥️ Full Node','Stores entire blockchain'),('⚡ Validator','Checks & confirms txs'),('💰 Reward','Earns crypto for work'),('🌍 Decentralized','No single point of failure')]),
        make_scene('eb-s7','🔗 Blocks & Chains Explained',color,
            'How individual records link together into an unbreakable chain',
            "<p style='font-size:17px;color:#cbd5e1;line-height:1.8;'>Each <b style='color:#10b981;'>block</b> contains a batch of transactions, a timestamp, and — crucially — a <b style='color:#f1f5f9;'>fingerprint of the previous block</b>. This fingerprint is called a hash.</p><br/><p style='font-size:17px;color:#cbd5e1;line-height:1.8;'>Because every block references the one before it, changing any old block would break <b style='color:#10b981;'>every block that came after it</b>. The entire network would immediately reject the fake version. That is what makes blockchain <b style='color:#f1f5f9;'>immutable</b> — it cannot be secretly changed.</p>",
            [('📦 Block','Batch of transactions'),('🔢 Hash','Unique fingerprint'),('🔗 Chain','Blocks linked in order'),('🚫 Immutable','Can\'t change the past')]),
        make_scene('eb-s8','⚖️ Proof of Work vs Proof of Stake',color,
            'Two ways blockchains decide who adds the next block',
            "<p style='font-size:17px;color:#cbd5e1;line-height:1.8;'><b style='color:#10b981;'>Proof of Work (PoW)</b> — used by Bitcoin. Computers compete to solve a hard math puzzle. The winner adds the next block and earns a reward. Uses lots of energy.</p><br/><p style='font-size:17px;color:#cbd5e1;line-height:1.8;'><b style='color:#10b981;'>Proof of Stake (PoS)</b> — used by Ethereum. Validators lock up (stake) their crypto as a promise to be honest. Cheating means losing their stake. Much more energy efficient.</p><br/><p style='font-size:16px;color:#64748b;'>Both systems ensure that it is extremely expensive to attack the network.</p>",
            [('⛏️ PoW','Bitcoin — energy-heavy'),('🪙 PoS','Ethereum — stake to validate'),('🌱 Energy','PoS uses 99% less energy'),('🛡️ Security','Both are very hard to attack')]),
    ]
    d = insert_before_kc(d, new_scenes)
    save('oc-elem-blockchain', d)

def expand_elem_crypto():
    d = load('oc-elem-crypto')
    color = '#f59e0b'
    new_scenes = [
        make_scene('ec-s4','₿ Why Was Bitcoin Created?',color,
            'The problem Bitcoin was built to solve',
            "<p style='font-size:17px;color:#cbd5e1;line-height:1.8;'>In 2008, a global financial crisis hit when banks failed and millions of people lost their savings. A mysterious person (or group) called <b style='color:#f59e0b;'>Satoshi Nakamoto</b> published a paper describing Bitcoin.</p><br/><p style='font-size:17px;color:#cbd5e1;line-height:1.8;'>The idea: create a form of money that <b style='color:#f1f5f9;'>no bank or government could control, freeze, or inflate away</b>. You hold your own money. No middleman. No permission required.</p>",
            [('📅 2008','Bitcoin whitepaper published'),('🏦 Problem','Banks failed, people lost money'),('🔑 Solution','Self-custody, no middleman'),('🌐 Result','First decentralized currency')]),
        make_scene('ec-s5','📊 Supply, Demand & Value',color,
            'Why crypto prices go up and down',
            "<p style='font-size:17px;color:#cbd5e1;line-height:1.8;'>Like any asset, crypto prices are driven by <b style='color:#f59e0b;'>supply and demand</b>. When more people want to buy than sell, the price goes up. When more people want to sell, the price drops.</p><br/><p style='font-size:17px;color:#cbd5e1;line-height:1.8;'>Bitcoin has a <b style='color:#f1f5f9;'>hard cap of 21 million coins</b> — that is all that will ever exist. Scarcity is a key driver of its value, similar to gold. Ethereum has no hard cap but burns some with every transaction.</p>",
            [('📈 High Demand','Price goes up'),('📉 High Supply','Price goes down'),('🔢 21M Max','Bitcoin\'s hard cap'),('🔥 Burn','Ethereum reduces supply')]),
        make_scene('ec-s6','🪙 Coins vs Tokens vs Stablecoins',color,
            'Not all crypto is the same — here is the difference',
            "<p style='font-size:17px;color:#cbd5e1;line-height:1.8;'><b style='color:#f59e0b;'>Coins</b> have their own blockchain — Bitcoin (BTC), Ethereum (ETH), XRP all run on their own networks.</p><br/><p style='font-size:17px;color:#cbd5e1;line-height:1.8;'><b style='color:#f59e0b;'>Tokens</b> are built on top of existing blockchains. For example, thousands of tokens run on Ethereum.</p><br/><p style='font-size:17px;color:#cbd5e1;line-height:1.8;'><b style='color:#f59e0b;'>Stablecoins</b> like USDT and USDC are pegged 1:1 to the US dollar. They give you the benefits of crypto (fast, borderless) without the price swings.</p>",
            [('🔵 Coin','Own blockchain (BTC, ETH, XRP)'),('🟢 Token','Built on another chain'),('💵 Stablecoin','Pegged to USD (USDT, USDC)'),('⚖️ Key Diff','Coins = infrastructure; Tokens = apps')]),
    ]
    d = insert_before_kc(d, new_scenes)
    save('oc-elem-crypto', d)

def expand_elem_defi():
    d = load('oc-elem-defi')
    color = '#10b981'
    new_scenes = [
        make_scene('ed-s4','🏦 Finance Without Banks',color,
            'What it actually means to remove the middleman',
            "<p style='font-size:17px;color:#cbd5e1;line-height:1.8;'>Every time you use a bank — to send money, take a loan, or earn interest — the bank is the <b style='color:#10b981;'>middleman</b>. It charges fees, sets the rules, and can freeze your account.</p><br/><p style='font-size:17px;color:#cbd5e1;line-height:1.8;'><b style='color:#f1f5f9;'>DeFi replaces the bank with code.</b> Smart contracts handle lending, borrowing, and trading automatically. No human approvals. No business hours. No border restrictions. Anyone with a crypto wallet can participate.</p>",
            [('🚫 No Bank','No middleman, no fees'),('⏰ 24/7','Open every day, always'),('🌍 Global','Anyone, anywhere'),('📋 Code Rules','Smart contracts are the law')]),
        make_scene('ed-s5','💰 What is Yield?',color,
            'Earning passive income with your crypto',
            "<p style='font-size:17px;color:#cbd5e1;line-height:1.8;'><b style='color:#10b981;'>Yield</b> means earning a return on your crypto just for providing it to a DeFi protocol. Similar to earning interest in a savings account — but often much higher rates.</p><br/><p style='font-size:17px;color:#cbd5e1;line-height:1.8;'>For example: you deposit USDC into a lending protocol. Borrowers pay interest to borrow it. That interest flows back to you automatically via smart contract. Your crypto works for you while you sleep.</p>",
            [('💵 Deposit Crypto','Lock it in a protocol'),('📤 Borrowers Use It','They pay interest'),('💸 You Earn','Interest flows back to you'),('⚠️ Risk','Smart contracts can have bugs')]),
        make_scene('ed-s6','🌊 Liquidity Pools — The Concept',color,
            'How DeFi creates markets without order books',
            "<p style='font-size:17px;color:#cbd5e1;line-height:1.8;'>Traditional exchanges match buyers and sellers. DeFi uses a different system called a <b style='color:#10b981;'>liquidity pool</b>.</p><br/><p style='font-size:17px;color:#cbd5e1;line-height:1.8;'>Imagine a giant jar filled with two types of tokens — say, ETH and USDC. When you want to swap ETH for USDC, you add your ETH to the jar and take out USDC. The price adjusts automatically based on the ratio in the jar. The people who filled the jar earn a small fee on every swap.</p><br/><p style='font-size:15px;color:#f59e0b;'><b>⚠️ Risk: Rug Pulls.</b> If the team behind a pool withdraws all the liquidity, the value collapses instantly. Only use established, audited protocols.</p>",
            [('🫙 Pool','Jar of two token types'),('🔄 Swap','Trade against the pool'),('💰 LP Fee','Earn % of every swap'),('🚨 Rug Pull','Team drains the pool')]),
    ]
    d = insert_before_kc(d, new_scenes)
    save('oc-elem-defi', d)

def expand_elem_trading():
    d = load('oc-elem-trading')
    color = '#3b82f6'
    new_scenes = [
        make_scene('et-s4','📊 Buyers vs Sellers',color,
            'The two forces that set every price',
            "<p style='font-size:17px;color:#cbd5e1;line-height:1.8;'>Every price you see in a market is the result of a <b style='color:#3b82f6;'>negotiation between buyers and sellers</b>. Buyers want the lowest price. Sellers want the highest. The current price is where they agree.</p><br/><p style='font-size:17px;color:#cbd5e1;line-height:1.8;'>When buyers outnumber sellers — <b style='color:#10b981;'>prices go up</b>. When sellers outnumber buyers — <b style='color:#ef4444;'>prices go down</b>. This is the foundation of every market in the world, from stocks to crypto to real estate.</p>",
            [('📈 More Buyers','Price rises'),('📉 More Sellers','Price falls'),('⚖️ Equal','Price stays flat'),('🎯 Your Job','Predict which way it moves')]),
        make_scene('et-s5','📈 Long vs Short — Simply Explained',color,
            'The two ways to make money in any market',
            "<p style='font-size:17px;color:#cbd5e1;line-height:1.8;'><b style='color:#3b82f6;'>Going Long</b> means you buy something hoping the price will <b style='color:#10b981;'>go up</b>. You buy at $100, it goes to $150 — you made $50. This is the most natural way to trade.</p><br/><p style='font-size:17px;color:#cbd5e1;line-height:1.8;'><b style='color:#3b82f6;'>Going Short</b> means you bet the price will <b style='color:#ef4444;'>go down</b>. You borrow and sell at $100, price drops to $70, you buy it back — and pocket the difference.</p><br/><p style='font-size:15px;color:#f59e0b;'>⚠️ Shorting is advanced and risky. Losses can exceed your deposit. Start with long-only trading.</p>",
            [('⬆️ Long','Buy low, sell high'),('⬇️ Short','Sell high, buy back lower'),('⚠️ Risk','Shorting = unlimited loss potential'),('✅ Beginner Tip','Stick to long positions first')]),
        make_scene('et-s6','🎢 What is Volatility?',color,
            'Why crypto prices move so dramatically',
            "<p style='font-size:17px;color:#cbd5e1;line-height:1.8;'><b style='color:#3b82f6;'>Volatility</b> means how much and how fast a price moves. Bitcoin can move 10% in a single day. Apple stock might move 2% in a week.</p><br/><p style='font-size:17px;color:#cbd5e1;line-height:1.8;'>High volatility means <b style='color:#10b981;'>bigger profit potential</b> — but also <b style='color:#ef4444;'>bigger loss potential</b>. Crypto is one of the most volatile asset classes in history. This is why <b style='color:#f1f5f9;'>risk management</b> — never investing more than you can afford to lose — is the first rule of trading.</p>",
            [('📊 High Volatility','Big moves, fast'),('💰 Opportunity','Big gains possible'),('💸 Risk','Big losses possible'),('🛡️ Rule #1','Only risk what you can lose')]),
    ]
    d = insert_before_kc(d, new_scenes)
    save('oc-elem-trading', d)

def expand_elem_wallets():
    d = load('oc-elem-wallets')
    color = '#ef4444'
    new_scenes = [
        make_scene('ew-s4','🏦 Custodial vs Non-Custodial',color,
            'Who actually controls your crypto?',
            "<p style='font-size:17px;color:#cbd5e1;line-height:1.8;'><b style='color:#ef4444;'>Custodial wallet</b> — a company (like Coinbase or Binance) holds your private keys. You log in with a username and password. Easy and convenient, but <b style='color:#f1f5f9;'>they control your money</b>. If they get hacked or go bankrupt, your funds could be lost.</p><br/><p style='font-size:17px;color:#cbd5e1;line-height:1.8;'><b style='color:#ef4444;'>Non-custodial wallet</b> — you hold your own private keys. Nobody can freeze or take your funds. This is true crypto ownership. The phrase in crypto is: <b style='color:#f59e0b;'>\"Not your keys, not your coins.\"</b></p>",
            [('🏦 Custodial','Exchange holds keys — convenient'),('🔑 Non-Custodial','You hold keys — true ownership'),('⚠️ CEX Risk','Exchange can fail or freeze'),('✅ Best Practice','Move large amounts off exchanges')]),
        make_scene('ew-s5','🌱 Seed Phrases — The Master Key',color,
            'The 12 or 24 words that control everything',
            "<p style='font-size:17px;color:#cbd5e1;line-height:1.8;'>When you create a non-custodial wallet, you get a <b style='color:#ef4444;'>seed phrase</b> — 12 or 24 random words in a specific order. These words are your master key. They can regenerate your entire wallet on any device, anywhere in the world.</p><br/><p style='font-size:17px;color:#cbd5e1;line-height:1.8;'><b style='color:#f1f5f9;'>The rules:</b> Write it on paper (not digital). Store it somewhere safe and private. Never share it with anyone. Never type it into a website. <b style='color:#ef4444;'>Anyone who has your seed phrase owns all your crypto.</b></p>",
            [('📝 Write on Paper','Never store digitally'),('🔒 Store Safely','Fireproof location is best'),('🚫 Never Share','Not with support, not with anyone'),('♻️ Recovery','Restores wallet on any device')]),
        make_scene('ew-s6','🛡️ How Not to Lose Your Funds',color,
            'The most important safety habits in crypto',
            "<p style='font-size:17px;color:#cbd5e1;line-height:1.8;'>Most crypto losses are not from hacks — they are from <b style='color:#ef4444;'>human mistakes</b>. Here are the top ways people lose funds and how to avoid them.</p>",
            [('📤 Wrong Address','Always double-check before sending'),('🌱 Lost Seed Phrase','Back it up in multiple safe places'),('🎣 Phishing','Never click wallet-connect links in DMs'),('📱 Phone Lost','Use hardware wallet for large amounts')]),
    ]
    d = insert_before_kc(d, new_scenes)
    save('oc-elem-wallets', d)

def expand_elem_ecosystem():
    d = load('oc-elem-ecosystem')
    color = '#06b6d4'
    new_scenes = [
        make_scene('ee-s4','🏛️ CEX vs DEX',color,
            'Two types of exchanges — what is the difference?',
            "<p style='font-size:17px;color:#cbd5e1;line-height:1.8;'><b style='color:#06b6d4;'>CEX (Centralized Exchange)</b> — a company runs it. Think Coinbase, Binance, Kraken. You create an account, verify your identity, and the company holds your funds while you trade. Easy to use but you depend on them.</p><br/><p style='font-size:17px;color:#cbd5e1;line-height:1.8;'><b style='color:#06b6d4;'>DEX (Decentralized Exchange)</b> — no company. Code runs it. You connect your own wallet and trade directly. Nobody holds your funds. Examples: Uniswap, dYdX, XRPL's built-in DEX.</p>",
            [('🏦 CEX','Company-run, ID required'),('🔄 DEX','Code-run, wallet-only'),('✅ CEX Pros','Easy, beginner-friendly'),('✅ DEX Pros','Self-custody, no accounts')]),
        make_scene('ee-s5','🖼️ DAOs — Ownership by the Community',color,
            'How crypto enables groups to govern themselves',
            "<p style='font-size:17px;color:#cbd5e1;line-height:1.8;'>A <b style='color:#06b6d4;'>DAO</b> (Decentralized Autonomous Organization) is like a company where the rules are written in code and the members vote on decisions using their tokens.</p><br/><p style='font-size:17px;color:#cbd5e1;line-height:1.8;'>No CEO. No board. Every token holder gets a vote proportional to how many tokens they hold. Decisions — like how to spend the treasury or change the protocol — are voted on-chain and executed automatically.</p>",
            [('🗳️ Token Vote','Hold tokens = voting power'),('📋 On-Chain Rules','Code enforces the result'),('🌐 Examples','MakerDAO, Uniswap DAO'),('💡 Key Idea','Community = the company')]),
        make_scene('ee-s6','🌐 Web3 — The Next Internet',color,
            'What Web3 means and why it matters',
            "<p style='font-size:17px;color:#cbd5e1;line-height:1.8;'><b style='color:#06b6d4;'>Web1</b> — read-only. Static websites. You could read, not participate.</p><br/><p style='font-size:17px;color:#cbd5e1;line-height:1.8;'><b style='color:#06b6d4;'>Web2</b> — read-write. Social media. You can create — but companies (Meta, Google) own your data and earn from it.</p><br/><p style='font-size:17px;color:#cbd5e1;line-height:1.8;'><b style='color:#06b6d4;'>Web3</b> — read-write-own. You create content and <b style='color:#f1f5f9;'>own it via blockchain</b>. Your identity, data, and digital assets belong to you — not a platform.</p>",
            [('📖 Web1','Read only — static sites'),('✍️ Web2','Create but platform owns data'),('🔑 Web3','Own your data and assets'),('🚀 Now','Crypto is the foundation of Web3')]),
    ]
    d = insert_before_kc(d, new_scenes)
    save('oc-elem-ecosystem', d)

def expand_elem_security():
    d = load('oc-elem-security')
    color = '#f43f5e'
    new_scenes = [
        make_scene('es2-s4','🎣 Phishing — The Most Common Attack',color,
            'How scammers steal wallets by impersonation',
            "<p style='font-size:17px;color:#cbd5e1;line-height:1.8;'><b style='color:#f43f5e;'>Phishing</b> is when a scammer pretends to be a trusted service — MetaMask, Coinbase, a DeFi protocol — to trick you into entering your seed phrase or private key on a fake website.</p><br/><p style='font-size:17px;color:#cbd5e1;line-height:1.8;'>Common forms: fake emails, fake Discord support DMs, Google ads pointing to copycat sites. <b style='color:#f1f5f9;'>A real wallet or exchange will NEVER ask for your seed phrase.</b> Ever. If someone asks — it is a scam 100% of the time.</p>",
            [('📧 Fake Emails','Links to copycat sites'),('💬 Fake Support','DMs asking for seed phrase'),('🔗 Fake URLs','Check spelling carefully'),('✅ Rule','Legit services NEVER ask for seed phrase')]),
        make_scene('es2-s5','💎 Fake Giveaways & Rug Pulls',color,
            'Two of the most destructive scams in crypto',
            "<p style='font-size:17px;color:#cbd5e1;line-height:1.8;'><b style='color:#f43f5e;'>Fake Giveaways</b> — \"Send 1 ETH, receive 2 ETH back.\" It is always a scam. Elon Musk, Vitalik, and Coinbase have all been impersonated this way. Nobody is giving away free crypto.</p><br/><p style='font-size:17px;color:#cbd5e1;line-height:1.8;'><b style='color:#f43f5e;'>Rug Pulls</b> — a team creates a new token, hypes it up, raises money — then disappears with all the funds. The token becomes worthless overnight. Over $2 billion was lost to rug pulls in 2021 alone.</p>",
            [('🎁 Giveaway Scam','\"Send X, get 2X back\" = always fake'),('🪤 Rug Pull','Team dumps tokens and disappears'),('📊 Red Flag','Anonymous team + unrealistic returns'),('🛡️ Defence','Stick to established, audited projects')]),
        make_scene('es2-s6','🧠 Social Engineering & Red Flags',color,
            'How scammers manipulate people psychologically',
            "<p style='font-size:17px;color:#cbd5e1;line-height:1.8;'><b style='color:#f43f5e;'>Social engineering</b> uses psychology rather than hacking. Scammers build trust over weeks, create urgency, or exploit emotions to get you to make a mistake.</p><br/><p style='font-size:17px;color:#cbd5e1;line-height:1.8;'>Common tactics: romance scams (fake relationships that end with a request to invest), fake job offers, \"investment managers\" promising guaranteed returns.</p>",
            [('❤️ Romance Scam','Weeks of relationship → steal funds'),('💼 Fake Job','Pay \"training fee\" upfront'),('⏰ Urgency','\"Act now or miss out\"'),('💯 Guaranteed Returns','Impossible in real investing')]),
    ]
    d = insert_before_kc(d, new_scenes)
    save('oc-elem-security', d)


# ─────────────────────────────────────────────
# HIGH SCHOOL EXPANSIONS
# ─────────────────────────────────────────────

def expand_hs_blockchain():
    d = load('oc-hs-blockchain')
    color = '#f59e0b'
    new_scenes = [
        make_scene('hb-s4','🔀 Hard Forks vs Soft Forks',color,
            'When a blockchain splits — and why it happens',
            "<p style='font-size:17px;color:#cbd5e1;line-height:1.8;'>A <b style='color:#f59e0b;'>fork</b> happens when the blockchain protocol is updated. There are two types.</p><br/><p style='font-size:17px;color:#cbd5e1;line-height:1.8;'><b style='color:#f1f5f9;'>Soft fork</b> — a backwards-compatible update. Old nodes can still validate new blocks. Like a software update you don't have to install immediately.</p><br/><p style='font-size:17px;color:#cbd5e1;line-height:1.8;'><b style='color:#f1f5f9;'>Hard fork</b> — a breaking change. Old and new rules are incompatible. The chain splits into two separate blockchains. Bitcoin Cash was created this way from Bitcoin in 2017.</p>",
            [('🔀 Soft Fork','Backwards compatible update'),('⛓️ Hard Fork','Chain splits into two'),('₿ Example','Bitcoin → Bitcoin Cash (2017)'),('🗳️ Governance','Community votes on changes')]),
        make_scene('hb-s5','🏗️ Layer 1 vs Layer 2',color,
            'How blockchains scale to handle more users',
            "<p style='font-size:17px;color:#cbd5e1;line-height:1.8;'><b style='color:#f59e0b;'>Layer 1 (L1)</b> is the base blockchain — Bitcoin, Ethereum, XRP Ledger. Secure and decentralized, but limited in how many transactions it can process per second.</p><br/><p style='font-size:17px;color:#cbd5e1;line-height:1.8;'><b style='color:#f59e0b;'>Layer 2 (L2)</b> solutions are built on top of L1. They process transactions off the main chain (faster, cheaper), then batch and submit a summary back to L1 for security. Examples: Arbitrum, Optimism (Ethereum L2s), Lightning Network (Bitcoin L2).</p>",
            [('⛓️ L1','Base chain — secure & slow'),('⚡ L2','Built on top — fast & cheap'),('🔁 Rollup','Batch txs, settle on L1'),('🌩️ Lightning','Bitcoin L2 for instant payments')]),
        make_scene('hb-s6','📐 The Blockchain Trilemma',color,
            'Why you can\'t have security, speed, and decentralization all at once',
            "<p style='font-size:17px;color:#cbd5e1;line-height:1.8;'>Every blockchain must make trade-offs across three properties. You can optimize for two — but not all three simultaneously.</p><br/><p style='font-size:17px;color:#cbd5e1;line-height:1.8;'><b style='color:#f59e0b;'>Security</b> — resistant to attacks. <b style='color:#f59e0b;'>Decentralization</b> — no central authority. <b style='color:#f59e0b;'>Scalability</b> — handles lots of transactions fast.</p><br/><p style='font-size:16px;color:#cbd5e1;'>Bitcoin chose security + decentralization (slow). Solana chose speed + security (fewer validators). XRPL balances all three with its unique consensus — one reason OnlyCrypto runs on it.</p>",
            [('🛡️ Security','Resistant to 51% attack'),('🌐 Decentralization','No single point of control'),('⚡ Scalability','High TPS, low fees'),('⚖️ Trade-off','Pick two — L2s help with the third')]),
    ]
    d = insert_before_kc(d, new_scenes)
    save('oc-hs-blockchain', d)

def expand_hs_crypto():
    d = load('oc-hs-crypto')
    color = '#eab308'
    new_scenes = [
        make_scene('hc-s4','🐳 Whales & Market Manipulation',color,
            'How large holders move markets — and what to watch for',
            "<p style='font-size:17px;color:#cbd5e1;line-height:1.8;'>A <b style='color:#eab308;'>whale</b> is any wallet holding a large enough position to move the market when they buy or sell. In Bitcoin, a wallet with 1,000+ BTC qualifies. In smaller altcoins, even $500k can move the price.</p><br/><p style='font-size:17px;color:#cbd5e1;line-height:1.8;'>Common manipulation tactics: <b style='color:#f1f5f9;'>wash trading</b> (buying and selling to yourself to fake volume), <b style='color:#f1f5f9;'>pump and dump</b> (coordinated hype then mass sell), <b style='color:#f1f5f9;'>spoofing</b> (placing and canceling large orders to fake pressure).</p>",
            [('🐳 Whale','Holds enough to move price'),('🔄 Wash Trade','Fake volume — self-trading'),('📣 Pump & Dump','Hype it up, then sell on retail'),('📊 On-Chain Tools','Track whale wallets publicly')]),
        make_scene('hc-s5','📖 Reading an Order Book',color,
            'The real-time record of all buy and sell intentions',
            "<p style='font-size:17px;color:#cbd5e1;line-height:1.8;'>An <b style='color:#eab308;'>order book</b> shows all active buy orders (bids) and sell orders (asks) for an asset. The gap between the highest bid and lowest ask is the <b style='color:#f1f5f9;'>spread</b>.</p><br/><p style='font-size:17px;color:#cbd5e1;line-height:1.8;'>Large clusters of buy orders at a price level = <b style='color:#10b981;'>support</b> (price tends to bounce there). Large clusters of sell orders = <b style='color:#ef4444;'>resistance</b> (price tends to stall there). Watching the order book gives you a live pulse of market intent.</p>",
            [('📗 Bids','Buy orders — below current price'),('📕 Asks','Sell orders — above current price'),('↔️ Spread','Gap between best bid and ask'),('💡 Depth','Wall of orders = support or resistance')]),
        make_scene('hc-s6','💧 Liquidity & Slippage',color,
            'Why market depth matters when you trade',
            "<p style='font-size:17px;color:#cbd5e1;line-height:1.8;'><b style='color:#eab308;'>Liquidity</b> is how easily you can buy or sell without moving the price. Bitcoin is highly liquid — you can trade millions of dollars without much price impact. A small altcoin is illiquid — even a $10k buy can spike the price 5%.</p><br/><p style='font-size:17px;color:#cbd5e1;line-height:1.8;'><b style='color:#eab308;'>Slippage</b> is when your order executes at a worse price than expected because there weren't enough orders at your target price. Always use limit orders when trading illiquid assets.</p>",
            [('💧 High Liquidity','Large trades, small price impact'),('🏜️ Low Liquidity','Small trades move price a lot'),('📉 Slippage','Got a worse price than expected'),('✅ Fix','Use limit orders, not market orders')]),
    ]
    d = insert_before_kc(d, new_scenes)
    save('oc-hs-crypto', d)

def expand_hs_defi():
    d = load('oc-hs-defi')
    color = '#f97316'
    new_scenes = [
        make_scene('hd-s4','🌾 Yield Farming',color,
            'How to maximize returns across DeFi protocols',
            "<p style='font-size:17px;color:#cbd5e1;line-height:1.8;'><b style='color:#f97316;'>Yield farming</b> is the practice of moving your crypto across different DeFi protocols to chase the highest return. A farmer might deposit liquidity in Uniswap, earn LP tokens, stake those LP tokens elsewhere for bonus yield, then reinvest the rewards.</p><br/><p style='font-size:17px;color:#cbd5e1;line-height:1.8;'>Risks: smart contract vulnerabilities, protocol collapse, and the infamous <b style='color:#f1f5f9;'>impermanent loss</b> from liquidity provision. High APY usually means high risk.</p>",
            [('🌾 Farm','Move capital to best yield'),('🔁 Compound','Reinvest rewards automatically'),('⚠️ Smart Contract Risk','Bugs = lost funds'),('💡 Rule','High APY = high risk, always')]),
        make_scene('hd-s5','⚖️ Impermanent Loss — Deep Dive',color,
            'The hidden cost of providing liquidity',
            "<p style='font-size:17px;color:#cbd5e1;line-height:1.8;'><b style='color:#f97316;'>Impermanent loss</b> occurs when the price ratio of tokens in a liquidity pool changes from when you deposited. The AMM rebalances your position automatically, meaning you end up with more of the token that fell and less of the one that rose.</p><br/><p style='font-size:17px;color:#cbd5e1;line-height:1.8;'>Example: you deposit ETH + USDC 50/50. ETH price doubles. You now have less ETH than if you had just held. The loss is \"impermanent\" because it recovers if prices return to entry ratio — but if you withdraw during divergence, the loss becomes permanent.</p>",
            [('📊 Price Divergence','Bigger gap = bigger IL'),('💸 IL Formula','Increases non-linearly with price'),('✅ Mitigation','Use stablecoin pairs (less IL)'),('⏳ Impermanent','Recovers if prices return')]),
        make_scene('hd-s6','🔒 Protocol Risk',color,
            'What can actually go wrong in DeFi — and what to watch for',
            "<p style='font-size:17px;color:#cbd5e1;line-height:1.8;'>DeFi protocols carry risks that traditional finance does not. Before depositing into any protocol, evaluate these key risk vectors:</p><br/><p style='font-size:17px;color:#cbd5e1;line-height:1.8;'><b style='color:#f97316;'>Smart contract bugs</b> — even audited code can have exploits. Over $3B was lost to DeFi hacks in 2022. <b style='color:#f97316;'>Oracle manipulation</b> — price feeds can be manipulated to drain lending protocols. <b style='color:#f97316;'>Admin key risk</b> — if a team holds upgrade keys they can change or drain contracts.</p>",
            [('🐛 Contract Bug','Code exploit drains funds'),('🔮 Oracle Hack','Price feed manipulation'),('🔑 Admin Risk','Team can rug via upgrade keys'),('✅ Check','Audit reports + time-locked admin keys')]),
    ]
    d = insert_before_kc(d, new_scenes)
    save('oc-hs-defi', d)

def expand_hs_trading():
    d = load('oc-hs-trading')
    color = '#f59e0b'
    new_scenes = [
        make_scene('ht-s4','📊 Trends & Volume',color,
            'The two most important things to confirm before any trade',
            "<p style='font-size:17px;color:#cbd5e1;line-height:1.8;'>Price moves in <b style='color:#f59e0b;'>trends</b> — uptrend (higher highs, higher lows), downtrend (lower highs, lower lows), or sideways. Trading with the trend is far safer than against it.</p><br/><p style='font-size:17px;color:#cbd5e1;line-height:1.8;'><b style='color:#f59e0b;'>Volume</b> confirms trend strength. A price breakout on high volume is reliable. The same breakout on low volume is likely a fake-out. Always confirm moves with volume before entering a position.</p>",
            [('⬆️ Uptrend','Higher highs, higher lows'),('⬇️ Downtrend','Lower highs, lower lows'),('📊 Volume','Confirms or denies the move'),('⚠️ Low Volume Breakout','Often reverses quickly')]),
        make_scene('ht-s5','📉 RSI, MACD & Moving Averages',color,
            'The three indicators every trader should understand',
            "<p style='font-size:17px;color:#cbd5e1;line-height:1.8;'><b style='color:#f59e0b;'>RSI (Relative Strength Index)</b> measures momentum 0–100. Above 70 = overbought (potential sell). Below 30 = oversold (potential buy). A useful early warning system, not a standalone signal.</p><br/><p style='font-size:17px;color:#cbd5e1;line-height:1.8;'><b style='color:#f59e0b;'>MACD</b> shows momentum shifts. When the MACD line crosses above the signal line = bullish. Below = bearish.</p><br/><p style='font-size:17px;color:#cbd5e1;line-height:1.8;'><b style='color:#f59e0b;'>Moving Averages (MA)</b> smooth out price noise. The 50-day and 200-day MAs are widely watched. When 50 crosses above 200 = Golden Cross (very bullish). Opposite = Death Cross.</p>",
            [('📊 RSI','Momentum — 30 buy / 70 sell'),('⚡ MACD','Momentum crossover signal'),('〰️ Moving Avg','Trend direction + key levels'),('✨ Golden Cross','50MA crosses above 200MA')]),
        make_scene('ht-s6','⚖️ Risk-Reward Ratio',color,
            'The math that separates profitable traders from losers',
            "<p style='font-size:17px;color:#cbd5e1;line-height:1.8;'>Every trade has a <b style='color:#f59e0b;'>risk-reward ratio</b>. If you risk $100 to potentially make $300, your ratio is 1:3. Professional traders require at least 1:2 before entering any trade.</p><br/><p style='font-size:17px;color:#cbd5e1;line-height:1.8;'>With a 1:2 ratio, you can be right only 40% of the time and still be profitable. <b style='color:#f1f5f9;'>Math beats emotion.</b> Set your stop-loss and take-profit levels before entering — never move your stop-loss to avoid a loss. That is how small losses become account-destroying losses.</p>",
            [('📐 1:2 R:R','Risk $1 to make $2'),('🛑 Stop Loss','Set before entry — never move it'),('🎯 Take Profit','Know your exit before you enter'),('🧮 Math','40% win rate + 1:2 = profitable')]),
    ]
    d = insert_before_kc(d, new_scenes)
    save('oc-hs-trading', d)

def expand_hs_wallets():
    d = load('oc-hs-wallets')
    color = '#ef4444'
    new_scenes = [
        make_scene('hw-s4','🧊 Cold vs Hot Wallets',color,
            'Choosing the right storage for your situation',
            "<p style='font-size:17px;color:#cbd5e1;line-height:1.8;'><b style='color:#ef4444;'>Hot wallet</b> — connected to the internet. MetaMask, Trust Wallet, exchange accounts. Convenient for daily use but exposed to online attacks.</p><br/><p style='font-size:17px;color:#cbd5e1;line-height:1.8;'><b style='color:#ef4444;'>Cold wallet</b> — offline device that stores your private keys. Ledger and Trezor are the most popular. To sign a transaction, you physically confirm it on the device. An attacker controlling your computer cannot approve transactions without physical access to the device.</p>",
            [('🔥 Hot Wallet','Internet-connected, convenient'),('🧊 Cold Wallet','Offline device, most secure'),('💡 Best Practice','Hot for spending, cold for savings'),('🔐 Hardware','Ledger, Trezor = industry standard')]),
        make_scene('hw-s5','✍️ Multi-Signature Wallets',color,
            'Requiring multiple approvals to move funds',
            "<p style='font-size:17px;color:#cbd5e1;line-height:1.8;'>A <b style='color:#ef4444;'>multi-sig wallet</b> requires more than one private key to authorize a transaction. A common setup is 2-of-3: you need any 2 of 3 designated keys to sign.</p><br/><p style='font-size:17px;color:#cbd5e1;line-height:1.8;'>This means a single compromised device or lost key cannot drain the wallet. Used by exchanges, DAOs, and anyone managing large amounts. The XRPL natively supports multi-signing on every account.</p>",
            [('2-of-3','Need 2 keys from 3 total'),('🛡️ Protection','One key stolen = still safe'),('🏢 Use Case','DAOs, treasuries, exchanges'),('⛓️ XRPL','Native multi-sign support')]),
        make_scene('hw-s6','🛡️ Security Layering',color,
            'Defense in depth — building multiple lines of protection',
            "<p style='font-size:17px;color:#cbd5e1;line-height:1.8;'>Professional crypto security uses <b style='color:#ef4444;'>layered defense</b>. No single measure is enough — combine them.</p>",
            [('🧊 Hardware Wallet','Physical signing for large holdings'),('📵 Dedicated Device','Separate phone/laptop for crypto only'),('📧 Private Email','Never use your main email for exchanges'),('🔐 Authenticator App','2FA via app — never SMS (SIM-swappable)')]),
    ]
    d = insert_before_kc(d, new_scenes)
    save('oc-hs-wallets', d)

def expand_hs_ecosystem():
    d = load('oc-hs-ecosystem')
    color = '#f59e0b'
    new_scenes = [
        make_scene('he-s5','🎮 NFT Utility vs Hype',color,
            'Separating real use cases from speculation',
            "<p style='font-size:17px;color:#cbd5e1;line-height:1.8;'>The NFT market in 2021 was dominated by speculative hype — people buying jpegs hoping to flip them for profit. Most of that value collapsed. But <b style='color:#f59e0b;'>utility NFTs</b> represent something real.</p><br/><p style='font-size:17px;color:#cbd5e1;line-height:1.8;'>Real utility: event tickets (verifiable, transferable), gaming assets (own your in-game items), membership passes (DAO access, gated communities), digital certificates, real estate deeds. The underlying technology is sound — the speculation was the problem.</p>",
            [('🖼️ Hype NFT','JPEG with no utility — speculation'),('🎟️ Ticket NFT','Verifiable, anti-counterfeit'),('🎮 Game Asset','Own your items, trade freely'),('🏅 Certificate','Proof of credential on-chain')]),
        make_scene('he-s6','🏭 Real-World Asset (RWA) Tokenization',color,
            'Bringing physical assets onto the blockchain',
            "<p style='font-size:17px;color:#cbd5e1;line-height:1.8;'><b style='color:#f59e0b;'>RWA tokenization</b> means representing ownership of real-world assets — real estate, gold, treasury bonds, art — as blockchain tokens. This makes them tradeable 24/7, divisible, and accessible to anyone globally.</p><br/><p style='font-size:17px;color:#cbd5e1;line-height:1.8;'>BlackRock, Franklin Templeton, and JPMorgan are all actively tokenizing assets. The XRPL is positioned as a settlement layer for tokenized RWAs due to its speed and built-in DEX. This is one of the largest opportunities in crypto.</p>",
            [('🏠 Real Estate','Fractional ownership on-chain'),('🪙 Gold','XAU tokens, redeemable for gold'),('📊 T-Bills','Tokenized US treasury bonds'),('⛓️ XRPL','Built for RWA settlement')]),
    ]
    d = insert_before_kc(d, new_scenes)
    save('oc-hs-ecosystem', d)


# ─────────────────────────────────────────────
# COLLEGE EXPANSIONS (add to existing 9-scene classrooms)
# ─────────────────────────────────────────────

def expand_col_blockchain():
    d = load('oc-blockchain-basics')
    color = '#8b5cf6'
    new_scenes = [
        make_scene('cbb-s10','🏛️ Decentralization vs Scalability Trilemma — Advanced',color,
            'The engineering constraints every blockchain designer faces',
            "<p style='font-size:17px;color:#cbd5e1;line-height:1.8;'>At the protocol design level, the trilemma is not just conceptual — it is a <b style='color:#8b5cf6;'>mathematical constraint</b>. Increasing validator count improves decentralization but increases consensus communication overhead (O(n²) for naive BFT). Sharding improves scalability but introduces cross-shard attack surfaces.</p><br/><p style='font-size:17px;color:#cbd5e1;line-height:1.8;'>XRPL's RPCA achieves high throughput with a small, trusted validator set — trading some decentralization for speed. Ethereum's sharding roadmap attempts to preserve decentralization while improving scalability via L2 rollups.</p>",
            [('📐 BFT Overhead','O(n²) comms as validators grow'),('🔀 Sharding','Splits chain into parallel shards'),('⚡ XRPL RPCA','Small trusted set = fast consensus'),('🔁 Rollup','L2 batch settlement preserves L1 security')]),
        make_scene('cbb-s11','🔐 Cryptographic Foundations',color,
            'The math that makes blockchain possible',
            "<p style='font-size:17px;color:#cbd5e1;line-height:1.8;'><b style='color:#8b5cf6;'>Hash functions</b> (SHA-256, Keccak-256) convert any input to a fixed-length output. Deterministic, one-way, collision-resistant.</p><br/><p style='font-size:17px;color:#cbd5e1;line-height:1.8;'><b style='color:#8b5cf6;'>Digital signatures</b> (secp256k1 ECDSA) prove ownership without revealing the private key. When you sign a transaction, you prove you own the key without ever exposing it. The network can verify the signature using only your public key.</p>",
            [('🔢 SHA-256','Bitcoin\'s proof-of-work hash'),('📝 ECDSA','Elliptic curve digital signatures'),('🔑 Public Key','Anyone can verify your signature'),('🔐 Private Key','Never leaves your device')]),
    ]
    d = insert_before_kc(d, new_scenes)
    save('oc-blockchain-basics', d)

def expand_col_crypto():
    d = load('oc-cryptocurrency-guide')
    color = '#f59e0b'
    new_scenes = [
        make_scene('ccg-s10','⚙️ Token Design & Monetary Policy',color,
            'How tokenomics is engineered to create specific behaviors',
            "<p style='font-size:17px;color:#cbd5e1;line-height:1.8;'><b style='color:#f59e0b;'>Token design</b> determines how a token behaves economically. Key variables: total supply, emission schedule, burn mechanisms, vesting schedules for team/investors, and utility requirements.</p><br/><p style='font-size:17px;color:#cbd5e1;line-height:1.8;'><b style='color:#f1f5f9;'>Deflationary</b> tokens (burn > mint) create scarcity over time. BNB burns a portion of exchange fees. Ethereum burns base fees (EIP-1559). <b style='color:#f1f5f9;'>Inflationary</b> tokens fund validators/stakers but dilute holders if emissions exceed demand.</p>",
            [('📉 Deflationary','Burns exceed mints — scarcity grows'),('📈 Inflationary','Emissions fund security — dilutes holders'),('🔒 Vesting','Team tokens locked — reduces dump risk'),('⚙️ Utility','Burning for use = sustainable tokenomics')]),
        make_scene('ccg-s10b','🗳️ Governance Tokens',color,
            'Crypto that gives you voting power over a protocol',
            "<p style='font-size:17px;color:#cbd5e1;line-height:1.8;'><b style='color:#f59e0b;'>Governance tokens</b> give holders the ability to vote on protocol decisions — fee structures, treasury spending, new features, security parameters. Uniswap's UNI, Compound's COMP, Maker's MKR.</p><br/><p style='font-size:17px;color:#cbd5e1;line-height:1.8;'>Risks of governance: voter apathy (most holders don't vote), whale domination (large holders control outcomes), and governance attacks (acquiring enough tokens to pass malicious proposals — this happened to Beanstalk Protocol for $182M).</p>",
            [('🗳️ Vote','Token holders propose and vote'),('🐳 Whale Risk','Large holders dominate outcomes'),('😴 Voter Apathy','Low participation = bad decisions'),('⚔️ Attack','Buy tokens → pass malicious proposal')]),
    ]
    d = insert_before_kc(d, new_scenes)
    save('oc-cryptocurrency-guide', d)

def expand_col_defi():
    d = load('oc-defi-guide')
    color = '#10b981'
    new_scenes = [
        make_scene('cdg-s10','🏦 Lending Protocol Architecture — Aave & Compound',color,
            'How algorithmic interest rates work in practice',
            "<p style='font-size:17px;color:#cbd5e1;line-height:1.8;'>Aave and Compound use <b style='color:#10b981;'>utilization rate</b> to set interest rates algorithmically. Utilization = borrowed / total deposited. When utilization is low, rates are low (incentivize borrowing). As it approaches 100%, rates spike sharply to incentivize repayment and new deposits.</p><br/><p style='font-size:17px;color:#cbd5e1;line-height:1.8;'>Borrowers must maintain a <b style='color:#f1f5f9;'>health factor</b> above 1.0. If collateral value drops below the liquidation threshold, anyone can liquidate the position — taking the collateral at a discount. This keeps the protocol solvent.</p>",
            [('📊 Utilization Rate','Borrowed ÷ Total Deposited'),('📈 Rate Curve','High utilization → high APR'),('⚖️ Health Factor','Must stay above 1.0 or liquidation'),('🤖 Liquidation','Bots monitor and liquidate instantly')]),
        make_scene('cdg-s10b','⚙️ Stablecoin Mechanisms',color,
            'The three models for maintaining a dollar peg',
            "<p style='font-size:17px;color:#cbd5e1;line-height:1.8;'><b style='color:#10b981;'>Fiat-backed (USDT, USDC)</b> — reserves of real dollars back each token 1:1. Centralized, trusted counterparty risk.</p><br/><p style='font-size:17px;color:#cbd5e1;line-height:1.8;'><b style='color:#10b981;'>Crypto-backed (DAI)</b> — over-collateralized with ETH/WBTC. Trustless but capital inefficient (need $150 locked to mint $100 of DAI).</p><br/><p style='font-size:17px;color:#cbd5e1;line-height:1.8;'><b style='color:#10b981;'>Algorithmic (UST/LUNA)</b> — code controls supply via mint/burn with a paired token. Capital efficient but fragile — a death spiral wiped $40B in 72 hours in May 2022.</p>",
            [('💵 Fiat-Backed','1:1 USD reserve — centralized'),('🔒 Crypto-Backed','150%+ collateral — trustless'),('⚙️ Algorithmic','Code-managed supply — high risk'),('💀 Death Spiral','Algo failed: $40B lost in 3 days')]),
    ]
    d = insert_before_kc(d, new_scenes)
    save('oc-defi-guide', d)

def expand_col_trading():
    d = load('oc-trading-guide')
    color = '#3b82f6'
    new_scenes = [
        make_scene('ctg-s10','📐 Position Sizing & Kelly Criterion',color,
            'The math behind how much to risk per trade',
            "<p style='font-size:17px;color:#cbd5e1;line-height:1.8;'>The <b style='color:#3b82f6;'>Kelly Criterion</b> gives the mathematically optimal bet size: f = (bp - q) / b, where b = odds ratio, p = win probability, q = loss probability.</p><br/><p style='font-size:17px;color:#cbd5e1;line-height:1.8;'>In practice, traders use <b style='color:#f1f5f9;'>fractional Kelly</b> (25–50% of full Kelly) to reduce variance. Most professional traders risk 1–2% of account per trade. At 2% risk per trade, you can lose 20 trades in a row and still have 67% of your capital remaining.</p>",
            [('📐 Kelly Formula','f = (bp - q) / b'),('⅓ Fractional Kelly','25-50% of Kelly = lower variance'),('📊 2% Rule','Risk 2% per trade = 50 chances'),('🧮 Math','20 losses in a row = 67% remains')]),
        make_scene('ctg-s10b','🤖 Algorithmic Trading Concepts',color,
            'How systematic strategies remove emotion from trading',
            "<p style='font-size:17px;color:#cbd5e1;line-height:1.8;'><b style='color:#3b82f6;'>Algorithmic trading</b> executes trades based on pre-defined rules — no emotion, no hesitation. Strategies include: trend following (buy when 50MA > 200MA), mean reversion (fade moves beyond 2 standard deviations), arbitrage (exploit price differences across exchanges).</p><br/><p style='font-size:17px;color:#cbd5e1;line-height:1.8;'>Key concepts: <b style='color:#f1f5f9;'>backtesting</b> (test strategy on historical data), <b style='color:#f1f5f9;'>overfitting</b> (strategy works on past data but fails live), <b style='color:#f1f5f9;'>slippage</b> (real execution vs backtest assumptions).</p>",
            [('📊 Trend Following','Buy when price is above MA'),('↩️ Mean Reversion','Fade extremes, expect return to avg'),('⚡ Arbitrage','Buy cheap, sell expensive simultaneously'),('⚠️ Overfitting','Works in backtest, fails in live')]),
    ]
    d = insert_before_kc(d, new_scenes)
    save('oc-trading-guide', d)

def expand_col_ecosystem():
    d = load('oc-ecosystem')
    color = '#06b6d4'
    new_scenes = [
        make_scene('ce-s10','⚖️ Global Regulatory Landscape',color,
            'How different countries are approaching crypto law',
            "<p style='font-size:17px;color:#cbd5e1;line-height:1.8;'><b style='color:#06b6d4;'>United States</b> — the SEC treats most tokens as securities (Howey Test). Ongoing legal battles with major exchanges. Spot Bitcoin and Ethereum ETFs approved in 2024.</p><br/><p style='font-size:17px;color:#cbd5e1;line-height:1.8;'><b style='color:#06b6d4;'>European Union</b> — MiCA (Markets in Crypto-Assets) regulation in effect from 2024. Clear framework for stablecoins and exchanges. Most comprehensive regulatory framework globally.</p><br/><p style='font-size:16px;color:#cbd5e1;'><b style='color:#06b6d4;'>Key insight:</b> Regulatory clarity is bullish long-term — it enables institutional adoption and reduces the \"uncertainty tax\" on crypto valuations.</p>",
            [('🇺🇸 SEC (USA)','Securities law — Howey Test applies'),('🇪🇺 MiCA (EU)','Comprehensive crypto framework 2024'),('🇸🇬 Singapore','Pro-crypto, licensing-based approach'),('📈 Clarity','Regulation enables institutional capital')]),
        make_scene('ce-s10b','🏦 Banking Integration & Payments',color,
            'How crypto and traditional finance are converging',
            "<p style='font-size:17px;color:#cbd5e1;line-height:1.8;'>The clearest near-term use case for crypto in traditional finance is <b style='color:#06b6d4;'>cross-border payments</b>. A wire transfer from the US to the Philippines costs 6–10% in fees and takes 3–5 days. The same transfer on XRP Ledger takes 3–5 seconds and costs fractions of a cent.</p><br/><p style='font-size:17px;color:#cbd5e1;line-height:1.8;'>Ripple's On-Demand Liquidity (ODL) already moves billions in payments for financial institutions. Stablecoins are being integrated into PayPal, Visa, and Mastercard settlement rails. The convergence is accelerating.</p>",
            [('⏱️ Wire Transfer','3-5 days, 6-10% fees'),('⚡ XRPL','3-5 seconds, <$0.01 fees'),('💳 Visa/MC','Stablecoin settlement integration'),('🏦 ODL','Ripple\'s institutional payment rails')]),
    ]
    d = insert_before_kc(d, new_scenes)
    save('oc-ecosystem', d)

def expand_col_xrpl():
    d = load('oc-xrpl-deepdive')
    color = '#38bdf8'
    new_scenes = [
        make_scene('cx-s10','🌉 XRP as Bridge Currency',color,
            'How XRP solves the pre-funding problem in global payments',
            "<p style='font-size:17px;color:#cbd5e1;line-height:1.8;'>Traditional cross-border payments require banks to pre-fund accounts in every currency corridor — locking up trillions of dollars in idle capital. <b style='color:#38bdf8;'>XRP solves this</b> as a real-time bridge currency.</p><br/><p style='font-size:17px;color:#cbd5e1;line-height:1.8;'>Flow: USD → XRP → PHP, all in 3–5 seconds. No pre-funded nostro accounts needed. The liquidity is sourced from market makers who hold XRP. Ripple calls this <b style='color:#f1f5f9;'>On-Demand Liquidity (ODL)</b> — used commercially by MoneyGram, SBI Remit, and 50+ partners.</p>",
            [('🏦 Pre-Funding','Trillions locked in nostro accounts'),('⚡ ODL','USD → XRP → target currency'),('⏱️ 3-5 Seconds','Full settlement, any corridor'),('💰 Savings','Eliminates pre-funded capital requirement')]),
        make_scene('cx-s10b','🔷 XRPL Tokenization & Micropayments',color,
            'The two killer applications beyond payments',
            "<p style='font-size:17px;color:#cbd5e1;line-height:1.8;'><b style='color:#38bdf8;'>Asset Tokenization on XRPL</b> — the ledger supports native token issuance via trust lines. CBDCs, stablecoins, tokenized securities, and RWAs can be issued and traded on XRPL's native DEX. Multiple central banks are piloting XRPL for CBDC issuance.</p><br/><p style='font-size:17px;color:#cbd5e1;line-height:1.8;'><b style='color:#38bdf8;'>Micropayments</b> — XRPL's sub-cent fees make it viable for content monetization at micro-scale: pay $0.001 per article read, stream $0.0001 per second to a creator, tip a musician $0.05 in real-time. Use cases impossible with traditional payment rails.</p>",
            [('🪙 Native Tokens','Issue any asset via trust lines'),('🏦 CBDC','Central banks piloting on XRPL'),('💸 Micropayments','<$0.01 fees enable new business models'),('📡 Streaming','Real-time per-second payments')]),
    ]
    d = insert_before_kc(d, new_scenes)
    save('oc-xrpl-deepdive', d)


# ─────────────────────────────────────────────
# RUN ALL EXPANSIONS
# ─────────────────────────────────────────────

if __name__ == '__main__':
    print('=== Elementary ===')
    expand_elem_blockchain()
    expand_elem_crypto()
    expand_elem_defi()
    expand_elem_trading()
    expand_elem_wallets()
    expand_elem_ecosystem()
    expand_elem_security()

    print('\n=== High School ===')
    expand_hs_blockchain()
    expand_hs_crypto()
    expand_hs_defi()
    expand_hs_trading()
    expand_hs_wallets()
    expand_hs_ecosystem()

    print('\n=== College ===')
    expand_col_blockchain()
    expand_col_crypto()
    expand_col_defi()
    expand_col_trading()
    expand_col_ecosystem()
    expand_col_xrpl()

    print('\nAll classrooms expanded.')
