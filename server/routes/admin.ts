import { Router, Request, Response } from 'express';
import fs from 'fs';
import { requireAuth, requireAdmin, requireOwner } from '../middleware/auth';
import { upload } from '../middleware/upload';
import { 
  getStats, getAllProducts, createProduct, updateProduct, deleteProduct,
  getProductFiles, addProductFile, deleteProductFile, getProductById,
  getKeysByProduct, getAllKeys, searchKeys, addKeys, deleteKey, findKeyByValue,
  generateKeys, getKeyStats, toggleKeyStatus, getRedeemedKeysDetails, getDetailedUserView,
  getAllUsers, banUser, unbanUser, setUserRole, deleteUser, getUserProducts,
  getLogs, getSetting, setSetting, findUserById
} from '../db';
import { logSystemAction } from '../services/logger';

const router = Router();

// Ensure all admin routes require authentication and admin/owner role
router.use(requireAuth, requireAdmin);

// ─── 1. DASHBOARD STATS ───
router.get('/stats', (req: Request, res: Response) => {
  try {
    const stats = getStats();
    return res.json({ success: true, stats });
  } catch (err) {
    return res.status(500).json({ error: 'فشل في جلب إحصائيات النظام' });
  }
});

// ─── 2. PRODUCTS MANAGEMENT ───
router.get('/products', (req: Request, res: Response) => {
  try {
    const products = getAllProducts(true); // true = include hidden products
    return res.json({ success: true, products });
  } catch (err) {
    return res.status(500).json({ error: 'فشل في جلب المنتجات' });
  }
});

router.post('/products', upload.single('imageFile'), async (req: Request, res: Response) => {
  try {
    const { name, description, category, image } = req.body;
    if (!name) return res.status(400).json({ error: 'اسم المنتج مطلوب' });

    let imagePath = image || '';
    if (req.file) {
      imagePath = `/uploads/${req.file.filename}`;
    }

    const product = createProduct({ name, description, category, image: imagePath });
    
    await logSystemAction({
      userId: req.user!.id,
      userEmail: req.user!.email,
      userName: req.user!.name,
      action: 'إضافة منتج جديد',
      details: `قام المسؤول بإضافة المنتج (${product.name}) إلى المخزون.`,
      ip: req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '',
      userAgent: req.headers['user-agent'] || '',
      productName: product.name,
      status: 'success',
      sendToDiscord: true
    });

    return res.json({ success: true, product });
  } catch (err) {
    console.error('Create product err:', err);
    return res.status(500).json({ error: 'فشل في إضافة المنتج' });
  }
});

router.put('/products/:id', upload.single('imageFile'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, category, status, image } = req.body;

    let imagePath = image;
    if (req.file) {
      imagePath = `/uploads/${req.file.filename}`;
    }

    const updated = updateProduct(id, { name, description, category, status, image: imagePath });

    await logSystemAction({
      userId: req.user!.id,
      userEmail: req.user!.email,
      userName: req.user!.name,
      action: 'تعديل منتج',
      details: `قام المسؤول بتعديل بيانات المنتج (${updated?.name || id})`,
      ip: req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '',
      userAgent: req.headers['user-agent'] || '',
      productName: updated?.name,
      status: 'info',
      sendToDiscord: true
    });

    return res.json({ success: true, product: updated });
  } catch (err) {
    return res.status(500).json({ error: 'فشل في تعديل المنتج' });
  }
});

router.delete('/products/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const prod = getProductById(id);
    deleteProduct(id);

    await logSystemAction({
      userId: req.user!.id,
      userEmail: req.user!.email,
      userName: req.user!.name,
      action: 'حذف منتج',
      details: `تم حذف المنتج (${prod?.name || id}) بالكامل مع ملفاته ومفاتيحه.`,
      ip: req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '',
      userAgent: req.headers['user-agent'] || '',
      productName: prod?.name,
      status: 'warning',
      sendToDiscord: true
    });

    return res.json({ success: true, message: 'تم حذف المنتج بنجاح' });
  } catch (err) {
    return res.status(500).json({ error: 'فشل في حذف المنتج' });
  }
});

// ─── 3. PRODUCT FILES MANAGEMENT ───
router.get('/products/:id/files', (req: Request, res: Response) => {
  try {
    const files = getProductFiles(req.params.id);
    return res.json({ success: true, files });
  } catch (err) {
    return res.status(500).json({ error: 'فشل في جلب ملفات المنتج' });
  }
});

