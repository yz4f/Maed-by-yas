import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { keyRedeemLimiter, sanitizeInput } from '../middleware/security';
import { redeemKey } from '../db';
import { logSystemAction } from '../services/logger';

const router = Router();

// ─── Redeem Product Key Endpoint ───
router.post('/redeem', requireAuth, keyRedeemLimiter, async (req: Request, res: Response) => {
  try {
    const keyValue = sanitizeInput(req.body?.key);
    if (!keyValue) {
      return res.status(400).json({ error: 'الرجاء إدخال مفتاح التفعيل' });
    }

    const user = req.user!;
    const ip = req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '';
    const userAgent = req.headers['user-agent'] || '';

    // Attempt redemption in database
    const result = redeemKey(keyValue, user.id, ip.toString(), userAgent);

    if (!result.success) {
      // Log failed attempt
      await logSystemAction({
        userId: user.id,
        userEmail: user.email,
        userName: user.name,
        action: 'محاولة تفعيل فاشلة',
        details: `فشل تفعيل المفتاح (${keyValue}) - السبب: ${result.error}`,
        ip: ip.toString(),
        userAgent: userAgent,
        keyValue: keyValue,
        status: 'warning'
      });

      return res.status(400).json({ error: result.error });
    }

    // Log successful redemption
    await logSystemAction({
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      action: 'تفعيل مفتاح منتج',
      details: `تم تفعيل المنتج (${result.productName}) بنجاح وربطه بحساب المستخدم.`,
      ip: ip.toString(),
      userAgent: userAgent,
      productName: result.productName,
      keyValue: keyValue,
      status: 'success'
    });

    return res.json({
      success: true,
      message: `تم تفعيل ${result.productName} بنجاح! يمكنك الآن تحميل الملفات من لوحة العميل.`,
      productName: result.productName,
      productId: result.productId
    });
  } catch (err) {
    console.error('Key redeem error:', err);
    return res.status(500).json({ error: 'حدث خطأ في النظام أثناء محاولة تفعيل المفتاح' });
  }
});

export default router;
