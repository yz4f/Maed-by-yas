import WebSocket, { RawData } from 'ws';
import { collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, updateDoc, where } from 'firebase/firestore';
import { db as getDb } from '@/lib/store-db';
import type { SiteUpdate } from '@/types';
import { DISCORD_ROLES } from '@/lib/roles';

const guildId = process.env.DISCORD_GUILD_ID || '1396959491786018826';
const websiteUrl = (process.env.NEXTAUTH_URL || 'https://t3nn.wtf').replace(/\/$/, '');
const productStatusChannelId = '1499633005008916551';
export const discordRoomChannels = {
  keyResetRequests: '1541504706210304031',
  smartSupport: '1541504744344780920',
} as const;
const DISCORD_SUPPORT_COLLECTION = 'discordSupportSessions';
const DISCORD_REPLY_REMINDER_COLLECTION = 'discordReplyReminders';
const VOICE_SUPPORT_COLLECTION = 'voiceSupportSessions';
const DISCORD_MAX_MESSAGE_LENGTH = 1_900;
const DISCORD_AUDIT_CONFIG_COLLECTION = 'discordBotConfig';
const DISCORD_AUDIT_CONFIG_ID = 'privateAuditChannels';
const DISCORD_RESET_PANEL_CONFIG_ID = 'resetPanel';
const DISCORD_RESET_ANNOUNCEMENT_CONFIG_ID = 'resetFeatureAnnouncement';
const DISCORD_UPDATES_CHANNEL_ID = '1540878976166400060';
const DISCORD_AUDIT_CATEGORY_NAME = '🔐・private-logs';
const DISCORD_RESET_AUDIT_CHANNEL_NAME = '📋・reset-log';
const DISCORD_CONVERSATION_AUDIT_CHANNEL_NAME = '💬・support-closures';
const DISCORD_LOGIN_AUDIT_CHANNEL_NAME = '🔐・login-log';
const DISCORD_LOGOUT_AUDIT_CHANNEL_NAME = '🚪・logout-log';
const DISCORD_WEBSITE_EVENTS_CHANNEL_NAME = '🖥️・website-events';

type DiscordPrivateAuditChannels = {
  categoryId?: string | null;
  resetAuditChannelId: string;
  conversationClosedAuditChannelId: string;
  loginAuditChannelId: string;
  logoutAuditChannelId: string;
  websiteEventsChannelId: string;
};
let privateAuditChannelCache: DiscordPrivateAuditChannels | null = null;

type DiscordSupportSession = {
  id: string;
  parentChannelId: string;
  customerDiscordId: string;
  customerName: string;
  customerImage?: string | null;
  status: 'ACTIVE' | 'CLOSED';
  createdAt: string;
  updatedAt: string;
  closedAt?: string | null;
  messageCount: number;
};

function supportDatabase() {
  const database = getDb();
  if (!database) throw new Error('تعذر الاتصال بقاعدة بيانات جلسات Discord.');
  return database;
}

