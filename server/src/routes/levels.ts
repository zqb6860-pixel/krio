import { Router, Response } from 'express';
import { prisma } from '../index';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { generateExercises } from '../services/exerciseGenerator';

export const levelRouter = Router();
levelRouter.use(authMiddleware);

// GET /api/levels/paths - Get all learning paths with progress
levelRouter.get('/paths', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    const paths = await prisma.learningPath.findMany({
      include: {
        units: {
          include: {
            levels: {
              include: {
                results: {
                  where: { userId },
                  orderBy: { completedAt: 'desc' },
                  take: 1,
                },
              },
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { order: 'asc' },
    });

    // Transform data - add unlock status and best stars
    const result = paths.map((path) => ({
      ...path,
      units: path.units.map((unit) => ({
        ...unit,
        levels: unit.levels.map((level, idx) => {
          const bestResult = level.results[0];
          const previousLevel = idx > 0 ? unit.levels[idx - 1] : null;
          const previousCompleted = !previousLevel || (previousLevel.results.length > 0 && previousLevel.results[0].stars > 0);

          return {
            id: level.id,
            title: level.title,
            description: level.description,
            order: level.order,
            stars: bestResult?.stars || 0,
            bestScore: bestResult?.score || 0,
            isLocked: !previousCompleted,
          };
        }),
      })),
    }));

    res.json(result);
  } catch (error) {
    console.error('Paths error:', error);
    res.status(500).json({ error: '获取学习路径失败' });
  }
});

// GET /api/levels/:id - Get level exercises
levelRouter.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const level = await prisma.level.findUnique({
      where: { id: req.params.id },
      include: {
        exercises: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!level) return res.status(404).json({ error: '关卡不存在' });

    // If level has no pre-made exercises, auto-generate from word database
    if (!level.exercises || level.exercises.length === 0) {
      const generated = await generateExercises(5);
      if (generated.length > 0) {
        return res.json({
          ...level,
          exercises: generated.map((ex, i) => ({
            id: `gen_${i}`,
            levelId: level.id,
            wordId: ex.wordId,
            type: ex.type,
            question: ex.question,
            options: ex.options,
            correctAnswer: ex.correctAnswer,
            explanation: null,
            audioUrl: null,
            imageUrl: null,
            order: i,
          })),
        });
      }
    }

    res.json(level);
  } catch (error) {
    res.status(500).json({ error: '获取关卡详情失败' });
  }
});

// POST /api/levels/:id/complete - Submit level completion
levelRouter.post('/:id/complete', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const levelId = req.params.id;
    const { stars, score, maxCombo } = req.body;

    if (stars === undefined || score === undefined) {
      return res.status(400).json({ error: '缺少必要参数' });
    }

    // Save result
    const result = await prisma.levelResult.create({
      data: {
        userId,
        levelId,
        stars: Math.min(3, Math.max(0, stars)),
        score,
        maxCombo: maxCombo || 0,
      },
    });

    // Award coins based on stars
    const coinsReward = stars * 10;
    const expReward = stars * 15 + score;

    await prisma.user.update({
      where: { id: userId },
      data: {
        coins: { increment: coinsReward },
        experience: { increment: expReward },
      },
    });

    res.json({
      result,
      rewards: { coins: coinsReward, experience: expReward },
    });
  } catch (error) {
    console.error('Complete level error:', error);
    res.status(500).json({ error: '提交关卡结果失败' });
  }
});
