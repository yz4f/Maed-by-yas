import { getApps, getApp, initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, doc, getDoc, getDocs, query, runTransaction, setDoc, updateDoc, where } from 'firebase/firestore';
import { db as getDb } from '@/lib/store-db';
import { TicketActor, canManageTickets } from '@/lib/ticket-auth';
import { SupportTicket, TicketAttachment, TicketCategory, TicketDetail, TicketMessage, TicketPriority, TicketStats, TicketStatus, TicketTimelineEvent } from '@/types';

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
const STATUS_VALUES: TicketStatus[] = ['open', 'in_progress', 'awaiting_user', 'awaiting_staff', 'closed'];
const PRIORITY_VALUES: TicketPriority[] = ['low', 'medium', 'high', 'urgent'];
const CATEGORY_VALUES: TicketCategory[] = ['technical', 'account', 'service', 'suggestion', 'other'];

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

function displayStatus(status: TicketStatus) {
  return ({ open: 'مفتوحة', in_progress: 'قيد المعالجة', awaiting_user: 'بانتظار المستخدم', awaiting_staff: 'بانتظار الإدارة', closed: 'مغلقة' } as Record<TicketStatus, string>)[status];
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

export async function listTickets(actor: TicketActor, options: { status?: string; mine?: boolean; query?: string } = {}) {
  const db = database();
  const snapshot = canManageTickets(actor)
    ? await getDocs(collection(db, 'tickets'))
    : await getDocs(query(collection(db, 'tickets'), where('userId', '==', actor.id)));
  let tickets = snapshot.docs.map(mapTicket);
  if (canManageTickets(actor) && options.mine) tickets = tickets.filter(ticket => ticket.assignedAgentId === actor.id);
  if (options.status && STATUS_VALUES.includes(options.status as TicketStatus)) tickets = tickets.filter(ticket => ticket.status === options.status);
  if (options.query) {
    const term = options.query.trim().toLowerCase();
    if (term) tickets = tickets.filter(ticket => [ticket.number, ticket.title, ticket.userName, ticket.assignedAgentName || ''].some(value => value.toLowerCase().includes(term)));
  }
  return tickets.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export async function getTicketDetail(ticketId: string, actor: TicketActor): Promise<TicketDetail> {
  const db = database();
  const ticketSnapshot = await getDoc(doc(db, 'tickets', ticketId));
  if (!ticketSnapshot.exists()) throw new TicketError('التذكرة غير موجودة.', 404);
  const ticket = mapTicket(ticketSnapshot);
  assertTicketAccess(ticket, actor);

  const [messagesSnapshot, timelineSnapshot] = await Promise.all([
    getDocs(collection(db, 'tickets', ticketId, 'messages')),
    getDocs(collection(db, 'tickets', ticketId, 'timeline')),
  ]);
  const messages = messagesSnapshot.docs
    .map(item => ({ id: item.id, ...(item.data() as Omit<TicketMessage, 'id'>) }))
    .filter(message => canManageTickets(actor) || !message.isInternal)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) as TicketMessage[];
  const timeline = timelineSnapshot.docs
    .map(item => ({ id: item.id, ...(item.data() as Omit<TicketTimelineEvent, 'id'>) }))
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) as TicketTimelineEvent[];
  return { ticket, messages, timeline };
}

