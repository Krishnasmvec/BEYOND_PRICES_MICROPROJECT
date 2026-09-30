import { stallRepository, bookingRepository, marketRepository } from '../repositories/index.ts';
import { NotFoundError, ConflictError, ForbiddenError } from '../domain/errors.ts';
import type { StallBooking } from '../../shared/types.ts';

export interface ClaimStallInput {
  farmerId: string;
  marketId: string;
  stallId: string;
  cropType: string;
  quantity: number;
}

/**
 * Atomically claims a stall for a farmer. The read-check-write below is a
 * single synchronous critical section (no `await` between the status check
 * and the write) — Node's single-threaded event loop guarantees no other
 * request can interleave between them, so two concurrent claims on the same
 * stall can never both succeed. This is the guarantee the old Firestore
 * security rules could only approximate.
 */
export async function claimStall(input: ClaimStallInput): Promise<StallBooking> {
  const market = await marketRepository.findById(input.marketId);
  if (!market) throw new NotFoundError('Market not found.');

  // --- synchronous critical section start ---
  const stall = stallRepository.getRaw(input.stallId);
  if (!stall || stall.marketId !== input.marketId) {
    throw new NotFoundError('Stall not found in this market.');
  }
  if (stall.status !== 'available') {
    throw new ConflictError('This stall was just booked by someone else. Please pick another.');
  }

  const booking: StallBooking = {
    id: `bk-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    farmerId: input.farmerId,
    marketId: input.marketId,
    stallId: input.stallId,
    bookingDate: new Date().toISOString().slice(0, 10),
    slotTime: stall.slotTime,
    status: 'confirmed',
    cropType: input.cropType,
    quantity: input.quantity,
    totalFee: stall.pricePerDay,
    createdAt: new Date().toISOString(),
  };

  stallRepository.setRaw({ ...stall, status: 'booked', bookedBy: input.farmerId });
  bookingRepository.setRaw(booking);
  // --- synchronous critical section end ---

  return booking;
}

export async function cancelBooking(bookingId: string, farmerId: string): Promise<StallBooking> {
  const booking = await bookingRepository.findById(bookingId);
  if (!booking) throw new NotFoundError('Booking not found.');
  if (booking.farmerId !== farmerId) throw new ForbiddenError('This is not your booking.');
  if (booking.status !== 'confirmed') throw new ConflictError('Only confirmed bookings can be cancelled.');

  const stall = stallRepository.getRaw(booking.stallId);
  if (stall && stall.bookedBy === farmerId) {
    stallRepository.setRaw({ ...stall, status: 'available', bookedBy: null });
  }

  const updated = await bookingRepository.update(bookingId, { status: 'cancelled' });
  return updated!;
}
