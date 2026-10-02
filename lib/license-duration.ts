import type { KeyDuration, UserProduct } from '@/types';

export const KEY_DURATION_OPTIONS: KeyDuration[] = ['3 Days', 'Lifetime'];

const DAY_MS = 24 * 60 * 60 * 1000;

export function normalizeKeyDuration(value: unknown): KeyDuration {
  if (value === 'Lifetime') return 'Lifetime';
  // Existing records using the retired durations are safely normalized to the
  // only finite duration supported by the unified inventory.
  return '3 Days';
}

export function getLicenseDurationMs(duration: KeyDuration): number | null {
  switch (duration) {
    case 'Lifetime':
      return null;
    case '3 Days':
      return 3 * DAY_MS;
    default:
      return 3 * DAY_MS;
  }
}

export function computeLicenseExpiresAt(activatedAt: string, duration?: unknown): string | null {
  const durationMs = getLicenseDurationMs(normalizeKeyDuration(duration));
  if (durationMs === null) return null;
  const startMs = Date.parse(activatedAt);
  const origin = Number.isFinite(startMs) ? startMs : Date.now();
  return new Date(origin + durationMs).toISOString();
}

export function isLicenseCurrentlyActive(license: Pick<UserProduct, 'status' | 'expiresAt'>, nowMs: number = Date.now()): boolean {
  if (license.status !== 'Active') return false;
  if (!license.expiresAt) return true;
  const expiresAtMs = new Date(license.expiresAt).getTime();
  return Number.isFinite(expiresAtMs) && expiresAtMs > nowMs;
}

export function durationLabel(duration: unknown, lang: 'ar' | 'en' = 'ar'): string {
  const value = normalizeKeyDuration(duration);
  if (lang === 'en') return value;
  switch (value) {
    case 'Lifetime':
      return 'مدى الحياة';
    case '3 Days':
      return '3 أيام';
    default:
      return '3 أيام';
  }
}