export async function createTicket(actor: TicketActor, input: { title: string; category: TicketCategory; priority: TicketPriority; body: string }) {
  const title = input.title.trim();
  const body = input.body.trim();
  if (title.length < 4 || title.length > 140) throw new TicketError('عنوان التذكرة يجب أن يكون بين 4 و140 حرفًا.');
  if (body.length < 10 || body.length > 6000) throw new TicketError('شرح المشكلة يجب أن يكون بين 10 و6000 حرف.');
  if (!CATEGORY_VALUES.includes(input.category)) throw new TicketError('نوع المشكلة غير صالح.');
  if (!PRIORITY_VALUES.includes(input.priority)) throw new TicketError('الأولوية غير صالحة.');

  const db = database();
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
      id: ticketId, number, title, category: input.category, priority: input.priority, status: 'open',
      userId: actor.id, userName: actor.name, userImage: actor.image || null,
      assignedAgentId: null, assignedAgentName: null, assignedAgentImage: null,
      createdAt: now, updatedAt: now, lastMessageAt: now, closedAt: null, closedById: null, closedByName: null, messageCount: 1,
    };
    const message: TicketMessage = { id: initialMessageId, ticketId, authorId: actor.id, authorName: actor.name, authorImage: actor.image || null, authorRole: 'customer', body, isInternal: false, attachments: [], createdAt: now };
    const event = timelineEvent(ticketId, actor, 'created', `تم إنشاء التذكرة ${number}.`, now);
    transaction.set(doc(db, 'tickets', ticketId), ticket);
    transaction.set(doc(db, 'tickets', ticketId, 'messages', initialMessageId), message);
    transaction.set(doc(db, 'tickets', ticketId, 'timeline', eventId), event);
    transaction.set(counterRef, { lastNumber: nextNumber, updatedAt: now }, { merge: true });
  });
  return getTicketDetail(ticketId, actor);
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
    if (ticket.assignedAgentId && ticket.assignedAgentId !== actor.id) throw new TicketError('قام موظف آخر باستلام التذكرة بالفعل.', 409);
    const status: TicketStatus = ticket.status === 'closed' ? 'closed' : 'in_progress';
    transaction.update(ref, { assignedAgentId: actor.id, assignedAgentName: actor.name, assignedAgentImage: actor.image || null, status, updatedAt: now });
    const event = timelineEvent(ticketId, actor, 'claimed', `تم استلام التذكرة بواسطة ${actor.name} وتحويلها إلى قيد المعالجة.`, now);
    transaction.set(doc(db, 'tickets', ticketId, 'timeline', event.id), event);
  });
  return getTicketDetail(ticketId, actor);
}

export async function updateTicket(ticketId: string, actor: TicketActor, input: { status?: TicketStatus; priority?: TicketPriority; assignedAgentId?: string | null; assignedAgentName?: string | null; assignedAgentImage?: string | null }) {
  const db = database();
  const now = new Date().toISOString();
  const snapshot = await getDoc(doc(db, 'tickets', ticketId));
  if (!snapshot.exists()) throw new TicketError('التذكرة غير موجودة.', 404);
  const ticket = mapTicket(snapshot);
  assertTicketAccess(ticket, actor);
  const isStaff = canManageTickets(actor);

  if (!isStaff) {
    if (input.status !== 'open' || ticket.status !== 'closed') throw new TicketError('لا تملك صلاحية تغيير هذه التذكرة.', 403);
    const updates = { status: 'open' as TicketStatus, closedAt: null, closedById: null, closedByName: null, updatedAt: now };
    await updateDoc(doc(db, 'tickets', ticketId), updates);
    const event = timelineEvent(ticketId, actor, 'reopened', 'قام المستخدم بإعادة فتح التذكرة.', now);
    await setDoc(doc(db, 'tickets', ticketId, 'timeline', event.id), event);
    return getTicketDetail(ticketId, actor);
  }

  const updates: Partial<SupportTicket> = { updatedAt: now };
  const events: TicketTimelineEvent[] = [];
  if (input.status) {
    if (!STATUS_VALUES.includes(input.status)) throw new TicketError('الحالة غير صالحة.');
    updates.status = input.status;
    if (input.status === 'closed') {
      updates.closedAt = now; updates.closedById = actor.id; updates.closedByName = actor.name;
      events.push(timelineEvent(ticketId, actor, 'closed', 'تم إغلاق التذكرة بعد معالجة المشكلة.', now));
    } else if (ticket.status === 'closed') {
      updates.closedAt = null; updates.closedById = null; updates.closedByName = null;
      events.push(timelineEvent(ticketId, actor, 'reopened', `تمت إعادة فتح التذكرة وتحويلها إلى ${displayStatus(input.status)}.`, now));
    } else {
      events.push(timelineEvent(ticketId, actor, 'status_changed', `تم تغيير حالة التذكرة إلى ${displayStatus(input.status)}.`, now));
    }
  }
  if (input.priority) {
    if (!PRIORITY_VALUES.includes(input.priority)) throw new TicketError('الأولوية غير صالحة.');
    updates.priority = input.priority;
    events.push(timelineEvent(ticketId, actor, 'priority_changed', `تم تغيير الأولوية إلى ${displayPriority(input.priority)}.`, now));
  }
  if ('assignedAgentId' in input) {
    updates.assignedAgentId = input.assignedAgentId || null;
    updates.assignedAgentName = input.assignedAgentName || null;
    updates.assignedAgentImage = input.assignedAgentImage || null;
    events.push(timelineEvent(ticketId, actor, 'assigned', input.assignedAgentName ? `تم تحويل التذكرة إلى ${input.assignedAgentName}.` : 'تم إلغاء تعيين الموظف المسؤول.', now));
  }
  await updateDoc(doc(db, 'tickets', ticketId), updates);
  await Promise.all(events.map(event => setDoc(doc(db, 'tickets', ticketId, 'timeline', event.id), event)));
  return getTicketDetail(ticketId, actor);
}

