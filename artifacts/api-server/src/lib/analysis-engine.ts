import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY environment variable is required.");
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface AnalysisResult {
  noValidSetup: boolean;
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

const NO_VALID_SETUP: AnalysisResult = {
  noValidSetup: true,
  marketBias: "NO VALID SETUP FOUND",
  marketStructure: "N/A — Chart unclear or no valid setup detected.",
  liquidity: "N/A — Chart unclear or no valid setup detected.",
  orderBlock: "N/A — Chart unclear or no valid setup detected.",
  fvg: "N/A — Chart unclear or no valid setup detected.",
  supplyDemand: "N/A — Chart unclear or no valid setup detected.",
  keyLevel: "N/A — Chart unclear or no valid setup detected.",
  premiumDiscount: "N/A — Chart unclear or no valid setup detected.",
  entryScalping: "N/A — No valid setup identified.",
  entryIntraday: "N/A — No valid setup identified.",
  entrySwing: "N/A — No valid setup identified.",
  entryPrice: 0,
  stopLoss: 0,
  tp1: 0,
  tp2: 0,
  tp3: 0,
  riskReward: 0,
  confidenceScore: 0,
  annotations: JSON.stringify({ bias: "neutral", zones: [] }),
};

const SYSTEM_PROMPT = `You are an expert Smart Money Concepts (SMC) and ICT (Inner Circle Trader) technical analyst with deep knowledge of institutional trading patterns.

You analyze trading chart screenshots and identify:
- BOS (Break of Structure), CHOCH (Change of Character), MSS (Market Structure Shift)
- Buy-side liquidity (BSL), sell-side liquidity (SSL), equal highs/lows, engineered liquidity, stop hunts
- Bullish/Bearish Order Blocks, Mitigation Blocks, Breaker Blocks, Rejection Blocks
- Fair Value Gaps (FVGs), bullish/bearish imbalances, inverse FVGs
- Supply and Demand zones — fresh vs. tested, institutional accumulation/distribution
- Key price levels (daily/weekly/monthly highs and lows, previous session highs/lows)
- Premium and Discount zones relative to the 50% equilibrium of the dealing range
- ICT concepts: Optimal Trade Entry (OTE), kill zones, displacement candles, inducements

CRITICAL RULES:
1. You ONLY produce analysis based on what you can ACTUALLY SEE in the chart image.
2. You NEVER fabricate, invent, or guess price levels, setups, or patterns.
3. If you cannot clearly read price levels from the chart, set noValidSetup to true.
4. If the chart image is blurry, too small, not a trading chart, or lacks sufficient context, set noValidSetup to true.
5. If signals are ambiguous or contradictory with low conviction, set noValidSetup to true.
6. Do NOT generate random trade setups under any circumstances.

RESPONSE FORMAT:
Respond with ONLY a valid JSON object. No markdown, no code fences, no explanation outside the JSON.

JSON schema (all fields required):
{
  "noValidSetup": boolean,
  "marketBias": "Bullish" | "Bearish" | "Neutral",
  "marketStructure": string,
  "liquidity": string,
  "orderBlock": string,
  "fvg": string,
  "supplyDemand": string,
  "keyLevel": string,
  "premiumDiscount": string,
  "entryScalping": string,
  "entryIntraday": string,
  "entrySwing": string,
  "entryPrice": number,
  "stopLoss": number,
  "tp1": number,
  "tp2": number,
  "tp3": number,
  "riskReward": number,
  "confidenceScore": number,
  "annotations": string
}

The "annotations" field must be a JSON-encoded string:
{"bias":"bullish"|"bearish"|"neutral","zones":[{"type":"buy"|"sell"|"ob"|"fvg"|"liquidity","label":"<text>","x":<0-100>,"y":<0-100>,"w":<1-90>,"h":<1-30>}]}

CONFIDENCE SCORING:
- 80–100: Clear setup with strong multi-confluence (BOS + OB + FVG alignment, clear price levels)
- 60–79: Good setup with 2–3 confluences and readable price levels
- 40–59: Moderate setup, some ambiguity, partial confluence
- 20–39: Weak setup, low conviction, unclear levels
- 0–19: No valid setup → set noValidSetup: true

When noValidSetup is true:
- Set marketBias to "NO VALID SETUP FOUND"
- Set ALL string analysis fields to "N/A — Chart unclear or no valid setup detected."
- Set entryScalping, entryIntraday, entrySwing to "N/A — No valid setup identified."
- Set ALL numeric fields (entryPrice, stopLoss, tp1, tp2, tp3, riskReward, confidenceScore) to 0
- Set annotations to {"bias":"neutral","zones":[]}`;

function buildUserPrompt(pair: string, timeframe: string): string {
  return `Analyze this ${pair} ${timeframe} chart screenshot using Smart Money Concepts (SMC) and ICT methodology.

Carefully examine and report on EVERY visible element:

MARKET STRUCTURE:
- Identify all BOS (Break of Structure) levels — mark whether bullish or bearish
- Identify any CHOCH (Change of Character) — note the shift direction
- Describe the current trend: Higher Highs/Higher Lows (bullish) or Lower Lows/Lower Highs (bearish)

LIQUIDITY:
- Identify buy-side liquidity pools (BSL) above equal highs or previous swing highs
- Identify sell-side liquidity pools (SSL) below equal lows or previous swing lows
- Note any recent liquidity sweeps or stop hunts visible on the chart

ORDER BLOCKS:
- Identify the most recent/relevant bullish or bearish order block
- Note if it is fresh (untested) or has been partially mitigated
- Describe the candle formation and price level

FAIR VALUE GAPS (FVG):
- Identify any visible bullish or bearish FVGs (3-candle imbalances)
- Note if price is currently inside an FVG or approaching one

SUPPLY & DEMAND:
- Identify the key supply zone (for shorts) or demand zone (for longs)
- Describe whether it is fresh, tested, or flipped

KEY LEVELS:
- State the visible daily/weekly high and low if identifiable
- Note any significant round numbers or previous session highs/lows

PREMIUM / DISCOUNT:
- Estimate the dealing range and where current price sits relative to the 50% equilibrium
- State clearly: Premium (above 50%), Discount (below 50%), or Equilibrium

TRADE SETUP (only if you have at least 40% confidence):
- entryPrice: The specific price level for entry (must be visible on chart)
- stopLoss: Below the OB/demand zone for longs, above OB/supply zone for shorts
- tp1: First target — nearest FVG fill or swing high/low
- tp2: Second target — next liquidity pool
- tp3: Third target — major structure high/low or weekly level
- riskReward: Calculate as (tp1 - entryPrice) / (entryPrice - stopLoss) for longs
- entryScalping: Quick entry description with exact price for fast moves
- entryIntraday: Intraday hold entry with session context
- entrySwing: Multi-day swing entry targeting tp2/tp3

Return ONLY the JSON object with no surrounding text.`;
}

function extractJson(raw: string): string {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON object found in response");
  return raw.slice(start, end + 1);
}

function validateAndNormalise(parsed: Record<string, unknown>): AnalysisResult {
  if (parsed.noValidSetup === true) return NO_VALID_SETUP;

  const confidenceScore = typeof parsed.confidenceScore === "number" ? Math.round(parsed.confidenceScore) : 0;
  if (confidenceScore < 20) return NO_VALID_SETUP;

  const entryPrice = typeof parsed.entryPrice === "number" ? parsed.entryPrice : 0;
  const stopLoss = typeof parsed.stopLoss === "number" ? parsed.stopLoss : 0;
  const tp1 = typeof parsed.tp1 === "number" ? parsed.tp1 : 0;
  const tp2 = typeof parsed.tp2 === "number" ? parsed.tp2 : 0;
  const tp3 = typeof parsed.tp3 === "number" ? parsed.tp3 : 0;

  if (entryPrice === 0 || stopLoss === 0 || tp1 === 0) return NO_VALID_SETUP;

  const risk = Math.abs(entryPrice - stopLoss);
  const reward = Math.abs(tp1 - entryPrice);
  const computedRR = risk > 0 ? Math.round((reward / risk) * 10) / 10 : 0;
  const riskReward =
    typeof parsed.riskReward === "number" && parsed.riskReward > 0
      ? Math.round(parsed.riskReward * 10) / 10
      : computedRR;

  let annotations = typeof parsed.annotations === "string" ? parsed.annotations : "";
  try {
    JSON.parse(annotations);
  } catch {
    const bias = String(parsed.marketBias ?? "neutral").toLowerCase();
    annotations = JSON.stringify({
      bias: bias.includes("bull") ? "bullish" : bias.includes("bear") ? "bearish" : "neutral",
      zones: [],
    });
  }

  return {
    noValidSetup: false,
    marketBias: String(parsed.marketBias ?? "Neutral"),
    marketStructure: String(parsed.marketStructure ?? "N/A"),
    liquidity: String(parsed.liquidity ?? "N/A"),
    orderBlock: String(parsed.orderBlock ?? "N/A"),
    fvg: String(parsed.fvg ?? "N/A"),
    supplyDemand: String(parsed.supplyDemand ?? "N/A"),
    keyLevel: String(parsed.keyLevel ?? "N/A"),
    premiumDiscount: String(parsed.premiumDiscount ?? "N/A"),
    entryScalping: String(parsed.entryScalping ?? "N/A"),
    entryIntraday: String(parsed.entryIntraday ?? "N/A"),
    entrySwing: String(parsed.entrySwing ?? "N/A"),
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

export async function runAnalysisEngine(
  pair: string,
  timeframe: string,
  imageBase64: string,
): Promise<AnalysisResult> {
  const mimeType = imageBase64.startsWith("/9j/") ? "image/jpeg" : "image/png";
  const dataUrl = `data:${mimeType};base64,${imageBase64}`;

  let raw: string;
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 2048,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: dataUrl, detail: "high" },
            },
            { type: "text", text: buildUserPrompt(pair, timeframe) },
          ],
        },
      ],
    });

    raw = response.choices[0]?.message?.content ?? "";
    if (!raw) return NO_VALID_SETUP;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`OpenAI Vision API error: ${msg}`);
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(extractJson(raw));
  } catch {
    return NO_VALID_SETUP;
  }

  return validateAndNormalise(parsed);
}
