type UserMetric = { lastLogin?: string | null; isBanned?: boolean; isArchived?: boolean };
type KeyMetric = { isUsed: boolean; usedAt?: string | null };
type LicenseMetric = { status: string; expiresAt?: string | null };

export function getDashboardMetrics(users: UserMetric[], keys: KeyMetric[], licenses: LicenseMetric[], now = Date.now()) {
  const today = new Date(now).toISOString().slice(0, 10);
  const activeUsers = users.filter((user) => {
    if (user.isBanned || user.isArchived || !user.lastLogin) return false;
    const lastLogin = new Date(user.lastLogin).getTime();
    return Number.isFinite(lastLogin) && lastLogin <= now && now - lastLogin <= 30 * 24 * 60 * 60 * 1000;
  }).length;
  const activeKeys = licenses.filter((license) => license.status === 'Active' && (!license.expiresAt || new Date(license.expiresAt).getTime() > now)).length;
  const expiredKeys = licenses.filter((license) => license.status === 'Expired' || (Boolean(license.expiresAt) && new Date(license.expiresAt!).getTime() <= now)).length;
  const todayActivations = keys.filter((key) => key.isUsed && key.usedAt?.slice(0, 10) === today).length;
  return { activeUsers, activeKeys, expiredKeys, todayActivations };
}

type RecentUser = { id: string; name: string; discordId: string; createdAt: string; isBanned?: boolean; isArchived?: boolean };
type RecentKey = { id: string; productId: string; productName?: string; isUsed: boolean; usedAt?: string | null; usedByUserId?: string | null; usedByUserName?: string | null };
type RecentProduct = { id: string; name: string };

export function getRecentDashboardRecords(users: RecentUser[], keys: RecentKey[], products: RecentProduct[], limit = 5) {
  const boundedLimit = Math.min(Math.max(Math.trunc(limit), 0), 20);
  const usersById = new Map(users.map((user) => [user.id, user]));
  const productsById = new Map(products.map((product) => [product.id, product]));
  const recentUsers = users
    .filter((user) => !user.isArchived && Number.isFinite(Date.parse(user.createdAt)))
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, boundedLimit)
    .map(({ id, name, discordId, createdAt }) => ({ id, name, discordId, createdAt }));
  const recentActivations = keys
    .filter((key) => key.isUsed && Boolean(key.usedAt) && Number.isFinite(Date.parse(key.usedAt!)))
    .sort((a, b) => Date.parse(b.usedAt!) - Date.parse(a.usedAt!))
    .slice(0, boundedLimit)
    .map((key) => ({
      id: key.id,
      userName: key.usedByUserName || usersById.get(key.usedByUserId || '')?.name || '—',
      productName: key.productName || productsById.get(key.productId)?.name || key.productId,
      activatedAt: key.usedAt!,
    }));
  return { recentUsers, recentActivations };
}
