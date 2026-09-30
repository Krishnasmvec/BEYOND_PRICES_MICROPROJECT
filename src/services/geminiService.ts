import { UserInput, PredictionResult, ConsumerPrediction } from '../../shared/types.ts';

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.message || `Request to ${path} failed (${response.status})`);
  }

  return response.json();
}

export const generatePrediction = (input: UserInput): Promise<PredictionResult> =>
  postJson('/api/predictions/farmer', input);

export const generateConsumerInsights = (input: { location: string; preferences: any[] }): Promise<ConsumerPrediction> =>
  postJson('/api/predictions/consumer', input);