router.post('/products/:id/files', upload.array('files', 10), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const files = req.files as Express.Multer.File[];
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
      const nameToUse = file_name || original_name || 'ملف المنتج';
      const added = addProductFile({
        product_id: id,
        filename: file_url || nameToUse,
        original_name: nameToUse,
        size: 15485760, // ~15 MB
        mime_type: 'application/octet-stream'
      });
      addedFiles.push(added);
    } else {
      return res.status(400).json({ error: 'لم يتم تقديم أي ملف أو رابط صالح' });
    }

    const prod = getProductById(id);
    await logSystemAction({
      userId: req.user!.id,
      userEmail: req.user!.email,
      userName: req.user!.name,
      action: 'إضافة ملف للمنتج',
      details: `تم إضافة ${addedFiles.length} ملف لـ (${prod?.name || id})`,
      ip: req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '',
      userAgent: req.headers['user-agent'] || '',
      productName: prod?.name,
      status: 'success',
      sendToDiscord: true
    });

    return res.json({ success: true, files: addedFiles, count: addedFiles.length });
  } catch (err) {
    console.error('File upload err:', err);
    return res.status(500).json({ error: 'فشل في رفع الملفات للخادم' });
  }
});

router.delete('/files/:fileId', async (req: Request, res: Response) => {
  try {
    const deleted = deleteProductFile(req.params.fileId);
    if (deleted) {
      const prod = getProductById(deleted.product_id);
      await logSystemAction({
        userId: req.user!.id,
        userEmail: req.user!.email,
        userName: req.user!.name,
        action: 'حذف ملف',
        details: `تم حذف الملف (${deleted.original_name}) من المنتج (${prod?.name || deleted.product_id})`,
        ip: req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '',
        userAgent: req.headers['user-agent'] || '',
        productName: prod?.name,
        status: 'warning',
        sendToDiscord: true
      });
    }
    return res.json({ success: true, message: 'تم حذف الملف بنجاح' });
  } catch (err) {
    return res.status(500).json({ error: 'فشل في حذف الملف' });
  }
});

// ─── 4. KEYS MANAGEMENT (Add, Generate, Import, Search, Export) ───
router.get('/keys', (req: Request, res: Response) => {
  try {
    const { productId, search } = req.query;
    if (search) {
      const keys = searchKeys(search.toString());
      return res.json({ success: true, keys });
    }
    if (productId) {
      const keys = getKeysByProduct(productId.toString());
      return res.json({ success: true, keys });
    }
    const keys = getAllKeys();
    return res.json({ success: true, keys });
  } catch (err) {
    return res.status(500).json({ error: 'فشل في جلب قائمة المفاتيح' });
  }
});

// Key statistics
router.get('/keys/stats', (req: Request, res: Response) => {
  try {
    const { productId } = req.query;
    const stats = getKeyStats(productId?.toString());
    return res.json({ success: true, stats });
  } catch (err) {
    return res.status(500).json({ error: 'فشل في جلب إحصائيات المفاتيح' });
  }
});

// Detailed Redeemed Keys endpoint
router.get('/keys/redeemed', (req: Request, res: Response) => {
  try {
    const redeemedKeys = getRedeemedKeysDetails();
    const stats = {
      total: redeemedKeys.length,
      active: redeemedKeys.filter(k => k.status === 'active').length,
      expired: redeemedKeys.filter(k => k.status === 'expired').length,
    };
    return res.json({ success: true, keys: redeemedKeys, stats });
  } catch (err) {
    return res.status(500).json({ error: 'فشل في جلب المفاتيح المفعلة' });
  }
});

// Generate keys automatically
router.post('/keys/generate', async (req: Request, res: Response) => {
  try {
    const { productId, count, duration, prefix } = req.body;
    if (!productId || !count) {
      return res.status(400).json({ error: 'الرجاء تحديد المنتج وعدد المفاتيح' });
    }

    const numCount = Math.min(parseInt(count), 500); // Max 500 at a time
    if (numCount <= 0) {
      return res.status(400).json({ error: 'عدد المفاتيح يجب أن يكون أكبر من صفر' });
    }

    const generated = generateKeys(productId, numCount, duration || 'lifetime', prefix);
    const prod = getProductById(productId);

    await logSystemAction({
      userId: req.user!.id,
      userEmail: req.user!.email,
      userName: req.user!.name,
      action: 'توليد مفاتيح تلقائياً',
      details: `تم توليد ${generated.length} مفتاح جديد للمنتج (${prod?.name || productId}) بمدة: ${duration || 'lifetime'}`,
      ip: req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '',
      userAgent: req.headers['user-agent'] || '',
      productName: prod?.name,
      status: 'success',
      sendToDiscord: true
    });

    return res.json({ success: true, keys: generated, count: generated.length });
  } catch (err) {
    console.error('Generate keys err:', err);
    return res.status(500).json({ error: 'فشل في توليد المفاتيح' });
  }
});

