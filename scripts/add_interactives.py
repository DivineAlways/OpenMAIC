#!/usr/bin/env python3
"""Add unique interactive scenes to all OpenMAIC classrooms that are missing them."""

import json
import os
import glob

CLASSROOMS_DIR = os.path.join(os.path.dirname(__file__), '..', 'data', 'classrooms')

CSS = """body{background:#0b1120;color:#e2e8f0;font-family:Inter,system-ui,sans-serif;padding:20px;margin:0;}
h2{font-size:18px;margin:0 0 4px;}
.sub{color:#64748b;font-size:12px;margin-bottom:16px;}
.row{display:flex;gap:12px;margin-bottom:12px;flex-wrap:wrap;}
.panel{background:#0f1f3d;border:1px solid #1e3a5f;border-radius:8px;padding:14px;flex:1;min-width:220px;}
label{color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:1px;display:block;margin-bottom:6px;}
input,select{width:100%;padding:8px 10px;background:#020817;border:1px solid #334155;color:#f1f5f9;border-radius:6px;font-size:13px;box-sizing:border-box;}
input[type=range]{padding:0;}
.result{background:#020817;border:1px solid #334155;border-radius:6px;padding:10px;font-size:13px;margin-top:8px;}
.big{font-size:22px;font-weight:800;}
.stat{display:inline-block;background:#1e3a5f;border-radius:4px;padding:3px 10px;font-size:11px;font-weight:700;color:#60a5fa;margin:3px 2px;}
.good{color:#22c55e;}.bad{color:#ef4444;}.warn{color:#f59e0b;}
.btn{background:#3b82f6;color:#fff;border:none;padding:7px 18px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:700;margin-top:8px;}
.btn:hover{opacity:0.85;}
.grid{display:grid;gap:8px;}
.item{background:#020817;border:1px solid #334155;border-radius:6px;padding:8px 12px;font-size:12px;}"""

def html(title, color, body_js):
    return f"""<!DOCTYPE html>
<html>
<head>
<style>
{CSS}
h2{{color:{color};}}
</style>
</head>
<body>
{body_js}
</body>
</html>"""


