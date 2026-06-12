-- OnlyCrypto City Phase 3 — Server-side question bank
-- Moves all questions out of client bundles into DB. correct_index never leaves
-- the server — game_pick_questions strips it before returning to the API route.
-- Run after phase2_cards.sql.

-- ── 1. Question bank table ─────────────────────────────────────────────────────
create table if not exists game_questions (
  question_id text primary key,
  zone_id text not null,
  question_text text not null,
  options jsonb not null,           -- array of 4 strings
  correct_index smallint not null check (correct_index between 0 and 3),
  difficulty text not null default 'medium'
    check (difficulty in ('easy','medium','hard')),
  explanation text,
  active boolean not null default true
);

create index if not exists idx_game_questions_zone on game_questions(zone_id) where active = true;

alter table game_questions enable row level security;
revoke all on table game_questions from public, anon, authenticated;
grant select, insert, update, delete on table game_questions to service_role;

-- ── 2. Safe pick function — strips correct_index ───────────────────────────────
-- The route calls this; correct_index never reaches the client.
create or replace function game_pick_questions(p_zone text, p_n int default 3)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_rows jsonb;
begin
  select jsonb_agg(
    jsonb_build_object(
      'question_id', question_id,
      'zone',        zone_id,
      'question_text', question_text,
      'options',     options,
      'difficulty',  difficulty
      -- correct_index intentionally omitted
    )
  ) into v_rows
  from (
    select * from game_questions
    where zone_id = p_zone and active = true
    order by random()
    limit p_n
  ) q;

  return coalesce(v_rows, '[]'::jsonb);
end;
$$;

revoke all on function game_pick_questions(text, int) from public, anon, authenticated;
grant execute on function game_pick_questions(text, int) to service_role;

-- ── 3. Grade function — server-side answer check ──────────────────────────────
-- Returns {correct, explanation} — caller decides OCC via game_adjust_oc.
create or replace function game_grade_answer(p_question_id text, p_answer_index smallint)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_correct smallint;
  v_explanation text;
begin
  select correct_index, explanation
  into v_correct, v_explanation
  from game_questions
  where question_id = p_question_id and active = true;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'question_not_found');
  end if;

  return jsonb_build_object(
    'ok',          true,
    'correct',     (p_answer_index = v_correct),
    'explanation', v_explanation
  );
end;
$$;

revoke all on function game_grade_answer(text, smallint) from public, anon, authenticated;
grant execute on function game_grade_answer(text, smallint) to service_role;

-- ── 4. Seed questions ──────────────────────────────────────────────────────────
-- 40 migrated from lib/game/questions.ts + 40+ new for the 8 empty zones.

insert into game_questions (question_id, zone_id, question_text, options, correct_index, difficulty, explanation) values

-- ── blockchain-basics (5) ──────────────────────────────────────────────────────
('bb1','blockchain-basics','What makes a blockchain different from a regular database?',
 '["It stores data on one central computer","Thousands of computers hold the same copy — no single entity controls it","Only the government can access it","It deletes data after 30 days"]',
 1,'easy','A blockchain is decentralized — copies exist across thousands of nodes worldwide, making it extremely difficult to tamper with.'),
('bb2','blockchain-basics','Once a transaction is recorded on the blockchain, what can you do to it?',
 '["Edit it any time","Delete it if you are the sender","Nothing — it stays there permanently","Move it to another block"]',
 2,'easy','Blockchain records are immutable — once confirmed, they cannot be altered or deleted.'),
('bb3','blockchain-basics','What is a cryptographic hash?',
 '["A type of wallet password","A unique fixed-length fingerprint of any data","A transaction fee","A type of mining algorithm"]',
 1,'medium','A hash is a mathematical function that converts any input into a fixed-length output. Any change to the input produces a completely different hash.'),
('bb4','blockchain-basics','What does "decentralization" mean in blockchain?',
 '["The network is controlled by one company","No single point of control — power is distributed across many nodes","Transactions happen in a central bank","Only developers can validate transactions"]',
 1,'easy','Decentralization means no single entity controls the network — it is maintained by thousands of independent participants.'),
