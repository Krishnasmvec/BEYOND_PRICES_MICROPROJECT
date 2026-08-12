import { InMemoryFarmerRepository } from './InMemoryFarmerRepository.ts';
import { InMemoryOtpRepository } from './InMemoryOtpRepository.ts';
import { InMemorySessionRepository } from './InMemorySessionRepository.ts';
import { InMemoryMarketRepository } from './InMemoryMarketRepository.ts';
import { InMemoryStallRepository } from './InMemoryStallRepository.ts';
import { InMemoryBookingRepository } from './InMemoryBookingRepository.ts';
import { InMemoryPredictionHistoryRepository } from './InMemoryPredictionHistoryRepository.ts';
import { InMemoryAnalysisRepository } from './InMemoryAnalysisRepository.ts';
import { seedMarketsAndStalls } from '../seed/marketSeed.ts';

// Composition root: every route/service imports repositories from here, never
// instantiates one directly. That's what makes swapping any single repository
// for a real-DB-backed implementation later a one-file change.
export const farmerRepository = new InMemoryFarmerRepository();
export const otpRepository = new InMemoryOtpRepository();
export const sessionRepository = new InMemorySessionRepository();
export const marketRepository = new InMemoryMarketRepository();
export const stallRepository = new InMemoryStallRepository();
export const bookingRepository = new InMemoryBookingRepository();
export const predictionHistoryRepository = new InMemoryPredictionHistoryRepository();
export const analysisRepository = new InMemoryAnalysisRepository();

export async function initializeStore(): Promise<void> {
  await seedMarketsAndStalls(marketRepository, stallRepository);
}
