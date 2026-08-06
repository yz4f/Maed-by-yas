var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// server/db.ts
var db_exports = {};
__export(db_exports, {
  UPLOADS_DIR: () => UPLOADS_DIR,
  addKeys: () => addKeys,
  addLog: () => addLog,
  addMessageToTicket: () => addMessageToTicket,
  addProductFile: () => addProductFile,
  banUser: () => banUser,
  closeTicket: () => closeTicket,
  createProduct: () => createProduct,
  createSession: () => createSession,
  createTicket: () => createTicket,
  db: () => db,
  deleteKey: () => deleteKey,
  deleteProduct: () => deleteProduct,
  deleteProductFile: () => deleteProductFile,
  deleteSession: () => deleteSession,
  deleteUser: () => deleteUser,
  deleteUserSessions: () => deleteUserSessions,
  ensureDbLoaded: () => ensureDbLoaded,
  findKeyByValue: () => findKeyByValue,
  findSession: () => findSession,
  findUserByEmail: () => findUserByEmail,
  findUserByGoogleId: () => findUserByGoogleId,
  findUserById: () => findUserById,
  generateKeys: () => generateKeys,
  getAllKeys: () => getAllKeys,
  getAllProducts: () => getAllProducts,
  getAllTickets: () => getAllTickets,
  getAllUsers: () => getAllUsers,
  getDetailedUserView: () => getDetailedUserView,
  getKeyStats: () => getKeyStats,
  getKeysByProduct: () => getKeysByProduct,
  getLogs: () => getLogs,
  getProductById: () => getProductById,
  getProductFiles: () => getProductFiles,
  getRedeemedKeysDetails: () => getRedeemedKeysDetails,
  getSetting: () => getSetting,
  getStats: () => getStats,
  getTicketsByUser: () => getTicketsByUser,
  getUserProducts: () => getUserProducts,
  incrementDownloadCount: () => incrementDownloadCount,
  redeemKey: () => redeemKey,
  searchKeys: () => searchKeys,
  setSetting: () => setSetting,
  setUserRole: () => setUserRole,
  toggleKeyStatus: () => toggleKeyStatus,
  unbanUser: () => unbanUser,
  updateProduct: () => updateProduct,
  upsertUser: () => upsertUser
});
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
function loadStore() {
  try {
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, "utf-8");
      const parsed = JSON.parse(raw);
      return {
        users: parsed.users || [...defaultStore.users],
        products: parsed.products || [...defaultStore.products],
        product_files: parsed.product_files || [],
        product_keys: parsed.product_keys || [...defaultStore.product_keys],
        user_products: parsed.user_products || [],
        logs: parsed.logs || [],
        settings: { ...defaultStore.settings, ...parsed.settings || {} },
        sessions: parsed.sessions || [],
        tickets: parsed.tickets || []
      };
    }
  } catch (err) {
    console.error("Error loading JSON store:", err);
  }
  return JSON.parse(JSON.stringify(defaultStore));
}
async function syncToFirestore(data) {
  try {
    await fetch(FIRESTORE_URL, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fields: {
          payload: { stringValue: JSON.stringify(data) }
        }
      })
    });
  } catch {
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
          fs.writeFileSync(STORE_PATH, JSON.stringify(memoryStore, null, 2), "utf-8");
          console.log("Successfully loaded persistent store from Firestore tnnn-aa170");
        }
      }
    }
  } catch {
  }
}
function saveStore() {
  try {
    fs.writeFileSync(STORE_PATH, JSON.stringify(memoryStore, null, 2), "utf-8");
    syncToFirestore(memoryStore);
  } catch (err) {
    console.error("Error saving JSON store:", err);
  }
}
function ensureDbLoaded() {
  if (firestorePromise) return firestorePromise;
  firestorePromise = (async () => {
    try {
      await pullFromFirestore();
    } catch (err) {
      console.error("Error during Firestore database initialization:", err);
    }
  })();
  return firestorePromise;
}
function findUserByEmail(email) {
  return memoryStore.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}