('bb5','blockchain-basics','What links blocks together in a blockchain?',
 '["Phone numbers","A cryptographic hash of the previous block","Bank account numbers","Email addresses"]',
 1,'medium','Each block contains the hash of the previous block — this chain of hashes is what makes the blockchain tamper-evident.'),

-- ── xrpl-ledger (5) ───────────────────────────────────────────────────────────
('xl1','xrpl-ledger','How fast does XRP Ledger typically settle a transaction?',
 '["10 minutes","3–5 seconds","24 hours","1 week"]',
 1,'easy','XRPL settles transactions in 3–5 seconds, compared to Bitcoin''s 10 minutes or Ethereum''s ~15 seconds.'),
('xl2','xrpl-ledger','What is the primary use case of XRP?',
 '["Store of value like gold","Bridge currency for fast, low-cost cross-border payments","Smart contract execution","NFT creation"]',
 1,'easy','XRP is designed as a bridge currency — banks and payment providers use it to move money across borders instantly and cheaply.'),
('xl3','xrpl-ledger','What consensus mechanism does XRPL use?',
 '["Proof of Work","Proof of Stake","Federated Byzantine Agreement","Delegated Proof of Stake"]',
 2,'hard','XRPL uses the XRP Ledger Consensus Protocol (based on Federated Byzantine Agreement) — no mining required, making it extremely energy efficient.'),
('xl4','xrpl-ledger','Who created the XRP Ledger?',
 '["Satoshi Nakamoto","Vitalik Buterin","Jed McCaleb, Chris Larsen, and Arthur Britto","The US Federal Reserve"]',
 2,'medium','XRPL was created in 2012 by Jed McCaleb, Chris Larsen, and Arthur Britto — and later developed by Ripple Labs.'),
('xl5','xrpl-ledger','What is the base reserve requirement on XRPL?',
 '["100 XRP","20 XRP","10 XRP","1 XRP"]',
 3,'medium','XRPL requires a minimum balance (reserve) to activate a wallet. This is currently 1 XRP, though it can be adjusted by validators.'),

-- ── wallet-security (5) ───────────────────────────────────────────────────────
('ws1','wallet-security','What is a seed phrase?',
 '["A password for your exchange account","A sequence of 12–24 words that can restore your entire wallet","A type of transaction fee","A security question answer"]',
 1,'easy','A seed phrase (or recovery phrase) is generated when you create a wallet. Anyone with these words can access your crypto.'),
('ws2','wallet-security','What should you NEVER do with your seed phrase?',
 '["Write it down on paper","Store it offline in a safe place","Share it with anyone — even support staff","Memorize it"]',
 2,'easy','Never share your seed phrase with anyone. No legitimate support staff will ever ask for it.'),
('ws3','wallet-security','What is a hardware wallet?',
 '["A physical device that stores your private keys offline","An exchange account","A mobile app wallet","A paper printout of your address"]',
 0,'easy','A hardware wallet (like Ledger or Trezor) stores your private keys offline — making it immune to online hacks.'),
('ws4','wallet-security','What is a phishing attack?',
 '["A type of trading strategy","A fake website or message designed to steal your credentials","A method to hack blockchain nodes","A DeFi protocol exploit"]',
 1,'medium','Phishing attacks use fake websites, emails, or messages that look legitimate to trick you into entering your credentials or seed phrase.'),
('ws5','wallet-security','What does "not your keys, not your coins" mean?',
 '["You need to buy a physical key to access crypto","If you don''t control your private keys, you don''t truly own your crypto","Coins must be kept on exchanges for safety","Private keys are stored by the government"]',
 1,'easy','If your crypto is on an exchange, the exchange holds the private keys — meaning they control your coins. FTX users learned this the hard way.'),

-- ── trading-psychology (5) ────────────────────────────────────────────────────
('tp1','trading-psychology','What does FOMO stand for?',
 '["Fear Of Missing Out","Future Of Market Operations","First On Market Offer","Fear Of Margin Operations"]',
 0,'easy','FOMO (Fear Of Missing Out) causes traders to buy at the top when everyone else is hyped — one of the most common emotional trading mistakes.'),
