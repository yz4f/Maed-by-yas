import { collection, doc, getDocs, orderBy, query, runTransaction, setDoc, updateDoc } from 'firebase/firestore';
import { db as getDb } from '@/lib/store-db';
import { sendDiscordSiteUpdate } from '@/lib/discord-bot';
import type { TicketActor } from '@/lib/ticket-auth';
import type { SiteUpdate, SiteUpdateKind, SiteUpdateStatus } from '@/types';

const COLLECTION = 'siteUpdates';
const CHANNEL_ID = process.env.DISCORD_UPDATES_CHANNEL_ID || '1540878976166400060';

export type SiteUpdateInput = {
  title: string;
  summary: string;
  highlights: string[];
  imageUrl: string;
  imageAlt: string;
  kind: SiteUpdateKind;
};

function now() { return new Date().toISOString(); }
function id() { return `update_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`; }
function database() {
  const value = getDb();
  if (!value) throw new Error('قاعدة بيانات التحديثات غير متاحة حالياً.');
  return value;
}

function cleanInput(input: SiteUpdateInput): SiteUpdateInput {
  const title = input.title?.trim().slice(0, 120);
  const summary = input.summary?.trim().slice(0, 800);
  const imageUrl = input.imageUrl?.trim().slice(0, 2000);
  const imageAlt = input.imageAlt?.trim().slice(0, 180) || title;
  const highlights = (input.highlights || []).map((item) => item.trim().slice(0, 180)).filter(Boolean).slice(0, 8);
  if (!title || !summary || !imageUrl || highlights.length === 0) throw new Error('أدخل العنوان والوصف والصورة وعنصراً واحداً على الأقل من أبرز التحديثات.');
  const localImage = /^data:image\/(jpeg|png|webp);base64,[a-z0-9+/=]+$/i.test(imageUrl);
  if (localImage && imageUrl.length <= 700_000) return { title, summary, imageUrl, imageAlt, highlights, kind: input.kind };
  try {
    const url = new URL(imageUrl);
    if (url.protocol !== 'https:') throw new Error();
  } catch {
    throw new Error('صورة التحديث يجب أن تكون رابط HTTPS مباشرًا أو لقطة PNG/JPG/WEBP مرفوعة بحجم مضغوط.');
  }
  return { title, summary, imageUrl, imageAlt, highlights, kind: input.kind };
}

function assertStatus(update: SiteUpdate, allowed: SiteUpdateStatus[]) {
  if (!allowed.includes(update.status)) throw new Error('لا تسمح حالة هذا التحديث بتنفيذ هذا الإجراء.');
}

export async function listSiteUpdates(): Promise<SiteUpdate[]> {
  const snapshot = await getDocs(query(collection(database(), COLLECTION), orderBy('createdAt', 'desc')));
  return snapshot.docs.map((entry) => entry.data() as SiteUpdate);
}

export async function createSiteUpdate(actor: TicketActor, input: SiteUpdateInput): Promise<SiteUpdate> {
  const values = cleanInput(input);
  const createdAt = now();
  const update: SiteUpdate = {
    id: id(),
    ...values,
    status: 'DRAFT',
    createdAt,
    createdById: actor.id,
    createdByName: actor.name,
    approvedAt: null,
    approvedById: null,
    approvedByName: null,
    publishedAt: null,
    publishedById: null,
    publishedByName: null,
    discordMessageId: null,
    discordChannelId: null,
    discordSentAt: null,
    discordError: null,
    discordAttemptAt: null,
  };
  await setDoc(doc(database(), COLLECTION, update.id), update);
  return update;
}

export async function updateSiteUpdate(actor: TicketActor, updateId: string, input: SiteUpdateInput): Promise<SiteUpdate> {
  const values = cleanInput(input);
  let result: SiteUpdate | null = null;
  await runTransaction(database(), async (transaction) => {
    const ref = doc(database(), COLLECTION, updateId);
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists()) throw new Error('التحديث غير موجود.');
    const current = snapshot.data() as SiteUpdate;
    assertStatus(current, ['DRAFT']);
    result = { ...current, ...values };
    transaction.update(ref, values);
  });
  if (!result) throw new Error('تعذر حفظ التحديث.');
  return result;
}

export async function approveSiteUpdate(actor: TicketActor, updateId: string): Promise<SiteUpdate> {
  let result: SiteUpdate | null = null;
  await runTransaction(database(), async (transaction) => {
    const ref = doc(database(), COLLECTION, updateId);
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists()) throw new Error('التحديث غير موجود.');
    const current = snapshot.data() as SiteUpdate;
    assertStatus(current, ['DRAFT']);
    if (!current.imageUrl) throw new Error('أضف صورة توضيحية حقيقية للتحديث قبل الاعتماد.');
    const approvedAt = now();
    result = { ...current, status: 'APPROVED', approvedAt, approvedById: actor.id, approvedByName: actor.name };
    transaction.update(ref, { status: 'APPROVED', approvedAt, approvedById: actor.id, approvedByName: actor.name });
  });
  if (!result) throw new Error('تعذر اعتماد التحديث.');
  return result;
}

export async function publishSiteUpdate(actor: TicketActor, updateId: string): Promise<SiteUpdate> {
  const reserved = await runTransaction(database(), async (transaction): Promise<SiteUpdate> => {
    const ref = doc(database(), COLLECTION, updateId);
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists()) throw new Error('التحديث غير موجود.');
    const current = snapshot.data() as SiteUpdate;
    if (current.status === 'DISCORD_SENT' || current.discordMessageId) throw new Error('تم إرسال هذا التحديث إلى Discord مسبقاً ولا يمكن تكراره.');
    assertStatus(current, ['APPROVED', 'DISCORD_FAILED']);
    if (!current.imageUrl) throw new Error('يرجى إضافة صورة توضيحية للتحديث قبل النشر.');
    const publishedAt = now();
    const reservedUpdate: SiteUpdate = {
      ...current,
      status: 'PUBLISHED',
      publishedAt,
      publishedById: actor.id,
      publishedByName: actor.name,
      discordAttemptAt: publishedAt,
      discordError: null,
    };
    transaction.update(ref, {
      status: 'PUBLISHED',
      publishedAt,
      publishedById: actor.id,
      publishedByName: actor.name,
      discordAttemptAt: publishedAt,
      discordError: null,
    });
    return reservedUpdate;
  });

  try {
    const delivery = await sendDiscordSiteUpdate(reserved, CHANNEL_ID);
    const sentAt = now();
    const complete: SiteUpdate = {
      ...reserved,
      status: 'DISCORD_SENT',
      discordMessageId: delivery.messageId,
      discordChannelId: CHANNEL_ID,
      discordSentAt: sentAt,
      discordError: null,
    };
    await updateDoc(doc(database(), COLLECTION, updateId), {
      status: 'DISCORD_SENT',
      discordMessageId: delivery.messageId,
      discordChannelId: CHANNEL_ID,
      discordSentAt: sentAt,
      discordError: null,
    });
    return complete;
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 900) : 'تعذر إرسال تحديث Discord.';
    await updateDoc(doc(database(), COLLECTION, updateId), { status: 'DISCORD_FAILED', discordError: message });
    throw new Error(message);
  }
}
