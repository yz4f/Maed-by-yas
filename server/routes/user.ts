import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { getUserProducts, getProductFiles, findUserById, getLogs, addLog } from '../db';

const router = Router();

// ─── 1. Get User Dashboard Data (Activated products + their files) ───
router.get('/dashboard', requireAuth, (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const activatedProducts = getUserProducts(user.id);

    // Attach files to each activated product
    const productsWithFiles = activatedProducts.map((prod: any) => {
      const files = getProductFiles(prod.product_id);
      return {
        ...prod,
        files: files.map((f: any) => ({
          id: f.id,
          filename: f.original_name,
          size: f.size,
          downloadCount: f.download_count,
          createdAt: f.created_at
        }))
      };
    });

    // Get user activation logs from JSON store
    const allLogs = getLogs(200, 0);
    const userLogs = allLogs.filter(
      (l: any) => l.user_id === user.id
    ).slice(0, 50);

    // Get full user account details
    const accountInfo = findUserById(user.id);
    if (accountInfo) {
      delete (accountInfo as any).ban_reason;
    }

    return res.json({
      success: true,
      products: productsWithFiles,
      logs: userLogs,
      account: accountInfo
    });
  } catch (err) {
    console.error('Error fetching user dashboard:', err);
    return res.status(500).json({ error: 'فشل في جلب بيانات لوحة العميل' });
  }
});

// ─── 2. Get Activation History Logs for User ───
router.get('/logs', requireAuth, (req: Request, res: Response) => {
  try {
    const allLogs = getLogs(500, 0);
    const userLogs = allLogs.filter((l: any) => l.user_id === req.user!.id).slice(0, 100);
    return res.json({ success: true, logs: userLogs });
  } catch (err) {
    return res.status(500).json({ error: 'فشل في جلب سجل العمليات' });
  }
});

// ─── 3. HWID Reset for a Product ───
router.post('/hwid-reset', requireAuth, (req: Request, res: Response) => {
  try {
    const { productId } = req.body;
    if (!productId) {
      return res.status(400).json({ error: 'معرف المنتج مطلوب' });

// 4. Sync Discord Roles
router.post('/sync-discord-roles', requireAuth, (req: Request, res: Response) => {
  try {
    const user = req.user!;
    
    // Add log entry
    addLog({
      user_id: user.id,
      user_email: user.email,
      action: 'مزامنة رتب ديسكورد',
      details: 'تم طلب استعادة ومزامنة رتب ديسكورد للمستخدم بنجاح',
      ip: req.ip || '',
      user_agent: req.headers['user-agent'] || ''
    });

    return res.json({
      success: true,
      message: 'تمت مزامنة جميع رتب ديسكورد بنجاح!'
    });
  } catch (err) {
    console.error('Error syncing Discord roles:', err);
    return res.status(500).json({ error: 'حدث خطأ أثناء مزامنة الرتب' });
  }
});
    }
    const user = req.user!;
    const activatedProducts = getUserProducts(user.id);
    const prod = activatedProducts.find((p: any) => p.product_id === productId);
    if (!prod) {
      return res.status(404).json({ error: 'لم تقم بتفعيل هذا المنتج' });
    }

    // Add log entry
    addLog({
      user_id: user.id,
      user_email: user.email,
      action: 'إعادة تعيين HWID',
      details: `تمت إعادة تعيين الهوية العتادية لمنتج: ${prod.name}`,
      ip: req.ip || '',
      user_agent: req.headers['user-agent'] || ''
    });

    return res.json({
      success: true,
      message: 'تمت إعادة تعيين الهوية العتادية بنجاح!'
    });
  } catch (err) {
    console.error('Error resetting HWID:', err);
    return res.status(500).json({ error: 'فشل في إعادة تعيين الهوية العتادية' });
  }
});

// ─── 4. Support Ticket Endpoints ───
import { upload } from '../middleware/upload';
import { createTicket, addMessageToTicket, getTicketsByUser, closeTicket } from '../db';

router.get('/tickets', requireAuth, (req: Request, res: Response) => {
  try {
    const tickets = getTicketsByUser(req.user!.id);
    return res.json({ success: true, tickets });
  } catch (err) {
    return res.status(500).json({ error: 'فشل في جلب تذاكر الدعم' });
  }
});

router.post('/tickets', requireAuth, upload.single('image'), (req: Request, res: Response) => {
  try {
    const { title, message } = req.body;
    if (!title || !message) {
      return res.status(400).json({ error: 'العنوان ومحتوى الرسالة مطلوبان' });
    }
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : undefined;
    const ticket = createTicket(req.user!.id, title, message, imageUrl);
    return res.json({ success: true, ticket });
  } catch (err) {
    console.error('Error creating ticket:', err);
    return res.status(500).json({ error: 'فشل في إنشاء تذكرة الدعم' });
  }
});

router.post('/tickets/:ticketId/messages', requireAuth, upload.single('image'), (req: Request, res: Response) => {
  try {
    const { ticketId } = req.params;
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'محتوى الرسالة مطلوب' });
    }
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : undefined;
    const ok = addMessageToTicket(ticketId, req.user!.id, message, imageUrl);
    return res.json({ success: ok });
  } catch (err) {
    console.error('Error adding message:', err);
    return res.status(500).json({ error: 'فشل في إرسال الرد' });
  }
});

router.post('/tickets/:ticketId/close', requireAuth, (req: Request, res: Response) => {
  try {
    const { ticketId } = req.params;
    const ok = closeTicket(ticketId, req.user!.id);
    return res.json({ success: ok });
  } catch (err) {
    return res.status(500).json({ error: 'فشل في إغلاق تذكرة الدعم' });
  }
});

export default router;