('tp2','trading-psychology','You''re up 300% on a trade. The market starts turning. What do you do?',
 '["Hold — it will keep going up","Take at least partial profits and protect your gains","Buy more — the trend is your friend","Wait for a new all-time high to sell"]',
 1,'medium','Disciplined traders take profits. Greed causes traders to hold through reversals and give back all their gains. Partial profit-taking locks in value.'),
('tp3','trading-psychology','What is confirmation bias in trading?',
 '["Confirming your identity before trading","Only seeking information that confirms your existing view","Getting confirmation from two sources before entering a trade","A type of technical analysis signal"]',
 1,'medium','Confirmation bias causes traders to ignore evidence that contradicts their position and only look for information that confirms what they already believe.'),
('tp4','trading-psychology','What is the best approach when the market is going against your trade?',
 '["Average down — buy more to lower your cost basis","Close the position and accept the loss","Ignore it — it will bounce back","Add more leverage to recover faster"]',
 1,'hard','Accepting a planned loss and closing a position is better than averaging down, ignoring risk management, or adding leverage — which can compound losses catastrophically.'),
('tp5','trading-psychology','What is "revenge trading"?',
 '["Trading against the market maker","Making impulsive trades after a loss trying to recover quickly","A type of arbitrage strategy","Trading the same asset twice in one day"]',
 1,'medium','Revenge trading happens after a loss — traders make impulsive, larger positions trying to "get their money back." This almost always leads to larger losses.'),

-- ── risk-management (5) ───────────────────────────────────────────────────────
('rm1','risk-management','You have $1,000 to trade. Your max risk per trade is 2%. How much can you lose on one trade?',
 '["$200","$20","$50","$100"]',
 1,'easy','2% of $1,000 = $20. This rule keeps any single loss from being catastrophic to your account.'),
('rm2','risk-management','What is a stop-loss order?',
 '["An order to buy more when price drops","An automatic sell trigger at a set price to limit losses","A limit order at your target profit","A fee charged by exchanges"]',
 1,'easy','A stop-loss automatically closes your position if price falls to a set level — limiting your loss to a predetermined amount.'),
('rm3','risk-management','What is position sizing?',
 '["The physical size of your trading screen","Determining how much of your capital to allocate to each trade","The number of assets in your portfolio","Setting the maximum leverage allowed"]',
 1,'medium','Position sizing determines how much of your capital goes into each trade — proper sizing ensures no single loss destroys your account.'),
('rm4','risk-management','What is a risk-to-reward ratio?',
 '["The ratio of your wins to losses","How much you risk compared to how much you stand to gain","The volatility of an asset","The spread on an exchange"]',
 1,'medium','A 1:3 risk-to-reward means risking $1 to potentially make $3. Good traders only take trades where the potential reward significantly outweighs the risk.'),
('rm5','risk-management','What is the #1 rule of risk management?',
 '["Always use maximum leverage","Never invest more than you can afford to lose","Follow influencers for the best trades","Buy low, sell high — it''s guaranteed"]',
 1,'easy','Never invest money you cannot afford to lose. Crypto markets are extremely volatile. Only trade with capital whose loss would not affect your life.'),

-- ── technical-analysis (5) ────────────────────────────────────────────────────
('ta1','technical-analysis','What does a series of higher highs and higher lows indicate?',
 '["A downtrend","An uptrend","A sideways market","A reversal is coming"]',
 1,'easy','Higher highs and higher lows is the definition of an uptrend — each rally reaches higher and each pullback stays above the previous pullback.'),
('ta2','technical-analysis','What is support?',
 '["A level where price tends to fall","A level where price tends to find buying pressure and bounce","The peak of a bull run","A trading platform feature"]',
 1,'easy','Support is a price level where buying pressure tends to overcome selling pressure — price bounces off support as buyers step in.'),
('ta3','technical-analysis','What does a bearish engulfing candlestick pattern signal?',
 '["Continuation of an uptrend","Potential reversal from up to down","A sideways market ahead","A breakout above resistance"]',
 1,'hard','A bearish engulfing pattern occurs when a red candle completely engulfs the previous green candle — suggesting sellers have overtaken buyers and a reversal may follow.'),
('ta4','technical-analysis','What is the RSI (Relative Strength Index) used for?',
 '["Measuring transaction speed","Identifying overbought and oversold conditions","Calculating trading fees","Setting stop-loss levels"]',
 1,'medium','RSI measures momentum on a scale of 0–100. Above 70 is generally considered overbought; below 30 is considered oversold.'),