export async function addTicketMessage(ticketId: string, actor: TicketActor, input: { body: string; isInternal?: boolean; attachments?: TicketAttachment[] }) {
  const body = input.body.trim();
  const attachments = input.attachments || [];
  if (!body && attachments.length === 0) throw new TicketError('اكتب ردًا أو أضف مرفقًا قبل الإرسال.');
  if (body.length > 6000) throw new TicketError('الرد أطول من الحد المسموح.');
  const db = database();
  const ticketSnapshot = await getDoc(doc(db, 'tickets', ticketId));
  if (!ticketSnapshot.exists()) throw new TicketError('التذكرة غير موجودة.', 404);
  const ticket = mapTicket(ticketSnapshot);
  assertTicketAccess(ticket, actor);
  const isInternal = Boolean(input.isInternal);
  if (isInternal) assertStaff(actor);
  if (ticket.status === 'closed') throw new TicketError('التذكرة مغلقة؛ أعد فتحها قبل إرسال رد.', 409);
  const now = new Date().toISOString();
  const message: TicketMessage = { id: makeId('msg'), ticketId, authorId: actor.id, authorName: actor.name, authorImage: actor.image || null, authorRole: canManageTickets(actor) ? 'staff' : 'customer', body, isInternal, attachments, createdAt: now };
  const event = timelineEvent(ticketId, actor, isInternal ? 'note' : 'message', isInternal ? 'تمت إضافة ملاحظة داخلية.' : `تم إرسال رد بواسطة ${actor.name}.`, now);
  await Promise.all([
    setDoc(doc(db, 'tickets', ticketId, 'messages', message.id), message),
    setDoc(doc(db, 'tickets', ticketId, 'timeline', event.id), event),
    updateDoc(doc(db, 'tickets', ticketId), { updatedAt: now, lastMessageAt: now, messageCount: (ticket.messageCount || 0) + 1 }),
  ]);
  return getTicketDetail(ticketId, actor);
}

export async function uploadTicketAttachment(ticketId: string, actor: TicketActor, file: File): Promise<TicketAttachment> {
  const ticketSnapshot = await getDoc(ticketRef(ticketId));
  if (!ticketSnapshot.exists()) throw new TicketError('التذكرة غير موجودة.', 404);
  const ticket = mapTicket(ticketSnapshot);
  assertTicketAccess(ticket, actor);
  if (ticket.status === 'closed') throw new TicketError('لا يمكن رفع ملف إلى تذكرة مغلقة.', 409);
  if (!ACCEPTED_TYPES.has(file.type)) throw new TicketError('نوع الملف غير مسموح. الملفات المدعومة: صور وPDF وTXT.');
  if (file.size <= 0 || file.size > MAX_ATTACHMENT_BYTES) throw new TicketError('حجم الملف يجب ألا يتجاوز 10 ميغابايت.');
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  const extension = file.name.includes('.') ? file.name.split('.').pop()?.replace(/[^a-zA-Z0-9]/g, '') : '';
  const objectPath = `tickets/${ticketId}/${makeId('attachment')}${extension ? `.${extension}` : ''}`;
  const storageRef = ref(getStorage(app), objectPath);
  const bytes = new Uint8Array(await file.arrayBuffer());
  await uploadBytes(storageRef, bytes, { contentType: file.type, customMetadata: { ticketId, uploaderId: actor.id } });
  const url = await getDownloadURL(storageRef);
  const attachment: TicketAttachment = { id: makeId('attachment'), name: file.name.slice(0, 180), url, contentType: file.type, size: file.size, uploadedAt: new Date().toISOString(), uploadedById: actor.id };
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
    open: tickets.filter(ticket => ticket.status === 'open').length,
    unassigned: tickets.filter(ticket => !ticket.assignedAgentId && ticket.status !== 'closed').length,
    inProgress: tickets.filter(ticket => ticket.status === 'in_progress').length,
    awaitingUser: tickets.filter(ticket => ticket.status === 'awaiting_user').length,
    closedToday: tickets.filter(ticket => ticket.status === 'closed' && ticket.closedAt?.slice(0, 10) === today).length,
    urgent: tickets.filter(ticket => ticket.priority === 'urgent' && ticket.status !== 'closed').length,
    recentDays: days.map(date => ({ date, count: tickets.filter(ticket => ticket.createdAt.slice(0, 10) === date).length })),
  };
}
