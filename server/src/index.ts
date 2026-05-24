import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { PrismaClient } from '@prisma/client';
import { logger } from './utils/logger';
import { validateEnv } from './utils/env';
import { globalLimiter } from './middleware/rateLimit';
import { authRouter } from './routes/auth';
import { wordRouter } from './routes/words';
import { learningRouter } from './routes/learning';
import { levelRouter } from './routes/levels';
import { achievementRouter } from './routes/achievements';
import { userRouter } from './routes/user';
import { checkinRouter } from './routes/checkin';
import { importRouter } from './routes/import';

export const prisma = new PrismaClient();
validateEnv();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use('/api', globalLimiter);

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    logger.info({
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: Date.now() - start,
      ip: req.ip,
    });
  });
  next();
});

// Health check
app.get('/api/health', async (_, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'ok',
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: 'connected',
    });
  } catch {
    res.status(503).json({
      status: 'unhealthy',
      database: 'disconnected',
    });
  }
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);
app.use('/api/words', wordRouter);
app.use('/api/learning', learningRouter);
app.use('/api/levels', levelRouter);
app.use('/api/achievements', achievementRouter);
app.use('/api/checkin', checkinRouter);
app.use('/api/import', importRouter);

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error({ err, req: { method: req.method, url: req.url } }, 'Unhandled error');
  const message = process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message;
  res.status(500).json({ error: message });
});

app.listen(PORT, () => {
  logger.info(`LightWords API running at http://localhost:${PORT}`);
});

// Graceful shutdown
const shutdown = async (signal: string) => {
  logger.info(`${signal} received, shutting down gracefully`);
  await prisma.$disconnect();
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
