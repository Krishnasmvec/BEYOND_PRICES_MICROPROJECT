import { Router } from 'express';
import { marketRepository, stallRepository } from '../repositories/index.ts';
import { forwardGeocode } from '../services/geocodingService.ts';
import { fetchNearbyMarkets, fetchMarketDetail } from '../services/marketService.ts';
import { nominatimRateLimit } from '../middleware/rateLimiter.ts';
import { NotFoundError, ValidationError } from '../domain/errors.ts';
import type { MarketStall } from '../../shared/types.ts';

export const marketsRouter = Router();

// Farmer-side stall booking — in-memory, untouched, its own market_id space
// (m1-m4), unrelated to the Supabase-backed Consumer Market Discovery below.
marketsRouter.get('/', async (_req, res) => {
  const markets = await marketRepository.findAll();
  const withOccupancy = await Promise.all(
    markets.map(async (market) => {
      const stalls = await stallRepository.findByMarket(market.id);
      const booked = stalls.filter((s) => s.status === 'booked').length;
      return {
        ...market,
        currentOccupancy: stalls.length > 0 ? Math.round((booked / stalls.length) * 100) : 0,
      };
    })
  );
  res.json(withOccupancy);
});

marketsRouter.get('/:marketId/stalls', async (req, res) => {
  const market = await marketRepository.findById(req.params.marketId);
  if (!market) throw new NotFoundError('Market not found.');

  const statusFilter = req.query.status as MarketStall['status'] | undefined;
  const stalls = await stallRepository.findByMarket(req.params.marketId, statusFilter);
  res.json(stalls);
});

// Consumer Market Discovery — Supabase-backed (server/services/marketService.ts).
marketsRouter.get('/nearby', nominatimRateLimit, async (req, res) => {
  const location = req.query.location as string | undefined;
  if (!location || !location.trim()) throw new ValidationError('A location is required.');

  const origin = await forwardGeocode(location);
  const markets = await fetchNearbyMarkets(origin);
  res.json(markets);
});

marketsRouter.get('/:marketId/products', async (req, res) => {
  const detail = await fetchMarketDetail(req.params.marketId);
  if (!detail) throw new NotFoundError('Market not found.');
  res.json(detail);
});