function sanitizeThreadName(value: string) {
  const cleaned = value.replace(/[\\/@#:<>]/g, '').replace(/\s+/g, '-').slice(0, 60) || 'customer';
  return `💬・support・${cleaned}`.slice(0, 100);
}

function splitDiscordMessage(value: string) {
  const clean = value.trim() || 'تعذر إنشاء رد واضح حالياً. حاول مرة أخرى بعد قليل.';
  const chunks: string[] = [];
  let remaining = clean;
  while (remaining.length > DISCORD_MAX_MESSAGE_LENGTH) {
    const point = Math.max(remaining.lastIndexOf('\n', DISCORD_MAX_MESSAGE_LENGTH), remaining.lastIndexOf(' ', DISCORD_MAX_MESSAGE_LENGTH), 1);
    chunks.push(remaining.slice(0, point));
    remaining = remaining.slice(point).trimStart();
  }
  chunks.push(remaining);
  return chunks;
}
type WebsiteLogEvent =
  | { type: 'conversationOpened'; customerId: string; customerName: string; customerImage?: string | null }
  | { type: 'login'; customerId: string; customerName: string; customerImage?: string | null }
  | { type: 'logout'; customerId: string; customerName: string; customerImage?: string | null }
  | { type: 'productActivated'; customerId: string; customerName: string; customerImage?: string | null; productName: string };

type GatewayPacket = { op: number; d: any; s?: number | null; t?: string | null };

let socket: WebSocket | null = null;
let heartbeatTimer: NodeJS.Timeout | null = null;
let reconnectTimer: NodeJS.Timeout | null = null;
let supportMaintenanceTimer: NodeJS.Timeout | null = null;
let supportMaintenanceRunning = false;
let sequence: number | null = null;
let started = false;

function clearTimers() {
  if (heartbeatTimer) clearInterval(heartbeatTimer);
  if (reconnectTimer) clearTimeout(reconnectTimer);
  if (supportMaintenanceTimer) clearInterval(supportMaintenanceTimer);
  heartbeatTimer = null;
  reconnectTimer = null;
  supportMaintenanceTimer = null;
}

function gatewayPayload(op: number, d: unknown) {
  return JSON.stringify({ op, d });
}

function sendGateway(op: number, d: unknown) {
  if (socket?.readyState === WebSocket.OPEN) socket.send(gatewayPayload(op, d));
}

async function discordApi(path: string, token: string, init: RequestInit = {}) {
  return fetch(`https://discord.com/api/v10${path}`, {
    ...init,
    headers: {
      Authorization: `Bot ${token}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
}

async function ensureResetRequestsChannelPrivate(token: string) {
  const VIEW_CHANNEL = 0x400n;
  const SEND_MESSAGES = 0x800n;
  const READ_MESSAGE_HISTORY = 0x10000n;
  const USE_APPLICATION_COMMANDS = 0x80000000n;
  const deniedForEveryone = VIEW_CHANNEL | SEND_MESSAGES | READ_MESSAGE_HISTORY | USE_APPLICATION_COMMANDS;
  const hiddenResponse = await discordApi(`/channels/${discordRoomChannels.keyResetRequests}/permissions/${guildId}`, token, {
    method: 'PUT',
    body: JSON.stringify({ id: guildId, type: 0, allow: '0', deny: String(deniedForEveryone) }),
  });
  if (!hiddenResponse.ok) throw new Error(`تعذر إخفاء روم طلب الريست عن العملاء (HTTP ${hiddenResponse.status}).`);

  const staffAllow = VIEW_CHANNEL | SEND_MESSAGES | READ_MESSAGE_HISTORY | USE_APPLICATION_COMMANDS;
  for (const roleId of [DISCORD_ROLES.BOSS, DISCORD_ROLES.CO_BOSS]) {
    const response = await discordApi(`/channels/${discordRoomChannels.keyResetRequests}/permissions/${roleId}`, token, {
      method: 'PUT',
      body: JSON.stringify({ id: roleId, type: 0, allow: String(staffAllow), deny: '0' }),
    });
    if (!response.ok) throw new Error(`تعذر منح فريق دعم تعن صلاحية روم الريست (HTTP ${response.status}).`);
  }
}

async function ensurePrivateAuditChannels(token: string): Promise<DiscordPrivateAuditChannels> {
  if (privateAuditChannelCache) return privateAuditChannelCache;
  const database = supportDatabase();
  const configRef = doc(database, DISCORD_AUDIT_CONFIG_COLLECTION, DISCORD_AUDIT_CONFIG_ID);
  const stored = await getDoc(configRef);
  const storedChannels = stored.exists() ? stored.data() as Partial<DiscordPrivateAuditChannels> : null;

  const guildChannelsResponse = await discordApi(`/guilds/${guildId}/channels`, token);
  if (!guildChannelsResponse.ok) throw new Error(`تعذر قراءة رومات Discord الخاصة بالسجل (HTTP ${guildChannelsResponse.status}).`);
  const guildChannels = await guildChannelsResponse.json() as Array<{ id: string; name: string; type: number; parent_id?: string | null }>;
  const findChannel = (name: string, type: number) => guildChannels.find((channel) => channel.name === name && channel.type === type);
  const renameChannel = async (channelId: string, name: string) => {
    const response = await discordApi(`/channels/${channelId}`, token, { method: 'PATCH', body: JSON.stringify({ name }) });
    if (!response.ok) throw new Error(`تعذر تنسيق اسم روم سجل Discord (HTTP ${response.status}).`);
    return response.json() as Promise<{ id: string; name: string; type: number }>;
  };

  let category = storedChannels?.categoryId ? guildChannels.find((channel) => channel.id === storedChannels.categoryId) : findChannel(DISCORD_AUDIT_CATEGORY_NAME, 4);
  if (category) {
    if (category.name !== DISCORD_AUDIT_CATEGORY_NAME) category = await renameChannel(category.id, DISCORD_AUDIT_CATEGORY_NAME);
  } else {
    const response = await discordApi(`/guilds/${guildId}/channels`, token, {
      method: 'POST',
      body: JSON.stringify({ name: DISCORD_AUDIT_CATEGORY_NAME, type: 4, permission_overwrites: [{ id: guildId, type: 0, deny: '1024' }] }),
    });
    if (!response.ok) throw new Error(`تعذر إنشاء فئة سجلات Discord الخاصة (HTTP ${response.status}).`);
    category = await response.json() as { id: string; name: string; type: number };
  }

  const createOrRenameLogChannel = async (storedId: string | null | undefined, name: string) => {
    const storedChannel = storedId ? guildChannels.find((channel) => channel.id === storedId) : null;
    if (storedChannel) {
      if (storedChannel.name !== name) await renameChannel(storedChannel.id, name);
      return storedChannel.id;
    }
    const existing = findChannel(name, 0);
    if (existing) return existing.id;
    const response = await discordApi(`/guilds/${guildId}/channels`, token, {
      method: 'POST',
      body: JSON.stringify({ name, type: 0, parent_id: category!.id, topic: 'Private administrative audit log. No full license keys, chat content, email, or IP addresses.' }),
    });
    if (!response.ok) throw new Error(`تعذر إنشاء روم سجل Discord الخاص (HTTP ${response.status}).`);
    return String((await response.json() as { id: string }).id);
  };

  privateAuditChannelCache = {
    categoryId: category.id,
    resetAuditChannelId: await createOrRenameLogChannel(storedChannels?.resetAuditChannelId, DISCORD_RESET_AUDIT_CHANNEL_NAME),
    conversationClosedAuditChannelId: await createOrRenameLogChannel(storedChannels?.conversationClosedAuditChannelId, DISCORD_CONVERSATION_AUDIT_CHANNEL_NAME),
    loginAuditChannelId: await createOrRenameLogChannel(storedChannels?.loginAuditChannelId, DISCORD_LOGIN_AUDIT_CHANNEL_NAME),
    logoutAuditChannelId: await createOrRenameLogChannel(storedChannels?.logoutAuditChannelId, DISCORD_LOGOUT_AUDIT_CHANNEL_NAME),
    websiteEventsChannelId: await createOrRenameLogChannel(storedChannels?.websiteEventsChannelId, DISCORD_WEBSITE_EVENTS_CHANNEL_NAME),
  };
  await setDoc(configRef, { ...privateAuditChannelCache, updatedAt: new Date().toISOString() }, { merge: true });
  return privateAuditChannelCache;
}

function commands() {
  return [
    { name: 'مساعد', description: 'فتح مساعد تعن للحلول السريعة', type: 1 },
    { name: 'دعم', description: 'فتح جلسة دعم ذكي خاصة', type: 1 },
    { name: 'موقعي', description: 'فتح منصة تعن ومنتجاتك', type: 1 },
  ];
}

async function registerCommands(applicationId: string, token: string) {
  const response = await discordApi(`/applications/${applicationId}/guilds/${guildId}/commands`, token, {
    method: 'PUT',
    body: JSON.stringify(commands()),
  });
  if (!response.ok) throw new Error(`Discord commands HTTP ${response.status}: ${await response.text()}`);
  console.info(`[Discord Bot] Commands registered in guild ${guildId}.`);
}

export async function sendDiscordWebsiteLog(event: WebsiteLogEvent): Promise<{ messageId: string }> {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) throw new Error('Discord bot is not connected, so the website log was not sent.');
  const channels = await ensurePrivateAuditChannels(token);
  const config = event.type === 'login'
    ? { channelId: channels.loginAuditChannelId, color: 0x6366f1, title: 'Website Sign-in', description: 'A customer signed in to the Ta3n platform using their linked Discord account.', label: 'Status', value: 'Signed in' }
    : event.type === 'logout'
      ? { channelId: channels.logoutAuditChannelId, color: 0x64748b, title: 'Website Sign-out', description: 'A customer signed out of the Ta3n platform.', label: 'Status', value: 'Signed out' }
      : event.type === 'conversationOpened'
        ? { channelId: channels.websiteEventsChannelId, color: 0x22d3ee, title: 'Support Conversation Opened', description: 'A customer opened a new Ta3n Assistant conversation from the website.', label: 'Event', value: 'Conversation opened' }
        : { channelId: channels.websiteEventsChannelId, color: 0x22c55e, title: 'Product Activated', description: 'A product was activated successfully from the Ta3n platform.', label: 'Product', value: event.productName };

  const embed = {
    color: config.color,
    author: { name: 'Ta3n • Website Audit', icon_url: `${websiteUrl}/logo.png` },
    title: config.title,
    description: config.description,
    thumbnail: event.customerImage ? { url: event.customerImage } : undefined,
    fields: [
      { name: 'Account', value: `**${event.customerName || 'Customer'}**\n<@${event.customerId}>`, inline: true },
      { name: config.label, value: config.value, inline: true },
      { name: 'Time', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false },
    ],
    footer: { text: `Ta3n • ${event.customerId}` },
    timestamp: new Date().toISOString(),
  };

  const response = await discordApi(`/channels/${config.channelId}/messages`, token, { method: 'POST', body: JSON.stringify({ embeds: [embed] }) });
  if (!response.ok) throw new Error(`Unable to send website audit log to Discord (HTTP ${response.status}).`);
  const message = await response.json() as { id?: string };
  if (!message.id) throw new Error('Discord did not return a website audit log message ID.');
  return { messageId: message.id };
}

export async function sendDiscordResetAuditLog(event: {
  action: 'CREATED' | 'UPDATED' | 'REMOVED';
  reference: string;
  customerDiscordId: string;
  customerName: string;
  customerImage?: string | null;
  productName: string;
  status: string;
  adminName?: string | null;
}) {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) throw new Error('بوت Discord غير متصل حالياً، لذلك لم يتم إرسال سجل الريست.');
  const channels = await ensurePrivateAuditChannels(token);
  const labels = {
    CREATED: { title: 'Key Reset Request Created', description: 'A new key reset request was created through the website or Discord form.', color: 0x38bdf8 },
    UPDATED: { title: 'Key Reset Request Updated', description: 'A key reset request was updated by an administrator.', color: 0xfbbf24 },
    REMOVED: { title: 'Terminal Key Reset Removed', description: 'A completed, rejected, or cancelled key reset request was removed from the active queue.', color: 0x64748b },
  } as const;
  const presentation = labels[event.action];
  const embed = {
    color: presentation.color,
    author: { name: 'Ta3n • Key Reset Audit', icon_url: `${websiteUrl}/logo.png` },
    title: presentation.title,
    description: presentation.description,
    thumbnail: event.customerImage ? { url: event.customerImage } : undefined,
    fields: [
      { name: 'Request', value: `\`${event.reference}\``, inline: true },
      { name: 'Status', value: event.status, inline: true },
      { name: 'Customer', value: `**${event.customerName || 'Customer'}**\n<@${event.customerDiscordId}>`, inline: true },
      { name: 'Product', value: event.productName || 'Not specified', inline: true },
      ...(event.adminName ? [{ name: 'Administrator', value: event.adminName, inline: true }] : []),
      { name: 'Time', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false },
    ],
    footer: { text: `Ta3n • ${event.customerDiscordId} • Full key hidden` },
    timestamp: new Date().toISOString(),
  };
  const response = await discordApi(`/channels/${channels.resetAuditChannelId}/messages`, token, { method: 'POST', body: JSON.stringify({ embeds: [embed] }) });
  if (!response.ok) throw new Error(`تعذر إرسال سجل الريست الخاص (HTTP ${response.status}).`);
}

export async function sendDiscordConversationClosedAuditLog(event: {
  customerDiscordId: string;
  customerName: string;
  customerImage?: string | null;
  reason: 'INACTIVITY' | 'MANUAL';
  closedByName?: string | null;
}) {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) throw new Error('بوت Discord غير متصل حالياً، لذلك لم يتم إرسال سجل إغلاق المحادثة.');
  const channels = await ensurePrivateAuditChannels(token);
  const manual = event.reason === 'MANUAL';
  const embed = {
    color: manual ? 0x64748b : 0xf59e0b,
    author: { name: 'Ta3n • Support Closure Audit', icon_url: `${websiteUrl}/logo.png` },
    title: manual ? 'Support Conversation Closed by Staff' : 'Support Conversation Closed for Inactivity',
    description: manual ? 'An administrator closed the support session while preserving its internal record.' : 'The support session closed automatically after five minutes without a customer reply.',
    thumbnail: event.customerImage ? { url: event.customerImage } : undefined,
    fields: [
      { name: 'Customer', value: `**${event.customerName || 'Customer'}**\n<@${event.customerDiscordId}>`, inline: true },
      { name: 'Reason', value: manual ? 'Closed by staff' : 'Five-minute inactivity', inline: true },
      ...(event.closedByName ? [{ name: 'Closed by', value: event.closedByName, inline: true }] : []),
      { name: 'Time', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false },
    ],
    footer: { text: `Ta3n • ${event.customerDiscordId} • Chat content hidden` },
    timestamp: new Date().toISOString(),
  };
  const response = await discordApi(`/channels/${channels.conversationClosedAuditChannelId}/messages`, token, { method: 'POST', body: JSON.stringify({ embeds: [embed] }) });
  if (!response.ok) throw new Error(`تعذر إرسال سجل إغلاق المحادثة الخاص (HTTP ${response.status}).`);
}

export async function deleteDiscordResetRequestCard(messageId?: string | null) {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token || !messageId) return;
  const response = await discordApi(`/channels/${discordRoomChannels.keyResetRequests}/messages/${messageId}`, token, { method: 'DELETE' });
  if (!response.ok && response.status !== 404) throw new Error(`تعذر إزالة بطاقة طلب الريست القديمة (HTTP ${response.status}).`);
}

