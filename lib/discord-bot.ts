import WebSocket, { RawData } from 'ws';
import { collection, doc, getDoc, getDocs, query, setDoc, updateDoc, where } from 'firebase/firestore';
import { db as getDb } from '@/lib/store-db';
import type { SiteUpdate } from '@/types';
import { DISCORD_ROLES } from '@/lib/roles';

const guildId = process.env.DISCORD_GUILD_ID || '1396959491786018826';
const websiteUrl = (process.env.NEXTAUTH_URL || 'https://t3nn.wtf').replace(/\/$/, '');
const productStatusChannelId = '1499633005008916551';
export const discordRoomChannels = {
  keyResetRequests: '1541504706210304031',
} as const;
const DISCORD_AUDIT_CONFIG_COLLECTION = 'discordBotConfig';
const DISCORD_AUDIT_CONFIG_ID = 'privateAuditChannels';
const DISCORD_RESET_PANEL_CONFIG_ID = 'resetPanel';
const DISCORD_RESET_ANNOUNCEMENT_CONFIG_ID = 'resetFeatureAnnouncement';
const DISCORD_UPDATES_CHANNEL_ID = '1540878976166400060';
const DISCORD_AUDIT_CATEGORY_NAME = '🔐・private-logs';
const DISCORD_RESET_AUDIT_CATEGORY_NAME = '🔐・reset-logs';
const DISCORD_RESET_AUDIT_CHANNEL_NAME = '📋・reset-requests-log';
const DISCORD_LOGIN_AUDIT_CHANNEL_NAME = '🔐・login-log';
const DISCORD_LOGOUT_AUDIT_CHANNEL_NAME = '🚪・logout-log';
const DISCORD_WEBSITE_EVENTS_CHANNEL_NAME = '🖥️・website-events';

type DiscordPrivateAuditChannels = {
  categoryId?: string | null;
  resetCategoryId?: string | null;
  resetAuditChannelId: string;
  loginAuditChannelId: string;
  logoutAuditChannelId: string;
  websiteEventsChannelId: string;
};
let privateAuditChannelCache: DiscordPrivateAuditChannels | null = null;

function firestoreDatabase() {
  const database = getDb();
  if (!database) throw new Error('تعذر الاتصال بقاعدة بيانات Discord.');
  return database;
}

type WebsiteLogEvent =
  | { type: 'login'; customerId: string; customerName: string; customerImage?: string | null }
  | { type: 'logout'; customerId: string; customerName: string; customerImage?: string | null }
  | { type: 'productActivated'; customerId: string; customerName: string; customerImage?: string | null; productName: string }
  | { type: 'keyInventoryChanged'; customerId: string; customerName: string; customerImage?: string | null; productName: string; action: 'added' | 'restored' | 'deleted' | 'updated'; keyCount: number };

type GatewayPacket = { op: number; d: any; s?: number | null; t?: string | null };

let socket: WebSocket | null = null;
let heartbeatTimer: NodeJS.Timeout | null = null;
let reconnectTimer: NodeJS.Timeout | null = null;
let sequence: number | null = null;
let started = false;

