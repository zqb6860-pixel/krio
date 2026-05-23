import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { authRouter } from './routes/auth';
import { wordRouter } from './routes/words';
import { learningRouter } from './routes/learning';
import { levelRouter } from './routes/levels';
import { achievementRouter } from './routes/achievements';
import { userRouter } from './routes/user';
import { checkinRouter } from './routes/checkin';
import { importRouter } from './routes/import';

export const prisma = new PrismaClient();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/api/health', (_, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
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
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Server error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 LightWords API running at http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