async function purgeTerminalResetRequestsOnStartup(token: string) {
  const database = supportDatabase();
  const snapshot = await getDocs(collection(database, 'resetRequests'));
  const terminalRequests = snapshot.docs
    .map((item) => ({ id: item.id, data: item.data() as Record<string, unknown> }))
    .filter(({ data }) => ['REJECTED', 'COMPLETED', 'CANCELLED'].includes(String(data.status)));
  for (const request of terminalRequests) {
    const messageId = typeof request.data.discordMessageId === 'string' ? request.data.discordMessageId : null;
    if (messageId) {
      const response = await discordApi(`/channels/${discordRoomChannels.keyResetRequests}/messages/${messageId}`, token, { method: 'DELETE' });
      if (!response.ok && response.status !== 404) throw new Error(`تعذر إزالة بطاقة طلب الريست القديمة (HTTP ${response.status}).`);
    }
    await deleteDoc(doc(database, 'resetRequests', request.id));
  }
  return terminalRequests.length;
}

type DiscordResetRequestLog = {
  reference: string;
  customerDiscordId: string;
  customerName: string;
  customerImage?: string | null;
  productName: string;
  keyMasked: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'WAITING_FOR_CUSTOMER' | 'COMPLETED' | 'CANCELLED';
  adminName?: string | null;
  adminNotes?: string | null;
  discordMessageId?: string | null;
};

function resetStatusPresentation(status: DiscordResetRequestLog['status']) {
  const values = {
    PENDING: { label: 'قيد الانتظار', color: 0xfbbf24 },
    APPROVED: { label: 'تمت الموافقة', color: 0x22c55e },
    REJECTED: { label: 'مرفوض', color: 0xf43f5e },
    WAITING_FOR_CUSTOMER: { label: 'بانتظار معلومات العميل', color: 0x38bdf8 },
    COMPLETED: { label: 'تم تنفيذ الريست', color: 0x10b981 },
    CANCELLED: { label: 'ملغي', color: 0x64748b },
  } as const;
  return values[status];
}

function resetRequestAdminComponents(event: DiscordResetRequestLog) {
  if (event.status === 'PENDING') {
    return [{ type: 1, components: [
      { type: 2, style: 1, custom_id: `ta3n_reset_approve:${event.reference}`, label: 'قبول الطلب', emoji: { name: '✅' } },
      { type: 2, style: 4, custom_id: `ta3n_reset_reject:${event.reference}`, label: 'رفض الطلب', emoji: { name: '✖️' } },
      { type: 2, style: 2, custom_id: `ta3n_reset_info:${event.reference}`, label: 'معلومات العميل', emoji: { name: 'ℹ️' } },
    ] }];
  }
  return [{ type: 1, components: [
    { type: 2, style: 2, custom_id: 'ta3n_reset_closed', label: resetStatusPresentation(event.status).label, disabled: true },
  ] }];
}

export async function syncDiscordResetRequestLog(event: DiscordResetRequestLog): Promise<{ messageId: string }> {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) throw new Error('بوت Discord غير متصل حالياً، لذلك لم يتم إرسال سجل الريست.');
  const status = resetStatusPresentation(event.status);
  const embed = {
    color: status.color,
    author: { name: 'تعن • طلبات رستات المفاتيح', icon_url: `${websiteUrl}/logo.png` },
    title: event.status === 'PENDING' ? 'طلب رستات مفتاح جديد' : `تحديث طلب رستات ${event.reference}`,
    description: event.status === 'COMPLETED' ? 'تم تنفيذ إعادة ضبط الترخيص بنجاح. لا يظهر المفتاح كاملاً في Discord.' : 'بطاقة متابعة منظمة لطلب إعادة ضبط الترخيص داخل منصة تعن.',
    thumbnail: event.customerImage ? { url: event.customerImage } : undefined,
    fields: [
      { name: 'رقم الطلب', value: `\`${event.reference}\``, inline: true },
      { name: 'الحالة', value: status.label, inline: true },
      { name: 'العميل', value: `**${event.customerName || 'عميل'}**\n<@${event.customerDiscordId}>`, inline: true },
      { name: 'المنتج', value: event.productName || 'غير محدد', inline: true },
      { name: 'المفتاح', value: event.keyMasked || '••••••', inline: true },
      { name: 'السبب', value: (event.reason || 'لم يضف العميل سبباً').slice(0, 500), inline: false },
      ...(event.adminName ? [{ name: 'الإدارة', value: event.adminName, inline: true }] : []),
      ...(event.adminNotes ? [{ name: 'ملاحظة الإدارة', value: event.adminNotes.slice(0, 500), inline: false }] : []),
      { name: 'آخر تحديث', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false },
    ],
    footer: { text: `تعن • ${event.customerDiscordId}` },
    timestamp: new Date().toISOString(),
  };
  const path = event.discordMessageId
    ? `/channels/${discordRoomChannels.keyResetRequests}/messages/${event.discordMessageId}`
    : `/channels/${discordRoomChannels.keyResetRequests}/messages`;
  const response = await discordApi(path, token, {
    method: event.discordMessageId ? 'PATCH' : 'POST',
    body: JSON.stringify({
      embeds: [embed],
      components: resetRequestAdminComponents(event),
    }),
  });
  if (!response.ok) throw new Error(`تعذر مزامنة بطاقة الريست مع Discord (HTTP ${response.status}).`);
  const message = await response.json() as { id?: string };
  if (!message.id) throw new Error('لم يعرض Discord معرف بطاقة الريست.');
  return { messageId: message.id };
}

export async function sendDiscordProductStatus(): Promise<{ messageId: string }> {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) throw new Error('بوت Discord غير متصل حالياً، لذلك لم يتم إرسال بطاقة الحالة.');
  const asset = (name: string) => `${websiteUrl}/assets/product-status/${name}`;
  const embeds = [
    {
      color: 0x22c55e,
      author: { name: 'تعن • حالة المنتجات', icon_url: asset('ta3n-spoofer.png') },
      title: 'حالة منتجات تعن',
      description: 'متابعة مباشرة لحالة المنتجات والخدمات الحالية. يتم تحديث البطاقة عند وجود تغيير مؤثر.',
      fields: [
        { name: '🟢 سبوفر تعن', value: '```diff\n+ فعال\n```', inline: true },
        { name: '🟢 فك باند فورت', value: '```diff\n+ فعال\n```', inline: true },
        { name: '🟡 سبوفر تيمب', value: '```fix\nتحديث • يمكنك استعماله على مسؤوليتك الشخصية\n```', inline: false },
      ],
      image: { url: asset('ta3n-spoofer.png') },
      footer: { text: 'تعن • آخر حالة معلنة للمنتجات' },
      timestamp: new Date().toISOString(),
    },
    {
      color: 0x38bdf8,
      title: 'فك باند فورت',
      description: 'الحالة الحالية: **فعال**',
      image: { url: asset('fortnite-unban.png') },
    },
    {
      color: 0xfbbf24,
      title: 'سبوفر تيمب',
      description: 'الحالة الحالية: **تحديث**\n\n> يمكنك الاستعمال على مسؤوليتك الشخصية.',
      image: { url: asset('temp-spoofer.png') },
    },
  ];
  const response = await discordApi(`/channels/${productStatusChannelId}/messages`, token, {
    method: 'POST',
    body: JSON.stringify({ embeds }),
  });
  if (!response.ok) throw new Error(`تعذر إرسال بطاقة حالة المنتجات (HTTP ${response.status}).`);
  const message = await response.json() as { id?: string };
  if (!message.id) throw new Error('لم يعرض Discord معرف رسالة بطاقة الحالة.');
  return { messageId: message.id };
}

