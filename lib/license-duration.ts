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

export function getLicenseState(license: Pick<UserProduct, 'status' | 'expiresAt' | 'startedAt'>, nowMs = Date.now()) {
  const expiry = license.expiresAt ? Date.parse(license.expiresAt) : Number.NaN;
  const hasExpiry = Number.isFinite(expiry);
  const isExpired = license.status === 'Expired' || (hasExpiry && expiry <= nowMs);
  const isPendingStart = license.status === 'Active' && !license.startedAt && !license.expiresAt;
  const isLifetime = Boolean(license.startedAt) && !license.expiresAt;
  const isUsable = license.status === 'Active' && !isExpired && (isPendingStart || isLifetime || (hasExpiry && expiry > nowMs));
  return { isExpired, isPendingStart, isLifetime, isUsable, expiresAtMs: hasExpiry ? expiry : 0, remainingMs: hasExpiry ? Math.max(0, expiry - nowMs) : 0 };
}

/** A renewed product can have several licenses. Never start a different one. */
export function selectGuideLicense(licenses: UserProduct[], licenseId?: string, nowMs = Date.now()): UserProduct | undefined {
  return licenses.filter((license) => (!licenseId || license.id === licenseId) && getLicenseState(license, nowMs).isUsable)
    .sort((a, b) => (Date.parse(b.activatedAt) || 0) - (Date.parse(a.activatedAt) || 0))[0];
}

export function getGuideStartTiming(license: UserProduct, duration: unknown, now: string) {
  // Keep an already running/legacy license's deadline. Opening a guide cannot renew it.
  if (license.startedAt) return { startedAt: license.startedAt, expiresAt: license.expiresAt ?? null };
  return {
    startedAt: now,
    expiresAt: duration === 'Lifetime' ? null : license.expiresAt ?? computeLicenseExpiresAt(now, duration),
  };
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
