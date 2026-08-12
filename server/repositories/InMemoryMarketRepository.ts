import { InMemoryRepository } from './types.ts';
import type { MarketNode } from '../../types.ts';

export class InMemoryMarketRepository extends InMemoryRepository<MarketNode> {}
