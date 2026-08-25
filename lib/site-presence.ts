import { collection, doc, getDocs, setDoc } from 'firebase/firestore';
import { db as getDb } from '@/lib/store-db';
import type { SitePresence } from '@/types';

const PRESENCE_COLLECTION = 'sitePresence';
const ACTIVE_WINDOW_MS = 2 * 60 * 1000;

type PresenceActor = Pick<SitePresence, 'discordId' | 'name' | 'image' | 'role'>;

function database() {
  const database = getDb();
  if (!database) throw new Error('تعذر الاتصال ببيانات حضور الموقع.');
  return database;
}

function toPresence(id: string, value: Record<string, unknown>): SitePresence {
  return {
    userId: id,
    discordId: String(value.discordId || id),
    name: String(value.name || 'User'),
    image: typeof value.image === 'string' ? value.image : null,
    role: (value.role || 'Customer') as SitePresence['role'],
    loginAt: typeof value.loginAt === 'string' ? value.loginAt : new Date(0).toISOString(),
    lastSeenAt: typeof value.lastSeenAt === 'string' ? value.lastSeenAt : new Date(0).toISOString(),
    logoutAt: typeof value.logoutAt === 'string' ? value.logoutAt : null,
    active: Boolean(value.active),
  };
}

export async function recordSiteLogin(actor: PresenceActor) {
  const now = new Date().toISOString();
  const presence: SitePresence = {
    userId: actor.discordId,
    discordId: actor.discordId,
    name: actor.name || 'User',
    image: actor.image || null,
    role: actor.role,
    loginAt: now,
    lastSeenAt: now,
    logoutAt: null,
    active: true,
  };
  await setDoc(doc(database(), PRESENCE_COLLECTION, actor.discordId), presence, { merge: true });
  return presence;
}

export async function recordSiteHeartbeat(actor: PresenceActor) {
  const now = new Date().toISOString();
  await setDoc(doc(database(), PRESENCE_COLLECTION, actor.discordId), {
    userId: actor.discordId,
    discordId: actor.discordId,
    name: actor.name || 'User',
    image: actor.image || null,
    role: actor.role,
    lastSeenAt: now,
    active: true,
    logoutAt: null,
  }, { merge: true });
  return { lastSeenAt: now };
}

export async function recordSiteLogout(actor: PresenceActor) {
  const now = new Date().toISOString();
  await setDoc(doc(database(), PRESENCE_COLLECTION, actor.discordId), {
    userId: actor.discordId,
    discordId: actor.discordId,
    name: actor.name || 'User',
    image: actor.image || null,
    role: actor.role,
    lastSeenAt: now,
    logoutAt: now,
    active: false,
  }, { merge: true });
  return { logoutAt: now };
}

export async function listActiveSitePresence() {
  const now = Date.now();
  const snapshot = await getDocs(collection(database(), PRESENCE_COLLECTION));
  return snapshot.docs
    .map((item) => toPresence(item.id, item.data() as Record<string, unknown>))
    .filter((presence) => presence.active && now - new Date(presence.lastSeenAt).getTime() <= ACTIVE_WINDOW_MS)
    .sort((a, b) => new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime());
}

export const sitePresenceActiveWindowMs = ACTIVE_WINDOW_MS;
