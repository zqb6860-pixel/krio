import { Router, Response } from 'express';
import { prisma } from '../index';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { importWordBatch } from '../services/wordImporter';

export const importRouter = Router();
importRouter.use(authMiddleware);

// POST /api/import/words - Import words into a word book
importRouter.post('/words', async (req: AuthRequest, res: Response) => {
  try {
    const { bookId, words } = req.body;

    if (!bookId || !words || !Array.isArray(words)) {
      return res.status(400).json({ error: '需要提供 bookId 和 words 数组' });
    }

    if (words.length > 50) {
      return res.status(400).json({ error: '每次最多导入50个单词' });
    }

    const result = await importWordBatch(words, bookId, 350);
    res.json(result);
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ error: '导入失败' });
  }
});
