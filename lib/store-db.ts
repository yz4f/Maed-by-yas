import { Product, Key, User, UserProduct, DownloadLog, SystemLog, SystemStats, ProductStatus } from '@/types';
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, setDoc, updateDoc, deleteDoc, query, where, getDoc, orderBy, limit, writeBatch, runTransaction } from "firebase/firestore";

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
  archived: number;
  duplicateCodes: number;
};

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

  const duplicateCodes = Array.from(codeFrequency.values()).filter((count) => count > 1).length;
  const available = keys.filter((key) => {
    const normalized = (key.key || '').trim().toUpperCase();
    return Boolean(normalized)
      && !key.isUsed
      && !key.isDisabled
      && !key.isArchived
      && codeFrequency.get(normalized) === 1;
  }).length;

  return {
    total: keys.length,
    available,
    used: keys.filter((key) => key.isUsed).length,
    disabled: keys.filter((key) => !key.isUsed && key.isDisabled).length,
    archived: keys.filter((key) => !key.isUsed && !key.isDisabled && key.isArchived).length,
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
    name: 'سبوفر تعن',
    description: 'أداة تنظيف مخلفات الألعاب وحظر الحسابات الشاملة (Cleaner + Registry Eraser + MAC Changer + SMBIOS Rewriter).',
    image: '/spoofer-logo.png',
    cardColor: 'purple',
    category: 'Utility',
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

// Fallback DB logic
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
            productName: 'سبوفر تعن',
            duration: '2 Days',
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
        ]
      };
      fs.writeFileSync(fallbackFilePath, JSON.stringify(initialData, null, 2), 'utf8');
      return initialData;
    }
    const raw = fs.readFileSync(/* turbopackIgnore: true */ fallbackFilePath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error("Failed to read fallback database file:", err);
    return { products: initialProducts, users: [], userProducts: [], keys: [], logs: [] };
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
    return await localOp();
  }
  try {
    return await firebaseOp();
  } catch (err: any) {
    console.warn("Firestore access error, falling back to local JSON database. Error details:", err?.message || err);
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
    d.products = d.products.filter((p: any) => p.id !== id);
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
    d.users = d.users.filter((u: any) => u.id !== id);
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
  generateKeys(productId: string, count: number, prefix: string, createdById: string): {success: boolean, keys: string[]} {
    const d = getFallbackData();
    const product = d.products.find((p: any) => p.id === productId);
    if (!product) return { success: false, keys: [] };
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
        duration: '2 Days',
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
  bulkAddKeys(productId: string, rawKeysText: string, createdById: string): {success: boolean, count: number, skipped: number, message?: string} {
    const d = getFallbackData();
    if (!d.products.some((product: Product) => product.id === productId)) {
      return { success: false, count: 0, skipped: 0, message: 'المنتج المطلوب غير موجود.' };
    }

    const lines = rawKeysText.split(/[\n,]+/).map(l => l.trim()).filter(l => l.length > 0);
    const existingCodes = new Set(d.keys.map((key: Key) => key.key.trim().toUpperCase()));
    const acceptedCodes: string[] = [];
    let skipped = 0;

    for (const keyString of lines) {
      const normalized = keyString.toUpperCase();
      if (existingCodes.has(normalized)) {
        skipped++;
        continue;
      }
      existingCodes.add(normalized);
      acceptedCodes.push(keyString);
    }

    const createdAt = new Date().toISOString();
    acceptedCodes.forEach((keyString, index) => {
      d.keys.push({
        id: `key-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 7)}`,
        key: keyString,
        productId,
        isUsed: false,
        isDisabled: false,
        isArchived: false,
        duration: '2 Days',
        createdById,
        createdAt
      } as Key);
    });

    if (acceptedCodes.length > 0) saveFallbackData(d);
    return { success: true, count: acceptedCodes.length, skipped };
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
    if (!key || key.isUsed) return false;
    d.keys = d.keys.filter((item: Key) => item.id !== id);
    saveFallbackData(d);
    return true;
  },
  revokeKey(keyId: string, userId: string): boolean {
    const d = getFallbackData();
    d.keys = d.keys.filter((k: any) => k.id !== keyId);
    d.userProducts = d.userProducts.filter((up: any) => !(up.userId === userId && up.keyId === keyId));
    saveFallbackData(d);
    return true;
  },
  deleteAllKeysForProduct(productId: string): number {
    const d = getFallbackData();
    const removableKeys = d.keys.filter((key: Key) => key.productId === productId && !key.isUsed);
    if (removableKeys.length === 0) return 0;
    const removableIds = new Set(removableKeys.map((key: Key) => key.id));
    d.keys = d.keys.filter((key: Key) => !removableIds.has(key.id));
    saveFallbackData(d);
    return removableKeys.length;
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

    const alreadyActivated = d.userProducts.some((item: UserProduct) => {
      if (item.userId !== user.id || item.productId !== product.id || item.status !== 'Active') return false;
      return !item.expiresAt || new Date(item.expiresAt).getTime() > Date.now();
    });
    if (alreadyActivated) return { success: false, message: 'لديك هذا المنتج مفعّل بالفعل' };

    d.keys[keyIdx].isUsed = true;
    d.keys[keyIdx].usedByUserId = user.id;
    d.keys[keyIdx].usedAt = new Date().toISOString();

    const userProduct: UserProduct = {
      id: `up-${Date.now()}`,
      userId: user.id,
      productId: product.id,
      keyId: keyObj.id,
      keyString: keyObj.key,
      status: 'Active',
      activatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + PRODUCT_LICENSE_DURATION_MS).toISOString(),
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
      expiresAt: new Date(Date.now() + PRODUCT_LICENSE_DURATION_MS).toISOString(),
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
  addLog(action: string, details: string, userId?: string, userName?: string, ipAddress: string = '127.0.0.1'): void {
    const d = getFallbackData();
    const log: SystemLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random()*1000)}`,
      action,
      details,
      userId: userId || null,
      userName: userName || null,
      ipAddress,
      createdAt: new Date().toISOString()
    };
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
        
        if (products.length === 0) {
          for (const prod of initialProducts) {
            await setDoc(doc(getDb(), "products", prod.id), prod);
          }
          products = initialProducts;
        } else {
          for (const initProd of initialProducts) {
            const existing = products.find(p => p.id === initProd.id);
            if (!existing) {
              try {
                await setDoc(doc(getDb(), "products", initProd.id), initProd);
                products.push(initProd);
              } catch (e) {
                console.error("Auto-seed product failed:", e);
              }
            } else if (existing.description !== initProd.description || existing.name !== initProd.name) {
              try {
                await updateDoc(doc(getDb(), "products", initProd.id), {
                  name: initProd.name,
                  description: initProd.description,
                  category: initProd.category,
                  cardColor: initProd.cardColor,
                  updatedAt: new Date().toISOString()
                });
                existing.name = initProd.name;
                existing.description = initProd.description;
                existing.category = initProd.category;
                existing.cardColor = initProd.cardColor;
              } catch (e) {
                console.error("Auto-sync product failed:", e);
              }
            }
          }
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
        await deleteDoc(doc(getDb(), "products", id));
        return { success: true };
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
        await deleteDoc(doc(getDb(), "users", id));
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

  async generateKeys(productId: string, count: number, prefix: string, createdById: string): Promise<{success: boolean; keys: string[]}> {
    return runDbOp(
      async () => {
        const generatedKeys: string[] = [];
        const product = await this.getProductById(productId);
        if (!product) throw new Error("المنتج غير موجود");

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
            duration: '2 Days',
            createdById,
            createdAt: new Date().toISOString()
          };
          await setDoc(doc(getDb(), "keys", newKey.id), newKey);
          generatedKeys.push(keyString);
        }

        await this.addLog('Key Creation', `تم إنشاء ${count} مفاتيح للمنتج ${product.name}`, createdById, 'Admin');
        return { success: true, keys: generatedKeys };
      },
      () => LocalDB.generateKeys(productId, count, prefix, createdById)
    );
  },

  async bulkAddKeys(productId: string, rawKeysText: string, createdById: string): Promise<{success: boolean; count: number; skipped: number; message?: string}> {
    return runDbOp(
      async () => {
        const db = getDb();
        const product = await this.getProductById(productId);
        if (!product) return { success: false, count: 0, skipped: 0, message: 'المنتج المطلوب غير موجود.' };

        const lines = rawKeysText.split(/[\n,]+/).map(l => l.trim()).filter(l => l.length > 0);
        const existingKeys = await this.getKeys();
        const existingCodes = new Set(existingKeys.map((key) => key.key.trim().toUpperCase()));
        const acceptedCodes: string[] = [];
        let skipped = 0;

        for (const keyString of lines) {
          const normalized = keyString.toUpperCase();
          if (existingCodes.has(normalized)) {
            skipped++;
            continue;
          }
          existingCodes.add(normalized);
          acceptedCodes.push(keyString);
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
              duration: '2 Days',
              createdById,
              createdAt
            };
            batch.set(doc(db, "keys", newKey.id), newKey);
          });
          await batch.commit();
        }

        return { success: true, count: acceptedCodes.length, skipped };
      },
      () => LocalDB.bulkAddKeys(productId, rawKeysText, createdById)
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
        const keyRef = doc(getDb(), "keys", id);
        const keySnap = await getDoc(keyRef);
        if (!keySnap.exists() || (keySnap.data() as Key).isUsed) return false;
        await deleteDoc(keyRef);
        return true;
      },
      () => LocalDB.deleteKey(id)
    );
  },
  
  async revokeKey(keyId: string, userId: string): Promise<boolean> {
    return runDbOp(
      async () => {
        await deleteDoc(doc(getDb(), "keys", keyId));
        const q = query(collection(getDb(), "userProducts"), where("userId", "==", userId), where("keyId", "==", keyId));
        const snapshot = await getDocs(q);
        for (const d of snapshot.docs) {
          await deleteDoc(d.ref);
        }
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
        await Promise.all(removableKeys.map((key) => deleteDoc(doc(getDb(), "keys", key.id))));
        return removableKeys.length;
      },
      () => LocalDB.deleteAllKeysForProduct(productId)
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
        if (existingLicenses.some((license) => {
          if (license.productId !== product.id || license.status !== 'Active') return false;
          return !license.expiresAt || new Date(license.expiresAt).getTime() > Date.now();
        })) {
          return { success: false, message: 'لديك هذا المنتج مفعّل بالفعل' };
        }

        const usedAt = new Date().toISOString();
        const expiresAt = new Date(Date.parse(usedAt) + PRODUCT_LICENSE_DURATION_MS).toISOString();
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
        const result: UserProduct[] = [];
        
        for (const d of snapshot.docs) {
          const up = d.data() as UserProduct;
          if (up.keyId && !up.keyString) {
            try {
              const keyDoc = await getDoc(doc(getDb(), "keys", up.keyId));
              if (keyDoc.exists()) {
                up.keyString = (keyDoc.data() as Key).key;
              }
            } catch (e) {
              console.error("Failed to fetch key for user product:", e);
            }
          }
          const p = await this.getProductById(up.productId);
          if (p) {
            up.product = p;
            result.push(up);
          }
        }
        return result;
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
          expiresAt: new Date(Date.now() + PRODUCT_LICENSE_DURATION_MS).toISOString(),
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
  async addLog(action: string, details: string, userId?: string, userName?: string, ipAddress: string = '127.0.0.1'): Promise<void> {
    return runDbOp(
      async () => {
        const log: SystemLog = {
          id: `log-${Date.now()}-${Math.floor(Math.random()*1000)}`,
          action,
          details,
          userId: userId || null,
          userName: userName || null,
          ipAddress,
          createdAt: new Date().toISOString()
        };
        await setDoc(doc(getDb(), "logs", log.id), log);
      },
      () => LocalDB.addLog(action, details, userId, userName, ipAddress)
    );
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
  }
};
