import { collection, doc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { db as getDb, StoreDB } from '@/lib/store-db';
import type { TicketActor } from '@/lib/ticket-auth';
import type { VoiceSupportSession, VoiceSupportSessionStatus } from '@/types';

const VOICE_SUPPORT_COLLECTION = 'voiceSupportSessions';

function database() {
  const instance = getDb();
  if (!instance) throw new Error('تعذر الاتصال بقاعدة بيانات جلسات الدعم الصوتية.');
  return instance;
}

function makeVoiceSessionId() {
  return `voice-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function isStaff(actor: TicketActor) {
  return actor.role === 'Boss' || actor.role === 'Co-Boss' || actor.role === 'Admin';
}

export async function listVoiceSupportSessions(actor: TicketActor) {
  if (!isStaff(actor)) throw new Error('هذه القائمة مخصصة للإدارة.');
  const snapshot = await getDocs(collection(database(), VOICE_SUPPORT_COLLECTION));
  return snapshot.docs
    .map((item) => item.data() as VoiceSupportSession)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export async function createVoiceSupportSession(actor: TicketActor, input: {
  customerDiscordId: string;
  customerName: string;
  customerImage?: string | null;
  screenShareRequested?: boolean;
}) {
  if (!isStaff(actor)) throw new Error('إنشاء جلسة الدعم الصوتي مخصص للإدارة.');
  const customerDiscordId = input.customerDiscordId.trim();
  const customerName = input.customerName.trim().slice(0, 120);
  if (!/^\d{15,22}$/.test(customerDiscordId) || !customerName) throw new Error('اختر عميلاً صالحاً قبل إنشاء الجلسة.');

  const now = new Date().toISOString();
  const session: VoiceSupportSession = {
    id: makeVoiceSessionId(),
    customerDiscordId,
    customerName,
    customerImage: input.customerImage || null,
    createdById: actor.id,
    createdByName: actor.name,
    voiceChannelId: null,
    voiceChannelName: null,
    inviteUrl: null,
    status: 'PENDING_CONSENT',
    consentedAt: null,
    startedAt: null,
    endedAt: null,
    screenShareRequested: Boolean(input.screenShareRequested),
    staffJoined: false,
    notes: null,
    createdAt: now,
    updatedAt: now,
  };
  await setDoc(doc(database(), VOICE_SUPPORT_COLLECTION, session.id), session);
  await StoreDB.addLog('Voice Support Session Created', `جلسة صوتية ${session.id} للعميل ${session.customerName}`, actor.id, actor.name);
  return session;
}

export async function updateVoiceSupportSession(actor: TicketActor, sessionId: string, status: VoiceSupportSessionStatus, patch: Partial<Pick<VoiceSupportSession, 'voiceChannelId' | 'voiceChannelName' | 'inviteUrl' | 'consentedAt' | 'startedAt' | 'endedAt' | 'staffJoined' | 'notes'>> = {}) {
  if (!isStaff(actor)) throw new Error('تحديث جلسة الدعم الصوتي مخصص للإدارة.');
  const now = new Date().toISOString();
  const cleanPatch = Object.fromEntries(Object.entries(patch).filter(([, value]) => value !== undefined));
  await updateDoc(doc(database(), VOICE_SUPPORT_COLLECTION, sessionId), { status, ...cleanPatch, updatedAt: now });
  await StoreDB.addLog(`Voice Support ${status}`, `تم تحديث جلسة الدعم الصوتي ${sessionId}`, actor.id, actor.name);
}

export function voiceSupportStatusLabel(status: VoiceSupportSessionStatus) {
  return {
    PENDING_CONSENT: 'بانتظار موافقة العميل',
    WAITING_FOR_CUSTOMER: 'بانتظار دخول العميل',
    ACTIVE: 'جلسة نشطة',
    STAFF_ASSISTANCE: 'متابعة موظف',
    ENDED: 'انتهت الجلسة',
    FAILED: 'تعذر بدء الجلسة',
  }[status];
}

export function voiceSupportStatusTone(status: VoiceSupportSessionStatus) {
  return {
    PENDING_CONSENT: 'amber',
    WAITING_FOR_CUSTOMER: 'sky',
    ACTIVE: 'emerald',
    STAFF_ASSISTANCE: 'violet',
    ENDED: 'slate',
    FAILED: 'rose',
  }[status];
}
