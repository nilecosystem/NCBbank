import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

import { authRouter } from './server/routes/authRoutes.ts';
import { marketRouter } from './server/routes/marketRoutes.ts';
import { investmentRouter } from './server/routes/investmentRoutes.ts';
import { treasuryRouter } from './server/routes/treasuryRoutes.ts';
import { transactionRouter } from './server/routes/transactionRoutes.ts';
import { cardRouter } from './server/routes/cardRoutes.ts';
import { userRouter } from './server/routes/userRoutes.ts';
import { adminRouter } from './server/routes/adminRoutes.ts';
import { db } from './server/storage.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// 🔥 اصلاح مهم برای Render
const PORT = process.env.PORT || 3000;

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    engine: 'Nile Institutional 4-Ledger Backend v3.4'
  });
});

// Real REST API Routes
app.use('/api/auth', authRouter);
app.use('/api/market', marketRouter);
app.use('/api/investments', investmentRouter);
app.use('/api/treasury', treasuryRouter);
app.use('/api/transactions', transactionRouter);
app.use('/api/cards', cardRouter);
app.use('/api/user', userRouter);
app.use('/api/admin', adminRouter);

// 🔥 حالت Production برای Render
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Nile Backend] Server active on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Nile Backend] Fatal initialization error:', err);
  process.exit(1);
});
