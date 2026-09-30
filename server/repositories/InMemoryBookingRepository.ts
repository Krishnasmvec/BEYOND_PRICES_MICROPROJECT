import { InMemoryRepository } from './types.ts';
import type { StallBooking } from '../../shared/types.ts';

export class InMemoryBookingRepository extends InMemoryRepository<StallBooking> {
  async findByFarmer(farmerId: string): Promise<StallBooking[]> {
    return this.findAll((b) => b.farmerId === farmerId);
  }
}