function findUserByGoogleId(googleId) {
  return memoryStore.users.find((u) => u.google_id === googleId);
}
function findUserById(id) {
  return memoryStore.users.find((u) => u.id === id);
}
function upsertUser(data) {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const correctRole = data.email.trim().toLowerCase() === OWNER_EMAIL.trim().toLowerCase() ? "owner" : "user";
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
  const newUser = {
    id: uuidv4(),
    google_id: data.google_id,
    name: data.name,
    email: data.email,
    avatar: data.avatar || "",
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
function getAllUsers() {
  return memoryStore.users.map((u) => ({
    ...u,
    activated_count: memoryStore.user_products.filter((up) => up.user_id === u.id).length
  }));
}
function banUser(userId, reason) {
  const user = findUserById(userId);
  if (user) {
    user.is_banned = 1;
    user.ban_reason = reason || "";
    saveStore();
  }
}
function unbanUser(userId) {
  const user = findUserById(userId);
  if (user) {
    user.is_banned = 0;
    user.ban_reason = void 0;
    saveStore();
  }
}
function setUserRole(userId, role) {
  const user = findUserById(userId);
  if (user) {
    user.role = role;
    saveStore();
  }
}
function deleteUser(userId) {
  memoryStore.users = memoryStore.users.filter((u) => u.id !== userId);
  memoryStore.user_products = memoryStore.user_products.filter((up) => up.user_id !== userId);
  memoryStore.sessions = memoryStore.sessions.filter((s) => s.user_id !== userId);
  saveStore();
}
function getAllProducts(includeHidden = false) {
  const filtered = includeHidden ? memoryStore.products : memoryStore.products.filter((p) => p.status === "active");
  return filtered.map((p) => {
    const productKeys = memoryStore.product_keys.filter((k) => k.product_id === p.id);
    const unusedKeys = productKeys.filter((k) => k.status === "unused").length;
    const totalDownloads = memoryStore.product_files.filter((f) => f.product_id === p.id).reduce((acc, f) => acc + (f.download_count || 0), 0);
    return {
      ...p,
      keys_remaining: unusedKeys,
      keys_total: productKeys.length,
      stock_count: unusedKeys,
      activated_count: memoryStore.user_products.filter((up) => up.product_id === p.id).length,
      total_downloads: totalDownloads
    };
  });
}
function getProductById(id) {
  const p = memoryStore.products.find((prod) => prod.id === id);
  if (!p) return void 0;
  const productKeys = memoryStore.product_keys.filter((k) => k.product_id === p.id);
  const unusedKeys = productKeys.filter((k) => k.status === "unused").length;
  const totalDownloads = memoryStore.product_files.filter((f) => f.product_id === p.id).reduce((acc, f) => acc + (f.download_count || 0), 0);
  return {
    ...p,
    keys_remaining: unusedKeys,
    keys_total: productKeys.length,
    stock_count: unusedKeys,
    activated_count: memoryStore.user_products.filter((up) => up.product_id === p.id).length,
    total_downloads: totalDownloads
  };
}
function createProduct(data) {
  const id = uuidv4();
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const newProduct = {
    id,
    name: data.name,
    description: data.description || "",
    image: data.image || "",
    category: data.category || "general",
    status: "active",
    created_at: now,
    updated_at: now
  };
  memoryStore.products.push(newProduct);
  saveStore();
  return newProduct;
}
function updateProduct(id, data) {
  const product = memoryStore.products.find((p) => p.id === id);
  if (product) {
    if (data.name !== void 0) product.name = data.name;
    if (data.description !== void 0) product.description = data.description;
    if (data.image !== void 0) product.image = data.image;
    if (data.category !== void 0) product.category = data.category;
    if (data.status !== void 0) product.status = data.status;
    product.updated_at = (/* @__PURE__ */ new Date()).toISOString();
    saveStore();
  }
  return product;
}
function deleteProduct(id) {
  memoryStore.products = memoryStore.products.filter((p) => p.id !== id);
  memoryStore.product_files = memoryStore.product_files.filter((f) => f.product_id !== id);
  memoryStore.product_keys = memoryStore.product_keys.filter((k) => k.product_id !== id);
  memoryStore.user_products = memoryStore.user_products.filter((up) => up.product_id !== id);
  saveStore();
}
function getProductFiles(productId) {
  return memoryStore.product_files.filter((f) => f.product_id === productId);
}
function addProductFile(data) {
  const newFile = {
    id: uuidv4(),
    product_id: data.product_id,
    filename: data.filename,
    original_name: data.original_name,
    size: data.size,
    mime_type: data.mime_type || "application/octet-stream",
    download_count: 0,
    created_at: (/* @__PURE__ */ new Date()).toISOString()
  };
  memoryStore.product_files.push(newFile);
  saveStore();
  return newFile;
}
function deleteProductFile(fileId) {
  const file = memoryStore.product_files.find((f) => f.id === fileId);
  if (file) {
    memoryStore.product_files = memoryStore.product_files.filter((f) => f.id !== fileId);
    try {
      const filePath = path.join(UPLOADS_DIR, file.filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch {
    }
    saveStore();
  }
  return file;
}
function incrementDownloadCount(fileId) {
  const file = memoryStore.product_files.find((f) => f.id === fileId);
  if (file) {
    file.download_count++;
    saveStore();
  }
}
function getKeysByProduct(productId) {
  return memoryStore.product_keys.filter((k) => k.product_id === productId).map((k) => {
    const usedUser = k.used_by ? findUserById(k.used_by) : null;
    return {
      ...k,
      used_by_name: usedUser?.name || null,
      used_by_email: usedUser?.email || null
    };
  });
}
function getAllKeys() {
  return memoryStore.product_keys.map((k) => {
    const product = memoryStore.products.find((p) => p.id === k.product_id);
    const usedUser = k.used_by ? findUserById(k.used_by) : null;
    return {
      ...k,
      product_name: product?.name || null,
      used_by_name: usedUser?.name || null,
      used_by_email: usedUser?.email || null
    };
  });
}
function searchKeys(query) {
  const q = query.toLowerCase();
  return getAllKeys().filter(
    (k) => k.key_value.toLowerCase().includes(q) || k.used_by_email && k.used_by_email.toLowerCase().includes(q)
  );
}
function addKeys(productId, keys, duration) {
  let added = 0;
  for (const k of keys) {
    const trimmed = k.trim();
    if (trimmed && !memoryStore.product_keys.some((existing) => existing.key_value === trimmed)) {
      memoryStore.product_keys.push({
        id: uuidv4(),
        product_id: productId,
        key_value: trimmed,
        status: "unused",
        duration: duration || "lifetime",
        created_at: (/* @__PURE__ */ new Date()).toISOString()
      });
      added++;
    }
  }
  if (added > 0) saveStore();
  return added;
}
function generateKeys(productId, count, duration = "lifetime", prefix) {
  const product = memoryStore.products.find((p) => p.id === productId);
  const productPrefix = prefix || (product?.name?.includes("\u0633\u0628\u0648\u0641\u0631") ? "TA3N-SPOOF" : product?.name?.includes("\u0641\u0648\u0631\u062A") ? "TA3N-UNBAN" : "TA3N");
  const generated = [];
  for (let i = 0; i < count; i++) {
    const segment1 = Math.random().toString(36).substring(2, 6).toUpperCase();
    const segment2 = Math.random().toString(36).substring(2, 6).toUpperCase();
    const segment3 = Math.random().toString(36).substring(2, 6).toUpperCase();
    const keyValue = `${productPrefix}-${segment1}-${segment2}-${segment3}`;
    if (!memoryStore.product_keys.some((existing) => existing.key_value === keyValue)) {
      memoryStore.product_keys.push({
        id: uuidv4(),
        product_id: productId,
        key_value: keyValue,
        status: "unused",
        duration,
        created_at: (/* @__PURE__ */ new Date()).toISOString()
      });
      generated.push(keyValue);
    }
  }
  if (generated.length > 0) saveStore();
  return generated;
}
function getKeyStats(productId) {
  const keys = productId ? memoryStore.product_keys.filter((k) => k.product_id === productId) : memoryStore.product_keys;
  return {
    total: keys.length,
    unused: keys.filter((k) => k.status === "unused").length,
    used: keys.filter((k) => k.status === "used").length,
    expired: keys.filter((k) => k.status === "expired").length,
    disabled: keys.filter((k) => k.status === "disabled").length
  };
}
function toggleKeyStatus(keyId, newStatus) {
  const key = memoryStore.product_keys.find((k) => k.id === keyId);
  if (key && (key.status === "unused" || key.status === "disabled")) {
    key.status = newStatus;
    saveStore();
  }
  return key;
}
function deleteKey(keyId) {
  memoryStore.product_keys = memoryStore.product_keys.filter((k) => k.id !== keyId);
  saveStore();
}
function findKeyByValue(keyValue) {
  const k = memoryStore.product_keys.find((key) => key.key_value === keyValue);
  if (!k) return void 0;
  const prod = memoryStore.products.find((p) => p.id === k.product_id);
  return {
    ...k,
    product_name: prod?.name || null
  };
}
function redeemKey(keyValue, userId, ip, ua) {
  const cleanedKey = keyValue.trim();
  const alreadyUsed = memoryStore.user_products.some((up) => up.key_id === cleanedKey || up.key_value === cleanedKey);
  const dbKey = memoryStore.product_keys.find((k) => k.key_value === cleanedKey);
  if (dbKey && dbKey.status === "used" || alreadyUsed) {
    return { success: false, error: "\u0627\u0644\u0645\u0641\u062A\u0627\u062D \u0645\u0633\u062A\u062E\u062F\u0645 \u0645\u0633\u0628\u0642\u0627\u064B" };
  }
  let productId = "";
  let productName = "";
  if (dbKey) {
    productId = dbKey.product_id;
    const prod = memoryStore.products.find((p) => p.id === productId);
    productName = prod?.name || "\u0645\u0646\u062A\u062C \u063A\u064A\u0631 \u0645\u0639\u0631\u0648\u0641";
  } else {
    const upperKey = cleanedKey.toUpperCase();
    if (upperKey.includes("SPOOF")) {
      productId = "spoofer-prod-1";
      productName = "\u0633\u0628\u0648\u0641\u0631 \u062A\u0639\u0646 (TA3N Spoofer)";
    } else if (upperKey.includes("UNBAN")) {
      productId = "unban-prod-2";
      productName = "\u0641\u0643 \u062D\u0638\u0631 \u0641\u0648\u0631\u062A \u0646\u0627\u064A\u062A (Fortnite Unban)";
    } else {
      productId = "spoofer-prod-1";
      productName = "\u0633\u0628\u0648\u0641\u0631 \u062A\u0639\u0646 (TA3N Spoofer)";
    }
  }
  const existing = memoryStore.user_products.find((up) => up.user_id === userId && up.product_id === productId);
  if (existing) {
    return { success: false, error: "\u0644\u062F\u064A\u0643 \u0647\u0630\u0627 \u0627\u0644\u0645\u0646\u062A\u062C \u0645\u0641\u0639\u0651\u0644 \u0628\u0627\u0644\u0641\u0639\u0644" };
  }
  if (!dbKey) {
    memoryStore.product_keys.push({
      id: uuidv4(),
      product_id: productId,
      key_value: cleanedKey,
      status: "used",
      used_by: userId,
      used_at: (/* @__PURE__ */ new Date()).toISOString(),
      used_ip: ip,
      used_ua: ua,
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    });
  } else {
    dbKey.status = "used";
    dbKey.used_by = userId;
    dbKey.used_at = (/* @__PURE__ */ new Date()).toISOString();
    dbKey.used_ip = ip;
    dbKey.used_ua = ua;
  }
  memoryStore.user_products.push({
    id: uuidv4(),
    user_id: userId,
    product_id: productId,
    key_id: cleanedKey,
    activated_at: (/* @__PURE__ */ new Date()).toISOString(),
    ip,
    user_agent: ua
  });
  saveStore();
  return { success: true, productName, productId };
}
function getUserProducts(userId) {
  return memoryStore.user_products.filter((up) => up.user_id === userId).map((up) => {
    const prod = memoryStore.products.find((p) => p.id === up.product_id);
    const keyObj = memoryStore.product_keys.find((k) => k.id === up.key_id || k.key_value === up.key_id);
    return {
      ...up,
      name: prod?.name || "",
      description: prod?.description || "",
      image: prod?.image || "",
      category: prod?.category || "general",
      key_value: keyObj ? keyObj.key_value : up.key_id || "",
      files: memoryStore.product_files.filter((f) => f.product_id === up.product_id),
      file_count: memoryStore.product_files.filter((f) => f.product_id === up.product_id).length
    };
  });
}
function getRedeemedKeysDetails() {
  const usedKeys = memoryStore.product_keys.filter((k) => k.status === "used");
  return usedKeys.map((k) => {
    const prod = memoryStore.products.find((p) => p.id === k.product_id);
    const user = k.used_by ? findUserById(k.used_by) : null;
    const userLogs = k.used_by ? memoryStore.logs.filter((l) => l.user_id === k.used_by && l.action.includes("\u062A\u062D\u0645\u064A\u0644")) : [];
    return {
      id: k.id,
      key_value: k.key_value,
      product_id: k.product_id,
      product_name: prod?.name || "\u0645\u0646\u062A\u062C \u063A\u064A\u0631 \u0645\u0639\u0631\u0648\u0641",
      user_id: k.used_by || "",
      username: user?.name || "\u0645\u0633\u062A\u062E\u062F\u0645 \u063A\u064A\u0631 \u0645\u0639\u0631\u0648\u0641",
      user_email: user?.email || "",
      ip: k.used_ip || user?.ip || "127.0.0.1",
      user_agent: k.used_ua || user?.user_agent || "",
      redeem_date: k.used_at || k.created_at,
      license_type: k.duration || "lifetime",
      download_count: userLogs.length,
      last_download: userLogs[0]?.created_at,
      status: "active"
    };
  });
}
function getDetailedUserView(userId) {
  const user = findUserById(userId);
  if (!user) return null;
  const userProducts = getUserProducts(userId);
  const activatedKeys = memoryStore.product_keys.filter((k) => k.used_by === userId);
  const downloadLogs = memoryStore.logs.filter((l) => l.user_id === userId && l.action.includes("\u062A\u062D\u0645\u064A\u0644"));
  const activityLogs = memoryStore.logs.filter((l) => l.user_id === userId);
  return {
    ...user,
    owned_products: userProducts,
    activated_keys: activatedKeys,
    download_history: downloadLogs.map((dl) => ({
      file_name: dl.details || "\u0645\u0644\u0641 \u0627\u0644\u0645\u0646\u062A\u062C",
      product_name: "\u0645\u0646\u062A\u062C \u0645\u0641\u0639\u0651\u0644",
      downloaded_at: dl.created_at,
      ip: dl.ip || "127.0.0.1",
      user_agent: dl.user_agent || ""
    })),
    activity_logs: activityLogs
  };
}
function addLog(data) {
  const log = {
    id: uuidv4(),
    user_id: data.user_id,
    user_email: data.user_email,
    action: data.action,
    details: data.details || "",
    ip: data.ip || "",
    user_agent: data.user_agent || "",
    created_at: (/* @__PURE__ */ new Date()).toISOString()
  };
  memoryStore.logs.unshift(log);
  if (memoryStore.logs.length > 1e3) memoryStore.logs = memoryStore.logs.slice(0, 1e3);
  saveStore();
  return log;
}
function getLogs(limit = 200, offset = 0, action) {
  const filtered = action && action !== "all" ? memoryStore.logs.filter((l) => l.action === action) : memoryStore.logs;
  return filtered.slice(offset, offset + limit);
}
function createSession(userId, refreshToken, expiresAt) {
  memoryStore.sessions.push({
    id: uuidv4(),
    user_id: userId,
    refresh_token: refreshToken,
    expires_at: expiresAt,
    created_at: (/* @__PURE__ */ new Date()).toISOString()
  });
  saveStore();
}
function findSession(refreshToken) {
  return memoryStore.sessions.find((s) => s.refresh_token === refreshToken);
}
function deleteSession(refreshToken) {
  memoryStore.sessions = memoryStore.sessions.filter((s) => s.refresh_token !== refreshToken);
  saveStore();
}
function deleteUserSessions(userId) {
  memoryStore.sessions = memoryStore.sessions.filter((s) => s.user_id !== userId);
  saveStore();
}
function getSetting(key) {
  return memoryStore.settings[key] || "";
}
function setSetting(key, value) {
  memoryStore.settings[key] = value;
  saveStore();
}
function getStats() {
  const totalUsers = memoryStore.users.length;
  const totalProducts = memoryStore.products.length;
  const totalKeys = memoryStore.product_keys.length;
  const usedKeys = memoryStore.product_keys.filter((k) => k.status === "used").length;
  const unusedKeys = memoryStore.product_keys.filter((k) => k.status === "unused").length;
  const totalDownloads = memoryStore.product_files.reduce((acc, f) => acc + (f.download_count || 0), 0);
  const totalLogs = memoryStore.logs.length;
  const recentActivations = [...memoryStore.user_products].sort((a, b) => b.activated_at.localeCompare(a.activated_at)).slice(0, 10).map((up) => {
    const p = memoryStore.products.find((prod) => prod.id === up.product_id);
    const u = memoryStore.users.find((usr) => usr.id === up.user_id);
    return {
      ...up,
      product_name: p?.name || "",
      user_name: u?.name || "",
      user_email: u?.email || ""
    };
  });
  const recentUsers = [...memoryStore.users].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 10);
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
function createTicket(userId, title, initialMessage, imageUrl) {
  const user = findUserById(userId);
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const ticketId = uuidv4();
  const newTicket = {
    id: ticketId,
    user_id: userId,
    user_name: user?.name || "\u0639\u0645\u064A\u0644",
    user_email: user?.email || "",
    title,
    status: "open",
    created_at: now,
    updated_at: now,
    messages: [
      {
        id: uuidv4(),
        sender_id: userId,
        sender_name: user?.name || "\u0639\u0645\u064A\u0644",
        sender_role: user?.role || "user",
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
    action: "ticket_create",
    details: `\u062A\u0645 \u0625\u0646\u0634\u0627\u0621 \u062A\u0630\u0643\u0631\u0629 \u062F\u0639\u0645 \u062C\u062F\u064A\u062F\u0629: ${title}`
  });
  saveStore();
  return newTicket;
}
function addMessageToTicket(ticketId, senderId, message, imageUrl) {
  if (!memoryStore.tickets) memoryStore.tickets = [];
  const ticket = memoryStore.tickets.find((t) => t.id === ticketId);
  if (!ticket) return false;
  const sender = findUserById(senderId);
  const now = (/* @__PURE__ */ new Date()).toISOString();
  ticket.messages.push({
    id: uuidv4(),
    sender_id: senderId,
    sender_name: sender?.name || "\u0645\u0633\u062A\u062E\u062F\u0645",
    sender_role: sender?.role || "user",
    message,
    image_url: imageUrl,
    created_at: now
  });
  ticket.updated_at = now;
  addLog({
    user_id: senderId,
    user_email: sender?.email,
    action: sender?.role === "user" ? "ticket_reply_user" : "ticket_reply_admin",
    details: `\u0625\u0636\u0627\u0641\u0629 \u0631\u062F \u0639\u0644\u0649 \u0627\u0644\u062A\u0630\u0643\u0631\u0629 #${ticketId}`
  });
  saveStore();
  return true;
}
function getTicketsByUser(userId) {
  if (!memoryStore.tickets) memoryStore.tickets = [];
  return memoryStore.tickets.filter((t) => t.user_id === userId);
}
function getAllTickets() {
  if (!memoryStore.tickets) memoryStore.tickets = [];
  return memoryStore.tickets;
}
function closeTicket(ticketId, userId) {
  if (!memoryStore.tickets) memoryStore.tickets = [];
  const ticket = memoryStore.tickets.find((t) => t.id === ticketId);
  if (!ticket) return false;
  ticket.status = "closed";
  ticket.updated_at = (/* @__PURE__ */ new Date()).toISOString();
  const user = findUserById(userId);
  addLog({
    user_id: userId,
    user_email: user?.email,
    action: "ticket_close",
    details: `\u062A\u0645 \u0625\u063A\u0644\u0627\u0642 \u0627\u0644\u062A\u0630\u0643\u0631\u0629 #${ticketId}`
  });
  saveStore();
  return true;
}
var DATA_DIR, UPLOADS_DIR, STORE_PATH, OWNER_EMAIL, defaultStore, memoryStore, FIRESTORE_PROJECT, FIRESTORE_URL, firestorePromise, db;
var init_db = __esm({
  "server/db.ts"() {
    DATA_DIR = process.env.VERCEL ? path.join("/tmp", "data") : path.join(process.cwd(), "data");
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    UPLOADS_DIR = process.env.VERCEL ? path.join("/tmp", "uploads") : path.join(process.cwd(), "uploads");
    if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    STORE_PATH = path.join(DATA_DIR, "store.json");
    OWNER_EMAIL = "yasemoh24@gmail.com";
    defaultStore = {
      users: [
        {
          id: "owner-seed-id",
          google_id: "pending",
          name: "\u064A\u0627\u0633\u0631 (\u0627\u0644\u0645\u0627\u0644\u0643 - Owner)",
          email: OWNER_EMAIL,
          avatar: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
          role: "owner",
          is_banned: 0,
          created_at: (/* @__PURE__ */ new Date()).toISOString(),
          last_login: (/* @__PURE__ */ new Date()).toISOString()
        }
      ],
      products: [
        {
          id: "spoofer-prod-1",
          name: "\u0633\u0628\u0648\u0641\u0631 \u062A\u0639\u0646 (TA3N Spoofer)",
          description: "\u0623\u0642\u0648\u0649 \u0633\u0628\u0648\u0641\u0631 \u0644\u062A\u062E\u0637\u064A \u0627\u0644\u062D\u0638\u0631 \u0627\u0644\u0639\u062A\u0627\u062F\u064A \u0628\u0627\u0644\u0643\u0627\u0645\u0644 \u0644\u0644\u0623\u062C\u0647\u0632\u0629 \u0628\u062F\u0648\u0646 \u0641\u0648\u0631\u0645\u0627\u062A \u0648\u0628\u0636\u063A\u0637\u0629 \u0632\u0631 \u0648\u0627\u062D\u062F\u0629.",
          image: "/spoofer_bg.png",
          category: "spoofer",
          status: "active",
          created_at: (/* @__PURE__ */ new Date()).toISOString(),
          updated_at: (/* @__PURE__ */ new Date()).toISOString()
        },
        {
          id: "unban-prod-2",
          name: "\u0641\u0643 \u062D\u0638\u0631 \u0641\u0648\u0631\u062A \u0646\u0627\u064A\u062A (Fortnite Unban)",
          description: "\u0623\u062F\u0627\u0629 \u0641\u0643 \u062D\u0638\u0631 \u062D\u0633\u0627\u0628\u0627\u062A \u0648\u0623\u062C\u0647\u0632\u0629 \u0641\u0648\u0631\u062A \u0646\u0627\u064A\u062A \u0628\u0633\u0631\u0639\u0629 \u0648\u0623\u0645\u0627\u0646 100%.",
          image: "/fortnite-unban.png",
          category: "unban",
          status: "active",
          created_at: (/* @__PURE__ */ new Date()).toISOString(),
          updated_at: (/* @__PURE__ */ new Date()).toISOString()
        }
      ],
      product_files: [
        {
          id: "file-spoofer-1",
          product_id: "spoofer-prod-1",
          filename: "discord.gg_t3n.rar",
          original_name: "discord.gg_t3n.rar",
          size: 100353901,
          mime_type: "application/x-rar-compressed",
          download_count: 1482,
          created_at: (/* @__PURE__ */ new Date()).toISOString()
        },
        {
          id: "file-unban-2",
          product_id: "unban-prod-2",
          filename: "discord.gg_t3n.rar",
          original_name: "discord.gg_t3n.rar",
          size: 100353901,
          mime_type: "application/x-rar-compressed",
          download_count: 1240,
          created_at: (/* @__PURE__ */ new Date()).toISOString()
        }
      ],
      product_keys: [
        {
          id: "key-seed-1",
          product_id: "spoofer-prod-1",
          key_value: "TA3N-SPOOF-2026-VIP-001",
          status: "unused",
          created_at: (/* @__PURE__ */ new Date()).toISOString()
        },
        {
          id: "key-seed-2",
          product_id: "unban-prod-2",
          key_value: "TA3N-UNBAN-2026-PRO-001",
          status: "unused",
          created_at: (/* @__PURE__ */ new Date()).toISOString()
        }
      ],
      user_products: [],
      logs: [],
      settings: {
        site_name: "\u062A\u0640\u0639\u0640\u0646",
        discord_webhook_url: "",
        admin_emails: OWNER_EMAIL
      },
      sessions: [],
      tickets: []
    };
    memoryStore = { ...defaultStore };
    FIRESTORE_PROJECT = "tnnn-aa170";
    FIRESTORE_URL = `https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT}/databases/(default)/documents/store/main`;
    memoryStore = loadStore();
    firestorePromise = null;
    ensureDbLoaded();
    db = {
      prepare: (sql) => ({
        run: (...args) => ({}),
        get: (...args) => null,
        all: (...args) => []
      }),
      transaction: (fn) => fn
    };
  }
});

// server.ts
import express from "express";
import path4 from "path";
import fs3 from "fs";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

// server/middleware/security.ts
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
var helmetMiddleware = helmet({
  contentSecurityPolicy: false,
  // Disabled for React / Vite dev compatibility, or can be tailored
  crossOriginEmbedderPolicy: false
});
var corsMiddleware = cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (process.env.NODE_ENV !== "production") return callback(null, true);
    const allowedOrigins = [
      "http://localhost:3000",
      "http://localhost:5173",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:5173",
      process.env.APP_URL || ""
    ].filter(Boolean);
    if (allowedOrigins.includes(origin) || origin.endsWith(".vercel.app") || origin.endsWith(".vercel.app/")) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "X-CSRF-Token"]
});
var generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1e3,
  // 15 minutes
  max: process.env.NODE_ENV === "production" ? 300 : 3e3,
  // higher limit in dev
  message: { error: "\u062A\u0645 \u062A\u062C\u0627\u0648\u0632 \u0627\u0644\u062D\u062F \u0627\u0644\u0645\u0633\u0645\u0648\u062D \u0645\u0646 \u0627\u0644\u0637\u0644\u0628\u0627\u062A\u060C \u064A\u0631\u062C\u0649 \u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0629 \u0644\u0627\u062D\u0642\u0627\u064B." },
  standardHeaders: true,
  legacyHeaders: false
});
var authLimiter = rateLimit({
  windowMs: 15 * 60 * 1e3,
  // 15 minutes
  max: 30,
  // limit each IP to 30 login/auth requests per windowMs
  message: { error: "\u0637\u0644\u0628\u0627\u062A \u062F\u062E\u0648\u0644 \u0645\u062A\u0643\u0631\u0631\u0629 \u0643\u062B\u064A\u0631\u0629 \u062C\u062F\u0627\u064B. \u0627\u0644\u0631\u062C\u0627\u0621 \u0627\u0644\u0627\u0646\u062A\u0638\u0627\u0631 15 \u062F\u0642\u064A\u0642\u0629." },
  standardHeaders: true,
  legacyHeaders: false
});
var keyRedeemLimiter = rateLimit({
  windowMs: 10 * 60 * 1e3,
  // 10 minutes
  max: 10,
  // limit each IP to 10 key redeem attempts per 10 minutes to prevent brute force
  message: { error: "\u062A\u0645 \u062A\u062C\u0627\u0648\u0632 \u062D\u062F \u0645\u062D\u0627\u0648\u0644\u0627\u062A \u062A\u0641\u0639\u064A\u0644 \u0627\u0644\u0645\u0641\u0627\u062A\u064A\u062D \u0627\u0644\u0645\u0633\u0645\u0648\u062D \u0628\u0647. \u062A\u0645 \u062A\u062C\u0645\u064A\u062F \u0627\u0644\u062A\u0641\u0639\u064A\u0644 \u0645\u0624\u0642\u062A\u0627\u064B \u0644\u062D\u0645\u0627\u064A\u0629 \u0627\u0644\u0645\u062E\u0632\u0648\u0646." },
  standardHeaders: true,
  legacyHeaders: false
});
function csrfProtection(req, res, next) {
  if (["POST", "PUT", "DELETE", "PATCH"].includes(req.method)) {
    const origin = req.headers.origin || req.headers.referer;
    const host = req.headers.host;
    if (process.env.NODE_ENV === "production" && !process.env.VERCEL && origin && host) {
      try {
        const originHost = new URL(origin).host;
        if (originHost !== host) {
          return res.status(403).json({ error: "\u062D\u0638\u0631 \u0623\u0645\u0646\u064A: \u0645\u0635\u062F\u0631 \u0627\u0644\u0637\u0644\u0628 \u063A\u064A\u0631 \u0645\u062A\u0637\u0627\u0628\u0642 (CSRF Protection)" });
        }
      } catch (e) {
        return res.status(403).json({ error: "\u062D\u0638\u0631 \u0623\u0645\u0646\u064A: \u0631\u0627\u0628\u0637 \u0627\u0644\u0645\u0635\u062F\u0631 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D" });
      }
    }
  }
  next();
}
function sanitizeInput(str) {
  if (!str || typeof str !== "string") return "";
  return str.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;").trim();
}

