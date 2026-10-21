import 'server-only';
import { createHmac } from 'node:crypto';
import { doc, runTransaction } from '@/lib/server-firestore';
import { db } from '@/lib/store-db';

const WINDOW_MS = 15 * 60 * 1000;

function counterId(scope: string, value: string): string {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error('NEXTAUTH_SECRET is required for security counters');
  return createHmac('sha256', secret).update(`${scope}:${value}`).digest('hex');
}

async function consumeCounter(scope: string, value: string, maxAttempts: number) {
  const database = db();
  if (!database) throw new Error('Security counter database is unavailable');
  const counterRef = doc(database, 'securityRateLimits', counterId(scope, value));
  return runTransaction(database, async (transaction) => {
    const snapshot = await transaction.get(counterRef);
    const now = Date.now();
    const previous = snapshot.exists() ? snapshot.data() : null;
    const expiresAt = Number(previous?.expiresAt || 0) > now ? Number(previous?.expiresAt) : now + WINDOW_MS;
    const attempts = Number(previous?.expiresAt || 0) > now ? Number(previous?.attempts || 0) + 1 : 1;
    transaction.set(counterRef, { attempts, expiresAt, updatedAt: now });
    return { allowed: attempts <= maxAttempts, retryAfter: Math.max(1, Math.ceil((expiresAt - now) / 1000)), firstRejection: attempts === maxAttempts + 1 };
  });
}

/** Shared Firestore counters work across Railway instances and never store raw IPs or account IDs. */
export async function limitKeyActivation(discordId: string, ip: string) {
  const account = await consumeCounter('activation-account', discordId, 8);
  const network = ip === 'unknown' ? { allowed: true, retryAfter: 0, firstRejection: false } : await consumeCounter('activation-ip', ip, 40);
  return {
    allowed: account.allowed && network.allowed,
    retryAfter: Math.max(account.allowed ? 0 : account.retryAfter, network.allowed ? 0 : network.retryAfter),
    firstRejection: account.firstRejection || network.firstRejection,
  };
}
