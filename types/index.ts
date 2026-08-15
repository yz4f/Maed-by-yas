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
  type: 'created' | 'claimed' | 'status_changed' | 'priority_changed' | 'assigned' | 'message' | 'note' | 'attachment' | 'resolved' | 'closed' | 'reopened';
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
  slaDueAt?: string | null;
  messageCount: number;
}

export interface TicketDetail {
  ticket: SupportTicket;
  messages: TicketMessage[];
  timeline: TicketTimelineEvent[];
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
