import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import prisma from './config/prisma';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

import authRoutes from './routes/authRoutes';
import categoryRoutes from './routes/categoryRoutes';
import productRoutes from './routes/productRoutes';
import comboRoutes from './routes/comboRoutes';
import couponRoutes from './routes/couponRoutes';
import offerRoutes from './routes/offerRoutes';
import orderRoutes from './routes/orderRoutes';
import inventoryRoutes from './routes/inventoryRoutes';
import galleryRoutes from './routes/galleryRoutes';
import reviewRoutes from './routes/reviewRoutes';
import customerRoutes from './routes/customerRoutes';
import restaurantRoutes from './routes/restaurantRoutes';
import reportRoutes from './routes/reportRoutes';
import uploadRoutes from './routes/uploadRoutes';
import paymentRoutes from './routes/paymentRoutes';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.frontendUrl,
      credentials: true,
    })
  );
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(morgan(env.nodeEnv === 'development' ? 'dev' : 'combined'));
  app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api', apiLimiter);

  app.get('/health', async (req, res) => {
    const payload: Record<string, unknown> = { success: true, message: 'OK', timestamp: new Date().toISOString() };
    if (env.nodeEnv !== 'production') {
      try {
        const userCount = await prisma.user.count();
        payload.diagnostics = {
          databaseConnected: true,
          userCount,
          hint: userCount === 0 ? 'No users found — run `npm run prisma:seed` against this DATABASE_URL.' : undefined,
        };
      } catch (err) {
        payload.diagnostics = { databaseConnected: false, error: (err as Error).message };
      }
    }
    res.json(payload);
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/categories', categoryRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/combos', comboRoutes);
  app.use('/api/coupons', couponRoutes);
  app.use('/api/offers', offerRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/inventory', inventoryRoutes);
  app.use('/api/gallery', galleryRoutes);
  app.use('/api/reviews', reviewRoutes);
  app.use('/api/customers', customerRoutes);
  app.use('/api/restaurant', restaurantRoutes);
  app.use('/api/reports', reportRoutes);
  app.use('/api/uploads', uploadRoutes);
  app.use('/api/payments', paymentRoutes);

  // ---------------------------------------------------------------
  // Optional combined-deployment mode: when SERVE_FRONTEND=true, this
  // Express server also serves the built frontend (frontend/dist), so the
  // whole platform runs as a single service on a single URL. Off by default
  // so the standard split deployment (separate static host + API host)
  // keeps working unchanged.
  // ---------------------------------------------------------------
  if (env.serveFrontend) {
    const staticDir = path.resolve(__dirname, env.frontendDistPath);
    app.use(express.static(staticDir));
    app.get(/^(?!\/api).*/, (req, res) => {
      res.sendFile(path.join(staticDir, 'index.html'));
    });
  }

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
