import { InMemoryRepository } from './types.ts';
import type { HistoryRecord } from '../../shared/types.ts';

const MAX_RECORDS_PER_FARMER = 50;

export class InMemoryPredictionHistoryRepository extends InMemoryRepository<HistoryRecord> {
  async findByFarmer(farmerId: string): Promise<HistoryRecord[]> {
    const records = await this.findAll((r) => r.farmerId === farmerId);
    return records.sort((a, b) => b.timestamp - a.timestamp);
  }

  /** Creates a record and evicts the farmer's oldest entries beyond the cap — keeps the in-memory store bounded. */
  async createBounded(record: HistoryRecord): Promise<HistoryRecord> {
    await this.create(record);
    const farmerRecords = await this.findByFarmer(record.farmerId);
    for (const stale of farmerRecords.slice(MAX_RECORDS_PER_FARMER)) {
      await this.delete(stale.id);
    }
    return record;
  }
}
