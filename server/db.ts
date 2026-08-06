import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const DATA_DIR = process.env.VERCEL ? path.join('/tmp', 'data') : path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

export const UPLOADS_DIR = process.env.VERCEL ? path.join('/tmp', 'uploads') : path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const STORE_PATH = path.join(DATA_DIR, 'store.json');

const OWNER_EMAIL = 'yasemoh24@gmail.com';

export interface User {
  id: string;
  google_id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'user' | 'admin' | 'owner';
  is_banned: number;
  ban_reason?: string;
  ip?: string;
  user_agent?: string;
  created_at: string;
  last_login: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  image: string;
  category: string;
  status: 'active' | 'hidden';
  created_at: string;
  updated_at: string;
}

export interface ProductFile {
  id: string;
  product_id: string;
  filename: string;
  original_name: string;
  size: number;
  mime_type: string;
  download_count: number;
  created_at: string;
}

export interface ProductKey {
  id: string;
  product_id: string;
  key_value: string;
  status: 'unused' | 'used' | 'expired' | 'disabled';
  duration?: 'lifetime' | '30d' | '7d' | '1d';
  expires_at?: string;
  used_by?: string;
  used_at?: string;
  used_ip?: string;
  used_ua?: string;
  created_at: string;
}

export interface UserProduct {
  id: string;
  user_id: string;
  product_id: string;
  key_id?: string;
  activated_at: string;
  ip?: string;
  user_agent?: string;
}

export interface LogEntry {
  id: string;
  user_id?: string;
  user_email?: string;
  action: string;
  details?: string;
  ip?: string;
  user_agent?: string;
  created_at: string;
}

export interface SessionEntry {
  id: string;
  user_id: string;
  refresh_token: string;
  expires_at: string;
  created_at: string;
}

export interface ChatTicketMessage {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_role: 'user' | 'admin' | 'owner';
  message: string;
  image_url?: string;
  created_at: string;
}

export interface ChatTicket {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  title: string;
  status: 'open' | 'closed';
  created_at: string;
  updated_at: string;
  messages: ChatTicketMessage[];
}

export interface StoreData {
  users: User[];
  products: Product[];
  product_files: ProductFile[];
  product_keys: ProductKey[];
  user_products: UserProduct[];
  logs: LogEntry[];
  settings: Record<string, string>;
  sessions: SessionEntry[];
  tickets: ChatTicket[];
}

const defaultStore: StoreData = {
  users: [
    {
      id: 'owner-seed-id',
      google_id: 'pending',
      name: 'ياسر (المالك - Owner)',
      email: OWNER_EMAIL,
      avatar: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
      role: 'owner',
      is_banned: 0,
      created_at: new Date().toISOString(),
      last_login: new Date().toISOString()
    }
  ],
  products: [
    {
      id: 'spoofer-prod-1',
      name: 'سبوفر تعن (TA3N Spoofer)',
      description: 'أقوى سبوفر لتخطي الحظر العتادي بالكامل للأجهزة بدون فورمات وبضغطة زر واحدة.',
      image: '/spoofer_bg.png',
      category: 'spoofer',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'unban-prod-2',
      name: 'فك حظر فورت نايت (Fortnite Unban)',
      description: 'أداة فك حظر حسابات وأجهزة فورت نايت بسرعة وأمان 100%.',
      image: '/fortnite-unban.png',
      category: 'unban',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  product_files: [
    {
      id: 'file-spoofer-1',
      product_id: 'spoofer-prod-1',
      filename: 'discord.gg_t3n.rar',
      original_name: 'discord.gg_t3n.rar',
      size: 100353901,
      mime_type: 'application/x-rar-compressed',
      download_count: 1482,
      created_at: new Date().toISOString()
    },
    {
      id: 'file-unban-2',
      product_id: 'unban-prod-2',
      filename: 'discord.gg_t3n.rar',
      original_name: 'discord.gg_t3n.rar',
      size: 100353901,
      mime_type: 'application/x-rar-compressed',
      download_count: 1240,
      created_at: new Date().toISOString()
    }
  ],
  product_keys: [
    {
      id: 'key-seed-1',
      product_id: 'spoofer-prod-1',
      key_value: 'TA3N-SPOOF-2026-VIP-001',
      status: 'unused',
      created_at: new Date().toISOString()
    },
    {
      id: 'key-seed-2',
      product_id: 'unban-prod-2',
      key_value: 'TA3N-UNBAN-2026-PRO-001',
      status: 'unused',
      created_at: new Date().toISOString()
    }
  ],
  user_products: [],
  logs: [],
  settings: {
    site_name: 'تـعـن',
    discord_webhook_url: '',
    admin_emails: OWNER_EMAIL
  },
  sessions: [],
  tickets: []
};

let memoryStore: StoreData = { ...defaultStore };

function loadStore(): StoreData {
  try {
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      return {
        users: parsed.users || [...defaultStore.users],
        products: parsed.products || [...defaultStore.products],
        product_files: parsed.product_files || [],
        product_keys: parsed.product_keys || [...defaultStore.product_keys],
        user_products: parsed.user_products || [],
        logs: parsed.logs || [],
        settings: { ...defaultStore.settings, ...(parsed.settings || {}) },
        sessions: parsed.sessions || [],
        tickets: parsed.tickets || []
      };
    }
  } catch (err) {
    console.error('Error loading JSON store:', err);
  }
  return JSON.parse(JSON.stringify(defaultStore));
}

const FIRESTORE_PROJECT = 'tnnn-aa170';
const FIRESTORE_URL = `https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT}/databases/(default)/documents/store/main`;

async function syncToFirestore(data: StoreData) {
  try {
    await fetch(FIRESTORE_URL, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          payload: { stringValue: JSON.stringify(data) }
        }
      })
    });
  } catch {
    // ignore errors
  }
}

