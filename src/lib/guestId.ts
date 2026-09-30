const STORAGE_KEY = 'hp_guest_id';

/**
 * Stand-in identity used before real OTP auth exists (redesign Phase 4).
 * Persists a stable per-browser id so bookings/history made in the same
 * browser stay associated with "the same farmer" even without login.
 * Phase 4 replaces every call site of this with the real authenticated
 * farmer id from the session — grep for getGuestId() to find them.
 */
export function getGuestId(): string {
  let id = localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = `guest-${crypto.randomUUID()}`;
    localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}
