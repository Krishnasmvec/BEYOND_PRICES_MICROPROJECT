import { Router } from 'express';
import { generatePrediction, generateConsumerInsights } from '../services/geminiPredictionService.ts';
import { rateLimit } from '../middleware/rateLimiter.ts';
import { attachFarmerIfPresent, requireAuth } from '../middleware/auth.ts';
import { predictionHistoryRepository } from '../repositories/index.ts';
import { ValidationError } from '../domain/errors.ts';
import type { UserInput } from '../../types.ts';

export const predictionsRouter = Router();

// Gemini calls cost real money per request and the key now lives only on
// this server — rate-limit per IP so an abusive client can't run up billing.
const predictionRateLimit = rateLimit({ windowMs: 60_000, max: 10 });

predictionsRouter.post('/farmer', predictionRateLimit, attachFarmerIfPresent, async (req, res) => {
  const input = req.body as UserInput;
  if (!input || typeof input.location !== 'string' || !input.location.trim()) {
    throw new ValidationError('A location is required.');
  }

  const prediction = await generatePrediction(input);

  // Predictions are only persisted to history for signed-in farmers —
  // anonymous browsing stays anonymous, per the auth-placement decision.
  if (req.farmer) {
    await predictionHistoryRepository.createBounded({
      id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      farmerId: req.farmer.id,
      timestamp: Date.now(),
      input,
      prediction,
      status: 'Pending',
    });
  }

  res.json(prediction);
});

predictionsRouter.post('/consumer', predictionRateLimit, async (req, res) => {
  const { location, preferences } = req.body as { location: string; preferences?: any[] };
  if (!location || !location.trim()) {
    throw new ValidationError('A location is required.');
  }

  const insights = await generateConsumerInsights({ location, preferences: preferences ?? [] });
  res.json(insights);
});

predictionsRouter.get('/mine', requireAuth, async (req, res) => {
  const history = await predictionHistoryRepository.findByFarmer(req.farmer!.id);
  res.json(history);
});
