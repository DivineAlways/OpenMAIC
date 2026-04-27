#!/usr/bin/env python3
"""
Build 3 new Swap & Bridge classrooms:
  - oc-elem-swapbridge  (Elementary)
  - oc-hs-swapbridge    (High School)
  - oc-col-swapbridge   (College)
Run: python3 scripts/build-swapbridge.py
"""
import json, os, re

BASE = os.path.join(os.path.dirname(__file__), '..', 'data', 'classrooms')

def save(name, data):
    path = os.path.join(BASE, f'{name}.json')
    with open(path, 'w') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f'  Saved {name}.json ({len(data["scenes"])} scenes)')

def strip(html):
    text = re.sub(r'<[^>]+>', ' ', html)
    return re.sub(r'\s+', ' ', text).strip()

def make_scene(sid, title, color, subtitle, body_html, cards, order=0):
    elements = [
        {"id":f"{sid}-bar","type":"shape","left":0,"top":0,"width":1000,"height":6,"rotate":0,
         "path":"M 0 0 L 1 0 L 1 1 L 0 1 Z","viewBox":[1,1],"fill":color,"fixedRatio":False},
        {"id":f"{sid}-hbg","type":"shape","left":0,"top":6,"width":1000,"height":96,"rotate":0,
         "path":"M 0 0 L 1 0 L 1 1 L 0 1 Z","viewBox":[1,1],"fill":"#0f1729","fixedRatio":False},
        {"id":f"{sid}-title","type":"text","left":24,"top":16,"width":800,"height":52,"rotate":0,
         "content":f"<p style='font-size:28px;font-weight:800;color:#f1f5f9;'>{title}</p>",
         "defaultFontName":"Inter","defaultColor":"#f1f5f9"},
        {"id":f"{sid}-sub","type":"text","left":24,"top":66,"width":800,"height":30,"rotate":0,
         "content":f"<p style='font-size:13px;color:#64748b;font-weight:500;'>{subtitle}</p>",
         "defaultFontName":"Inter","defaultColor":"#64748b"},
        {"id":f"{sid}-body","type":"text","left":24,"top":120,"width":950,"height":260,"rotate":0,
         "content":body_html,"defaultFontName":"Inter","defaultColor":"#cbd5e1"},
    ]
    card_w = min(200, 900 // max(len(cards),1) - 10)
    card_gap = card_w + 14
    for i, (ct, cv) in enumerate(cards):
        x = 24 + i * card_gap
        elements.append({"id":f"{sid}-box{i+1}","type":"shape","left":x,"top":400,"width":card_w,"height":100,
            "rotate":0,"path":"M 0 0 L 1 0 L 1 1 L 0 1 Z","viewBox":[1,1],"fill":f"{color}20","fixedRatio":False,
            "outline":{"style":"solid","width":1,"color":color}})
        elements.append({"id":f"{sid}-ct{i+1}","type":"text","left":x+8,"top":415,"width":card_w-16,"height":70,
            "rotate":0,"content":f"<p style='font-size:12px;font-weight:700;color:{color};text-align:center;'>{ct}<br/><span style=\"font-weight:400;color:#94a3b8;\">{cv}</span></p>",
            "defaultFontName":"Inter","defaultColor":color})
    actions = [
        {"id":f"action_{sid}_0","type":"spotlight","elementId":f"{sid}-title"},
        {"id":f"action_{sid}_1","type":"speech","text":strip(title)},
        {"id":f"action_{sid}_2","type":"spotlight","elementId":f"{sid}-sub"},
        {"id":f"action_{sid}_3","type":"speech","text":strip(subtitle)},
        {"id":f"action_{sid}_4","type":"spotlight","elementId":f"{sid}-body"},
        {"id":f"action_{sid}_5","type":"speech","text":strip(body_html)},
    ]
    for i, (ct, cv) in enumerate(cards):
        actions.append({"id":f"action_{sid}_{6+i*2}","type":"spotlight","elementId":f"{sid}-ct{i+1}"})
        actions.append({"id":f"action_{sid}_{7+i*2}","type":"speech","text":strip(f"{ct}. {cv}")})
    return {"id":sid,"type":"slide","title":strip(title),"order":order,
        "content":{"type":"slide","canvas":{"id":f"{sid}-canvas","viewportSize":1000,"viewportRatio":0.5625,
            "background":{"type":"solid","color":"#0b1120"},
            "theme":{"backgroundColor":"#0b1120","themeColors":[color,"#3b82f6","#8b5cf6"],"fontColor":"#f1f5f9","fontName":"Inter"},
            "elements":elements}},"actions":actions}

def make_kc(sid, title, color, questions, order=0):
    """Build a knowledge-check quiz scene."""
    q_html = ""
    for i, (q, opts, ans) in enumerate(questions):
        q_html += f"<p style='font-size:15px;font-weight:700;color:#f1f5f9;margin-bottom:4px;'>{i+1}. {q}</p>"
        for opt in opts:
            tick = "✅ " if opt == ans else "◻️ "
            q_html += f"<p style='font-size:13px;color:#94a3b8;margin-left:16px;'>{tick}{opt}</p>"
        q_html += "<br/>"
    elements = [
        {"id":f"{sid}-bar","type":"shape","left":0,"top":0,"width":1000,"height":6,"rotate":0,
         "path":"M 0 0 L 1 0 L 1 1 L 0 1 Z","viewBox":[1,1],"fill":color,"fixedRatio":False},
        {"id":f"{sid}-hbg","type":"shape","left":0,"top":6,"width":1000,"height":96,"rotate":0,
         "path":"M 0 0 L 1 0 L 1 1 L 0 1 Z","viewBox":[1,1],"fill":"#0f1729","fixedRatio":False},
        {"id":f"{sid}-title","type":"text","left":24,"top":16,"width":800,"height":52,"rotate":0,
         "content":f"<p style='font-size:28px;font-weight:800;color:#f1f5f9;'>🎯 {title}</p>",
         "defaultFontName":"Inter","defaultColor":"#f1f5f9"},
        {"id":f"{sid}-sub","type":"text","left":24,"top":66,"width":800,"height":30,"rotate":0,
         "content":f"<p style='font-size:13px;color:#64748b;font-weight:500;'>Test your knowledge</p>",
         "defaultFontName":"Inter","defaultColor":"#64748b"},
        {"id":f"{sid}-body","type":"text","left":24,"top":112,"width":950,"height":440,"rotate":0,
         "content":q_html,"defaultFontName":"Inter","defaultColor":"#cbd5e1"},
    ]
    actions = [
        {"id":f"action_{sid}_0","type":"spotlight","elementId":f"{sid}-title"},
        {"id":f"action_{sid}_1","type":"speech","text":f"Knowledge check. {title}"},
        {"id":f"action_{sid}_2","type":"spotlight","elementId":f"{sid}-body"},
        {"id":f"action_{sid}_3","type":"speech","text":"Review these questions to test what you have learned."},
    ]
    return {"id":sid,"type":"slide","title":title,"order":order,
        "content":{"type":"slide","canvas":{"id":f"{sid}-canvas","viewportSize":1000,"viewportRatio":0.5625,
            "background":{"type":"solid","color":"#0b1120"},
            "theme":{"backgroundColor":"#0b1120","themeColors":[color,"#3b82f6","#8b5cf6"],"fontColor":"#f1f5f9","fontName":"Inter"},
            "elements":elements}},"actions":actions}

def make_classroom(cid, name, description, scenes):
    return {
        "id": cid,
        "createdAt": "2026-04-26T12:00:00.000Z",
        "stage": {
            "id": cid, "name": name, "description": description,
            "createdAt": "2026-04-26T12:00:00.000Z",
            "updatedAt": "2026-04-26T12:00:00.000Z",
            "languageDirective": "en-US", "style": "academic",
            "agentIds": ["default-1","default-2","default-3"],
            "generatedAgentConfigs": []
        },
        "scenes": scenes
    }


# ─────────────────────────────────────────────
# ELEMENTARY — Swapping & Bridging
# ─────────────────────────────────────────────
def build_elem_swapbridge():
    color = '#8b5cf6'
    scenes = [
        make_scene('esb-s1','🔄 What is Swapping?', color,
            'Trading one crypto for another — no bank required',
            "<p style='font-size:17px;color:#cbd5e1;line-height:1.8;'><b style='color:#8b5cf6;'>Swapping</b> simply means exchanging one cryptocurrency for another. You have Bitcoin and want Ethereum? You swap. You have USDC and want XRP? You swap.</p><br/><p style='font-size:17px;color:#cbd5e1;line-height:1.8;'>There are two ways to swap: through a <b style='color:#f1f5f9;'>centralized exchange (CEX)</b> like Coinbase where a company matches buyers and sellers, or through a <b style='color:#f1f5f9;'>decentralized exchange (DEX)</b> where code does it automatically with no middleman.</p>",
            [('💱 Swap','Exchange one crypto for another'),('🏦 CEX Swap','Company matches the trade'),('🤖 DEX Swap','Code executes automatically'),('⚡ Speed','Usually seconds to complete')], 0),

        make_scene('esb-s2','🏦 CEX vs DEX Swaps', color,
            'Two ways to swap — what is the real difference?',
            "<p style='font-size:17px;color:#cbd5e1;line-height:1.8;'><b style='color:#8b5cf6;'>CEX swap</b> — you log into Coinbase, Binance, or Kraken and click swap. Easy. But the exchange holds your funds during the trade. You need an account and ID verification. Fees are usually clear upfront.</p><br/><p style='font-size:17px;color:#cbd5e1;line-height:1.8;'><b style='color:#8b5cf6;'>DEX swap</b> — you connect your own wallet (like MetaMask) to a protocol like Uniswap. No account needed. You stay in control of your funds the entire time. The trade executes via smart contract. The XRPL has a built-in DEX — one of the oldest in crypto.</p>",
            [('🏦 CEX','Exchange holds your funds'),('🔓 DEX','Your wallet, your control'),('📋 CEX','ID required, easy UI'),('🔗 DEX','Wallet only, no account needed')], 1),

        make_scene('esb-s3','🌉 What is a Bridge?', color,
            'Moving crypto from one blockchain to another',
            "<p style='font-size:17px;color:#cbd5e1;line-height:1.8;'>Different blockchains are like different countries — they each have their own currency and rules and they do not automatically talk to each other. Bitcoin cannot natively move to Ethereum. ETH cannot natively move to Solana.</p><br/><p style='font-size:17px;color:#cbd5e1;line-height:1.8;'>A <b style='color:#8b5cf6;'>bridge</b> is a protocol that connects two blockchains. You lock your tokens on Chain A, and the bridge mints an equivalent on Chain B. When you are done, you burn the tokens on Chain B and unlock your originals on Chain A.</p>",
            [('🔒 Lock','Tokens locked on Chain A'),('🪙 Mint','Wrapped token created on Chain B'),('🔥 Burn','Return wrapped token to bridge'),('🔓 Unlock','Original tokens released on Chain A')], 2),

        make_scene('esb-s4','⚠️ Swap & Bridge Risks for Beginners', color,
            'The mistakes that cost people money — and how to avoid them',
            "<p style='font-size:17px;color:#cbd5e1;line-height:1.8;'><b style='color:#8b5cf6;'>Wrong network</b> — the most common beginner mistake. Sending ETH on the Ethereum network to an address expecting ETH on Arbitrum. The funds appear to vanish. Always confirm the network before sending.</p><br/><p style='font-size:17px;color:#cbd5e1;line-height:1.8;'><b style='color:#8b5cf6;'>Slippage</b> — your swap executes at a slightly worse price than shown because the market moved. Set slippage tolerance carefully.</p><br/><p style='font-size:17px;color:#cbd5e1;line-height:1.8;'><b style='color:#8b5cf6;'>Bridge hacks</b> — bridges hold large amounts of locked tokens, making them high-value targets. Over $2B was stolen from bridges in 2022 alone. Use only well-established, audited bridges.</p>",
            [('🌐 Wrong Network','Always confirm chain before sending'),('📉 Slippage','Price moves between click and confirm'),('🔓 Bridge Hack','Bridges are high-value targets'),('✅ Safety','Use only established, audited bridges')], 3),

        make_kc('esb-s5','Knowledge Check — Swapping & Bridging', color,
            [('What is swapping?', ['Staking your crypto for rewards','Exchanging one crypto for another','Sending crypto to a friend','Mining new coins'], 'Exchanging one crypto for another'),
             ('What does a bridge do?', ['Converts USD to crypto','Connects two different blockchains','Speeds up transactions','Reduces gas fees'], 'Connects two different blockchains'),
             ('What is the most common beginner bridge mistake?', ['Paying too much in fees','Sending on the wrong network','Using a DEX instead of CEX','Swapping too fast'], 'Sending on the wrong network')], 4),
    ]
    d = make_classroom('oc-elem-swapbridge', 'Swapping & Bridging (Elementary)',
        'What swapping and bridging are, CEX vs DEX swaps, how bridges work, and the risks beginners must know.', scenes)
    save('oc-elem-swapbridge', d)


# ─────────────────────────────────────────────
# HIGH SCHOOL — Swapping & Bridging
# ─────────────────────────────────────────────
def build_hs_swapbridge():
    color = '#f97316'
    scenes = [
        make_scene('hsb-s1','⚙️ How DEX Swaps Actually Work', color,
            'The mechanics behind every decentralized swap',
            "<p style='font-size:17px;color:#cbd5e1;line-height:1.8;'>When you swap on a DEX like Uniswap, you are trading against a <b style='color:#f97316;'>liquidity pool</b> — not another person. The pool holds two tokens (e.g. ETH + USDC). The price is set by the ratio: <b style='color:#f1f5f9;'>x × y = k</b>. You add one token, the other comes out, and the ratio adjusts.</p><br/><p style='font-size:17px;color:#cbd5e1;line-height:1.8;'>A <b style='color:#f97316;'>DEX aggregator</b> (like 1inch) routes your swap across multiple pools simultaneously to find the best price. Instead of one pool, it might split your trade across five to minimize slippage.</p>",
            [('🫙 Liquidity Pool','The reserve you trade against'),('📐 x×y=k','Constant product formula'),('🔀 Aggregator','Routes across multiple pools'),('💰 LP Fee','0.05–1% per swap to LPs')], 0),

        make_scene('hsb-s2','🔀 Liquidity Routing & Price Impact', color,
            'Why large swaps get worse prices — and how routing fixes it',
            "<p style='font-size:17px;color:#cbd5e1;line-height:1.8;'><b style='color:#f97316;'>Price impact</b> is the effect your trade has on the pool price. A small swap barely moves the ratio. A large swap significantly shifts it — you end up paying more per token as the pool rebalances against you.</p><br/><p style='font-size:17px;color:#cbd5e1;line-height:1.8;'>Formula: the deeper the pool (more liquidity), the lower your price impact. A $1M pool can absorb a $10k swap with minimal impact. A $50k pool would move dramatically on that same trade.</p><br/><p style='font-size:16px;color:#f59e0b;'>Pro tip: always check the price impact % before confirming a swap. Above 1% is high. Above 3% is a red flag for smaller tokens.</p>",
            [('📉 Price Impact','Your trade moves the pool ratio'),('💧 Deep Pool','Large pool = low impact'),('🏜️ Shallow Pool','Small pool = high impact'),('⚠️ 3%+ Impact','Red flag — find more liquidity')], 1),

        make_scene('hsb-s3','🌉 Bridge Architecture', color,
            'How bridges lock, mint, and release tokens across chains',
            "<p style='font-size:17px;color:#cbd5e1;line-height:1.8;'>There are two main bridge designs:</p><br/><p style='font-size:17px;color:#cbd5e1;line-height:1.8;'><b style='color:#f97316;'>Lock & Mint</b> — tokens are locked in a smart contract on the source chain. Equivalent wrapped tokens are minted on the destination chain. To return: burn the wrapped tokens, unlock the originals. This is how WBTC (Wrapped Bitcoin) works on Ethereum.</p><br/><p style='font-size:17px;color:#cbd5e1;line-height:1.8;'><b style='color:#f97316;'>Liquidity Pool Bridge</b> — instead of locking/minting, the bridge uses pre-funded liquidity pools on both chains. You deposit on Chain A, someone withdraws from a pool on Chain B. Faster but requires deep liquidity on both sides.</p>",
            [('🔒 Lock & Mint','WBTC model — most common'),('🌊 LP Bridge','Pre-funded pools, faster'),('⛓️ Canonical Bridge','Official chain bridge, slowest but safest'),('⚡ Third-Party','Faster but adds smart contract risk')], 2),

        make_scene('hsb-s4','🪙 Wrapped Tokens Explained', color,
            'What they are, why they exist, and what the risks are',
            "<p style='font-size:17px;color:#cbd5e1;line-height:1.8;'>A <b style='color:#f97316;'>wrapped token</b> is a representation of one asset on a different blockchain. WBTC is Bitcoin on Ethereum. WETH is Ethereum on other chains. They maintain a 1:1 peg with the original.</p><br/><p style='font-size:17px;color:#cbd5e1;line-height:1.8;'>Why this matters: the wrapped token is only as safe as the bridge that issued it. If the bridge is hacked and the locked originals are stolen, the wrapped tokens become worthless instantly. This is what happened in the Ronin bridge hack ($625M stolen) and the Wormhole exploit ($320M).</p>",
            [('🎁 Wrapped','Represents original token on new chain'),('1:1 Peg','Should equal original in value'),('🔗 Bridge Risk','Hack = wrapped token worthless'),('📊 Examples','WBTC, WETH, WXRP')], 3),

        make_scene('hsb-s5','💸 Cross-Chain Fees & Impermanent Loss in Swaps', color,
            'The true cost of bridging and swapping',
            "<p style='font-size:17px;color:#cbd5e1;line-height:1.8;'>Every bridge or swap has multiple cost layers that beginners miss:</p><br/><p style='font-size:17px;color:#cbd5e1;line-height:1.8;'><b style='color:#f97316;'>Source chain gas</b> — fee to initiate the bridge transaction. <b style='color:#f97316;'>Bridge fee</b> — the protocol's cut (usually 0.05–0.3%). <b style='color:#f97316;'>Destination chain gas</b> — fee to receive on the other side. For Ethereum mainnet bridges, total costs can easily exceed $30–50. For XRPL, total fees are under $0.01.</p><br/><p style='font-size:17px;color:#cbd5e1;line-height:1.8;'>Impermanent loss also applies if you are providing liquidity to a bridge's LP pool — the same divergence risk as any AMM pool.</p>",
            [('⛽ Source Gas','Fee on originating chain'),('🌉 Bridge Fee','Protocol cut 0.05–0.3%'),('⛽ Dest Gas','Fee on receiving chain'),('💸 XRPL','Total fees under $0.01')], 4),

        make_kc('hsb-s6','Knowledge Check — Swapping & Bridging (High School)', color,
            [('What formula governs AMM swap pricing?', ['p = supply / demand','x × y = k','price = fees / volume','APY = rewards / TVL'], 'x × y = k'),
             ('What is a wrapped token?', ['A token with extra security features','A representation of one token on a different blockchain','A stablecoin pegged to another crypto','A governance token for bridges'], 'A representation of one token on a different blockchain'),
             ('What made the Ronin bridge hack possible?', ['Slippage was too high','The bridge smart contract held large locked funds','The wrapped tokens were minted incorrectly','The DEX aggregator routed poorly'], 'The bridge smart contract held large locked funds'),
             ('What is price impact in a DEX swap?', ['The fee charged by the protocol','How much your trade moves the pool price','The difference between CEX and DEX prices','Gas cost on the destination chain'], 'How much your trade moves the pool price')], 5),
    ]
    d = make_classroom('oc-hs-swapbridge', 'Swapping & Bridging (High School)',
        'DEX mechanics, AMM pricing, liquidity routing, bridge architecture, wrapped tokens, cross-chain fees, and impermanent loss in swaps.', scenes)
    save('oc-hs-swapbridge', d)


# ─────────────────────────────────────────────
# COLLEGE — Swapping & Bridging
# ─────────────────────────────────────────────
def build_col_swapbridge():
    color = '#38bdf8'
    scenes = [
        make_scene('csb-s1','📐 AMM Deep Dive — Concentrated Liquidity', color,
            'How Uniswap V3 transformed capital efficiency',
            "<p style='font-size:17px;color:#cbd5e1;line-height:1.8;'>Uniswap V2 spread liquidity across the entire price curve (0 to ∞), meaning most capital sat unused at extreme prices. <b style='color:#38bdf8;'>Uniswap V3 introduced concentrated liquidity</b> — LPs choose a specific price range to deploy capital. A position active from $1,800–$2,200 ETH provides the same depth as a V2 position 4,000× larger.</p><br/><p style='font-size:17px;color:#cbd5e1;line-height:1.8;'>Trade-off: concentrated positions earn more fees when price stays in range — but suffer higher impermanent loss when price exits the range. LPs must actively manage their ranges or use automated range managers.</p>",
            [('📊 V2','Liquidity spread 0 to infinity'),('🎯 V3 Concentrated','Capital in chosen price range'),('📈 Capital Efficiency','Up to 4000× more efficient'),('⚠️ Active Mgmt','Ranges need rebalancing as price moves')], 0),

        make_scene('csb-s2','⚡ MEV — Maximal Extractable Value in Swaps', color,
            'How bots exploit your swap before it confirms',
            "<p style='font-size:17px;color:#cbd5e1;line-height:1.8;'><b style='color:#38bdf8;'>MEV (Maximal Extractable Value)</b> is value extracted by block producers (miners/validators) or bots by reordering, inserting, or censoring transactions within a block.</p><br/><p style='font-size:17px;color:#cbd5e1;line-height:1.8;'><b style='color:#f1f5f9;'>Sandwich attack</b>: a bot detects your large pending swap → front-runs it (buys before you, pushing price up) → your swap executes at a worse price → bot sells immediately after (back-run). You pay more, bot profits. Estimated $1B+ extracted from Ethereum users annually.</p><br/><p style='font-size:16px;color:#38bdf8;'>Mitigation: use private mempools (Flashbots Protect), set low slippage tolerance, or use MEV-resistant DEXs.</p>",
            [('👀 Mempool','Pending txs visible to bots'),('⬆️ Front-Run','Bot buys before your tx'),('⬇️ Back-Run','Bot sells after your tx'),('🛡️ Protect','Flashbots / private mempool')], 1),

        make_scene('csb-s3','🔐 Bridge Security Models', color,
            'The trust assumptions behind every bridge design',
            "<p style='font-size:17px;color:#cbd5e1;line-height:1.8;'>Every bridge makes a trust trade-off. Understanding these models is critical before bridging large amounts.</p><br/><p style='font-size:17px;color:#cbd5e1;line-height:1.8;'><b style='color:#38bdf8;'>Externally Validated (most common)</b> — a multisig of validators attests to events on both chains. Ronin used 9-of-15 validators, 5 were controlled by Axie — hack was inevitable. <b style='color:#38bdf8;'>Optimistic bridges</b> (Across, Hop) — assume validity, allow fraud proofs within a window. Slower but more decentralized. <b style='color:#38bdf8;'>ZK bridges</b> — use zero-knowledge proofs to cryptographically verify the source chain state. Most secure, computationally expensive, still maturing.</p>",
            [('🔑 Multisig','Validators attest — centralization risk'),('⏳ Optimistic','Fraud proof window — slower but safer'),('🔮 ZK Bridge','Cryptographic proof — most secure'),('💀 Ronin','$625M: 5/9 validators compromised')], 2),

        make_scene('csb-s4','🔀 Cross-Chain Slippage Strategies', color,
            'How professionals minimize cost when moving capital across chains',
            "<p style='font-size:17px;color:#cbd5e1;line-height:1.8;'>Large cross-chain moves require careful execution. Strategies used by institutions and advanced traders:</p><br/><p style='font-size:17px;color:#cbd5e1;line-height:1.8;'><b style='color:#38bdf8;'>TWAP bridging</b> — split large amounts across multiple transactions over time to reduce price impact on each leg. <b style='color:#38bdf8;'>Canonical + DEX routing</b> — use the official canonical bridge (slower, safer, cheaper for large amounts) then swap on destination chain DEX. <b style='color:#38bdf8;'>Stablecoin bridging</b> — convert to USDC/USDT first (no price risk during transit), bridge the stablecoin, swap on arrival. XRPL's Automated Market Maker and native DEX allow atomic cross-asset settlement in one transaction.</p>",
            [('⏱️ TWAP Bridge','Split large moves over time'),('🔗 Canonical','Official bridge = safer for large amounts'),('💵 Stablecoin Route','Bridge stable, swap on arrival'),('⚛️ XRPL AMM','Atomic cross-asset settlement')], 3),

        make_scene('csb-s5','🌐 XRPL Native DEX & Bridging Architecture', color,
            'How the XRP Ledger handles swaps and cross-chain settlement natively',
            "<p style='font-size:17px;color:#cbd5e1;line-height:1.8;'>The XRPL has a <b style='color:#38bdf8;'>native DEX built directly into the ledger protocol</b> — not a smart contract on top. Every account can place limit orders and the ledger automatically matches them during consensus. No MEV, no front-running, no sandwich attacks.</p><br/><p style='font-size:17px;color:#cbd5e1;line-height:1.8;'>XRPL's <b style='color:#f1f5f9;'>pathfinding</b> enables atomic multi-hop swaps: XRP → USD → EUR in a single transaction. Combined with the AMM (added in 2024), XRPL offers both order book and AMM liquidity simultaneously — a unique dual-liquidity model no other L1 has natively.</p>",
            [('📒 Native Order Book','Built into consensus, no contract'),('🔀 Pathfinding','Multi-hop atomic swaps'),('🤖 AMM','Added 2024 — AMM + order book'),('🛡️ No MEV','Protocol-level fairness')], 4),

        make_scene('csb-s6','📊 Slippage Tolerance & Advanced Swap Settings', color,
            'The parameters every advanced trader should understand and set correctly',
            "<p style='font-size:17px;color:#cbd5e1;line-height:1.8;'><b style='color:#38bdf8;'>Slippage tolerance</b> is the maximum price movement you accept between signing and execution. Too tight (0.1%) and your swap reverts. Too loose (10%) and MEV bots will exploit the gap.</p><br/><p style='font-size:17px;color:#cbd5e1;line-height:1.8;'><b style='color:#38bdf8;'>Deadline</b> — transaction auto-reverts if not confirmed within N minutes. Prevents stale transactions from executing hours later at a completely different price.</p><br/><p style='font-size:17px;color:#cbd5e1;line-height:1.8;'><b style='color:#38bdf8;'>Gas price</b> — higher gas = faster confirmation = less price drift. On high-fee chains, timing your swap during low-congestion periods can save 70–80% on gas.</p>",
            [('📉 Slippage','Max price move you accept'),('⏰ Deadline','Auto-revert if not confirmed in time'),('⛽ Gas Timing','Low congestion = 70-80% gas savings'),('🛡️ Tight Slippage','Protects against MEV sandwich')], 5),

        make_kc('csb-s7','Knowledge Check — Swapping & Bridging (College)', color,
            [('What is a sandwich attack in MEV?', ['Two bridges wrapping the same token','Bot front-runs then back-runs your swap','A failed bridge transaction between two chains','Splitting a swap across multiple pools'], 'Bot front-runs then back-runs your swap'),
             ('What makes ZK bridges the most secure bridge type?', ['They use multisig validators','They have longer fraud proof windows','They use cryptographic proofs to verify source chain state','They require no gas on the destination chain'], 'They use cryptographic proofs to verify source chain state'),
             ('What is Uniswap V3\'s concentrated liquidity?', ['Liquidity spread across the entire price curve','Capital deployed only within a chosen price range','A bridge design using locked and minted tokens','A zero-knowledge proof for swap verification'], 'Capital deployed only within a chosen price range'),
             ('What makes XRPL\'s DEX unique compared to Uniswap?', ['It uses concentrated liquidity','It is built into the ledger protocol with no smart contract layer','It has higher fees but more security','It only supports XRP pairs'], 'It is built into the ledger protocol with no smart contract layer')], 6),
    ]
    d = make_classroom('oc-col-swapbridge', 'Swapping & Bridging (College)',
        'Concentrated liquidity, MEV sandwich attacks, bridge security models, cross-chain slippage strategies, XRPL native DEX architecture, and advanced swap settings.', scenes)
    save('oc-col-swapbridge', d)


if __name__ == '__main__':
    print('=== Building Swap & Bridge Classrooms ===')
    build_elem_swapbridge()
    build_hs_swapbridge()
    build_col_swapbridge()
    print('\nDone.')
