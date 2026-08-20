import { getApps, getApp, initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, doc, getDoc, getDocs, query, runTransaction, setDoc, updateDoc, where } from 'firebase/firestore';
import { db as getDb, StoreDB } from '@/lib/store-db';
import { TicketActor, canManageTickets } from '@/lib/ticket-auth';
import { SupportTicket, TicketAttachment, TicketCategory, TicketCustomerProfile, TicketDepartment, TicketDetail, TicketMessage, TicketPriority, TicketStats, TicketStatus, TicketTimelineEvent } from '@/types';

const firebaseConfig = {
  apiKey: 'AIzaSyDrMw5gxptqdancpaoSu2Mg0_C1DcSVqn8',
  authDomain: 'tnnn-aa170.firebaseapp.com',
  projectId: 'tnnn-aa170',
  storageBucket: 'tnnn-aa170.firebasestorage.app',
  messagingSenderId: '540085648299',
  appId: '1:540085648299:web:9451081f61c38cf45270ee',
};

const ACCEPTED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'application/pdf', 'text/plain']);
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
const STATUS_VALUES: TicketStatus[] = ['new', 'open', 'in_progress', 'awaiting_user', 'awaiting_staff', 'resolved', 'closed'];
const PRIORITY_VALUES: TicketPriority[] = ['low', 'medium', 'high', 'urgent'];
const DEPARTMENT_VALUES: TicketDepartment[] = ['technical_support', 'sales', 'billing', 'accounts'];
const CATEGORY_VALUES: TicketCategory[] = ['technical', 'account', 'service', 'suggestion', 'other'];
const STAFF_ROLE_NAMES = new Set(['Boss', 'Co-Boss', 'Admin']);
const SLA_HOURS: Record<TicketPriority, number> = { low: 24, medium: 12, high: 4, urgent: 1 };
const STATUS_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  new: ['open', 'in_progress', 'awaiting_staff', 'closed'],
  open: ['in_progress', 'awaiting_staff', 'awaiting_user', 'resolved', 'closed'],
  in_progress: ['open', 'awaiting_user', 'awaiting_staff', 'resolved', 'closed'],
  awaiting_user: ['in_progress', 'resolved', 'closed'],
  awaiting_staff: ['open', 'in_progress', 'closed'],
  resolved: ['closed', 'open'],
  closed: [],
};

function hasPrefix(bytes: Uint8Array, prefix: number[]) {
  return prefix.every((value, index) => bytes[index] === value);
}

async function assertAttachmentContent(file: File) {
  const bytes = new Uint8Array(await file.slice(0, 512).arrayBuffer());
  const isValid = (() => {
    if (file.type === 'image/png') return hasPrefix(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    if (file.type === 'image/jpeg') return hasPrefix(bytes, [0xff, 0xd8, 0xff]);
    if (file.type === 'image/gif') return hasPrefix(bytes, [0x47, 0x49, 0x46, 0x38]) && (bytes[4] === 0x37 || bytes[4] === 0x39) && bytes[5] === 0x61;
    if (file.type === 'image/webp') return hasPrefix(bytes, [0x52, 0x49, 0x46, 0x46]) && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
    if (file.type === 'application/pdf') return hasPrefix(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d]);
    if (file.type === 'text/plain') return !bytes.some((value) => value === 0);
    return false;
  })();
  if (!isValid) throw new TicketError('محتوى الملف لا يطابق نوعه المسموح.');
}

export class TicketError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

function database() {
  const value = getDb();
  if (!value) throw new TicketError('تعذر الاتصال بقاعدة بيانات التذاكر.');
  return value;
}

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function ticketRef(ticketId: string) {
  return doc(database(), 'tickets', ticketId);
}

function ticketModerationRef(userId: string) {
  return doc(database(), 'ticketModeration', userId);
}

