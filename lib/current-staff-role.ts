import 'server-only';
import { DiscordBotService } from '@/lib/discord';
import { DISCORD_ROLES } from '@/lib/roles';

const OWNER_DISCORD_ID = '1315014140804206636';
const CACHE_MS = 30_000;
const cache = new Map<string, { role: 'Boss' | 'Co-Boss' | null; expiresAt: number }>();

/** Staff access is checked against current Discord roles, not a stale JWT role or email. */
export async function getCurrentStaffRole(discordId: string): Promise<'Boss' | 'Co-Boss' | null> {
  if (!/^\d{17,20}$/.test(discordId)) return null;
  if (discordId === OWNER_DISCORD_ID) return 'Boss';
  const cached = cache.get(discordId);
  if (cached && cached.expiresAt > Date.now()) return cached.role;
  const roles = await DiscordBotService.getMemberRoles(discordId);
  const role = roles.includes(DISCORD_ROLES.BOSS) ? 'Boss' : roles.includes(DISCORD_ROLES.CO_BOSS) ? 'Co-Boss' : null;
  cache.set(discordId, { role, expiresAt: Date.now() + CACHE_MS });
  return role;
}
