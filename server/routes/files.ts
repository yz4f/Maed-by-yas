import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { requireAuth } from '../middleware/auth';
import { UPLOADS_DIR, incrementDownloadCount, getProductById, getProductFiles, getUserProducts } from '../db';
import { logSystemAction } from '../services/logger';

const router = Router();

// ─── Secure File Download Endpoint ───
router.get('/download/:fileId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { fileId } = req.params;
    const user = req.user!;

    // 1. Find the file record from all product files
    let fileRecord: any = null;
    const allProducts = require('../db').getAllProducts(true);
    for (const prod of allProducts) {
      const files = getProductFiles(prod.id);
      const found = files.find((f: any) => f.id === fileId);
      if (found) {
        fileRecord = found;
        break;
      }
    }

    if (!fileRecord) {
      return res.status(404).json({ error: 'الملف غير موجود أو تم حذفه من الخادم' });
    }

    // 2. Check permissions: if not admin/owner, verify user activated the product
    if (user.role !== 'admin' && user.role !== 'owner') {
      const userProducts = getUserProducts(user.id);
      const hasProduct = userProducts.find((up: any) => up.product_id === fileRecord.product_id);
      if (!hasProduct) {
        await logSystemAction({
          userId: user.id,
          userEmail: user.email,
          userName: user.name,
          action: 'محاولة تحميل غير مصرحة',
          details: `حاول المستخدم تحميل الملف (${fileRecord.original_name}) دون تفعيل منتجه.`,
          ip: req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '',
          userAgent: req.headers['user-agent'] || '',
          status: 'warning'
        });
        return res.status(403).json({ error: 'غير مصرح لك بتحميل هذا الملف. يجب تفعيل المنتج أولاً.' });
      }
    }

    // 3. Verify file exists on disk (check uploads dir, public dir, and root)
    let filePath = path.join(UPLOADS_DIR, fileRecord.filename.replace(/^\/+/, ''));
    if (!fs.existsSync(filePath)) {
      const publicPath = path.join(process.cwd(), 'public', fileRecord.filename.replace(/^\/+/, ''));
      if (fs.existsSync(publicPath)) {
        filePath = publicPath;
      } else {
        const rootPath = path.join(process.cwd(), fileRecord.filename.replace(/^\/+/, ''));
        if (fs.existsSync(rootPath)) {
          filePath = rootPath;
        } else {
          return res.status(404).json({ error: 'ملف النظام مفقود من الخادم. يرجى إبلاغ الدعم الفني.' });
        }
      }
    }

    // 4. Increment download count
    incrementDownloadCount(fileId);

    // 5. Log successful download
    const product = getProductById(fileRecord.product_id);
    await logSystemAction({
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      action: 'تحميل ملف منتج',
      details: `تم تحميل الملف (${fileRecord.original_name}) للمنتج (${product?.name || 'غير محدد'})`,
      ip: req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '',
      userAgent: req.headers['user-agent'] || '',
      productName: product?.name,
      status: 'info',
      sendToDiscord: true
    });

    // 6. Stream file to client
    res.setHeader('Content-Type', fileRecord.mime_type || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileRecord.original_name)}"`);
    
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (err) {
    console.error('File download error:', err);
    return res.status(500).json({ error: 'حدث خطأ داخلي أثناء معالجة تحميل الملف' });
  }
});

export default router;

