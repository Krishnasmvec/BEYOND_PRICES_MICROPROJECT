export interface Repository<T, ID = string> {
  findById(id: ID): Promise<T | null>;
  findAll(predicate?: (item: T) => boolean): Promise<T[]>;
  create(entity: T): Promise<T>;
  update(id: ID, patch: Partial<T>): Promise<T | null>;
  delete(id: ID): Promise<boolean>;
}

/**
 * Base class for every in-memory repository. All mutation methods below are
 * synchronous internally (plain Map reads/writes, no await) even though the
 * public interface returns Promises — that's deliberate: it lets call sites
 * be written against a Promise-based contract now (so a real DB-backed repo
 * is a drop-in later) while still guaranteeing, today, that nothing can
 * interleave between a check and its corresponding write within Node's
 * single-threaded event loop. Repositories needing atomic check-and-set
 * logic (e.g. BookingRepository's stall claim) rely on this guarantee.
 */
export abstract class InMemoryRepository<T extends { id: ID }, ID = string> implements Repository<T, ID> {
  protected readonly store = new Map<ID, T>();

  async findById(id: ID): Promise<T | null> {
    return this.store.get(id) ?? null;
  }

  async findAll(predicate?: (item: T) => boolean): Promise<T[]> {
    const all = Array.from(this.store.values());
    return predicate ? all.filter(predicate) : all;
  }

  async create(entity: T): Promise<T> {
    this.store.set(entity.id, entity);
    return entity;
  }

  async update(id: ID, patch: Partial<T>): Promise<T | null> {
    const existing = this.store.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...patch };
    this.store.set(id, updated);
    return updated;
  }

  async delete(id: ID): Promise<boolean> {
    return this.store.delete(id);
  }

  /** Synchronous escape hatch for services that need an atomic read-check-write critical section. */
  getRaw(id: ID): T | undefined {
    return this.store.get(id);
  }

  setRaw(entity: T): T {
    this.store.set(entity.id, entity);
    return entity;
  }
}
