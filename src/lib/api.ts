import type { MarketNode, MarketStall, StallBooking, FarmerProfile, HistoryRecord, NearbyMarket, MarketProduct, MarketWeather, MarketAnalysisInput, MarketRecommendation, SavedAnalysis, ProductSummary } from '../../shared/types.ts';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    credentials: 'include',
    headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
    ...init,
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.message || `Request to ${path} failed (${response.status})`);
  }
  return response.json();
}

export const fetchMarkets = (): Promise<(MarketNode & { currentOccupancy: number })[]> =>
  request('/api/markets');

export const fetchStalls = (marketId: string, status?: MarketStall['status']): Promise<MarketStall[]> =>
  request(`/api/markets/${marketId}/stalls${status ? `?status=${status}` : ''}`);

export interface CreateBookingInput {
  marketId: string;
  stallId: string;
  cropType: string;
  quantity: number;
}

// Booking/history endpoints below are session-authenticated (httpOnly
// cookie) — no farmerId is passed by the client, the server derives it from
// the verified OTP session. requestOtp/verifyOtp below establish that session.
export const createBooking = (input: CreateBookingInput): Promise<StallBooking> =>
  request('/api/bookings', { method: 'POST', body: JSON.stringify(input) });

export const cancelBookingRequest = (bookingId: string): Promise<StallBooking> =>
  request(`/api/bookings/${bookingId}`, { method: 'PATCH', body: JSON.stringify({ action: 'cancel' }) });

export const fetchMyBookings = (): Promise<StallBooking[]> => request('/api/bookings/mine');

export const requestOtp = (phone: string): Promise<{ requestId: string }> =>
  request('/api/auth/otp/request', { method: 'POST', body: JSON.stringify({ phone }) });

export const verifyOtp = (requestId: string, code: string): Promise<{ farmer: FarmerProfile }> =>
  request('/api/auth/otp/verify', { method: 'POST', body: JSON.stringify({ requestId, code }) });

export const fetchMe = (): Promise<{ farmer: FarmerProfile }> => request('/api/auth/me');

export const updateProfile = (patch: Partial<Pick<FarmerProfile, 'name' | 'village' | 'district'>>): Promise<{ farmer: FarmerProfile }> =>
  request('/api/auth/me', { method: 'PATCH', body: JSON.stringify(patch) });

export const logoutRequest = (): Promise<{ ok: boolean }> => request('/api/auth/logout', { method: 'POST' });

export const reverseGeocode = (lat: number, lng: number): Promise<{ location: string }> =>
  request(`/api/geocode/reverse?lat=${lat}&lng=${lng}`);

/** Requires an authenticated session — anonymous browsing has no server-side history to fetch. */
export const fetchMyPredictionHistory = (): Promise<HistoryRecord[]> => request('/api/predictions/mine');

// Accepts an AbortSignal since this hits an endpoint sharing a scarce,
// server-side-rate-limited external geocoding budget (1 req/sec, global,
// see server/middleware/rateLimiter.ts) — callers whose effect can fire
// twice for the same request (React StrictMode's dev double-invoke, or a
// fast-changing location prop) should abort the superseded call so it
// never actually reaches the server and burns part of that shared budget.
export const fetchNearbyMarkets = (location: string, signal?: AbortSignal): Promise<NearbyMarket[]> =>
  request(`/api/markets/nearby?location=${encodeURIComponent(location)}`, { signal });

export const fetchMarketProducts = (marketId: string): Promise<{ products: MarketProduct[]; weather: MarketWeather | null }> =>
  request(`/api/markets/${marketId}/products`);

// --- Farmer Market Analysis: multi-product, Supabase-grounded (server/services/farmerAnalysisService.ts) ---

export const searchProducts = (search?: string, category?: string): Promise<ProductSummary[]> => {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (category) params.set('category', category);
  const qs = params.toString();
  return request(`/api/farmer/products${qs ? `?${qs}` : ''}`);
};

export const fetchClimateSummary = (location: string): Promise<{ weather: MarketWeather | null }> =>
  request(`/api/farmer/climate?location=${encodeURIComponent(location)}`);

export const analyzeMarkets = (input: MarketAnalysisInput): Promise<MarketRecommendation[]> =>
  request('/api/farmer/analysis', { method: 'POST', body: JSON.stringify(input) });

/** Requires an authenticated session, same as fetchMyPredictionHistory. */
export const fetchMyAnalyses = (): Promise<SavedAnalysis[]> => request('/api/farmer/analyses/mine');

export const saveAnalysis = (input: MarketAnalysisInput, topMarketName: string, topScore: number): Promise<SavedAnalysis> =>
  request('/api/farmer/analyses', { method: 'POST', body: JSON.stringify({ input, topMarketName, topScore }) });
