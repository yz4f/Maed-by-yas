export type RoleType = 'Boss' | 'Co-Boss' | 'Admin' | 'Member' | 'Customer';
export type ProductStatus = 'Active' | 'Inactive' | 'Suspended' | 'Revoked' | 'Expired';
export type KeyDuration = 'Lifetime' | '30 Days' | '7 Days' | '2 Days';

export interface User {
  id: string;
  discordId: string;
  name: string;
  email?: string | null;
  image?: string | null;
  role: RoleType;
  discordRoles: string[]; // Role IDs
  createdAt: string;
  lastLogin?: string;
  lastIp?: string;
  isBanned?: boolean;
  banReason?: string | null;
  banType?: 'temporary' | 'permanent' | null;
  banExpiresAt?: string | null;
  warningMessage?: string | null;
  warningCount?: number;
  isArchived?: boolean;
  archivedAt?: string | null;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  image: string;
  cardColor: 'blue' | 'cyan' | 'purple' | 'gold';
  category: string;
  displayOrder: number;
  version: string;
  fileSize: string;
  fileUrl: string;
  videoUrl?: string | null;
  guideUrl?: string | null;
  downloadsCount: number;
  stockKeysCount?: number;
  isVisible: boolean;
  isDisabled: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Key {
  id: string;
  key: string;
  productId: string;
  productName?: string;
  isUsed: boolean;
  isDisabled: boolean;
  isArchived: boolean;
  isRevoked?: boolean;
  archivedAt?: string | null;
  revokedAt?: string | null;
  duration: KeyDuration;
  usedByUserId?: string | null;
  usedByUserName?: string | null;
  usedAt?: string | null;
  createdById?: string | null;
  createdByUserName?: string | null;
  createdAt: string;
}

export interface UserProduct {
  id: string;
  userId: string;
  user?: User;
  productId: string;
  product?: Product;
  keyId?: string | null;
  keyString?: string;
  status: ProductStatus;
  activatedAt: string;
  expiresAt?: string | null;
  hwidResetAt?: string | null;
  hwidResetCount?: number;
  revokedAt?: string | null;
  revokedById?: string | null;
  discordRoleGranted: boolean;
}

export interface DownloadLog {
  id: string;
  userId: string;
  userName?: string;
  productId: string;
  productName?: string;
  ipAddress: string;
  downloadedAt: string;
}

export interface SystemLog {
  id: string;
  action: string;
  details: string;
  userId?: string | null;
  discordId?: string | null;
  userName?: string | null;
  ipAddress: string;
  createdAt: string;
  auditEventId?: string;
}

export interface AuditEvent {
  id: string;
  eventType: string;
  description: string;
  occurredAt: string;
  actorUserId?: string | null;
  actorDiscordId?: string | null;
  actorName?: string | null;
  targetUserId?: string | null;
  targetDiscordId?: string | null;
  productId?: string | null;
  keyId?: string | null;
  ticketId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
}

export interface SystemStats {
  totalUsers: number;
  totalProducts: number;
  totalKeys: number;
  totalDownloads: number;
  activeProducts: number;
  inactiveProducts: number;
  usedKeys: number;
  unusedKeys: number;
  productStockList: {
    productId: string;
    productName: string;
    stockCount: number;
  }[];
  recentLogs: SystemLog[];
}

export interface DiscordRoleConfig {
  id: string;
  name: string;
  roleId: string;
  description: string;
}


export type TicketStatus = 'new' | 'open' | 'in_progress' | 'awaiting_user' | 'awaiting_staff' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketDepartment = 'technical_support' | 'sales' | 'billing' | 'accounts';
export type TicketCategory = 'technical' | 'account' | 'service' | 'suggestion' | 'other';

export interface TicketAttachment {
  id: string;
  name: string;
  url: string;
  contentType: string;
  size: number;
  uploadedAt: string;
  uploadedById: string;
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  authorId: string;
  authorName: string;
  authorImage?: string | null;
  authorRole: 'customer' | 'staff';
  body: string;
  isInternal: boolean;
  attachments: TicketAttachment[];
  createdAt: string;
}

export interface TicketTimelineEvent {
  id: string;
  ticketId: string;
  type: 'created' | 'claimed' | 'status_changed' | 'priority_changed' | 'assigned' | 'message' | 'note' | 'attachment' | 'resolved' | 'closed' | 'reopened' | 'customer_muted' | 'customer_unmuted';
  actorId: string;
  actorName: string;
  message: string;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  number: string;
  title: string;
  department?: TicketDepartment;
  category: TicketCategory;
  tags?: string[];
  priority: TicketPriority;
  status: TicketStatus;
  userId: string;
  userName: string;
  userImage?: string | null;
  assignedAgentId?: string | null;
  assignedAgentName?: string | null;
  assignedAgentImage?: string | null;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string;
  resolvedAt?: string | null;
  resolvedById?: string | null;
  resolvedByName?: string | null;
  closedAt?: string | null;
  closedById?: string | null;
  closedByName?: string | null;
  finalClosed?: boolean;
  slaDueAt?: string | null;
  messageCount: number;
}

export interface TicketCustomerProfile {
  id: string;
  name: string;
  email?: string | null;
  image?: string | null;
  role?: RoleType;
  createdAt?: string | null;
  ticketMuted: boolean;
  mutedAt?: string | null;
  mutedByName?: string | null;
  muteReason?: string | null;
}

export interface TicketDetail {
  ticket: SupportTicket;
  messages: TicketMessage[];
  timeline: TicketTimelineEvent[];
  customer?: TicketCustomerProfile;
}

export interface TicketStats {
  open: number;
  unassigned: number;
  inProgress: number;
  awaitingUser: number;
  closedToday: number;
  urgent: number;
  recentDays: { date: string; count: number }[];
}

export type AiConversationStatus = 'AI_ACTIVE' | 'WAITING_FOR_SUPPORT' | 'WAITING_FOR_CUSTOMER' | 'HUMAN_ACTIVE' | 'CLOSED';
export type AiConversationCloseReason = 'INACTIVITY' | 'MANUAL' | null;
export type AiMessageRole = 'customer' | 'assistant' | 'staff' | 'system';
export type SupportNotificationType = 'INACTIVITY_WARNING' | 'CONVERSATION_AUTO_CLOSED' | 'RESET_COMPLETED';
export type SupportNotificationPriority = 'high';
export type AiKnowledgeCategory = 'ABOUT_STORE' | 'PRODUCTS' | 'PRODUCT_GUIDES' | 'FAQ' | 'TROUBLESHOOTING' | 'ACTIVATION' | 'KEYS' | 'ORDERS' | 'PAYMENTS' | 'REFUNDS' | 'SUPPORT_POLICY' | 'TERMS';
export type ResetRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'WAITING_FOR_CUSTOMER' | 'COMPLETED' | 'CANCELLED';

export interface AiKnowledgeEntry {
  id: string;
  category: AiKnowledgeCategory;
  title: string;
  content: string;
  enabled: boolean;
  source: string;
  createdAt: string;
  updatedAt: string;
}

export interface AiConversation {
  id: string;
  customerId: string;
  customerDiscordId: string;
  customerName: string;
  customerImage?: string | null;
  status: AiConversationStatus;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string;
  /** وقت آخر رسالة من العميل فقط، وهو الأساس الوحيد لمؤقت الإغلاق. */
  lastCustomerMessageAt?: string | null;
  /** آخر قسم داخل البوابة سجله العميل؛ يستخدم للسياق فقط ولا يغيّر تبويبه تلقائياً. */
  lastClientPage?: string | null;
  lastClientPageAt?: string | null;
  /** يضبط عند انتظار رد العميل ويستمر بعد إعادة تحميل الصفحة أو فتح الحساب من جهاز آخر. */
  idleCloseAt?: string | null;
  inactivityWarningAt?: string | null;
  closedAt?: string | null;
  closedReason?: AiConversationCloseReason;
  reopenAt?: string | null;
  messageCount: number;
  humanAgentId?: string | null;
  humanAgentName?: string | null;
}

export interface AiImageAttachment {
  id: string;
  name: string;
  contentType: 'image/jpeg' | 'image/png' | 'image/webp';
  size: number;
  /** A small compressed preview only; the original image is never stored in Firestore. */
  previewData?: string | null;
}

export interface AiMessage {
  id: string;
  conversationId: string;
  role: AiMessageRole;
  body: string;
  visibleToCustomer: boolean;
  createdAt: string;
  resetRequestId?: string | null;
  attachments?: AiImageAttachment[];
}

export interface SupportNotification {
  id: string;
  customerDiscordId: string;
  conversationId: string;
  type: SupportNotificationType;
  priority: SupportNotificationPriority;
  title: string;
  message: string;
  createdAt: string;
  seenAt?: string | null;
}

export type VoiceSupportSessionStatus = 'PENDING_CONSENT' | 'WAITING_FOR_CUSTOMER' | 'ACTIVE' | 'STAFF_ASSISTANCE' | 'ENDED' | 'FAILED';

export interface VoiceSupportSession {
  id: string;
  customerDiscordId: string;
  customerName: string;
  customerImage?: string | null;
  createdById: string;
  createdByName: string;
  voiceChannelId?: string | null;
  voiceChannelName?: string | null;
  inviteUrl?: string | null;
  status: VoiceSupportSessionStatus;
  consentedAt?: string | null;
  startedAt?: string | null;
  endedAt?: string | null;
  screenShareRequested: boolean;
  staffJoined: boolean;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ResetRequest {
  id: string;
  reference: string;
  customerId: string;
  customerDiscordId: string;
  customerName: string;
  customerImage?: string | null;
  customerEmail?: string | null;
  productId: string;
  productName: string;
  keyId?: string | null;
  /** المفتاح الكامل يعرض للإدارة فقط ويزال من استجابة العميل. */
  keyValue?: string | null;
  keyMasked: string;
  purchasedAt?: string | null;
  expiresAt?: string | null;
  resetCount: number;
  lastResetAt?: string | null;
  reason: string;
  status: ResetRequestStatus;
  adminNotes?: string | null;
  createdAt: string;
  updatedAt: string;
  processedAt?: string | null;
  processedById?: string | null;
  processedByName?: string | null;
  /** معرف بطاقة Discord المرتبطة بالطلب، لتحديثها دون تكرار الرسائل. */
  discordMessageId?: string | null;
}

export type SiteUpdateStatus = 'DRAFT' | 'APPROVED' | 'PUBLISHED' | 'DISCORD_SENT' | 'DISCORD_FAILED';
export type SiteUpdateKind = 'FEATURE' | 'IMPROVEMENT' | 'FIX' | 'RELEASE';

export interface SiteUpdate {
  id: string;
  title: string;
  summary: string;
  highlights: string[];
  imageUrl: string;
  imageAlt: string;
  kind: SiteUpdateKind;
  status: SiteUpdateStatus;
  createdAt: string;
  createdById: string;
  createdByName: string;
  approvedAt?: string | null;
  approvedById?: string | null;
  approvedByName?: string | null;
  publishedAt?: string | null;
  publishedById?: string | null;
  publishedByName?: string | null;
  discordMessageId?: string | null;
  discordChannelId?: string | null;
  discordSentAt?: string | null;
  discordError?: string | null;
  discordAttemptAt?: string | null;
}
