import { InMemoryRepository } from './types.ts';
import type { SavedAnalysis } from '../../types.ts';

const MAX_ANALYSES_PER_FARMER = 50;

export class InMemoryAnalysisRepository extends InMemoryRepository<SavedAnalysis> {
  async findByFarmer(farmerId: string): Promise<SavedAnalysis[]> {
    const records = await this.findAll((r) => r.farmerId === farmerId);
    return records.sort((a, b) => b.timestamp - a.timestamp);
  }

  /** Creates a record and evicts the farmer's oldest entries beyond the cap — keeps the in-memory store bounded. */
  async createBounded(record: SavedAnalysis): Promise<SavedAnalysis> {
    await this.create(record);
    const farmerRecords = await this.findByFarmer(record.farmerId);
    for (const stale of farmerRecords.slice(MAX_ANALYSES_PER_FARMER)) {
      await this.delete(stale.id);
    }
    return record;
  }
}
