interface AnalysisResult {
  marketBias: string;
  marketStructure: string;
  liquidity: string;
  orderBlock: string;
  fvg: string;
  supplyDemand: string;
  keyLevel: string;
  premiumDiscount: string;
  entryScalping: string;
  entryIntraday: string;
  entrySwing: string;
  entryPrice: number;
  stopLoss: number;
  tp1: number;
  tp2: number;
  tp3: number;
  riskReward: number;
  confidenceScore: number;
  annotations: string;
}

const PAIRS: Record<string, { base: number; pip: number }> = {
  XAUUSD: { base: 2340, pip: 0.1 },
  EURUSD: { base: 1.085, pip: 0.0001 },
  GBPUSD: { base: 1.265, pip: 0.0001 },
  USDJPY: { base: 149.5, pip: 0.01 },
  BTCUSD: { base: 67000, pip: 1 },
  ETHUSD: { base: 3500, pip: 0.1 },
};

function seedRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function pick<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

function fmt(value: number, pair: string): number {
  if (pair === "USDJPY") return Math.round(value * 100) / 100;
  if (pair === "XAUUSD") return Math.round(value * 10) / 10;
  if (pair === "BTCUSD") return Math.round(value);
  if (pair === "ETHUSD") return Math.round(value * 10) / 10;
  return Math.round(value * 10000) / 10000;
}

