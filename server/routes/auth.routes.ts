import { Router } from 'express';
import { requestOtp, verifyOtp, logout } from '../services/authService.ts';
import { requireAuth } from '../middleware/auth.ts';
import { rateLimit } from '../middleware/rateLimiter.ts';
import { farmerRepository } from '../repositories/index.ts';
import { ValidationError } from '../domain/errors.ts';
import { env } from '../config/env.ts';

export const authRouter = Router();

const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: env.NODE_ENV === 'production',
  maxAge: 30 * 24 * 60 * 60 * 1000,
};

// OTPs are cheap to spam-request; rate-limit per phone number, not just per IP.
const otpRequestLimit = rateLimit({ windowMs: 10 * 60_000, max: 3, keyFn: (req) => `otp:${req.body?.phone}` });

authRouter.post('/otp/request', otpRequestLimit, async (req, res) => {
  const { phone } = req.body as { phone?: string };
  if (!phone) throw new ValidationError('phone is required.');
  const result = await requestOtp(phone);
  res.json(result);
});

authRouter.post('/otp/verify', async (req, res) => {
  const { requestId, code } = req.body as { requestId?: string; code?: string };
  if (!requestId || !code) throw new ValidationError('requestId and code are required.');

  const { token, farmer } = await verifyOtp(requestId, code);
  res.cookie(env.SESSION_COOKIE_NAME, token, cookieOptions);
  res.json({ farmer });
});

authRouter.post('/logout', requireAuth, async (req, res) => {
  const token = req.cookies?.[env.SESSION_COOKIE_NAME];
  if (token) await logout(token);
  res.clearCookie(env.SESSION_COOKIE_NAME);
  res.json({ ok: true });
});

authRouter.get('/me', requireAuth, async (req, res) => {
  res.json({ farmer: req.farmer });
});

authRouter.patch('/me', requireAuth, async (req, res) => {
  const { name, village, district } = req.body as { name?: string; village?: string; district?: string };
  if (name !== undefined && (!name.trim() || name.length > 100)) {
    throw new ValidationError('name must be 1-100 characters.');
  }
  if (village !== undefined && !village.trim()) {
    throw new ValidationError('village cannot be empty.');
  }

  const updated = await farmerRepository.update(req.farmer!.id, {
    ...(name !== undefined ? { name: name.trim() } : {}),
    ...(village !== undefined ? { village: village.trim() } : {}),
    ...(district !== undefined ? { district: district.trim() } : {}),
  });
  res.json({ farmer: updated });
});
