import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

// ─── 1. Helmet Security Headers ───
export const helmetMiddleware = helmet({
  contentSecurityPolicy: false, // Disabled for React / Vite dev compatibility, or can be tailored
  crossOriginEmbedderPolicy: false,
});

// ─── 2. CORS Configuration ───
export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (same-origin, mobile apps, curl)
    if (!origin) return callback(null, true);

    // Always allow in non-production
    if (process.env.NODE_ENV !== 'production') return callback(null, true);

    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173',
      process.env.APP_URL || '',
    ].filter(Boolean);

    // Allow exact matches, any .vercel.app subdomain, or custom domain
    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      origin.endsWith('.vercel.app/')
    ) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all origins for now to prevent blocking on Vercel
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token'],
});

// ─── 3. Rate Limiters ───
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 300 : 3000, // higher limit in dev
  message: { error: 'تم تجاوز الحد المسموح من الطلبات، يرجى المحاولة لاحقاً.' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // limit each IP to 30 login/auth requests per windowMs
  message: { error: 'طلبات دخول متكررة كثيرة جداً. الرجاء الانتظار 15 دقيقة.' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const keyRedeemLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10, // limit each IP to 10 key redeem attempts per 10 minutes to prevent brute force
  message: { error: 'تم تجاوز حد محاولات تفعيل المفاتيح المسموح به. تم تجميد التفعيل مؤقتاً لحماية المخزون.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── 4. Basic CSRF & Origin Verification for Mutating Requests ───
export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    const origin = req.headers.origin || req.headers.referer;
    const host = req.headers.host;
    
    // In production on non-Vercel, verify that origin matches host
    // On Vercel, origin/host mismatch is expected (serverless functions)
    if (process.env.NODE_ENV === 'production' && !process.env.VERCEL && origin && host) {
      try {
        const originHost = new URL(origin).host;
        if (originHost !== host) {
          return res.status(403).json({ error: 'حظر أمني: مصدر الطلب غير متطابق (CSRF Protection)' });
        }
      } catch (e) {
        return res.status(403).json({ error: 'حظر أمني: رابط المصدر غير صالح' });
      }
    }
  }
  next();
}

// ─── 5. Request Sanitizer Helper ───
export function sanitizeInput(str?: string): string {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
}
