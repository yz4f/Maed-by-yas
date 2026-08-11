import { Product, Key, User, UserProduct, DownloadLog, SystemLog, SystemStats, ProductStatus } from '@/types';
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, setDoc, updateDoc, deleteDoc, query, where, getDoc, orderBy, limit, writeBatch } from "firebase/firestore";

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
    image: '/products/fortnite-unban.png',
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
    image: '/products/spoofer-ta3n.png',
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
    if (!fs.existsSync(fallbackFilePath)) {
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
            duration: 'permanent',
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
            duration: 'permanent',
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
    const raw = fs.readFileSync(fallbackFilePath, 'utf8');
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
        duration: 'Lifetime',
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
  bulkAddKeys(productId: string, rawKeysText: string, createdById: string): {success: boolean, count: number} {
    const d = getFallbackData();
    const lines = rawKeysText.split(/[\n,]+/).map(l => l.trim()).filter(l => l.length > 0);
    let count = 0;
    for (const keyString of lines) {
      const newKey: Key = {
        id: `key-${Date.now()}-${count}`,
        key: keyString,
        productId,
        isUsed: false,
        isDisabled: false,
        isArchived: false,
        duration: 'Lifetime',
        createdById,
        createdAt: new Date().toISOString()
      };
      d.keys.push(newKey);
      count++;
    }
    saveFallbackData(d);
    return { success: true, count };
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
    d.keys = d.keys.filter((k: any) => k.id !== id);
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
  deleteAllKeysForProduct(productId: string): boolean {
    const d = getFallbackData();
    d.keys = d.keys.filter((k: any) => k.productId !== productId);
    saveFallbackData(d);
    return true;
  },
  activateProductWithKey(keyString: string, userDetails: { discordId: string, name: string, email?: string, image?: string }, ipAddress: string): {success: boolean, message: string, product?: Product} {
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

    let usedKeys = keys.filter((k: any) => k.isUsed).length;
    let unusedKeys = totalKeys - usedKeys;

    let productStockList = products.map((p: any) => {
      let pKeys = keys.filter((k: any) => k.productId === p.id && !k.isUsed && !k.isDisabled);
      return {
        productId: p.id,
        productName: p.name,
        stockCount: pKeys.length
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
            duration: 'Lifetime',
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

  async bulkAddKeys(productId: string, rawKeysText: string, createdById: string): Promise<{success: boolean; count: number}> {
    return runDbOp(
      async () => {
        const db = getDb();
        const lines = rawKeysText.split(/[\n,]+/).map(l => l.trim()).filter(l => l.length > 0);
        let count = 0;
        
        const BATCH_SIZE = 400;
        for (let i = 0; i < lines.length; i += BATCH_SIZE) {
          const batch = writeBatch(db);
          const chunk = lines.slice(i, i + BATCH_SIZE);
          
          for (const keyString of chunk) {
            const newKey: Key = {
              id: `key-${Date.now()}-${count}`,
              key: keyString,
              productId,
              isUsed: false,
              isDisabled: false,
              isArchived: false,
              duration: 'Lifetime',
              createdById,
              createdAt: new Date().toISOString()
            };
            batch.set(doc(getDb(), "keys", newKey.id), newKey);
            count++;
          }
          await batch.commit();
        }
        return { success: true, count };
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
        await deleteDoc(doc(getDb(), "keys", id));
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
  
  async deleteAllKeysForProduct(productId: string): Promise<boolean> {
    return runDbOp(
      async () => {
        const keys = await this.getKeysByProduct(productId);
        for (const k of keys) {
          await deleteDoc(doc(getDb(), "keys", k.id));
        }
        return true;
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

        keyObj.isUsed = true;
        keyObj.usedByUserId = user.id;
        keyObj.usedAt = new Date().toISOString();
        await updateDoc(doc(getDb(), "keys", keyObj.id), { isUsed: true, usedByUserId: user.id, usedAt: keyObj.usedAt });

        const userProduct: UserProduct = {
          id: `up-${Date.now()}`,
          userId: user.id,
          productId: product.id,
          keyId: keyObj.id,
          keyString: keyObj.key,
          status: 'Active',
          activatedAt: new Date().toISOString(),
          discordRoleGranted: true
        };
        await setDoc(doc(getDb(), "userProducts", userProduct.id), userProduct);

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

        let usedKeys = keys.filter(k => k.isUsed).length;
        let unusedKeys = totalKeys - usedKeys;

        let productStockList = products.map(p => {
          let pKeys = keys.filter(k => k.productId === p.id && !k.isUsed && !k.isDisabled);
          return {
            productId: p.id,
            productName: p.name,
            stockCount: pKeys.length
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
