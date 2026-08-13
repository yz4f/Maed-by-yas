export type RoleType = 'Boss' | 'Co-Boss' | 'Admin' | 'Member' | 'Customer';
export type ProductStatus = 'Active' | 'Inactive' | 'Suspended';
export type KeyDuration = 'Lifetime' | '30 Days' | '7 Days';

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


export type TicketStatus = 'open' | 'in_progress' | 'awaiting_user' | 'awaiting_staff' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
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
  type: 'created' | 'claimed' | 'status_changed' | 'priority_changed' | 'assigned' | 'message' | 'note' | 'attachment' | 'closed' | 'reopened';
  actorId: string;
  actorName: string;
  message: string;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  number: string;
  title: string;
  category: TicketCategory;
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
  closedAt?: string | null;
  closedById?: string | null;
  closedByName?: string | null;
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