('ta5','technical-analysis','What is a "breakout"?',
 '["When a trader exits their position","When price moves decisively through a key support or resistance level","A type of exchange hack","When a coin launches on a new exchange"]',
 1,'medium','A breakout occurs when price moves through a key level (support or resistance) with momentum — often signaling the start of a new trend.'),

-- ── defi-district (5) ─────────────────────────────────────────────────────────
('dd1','defi-district','What does DeFi stand for?',
 '["Digital Finance","Decentralized Finance","Defined Finance","Default Finance"]',
 1,'easy','DeFi (Decentralized Finance) refers to financial services built on blockchain smart contracts — no banks, no intermediaries.'),
('dd2','defi-district','What is a smart contract?',
 '["A legal contract about crypto signed by lawyers","Self-executing code on a blockchain that runs automatically when conditions are met","An exchange''s terms of service","A type of crypto wallet"]',
 1,'easy','Smart contracts are programs stored on a blockchain that automatically execute when predetermined conditions are met — no middlemen needed.'),
('dd3','defi-district','What is impermanent loss?',
 '["Money lost permanently when a DeFi protocol is hacked","Temporary loss experienced by liquidity providers when asset prices diverge","A trading loss that cannot be recovered","Fees paid to DeFi protocols"]',
 1,'hard','Impermanent loss occurs when providing liquidity to an AMM and the price of your deposited assets changes relative to each other — you would have been better off just holding.'),
('dd4','defi-district','What is yield farming?',
 '["Mining cryptocurrency with solar panels","Earning returns by providing liquidity or lending in DeFi protocols","Growing a portfolio of farming tokens","A type of NFT project"]',
 1,'medium','Yield farming involves putting crypto assets to work in DeFi protocols to earn returns — through lending, providing liquidity, or staking.'),
('dd5','defi-district','What is a rug pull?',
 '["A type of yield farming strategy","When developers abandon a project and take investor funds","A carpet cleaning service that accepts crypto","When token price increases 100x"]',
 1,'easy','A rug pull is when DeFi project developers suddenly withdraw all funds from the liquidity pool and disappear — leaving investors with worthless tokens.'),

-- ── nft-marketplace (5) ───────────────────────────────────────────────────────
('nm1','nft-marketplace','What does NFT stand for?',
 '["Non-Fungible Token","New Finance Technology","Network For Trading","Non-Financial Token"]',
 0,'easy','NFT stands for Non-Fungible Token. "Non-fungible" means unique and not interchangeable — each NFT is one-of-a-kind.'),
('nm2','nft-marketplace','What gives an NFT its value?',
 '["It is always backed by gold","Scarcity, community, utility, and perceived value","The cost of the image file","Government certification"]',
 1,'medium','NFT value comes from scarcity (limited supply), community (strong holder base), utility (access, games, events), and perceived value.'),
('nm3','nft-marketplace','What is a royalty in the context of NFTs?',
 '["A fee paid to exchange platforms","A percentage of secondary sales that goes back to the original creator","A type of NFT rarity trait","The initial minting cost"]',
 1,'medium','NFT royalties allow creators to earn a percentage every time their NFT is resold — creating ongoing income from secondary market activity.'),
('nm4','nft-marketplace','What is "minting" an NFT?',
 '["Creating and recording an NFT on the blockchain for the first time","Selling an NFT on a marketplace","Converting crypto to NFTs","Burning an old NFT"]',
 0,'easy','Minting is the process of creating an NFT — publishing it to a blockchain, where it receives a unique identifier and becomes permanently recorded.'),
('nm5','nft-marketplace','What is a "floor price" for an NFT collection?',
 '["The maximum price ever paid","The lowest listed price for any NFT in a collection","The average price of all NFTs in a collection","The original mint price"]',
 1,'easy','The floor price is the minimum price you would pay to own any NFT from a collection — it represents the baseline value of the entire collection.'),