async function pullFromFirestore() {
  try {
    const res = await fetch(FIRESTORE_URL);
    if (res.ok) {
      const json = await res.json();
      if (json && json.fields && json.fields.payload && json.fields.payload.stringValue) {
        const cloudStore = JSON.parse(json.fields.payload.stringValue);
        if (cloudStore && cloudStore.users && cloudStore.products) {
          memoryStore = cloudStore;
          fs.writeFileSync(STORE_PATH, JSON.stringify(memoryStore, null, 2), 'utf-8');
          console.log('Successfully loaded persistent store from Firestore tnnn-aa170');
        }
      }
    }
  } catch {
    // ignore errors
  }
}

function saveStore() {
  try {
    fs.writeFileSync(STORE_PATH, JSON.stringify(memoryStore, null, 2), 'utf-8');
    syncToFirestore(memoryStore);
  } catch (err) {
    console.error('Error saving JSON store:', err);
  }
}

memoryStore = loadStore();

let firestorePromise: Promise<void> | null = null;
export function ensureDbLoaded(): Promise<void> {
  if (firestorePromise) return firestorePromise;
  firestorePromise = (async () => {
    try {
      await pullFromFirestore();
    } catch (err) {
      console.error('Error during Firestore database initialization:', err);
    }
  })();
  return firestorePromise;
}

// Start pulling Firestore data immediately in the background
ensureDbLoaded();

// Dummy compatibility export for any routes checking db
export const db = {
  prepare: (sql?: string) => ({
    run: (...args: any[]) => ({} as any),
    get: (...args: any[]) => (null as any),
    all: (...args: any[]) => ([] as any[])
  }),
  transaction: (fn: any) => fn
};

// ─── Users ───
export function findUserByEmail(email: string): User | undefined {
  return memoryStore.users.find(u => u.email.toLowerCase() === email.toLowerCase());
}

export function findUserByGoogleId(googleId: string): User | undefined {
  return memoryStore.users.find(u => u.google_id === googleId);
}

export function findUserById(id: string): User | undefined {
  return memoryStore.users.find(u => u.id === id);
}

