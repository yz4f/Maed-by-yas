import { collection, doc, getDoc, getDocs, query, runTransaction, setDoc, updateDoc, where } from 'firebase/firestore';
import { db, StoreDB } from '@/lib/store-db';
import { hasPermission } from '@/lib/permissions';
import type { ResetRequest, ResetRequestStatus, ResetNotification } from '@/types';
import type { AuthenticatedActor } from '@/lib/request-actor';
import { syncDiscordResetRequestLog } from '@/lib/discord-bot';
import { canTransitionResetRequest } from '@/lib/reset-request-transition.mjs';

const RESET_COLLECTION = 'resetRequests';
// Kept as-is so existing completion notices remain visible without migrating customer data.
// Existing reset completion notices live in this legacy collection; keep reading
// it so removing support features does not orphan real customer reset history.
const RESET_NOTIFICATIONS_COLLECTION = 'supportNotifications';

function database() {
  const value = db();
  if (!value) throw new Error('تعذر الاتصال بقاعدة بيانات طلبات إعادة التعيين.');
  return value;
}

function makeId() {
  return `rst-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

async function ensureCustomer(actor: AuthenticatedActor) {
  const existing = await StoreDB.getUserByDiscordId(actor.id);
  if (existing) {
    if (existing.isBanned || existing.isArchived) throw new Error('الحساب غير متاح لطلبات إعادة التعيين.');
    return existing;
  }
  const now = new Date().toISOString();
  const user = {
    id: `user-${actor.id}`, discordId: actor.id, name: actor.name, email: actor.email || null,
    image: actor.image || null, role: actor.role, discordRoles: [], createdAt: now,
    lastLogin: now, isBanned: false, warningCount: 0, warningMessage: null,
  };
  await StoreDB.createUser(user);
  return user;
}

function toResetRequest(snapshot: { id: string; data(): unknown }): ResetRequest {
  return { id: snapshot.id, ...(snapshot.data() as Omit<ResetRequest, 'id'>) };
}

function publicResetRequest(request: ResetRequest, includeFullKey = false) {
  const safeRequest = { ...request };
  if (!includeFullKey) delete safeRequest.keyValue;
  return safeRequest;
}

export async function listCustomerResetNotifications(actor: AuthenticatedActor): Promise<ResetNotification[]> {
  await ensureCustomer(actor);
  const snapshot = await getDocs(query(collection(database(), RESET_NOTIFICATIONS_COLLECTION), where('customerDiscordId', '==', actor.id)));
  return snapshot.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<ResetNotification, 'id'>) }))
    .filter((item) => item.type === 'RESET_COMPLETED')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function markCustomerResetNotificationSeen(actor: AuthenticatedActor, notificationId: string) {
  await ensureCustomer(actor);
  const notificationRef = doc(database(), RESET_NOTIFICATIONS_COLLECTION, notificationId);
  const snapshot = await getDoc(notificationRef);
  if (!snapshot.exists()) throw new Error('التنبيه غير موجود.');
  const notification = { id: snapshot.id, ...(snapshot.data() as Omit<ResetNotification, 'id'>) };
  if (notification.customerDiscordId !== actor.id || notification.type !== 'RESET_COMPLETED') throw new Error('لا تملك صلاحية لهذا التنبيه.');
  const seenAt = notification.seenAt || new Date().toISOString();
  if (!notification.seenAt) await updateDoc(notificationRef, { seenAt });
  return { ...notification, seenAt };
}

export async function createResetRequest(actor: AuthenticatedActor, input: { productId?: string; licenseKey?: string; reason: string; language: 'ar' | 'en' }) {
  const reason = input.reason.trim();
  if (reason.length < 3 || reason.length > 500) throw new Error('يرجى توضيح سبب طلب Reset في 3 إلى 500 حرف.');
  const user = await ensureCustomer(actor);
  const ownedProducts = await StoreDB.getUserProducts(user.id);
  const activeProducts = ownedProducts.filter((item) => item.status === 'Active' && (!item.expiresAt || new Date(item.expiresAt).getTime() > Date.now()));
  const requestedKey = input.licenseKey?.trim();
  const ownedProductForKey = requestedKey ? activeProducts.find((item) => item.keyString?.trim() === requestedKey) : null;
  if (requestedKey && !ownedProductForKey) throw new Error('المفتاح لا يطابق منتجاً مفعلاً في حسابك. راجع المفتاح أو افتح الطلب من بطاقة المنتج.');
  const ownedProduct = ownedProductForKey || activeProducts.find((item) => item.productId === input.productId) || activeProducts[0];
  if (!ownedProduct) throw new Error('لا يوجد ترخيص نشط يمكن رفع طلب Reset له.');
  const product = ownedProduct.product;
  if (!product) throw new Error('بيانات المنتج المرتبط بهذا الترخيص غير متاحة.');

  const existing = await getDocs(query(collection(database(), RESET_COLLECTION), where('customerDiscordId', '==', actor.id)));
  const duplicate = existing.docs.map(toResetRequest).find((item) => ['PENDING', 'APPROVED', 'WAITING_FOR_CUSTOMER'].includes(item.status));
  if (duplicate) return { request: publicResetRequest(duplicate), duplicate: true };

  const now = new Date().toISOString();
  const id = makeId();
  const request: ResetRequest = {
    id, reference: `RST-${String(Date.now()).slice(-7)}`, customerId: user.id, customerDiscordId: actor.id,
    customerName: user.name, customerImage: user.image || null, customerEmail: user.email || null,
    productId: ownedProduct.productId, productName: product.name, productImage: product.image || null,
    keyId: ownedProduct.keyId || null, keyValue: ownedProduct.keyString || null,
    keyMasked: `••••••${String(ownedProduct.keyString || '').slice(-6)}`, purchasedAt: ownedProduct.activatedAt || null,
    expiresAt: ownedProduct.expiresAt || null, resetCount: ownedProduct.hwidResetCount || 0,
    lastResetAt: ownedProduct.hwidResetAt || null, reason, status: 'PENDING', adminNotes: null,
    createdAt: now, updatedAt: now, processedAt: null, processedById: null, processedByName: null,
    discordMessageId: null, discordLogChannelId: null,
  };
  const requestRef = doc(database(), RESET_COLLECTION, id);
  await setDoc(requestRef, request);
  void syncDiscordResetRequestLog({
    reference: request.reference, customerDiscordId: request.customerDiscordId, customerName: request.customerName,
    customerImage: request.customerImage, productName: request.productName, productImage: request.productImage || null,
    keyMasked: request.keyMasked, reason: request.reason, status: request.status,
  }).then(({ messageId, channelId }) => updateDoc(requestRef, { discordMessageId: messageId, discordLogChannelId: channelId }))
    .catch((error) => console.error('[Discord Reset] Unable to create request card:', error));
  await StoreDB.addLog('Reset Request Created', `تم إنشاء طلب ${request.reference} لمنتج ${request.productName}`, user.id, user.name);
  return { request: publicResetRequest(request), duplicate: false };
}

export async function listCustomerResetRequests(actor: AuthenticatedActor) {
  await ensureCustomer(actor);
  const snapshot = await getDocs(query(collection(database(), RESET_COLLECTION), where('customerDiscordId', '==', actor.id)));
  return snapshot.docs.map(toResetRequest).map((request) => publicResetRequest(request)).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export async function listResetRequests(actor: AuthenticatedActor) {
  if (!await hasPermission(actor, 'keys.reset')) throw new Error('هذه القائمة مخصصة للإدارة.');
  const canViewKeys = await hasPermission(actor, 'keys.view');
  const snapshot = await getDocs(collection(database(), RESET_COLLECTION));
  return snapshot.docs.map(toResetRequest).map((request) => publicResetRequest(request, canViewKeys)).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export async function processResetRequest(actor: AuthenticatedActor, input: { requestId: string; action: 'approve' | 'reject' | 'request_info' | 'complete'; note?: string; ipAddress?: string }) {
  if (!await hasPermission(actor, 'keys.reset')) throw new Error('تنفيذ ومراجعة Reset مخصصان للإدارة فقط.');
  const requestRef = doc(database(), RESET_COLLECTION, input.requestId);
  const snapshot = await getDoc(requestRef);
  if (!snapshot.exists()) throw new Error('طلب Reset غير موجود.');
  let request = toResetRequest(snapshot);
  const note = input.note?.trim().slice(0, 1000) || '';
  const now = new Date().toISOString();
  let status: ResetRequestStatus;
  if (input.action === 'approve') status = 'APPROVED';
  else if (input.action === 'reject') status = 'REJECTED';
  else if (input.action === 'request_info') {
    if (!note) throw new Error('اكتب المعلومات المطلوبة من العميل أولاً.');
    status = 'WAITING_FOR_CUSTOMER';
  } else {
    const notificationRef = doc(database(), RESET_NOTIFICATIONS_COLLECTION, `reset-completed-${request.id}`);
    const licenseQuery = query(
      collection(database(), 'userProducts'),
      where('userId', '==', request.customerId),
      where('productId', '==', request.productId),
    );
    const licenses = await getDocs(licenseQuery);
    const activeLicenseRef = licenses.docs.find((license) => (license.data() as { status?: string }).status === 'Active')?.ref;
    if (!activeLicenseRef) throw new Error('لا يوجد ترخيص نشط لهذا المنتج.');
    await runTransaction(database(), async (transaction) => {
      const currentRequest = await transaction.get(requestRef);
      const activeLicense = await transaction.get(activeLicenseRef);
      if (!currentRequest.exists()) throw new Error('طلب Reset غير موجود.');
      const current = toResetRequest(currentRequest);
      if (!canTransitionResetRequest(current.status, input.action)) throw new Error('يجب الموافقة على الطلب أولاً قبل تنفيذ Reset.');
      if (!activeLicense.exists() || activeLicense.data().status !== 'Active') throw new Error('لا يوجد ترخيص نشط لهذا المنتج.');

      const license = activeLicense.data() as { hwidResetCount?: number };
      const resetCount = (license.hwidResetCount || 0) + 1;
      const completedRequest = {
        ...current,
        status: 'COMPLETED' as const,
        adminNotes: note || null,
        resetCount,
        lastResetAt: now,
        updatedAt: now,
        processedAt: now,
        processedById: actor.id,
        processedByName: actor.name,
      };
      transaction.update(activeLicenseRef, {
        hwidResetAt: now,
        hwidResetCount: resetCount,
      });
      transaction.update(requestRef, {
        status: completedRequest.status,
        adminNotes: completedRequest.adminNotes,
        updatedAt: completedRequest.updatedAt,
        processedAt: completedRequest.processedAt,
        processedById: completedRequest.processedById,
        processedByName: completedRequest.processedByName,
      });
      transaction.set(notificationRef, {
        id: notificationRef.id,
        customerDiscordId: current.customerDiscordId,
        type: 'RESET_COMPLETED',
        priority: 'high',
        title: 'تم رستات مفتاحك بنجاح',
        message: `تمت إعادة ضبط مفتاح ${current.productName}. يمكنك الآن التسجيل أو تشغيل المنتج من صفحة منتجاتي.`,
        createdAt: now,
        seenAt: null,
      });
      request = completedRequest;
    });
    await StoreDB.addLog('HWID Reset', `تمت إعادة تعيين ربط الجهاز للمنتج ${request.productId}`, request.customerId, 'Customer', input.ipAddress, {
      eventType: 'hwid_reset', actorUserId: actor.id, actorDiscordId: actor.id, actorName: actor.name,
      targetUserId: request.customerId, targetDiscordId: request.customerDiscordId, productId: request.productId,
      metadata: { requestId: request.id, resetCount: request.resetCount },
    });
    status = 'COMPLETED';
  }
  if (status !== 'COMPLETED') {
    await runTransaction(database(), async (transaction) => {
      const currentSnapshot = await transaction.get(requestRef);
      if (!currentSnapshot.exists()) throw new Error('طلب Reset غير موجود.');
      const current = toResetRequest(currentSnapshot);
      if (!canTransitionResetRequest(current.status, input.action)) {
        const message = input.action === 'approve' ? 'لا يمكن اعتماد الطلب بحالته الحالية.'
          : input.action === 'reject' ? 'لا يمكن رفض الطلب بحالته الحالية.'
            : 'تم إنهاء هذا الطلب مسبقاً.';
        throw new Error(message);
      }
      const updatedRequest = {
        ...current,
        status,
        adminNotes: note || null,
        updatedAt: now,
        processedAt: ['APPROVED', 'REJECTED'].includes(status) ? now : null,
        processedById: actor.id,
        processedByName: actor.name,
      };
      transaction.update(requestRef, {
        status: updatedRequest.status,
        adminNotes: updatedRequest.adminNotes,
        updatedAt: updatedRequest.updatedAt,
        processedAt: updatedRequest.processedAt,
        processedById: updatedRequest.processedById,
        processedByName: updatedRequest.processedByName,
      });
      request = updatedRequest;
    });
  }
  const updatedRequest = { ...request, status, adminNotes: note || null, updatedAt: now, processedAt: now, processedById: actor.id, processedByName: actor.name, discordMessageId: request.discordMessageId || null };
  void syncDiscordResetRequestLog({
    reference: updatedRequest.reference, customerDiscordId: updatedRequest.customerDiscordId, customerName: updatedRequest.customerName,
    customerImage: updatedRequest.customerImage, productName: updatedRequest.productName, productImage: updatedRequest.productImage || null,
    keyMasked: updatedRequest.keyMasked, reason: updatedRequest.reason, status: updatedRequest.status,
    adminName: updatedRequest.processedByName, adminNotes: updatedRequest.adminNotes,
    discordMessageId: updatedRequest.discordMessageId, discordLogChannelId: updatedRequest.discordLogChannelId,
  }).then(({ messageId, channelId }) => updateDoc(requestRef, { discordMessageId: messageId, discordLogChannelId: channelId }))
    .catch((error) => console.error('[Discord Reset] Unable to update request card:', error));
  await StoreDB.addLog(`Reset ${status}`, `طلب ${request.reference} — ${request.productName}`, actor.id, actor.name, input.ipAddress, {
    eventType: 'reset_request_processed', actorUserId: actor.id, actorDiscordId: actor.id, actorName: actor.name,
    targetUserId: request.customerId, targetDiscordId: request.customerDiscordId, productId: request.productId,
    metadata: { requestId: request.id, reference: request.reference, action: input.action, status, note: note || null },
  });
  return publicResetRequest(updatedRequest);
}