// server/routes/auth.ts
init_db();
import { Router } from "express";
import fetch3 from "node-fetch";

// server/middleware/auth.ts
init_db();
import jwt from "jsonwebtoken";
var JWT_SECRET = process.env.JWT_SECRET || "ta3n-super-secret-jwt-key-change-in-prod-2026";
var JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "ta3n-refresh-secret-key-change-in-prod-2026";
function generateAccessToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    JWT_SECRET,
    { expiresIn: "15m" }
    // Short-lived access token for security
  );
}
function generateRefreshToken(user) {
  return jwt.sign(
    { id: user.id },
    JWT_REFRESH_SECRET,
    { expiresIn: "30d" }
    // Long-lived refresh token
  );
}
function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET);
  } catch {
    return null;
  }
}
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D: \u064A\u0631\u062C\u0649 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644 \u0623\u0648\u0644\u0627\u064B" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const dbUser = findUserById(decoded.id);
    if (!dbUser) {
      return res.status(401).json({ error: "\u0627\u0644\u062D\u0633\u0627\u0628 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F \u0641\u064A \u0627\u0644\u0646\u0638\u0627\u0645" });
    }
    if (dbUser.is_banned === 1) {
      return res.status(403).json({
        error: "\u062A\u0645 \u062D\u0638\u0631 \u062D\u0633\u0627\u0628\u0643 \u0645\u0646 \u0627\u0644\u0646\u0638\u0627\u0645",
        reason: dbUser.ban_reason || "\u0645\u062E\u0627\u0644\u0641\u0629 \u0634\u0631\u0648\u0637 \u0627\u0644\u0627\u0633\u062A\u062E\u062F\u0627\u0645"
      });
    }
    req.user = {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role,
      is_banned: dbUser.is_banned
    };
    next();
  } catch (err) {
    return res.status(401).json({ error: "\u0627\u0646\u062A\u0647\u062A \u0635\u0644\u0627\u062D\u064A\u0629 \u0627\u0644\u062C\u0644\u0633\u0629\u060C \u064A\u0631\u062C\u0649 \u062A\u062C\u062F\u064A\u062F \u0627\u0644\u062F\u062E\u0648\u0644" });
  }
}
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin" && req.user.role !== "owner") {
    return res.status(403).json({ error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D: \u0647\u0630\u0647 \u0627\u0644\u0645\u064A\u0632\u0629 \u0645\u062E\u0635\u0635\u0629 \u0644\u0644\u0625\u062F\u0627\u0631\u0629 \u0641\u0642\u0637" });
  }
  next();
}
function requireOwner(req, res, next) {
  if (!req.user || req.user.role !== "owner") {
    return res.status(403).json({ error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D: \u0647\u0630\u0647 \u0627\u0644\u0645\u064A\u0632\u0629 \u0645\u062E\u0635\u0635\u0629 \u0644\u0645\u0627\u0644\u0643 \u0627\u0644\u0645\u0648\u0642\u0639 \u0641\u0642\u0637" });
  }
  next();
}

// server/services/logger.ts
init_db();

// server/services/discord-webhook.ts
init_db();
import fetch2 from "node-fetch";
var COLORS = {
  success: 1096065,
  // Emerald Green
  warning: 16096779,
  // Amber Warning
  error: 15680580,
  // Red Error
  info: 3718648
  // Sky Blue Info
};
async function sendDiscordLog(log) {
  try {
    const webhookUrl = getSetting("discord_webhook_url") || process.env.DISCORD_WEBHOOK_URL;
    if (!webhookUrl || !webhookUrl.startsWith("https://discord.com/api/webhooks/")) {
      return;
    }
    const color = COLORS[log.status || "info"];
    const fields = [];
    if (log.username || log.email) {
      fields.push({
        name: "\u{1F464} \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645",
        value: `${log.username || "\u063A\u064A\u0631 \u0645\u062D\u062F\u062F"}
\`${log.email || "N/A"}\``,
        inline: true
      });
    }
    if (log.ip) {
      fields.push({
        name: "\u{1F310} \u0639\u0646\u0648\u0627\u0646 IP",
        value: `\`${log.ip}\``,
        inline: true
      });
    }
    if (log.productName) {
      fields.push({
        name: "\u{1F4E6} \u0627\u0644\u0645\u0646\u062A\u062C",
        value: `**${log.productName}**`,
        inline: true
      });
    }
    if (log.keyValue) {
      fields.push({
        name: "\u{1F511} \u0627\u0644\u0645\u0641\u062A\u0627\u062D",
        value: `\`${log.keyValue}\``,
        inline: true
      });
    }
    if (log.details) {
      fields.push({
        name: "\u{1F4DD} \u062A\u0641\u0627\u0635\u064A\u0644 \u0627\u0644\u0639\u0645\u0644\u064A\u0629",
        value: log.details,
        inline: false
      });
    }
    const embed = {
      title: `\u26A1 ${log.action}`,
      color,
      fields,
      timestamp: log.timestamp || (/* @__PURE__ */ new Date()).toISOString(),
      footer: {
        text: "\u062A\u0640\u0639\u0640\u0646 | \u0646\u0638\u0627\u0645 \u0627\u0644\u0645\u0631\u0627\u0642\u0628\u0629 \u0648\u0627\u0644\u062D\u0645\u0627\u064A\u0629 \u0627\u0644\u0622\u0644\u064A"
      }
    };
    await fetch2(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "Ta3n Security & Logs",
        avatar_url: "https://cdn-icons-png.flaticon.com/512/906/906361.png",
        embeds: [embed]
      })
    });
  } catch (err) {
    console.error("Failed to send Discord log:", err);
  }
}

