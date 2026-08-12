import { Router } from 'express';
import { searchProducts } from '../services/productService.ts';
import { fetchWeatherByLocationText } from '../services/marketService.ts';
import { analyzeMarkets } from '../services/farmerAnalysisService.ts';
import { explainRecommendation } from '../services/farmerExplanationService.ts';
import { nominatimRateLimit, rateLimit } from '../middleware/rateLimiter.ts';
import { requireAuth } from '../middleware/auth.ts';
import { analysisRepository } from '../repositories/index.ts';
import { ValidationError } from '../domain/errors.ts';
import type { MarketAnalysisInput, SavedAnalysis } from '../../types.ts';

export const farmerRouter = Router();

// Gemini's explanation call is optional per market-analysis request, but
// still real API spend — rate-limit the whole analysis endpoint per IP
// the same way predictions.routes.ts limits farmer prediction requests.
const analysisRateLimit = rateLimit({ windowMs: 60_000, max: 10 });

farmerRouter.get('/products', async (req, res) => {
  const search = typeof req.query.search === 'string' ? req.query.search : undefined;
  const category = typeof req.query.category === 'string' ? req.query.category : undefined;
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const products = await searchProducts(search, category, limit);
  res.json(products);
});

farmerRouter.get('/climate', async (req, res) => {
  const location = typeof req.query.location === 'string' ? req.query.location : undefined;
  if (!location || !location.trim()) {
    throw new ValidationError('A location is required.');
  }
  const weather = await fetchWeatherByLocationText(location);
  res.json({ weather });
});

farmerRouter.post('/analysis', analysisRateLimit, nominatimRateLimit, async (req, res) => {
  const input = req.body as MarketAnalysisInput;

  if (!input || !Array.isArray(input.products) || input.products.length === 0) {
    throw new ValidationError('At least one product is required.');
  }
  for (const product of input.products) {
    if (!product.productId || !(product.quantity > 0)) {
      throw new ValidationError('Every product needs a valid productId and a positive quantity.');
    }
  }
  if (!input.location || !input.location.trim()) {
    throw new ValidationError('A farm location is required.');
  }

  const recommendations = await analyzeMarkets(input);

  // Gemini's explanation is best-effort and only attempted for the top
  // result — it never blocks the response if it fails or is slow to a
  // degree that would hurt the request (explainRecommendation already
  // catches its own errors and returns undefined rather than throwing).
  if (recommendations[0]) {
    recommendations[0].explanation = await explainRecommendation(recommendations[0]);
  }

  res.json(recommendations);
});

farmerRouter.get('/analyses/mine', requireAuth, async (req, res) => {
  const analyses = await analysisRepository.findByFarmer(req.farmer!.id);
  res.json(analyses);
});

farmerRouter.post('/analyses', requireAuth, async (req, res) => {
  const { input, topMarketName, topScore } = req.body as { input: MarketAnalysisInput; topMarketName: string; topScore: number };
  if (!input || !topMarketName || typeof topScore !== 'number') {
    throw new ValidationError('A completed analysis is required to save.');
  }

  const saved: SavedAnalysis = {
    id: `analysis-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    farmerId: req.farmer!.id,
    timestamp: Date.now(),
    input,
    topMarketName,
    topScore,
    status: 'Saved',
  };

  await analysisRepository.createBounded(saved);
  res.status(201).json(saved);
});
