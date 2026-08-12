import { otpRepository, sessionRepository, farmerRepository } from '../repositories/index.ts';
import { ValidationError, UnauthorizedError, RateLimitError } from '../domain/errors.ts';
import type { FarmerRecord } from '../repositories/InMemoryFarmerRepository.ts';

const OTP_TTL_MS = 5 * 60_000;
const SESSION_TTL_MS = 30 * 24 * 60 * 60_000; // 30 days
const MAX_VERIFY_ATTEMPTS = 5;

function generateOtpCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/**
 * OTP delivery is intentionally mocked-but-pluggable: there's no SMS gateway
 * budget confirmed for this pass, so the code is logged server-side instead
 * of texted. Swapping in a real provider (MSG91, Twilio) later means
 * replacing only this function's body — every caller already treats "send"
 * as async and fire-and-forget.
 */
async function sendOtp(phone: string, code: string): Promise<void> {
  console.log(`[OTP] ${phone} -> ${code} (mock send — no SMS gateway configured)`);
}

export async function requestOtp(phone: string): Promise<{ requestId: string }> {
  const normalized = phone.trim();
  if (!/^\d{10}$/.test(normalized)) {
    throw new ValidationError('Enter a valid 10-digit phone number.');
  }

  await otpRepository.pruneExpired();

  const requestId = `otp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const code = generateOtpCode();

  await otpRepository.create({
    id: requestId,
    phone: normalized,
    code,
    expiresAt: Date.now() + OTP_TTL_MS,
    attempts: 0,
  });

  await sendOtp(normalized, code);
  return { requestId };
}

export async function verifyOtp(requestId: string, code: string): Promise<{ token: string; farmer: FarmerRecord }> {
  const record = await otpRepository.findById(requestId);
  if (!record || record.expiresAt < Date.now()) {
    throw new UnauthorizedError('Code expired — please request a new one.');
  }

  if (record.attempts >= MAX_VERIFY_ATTEMPTS) {
    await otpRepository.delete(requestId);
    throw new RateLimitError('Too many incorrect attempts — please request a new code.');
  }

  if (record.code !== code.trim()) {
    await otpRepository.update(requestId, { attempts: record.attempts + 1 });
    throw new UnauthorizedError('Incorrect code.');
  }

  await otpRepository.delete(requestId);

  let farmer = await farmerRepository.findByPhone(record.phone);
  if (!farmer) {
    farmer = await farmerRepository.create({
      id: `farmer-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      uid: '',
      name: '',
      phone: record.phone,
      village: '',
      district: '',
      createdAt: new Date().toISOString(),
    });
    farmer = (await farmerRepository.update(farmer.id, { uid: farmer.id }))!;
  }

  const token = `sess-${Date.now()}-${crypto.randomUUID()}`;
  await sessionRepository.create({
    id: token,
    farmerId: farmer.id,
    expiresAt: Date.now() + SESSION_TTL_MS,
  });

  return { token, farmer };
}

export async function logout(token: string): Promise<void> {
  await sessionRepository.delete(token);
}