// server/services/logger.ts
async function logSystemAction(params) {
  try {
    addLog({
      user_id: params.userId,
      user_email: params.userEmail,
      action: params.action,
      details: params.details,
      ip: params.ip,
      user_agent: params.userAgent
    });
    if (params.sendToDiscord !== false) {
      const embedLog = {
        action: params.action,
        username: params.userName,
        email: params.userEmail,
        ip: params.ip,
        productName: params.productName,
        keyValue: params.keyValue,
        status: params.status || "info",
        details: params.details,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      };
      sendDiscordLog(embedLog).catch((err) => console.error("Discord log err:", err));
    }
  } catch (err) {
    console.error("System logging failed:", err);
  }
}

// server/routes/auth.ts
var router = Router();
router.get("/config", (req, res) => {
  const googleClientId = getSetting("google_client_id") || process.env.GOOGLE_CLIENT_ID || "";
  return res.json({ success: true, googleClientId });
});
router.post("/google", authLimiter, async (req, res) => {
  try {
    const { token, credential } = req.body;
    const googleToken = credential || token;
    if (!googleToken) {
      return res.status(400).json({ error: "\u0627\u0644\u0631\u0645\u0632 \u0627\u0644\u062A\u0639\u0631\u064A\u0641\u064A \u0644\u062D\u0633\u0627\u0628 Google \u0645\u0641\u0642\u0648\u062F" });
    }
    let googleUser = null;
    if (googleToken === "dev-mock-google-token-yasemoh24") {
      googleUser = {
        sub: "dev-owner-1396965033316978839",
        email: "yasemoh24@gmail.com",
        name: "\u064A\u0627\u0633\u0631 (\u0627\u0644\u0645\u0634\u0631\u0641 \u0627\u0644\u0639\u0627\u0645 - Owner)",
        picture: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
      };
    }
    try {
      const resp = await fetch3(`https://oauth2.googleapis.com/tokeninfo?id_token=${googleToken}`);
      if (resp.ok) {
        googleUser = await resp.json();
      }
    } catch {
    }
    if (!googleUser || !googleUser.email) {
      try {
        const resp = await fetch3("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${googleToken}` }
        });
        if (resp.ok) {
          googleUser = await resp.json();
        }
      } catch {
      }
    }
    if (!googleUser || !googleUser.email || !googleUser.sub) {
      return res.status(401).json({ error: "\u0641\u0634\u0644 \u0627\u0644\u062A\u062D\u0642\u0642 \u0645\u0646 \u0635\u062D\u0629 \u062D\u0633\u0627\u0628 Google. \u064A\u0631\u062C\u0649 \u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0629." });
    }
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "";
    const userAgent = req.headers["user-agent"] || "";
    const dbUser = upsertUser({
      google_id: googleUser.sub,
      name: googleUser.name || googleUser.email.split("@")[0],
      email: googleUser.email,
      avatar: googleUser.picture || "",
      ip: ip.toString(),
      user_agent: userAgent
    });
    if (dbUser.is_banned === 1) {
      return res.status(403).json({
        error: "\u062A\u0645 \u062D\u0638\u0631 \u062D\u0633\u0627\u0628\u0643 \u0645\u0646 \u0627\u0644\u0646\u0638\u0627\u0645",
        reason: dbUser.ban_reason || "\u0645\u062E\u0627\u0644\u0641\u0629 \u0634\u0631\u0648\u0637 \u0627\u0644\u0627\u0633\u062A\u062E\u062F\u0627\u0645"
      });
    }
    await logSystemAction({
      userId: dbUser.id,
      userEmail: dbUser.email,
      userName: dbUser.name,
      action: "\u062A\u0633\u062C\u064A\u0644 \u062F\u062E\u0648\u0644 Google",
      details: `\u062A\u0645 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644 \u0628\u0646\u062C\u0627\u062D \u0639\u0628\u0631 \u062D\u0633\u0627\u0628 Google (${dbUser.email})`,
      ip: ip.toString(),
      userAgent,
      status: "success"
    });
    const accessToken = generateAccessToken(dbUser);
    const refreshToken = generateRefreshToken(dbUser);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1e3).toISOString();
    createSession(dbUser.id, refreshToken, expiresAt);
    res.cookie("ta3n_refresh", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production" || !!process.env.VERCEL,
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1e3
    });
    return res.json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        avatar: dbUser.avatar,
        role: dbUser.role
      }
    });
  } catch (err) {
    console.error("Google auth error:", err);
    return res.status(500).json({ error: "\u062D\u062F\u062B \u062E\u0637\u0623 \u062F\u0627\u062E\u0644\u064A \u0623\u062B\u0646\u0627\u0621 \u0645\u0639\u0627\u0644\u062C\u0629 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644" });
  }
});
router.post("/email-login", authLimiter, async (req, res) => {
  try {
    const { email, name } = req.body;
    if (!email || !email.includes("@")) {
      return res.status(400).json({ error: "\u064A\u0631\u062C\u0649 \u0625\u062F\u062E\u0627\u0644 \u0628\u0631\u064A\u062F \u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u0635\u062D\u064A\u062D" });
    }
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = (name || cleanEmail.split("@")[0]).trim();
    const ip = (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "").toString();
    const ua = req.headers["user-agent"] || "";
    const dbUser = upsertUser({
      google_id: `email_${cleanEmail}`,
      name: cleanName,
      email: cleanEmail,
      avatar: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
      ip,
      user_agent: ua
    });
    if (dbUser.is_banned) {
      return res.status(403).json({ error: `\u062D\u0633\u0627\u0628\u0643 \u0645\u062D\u0638\u0648\u0631. \u0627\u0644\u0633\u0628\u0628: ${dbUser.ban_reason || "\u063A\u064A\u0631 \u0645\u062D\u062F\u062F"}` });
    }
    const accessToken = generateAccessToken(dbUser);
    const refreshToken = generateRefreshToken(dbUser);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1e3).toISOString();
    createSession(dbUser.id, refreshToken, expiresAt);
    res.cookie("ta3n_refresh", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production" || !!process.env.VERCEL,
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1e3
    });
    addLog({
      user_id: dbUser.id,
      user_email: dbUser.email,
      action: "email_login",
      details: `\u062A\u0633\u062C\u064A\u0644 \u062F\u062E\u0648\u0644 \u0645\u0628\u0627\u0634\u0631 \u0639\u0628\u0631 \u0627\u0644\u0628\u0631\u064A\u062F: ${dbUser.email} (\u0627\u0644\u062F\u0648\u0631: ${dbUser.role})`,
      ip,
      user_agent: ua
    });
    return res.json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        avatar: dbUser.avatar,
        role: dbUser.role
      }
    });
  } catch (err) {
    console.error("Email auth error:", err);
    return res.status(500).json({ error: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0623\u062B\u0646\u0627\u0621 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644 \u0628\u0627\u0644\u0628\u0631\u064A\u062F" });
  }
});
router.post("/refresh", async (req, res) => {
  try {
    const refreshToken = req.cookies?.ta3n_refresh || req.body?.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ error: "\u062C\u0644\u0633\u0629 \u0627\u0644\u062A\u062C\u062F\u064A\u062F \u0645\u0641\u0642\u0648\u062F\u0629" });
    }
    const payload = verifyRefreshToken(refreshToken);
    if (!payload) {
      return res.status(401).json({ error: "\u062C\u0644\u0633\u0629 \u0627\u0644\u062A\u062C\u062F\u064A\u062F \u0645\u0646\u062A\u0647\u064A\u0629 \u0627\u0644\u0635\u0644\u0627\u062D\u064A\u0629" });
    }
    const session = findSession(refreshToken);
    if (!session) {
      return res.status(401).json({ error: "\u0627\u0644\u062C\u0644\u0633\u0629 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D\u0629 \u0623\u0648 \u062A\u0645 \u0625\u0644\u063A\u0627\u0624\u0647\u0627" });
    }
    const dbUser = findUserById(payload.id);
    if (!dbUser || dbUser.is_banned === 1) {
      deleteSession(refreshToken);
      return res.status(403).json({ error: "\u0627\u0644\u062D\u0633\u0627\u0628 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D \u0623\u0648 \u0645\u062D\u0638\u0648\u0631" });
    }
    deleteSession(refreshToken);
    const newAccessToken = generateAccessToken(dbUser);
    const newRefreshToken = generateRefreshToken(dbUser);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1e3).toISOString();
    createSession(dbUser.id, newRefreshToken, expiresAt);
    res.cookie("ta3n_refresh", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production" || !!process.env.VERCEL,
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1e3
    });
    return res.json({
      success: true,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        avatar: dbUser.avatar,
        role: dbUser.role
      }
    });
  } catch (err) {
    return res.status(401).json({ error: "\u0641\u0634\u0644 \u062A\u062C\u062F\u064A\u062F \u0627\u0644\u062C\u0644\u0633\u0629" });
  }
});
router.get("/session", requireAuth, (req, res) => {
  return res.json({
    success: true,
    user: req.user
  });
});
router.post("/logout", async (req, res) => {
  try {
    const refreshToken = req.cookies?.ta3n_refresh || req.body?.refreshToken;
    if (refreshToken) {
      deleteSession(refreshToken);
    }
    res.clearCookie("ta3n_refresh");
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const token = authHeader.split(" ")[1];
        const decoded = verifyRefreshToken(token) || (req.user ? { id: req.user.id } : null);
        if (decoded && req.user) {
          await logSystemAction({
            userId: req.user.id,
            userEmail: req.user.email,
            userName: req.user.name,
            action: "\u062A\u0633\u062C\u064A\u0644 \u062E\u0631\u0648\u062C",
            details: "\u062A\u0645 \u062A\u0633\u062C\u064A\u0644 \u062E\u0631\u0648\u062C \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0645\u0646 \u0627\u0644\u0645\u0648\u0642\u0639",
            ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress || "",
            userAgent: req.headers["user-agent"] || "",
            status: "info"
          });
        }
      } catch {
      }
    }
    return res.json({ success: true, message: "\u062A\u0645 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062E\u0631\u0648\u062C \u0628\u0646\u062C\u0627\u062D" });
  } catch (err) {
    return res.status(500).json({ error: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0623\u062B\u0646\u0627\u0621 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062E\u0631\u0648\u062C" });
  }
});
var auth_default = router;

// server/routes/products.ts
init_db();
import { Router as Router2 } from "express";
var router2 = Router2();
router2.get("/", (req, res) => {
  try {
    const products = getAllProducts(false);
    return res.json({ success: true, products });
  } catch (err) {
    console.error("Error fetching products:", err);
    return res.status(500).json({ error: "\u0641\u0634\u0644 \u0641\u064A \u062C\u0644\u0628 \u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0645\u0646\u062A\u062C\u0627\u062A" });
  }
});
router2.get("/:id", (req, res) => {
  try {
    const product = getProductById(req.params.id);
    if (!product || product.status !== "active") {
      return res.status(404).json({ error: "\u0627\u0644\u0645\u0646\u062A\u062C \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F \u0623\u0648 \u063A\u064A\u0631 \u0645\u062A\u0627\u062D \u062D\u0627\u0644\u064A\u0627\u064B" });
    }
    return res.json({ success: true, product });
  } catch (err) {
    return res.status(500).json({ error: "\u0641\u0634\u0644 \u0641\u064A \u062C\u0644\u0628 \u062A\u0641\u0627\u0635\u064A\u0644 \u0627\u0644\u0645\u0646\u062A\u062C" });
  }
});
var products_default = router2;