// Export keys
router.get('/keys/export', (req: Request, res: Response) => {
  try {
    const { productId, format, status } = req.query;
    let keys = productId ? getKeysByProduct(productId.toString()) : getAllKeys();
    
    if (status && status !== 'all') {
      keys = keys.filter((k: any) => k.status === status);
    }

    const formatType = format?.toString() || 'txt';
    
    if (formatType === 'csv') {
      const csvHeader = 'Key,Status,Duration,Product,Used By,Used At,Created At\n';
      const csvBody = keys.map((k: any) => 
        `${k.key_value},${k.status},${k.duration || 'lifetime'},${k.product_name || ''},${k.used_by_email || ''},${k.used_at || ''},${k.created_at}`
      ).join('\n');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename=keys_export.csv');
      return res.send(csvHeader + csvBody);
    } else {
      const txtBody = keys.map((k: any) => k.key_value).join('\n');
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename=keys_export.txt');
      return res.send(txtBody);
    }
  } catch (err) {
    return res.status(500).json({ error: 'فشل في تصدير المفاتيح' });
  }
});

router.post('/keys/import', async (req: Request, res: Response) => {
  try {
    const { productId, rawKeys, format, duration } = req.body;
    if (!productId || !rawKeys) {
      return res.status(400).json({ error: 'الرجاء تحديد المنتج وإدخال المفاتيح' });
    }

    let keysList: string[] = [];
    if (Array.isArray(rawKeys)) {
      keysList = rawKeys;
    } else if (typeof rawKeys === 'string') {
      // Split by newline or comma (for CSV or TXT)
      keysList = rawKeys.split(/[\n,]+/).map(k => k.trim()).filter(Boolean);
    }

    if (keysList.length === 0) {
      return res.status(400).json({ error: 'لم يتم العثور على مفاتيح صالحة للاستيراد' });
    }

    const addedCount = addKeys(productId, keysList, duration);
    const prod = getProductById(productId);

    await logSystemAction({
      userId: req.user!.id,
      userEmail: req.user!.email,
      userName: req.user!.name,
      action: 'استيراد مفاتيح دفعة واحدة',
      details: `تم إضافة ${addedCount} مفتاح جديد للمنتج (${prod?.name || productId})`,
      ip: req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '',
      userAgent: req.headers['user-agent'] || '',
      productName: prod?.name,
      status: 'success',
      sendToDiscord: true
    });

    return res.json({ success: true, count: addedCount, message: `تم تخزين ${addedCount} مفاتيح جديدة بنجاح` });
  } catch (err) {
    console.error('Import keys err:', err);
    return res.status(500).json({ error: 'فشل في استيراد المفاتيح' });
  }
});

// Toggle key status
router.patch('/keys/:id/status', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    if (!['unused', 'disabled'].includes(status)) {
      return res.status(400).json({ error: 'الحالة غير صالحة' });
    }
    const key = toggleKeyStatus(req.params.id, status);
    return res.json({ success: true, key });
  } catch (err) {
    return res.status(500).json({ error: 'فشل في تغيير حالة المفتاح' });
  }
});

router.delete('/keys/:id', async (req: Request, res: Response) => {
  try {
    const allKeys = getAllKeys();
    const keyRecord = allKeys.find((k: any) => k.id === req.params.id);
    deleteKey(req.params.id);

    if (keyRecord) {
      const prod = getProductById(keyRecord.product_id);
      await logSystemAction({
        userId: req.user!.id,
        userEmail: req.user!.email,
        userName: req.user!.name,
        action: 'حذف مفتاح',
        details: `تم حذف المفتاح (${keyRecord.key_value}) من المخزون`,
        ip: req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '',
        userAgent: req.headers['user-agent'] || '',
        productName: prod?.name,
        keyValue: keyRecord.key_value,
        status: 'warning',
        sendToDiscord: true
      });
    }

    return res.json({ success: true, message: 'تم حذف المفتاح بنجاح' });
  } catch (err) {
    return res.status(500).json({ error: 'فشل في حذف المفتاح' });
  }
});

// ─── 5. USERS MANAGEMENT & ROLE PERMISSION SETTINGS ───
router.get('/users', (req: Request, res: Response) => {
  try {
    const users = getAllUsers();
    return res.json({ success: true, users });
  } catch (err) {
    return res.status(500).json({ error: 'فشل في جلب قائمة المستخدمين' });
  }
});

