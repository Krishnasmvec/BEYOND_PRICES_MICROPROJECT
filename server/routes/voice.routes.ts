import { Router } from 'express';
import { mintVoiceToken } from '../services/geminiLiveTokenService.ts';
import { rateLimit } from '../middleware/rateLimiter.ts';
import { ValidationError } from '../domain/errors.ts';
import type { PredictionResult } from '../../types.ts';

export const voiceRouter = Router();

// Minting still costs a Live API session — rate-limit per IP same as text predictions.
const voiceTokenLimit = rateLimit({ windowMs: 60_000, max: 10 });

voiceRouter.post('/ephemeral-token', voiceTokenLimit, async (req, res) => {
  const predictionContext = req.body as PredictionResult;
  if (!predictionContext || typeof predictionContext.best_market !== 'string') {
    throw new ValidationError('A valid prediction context is required.');
  }

  const result = await mintVoiceToken(predictionContext);
  res.json(result);
});
