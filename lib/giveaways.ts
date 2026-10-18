import 'server-only';
import { createHash, randomInt, randomUUID } from 'node:crypto';
import { collection, doc, getDoc, getDocs, query, runTransaction, setDoc, updateDoc, where } from 'firebase/firestore';
import { db as getDb, StoreDB } from '@/lib/store-db';
import { isLicenseCurrentlyActive, resolveProductKeyDuration } from '@/lib/license-duration';
import type { KeyDuration, Product, User, UserProduct } from '@/types';

export const GIVEAWAY_GUILD_ID = '1396959491786018826';
export const GIVEAWAY_CHANNEL_ID = '1444216009094467695';
const SITE_URL = (process.env.NEXTAUTH_URL || 'https://t3nn.wtf').replace(/\/$/, '');

export type Giveaway = {
  id: string; title: string; body: string; productId: string; productName: string;
  duration: KeyDuration; endsAt: string; status: 'DRAFT' | 'PUBLISHING' | 'OPEN' | 'DRAWING' | 'SENDING' | 'DELIVERED' | 'DELIVERY_FAILED' | 'EMPTY' | 'CANCELLED';
  createdAt: string; createdBy: string; messageId?: string; winnerId?: string; keyId?: string;
  deliveredAt?: string; deliveryAttemptedAt?: string; deliveryError?: string; entryCount?: number;
};
type GiveawayKey = { id: string; key: string; giveawayId: string; productId: string; duration: KeyDuration; status: 'AVAILABLE' | 'RESERVED' | 'REDEEMED'; winnerId?: string; usedAt?: string; createdAt: string };
const database = () => { const value = getDb(); if (!value) throw new Error('قاعدة البيانات غير متاحة.'); return value; };
const keyId = (key: string) => createHash('sha256').update(key.trim()).digest('hex');

export async function listGiveaways() {
  const snap = await getDocs(collection(database(), 'giveaways'));
  const giveaways = snap.docs.map(item => item.data() as Giveaway).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 40);
  const counts = await Promise.all(giveaways.map(async giveaway => {
    const [keys, entries] = await Promise.all([
      getDocs(query(collection(database(), 'giveawayKeys'), where('giveawayId', '==', giveaway.id))),
      getDocs(collection(database(), 'giveaways', giveaway.id, 'entries')),
    ]);
    return { ...giveaway, entryCount: entries.size, keyCount: keys.size, availableKeys: keys.docs.filter(item => item.data().status === 'AVAILABLE').length };
  }));
  return counts;
}

export async function createGiveaway(input: { title: string; body: string; productId: string; duration: KeyDuration; endsAt: string }, actorId: string) {
  const product = await StoreDB.getProductById(input.productId);
  if (!product || product.isDisabled) throw new Error('اختر منتجًا متاحًا.');
  const ends = Date.parse(input.endsAt);
  if (!Number.isFinite(ends) || ends < Date.now() + 60_000 || ends > Date.now() + 30 * 86400_000) throw new Error('حدد وقت نهاية بين دقيقة و30 يومًا من الآن.');
  const now = new Date().toISOString();
  const giveaway: Giveaway = { id: randomUUID(), title: input.title, body: input.body, productId: product.id, productName: product.name, duration: resolveProductKeyDuration(product.id, input.duration), endsAt: new Date(ends).toISOString(), status: 'DRAFT', createdAt: now, createdBy: actorId };
  await setDoc(doc(database(), 'giveaways', giveaway.id), giveaway);
  return giveaway;
}