router.get('/users/:id/products', (req: Request, res: Response) => {
  try {
    const products = getUserProducts(req.params.id);
    return res.json({ success: true, products });
  } catch (err) {
    return res.status(500).json({ error: 'فشل في جلب منتجات المستخدم' });
  }
});

router.get('/users/:id/detail', (req: Request, res: Response) => {
  try {
    const userDetail = getDetailedUserView(req.params.id);
    if (!userDetail) return res.status(404).json({ error: 'المستخدم غير موجود' });
    return res.json({ success: true, user: userDetail });
  } catch (err) {
    return res.status(500).json({ error: 'فشل في جلب تفاصيل المستخدم' });
  }
});

router.post('/users/:id/ban', async (req: Request, res: Response) => {
  try {
    const { reason } = req.body;
    const targetUser = findUserById(req.params.id);
    if (!targetUser) return res.status(404).json({ error: 'المستخدم غير موجود' });

    // Cannot ban an owner or admin unless you are the owner
    if (targetUser.role === 'owner' || (targetUser.role === 'admin' && req.user!.role !== 'owner')) {
      return res.status(403).json({ error: 'لا يمكنك حظر عضو إدارة في نفس مستواك أو أعلى منك' });
    }

    banUser(targetUser.id, reason || 'مخالفة شروط الاستخدام');

    await logSystemAction({
      userId: req.user!.id,
      userEmail: req.user!.email,
      userName: req.user!.name,
      action: 'حظر مستخدم',
      details: `تم حظر المستخدم (${targetUser.name} - ${targetUser.email}). السبب: ${reason || 'غير محدد'}`,
      ip: req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '',
      userAgent: req.headers['user-agent'] || '',
      status: 'error',
      sendToDiscord: true
    });

    return res.json({ success: true, message: 'تم حظر المستخدم بنجاح' });
  } catch (err) {
    return res.status(500).json({ error: 'فشل في حظر المستخدم' });
  }
});

router.post('/users/:id/unban', async (req: Request, res: Response) => {
  try {
    const targetUser = findUserById(req.params.id);
    if (!targetUser) return res.status(404).json({ error: 'المستخدم غير موجود' });

    unbanUser(targetUser.id);

    await logSystemAction({
      userId: req.user!.id,
      userEmail: req.user!.email,
      userName: req.user!.name,
      action: 'إلغاء حظر مستخدم',
      details: `تم رفع الحظر عن المستخدم (${targetUser.name} - ${targetUser.email})`,
      ip: req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '',
      userAgent: req.headers['user-agent'] || '',
      status: 'success',
      sendToDiscord: true
    });

    return res.json({ success: true, message: 'تم رفع الحظر عن المستخدم' });
  } catch (err) {
    return res.status(500).json({ error: 'فشل في رفع الحظر' });
  }
});

// CHANGE USER ROLE (Owner Only: allows making someone an Admin or downgrading to User)
router.post('/users/:id/role', requireOwner, async (req: Request, res: Response) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'الرتبة المحددة غير صالحة. يمكنك ترقية العضو إلى admin أو user فقط.' });
    }

    const targetUser = findUserById(req.params.id);
    if (!targetUser) return res.status(404).json({ error: 'المستخدم غير موجود' });
    if (targetUser.role === 'owner') return res.status(403).json({ error: 'لا يمكن تغيير رتبة مالك الموقع (Owner)' });

    setUserRole(targetUser.id, role);

    await logSystemAction({
      userId: req.user!.id,
      userEmail: req.user!.email,
      userName: req.user!.name,
      action: 'تغيير رتبة وصلاحية مستخدم',
      details: `قام مالك الموقع بتغيير صلاحية (${targetUser.name} - ${targetUser.email}) إلى رتبة: ${role === 'admin' ? 'مسؤول موقع (Admin)' : 'عضو عادي (User)'}`,
      ip: req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '',
      userAgent: req.headers['user-agent'] || '',
      status: 'warning',
      sendToDiscord: true
    });

    return res.json({ success: true, message: `تم تغيير صلاحيات ${targetUser.name} بنجاح إلى ${role}` });
  } catch (err) {
    return res.status(500).json({ error: 'فشل في تعديل الصلاحيات' });
  }
});

