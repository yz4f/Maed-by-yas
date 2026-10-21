import 'server-only';
import { createCipheriv, createDecipheriv, createHmac, randomBytes } from 'node:crypto';
import { doc, getDoc, setDoc } from '@/lib/server-firestore';
import { db } from '@/lib/store-db';

const COLLECTION = 'discordRejoinAuthorizations';
const GUILD_ID = process.env.DISCORD_GUILD_ID || '1396959491786018826';

function key() {
  const secret = process.env.DISCORD_OAUTH_ENCRYPTION_KEY || process.env.NEXTAUTH_SECRET;
  if (!secret || secret.length < 24) throw new Error('مفتاح تشفير تفويض ديسكورد غير مهيأ.');
  return createHmac('sha256', secret).update('t3n-discord-rejoin-v1').digest();
}

function encrypt(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key(), iv);
  const ciphertext = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return `${iv.toString('base64url')}.${cipher.getAuthTag().toString('base64url')}.${ciphertext.toString('base64url')}`;
}

function decrypt(value: string) {
  const [iv, tag, ciphertext] = value.split('.');
  if (!iv || !tag || !ciphertext) throw new Error('تفويض ديسكورد المحفوظ غير صالح.');
  const decipher = createDecipheriv('aes-256-gcm', key(), Buffer.from(iv, 'base64url'));
  decipher.setAuthTag(Buffer.from(tag, 'base64url'));
  return Buffer.concat([decipher.update(Buffer.from(ciphertext, 'base64url')), decipher.final()]).toString('utf8');
}

function authorizationRef(discordId: string) {
  return doc(db(), COLLECTION, discordId);
}

/** Save consent only when Discord actually returned the guilds.join scope. Tokens never reach client APIs. */
export async function saveDiscordRejoinConsent(discordId: string, scope: string, refreshToken?: string | null) {
  if (!/^\d{16,22}$/.test(discordId) || !scope.split(/\s+/).includes('guilds.join') || !refreshToken) return;
  await setDoc(authorizationRef(discordId), {
    refreshToken: encrypt(refreshToken),
    scope: 'guilds.join',
    updatedAt: new Date().toISOString(),
  }, { merge: true });
}

export async function hasDiscordRejoinConsent(discordId: string) {
  const snapshot = await getDoc(authorizationRef(discordId));
  return snapshot.exists() && Boolean(snapshot.data().refreshToken);
}

/** Discord requires the user's OAuth consent and a bot in the guild to rejoin a former member. */
export async function rejoinDiscordMember(discordId: string): Promise<'joined' | 'already_member'> {
  const token = process.env.DISCORD_BOT_TOKEN;
  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  if (!token || !clientId || !clientSecret) throw new Error('إعدادات بوت ديسكورد غير مكتملة.');
  const snapshot = await getDoc(authorizationRef(discordId));
  const encrypted = snapshot.data()?.refreshToken;
  if (!encrypted) throw new Error('هذا العميل لم يوافق بعد على صلاحية إعادة الانضمام. اطلب منه تسجيل الدخول إلى الموقع مرة أخرى.');

  const form = new URLSearchParams({ grant_type: 'refresh_token', refresh_token: decrypt(encrypted) });
  const refreshed = await fetch('https://discord.com/api/v10/oauth2/token', {
    method: 'POST',
    headers: { Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form,
    cache: 'no-store',
    signal: AbortSignal.timeout(10000),
  });
  if (!refreshed.ok) throw new Error('انتهى تفويض ديسكورد أو ألغاه العميل. اطلب منه تسجيل الدخول مجددًا.');
  const credentials = await refreshed.json() as { access_token?: string; refresh_token?: string; scope?: string };
  if (!credentials.access_token || !credentials.scope?.split(/\s+/).includes('guilds.join')) throw new Error('صلاحية إعادة الانضمام غير متاحة لهذا العميل.');
  if (credentials.refresh_token) await saveDiscordRejoinConsent(discordId, credentials.scope, credentials.refresh_token);

  const response = await fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}/members/${discordId}`, {
    method: 'PUT',
    headers: { Authorization: `Bot ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ access_token: credentials.access_token }),
    cache: 'no-store',
    signal: AbortSignal.timeout(10000),
  });
  if (response.status === 201) return 'joined';
  if (response.status === 204) return 'already_member';
  if (response.status === 403) throw new Error('تعذر ضم العميل: قد يكون محظورًا من السيرفر أو أن البوت لا يملك الصلاحية.');
  if (response.status === 429) throw new Error('ديسكورد يحد الطلبات مؤقتًا. حاول بعد قليل.');
  throw new Error(`تعذر إعادة العميل إلى سيرفر ديسكورد (HTTP ${response.status}).`);
}
