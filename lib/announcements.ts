import { collection, deleteDoc, doc, getDoc, getDocs, query, runTransaction, setDoc, where } from 'firebase/firestore';
import { db, StoreDB } from '@/lib/store-db';
import type { UserProduct } from '@/types';
import { isLicenseCurrentlyActive } from '@/lib/license-duration';
import { normalizeRole } from '@/lib/permissions';
import { hasRecentAnnouncementActivity, isEligibleAnnouncementRecipient, shouldCountAnnouncementRead } from '@/lib/announcement-audience';
import { normalizeAnnouncementRecord } from '@/lib/announcement-normalize.mjs';

export type AnnouncementType = 'INFO' | 'WARNING' | 'UPDATE' | 'IMPORTANT';
export type AnnouncementAudience = 'ALL' | 'ACTIVE' | 'PRODUCT' | 'ROLE' | 'USER';
export type AnnouncementStatus = 'DRAFT' | 'ACTIVE' | 'SCHEDULED' | 'EXPIRED' | 'ARCHIVED';
export interface Announcement {
  id: string; titleAr: string; titleEn: string; contentAr: string; contentEn: string; type: AnnouncementType; audienceType: AnnouncementAudience; audienceValue: string;
  startsAt: string; expiresAt: string | null; pinned: boolean; dismissible: boolean; priority: number; status: AnnouncementStatus;
  createdBy: string; createdByName: string; createdAt: string; updatedAt: string; publishedAt?: string | null; recipientCount?: number; readCount?: number;
}
export interface AnnouncementReceipt { id: string; announcementId: string; userId: string; announcementUpdatedAt?: string; readAt: string | null; dismissedAt: string | null; updatedAt: string; }
const ANNOUNCEMENTS = 'announcements';
const RECEIPTS = 'announcementReads';
function database() { const value = db(); if (!value) throw new Error('قاعدة بيانات الإعلانات غير متاحة.'); return value; }
function statusOf(item: Announcement, now = Date.now()): AnnouncementStatus {
  if (item.status === 'ARCHIVED' || item.status === 'DRAFT') return item.status;
  const start = Date.parse(item.startsAt);
  if (Number.isFinite(start) && start > now) return 'SCHEDULED';
  if (item.expiresAt && Date.parse(item.expiresAt) <= now) return 'EXPIRED';
  return 'ACTIVE';
}
export async function listAnnouncements() {
  const snapshot = await getDocs(collection(database(), ANNOUNCEMENTS));
  return snapshot.docs.map((item) => {
    const announcement = normalizeAnnouncementRecord(item.data(), item.id) as unknown as Announcement;
    return { ...announcement, status: statusOf(announcement) };
  }).sort((a, b) => b.priority - a.priority || b.createdAt.localeCompare(a.createdAt));
}
export async function countAnnouncementRecipients(audienceType: AnnouncementAudience, audienceValue: string) {
  const users = await StoreDB.getUsers();
  switch (audienceType) {
    case 'ALL': return users.filter(isEligibleAnnouncementRecipient).length;
    case 'ACTIVE': {
      const now = Date.now();
      return users.filter((user) => isEligibleAnnouncementRecipient(user) && hasRecentAnnouncementActivity(user, now)).length;
    }
    case 'ROLE': return users.filter((user) => isEligibleAnnouncementRecipient(user) && normalizeRole(user.role) === normalizeRole(audienceValue)).length;
    case 'USER': return users.some((user) => user.discordId === audienceValue && isEligibleAnnouncementRecipient(user)) ? 1 : 0;
    case 'PRODUCT': {
      if (!(await StoreDB.getProducts()).some((product) => product.id === audienceValue && !product.isArchived)) throw new Error('المنتج المحدد غير موجود.');
      const snapshot = await getDocs(query(collection(database(), 'userProducts'), where('productId', '==', audienceValue)));
      const recipients = new Set(snapshot.docs.map((entry) => entry.data() as UserProduct).filter(isLicenseCurrentlyActive).map((entry) => entry.userId));
      return users.filter((user) => isEligibleAnnouncementRecipient(user) && recipients.has(user.id)).length;
    }
  }
}
export async function saveAnnouncement(input: Omit<Announcement, 'createdAt' | 'updatedAt' | 'status' | 'createdBy' | 'createdByName'> & { status?: AnnouncementStatus }, actor: { discordId: string; name: string }) {
  if (input.audienceType === 'PRODUCT' && !(await StoreDB.getProducts()).some((item) => item.id === input.audienceValue && !item.isArchived)) throw new Error('المنتج المحدد غير موجود.');
  if (input.audienceType === 'ROLE' && !['Owner', 'Admin', 'Moderator', 'Staff', 'Customer'].includes(input.audienceValue)) throw new Error('الدور المحدد غير صالح.');
  if (input.audienceType === 'USER') {
    const user = await StoreDB.getUserByDiscordId(input.audienceValue);
    if (!user || !isEligibleAnnouncementRecipient(user)) throw new Error('المستخدم المحدد غير موجود أو غير مؤهل لاستلام الإعلانات.');
  }
  const ref = doc(database(), ANNOUNCEMENTS, input.id);
  const previous = await getDoc(ref);
  const old = previous.exists() ? normalizeAnnouncementRecord(previous.data(), ref.id) as unknown as Announcement : null;
  const now = new Date().toISOString();
  const recipientCount = old && old.status !== 'DRAFT'
    ? await countAnnouncementRecipients(input.audienceType, input.audienceValue)
    : old?.recipientCount;
  const value: Announcement = { ...input, titleAr: input.titleAr.trim(), titleEn: input.titleEn.trim(), contentAr: input.contentAr.trim(), contentEn: input.contentEn.trim(), audienceValue: input.audienceType === 'ALL' || input.audienceType === 'ACTIVE' ? '' : input.audienceValue, status: old?.status || 'DRAFT', createdBy: old?.createdBy || actor.discordId, createdByName: old?.createdByName || actor.name, createdAt: old?.createdAt || now, updatedAt: now, publishedAt: old?.publishedAt || null, recipientCount, readCount: 0 };
  await setDoc(ref, value);
  return value;
}
export async function publishAnnouncement(id: string, recipientCount: number) {
  const ref = doc(database(), ANNOUNCEMENTS, id); const snapshot = await getDoc(ref);
  if (!snapshot.exists()) throw new Error('الإعلان غير موجود.');
  const old = normalizeAnnouncementRecord(snapshot.data(), ref.id) as unknown as Announcement;
  if (old.status !== 'DRAFT') throw new Error('يمكن نشر المسودات فقط.');
  const publishedAt = new Date().toISOString();
  const value = { ...old, status: statusOf({ ...old, status: 'ACTIVE' }), publishedAt, recipientCount, readCount: 0, updatedAt: publishedAt };
  await setDoc(ref, value); return value;
}
export async function archiveAnnouncement(id: string) { const ref = doc(database(), ANNOUNCEMENTS, id); const snapshot = await getDoc(ref); if (!snapshot.exists()) throw new Error('الإعلان غير موجود.'); const value = { ...normalizeAnnouncementRecord(snapshot.data(), ref.id) as unknown as Announcement, status: 'ARCHIVED' as const, updatedAt: new Date().toISOString() }; await setDoc(ref, value); return value; }
export async function deleteAnnouncement(id: string) { await deleteDoc(doc(database(), ANNOUNCEMENTS, id)); }
async function userProducts(userId: string): Promise<UserProduct[]> {
  const snapshot = await getDocs(query(collection(database(), 'userProducts'), where('userId', '==', userId)));
  return snapshot.docs.map((item) => item.data() as UserProduct);
}
export async function getAnnouncementsForUser(user: { discordId: string; role: string }) {
  const [announcements, userData, receiptSnapshot] = await Promise.all([
    listAnnouncements(), StoreDB.getUserByDiscordId(user.discordId),
    getDocs(query(collection(database(), RECEIPTS), where('userId', '==', user.discordId))),
  ]);
  const owned = userData ? await userProducts(userData.id) : [];
  if (!userData || !isEligibleAnnouncementRecipient(userData)) return [];
  const receipts = new Map(receiptSnapshot.docs.map((item) => [item.data().announcementId as string, item.data() as AnnouncementReceipt]));
  return announcements.filter((item) => {
    if (statusOf(item) !== 'ACTIVE') return false;
    switch (item.audienceType) {
      case 'ALL': return true;
      case 'ACTIVE': return hasRecentAnnouncementActivity(userData);
      case 'PRODUCT': return owned.some((product) => product.productId === item.audienceValue && isLicenseCurrentlyActive(product));
      case 'ROLE': return normalizeRole(userData?.role || user.role) === normalizeRole(item.audienceValue);
      case 'USER': return user.discordId === item.audienceValue;
    }
  }).filter((item) => !(receipts.get(item.id)?.dismissedAt && receipts.get(item.id)?.announcementUpdatedAt === item.updatedAt)).map((item) => ({ ...item, readAt: receipts.get(item.id)?.announcementUpdatedAt === item.updatedAt ? receipts.get(item.id)?.readAt || null : null })).sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.priority - a.priority || b.createdAt.localeCompare(a.createdAt));
}
export async function recordAnnouncementReceipt(announcementId: string, userId: string, action: 'read' | 'dismiss') {
  const ref = doc(database(), ANNOUNCEMENTS, announcementId); const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('الإعلان غير موجود.');
  const item = normalizeAnnouncementRecord(snap.data(), ref.id) as unknown as Announcement;
  const databaseUser = await StoreDB.getUserByDiscordId(userId);
  const visible = await getAnnouncementsForUser({ discordId: userId, role: databaseUser?.role || 'Customer' });
  if (!visible.some((entry) => entry.id === item.id)) throw new Error('لا يمكنك تحديث هذا الإعلان.');
  if (action === 'dismiss' && !item.dismissible) throw new Error('لا يمكن إغلاق هذا الإعلان.');
  const receiptId = `${announcementId}_${userId}`;
  const receiptRef = doc(database(), RECEIPTS, receiptId);
  return runTransaction(database(), async (transaction) => {
    const latestAnnouncement = await transaction.get(ref);
    const previousReceipt = await transaction.get(receiptRef);
    if (!latestAnnouncement.exists()) throw new Error('الإعلان غير موجود.');
    const latest = normalizeAnnouncementRecord(latestAnnouncement.data(), ref.id) as unknown as Announcement;
    if (latest.updatedAt !== item.updatedAt || statusOf(latest) !== 'ACTIVE') throw new Error('تم تحديث الإعلان. أعد تحميل الصفحة وحاول مجدداً.');
    if (action === 'dismiss' && !latest.dismissible) throw new Error('لا يمكن إغلاق هذا الإعلان.');

    const old = previousReceipt.exists() ? previousReceipt.data() as AnnouncementReceipt : null;
    const sameVersion = old?.announcementUpdatedAt === latest.updatedAt;
    const now = new Date().toISOString();
    const receipt: AnnouncementReceipt = {
      id: receiptId,
      announcementId,
      userId,
      announcementUpdatedAt: latest.updatedAt,
      readAt: sameVersion ? old?.readAt || now : now,
      dismissedAt: action === 'dismiss' ? now : sameVersion ? old?.dismissedAt || null : null,
      updatedAt: now,
    };
    const readCount = Math.max(0, Number(latest.readCount) || 0) + (shouldCountAnnouncementRead(old, latest.updatedAt) ? 1 : 0);
    transaction.update(ref, { readCount });
    transaction.set(receiptRef, receipt);
    return receipt;
  });
}
