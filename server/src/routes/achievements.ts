import { Router, Response } from 'express';
import { prisma } from '../index';
import { authMiddleware, AuthRequest } from '../middleware/auth';

export const achievementRouter = Router();
achievementRouter.use(authMiddleware);

// GET /api/achievements - Get all achievements with user progress
achievementRouter.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    const achievements = await prisma.achievement.findMany({
      include: {
        users: {
          where: { userId },
        },
      },
    });

    const result = achievements.map((a) => ({
      id: a.id,
      name: a.name,
      description: a.description,
      icon: a.icon,
      category: a.category,
      requirement: a.requirement,
      rewardCoins: a.rewardCoins,
      rewardExp: a.rewardExp,
      progress: a.users[0]?.progress || 0,
      isUnlocked: a.users[0]?.isUnlocked || false,
      unlockedAt: a.users[0]?.unlockedAt || null,
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: '获取成就列表失败' });
  }
});

// POST /api/achievements/check - Check and unlock achievements
achievementRouter.post('/check', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    // Get user stats for achievement checking
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: '用户不存在' });

    const totalWords = await prisma.learningRecord.count({ where: { userId } });
    const masteredWords = await prisma.learningRecord.count({
      where: { userId, status: 'mastered' },
    });

    const achievementChecks: Record<string, number> = {
      learning: totalWords, // total words learned
      persistence: user.streak, // streak days
      vocabulary: masteredWords, // mastered words
    };

    // Check each achievement
    const userAchievements = await prisma.userAchievement.findMany({
      where: { userId, isUnlocked: false },
      include: { achievement: true },
    });

    const newlyUnlocked: string[] = [];

    for (const ua of userAchievements) {
      const currentProgress = achievementChecks[ua.achievement.category] || 0;

      if (currentProgress >= ua.achievement.requirement && !ua.isUnlocked) {
        // Unlock!
        await prisma.userAchievement.update({
          where: { id: ua.id },
          data: {
            isUnlocked: true,
            progress: currentProgress,
            unlockedAt: new Date(),
          },
        });

        // Grant rewards
        if (ua.achievement.rewardCoins > 0 || ua.achievement.rewardExp > 0) {
          await prisma.user.update({
            where: { id: userId },
            data: {
              coins: { increment: ua.achievement.rewardCoins },
              experience: { increment: ua.achievement.rewardExp },
            },
          });
        }

        newlyUnlocked.push(ua.achievement.name);
      } else {
        // Update progress
        await prisma.userAchievement.update({
          where: { id: ua.id },
          data: { progress: currentProgress },
        });
      }
    }

    res.json({ newlyUnlocked });
  } catch (error) {
    console.error('Achievement check error:', error);
    res.status(500).json({ error: '检查成就失败' });
  }
});
