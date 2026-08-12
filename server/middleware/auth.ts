import type { Request, Response, NextFunction } from 'express';
import { sessionRepository, farmerRepository } from '../repositories/index.ts';
import { UnauthorizedError } from '../domain/errors.ts';
import { env } from '../config/env.ts';
import type { FarmerRecord } from '../repositories/InMemoryFarmerRepository.ts';

declare global {
  namespace Express {
    interface Request {
      farmer?: FarmerRecord;
    }
  }
}

/** Requires a valid session; attaches req.farmer or responds 401. */
export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.[env.SESSION_COOKIE_NAME];
  if (!token) {
    next(new UnauthorizedError('Sign in required.'));
    return;
  }

  const session = await sessionRepository.findValid(token);
  if (!session) {
    next(new UnauthorizedError('Session expired — please sign in again.'));
    return;
  }

  const farmer = await farmerRepository.findById(session.farmerId);
  if (!farmer) {
    next(new UnauthorizedError('Account not found.'));
    return;
  }

  req.farmer = farmer;
  next();
}

/** Attaches req.farmer if a valid session exists, but never rejects the request. */
export async function attachFarmerIfPresent(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.[env.SESSION_COOKIE_NAME];
  if (!token) {
    next();
    return;
  }
  const session = await sessionRepository.findValid(token);
  if (session) {
    req.farmer = (await farmerRepository.findById(session.farmerId)) ?? undefined;
  }
  next();
}
