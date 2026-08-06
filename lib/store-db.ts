import { Product, Key, User, UserProduct, DownloadLog, SystemLog, SystemStats, ProductStatus } from '@/types';
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, setDoc, updateDoc, deleteDoc, query, where, getDoc, orderBy, limit } from "firebase/firestore";

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

export const StoreDB = {
  // -------------------------
  // PRODUCTS
  // -------------------------
  async getProducts(): Promise<Product[]> {
    try {
      const snapshot = await getDocs(collection(db, "products"));
      let products = snapshot.docs.map(doc => doc.data() as Product);
      
      if (products.length === 0) {
        for (const prod of initialProducts) {
          await setDoc(doc(db, "products", prod.id), prod);
        }
        products = initialProducts;
      }
      return products.sort((a, b) => a.displayOrder - b.displayOrder);
    } catch (e) {
      console.error(e);
      return [];
    }
  },
  
  async getProductById(id: string): Promise<Product | undefined> {
    const docSnap = await getDoc(doc(db, "products", id));
    if (docSnap.exists()) return docSnap.data() as Product;
    return undefined;
  },

  async createProduct(product: Product): Promise<{success: boolean; message?: string}> {
    try {
      await setDoc(doc(db, "products", product.id), product);
      return { success: true };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  },

  async updateProduct(id: string, updates: Partial<Product>): Promise<{success: boolean; message?: string}> {
    try {
      await updateDoc(doc(db, "products", id), { ...updates, updatedAt: new Date().toISOString() });
      return { success: true };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  },

  async deleteProduct(id: string): Promise<{success: boolean; message?: string}> {
    try {
      await deleteDoc(doc(db, "products", id));
      return { success: true };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  },

  // -------------------------
  // USERS
  // -------------------------
  async getUsers(): Promise<User[]> {
    const snapshot = await getDocs(collection(db, "users"));
    return snapshot.docs.map(doc => doc.data() as User);
  },

  async getUserByDiscordId(discordId: string): Promise<User | undefined> {
    const q = query(collection(db, "users"), where("discordId", "==", discordId));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return snapshot.docs[0].data() as User;
    }
    return undefined;
  },

  async createUser(user: User): Promise<void> {
    await setDoc(doc(db, "users", user.id), user);
  },

  async updateUser(id: string, updates: Partial<User>): Promise<void> {
    await updateDoc(doc(db, "users", id), updates);
  },

  async deleteUser(id: string): Promise<boolean> {
    try {
      await deleteDoc(doc(db, "users", id));
      return true;
    } catch {
      return false;
    }
  },

  // -------------------------
  // KEYS
  // -------------------------
  async getKeys(): Promise<Key[]> {
    const snapshot = await getDocs(collection(db, "keys"));
    return snapshot.docs.map(doc => doc.data() as Key);
  },
  
  async getKeysByProduct(productId: string): Promise<Key[]> {
    const q = query(collection(db, "keys"), where("productId", "==", productId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Key);
  },

  async generateKeys(productId: string, count: number, prefix: string, createdById: string): Promise<{success: boolean; keys: string[]}> {
    try {
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
        await setDoc(doc(db, "keys", newKey.id), newKey);
        generatedKeys.push(keyString);
      }

      await this.addLog('Key Creation', `تم إنشاء ${count} مفاتيح للمنتج ${product.name}`, createdById, 'Admin');
      return { success: true, keys: generatedKeys };
    } catch (e: any) {
      return { success: false, keys: [] };
    }
  },

  async bulkAddKeys(productId: string, rawKeysText: string, createdById: string): Promise<{success: boolean; count: number}> {
    try {
      const lines = rawKeysText.split('\\n').map(l => l.trim()).filter(l => l.length > 0);
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
        await setDoc(doc(db, "keys", newKey.id), newKey);
        count++;
      }
      return { success: true, count };
    } catch (e) {
      return { success: false, count: 0 };
    }
  },

  async updateKey(id: string, updates: Partial<Key>): Promise<boolean> {
    try {
      await updateDoc(doc(db, "keys", id), updates);
      return true;
    } catch {
      return false;
    }
  },

  async deleteKey(id: string): Promise<boolean> {
    try {
      await deleteDoc(doc(db, "keys", id));
      return true;
    } catch {
      return false;
    }
  },
  
  async revokeKey(keyId: string, userId: string): Promise<boolean> {
    try {
      // Delete the key
      await deleteDoc(doc(db, "keys", keyId));
      
      // Delete the user product association
      const q = query(collection(db, "userProducts"), where("userId", "==", userId), where("keyId", "==", keyId));
      const snapshot = await getDocs(q);
      for (const d of snapshot.docs) {
        await deleteDoc(d.ref);
      }
      return true;
    } catch {
      return false;
    }
  },
  
  async deleteAllKeysForProduct(productId: string): Promise<boolean> {
    try {
      const keys = await this.getKeysByProduct(productId);
      for (const k of keys) {
        await deleteDoc(doc(db, "keys", k.id));
      }
      return true;
    } catch {
      return false;
    }
  },

  async activateProductWithKey(keyString: string, userDetails: { discordId: string, name: string, email?: string, image?: string }, ipAddress: string): Promise<{success: boolean; message: string; product?: Product}> {
    try {
      const q = query(collection(db, "keys"), where("key", "==", keyString));
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
          lastIp: ipAddress
        };
        await this.createUser(user);
      } else {
        await updateDoc(doc(db, "users", user.id), { lastLogin: new Date().toISOString(), lastIp: ipAddress });
      }

      keyObj.isUsed = true;
      keyObj.usedByUserId = user.id;
      keyObj.usedAt = new Date().toISOString();
      await updateDoc(doc(db, "keys", keyObj.id), { isUsed: true, usedByUserId: user.id, usedAt: keyObj.usedAt });

      const userProduct: UserProduct = {
        id: `up-${Date.now()}`,
        userId: user.id,
        productId: product.id,
        keyId: keyObj.id,
        status: 'Active',
        activatedAt: new Date().toISOString(),
        discordRoleGranted: true
      };
      await setDoc(doc(db, "userProducts", userProduct.id), userProduct);

      await this.addLog('Key Activation', `تم تفعيل مفتاح ${product.name}`, user.id, user.name, ipAddress);
      
      return { success: true, message: 'تم التفعيل بنجاح', product };
    } catch (e: any) {
      return { success: false, message: 'حدث خطأ أثناء التفعيل' };
    }
  },

  // -------------------------
  // USER PRODUCTS
  // -------------------------
  async getUserDetails(userId: string): Promise<{user: User, products: UserProduct[]} | undefined> {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (!userDoc.exists()) return undefined;
    const user = userDoc.data() as User;
    const products = await this.getUserProducts(userId);
    return { user, products };
  },

  async getUserProducts(userId: string): Promise<UserProduct[]> {
    const q = query(collection(db, "userProducts"), where("userId", "==", userId));
    const snapshot = await getDocs(q);
    const result: UserProduct[] = [];
    
    for (const d of snapshot.docs) {
      const up = d.data() as UserProduct;
      const p = await this.getProductById(up.productId);
      if (p) {
        up.product = p;
        result.push(up);
      }
    }
    return result;
  },

  async removeProductFromUser(userId: string, productId: string): Promise<{success: boolean; message?: string}> {
    try {
      const q = query(collection(db, "userProducts"), where("userId", "==", userId), where("productId", "==", productId));
      const snapshot = await getDocs(q);
      for (const d of snapshot.docs) {
        await deleteDoc(d.ref);
      }
      return { success: true };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  },

  async addProductToUser(userId: string, productId: string): Promise<{success: boolean; message?: string}> {
    try {
      const userProduct: UserProduct = {
        id: `up-${Date.now()}`,
        userId,
        productId,
        status: 'Active',
        activatedAt: new Date().toISOString(),
        discordRoleGranted: false
      };
      await setDoc(doc(db, "userProducts", userProduct.id), userProduct);
      return { success: true };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  },

  async updateUserProductStatus(userId: string, productId: string, status: ProductStatus): Promise<{success: boolean; message?: string}> {
    try {
      const q = query(collection(db, "userProducts"), where("userId", "==", userId), where("productId", "==", productId));
      const snapshot = await getDocs(q);
      for (const d of snapshot.docs) {
        await updateDoc(d.ref, { status });
      }
      return { success: true };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  },

  // -------------------------
  // LOGS & STATS
  // -------------------------
  async addLog(action: string, details: string, userId?: string, userName?: string, ipAddress: string = '127.0.0.1'): Promise<void> {
    const log: SystemLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random()*1000)}`,
      action,
      details,
      userId: userId || null,
      userName: userName || null,
      ipAddress,
      createdAt: new Date().toISOString()
    };
    await setDoc(doc(db, "logs", log.id), log);
  },

  async getLogs(): Promise<SystemLog[]> {
    const snapshot = await getDocs(collection(db, "logs"));
    const logs = snapshot.docs.map(doc => doc.data() as SystemLog);
    return logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async recordDownload(productId: string, userId: string, ipAddress: string): Promise<{success: boolean}> {
    const dLog: DownloadLog = {
      id: `dl-${Date.now()}`,
      userId,
      productId,
      ipAddress,
      downloadedAt: new Date().toISOString()
    };
    await setDoc(doc(db, "downloads", dLog.id), dLog);

    const product = await this.getProductById(productId);
    if (product) {
      await updateDoc(doc(db, "products", productId), { downloadsCount: (product.downloadsCount || 0) + 1 });
    }
    return { success: true };
  },

  async getStats(): Promise<SystemStats> {
    const usersSnap = await getDocs(collection(db, "users"));
    const productsSnap = await getDocs(collection(db, "products"));
    const keysSnap = await getDocs(collection(db, "keys"));
    const downloadsSnap = await getDocs(collection(db, "downloads"));
    
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
  }
};
