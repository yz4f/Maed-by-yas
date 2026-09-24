export type AudienceUser = { isBanned?: boolean; isArchived?: boolean; lastLogin?: string | null };
export type AnnouncementReadReceipt = { announcementId: string; announcementUpdatedAt?: string; readAt?: string | null };

export function shouldCountAnnouncementRead(receipt: AnnouncementReadReceipt | null, currentUpdatedAt: string) {
  return !receipt?.readAt || receipt.announcementUpdatedAt !== currentUpdatedAt;
}

export function isEligibleAnnouncementRecipient(user: AudienceUser) {
  return !user.isBanned && !user.isArchived;
}

export function hasRecentAnnouncementActivity(user: AudienceUser, now = Date.now()) {
  if (!user.lastLogin) return false;
  const lastLogin = Date.parse(user.lastLogin);
  return Number.isFinite(lastLogin) && lastLogin <= now && now - lastLogin <= 30 * 86400_000;
}