function displayStatus(status: TicketStatus) {
  return ({ new: 'جديدة', open: 'مفتوحة', in_progress: 'قيد المعالجة', awaiting_user: 'بانتظار المستخدم', awaiting_staff: 'بانتظار الإدارة', resolved: 'تم الحل', closed: 'مغلقة' } as Record<TicketStatus, string>)[status];
}

function isTicketStaffRole(role: string) {
  return STAFF_ROLE_NAMES.has(role);
}

function buildSlaDueAt(priority: TicketPriority, from = Date.now()) {
  return new Date(from + SLA_HOURS[priority] * 60 * 60 * 1000).toISOString();
}

function assertStatusTransition(current: TicketStatus, next: TicketStatus) {
  if (current === next) return;
  if (!STATUS_TRANSITIONS[current]?.includes(next)) {
    throw new TicketError(`لا يمكن نقل التذكرة من ${displayStatus(current)} إلى ${displayStatus(next)} مباشرة.`, 409);
  }
}

function displayPriority(priority: TicketPriority) {
  return ({ low: 'منخفضة', medium: 'متوسطة', high: 'عالية', urgent: 'عاجلة' } as Record<TicketPriority, string>)[priority];
}

function mapTicket(snapshot: any): SupportTicket {
  return { id: snapshot.id, ...(snapshot.data() as Omit<SupportTicket, 'id'>) } as SupportTicket;
}

function assertTicketAccess(ticket: SupportTicket, actor: TicketActor) {
  if (!canManageTickets(actor) && ticket.userId !== actor.id) {
    throw new TicketError('لا تملك صلاحية الوصول إلى هذه التذكرة.', 403);
  }
}

function assertStaff(actor: TicketActor) {
  if (!canManageTickets(actor)) throw new TicketError('هذه العملية مخصصة لفريق الدعم.', 403);
}

function timelineEvent(ticketId: string, actor: TicketActor, type: TicketTimelineEvent['type'], message: string, now: string): TicketTimelineEvent {
  return { id: makeId('evt'), ticketId, actorId: actor.id, actorName: actor.name, type, message, createdAt: now };
}

function recordTicketAudit(actor: TicketActor, action: string, details: string) {
  void StoreDB.addLog(action, details, actor.id, actor.name).catch((error) => {
    console.error('Ticket audit logging failed:', error);
  });
}

