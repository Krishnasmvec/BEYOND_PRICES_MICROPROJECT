import { Router } from 'express';
import { claimStall, cancelBooking } from '../services/bookingService.ts';
import { bookingRepository } from '../repositories/index.ts';
import { requireAuth } from '../middleware/auth.ts';
import { ValidationError } from '../domain/errors.ts';

export const bookingsRouter = Router();

// Every route here requires a real session — farmerId always comes from
// req.farmer (the verified OTP session), never from the request body, so a
// caller can no longer claim or cancel a stall on someone else's behalf.
bookingsRouter.use(requireAuth);

bookingsRouter.post('/', async (req, res) => {
  const { marketId, stallId, cropType, quantity } = req.body as {
    marketId?: string;
    stallId?: string;
    cropType?: string;
    quantity?: number;
  };

  if (!marketId || !stallId || !cropType || !quantity || quantity <= 0) {
    throw new ValidationError('marketId, stallId, cropType, and a positive quantity are required.');
  }

  const booking = await claimStall({ farmerId: req.farmer!.id, marketId, stallId, cropType, quantity });
  res.status(201).json(booking);
});

bookingsRouter.get('/mine', async (req, res) => {
  const bookings = await bookingRepository.findByFarmer(req.farmer!.id);
  res.json(bookings);
});

bookingsRouter.patch('/:bookingId', async (req, res) => {
  const { action } = req.body as { action?: string };
  if (action !== 'cancel') throw new ValidationError('Only the "cancel" action is supported.');

  const booking = await cancelBooking(req.params.bookingId, req.farmer!.id);
  res.json(booking);
});
