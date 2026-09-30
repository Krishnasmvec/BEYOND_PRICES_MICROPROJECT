import type { InMemoryMarketRepository } from '../repositories/InMemoryMarketRepository.ts';
import type { InMemoryStallRepository } from '../repositories/InMemoryStallRepository.ts';
import type { MarketNode, MarketStall } from '../../shared/types.ts';

// Demo seed data for farmer-side stall booking, loaded once at server boot.
// Not re-randomized per request. This is a completely separate domain from
// Consumer Market Discovery, which is now Supabase-backed (see
// server/services/marketService.ts) — these markets/stalls and Supabase's
// markets/products are two disconnected id spaces.
// Coordinates are real approximate locations for these actual mandis/APMCs.
const MARKETS: MarketNode[] = [
  { id: 'm1', name: 'Azadpur Mandi', location: 'Delhi', capacity: 50, geo: { lat: 28.7040, lng: 77.1710 }, operatingHours: { open: '05:00', close: '13:00' } },
  { id: 'm2', name: 'Vashi Mandi', location: 'Mumbai', capacity: 40, geo: { lat: 19.0771, lng: 73.0016 }, operatingHours: { open: '04:30', close: '12:00' } },
  { id: 'm3', name: 'Ghazipur Mandi', location: 'Delhi', capacity: 30, geo: { lat: 28.6304, lng: 77.3177 }, operatingHours: { open: '05:00', close: '13:30' } },
  { id: 'm4', name: 'Villupuram Main Mandi', location: 'Tamil Nadu', capacity: 60, geo: { lat: 11.9401, lng: 79.4861 }, operatingHours: { open: '05:30', close: '12:30' } },
];

const STALL_TYPES = ['Standard', 'Cold Storage', 'Premium'] as const;
const STALL_SIZES = ['10x10', '15x15', '20x20'] as const;
const SLOTS = [
  { start: '07:00', end: '10:00' },
  { start: '10:00', end: '13:00' },
  { start: '13:00', end: '16:00' },
] as const;

// Simple deterministic PRNG (mulberry32) so the seed's booked/available mix
// is stable across restarts instead of reshuffling every boot.
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export async function seedMarketsAndStalls(
  marketRepo: InMemoryMarketRepository,
  stallRepo: InMemoryStallRepository,
): Promise<void> {
  const existing = await marketRepo.findAll();
  if (existing.length > 0) return;

  const rand = mulberry32(42);

  for (const market of MARKETS) {
    await marketRepo.create(market);

    for (let i = 1; i <= market.capacity; i++) {
      const stall: MarketStall = {
        id: `s-${market.id}-${i}`,
        marketId: market.id,
        number: i.toString().padStart(2, '0'),
        type: STALL_TYPES[i % STALL_TYPES.length],
        size: STALL_SIZES[i % STALL_SIZES.length],
        pricePerDay: 50 + (i % 5) * 30,
        status: rand() > 0.3 ? 'available' : 'booked',
        bookedBy: null,
        slotTime: SLOTS[i % SLOTS.length],
      };
      await stallRepo.create(stall);
    }
  }
}