INTERACTIVES = {
    # ── Elementary ──────────────────────────────────────────────────────────────
    "oc-elem-blockchain": {
        "title": "Interactive: Block Builder",
        "color": "#60a5fa",
        "body": """<h2>🧱 Block Builder</h2>
<p class="sub">Add transactions from the mempool into your block. Fill it up, then seal it to get a hash.</p>
<div class="row">
  <div class="panel">
    <label>Mempool (click to add)</label>
    <div id="pool" class="grid"></div>
  </div>
  <div class="panel">
    <label>Your Block (<span id="cnt">0</span>/3 transactions)</label>
    <div id="block" class="grid"></div>
    <button class="btn" id="sealBtn" onclick="seal()" disabled>🔒 Seal & Generate Hash</button>
    <div class="result" id="hashResult" style="display:none;"></div>
  </div>
</div>
<button class="btn" onclick="reset()" style="background:#334155;">↺ Reset</button>
<script>
const TXS=["Alice→Bob: 5 XRP","Carol→Dave: 12 XRP","Eve→Frank: 3 XRP","Grace→Hank: 20 XRP","Ivan→Julia: 7 XRP"];
let pool=[...TXS],block=[],sealed=false;
function fakeHash(s){let h=0;for(let i=0;i<s.length;i++)h=(Math.imul(31,h)+s.charCodeAt(i))|0;return Math.abs(h).toString(16).padStart(8,'0').repeat(8);}
function render(){
  const p=document.getElementById('pool'),b=document.getElementById('block');
  p.innerHTML=pool.map(t=>`<div class="item" style="cursor:${block.length>=3||sealed?'default':'pointer'};opacity:${block.length>=3&&!sealed?0.4:1}" onclick="${sealed?'':'addTx(\"'+t+'\")'}">${t} <span style="float:right;color:#3b82f6">+</span></div>`).join('');
  b.innerHTML=block.map(t=>`<div class="item">${t}${sealed?'':' <span style="float:right;color:#ef4444;cursor:pointer" onclick="removeTx(\''+t+'\')">×</span>'}</div>`).join('');
  document.getElementById('cnt').textContent=block.length;
  document.getElementById('sealBtn').disabled=block.length===0||sealed;
}
function addTx(t){if(block.length>=3||sealed)return;block.push(t);pool=pool.filter(x=>x!==t);render();}
function removeTx(t){if(sealed)return;pool.push(t);block=block.filter(x=>x!==t);render();}
function seal(){sealed=true;const h=fakeHash(block.join('|'));document.getElementById('hashResult').style.display='block';document.getElementById('hashResult').innerHTML='<span class="good" style="font-size:10px;word-break:break-all;">'+h+'</span><br/><span style="font-size:11px;color:#64748b;margin-top:4px;display:block;">Change any transaction → completely different hash. That\'s how blockchains stay tamper-proof.</span>';render();}
function reset(){pool=[...TXS];block=[];sealed=false;document.getElementById('hashResult').style.display='none';render();}
render();
</script>"""
    },

    "oc-elem-crypto": {
        "title": "Interactive: Coin vs Token Sorter",
        "color": "#f59e0b",
        "body": """<h2>🪙 Coin vs Token Sorter</h2>
<p class="sub">A <b>coin</b> has its own blockchain. A <b>token</b> lives on another chain. Tap each to classify it.</p>
<div class="row">
  <div class="panel" id="items"></div>
  <div class="panel">
    <div style="margin-bottom:12px;">
      <p style="color:#f59e0b;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Coins</p>
      <div id="coins" class="grid" style="min-height:40px;"></div>
    </div>
    <div>
      <p style="color:#60a5fa;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Tokens</p>
      <div id="tokens" class="grid" style="min-height:40px;"></div>
    </div>
    <div class="result" id="scoreBox" style="display:none;"></div>
  </div>
</div>
<button class="btn" onclick="checkAll()" style="margin-right:8px;">Check Answers</button>
<button class="btn" onclick="resetQ()" style="background:#334155;">Reset</button>
<script>
const ITEMS=[
  {name:"Bitcoin (BTC)",coin:true,hint:"Own blockchain — the Bitcoin network"},
  {name:"Ethereum (ETH)",coin:true,hint:"Powers its own blockchain"},
  {name:"XRP",coin:true,hint:"Native to the XRP Ledger"},
  {name:"USDC",coin:false,hint:"ERC-20 token on Ethereum"},
  {name:"UNI (Uniswap)",coin:false,hint:"Governance token on Ethereum"},
  {name:"Solana (SOL)",coin:true,hint:"Own high-speed blockchain"},
  {name:"SHIB",coin:false,hint:"ERC-20 meme token on Ethereum"},
  {name:"LINK (Chainlink)",coin:false,hint:"Utility token on Ethereum"},
];
let answers={};
function render(){
  document.getElementById('items').innerHTML='<label>Click to sort:</label>'+ITEMS.map(i=>`<div class="item" style="cursor:pointer;margin-bottom:4px;" onclick="cycle('${i.name}')" id="i_${i.name.replace(/[^a-z]/gi,'_')}">${i.name}</div>`).join('');
  document.getElementById('coins').innerHTML='';
  document.getElementById('tokens').innerHTML='';
  document.getElementById('scoreBox').style.display='none';
  answers={};
}
function cycle(name){
  if(answers[name]===undefined)answers[name]=true;
  else if(answers[name]===true)answers[name]=false;
  else{delete answers[name];}
  updateBuckets();
}
function updateBuckets(){
  document.getElementById('coins').innerHTML=ITEMS.filter(i=>answers[i.name]===true).map(i=>`<div class="item" style="color:#f59e0b">${i.name}</div>`).join('');
  document.getElementById('tokens').innerHTML=ITEMS.filter(i=>answers[i.name]===false).map(i=>`<div class="item" style="color:#60a5fa">${i.name}</div>`).join('');
}
function checkAll(){
  let correct=0;
  ITEMS.forEach(i=>{if(answers[i.name]===i.coin)correct++;});
  const pct=Math.round(correct/ITEMS.length*100);
  document.getElementById('scoreBox').style.display='block';
  document.getElementById('scoreBox').innerHTML=`<span class="big ${pct>=75?'good':'warn'}">${correct}/${ITEMS.length}</span><br/>`+ITEMS.map(i=>`<span class="stat ${answers[i.name]===i.coin?'good':'bad'}">${i.name}: ${i.hint}</span>`).join(' ');
}
function resetQ(){render();}
render();
</script>"""
    },

    "oc-elem-defi": {
        "title": "Interactive: Bank vs DeFi Comparison",
        "color": "#22d3ee",
        "body": """<h2>🏦 Bank vs DeFi — Flip & Compare</h2>
<p class="sub">Click each card to reveal how DeFi compares to traditional banking on that topic.</p>
<div id="cards" class="row" style="flex-wrap:wrap;gap:8px;"></div>
<div class="result" id="done" style="display:none;margin-top:8px;"></div>
<script>
const CARDS=[
  {topic:"Hours",bank:"Mon–Fri 9am–5pm only",defi:"Open 24/7/365 — never closes"},
  {topic:"Who can join?",bank:"Need ID, credit check, approval",defi:"Anyone with a crypto wallet, worldwide"},
  {topic:"Savings rate",bank:"0.01–0.5% APY (US average)",defi:"4–20%+ APY (varies by protocol)"},
  {topic:"Who holds funds?",bank:"The bank — you trust them",defi:"You — smart contracts, self-custody"},
  {topic:"Transfer speed",bank:"1–5 business days",defi:"Seconds — no middlemen"},
  {topic:"Failure risk",bank:"Can fail (FDIC covers $250k)",defi:"Smart contract bugs, no insurance"},
];
let seen=new Set();
function render(){
  document.getElementById('cards').innerHTML=CARDS.map((c,i)=>`
    <div style="flex:1;min-width:140px;background:${seen.has(i)?'#0f1f3d':'#1e3a5f'};border:1px solid #334155;border-radius:8px;padding:12px;cursor:pointer;" onclick="flip(${i})">
      <p style="font-size:11px;font-weight:700;text-transform:uppercase;color:#94a3b8;margin:0 0 6px;">${c.topic}</p>
      ${seen.has(i)?`<p style="font-size:11px;color:#ef4444;margin:0 0 4px;">🏦 ${c.bank}</p><p style="font-size:11px;color:#22c55e;margin:0;">⚡ ${c.defi}</p>`:'<p style="font-size:12px;color:#3b82f6;margin:0;">Tap to compare →</p>'}
    </div>`).join('');
  if(seen.size===CARDS.length){
    document.getElementById('done').style.display='block';
    document.getElementById('done').innerHTML='<span class="good" style="font-weight:700;">All compared!</span> DeFi removes middlemen but adds smart contract risk. Neither is always better — know both sides.';
  }
}
function flip(i){seen.add(i);render();}
render();
</script>"""
    },

    "oc-elem-trading": {
        "title": "Interactive: Trade Decision Game",
        "color": "#a78bfa",
        "body": """<h2>📈 Trade Decision Game</h2>
<p class="sub">Read the scenario. Would you Buy, Sell, or Hold? Learn the reasoning behind each call.</p>
<div id="game"></div>
<script>
const SCENARIOS=[
  {title:"Bitcoin hits all-time high",desc:"BTC just broke its ATH. Volume is 3× normal. Social media is extremely bullish.",correct:"Hold",reason:"Chasing ATH breakouts is dangerous — extreme greed often precedes corrections. Holding protects gains without FOMO."},
  {title:"Coin drops 40% on false rumor",desc:"A top coin crashed 40% on a rumor later debunked. Project fundamentals unchanged.",correct:"Buy",reason:"Rumor-driven crashes on solid projects are often buying opportunities — price typically recovers when facts emerge."},
  {title:"Meme coin up 300% in a week",desc:"You're sitting on 300% gains. Social hype is massive. Everyone is talking about it.",correct:"Sell",reason:"Meme coins are pure sentiment. Taking profits at 300% during peak hype is smart risk management."},
  {title:"Market flat for 3 weeks",desc:"No major news. Your portfolio is unchanged. A friend says 'alt season is coming any day.'",correct:"Hold",reason:"Consolidation is normal. Acting on rumors shakes you out before the real move. Stay the course."},
  {title:"Major network upgrade goes live",desc:"ETH upgrade launches successfully. Gas fees drop 80%. ETH already up 20% this week.",correct:"Hold",reason:"'Buy the rumor, sell the news' — the 20% move already priced in the upgrade. Chasing amplifies risk."},
];
let idx=0,chosen=null,score=0;
function render(){
  if(idx>=SCENARIOS.length){
    document.getElementById('game').innerHTML=`<div class="result"><span class="big ${score>=4?'good':'warn'}">${score}/5</span><br/><p style="font-size:13px;color:#94a3b8;margin:8px 0 0;">${score===5?'Perfect discipline! Pro-level thinking.':score>=3?'Good instincts — review the ones you missed.':'Trading psychology is hard. Review each scenario.'}</p><button class="btn" onclick="resetGame()" style="margin-top:8px;">Play Again</button></div>`;
    return;
  }
  const s=SCENARIOS[idx];
  document.getElementById('game').innerHTML=`
    <div class="panel" style="margin-bottom:12px;">
      <p style="font-weight:700;font-size:14px;margin:0 0 6px;">${s.title}</p>
      <p style="font-size:12px;color:#94a3b8;margin:0;">${s.desc}</p>
    </div>
    <div class="row" style="gap:8px;">
      ${['Buy','Sell','Hold'].map(a=>`<button class="btn" style="flex:1;background:${a==='Buy'?'#166534':a==='Sell'?'#7f1d1d':'#1e3a5f'}" onclick="answer('${a}')">${a}</button>`).join('')}
    </div>
    <div id="fb" style="display:none;margin-top:8px;"></div>`;
}
function answer(a){
  if(chosen)return;chosen=a;
  const s=SCENARIOS[idx];
  const ok=a===s.correct;
  if(ok)score++;
  document.getElementById('fb').style.display='block';
  document.getElementById('fb').innerHTML=`<div class="result"><span class="${ok?'good':'bad'}" style="font-weight:700;">${ok?'✓ Correct!':'✗ Best answer: '+s.correct}</span><br/><p style="font-size:12px;color:#94a3b8;margin:6px 0 0;">${s.reason}</p><button class="btn" onclick="next()" style="margin-top:8px;">${idx+1<SCENARIOS.length?'Next →':'See Results'}</button></div>`;
}
function next(){idx++;chosen=null;render();}
function resetGame(){idx=0;chosen=null;score=0;render();}
render();
</script>"""
    },

    "oc-elem-ecosystem": {
        "title": "Interactive: NFT Minter",
        "color": "#c084fc",
        "body": """<h2>🎨 NFT Minter</h2>
<p class="sub">Pick traits for your NFT, then mint it. See how token IDs, metadata, and ownership work on-chain.</p>
<div class="row">
  <div class="panel">
    <label>Choose Traits</label>
    <div id="traits"></div>
    <button class="btn" id="mintBtn" onclick="mint()">🚀 Mint NFT</button>
  </div>
  <div class="panel">
    <label>Preview</label>
    <div id="preview" style="min-height:80px;text-align:center;font-size:36px;padding:16px;"></div>
    <div id="metadata" style="display:none;"></div>
  </div>
</div>
<script>
const TRAITS={background:["🌌 Deep Space","🌊 Ocean Blue","🌅 Sunset","🌿 Forest"],body:["🤖 Robot","👽 Alien","🐱 Cat","🦊 Fox"],eyes:["👁️ Laser","😎 Cool Shades","🌀 Hypno","💎 Diamond"],accessory:["🎩 Top Hat","⛓️ Gold Chain","🪄 Magic Staff","🎸 Guitar"]};
let sel={background:0,body:0,eyes:0,accessory:0},minted=false;
const tid=Math.floor(Math.random()*9999)+1;
const txHash='0x'+Array.from({length:40},()=>'0123456789abcdef'[Math.floor(Math.random()*16)]).join('');
function renderTraits(){
  document.getElementById('traits').innerHTML=Object.entries(TRAITS).map(([k,opts])=>`
    <div style="margin-bottom:8px;">
      <p style="font-size:10px;text-transform:uppercase;color:#64748b;margin:0 0 3px;">${k}</p>
      <div style="display:flex;gap:4px;flex-wrap:wrap;">
        ${opts.map((o,i)=>`<button onclick="pick('${k}',${i})" style="font-size:11px;padding:3px 8px;border-radius:6px;border:1px solid ${sel[k]===i?'#a78bfa':'#334155'};background:${sel[k]===i?'#4c1d95':'#020817'};color:#f1f5f9;cursor:pointer;">${o.split(' ')[0]}</button>`).join('')}
      </div>
    </div>`).join('');
  const emojis=Object.keys(TRAITS).map(k=>TRAITS[k][sel[k]].split(' ')[0]);
  document.getElementById('preview').textContent=emojis.join(' ');
}
function pick(k,i){if(minted)return;sel[k]=i;renderTraits();}
function mint(){
  minted=true;
  document.getElementById('mintBtn').disabled=true;
  const meta=Object.entries(TRAITS).map(([k,opts])=>`<div class="item" style="font-size:11px;margin-bottom:4px;"><b style="color:#a78bfa">${k}:</b> ${opts[sel[k]].split(' ').slice(1).join(' ')}</div>`).join('');
  document.getElementById('metadata').style.display='block';
  document.getElementById('metadata').innerHTML=`
    <div class="result" style="margin-top:8px;">
      <p style="color:#22c55e;font-size:11px;font-weight:700;">✓ Minted — Token #${tid}</p>
      <p style="font-size:10px;font-family:monospace;color:#64748b;word-break:break-all;">${txHash.slice(0,42)}...</p>
      ${meta}
      <p style="font-size:11px;color:#64748b;margin-top:6px;">These traits are stored as metadata on-chain forever. The token ID is unique — no one else has #${tid}. You own it.</p>
    </div>`;
}
renderTraits();
</script>"""
    },

    "oc-elem-security": {
        "title": "Interactive: Scam Spotter",
        "color": "#ef4444",
        "body": """<h2>🚨 Scam Spotter</h2>
<p class="sub">Can you tell the difference between a real message and a scam? Tap your answer.</p>
<div id="quiz"></div>
<script>
const Qs=[
  {q:"Email: 'Your Ledger wallet is compromised. Enter your 24-word seed at ledger-secure-verify.com'",scam:true,explain:"Ledger will NEVER ask for your seed phrase online. Real hardware wallets never need you to type your seed anywhere."},
  {q:"MetaMask popup: 'opensea.io wants to view your public wallet address'",scam:false,explain:"Reading your public address is safe — it's like your email. The site can't do anything without you approving a transaction."},
  {q:"DM: 'Hi, I'm from Binance support. Can you verify your 2FA code so we can restore your account?'",scam:true,explain:"Exchanges NEVER DM first, and NEVER ask for your 2FA code. This is social engineering."},
  {q:"'Congratulations! You've won 1 ETH. Connect wallet and pay 0.05 ETH gas fee to claim.'",scam:true,explain:"Legitimate airdrops don't require upfront payment. Paying to 'claim' is always a scam."},
  {q:"Uniswap asks you to approve spending your USDC (up to the exact amount you're trading)",scam:false,explain:"Approving the exact amount you're spending is normal and safe. Only worry if it says 'unlimited' approval."},
];
let idx=0,score=0,answered=false;
function render(){
  if(idx>=Qs.length){
    document.getElementById('quiz').innerHTML=`<div class="result"><span class="big ${score>=4?'good':'warn'}">${score}/5</span><p style="font-size:13px;color:#94a3b8;">${score===5?'Perfect scam detector!':score>=3?'Good instincts — review the explanations.':'Stay sharp — scammers are sophisticated.'}</p><button class="btn" onclick="resetQ()">Try Again</button></div>`;
    return;
  }
  const q=Qs[idx];
  document.getElementById('quiz').innerHTML=`
    <div class="panel" style="margin-bottom:12px;"><p style="font-size:13px;line-height:1.5;margin:0;">${q.q}</p></div>
    <div class="row" style="gap:8px;">
      <button class="btn" style="flex:1;background:#7f1d1d;" onclick="ans(true)">🚨 Scam</button>
      <button class="btn" style="flex:1;background:#166534;" onclick="ans(false)">✅ Legit</button>
    </div>
    <div id="fb"></div>`;
}
function ans(isScam){
  if(answered)return;answered=true;
  const q=Qs[idx];const ok=isScam===q.scam;if(ok)score++;
  document.getElementById('fb').innerHTML=`<div class="result" style="margin-top:8px;"><span class="${ok?'good':'bad'}" style="font-weight:700;">${ok?'✓ Correct!':'✗ Wrong'}</span><br/><p style="font-size:12px;color:#94a3b8;margin:6px 0 0;">${q.explain}</p><button class="btn" onclick="next()" style="margin-top:8px;">${idx+1<Qs.length?'Next →':'See Results'}</button></div>`;
}
function next(){idx++;answered=false;render();}
function resetQ(){idx=0;score=0;answered=false;render();}
render();
</script>"""
    },

    "oc-elem-swapbridge": {
        "title": "Interactive: Swap Simulator",
        "color": "#34d399",
        "body": """<h2>🔄 Swap Simulator</h2>
<p class="sub">Simulate a DEX token swap. See price impact, slippage, and output before executing.</p>
<div class="row">
  <div class="panel">
    <label>You Send</label>
    <input type="number" id="amtIn" value="100" min="1" oninput="calc()">
    <label style="margin-top:8px;">From Token</label>
    <select id="from" onchange="calc()">
      <option value="xrp">XRP ($2.20)</option>
      <option value="eth">ETH ($2000)</option>
      <option value="sol">SOL ($150)</option>
    </select>
    <label style="margin-top:8px;">To Token</label>
    <select id="to" onchange="calc()">
      <option value="usdc">USDC ($1.00)</option>
      <option value="btc">BTC ($65000)</option>
      <option value="xrp">XRP ($2.20)</option>
    </select>
  </div>
  <div class="panel">
    <label>Swap Details</label>
    <div class="result" id="result" style="margin-top:0;"></div>
    <button class="btn" style="margin-top:12px;width:100%;" onclick="execute()">Execute Swap</button>
    <div id="exec" style="display:none;margin-top:8px;"></div>
  </div>
</div>
<script>
const PRICES={xrp:2.20,eth:2000,sol:150,usdc:1,btc:65000};
function calc(){
  const f=document.getElementById('from').value;
  const t=document.getElementById('to').value;
  const amt=parseFloat(document.getElementById('amtIn').value)||0;
  const usdIn=amt*PRICES[f];
  const fee=usdIn*0.003;
  const usdOut=usdIn-fee;
  const out=usdOut/PRICES[t];
  const impact=Math.min(amt/10000*100,2.5);
  document.getElementById('result').innerHTML=
    `You send: <b>${amt} ${f.toUpperCase()}</b> ($${usdIn.toFixed(2)})<br/>`+
    `<span class="stat">Fee 0.3%: $${fee.toFixed(2)}</span>`+
    `<span class="stat warn">Price impact: ${impact.toFixed(2)}%</span><br/>`+
    `You receive: <span class="big good">${out.toFixed(6)} ${t.toUpperCase()}</span><br/>`+
    `<span style="font-size:11px;color:#64748b;">Rate: 1 ${f.toUpperCase()} = ${(PRICES[f]/PRICES[t]).toFixed(6)} ${t.toUpperCase()}</span>`;
  document.getElementById('exec').style.display='none';
}
function execute(){
  const txId='0x'+Array.from({length:12},()=>'0123456789abcdef'[Math.floor(Math.random()*16)]).join('');
  document.getElementById('exec').style.display='block';
  document.getElementById('exec').innerHTML=`<div class="result"><span class="good" style="font-weight:700;">✓ Swap Executed On-Chain</span><br/><span style="font-size:10px;font-family:monospace;color:#64748b;">${txId}</span><br/><span style="font-size:11px;color:#64748b;">Settled in 3–5 seconds. No bank. No intermediary.</span></div>`;
}
calc();
</script>"""
    },

    "oc-elem-trading": {
        "title": "Interactive: Trade Decision Game",
        "color": "#a78bfa",
        "body": """<h2>📈 Trade Decision Game</h2>
<p class="sub">Read the scenario. Would you Buy, Sell, or Hold? Learn the reasoning behind each call.</p>
<div id="game"></div>
<script>
const SCENARIOS=[
  {title:"Bitcoin hits all-time high",desc:"BTC just broke its ATH. Volume is 3× normal. Social media is extremely bullish.",correct:"Hold",reason:"Chasing ATH breakouts is dangerous — extreme greed often precedes corrections. Holding protects gains without FOMO."},
  {title:"Coin drops 40% on false rumor",desc:"A top coin crashed 40% on a rumor later debunked. Project fundamentals unchanged.",correct:"Buy",reason:"Rumor-driven crashes on solid projects are often buying opportunities — price typically recovers when facts emerge."},
  {title:"Meme coin up 300% in a week",desc:"You're sitting on 300% gains. Social hype is massive. Everyone is talking about it.",correct:"Sell",reason:"Meme coins are pure sentiment. Taking profits at 300% during peak hype is smart risk management."},
  {title:"Market flat for 3 weeks",desc:"No major news. Your portfolio is unchanged. A friend says 'alt season is coming any day.'",correct:"Hold",reason:"Consolidation is normal. Acting on rumors shakes you out before the real move. Stay the course."},
];
let idx=0,chosen=null,score=0;
function render(){
  if(idx>=SCENARIOS.length){
    document.getElementById('game').innerHTML=`<div class="result"><span class="big ${score>=3?'good':'warn'}">${score}/${SCENARIOS.length}</span><br/><p style="font-size:13px;color:#94a3b8;margin:8px 0 0;">${score===SCENARIOS.length?'Perfect discipline!':score>=2?'Good instincts!':'Review each scenario and try again.'}</p><button class="btn" onclick="resetGame()" style="margin-top:8px;">Play Again</button></div>`;
    return;
  }
  const s=SCENARIOS[idx];
  document.getElementById('game').innerHTML=`
    <div class="panel" style="margin-bottom:12px;">
      <p style="font-weight:700;font-size:14px;margin:0 0 6px;">${s.title}</p>
      <p style="font-size:12px;color:#94a3b8;margin:0;">${s.desc}</p>
    </div>
    <div class="row" style="gap:8px;">
      ${['Buy','Sell','Hold'].map(a=>`<button class="btn" style="flex:1;background:${a==='Buy'?'#166534':a==='Sell'?'#7f1d1d':'#1e3a5f'}" onclick="answer('${a}')">${a}</button>`).join('')}
    </div>
    <div id="fb" style="display:none;"></div>`;
}
function answer(a){if(chosen)return;chosen=a;const s=SCENARIOS[idx];const ok=a===s.correct;if(ok)score++;document.getElementById('fb').style.display='block';document.getElementById('fb').innerHTML=`<div class="result" style="margin-top:8px;"><span class="${ok?'good':'bad'}" style="font-weight:700;">${ok?'✓ Correct!':'✗ Best: '+s.correct}</span><br/><p style="font-size:12px;color:#94a3b8;margin:6px 0 0;">${s.reason}</p><button class="btn" onclick="next()" style="margin-top:8px;">${idx+1<SCENARIOS.length?'Next →':'Results'}</button></div>`;}
function next(){idx++;chosen=null;render();}
function resetGame(){idx=0;chosen=null;score=0;render();}
render();
</script>"""
    },

    "oc-elem-vault": {
        "title": "Interactive: Portfolio Builder",
        "color": "#f59e0b",
        "body": """<h2>💼 Portfolio Builder</h2>
<p class="sub">You have $1,000. Allocate it across assets in $100 increments. See your risk profile.</p>
<div id="builder"></div>
<script>
const COINS=[
  {id:'btc',name:'Bitcoin (BTC)',color:'#f59e0b',hint:'Store of value — lower relative risk'},
  {id:'eth',name:'Ethereum (ETH)',color:'#60a5fa',hint:'Smart contract platform — medium risk'},
  {id:'xrp',name:'XRP',color:'#22d3ee',hint:'Payments network — medium risk'},
  {id:'sol',name:'Solana (SOL)',color:'#a78bfa',hint:'High-speed chain — higher risk'},
  {id:'usdc',name:'Stablecoin (USDC)',color:'#22c55e',hint:'Stable $1 — no growth, no risk'},
];
let alloc={btc:0,eth:0,xrp:0,sol:0,usdc:0},locked=false;
const TOTAL=1000;
function used(){return Object.values(alloc).reduce((a,b)=>a+b,0);}
function riskLabel(){
  const stable=alloc.usdc;const btcEth=alloc.btc+alloc.eth;const sol=alloc.sol;
  if(stable>=400)return{label:'Conservative',color:'#22c55e',tip:'Heavy stablecoin = safe but low growth.'};
  if(btcEth>=600)return{label:'Balanced',color:'#60a5fa',tip:'BTC/ETH heavy = reasonable risk/reward.'};
  if(sol>=400)return{label:'Aggressive',color:'#f59e0b',tip:'High SOL = big upside AND downside.'};
  return{label:'Diversified',color:'#22d3ee',tip:'Spread reduces single-point risk.'};
}
function render(){
  const u=used(),rem=TOTAL-u;
  document.getElementById('builder').innerHTML=`
    <div class="result" style="margin-bottom:12px;">
      <div style="background:#334155;border-radius:4px;height:8px;overflow:hidden;">
        <div style="background:#3b82f6;height:100%;width:${u/TOTAL*100}%;transition:width 0.2s;"></div>
      </div>
      <p style="font-size:12px;color:#94a3b8;margin:4px 0 0;">$${u} allocated — $${rem} remaining</p>
    </div>
    ${COINS.map(c=>`
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;padding:8px;background:#0f1f3d;border-radius:8px;border:1px solid #1e3a5f;">
        <div style="flex:1;">
          <p style="font-size:12px;font-weight:700;color:${c.color};margin:0;">${c.name}</p>
          <p style="font-size:10px;color:#64748b;margin:0;">${c.hint}</p>
        </div>
        <div style="display:flex;align-items:center;gap:6px;">
          ${locked?'':'<button onclick="adj(\''+c.id+'\',false)" style="padding:2px 10px;border:1px solid #334155;background:#020817;color:#f1f5f9;border-radius:4px;cursor:pointer;">−</button>'}
          <span style="font-size:14px;font-weight:800;min-width:52px;text-align:center;">$${alloc[c.id]}</span>
          ${locked?'':'<button onclick="adj(\''+c.id+'\',true)" style="padding:2px 10px;border:1px solid #334155;background:#020817;color:#f1f5f9;border-radius:4px;cursor:pointer;">+</button>'}
        </div>
      </div>`).join('')}
    ${!locked?`<button class="btn" onclick="analyze()" ${u===0?'disabled':''} style="width:100%;">Analyze Portfolio</button>`:
    `<div class="result"><p style="font-size:16px;font-weight:800;color:${riskLabel().color};">Risk Profile: ${riskLabel().label}</p><p style="font-size:12px;color:#94a3b8;">${riskLabel().tip}</p><p style="font-size:11px;color:#64748b;margin-top:6px;">Rule: Never go 100% into one asset. Diversification is the only free lunch in investing.</p><button class="btn" onclick="resetA()" style="margin-top:8px;background:#334155;">Reset</button></div>`}`;
}
function adj(id,up){if(locked)return;if(up&&used()<TOTAL)alloc[id]+=100;else if(!up&&alloc[id]>0)alloc[id]-=100;render();}
function analyze(){locked=true;render();}
function resetA(){locked=false;Object.keys(alloc).forEach(k=>alloc[k]=0);render();}
render();
</script>"""
    },

    "oc-elem-wallets": {
        "title": "Interactive: Wallet Builder",
        "color": "#22d3ee",
        "body": """<h2>🔐 Wallet Builder</h2>
<p class="sub">Walk through setting up a crypto wallet — generate an address, reveal a seed phrase, and test your security knowledge.</p>
<div id="wizard"></div>
<script>
const WORDS=['apple','bright','carbon','dream','eagle','flame','grace','honor','ivory','jungle','karma','light'];
const ADDR='r'+Array.from({length:33},()=>'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz0123456789'[Math.floor(Math.random()*58)]).join('');
let step=0,revealed=false,quizIdx=0,quizScore=0,chosen=null;
const QUIZ=[
  {q:"Where should you store your seed phrase?",opts:["Screenshot on phone","Paper written offline","Cloud storage","Text message"],correct:1,explain:"Paper offline only — never digital."},
  {q:"Your public address is safe to share — like your email address.",opts:["True","False"],correct:0,explain:"Anyone can see your public address. Your private key is the secret."},
  {q:"What happens if you lose your seed phrase AND your device breaks?",opts:["Call support","Reset with email","Funds lost forever","Blockchain restores it"],correct:2,explain:"There is no recovery. Your seed phrase IS your wallet."},
];
function render(){
  const steps=['Generate','Backup','Quiz','Done'];
  const bar=steps.map((s,i)=>`<div style="flex:1;height:3px;border-radius:2px;background:${i<=step?'#22d3ee':'#334155'};"></div>`).join('');
  let content='';
  if(step===0){
    content=`<div class="panel"><label>Your Public Address (Safe to Share)</label><p style="font-family:monospace;font-size:10px;word-break:break-all;color:#22d3ee;">${ADDR}</p><p style="font-size:11px;color:#64748b;">Anyone can send XRP to this address.</p><button class="btn" onclick="step=1;render()">Next: Backup Seed Phrase →</button></div>`;
  } else if(step===1){
    content=`<div class="panel"><label>Your Seed Phrase (NEVER Share This)</label>
      <div style="position:relative;">
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;${!revealed?'filter:blur(6px);':''}" id="words">
          ${WORDS.map((w,i)=>`<div class="item" style="font-size:12px;"><span style="color:#64748b;font-size:10px;">${i+1}.</span> ${w}</div>`).join('')}
        </div>
        ${!revealed?`<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;"><button class="btn" onclick="revealed=true;render()">👁️ Reveal</button></div>`:''}
      </div>
      ${revealed?`<div class="result" style="margin-top:8px;border-color:#f59e0b;"><span class="warn" style="font-weight:700;">⚠️ Write these 12 words on paper. NEVER type them online.</span></div>
      <button class="btn" onclick="step=2;render()" style="margin-top:8px;">I've Written It Down →</button>`:''}
    </div>`;
  } else if(step===2){
    const q=QUIZ[quizIdx];
    content=`<div class="panel"><label>Security Quiz (${quizIdx+1}/${QUIZ.length})</label>
      <p style="font-size:13px;font-weight:700;margin:0 0 10px;">${q.q}</p>
      ${q.opts.map((o,i)=>`<button onclick="ansQ(${i})" style="display:block;width:100%;text-align:left;padding:8px;margin-bottom:6px;border:1px solid ${chosen===i?(i===q.correct?'#22c55e':'#ef4444'):(chosen!==null&&i===q.correct?'#22c55e':'#334155')};background:${chosen===i?(i===q.correct?'#166534':'#7f1d1d'):(chosen!==null&&i===q.correct?'#166534':'#020817')};color:#f1f5f9;border-radius:6px;cursor:pointer;font-size:12px;">${o}</button>`).join('')}
      ${chosen!==null?`<p style="font-size:11px;color:#94a3b8;margin:6px 0;">${q.explain}</p><button class="btn" onclick="nextQ()">${quizIdx+1<QUIZ.length?'Next →':'Finish'}</button>`:''}
    </div>`;
  } else {
    content=`<div class="result"><span class="big ${quizScore===QUIZ.length?'good':'warn'}">${quizScore}/${QUIZ.length}</span><p style="font-size:13px;color:#94a3b8;">${quizScore===QUIZ.length?'Perfect! You\'re ready to manage your own wallet safely.':'Review the answers — wallet security has zero tolerance for mistakes.'}</p><p style="font-size:11px;color:#64748b;margin-top:8px;">Public address = share freely. Seed phrase = never share. No seed = no recovery.</p></div>`;
  }
  document.getElementById('wizard').innerHTML=`<div style="display:flex;gap:4px;margin-bottom:16px;">${bar}</div>${content}`;
}
function ansQ(i){if(chosen!==null)return;chosen=i;const q=QUIZ[quizIdx];if(i===q.correct)quizScore++;render();}
function nextQ(){quizIdx++;chosen=null;if(quizIdx>=QUIZ.length)step=3;render();}
render();
</script>"""
    },

    # ── High School ─────────────────────────────────────────────────────────────
    "oc-hs-blockchain": {
        "title": "Interactive: Hash Explorer",
        "color": "#60a5fa",
        "body": """<h2>🔐 Hash Explorer</h2>
<p class="sub">Type anything and watch the SHA-256 hash update live. See how even one character change creates a completely different hash.</p>
<div class="panel">
  <label>Input Text</label>
  <input type="text" id="inp" value="Hello, Blockchain!" oninput="hashIt()" style="font-size:14px;">
  <label style="margin-top:12px;">SHA-256 Hash</label>
  <div id="hashOut" style="font-family:monospace;font-size:11px;word-break:break-all;padding:12px;background:#020817;border:1px solid #334155;border-radius:6px;margin-top:4px;min-height:40px;line-height:1.8;"></div>
  <div id="diff" style="margin-top:8px;font-size:11px;color:#64748b;"></div>
</div>
<script>
let prevHash='';
async function hashIt(){
  const txt=document.getElementById('inp').value;
  const buf=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(txt));
  const hex=Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
  const out=document.getElementById('hashOut');
  if(prevHash){
    let same=0;for(let i=0;i<hex.length;i++)if(hex[i]===prevHash[i])same++;
    const pct=Math.round(same/hex.length*100);
    out.innerHTML=hex.split('').map((c,i)=>`<span style="color:${c===prevHash[i]?'#22c55e':'#f59e0b'}">${c}</span>`).join('');
    document.getElementById('diff').innerHTML=`<span class="stat good">${same} chars same</span><span class="stat warn">${hex.length-same} chars changed</span><span class="stat">${100-pct}% different</span>`;
  } else {
    out.textContent=hex;
  }
  prevHash=hex;
}
hashIt();
</script>"""
    },

    "oc-hs-crypto": {
        "title": "Interactive: Market Cap Calculator",
        "color": "#f59e0b",
        "body": """<h2>📊 Market Cap Calculator</h2>
<p class="sub">Market Cap = Price × Circulating Supply. Design your own token and see how it compares to real coins.</p>
<div class="row">
  <div class="panel">
    <label>Token Name</label>
    <input type="text" id="tname" value="MyToken" oninput="calc()">
    <label style="margin-top:8px;">Price (USD)</label>
    <input type="number" id="price" value="0.50" min="0.000001" step="0.01" oninput="calc()">
    <label style="margin-top:8px;">Circulating Supply</label>
    <input type="number" id="supply" value="1000000000" min="1" oninput="calc()">
    <div class="result" id="myResult" style="margin-top:8px;"></div>
  </div>
  <div class="panel">
    <label>vs Real Coins (approx.)</label>
    <div id="compare"></div>
  </div>
</div>
<script>
const REAL=[
  {name:'XRP',mcap:130e9},{name:'Ethereum',mcap:240e9},{name:'Bitcoin',mcap:1.3e12},
  {name:'Solana',mcap:65e9},{name:'DOGE',mcap:22e9},
];
function fmt(n){if(n>=1e12)return'$'+(n/1e12).toFixed(2)+'T';if(n>=1e9)return'$'+(n/1e9).toFixed(2)+'B';if(n>=1e6)return'$'+(n/1e6).toFixed(2)+'M';return'$'+n.toFixed(0);}
function calc(){
  const p=parseFloat(document.getElementById('price').value)||0;
  const s=parseFloat(document.getElementById('supply').value)||0;
  const name=document.getElementById('tname').value||'MyToken';
  const mc=p*s;
  document.getElementById('myResult').innerHTML=`Market Cap: <span class="big good">${fmt(mc)}</span>`;
  const maxMc=Math.max(mc,...REAL.map(r=>r.mcap));
  document.getElementById('compare').innerHTML=[{name,mcap:mc,mine:true},...REAL].sort((a,b)=>b.mcap-a.mcap).map(r=>`
    <div style="margin-bottom:8px;">
      <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:2px;">
        <span style="color:${r.mine?'#22d3ee':'#94a3b8'};font-weight:${r.mine?'700':'400'}">${r.name}</span>
        <span style="color:${r.mine?'#22d3ee':'#94a3b8'}">${fmt(r.mcap)}</span>
      </div>
      <div style="background:#334155;border-radius:3px;height:6px;overflow:hidden;">
        <div style="background:${r.mine?'#22d3ee':'#3b82f6'};height:100%;width:${Math.min(r.mcap/maxMc*100,100)}%;"></div>
      </div>
    </div>`).join('');
}
calc();
</script>"""
    },

    "oc-hs-defi": {
        "title": "Interactive: Liquidity Pool Simulator",
        "color": "#22d3ee",
        "body": """<h2>💧 Liquidity Pool Simulator</h2>
<p class="sub">Model a Uniswap V2 AMM pool. See price impact, swap output, and impermanent loss in real time.</p>
<div class="row">
  <div class="panel">
    <label>Pool: XRP Reserve</label>
    <input type="number" id="rx" value="10000" oninput="calc()">
    <label style="margin-top:8px;">Pool: USDC Reserve</label>
    <input type="number" id="ry" value="22000" oninput="calc()">
    <label style="margin-top:8px;">Swap: XRP amount</label>
    <input type="number" id="swap" value="100" oninput="calc()">
    <div class="result" id="swapResult" style="margin-top:8px;"></div>
  </div>
  <div class="panel">
    <label>Impermanent Loss — Price Change</label>
    <input type="range" id="pct" min="-90" max="500" value="100" oninput="calcIL()">
    <p style="font-size:12px;color:#94a3b8;margin:4px 0;">Change: <span id="pval" style="color:#f1f5f9;font-weight:700;">+100%</span></p>
    <div class="result" id="ilResult"></div>
  </div>
</div>
<script>
function calc(){
  const rx=+document.getElementById('rx').value||10000;
  const ry=+document.getElementById('ry').value||22000;
  const dx=+document.getElementById('swap').value||100;
  const k=rx*ry;
  const rx2=rx+dx;const ry2=k/rx2;
  const out=ry-ry2;
  const spot=ry/rx;const exec=out/dx;
  const impact=Math.abs((exec-spot)/spot*100);
  document.getElementById('swapResult').innerHTML=
    `Swap <b>${dx}</b> XRP → <span class="big good">${out.toFixed(2)}</span> USDC<br/>`+
    `<span class="stat">Spot: $${spot.toFixed(4)}</span>`+
    `<span class="stat">Exec: $${exec.toFixed(4)}</span>`+
    `<span class="stat ${impact>1?'warn':'good'}">Impact: ${impact.toFixed(2)}%</span>`;
}
function calcIL(){
  const pct=parseInt(document.getElementById('pct').value);
  document.getElementById('pval').textContent=(pct>=0?'+':'')+pct+'%';
  const P=(100+pct)/100;
  const il=(2*Math.sqrt(P)/(1+P)-1)*100;
  const lpVal=100*(2*Math.sqrt(P)/(1+P));
  const holdVal=100*(1+pct/200);
  document.getElementById('ilResult').innerHTML=
    `IL: <span class="big bad">${il.toFixed(2)}%</span><br/>`+
    `<span class="stat">LP value: $${lpVal.toFixed(2)}</span>`+
    `<span class="stat">Just holding: $${holdVal.toFixed(2)}</span>`;
}
calc();calcIL();
</script>"""
    },

    "oc-hs-trading": {
        "title": "Interactive: Candlestick Pattern Reader",
        "color": "#a78bfa",
        "body": """<h2>🕯️ Candlestick Pattern Reader</h2>
<p class="sub">Study 5 key candlestick patterns. For each, identify whether it's a bullish or bearish signal.</p>
<div id="reader"></div>
<script>
const PATTERNS=[
  {name:"Hammer",signal:"Bullish",desc:"Small body near top, long lower wick. Buyers pushed price back up after sellers drove it down — reversal signal at support.",svgBody:"M50,20 L50,60 M40,20 L60,20 L60,30 L40,30 Z",color:"#22c55e"},
  {name:"Bearish Engulfing",signal:"Bearish",desc:"Large red candle fully engulfs the previous green candle. Sellers overwhelmed buyers — strong reversal after uptrend.",svgBody:"M40,10 L60,10 L60,30 L40,30 Z M35,5 L65,5 L65,65 L35,65 Z M50,5 L50,2 M50,65 L50,68",color:"#ef4444"},
  {name:"Doji",signal:"Neutral",desc:"Open and close are nearly equal — tiny or no body. Market indecision. Often precedes a reversal when occurring at trend extremes.",svgBody:"M50,15 L50,65 M35,40 L65,40",color:"#f59e0b"},
  {name:"Three White Soldiers",signal:"Bullish",desc:"Three consecutive large green candles, each opening within and closing above the previous. Strong buying momentum — bullish continuation.",svgBody:"M30,50 L45,50 L45,20 L30,20 Z M42,60 L57,60 L57,30 L42,30 Z M54,55 L69,55 L69,15 L54,15 Z",color:"#22c55e"},
  {name:"Shooting Star",signal:"Bearish",desc:"Small body near bottom, long upper wick. Buyers pushed price up but sellers drove it back down — bearish reversal signal at resistance.",svgBody:"M50,60 L50,20 M40,60 L60,60 L60,70 L40,70 Z",color:"#ef4444"},
];
let idx=0,answered=false,score=0;
function render(){
  if(idx>=PATTERNS.length){
    document.getElementById('reader').innerHTML=`<div class="result"><span class="big ${score>=4?'good':'warn'}">${score}/${PATTERNS.length}</span><p style="font-size:13px;color:#94a3b8;">${score===PATTERNS.length?'Perfect pattern recognition!':score>=3?'Good eye — review the ones you missed.':'Keep studying — patterns take practice.'}</p><button class="btn" onclick="reset()">Try Again</button></div>`;
    return;
  }
  const p=PATTERNS[idx];
  document.getElementById('reader').innerHTML=`
    <div class="row" style="align-items:center;">
      <div class="panel" style="text-align:center;max-width:120px;">
        <svg width="80" height="80" viewBox="0 0 100 80">
          <path d="${p.svgBody}" fill="${p.color}" stroke="${p.color}" stroke-width="2.5" fill-opacity="0.7"/>
        </svg>
        <p style="font-size:12px;font-weight:700;margin:4px 0 0;">${p.name}</p>
      </div>
      <div class="panel" style="flex:1;">
        <p style="font-size:12px;color:#94a3b8;margin:0 0 10px;">Is this pattern bullish (price likely to rise), bearish (likely to fall), or neutral?</p>
        <div style="display:flex;gap:6px;">
          <button class="btn" style="flex:1;background:#166534;" onclick="ans('Bullish')">📈 Bullish</button>
          <button class="btn" style="flex:1;background:#7f1d1d;" onclick="ans('Bearish')">📉 Bearish</button>
          <button class="btn" style="flex:1;background:#1e3a5f;" onclick="ans('Neutral')">➡️ Neutral</button>
        </div>
        <div id="fb"></div>
      </div>
    </div>`;
}
function ans(a){if(answered)return;answered=true;const p=PATTERNS[idx];const ok=a===p.signal;if(ok)score++;document.getElementById('fb').innerHTML=`<div class="result" style="margin-top:8px;"><span class="${ok?'good':'bad'}" style="font-weight:700;">${ok?'✓ Correct!':'✗ It\'s '+p.signal}</span><p style="font-size:11px;color:#94a3b8;margin:4px 0 0;">${p.desc}</p><button class="btn" onclick="next()" style="margin-top:6px;">${idx+1<PATTERNS.length?'Next Pattern →':'See Results'}</button></div>`;}
function next(){idx++;answered=false;render();}
function reset(){idx=0;answered=false;score=0;render();}
render();
</script>"""
    },

    "oc-hs-wallets": {
        "title": "Interactive: Security Strength Checker",
        "color": "#ef4444",
        "body": """<h2>🛡️ Wallet Security Checker</h2>
<p class="sub">Score your crypto security setup against best practices. Find your weaknesses before attackers do.</p>
<div class="row">
  <div class="panel">
    <label>Custody Setup</label>
    <select id="custody" onchange="score()">
      <option value="0">Exchange only — no self-custody</option>
      <option value="1">Hot wallet (MetaMask/XUMM)</option>
      <option value="2" selected>Hardware wallet (Ledger/Trezor)</option>
      <option value="3">Hardware wallet + passphrase (25th word)</option>
    </select>
    <label style="margin-top:8px;">Seed Phrase Storage</label>
    <select id="seed" onchange="score()">
      <option value="0">Screenshot / photo on phone</option>
      <option value="0">Digital file on computer</option>
      <option value="1">Paper in drawer</option>
      <option value="2" selected>Paper in fireproof safe</option>
      <option value="3">Metal backup (Cryptosteel/Bilodl)</option>
    </select>
    <label style="margin-top:8px;">Two-Factor Auth</label>
    <select id="twofa" onchange="score()">
      <option value="0">SMS only</option>
      <option value="1" selected>Authenticator app (TOTP)</option>
      <option value="2">Hardware key (YubiKey)</option>
    </select>
    <label style="margin-top:8px;">OpSec — Who knows you hold crypto?</label>
    <select id="opsec" onchange="score()">
      <option value="0">Publicly on social media</option>
      <option value="1" selected>Friends/family know roughly</option>
      <option value="2">Nobody knows your holdings</option>
    </select>
    <div class="result" id="scoreResult" style="margin-top:8px;"></div>
  </div>
  <div class="panel">
    <label>Phishing Scenario — Is This a Scam?</label>
    <div id="scenario" style="background:#020817;border-left:3px solid #ef4444;padding:10px;border-radius:4px;font-size:12px;line-height:1.5;margin-bottom:8px;"></div>
    <button class="btn" onclick="nextScenario()">Next Scenario →</button>
    <div id="scenAns" style="display:none;margin-top:8px;"></div>
  </div>
</div>
<script>
const SCENS=[
  {q:"Email: 'Your Ledger has been compromised. Enter seed at ledger-verify.io'",ans:"🚨 SCAM — Ledger NEVER asks for your seed phrase. Delete immediately.",bad:true},
  {q:"MetaMask: 'New site wants to connect: opensea.io — View your wallet address'",ans:"✅ LEGIT — Reading your public address is harmless. Only worry when approving transactions.",bad:false},
  {q:"DM: 'Hi, I'm Binance support. Can you give me your 2FA code to secure your account?'",ans:"🚨 SCAM — Exchanges never DM first or ask for 2FA codes. Block and report.",bad:true},
  {q:"Airdrop: 'Claim 5,000 free tokens! Connect wallet and approve token access'",ans:"🚨 DRAIN SCAM — Approving 'token access' lets the contract steal ALL your tokens.",bad:true},
  {q:"You paste an XRP address but notice the last 4 characters changed before you submitted",ans:"🚨 CLIPBOARD HIJACKER — Malware replaced your copied address. Always verify last 6 chars.",bad:true},
];
let si=0;
function nextScenario(){
  document.getElementById('scenAns').style.display='none';
  const s=SCENS[si%SCENS.length];
  document.getElementById('scenario').textContent=s.q;
  setTimeout(()=>{document.getElementById('scenAns').style.display='block';document.getElementById('scenAns').innerHTML=`<div class="result"><span class="${s.bad?'bad':'good'}" style="font-weight:700;">${s.ans}</span></div>`;},300);
  si++;
}
function score(){
  const c=parseInt(document.getElementById('custody').value);
  const s=parseInt(document.getElementById('seed').value);
  const t=parseInt(document.getElementById('twofa').value);
  const o=parseInt(document.getElementById('opsec').value);
  const total=c+s+t+o,max=10;
  const pct=Math.round(total/max*100);
  const g=pct>=80?['A','good','Strong setup']:pct>=60?['B','warn','Good but improve seed storage']:pct>=40?['C','warn','Several risks — act now']:['D','bad','High risk — move funds off exchange'];
  document.getElementById('scoreResult').innerHTML=`Security: <span class="big ${g[1]}">${g[0]} (${pct}%)</span><br/><span style="font-size:11px;color:#94a3b8;">${g[2]}</span>`;
}
score();nextScenario();
</script>"""
    },

    "oc-hs-security": {
        "title": "Interactive: Attack Vector Simulator",
        "color": "#ef4444",
        "body": """<h2>⚔️ Attack Vector Simulator</h2>
<p class="sub">Walk through 5 real attack types. For each, identify the correct defense.</p>
<div id="sim"></div>
<script>
const ATTACKS=[
  {name:"Phishing",icon:"🎣",desc:"You receive an email from 'MetaMask-Support.com' asking you to enter your seed phrase to 'verify' your wallet.",defenses:["Enter seed phrase on the official site","Never enter seed phrase online — hardware wallets only","Reset your wallet password instead","Contact MetaMask's Twitter for help"],correct:1,explain:"Seed phrases NEVER belong on websites. Official support never asks for them."},
  {name:"SIM Swap",icon:"📱",desc:"A hacker calls your carrier pretending to be you, transfers your number to their SIM, intercepts your SMS 2FA.",defenses:["Use a stronger password","Switch to an authenticator app or hardware key for 2FA","Call the attacker back","Enable more SMS alerts"],correct:1,explain:"SMS is the weakest 2FA. TOTP apps and hardware keys are immune to SIM swap."},
  {name:"Clipboard Hijacker",icon:"📋",desc:"Malware on your device monitors your clipboard and replaces any crypto addresses you copy with the attacker's address.",defenses:["Copy faster","Always verify the last 6–8 characters of an address after pasting",  "Only send from mobile","Use shorter addresses"],correct:1,explain:"Always verify pasted addresses — clipboard hijackers count on you not checking."},
  {name:"Rug Pull",icon:"🪤",desc:"A new DeFi project promises 1000% APY. You invest early. Developers drain liquidity and disappear with funds.",defenses:["Invest more to earn faster","Check if liquidity is locked, team is doxxed, and contract is audited","Wait for the APY to increase","Follow social media hype"],correct:1,explain:"Check: Is liquidity locked? Is the team doxxed? Is the contract audited? If no — walk away."},
  {name:"Smart Contract Exploit",icon:"💻",desc:"A DeFi protocol has a bug in its code. A hacker drains $100M using a flash loan attack in one transaction.",defenses:["Withdraw funds immediately when you hear about it (too late)","Only use protocols with multiple third-party audits and a bug bounty","Trust the APY instead of the audit","Protocols never get hacked"],correct:1,explain:"Code is law in DeFi — bugs mean losses. Audits and bug bounties reduce but don't eliminate risk."},
];
let idx=0,chosen=null,score=0;
function render(){
  if(idx>=ATTACKS.length){
    document.getElementById('sim').innerHTML=`<div class="result"><span class="big ${score>=4?'good':'warn'}">${score}/${ATTACKS.length}</span><p style="font-size:13px;color:#94a3b8;">${score===ATTACKS.length?'Perfect security awareness!':'Review the explanations and study again.'}</p><button class="btn" onclick="reset()">Try Again</button></div>`;
    return;
  }
  const a=ATTACKS[idx];
  document.getElementById('sim').innerHTML=`
    <div class="panel" style="margin-bottom:12px;">
      <p style="font-size:16px;font-weight:800;margin:0 0 4px;">${a.icon} ${a.name}</p>
      <p style="font-size:12px;color:#94a3b8;line-height:1.5;margin:0;">${a.desc}</p>
    </div>
    <p style="font-size:11px;text-transform:uppercase;color:#64748b;margin:0 0 6px;">What's the right defense?</p>
    ${a.defenses.map((d,i)=>`<button onclick="ans(${i})" style="display:block;width:100%;text-align:left;padding:8px;margin-bottom:6px;border:1px solid #334155;background:#020817;color:#f1f5f9;border-radius:6px;cursor:pointer;font-size:12px;line-height:1.4;">${d}</button>`).join('')}
    <div id="fb"></div>`;
}
function ans(i){if(chosen!==null)return;chosen=i;const a=ATTACKS[idx];const ok=i===a.correct;if(ok)score++;
  document.getElementById('fb').innerHTML=`<div class="result" style="margin-top:8px;"><span class="${ok?'good':'bad'}" style="font-weight:700;">${ok?'✓ Correct!':'✗ Wrong — '+a.defenses[a.correct]}</span><p style="font-size:11px;color:#94a3b8;margin:6px 0 0;">${a.explain}</p><button class="btn" onclick="next()" style="margin-top:8px;">${idx+1<ATTACKS.length?'Next Attack →':'See Results'}</button></div>`;}
function next(){idx++;chosen=null;render();}
function reset(){idx=0;chosen=null;score=0;render();}
render();
</script>"""
    },

    "oc-hs-ecosystem": {
        "title": "Interactive: Web3 vs Web2 Sorter",
        "color": "#22d3ee",
        "body": """<h2>🌐 Web3 vs Web2 Sorter</h2>
<p class="sub">Drag each concept into the right category. Is it a Web2 or Web3 characteristic?</p>
<div class="row">
  <div class="panel">
    <label>Click to categorize:</label>
    <div id="items" class="grid" style="gap:6px;"></div>
  </div>
  <div class="panel">
    <div style="margin-bottom:12px;">
      <p style="color:#3b82f6;font-size:11px;font-weight:700;text-transform:uppercase;">Web2</p>
      <div id="web2" class="grid" style="min-height:36px;gap:4px;"></div>
    </div>
    <div>
      <p style="color:#22d3ee;font-size:11px;font-weight:700;text-transform:uppercase;">Web3</p>
      <div id="web3" class="grid" style="min-height:36px;gap:4px;"></div>
    </div>
    <div id="score" style="display:none;margin-top:12px;"></div>
  </div>
</div>
<button class="btn" onclick="check()" style="margin-right:8px;">Check Answers</button>
<button class="btn" onclick="resetQ()" style="background:#334155;">Reset</button>
<script>
const ITEMS=[
  {name:"Platform owns your data",w3:false},{name:"Self-custody of assets",w3:true},
  {name:"Username + password login",w3:false},{name:"Connect wallet to sign in",w3:true},
  {name:"Terms of service can change anytime",w3:false},{name:"Rules encoded in smart contracts",w3:true},
  {name:"Company can ban your account",w3:false},{name:"Censorship-resistant transactions",w3:true},
];
let answers={};
function render(){
  document.getElementById('items').innerHTML=ITEMS.filter(i=>!(i.name in answers)).map(i=>`<div class="item" style="cursor:pointer;font-size:12px;" onclick="cycle('${i.name.replace(/'/g,\"\\'\")}')">☐ ${i.name}</div>`).join('');
  document.getElementById('web2').innerHTML=ITEMS.filter(i=>answers[i.name]===false).map(i=>`<div class="item" style="color:#60a5fa;font-size:11px;">${i.name}</div>`).join('');
  document.getElementById('web3').innerHTML=ITEMS.filter(i=>answers[i.name]===true).map(i=>`<div class="item" style="color:#22d3ee;font-size:11px;">${i.name}</div>`).join('');
  document.getElementById('score').style.display='none';
}
function cycle(name){
  if(answers[name]===undefined)answers[name]=false;
  else if(answers[name]===false)answers[name]=true;
  else delete answers[name];
  render();
}
function check(){
  let c=0;ITEMS.forEach(i=>{if(answers[i.name]===i.w3)c++;});
  document.getElementById('score').style.display='block';
  document.getElementById('score').innerHTML=`<span class="big ${c>=6?'good':'warn'}">${c}/${ITEMS.length}</span><br/>`+ITEMS.map(i=>`<span class="stat ${answers[i.name]===i.w3?'good':'bad'}">${i.name}: ${i.w3?'Web3':'Web2'}</span>`).join(' ');
}
function resetQ(){answers={};render();}
render();
</script>"""
    },

    "oc-hs-swapbridge": {
        "title": "Interactive: Bridge & Swap Calculator",
        "color": "#34d399",
        "body": """<h2>🌉 Bridge & Swap Fee Calculator</h2>
<p class="sub">Compare the cost of bridging tokens across chains vs swapping on a single chain.</p>
<div class="row">
  <div class="panel">
    <label>Transfer Amount (USD)</label>
    <input type="number" id="amount" value="1000" min="1" oninput="calc()">
    <label style="margin-top:8px;">Transfer Type</label>
    <select id="type" onchange="calc()">
      <option value="bridge">Bridge (cross-chain)</option>
      <option value="dex">DEX Swap (same chain)</option>
      <option value="cex">CEX Withdraw</option>
    </select>
    <label style="margin-top:8px;">Source Chain / Exchange</label>
    <select id="chain" onchange="calc()">
      <option value="eth">Ethereum</option>
      <option value="sol">Solana</option>
      <option value="xrpl">XRP Ledger</option>
    </select>
  </div>
  <div class="panel">
    <label>Cost Breakdown</label>
    <div class="result" id="breakdown"></div>
    <label style="margin-top:12px;">When to use which?</label>
    <div class="item" style="font-size:11px;line-height:1.5;margin-top:4px;">🌉 <b>Bridge</b>: Move assets to a different ecosystem — higher fees, 5–30 min settlement<br/>🔄 <b>DEX Swap</b>: Exchange tokens on same chain — lower fees, seconds<br/>🏦 <b>CEX Withdraw</b>: Fixed fee, centralized, KYC required</div>
  </div>
</div>
<script>
const FEES={bridge:{eth:{pct:0.005,flat:15,time:'15–30 min'},sol:{pct:0.003,flat:0.5,time:'5–10 min'},xrpl:{pct:0.001,flat:0.01,time:'1–3 min'}},dex:{eth:{pct:0.003,flat:5,time:'~15 sec'},sol:{pct:0.003,flat:0.001,time:'<1 sec'},xrpl:{pct:0.001,flat:0.0001,time:'3–5 sec'}},cex:{eth:{pct:0,flat:25,time:'10–60 min'},sol:{pct:0,flat:0.01,time:'5–15 min'},xrpl:{pct:0,flat:0.02,time:'3–5 min'}}};
function calc(){
  const amt=+document.getElementById('amount').value||1000;
  const type=document.getElementById('type').value;
  const chain=document.getElementById('chain').value;
  const f=FEES[type][chain];
  const fee=amt*f.pct+f.flat;
  const received=amt-fee;
  const pct=(fee/amt*100).toFixed(3);
  document.getElementById('breakdown').innerHTML=
    `Amount: <b>$${amt.toFixed(2)}</b><br/>`+
    `Fee: <span class="bad">$${fee.toFixed(2)} (${pct}%)</span><br/>`+
    `You receive: <span class="big good">$${received.toFixed(2)}</span><br/>`+
    `<span class="stat">Settlement: ${f.time}</span>`+
    `<span class="stat ${type==='dex'||chain==='xrpl'?'good':'warn'}">Type: ${type.toUpperCase()}</span>`;
}
calc();
</script>"""
    },

    # ── College ─────────────────────────────────────────────────────────────────
    "oc-blockchain-basics": None,   # already has interactive
    "oc-cryptocurrency-guide": None, # already has interactive
    "oc-defi-guide": None,          # already has interactive
    "oc-security-wallets": None,    # already has interactive
    "oc-trading-guide": None,       # already has interactive
    "oc-xrpl-deepdive": None,       # already has interactive

    "oc-col-swapbridge": {
        "title": "Interactive: Cross-Chain Arbitrage Simulator",
        "color": "#34d399",
        "body": """<h2>⚡ Cross-Chain Arbitrage Simulator</h2>
<p class="sub">Model a cross-chain arbitrage opportunity. Calculate whether bridging costs make it profitable.</p>
<div class="row">
  <div class="panel">
    <label>Token Price on Chain A ($)</label>
    <input type="number" id="priceA" value="2.20" step="0.01" oninput="calc()">
    <label style="margin-top:8px;">Token Price on Chain B ($)</label>
    <input type="number" id="priceB" value="2.35" step="0.01" oninput="calc()">
    <label style="margin-top:8px;">Trade Size (units)</label>
    <input type="number" id="size" value="10000" oninput="calc()">
    <label style="margin-top:8px;">Bridge Fee (%)</label>
    <input type="number" id="bridgeFee" value="0.3" step="0.1" min="0" oninput="calc()">
    <label style="margin-top:8px;">Bridge Flat Fee ($)</label>
    <input type="number" id="flatFee" value="5" step="0.5" oninput="calc()">
    <label style="margin-top:8px;">DEX Swap Fee (% each side)</label>
    <input type="number" id="dexFee" value="0.3" step="0.05" oninput="calc()">
  </div>
  <div class="panel">
    <label>Arbitrage Analysis</label>
    <div class="result" id="analysis"></div>
    <div style="margin-top:12px;" id="verdict"></div>
  </div>
</div>
<script>
function calc(){
  const pA=+document.getElementById('priceA').value||2.20;
  const pB=+document.getElementById('priceB').value||2.35;
  const size=+document.getElementById('size').value||10000;
  const bfPct=+document.getElementById('bridgeFee').value/100||0.003;
  const bfFlat=+document.getElementById('flatFee').value||5;
  const dexPct=+document.getElementById('dexFee').value/100||0.003;
  const buyVal=size*pA;
  const dexFeeA=buyVal*dexPct;
  const bridgeCost=buyVal*bfPct+bfFlat;
  const sellVal=size*pB;
  const dexFeeB=sellVal*dexPct;
  const totalCost=dexFeeA+bridgeCost+dexFeeB;
  const grossProfit=(pB-pA)*size;
  const netProfit=grossProfit-totalCost;
  const roi=(netProfit/buyVal*100);
  const profitable=netProfit>0;
  document.getElementById('analysis').innerHTML=
    `Buy ${size} tokens on Chain A: <b>$${buyVal.toFixed(2)}</b><br/>`+
    `<span class="stat">DEX fee A: $${dexFeeA.toFixed(2)}</span>`+
    `<span class="stat">Bridge: $${bridgeCost.toFixed(2)}</span>`+
    `<span class="stat">DEX fee B: $${dexFeeB.toFixed(2)}</span><br/>`+
    `Sell on Chain B: <b>$${sellVal.toFixed(2)}</b><br/>`+
    `Gross profit: <span class="${grossProfit>0?'good':'bad'}">$${grossProfit.toFixed(2)}</span><br/>`+
    `Total fees: <span class="bad">$${totalCost.toFixed(2)}</span><br/>`+
    `Net profit: <span class="big ${profitable?'good':'bad'}">$${netProfit.toFixed(2)}</span><br/>`+
    `ROI: <span class="${profitable?'good':'bad'}">${roi.toFixed(3)}%</span>`;
  document.getElementById('verdict').innerHTML=`<div class="result" style="border-color:${profitable?'#22c55e':'#ef4444'};">
    <span style="font-weight:700;color:${profitable?'#22c55e':'#ef4444'};">${profitable?'✓ PROFITABLE':'✗ NOT PROFITABLE'}</span>
    <p style="font-size:11px;color:#94a3b8;margin:6px 0 0;">${profitable?'The spread exceeds bridging costs. Real-world: bots execute this in milliseconds — you need speed and low fees.':'Bridge and swap fees eat the spread. The trade loses money after costs. Increase trade size or find a larger spread.'}</p>
  </div>`;
}
calc();
</script>"""
    },

    "oc-ecosystem": {
        "title": "Interactive: Web3 Application Builder",
        "color": "#22d3ee",
        "body": """<h2>🏗️ Web3 App Stack Builder</h2>
<p class="sub">Choose components to build a Web3 app. See how the stack differs from Web2 and understand the tradeoffs.</p>
<div class="row">
  <div class="panel">
    <label>Blockchain Layer (L1)</label>
    <select id="l1" onchange="render()">
      <option value="eth">Ethereum — most secure, highest fees</option>
      <option value="xrpl">XRP Ledger — fast payments, built-in DEX</option>
      <option value="sol">Solana — ultra-fast, lower fees</option>
    </select>
    <label style="margin-top:8px;">Scaling Solution</label>
    <select id="l2" onchange="render()">
      <option value="none">None — build directly on L1</option>
      <option value="rollup">ZK-Rollup (Ethereum L2)</option>
      <option value="sidechain">Sidechain (e.g. Polygon)</option>
    </select>
    <label style="margin-top:8px;">Storage</label>
    <select id="storage" onchange="render()">
      <option value="onchain">On-chain (expensive, permanent)</option>
      <option value="ipfs">IPFS (decentralized, cheaper)</option>
      <option value="centralized">Centralized DB (cheapest, Web2)</option>
    </select>
    <label style="margin-top:8px;">Identity / Auth</label>
    <select id="auth" onchange="render()">
      <option value="wallet">Wallet Sign-In (SIWE)</option>
      <option value="did">Decentralized ID (DID)</option>
      <option value="oauth">OAuth (Web2 — Google/GitHub)</option>
    </select>
  </div>
  <div class="panel">
    <label>Stack Analysis</label>
    <div id="analysis"></div>
  </div>
</div>
<script>
const DATA={
  l1:{eth:{dec:9,sec:10,speed:4,cost:2},xrpl:{dec:8,sec:9,speed:9,cost:10},sol:{dec:7,sec:8,speed:10,cost:9}},
  l2:{none:{dec:0,speed:0,cost:0},rollup:{dec:0,speed:4,cost:3},sidechain:{dec:-1,speed:3,cost:2}},
  storage:{onchain:{dec:2,cost:-4,note:'Max decentralization, expensive for large data'},ipfs:{dec:1,cost:0,note:'Good for NFT metadata, images — not truly permanent'},centralized:{dec:-3,cost:2,note:'Fast and cheap but defeats Web3 purpose'}},
  auth:{wallet:{dec:2,note:'True self-sovereignty — no platform can revoke'},did:{dec:3,note:'Portable identity across any app'},oauth:{dec:-3,note:'Relies on Google/GitHub — single point of failure'}},
};
function bar(v,max,color){return `<div style="background:#334155;border-radius:3px;height:5px;overflow:hidden;"><div style="background:${color};height:100%;width:${Math.min(Math.max(v/max*100,0),100)}%;"></div></div>`;}
function render(){
  const l1=document.getElementById('l1').value;
  const l2=document.getElementById('l2').value;
  const st=document.getElementById('storage').value;
  const au=document.getElementById('auth').value;
  const d=DATA;
  const dec=Math.min(10,Math.max(0,(d.l1[l1].dec||0)+(d.l2[l2].dec||0)+(d.storage[st].dec||0)+(d.auth[au].dec||0)));
  const sec=d.l1[l1].sec;
  const speed=Math.min(10,(d.l1[l1].speed||0)+(d.l2[l2].speed||0));
  const costRaw=(d.l1[l1].cost||0)+(d.l2[l2].cost||0)+(d.storage[st].cost||0);
  const cost=Math.min(10,Math.max(0,costRaw));
  document.getElementById('analysis').innerHTML=`
    ${[['Decentralization',dec,'#22d3ee'],['Security',sec,'#22c55e'],['Speed',speed,'#a78bfa'],['Cost Efficiency',cost,'#f59e0b']].map(([label,val,color])=>`
      <div style="margin-bottom:10px;">
        <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:3px;">
          <span style="color:#94a3b8;">${label}</span><span style="color:${color};font-weight:700;">${val}/10</span>
        </div>
        ${bar(val,10,color)}
      </div>`).join('')}
    <div class="result" style="margin-top:12px;">
      <p style="font-size:11px;font-weight:700;margin:0 0 4px;">Storage: ${d.storage[st].note}</p>
      <p style="font-size:11px;color:#94a3b8;margin:0;">Auth: ${d.auth[au].note}</p>
    </div>`;
}
render();
</script>"""
    },

    "oc-final-exam": None,  # skip — it's a quiz-only file
}


