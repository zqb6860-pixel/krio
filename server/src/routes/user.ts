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
    const { dailyWordGoal, dailyTimeGoal, weeklyDaysGoal, batchSize, pronunciation, theme, fontSize, reminderTime, wordOrder } = req.body;

    const settings = await prisma.userSettings.upsert({
      where: { userId: req.userId! },
      update: {
        ...(dailyWordGoal !== undefined && { dailyWordGoal }),
        ...(dailyTimeGoal !== undefined && { dailyTimeGoal }),
        ...(weeklyDaysGoal !== undefined && { weeklyDaysGoal }),
        ...(batchSize !== undefined && { batchSize }),
        ...(pronunciation !== undefined && { pronunciation }),
        ...(theme !== undefined && { theme }),
        ...(fontSize !== undefined && { fontSize }),
        ...(reminderTime !== undefined && { reminderTime }),
        ...(wordOrder !== undefined && { wordOrder }),
      },
      create: {
        userId: req.userId!,
        dailyWordGoal: dailyWordGoal || 30,
        dailyTimeGoal: dailyTimeGoal || 30,
        batchSize: batchSize || 10,
        wordOrder: wordOrder || 'sequential',
      },
    });

    res.json(settings);
  } catch (error) {
    console.error('Settings error:', error);
    res.status(500).json({ error: '更新设置失败' });
  }
});

// PUT /api/user/current-book - Set current word book
userRouter.put('/current-book', async (req: AuthRequest, res: Response) => {
  try {
    const { bookId } = req.body;
    if (!bookId) return res.status(400).json({ error: '请选择一个词库' });

    // Verify book exists
    const book = await prisma.wordBook.findUnique({ where: { id: bookId } });
    if (!book) return res.status(404).json({ error: '词库不存在' });

    const settings = await prisma.userSettings.upsert({
      where: { userId: req.userId! },
      update: { currentBookId: bookId },
      create: { userId: req.userId!, currentBookId: bookId },
    });

    res.json({ currentBookId: settings.currentBookId, bookName: book.name });
  } catch (error) {
    console.error('Set book error:', error);
    res.status(500).json({ error: '设置词库失败' });
  }
});

// GET /api/user/current-book - Get current word book info
userRouter.get('/current-book', async (req: AuthRequest, res: Response) => {
  try {
    const settings = await prisma.userSettings.findUnique({ where: { userId: req.userId! } });
    if (!settings?.currentBookId) {
      return res.json({ currentBook: null });
    }
    const book = await prisma.wordBook.findUnique({ where: { id: settings.currentBookId } });
    res.json({ currentBook: book });
  } catch (error) {
    res.status(500).json({ error: '获取当前词库失败' });
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