export async function addGiveawayKeys(giveawayId: string, values: string[]) {
  const ref = doc(database(), 'giveaways', giveawayId);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists() || snapshot.data().status !== 'DRAFT') throw new Error('إضافة المفاتيح متاحة للمسودة فقط.');
  const giveaway = snapshot.data() as Giveaway;
  const keys = [...new Set(values.map(value => value.trim()).filter(Boolean))];
  if (!keys.length || keys.length > 125 || keys.some(key => key.length < 6 || key.length > 160)) throw new Error('أدخل من 1 إلى 125 مفتاحًا صالحًا.');
  // Check sale inventory too: the same plaintext key must never be redeemable in both pools.
  for (let index = 0; index < keys.length; index += 20) {
    await Promise.all(keys.slice(index, index + 20).map(async key => {
      const [stock, existing] = await Promise.all([
        getDocs(query(collection(database(), 'keys'), where('key', '==', key))),
        getDoc(doc(database(), 'giveawayKeys', keyId(key))),
      ]);
      if (!stock.empty || existing.exists()) throw new Error(`المفتاح ${key} موجود مسبقًا.`);
    }));
  }
  await runTransaction(database(), async transaction => {
    const previous = await Promise.all(keys.map(key => transaction.get(doc(database(), 'giveawayKeys', keyId(key)))));
    if (previous.some(item => item.exists())) throw new Error('أحد المفاتيح موجود مسبقًا.');
    for (const key of keys) {
      const item: GiveawayKey = { id: keyId(key), key, giveawayId, productId: giveaway.productId, duration: giveaway.duration, status: 'AVAILABLE', createdAt: new Date().toISOString() };
      transaction.set(doc(database(), 'giveawayKeys', item.id), item);
    }
  });
  return keys.length;
}

export async function publishGiveaway(id: string) {
  const ref = doc(database(), 'giveaways', id);
  const snap = await getDoc(ref);
  if (!snap.exists() || snap.data().status !== 'DRAFT') throw new Error('السحب غير متاح للنشر.');
  const giveaway = snap.data() as Giveaway;
  if (Date.parse(giveaway.endsAt) <= Date.now()) throw new Error('انتهى وقت السحب؛ غيّر المسودة.');
  const keys = await getDocs(query(collection(database(), 'giveawayKeys'), where('giveawayId', '==', id)));
  if (!keys.docs.some(item => item.data().status === 'AVAILABLE')) throw new Error('أضف مفتاح سحب واحدًا على الأقل قبل النشر.');
  await runTransaction(database(), async transaction => {
    const current = await transaction.get(ref);
    if (!current.exists() || current.data().status !== 'DRAFT') throw new Error('بدأ نشر السحب بالفعل.');
    transaction.update(ref, { status: 'PUBLISHING' });
  });
  let messageId: string;
  try {
    const { publishDiscordGiveaway } = await import('@/lib/discord-bot');
    messageId = await publishDiscordGiveaway(giveaway);
    await updateDoc(ref, { status: 'OPEN', messageId });
  } catch (error) {
    await updateDoc(ref, { status: 'DRAFT' }).catch(() => undefined);
    throw error;
  }
  return { ...giveaway, status: 'OPEN' as const, messageId };
}

export async function joinGiveaway(id: string, discordId: string, channelId: string, messageId: string) {
  if (channelId !== GIVEAWAY_CHANNEL_ID || !/^\d{16,22}$/.test(discordId)) throw new Error('المشاركة متاحة في روم السحب المحدد فقط.');
  const ref = doc(database(), 'giveaways', id);
  const entryRef = doc(database(), 'giveaways', id, 'entries', discordId);
  return runTransaction(database(), async transaction => {
    const [giveawaySnap, entrySnap] = await Promise.all([transaction.get(ref), transaction.get(entryRef)]);
    if (!giveawaySnap.exists()) throw new Error('هذا السحب غير موجود.');
    const giveaway = giveawaySnap.data() as Giveaway;
    if (giveaway.status !== 'OPEN' || Date.parse(giveaway.endsAt) <= Date.now() || giveaway.messageId !== messageId) throw new Error('انتهى السحب أو توقفت المشاركة.');
    if (entrySnap.exists()) return false;
    transaction.set(entryRef, { discordId, joinedAt: new Date().toISOString() });
    return true;
  });
}

export async function finishDueGiveaways() {
  const open = await getDocs(query(collection(database(), 'giveaways'), where('status', '==', 'OPEN')));
  for (const item of open.docs) {
    const giveaway = item.data() as Giveaway;
    if (Date.parse(giveaway.endsAt) > Date.now()) continue;
    try { await finishGiveaway(giveaway.id); } catch (error) { console.error('[Giveaway] Draw failed:', giveaway.id, error); }
  }
  for (const status of ['DRAWING', 'SENDING'] as const) {
    const pending = await getDocs(query(collection(database(), 'giveaways'), where('status', '==', status)));
    for (const item of pending.docs) {
      const giveaway = item.data() as Giveaway;
      if (status === 'SENDING' && Date.now() - (Date.parse(giveaway.deliveryAttemptedAt || '') || 0) < 120_000) continue;
      try { await deliverGiveaway(giveaway.id); } catch (error) { console.error('[Giveaway] Delivery recovery failed:', giveaway.id, error); }
    }
  }
}