export function upsertUser(data: {
  google_id: string;
  name: string;
  email: string;
  avatar?: string;
  ip?: string;
  user_agent?: string;
}): User {
  const now = new Date().toISOString();
  const correctRole: 'owner' | 'user' =
    data.email.trim().toLowerCase() === OWNER_EMAIL.trim().toLowerCase() ? 'owner' : 'user';

  const existing = findUserByGoogleId(data.google_id);
  if (existing) {
    existing.name = data.name;
    existing.avatar = data.avatar || existing.avatar;
    existing.ip = data.ip;
    existing.user_agent = data.user_agent;
    existing.role = correctRole;
    existing.last_login = now;
    saveStore();
    return existing;
  }

  const placeholder = findUserByEmail(data.email);
  if (placeholder) {
    placeholder.google_id = data.google_id;
    placeholder.name = data.name;
    placeholder.avatar = data.avatar;
    placeholder.role = correctRole;
    placeholder.ip = data.ip;
    placeholder.user_agent = data.user_agent;
    placeholder.last_login = now;
    saveStore();
    return placeholder;
  }

  const newUser: User = {
    id: uuidv4(),
    google_id: data.google_id,
    name: data.name,
    email: data.email,
    avatar: data.avatar || '',
    role: correctRole,
    is_banned: 0,
    ip: data.ip,
    user_agent: data.user_agent,
    created_at: now,
    last_login: now
  };

  memoryStore.users.push(newUser);
  saveStore();
  return newUser;
}

export function getAllUsers() {
  return memoryStore.users.map(u => ({
    ...u,
    activated_count: memoryStore.user_products.filter(up => up.user_id === u.id).length
  }));
}

export function banUser(userId: string, reason?: string) {
  const user = findUserById(userId);
  if (user) {
    user.is_banned = 1;
    user.ban_reason = reason || '';
    saveStore();
  }
}

export function unbanUser(userId: string) {
  const user = findUserById(userId);
  if (user) {
    user.is_banned = 0;
    user.ban_reason = undefined;
    saveStore();
  }
}

export function setUserRole(userId: string, role: 'user' | 'admin' | 'owner') {
  const user = findUserById(userId);
  if (user) {
    user.role = role;
    saveStore();
  }
}

export function deleteUser(userId: string) {
  memoryStore.users = memoryStore.users.filter(u => u.id !== userId);
  memoryStore.user_products = memoryStore.user_products.filter(up => up.user_id !== userId);
  memoryStore.sessions = memoryStore.sessions.filter(s => s.user_id !== userId);
  saveStore();
}

// ─── Products ───
export function getAllProducts(includeHidden = false) {
  const filtered = includeHidden
    ? memoryStore.products
    : memoryStore.products.filter(p => p.status === 'active');

  return filtered.map(p => {
    const productKeys = memoryStore.product_keys.filter(k => k.product_id === p.id);
    const unusedKeys = productKeys.filter(k => k.status === 'unused').length;
    const totalDownloads = memoryStore.product_files
      .filter(f => f.product_id === p.id)
      .reduce((acc, f) => acc + (f.download_count || 0), 0);
    return {
      ...p,
      keys_remaining: unusedKeys,
      keys_total: productKeys.length,
      stock_count: unusedKeys,
      activated_count: memoryStore.user_products.filter(up => up.product_id === p.id).length,
      total_downloads: totalDownloads
    };
  });
}

export function getProductById(id: string) {
  const p = memoryStore.products.find(prod => prod.id === id);
  if (!p) return undefined;
  const productKeys = memoryStore.product_keys.filter(k => k.product_id === p.id);
  const unusedKeys = productKeys.filter(k => k.status === 'unused').length;
  const totalDownloads = memoryStore.product_files
    .filter(f => f.product_id === p.id)
    .reduce((acc, f) => acc + (f.download_count || 0), 0);
  return {
    ...p,
    keys_remaining: unusedKeys,
    keys_total: productKeys.length,
    stock_count: unusedKeys,
    activated_count: memoryStore.user_products.filter(up => up.product_id === p.id).length,
    total_downloads: totalDownloads
  };
}

export function createProduct(data: { name: string; description?: string; image?: string; category?: string }) {
  const id = uuidv4();
  const now = new Date().toISOString();
  const newProduct: Product = {
    id,
    name: data.name,
    description: data.description || '',
    image: data.image || '',
    category: data.category || 'general',
    status: 'active',
    created_at: now,
    updated_at: now
  };
  memoryStore.products.push(newProduct);
  saveStore();
  return newProduct;
}

export function updateProduct(id: string, data: Partial<Product>) {
  const product = memoryStore.products.find(p => p.id === id);
  if (product) {
    if (data.name !== undefined) product.name = data.name;
    if (data.description !== undefined) product.description = data.description;
    if (data.image !== undefined) product.image = data.image;
    if (data.category !== undefined) product.category = data.category;
    if (data.status !== undefined) product.status = data.status;
    product.updated_at = new Date().toISOString();
    saveStore();
  }
  return product;
}

