import { Router, Response } from 'express';
import { prisma } from '../index';
import { authMiddleware, AuthRequest } from '../middleware/auth';

export const userRouter = Router();

// All user routes require auth
userRouter.use(authMiddleware);

// GET /api/user/profile
userRouter.get('/profile', async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { settings: true },
    });
    if (!user) return res.status(404).json({ error: '用户不存在' });

    // Get stats
    const totalWords = await prisma.learningRecord.count({
      where: { userId: req.userId },
    });
    const masteredWords = await prisma.learningRecord.count({
      where: { userId: req.userId, status: 'mastered' },
    });

    res.json({
      id: user.id,
      email: user.email,
      username: user.username,
      avatar: user.avatar,
      level: user.level,
      experience: user.experience,
      coins: user.coins,
      hearts: user.hearts,
      streak: user.streak,
      settings: user.settings,
      stats: {
        totalWords,
        masteredWords,
      },
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: '获取用户信息失败' });
  }
});

// PATCH /api/user/settings
userRouter.patch('/settings', async (req: AuthRequest, res: Response) => {
  try {
    const { dailyWordGoal, dailyTimeGoal, weeklyDaysGoal, pronunciation, theme, fontSize, reminderTime } = req.body;

    const settings = await prisma.userSettings.upsert({
      where: { userId: req.userId! },
      update: {
        ...(dailyWordGoal !== undefined && { dailyWordGoal }),
        ...(dailyTimeGoal !== undefined && { dailyTimeGoal }),
        ...(weeklyDaysGoal !== undefined && { weeklyDaysGoal }),
        ...(pronunciation !== undefined && { pronunciation }),
        ...(theme !== undefined && { theme }),
        ...(fontSize !== undefined && { fontSize }),
        ...(reminderTime !== undefined && { reminderTime }),
      },
      create: {
        userId: req.userId!,
        dailyWordGoal: dailyWordGoal || 30,
        dailyTimeGoal: dailyTimeGoal || 30,
      },
    });

    res.json(settings);
  } catch (error) {
    console.error('Settings error:', error);
    res.status(500).json({ error: '更新设置失败' });
  }
});

// GET /api/user/stats/weekly
userRouter.get('/stats/weekly', async (req: AuthRequest, res: Response) => {
  try {
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString().split('T')[0];

    const checkins = await prisma.checkin.findMany({
      where: {
        userId: req.userId,
        date: { gte: weekAgoStr },
      },
      orderBy: { date: 'asc' },
    });

    res.json(checkins);
  } catch (error) {
    res.status(500).json({ error: '获取统计失败' });
  }
});