export async function finishGiveaway(id: string) {
  const ref = doc(database(), 'giveaways', id);
  const [entriesSnap, keysSnap] = await Promise.all([
    getDocs(collection(database(), 'giveaways', id, 'entries')),
    getDocs(query(collection(database(), 'giveawayKeys'), where('giveawayId', '==', id))),
  ]);
  const ids = entriesSnap.docs.map(item => item.id);
  const available = keysSnap.docs.filter(item => item.data().status === 'AVAILABLE');
  const chosenId = ids.length ? ids[randomInt(ids.length)] : undefined;
  const chosenKey = available[0];
  let selected = false;
  await runTransaction(database(), async transaction => {
    const current = await transaction.get(ref);
    if (!current.exists()) return;
    const giveaway = current.data() as Giveaway;
    if (giveaway.status !== 'OPEN' || Date.parse(giveaway.endsAt) > Date.now()) return;
    const keySnap = chosenKey ? await transaction.get(chosenKey.ref) : null;
    if (!chosenId || !keySnap?.exists() || keySnap.data().status !== 'AVAILABLE') {
      transaction.update(ref, { status: 'EMPTY', entryCount: ids.length });
      return;
    }
    transaction.update(chosenKey.ref, { status: 'RESERVED', winnerId: chosenId });
    transaction.update(ref, { status: 'DRAWING', winnerId: chosenId, keyId: chosenKey.id, entryCount: ids.length });
    selected = true;
  });
  if (selected) {
    const { updateDiscordGiveawayResult } = await import('@/lib/discord-bot');
    await updateDiscordGiveawayResult(id).catch(error => console.error('[Giveaway] Result message update failed:', error));
    await deliverGiveaway(id);
  } else {
    const after = await getDoc(ref);
    if (after.exists() && after.data().status === 'EMPTY') {
      const { updateDiscordGiveawayResult } = await import('@/lib/discord-bot');
      await updateDiscordGiveawayResult(id).catch(error => console.error('[Giveaway] Empty result message update failed:', error));
    }
  }
}

export async function deliverGiveaway(id: string) {
  const ref = doc(database(), 'giveaways', id);
  let giveaway: Giveaway | null = null;
  await runTransaction(database(), async transaction => {
    const snap = await transaction.get(ref);
    if (!snap.exists()) throw new Error('السحب غير موجود.');
    const current = snap.data() as Giveaway;
    const stalled = current.status === 'SENDING' && Date.now() - (Date.parse(current.deliveryAttemptedAt || '') || 0) > 120_000;
    if (!['DRAWING', 'DELIVERY_FAILED'].includes(current.status) && !stalled) throw new Error('لا يوجد تسليم يحتاج إلى إعادة محاولة.');
    if (!current.winnerId || !current.keyId) throw new Error('لا يوجد مفتاح جاهز للإرسال.');
    giveaway = current;
    transaction.update(ref, { status: 'SENDING', deliveryAttemptedAt: new Date().toISOString() });
  });
  if (!giveaway) throw new Error('تعذر حجز عملية الإرسال.');
  const selected = giveaway as Giveaway;
  try {
    const keySnap = await getDoc(doc(database(), 'giveawayKeys', selected.keyId!));
    if (!keySnap.exists() || keySnap.data().winnerId !== selected.winnerId) throw new Error('مفتاح الفائز غير متاح.');
    const { sendDiscordGiveawayWinner } = await import('@/lib/discord-bot');
    await sendDiscordGiveawayWinner(selected, String(keySnap.data().key), SITE_URL);
    await updateDoc(ref, { status: 'DELIVERED', deliveredAt: new Date().toISOString(), deliveryError: '' });
  } catch (error) {
    await updateDoc(ref, { status: 'DELIVERY_FAILED', deliveryError: error instanceof Error ? error.message.slice(0, 200) : 'تعذر إرسال الرسالة الخاصة.' });
    throw error;
  }
}

