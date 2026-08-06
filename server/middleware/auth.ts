import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { findUserById } from '../db';

const JWT_SECRET = process.env.JWT_SECRET || 'ta3n-super-secret-jwt-key-change-in-prod-2026';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'ta3n-refresh-secret-key-change-in-prod-2026';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin' | 'owner';
  is_banned: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function generateAccessToken(user: { id: string; email: string; name: string; role: string }): string {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    JWT_SECRET,
    { expiresIn: '15m' } // Short-lived access token for security
  );
}

export function generateRefreshToken(user: { id: string }): string {
  return jwt.sign(
    { id: user.id },
    JWT_REFRESH_SECRET,
    { expiresIn: '30d' } // Long-lived refresh token
  );
}

export function verifyRefreshToken(token: string): { id: string } | null {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as { id: string };
  } catch {
    return null;
  }
}

// Middleware to verify JWT Access Token
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'غير مصرح: يرجى تسجيل الدخول أولاً' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    const dbUser = findUserById(decoded.id);
    
    if (!dbUser) {
      return res.status(401).json({ error: 'الحساب غير موجود في النظام' });
    }

    if (dbUser.is_banned === 1) {
      return res.status(403).json({ 
        error: 'تم حظر حسابك من النظام', 
        reason: dbUser.ban_reason || 'مخالفة شروط الاستخدام' 
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
    return res.status(401).json({ error: 'انتهت صلاحية الجلسة، يرجى تجديد الدخول' });
  }
}

// Middleware to require Admin or Owner privileges
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'owner')) {
    return res.status(403).json({ error: 'غير مصرح: هذه الميزة مخصصة للإدارة فقط' });
  }
  next();
}

// Middleware to require Owner privileges specifically
export function requireOwner(req: Request, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'owner') {
    return res.status(403).json({ error: 'غير مصرح: هذه الميزة مخصصة لمالك الموقع فقط' });
  }
  next();
}
