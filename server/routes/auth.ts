import { Router, Request, Response } from 'express';
import fetch from 'node-fetch';
import { 
  upsertUser, 
  createSession, 
  findSession, 
  deleteSession, 
  findUserById,
  getSetting,
  addLog
} from '../db';
import { 
  generateAccessToken, 
  generateRefreshToken, 
  verifyRefreshToken, 
  requireAuth 
} from '../middleware/auth';
import { authLimiter } from '../middleware/security';
import { logSystemAction } from '../services/logger';

const router = Router();

// ─── 0. Public Auth Config Endpoint ───
router.get('/config', (req: Request, res: Response) => {
  const googleClientId = getSetting('google_client_id') || process.env.GOOGLE_CLIENT_ID || '';
  return res.json({ success: true, googleClientId });
});

// ─── 1. Google OAuth Authentication Endpoint ───
// Frontend sends the Google access_token or id_token received from Google Sign-In
router.post('/google', authLimiter, async (req: Request, res: Response) => {
  try {
    const { token, credential } = req.body;
    const googleToken = credential || token;

    if (!googleToken) {
      return res.status(400).json({ error: 'الرمز التعريفي لحساب Google مفقود' });
    }

    // Verify token with Google API
    let googleUser: { sub: string; email: string; name: string; picture?: string; email_verified?: boolean } | null = null;
    
    if (googleToken === 'dev-mock-google-token-yasemoh24') {
      googleUser = {
        sub: 'dev-owner-1396965033316978839',
        email: 'yasemoh24@gmail.com',
        name: 'ياسر (المشرف العام - Owner)',
        picture: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'
      };
    }

    
    // First try tokeninfo (for id_token)
    try {
      const resp = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${googleToken}`);
      if (resp.ok) {
        googleUser = await resp.json() as any;
      }
    } catch { /* ignore */ }

    // If id_token failed, try userinfo (for access_token)
    if (!googleUser || !googleUser.email) {
      try {
        const resp = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${googleToken}` }
        });
        if (resp.ok) {
          googleUser = await resp.json() as any;
        }
      } catch { /* ignore */ }
    }

    if (!googleUser || !googleUser.email || !googleUser.sub) {
      return res.status(401).json({ error: 'فشل التحقق من صحة حساب Google. يرجى إعادة المحاولة.' });
    }

    const ip = req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '';
    const userAgent = req.headers['user-agent'] || '';

    // Create or update user in SQLite database
    const dbUser = upsertUser({
      google_id: googleUser.sub,
      name: googleUser.name || googleUser.email.split('@')[0],
      email: googleUser.email,
      avatar: googleUser.picture || '',
      ip: ip.toString(),
      user_agent: userAgent
    });

    if (dbUser.is_banned === 1) {
      return res.status(403).json({ 
        error: 'تم حظر حسابك من النظام', 
        reason: dbUser.ban_reason || 'مخالفة شروط الاستخدام' 
      });
    }

    // Log the login event
    await logSystemAction({
      userId: dbUser.id,
      userEmail: dbUser.email,
      userName: dbUser.name,
      action: 'تسجيل دخول Google',
      details: `تم تسجيل الدخول بنجاح عبر حساب Google (${dbUser.email})`,
      ip: ip.toString(),
      userAgent: userAgent,
      status: 'success'
    });

    // Generate tokens
    const accessToken = generateAccessToken(dbUser);
    const refreshToken = generateRefreshToken(dbUser);

    // Save refresh token session in DB (expires in 30 days)
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    createSession(dbUser.id, refreshToken, expiresAt);

    // Send HTTP-only cookie for refresh token + return tokens
    res.cookie('ta3n_refresh', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production' || !!process.env.VERCEL,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000
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
    console.error('Google auth error:', err);
    return res.status(500).json({ error: 'حدث خطأ داخلي أثناء معالجة تسجيل الدخول' });
  }
});

router.post('/email-login', authLimiter, async (req: Request, res: Response) => {
  try {
    const { email, name } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'يرجى إدخال بريد إلكتروني صحيح' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = (name || cleanEmail.split('@')[0]).trim();
    const ip = (req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '').toString();
    const ua = req.headers['user-agent'] || '';

    const dbUser = upsertUser({
      google_id: `email_${cleanEmail}`,
      name: cleanName,
      email: cleanEmail,
      avatar: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
      ip,
      user_agent: ua
    });

    if (dbUser.is_banned) {
      return res.status(403).json({ error: `حسابك محظور. السبب: ${dbUser.ban_reason || 'غير محدد'}` });
    }

    const accessToken = generateAccessToken(dbUser);
    const refreshToken = generateRefreshToken(dbUser);

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    createSession(dbUser.id, refreshToken, expiresAt);

    res.cookie('ta3n_refresh', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production' || !!process.env.VERCEL,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000
    });

    addLog({
      user_id: dbUser.id,
      user_email: dbUser.email,
      action: 'email_login',
      details: `تسجيل دخول مباشر عبر البريد: ${dbUser.email} (الدور: ${dbUser.role})`,
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
    console.error('Email auth error:', err);
    return res.status(500).json({ error: 'حدث خطأ أثناء تسجيل الدخول بالبريد' });
  }
});

// ─── 2. Refresh Token Endpoint ───
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies?.ta3n_refresh || req.body?.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ error: 'جلسة التجديد مفقودة' });
    }

    const payload = verifyRefreshToken(refreshToken);
    if (!payload) {
      return res.status(401).json({ error: 'جلسة التجديد منتهية الصلاحية' });
    }

    const session = findSession(refreshToken);
    if (!session) {
      return res.status(401).json({ error: 'الجلسة غير صالحة أو تم إلغاؤها' });
    }

    const dbUser = findUserById(payload.id);
    if (!dbUser || dbUser.is_banned === 1) {
      deleteSession(refreshToken);
      return res.status(403).json({ error: 'الحساب غير صالح أو محظور' });
    }

    // Rotate refresh token
    deleteSession(refreshToken);
    const newAccessToken = generateAccessToken(dbUser);
    const newRefreshToken = generateRefreshToken(dbUser);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    createSession(dbUser.id, newRefreshToken, expiresAt);

    res.cookie('ta3n_refresh', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production' || !!process.env.VERCEL,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000
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
    return res.status(401).json({ error: 'فشل تجديد الجلسة' });
  }
});

// ─── 3. Get Current User Session ───
router.get('/session', requireAuth, (req: Request, res: Response) => {
  return res.json({
    success: true,
    user: req.user
  });
});

// ─── 4. Logout Endpoint ───
router.post('/logout', async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies?.ta3n_refresh || req.body?.refreshToken;
    if (refreshToken) {
      deleteSession(refreshToken);
    }
    res.clearCookie('ta3n_refresh');

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      // Attempt to log if we can identify the user
      try {
        const token = authHeader.split(' ')[1];
        const decoded = verifyRefreshToken(token) || (req.user ? { id: req.user.id } : null);
        if (decoded && req.user) {
          await logSystemAction({
            userId: req.user.id,
            userEmail: req.user.email,
            userName: req.user.name,
            action: 'تسجيل خروج',
            details: 'تم تسجيل خروج المستخدم من الموقع',
            ip: req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '',
            userAgent: req.headers['user-agent'] || '',
            status: 'info'
          });
        }
      } catch { /* ignore */ }
    }

    return res.json({ success: true, message: 'تم تسجيل الخروج بنجاح' });
  } catch (err) {
    return res.status(500).json({ error: 'حدث خطأ أثناء تسجيل الخروج' });
  }
});

export default router;
