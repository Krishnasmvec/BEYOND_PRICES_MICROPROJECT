import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { env } from '../config/env.ts';
import type { MarketRecommendation } from '../../types.ts';

const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

/**
 * Optional, additive-only. Takes an already-computed, fully-verified
 * MarketRecommendation (every number in it traces to a Supabase column or a
 * deterministic calculation in farmerAnalysisService.ts) and asks Gemini for
 * one short explanatory paragraph over those facts — never the source of a
 * number itself. On any failure (timeout, API error, empty response) this
 * returns undefined rather than throwing, so a farmer never sees an error
 * screen just because the optional prose layer failed; the deterministic
 * `whyBullets` on the recommendation are already sufficient on their own.
 */
export async function explainRecommendation(recommendation: MarketRecommendation): Promise<string | undefined> {
  const facts = {
    market: recommendation.marketName,
    district: recommendation.district,
    distanceKm: recommendation.distanceKm,
    travelTimeMins: recommendation.travelTimeMins,
    recommendationScore: recommendation.score,
    scoreBreakdown: recommendation.scoreBreakdown,
    costBreakdown: recommendation.costBreakdown,
    offers: recommendation.offers.map((o) => ({ product: o.productName, price: o.price, unit: o.unit })),
    priceTrends: recommendation.priceInsights.map((p) => ({ product: p.productId, trend: p.trend })),
    storageRisks: recommendation.storageRisks.map((r) => ({ product: r.productName, level: r.level })),
  };

  const prompt = `You are explaining a market recommendation to a farmer, in plain language, in 2-3 short sentences.

You are given ONLY the following verified facts as JSON. You MUST NOT state any price, distance, cost, or other number that is not present in this JSON. If a fact needed to fully justify the recommendation is missing from the JSON, say it is unavailable rather than inventing it. Do not use technical jargon.

FACTS:
${JSON.stringify(facts, null, 2)}

Write the 2-3 sentence explanation now, nothing else.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } },
    });
    const text = response.text?.trim();
    return text && text.length > 0 ? text : undefined;
  } catch (err) {
    console.error('Gemini explanation failed (non-fatal, falling back to deterministic bullets only):', err);
    return undefined;
  }
}
