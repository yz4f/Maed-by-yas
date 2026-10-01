import { AuditEvent, Product, Key, KeyStatus, User, UserProduct, DownloadLog, SystemLog, SystemStats, ProductStatus, FaqCategory, FaqItem, FaqSearchLog, FaqStats } from '@/types';
import { computeLicenseExpiresAt, isLicenseCurrentlyActive, normalizeKeyDuration } from '@/lib/license-duration';
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, setDoc, updateDoc, deleteDoc, query, where, getDoc, orderBy, limit, writeBatch, runTransaction, increment } from "firebase/firestore";


// Safe dynamic imports for Server-side filesystem operations
let fs: any;
let path: any;
if (typeof window === 'undefined') {
  fs = require('fs');
  path = require('path');
}

const firebaseConfig = {
  apiKey: "AIzaSyDrMw5gxptqdancpaoSu2Mg0_C1DcSVqn8",
  authDomain: "tnnn-aa170.firebaseapp.com",
  projectId: "tnnn-aa170",
  storageBucket: "tnnn-aa170.firebasestorage.app",
  messagingSenderId: "540085648299",
  appId: "1:540085648299:web:9451081f61c38cf45270ee",
  measurementId: "G-R2CHP04HTE"
};

let app: any = null;
let db: any = null;

function getDb() {
  if (!db) {
    try {
      app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
      db = getFirestore(app);
    } catch (err) {}
  }
  return db;
}

export { getDb as db };

export type KeyStockSummary = {
  total: number;
  available: number;
  used: number;
  disabled: number;
  reserved: number;
  archived: number;
  duplicateCodes: number;
};

export function resolveKeyStatus(key: Key): KeyStatus {
  if (key.status) return key.status;
  if (key.isUsed) return 'used';
  if (key.isDisabled || key.isArchived) return 'disabled';
  return 'available';
}

/**
 * المصدر الوحيد لعداد المخزون: مفتاح متاح يعني أنه غير مستخدم أو معطّل أو مؤرشف
 * ولا يتشارك نفس الكود مع مفتاح آخر، لأن الأكواد المكررة لا تكون آمنة للتفعيل.
 */
export function getKeyStockSummary(keys: Key[]): KeyStockSummary {
  const codeFrequency = new Map<string, number>();
  for (const key of keys) {
    const normalized = (key.key || '').trim().toUpperCase();
    if (normalized) codeFrequency.set(normalized, (codeFrequency.get(normalized) || 0) + 1);
  }

  let total = keys.length;
  let available = 0;
  let used = 0;
  let disabled = 0;
  let reserved = 0;
  let archived = 0;

  for (const key of keys) {
    const st = resolveKeyStatus(key);
    if (st === 'used') used++;
    else if (st === 'disabled') disabled++;
    else if (st === 'reserved') reserved++;
    else if (st === 'available') {
      const normalized = (key.key || '').trim().toUpperCase();
      if (normalized && !key.isArchived && codeFrequency.get(normalized) === 1) {
        available++;
      } else {
        disabled++;
      }
    }
    if (key.isArchived) archived++;
  }

  const duplicateCodes = Array.from(codeFrequency.values()).filter((count) => count > 1).length;

  return {
    total,
    available,
    used,
    disabled,
    reserved,
    archived,
    duplicateCodes,
  };
}

// All newly redeemed product licenses are valid for exactly 48 hours from the activation transaction.
export const PRODUCT_LICENSE_DURATION_MS = 2 * 24 * 60 * 60 * 1000;

export const DISCORD_ROLES = {
  BOSS: '1396965033316978839',
  CO_BOSS: '1510079414422212659',
  CUSTOMER: '1397221350095192074',
  PERM: '1500092886467870720',
  FORTNITE: '1483330317040484364',
  MEMBER: '1422761753573593088',
};