export async function listTickets(actor: TicketActor, options: { status?: string; priority?: string; department?: string; mine?: boolean; query?: string } = {}) {
  const db = database();
  const snapshot = canManageTickets(actor)
    ? await getDocs(collection(db, 'tickets'))
    : await getDocs(query(collection(db, 'tickets'), where('userId', '==', actor.id)));
  let tickets = snapshot.docs.map(mapTicket);
  if (canManageTickets(actor) && options.mine) tickets = tickets.filter(ticket => ticket.assignedAgentId === actor.id);
  if (options.status && STATUS_VALUES.includes(options.status as TicketStatus)) tickets = tickets.filter(ticket => ticket.status === options.status);
  if (options.priority && PRIORITY_VALUES.includes(options.priority as TicketPriority)) tickets = tickets.filter(ticket => ticket.priority === options.priority);
  if (options.department && DEPARTMENT_VALUES.includes(options.department as TicketDepartment)) tickets = tickets.filter(ticket => ticket.department === options.department);
  if (options.query) {
    const term = options.query.trim().toLowerCase();
    if (term) tickets = tickets.filter(ticket => [ticket.number, ticket.title, ticket.userName, ticket.assignedAgentName || ''].some(value => value.toLowerCase().includes(term)));
  }
  return tickets.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

async function getTicketCustomerProfile(ticket: SupportTicket, actor: TicketActor): Promise<TicketCustomerProfile | undefined> {
  if (!canManageTickets(actor)) return undefined;
  const [users, moderationSnapshot] = await Promise.all([
    StoreDB.getUsers(),
    getDoc(ticketModerationRef(ticket.userId)),
  ]);
  const user = users.find((item) => item.id === ticket.userId || item.discordId === ticket.userId);
  const moderation = moderationSnapshot.exists() ? moderationSnapshot.data() : {};
  return {
    id: ticket.userId,
    name: user?.name || ticket.userName,
    email: user?.email || null,
    image: user?.image || ticket.userImage || null,
    role: user?.role || 'Customer',
    createdAt: user?.createdAt || null,
    ticketMuted: moderation.muted === true,
    mutedAt: moderation.mutedAt || null,
    mutedByName: moderation.mutedByName || null,
    muteReason: moderation.reason || null,
  };
}

export async function getTicketDetail(ticketId: string, actor: TicketActor): Promise<TicketDetail> {
  const db = database();
  const ticketSnapshot = await getDoc(doc(db, 'tickets', ticketId));
  if (!ticketSnapshot.exists()) throw new TicketError('التذكرة غير موجودة.', 404);
  const ticket = mapTicket(ticketSnapshot);
  assertTicketAccess(ticket, actor);

  const [messagesSnapshot, timelineSnapshot, customer] = await Promise.all([
    getDocs(collection(db, 'tickets', ticketId, 'messages')),
    getDocs(collection(db, 'tickets', ticketId, 'timeline')),
    getTicketCustomerProfile(ticket, actor),
  ]);
  const messages = messagesSnapshot.docs
    .map(item => ({ id: item.id, ...(item.data() as Omit<TicketMessage, 'id'>) }))
    .filter(message => canManageTickets(actor) || !message.isInternal)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) as TicketMessage[];
  const timeline = timelineSnapshot.docs
    .map(item => ({ id: item.id, ...(item.data() as Omit<TicketTimelineEvent, 'id'>) }))
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) as TicketTimelineEvent[];
  return { ticket, messages, timeline, customer };
}

export async function createTicket(actor: TicketActor, input: { title: string; department?: TicketDepartment; category: TicketCategory; priority: TicketPriority; body: string }) {
  const title = input.title.trim();
  const body = input.body.trim();
  if (title.length < 4 || title.length > 140) throw new TicketError('عنوان التذكرة يجب أن يكون بين 4 و140 حرفًا.');
  if (body.length < 10 || body.length > 6000) throw new TicketError('شرح المشكلة يجب أن يكون بين 10 و6000 حرف.');
  if (!CATEGORY_VALUES.includes(input.category)) throw new TicketError('نوع المشكلة غير صالح.');
  if (input.department && !DEPARTMENT_VALUES.includes(input.department)) throw new TicketError('قسم الدعم غير صالح.');
  if (!PRIORITY_VALUES.includes(input.priority)) throw new TicketError('الأولوية غير صالحة.');

  const db = database();
  const moderationSnapshot = await getDoc(ticketModerationRef(actor.id));
  if (moderationSnapshot.exists() && moderationSnapshot.data().muted === true) {
    throw new TicketError('تم كتم حسابك من فتح تذاكر دعم جديدة. راجع فريق الإدارة إذا كان لديك استفسار.', 403);
  }
  const now = new Date().toISOString();
  const ticketId = makeId('ticket');
  const initialMessageId = makeId('msg');
  const eventId = makeId('evt');
  let number = '';

  await runTransaction(db, async transaction => {
    const counterRef = doc(db, 'system', 'ticket-counter');
    const counterSnapshot = await transaction.get(counterRef);
    const nextNumber = (counterSnapshot.exists() ? Number(counterSnapshot.data().lastNumber || 10000) : 10000) + 1;
    number = `TK-${nextNumber}`;
    const ticket: SupportTicket = {
      id: ticketId, number, title, department: input.department || 'technical_support', category: input.category, tags: [], priority: input.priority, status: 'new',
      userId: actor.id, userName: actor.name, userImage: actor.image || null,
      assignedAgentId: null, assignedAgentName: null, assignedAgentImage: null,
      createdAt: now, updatedAt: now, lastMessageAt: now,
      resolvedAt: null, resolvedById: null, resolvedByName: null,
      closedAt: null, closedById: null, closedByName: null, finalClosed: false, slaDueAt: buildSlaDueAt(input.priority), messageCount: 1,
    };
    const message: TicketMessage = { id: initialMessageId, ticketId, authorId: actor.id, authorName: actor.name, authorImage: actor.image || null, authorRole: 'customer', body, isInternal: false, attachments: [], createdAt: now };
    const event = timelineEvent(ticketId, actor, 'created', `تم إنشاء التذكرة ${number} وإحالتها إلى الدعم الفني.`, now);
    transaction.set(doc(db, 'tickets', ticketId), ticket);
    transaction.set(doc(db, 'tickets', ticketId, 'messages', initialMessageId), message);
    transaction.set(doc(db, 'tickets', ticketId, 'timeline', eventId), event);
    transaction.set(counterRef, { lastNumber: nextNumber, updatedAt: now }, { merge: true });
  });
  const detail = await getTicketDetail(ticketId, actor);
  recordTicketAudit(actor, 'Ticket Created', `تم إنشاء ${detail.ticket.number} في قسم ${detail.ticket.department || 'technical_support'}.`);
  return detail;
}