-- ── ai-trading-lab (5) — NEW ──────────────────────────────────────────────────
('ai1','ai-trading-lab','What is algorithmic trading?',
 '["Trading using cryptocurrency apps","Automated buying and selling based on pre-programmed rules and data","Trading only after consulting an AI chatbot","Using social media signals to trade"]',
 1,'easy','Algorithmic trading uses computer programs to execute trades automatically based on predefined criteria — removing human emotion from the equation.'),
('ai2','ai-trading-lab','What is backtesting in trading?',
 '["Testing a trading strategy on historical data to see how it would have performed","Entering trades in reverse order","Reviewing your past losing trades","A type of paper trading"]',
 1,'medium','Backtesting applies a trading strategy to historical price data to evaluate how it would have performed — helping identify strengths and weaknesses before risking real capital.'),
('ai3','ai-trading-lab','What is over-optimization (curve fitting) in algorithmic trading?',
 '["Setting too many alerts on a chart","Tuning a strategy so precisely to past data that it fails on future data","Using too many AI models at once","Optimizing your internet connection for faster execution"]',
 1,'hard','Over-optimization creates a strategy that performs perfectly on historical data but fails in live markets because it was tuned to noise rather than real patterns.'),
('ai4','ai-trading-lab','What risk does a trading bot NOT eliminate?',
 '["Emotional decision-making","Execution speed delays","Black swan events and market conditions the bot was not trained on","Sleeping through market moves"]',
 2,'medium','Bots eliminate emotional bias and sleep-related missed trades, but they can''t handle unprecedented events outside their training data — black swans can wipe bot accounts.'),
('ai5','ai-trading-lab','What is the primary danger of using AI signals from unverified sources?',
 '["The AI might be too accurate","The signal could be a pump-and-dump scheme targeting retail traders","AI is always slower than manual trading","AI signals require a crypto license"]',
 1,'medium','Unverified AI signal groups are often pump-and-dump operations — early holders pump the price using the "AI signal" narrative, then dump on late buyers.'),

-- ── liquidity-pool (5) — NEW ──────────────────────────────────────────────────
('lp1','liquidity-pool','What is an Automated Market Maker (AMM)?',
 '["A human trader who provides liquidity","A smart contract that prices assets using a mathematical formula instead of an order book","A bot that places limit orders","A centralized exchange feature"]',
 1,'medium','AMMs like Uniswap use mathematical formulas (e.g. x*y=k) to price assets automatically — liquidity providers deposit pairs and earn fees from traders.'),
('lp2','liquidity-pool','What do you receive when you provide liquidity to a pool?',
 '["Nothing — it is a donation","LP tokens representing your share of the pool","A fixed interest rate certificate","An NFT badge"]',
 1,'easy','Liquidity providers receive LP tokens that represent their proportional share of the pool — redeemable later for their underlying assets plus earned fees.'),
('lp3','liquidity-pool','What causes impermanent loss to become "permanent"?',
 '["Holding LP tokens too long","Withdrawing liquidity when asset prices have diverged significantly from when you deposited","Claiming your trading fee rewards","Staking your LP tokens"]',
 1,'hard','Impermanent loss only becomes realized (permanent) when you withdraw liquidity while prices are imbalanced. If prices return to the original ratio, IL disappears.'),
('lp4','liquidity-pool','What is price impact in a liquidity pool?',
 '["The fee charged by the protocol","How much your large trade moves the price against you","The difference between bid and ask on an exchange","The gas cost of a swap"]',
 1,'medium','Price impact is how much your trade shifts the pool''s price — large trades in shallow pools cause significant slippage, meaning you get worse prices than expected.'),
('lp5','liquidity-pool','Which pools typically have the highest impermanent loss risk?',
 '["Stablecoin-to-stablecoin pools","Volatile asset pairs like ETH/MEME tokens","Pools with high trading fees","Pools with low total value locked"]',
 1,'hard','Volatile pairs experience large price divergences — the AMM rebalances constantly, leaving LPs holding more of the losing asset. Stablecoin pools have near-zero IL.'),

-- ── tokenomics-tower (5) — NEW ────────────────────────────────────────────────
('tt1','tokenomics-tower','What is a token''s "circulating supply"?',
 '["The total number of tokens that will ever exist","The number of tokens currently available and trading in the market","Tokens held by the founding team","Tokens locked in smart contracts"]',
 1,'easy','Circulating supply is the number of tokens actively in the market — it is used to calculate market cap (price × circulating supply).'),
