import { InMemoryRepository } from './types.ts';
import type { FarmerProfile } from '../../shared/types.ts';

export interface FarmerRecord extends FarmerProfile {
  id: string; // mirrors uid — required by InMemoryRepository's Map key contract
}

export class InMemoryFarmerRepository extends InMemoryRepository<FarmerRecord> {
  async findByPhone(phone: string): Promise<FarmerRecord | null> {
    const all = await this.findAll((f) => f.phone === phone);
    return all[0] ?? null;
  }
}
