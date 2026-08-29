import { StoreDB } from '@/lib/store-db';
import { isLicenseCurrentlyActive } from '@/lib/license-duration';
import type { User, UserProduct } from '@/types';
import type { SessionActor } from '@/lib/request-security';

export function isSafeDownloadUrl(value: string | null | undefined): value is string {
  if (!value) return false;
  if (value.startsWith('/') && !value.startsWith('//')) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

export async function getOwnedActiveLicense(actor: SessionActor, productId: string): Promise<{ user: User; license: UserProduct } | null> {
  if (!productId || productId.length > 160) return null;

  const user = await StoreDB.getUserByDiscordId(actor.discordId);
  if (!user || user.isBanned) return null;

  const licenses = await StoreDB.getUserProducts(user.id);
  const license = licenses.find((item) => item.productId === productId && isLicenseCurrentlyActive(item));

  return license ? { user, license } : null;
}