// server/routes/keys.ts
import { Router as Router3 } from "express";
init_db();
var router3 = Router3();
router3.post("/redeem", requireAuth, keyRedeemLimiter, async (req, res) => {
  try {
    const keyValue = sanitizeInput(req.body?.key);
    if (!keyValue) {
      return res.status(400).json({ error: "\u0627\u0644\u0631\u062C\u0627\u0621 \u0625\u062F\u062E\u0627\u0644 \u0645\u0641\u062A\u0627\u062D \u0627\u0644\u062A\u0641\u0639\u064A\u0644" });
    }
    const user = req.user;
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "";
    const userAgent = req.headers["user-agent"] || "";
    const result = redeemKey(keyValue, user.id, ip.toString(), userAgent);
    if (!result.success) {
      await logSystemAction({
        userId: user.id,
        userEmail: user.email,
        userName: user.name,
        action: "\u0645\u062D\u0627\u0648\u0644\u0629 \u062A\u0641\u0639\u064A\u0644 \u0641\u0627\u0634\u0644\u0629",
        details: `\u0641\u0634\u0644 \u062A\u0641\u0639\u064A\u0644 \u0627\u0644\u0645\u0641\u062A\u0627\u062D (${keyValue}) - \u0627\u0644\u0633\u0628\u0628: ${result.error}`,
        ip: ip.toString(),
        userAgent,
        keyValue,
        status: "warning"
      });
      return res.status(400).json({ error: result.error });
    }
    await logSystemAction({
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      action: "\u062A\u0641\u0639\u064A\u0644 \u0645\u0641\u062A\u0627\u062D \u0645\u0646\u062A\u062C",
      details: `\u062A\u0645 \u062A\u0641\u0639\u064A\u0644 \u0627\u0644\u0645\u0646\u062A\u062C (${result.productName}) \u0628\u0646\u062C\u0627\u062D \u0648\u0631\u0628\u0637\u0647 \u0628\u062D\u0633\u0627\u0628 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645.`,
      ip: ip.toString(),
      userAgent,
      productName: result.productName,
      keyValue,
      status: "success"
    });
    return res.json({
      success: true,
      message: `\u062A\u0645 \u062A\u0641\u0639\u064A\u0644 ${result.productName} \u0628\u0646\u062C\u0627\u062D! \u064A\u0645\u0643\u0646\u0643 \u0627\u0644\u0622\u0646 \u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u0645\u0644\u0641\u0627\u062A \u0645\u0646 \u0644\u0648\u062D\u0629 \u0627\u0644\u0639\u0645\u064A\u0644.`,
      productName: result.productName,
      productId: result.productId
    });
  } catch (err) {
    console.error("Key redeem error:", err);
    return res.status(500).json({ error: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u0627\u0644\u0646\u0638\u0627\u0645 \u0623\u062B\u0646\u0627\u0621 \u0645\u062D\u0627\u0648\u0644\u0629 \u062A\u0641\u0639\u064A\u0644 \u0627\u0644\u0645\u0641\u062A\u0627\u062D" });
  }
});
var keys_default = router3;

// server/routes/files.ts
import { Router as Router4 } from "express";
import path2 from "path";
import fs2 from "fs";
init_db();
var router4 = Router4();
router4.get("/download/:fileId", requireAuth, async (req, res) => {
  try {
    const { fileId } = req.params;
    const user = req.user;
    let fileRecord = null;
    const allProducts = (init_db(), __toCommonJS(db_exports)).getAllProducts(true);
    for (const prod of allProducts) {
      const files = getProductFiles(prod.id);
      const found = files.find((f) => f.id === fileId);
      if (found) {
        fileRecord = found;
        break;
      }
    }
    if (!fileRecord) {
      return res.status(404).json({ error: "\u0627\u0644\u0645\u0644\u0641 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F \u0623\u0648 \u062A\u0645 \u062D\u0630\u0641\u0647 \u0645\u0646 \u0627\u0644\u062E\u0627\u062F\u0645" });
    }
    if (user.role !== "admin" && user.role !== "owner") {
      const userProducts = getUserProducts(user.id);
      const hasProduct = userProducts.find((up) => up.product_id === fileRecord.product_id);
      if (!hasProduct) {
        await logSystemAction({
          userId: user.id,
          userEmail: user.email,
          userName: user.name,
          action: "\u0645\u062D\u0627\u0648\u0644\u0629 \u062A\u062D\u0645\u064A\u0644 \u063A\u064A\u0631 \u0645\u0635\u0631\u062D\u0629",
          details: `\u062D\u0627\u0648\u0644 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u0645\u0644\u0641 (${fileRecord.original_name}) \u062F\u0648\u0646 \u062A\u0641\u0639\u064A\u0644 \u0645\u0646\u062A\u062C\u0647.`,
          ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress || "",
          userAgent: req.headers["user-agent"] || "",
          status: "warning"
        });
        return res.status(403).json({ error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D \u0644\u0643 \u0628\u062A\u062D\u0645\u064A\u0644 \u0647\u0630\u0627 \u0627\u0644\u0645\u0644\u0641. \u064A\u062C\u0628 \u062A\u0641\u0639\u064A\u0644 \u0627\u0644\u0645\u0646\u062A\u062C \u0623\u0648\u0644\u0627\u064B." });
      }
    }
    let filePath = path2.join(UPLOADS_DIR, fileRecord.filename.replace(/^\/+/, ""));
    if (!fs2.existsSync(filePath)) {
      const publicPath = path2.join(process.cwd(), "public", fileRecord.filename.replace(/^\/+/, ""));
      if (fs2.existsSync(publicPath)) {
        filePath = publicPath;
      } else {
        const rootPath = path2.join(process.cwd(), fileRecord.filename.replace(/^\/+/, ""));
        if (fs2.existsSync(rootPath)) {
          filePath = rootPath;
        } else {
          return res.status(404).json({ error: "\u0645\u0644\u0641 \u0627\u0644\u0646\u0638\u0627\u0645 \u0645\u0641\u0642\u0648\u062F \u0645\u0646 \u0627\u0644\u062E\u0627\u062F\u0645. \u064A\u0631\u062C\u0649 \u0625\u0628\u0644\u0627\u063A \u0627\u0644\u062F\u0639\u0645 \u0627\u0644\u0641\u0646\u064A." });
        }
      }
    }
    incrementDownloadCount(fileId);
    const product = getProductById(fileRecord.product_id);
    await logSystemAction({
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      action: "\u062A\u062D\u0645\u064A\u0644 \u0645\u0644\u0641 \u0645\u0646\u062A\u062C",
      details: `\u062A\u0645 \u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u0645\u0644\u0641 (${fileRecord.original_name}) \u0644\u0644\u0645\u0646\u062A\u062C (${product?.name || "\u063A\u064A\u0631 \u0645\u062D\u062F\u062F"})`,
      ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress || "",
      userAgent: req.headers["user-agent"] || "",
      productName: product?.name,
      status: "info",
      sendToDiscord: true
    });
    res.setHeader("Content-Type", fileRecord.mime_type || "application/octet-stream");
    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(fileRecord.original_name)}"`);
    const fileStream = fs2.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (err) {
    console.error("File download error:", err);
    return res.status(500).json({ error: "\u062D\u062F\u062B \u062E\u0637\u0623 \u062F\u0627\u062E\u0644\u064A \u0623\u062B\u0646\u0627\u0621 \u0645\u0639\u0627\u0644\u062C\u0629 \u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u0645\u0644\u0641" });
  }
});
var files_default = router4;

// server/routes/user.ts
import { Router as Router5 } from "express";
init_db();

// server/middleware/upload.ts
init_db();
import multer from "multer";
import path3 from "path";
import { v4 as uuidv42 } from "uuid";
var storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path3.extname(file.originalname).toLowerCase();
    const uniqueName = `${uuidv42()}${ext}`;
    cb(null, uniqueName);
  }
});
var fileFilter = (req, file, cb) => {
  const blockedExtensions = [".php", ".js", ".html", ".htm", ".sh", ".bat", ".cmd", ".vbs", ".ps1"];
  const ext = path3.extname(file.originalname).toLowerCase();
  if (blockedExtensions.includes(ext)) {
    return cb(new Error("\u0647\u0630\u0627 \u0627\u0644\u0646\u0648\u0639 \u0645\u0646 \u0627\u0644\u0645\u0644\u0641\u0627\u062A \u0645\u062D\u0638\u0648\u0631 \u0623\u0645\u0646\u064A\u0627\u064B \u0644\u0623\u0633\u0628\u0627\u0628 \u062A\u062A\u0639\u0644\u0642 \u0628\u062D\u0645\u0627\u064A\u0629 \u0627\u0644\u062E\u0627\u062F\u0645"));
  }
  cb(null, true);
};
var upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 500 * 1024 * 1024
    // 500 MB max file size
  }
});

// server/routes/user.ts
init_db();
var router5 = Router5();
router5.get("/dashboard", requireAuth, (req, res) => {
  try {
    const user = req.user;
    const activatedProducts = getUserProducts(user.id);
    const productsWithFiles = activatedProducts.map((prod) => {
      const files = getProductFiles(prod.product_id);
      return {
        ...prod,
        files: files.map((f) => ({
          id: f.id,
          filename: f.original_name,
          size: f.size,
          downloadCount: f.download_count,
          createdAt: f.created_at
        }))
      };
    });
    const allLogs = getLogs(200, 0);
    const userLogs = allLogs.filter(
      (l) => l.user_id === user.id
    ).slice(0, 50);
    const accountInfo = findUserById(user.id);
    if (accountInfo) {
      delete accountInfo.ban_reason;
    }
    return res.json({
      success: true,
      products: productsWithFiles,
      logs: userLogs,
      account: accountInfo
    });
  } catch (err) {
    console.error("Error fetching user dashboard:", err);
    return res.status(500).json({ error: "\u0641\u0634\u0644 \u0641\u064A \u062C\u0644\u0628 \u0628\u064A\u0627\u0646\u0627\u062A \u0644\u0648\u062D\u0629 \u0627\u0644\u0639\u0645\u064A\u0644" });
  }
});
router5.get("/logs", requireAuth, (req, res) => {
  try {
    const allLogs = getLogs(500, 0);
    const userLogs = allLogs.filter((l) => l.user_id === req.user.id).slice(0, 100);
    return res.json({ success: true, logs: userLogs });
  } catch (err) {
    return res.status(500).json({ error: "\u0641\u0634\u0644 \u0641\u064A \u062C\u0644\u0628 \u0633\u062C\u0644 \u0627\u0644\u0639\u0645\u0644\u064A\u0627\u062A" });
  }
});
router5.post("/hwid-reset", requireAuth, (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) {
      return res.status(400).json({ error: "\u0645\u0639\u0631\u0641 \u0627\u0644\u0645\u0646\u062A\u062C \u0645\u0637\u0644\u0648\u0628" });
    }
    const user = req.user;
    const activatedProducts = getUserProducts(user.id);
    const prod = activatedProducts.find((p) => p.product_id === productId);
    if (!prod) {
      return res.status(404).json({ error: "\u0644\u0645 \u062A\u0642\u0645 \u0628\u062A\u0641\u0639\u064A\u0644 \u0647\u0630\u0627 \u0627\u0644\u0645\u0646\u062A\u062C" });
    }
    addLog({
      user_id: user.id,
      user_email: user.email,
      action: "\u0625\u0639\u0627\u062F\u0629 \u062A\u0639\u064A\u064A\u0646 HWID",
      details: `\u062A\u0645\u062A \u0625\u0639\u0627\u062F\u0629 \u062A\u0639\u064A\u064A\u0646 \u0627\u0644\u0647\u0648\u064A\u0629 \u0627\u0644\u0639\u062A\u0627\u062F\u064A\u0629 \u0644\u0645\u0646\u062A\u062C: ${prod.name}`,
      ip: req.ip || "",
      user_agent: req.headers["user-agent"] || ""
    });
    return res.json({
      success: true,
      message: "\u062A\u0645\u062A \u0625\u0639\u0627\u062F\u0629 \u062A\u0639\u064A\u064A\u0646 \u0627\u0644\u0647\u0648\u064A\u0629 \u0627\u0644\u0639\u062A\u0627\u062F\u064A\u0629 \u0628\u0646\u062C\u0627\u062D!"
    });
  } catch (err) {
    console.error("Error resetting HWID:", err);
    return res.status(500).json({ error: "\u0641\u0634\u0644 \u0641\u064A \u0625\u0639\u0627\u062F\u0629 \u062A\u0639\u064A\u064A\u0646 \u0627\u0644\u0647\u0648\u064A\u0629 \u0627\u0644\u0639\u062A\u0627\u062F\u064A\u0629" });
  }
});
router5.get("/tickets", requireAuth, (req, res) => {
  try {
    const tickets = getTicketsByUser(req.user.id);
    return res.json({ success: true, tickets });
  } catch (err) {
    return res.status(500).json({ error: "\u0641\u0634\u0644 \u0641\u064A \u062C\u0644\u0628 \u062A\u0630\u0627\u0643\u0631 \u0627\u0644\u062F\u0639\u0645" });
  }
});
router5.post("/tickets", requireAuth, upload.single("image"), (req, res) => {
  try {
    const { title, message } = req.body;
    if (!title || !message) {
      return res.status(400).json({ error: "\u0627\u0644\u0639\u0646\u0648\u0627\u0646 \u0648\u0645\u062D\u062A\u0648\u0649 \u0627\u0644\u0631\u0633\u0627\u0644\u0629 \u0645\u0637\u0644\u0648\u0628\u0627\u0646" });
    }
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : void 0;
    const ticket = createTicket(req.user.id, title, message, imageUrl);
    return res.json({ success: true, ticket });
  } catch (err) {
    console.error("Error creating ticket:", err);
    return res.status(500).json({ error: "\u0641\u0634\u0644 \u0641\u064A \u0625\u0646\u0634\u0627\u0621 \u062A\u0630\u0643\u0631\u0629 \u0627\u0644\u062F\u0639\u0645" });
  }
});
router5.post("/tickets/:ticketId/messages", requireAuth, upload.single("image"), (req, res) => {
  try {
    const { ticketId } = req.params;
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: "\u0645\u062D\u062A\u0648\u0649 \u0627\u0644\u0631\u0633\u0627\u0644\u0629 \u0645\u0637\u0644\u0648\u0628" });
    }
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : void 0;
    const ok = addMessageToTicket(ticketId, req.user.id, message, imageUrl);
    return res.json({ success: ok });
  } catch (err) {
    console.error("Error adding message:", err);
    return res.status(500).json({ error: "\u0641\u0634\u0644 \u0641\u064A \u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u0631\u062F" });
  }
});
router5.post("/tickets/:ticketId/close", requireAuth, (req, res) => {
  try {
    const { ticketId } = req.params;
    const ok = closeTicket(ticketId, req.user.id);
    return res.json({ success: ok });
  } catch (err) {
    return res.status(500).json({ error: "\u0641\u0634\u0644 \u0641\u064A \u0625\u063A\u0644\u0627\u0642 \u062A\u0630\u0643\u0631\u0629 \u0627\u0644\u062F\u0639\u0645" });
  }
});
var user_default = router5;

