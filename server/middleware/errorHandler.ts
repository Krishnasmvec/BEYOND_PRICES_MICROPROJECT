import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../domain/errors.ts';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    res.status(err.status).json({ error: err.code, message: err.message });
    return;
  }
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Something went wrong.' });
}

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: 'NOT_FOUND', message: 'Route not found.' });
}