export function deleteProduct(id: string) {
  memoryStore.products = memoryStore.products.filter(p => p.id !== id);
  memoryStore.product_files = memoryStore.product_files.filter(f => f.product_id !== id);
  memoryStore.product_keys = memoryStore.product_keys.filter(k => k.product_id !== id);
  memoryStore.user_products = memoryStore.user_products.filter(up => up.product_id !== id);
  saveStore();
}

// ─── Files ───
export function getProductFiles(productId: string) {
  return memoryStore.product_files.filter(f => f.product_id === productId);
}

export function addProductFile(data: { product_id: string; filename: string; original_name: string; size: number; mime_type?: string }) {
  const newFile: ProductFile = {
    id: uuidv4(),
    product_id: data.product_id,
    filename: data.filename,
    original_name: data.original_name,
    size: data.size,
    mime_type: data.mime_type || 'application/octet-stream',
    download_count: 0,
    created_at: new Date().toISOString()
  };
  memoryStore.product_files.push(newFile);
  saveStore();
  return newFile;
}

export function deleteProductFile(fileId: string) {
  const file = memoryStore.product_files.find(f => f.id === fileId);
  if (file) {
    memoryStore.product_files = memoryStore.product_files.filter(f => f.id !== fileId);
    // Attempt physical delete from disk
    try {
      const filePath = path.join(UPLOADS_DIR, file.filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch { /* ignore */ }
    saveStore();
  }
  return file;
}

export function incrementDownloadCount(fileId: string) {
  const file = memoryStore.product_files.find(f => f.id === fileId);
  if (file) {
    file.download_count++;
    saveStore();
  }
}

// ─── Keys ───
export function getKeysByProduct(productId: string) {
  return memoryStore.product_keys
    .filter(k => k.product_id === productId)
    .map(k => {
      const usedUser = k.used_by ? findUserById(k.used_by) : null;
      return {
        ...k,
        used_by_name: usedUser?.name || null,
        used_by_email: usedUser?.email || null
      };
    });
}

export function getAllKeys() {
  return memoryStore.product_keys.map(k => {
    const product = memoryStore.products.find(p => p.id === k.product_id);
    const usedUser = k.used_by ? findUserById(k.used_by) : null;
    return {
      ...k,
      product_name: product?.name || null,
      used_by_name: usedUser?.name || null,
      used_by_email: usedUser?.email || null
    };
  });
}

export function searchKeys(query: string) {
  const q = query.toLowerCase();
  return getAllKeys().filter(
    k => k.key_value.toLowerCase().includes(q) || (k.used_by_email && k.used_by_email.toLowerCase().includes(q))
  );
}

export function addKeys(productId: string, keys: string[], duration?: 'lifetime' | '30d' | '7d' | '1d') {
  let added = 0;
  for (const k of keys) {
    const trimmed = k.trim();
    if (trimmed && !memoryStore.product_keys.some(existing => existing.key_value === trimmed)) {
      memoryStore.product_keys.push({
        id: uuidv4(),
        product_id: productId,
        key_value: trimmed,
        status: 'unused',
        duration: duration || 'lifetime',
        created_at: new Date().toISOString()
      });
      added++;
    }
  }
  if (added > 0) saveStore();
  return added;
}

// Generate keys automatically
export function generateKeys(productId: string, count: number, duration: 'lifetime' | '30d' | '7d' | '1d' = 'lifetime', prefix?: string) {
  const product = memoryStore.products.find(p => p.id === productId);
  const productPrefix = prefix || (product?.name?.includes('سبوفر') ? 'TA3N-SPOOF' : product?.name?.includes('فورت') ? 'TA3N-UNBAN' : 'TA3N');
  const generated: string[] = [];
  
  for (let i = 0; i < count; i++) {
    const segment1 = Math.random().toString(36).substring(2, 6).toUpperCase();
    const segment2 = Math.random().toString(36).substring(2, 6).toUpperCase();
    const segment3 = Math.random().toString(36).substring(2, 6).toUpperCase();
    const keyValue = `${productPrefix}-${segment1}-${segment2}-${segment3}`;
    
    if (!memoryStore.product_keys.some(existing => existing.key_value === keyValue)) {
      memoryStore.product_keys.push({
        id: uuidv4(),
        product_id: productId,
        key_value: keyValue,
        status: 'unused',
        duration,
        created_at: new Date().toISOString()
      });
      generated.push(keyValue);
    }
  }
  
  if (generated.length > 0) saveStore();
  return generated;
}

// Get key statistics for a product
export function getKeyStats(productId?: string) {
  const keys = productId 
    ? memoryStore.product_keys.filter(k => k.product_id === productId)
    : memoryStore.product_keys;
  return {
    total: keys.length,
    unused: keys.filter(k => k.status === 'unused').length,
    used: keys.filter(k => k.status === 'used').length,
    expired: keys.filter(k => k.status === 'expired').length,
    disabled: keys.filter(k => k.status === 'disabled').length
  };
}

// Toggle key status (disable/enable)
export function toggleKeyStatus(keyId: string, newStatus: 'unused' | 'disabled') {
  const key = memoryStore.product_keys.find(k => k.id === keyId);
  if (key && (key.status === 'unused' || key.status === 'disabled')) {
    key.status = newStatus;
    saveStore();
  }
  return key;
}

export function deleteKey(keyId: string) {
  memoryStore.product_keys = memoryStore.product_keys.filter(k => k.id !== keyId);
  saveStore();
}

export function findKeyByValue(keyValue: string) {
  const k = memoryStore.product_keys.find(key => key.key_value === keyValue);
  if (!k) return undefined;
  const prod = memoryStore.products.find(p => p.id === k.product_id);
  return {
    ...k,
    product_name: prod?.name || null
  };
}

export function redeemKey(keyValue: string, userId: string, ip: string, ua: string) {
  const cleanedKey = keyValue.trim();

  // 1. Check if the key is already used in user_products or product_keys
  const alreadyUsed = memoryStore.user_products.some(up => up.key_id === cleanedKey || (up as any).key_value === cleanedKey);
  const dbKey = memoryStore.product_keys.find(k => k.key_value === cleanedKey);
  if ((dbKey && dbKey.status === 'used') || alreadyUsed) {
    return { success: false, error: 'المفتاح مستخدم مسبقاً' };
  }

  // 2. Decide which product this key belongs to
  let productId = '';
  let productName = '';

  if (dbKey) {
    productId = dbKey.product_id;
    const prod = memoryStore.products.find(p => p.id === productId);
    productName = prod?.name || 'منتج غير معروف';
  } else {
    // Auto-detect based on key prefix
    const upperKey = cleanedKey.toUpperCase();
    if (upperKey.includes('SPOOF')) {
      productId = 'spoofer-prod-1';
      productName = 'سبوفر تعن (TA3N Spoofer)';
    } else if (upperKey.includes('UNBAN')) {
      productId = 'unban-prod-2';
      productName = 'فك حظر فورت نايت (Fortnite Unban)';
    } else {
      // Default fallback
      productId = 'spoofer-prod-1';
      productName = 'سبوفر تعن (TA3N Spoofer)';
    }
  }

  // Check if the user already has this product active
  const existing = memoryStore.user_products.find(up => up.user_id === userId && up.product_id === productId);
  if (existing) {
    return { success: false, error: 'لديك هذا المنتج مفعّل بالفعل' };
  }

  // 3. Register/Update key status in store
  if (!dbKey) {
    memoryStore.product_keys.push({
      id: uuidv4(),
      product_id: productId,
      key_value: cleanedKey,
      status: 'used',
      used_by: userId,
      used_at: new Date().toISOString(),
      used_ip: ip,
      used_ua: ua,
      created_at: new Date().toISOString()
    });
  } else {
    dbKey.status = 'used';
    dbKey.used_by = userId;
    dbKey.used_at = new Date().toISOString();
    dbKey.used_ip = ip;
    dbKey.used_ua = ua;
  }

  // 4. Activate the product
  memoryStore.user_products.push({
    id: uuidv4(),
    user_id: userId,
    product_id: productId,
    key_id: cleanedKey,
    activated_at: new Date().toISOString(),
    ip,
    user_agent: ua
  });

  saveStore();
  return { success: true, productName, productId };
}

export function getUserProducts(userId: string) {
  return memoryStore.user_products
    .filter(up => up.user_id === userId)
    .map(up => {
      const prod = memoryStore.products.find(p => p.id === up.product_id);
      const keyObj = memoryStore.product_keys.find(k => k.id === up.key_id || k.key_value === up.key_id);
      return {
        ...up,
        name: prod?.name || '',
        description: prod?.description || '',
        image: prod?.image || '',
        category: prod?.category || 'general',
        key_value: keyObj ? keyObj.key_value : (up.key_id || ''),
        files: memoryStore.product_files.filter(f => f.product_id === up.product_id),
        file_count: memoryStore.product_files.filter(f => f.product_id === up.product_id).length
      };
    });
}

// ─── Detailed Redeemed Keys View for Admin ───
export function getRedeemedKeysDetails() {
  const usedKeys = memoryStore.product_keys.filter(k => k.status === 'used');
  return usedKeys.map(k => {
    const prod = memoryStore.products.find(p => p.id === k.product_id);
    const user = k.used_by ? findUserById(k.used_by) : null;
    const userLogs = k.used_by ? memoryStore.logs.filter(l => l.user_id === k.used_by && l.action.includes('تحميل')) : [];
    
    return {
      id: k.id,
      key_value: k.key_value,
      product_id: k.product_id,
      product_name: prod?.name || 'منتج غير معروف',
      user_id: k.used_by || '',
      username: user?.name || 'مستخدم غير معروف',
      user_email: user?.email || '',
      ip: k.used_ip || user?.ip || '127.0.0.1',
      user_agent: k.used_ua || user?.user_agent || '',
      redeem_date: k.used_at || k.created_at,
      license_type: k.duration || 'lifetime',
      download_count: userLogs.length,
      last_download: userLogs[0]?.created_at,
      status: 'active'
    };
  });
}

// ─── Detailed User View for Admin ───
export function getDetailedUserView(userId: string) {
  const user = findUserById(userId);
  if (!user) return null;

  const userProducts = getUserProducts(userId);
  const activatedKeys = memoryStore.product_keys.filter(k => k.used_by === userId);
  const downloadLogs = memoryStore.logs.filter(l => l.user_id === userId && l.action.includes('تحميل'));
  const activityLogs = memoryStore.logs.filter(l => l.user_id === userId);

  return {
    ...user,
    owned_products: userProducts,
    activated_keys: activatedKeys,
    download_history: downloadLogs.map(dl => ({
      file_name: dl.details || 'ملف المنتج',
      product_name: 'منتج مفعّل',
      downloaded_at: dl.created_at,
      ip: dl.ip || '127.0.0.1',
      user_agent: dl.user_agent || ''
    })),
    activity_logs: activityLogs
  };
}

// ─── Logs ───
export function addLog(data: {
  user_id?: string;
  user_email?: string;
  action: string;
  details?: string;
  ip?: string;
  user_agent?: string;
}) {
  const log: LogEntry = {
    id: uuidv4(),
    user_id: data.user_id,
    user_email: data.user_email,
    action: data.action,
    details: data.details || '',
    ip: data.ip || '',
    user_agent: data.user_agent || '',
    created_at: new Date().toISOString()
  };
  memoryStore.logs.unshift(log);
  if (memoryStore.logs.length > 1000) memoryStore.logs = memoryStore.logs.slice(0, 1000);
  saveStore();
  return log;
}

export function getLogs(limit = 200, offset = 0, action?: string) {
  const filtered = (action && action !== 'all')
    ? memoryStore.logs.filter(l => l.action === action)
    : memoryStore.logs;
  return filtered.slice(offset, offset + limit);
}

// ─── Sessions ───
export function createSession(userId: string, refreshToken: string, expiresAt: string) {
  memoryStore.sessions.push({
    id: uuidv4(),
    user_id: userId,
    refresh_token: refreshToken,
    expires_at: expiresAt,
    created_at: new Date().toISOString()
  });
  saveStore();
}

export function findSession(refreshToken: string) {
  return memoryStore.sessions.find(s => s.refresh_token === refreshToken);
}

export function deleteSession(refreshToken: string) {
  memoryStore.sessions = memoryStore.sessions.filter(s => s.refresh_token !== refreshToken);
  saveStore();
}

export function deleteUserSessions(userId: string) {
  memoryStore.sessions = memoryStore.sessions.filter(s => s.user_id !== userId);
  saveStore();
}

// ─── Settings ───
export function getSetting(key: string): string {
  return memoryStore.settings[key] || '';
}

export function setSetting(key: string, value: string) {
  memoryStore.settings[key] = value;
  saveStore();
}

// ─── Stats ───
export function getStats() {
  const totalUsers = memoryStore.users.length;
  const totalProducts = memoryStore.products.length;
  const totalKeys = memoryStore.product_keys.length;
  const usedKeys = memoryStore.product_keys.filter(k => k.status === 'used').length;
  const unusedKeys = memoryStore.product_keys.filter(k => k.status === 'unused').length;
  const totalDownloads = memoryStore.product_files.reduce((acc, f) => acc + (f.download_count || 0), 0);
  const totalLogs = memoryStore.logs.length;

  const recentActivations = [...memoryStore.user_products]
    .sort((a, b) => b.activated_at.localeCompare(a.activated_at))
    .slice(0, 10)
    .map(up => {
      const p = memoryStore.products.find(prod => prod.id === up.product_id);
      const u = memoryStore.users.find(usr => usr.id === up.user_id);
      return {
        ...up,
        product_name: p?.name || '',
        user_name: u?.name || '',
        user_email: u?.email || ''
      };
    });

  const recentUsers = [...memoryStore.users]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 10);

  return {
    totalUsers,
    totalProducts,
    totalKeys,
    usedKeys,
    unusedKeys,
    totalDownloads,
    totalLogs,
    recentActivations,
    recentUsers
  };
}

// ─── Chat Tickets ───
export function createTicket(userId: string, title: string, initialMessage: string, imageUrl?: string): ChatTicket {
  const user = findUserById(userId);
  const now = new Date().toISOString();
  const ticketId = uuidv4();
  const newTicket: ChatTicket = {
    id: ticketId,
    user_id: userId,
    user_name: user?.name || 'عميل',
    user_email: user?.email || '',
    title,
    status: 'open',
    created_at: now,
    updated_at: now,
    messages: [
      {
        id: uuidv4(),
        sender_id: userId,
        sender_name: user?.name || 'عميل',
        sender_role: user?.role || 'user',
        message: initialMessage,
        image_url: imageUrl,
        created_at: now
      }
    ]
  };
  if (!memoryStore.tickets) memoryStore.tickets = [];
  memoryStore.tickets.push(newTicket);
  addLog({
    user_id: userId,
    user_email: user?.email,
    action: 'ticket_create',
    details: `تم إنشاء تذكرة دعم جديدة: ${title}`
  });
  saveStore();
  return newTicket;
}

export function addMessageToTicket(ticketId: string, senderId: string, message: string, imageUrl?: string): boolean {
  if (!memoryStore.tickets) memoryStore.tickets = [];
  const ticket = memoryStore.tickets.find(t => t.id === ticketId);
  if (!ticket) return false;
  
  const sender = findUserById(senderId);
  const now = new Date().toISOString();
  
  ticket.messages.push({
    id: uuidv4(),
    sender_id: senderId,
    sender_name: sender?.name || 'مستخدم',
    sender_role: sender?.role || 'user',
    message,
    image_url: imageUrl,
    created_at: now
  });
  ticket.updated_at = now;
  
  addLog({
    user_id: senderId,
    user_email: sender?.email,
    action: sender?.role === 'user' ? 'ticket_reply_user' : 'ticket_reply_admin',
    details: `إضافة رد على التذكرة #${ticketId}`
  });
  saveStore();
  return true;
}

export function getTicketsByUser(userId: string): ChatTicket[] {
  if (!memoryStore.tickets) memoryStore.tickets = [];
  return memoryStore.tickets.filter(t => t.user_id === userId);
}

export function getAllTickets(): ChatTicket[] {
  if (!memoryStore.tickets) memoryStore.tickets = [];
  return memoryStore.tickets;
}

export function closeTicket(ticketId: string, userId: string): boolean {
  if (!memoryStore.tickets) memoryStore.tickets = [];
  const ticket = memoryStore.tickets.find(t => t.id === ticketId);
  if (!ticket) return false;
  ticket.status = 'closed';
  ticket.updated_at = new Date().toISOString();
  const user = findUserById(userId);
  addLog({
    user_id: userId,
    user_email: user?.email,
    action: 'ticket_close',
    details: `تم إغلاق التذكرة #${ticketId}`
  });
  saveStore();
  return true;
}
