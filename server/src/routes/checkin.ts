import { Router, Response } from 'express';
import { prisma } from '../index';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

export const checkinRouter = Router();
checkinRouter.use(authMiddleware);

// POST /api/checkin - Daily check-in
checkinRouter.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { wordsLearned, wordsReviewed, timeSpent, correctRate } = req.body;
    const todayStr = new Date().toISOString().split('T')[0];

    // Upsert today's checkin
    const checkin = await prisma.checkin.upsert({
      where: { userId_date: { userId, date: todayStr } },
      update: {
        wordsLearned: wordsLearned || 0,
        wordsReviewed: wordsReviewed || 0,
        timeSpent: timeSpent || 0,
        correctRate: correctRate || 0,
      },
      create: {
        userId,
        date: todayStr,
        wordsLearned: wordsLearned || 0,
        wordsReviewed: wordsReviewed || 0,
        timeSpent: timeSpent || 0,
        correctRate: correctRate || 0,
        coinsEarned: 10,
        expEarned: 20,
      },
    });

    // Update streak
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (user) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      let newStreak = user.streak;
      if (user.lastStudyDate === yesterdayStr) {
        newStreak = user.streak + 1;
      } else if (user.lastStudyDate !== todayStr) {
        newStreak = 1;
      }

      await prisma.user.update({
        where: { id: userId },
        data: {
          streak: newStreak,
          lastStudyDate: todayStr,
          coins: { increment: 10 },
          experience: { increment: 20 },
        },
      });
    }

    res.json(checkin);
  } catch (error) {
    logger.error({ err: error }, 'Checkin error');
    res.status(500).json({ error: '打卡失败' });
  }
});

// GET /api/checkin/history - Get checkin history
checkinRouter.get('/history', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const days = parseInt(req.query.days as string) || 30;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startStr = startDate.toISOString().split('T')[0];

    const checkins = await prisma.checkin.findMany({
      where: {
        userId,
        date: { gte: startStr },
      },
      orderBy: { date: 'desc' },
    });

    res.json(checkins);
  } catch (error) {
    res.status(500).json({ error: '获取打卡记录失败' });
  }
});
