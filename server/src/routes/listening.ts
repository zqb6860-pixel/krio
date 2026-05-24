/**
 * 听力练习路由
 * - 听音选词
 * - 听写句子
 * - 记录听力练习会话
 */

import { Router, Response } from 'express';
import { prisma } from '../index';
import { authMiddleware, AuthRequest } from '../middleware/auth';

export const listeningRouter = Router();
listeningRouter.use(authMiddleware);

// GET /api/listening/words?bookId=xxx&limit=10 - 获取听力练习单词
listeningRouter.get('/words', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const bookId = req.query.bookId as string;
    const limit = parseInt(req.query.limit as string) || 10;
    const mode = (req.query.mode as string) || 'word'; // word | sentence

    let words;

    if (bookId) {
      const entries = await prisma.wordBookWord.findMany({
        where: { wordBookId: bookId },
        include: {
          word: {
            include: {
              meanings: { take: 2 },
              examples: { take: 1 },
            },
          },
        },
        take: limit * 3,
      });
      // 随机选取
      const shuffled = entries.sort(() => Math.random() - 0.5);
      words = shuffled.slice(0, limit).map((e) => e.word);
    } else {
      // 从用户学过的单词中选取
      const records = await prisma.learningRecord.findMany({
        where: { userId },
        include: {
          word: {
            include: {
              meanings: { take: 2 },
              examples: { take: 1 },
            },
          },
        },
        take: limit * 3,
      });
      const shuffled = records.sort(() => Math.random() - 0.5);
      words = shuffled.slice(0, limit).map((r) => r.word);
    }

    if (words.length === 0) {
      return res.json({ words: [], exercises: [] });
    }

    if (mode === 'sentence') {
      // 听写句子模式: 返回含例句的单词
      const exercises = words
        .filter((w) => w.examples && w.examples.length > 0)
        .map((w) => ({
          id: w.id,
          word: w.word,
          phonetic: w.phonetic || w.phoneticUs,
          audioUrl: w.audioUs || w.audioUk,
          sentence: w.examples[0]?.sentence || '',
          sentenceTranslation: w.examples[0]?.translation || '',
          sentenceAudioUrl: w.examples[0]?.audioUrl || null,
          meanings: w.meanings.map((m) => ({
            partOfSpeech: m.partOfSpeech,
            translation: m.translation,
          })),
        }));

      return res.json({ mode: 'sentence', exercises });
    }

    // 听音选词模式: 生成四选一选项
    const exercises = words.map((w) => {
      // 随机选取3个干扰项
      const distractors = words
        .filter((other) => other.id !== w.id)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map((other) => other.meanings[0]?.translation || '未知含义');

      const correctAnswer = w.meanings[0]?.translation || '';
      const options = [correctAnswer, ...distractors].sort(() => Math.random() - 0.5);

      return {
        id: w.id,
        word: w.word,
        phonetic: w.phonetic || w.phoneticUs,
        audioUrl: w.audioUs || w.audioUk,
        correctAnswer,
        options,
        meanings: w.meanings.map((m) => ({
          partOfSpeech: m.partOfSpeech,
          translation: m.translation,
        })),
      };
    });

    res.json({ mode: 'word', exercises });
  } catch (error) {
    console.error('Listening words error:', error);
    res.status(500).json({ error: '获取听力练习数据失败' });
  }
});

// POST /api/listening/session - 记录听力练习会话
listeningRouter.post('/session', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { mode, totalItems, correctItems, duration } = req.body;

    if (!totalItems || !duration) {
      return res.status(400).json({ error: '缺少必要参数' });
    }

    const session = await prisma.listeningSession.create({
      data: {
        userId,
        mode: mode || 'word',
        totalItems: totalItems || 0,
        correctItems: correctItems || 0,
        duration: duration || 0,
        completedAt: new Date(),
      },
    });

    // 奖励
    const coinsReward = Math.floor(correctItems * 1.5);
    const expReward = Math.floor(correctItems * 3);

    await prisma.user.update({
      where: { id: userId },
      data: {
        coins: { increment: coinsReward },
        experience: { increment: expReward },
      },
    });

    res.json({
      session,
      rewards: { coins: coinsReward, experience: expReward },
    });
  } catch (error) {
    console.error('Listening session error:', error);
    res.status(500).json({ error: '记录听力会话失败' });
  }
});

// GET /api/listening/stats - 获取听力练习统计
listeningRouter.get('/stats', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    const sessions = await prisma.listeningSession.findMany({
      where: { userId },
      orderBy: { startedAt: 'desc' },
    });

    if (sessions.length === 0) {
      return res.json({
        totalSessions: 0,
        totalItems: 0,
        totalCorrect: 0,
        averageAccuracy: 0,
        totalTimeMinutes: 0,
        recentSessions: [],
      });
    }

    const totalItems = sessions.reduce((sum, s) => sum + s.totalItems, 0);
    const totalCorrect = sessions.reduce((sum, s) => sum + s.correctItems, 0);
    const totalTime = sessions.reduce((sum, s) => sum + s.duration, 0);
    const averageAccuracy = totalItems > 0 ? (totalCorrect / totalItems) * 100 : 0;

    res.json({
      totalSessions: sessions.length,
      totalItems,
      totalCorrect,
      averageAccuracy: Math.round(averageAccuracy * 10) / 10,
      totalTimeMinutes: Math.round(totalTime / 60),
      recentSessions: sessions.slice(0, 10).map((s) => ({
        id: s.id,
        mode: s.mode,
        totalItems: s.totalItems,
        correctItems: s.correctItems,
        accuracy: s.totalItems > 0 ? Math.round((s.correctItems / s.totalItems) * 100) : 0,
        duration: s.duration,
        startedAt: s.startedAt,
      })),
    });
  } catch (error) {
    console.error('Listening stats error:', error);
    res.status(500).json({ error: '获取听力统计失败' });
  }
});