// server/routes/admin.ts
import { Router as Router6 } from "express";
init_db();
init_db();
var router6 = Router6();
router6.use(requireAuth, requireAdmin);
router6.get("/stats", (req, res) => {
  try {
    const stats = getStats();
    return res.json({ success: true, stats });
  } catch (err) {
    return res.status(500).json({ error: "\u0641\u0634\u0644 \u0641\u064A \u062C\u0644\u0628 \u0625\u062D\u0635\u0627\u0626\u064A\u0627\u062A \u0627\u0644\u0646\u0638\u0627\u0645" });
  }
});
router6.get("/products", (req, res) => {
  try {
    const products = getAllProducts(true);
    return res.json({ success: true, products });
  } catch (err) {
    return res.status(500).json({ error: "\u0641\u0634\u0644 \u0641\u064A \u062C\u0644\u0628 \u0627\u0644\u0645\u0646\u062A\u062C\u0627\u062A" });
  }
});
router6.post("/products", upload.single("imageFile"), async (req, res) => {
  try {
    const { name, description, category, image } = req.body;
    if (!name) return res.status(400).json({ error: "\u0627\u0633\u0645 \u0627\u0644\u0645\u0646\u062A\u062C \u0645\u0637\u0644\u0648\u0628" });
    let imagePath = image || "";
    if (req.file) {
      imagePath = `/uploads/${req.file.filename}`;
    }
    const product = createProduct({ name, description, category, image: imagePath });
    await logSystemAction({
      userId: req.user.id,
      userEmail: req.user.email,
      userName: req.user.name,
      action: "\u0625\u0636\u0627\u0641\u0629 \u0645\u0646\u062A\u062C \u062C\u062F\u064A\u062F",
      details: `\u0642\u0627\u0645 \u0627\u0644\u0645\u0633\u0624\u0648\u0644 \u0628\u0625\u0636\u0627\u0641\u0629 \u0627\u0644\u0645\u0646\u062A\u062C (${product.name}) \u0625\u0644\u0649 \u0627\u0644\u0645\u062E\u0632\u0648\u0646.`,
      ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress || "",
      userAgent: req.headers["user-agent"] || "",
      productName: product.name,
      status: "success",
      sendToDiscord: true
    });
    return res.json({ success: true, product });
  } catch (err) {
    console.error("Create product err:", err);
    return res.status(500).json({ error: "\u0641\u0634\u0644 \u0641\u064A \u0625\u0636\u0627\u0641\u0629 \u0627\u0644\u0645\u0646\u062A\u062C" });
  }
});
router6.put("/products/:id", upload.single("imageFile"), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, category, status, image } = req.body;
    let imagePath = image;
    if (req.file) {
      imagePath = `/uploads/${req.file.filename}`;
    }
    const updated = updateProduct(id, { name, description, category, status, image: imagePath });
    await logSystemAction({
      userId: req.user.id,
      userEmail: req.user.email,
      userName: req.user.name,
      action: "\u062A\u0639\u062F\u064A\u0644 \u0645\u0646\u062A\u062C",
      details: `\u0642\u0627\u0645 \u0627\u0644\u0645\u0633\u0624\u0648\u0644 \u0628\u062A\u0639\u062F\u064A\u0644 \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0645\u0646\u062A\u062C (${updated?.name || id})`,
      ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress || "",
      userAgent: req.headers["user-agent"] || "",
      productName: updated?.name,
      status: "info",
      sendToDiscord: true
    });
    return res.json({ success: true, product: updated });
  } catch (err) {
    return res.status(500).json({ error: "\u0641\u0634\u0644 \u0641\u064A \u062A\u0639\u062F\u064A\u0644 \u0627\u0644\u0645\u0646\u062A\u062C" });
  }
});
router6.delete("/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const prod = getProductById(id);
    deleteProduct(id);
    await logSystemAction({
      userId: req.user.id,
      userEmail: req.user.email,
      userName: req.user.name,
      action: "\u062D\u0630\u0641 \u0645\u0646\u062A\u062C",
      details: `\u062A\u0645 \u062D\u0630\u0641 \u0627\u0644\u0645\u0646\u062A\u062C (${prod?.name || id}) \u0628\u0627\u0644\u0643\u0627\u0645\u0644 \u0645\u0639 \u0645\u0644\u0641\u0627\u062A\u0647 \u0648\u0645\u0641\u0627\u062A\u064A\u062D\u0647.`,
      ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress || "",
      userAgent: req.headers["user-agent"] || "",
      productName: prod?.name,
      status: "warning",
      sendToDiscord: true
    });
    return res.json({ success: true, message: "\u062A\u0645 \u062D\u0630\u0641 \u0627\u0644\u0645\u0646\u062A\u062C \u0628\u0646\u062C\u0627\u062D" });
  } catch (err) {
    return res.status(500).json({ error: "\u0641\u0634\u0644 \u0641\u064A \u062D\u0630\u0641 \u0627\u0644\u0645\u0646\u062A\u062C" });
  }
});
router6.get("/products/:id/files", (req, res) => {
  try {
    const files = getProductFiles(req.params.id);
    return res.json({ success: true, files });
  } catch (err) {
    return res.status(500).json({ error: "\u0641\u0634\u0644 \u0641\u064A \u062C\u0644\u0628 \u0645\u0644\u0641\u0627\u062A \u0627\u0644\u0645\u0646\u062A\u062C" });
  }
});
router6.post("/products/:id/files", upload.array("files", 10), async (req, res) => {
  try {
    const { id } = req.params;
    const files = req.files;
    const { file_name, file_url, original_name, version } = req.body;
    const addedFiles = [];
    if (files && files.length > 0) {
      for (const f of files) {
        const added = addProductFile({
          product_id: id,
          filename: f.filename,
          original_name: f.originalname,
          size: f.size,
          mime_type: f.mimetype
        });
        addedFiles.push(added);
      }
    } else if (file_name || file_url) {
      const nameToUse = file_name || original_name || "\u0645\u0644\u0641 \u0627\u0644\u0645\u0646\u062A\u062C";
      const added = addProductFile({
        product_id: id,
        filename: file_url || nameToUse,
        original_name: nameToUse,
        size: 15485760,
        // ~15 MB
        mime_type: "application/octet-stream"
      });
      addedFiles.push(added);
    } else {
      return res.status(400).json({ error: "\u0644\u0645 \u064A\u062A\u0645 \u062A\u0642\u062F\u064A\u0645 \u0623\u064A \u0645\u0644\u0641 \u0623\u0648 \u0631\u0627\u0628\u0637 \u0635\u0627\u0644\u062D" });
    }
    const prod = getProductById(id);
    await logSystemAction({
      userId: req.user.id,
      userEmail: req.user.email,
      userName: req.user.name,
      action: "\u0625\u0636\u0627\u0641\u0629 \u0645\u0644\u0641 \u0644\u0644\u0645\u0646\u062A\u062C",
      details: `\u062A\u0645 \u0625\u0636\u0627\u0641\u0629 ${addedFiles.length} \u0645\u0644\u0641 \u0644\u0640 (${prod?.name || id})`,
      ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress || "",
      userAgent: req.headers["user-agent"] || "",
      productName: prod?.name,
      status: "success",
      sendToDiscord: true
    });
    return res.json({ success: true, files: addedFiles, count: addedFiles.length });
  } catch (err) {
    console.error("File upload err:", err);
    return res.status(500).json({ error: "\u0641\u0634\u0644 \u0641\u064A \u0631\u0641\u0639 \u0627\u0644\u0645\u0644\u0641\u0627\u062A \u0644\u0644\u062E\u0627\u062F\u0645" });
  }
});
router6.delete("/files/:fileId", async (req, res) => {
  try {
    const deleted = deleteProductFile(req.params.fileId);
    if (deleted) {
      const prod = getProductById(deleted.product_id);
      await logSystemAction({
        userId: req.user.id,
        userEmail: req.user.email,
        userName: req.user.name,
        action: "\u062D\u0630\u0641 \u0645\u0644\u0641",
        details: `\u062A\u0645 \u062D\u0630\u0641 \u0627\u0644\u0645\u0644\u0641 (${deleted.original_name}) \u0645\u0646 \u0627\u0644\u0645\u0646\u062A\u062C (${prod?.name || deleted.product_id})`,
        ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress || "",
        userAgent: req.headers["user-agent"] || "",
        productName: prod?.name,
        status: "warning",
        sendToDiscord: true
      });
    }
    return res.json({ success: true, message: "\u062A\u0645 \u062D\u0630\u0641 \u0627\u0644\u0645\u0644\u0641 \u0628\u0646\u062C\u0627\u062D" });
  } catch (err) {
    return res.status(500).json({ error: "\u0641\u0634\u0644 \u0641\u064A \u062D\u0630\u0641 \u0627\u0644\u0645\u0644\u0641" });
  }
});
router6.get("/keys", (req, res) => {
  try {
    const { productId, search } = req.query;
    if (search) {
      const keys2 = searchKeys(search.toString());
      return res.json({ success: true, keys: keys2 });
    }
    if (productId) {
      const keys2 = getKeysByProduct(productId.toString());
      return res.json({ success: true, keys: keys2 });
    }
    const keys = getAllKeys();
    return res.json({ success: true, keys });
  } catch (err) {
    return res.status(500).json({ error: "\u0641\u0634\u0644 \u0641\u064A \u062C\u0644\u0628 \u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0645\u0641\u0627\u062A\u064A\u062D" });
  }
});
router6.get("/keys/stats", (req, res) => {
  try {
    const { productId } = req.query;
    const stats = getKeyStats(productId?.toString());
    return res.json({ success: true, stats });
  } catch (err) {
    return res.status(500).json({ error: "\u0641\u0634\u0644 \u0641\u064A \u062C\u0644\u0628 \u0625\u062D\u0635\u0627\u0626\u064A\u0627\u062A \u0627\u0644\u0645\u0641\u0627\u062A\u064A\u062D" });
  }
});
router6.get("/keys/redeemed", (req, res) => {
  try {
    const redeemedKeys = getRedeemedKeysDetails();
    const stats = {
      total: redeemedKeys.length,
      active: redeemedKeys.filter((k) => k.status === "active").length,
      expired: redeemedKeys.filter((k) => k.status === "expired").length
    };
    return res.json({ success: true, keys: redeemedKeys, stats });
  } catch (err) {
    return res.status(500).json({ error: "\u0641\u0634\u0644 \u0641\u064A \u062C\u0644\u0628 \u0627\u0644\u0645\u0641\u0627\u062A\u064A\u062D \u0627\u0644\u0645\u0641\u0639\u0644\u0629" });
  }
});
router6.post("/keys/generate", async (req, res) => {
  try {
    const { productId, count, duration, prefix } = req.body;
    if (!productId || !count) {
      return res.status(400).json({ error: "\u0627\u0644\u0631\u062C\u0627\u0621 \u062A\u062D\u062F\u064A\u062F \u0627\u0644\u0645\u0646\u062A\u062C \u0648\u0639\u062F\u062F \u0627\u0644\u0645\u0641\u0627\u062A\u064A\u062D" });
    }
    const numCount = Math.min(parseInt(count), 500);
    if (numCount <= 0) {
      return res.status(400).json({ error: "\u0639\u062F\u062F \u0627\u0644\u0645\u0641\u0627\u062A\u064A\u062D \u064A\u062C\u0628 \u0623\u0646 \u064A\u0643\u0648\u0646 \u0623\u0643\u0628\u0631 \u0645\u0646 \u0635\u0641\u0631" });
    }
    const generated = generateKeys(productId, numCount, duration || "lifetime", prefix);
    const prod = getProductById(productId);
    await logSystemAction({
      userId: req.user.id,
      userEmail: req.user.email,
      userName: req.user.name,
      action: "\u062A\u0648\u0644\u064A\u062F \u0645\u0641\u0627\u062A\u064A\u062D \u062A\u0644\u0642\u0627\u0626\u064A\u0627\u064B",
      details: `\u062A\u0645 \u062A\u0648\u0644\u064A\u062F ${generated.length} \u0645\u0641\u062A\u0627\u062D \u062C\u062F\u064A\u062F \u0644\u0644\u0645\u0646\u062A\u062C (${prod?.name || productId}) \u0628\u0645\u062F\u0629: ${duration || "lifetime"}`,
      ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress || "",
      userAgent: req.headers["user-agent"] || "",
      productName: prod?.name,
      status: "success",
      sendToDiscord: true
    });
    return res.json({ success: true, keys: generated, count: generated.length });
  } catch (err) {
    console.error("Generate keys err:", err);
    return res.status(500).json({ error: "\u0641\u0634\u0644 \u0641\u064A \u062A\u0648\u0644\u064A\u062F \u0627\u0644\u0645\u0641\u0627\u062A\u064A\u062D" });
  }
});
router6.get("/keys/export", (req, res) => {
  try {
    const { productId, format, status } = req.query;
    let keys = productId ? getKeysByProduct(productId.toString()) : getAllKeys();
    if (status && status !== "all") {
      keys = keys.filter((k) => k.status === status);
    }
    const formatType = format?.toString() || "txt";
    if (formatType === "csv") {
      const csvHeader = "Key,Status,Duration,Product,Used By,Used At,Created At\n";
      const csvBody = keys.map(
        (k) => `${k.key_value},${k.status},${k.duration || "lifetime"},${k.product_name || ""},${k.used_by_email || ""},${k.used_at || ""},${k.created_at}`
      ).join("\n");
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", "attachment; filename=keys_export.csv");
      return res.send(csvHeader + csvBody);
    } else {
      const txtBody = keys.map((k) => k.key_value).join("\n");
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.setHeader("Content-Disposition", "attachment; filename=keys_export.txt");
      return res.send(txtBody);
    }
  } catch (err) {
    return res.status(500).json({ error: "\u0641\u0634\u0644 \u0641\u064A \u062A\u0635\u062F\u064A\u0631 \u0627\u0644\u0645\u0641\u0627\u062A\u064A\u062D" });
  }
});
router6.post("/keys/import", async (req, res) => {
  try {
    const { productId, rawKeys, format, duration } = req.body;
    if (!productId || !rawKeys) {
      return res.status(400).json({ error: "\u0627\u0644\u0631\u062C\u0627\u0621 \u062A\u062D\u062F\u064A\u062F \u0627\u0644\u0645\u0646\u062A\u062C \u0648\u0625\u062F\u062E\u0627\u0644 \u0627\u0644\u0645\u0641\u0627\u062A\u064A\u062D" });
    }
    let keysList = [];
    if (Array.isArray(rawKeys)) {
      keysList = rawKeys;
    } else if (typeof rawKeys === "string") {
      keysList = rawKeys.split(/[\n,]+/).map((k) => k.trim()).filter(Boolean);
    }
    if (keysList.length === 0) {
      return res.status(400).json({ error: "\u0644\u0645 \u064A\u062A\u0645 \u0627\u0644\u0639\u062B\u0648\u0631 \u0639\u0644\u0649 \u0645\u0641\u0627\u062A\u064A\u062D \u0635\u0627\u0644\u062D\u0629 \u0644\u0644\u0627\u0633\u062A\u064A\u0631\u0627\u062F" });
    }
    const addedCount = addKeys(productId, keysList, duration);
    const prod = getProductById(productId);
    await logSystemAction({
      userId: req.user.id,
      userEmail: req.user.email,
      userName: req.user.name,
      action: "\u0627\u0633\u062A\u064A\u0631\u0627\u062F \u0645\u0641\u0627\u062A\u064A\u062D \u062F\u0641\u0639\u0629 \u0648\u0627\u062D\u062F\u0629",
      details: `\u062A\u0645 \u0625\u0636\u0627\u0641\u0629 ${addedCount} \u0645\u0641\u062A\u0627\u062D \u062C\u062F\u064A\u062F \u0644\u0644\u0645\u0646\u062A\u062C (${prod?.name || productId})`,
      ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress || "",
      userAgent: req.headers["user-agent"] || "",
      productName: prod?.name,
      status: "success",
      sendToDiscord: true
    });
    return res.json({ success: true, count: addedCount, message: `\u062A\u0645 \u062A\u062E\u0632\u064A\u0646 ${addedCount} \u0645\u0641\u0627\u062A\u064A\u062D \u062C\u062F\u064A\u062F\u0629 \u0628\u0646\u062C\u0627\u062D` });
  } catch (err) {
    console.error("Import keys err:", err);
    return res.status(500).json({ error: "\u0641\u0634\u0644 \u0641\u064A \u0627\u0633\u062A\u064A\u0631\u0627\u062F \u0627\u0644\u0645\u0641\u0627\u062A\u064A\u062D" });
  }
});
router6.patch("/keys/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    if (!["unused", "disabled"].includes(status)) {
      return res.status(400).json({ error: "\u0627\u0644\u062D\u0627\u0644\u0629 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D\u0629" });
    }
    const key = toggleKeyStatus(req.params.id, status);
    return res.json({ success: true, key });
  } catch (err) {
    return res.status(500).json({ error: "\u0641\u0634\u0644 \u0641\u064A \u062A\u063A\u064A\u064A\u0631 \u062D\u0627\u0644\u0629 \u0627\u0644\u0645\u0641\u062A\u0627\u062D" });
  }
});
router6.delete("/keys/:id", async (req, res) => {
  try {
    const allKeys = getAllKeys();
    const keyRecord = allKeys.find((k) => k.id === req.params.id);
    deleteKey(req.params.id);
    if (keyRecord) {
      const prod = getProductById(keyRecord.product_id);
      await logSystemAction({
        userId: req.user.id,
        userEmail: req.user.email,
        userName: req.user.name,
        action: "\u062D\u0630\u0641 \u0645\u0641\u062A\u0627\u062D",
        details: `\u062A\u0645 \u062D\u0630\u0641 \u0627\u0644\u0645\u0641\u062A\u0627\u062D (${keyRecord.key_value}) \u0645\u0646 \u0627\u0644\u0645\u062E\u0632\u0648\u0646`,
        ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress || "",
        userAgent: req.headers["user-agent"] || "",
        productName: prod?.name,
        keyValue: keyRecord.key_value,
        status: "warning",
        sendToDiscord: true
      });
    }
    return res.json({ success: true, message: "\u062A\u0645 \u062D\u0630\u0641 \u0627\u0644\u0645\u0641\u062A\u0627\u062D \u0628\u0646\u062C\u0627\u062D" });
  } catch (err) {
    return res.status(500).json({ error: "\u0641\u0634\u0644 \u0641\u064A \u062D\u0630\u0641 \u0627\u0644\u0645\u0641\u062A\u0627\u062D" });
  }
});
router6.get("/users", (req, res) => {
  try {
    const users = getAllUsers();
    return res.json({ success: true, users });
  } catch (err) {
    return res.status(500).json({ error: "\u0641\u0634\u0644 \u0641\u064A \u062C\u0644\u0628 \u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645\u064A\u0646" });
  }
});
router6.get("/users/:id/products", (req, res) => {
  try {
    const products = getUserProducts(req.params.id);
    return res.json({ success: true, products });
  } catch (err) {
    return res.status(500).json({ error: "\u0641\u0634\u0644 \u0641\u064A \u062C\u0644\u0628 \u0645\u0646\u062A\u062C\u0627\u062A \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645" });
  }
});
router6.get("/users/:id/detail", (req, res) => {
  try {
    const userDetail = getDetailedUserView(req.params.id);
    if (!userDetail) return res.status(404).json({ error: "\u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
    return res.json({ success: true, user: userDetail });
  } catch (err) {
    return res.status(500).json({ error: "\u0641\u0634\u0644 \u0641\u064A \u062C\u0644\u0628 \u062A\u0641\u0627\u0635\u064A\u0644 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645" });
  }
});
router6.post("/users/:id/ban", async (req, res) => {
  try {
    const { reason } = req.body;
    const targetUser = findUserById(req.params.id);
    if (!targetUser) return res.status(404).json({ error: "\u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
    if (targetUser.role === "owner" || targetUser.role === "admin" && req.user.role !== "owner") {
      return res.status(403).json({ error: "\u0644\u0627 \u064A\u0645\u0643\u0646\u0643 \u062D\u0638\u0631 \u0639\u0636\u0648 \u0625\u062F\u0627\u0631\u0629 \u0641\u064A \u0646\u0641\u0633 \u0645\u0633\u062A\u0648\u0627\u0643 \u0623\u0648 \u0623\u0639\u0644\u0649 \u0645\u0646\u0643" });
    }
    banUser(targetUser.id, reason || "\u0645\u062E\u0627\u0644\u0641\u0629 \u0634\u0631\u0648\u0637 \u0627\u0644\u0627\u0633\u062A\u062E\u062F\u0627\u0645");
    await logSystemAction({
      userId: req.user.id,
      userEmail: req.user.email,
      userName: req.user.name,
      action: "\u062D\u0638\u0631 \u0645\u0633\u062A\u062E\u062F\u0645",
      details: `\u062A\u0645 \u062D\u0638\u0631 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 (${targetUser.name} - ${targetUser.email}). \u0627\u0644\u0633\u0628\u0628: ${reason || "\u063A\u064A\u0631 \u0645\u062D\u062F\u062F"}`,
      ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress || "",
      userAgent: req.headers["user-agent"] || "",
      status: "error",
      sendToDiscord: true
    });
    return res.json({ success: true, message: "\u062A\u0645 \u062D\u0638\u0631 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0628\u0646\u062C\u0627\u062D" });
  } catch (err) {
    return res.status(500).json({ error: "\u0641\u0634\u0644 \u0641\u064A \u062D\u0638\u0631 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645" });
  }
});
router6.post("/users/:id/unban", async (req, res) => {
  try {
    const targetUser = findUserById(req.params.id);
    if (!targetUser) return res.status(404).json({ error: "\u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
    unbanUser(targetUser.id);
    await logSystemAction({
      userId: req.user.id,
      userEmail: req.user.email,
      userName: req.user.name,
      action: "\u0625\u0644\u063A\u0627\u0621 \u062D\u0638\u0631 \u0645\u0633\u062A\u062E\u062F\u0645",
      details: `\u062A\u0645 \u0631\u0641\u0639 \u0627\u0644\u062D\u0638\u0631 \u0639\u0646 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 (${targetUser.name} - ${targetUser.email})`,
      ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress || "",
      userAgent: req.headers["user-agent"] || "",
      status: "success",
      sendToDiscord: true
    });
    return res.json({ success: true, message: "\u062A\u0645 \u0631\u0641\u0639 \u0627\u0644\u062D\u0638\u0631 \u0639\u0646 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645" });
  } catch (err) {
    return res.status(500).json({ error: "\u0641\u0634\u0644 \u0641\u064A \u0631\u0641\u0639 \u0627\u0644\u062D\u0638\u0631" });
  }
});
router6.post("/users/:id/role", requireOwner, async (req, res) => {
  try {
    const { role } = req.body;
    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({ error: "\u0627\u0644\u0631\u062A\u0628\u0629 \u0627\u0644\u0645\u062D\u062F\u062F\u0629 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D\u0629. \u064A\u0645\u0643\u0646\u0643 \u062A\u0631\u0642\u064A\u0629 \u0627\u0644\u0639\u0636\u0648 \u0625\u0644\u0649 admin \u0623\u0648 user \u0641\u0642\u0637." });
    }
    const targetUser = findUserById(req.params.id);
    if (!targetUser) return res.status(404).json({ error: "\u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
    if (targetUser.role === "owner") return res.status(403).json({ error: "\u0644\u0627 \u064A\u0645\u0643\u0646 \u062A\u063A\u064A\u064A\u0631 \u0631\u062A\u0628\u0629 \u0645\u0627\u0644\u0643 \u0627\u0644\u0645\u0648\u0642\u0639 (Owner)" });
    setUserRole(targetUser.id, role);
    await logSystemAction({
      userId: req.user.id,
      userEmail: req.user.email,
      userName: req.user.name,
      action: "\u062A\u063A\u064A\u064A\u0631 \u0631\u062A\u0628\u0629 \u0648\u0635\u0644\u0627\u062D\u064A\u0629 \u0645\u0633\u062A\u062E\u062F\u0645",
      details: `\u0642\u0627\u0645 \u0645\u0627\u0644\u0643 \u0627\u0644\u0645\u0648\u0642\u0639 \u0628\u062A\u063A\u064A\u064A\u0631 \u0635\u0644\u0627\u062D\u064A\u0629 (${targetUser.name} - ${targetUser.email}) \u0625\u0644\u0649 \u0631\u062A\u0628\u0629: ${role === "admin" ? "\u0645\u0633\u0624\u0648\u0644 \u0645\u0648\u0642\u0639 (Admin)" : "\u0639\u0636\u0648 \u0639\u0627\u062F\u064A (User)"}`,
      ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress || "",
      userAgent: req.headers["user-agent"] || "",
      status: "warning",
      sendToDiscord: true
    });
    return res.json({ success: true, message: `\u062A\u0645 \u062A\u063A\u064A\u064A\u0631 \u0635\u0644\u0627\u062D\u064A\u0627\u062A ${targetUser.name} \u0628\u0646\u062C\u0627\u062D \u0625\u0644\u0649 ${role}` });
  } catch (err) {
    return res.status(500).json({ error: "\u0641\u0634\u0644 \u0641\u064A \u062A\u0639\u062F\u064A\u0644 \u0627\u0644\u0635\u0644\u0627\u062D\u064A\u0627\u062A" });
  }
});
router6.delete("/users/:id", requireOwner, async (req, res) => {
  try {
    const targetUser = findUserById(req.params.id);
    if (!targetUser) return res.status(404).json({ error: "\u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
    if (targetUser.role === "owner") return res.status(403).json({ error: "\u0644\u0627 \u064A\u0645\u0643\u0646 \u062D\u0630\u0641 \u062D\u0633\u0627\u0628 \u0645\u0627\u0644\u0643 \u0627\u0644\u0645\u0648\u0642\u0639" });
    deleteUser(targetUser.id);
    await logSystemAction({
      userId: req.user.id,
      userEmail: req.user.email,
      userName: req.user.name,
      action: "\u062D\u0630\u0641 \u062D\u0633\u0627\u0628 \u0645\u0633\u062A\u062E\u062F\u0645",
      details: `\u0642\u0627\u0645 \u0645\u0627\u0644\u0643 \u0627\u0644\u0645\u0648\u0642\u0639 \u0628\u062D\u0630\u0641 \u062D\u0633\u0627\u0628 (${targetUser.name} - ${targetUser.email}) \u0628\u0627\u0644\u0643\u0627\u0645\u0644 \u0645\u0646 \u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A.`,
      ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress || "",
      userAgent: req.headers["user-agent"] || "",
      status: "warning",
      sendToDiscord: true
    });
    return res.json({ success: true, message: "\u062A\u0645 \u062D\u0630\u0641 \u0627\u0644\u062D\u0633\u0627\u0628 \u0646\u0647\u0627\u0626\u064A\u0627\u064B" });
  } catch (err) {
    return res.status(500).json({ error: "\u0641\u0634\u0644 \u0641\u064A \u062D\u0630\u0641 \u0627\u0644\u062D\u0633\u0627\u0628" });
  }
});
router6.get("/logs", (req, res) => {
  try {
    const limit = parseInt(req.query.limit || "200");
    const offset = parseInt(req.query.offset || "0");
    const action = req.query.action || "all";
    const logs = getLogs(limit, offset, action);
    return res.json({ success: true, logs });
  } catch (err) {
    return res.status(500).json({ error: "\u0641\u0634\u0644 \u0641\u064A \u062C\u0644\u0628 \u0627\u0644\u0633\u062C\u0644\u0627\u062A" });
  }
});
router6.get("/settings", (req, res) => {
  try {
    const site_title = getSetting("site_title") || getSetting("site_name") || "\u062A\u0640\u0639\u0640\u0646 | \u0627\u0644\u0645\u0646\u0635\u0629 \u0627\u0644\u0631\u0642\u0645\u064A\u0629";
    const discord_webhook_url = getSetting("discord_webhook_url") || "";
    const google_client_id = getSetting("google_client_id") || process.env.GOOGLE_CLIENT_ID || "";
    return res.json({
      success: true,
      settings: {
        site_title,
        discord_webhook_url,
        google_client_id,
        siteName: site_title,
        discordWebhookUrl: discord_webhook_url
      }
    });
  } catch (err) {
    return res.status(500).json({ error: "\u0641\u0634\u0644 \u0641\u064A \u062C\u0644\u0628 \u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u0646\u0638\u0627\u0645" });
  }
});
var saveSettingsHandler = async (req, res) => {
  try {
    const { site_title, siteName, discord_webhook_url, discordWebhookUrl, google_client_id, googleClientId } = req.body;
    const finalSiteTitle = site_title !== void 0 ? site_title : siteName;
    const finalWebhook = discord_webhook_url !== void 0 ? discord_webhook_url : discordWebhookUrl;
    const finalGoogleId = google_client_id !== void 0 ? google_client_id : googleClientId;
    if (finalSiteTitle !== void 0) {
      setSetting("site_title", finalSiteTitle);
      setSetting("site_name", finalSiteTitle);
    }
    if (finalWebhook !== void 0) setSetting("discord_webhook_url", finalWebhook.trim());
    if (finalGoogleId !== void 0) setSetting("google_client_id", finalGoogleId.trim());
    await logSystemAction({
      userId: req.user.id,
      userEmail: req.user.email,
      userName: req.user.name,
      action: "\u062A\u0639\u062F\u064A\u0644 \u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u0646\u0638\u0627\u0645",
      details: "\u0642\u0627\u0645 \u0645\u0627\u0644\u0643 \u0627\u0644\u0645\u0648\u0642\u0639 \u0628\u062A\u0639\u062F\u064A\u0644 \u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u0645\u0646\u0635\u0629 \u0648\u0631\u0627\u0628\u0637 Discord Webhook \u0648\u0645\u0639\u0631\u0641 Google OAuth",
      ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress || "",
      userAgent: req.headers["user-agent"] || "",
      status: "info",
      sendToDiscord: true
    });
    return res.json({ success: true, message: "\u062A\u0645 \u062D\u0641\u0638 \u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u0646\u0638\u0627\u0645 \u0628\u0646\u062C\u0627\u062D" });
  } catch (err) {
    return res.status(500).json({ error: "\u0641\u0634\u0644 \u0641\u064A \u062D\u0641\u0638 \u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A" });
  }
};
router6.post("/settings", requireOwner, saveSettingsHandler);
router6.put("/settings", requireOwner, saveSettingsHandler);
router6.get("/tickets", (req, res) => {
  try {
    const tickets = getAllTickets();
    return res.json({ success: true, tickets });
  } catch (err) {
    return res.status(500).json({ error: "\u0641\u0634\u0644 \u0641\u064A \u062C\u0644\u0628 \u0627\u0644\u062A\u0630\u0627\u0643\u0631" });
  }
});
router6.post("/tickets/:ticketId/messages", upload.single("image"), (req, res) => {
  try {
    const { ticketId } = req.params;
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: "\u0645\u062D\u062A\u0648\u0649 \u0627\u0644\u0631\u0633\u0627\u0644\u0629 \u0645\u0637\u0644\u0648\u0628" });
    }
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : void 0;
    const ok = addMessageToTicket(ticketId, req.user.id, message, imageUrl);
    return res.json({ success: ok });
  } catch (err) {
    return res.status(500).json({ error: "\u0641\u0634\u0644 \u0641\u064A \u0625\u0631\u0633\u0627\u0644 \u0631\u062F \u0627\u0644\u0625\u062F\u0627\u0631\u0629" });
  }
});
router6.post("/tickets/:ticketId/close", (req, res) => {
  try {
    const { ticketId } = req.params;
    const ok = closeTicket(ticketId, req.user.id);
    return res.json({ success: ok });
  } catch (err) {
    return res.status(500).json({ error: "\u0641\u0634\u0644 \u0641\u064A \u0625\u063A\u0644\u0627\u0642 \u0627\u0644\u062A\u0630\u0643\u0631\u0629" });
  }
});
var admin_default = router6;

// server.ts
init_db();
dotenv.config();
var app = express();
var PORT = parseInt(process.env.PORT || "3000", 10);
app.use(async (req, res, next) => {
  await ensureDbLoaded();
  next();
});
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());
app.use(helmetMiddleware);
app.use(corsMiddleware);
app.use(generalLimiter);
app.use(csrfProtection);
app.use("/uploads", express.static(UPLOADS_DIR));
app.use("/api/auth", auth_default);
app.use("/api/products", products_default);
app.use("/api/keys", keys_default);
app.use("/api/files", files_default);
app.use("/api/user", user_default);
app.use("/api/admin", admin_default);
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
});
async function setupServer() {
  const isDev = process.argv.includes("--dev") || process.env.NODE_ENV === "development";
  if (isDev) {
    console.log("\u26A1 Starting in Development Mode with Vite Middleware...");
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    console.log("\u{1F680} Starting in Production Mode...");
    const distPath = path4.join(process.cwd(), "dist");
    if (fs3.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        if (req.path.startsWith("/api/")) {
          return res.status(404).json({ error: "API route not found" });
        }
        res.sendFile(path4.join(distPath, "index.html"));
      });
    } else {
      console.warn("\u26A0\uFE0F Dist folder not found. Run npm run build first.");
    }
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550`);
    console.log(`\u2728 \u062A\u0640\u0639\u0640\u0646 | \u0645\u0646\u0635\u0629 \u062A\u0633\u0644\u064A\u0645 \u0627\u0644\u0645\u0646\u062A\u062C\u0627\u062A \u0627\u0644\u0631\u0642\u0645\u064A\u0629 \u0627\u0644\u0631\u0633\u0645\u064A\u0629`);
    console.log(`\u{1F310} \u0627\u0644\u062E\u0627\u062F\u0645 \u064A\u0639\u0645\u0644 \u0628\u0646\u062C\u0627\u062D \u0639\u0644\u0649 \u0627\u0644\u0631\u0627\u0628\u0637: http://localhost:${PORT}`);
    console.log(`\u{1F451} \u0628\u0631\u064A\u062F \u0627\u0644\u0645\u0633\u0624\u0648\u0644 \u0627\u0644\u0623\u0633\u0627\u0633\u064A (Owner): yasemoh24@gmail.com`);
    console.log(`\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
`);
  });
}
if (!process.env.VERCEL) {
  setupServer().catch((err) => {
    console.error("Fatal error starting server:", err);
    process.exit(1);
  });
}
var server_default = app;
export {
  server_default as default
};
//# sourceMappingURL=index.js.map
