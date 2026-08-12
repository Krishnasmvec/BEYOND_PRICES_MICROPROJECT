import { InMemoryRepository } from './types.ts';
import type { MarketStall } from '../../types.ts';

export class InMemoryStallRepository extends InMemoryRepository<MarketStall> {
  async findByMarket(marketId: string, status?: MarketStall['status']): Promise<MarketStall[]> {
    return this.findAll((s) => s.marketId === marketId && (!status || s.status === status));
  }
}