export async function claimTicket(ticketId: string, actor: TicketActor) {
  assertStaff(actor);
  const db = database();
  const now = new Date().toISOString();
  await runTransaction(db, async transaction => {
    const ref = doc(db, 'tickets', ticketId);
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists()) throw new TicketError('التذكرة غير موجودة.', 404);
    const ticket = mapTicket(snapshot);
    if (ticket.status === 'closed') throw new TicketError('التذكرة مغلقة نهائيًا ولا يمكن استلامها.', 409);
    if (ticket.assignedAgentId && ticket.assignedAgentId !== actor.id) throw new TicketError('قام موظف آخر باستلام التذكرة بالفعل.', 409);
    const status: TicketStatus = 'in_progress';
    transaction.update(ref, { assignedAgentId: actor.id, assignedAgentName: actor.name, assignedAgentImage: actor.image || null, status, updatedAt: now });
    const event = timelineEvent(ticketId, actor, 'claimed', `تم استلام التذكرة بواسطة ${actor.name} وتحويلها إلى قيد المعالجة.`, now);
    transaction.set(doc(db, 'tickets', ticketId, 'timeline', event.id), event);
  });
  const detail = await getTicketDetail(ticketId, actor);
  recordTicketAudit(actor, 'Ticket Claimed', `تم استلام التذكرة ${detail.ticket.number}.`);
  return detail;
}

export async function listTicketAgents(actor: TicketActor) {
  assertStaff(actor);
  const users = await StoreDB.getUsers();
  return users
    .filter((user) => isTicketStaffRole(user.role))
    .map((user) => ({ id: user.discordId || user.id, name: user.name, image: user.image || null, role: user.role }));
}

export async function assignTicket(ticketId: string, actor: TicketActor, assigneeId: string | null) {
  assertStaff(actor);
  const db = database();
  const now = new Date().toISOString();
  const snapshot = await getDoc(doc(db, 'tickets', ticketId));
  if (!snapshot.exists()) throw new TicketError('التذكرة غير موجودة.', 404);
  const ticket = mapTicket(snapshot);
  if (ticket.status === 'closed') throw new TicketError('التذكرة مغلقة نهائيًا ولا يمكن تغيير مسؤولها.', 409);

  let assignee: { id: string; name: string; image?: string | null } | null = null;
  if (assigneeId) {
    const users = await StoreDB.getUsers();
    const candidate = users.find((user) => user.id === assigneeId || user.discordId === assigneeId);
    if (!candidate || !isTicketStaffRole(candidate.role)) throw new TicketError('الموظف المحدد غير صالح لإسناد التذاكر.', 422);
    assignee = { id: candidate.discordId || candidate.id, name: candidate.name, image: candidate.image || null };
  }

  const updates: Partial<SupportTicket> = {
    assignedAgentId: assignee?.id || null,
    assignedAgentName: assignee?.name || null,
    assignedAgentImage: assignee?.image || null,
    updatedAt: now,
  };
  if (assignee && ticket.status === 'new') updates.status = 'in_progress';
  const event = timelineEvent(ticketId, actor, 'assigned', assignee ? `تم إسناد التذكرة إلى ${assignee.name}.` : 'تم إلغاء إسناد التذكرة.', now);
  await Promise.all([
    updateDoc(doc(db, 'tickets', ticketId), updates),
    setDoc(doc(db, 'tickets', ticketId, 'timeline', event.id), event),
  ]);
  const detail = await getTicketDetail(ticketId, actor);
  recordTicketAudit(actor, 'Ticket Assigned', `تم تحديث إسناد التذكرة ${detail.ticket.number}.`);
  return detail;
}

