import { Router, Response } from 'express';
import { prisma } from '../index';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { calculateSM2, evaluateQuality, getWordStatus, type ReviewQuality } from '../utils/sm2';

export const learningRouter = Router();
learningRouter.use(authMiddleware);

// POST /api/learning/record - Record a word learning/review result
learningRouter.post('/record', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { wordId, correct, responseTimeMs } = req.body;

    if (!wordId || correct === undefined) {
      return res.status(400).json({ error: '缺少必要参数' });
    }

    const quality = evaluateQuality(correct, responseTimeMs || 3000);

    // Get existing record or create new one
    let record = await prisma.learningRecord.findUnique({
      where: { userId_wordId: { userId, wordId } },
    });

    if (!record) {
      // First time learning this word
      const sm2 = calculateSM2(quality, 2.5, 0, 0);
      record = await prisma.learningRecord.create({
        data: {
          userId,
          wordId,
          status: getWordStatus(sm2.masteryLevel),
          masteryLevel: sm2.masteryLevel,
          easeFactor: sm2.easeFactor,
          interval: sm2.interval,
          repetitions: sm2.repetitions,
          reviewCount: 1,
          correctCount: correct ? 1 : 0,
          incorrectCount: correct ? 0 : 1,
          lastReviewAt: new Date(),
          nextReviewAt: sm2.nextReviewAt,
        },
      });
    } else {
      // Update existing record
      const sm2 = calculateSM2(
        quality,
        record.easeFactor,
        record.interval,
        record.repetitions
      );

      record = await prisma.learningRecord.update({
        where: { id: record.id },
        data: {
          status: getWordStatus(sm2.masteryLevel),
          masteryLevel: sm2.masteryLevel,
          easeFactor: sm2.easeFactor,
          interval: sm2.interval,
          repetitions: sm2.repetitions,
          reviewCount: record.reviewCount + 1,
          correctCount: record.correctCount + (correct ? 1 : 0),
          incorrectCount: record.incorrectCount + (correct ? 0 : 1),
          lastReviewAt: new Date(),
          nextReviewAt: sm2.nextReviewAt,
        },
      });
    }

    // Award coins for correct answer
    if (correct) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          coins: { increment: 2 },
          experience: { increment: 5 },
        },
      });
    }

    res.json(record);
  } catch (error) {
    console.error('Record error:', error);
    res.status(500).json({ error: '记录学习结果失败' });
  }
});

// GET /api/learning/review - Get words due for review
learningRouter.get('/review', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const limit = parseInt(req.query.limit as string) || 20;

    const records = await prisma.learningRecord.findMany({
      where: {
        userId,
        nextReviewAt: { lte: new Date() },
        status: { in: ['learning', 'reviewing'] },
      },
      include: {
        word: {
          include: {
            meanings: true,
            roots: true,
            collocations: true,
            examples: { take: 1 },
          },
        },
      },
      orderBy: { nextReviewAt: 'asc' },
      take: limit,
    });

    res.json({
      words: records.map((r) => ({
        ...r.word,
        record: {
          id: r.id,
          masteryLevel: r.masteryLevel,
          reviewCount: r.reviewCount,
          status: r.status,
        },
      })),
      totalPending: await prisma.learningRecord.count({
        where: {
          userId,
          nextReviewAt: { lte: new Date() },
          status: { in: ['learning', 'reviewing'] },
        },
      }),
    });
  } catch (error) {
    res.status(500).json({ error: '获取复习列表失败' });
  }
});

// GET /api/learning/stats - Get user learning statistics
learningRouter.get('/stats', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    const [total, mastered, reviewing, learning, newWords] = await Promise.all([
      prisma.learningRecord.count({ where: { userId } }),
      prisma.learningRecord.count({ where: { userId, status: 'mastered' } }),
      prisma.learningRecord.count({ where: { userId, status: 'reviewing' } }),
      prisma.learningRecord.count({ where: { userId, status: 'learning' } }),
      prisma.learningRecord.count({ where: { userId, status: 'new' } }),
    ]);

    const pendingReview = await prisma.learningRecord.count({
      where: {
        userId,
        nextReviewAt: { lte: new Date() },
        status: { in: ['learning', 'reviewing'] },
      },
    });

    // Today's progress
    const todayStr = new Date().toISOString().split('T')[0];
    const todayCheckin = await prisma.checkin.findUnique({
      where: { userId_date: { userId, date: todayStr } },
    });

    res.json({
      total,
      mastered,
      reviewing,
      learning,
      new: newWords,
      pendingReview,
      todayStats: todayCheckin || {
        wordsLearned: 0,
        wordsReviewed: 0,
        timeSpent: 0,
        correctRate: 0,
      },
    });
  } catch (error) {
    res.status(500).json({ error: '获取统计失败' });
  }
});

// GET /api/learning/distribution - Mastery level distribution
learningRouter.get('/distribution', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    const records = await prisma.learningRecord.findMany({
      where: { userId },
      select: { masteryLevel: true },
    });

    const distribution = {
      mastered: records.filter((r) => r.masteryLevel >= 90).length,
      familiar: records.filter((r) => r.masteryLevel >= 60 && r.masteryLevel < 90).length,
      vague: records.filter((r) => r.masteryLevel >= 30 && r.masteryLevel < 60).length,
      unknown: records.filter((r) => r.masteryLevel < 30).length,
    };

    res.json(distribution);
  } catch (error) {
    res.status(500).json({ error: '获取分布数据失败' });
  }
});