export async function sendDiscordSiteUpdate(update: SiteUpdate, channelId: string): Promise<{ messageId: string }> {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) throw new Error('بوت Discord غير متصل حالياً، لذلك لم يتم إرسال التحديث.');
  if (!channelId) throw new Error('قناة تحديثات Discord غير محددة.');

  const highlights = update.highlights.map((item) => `• ${item}`).join('\n');
  const isInlineImage = update.imageUrl.startsWith('data:image/');
  const attachmentName = `site-update-${update.id}.png`;
  const embed = {
    color: 0x22d3ee,
    author: { name: 'تحديثات منصة تعن' },
    title: update.title,
    description: update.summary,
    fields: [
      { name: 'أبرز ما تم إضافته', value: highlights, inline: false },
      { name: 'الحالة', value: 'تم اعتماد التحديث ونشره بنجاح', inline: true },
      { name: 'التاريخ', value: `<t:${Math.floor(new Date(update.publishedAt || Date.now()).getTime() / 1000)}:F>`, inline: true },
    ],
    image: { url: isInlineImage ? `attachment://${attachmentName}` : update.imageUrl },
    footer: { text: 'تعن • تحديث رسمي معتمد' },
  };
  let response: Response;
  if (isInlineImage) {
    const [meta, base64] = update.imageUrl.split(',', 2);
    const contentType = meta.match(/^data:(image\/(?:jpeg|png|webp));base64$/i)?.[1] || 'image/png';
    const bytes = Buffer.from(base64 || '', 'base64');
    const form = new FormData();
    form.append('payload_json', JSON.stringify({ embeds: [embed] }));
    form.append('files[0]', new Blob([bytes], { type: contentType }), attachmentName);
    response = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bot ${token}` },
      body: form,
    });
  } else {
    response = await discordApi(`/channels/${channelId}/messages`, token, {
      method: 'POST',
      body: JSON.stringify({ embeds: [embed] }),
    });
  }
  if (!response.ok) throw new Error(`تعذر إرسال تحديث Discord (HTTP ${response.status}).`);
  const message = await response.json() as { id?: string };
  if (!message.id) throw new Error('لم يعرض Discord معرف رسالة التحديث.');
  return { messageId: message.id };
}

function supportPanelEmbed() {
  return {
    color: 0x22d3ee,
    author: { name: 'تعن • مركز المساعدة الذكية', icon_url: `${websiteUrl}/t3nn-ai.png` },
    title: 'المساعدة الذكية',
    description: 'ابدأ جلسة دعم خاصة بك للحصول على توجيه للشروحات وحلول الأخطاء وتحليل لقطات الشاشة، من دون تداخل مع بقية العملاء.',
    fields: [
      { name: 'ما الذي يمكن للمساعد مساعدتك فيه؟', value: '• أخطاء التشغيل والشاشة البيضاء\n• التفعيل والمفاتيح\n• الشروحات وحلول المشاكل\n• قراءة صورة الخطأ بوضوح', inline: false },
      { name: 'الخصوصية والتنظيم', value: 'يُنشئ زر البدء Thread خاصاً بك. لا تكتب مفتاحك أو أي بيانات حساسة في الروم العام.', inline: false },
    ],
    footer: { text: 'تعن • جلسة واحدة نشطة لكل عميل' },
    timestamp: new Date().toISOString(),
  };
}

function supportPanelComponents() {
  return [{
    type: 1,
    components: [{
      type: 2,
      style: 1,
      custom_id: 'ta3n_support_start',
      label: 'بدء المساعدة',
      emoji: { name: '➕' },
    }],
  }];
}

function resetPanelImageUrl() {
  return `${websiteUrl}/assets/discord/reset-panel.webp`;
}

function resetPanelPreviewImageUrl() {
  return `${websiteUrl}/assets/discord/reset-panel-preview.png`;
}

function resetPanelEmbed() {
  return {
    color: 0x5865f2,
    author: { name: 'Ta3n • Key Reset', icon_url: `${websiteUrl}/logo.png` },
    title: '🔄 طلب ريستات',
    description: 'اضغط الزر، اكتب سبب طلب الريستات، ثم أرسل الطلب.\nسيتم التحقق من بيانات حسابك والمنتج المفعّل تلقائاً، ثم تتم مراجعة الطلب من الإدارة.',
    image: { url: resetPanelImageUrl() },
    fields: [
      { name: 'طلب سريع وآمن', value: 'لا تكتب المفتاح. تتم مطابقة حساب Discord والمنتج المفعّل داخل النظام فقط.', inline: false },
    ],
    footer: { text: 'Ta3n • One active request per product' },
    timestamp: new Date().toISOString(),
  };
}

function resetPanelComponents() {
  return [{
    type: 1,
    components: [{
      type: 2,
      style: 1,
      custom_id: 'ta3n_reset_start',
      label: 'ابدأ طلب الريستات',
      emoji: { name: '🔄' },
    }],
  }];
}

export async function publishDiscordResetPanel(): Promise<{ messageId: string }> {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) throw new Error('بوت Discord غير متصل حالياً، لذلك لم يتم نشر لوحة الريست.');
  const message = await postDiscordMessage(discordRoomChannels.keyResetRequests, token, {
    embeds: [resetPanelEmbed()],
    components: resetPanelComponents(),
  });
  if (!message.id) throw new Error('لم يعرض Discord معرف رسالة لوحة الريست.');
  await setDoc(doc(supportDatabase(), DISCORD_AUDIT_CONFIG_COLLECTION, DISCORD_RESET_PANEL_CONFIG_ID), {
    messageId: message.id,
    channelId: discordRoomChannels.keyResetRequests,
    publishedAt: new Date().toISOString(),
  }, { merge: true });
  return { messageId: message.id };
}

async function ensureDiscordResetPanelPublished() {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) throw new Error('بوت Discord غير متصل حالياً، لذلك لم يتم تحديث لوحة الريست.');
  const panelRef = doc(supportDatabase(), DISCORD_AUDIT_CONFIG_COLLECTION, DISCORD_RESET_PANEL_CONFIG_ID);
  const panel = await getDoc(panelRef);
  const messageId = panel.exists() ? String(panel.data()?.messageId || '') : '';
  if (messageId) {
    const response = await discordApi(`/channels/${discordRoomChannels.keyResetRequests}/messages/${messageId}`, token, {
      method: 'PATCH',
      body: JSON.stringify({ embeds: [resetPanelEmbed()], components: resetPanelComponents() }),
    });
    if (response.ok) {
      await setDoc(panelRef, { refreshedAt: new Date().toISOString() }, { merge: true });
      return { messageId, published: false, refreshed: true };
    }
  }
  const result = await publishDiscordResetPanel();
  return { ...result, published: true, refreshed: false };
}

function resetFeatureAnnouncementEmbed() {
  return {
    color: 0x5865f2,
    author: { name: 'Ta3n • New Feature', icon_url: `${websiteUrl}/logo.png` },
    title: '🔄 ميزة جديدة: طلب ريستات',
    description: 'أصبح بإمكانك الآن تقديم طلب ريستات بشكل أسرع وأكثر أماناً من الروم المخصص.',
    image: { url: resetPanelPreviewImageUrl() },
    fields: [
      { name: 'معاينة اللوحة', value: 'الصورة أعلاه توضح شكل لوحة طلب الريست الجديدة داخل Discord.', inline: false },
      { name: 'كيف تستخدمها؟', value: 'اضغط زر **ابدأ طلب الريستات** • اكتب سبب الطلب • أرسل النموذج', inline: false },
      { name: 'مهم', value: 'لا تحتاج إلى كتابة مفتاحك. يتم التحقق من حسابك والمنتج المفعّل تلقائياً داخل النظام.', inline: false },
    ],
    footer: { text: 'Ta3n • Key Reset Center is now live' },
    timestamp: new Date().toISOString(),
  };
}

async function ensureDiscordResetFeatureAnnouncementPublished() {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) throw new Error('بوت Discord غير متصل حالياً، لذلك لم يتم إرسال إعلان التحديث.');
  const announcementRef = doc(supportDatabase(), DISCORD_AUDIT_CONFIG_COLLECTION, DISCORD_RESET_ANNOUNCEMENT_CONFIG_ID);
  const saved = await getDoc(announcementRef);
  const messageId = saved.exists() ? String(saved.data()?.messageId || '') : '';
  if (messageId) {
    const response = await discordApi(`/channels/${DISCORD_UPDATES_CHANNEL_ID}/messages/${messageId}`, token, {
      method: 'PATCH',
      body: JSON.stringify({ embeds: [resetFeatureAnnouncementEmbed()] }),
    });
    if (response.ok) {
      await setDoc(announcementRef, { refreshedAt: new Date().toISOString() }, { merge: true });
      return { messageId, published: false, refreshed: true };
    }
  }
  const message = await postDiscordMessage(DISCORD_UPDATES_CHANNEL_ID, token, {
    content: '@everyone',
    allowed_mentions: { parse: ['everyone'] },
    embeds: [resetFeatureAnnouncementEmbed()],
  });
  await setDoc(announcementRef, { messageId: message.id, channelId: DISCORD_UPDATES_CHANNEL_ID, publishedAt: new Date().toISOString() }, { merge: true });
  return { messageId: message.id, published: true, refreshed: false };
}

async function postDiscordMessage(channelId: string, token: string, data: Record<string, unknown>) {
  const response = await discordApi(`/channels/${channelId}/messages`, token, { method: 'POST', body: JSON.stringify(data) });
  if (!response.ok) throw new Error(`تعذر إرسال رسالة دعم Discord (HTTP ${response.status}).`);
  return response.json() as Promise<{ id: string }>;
}

export async function publishDiscordSupportPanel(): Promise<{ messageId: string }> {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) throw new Error('بوت Discord غير متصل حالياً، لذلك لم يتم نشر لوحة الدعم.');
  const message = await postDiscordMessage(discordRoomChannels.smartSupport, token, {
    embeds: [supportPanelEmbed()],
    components: supportPanelComponents(),
  });
  if (!message.id) throw new Error('لم يعرض Discord معرف رسالة لوحة الدعم.');
  return { messageId: message.id };
}

async function findOpenDiscordSupportSession(customerDiscordId: string) {
  const snapshot = await getDocs(query(collection(supportDatabase(), DISCORD_SUPPORT_COLLECTION), where('customerDiscordId', '==', customerDiscordId)));
  return snapshot.docs
    .map((item) => ({ id: item.id, ...(item.data() as Omit<DiscordSupportSession, 'id'>) }))
    .find((session) => session.status === 'ACTIVE') || null;
}

async function createDiscordSupportThread(interaction: any, token: string) {
  const customerId = String(interaction.member?.user?.id || interaction.user?.id || '');
  const customerName = String(interaction.member?.user?.global_name || interaction.member?.user?.username || interaction.user?.global_name || interaction.user?.username || 'customer');
  const avatarHash = interaction.member?.user?.avatar || interaction.user?.avatar;
  const customerImage = avatarHash && customerId ? `https://cdn.discordapp.com/avatars/${customerId}/${avatarHash}.png` : null;
  if (!customerId) throw new Error('تعذر تحديد حساب العميل لفتح جلسة الدعم.');

  const existing = await findOpenDiscordSupportSession(customerId);
  if (existing) return { threadId: existing.id, existing: true };

  const threadResponse = await discordApi(`/channels/${discordRoomChannels.smartSupport}/threads`, token, {
    method: 'POST',
    body: JSON.stringify({ name: sanitizeThreadName(customerName), type: 12, auto_archive_duration: 1440, invitable: false }),
  });
  if (!threadResponse.ok) throw new Error(`تعذر إنشاء Thread الدعم (HTTP ${threadResponse.status}).`);
  const thread = await threadResponse.json() as { id?: string };
  if (!thread.id) throw new Error('لم يعرض Discord معرف Thread الدعم.');

  const memberResponse = await discordApi(`/channels/${thread.id}/thread-members/${customerId}`, token, { method: 'PUT', body: JSON.stringify({}) });
  if (!memberResponse.ok && memberResponse.status !== 204) console.warn(`[Discord Support] Unable to add customer to private thread: ${memberResponse.status}`);

  const now = new Date().toISOString();
  const session: DiscordSupportSession = {
    id: thread.id,
    parentChannelId: discordRoomChannels.smartSupport,
    customerDiscordId: customerId,
    customerName,
    customerImage,
    status: 'ACTIVE',
    createdAt: now,
    updatedAt: now,
    closedAt: null,
    messageCount: 0,
  };
  await setDoc(doc(supportDatabase(), DISCORD_SUPPORT_COLLECTION, thread.id), session);
  await postDiscordMessage(thread.id, token, {
    embeds: [{
      color: 0x22d3ee,
      title: 'تم فتح جلسة المساعدة',
      description: `مرحباً <@${customerId}>. اكتب المشكلة كما تظهر لك أو أرسل صورة واضحة للخطأ، وسأوجهك إلى الحل أو دليل المنتج المناسب.`,
      fields: [
        { name: 'يمكنك البدء بـ', value: 'اسم المنتج • وصف الخطأ • لقطة شاشة كاملة • ما الذي جربته بالفعل', inline: false },
        { name: 'مهم', value: 'لا ترسل مفتاح المنتج أو أي بيانات حساسة في هذه المحادثة.', inline: false },
      ],
      footer: { text: 'تعن • يتم الإغلاق تلقائياً عند عدم وجود رد من العميل' },
    }],
    components: [{
      type: 1,
      components: [
        { type: 2, style: 2, custom_id: 'ta3n_support_guide', label: 'الشروحات', emoji: { name: '📖' } },
        { type: 2, style: 2, custom_id: 'ta3n_support_retry', label: 'إعادة المحاولة', emoji: { name: '🔄' } },
        { type: 2, style: 4, custom_id: 'ta3n_support_close', label: 'إنهاء المحادثة', emoji: { name: '❌' } },
      ],
    }],
  });
  return { threadId: thread.id, existing: false };
}