export async function claimGiveawayKey(id: string, discordId: string, channelId: string, messageId: string) {
  if (channelId !== GIVEAWAY_CHANNEL_ID) throw new Error('استلام الجائزة متاح في روم السحب فقط.');
  const snap = await getDoc(doc(database(), 'giveaways', id));
  if (!snap.exists()) throw new Error('السحب غير موجود.');
  const giveaway = snap.data() as Giveaway;
  if (giveaway.messageId !== messageId || giveaway.winnerId !== discordId || !giveaway.keyId) throw new Error('هذا الزر مخصص للفائز فقط.');
  const keySnap = await getDoc(doc(database(), 'giveawayKeys', giveaway.keyId));
  if (!keySnap.exists() || keySnap.data().winnerId !== discordId) throw new Error('مفتاح الجائزة غير متاح.');
  return `🎉 جائزتك: **${giveaway.productName}**\nمفتاحك: \`${String(keySnap.data().key)}\`\nفعّله من ${SITE_URL} عبر حساب Discord الفائز.`;
}

export async function activateGiveawayKey(keyString: string, userDetails: { discordId: string; name: string; email?: string; image?: string }, ip: string): Promise<{ success: boolean; message: string; product?: Product; duration?: KeyDuration }> {
  const keyRef = doc(database(), 'giveawayKeys', keyId(keyString));
  const keySnap = await getDoc(keyRef);
  if (!keySnap.exists() || keySnap.data().key !== keyString) return { success: false, message: 'المفتاح غير صحيح أو غير موجود' };
  const key = keySnap.data() as GiveawayKey;
  if (key.winnerId !== userDetails.discordId) return { success: false, message: 'مفتاح السحب مخصص لحساب الفائز فقط.' };
  if (key.status === 'REDEEMED') return { success: false, message: 'تم تفعيل هذا المفتاح مسبقًا.' };
  if (key.status !== 'RESERVED') return { success: false, message: 'هذا المفتاح غير متاح للتفعيل.' };
  const product = await StoreDB.getProductById(key.productId);
  if (!product || product.isDisabled) return { success: false, message: 'المنتج المرتبط غير متاح.' };
  let user = await StoreDB.getUserByDiscordId(userDetails.discordId);
  if (!user) {
    const now = new Date().toISOString();
    user = { id: `user-${Date.now()}-${randomUUID().slice(0, 6)}`, discordId: userDetails.discordId, name: userDetails.name, email: userDetails.email, image: userDetails.image, role: 'Customer', discordRoles: [], createdAt: now, welcomeVideoRequiredAt: now, welcomeVideoCompletedAt: null, lastLogin: now, lastIp: ip, isBanned: false, warningCount: 0, warningMessage: null } as User;
    await StoreDB.createUser(user);
  }
  const licenses = await StoreDB.getUserProducts(user.id);
  if (licenses.some(item => item.productId === product.id && isLicenseCurrentlyActive(item))) return { success: false, message: 'لديك هذا المنتج مفعّل بالفعل.' };
  try {
    await runTransaction(database(), async transaction => {
      const current = await transaction.get(keyRef);
      if (!current.exists() || current.data().status !== 'RESERVED' || current.data().winnerId !== userDetails.discordId) throw new Error('المفتاح مستخدم أو غير مخصص لهذا الحساب.');
      const now = new Date().toISOString();
      const license: UserProduct = { id: `up-${randomUUID()}`, userId: user.id, productId: product.id, keyId: key.id, keyString: key.key, licenseDuration: key.duration, status: 'Active', activatedAt: now, startedAt: null, expiresAt: null, discordRoleGranted: true };
      transaction.update(keyRef, { status: 'REDEEMED', usedAt: now });
      transaction.set(doc(database(), 'userProducts', license.id), license);
    });
  } catch (error) { return { success: false, message: error instanceof Error ? error.message : 'تعذر تفعيل المفتاح.' }; }
  await StoreDB.addLog('Giveaway Activation', `تم تفعيل مفتاح السحب ${product.name}`, user.id, user.name, ip);
  return { success: true, message: 'تم تفعيل المنتج بنجاح.', product, duration: key.duration };
}
