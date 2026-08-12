import type { Request, Response, NextFunction } from 'express';
import { RateLimitError } from '../domain/errors.ts';

interface Bucket {
  count: number;
  windowStart: number;
}

/**
 * Minimal in-memory fixed-window rate limiter, keyed by a caller-supplied
 * function (IP by default). Good enough for a single-process demo backend;
 * a multi-instance deployment would need a shared store (Redis) instead.
 */
export function rateLimit(options: { windowMs: number; max: number; keyFn?: (req: Request) => string }) {
  const buckets = new Map<string, Bucket>();
  const keyFn = options.keyFn ?? ((req: Request) => req.ip ?? 'unknown');

  return (req: Request, _res: Response, next: NextFunction) => {
    const key = keyFn(req);
    const now = Date.now();
    const bucket = buckets.get(key);

    if (!bucket || now - bucket.windowStart > options.windowMs) {
      buckets.set(key, { count: 1, windowStart: now });
      next();
      return;
    }

    if (bucket.count >= options.max) {
      next(new RateLimitError('Too many requests — please wait a moment and try again.'));
      return;
    }

    bucket.count += 1;
    next();
  };
}

// Nominatim's usage policy caps at ~1 req/sec for the whole calling server,
// not per end-user. This single shared instance (constant key, imported by
// every route that calls reverseGeocode/forwardGeocode) is what makes that
// true — two separately-instantiated limiters would each allow 1/sec,
// letting the combined outbound rate exceed Nominatim's real policy.
export const nominatimRateLimit = rateLimit({ windowMs: 1000, max: 1, keyFn: () => 'nominatim-global' });