def make_interactive_scene(classroom_id: str, order: int, info: dict) -> dict:
    """Build an interactive scene dict from the info spec."""
    slug = classroom_id.replace("oc-", "").replace("-", "_")
    short = "".join(w[0] for w in classroom_id.split("-"))
    scene_id = f"{short}-interactive"
    audio_prefix = f"/audio/lessons/{classroom_id}"

    full_html = html(info["title"], info["color"], info["body"])

    return {
        "id": scene_id,
        "type": "interactive",
        "title": info["title"],
        "order": order,
        "content": {
            "type": "interactive",
            "html": full_html,
        },
        "actions": [
            {
                "id": f"action_{scene_id}_i0",
                "type": "speech",
                "text": "Let's explore this interactively. Use the simulation below to experiment with the concepts we just covered.",
                "audioUrl": f"{audio_prefix}/{order}-0.mp3",
            },
            {
                "id": f"action_{scene_id}_i1",
                "type": "speech",
                "text": "Try different inputs and see how the outputs change. Hands-on exploration builds intuition faster than reading.",
                "audioUrl": f"{audio_prefix}/{order}-1.mp3",
            },
        ],
    }


def patch_classroom(filepath: str, info: dict):
    with open(filepath) as f:
        data = json.load(f)

    scenes = data.get("scenes", [])
    classroom_id = data.get("id", "")

    # Find the quiz scene order; insert interactive just before it
    quiz_orders = [s["order"] for s in scenes if s["type"] == "quiz"]
    if quiz_orders:
        insert_order = min(quiz_orders)
        # Shift quiz and any later scenes up by 1
        for s in scenes:
            if s["order"] >= insert_order:
                s["order"] += 1
    else:
        # No quiz — append at end
        insert_order = max((s["order"] for s in scenes), default=0) + 1

    new_scene = make_interactive_scene(classroom_id, insert_order, info)
    scenes.append(new_scene)
    scenes.sort(key=lambda s: s["order"])
    data["scenes"] = scenes

    with open(filepath, "w") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"  ✓ {os.path.basename(filepath)} — added interactive at order {insert_order}")


def main():
    files = {
        os.path.splitext(os.path.basename(f))[0]: f
        for f in glob.glob(os.path.join(CLASSROOMS_DIR, "*.json"))
    }

    for cid, info in INTERACTIVES.items():
        if info is None:
            continue  # already has interactive or skipped
        filepath = files.get(cid)
        if not filepath:
            print(f"  ⚠ {cid} — file not found, skipping")
            continue
        print(f"Patching {cid}...")
        patch_classroom(filepath, info)

    print("\nDone.")


if __name__ == "__main__":
    main()