async function closeDiscordSupportSession(session: DiscordSupportSession, token: string, reason: 'INACTIVITY' | 'CUSTOMER') {
  const threadResponse = await discordApi(`/channels/${session.id}`, token, { method: 'PATCH', body: JSON.stringify({ archived: true, locked: true }) });
  if (!threadResponse.ok) console.warn(`[Discord Support] Unable to archive thread ${session.id}: ${threadResponse.status}`);
  const now = new Date().toISOString();
  await updateDoc(doc(supportDatabase(), DISCORD_SUPPORT_COLLECTION, session.id), { status: 'CLOSED', updatedAt: now, closedAt: now });
  if (reason === 'INACTIVITY') console.info(`[Discord Support] Closed inactive thread ${session.id}.`);
}

async function resolveDiscordAttachments(rawAttachments: any[]) {
  const attachments: any[] = [];
  for (const item of rawAttachments.slice(0, 1)) {
    const contentType = String(item.content_type || '');
    const size = Number(item.size || 0);
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(contentType) || !item.url || size < 1 || size > 4 * 1024 * 1024) continue;
    try {
      const response = await fetch(String(item.url));
      if (!response.ok) continue;
      const bytes = Buffer.from(await response.arrayBuffer());
      if (bytes.length > 4 * 1024 * 1024) continue;
      attachments.push({
        id: `discord-img-${item.id || Date.now()}`,
        name: String(item.filename || 'error-image.png').slice(0, 120),
        contentType,
        size: bytes.length,
        previewData: `data:${contentType};base64,${bytes.toString('base64')}`,
      });
    } catch (error) {
      console.warn('[Discord Support] Unable to retrieve image attachment:', error);
    }
  }
  return attachments;
}

async function handleDiscordSupportMessage(message: any, token: string) {
  if (message.author?.bot || !message.channel_id) return;
  const sessionRef = doc(supportDatabase(), DISCORD_SUPPORT_COLLECTION, String(message.channel_id));
  const snapshot = await getDoc(sessionRef);
  if (!snapshot.exists()) return;
  const session = { id: snapshot.id, ...(snapshot.data() as Omit<DiscordSupportSession, 'id'>) };
  if (session.status !== 'ACTIVE') return;

  const content = String(message.content || '').trim();
  const attachments = await resolveDiscordAttachments(Array.isArray(message.attachments) ? message.attachments : []);
  if (content.length < 2 && attachments.length === 0) return;
  const now = new Date().toISOString();
  await updateDoc(sessionRef, { updatedAt: now, messageCount: (session.messageCount || 0) + 1 });

  try {
    const { sendAiMessage } = await import('@/lib/t3n-ai');
    const response = await sendAiMessage({ id: session.customerDiscordId, name: session.customerName, image: session.customerImage || null, role: 'Customer' }, {
      body: content || 'صورة مرفقة لشرح المشكلة.',
      language: 'ar',
      attachments,
      source: 'discord',
    });
    if (response.message?.body) {
      for (const chunk of splitDiscordMessage(response.message.body)) await postDiscordMessage(session.id, token, { content: chunk });
    }
  } catch (error) {
    console.error('[Discord Support] Assistant reply failed:', error);
    await postDiscordMessage(session.id, token, { content: 'تعذر إكمال الرد الذكي الآن. أرسل وصفاً مختصراً للخطأ أو صورة أوضح، وسيظهر السجل لفريق الإدارة للمراجعة.' });
  }
}