function clearTimers() {
  if (heartbeatTimer) clearInterval(heartbeatTimer);
  if (reconnectTimer) clearTimeout(reconnectTimer);
  heartbeatTimer = null;
  reconnectTimer = null;
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

async function ensureResetRequestsChannelForCustomers(token: string) {
  const VIEW_CHANNEL = 0x400n;
  const SEND_MESSAGES = 0x800n;
  const READ_MESSAGE_HISTORY = 0x10000n;
  const USE_APPLICATION_COMMANDS = 0x80000000n;
  const customerAllow = VIEW_CHANNEL | READ_MESSAGE_HISTORY | USE_APPLICATION_COMMANDS;
  const customerResponse = await discordApi(`/channels/${discordRoomChannels.keyResetRequests}/permissions/${guildId}`, token, {
    method: 'PUT',
    body: JSON.stringify({ id: guildId, type: 0, allow: String(customerAllow), deny: String(SEND_MESSAGES) }),
  });
  if (!customerResponse.ok) throw new Error(`تعذر تجهيز روم طلب الريست للعملاء (HTTP ${customerResponse.status}).`);

  const staffAllow = VIEW_CHANNEL | SEND_MESSAGES | READ_MESSAGE_HISTORY | USE_APPLICATION_COMMANDS;
  for (const roleId of [DISCORD_ROLES.BOSS, DISCORD_ROLES.CO_BOSS]) {
    const response = await discordApi(`/channels/${discordRoomChannels.keyResetRequests}/permissions/${roleId}`, token, {
      method: 'PUT',
      body: JSON.stringify({ id: roleId, type: 0, allow: String(staffAllow), deny: '0' }),
    });
    if (!response.ok) throw new Error(`تعذر منح دور إدارة غرفة طلبات إعادة التعيين (HTTP ${response.status}).`);
  }
}

async function ensurePrivateAuditChannels(token: string): Promise<DiscordPrivateAuditChannels> {
  if (privateAuditChannelCache) return privateAuditChannelCache;
  const database = firestoreDatabase();
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

  const ensurePrivateCategory = async (storedId: string | null | undefined, name: string) => {
    let category = storedId ? guildChannels.find((channel) => channel.id === storedId) : findChannel(name, 4);
    if (category) {
      if (category.name !== name) category = await renameChannel(category.id, name);
      return category;
    }
    const response = await discordApi(`/guilds/${guildId}/channels`, token, {
      method: 'POST',
      body: JSON.stringify({ name, type: 4, permission_overwrites: [{ id: guildId, type: 0, deny: '1024' }] }),
    });
    if (!response.ok) throw new Error(`تعذر إنشاء فئة سجلات Discord الخاصة (HTTP ${response.status}).`);
    return await response.json() as { id: string; name: string; type: number };
  };

  const category = await ensurePrivateCategory(storedChannels?.categoryId, DISCORD_AUDIT_CATEGORY_NAME);
  const resetCategory = await ensurePrivateCategory(storedChannels?.resetCategoryId, DISCORD_RESET_AUDIT_CATEGORY_NAME);
  const grantStaffPrivateLogAccess = async (categoryId: string) => {
    const VIEW_CHANNEL = 0x400n;
    const SEND_MESSAGES = 0x800n;
    const READ_MESSAGE_HISTORY = 0x10000n;
    const USE_APPLICATION_COMMANDS = 0x80000000n;
    const staffAllow = VIEW_CHANNEL | SEND_MESSAGES | READ_MESSAGE_HISTORY | USE_APPLICATION_COMMANDS;
    for (const roleId of [DISCORD_ROLES.BOSS, DISCORD_ROLES.CO_BOSS]) {
      const response = await discordApi(`/channels/${categoryId}/permissions/${roleId}`, token, {
        method: 'PUT',
        body: JSON.stringify({ id: roleId, type: 0, allow: String(staffAllow), deny: '0' }),
      });
      if (!response.ok) throw new Error(`تعذر منح الإدارة وصول سجل الريستات الخاص (HTTP ${response.status}).`);
    }
  };
  await Promise.all([grantStaffPrivateLogAccess(category.id), grantStaffPrivateLogAccess(resetCategory.id)]);
  const createOrRenameLogChannel = async (storedId: string | null | undefined, name: string, parentId: string) => {
    const ensureChannelParent = async (channel: { id: string; name: string; parent_id?: string | null }) => {
      if (channel.name === name && channel.parent_id === parentId) return channel.id;
      const response = await discordApi(`/channels/${channel.id}`, token, { method: 'PATCH', body: JSON.stringify({ name, parent_id: parentId }) });
      if (!response.ok) throw new Error(`تعذر ترتيب روم سجل Discord الخاص (HTTP ${response.status}).`);
      return channel.id;
    };
    const storedChannel = storedId ? guildChannels.find((channel) => channel.id === storedId) : null;
    if (storedChannel) return ensureChannelParent(storedChannel);
    const existing = findChannel(name, 0);
    if (existing) return ensureChannelParent(existing);
    const response = await discordApi(`/guilds/${guildId}/channels`, token, {
      method: 'POST',
      body: JSON.stringify({ name, type: 0, parent_id: parentId, topic: 'Private administrative audit log. No full license keys, customer messages, email, or IP addresses.' }),
    });
    if (!response.ok) throw new Error(`تعذر إنشاء روم سجل Discord الخاص (HTTP ${response.status}).`);
    return String((await response.json() as { id: string }).id);
  };

  privateAuditChannelCache = {
    categoryId: category.id,
    resetCategoryId: resetCategory.id,
    resetAuditChannelId: await createOrRenameLogChannel(storedChannels?.resetAuditChannelId, DISCORD_RESET_AUDIT_CHANNEL_NAME, resetCategory.id),
    loginAuditChannelId: await createOrRenameLogChannel(storedChannels?.loginAuditChannelId, DISCORD_LOGIN_AUDIT_CHANNEL_NAME, category.id),
    logoutAuditChannelId: await createOrRenameLogChannel(storedChannels?.logoutAuditChannelId, DISCORD_LOGOUT_AUDIT_CHANNEL_NAME, category.id),
    websiteEventsChannelId: await createOrRenameLogChannel(storedChannels?.websiteEventsChannelId, DISCORD_WEBSITE_EVENTS_CHANNEL_NAME, category.id),
  };
  await setDoc(configRef, { ...privateAuditChannelCache, updatedAt: new Date().toISOString() }, { merge: true });
  return privateAuditChannelCache;
}

function commands() {
  return [
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
      : event.type === 'keyInventoryChanged'
          ? { channelId: channels.websiteEventsChannelId, color: event.action === 'deleted' ? 0xf97316 : event.action === 'updated' ? 0x38bdf8 : 0x22c55e, title: event.action === 'deleted' ? 'License Key Removed' : event.action === 'restored' ? 'License Key Restored' : event.action === 'updated' ? 'License Key Updated' : 'License Keys Added', description: 'An administrator changed the product key inventory from the Ta3n platform.', label: 'Product', value: `${event.productName} · ${event.keyCount} key(s)` }
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

export async function deleteDiscordResetRequestCard(messageId?: string | null, channelId?: string | null) {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token || !messageId) return;
  const targetChannelId = channelId || discordRoomChannels.keyResetRequests;
  const response = await discordApi(`/channels/${targetChannelId}/messages/${messageId}`, token, { method: 'DELETE' });
  if (!response.ok && response.status !== 404) throw new Error(`تعذر إزالة بطاقة طلب الريست القديمة (HTTP ${response.status}).`);
}

async function migrateLegacyResetRequestLogs() {
  const database = firestoreDatabase();
  const snapshot = await getDocs(collection(database, 'resetRequests'));
  let migrated = 0;
  for (const item of snapshot.docs) {
    const data = item.data() as Record<string, unknown>;
    const legacyMessageId = typeof data.discordMessageId === 'string' ? data.discordMessageId : null;
    const logChannelId = typeof data.discordLogChannelId === 'string' ? data.discordLogChannelId : null;
    if (!legacyMessageId || logChannelId) continue;
    const status = String(data.status || 'PENDING') as DiscordResetRequestLog['status'];
    if (!['PENDING', 'APPROVED', 'WAITING_FOR_CUSTOMER'].includes(status)) continue;
    try {
      const result = await syncDiscordResetRequestLog({
        reference: String(data.reference || item.id),
        customerDiscordId: String(data.customerDiscordId || ''),
        customerName: String(data.customerName || 'عميل'),
        customerImage: typeof data.customerImage === 'string' ? data.customerImage : null,
        productName: String(data.productName || 'منتج غير محدد'),
        productImage: typeof data.productImage === 'string' ? data.productImage : `${websiteUrl}/logo.png`,
        keyMasked: String(data.keyMasked || '••••••'),
        reason: String(data.reason || 'لم يضف العميل سبباً'),
        status,
        adminName: typeof data.processedByName === 'string' ? data.processedByName : null,
        adminNotes: typeof data.adminNotes === 'string' ? data.adminNotes : null,
      });
      await updateDoc(doc(database, 'resetRequests', item.id), { discordMessageId: result.messageId, discordLogChannelId: result.channelId });
      await deleteDiscordResetRequestCard(legacyMessageId, discordRoomChannels.keyResetRequests);
      migrated += 1;
    } catch (error) {
      console.error('[Discord Reset] Unable to migrate legacy request card:', error);
    }
  }
  return migrated;
}

type DiscordResetRequestLog = {
  reference: string;
  customerDiscordId: string;
  customerName: string;
  customerImage?: string | null;
  productName: string;
  productImage?: string | null;
  keyMasked: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'WAITING_FOR_CUSTOMER' | 'COMPLETED' | 'CANCELLED';
  adminName?: string | null;
  adminNotes?: string | null;
  discordMessageId?: string | null;
  discordLogChannelId?: string | null;
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

export async function syncDiscordResetRequestLog(event: DiscordResetRequestLog): Promise<{ messageId: string; channelId: string }> {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) throw new Error('بوت Discord غير متصل حالياً، لذلك لم يتم إرسال سجل الريست.');
  const channels = await ensurePrivateAuditChannels(token);
  const logChannelId = channels.resetAuditChannelId;
  const status = resetStatusPresentation(event.status);
  const embed = {
    color: status.color,
    author: { name: 'تعن • طلبات رستات المفاتيح', icon_url: `${websiteUrl}/logo.png` },
    title: event.status === 'PENDING' ? 'طلب رستات مفتاح جديد' : `تحديث طلب رستات ${event.reference}`,
    description: event.status === 'COMPLETED' ? 'تم تنفيذ إعادة ضبط الترخيص بنجاح. هذه البطاقة محفوظة داخل سجل الإدارة الخاص.' : 'سجل متابعة منظم لطلب إعادة ضبط الترخيص. لا يظهر المفتاح الكامل إلا في لوحة الإدارة بالموقع.',
    thumbnail: event.customerImage ? { url: event.customerImage } : undefined,
    image: event.productImage ? { url: event.productImage } : undefined,
    fields: [
      { name: 'رقم الطلب', value: `\`${event.reference}\``, inline: true },
      { name: 'الحالة', value: status.label, inline: true },
      { name: 'العميل', value: `**${event.customerName || 'عميل'}**\n<@${event.customerDiscordId}>`, inline: true },
      { name: 'المنتج', value: event.productName || 'غير محدد', inline: true },
      { name: 'المفتاح', value: event.keyMasked ? `\`${event.keyMasked}\`\nانسخ الكامل من لوحة الإدارة` : 'غير متوفر', inline: true },
      { name: 'السبب', value: (event.reason || 'لم يضف العميل سبباً').slice(0, 500), inline: false },
      ...(event.adminName ? [{ name: 'الإدارة', value: event.adminName, inline: true }] : []),
      ...(event.adminNotes ? [{ name: 'ملاحظة الإدارة', value: event.adminNotes.slice(0, 500), inline: false }] : []),
      { name: 'آخر تحديث', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false },
    ],
    footer: { text: `تعن • سجل رستات خاص • ${event.customerDiscordId}` },
    timestamp: new Date().toISOString(),
  };
  const canUpdateExistingLog = Boolean(event.discordMessageId && event.discordLogChannelId === logChannelId);
  if (event.discordMessageId && !canUpdateExistingLog) {
    void deleteDiscordResetRequestCard(event.discordMessageId, event.discordLogChannelId || discordRoomChannels.keyResetRequests).catch(() => undefined);
  }
  const path = canUpdateExistingLog
    ? `/channels/${logChannelId}/messages/${event.discordMessageId}`
    : `/channels/${logChannelId}/messages`;
  const response = await discordApi(path, token, {
    method: canUpdateExistingLog ? 'PATCH' : 'POST',
    body: JSON.stringify({
      embeds: [embed],
      components: resetRequestAdminComponents(event),
    }),
  });
  if (!response.ok) throw new Error(`تعذر مزامنة بطاقة الريست مع Discord (HTTP ${response.status}).`);
  const message = await response.json() as { id?: string };
  if (!message.id) throw new Error('لم يعرض Discord معرف بطاقة الريست.');
  return { messageId: message.id, channelId: logChannelId };
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
  await setDoc(doc(firestoreDatabase(), DISCORD_AUDIT_CONFIG_COLLECTION, DISCORD_RESET_PANEL_CONFIG_ID), {
    messageId: message.id,
    channelId: discordRoomChannels.keyResetRequests,
    publishedAt: new Date().toISOString(),
  }, { merge: true });
  return { messageId: message.id };
}

async function ensureDiscordResetPanelPublished() {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) throw new Error('بوت Discord غير متصل حالياً، لذلك لم يتم تحديث لوحة الريست.');
  const panelRef = doc(firestoreDatabase(), DISCORD_AUDIT_CONFIG_COLLECTION, DISCORD_RESET_PANEL_CONFIG_ID);
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
  const announcementRef = doc(firestoreDatabase(), DISCORD_AUDIT_CONFIG_COLLECTION, DISCORD_RESET_ANNOUNCEMENT_CONFIG_ID);
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
  if (!response.ok) throw new Error(`تعذر إرسال رسالة Discord (HTTP ${response.status}).`);
  return response.json() as Promise<{ id: string }>;
}

function isDiscordResetAdministrator(interaction: any) {
  const actorId = String(interaction.member?.user?.id || interaction.user?.id || '');
  const roleIds = Array.isArray(interaction.member?.roles) ? interaction.member.roles.map(String) : [];
  const permissions = BigInt(String(interaction.member?.permissions || '0'));
  return actorId === '1315014140804206636' || roleIds.includes(DISCORD_ROLES.BOSS) || roleIds.includes(DISCORD_ROLES.CO_BOSS) || (permissions & 0x8n) === 0x8n;
}

async function findDiscordResetRequest(reference: string): Promise<{ id: string } & Record<string, unknown>> {
  const snapshot = await getDocs(query(collection(firestoreDatabase(), 'resetRequests'), where('reference', '==', reference)));
  if (snapshot.empty) throw new Error('لم يعد طلب الريست موجوداً أو تم إغلاقه.');
  return { id: snapshot.docs[0].id, ...(snapshot.docs[0].data() as Record<string, unknown>) } as { id: string } & Record<string, unknown>;
}

async function answerInteraction(interaction: any, token: string) {
  const respond = async (data: Record<string, unknown>) => {
    const response = await fetch(`https://discord.com/api/v10/interactions/${interaction.id}/${interaction.token}/callback`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 4, data }),
    });
    if (!response.ok) console.error(`[Discord Bot] Unable to answer interaction: ${response.status} ${await response.text()}`);
  };
  const respondModal = async (data: Record<string, unknown>) => {
    const response = await fetch(`https://discord.com/api/v10/interactions/${interaction.id}/${interaction.token}/callback`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 9, data }),
    });
    if (!response.ok) console.error(`[Discord Bot] Unable to open reset modal: ${response.status} ${await response.text()}`);
  };

  if (interaction.type === 2) {
    if (interaction.data?.name === 'موقعي') await respond({ content: `منصة تعن ومنتجاتك: ${websiteUrl}\nافتح «منتجاتي» لإدارة التراخيص والتحميل.`, flags: 64 });
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
        const { processResetRequest } = await import('@/lib/reset-requests');
        await processResetRequest({ id: actorId, name: String(actorUser.global_name || actorUser.username || 'Administrator'), image: null, role: 'Admin' }, { requestId: request.id, action: 'reject', note: String(values.reject_reason || '') });
        await respond({ content: `تم رفض الطلب \`${reference}\` وتحديث البطاقة مع سبب الرفض.`, flags: 64 });
        return;
      }
      const avatarHash = String(actorUser.avatar || '');
      const image = actorId && avatarHash ? `https://cdn.discordapp.com/avatars/${actorId}/${avatarHash}.png` : null;
      const { createResetRequest } = await import('@/lib/reset-requests');
      if (!actorId) throw new Error('تعذر التحقق من حساب Discord. أعد المحاولة بعد لحظات.');
      const result = await createResetRequest({ id: actorId, name: String(actorUser.global_name || actorUser.username || 'عميل'), image, role: 'Customer' }, { reason: String(values.reset_reason || ''), language: 'ar' });
      await respond({ content: result.duplicate ? `لديك طلب رستات نشط بالفعل: \`${result.request.reference}\`، وستصلك أي تحديثات هنا وفي الموقع.` : `تم إرسال طلبك بنجاح برقم \`${result.request.reference}\`. تم التحقق من المنتج المرتبط بحسابك تلقائياً، ولا يظهر المفتاح كاملاً في Discord.`, flags: 64 });
    } catch (error) {
      await respond({ content: error instanceof Error ? error.message : 'تعذر إرسال الطلب. حاول مرة أخرى أو افتحه من بطاقة المنتج داخل الموقع.', flags: 64 });
    }
    return;
  }

  if (interaction.type !== 3) return;
  const customId = String(interaction.data?.custom_id || '');
  if (customId.startsWith('ta3n_reset_approve:') || customId.startsWith('ta3n_reset_reject:') || customId.startsWith('ta3n_reset_info:')) {
    if (String(interaction.channel_id) !== (await ensurePrivateAuditChannels(token)).resetAuditChannelId || !isDiscordResetAdministrator(interaction)) {
      await respond({ content: 'هذا الإجراء متاح للإدارة داخل سجل الريستات الخاص فقط.', flags: 64 });
      return;
    }
    const reference = customId.split(':', 2)[1];
    try {
      const request = await findDiscordResetRequest(reference);
      if (customId.startsWith('ta3n_reset_reject:')) {
        await respondModal({ custom_id: `ta3n_reset_reject_submit:${reference}`, title: 'رفض طلب ريستات', components: [{ type: 1, components: [{ type: 4, custom_id: 'reject_reason', label: 'سبب الرفض', style: 2, min_length: 3, max_length: 500, required: true, placeholder: 'اكتب سبباً واضحاً للعميل' }] }] });
        return;
      }
      if (customId.startsWith('ta3n_reset_approve:')) {
        const actorUser = interaction.member?.user || interaction.user || {};
        const { processResetRequest } = await import('@/lib/reset-requests');
        await processResetRequest({ id: String(actorUser.id || ''), name: String(actorUser.global_name || actorUser.username || 'Administrator'), image: null, role: 'Admin' }, { requestId: request.id, action: 'approve' });
        await respond({ content: `تم قبول الطلب \`${reference}\` وتحديث البطاقة باسم الإدارة المنفذة.`, flags: 64 });
        return;
      }
      await respond({ embeds: [{ color: 0x5865f2, title: `معلومات الطلب ${reference}`, thumbnail: request.customerImage ? { url: String(request.customerImage) } : undefined, fields: [
        { name: 'العميل', value: `**${String(request.customerName || 'عميل')}**\n<@${String(request.customerDiscordId || '')}>`, inline: true },
        { name: 'Discord ID', value: `\`${String(request.customerDiscordId || '')}\``, inline: true },
        { name: 'المنتج', value: String(request.productName || 'غير محدد'), inline: true },
        { name: 'المفتاح', value: String(request.keyMasked || '••••••'), inline: true },
        { name: 'سبب الطلب', value: String(request.reason || 'لم يضف العميل سبباً').slice(0, 500), inline: false },
      ], footer: { text: 'المفتاح الكامل لا يظهر في Discord' } }], flags: 64 });
    } catch (error) {
      await respond({ content: error instanceof Error ? error.message : 'تعذر معالجة طلب الريست الآن.', flags: 64 });
    }
    return;
  }
  if (customId === 'ta3n_reset_closed') {
    await respond({ content: 'هذا الطلب منتهٍ أو تم التعامل معه بالفعل.', flags: 64 });
    return;
  }
  if (customId === 'ta3n_reset_start') {
    if (String(interaction.channel_id) !== discordRoomChannels.keyResetRequests) {
      await respond({ content: 'استخدم زر طلب الريست من روم رستات المفاتيح المحدد.', flags: 64 });
      return;
    }
    await respondModal({ custom_id: 'ta3n_reset_submit', title: 'طلب ريستات', components: [{ type: 1, components: [{ type: 4, custom_id: 'reset_reason', label: 'سبب طلب الريستات', style: 2, min_length: 3, max_length: 500, required: true, placeholder: 'مثال: غيّرت الجهاز أو ظهرت مشكلة في التشغيل' }] }] });
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
    await ensureResetRequestsChannelForCustomers(token);
    await ensurePrivateAuditChannels(token);
    const migratedResetLogs = await migrateLegacyResetRequestLogs();
    if (migratedResetLogs) console.info(`[Discord Reset] Moved ${migratedResetLogs} active request logs to the private audit channel.`);
    const panel = await ensureDiscordResetPanelPublished();
    if (panel.published) console.info(`[Discord Reset] Published panel ${panel.messageId}.`);
    const announcement = await ensureDiscordResetFeatureAnnouncementPublished();
    if (announcement.published) console.info(`[Discord Updates] Published reset feature announcement ${announcement.messageId}.`);
  } catch (error) {
    console.error('[Discord Audit] Private reset channel permissions, private audit setup, or reset panel publish failed:', error);
  }
  connect(token);
}