('tt2','tokenomics-tower','What is a token burn?',
 '["Sending tokens to an exchange","Permanently removing tokens from circulation, reducing supply","A failed transaction","Converting tokens to another asset"]',
 1,'easy','Token burns permanently remove tokens from circulation by sending them to an unspendable address — reducing supply can increase scarcity and potentially price.'),
('tt3','tokenomics-tower','What is a vesting schedule?',
 '["A plan for token price appreciation","A time-locked release of tokens to team members or investors to prevent immediate selling","A staking reward schedule","A token burn timetable"]',
 1,'medium','Vesting schedules lock team and investor tokens for a period — preventing them from dumping immediately after launch, which would crash the price.'),
('tt4','tokenomics-tower','What does "inflationary tokenomics" mean?',
 '["The token price always goes up","New tokens are continuously created, increasing total supply over time","The token is pegged to inflation indexes","Token value tracks the Consumer Price Index"]',
 1,'medium','Inflationary tokens have ongoing emission — new supply is minted over time. If demand doesn''t keep pace with new supply, price dilution occurs.'),
('tt5','tokenomics-tower','Why does utility matter for a token''s long-term value?',
 '["It doesn''t — only speculation drives value","Utility creates real demand — people need to buy the token to use the product or service","Utility tokens are exempt from regulations","Utility guarantees price stability"]',
 1,'medium','Without utility, tokens are purely speculative. When a token is required to use a platform (gas fees, governance, access), it creates organic demand that supports price.'),

-- ── dao-governance (5) — NEW ──────────────────────────────────────────────────
('dg1','dao-governance','What is a DAO?',
 '["A digital art organization","A Decentralized Autonomous Organization governed by smart contracts and token holders","A type of crypto exchange","A government-approved blockchain entity"]',
 1,'easy','A DAO is an organization run by code and community votes — rules are encoded in smart contracts and decisions are made by token holders, not a central authority.'),
('dg2','dao-governance','What is a governance attack?',
 '["Hacking the DAO''s website","Acquiring enough voting tokens to pass a malicious proposal and drain the treasury","Spamming governance forums","Voting against all proposals"]',
 1,'hard','In a governance attack, an adversary accumulates a majority of voting tokens (sometimes via flash loans) and passes a proposal to drain the DAO treasury or change rules maliciously.'),
('dg3','dao-governance','What is "quorum" in DAO governance?',
 '["The number of team members required to approve a decision","The minimum participation threshold required for a vote to be valid","The maximum number of proposals per month","The time limit for voting"]',
 1,'medium','Quorum is the minimum percentage of voting power that must participate for a vote to be binding — preventing a tiny minority from making major decisions when most holders are inactive.'),
('dg4','dao-governance','What is the main risk of token-weighted voting in DAOs?',
 '["It makes voting too slow","Wealthy token holders have disproportionate influence — plutocracy replaces decentralization","It requires too much gas","Votes are public and can be tracked"]',
 1,'hard','Token-weighted voting gives whales (large holders) outsized control. A small number of large holders can effectively control the DAO, undermining the decentralization promise.'),
('dg5','dao-governance','What is a multisig wallet in the context of DAO operations?',
 '["A wallet that requires multiple private keys to authorize transactions — preventing any one person from acting alone","A wallet holding multiple cryptocurrencies","A wallet shared between exchange and user","A hardware wallet with biometric security"]',
 0,'medium','A multisig wallet requires M-of-N signers to approve transactions — for example, 3 of 5 council members must sign. This prevents unilateral fund movement.'),

-- ── metaverse-city (5) — NEW ──────────────────────────────────────────────────
('mc1','metaverse-city','What makes virtual land in a metaverse potentially valuable?',
 '["It is backed by physical real estate","Scarcity, location within the virtual world, and foot traffic from other users","The government guarantees its value","It earns real-world rental income automatically"]',
 1,'medium','Virtual land value mirrors real estate principles — scarcity (limited plots), desirable locations (near hubs), and user traffic create demand. But unlike physical land, value depends entirely on platform adoption.'),