export async function updateTicket(ticketId: string, actor: TicketActor, input: { status?: TicketStatus; priority?: TicketPriority; tags?: string[] }) {
  const db = database();
  const now = new Date().toISOString();
  const snapshot = await getDoc(doc(db, 'tickets', ticketId));
  if (!snapshot.exists()) throw new TicketError('التذكرة غير موجودة.', 404);
  const ticket = mapTicket(snapshot);
  assertTicketAccess(ticket, actor);
  const isStaff = canManageTickets(actor);

  if (!isStaff) throw new TicketError('لا تملك صلاحية تعديل هذه التذكرة.', 403);
  if (ticket.status === 'closed' && input.status && input.status !== 'closed') {
    throw new TicketError('هذه التذكرة مغلقة نهائيًا ولا يمكن إعادة فتحها.', 409);
  }

  const updates: Partial<SupportTicket> = { updatedAt: now };
  const events: TicketTimelineEvent[] = [];
  if (input.status) {
    if (!STATUS_VALUES.includes(input.status)) throw new TicketError('الحالة غير صالحة.');
    assertStatusTransition(ticket.status, input.status);
    updates.status = input.status;
    if (input.status === 'resolved') {
      updates.resolvedAt = now; updates.resolvedById = actor.id; updates.resolvedByName = actor.name;
      events.push(timelineEvent(ticketId, actor, 'resolved', 'تم حل التذكرة بانتظار الإغلاق النهائي.', now));
    } else if (input.status === 'closed') {
      updates.closedAt = now; updates.closedById = actor.id; updates.closedByName = actor.name; updates.finalClosed = true;
      events.push(timelineEvent(ticketId, actor, 'closed', 'تم إغلاق التذكرة نهائيًا بعد معالجة المشكلة.', now));
    } else {
      events.push(timelineEvent(ticketId, actor, 'status_changed', `تم تغيير حالة التذكرة إلى ${displayStatus(input.status)}.`, now));
    }
  }
  if (input.priority) {
    if (!PRIORITY_VALUES.includes(input.priority)) throw new TicketError('الأولوية غير صالحة.');
    updates.priority = input.priority;
    events.push(timelineEvent(ticketId, actor, 'priority_changed', `تم تغيير الأولوية إلى ${displayPriority(input.priority)}.`, now));
  }
  if (input.tags) {
    const tags = [...new Set(input.tags.map((tag) => tag.trim().toLowerCase()).filter((tag) => tag.length >= 2 && tag.length <= 24))].slice(0, 8);
    updates.tags = tags;
    events.push(timelineEvent(ticketId, actor, 'status_changed', tags.length ? `تم تحديث الوسوم: ${tags.join('، ')}.` : 'تمت إزالة وسوم التذكرة.', now));
  }
  await updateDoc(doc(db, 'tickets', ticketId), updates);
  await Promise.all(events.map(event => setDoc(doc(db, 'tickets', ticketId, 'timeline', event.id), event)));
  const detail = await getTicketDetail(ticketId, actor);
  recordTicketAudit(actor, 'Ticket Updated', `تم تحديث التذكرة ${detail.ticket.number}.`);
  return detail;
}

