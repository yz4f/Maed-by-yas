import express from 'express';
import path from 'path';
import fs from 'fs';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

// Import Security Middleware
import { helmetMiddleware, corsMiddleware, generalLimiter, csrfProtection } from './server/middleware/security';

// Import Modular API Routes
import authRoutes from './server/routes/auth';
import productsRoutes from './server/routes/products';
import keysRoutes from './server/routes/keys';
import filesRoutes from './server/routes/files';
import userRoutes from './server/routes/user';
import adminRoutes from './server/routes/admin';

// Ensure database initialization runs on server startup
import { UPLOADS_DIR, ensureDbLoaded } from './server/db';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Await database loading from Firestore on all incoming requests to prevent race conditions
app.use(async (req, res, next) => {
  await ensureDbLoaded();
  next();
});

// ─── 1. Core Parsers & Security Middlewares ───
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(helmetMiddleware);
app.use(corsMiddleware);
app.use(generalLimiter);
app.use(csrfProtection);

// ─── 2. Serve uploaded images publicly (NOT downloadable software files) ───
// Software files are downloaded securely only via /api/files/download/:id
app.use('/uploads', express.static(UPLOADS_DIR));

// ─── 3. Mount API Routes ───
app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/keys', keysRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);

// ─── 4. Health Check Endpoint ───
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── 5. Vite Development Server vs Production Static Serving ───
async function setupServer() {
  const isDev = process.argv.includes('--dev') || process.env.NODE_ENV === 'development';
  if (isDev) {
    console.log('⚡ Starting in Development Mode with Vite Middleware...');
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    console.log('🚀 Starting in Production Mode...');
    const distPath = path.join(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        // Don't intercept missing API routes
        if (req.path.startsWith('/api/')) {
          return res.status(404).json({ error: 'API route not found' });
        }
        res.sendFile(path.join(distPath, 'index.html'));
      });
    } else {
      console.warn('⚠️ Dist folder not found. Run npm run build first.');
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n══════════════════════════════════════════════════════════`);
    console.log(`✨ تعن | منصة تسليم المنتجات الرقمية الرسمية`);
    console.log(`🌐 الخادم يعمل بنجاح على الرابط: http://localhost:${PORT}`);
    console.log(`👑 بريد المسؤول الأساسي (Owner): yasemoh24@gmail.com`);
    console.log(`══════════════════════════════════════════════════════════\n`);
  });
}

if (!process.env.VERCEL) {
  setupServer().catch(err => {
    console.error('Fatal error starting server:', err);
    process.exit(1);
  });
}

export default app;