('mc2','metaverse-city','What is interoperability in the metaverse context?',
 '["Virtual worlds having similar graphics","The ability to use assets, avatars, or tokens across different virtual platforms","A feature that connects the metaverse to the real internet","Virtual worlds sharing the same server"]',
 1,'hard','True interoperability means your NFT avatar or virtual item works across different platforms — currently rare but considered the holy grail of the open metaverse vision.'),
('mc3','metaverse-city','What is the primary economic model in most current metaverse platforms?',
 '["Subscription fees","Play-to-earn with NFT assets and in-game tokens","Advertising revenue only","Government funding"]',
 1,'medium','Most metaverse platforms use play-to-earn models — players earn tokens and tradeable NFT assets through participation, creating real economic value within the virtual world.'),
('mc4','metaverse-city','What major risk exists for metaverse virtual land investments?',
 '["The land might physically depreciate","If the platform loses users or shuts down, the land loses all value","Land prices are capped by law","Virtual land is taxed heavily"]',
 1,'medium','Metaverse land has no intrinsic value outside its platform — if the platform loses adoption or closes, your land becomes worthless. Platform risk is the primary concern.'),
('mc5','metaverse-city','What is an "avatar" in the metaverse economy?',
 '["A type of metaverse token","Your digital identity and representation that can be owned, customized, and traded as an NFT","A virtual land parcel","A governance mechanism"]',
 1,'easy','Avatars are your digital identity in virtual worlds — in NFT-based metaverses, your avatar can be a tradeable asset, with rare traits commanding premium prices.'),

-- ── wealth-mindset (5) — NEW ──────────────────────────────────────────────────
('wm1','wealth-mindset','What is compound interest?',
 '["Earning interest only on your original investment","Earning interest on both your principal and previously earned interest — wealth grows exponentially","A type of cryptocurrency yield","Interest paid monthly by exchanges"]',
 1,'easy','Compound interest means you earn returns on your returns — $1,000 at 10% annually becomes $1,100 after year 1, then $1,210 after year 2. Time is the most powerful wealth tool.'),
('wm2','wealth-mindset','What is dollar-cost averaging (DCA)?',
 '["Buying only when prices are at all-time lows","Investing a fixed amount at regular intervals regardless of price — smoothing out volatility","Converting all assets to dollars during bear markets","Trading using the US dollar index"]',
 1,'easy','DCA removes the need to time the market — by investing consistently (e.g. $100/week in BTC), you automatically buy more when prices are low and less when high.'),
('wm3','wealth-mindset','What does "time in the market beats timing the market" mean?',
 '["You should trade 24/7","Long-term consistent investing outperforms trying to predict market tops and bottoms","Markets are always open so you should always be invested","Day trading is more profitable than holding"]',
 1,'medium','Studies consistently show that missing just the 10 best days in a decade costs investors 50%+ of returns. Staying invested long-term beats in-and-out trading for most people.'),
('wm4','wealth-mindset','What is the FIRE movement?',
 '["A crypto trading strategy","Financial Independence, Retire Early — achieving enough passive income to cover expenses indefinitely","A type of aggressive growth portfolio","A method to predict market crashes"]',
 1,'medium','FIRE stands for Financial Independence, Retire Early — the goal is to build assets generating enough passive income (dividends, yield, rent) to cover all expenses so work becomes optional.'),
('wm5','wealth-mindset','Why is diversification important in a crypto portfolio?',
 '["It guarantees profits","It reduces risk — different assets perform differently, so losses in one can be offset by gains in others","It maximizes returns by spreading across all coins","Regulations require it"]',
 1,'easy','Diversification is the only free lunch in investing — spreading across uncorrelated assets reduces the impact of any single position going to zero.'),

-- ── bear-market (5) — NEW ─────────────────────────────────────────────────────
('bm1','bear-market','What is "capitulation" in a bear market?',
 '["The government banning cryptocurrency","The moment when even the most committed holders panic sell — often marking a market bottom","A type of short-selling strategy","When exchanges pause withdrawals"]',
 1,'hard','Capitulation is the final, emotional mass sell-off where even long-term believers give up — historically, capitulation events often mark cycle bottoms because selling pressure exhausts itself.'),