export const initialProducts: Product[] = [
  {
    id: 'prod-fortnite',
    name: 'فك باند فورت نايت',
    description: 'سبوفر فورت نايت الاحترافي الدائم - فك حظر الهاردوير (HWID) وتخطي أنظمة الحماية Easy Anti-Cheat و BattlEye بسرعة فائقة وبدون إعادة تهيئة النظام.',
    image: '/fortnite-unban-logo.png',
    cardColor: 'blue',
    category: 'Spoofer',
    displayOrder: 1,
    version: 'v3.5.2',
    fileSize: '24.8 MB',
    fileUrl: '/discord.gg_t3n.rar',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    guideUrl: 'https://discord.gg/t3n',
    downloadsCount: 1420,
    isVisible: true,
    isDisabled: false,
    isArchived: false,
    createdAt: new Date('2026-01-15').toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-hwid-master',
    name: 'سبوفر بيرم',
    description: 'ترخيص مدى الحياة لمنتج سبوفر تعن (Cleaner + Registry Eraser + MAC Changer + SMBIOS Rewriter).',
    image: '/spoofer-logo.png',
    cardColor: 'purple',
    category: 'PERM',
    displayOrder: 2,
    version: 'v4.1.0',
    fileSize: '100 MB',
    fileUrl: '/discord.gg_t3n.rar',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    guideUrl: 'https://discord.gg/t3n',
    downloadsCount: 2310,
    isVisible: true,
    isDisabled: false,
    isArchived: false,
    createdAt: new Date('2026-03-01').toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

export const initialFaqCategories: FaqCategory[] = [
  {
    id: 'cat-keys',
    name_ar: 'المفاتيح والتفعيل',
    name_en: 'Keys & Activation',
    description_ar: 'كل ما يتعلق بتفعيل المفاتيح وحالتها والمدة المتبقية.',
    description_en: 'Everything related to key activation, status, and duration.',
    icon: 'KeyRound',
    sort_order: 1,
    is_active: true,
    createdAt: new Date('2026-03-01').toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cat-products',
    name_ar: 'المنتجات والشروحات',
    name_en: 'Products & Guides',
    description_ar: 'شروحات المنتجات، اللودرات، وروابط التنزيل المباشرة.',
    description_en: 'Product guides, loaders, and direct download links.',
    icon: 'Package',
    sort_order: 2,
    is_active: true,
    createdAt: new Date('2026-03-01').toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cat-troubleshoot',
    name_ar: 'المشاكل الشائعة والحلول',
    name_en: 'Troubleshooting & Fixes',
    description_ar: 'حلول مشاكل Spoofer، أخطاء التشغيل، وملفات C++ Runtime.',
    description_en: 'Fixes for Spoofer issues, runtime errors, and Visual C++ libraries.',
    icon: 'Wrench',
    sort_order: 3,
    is_active: true,
    createdAt: new Date('2026-03-01').toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cat-account',
    name_ar: 'الحساب والأمان',
    name_en: 'Account & Security',
    description_ar: 'إدارة الحساب، الرستات، ورتب ديسكورد التلقائية.',
    description_en: 'Account security, key resets, and automated Discord roles.',
    icon: 'Shield',
    sort_order: 4,
    is_active: true,
    createdAt: new Date('2026-03-01').toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const initialFaqs: FaqItem[] = [];

// Older deployments may still have these sample records in Firestore or the local fallback.
// Keep them out of customer and admin reads without deleting any real FAQ created later.
const legacySampleFaqIds = new Set([
  'faq-activate-key',
  'faq-product-guide',
  'faq-spoofer-error',
  'faq-find-key',
  'faq-hwid-reset',
  'faq-discord-role',
  'faq-download-expired',
  'faq-key-duration',
]);
const isCurrentFaq = (faq: FaqItem) => !legacySampleFaqIds.has(faq.id);

// The JSON fallback is strictly a local-development aid. Production must never silently
// switch to ephemeral filesystem storage because a Railway redeploy can discard it.
const allowLocalFallback = process.env.NODE_ENV !== 'production' && process.env.ALLOW_LOCAL_DB_FALLBACK !== 'false';
let useLocalFallback = false;
const fallbackFilePath = typeof window === 'undefined' ? path.join(process.cwd(), 'data', 'db-fallback.json') : '';

function getFallbackData() {
  if (typeof window !== 'undefined') return { products: initialProducts, users: [], userProducts: [], keys: [], logs: [] };
  try {
    if (!fs.existsSync(path.dirname(fallbackFilePath))) {
      fs.mkdirSync(path.dirname(fallbackFilePath), { recursive: true });
    }
    if (!fs.existsSync(/* turbopackIgnore: true */ fallbackFilePath)) {
      const initialData = {
        products: initialProducts,
        users: [
          {
            id: 'user-demo-customer',
            discordId: '1397221350095192074',
            name: 'Demo Customer',
            email: 'customer@t3n-store.com',
            image: 'https://cdn.discordapp.com/embed/avatars/1.png',
            role: 'Customer',
            discordRoles: [],
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            lastIp: '127.0.0.1',
            isBanned: false,
            warningCount: 0,
            warningMessage: null
          },
          {
            id: 'user-demo-admin',
            discordId: '1396965033316978839',
            name: 'Demo Admin',
            email: 'boss@t3n-store.com',
            image: 'https://cdn.discordapp.com/embed/avatars/2.png',
            role: 'Boss',
            discordRoles: [],
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            lastIp: '127.0.0.1',
            isBanned: false,
            warningCount: 0,
            warningMessage: null
          }
        ],
        userProducts: [
          {
            id: 'up-demo-1',
            userId: 'user-demo-customer',
            productId: 'prod-fortnite',
            status: 'active',
            activatedAt: new Date().toISOString(),
            expiresAt: null
          }
        ],
        keys: [
          {
            id: 'key-demo-1',
            key: 'KEY-T3N-FORT-DEMO-PERM',
            productId: 'prod-fortnite',
            productName: 'فك باند فورت نايت',
            duration: '2 Days',
            isUsed: false,
            usedByUserId: null,
            usedByUserName: null,
            usedAt: null,
            createdAt: new Date().toISOString()
          },
          {
            id: 'key-demo-2',
            key: 'KEY-T3N-SPOOF-DEMO-PERM',
            productId: 'prod-hwid-master',
            productName: 'سبوفر بيرم',
            duration: 'Lifetime',
            isUsed: false,
            usedByUserId: null,
            usedByUserName: null,
            usedAt: null,
            createdAt: new Date().toISOString()
          }
        ],
        logs: [
          {
            id: 'log-1',
            action: 'System Initialized',
            details: 'تم بدء تشغيل نظام قاعدة البيانات الاحتياطية بنجاح.',
            userId: 'system',
            userName: 'T3N System',
            ipAddress: '127.0.0.1',
            createdAt: new Date().toISOString()
          }
        ],
        faqCategories: initialFaqCategories,
        faqs: initialFaqs,
        faqSearchLogs: []
      };
      fs.writeFileSync(fallbackFilePath, JSON.stringify(initialData, null, 2), 'utf8');
      return initialData;
    }
    const raw = fs.readFileSync(/* turbopackIgnore: true */ fallbackFilePath, 'utf8');
    const parsed = JSON.parse(raw);
    if (!parsed.faqCategories || !Array.isArray(parsed.faqCategories) || parsed.faqCategories.length === 0) {
      parsed.faqCategories = initialFaqCategories;
    }
    if (!parsed.faqs || !Array.isArray(parsed.faqs) || parsed.faqs.length === 0) {
      parsed.faqs = initialFaqs;
    }
    if (!parsed.faqSearchLogs || !Array.isArray(parsed.faqSearchLogs)) {
      parsed.faqSearchLogs = [];
    }
    return parsed;
  } catch (err) {
    console.error("Failed to read fallback database file:", err);
    return { products: initialProducts, users: [], userProducts: [], keys: [], logs: [], faqCategories: initialFaqCategories, faqs: initialFaqs, faqSearchLogs: [] };
  }
}

function saveFallbackData(data: any) {
  if (typeof window !== 'undefined') return;
  try {
    if (!fs.existsSync(path.dirname(fallbackFilePath))) {
      fs.mkdirSync(path.dirname(fallbackFilePath), { recursive: true });
    }
    fs.writeFileSync(fallbackFilePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error("Failed to write to fallback database file:", err);
  }
}

// Database helper wrapper
async function runDbOp<T>(firebaseOp: () => Promise<T>, localOp: () => T | Promise<T>): Promise<T> {
  if (useLocalFallback) {
    if (!allowLocalFallback) {
      throw new Error('خدمة البيانات الدائمة غير متاحة حالياً. لم يتم استخدام أي تخزين مؤقت في الإنتاج.');
    }
    return await localOp();
  }

  try {
    return await firebaseOp();
  } catch (err: any) {
    const detail = err?.message || String(err);
    if (!allowLocalFallback || detail.includes('OUT_OF_STOCK')) {
      throw err;
    }

    console.warn('Firestore access error in local development; using the local development fallback:', detail);
    useLocalFallback = true;
    return await localOp();
  }
}

const LocalDB = {
  getProducts(): Product[] {
    const d = getFallbackData();
    return d.products.sort((a: any, b: any) => a.displayOrder - b.displayOrder);
  },
  getProductById(id: string): Product | undefined {
    const d = getFallbackData();
    return d.products.find((p: any) => p.id === id);
  },
  createProduct(product: Product): {success: boolean; product?: Product} {
    const d = getFallbackData();
    if (!d.products.some((p: any) => p.id === product.id)) {
      d.products.push(product);
      saveFallbackData(d);
    }
    return { success: true, product };
  },
  updateProduct(id: string, updates: Partial<Product>): {success: boolean, product?: Product} {
    const d = getFallbackData();
    const idx = d.products.findIndex((p: any) => p.id === id);
    if (idx !== -1) {
      d.products[idx] = { ...d.products[idx], ...updates, updatedAt: new Date().toISOString() };
      saveFallbackData(d);
      return { success: true, product: d.products[idx] };
    }
    return { success: false };
  },
  deleteProduct(id: string): {success: boolean} {
    const d = getFallbackData();
    const product = d.products.find((p: any) => p.id === id);
    if (!product) return { success: false };
    Object.assign(product, {
      isArchived: true,
      isDisabled: true,
      isVisible: false,
      archivedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    saveFallbackData(d);
    return { success: true };
  },
  getUsers(): User[] {
    const d = getFallbackData();
    return d.users;
  },
  getUserByDiscordId(discordId: string): User | undefined {
    const d = getFallbackData();
    return d.users.find((u: any) => u.discordId === discordId);
  },
  createUser(user: User): void {
    const d = getFallbackData();
    if (!d.users.some((u: any) => u.id === user.id)) {
      d.users.push(user);
      saveFallbackData(d);
    }
  },
  updateUser(id: string, updates: Partial<User>): void {
    const d = getFallbackData();
    const idx = d.users.findIndex((u: any) => u.id === id);
    if (idx !== -1) {
      d.users[idx] = { ...d.users[idx], ...updates };
      saveFallbackData(d);
    }
  },
  deleteUser(id: string): boolean {
    const d = getFallbackData();
    const user = d.users.find((item: any) => item.id === id);
    if (!user) return false;
    Object.assign(user, {
      isArchived: true,
      archivedAt: new Date().toISOString(),
      isBanned: true,
      banReason: 'تمت أرشفة الحساب إدارياً',
      banType: 'permanent',
      banExpiresAt: null,
    });
    saveFallbackData(d);
    return true;
  },
  getKeys(): Key[] {
    const d = getFallbackData();
    return d.keys;
  },
  getKeysByProduct(productId: string): Key[] {
    const d = getFallbackData();
    return d.keys.filter((k: any) => k.productId === productId);
  },
  generateKeys(productId: string, count: number, prefix: string, createdById: string, duration?: unknown): {success: boolean, keys: string[]} {
    const d = getFallbackData();
    const product = d.products.find((p: any) => p.id === productId);
    if (!product) return { success: false, keys: [] };
    const licenseDuration = normalizeKeyDuration(duration);
    const generatedKeys: string[] = [];
    for (let i = 0; i < count; i++) {
      const randomPart = Math.random().toString(36).substring(2, 10).toUpperCase();
      const keyString = `${prefix}-${randomPart}`;
      const newKey: Key = {
        id: `key-${Date.now()}-${i}`,
        key: keyString,
        productId,
        isUsed: false,
        isDisabled: false,
        isArchived: false,
        duration: licenseDuration,
        createdById,
        createdAt: new Date().toISOString()
      };
      d.keys.push(newKey);
      generatedKeys.push(keyString);
    }
    saveFallbackData(d);
    this.addLog('Key Creation', `تم إنشاء ${count} مفاتيح للمنتج ${product.name}`, createdById, 'Admin');
    return { success: true, keys: generatedKeys };
  },
  bulkAddKeys(productId: string, rawKeysText: string, createdById: string, duration?: unknown): {success: boolean, count: number, skipped: number, message?: string} {
    const d = getFallbackData();
    if (!d.products.some((product: Product) => product.id === productId)) {
      return { success: false, count: 0, skipped: 0, message: 'المنتج المطلوب غير موجود.' };
    }

    const licenseDuration = normalizeKeyDuration(duration);
    const lines = rawKeysText.split(/[\n,]+/).map(l => l.trim()).filter(l => l.length > 0);
    const activeCodes = new Set(d.keys.filter((key: Key) => !key.isArchived || key.isUsed).map((key: Key) => key.key.trim().toUpperCase()));
    const reusableByCode = new Map<string, Key>(d.keys.filter((key: Key) => key.isArchived && !key.isUsed).map((key: Key): [string, Key] => [key.key.trim().toUpperCase(), key]));
    const acceptedCodes: string[] = [];
    const reusableKeys: Key[] = [];
    let skipped = 0;
    for (const keyString of lines) {
      const normalized = keyString.toUpperCase();
      const isDuplicate = activeCodes.has(normalized);
      if (isDuplicate) {
        skipped++;
      }
      const reusableKey = !isDuplicate ? reusableByCode.get(normalized) : null;
      if (reusableKey) reusableKeys.push(reusableKey);
      else acceptedCodes.push(keyString);
      activeCodes.add(normalized);
    }
    const createdAt = new Date().toISOString();
    reusableKeys.forEach((key) => Object.assign(key, {
      productId,
      duration: licenseDuration,
      isUsed: false,
      isDisabled: false,
      isArchived: false,
      archivedAt: null,
      createdById,
      restoredAt: createdAt,
    }));
    acceptedCodes.forEach((keyString, index) => {
      d.keys.push({
        id: `key-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 7)}`,
        key: keyString,
        productId,
        isUsed: false,
        isDisabled: false,
        isArchived: false,
        duration: licenseDuration,
        createdById,
        createdAt
      } as Key);
    });

    if (acceptedCodes.length > 0 || reusableKeys.length > 0) saveFallbackData(d);
    return { success: true, count: acceptedCodes.length + reusableKeys.length, skipped };
  },
  updateKey(id: string, updates: Partial<Key>): boolean {
    const d = getFallbackData();
    const idx = d.keys.findIndex((k: any) => k.id === id);
    if (idx !== -1) {
      d.keys[idx] = { ...d.keys[idx], ...updates };
      saveFallbackData(d);
      return true;
    }
    return false;
  },
  deleteKey(id: string): boolean {
    const d = getFallbackData();
    const key = d.keys.find((item: Key) => item.id === id);
    if (!key) return false;
    Object.assign(key, {
      isArchived: true,
      isDisabled: true,
      archivedAt: new Date().toISOString(),
    });
    saveFallbackData(d);
    return true;
  },
  revokeKey(keyId: string, userId: string): boolean {
    const d = getFallbackData();
    const now = new Date().toISOString();
    const key = d.keys.find((item: Key) => item.id === keyId);
    if (!key) return false;
    Object.assign(key, {
      isArchived: true,
      isDisabled: true,
      isRevoked: true,
      revokedAt: now,
      archivedAt: now,
    });
    d.userProducts
      .filter((item: UserProduct) => item.userId === userId && item.keyId === keyId)
      .forEach((item: UserProduct) => Object.assign(item, { status: 'Revoked', revokedAt: now }));
    saveFallbackData(d);
    return true;
  },
  deleteAllKeysForProduct(productId: string): number {
    const d = getFallbackData();
    const removableKeys = d.keys.filter((key: Key) => key.productId === productId && !key.isUsed);
    if (removableKeys.length === 0) return 0;
    const archivedAt = new Date().toISOString();
    removableKeys.forEach((key: Key) => Object.assign(key, { isArchived: true, isDisabled: true, archivedAt }));
    saveFallbackData(d);
    return removableKeys.length;
  },
  getProductStockPaginated(params: {
    productId: string;
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    sort?: 'newest' | 'oldest';
  }): {
    success: boolean;
    keys: Key[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    stockSummary: KeyStockSummary;
  } {
    const d = getFallbackData();
    const productKeys = d.keys.filter((k: Key) => k.productId === params.productId && !k.isArchived);
    const stockSummary = getKeyStockSummary(productKeys);

    let filtered = [...productKeys];

    if (params.status && params.status !== 'all') {
      filtered = filtered.filter((k: Key) => resolveKeyStatus(k) === params.status);
    }

    if (params.search && params.search.trim()) {
      const q = params.search.trim().toLowerCase();
      filtered = filtered.filter((k: Key) => {
        const keyMatch = (k.key || '').toLowerCase().includes(q);
        const orderMatch = (k.orderId || '').toLowerCase().includes(q);
        const custMatch = (k.customerId || '').toLowerCase().includes(q) || (k.customerName || '').toLowerCase().includes(q) || (k.usedByUserName || '').toLowerCase().includes(q);
        const statusMatch = resolveKeyStatus(k).toLowerCase().includes(q);
        return keyMatch || orderMatch || custMatch || statusMatch;
      });
    }

    const isOldest = params.sort === 'oldest';
    filtered.sort((a: Key, b: Key) => {
      const timeA = new Date(a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || 0).getTime();
      return isOldest ? timeA - timeB : timeB - timeA;
    });

    const total = filtered.length;
    const limitNum = Math.max(1, params.limit || 20);
    const totalPages = Math.ceil(total / limitNum) || 1;
    const pageNum = Math.max(1, Math.min(params.page || 1, totalPages));
    const offset = (pageNum - 1) * limitNum;
    const paginated = filtered.slice(offset, offset + limitNum).map((k: Key) => ({
      ...k,
      status: resolveKeyStatus(k)
    }));

    return {
      success: true,
      keys: paginated,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
      stockSummary
    };
  },

  addSingleKey(productId: string, keyString: string, createdById: string, duration?: unknown, allowDuplicates: boolean = true): { success: boolean; key?: Key; message?: string } {
    const d = getFallbackData();
    const product = d.products.find((p: Product) => p.id === productId);
    if (!product) return { success: false, message: 'المنتج غير موجود.' };

    const cleanKey = (keyString || '').trim();
    if (!cleanKey) return { success: false, message: 'كود المفتاح لا يمكن أن يكون فارغاً.' };

    const normalized = cleanKey.toUpperCase();
    const existing = d.keys.find((k: Key) => (!k.isArchived || k.isUsed) && (k.key || '').trim().toUpperCase() === normalized);
    if (existing && !allowDuplicates) {
      return { success: false, message: 'هذا المفتاح موجود بالفعل في المخزون.' };
    }

    const licenseDuration = normalizeKeyDuration(duration);
    const now = new Date().toISOString();
    const newKey: Key = {
      id: `key-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      key: cleanKey,
      productId,
      productName: product.name,
      status: 'available',
      isUsed: false,
      isDisabled: false,
      isArchived: false,
      duration: licenseDuration,
      createdById,
      createdAt: now,
      updatedAt: now,
    };

    d.keys.push(newKey);
    saveFallbackData(d);
    return { success: true, key: newKey, message: 'تمت إضافة المفتاح بنجاح.' };
  },

  bulkAddKeysStructured(productId: string, keys: string[], createdById: string, duration?: unknown, allowDuplicates: boolean = true): { success: boolean; inserted: number; duplicates: number; invalid: number; message?: string } {
    const d = getFallbackData();
    const product = d.products.find((p: Product) => p.id === productId);
    if (!product) return { success: false, inserted: 0, duplicates: 0, invalid: 0, message: 'المنتج غير موجود.' };

    const licenseDuration = normalizeKeyDuration(duration);
    const existingActiveCodes = new Set(
      d.keys
        .filter((k: Key) => !k.isArchived || k.isUsed)
        .map((k: Key) => (k.key || '').trim().toUpperCase())
    );

    const reusableByCode = new Map<string, Key>(
      d.keys
        .filter((k: Key) => k.isArchived && !k.isUsed)
        .map((k: Key): [string, Key] => [(k.key || '').trim().toUpperCase(), k])
    );

    let inserted = 0;
    let duplicates = 0;
    let invalid = 0;
    const seenInInput = new Set<string>();
    const now = new Date().toISOString();

    for (const raw of keys) {
      const trimmed = (raw || '').trim();
      if (!trimmed) {
        invalid++;
        continue;
      }
      const normalized = trimmed.toUpperCase();
      const isDuplicate = seenInInput.has(normalized) || existingActiveCodes.has(normalized);
      if (isDuplicate) {
        duplicates++;
        if (!allowDuplicates) {
          continue;
        }
      }

      seenInInput.add(normalized);
      const reusable = !isDuplicate ? reusableByCode.get(normalized) : null;
      if (reusable) {
        Object.assign(reusable, {
          productId,
          productName: product.name,
          duration: licenseDuration,
          status: 'available',
          isUsed: false,
          isDisabled: false,
          isArchived: false,
          archivedAt: null,
          createdById,
          restoredAt: now,
          updatedAt: now,
        });
      } else {
        d.keys.push({
          id: `key-${Date.now()}-${inserted}-${Math.random().toString(36).slice(2, 7)}`,
          key: trimmed,
          productId,
          productName: product.name,
          status: 'available',
          isUsed: false,
          isDisabled: false,
          isArchived: false,
          duration: licenseDuration,
          createdById,
          createdAt: now,
          updatedAt: now,
        });
      }
      existingActiveCodes.add(normalized);
      inserted++;
    }

    if (inserted > 0) saveFallbackData(d);
    return {
      success: true,
      inserted,
      duplicates,
      invalid,
      message: inserted > 0 ? `تمت إضافة ${inserted} مفتاحاً بنجاح.` : 'لم تتم إضافة أي مفاتيح جديدة.'
    };
  },

  setKeyStatus(keyId: string, status: KeyStatus): { success: boolean; key?: Key; message?: string } {
    const d = getFallbackData();
    const key = d.keys.find((k: Key) => k.id === keyId);
    if (!key) return { success: false, message: 'المفتاح غير موجود.' };

    const now = new Date().toISOString();
    if (status === 'available') {
      if (key.isUsed) return { success: false, message: 'لا يمكن تفعيل مفتاح مستخدم بالفعل.' };
      key.status = 'available';
      key.isDisabled = false;
      key.disabledAt = null;
    } else if (status === 'disabled') {
      key.status = 'disabled';
      key.isDisabled = true;
      key.disabledAt = now;
    } else if (status === 'reserved') {
      if (key.isUsed) return { success: false, message: 'لا يمكن حجز مفتاح مستخدم بالفعل.' };
      key.status = 'reserved';
    } else if (status === 'used') {
      key.status = 'used';
      key.isUsed = true;
      if (!key.usedAt) key.usedAt = now;
    }
    key.updatedAt = now;
    saveFallbackData(d);
    return { success: true, key, message: 'تم تحديث حالة المفتاح بنجاح.' };
  },

  deleteKeySafely(keyId: string): { success: boolean; wasDisabledInstead: boolean; message: string } {
    const d = getFallbackData();
    const key = d.keys.find((k: Key) => k.id === keyId);
    if (!key) return { success: false, wasDisabledInstead: false, message: 'المفتاح غير موجود.' };

    const now = new Date().toISOString();
    if (key.isUsed || key.status === 'used') {
      key.status = 'disabled';
      key.isDisabled = true;
      key.disabledAt = now;
      key.updatedAt = now;
      saveFallbackData(d);
      return {
        success: true,
        wasDisabledInstead: true,
        message: 'المفتاح مستخدم في طلب سابق، لذلك تم تعطيله وحفظه بدلاً من حذفه لضمان سلامة السجلات.'
      };
    }

    key.isArchived = true;
    key.isDisabled = true;
    key.archivedAt = now;
    key.updatedAt = now;
    saveFallbackData(d);
    return {
      success: true,
      wasDisabledInstead: false,
      message: 'تم حذف المفتاح من المخزون بنجاح.'
    };
  },

  assignKeyToOrder(params: { productId: string; orderId: string; customerId: string; customerName?: string }): { success: boolean; key?: Key; message?: string } {
    const d = getFallbackData();
    const availableKey = d.keys.find((k: Key) => 
      k.productId === params.productId &&
      !k.isArchived &&
      !k.isUsed &&
      !k.isDisabled &&
      (k.status === 'available' || !k.status)
    );

    if (!availableKey) {
      return { success: false, message: 'لا يوجد مخزون متاح لهذا المنتج.' };
    }

    const now = new Date().toISOString();
    availableKey.status = 'used';
    availableKey.isUsed = true;
    availableKey.orderId = params.orderId;
    availableKey.customerId = params.customerId;
    availableKey.customerName = params.customerName || null;
    availableKey.usedByUserId = params.customerId;
    availableKey.usedByUserName = params.customerName || null;
    availableKey.usedAt = now;
    availableKey.updatedAt = now;

    saveFallbackData(d);
    return { success: true, key: availableKey, message: 'تم تخصيص المفتاح للطلب بنجاح.' };
  },
  activateProductWithKey(keyString: string, userDetails: { discordId: string, name: string, email?: string, image?: string }, ipAddress: string): { success: true; message: string; product: Product } | { success: false; message: string; product?: undefined } {
    const d = getFallbackData();
    const keyIdx = d.keys.findIndex((k: any) => k.key === keyString);
    if (keyIdx === -1) return { success: false, message: 'المفتاح غير صحيح أو غير موجود' };
    const keyObj = d.keys[keyIdx];
    if (keyObj.isUsed) return { success: false, message: 'المفتاح مستخدم مسبقاً' };
    if (keyObj.isDisabled) return { success: false, message: 'المفتاح معطل من قبل الإدارة' };
    
    const product = d.products.find((p: any) => p.id === keyObj.productId);
    if (!product || product.isDisabled) return { success: false, message: 'المنتج المرتبط غير متاح' };

    let userIdx = d.users.findIndex((u: any) => u.discordId === userDetails.discordId);
    let user;
    if (userIdx === -1) {
      user = {
        id: `user-${Date.now()}`,
        discordId: userDetails.discordId,
        name: userDetails.name,
        email: userDetails.email,
        image: userDetails.image,
        role: 'Customer',
        discordRoles: [DISCORD_ROLES.CUSTOMER],
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        lastIp: ipAddress,
        isBanned: false,
        warningCount: 0,
        warningMessage: null
      };
      d.users.push(user);
    } else {
      d.users[userIdx] = { ...d.users[userIdx], lastLogin: new Date().toISOString(), lastIp: ipAddress };
      user = d.users[userIdx];
    }

    const alreadyActivated = d.userProducts.some((item: UserProduct) =>
      item.userId === user.id && item.productId === product.id && isLicenseCurrentlyActive(item)
    );
    if (alreadyActivated) return { success: false, message: 'لديك هذا المنتج مفعّل بالفعل' };

    const usedAt = new Date().toISOString();
    d.keys[keyIdx].isUsed = true;
    d.keys[keyIdx].usedByUserId = user.id;
    d.keys[keyIdx].usedAt = usedAt;

    const userProduct: UserProduct = {
      id: `up-${Date.now()}`,
      userId: user.id,
      productId: product.id,
      keyId: keyObj.id,
      keyString: keyObj.key,
      status: 'Active',
      activatedAt: usedAt,
      expiresAt: computeLicenseExpiresAt(usedAt, keyObj.duration),
      discordRoleGranted: true
    };
    d.userProducts.push(userProduct);
    saveFallbackData(d);

    this.addLog('Key Activation', `تم تفعيل مفتاح ${product.name}`, user.id, user.name, ipAddress);
    return { success: true, message: 'تم التفعيل بنجاح', product };
  },
  getUserDetails(userId: string): {user: User, products: UserProduct[]} | undefined {
    const d = getFallbackData();
    const user = d.users.find((u: any) => u.id === userId);
    if (!user) return undefined;
    const products = this.getUserProducts(userId);
    return { user, products };
  },
  getUserProducts(userId: string): UserProduct[] {
    const d = getFallbackData();
    const result: UserProduct[] = [];
    const ups = d.userProducts.filter((up: any) => up.userId === userId);
    for (const up of ups) {
      if (up.keyId && !up.keyString) {
        const keyObj = d.keys.find((k: any) => k.id === up.keyId);
        if (keyObj) up.keyString = keyObj.key;
      }
      const p = d.products.find((prod: any) => prod.id === up.productId);
      if (p) {
        up.product = p;
        result.push(up);
      }
    }
    return result;
  },
  resetUserProductHwid(userId: string, productId: string): {success: boolean; message?: string; resetAt?: string} {
    const d = getFallbackData();
    const product = d.userProducts.find((item: UserProduct) => item.userId === userId && item.productId === productId && item.status === 'Active');
    if (!product) return { success: false, message: 'لا يوجد ترخيص نشط لهذا المنتج.' };

    const resetAt = new Date().toISOString();
    product.hwidResetAt = resetAt;
    product.hwidResetCount = (product.hwidResetCount || 0) + 1;
    saveFallbackData(d);
    this.addLog('HWID Reset', `تمت إعادة تعيين ربط الجهاز للمنتج ${productId}`, userId, 'Customer');
    return { success: true, resetAt };
  },
  removeProductFromUser(userId: string, productId: string): {success: boolean} {
    const d = getFallbackData();
    d.userProducts = d.userProducts.filter((up: any) => !(up.userId === userId && up.productId === productId));
    saveFallbackData(d);
    return { success: true };
  },
  addProductToUser(userId: string, productId: string): {success: boolean} {
    const d = getFallbackData();
    const userProduct: UserProduct = {
      id: `up-${Date.now()}`,
      userId,
      productId,
      status: 'Active',
      activatedAt: new Date().toISOString(),
      expiresAt: computeLicenseExpiresAt(new Date().toISOString(), '2 Days'),
      discordRoleGranted: false
    };
    d.userProducts.push(userProduct);
    saveFallbackData(d);
    return { success: true };
  },
  updateUserProductStatus(userId: string, productId: string, status: ProductStatus): {success: boolean} {
    const d = getFallbackData();
    const idx = d.userProducts.findIndex((up: any) => up.userId === userId && up.productId === productId);
    if (idx !== -1) {
      d.userProducts[idx].status = status;
      saveFallbackData(d);
      return { success: true };
    }
    return { success: false };
  },
  addLog(action: string, details: string, userId?: string, userName?: string, ipAddress: string = '127.0.0.1', auditEvent?: AuditEvent): void {
    const d = getFallbackData();
    const log: SystemLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random()*1000)}`,
      action,
      details,
      userId: userId || null,
      userName: userName || null,
      ipAddress,
      createdAt: new Date().toISOString(),
      auditEventId: auditEvent?.id,
    };
    if (auditEvent) {
      if (!Array.isArray(d.auditEvents)) d.auditEvents = [];
      d.auditEvents.push(auditEvent);
    }
    d.logs.push(log);
    saveFallbackData(d);
  },
  getLogs(): SystemLog[] {
    const d = getFallbackData();
    return d.logs.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
  recordDownload(productId: string, userId: string, ipAddress: string): {success: boolean} {
    const d = getFallbackData();
    const product = d.products.find((p: any) => p.id === productId);
    if (product) {
      product.downloadsCount = (product.downloadsCount || 0) + 1;
    }
    saveFallbackData(d);
    return { success: true };
  },
  getStats(): SystemStats {
    const d = getFallbackData();
    const users = d.users;
    const keys = d.keys;
    const products = d.products;
    const logs = d.logs;

    let totalUsers = users.length;
    let totalProducts = products.length;
    let totalKeys = keys.length;
    let totalDownloads = products.reduce((acc: number, p: any) => acc + (p.downloadsCount || 0), 0);
    
    let activeProducts = products.filter((p: any) => !p.isDisabled && !p.isArchived).length;
    let inactiveProducts = totalProducts - activeProducts;

    const globalStock = getKeyStockSummary(keys as Key[]);
    const usedKeys = globalStock.used;
    const unusedKeys = globalStock.available;

    const productStockList = products.map((p: any) => {
      const productStock = getKeyStockSummary(keys.filter((k: any) => k.productId === p.id) as Key[]);
      return {
        productId: p.id,
        productName: p.name,
        stockCount: productStock.available
      };
    });

    const recentLogs = logs.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 50);

    return {
      totalUsers,
      totalProducts,
      totalKeys,
      totalDownloads,
      activeProducts,
      inactiveProducts,
      usedKeys,
      unusedKeys,
      productStockList,
      recentLogs
    };
  },

  // -------------------------
  // FAQ CATEGORIES (LocalDB)
  // -------------------------
  getFaqCategories(onlyActive = true): FaqCategory[] {
    const d = getFallbackData();
    const categories: FaqCategory[] = d.faqCategories || initialFaqCategories;
    const faqs: FaqItem[] = (d.faqs || initialFaqs).filter(isCurrentFaq);
    const filtered = onlyActive ? categories.filter((c: FaqCategory) => c.is_active) : [...categories];
    return filtered
      .map((c: FaqCategory) => ({
        ...c,
        faqCount: faqs.filter((f: FaqItem) => f.category_id === c.id && f.is_published).length,
      }))
      .sort((a, b) => a.sort_order - b.sort_order);
  },

  getFaqCategoryById(id: string): FaqCategory | undefined {
    const d = getFallbackData();
    return (d.faqCategories || initialFaqCategories).find((c: FaqCategory) => c.id === id);
  },

  createFaqCategory(category: FaqCategory): { success: boolean; category?: FaqCategory; message?: string } {
    const d = getFallbackData();
    d.faqCategories = d.faqCategories || [...initialFaqCategories];
    if (d.faqCategories.some((c: FaqCategory) => c.id === category.id)) {
      return { success: false, message: 'التصنيف موجود مسبقاً' };
    }
    d.faqCategories.push(category);
    saveFallbackData(d);
    return { success: true, category };
  },

  updateFaqCategory(id: string, updates: Partial<FaqCategory>): { success: boolean; category?: FaqCategory; message?: string } {
    const d = getFallbackData();
    d.faqCategories = d.faqCategories || [...initialFaqCategories];
    const idx = d.faqCategories.findIndex((c: FaqCategory) => c.id === id);
    if (idx === -1) return { success: false, message: 'التصنيف غير موجود' };
    d.faqCategories[idx] = { ...d.faqCategories[idx], ...updates, updatedAt: new Date().toISOString() };
    saveFallbackData(d);
    return { success: true, category: d.faqCategories[idx] };
  },

  deleteFaqCategory(id: string): { success: boolean; message?: string } {
    const d = getFallbackData();
    d.faqCategories = d.faqCategories || [...initialFaqCategories];
    d.faqs = d.faqs || [...initialFaqs];
    const inUse = d.faqs.some((f: FaqItem) => f.category_id === id);
    if (inUse) {
      return { success: false, message: 'لا يمكن حذف التصنيف لوجود أسئلة مرتبطة به. قم بنقل أو حذف الأسئلة أولاً.' };
    }
    d.faqCategories = d.faqCategories.filter((c: FaqCategory) => c.id !== id);
    saveFallbackData(d);
    return { success: true };
  },

  // -------------------------
  // FAQS (LocalDB)
  // -------------------------
  getFaqs(options: { categoryId?: string; search?: string; onlyPublished?: boolean; isPinned?: boolean } = {}): FaqItem[] {
    const d = getFallbackData();
    let faqs: FaqItem[] = (d.faqs || [...initialFaqs]).filter(isCurrentFaq);
    const categories: FaqCategory[] = d.faqCategories || [...initialFaqCategories];
    const catMap = new Map(categories.map((c) => [c.id, c]));

    if (options.onlyPublished !== false) {
      faqs = faqs.filter((f) => f.is_published);
    }
    if (options.categoryId) {
      faqs = faqs.filter((f) => f.category_id === options.categoryId);
    }
    if (options.isPinned !== undefined) {
      faqs = faqs.filter((f) => f.is_pinned === options.isPinned);
    }
    if (options.search && options.search.trim()) {
      const q = options.search.trim().toLowerCase();
      faqs = faqs.filter((f) =>
        (f.question_ar && f.question_ar.toLowerCase().includes(q)) ||
        (f.question_en && f.question_en.toLowerCase().includes(q)) ||
        (f.answer_ar && f.answer_ar.toLowerCase().includes(q)) ||
        (f.answer_en && f.answer_en.toLowerCase().includes(q)) ||
        (Array.isArray(f.keywords) && f.keywords.some((kw) => kw.toLowerCase().includes(q)))
      );
    }

    return faqs
      .map((f) => {
        const cat = catMap.get(f.category_id);
        return {
          ...f,
          category_name_ar: cat?.name_ar,
          category_name_en: cat?.name_en,
        };
      })
      .sort((a, b) => {
        if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
        return a.sort_order - b.sort_order;
      });
  },

  getFaqById(id: string): FaqItem | undefined {
    const d = getFallbackData();
    const faqs: FaqItem[] = d.faqs || [...initialFaqs];
    const faq = faqs.find((f) => f.id === id && isCurrentFaq(f));
    if (!faq) return undefined;
    const categories: FaqCategory[] = d.faqCategories || [...initialFaqCategories];
    const cat = categories.find((c) => c.id === faq.category_id);
    return {
      ...faq,
      category_name_ar: cat?.name_ar,
      category_name_en: cat?.name_en,
    };
  },

  createFaq(faq: FaqItem): { success: boolean; faq?: FaqItem; message?: string } {
    const d = getFallbackData();
    d.faqs = d.faqs || [...initialFaqs];
    if (d.faqs.some((f: FaqItem) => f.id === faq.id)) {
      return { success: false, message: 'السؤال موجود مسبقاً' };
    }
    d.faqs.push(faq);
    saveFallbackData(d);
    return { success: true, faq };
  },

  updateFaq(id: string, updates: Partial<FaqItem>): { success: boolean; faq?: FaqItem; message?: string } {
    const d = getFallbackData();
    d.faqs = d.faqs || [...initialFaqs];
    const idx = d.faqs.findIndex((f: FaqItem) => f.id === id);
    if (idx === -1) return { success: false, message: 'السؤال غير موجود' };
    d.faqs[idx] = { ...d.faqs[idx], ...updates, updatedAt: new Date().toISOString() };
    saveFallbackData(d);
    return { success: true, faq: d.faqs[idx] };
  },

  deleteFaq(id: string): { success: boolean; message?: string } {
    const d = getFallbackData();
    d.faqs = d.faqs || [...initialFaqs];
    const idx = d.faqs.findIndex((f: FaqItem) => f.id === id);
    if (idx === -1) return { success: false, message: 'السؤال غير موجود' };
    d.faqs.splice(idx, 1);
    saveFallbackData(d);
    return { success: true };
  },

  incrementFaqView(id: string): { success: boolean; views?: number } {
    const d = getFallbackData();
    d.faqs = d.faqs || [...initialFaqs];
    const faq = d.faqs.find((f: FaqItem) => f.id === id);
    if (faq) {
      faq.views = (faq.views || 0) + 1;
      saveFallbackData(d);
      return { success: true, views: faq.views };
    }
    return { success: false };
  },

  logFaqSearch(queryStr: string, resultsCount: number, lang: 'ar' | 'en'): { success: boolean } {
    const d = getFallbackData();
    d.faqSearchLogs = d.faqSearchLogs || [];
    d.faqSearchLogs.push({
      id: `search-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      query: queryStr.trim(),
      results_count: resultsCount,
      lang,
      createdAt: new Date().toISOString(),
    });
    if (d.faqSearchLogs.length > 500) {
      d.faqSearchLogs = d.faqSearchLogs.slice(-500);
    }
    saveFallbackData(d);
    return { success: true };
  },

  getFaqStats(): FaqStats {
    const d = getFallbackData();
    const faqs: FaqItem[] = (d.faqs || [...initialFaqs]).filter(isCurrentFaq);
    const categories: FaqCategory[] = d.faqCategories || [...initialFaqCategories];
    const searchLogs: FaqSearchLog[] = d.faqSearchLogs || [];

    const totalFaqs = faqs.length;
    const publishedFaqs = faqs.filter((f) => f.is_published).length;
    const totalCategories = categories.length;

    const mostViewedFaqs = [...faqs]
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, 5)
      .map((f) => ({
        id: f.id,
        question_ar: f.question_ar,
        question_en: f.question_en,
        views: f.views || 0,
        category_id: f.category_id,
      }));

    const totalSearches = searchLogs.length;

    const queryCounts: Record<string, number> = {};
    const zeroCounts: Record<string, number> = {};
    for (const log of searchLogs) {
      const q = (log.query || '').trim().toLowerCase();
      if (!q) continue;
      queryCounts[q] = (queryCounts[q] || 0) + 1;
      if (log.results_count === 0) {
        zeroCounts[q] = (zeroCounts[q] || 0) + 1;
      }
    }

    const topSearchQueries = Object.entries(queryCounts)
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const zeroResultQueries = Object.entries(zeroCounts)
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalFaqs,
      publishedFaqs,
      totalCategories,
      mostViewedFaqs,
      totalSearches,
      topSearchQueries,
      zeroResultQueries,
    };
  }
};

export const StoreDB = {
  // -------------------------
  // PRODUCTS
  // -------------------------
  async getProducts(): Promise<Product[]> {
    return runDbOp(
      async () => {
        const snapshot = await getDocs(collection(getDb(), "products"));
        let products = snapshot.docs.map(doc => doc.data() as Product);
        
        // Seeding must be explicit. A production read must never recreate, overwrite, or
        // resurrect products from source code after an administrator archives them.
        if (products.length === 0 && process.env.SEED_INITIAL_PRODUCTS === 'true') {
          for (const prod of initialProducts) {
            await setDoc(doc(getDb(), 'products', prod.id), prod);
          }
          products = [...initialProducts];
        }
        return products.sort((a, b) => a.displayOrder - b.displayOrder);
      },
      () => LocalDB.getProducts()
    );
  },
  
  async getProductById(id: string): Promise<Product | undefined> {
    return runDbOp(
      async () => {
        const docSnap = await getDoc(doc(getDb(), "products", id));
        if (docSnap.exists()) return docSnap.data() as Product;
        return undefined;
      },
      () => LocalDB.getProductById(id)
    );
  },

  async createProduct(product: Product): Promise<{success: boolean; message?: string; product?: Product}> {
    return runDbOp(
      async () => {
        await setDoc(doc(getDb(), "products", product.id), product);
        return { success: true, product };
      },
      () => {
        const res = LocalDB.createProduct(product);
        return { success: res.success, product: res.product };
      }
    );
  },

  async updateProduct(id: string, updates: Partial<Product>): Promise<{success: boolean; message?: string; product?: Product}> {
    return runDbOp(
      async () => {
        const docRef = doc(getDb(), "products", id);
        await updateDoc(docRef, { ...updates, updatedAt: new Date().toISOString() });
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          return { success: true, product: snap.data() as Product };
        }
        return { success: true };
      },
      () => LocalDB.updateProduct(id, updates)
    );
  },

  async deleteProduct(id: string): Promise<{success: boolean; message?: string}> {
    return runDbOp(
      async () => {
        const productRef = doc(getDb(), 'products', id);
        const current = await getDoc(productRef);
        if (!current.exists()) return { success: false, message: 'المنتج غير موجود.' };
        await updateDoc(productRef, {
          isArchived: true,
          isDisabled: true,
          isVisible: false,
          archivedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        return { success: true, message: 'تمت أرشفة المنتج مع الاحتفاظ بكامل سجله.' };
      },
      () => LocalDB.deleteProduct(id)
    );
  },

  // -------------------------
  // USERS
  // -------------------------
  async getUsers(): Promise<User[]> {
    return runDbOp(
      async () => {
        const snapshot = await getDocs(collection(getDb(), "users"));
        return snapshot.docs.map(doc => doc.data() as User);
      },
      () => LocalDB.getUsers()
    );
  },

  async getUserByDiscordId(discordId: string): Promise<User | undefined> {
    return runDbOp(
      async () => {
        const q = query(collection(getDb(), "users"), where("discordId", "==", discordId));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          return snapshot.docs[0].data() as User;
        }
        return undefined;
      },
      () => LocalDB.getUserByDiscordId(discordId)
    );
  },

  async createUser(user: User): Promise<void> {
    return runDbOp(
      async () => {
        await setDoc(doc(getDb(), "users", user.id), user);
      },
      () => LocalDB.createUser(user)
    );
  },

  async updateUser(id: string, updates: Partial<User>): Promise<void> {
    return runDbOp(
      async () => {
        await updateDoc(doc(getDb(), "users", id), updates);
      },
      () => LocalDB.updateUser(id, updates)
    );
  },

  async deleteUser(id: string): Promise<boolean> {
    return runDbOp(
      async () => {
        const userRef = doc(getDb(), 'users', id);
        const current = await getDoc(userRef);
        if (!current.exists()) return false;
        await updateDoc(userRef, {
          isArchived: true,
          archivedAt: new Date().toISOString(),
          isBanned: true,
          banReason: 'تمت أرشفة الحساب إدارياً',
          banType: 'permanent',
          banExpiresAt: null,
        });
        return true;
      },
      () => LocalDB.deleteUser(id)
    );
  },

  // -------------------------
  // KEYS
  // -------------------------
  async getKeys(): Promise<Key[]> {
    return runDbOp(
      async () => {
        const snapshot = await getDocs(collection(getDb(), "keys"));
        return snapshot.docs.map(doc => doc.data() as Key);
      },
      () => LocalDB.getKeys()
    );
  },
  
  async getKeysByProduct(productId: string): Promise<Key[]> {
    return runDbOp(
      async () => {
        const q = query(collection(getDb(), "keys"), where("productId", "==", productId));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => doc.data() as Key);
      },
      () => LocalDB.getKeysByProduct(productId)
    );
  },

  async generateKeys(productId: string, count: number, prefix: string, createdById: string, duration?: unknown): Promise<{success: boolean; keys: string[]}> {
    return runDbOp(
      async () => {
        const generatedKeys: string[] = [];
        const product = await this.getProductById(productId);
        if (!product) throw new Error("المنتج غير موجود");
        const licenseDuration = normalizeKeyDuration(duration);

        for (let i = 0; i < count; i++) {
          const randomPart = Math.random().toString(36).substring(2, 10).toUpperCase();
          const keyString = `${prefix}-${randomPart}`;
          const newKey: Key = {
            id: `key-${Date.now()}-${i}`,
            key: keyString,
            productId,
            isUsed: false,
            isDisabled: false,
            isArchived: false,
            duration: licenseDuration,
            createdById,
            createdAt: new Date().toISOString()
          };
          await setDoc(doc(getDb(), "keys", newKey.id), newKey);
          generatedKeys.push(keyString);
        }

        await this.addLog('Key Creation', `تم إنشاء ${count} مفاتيح للمنتج ${product.name}`, createdById, 'Admin');
        return { success: true, keys: generatedKeys };
      },
      () => LocalDB.generateKeys(productId, count, prefix, createdById, duration)
    );
  },

  async bulkAddKeys(productId: string, rawKeysText: string, createdById: string, duration?: unknown): Promise<{success: boolean; count: number; skipped: number; message?: string}> {
    return runDbOp(
      async () => {
        const db = getDb();
        const product = await this.getProductById(productId);
        if (!product) return { success: false, count: 0, skipped: 0, message: 'المنتج المطلوب غير موجود.' };
        const licenseDuration = normalizeKeyDuration(duration);

        const lines = rawKeysText.split(/[\n,]+/).map(l => l.trim()).filter(l => l.length > 0);
        const existingKeys = await this.getKeys();
        const activeCodes = new Set(existingKeys
          .filter((key) => !key.isArchived || key.isUsed)
          .map((key) => key.key.trim().toUpperCase()));
        const reusableByCode = new Map<string, Key>(existingKeys
          .filter((key) => key.isArchived && !key.isUsed)
          .map((key): [string, Key] => [key.key.trim().toUpperCase(), key]));
        const acceptedCodes: string[] = [];
        const reusableKeys: Key[] = [];
        let skipped = 0;
        for (const keyString of lines) {
          const normalized = keyString.toUpperCase();
          const isDuplicate = activeCodes.has(normalized);
          if (isDuplicate) {
            skipped++;
          }
          const reusableKey = !isDuplicate ? reusableByCode.get(normalized) : null;
          if (reusableKey) reusableKeys.push(reusableKey);
          else acceptedCodes.push(keyString);
          activeCodes.add(normalized);
        }
        const createdAt = new Date().toISOString();
        const BATCH_SIZE = 400;
        for (let i = 0; i < acceptedCodes.length; i += BATCH_SIZE) {
          const batch = writeBatch(db);
          const chunk = acceptedCodes.slice(i, i + BATCH_SIZE);
          chunk.forEach((keyString, index) => {
            const absoluteIndex = i + index;
            const newKey: Key = {
              id: `key-${Date.now()}-${absoluteIndex}-${Math.random().toString(36).slice(2, 7)}`,
              key: keyString,
              productId,
              isUsed: false,
              isDisabled: false,
              isArchived: false,
              duration: licenseDuration,
              createdById,
              createdAt
            };
            batch.set(doc(db, "keys", newKey.id), newKey);
          });
          await batch.commit();
        }
        for (let i = 0; i < reusableKeys.length; i += BATCH_SIZE) {
          const batch = writeBatch(db);
          reusableKeys.slice(i, i + BATCH_SIZE).forEach((key) => {
            batch.update(doc(db, 'keys', key.id), {
              productId,
              duration: licenseDuration,
              isUsed: false,
              isDisabled: false,
              isArchived: false,
              archivedAt: null,
              createdById,
              restoredAt: createdAt,
            });
          });
          await batch.commit();
        }
        return { success: true, count: acceptedCodes.length + reusableKeys.length, skipped };
      },
      () => LocalDB.bulkAddKeys(productId, rawKeysText, createdById, duration)
    );
  },

  async updateKey(id: string, updates: Partial<Key>): Promise<boolean> {
    return runDbOp(
      async () => {
        await updateDoc(doc(getDb(), "keys", id), updates);
        return true;
      },
      () => LocalDB.updateKey(id, updates)
    );
  },

  async deleteKey(id: string): Promise<boolean> {
    return runDbOp(
      async () => {
        const keyRef = doc(getDb(), 'keys', id);
        const keySnap = await getDoc(keyRef);
        if (!keySnap.exists()) return false;
        await updateDoc(keyRef, {
          isArchived: true,
          isDisabled: true,
          archivedAt: new Date().toISOString(),
        });
        return true;
      },
      () => LocalDB.deleteKey(id)
    );
  },
  
  async revokeKey(keyId: string, userId: string): Promise<boolean> {
    return runDbOp(
      async () => {
        const database = getDb();
        const keyRef = doc(database, 'keys', keyId);
        const keySnapshot = await getDoc(keyRef);
        if (!keySnapshot.exists()) return false;
        const now = new Date().toISOString();
        const userProductsQuery = query(collection(database, 'userProducts'), where('userId', '==', userId), where('keyId', '==', keyId));
        const userProductsSnapshot = await getDocs(userProductsQuery);
        const batch = writeBatch(database);
        batch.update(keyRef, {
          isArchived: true,
          isDisabled: true,
          isRevoked: true,
          revokedAt: now,
          archivedAt: now,
        });
        userProductsSnapshot.docs.forEach((entry) => batch.update(entry.ref, { status: 'Revoked', revokedAt: now }));
        await batch.commit();
        return true;
      },
      () => LocalDB.revokeKey(keyId, userId)
    );
  },
  
  async deleteAllKeysForProduct(productId: string): Promise<number> {
    return runDbOp(
      async () => {
        const keys = await this.getKeysByProduct(productId);
        const removableKeys = keys.filter((key) => !key.isUsed);
        if (removableKeys.length === 0) return 0;
        const batch = writeBatch(getDb());
        const archivedAt = new Date().toISOString();
        removableKeys.forEach((key) => batch.update(doc(getDb(), 'keys', key.id), { isArchived: true, isDisabled: true, archivedAt }));
        await batch.commit();
        return removableKeys.length;
      },
      () => LocalDB.deleteAllKeysForProduct(productId)
    );
  },

  async getProductStockPaginated(params: {
    productId: string;
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    sort?: 'newest' | 'oldest';
  }): Promise<{
    success: boolean;
    keys: Key[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    stockSummary: KeyStockSummary;
  }> {
    return runDbOp(
      async () => {
        const keys = await this.getKeysByProduct(params.productId);
        const activeKeys = keys.filter(k => !k.isArchived);
        const stockSummary = getKeyStockSummary(activeKeys);

        let filtered = [...activeKeys];

        if (params.status && params.status !== 'all') {
          filtered = filtered.filter(k => resolveKeyStatus(k) === params.status);
        }

        if (params.search && params.search.trim()) {
          const q = params.search.trim().toLowerCase();
          filtered = filtered.filter(k => {
            const keyMatch = (k.key || '').toLowerCase().includes(q);
            const orderMatch = (k.orderId || '').toLowerCase().includes(q);
            const custMatch = (k.customerId || '').toLowerCase().includes(q) || (k.customerName || '').toLowerCase().includes(q) || (k.usedByUserName || '').toLowerCase().includes(q);
            const statusMatch = resolveKeyStatus(k).toLowerCase().includes(q);
            return keyMatch || orderMatch || custMatch || statusMatch;
          });
        }

        const isOldest = params.sort === 'oldest';
        filtered.sort((a, b) => {
          const timeA = new Date(a.createdAt || 0).getTime();
          const timeB = new Date(b.createdAt || 0).getTime();
          return isOldest ? timeA - timeB : timeB - timeA;
        });

        const total = filtered.length;
        const limitNum = Math.max(1, params.limit || 20);
        const totalPages = Math.ceil(total / limitNum) || 1;
        const pageNum = Math.max(1, Math.min(params.page || 1, totalPages));
        const offset = (pageNum - 1) * limitNum;
        const paginated = filtered.slice(offset, offset + limitNum).map(k => ({
          ...k,
          status: resolveKeyStatus(k)
        }));

        return {
          success: true,
          keys: paginated,
          total,
          page: pageNum,
          limit: limitNum,
          totalPages,
          stockSummary
        };
      },
      () => LocalDB.getProductStockPaginated(params)
    );
  },

  async addSingleKey(productId: string, keyString: string, createdById: string, duration?: unknown, allowDuplicates: boolean = true): Promise<{ success: boolean; key?: Key; message?: string }> {
    return runDbOp(
      async () => {
        const db = getDb();
        const product = await this.getProductById(productId);
        if (!product) return { success: false, message: 'المنتج غير موجود.' };

        const cleanKey = (keyString || '').trim();
        if (!cleanKey) return { success: false, message: 'كود المفتاح مطلوب.' };

        const allKeys = await this.getKeys();
        const normalized = cleanKey.toUpperCase();
        const exists = allKeys.some(k => (!k.isArchived || k.isUsed) && (k.key || '').trim().toUpperCase() === normalized);
        if (exists && !allowDuplicates) {
          return { success: false, message: 'هذا المفتاح موجود بالفعل في المخزون.' };
        }

        const licenseDuration = normalizeKeyDuration(duration);
        const now = new Date().toISOString();
        const newKey: Key = {
          id: `key-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          key: cleanKey,
          productId,
          productName: product.name,
          status: 'available',
          isUsed: false,
          isDisabled: false,
          isArchived: false,
          duration: licenseDuration,
          createdById,
          createdAt: now,
          updatedAt: now,
        };

        await setDoc(doc(db, 'keys', newKey.id), newKey);
        return { success: true, key: newKey, message: 'تمت إضافة المفتاح بنجاح.' };
      },
      () => LocalDB.addSingleKey(productId, keyString, createdById, duration, allowDuplicates)
    );
  },

  async bulkAddKeysStructured(productId: string, keys: string[], createdById: string, duration?: unknown, allowDuplicates: boolean = true): Promise<{ success: boolean; inserted: number; duplicates: number; invalid: number; message?: string }> {
    return runDbOp(
      async () => {
        const db = getDb();
        const product = await this.getProductById(productId);
        if (!product) return { success: false, inserted: 0, duplicates: 0, invalid: 0, message: 'المنتج المطلوب غير موجود.' };
        const licenseDuration = normalizeKeyDuration(duration);

        const existingKeys = await this.getKeys();
        const activeCodes = new Set(
          existingKeys
            .filter((key) => !key.isArchived || key.isUsed)
            .map((key) => key.key.trim().toUpperCase())
        );
        const reusableByCode = new Map<string, Key>(
          existingKeys
            .filter((key) => key.isArchived && !key.isUsed)
            .map((key): [string, Key] => [key.key.trim().toUpperCase(), key])
        );

        const acceptedCodes: string[] = [];
        const reusableKeys: Key[] = [];
        let duplicates = 0;
        let invalid = 0;
        const seenInInput = new Set<string>();
        const now = new Date().toISOString();

        for (const raw of keys) {
          const trimmed = (raw || '').trim();
          if (!trimmed) {
            invalid++;
            continue;
          }
          const normalized = trimmed.toUpperCase();
          const isDuplicate = seenInInput.has(normalized) || activeCodes.has(normalized);
          if (isDuplicate) {
            duplicates++;
            if (!allowDuplicates) {
              continue;
            }
          }

          seenInInput.add(normalized);
          const reusableKey = !isDuplicate ? reusableByCode.get(normalized) : null;
          if (reusableKey) reusableKeys.push(reusableKey);
          else acceptedCodes.push(trimmed);
          activeCodes.add(normalized);
        }

        const BATCH_SIZE = 400;
        for (let i = 0; i < acceptedCodes.length; i += BATCH_SIZE) {
          const batch = writeBatch(db);
          const chunk = acceptedCodes.slice(i, i + BATCH_SIZE);
          chunk.forEach((keyString, index) => {
            const newKey: Key = {
              id: `key-${Date.now()}-${i + index}-${Math.random().toString(36).slice(2, 7)}`,
              key: keyString,
              productId,
              productName: product.name,
              status: 'available',
              isUsed: false,
              isDisabled: false,
              isArchived: false,
              duration: licenseDuration,
              createdById,
              createdAt: now,
              updatedAt: now,
            };
            batch.set(doc(db, "keys", newKey.id), newKey);
          });
          await batch.commit();
        }

        for (let i = 0; i < reusableKeys.length; i += BATCH_SIZE) {
          const batch = writeBatch(db);
          reusableKeys.slice(i, i + BATCH_SIZE).forEach((key) => {
            batch.update(doc(db, 'keys', key.id), {
              productId,
              productName: product.name,
              duration: licenseDuration,
              status: 'available',
              isUsed: false,
              isDisabled: false,
              isArchived: false,
              archivedAt: null,
              createdById,
              restoredAt: now,
              updatedAt: now,
            });
          });
          await batch.commit();
        }

        const inserted = acceptedCodes.length + reusableKeys.length;
        return {
          success: true,
          inserted,
          duplicates,
          invalid,
          message: inserted > 0 ? `تمت إضافة ${inserted} مفتاحاً بنجاح.` : 'لم تتم إضافة أي مفاتيح جديدة.'
        };
      },
      () => LocalDB.bulkAddKeysStructured(productId, keys, createdById, duration, allowDuplicates)
    );
  },

  async setKeyStatus(keyId: string, status: KeyStatus): Promise<{ success: boolean; message?: string; key?: Key }> {
    return runDbOp(
      async () => {
        const keyRef = doc(getDb(), 'keys', keyId);
        const keySnap = await getDoc(keyRef);
        if (!keySnap.exists()) return { success: false, message: 'المفتاح غير موجود.' };
        const currentKey = keySnap.data() as Key;
        const now = new Date().toISOString();

        let updates: Partial<Key> = { status, updatedAt: now };
        if (status === 'available') {
          if (currentKey.isUsed) return { success: false, message: 'لا يمكن تفعيل مفتاح مستخدم بالفعل.' };
          updates.isDisabled = false;
          updates.disabledAt = null;
        } else if (status === 'disabled') {
          updates.isDisabled = true;
          updates.disabledAt = now;
        } else if (status === 'reserved') {
          if (currentKey.isUsed) return { success: false, message: 'لا يمكن حجز مفتاح مستخدم بالفعل.' };
        } else if (status === 'used') {
          updates.isUsed = true;
          if (!currentKey.usedAt) updates.usedAt = now;
        }

        await updateDoc(keyRef, updates);
        return { success: true, key: { ...currentKey, ...updates }, message: 'تم تحديث حالة المفتاح بنجاح.' };
      },
      () => LocalDB.setKeyStatus(keyId, status)
    );
  },

  async deleteKeySafely(keyId: string): Promise<{ success: boolean; wasDisabledInstead: boolean; message: string }> {
    return runDbOp(
      async () => {
        const keyRef = doc(getDb(), 'keys', keyId);
        const keySnap = await getDoc(keyRef);
        if (!keySnap.exists()) return { success: false, wasDisabledInstead: false, message: 'المفتاح غير موجود.' };
        const currentKey = keySnap.data() as Key;
        const now = new Date().toISOString();

        if (currentKey.isUsed || currentKey.status === 'used') {
          await updateDoc(keyRef, {
            status: 'disabled',
            isDisabled: true,
            disabledAt: now,
            updatedAt: now,
          });
          return {
            success: true,
            wasDisabledInstead: true,
            message: 'تم تعطيل المفتاح بدلاً من حذفه للحفاظ على سجلات الطلب والعميل.'
          };
        }

        await updateDoc(keyRef, {
          isArchived: true,
          isDisabled: true,
          archivedAt: now,
          updatedAt: now,
        });
        return {
          success: true,
          wasDisabledInstead: false,
          message: 'تم حذف المفتاح من المخزون بنجاح.'
        };
      },
      () => LocalDB.deleteKeySafely(keyId)
    );
  },

  async assignKeyToOrder(params: { productId: string; orderId: string; customerId: string; customerName?: string; ipAddress?: string }): Promise<{ success: boolean; key?: Key; message?: string }> {
    return runDbOp(
      async () => {
        const database = getDb();
        const keysQuery = query(
          collection(database, 'keys'),
          where('productId', '==', params.productId),
          where('isUsed', '==', false),
          where('isDisabled', '==', false),
          where('isArchived', '==', false)
        );

        let allocatedKey: Key | null = null;
        try {
          await runTransaction(database, async (transaction) => {
            const snapshot = await getDocs(keysQuery);
            let chosenRef = null;
            let chosenData: Key | null = null;

            for (const docSnap of snapshot.docs) {
              const candidateRef = doc(database, 'keys', docSnap.id);
              const liveSnap = await transaction.get(candidateRef);
              if (liveSnap.exists()) {
                const liveData = liveSnap.data() as Key;
                if (!liveData.isUsed && !liveData.isDisabled && !liveData.isArchived) {
                  chosenRef = candidateRef;
                  chosenData = liveData;
                  break;
                }
              }
            }

            if (!chosenRef || !chosenData) {
              throw new Error('OUT_OF_STOCK: لا يوجد مخزون متاح لهذا المنتج.');
            }

            const now = new Date().toISOString();
            const updatePayload = {
              status: 'used' as KeyStatus,
              isUsed: true,
              orderId: params.orderId,
              customerId: params.customerId,
              customerName: params.customerName || null,
              usedByUserId: params.customerId,
              usedByUserName: params.customerName || null,
              usedAt: now,
              updatedAt: now,
            };

            transaction.update(chosenRef, updatePayload);
            allocatedKey = { ...chosenData, ...updatePayload };
          });
        } catch (txnError: any) {
          if (txnError?.message?.includes('OUT_OF_STOCK')) {
            return { success: false, message: 'لا يوجد مخزون متاح لهذا المنتج.' };
          }
          throw txnError;
        }

        return { success: true, key: allocatedKey || undefined, message: 'تم تخصيص المفتاح بنجاح.' };
      },
      () => LocalDB.assignKeyToOrder(params)
    );
  },


  async activateProductWithKey(keyString: string, userDetails: { discordId: string, name: string, email?: string, image?: string }, ipAddress: string): Promise<{success: boolean; message: string; product?: Product}> {
    return runDbOp(
      async () => {
        const q = query(collection(getDb(), "keys"), where("key", "==", keyString));
        const keySnap = await getDocs(q);
        if (keySnap.empty) {
          return { success: false, message: 'المفتاح غير صحيح أو غير موجود' };
        }
        if (keySnap.size !== 1) {
          return { success: false, message: 'تم اكتشاف تكرار لهذا المفتاح. تواصل مع الدعم قبل التفعيل.' };
        }
        
        const keyObj = keySnap.docs[0].data() as Key;

        if (keyObj.isUsed) return { success: false, message: 'المفتاح مستخدم مسبقاً' };
        if (keyObj.isDisabled) return { success: false, message: 'المفتاح معطل من قبل الإدارة' };
        
        const product = await this.getProductById(keyObj.productId);
        if (!product || product.isDisabled) return { success: false, message: 'المنتج المرتبط غير متاح' };

        let user = await this.getUserByDiscordId(userDetails.discordId);
        if (!user) {
          user = {
            id: `user-${Date.now()}`,
            discordId: userDetails.discordId,
            name: userDetails.name,
            email: userDetails.email,
            image: userDetails.image,
            role: 'Customer',
            discordRoles: [DISCORD_ROLES.CUSTOMER],
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            lastIp: ipAddress,
            isBanned: false,
            warningCount: 0,
            warningMessage: null
          };
          await this.createUser(user);
        } else {
          await updateDoc(doc(getDb(), "users", user.id), { lastLogin: new Date().toISOString(), lastIp: ipAddress });
        }

        const existingLicenses = await this.getUserProducts(user.id);
        if (existingLicenses.some((license) => license.productId === product.id && isLicenseCurrentlyActive(license))) {
          return { success: false, message: 'لديك هذا المنتج مفعّل بالفعل' };
        }

        const usedAt = new Date().toISOString();
        const expiresAt = computeLicenseExpiresAt(usedAt, keyObj.duration);
        const userProduct: UserProduct = {
          id: `up-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          userId: user.id,
          productId: product.id,
          keyId: keyObj.id,
          keyString: keyObj.key,
          status: 'Active',
          activatedAt: usedAt,
          expiresAt,
          discordRoleGranted: true
        };

        try {
          await runTransaction(getDb(), async (transaction) => {
            const latestKeySnap = await transaction.get(keySnap.docs[0].ref);
            if (!latestKeySnap.exists()) throw new Error('المفتاح غير صحيح أو غير موجود');
            const latestKey = latestKeySnap.data() as Key;
            if (latestKey.isUsed) throw new Error('المفتاح مستخدم مسبقاً');
            if (latestKey.isDisabled || latestKey.isArchived) throw new Error('المفتاح غير متاح للتفعيل');

            transaction.update(keySnap.docs[0].ref, { isUsed: true, usedByUserId: user.id, usedAt });
            transaction.set(doc(getDb(), "userProducts", userProduct.id), userProduct);
          });
        } catch (error: any) {
          return { success: false, message: error?.message || 'تعذر تفعيل المفتاح الآن.' };
        }

        await this.addLog('Key Activation', `تم تفعيل مفتاح ${product.name}`, user.id, user.name, ipAddress);
        return { success: true, message: 'تم التفعيل بنجاح', product };
      },
      () => LocalDB.activateProductWithKey(keyString, userDetails, ipAddress)
    );
  },

  // -------------------------
  // USER PRODUCTS
  // -------------------------
  async getUserDetails(userId: string): Promise<{user: User, products: UserProduct[]} | undefined> {
    return runDbOp(
      async () => {
        const userDoc = await getDoc(doc(getDb(), "users", userId));
        if (!userDoc.exists()) return undefined;
        const user = userDoc.data() as User;
        const products = await this.getUserProducts(userId);
        return { user, products };
      },
      () => LocalDB.getUserDetails(userId)
    );
  },

  async getUserProducts(userId: string): Promise<UserProduct[]> {
    return runDbOp(
      async () => {
        const q = query(collection(getDb(), "userProducts"), where("userId", "==", userId));
        const snapshot = await getDocs(q);
        const result = await Promise.all(snapshot.docs.map(async (d) => {
          const up = { ...(d.data() as UserProduct) };
          const [keyResult, product] = await Promise.all([
            up.keyId && !up.keyString
              ? getDoc(doc(getDb(), "keys", up.keyId)).catch((error) => { console.error("Failed to fetch key for user product:", error); return null; })
              : Promise.resolve(null),
            this.getProductById(up.productId),
          ]);
          if (keyResult?.exists()) up.keyString = (keyResult.data() as Key).key;
          if (!product) return null;
          up.product = product;
          return up;
        }));
        return result.filter((item): item is UserProduct => item !== null);
      },
      () => LocalDB.getUserProducts(userId)
    );
  },

  async resetUserProductHwid(userId: string, productId: string): Promise<{success: boolean; message?: string; resetAt?: string}> {
    return runDbOp(
      async () => {
        const q = query(collection(getDb(), "userProducts"), where("userId", "==", userId), where("productId", "==", productId));
        const snapshot = await getDocs(q);
        const activeLicense = snapshot.docs.find((item) => (item.data() as UserProduct).status === 'Active');
        if (!activeLicense) return { success: false, message: 'لا يوجد ترخيص نشط لهذا المنتج.' };

        const resetAt = new Date().toISOString();
        const current = activeLicense.data() as UserProduct;
        await updateDoc(activeLicense.ref, {
          hwidResetAt: resetAt,
          hwidResetCount: (current.hwidResetCount || 0) + 1
        });
        await this.addLog('HWID Reset', `تمت إعادة تعيين ربط الجهاز للمنتج ${productId}`, userId, 'Customer');
        return { success: true, resetAt };
      },
      () => LocalDB.resetUserProductHwid(userId, productId)
    );
  },

  async removeProductFromUser(userId: string, productId: string): Promise<{success: boolean; message?: string}> {
    return runDbOp(
      async () => {
        const q = query(collection(getDb(), "userProducts"), where("userId", "==", userId), where("productId", "==", productId));
        const snapshot = await getDocs(q);
        for (const d of snapshot.docs) {
          await deleteDoc(d.ref);
        }
        return { success: true };
      },
      () => LocalDB.removeProductFromUser(userId, productId)
    );
  },

  async addProductToUser(userId: string, productId: string): Promise<{success: boolean; message?: string}> {
    return runDbOp(
      async () => {
        const userProduct: UserProduct = {
          id: `up-${Date.now()}`,
          userId,
          productId,
          status: 'Active',
          activatedAt: new Date().toISOString(),
          expiresAt: computeLicenseExpiresAt(new Date().toISOString(), '2 Days'),
          discordRoleGranted: false
        };
        await setDoc(doc(getDb(), "userProducts", userProduct.id), userProduct);
        return { success: true };
      },
      () => LocalDB.addProductToUser(userId, productId)
    );
  },

  async updateUserProductStatus(userId: string, productId: string, status: ProductStatus): Promise<{success: boolean; message?: string}> {
    return runDbOp(
      async () => {
        const q = query(collection(getDb(), "userProducts"), where("userId", "==", userId), where("productId", "==", productId));
        const snapshot = await getDocs(q);
        for (const d of snapshot.docs) {
          await updateDoc(d.ref, { status });
        }
        return { success: true };
      },
      () => LocalDB.updateUserProductStatus(userId, productId, status)
    );
  },

  // -------------------------
  // LOGS & STATS
  // -------------------------
  async addLog(action: string, details: string, userId?: string, userName?: string, ipAddress: string = '127.0.0.1', context: Partial<AuditEvent> = {}): Promise<void> {
    const now = new Date().toISOString();
    const log: SystemLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      action,
      details,
      userId: userId || null,
      userName: userName || null,
      ipAddress,
      createdAt: now,
    };
    const auditEvent: AuditEvent = {
      id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      eventType: context.eventType || action,
      description: context.description || details,
      occurredAt: now,
      actorUserId: context.actorUserId ?? userId ?? null,
      actorDiscordId: context.actorDiscordId ?? null,
      actorName: context.actorName ?? userName ?? null,
      targetUserId: context.targetUserId ?? null,
      targetDiscordId: context.targetDiscordId ?? null,
      productId: context.productId ?? null,
      keyId: context.keyId ?? null,
      ticketId: context.ticketId ?? null,
      ipAddress: context.ipAddress ?? ipAddress,
      userAgent: context.userAgent ?? null,
      metadata: context.metadata ?? {},
    };
    log.auditEventId = auditEvent.id;

    await runDbOp(
      async () => {
        const batch = writeBatch(getDb());
        batch.set(doc(getDb(), 'logs', log.id), log);
        batch.set(doc(getDb(), 'auditEvents', auditEvent.id), auditEvent);
        await batch.commit();
      },
      () => LocalDB.addLog(action, details, userId, userName, ipAddress, auditEvent)
    );
    // Dedicated Discord cards already cover these high-volume events; all other
    // system logs receive one private, redacted audit entry immediately.
    const dedicatedDiscordActions = [
      'Key Activation', 'Key Inventory Updated', 'Key Inventory Deleted',
      'AI Conversation Reopened', 'AI Conversation Closed By Staff',
      'AI Conversation Auto Closed', 'Reset Request Created',
      'AI Reset APPROVED', 'AI Reset REJECTED', 'AI Reset WAITING_FOR_CUSTOMER',
      'AI Reset CANCELLED', 'AI Reset Requests Purged',
    ];
    if (!dedicatedDiscordActions.some((entry) => action === entry || action.startsWith(`${entry} `))) {
      void import('@/lib/discord-bot').then(({ sendDiscordSystemAuditLog }) => sendDiscordSystemAuditLog({
        action,
        details,
        actorName: userName,
        actorId: userId,
        ipAddress,
        occurredAt: now,
      })).catch((error) => console.error('[Discord System Audit] Delivery failed:', error));
    }
  },

  async getLogs(): Promise<SystemLog[]> {
    return runDbOp(
      async () => {
        const snapshot = await getDocs(collection(getDb(), "logs"));
        const logs = snapshot.docs.map(doc => doc.data() as SystemLog);
        return logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      },
      () => LocalDB.getLogs()
    );
  },

  async getAuditEvents(options: { userId?: string; limit?: number } = {}): Promise<AuditEvent[]> {
    const max = Math.min(Math.max(options.limit || 50, 1), 200);
    const matchesUser = (event: AuditEvent) => !options.userId
      || event.actorUserId === options.userId
      || event.targetUserId === options.userId;
    const sortRecent = (events: AuditEvent[]) => events
      .filter(matchesUser)
      .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
      .slice(0, max);

    return runDbOp(
      async () => {
        const [auditSnapshot, logSnapshot] = await Promise.all([
          getDocs(collection(getDb(), 'auditEvents')),
          getDocs(collection(getDb(), 'logs')),
        ]);
        const storedEvents = auditSnapshot.docs.map((entry) => entry.data() as AuditEvent);
        const legacyEvents: AuditEvent[] = logSnapshot.docs
          .map((entry) => entry.data() as SystemLog)
          .filter((log) => !log.auditEventId)
          .map((log) => ({
            id: `legacy-${log.id}`,
            eventType: log.action,
            description: log.details,
            occurredAt: log.createdAt,
            actorUserId: log.userId || null,
            actorName: log.userName || null,
            ipAddress: log.ipAddress || null,
            metadata: { source: 'legacy_log' },
          }));
        return sortRecent([...storedEvents, ...legacyEvents]);
      },
      () => {
        const data = getFallbackData();
        const storedEvents = Array.isArray(data.auditEvents) ? data.auditEvents as AuditEvent[] : [];
        // Existing system logs remain visible as legacy audit events; no destructive backfill is required.
        const legacyEvents: AuditEvent[] = (data.logs || []).map((log: SystemLog) => ({
          id: `legacy-${log.id}`,
          eventType: log.action,
          description: log.details,
          occurredAt: log.createdAt,
          actorUserId: log.userId || null,
          actorName: log.userName || null,
          ipAddress: log.ipAddress || null,
          metadata: { source: 'legacy_log' },
        }));
        return sortRecent([...storedEvents, ...legacyEvents]);
      }
    );
  },

  async recordDownload(productId: string, userId: string, ipAddress: string): Promise<{success: boolean}> {
    return runDbOp(
      async () => {
        const dLog: DownloadLog = {
          id: `dl-${Date.now()}`,
          userId,
          productId,
          ipAddress,
          downloadedAt: new Date().toISOString()
        };
        await setDoc(doc(getDb(), "downloads", dLog.id), dLog);

        const product = await this.getProductById(productId);
        if (product) {
          await updateDoc(doc(getDb(), "products", productId), { downloadsCount: (product.downloadsCount || 0) + 1 });
        }
        return { success: true };
      },
      () => LocalDB.recordDownload(productId, userId, ipAddress)
    );
  },

  async getStats(): Promise<SystemStats> {
    return runDbOp(
      async () => {
        const usersSnap = await getDocs(collection(getDb(), "users"));
        const productsSnap = await getDocs(collection(getDb(), "products"));
        const keysSnap = await getDocs(collection(getDb(), "keys"));
        const downloadsSnap = await getDocs(collection(getDb(), "downloads"));
        
        const users = usersSnap.docs.map(d => d.data() as User);
        const keys = keysSnap.docs.map(d => d.data() as Key);
        const products = productsSnap.docs.map(d => d.data() as Product);

        let totalUsers = users.length;
        let totalProducts = products.length;
        let totalKeys = keys.length;
        let totalDownloads = downloadsSnap.size;
        
        let activeProducts = products.filter(p => !p.isDisabled && !p.isArchived).length;
        let inactiveProducts = totalProducts - activeProducts;

        const globalStock = getKeyStockSummary(keys);
        const usedKeys = globalStock.used;
        const unusedKeys = globalStock.available;

        const productStockList = products.map(p => {
          const productStock = getKeyStockSummary(keys.filter(k => k.productId === p.id));
          return {
            productId: p.id,
            productName: p.name,
            stockCount: productStock.available
          };
        });

        const logs = await this.getLogs();
        const recentLogs = logs.slice(0, 50);

        return {
          totalUsers,
          totalProducts,
          totalKeys,
          totalDownloads,
          activeProducts,
          inactiveProducts,
          usedKeys,
          unusedKeys,
          productStockList,
          recentLogs
        };
      },
      () => LocalDB.getStats()
    );
  },

  // -------------------------
  // FAQ CATEGORIES (StoreDB)
  // -------------------------
  async getFaqCategories(onlyActive = true): Promise<FaqCategory[]> {
    return runDbOp(
      async () => {
        const catSnap = await getDocs(collection(getDb(), 'faq_categories'));
        let categories = catSnap.docs.map((d) => d.data() as FaqCategory);

        if (categories.length === 0) {
          for (const cat of initialFaqCategories) {
            await setDoc(doc(getDb(), 'faq_categories', cat.id), cat);
          }
          categories = [...initialFaqCategories];
        }

        const faqsSnap = await getDocs(collection(getDb(), 'faqs'));
        const faqs = faqsSnap.docs.map((d) => d.data() as FaqItem).filter(isCurrentFaq);

        const filtered = onlyActive ? categories.filter((c) => c.is_active) : [...categories];
        return filtered
          .map((c) => ({
            ...c,
            faqCount: faqs.filter((f) => f.category_id === c.id && f.is_published).length,
          }))
          .sort((a, b) => a.sort_order - b.sort_order);
      },
      () => LocalDB.getFaqCategories(onlyActive)
    );
  },

  async getFaqCategoryById(id: string): Promise<FaqCategory | undefined> {
    return runDbOp(
      async () => {
        const snap = await getDoc(doc(getDb(), 'faq_categories', id));
        if (snap.exists()) return snap.data() as FaqCategory;
        return undefined;
      },
      () => LocalDB.getFaqCategoryById(id)
    );
  },

  async createFaqCategory(category: FaqCategory): Promise<{ success: boolean; category?: FaqCategory; message?: string }> {
    return runDbOp(
      async () => {
        const catRef = doc(getDb(), 'faq_categories', category.id);
        const existing = await getDoc(catRef);
        if (existing.exists()) return { success: false, message: 'التصنيف موجود مسبقاً' };
        await setDoc(catRef, category);
        return { success: true, category };
      },
      () => LocalDB.createFaqCategory(category)
    );
  },

  async updateFaqCategory(id: string, updates: Partial<FaqCategory>): Promise<{ success: boolean; category?: FaqCategory; message?: string }> {
    return runDbOp<{ success: boolean; category?: FaqCategory; message?: string }>(
      async () => {
        const catRef = doc(getDb(), 'faq_categories', id);
        await updateDoc(catRef, { ...updates, updatedAt: new Date().toISOString() });
        const snap = await getDoc(catRef);
        return { success: true, category: snap.data() as FaqCategory };
      },
      () => LocalDB.updateFaqCategory(id, updates)
    );
  },

  async deleteFaqCategory(id: string): Promise<{ success: boolean; message?: string }> {
    return runDbOp<{ success: boolean; message?: string }>(
      async () => {
        const faqsSnap = await getDocs(query(collection(getDb(), 'faqs'), where('category_id', '==', id)));
        if (!faqsSnap.empty) {
          return { success: false, message: 'لا يمكن حذف التصنيف لوجود أسئلة مرتبطة به. قم بنقل أو حذف الأسئلة أولاً.' };
        }
        await deleteDoc(doc(getDb(), 'faq_categories', id));
        return { success: true };
      },
      () => LocalDB.deleteFaqCategory(id)
    );
  },

  // -------------------------
  // FAQS (StoreDB)
  // -------------------------
  async getFaqs(options: { categoryId?: string; search?: string; onlyPublished?: boolean; isPinned?: boolean } = {}): Promise<FaqItem[]> {
    return runDbOp(
      async () => {
        const snapshot = await getDocs(collection(getDb(), 'faqs'));
        let faqs = snapshot.docs.map((d) => d.data() as FaqItem).filter(isCurrentFaq);

        if (faqs.length === 0) {
          for (const f of initialFaqs) {
            await setDoc(doc(getDb(), 'faqs', f.id), f);
          }
          faqs = [...initialFaqs];
        }

        const categories = await this.getFaqCategories(false);
        const catMap = new Map(categories.map((c) => [c.id, c]));

        if (options.onlyPublished !== false) {
          faqs = faqs.filter((f) => f.is_published);
        }
        if (options.categoryId) {
          faqs = faqs.filter((f) => f.category_id === options.categoryId);
        }
        if (options.isPinned !== undefined) {
          faqs = faqs.filter((f) => f.is_pinned === options.isPinned);
        }
        if (options.search && options.search.trim()) {
          const q = options.search.trim().toLowerCase();
          faqs = faqs.filter((f) =>
            (f.question_ar && f.question_ar.toLowerCase().includes(q)) ||
            (f.question_en && f.question_en.toLowerCase().includes(q)) ||
            (f.answer_ar && f.answer_ar.toLowerCase().includes(q)) ||
            (f.answer_en && f.answer_en.toLowerCase().includes(q)) ||
            (Array.isArray(f.keywords) && f.keywords.some((kw) => kw.toLowerCase().includes(q)))
          );
        }

        return faqs
          .map((f) => {
            const cat = catMap.get(f.category_id);
            return {
              ...f,
              category_name_ar: cat?.name_ar,
              category_name_en: cat?.name_en,
            };
          })
          .sort((a, b) => {
            if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
            return a.sort_order - b.sort_order;
          });
      },
      () => LocalDB.getFaqs(options)
    );
  },

  async getFaqById(id: string): Promise<FaqItem | undefined> {
    return runDbOp(
      async () => {
        const snap = await getDoc(doc(getDb(), 'faqs', id));
        if (!snap.exists()) return undefined;
        const faq = snap.data() as FaqItem;
        if (!isCurrentFaq(faq)) return undefined;
        const cat = await this.getFaqCategoryById(faq.category_id);
        return {
          ...faq,
          category_name_ar: cat?.name_ar,
          category_name_en: cat?.name_en,
        };
      },
      () => LocalDB.getFaqById(id)
    );
  },

  async createFaq(faq: FaqItem): Promise<{ success: boolean; faq?: FaqItem; message?: string }> {
    return runDbOp<{ success: boolean; faq?: FaqItem; message?: string }>(
      async () => {
        const faqRef = doc(getDb(), 'faqs', faq.id);
        const existing = await getDoc(faqRef);
        if (existing.exists()) return { success: false, message: 'السؤال موجود مسبقاً' };
        await setDoc(faqRef, faq);
        return { success: true, faq };
      },
      () => LocalDB.createFaq(faq)
    );
  },

  async updateFaq(id: string, updates: Partial<FaqItem>): Promise<{ success: boolean; faq?: FaqItem; message?: string }> {
    return runDbOp<{ success: boolean; faq?: FaqItem; message?: string }>(
      async () => {
        const faqRef = doc(getDb(), 'faqs', id);
        await updateDoc(faqRef, { ...updates, updatedAt: new Date().toISOString() });
        const snap = await getDoc(faqRef);
        return { success: true, faq: snap.data() as FaqItem };
      },
      () => LocalDB.updateFaq(id, updates)
    );
  },

  async deleteFaq(id: string): Promise<{ success: boolean; message?: string }> {
    return runDbOp<{ success: boolean; message?: string }>(
      async () => {
        await deleteDoc(doc(getDb(), 'faqs', id));
        return { success: true };
      },
      () => LocalDB.deleteFaq(id)
    );
  },

  async incrementFaqView(id: string): Promise<{ success: boolean; views?: number }> {
    return runDbOp<{ success: boolean; views?: number }>(
      async () => {
        const faqRef = doc(getDb(), 'faqs', id);
        await updateDoc(faqRef, { views: increment(1) });
        return { success: true };
      },
      () => LocalDB.incrementFaqView(id)
    );
  },

  async logFaqSearch(queryStr: string, resultsCount: number, lang: 'ar' | 'en'): Promise<{ success: boolean }> {
    return runDbOp(
      async () => {
        const logId = `search-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const log: FaqSearchLog = {
          id: logId,
          query: queryStr.trim(),
          results_count: resultsCount,
          lang,
          createdAt: new Date().toISOString(),
        };
        await setDoc(doc(getDb(), 'faq_search_logs', logId), log);
        return { success: true };
      },
      () => LocalDB.logFaqSearch(queryStr, resultsCount, lang)
    );
  },

  async getFaqStats(): Promise<FaqStats> {
    return runDbOp(
      async () => {
        const faqs = await this.getFaqs({ onlyPublished: false });
        const categories = await this.getFaqCategories(false);
        const searchSnap = await getDocs(collection(getDb(), 'faq_search_logs'));
        const searchLogs = searchSnap.docs.map((d) => d.data() as FaqSearchLog);

        const totalFaqs = faqs.length;
        const publishedFaqs = faqs.filter((f) => f.is_published).length;
        const totalCategories = categories.length;

        const mostViewedFaqs = [...faqs]
          .sort((a, b) => (b.views || 0) - (a.views || 0))
          .slice(0, 5)
          .map((f) => ({
            id: f.id,
            question_ar: f.question_ar,
            question_en: f.question_en,
            views: f.views || 0,
            category_id: f.category_id,
          }));

        const totalSearches = searchLogs.length;

        const queryCounts: Record<string, number> = {};
        const zeroCounts: Record<string, number> = {};
        for (const log of searchLogs) {
          const q = (log.query || '').trim().toLowerCase();
          if (!q) continue;
          queryCounts[q] = (queryCounts[q] || 0) + 1;
          if (log.results_count === 0) {
            zeroCounts[q] = (zeroCounts[q] || 0) + 1;
          }
        }

        const topSearchQueries = Object.entries(queryCounts)
          .map(([query, count]) => ({ query, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        const zeroResultQueries = Object.entries(zeroCounts)
          .map(([query, count]) => ({ query, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        return {
          totalFaqs,
          publishedFaqs,
          totalCategories,
          mostViewedFaqs,
          totalSearches,
          topSearchQueries,
          zeroResultQueries,
        };
      },
      () => LocalDB.getFaqStats()
    );
  }
};