export function runAnalysisEngine(pair: string, timeframe: string, imageSeed: number): AnalysisResult {
  const pairUpper = pair.toUpperCase();
  const pairConfig = PAIRS[pairUpper] ?? { base: 1.0, pip: 0.0001 };
  const seed = imageSeed + pairUpper.split("").reduce((a, c) => a + c.charCodeAt(0), 0) + timeframe.length * 17;
  const rng = seedRng(seed);

  const bullish = rng() > 0.45;
  const marketBias = bullish ? "Bullish" : "Bearish";

  const structures = bullish
    ? ["BOS Confirmed — Higher High forming. Market in uptrend with internal bullish structure intact.", "CHOCH Detected — Bullish shift in market structure after sweeping previous lows.", "MSS Active — Market structure shift bullish above key swing high."]
    : ["BOS Confirmed — Lower Low forming. Market in downtrend with internal bearish structure intact.", "CHOCH Detected — Bearish shift in market structure after sweeping previous highs.", "MSS Active — Market structure shift bearish below key swing low."];
  const marketStructure = pick(structures, rng);

  const liquidities = bullish
    ? ["Buy Side Liquidity resting above Equal Highs — prime target for institutional sweep before continuation.", "Stop Hunt detected on sell side — engineered liquidity sweep completed, bullish continuation expected.", "Equal Highs identified as buy-side liquidity pool — likely target before major move."]
    : ["Sell Side Liquidity resting below Equal Lows — prime target for institutional sweep before continuation.", "Stop Hunt detected on buy side — engineered liquidity sweep completed, bearish continuation expected.", "Equal Lows identified as sell-side liquidity pool — likely target before major move."];
  const liquidity = pick(liquidities, rng);

  const obs = bullish
    ? ["Bullish Order Block identified at demand zone — institutional accumulation evident.", "Mitigation Block active — previously bearish OB now mitigated and flipped bullish.", "Breaker Block confirmed — previous bearish OB broken, now acting as bullish support."]
    : ["Bearish Order Block identified at supply zone — institutional distribution evident.", "Mitigation Block active — previously bullish OB now mitigated and flipped bearish.", "Breaker Block confirmed — previous bullish OB broken, now acting as bearish resistance."];
  const orderBlock = pick(obs, rng);

  const fvgs = bullish
    ? ["Fair Value Gap detected — bullish imbalance present. Price likely to revisit FVG for equilibrium before continuation.", "Inverse FVG identified — price has filled previous bearish imbalance and confirmed bullish intent."]
    : ["Fair Value Gap detected — bearish imbalance present. Price likely to revisit FVG for equilibrium before continuation.", "Inverse FVG identified — price has filled previous bullish imbalance and confirmed bearish intent."];
  const fvg = pick(fvgs, rng);

  const sds = bullish
    ? ["Demand Zone active — strong institutional buying pressure at current levels. Fresh demand not yet tested.", "Supply absorbed — previous supply zone cleared, demand zone structure holding strong."]
    : ["Supply Zone active — strong institutional selling pressure at current levels. Fresh supply not yet tested.", "Demand absorbed — previous demand zone cleared, supply zone structure holding strong."];
  const supplyDemand = pick(sds, rng);

  const tfMultiplier: Record<string, number> = { M1: 1, M5: 2, M15: 3, M30: 4, H1: 6, H4: 10, D1: 20 };
  const tfMult = tfMultiplier[timeframe] ?? 5;
  const keyLevels = [
    `Daily High: ${fmt(pairConfig.base * (1 + 0.003 * tfMult), pairUpper)} | Daily Low: ${fmt(pairConfig.base * (1 - 0.003 * tfMult), pairUpper)}`,
    `Weekly High: ${fmt(pairConfig.base * (1 + 0.008 * tfMult), pairUpper)} | Weekly Low: ${fmt(pairConfig.base * (1 - 0.008 * tfMult), pairUpper)}`,
    `Monthly High: ${fmt(pairConfig.base * (1 + 0.015 * tfMult), pairUpper)} | Monthly Low: ${fmt(pairConfig.base * (1 - 0.015 * tfMult), pairUpper)}`,
  ];
  const keyLevel = pick(keyLevels, rng);

  const position = rng();
  let premiumDiscount: string;
  if (position > 0.65) {
    premiumDiscount = "Premium Zone — price trading above equilibrium (50% level). Sell-side bias in premium.";
  } else if (position < 0.35) {
    premiumDiscount = "Discount Zone — price trading below equilibrium (50% level). Buy-side bias in discount.";
  } else {
    premiumDiscount = "Equilibrium Zone — price at 50% of the dealing range. Neutral zone, wait for displacement.";
  }

  const base = pairConfig.base * (1 + (rng() - 0.5) * 0.005);
  const pipSize = pairConfig.pip * tfMult;

  const entryOffset = (rng() - 0.5) * pipSize * 3;
  const entryPrice = fmt(base + entryOffset, pairUpper);

  const slPips = pipSize * (5 + rng() * 15);
  const stopLoss = bullish ? fmt(entryPrice - slPips, pairUpper) : fmt(entryPrice + slPips, pairUpper);

  const rrMultiplier = [1.5, 2.0, 2.5, 3.0, 3.5, 4.0];
  const rr1 = pick(rrMultiplier, rng);
  const risk = Math.abs(entryPrice - stopLoss);
  const tp1 = bullish ? fmt(entryPrice + risk * rr1, pairUpper) : fmt(entryPrice - risk * rr1, pairUpper);
  const tp2 = bullish ? fmt(entryPrice + risk * (rr1 + 1.5), pairUpper) : fmt(entryPrice - risk * (rr1 + 1.5), pairUpper);
  const tp3 = bullish ? fmt(entryPrice + risk * (rr1 + 3.5), pairUpper) : fmt(entryPrice - risk * (rr1 + 3.5), pairUpper);
  const riskReward = Math.round(rr1 * 10) / 10;

  const scalpingEntries = bullish
    ? [`Long scalp entry at ${fmt(entryPrice, pairUpper)} — target the nearest swing high`, `Buy on FVG retest at ${fmt(entryPrice - risk * 0.2, pairUpper)}`]
    : [`Short scalp entry at ${fmt(entryPrice, pairUpper)} — target the nearest swing low`, `Sell on FVG retest at ${fmt(entryPrice + risk * 0.2, pairUpper)}`];
  const entryScalping = pick(scalpingEntries, rng);

  const intradayEntries = bullish
    ? [`Intraday long from OB zone at ${fmt(entryPrice, pairUpper)} — hold through session, TP at ${tp1}`, `H1 bullish OB confirmed — enter on M15 close above ${fmt(entryPrice, pairUpper)}`]
    : [`Intraday short from supply zone at ${fmt(entryPrice, pairUpper)} — hold through session, TP at ${tp1}`, `H1 bearish OB confirmed — enter on M15 close below ${fmt(entryPrice, pairUpper)}`];
  const entryIntraday = pick(intradayEntries, rng);

  const swingEntries = bullish
    ? [`Swing long at ${fmt(entryPrice, pairUpper)} — multi-day hold targeting weekly high at ${tp3}`, `H4 demand confluence — swing buy targeting ${tp2} to ${tp3} over 3-5 days`]
    : [`Swing short at ${fmt(entryPrice, pairUpper)} — multi-day hold targeting weekly low at ${tp3}`, `H4 supply confluence — swing sell targeting ${tp2} to ${tp3} over 3-5 days`];
  const entrySwing = pick(swingEntries, rng);

  const hasBos = rng() > 0.3;
  const hasChoch = rng() > 0.4;
  const hasLiquiditySweep = rng() > 0.35;
  const hasOb = rng() > 0.25;
  const hasFvg = rng() > 0.4;
  const hasSmt = rng() > 0.5;
  const hasSr = rng() > 0.35;
  const hasPd = rng() > 0.4;

  const bosScore = hasBos ? 15 : 0;
  const chochScore = hasChoch ? 15 : 0;
  const liqScore = hasLiquiditySweep ? 15 : 0;
  const obScore = hasOb ? 15 : 0;
  const fvgScore = hasFvg ? 10 : 0;
  const smtScore = hasSmt ? 10 : 0;
  const srScore = hasSr ? 10 : 0;
  const pdScore = hasPd ? 10 : 0;
  const confidenceScore = Math.min(100, bosScore + chochScore + liqScore + obScore + fvgScore + smtScore + srScore + pdScore);

  const annotations = JSON.stringify({
    bias: marketBias.toLowerCase(),
    zones: [
      { type: bullish ? "buy" : "sell", label: bullish ? "Buy Zone / Demand" : "Sell Zone / Supply", x: 5, y: bullish ? 60 : 15, w: 90, h: 20 },
      { type: "liquidity", label: "Liquidity Pool", x: 5, y: bullish ? 5 : 75, w: 90, h: 10 },
      { type: "ob", label: bullish ? "Bullish OB" : "Bearish OB", x: 10, y: bullish ? 45 : 30, w: 40, h: 12 },
      { type: "fvg", label: "Fair Value Gap", x: 55, y: bullish ? 35 : 45, w: 35, h: 8 },
      { type: bullish ? "buy" : "sell", label: "Entry", x: 5, y: 50, w: 90, h: 3 },
    ],
  });

  return {
    marketBias,
    marketStructure,
    liquidity,
    orderBlock,
    fvg,
    supplyDemand,
    keyLevel,
    premiumDiscount,
    entryScalping,
    entryIntraday,
    entrySwing,
    entryPrice,
    stopLoss,
    tp1,
    tp2,
    tp3,
    riskReward,
    confidenceScore,
    annotations,
  };
}
