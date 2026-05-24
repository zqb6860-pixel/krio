/**
 * 打字练习路由 (参考 Qwerty Learner)
 * - 记录打字练习会话
 * - 获取打字统计数据
 * - 章节制打字进度
 */

import { Router, Response } from 'express';
import { prisma } from '../index';
import { authMiddleware, AuthRequest } from '../middleware/auth';

export const typingRouter = Router();
typingRouter.use(authMiddleware);

// POST /api/typing/session - 记录打字练习会话
typingRouter.post('/session', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const {
      bookId,
      mode = 'normal',
      wordsTyped,
      correctWords,
      totalChars,
      correctChars,
      wpm,
      accuracy,
      maxCombo,
      duration,
      chapterIndex,
    } = req.body;

    if (!wordsTyped || !duration) {
      res.status(400).json({ error: '缺少必要参数' });
      return;
    }

    const session = await prisma.typingSession.create({
      data: {
        userId,
        bookId,
        mode,
        wordsTyped: wordsTyped || 0,
        correctWords: correctWords || 0,
        totalChars: totalChars || 0,
        correctChars: correctChars || 0,
        wpm: wpm || 0,
        accuracy: accuracy || 0,
        maxCombo: maxCombo || 0,
        duration: duration || 0,
        chapterIndex: chapterIndex || 0,
        completedAt: new Date(),
      },
    });

    // 奖励金币和经验
    const coinsReward = Math.floor(correctWords * 0.5) + (maxCombo >= 10 ? 5 : 0);
    const expReward = Math.floor(correctWords * 2) + Math.floor(wpm * 0.5);

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
    console.error('Typing session error:', error);
    res.status(500).json({ error: '记录打字会话失败' });
  }
});

// GET /api/typing/stats - 获取打字练习统计
typingRouter.get('/stats', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    const sessions = await prisma.typingSession.findMany({
      where: { userId },
      orderBy: { startedAt: 'desc' },
    });

    if (sessions.length === 0) {
      return res.json({
        totalSessions: 0,
        totalWordsTyped: 0,
        totalTimeMinutes: 0,
        averageWpm: 0,
        averageAccuracy: 0,
        bestWpm: 0,
        bestAccuracy: 0,
        maxCombo: 0,
        currentChapter: 0,
        recentSessions: [],
        dailyStats: [],
      });
    }

    const totalWordsTyped = sessions.reduce((sum, s) => sum + s.wordsTyped, 0);
    const totalTime = sessions.reduce((sum, s) => sum + s.duration, 0);
    const averageWpm = sessions.reduce((sum, s) => sum + s.wpm, 0) / sessions.length;
    const averageAccuracy = sessions.reduce((sum, s) => sum + s.accuracy, 0) / sessions.length;
    const bestWpm = Math.max(...sessions.map((s) => s.wpm));
    const bestAccuracy = Math.max(...sessions.map((s) => s.accuracy));
    const maxCombo = Math.max(...sessions.map((s) => s.maxCombo));
    const currentChapter = Math.max(...sessions.map((s) => s.chapterIndex));

    // 最近7天的每日统计
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentSessions = sessions.filter(
      (s) => s.startedAt >= sevenDaysAgo
    );

    // 按天分组统计
    const dailyMap = new Map<string, { wpm: number[]; words: number; time: number; sessions: number }>();
    for (const s of recentSessions) {
      const day = s.startedAt.toISOString().split('T')[0];
      const existing = dailyMap.get(day) || { wpm: [], words: 0, time: 0, sessions: 0 };
      existing.wpm.push(s.wpm);
      existing.words += s.wordsTyped;
      existing.time += s.duration;
      existing.sessions += 1;
      dailyMap.set(day, existing);
    }

    const dailyStats = Array.from(dailyMap.entries()).map(([date, data]) => ({
      date,
      averageWpm: Math.round(data.wpm.reduce((a, b) => a + b, 0) / data.wpm.length),
      wordsTyped: data.words,
      timeMinutes: Math.round(data.time / 60),
      sessions: data.sessions,
    }));

    res.json({
      totalSessions: sessions.length,
      totalWordsTyped,
      totalTimeMinutes: Math.round(totalTime / 60),
      averageWpm: Math.round(averageWpm * 10) / 10,
      averageAccuracy: Math.round(averageAccuracy * 10) / 10,
      bestWpm: Math.round(bestWpm * 10) / 10,
      bestAccuracy: Math.round(bestAccuracy * 10) / 10,
      maxCombo,
      currentChapter,
      recentSessions: sessions.slice(0, 10).map((s) => ({
        id: s.id,
        mode: s.mode,
        wordsTyped: s.wordsTyped,
        wpm: s.wpm,
        accuracy: s.accuracy,
        maxCombo: s.maxCombo,
        duration: s.duration,
        startedAt: s.startedAt,
      })),
      dailyStats,
    });
  } catch (error) {
    console.error('Typing stats error:', error);
    res.status(500).json({ error: '获取打字统计失败' });
  }
});