async function maintainDiscordSupportSessions(token: string) {
  const snapshot = await getDocs(collection(supportDatabase(), DISCORD_SUPPORT_COLLECTION));
  const now = Date.now();
  for (const item of snapshot.docs) {
    const session = { id: item.id, ...(item.data() as Omit<DiscordSupportSession, 'id'>) };
    if (session.status !== 'ACTIVE') continue;
    const idleMs = now - new Date(session.updatedAt).getTime();
    if (idleMs >= 3 * 60 * 1000) {
      await postDiscordMessage(session.id, token, { content: 'تم إغلاق جلسة المساعدة لعدم وصول رد جديد منك. يمكنك الضغط على «بدء المساعدة» في الروم الرئيسي لفتح جلسة جديدة.' }).catch(() => undefined);
      await closeDiscordSupportSession(session, token, 'INACTIVITY');
    } else if (idleMs >= 2 * 60 * 1000) {
      const warningSent = Boolean((session as any).inactivityWarningAt);
      if (!warningSent) {
        await postDiscordMessage(session.id, token, { content: 'تنبيه: لم يصل رد جديد منك. أرسل أي رسالة خلال دقيقة واحدة للاستمرار في جلسة الدعم.' }).catch(() => undefined);
        await updateDoc(doc(supportDatabase(), DISCORD_SUPPORT_COLLECTION, session.id), { inactivityWarningAt: new Date().toISOString() });
      }
    }
  }
}

export async function sendDiscordCustomerReplyReminder(event: {
  conversationId: string;
  supportSessionId?: string | null;
  customerDiscordId: string;
  customerName: string;
}) {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) throw new Error('بوت Discord غير متصل حالياً، لذلك لم يتم إرسال تنبيه الرد.');
  const reminderRef = doc(supportDatabase(), DISCORD_REPLY_REMINDER_COLLECTION, event.conversationId);
  const existing = await getDoc(reminderRef);
  const previousAt = existing.exists() ? new Date(String(existing.data()?.sentAt || 0)).getTime() : 0;
  if (previousAt && Date.now() - previousAt < 10 * 60 * 1000) return { sent: false, reason: 'cooldown' as const };

  const dmId = await openDiscordDm(event.customerDiscordId, token);
  const sessionUrl = event.supportSessionId ? `${websiteUrl}/support/session/${encodeURIComponent(event.supportSessionId)}` : `${websiteUrl}/support`;
  await postDiscordMessage(dmId, token, {
    embeds: [{
      color: 0x5865f2,
      author: { name: 'Ta3n Support', icon_url: `${websiteUrl}/logo.png` },
      title: 'لديك رد جديد من دعم تعن',
      description: 'نحتاج إلى ردك لمتابعة مساعدتك. افتح جلسة الدعم وأرسل التفاصيل أو الصورة المطلوبة عندما تكون جاهزاً.',
      fields: [
        { name: 'مهم', value: 'لا ترسل المفتاح أو كلمة المرور في رسالة Discord الخاصة.', inline: false },
      ],
      footer: { text: 'Ta3n Support • تنبيه متابعة واحد كل 10 دقائق' },
      timestamp: new Date().toISOString(),
    }],
    components: [{ type: 1, components: [{ type: 2, style: 5, label: 'فتح جلسة الدعم', url: sessionUrl, emoji: { name: '💬' } }] }],
  });
  await setDoc(reminderRef, { customerDiscordId: event.customerDiscordId, sentAt: new Date().toISOString(), supportSessionId: event.supportSessionId || null }, { merge: true });
  return { sent: true, reason: 'sent' as const };
}

async function openDiscordDm(recipientId: string, token: string) {
  const response = await discordApi('/users/@me/channels', token, { method: 'POST', body: JSON.stringify({ recipient_id: recipientId }) });
  if (!response.ok) throw new Error(`تعذر فتح رسالة خاصة للعميل (HTTP ${response.status}).`);
  const channel = await response.json() as { id?: string };
  if (!channel.id) throw new Error('لم يعرض Discord معرف الرسالة الخاصة.');
  return channel.id;
}

export async function sendDiscordVoiceConsentRequest(session: { id: string; customerDiscordId: string; customerName: string; screenShareRequested: boolean }) {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) throw new Error('بوت Discord غير متصل حالياً، لذلك لم يتم إرسال طلب الموافقة.');
  const dmId = await openDiscordDm(session.customerDiscordId, token);
  await postDiscordMessage(dmId, token, {
    embeds: [{
      color: 0x22d3ee,
      title: 'دعوة لجلسة دعم صوتية خاصة',
      description: `مرحباً <@${session.customerDiscordId}>. طلب فريق الدعم فتح جلسة صوتية خاصة لمساعدتك. لن يبدأ أي صوت أو مشاركة شاشة إلا بعد موافقتك الصريحة.`,
      fields: [
        { name: 'مشاركة الشاشة', value: session.screenShareRequested ? 'اختيارية عند الحاجة لشرح المشكلة. يمكنك رفضها أو إيقافها في أي وقت.' : 'غير مطلوبة لهذه الجلسة.', inline: false },
        { name: 'الخصوصية', value: 'لا ترسل مفاتيح المنتج أو كلمات المرور أو الرموز الحساسة داخل الجلسة.', inline: false },
      ],
      footer: { text: `تعن • جلسة ${session.id}` },
    }],
    components: [{ type: 1, components: [
      { type: 2, style: 1, custom_id: `ta3n_voice_accept:${session.id}`, label: 'أوافق وأفتح الجلسة', emoji: { name: '✅' } },
      { type: 2, style: 2, custom_id: `ta3n_voice_decline:${session.id}`, label: 'إلغاء', emoji: { name: '✖️' } },
    ] }],
  });
}

async function activateDiscordVoiceSession(sessionId: string, customerId: string, token: string) {
  const sessionRef = doc(supportDatabase(), VOICE_SUPPORT_COLLECTION, sessionId);
  const snapshot = await getDoc(sessionRef);
  if (!snapshot.exists()) throw new Error('جلسة الدعم الصوتي غير موجودة.');
  const session = snapshot.data() as any;
  if (session.customerDiscordId !== customerId) throw new Error('هذه الجلسة مخصصة لحساب آخر.');
  if (session.status !== 'PENDING_CONSENT') return session;

  const selfResponse = await discordApi('/users/@me', token);
  if (!selfResponse.ok) throw new Error(`تعذر تحديد حساب البوت الصوتي (HTTP ${selfResponse.status}).`);
  const self = await selfResponse.json() as { id?: string };
  if (!self.id) throw new Error('لم يعرض Discord معرف البوت.');
  const VIEW_CHANNEL = 0x400;
  const CONNECT = 0x100000;
  const SPEAK = 0x200000;
  const STREAM = 0x200;
  const allowed = String(VIEW_CHANNEL | CONNECT | SPEAK | STREAM);
  const channelResponse = await discordApi(`/guilds/${guildId}/channels`, token, {
    method: 'POST',
    body: JSON.stringify({
      name: `🎙️・support-${String(session.customerName || 'customer').replace(/[^\p{L}\p{N}-]+/gu, '-').slice(0, 38)}`,
      type: 2,
      user_limit: 3,
      permission_overwrites: [
        { id: guildId, type: 0, deny: String(VIEW_CHANNEL | CONNECT) },
        { id: customerId, type: 1, allow: allowed },
        { id: String(session.createdById), type: 1, allow: allowed },
        { id: self.id, type: 1, allow: allowed },
      ],
    }),
  });
  if (!channelResponse.ok) throw new Error(`تعذر إنشاء الغرفة الصوتية الخاصة (HTTP ${channelResponse.status}).`);
  const channel = await channelResponse.json() as { id?: string; name?: string };
  if (!channel.id) throw new Error('لم يعرض Discord معرف الغرفة الصوتية.');
  const inviteResponse = await discordApi(`/channels/${channel.id}/invites`, token, { method: 'POST', body: JSON.stringify({ max_age: 900, max_uses: 1, unique: true }) });
  const invite = inviteResponse.ok ? await inviteResponse.json() as { code?: string } : null;
  const inviteUrl = invite?.code ? `https://discord.gg/${invite.code}` : null;
  const now = new Date().toISOString();
  await updateDoc(sessionRef, { status: 'WAITING_FOR_CUSTOMER', consentedAt: now, voiceChannelId: channel.id, voiceChannelName: channel.name || 'جلسة دعم خاصة', inviteUrl, updatedAt: now });
  return { ...session, status: 'WAITING_FOR_CUSTOMER', consentedAt: now, voiceChannelId: channel.id, voiceChannelName: channel.name || 'جلسة دعم خاصة', inviteUrl };
}