export async function setTicketCustomerMute(ticketId: string, actor: TicketActor, muted: boolean, reason = '') {
  assertStaff(actor);
  const db = database();
  const snapshot = await getDoc(doc(db, 'tickets', ticketId));
  if (!snapshot.exists()) throw new TicketError('التذكرة غير موجودة.', 404);
  const ticket = mapTicket(snapshot);
  const now = new Date().toISOString();
  const moderation = {
    muted,
    mutedAt: muted ? now : null,
    mutedById: muted ? actor.id : null,
    mutedByName: muted ? actor.name : null,
    reason: muted ? reason.trim().slice(0, 240) || 'تم الكتم من لوحة الدعم.' : null,
    updatedAt: now,
  };
  const event = timelineEvent(ticketId, actor, muted ? 'customer_muted' : 'customer_unmuted', muted ? `تم كتم العميل ${ticket.userName} من فتح تذاكر جديدة.` : `تم رفع كتم التذاكر عن العميل ${ticket.userName}.`, now);
  await Promise.all([
    setDoc(ticketModerationRef(ticket.userId), moderation, { merge: true }),
    setDoc(doc(db, 'tickets', ticketId, 'timeline', event.id), event),
  ]);
  recordTicketAudit(actor, muted ? 'Ticket Customer Muted' : 'Ticket Customer Unmuted', `${muted ? 'تم كتم' : 'تم رفع كتم'} العميل ${ticket.userName} من خلال التذكرة ${ticket.number}.`);
  return getTicketDetail(ticketId, actor);
}

async function resolveMessageAttachments(ticketId: string, actor: TicketActor, attachmentIds: string[] = []) {
  if (attachmentIds.length > 8) throw new TicketError('لا يمكن إرفاق أكثر من 8 ملفات في الرسالة الواحدة.');
  const uniqueIds = [...new Set(attachmentIds)];
  const db = database();
  const records = await Promise.all(uniqueIds.map((id) => getDoc(doc(db, 'tickets', ticketId, 'attachments', id))));
  return records.map((record, index) => {
    if (!record.exists()) throw new TicketError('أحد المرفقات لم يعد متاحًا.', 422);
    const attachment = record.data() as TicketAttachment;
    if (attachment.uploadedById !== actor.id) throw new TicketError('لا تملك صلاحية استخدام هذا المرفق.', 403);
    return { ...attachment, id: record.id || uniqueIds[index] } as TicketAttachment;
  });
}

export async function addTicketMessage(ticketId: string, actor: TicketActor, input: { body: string; isInternal?: boolean; attachmentIds?: string[] }) {
  const body = input.body.trim();
  const attachmentIds = input.attachmentIds || [];
  if (!body && attachmentIds.length === 0) throw new TicketError('اكتب ردًا أو أضف مرفقًا قبل الإرسال.');
  if (body.length > 6000) throw new TicketError('الرد أطول من الحد المسموح.');
  const db = database();
  const ticketSnapshot = await getDoc(doc(db, 'tickets', ticketId));
  if (!ticketSnapshot.exists()) throw new TicketError('التذكرة غير موجودة.', 404);
  const ticket = mapTicket(ticketSnapshot);
  assertTicketAccess(ticket, actor);
  const isInternal = Boolean(input.isInternal);
  if (isInternal) assertStaff(actor);
  if (ticket.status === 'closed') throw new TicketError('التذكرة مغلقة؛ أعد فتحها قبل إرسال رد.', 409);
  const attachments = await resolveMessageAttachments(ticketId, actor, attachmentIds);
  const now = new Date().toISOString();
  const message: TicketMessage = { id: makeId('msg'), ticketId, authorId: actor.id, authorName: actor.name, authorImage: actor.image || null, authorRole: canManageTickets(actor) ? 'staff' : 'customer', body, isInternal, attachments, createdAt: now };
  const event = timelineEvent(ticketId, actor, isInternal ? 'note' : 'message', isInternal ? 'تمت إضافة ملاحظة داخلية.' : `تم إرسال رد بواسطة ${actor.name}.`, now);
  await Promise.all([
    setDoc(doc(db, 'tickets', ticketId, 'messages', message.id), message),
    setDoc(doc(db, 'tickets', ticketId, 'timeline', event.id), event),
    updateDoc(doc(db, 'tickets', ticketId), { updatedAt: now, lastMessageAt: now, messageCount: (ticket.messageCount || 0) + 1 }),
  ]);
  const detail = await getTicketDetail(ticketId, actor);
  recordTicketAudit(actor, isInternal ? 'Ticket Internal Note' : 'Ticket Reply', `تمت إضافة تحديث إلى التذكرة ${detail.ticket.number}.`);
  return detail;
}

