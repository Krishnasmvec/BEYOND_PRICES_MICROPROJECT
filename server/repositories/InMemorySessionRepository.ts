import { InMemoryRepository } from './types.ts';

export interface SessionRecord {
  id: string; // opaque session token, doubles as the cookie value
  farmerId: string;
  expiresAt: number;
}

export class InMemorySessionRepository extends InMemoryRepository<SessionRecord> {
  async findValid(token: string): Promise<SessionRecord | null> {
    const record = await this.findById(token);
    if (!record) return null;
    if (record.expiresAt < Date.now()) {
      await this.delete(token);
      return null;
    }
    return record;
  }
}