function isDiscordResetAdministrator(interaction: any) {
  const actorId = String(interaction.member?.user?.id || interaction.user?.id || '');
  const roleIds = Array.isArray(interaction.member?.roles) ? interaction.member.roles.map(String) : [];
  const permissions = BigInt(String(interaction.member?.permissions || '0'));
  return actorId === '1315014140804206636' || roleIds.includes(DISCORD_ROLES.BOSS) || roleIds.includes(DISCORD_ROLES.CO_BOSS) || (permissions & 0x8n) === 0x8n;
}

async function findDiscordResetRequest(reference: string): Promise<{ id: string } & Record<string, unknown>> {
  const snapshot = await getDocs(query(collection(supportDatabase(), 'resetRequests'), where('reference', '==', reference)));
  if (snapshot.empty) throw new Error('لم يعد طلب الريست موجوداً أو تم إغلاقه.');
  return { id: snapshot.docs[0].id, ...(snapshot.docs[0].data() as Record<string, unknown>) } as { id: string } & Record<string, unknown>;
}

function assistantEmbed() {
  return {
    color: 0x22d3ee,
    author: { name: 'مساعد تعن' },
    title: 'مساعد تعن',
    description: 'لإجابة سريعة عن المنتج أو التفعيل أو التحميل، افتح مساعد تعن داخل المنصة وأرسل سؤالك أو صورة واضحة للخطأ.',
    fields: [
      { name: 'فتح مساعد تعن', value: `[افتح المحادثة داخل t3nn.wtf](${websiteUrl})`, inline: false },
      { name: 'الشروحات وحلول المشاكل', value: 'تجدها في قسم «منتجاتي» داخل الموقع، تحت كل منتج تملكه.', inline: false },
      { name: 'متابعة الإدارة', value: 'إذا احتاجت الحالة متابعة مباشرة، يستطيع فريق الإدارة الدخول إلى نفس المحادثة داخل المنصة والرد عليك.', inline: false },
    ],
    footer: { text: 'تعن • رد سريع داخل المنصة' },
  };
}

async function answerInteraction(interaction: any, token: string) {
  const respond = async (data: Record<string, unknown>) => {
    const response = await fetch(`https://discord.com/api/v10/interactions/${interaction.id}/${interaction.token}/callback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 4, data }),
    });
    if (!response.ok) console.error(`[Discord Bot] Unable to answer interaction: ${response.status} ${await response.text()}`);
  };
  const respondModal = async (data: Record<string, unknown>) => {
    const response = await fetch(`https://discord.com/api/v10/interactions/${interaction.id}/${interaction.token}/callback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 9, data }),
    });
    if (!response.ok) console.error(`[Discord Bot] Unable to open reset modal: ${response.status} ${await response.text()}`);
  };

  if (interaction.type === 2) {
    const commandName = interaction.data?.name;
    if (commandName === 'دعم') {
      const result = await createDiscordSupportThread(interaction, token);
      await respond({ content: result.existing ? `لديك جلسة دعم نشطة بالفعل: <#${result.threadId}>` : `تم إنشاء جلسة دعمك الخاصة: <#${result.threadId}>`, flags: 64 });
      return;
    }
    const data = commandName === 'موقعي'
      ? { content: `منصة تعن ومنتجاتك: ${websiteUrl}\nافتح «منتجاتي» للوصول إلى «دليل المنتج» والتحميل، أو «مساعد تعن» للسؤال السريع.`, flags: 64 }
      : commandName === 'مساعد'
        ? { embeds: [assistantEmbed()], flags: 64 }
        : null;
    if (data) await respond(data);
    return;
  }

  if (interaction.type === 5) {
    const customId = String(interaction.data?.custom_id || '');
    if (customId !== 'ta3n_reset_submit' && !customId.startsWith('ta3n_reset_reject_submit:')) return;
    const actorId = String(interaction.member?.user?.id || interaction.user?.id || '');
    const actorUser = interaction.member?.user || interaction.user || {};
    const values = Object.fromEntries((interaction.data?.components || []).flatMap((row: any) => row.components || []).map((field: any) => [String(field.custom_id || ''), String(field.value || '')]));
    try {
      if (customId.startsWith('ta3n_reset_reject_submit:')) {
        if (!isDiscordResetAdministrator(interaction)) throw new Error('هذا الإجراء مخصص للإدارة فقط.');
        const reference = customId.split(':', 2)[1];
        const request = await findDiscordResetRequest(reference);
        const { processResetRequest } = await import('@/lib/t3n-ai');
        await processResetRequest({ id: actorId, name: String(actorUser.global_name || actorUser.username || 'Administrator'), image: null, role: 'Admin' }, {
          requestId: request.id,
          action: 'reject',
          note: String(values.reject_reason || ''),
        });
        await respond({ content: `تم رفض الطلب \`${reference}\` وتحديث البطاقة مع سبب الرفض.`, flags: 64 });
        return;
      }

      const avatarHash = String(actorUser.avatar || '');
      const image = actorId && avatarHash ? `https://cdn.discordapp.com/avatars/${actorId}/${avatarHash}.png` : null;
      const { createResetRequest } = await import('@/lib/t3n-ai');
      if (!actorId) throw new Error('تعذر التحقق من حساب Discord. أعد المحاولة بعد لحظات.');
      const result = await createResetRequest({ id: actorId, name: String(actorUser.global_name || actorUser.username || 'عميل'), image, role: 'Customer' }, {
        reason: String(values.reset_reason || ''),
        language: 'ar',
      });
      await respond({ content: result.duplicate ? `لديك طلب رستات نشط بالفعل: \`${result.request.reference}\`، وستصلك أي تحديثات هنا وفي الموقع.` : `تم إرسال طلبك بنجاح برقم \`${result.request.reference}\`. تم التحقق من المنتج المرتبط بحسابك تلقائياً، ولا يظهر المفتاح كاملاً في Discord.`, flags: 64 });
    } catch (error) {
      await respond({ content: error instanceof Error ? error.message : 'تعذر إرسال طلب الريست. حاول مرة أخرى أو افتحه من بطاقة المنتج داخل الموقع.', flags: 64 });
    }
    return;
  }

  if (interaction.type !== 3) return;
  const customId = String(interaction.data?.custom_id || '');
  if (customId.startsWith('ta3n_reset_approve:') || customId.startsWith('ta3n_reset_reject:') || customId.startsWith('ta3n_reset_info:')) {
    if (String(interaction.channel_id) !== discordRoomChannels.keyResetRequests) {
      await respond({ content: 'استخدم أزرار إدارة الريست من روم رستات المفاتيح المحدد فقط.', flags: 64 });
      return;
    }
    if (!isDiscordResetAdministrator(interaction)) {
      await respond({ content: 'هذه الأزرار مخصصة للإدارة فقط.', flags: 64 });
      return;
    }
    const reference = customId.split(':', 2)[1];
    try {
      const request = await findDiscordResetRequest(reference);
      if (customId.startsWith('ta3n_reset_approve:')) {
        const actorUser = interaction.member?.user || interaction.user || {};
        const { processResetRequest } = await import('@/lib/t3n-ai');
        await processResetRequest({ id: String(actorUser.id || ''), name: String(actorUser.global_name || actorUser.username || 'Administrator'), image: null, role: 'Admin' }, { requestId: request.id, action: 'approve' });
        await respond({ content: `تم قبول الطلب \`${reference}\` وتحديث بطاقته باسم الإدارة المنفذة.`, flags: 64 });
        return;
      }
      if (customId.startsWith('ta3n_reset_reject:')) {
        await respondModal({
          custom_id: `ta3n_reset_reject_submit:${reference}`,
          title: 'رفض طلب ريستات',
          components: [{ type: 1, components: [{ type: 4, custom_id: 'reject_reason', label: 'سبب الرفض', style: 2, min_length: 3, max_length: 500, required: true, placeholder: 'اكتب سبباً واضحاً للعميل' }] }],
        });
        return;
      }
      await respond({
        embeds: [{
          color: 0x5865f2,
          title: `معلومات الطلب ${reference}`,
          thumbnail: request.customerImage ? { url: String(request.customerImage) } : undefined,
          fields: [
            { name: 'العميل', value: `**${String(request.customerName || 'عميل')}**\n<@${String(request.customerDiscordId || '')}>`, inline: true },
            { name: 'Discord ID', value: `\`${String(request.customerDiscordId || '')}\``, inline: true },
            { name: 'المنتج', value: String(request.productName || 'غير محدد'), inline: true },
            { name: 'المفتاح', value: String(request.keyMasked || '••••••'), inline: true },
            { name: 'سبب الطلب', value: String(request.reason || 'لم يضف العميل سبباً').slice(0, 500), inline: false },
          ],
          footer: { text: 'المفتاح الكامل لا يظهر في Discord' },
        }],
        flags: 64,
      });
      return;
    } catch (error) {
      await respond({ content: error instanceof Error ? error.message : 'تعذر معالجة طلب الريست الآن.', flags: 64 });
      return;
    }
  }
  if (customId === 'ta3n_reset_closed') {
    await respond({ content: 'هذا الطلب منتهٍ أو تم التعامل معه بالفعل.', flags: 64 });
    return;
  }
  if (customId === 'ta3n_support_start') {
    if (String(interaction.channel_id) !== discordRoomChannels.smartSupport) {
      await respond({ content: 'استخدم زر بدء المساعدة من روم الدعم الذكي المحدد.', flags: 64 });
      return;
    }
    const result = await createDiscordSupportThread(interaction, token);
    await respond({ content: result.existing ? `لديك جلسة دعم نشطة بالفعل: <#${result.threadId}>` : `تم إنشاء جلسة دعمك الخاصة: <#${result.threadId}>`, flags: 64 });
    return;
  }

  if (customId === 'ta3n_reset_start') {
    if (String(interaction.channel_id) !== discordRoomChannels.keyResetRequests) {
      await respond({ content: 'استخدم زر طلب الريست من روم رستات المفاتيح المحدد.', flags: 64 });
      return;
    }
    await respondModal({
      custom_id: 'ta3n_reset_submit',
      title: 'طلب ريستات',
      components: [
        { type: 1, components: [{ type: 4, custom_id: 'reset_reason', label: 'سبب طلب الريستات', style: 2, min_length: 3, max_length: 500, required: true, placeholder: 'مثال: غيّرت الجهاز أو ظهرت مشكلة في التشغيل' }] },
      ],
    });
    return;
  }

  if (customId.startsWith('ta3n_voice_accept:') || customId.startsWith('ta3n_voice_decline:')) {
    const sessionId = customId.split(':', 2)[1];
    const actorId = String(interaction.member?.user?.id || interaction.user?.id || '');
    if (!sessionId || !actorId) {
      await respond({ content: 'تعذر التحقق من جلسة الدعم الصوتي.', flags: 64 });
      return;
    }
    if (customId.startsWith('ta3n_voice_decline:')) {
      const voiceRef = doc(supportDatabase(), VOICE_SUPPORT_COLLECTION, sessionId);
      const voiceSnapshot = await getDoc(voiceRef);
      if (!voiceSnapshot.exists() || String((voiceSnapshot.data() as any).customerDiscordId) !== actorId) {
        await respond({ content: 'هذه الدعوة غير مخصصة لحسابك.', flags: 64 });
        return;
      }
      await updateDoc(voiceRef, { status: 'ENDED', endedAt: new Date().toISOString(), updatedAt: new Date().toISOString(), notes: 'رفض العميل دعوة الجلسة.' });
      await respond({ content: 'تم إلغاء دعوة الدعم الصوتي. لن يتم فتح أي غرفة أو مشاركة شاشة.', flags: 64 });
      return;
    }
    const voiceSession = await activateDiscordVoiceSession(sessionId, actorId, token);
    await respond({ content: voiceSession.inviteUrl ? `تم إنشاء غرفتك الخاصة. ادخل من هنا: ${voiceSession.inviteUrl}\nمشاركة الشاشة اختيارية ويمكنك إيقافها في أي وقت.` : 'تم إنشاء الغرفة الخاصة. افتح السيرفر ثم ادخل إلى الغرفة الصوتية الجديدة.', flags: 64 });
    return;
  }

  const sessionSnapshot = await getDoc(doc(supportDatabase(), DISCORD_SUPPORT_COLLECTION, String(interaction.channel_id)));
  if (!sessionSnapshot.exists()) {
    await respond({ content: 'هذه المحادثة ليست جلسة دعم نشطة.', flags: 64 });
    return;
  }
  const session = { id: sessionSnapshot.id, ...(sessionSnapshot.data() as Omit<DiscordSupportSession, 'id'>) };
  const actorId = String(interaction.member?.user?.id || interaction.user?.id || '');
  if (actorId !== session.customerDiscordId) {
    await respond({ content: 'هذا الزر مخصص لصاحب جلسة الدعم فقط.', flags: 64 });
    return;
  }
  if (customId === 'ta3n_support_guide') {
    await respond({ content: `افتح المنصة ثم «منتجاتي» واختر «دليل المنتج» للوصول إلى الشروحات وحلول المشاكل: ${websiteUrl}`, flags: 64 });
    return;
  }
  if (customId === 'ta3n_support_retry') {
    await respond({ content: 'اكتب الخطأ كما يظهر، واذكر اسم المنتج أو أرسل صورة واضحة للنافذة كاملة.', flags: 64 });
    return;
  }
  if (customId === 'ta3n_support_close') {
    await closeDiscordSupportSession(session, token, 'CUSTOMER');
    await respond({ content: 'تم إنهاء جلسة الدعم. يمكنك فتح جلسة جديدة لاحقاً من روم الدعم الذكي.', flags: 64 });
  }
}

