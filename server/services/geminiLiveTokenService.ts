import { GoogleGenAI, Modality } from '@google/genai';
import { env } from '../config/env.ts';
import { UpstreamError } from '../domain/errors.ts';
import type { PredictionResult } from '../../shared/types.ts';

// Ephemeral auth tokens are v1alpha-only per the SDK's own docs.
const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY, httpOptions: { apiVersion: 'v1alpha' } });

const LIVE_MODEL = 'gemini-2.5-flash-native-audio-preview-09-2025';
const TOKEN_TTL_MS = 10 * 60_000; // token itself expires in 10 min
const SESSION_START_WINDOW_MS = 60_000; // client must open the Live session within 1 min of minting

function buildSystemInstruction(data: PredictionResult): string {
  return `You are a high-level agricultural tactical advisor.
  Current Strategy: Sell at ${data.best_market} during ${data.best_hour_window} on ${data.best_day}.
  Current Risk: ${data.spoilage_risk}.
  Weather: ${data.weather.condition}, ${data.weather.temp}°C.

  Community Insights (Part L) — these are AI estimates based on regional
  demand patterns, not verified counts from other farmers' real bookings:
  - Roughly ${data.collective_intelligence.nearby_match_count} nearby farmers may be selling the same crop.
  - Shared transport could save approx ₹${data.collective_intelligence.estimated_savings}.
  - The cooperation hint is: "${data.collective_intelligence.cooperation_hint}".

  Speak in a calm, authoritative, and helpful tone. Keep responses brief and practical.
  If asked about savings, mention the community transport pool and the ₹${data.collective_intelligence.estimated_savings} saving opportunity, but be clear it's an estimate.
  Explain why the storage advice (Max ${data.storage_advisory.max_safe_hours} hours) is critical if asked.`;
}

/**
 * Mints a short-lived, single-use Gemini Live token scoped to the given
 * prediction context. The model, response modality, voice, and system
 * instruction are all locked into the token server-side via
 * liveConnectConstraints — the client that receives this token cannot
 * change them, and never sees the real API key.
 */
export async function mintVoiceToken(predictionContext: PredictionResult): Promise<{ token: string; expiresAt: string }> {
  const expireTime = new Date(Date.now() + TOKEN_TTL_MS).toISOString();
  const newSessionExpireTime = new Date(Date.now() + SESSION_START_WINDOW_MS).toISOString();

  try {
    const authToken = await ai.authTokens.create({
      config: {
        uses: 1,
        expireTime,
        newSessionExpireTime,
        liveConnectConstraints: {
          model: LIVE_MODEL,
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
            systemInstruction: buildSystemInstruction(predictionContext),
          },
        },
      },
    });

    if (!authToken.name) throw new Error('Gemini returned an empty auth token.');
    return { token: authToken.name, expiresAt: expireTime };
  } catch (err) {
    console.error('Failed to mint voice ephemeral token:', err);
    throw new UpstreamError('Voice advisor is temporarily unavailable.');
  }
}

export const LIVE_MODEL_NAME = LIVE_MODEL;