router.delete('/users/:id', requireOwner, async (req: Request, res: Response) => {
  try {
    const targetUser = findUserById(req.params.id);
    if (!targetUser) return res.status(404).json({ error: 'المستخدم غير موجود' });
    if (targetUser.role === 'owner') return res.status(403).json({ error: 'لا يمكن حذف حساب مالك الموقع' });

    deleteUser(targetUser.id);

    await logSystemAction({
      userId: req.user!.id,
      userEmail: req.user!.email,
      userName: req.user!.name,
      action: 'حذف حساب مستخدم',
      details: `قام مالك الموقع بحذف حساب (${targetUser.name} - ${targetUser.email}) بالكامل من قاعدة البيانات.`,
      ip: req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '',
      userAgent: req.headers['user-agent'] || '',
      status: 'warning',
      sendToDiscord: true
    });

    return res.json({ success: true, message: 'تم حذف الحساب نهائياً' });
  } catch (err) {
    return res.status(500).json({ error: 'فشل في حذف الحساب' });
  }
});

// ─── 6. SYSTEM LOGS ───
router.get('/logs', (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string || '200');
    const offset = parseInt(req.query.offset as string || '0');
    const action = req.query.action as string || 'all';
    const logs = getLogs(limit, offset, action);
    return res.json({ success: true, logs });
  } catch (err) {
    return res.status(500).json({ error: 'فشل في جلب السجلات' });
  }
});

// ─── 7. SYSTEM SETTINGS & DISCORD WEBHOOK CONFIG ───
router.get('/settings', (req: Request, res: Response) => {
  try {
    const site_title = getSetting('site_title') || getSetting('site_name') || 'تـعـن | المنصة الرقمية';
    const discord_webhook_url = getSetting('discord_webhook_url') || '';
    const google_client_id = getSetting('google_client_id') || process.env.GOOGLE_CLIENT_ID || '';
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
    return res.status(500).json({ error: 'فشل في جلب إعدادات النظام' });
  }
});

const saveSettingsHandler = async (req: Request, res: Response) => {
  try {
    const { site_title, siteName, discord_webhook_url, discordWebhookUrl, google_client_id, googleClientId } = req.body;
    const finalSiteTitle = site_title !== undefined ? site_title : siteName;
    const finalWebhook = discord_webhook_url !== undefined ? discord_webhook_url : discordWebhookUrl;
    const finalGoogleId = google_client_id !== undefined ? google_client_id : googleClientId;

    if (finalSiteTitle !== undefined) {
      setSetting('site_title', finalSiteTitle);
      setSetting('site_name', finalSiteTitle);
    }
    if (finalWebhook !== undefined) setSetting('discord_webhook_url', finalWebhook.trim());
    if (finalGoogleId !== undefined) setSetting('google_client_id', finalGoogleId.trim());

    await logSystemAction({
      userId: req.user!.id,
      userEmail: req.user!.email,
      userName: req.user!.name,
      action: 'تعديل إعدادات النظام',
      details: 'قام مالك الموقع بتعديل إعدادات المنصة ورابط Discord Webhook ومعرف Google OAuth',
      ip: req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '',
      userAgent: req.headers['user-agent'] || '',
      status: 'info',
      sendToDiscord: true
    });

    return res.json({ success: true, message: 'تم حفظ إعدادات النظام بنجاح' });
  } catch (err) {
    return res.status(500).json({ error: 'فشل في حفظ الإعدادات' });
  }
};

router.post('/settings', requireOwner, saveSettingsHandler);
router.put('/settings', requireOwner, saveSettingsHandler);

// ─── 8. SUPPORT TICKETS MANAGEMENT ───
import { getAllTickets, addMessageToTicket as adminAddMessage, closeTicket as adminCloseTicket } from '../db';

router.get('/tickets', (req: Request, res: Response) => {
  try {
    const tickets = getAllTickets();
    return res.json({ success: true, tickets });
  } catch (err) {
    return res.status(500).json({ error: 'فشل في جلب التذاكر' });
  }
});

router.post('/tickets/:ticketId/messages', upload.single('image'), (req: Request, res: Response) => {
  try {
    const { ticketId } = req.params;
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'محتوى الرسالة مطلوب' });
    }
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : undefined;
    const ok = adminAddMessage(ticketId, req.user!.id, message, imageUrl);
    return res.json({ success: ok });
  } catch (err) {
    return res.status(500).json({ error: 'فشل في إرسال رد الإدارة' });
  }
});

router.post('/tickets/:ticketId/close', (req: Request, res: Response) => {
  try {
    const { ticketId } = req.params;
    const ok = adminCloseTicket(ticketId, req.user!.id);
    return res.json({ success: ok });
  } catch (err) {
    return res.status(500).json({ error: 'فشل في إغلاق التذكرة' });
  }
});

export default router;