('bm2','bear-market','What is the best strategy for accumulating crypto during a bear market?',
 '["Sell everything and wait for the bull","Dollar-cost average into quality assets at lower prices over time","Use maximum leverage to amplify any recovery","Wait until the bull market starts before buying"]',
 1,'medium','Bear markets offer the best entry prices for long-term investors. DCA during bear markets means accumulating more coins at lower prices — the assets that survive thrive in the next cycle.'),
('bm3','bear-market','What often signals the end of a crypto bear market?',
 '["Social media hype returns overnight","Bitcoin halving, on-chain accumulation by long-term holders, and macro interest rate changes","Exchanges listing hundreds of new coins","Celebrity endorsements"]',
 1,'hard','Bear market bottoms are typically accompanied by Bitcoin halving cycles (reducing new supply), accumulation by patient long-term holders, and macro conditions (rate cuts increasing risk appetite).'),
('bm4','bear-market','What is a "dead cat bounce" in bear market terminology?',
 '["A recovery that signals the end of the bear market","A brief price recovery within a broader downtrend that fails and continues lower","A type of trading pattern unique to crypto","When stablecoins lose their peg"]',
 1,'medium','A dead cat bounce is a temporary recovery in a declining market — traders mistake it for a reversal, enter long positions, and get caught when the downtrend resumes.'),
('bm5','bear-market','During a bear market, what should you prioritize above everything else?',
 '["Maximum leverage to recover losses faster","Capital preservation and avoiding liquidation","Diversifying into meme coins for quick recovery","Following influencer calls for the best entries"]',
 1,'easy','Survival is the priority in a bear market. Preserving capital means you''re still in the game when the bull cycle returns. Leverage and speculative bets during bear markets often mean permanent loss.'),

-- ── bull-market (5) — NEW ─────────────────────────────────────────────────────
('bu1','bull-market','What is "altcoin season"?',
 '["When Bitcoin reaches a new all-time high","A period when alternative cryptocurrencies outperform Bitcoin — typically after BTC establishes new highs","The annual launch of new blockchains","When stablecoins gain market dominance"]',
 1,'medium','Altcoin season typically follows Bitcoin''s rise — once BTC stabilizes at higher levels, capital rotates into altcoins seeking higher percentage gains, causing broad market rallies.'),
('bu2','bull-market','What is "euphoria" in market cycle terms?',
 '["A type of bullish candlestick pattern","The final stage of a bull market where everyone is convinced prices will rise forever — typically marks the top","A DeFi protocol for leveraged yields","A type of options strategy"]',
 1,'hard','Euphoria is the most dangerous phase — parabolic price rises, mainstream media coverage, and universal bullishness signal the cycle top. Most retail investors buy here, just before the crash.'),
('bu3','bull-market','What is the most disciplined approach to taking profits in a bull market?',
 '["Sell everything at the first sign of a top","Set predetermined profit targets and take partial profits at each level","Wait for the absolute top before selling","Follow social media to know when to sell"]',
 1,'medium','Predetermined profit targets remove emotion — taking 20% off at 2x, 30% at 5x, etc. allows you to secure gains while maintaining upside exposure. No one sells the exact top.'),
('bu4','bull-market','Why do many retail investors lose money even in bull markets?',
 '["Markets are rigged against retail","They buy late during FOMO peaks and sell early during corrections","Bull markets are too short for retail to profit","Exchanges charge too many fees"]',
 1,'medium','Retail investors typically enter during peak hype (high prices) driven by FOMO, then panic sell during normal 20-40% corrections — missing the full bull run and locking in losses.'),
('bu5','bull-market','What does a rising Bitcoin dominance during a bull market suggest?',
 '["Altcoins are outperforming","Capital is flowing into Bitcoin rather than spreading into altcoins — altcoin season has not started yet","The bull market is ending","Bitcoin is being manipulated"]',
 1,'hard','Bitcoin dominance measures BTC''s share of total crypto market cap. When dominance rises during a bull run, money is flowing into BTC first — altcoin season typically starts when BTC dominance peaks and reverses.')

on conflict (question_id) do update set
  zone_id = excluded.zone_id,
  question_text = excluded.question_text,
  options = excluded.options,
  correct_index = excluded.correct_index,
  difficulty = excluded.difficulty,
  explanation = excluded.explanation;
