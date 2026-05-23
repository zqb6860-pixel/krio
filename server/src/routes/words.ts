import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { authMiddleware, AuthRequest } from '../middleware/auth';

export const wordRouter = Router();

// GET /api/words/books - Get all word books
wordRouter.get('/books', async (_req: Request, res: Response) => {
  try {
    const books = await prisma.wordBook.findMany({
      orderBy: { difficulty: 'asc' },
    });
    res.json(books);
  } catch (error) {
    res.status(500).json({ error: '获取词库列表失败' });
  }
});

// GET /api/words/books/:id/words - Get words from a book (paginated)
wordRouter.get('/books/:id/words', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [entries, total] = await Promise.all([
      prisma.wordBookWord.findMany({
        where: { wordBookId: id },
        include: {
          word: {
            include: {
              meanings: true,
              roots: true,
              collocations: true,
              examples: { take: 2 },
            },
          },
        },
        orderBy: { order: 'asc' },
        skip,
        take: limit,
      }),
      prisma.wordBookWord.count({ where: { wordBookId: id } }),
    ]);

    res.json({
      words: entries.map((e) => e.word),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ error: '获取词库单词失败' });
  }
});

// GET /api/words/today - Get today's learning words (requires auth)
wordRouter.get('/today', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    // Get user's daily goal
    const settings = await prisma.userSettings.findUnique({ where: { userId } });
    const dailyGoal = settings?.dailyWordGoal || 30;

    // Get words the user hasn't learned yet (status = 'new' or no record)
    const existingRecords = await prisma.learningRecord.findMany({
      where: { userId },
      select: { wordId: true },
    });
    const learnedWordIds = existingRecords.map((r) => r.wordId);

    // Get new words from a default word book (or all words)
    const newWords = await prisma.word.findMany({
      where: {
        id: { notIn: learnedWordIds.length > 0 ? learnedWordIds : ['__none__'] },
      },
      include: {
        meanings: true,
        roots: true,
        collocations: true,
        examples: { take: 2 },
      },
      take: dailyGoal,
      orderBy: { frequency: 'desc' },
    });

    res.json(newWords);
  } catch (error) {
    console.error('Today words error:', error);
    res.status(500).json({ error: '获取今日单词失败' });
  }
});

// GET /api/words/search?q=xxx
wordRouter.get('/search', async (req: Request, res: Response) => {
  try {
    const query = (req.query.q as string) || '';
    if (query.length < 1) {
      return res.json([]);
    }

    const words = await prisma.word.findMany({
      where: {
        word: { startsWith: query.toLowerCase() },
      },
      include: {
        meanings: true,
      },
      take: 20,
      orderBy: { frequency: 'desc' },
    });

    res.json(words);
  } catch (error) {
    res.status(500).json({ error: '搜索失败' });
  }
});

// GET /api/words/:id - Get single word detail
wordRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const word = await prisma.word.findUnique({
      where: { id: req.params.id },
      include: {
        meanings: true,
        roots: true,
        collocations: true,
        examples: true,
      },
    });

    if (!word) return res.status(404).json({ error: '单词不存在' });
    res.json(word);
  } catch (error) {
    res.status(500).json({ error: '获取单词详情失败' });
  }
});
