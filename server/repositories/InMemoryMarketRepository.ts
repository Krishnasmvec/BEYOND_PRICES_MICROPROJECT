import { InMemoryRepository } from './types.ts';
import type { MarketNode } from '../../shared/types.ts';

export class InMemoryMarketRepository extends InMemoryRepository<MarketNode> {}
