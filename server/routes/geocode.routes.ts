import { Router } from 'express';
import { reverseGeocode } from '../services/geocodingService.ts';
import { nominatimRateLimit } from '../middleware/rateLimiter.ts';
import { ValidationError } from '../domain/errors.ts';

export const geocodeRouter = Router();

geocodeRouter.get('/reverse', nominatimRateLimit, async (req, res) => {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  if (!req.query.lat || !req.query.lng) {
    throw new ValidationError('lat and lng query params are required.');
  }

  const location = await reverseGeocode(lat, lng);
  res.json({ location });
});
