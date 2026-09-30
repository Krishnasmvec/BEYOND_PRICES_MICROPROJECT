import { SCORE_WEIGHTS } from '../config/recommendationWeights.ts';
import type { MarketScoreBreakdown } from '../../shared/types.ts';

export function calculateRecommendationScore(
  netReturnScore: number,
  priceTrendScore: number,
  transportCostScore: number,
  distanceScore: number,
  storageRiskScore: number,
  productAvailabilityScore: number
): { score: number; scoreBreakdown: MarketScoreBreakdown } {
  const scoreBreakdown: MarketScoreBreakdown = {
    netReturn: Math.round(netReturnScore * 100),
    priceTrend: Math.round(priceTrendScore * 100),
    transportCost: Math.round(transportCostScore * 100),
    distance: Math.round(distanceScore * 100),
    storageRisk: Math.round(storageRiskScore * 100),
    productAvailability: Math.round(productAvailabilityScore * 100),
  };

  const score =
    netReturnScore * SCORE_WEIGHTS.netReturn +
    priceTrendScore * SCORE_WEIGHTS.priceTrend +
    transportCostScore * SCORE_WEIGHTS.transportCost +
    distanceScore * SCORE_WEIGHTS.distance +
    storageRiskScore * SCORE_WEIGHTS.storageRisk +
    productAvailabilityScore * SCORE_WEIGHTS.productAvailability;

  return {
    score: Math.round(score * 100),
    scoreBreakdown,
  };
}