export async function uploadTicketAttachment(ticketId: string, actor: TicketActor, file: File): Promise<TicketAttachment> {
  const ticketSnapshot = await getDoc(ticketRef(ticketId));
  if (!ticketSnapshot.exists()) throw new TicketError('التذكرة غير موجودة.', 404);
  const ticket = mapTicket(ticketSnapshot);
  assertTicketAccess(ticket, actor);
  if (ticket.status === 'closed') throw new TicketError('لا يمكن رفع ملف إلى تذكرة مغلقة.', 409);
  if (!ACCEPTED_TYPES.has(file.type)) throw new TicketError('نوع الملف غير مسموح. الملفات المدعومة: صور وPDF وTXT.');
  if (file.size <= 0 || file.size > MAX_ATTACHMENT_BYTES) throw new TicketError('حجم الملف يجب ألا يتجاوز 10 ميغابايت.');
  await assertAttachmentContent(file);
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  const extension = file.name.includes('.') ? file.name.split('.').pop()?.replace(/[^a-zA-Z0-9]/g, '') : '';
  const objectPath = `tickets/${ticketId}/${makeId('attachment')}${extension ? `.${extension}` : ''}`;
  const storageRef = ref(getStorage(app), objectPath);
  const bytes = new Uint8Array(await file.arrayBuffer());
  await uploadBytes(storageRef, bytes, { contentType: file.type, customMetadata: { ticketId, uploaderId: actor.id } });
  const url = await getDownloadURL(storageRef);
  const attachment: TicketAttachment = { id: makeId('attachment'), name: file.name.slice(0, 180), url, contentType: file.type, size: file.size, uploadedAt: new Date().toISOString(), uploadedById: actor.id };
  await setDoc(doc(database(), 'tickets', ticketId, 'attachments', attachment.id), attachment);
  return attachment;
}

export async function getTicketStats(actor: TicketActor): Promise<TicketStats> {
  assertStaff(actor);
  const tickets = await listTickets(actor);
  const today = new Date().toISOString().slice(0, 10);
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(); date.setDate(date.getDate() - (6 - index));
    return date.toISOString().slice(0, 10);
  });
  return {
    open: tickets.filter(ticket => ticket.status === 'new' || ticket.status === 'open').length,
    unassigned: tickets.filter(ticket => !ticket.assignedAgentId && ticket.status !== 'closed' && ticket.status !== 'resolved').length,
    inProgress: tickets.filter(ticket => ticket.status === 'in_progress').length,
    awaitingUser: tickets.filter(ticket => ticket.status === 'awaiting_user').length,
    closedToday: tickets.filter(ticket => ticket.status === 'closed' && ticket.closedAt?.slice(0, 10) === today).length,
    urgent: tickets.filter(ticket => ticket.priority === 'urgent' && ticket.status !== 'closed' && ticket.status !== 'resolved').length,
    recentDays: days.map(date => ({ date, count: tickets.filter(ticket => ticket.createdAt.slice(0, 10) === date).length })),
  };
}