function identify(token: string) {
  sendGateway(2, {
    token,
    intents: 33_281,
    properties: { os: 'linux', browser: 't3nn.wtf', device: 't3nn.wtf' },
  });
}

function scheduleReconnect(token: string) {
  if (!started || reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connect(token);
  }, 5_000);
}

function handleGatewayMessage(data: RawData, token: string) {
  let packet: GatewayPacket;
  try {
    packet = JSON.parse(data.toString()) as GatewayPacket;
  } catch {
    return;
  }
  if (typeof packet.s === 'number') sequence = packet.s;

  if (packet.op === 10) {
    const interval = Number(packet.d?.heartbeat_interval) || 45_000;
    if (heartbeatTimer) clearInterval(heartbeatTimer);
    sendGateway(1, sequence);
    heartbeatTimer = setInterval(() => sendGateway(1, sequence), interval);
    identify(token);
    return;
  }
  if (packet.op === 7 || packet.op === 9) {
    socket?.close();
    return;
  }
  if (packet.op !== 0) return;

  if (packet.t === 'READY') {
    const applicationId = packet.d?.application?.id || packet.d?.user?.id;
    const tag = packet.d?.user?.global_username || packet.d?.user?.username || 'Ta3n Bot';
    console.info(`[Discord Bot] Connected as ${tag}.`);
    if (applicationId) void registerCommands(applicationId, token).catch((error) => console.error('[Discord Bot] Unable to register commands:', error));
    return;
  }
  if (packet.t === 'INTERACTION_CREATE') void answerInteraction(packet.d, token).catch((error) => console.error('[Discord Bot] Interaction handling failed:', error));
  if (packet.t === 'MESSAGE_CREATE') void handleDiscordSupportMessage(packet.d, token).catch((error) => console.error('[Discord Bot] Support message handling failed:', error));
}

function connect(token: string) {
  clearTimers();
  socket?.removeAllListeners();
  socket?.close();
  sequence = null;
  socket = new WebSocket('wss://gateway.discord.gg/?v=10&encoding=json', { perMessageDeflate: false });
  socket.on('message', (data) => handleGatewayMessage(data, token));
  socket.on('error', (error) => console.error('[Discord Bot] Gateway error:', error));
  socket.on('close', (code) => {
    if (heartbeatTimer) clearInterval(heartbeatTimer);
    heartbeatTimer = null;
    console.warn(`[Discord Bot] Gateway closed (${code}). Reconnecting…`);
    scheduleReconnect(token);
  });
}

/** Starts one lightweight Discord gateway client per Next.js service instance. */
export async function startDiscordBot() {
  if (started) return;
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) {
    console.info('[Discord Bot] DISCORD_BOT_TOKEN is not set; gateway bot is disabled.');
    return;
  }
  started = true;
  try {
    await ensureResetRequestsChannelPrivate(token);
    await ensurePrivateAuditChannels(token);
    const panel = await ensureDiscordResetPanelPublished();
    if (panel.published) console.info(`[Discord Reset] Published panel ${panel.messageId}.`);
    const announcement = await ensureDiscordResetFeatureAnnouncementPublished();
    if (announcement.published) console.info(`[Discord Updates] Published reset feature announcement ${announcement.messageId}.`);
  } catch (error) {
    console.error('[Discord Audit] Private reset channel permissions, private audit setup, or reset panel publish failed:', error);
  }
  supportMaintenanceTimer = setInterval(() => {
    if (supportMaintenanceRunning) return;
    supportMaintenanceRunning = true;
    void maintainDiscordSupportSessions(token)
      .catch((error) => console.error('[Discord Support] Maintenance failed:', error))
      .finally(() => { supportMaintenanceRunning = false; });
  }, 30_000);
  void maintainDiscordSupportSessions(token).catch((error) => console.error('[Discord Support] Initial maintenance failed:', error));
  connect(token);
}
