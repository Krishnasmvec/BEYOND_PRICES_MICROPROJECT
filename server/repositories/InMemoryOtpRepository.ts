import { InMemoryRepository } from './types.ts';

export interface OtpRecord {
  id: string; // requestId
  phone: string;
  code: string;
  expiresAt: number;
  attempts: number;
}

export class InMemoryOtpRepository extends InMemoryRepository<OtpRecord> {
  async pruneExpired(): Promise<void> {
    const now = Date.now();
    for (const [id, record] of this.store) {
      if (record.expiresAt < now) this.store.delete(id);
    }
  }
}