// GET /api/typing/chapter-words?bookId=xxx&chapter=0&size=20
// 获取章节单词列表 (qwerty-learner 章节制)
typingRouter.get('/chapter-words', async (req: AuthRequest, res: Response) => {
  try {
    const bookId = req.query.bookId as string;
    const chapter = parseInt(req.query.chapter as string) || 0;
    const size = parseInt(req.query.size as string) || 20;

    if (!bookId) {
      res.status(400).json({ error: '请指定词库' });
      return;
    }

    const skip = chapter * size;

    const entries = await prisma.wordBookWord.findMany({
      where: { wordBookId: bookId },
      include: {
        word: {
          include: {
            meanings: { take: 1 },
          },
        },
      },
      orderBy: { order: 'asc' },
      skip,
      take: size,
    });

    const totalWords = await prisma.wordBookWord.count({
      where: { wordBookId: bookId },
    });

    const totalChapters = Math.ceil(totalWords / size);

    res.json({
      chapter,
      totalChapters,
      totalWords,
      chapterSize: size,
      words: entries.map((e) => ({
        id: e.word.id,
        word: e.word.word,
        phonetic: e.word.phonetic || e.word.phoneticUs,
        translation: e.word.meanings[0]?.translation || '',
        partOfSpeech: e.word.meanings[0]?.partOfSpeech || '',
      })),
    });
  } catch (error) {
    console.error('Chapter words error:', error);
    res.status(500).json({ error: '获取章节单词失败' });
  }
});

// GET /api/typing/leaderboard - 打字速度排行榜
typingRouter.get('/leaderboard', async (req: AuthRequest, res: Response) => {
  try {
    const period = (req.query.period as string) || 'weekly'; // weekly | monthly | all
    let dateFilter: Date | undefined;

    if (period === 'weekly') {
      dateFilter = new Date();
      dateFilter.setDate(dateFilter.getDate() - 7);
    } else if (period === 'monthly') {
      dateFilter = new Date();
      dateFilter.setMonth(dateFilter.getMonth() - 1);
    }

    const sessions = await prisma.typingSession.findMany({
      where: {
        ...(dateFilter ? { startedAt: { gte: dateFilter } } : {}),
        wordsTyped: { gte: 10 }, // 至少打了10个词
      },
      include: {
        user: {
          select: { id: true, username: true, avatar: true },
        },
      },
      orderBy: { wpm: 'desc' },
      take: 50,
    });

    // 按用户取最佳成绩
    const userBest = new Map<string, typeof sessions[0]>();
    for (const s of sessions) {
      const existing = userBest.get(s.userId);
      if (!existing || s.wpm > existing.wpm) {
        userBest.set(s.userId, s);
      }
    }

    const leaderboard = Array.from(userBest.values())
      .sort((a, b) => b.wpm - a.wpm)
      .slice(0, 20)
      .map((s, i) => ({
        rank: i + 1,
        userId: s.user.id,
        username: s.user.username,
        avatar: s.user.avatar,
        wpm: Math.round(s.wpm * 10) / 10,
        accuracy: Math.round(s.accuracy * 10) / 10,
        maxCombo: s.maxCombo,
      }));

    res.json(leaderboard);
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: '获取排行榜失败' });
  }
});
