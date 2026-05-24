/**
 * 单词族谱/派生树路由 (参考不背单词)
 * - 查询同根词族
 * - 获取词根词缀树
 * - 派生关系可视化数据
 */

import { Router, Request, Response } from 'express';
import { prisma } from '../index';

export const wordFamilyRouter = Router();

// GET /api/word-family/explore/roots - 浏览常用词根列表
// NOTE: 必须在 /:word 之前定义，否则会被通配符路由捕获
wordFamilyRouter.get('/explore/roots', async (_req: Request, res: Response) => {
  try {
    // 获取所有词根并按出现频率排序
    const roots = await prisma.wordRoot.findMany({
      select: {
        root: true,
        meaning: true,
        origin: true,
        type: true,
      },
    });

    // 统计每个词根出现的次数
    const rootCount = new Map<string, { meaning: string; origin: string; type: string; count: number }>();
    for (const r of roots) {
      const existing = rootCount.get(r.root);
      if (existing) {
        existing.count += 1;
      } else {
        rootCount.set(r.root, { meaning: r.meaning, origin: r.origin, type: r.type, count: 1 });
      }
    }

    const sortedRoots = Array.from(rootCount.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 50)
      .map(([root, data]) => ({
        root,
        meaning: data.meaning,
        origin: data.origin,
        type: data.type,
        wordCount: data.count,
      }));

    res.json(sortedRoots);
  } catch (error) {
    console.error('Explore roots error:', error);
    res.status(500).json({ error: '获取词根列表失败' });
  }
});

// GET /api/word-family/root/:root - 按词根查询所有关联词
wordFamilyRouter.get('/root/:root', async (req: Request, res: Response) => {
  try {
    const rootValue = req.params.root.toLowerCase();

    const roots = await prisma.wordRoot.findMany({
      where: { root: rootValue },
      include: {
        word: {
          include: {
            meanings: { take: 2 },
          },
        },
      },
    });

    if (roots.length === 0) {
      res.status(404).json({ error: '未找到该词根相关单词' });
      return;
    }

    const rootInfo = {
      root: rootValue,
      meaning: roots[0].meaning,
      origin: roots[0].origin,
      type: roots[0].type,
    };

    const words = roots.map((r) => ({
      id: r.word.id,
      word: r.word.word,
      phonetic: r.word.phonetic,
      meanings: r.word.meanings.map((m) => ({
        partOfSpeech: m.partOfSpeech,
        translation: m.translation,
      })),
      rootType: r.type,
    }));

    res.json({
      ...rootInfo,
      wordCount: words.length,
      words,
    });
  } catch (error) {
    console.error('Root lookup error:', error);
    res.status(500).json({ error: '查询词根失败' });
  }
});

// GET /api/word-family/:word - 获取单词的词族树
wordFamilyRouter.get('/:word', async (req: Request, res: Response) => {
  try {
    const targetWord = req.params.word.toLowerCase();

    // 查找目标单词及其词根
    const word = await prisma.word.findUnique({
      where: { word: targetWord },
      include: {
        roots: true,
        meanings: true,
      },
    });

    if (!word) {
      res.status(404).json({ error: '单词不存在' });
      return;
    }

    if (!word.roots || word.roots.length === 0) {
      // 没有词根数据，尝试从WordFamily表查
      const family = await prisma.wordFamily.findFirst({
        where: {
          members: { contains: targetWord },
        },
      });

      if (family) {
        const members = JSON.parse(family.members);
        res.json({
          word: targetWord,
          roots: [{ root: family.rootWord, meaning: family.rootMeaning, origin: family.origin, type: 'root' }],
          familyTree: {
            root: family.rootWord,
            meaning: family.rootMeaning,
            origin: family.origin,
            members: members,
          },
          relatedWords: members.filter((m: any) => m.word !== targetWord),
        });
        return;
      }

      res.json({
        word: targetWord,
        roots: [],
        familyTree: null,
        relatedWords: [],
      });
      return;
    }

    // 查找所有共享相同词根的单词
    const rootValues = word.roots.map((r) => r.root);
    const relatedRoots = await prisma.wordRoot.findMany({
      where: {
        root: { in: rootValues },
        wordId: { not: word.id },
      },
      include: {
        word: {
          include: {
            meanings: { take: 1 },
          },
        },
      },
    });

    // 构建派生树结构
    const familyTree = word.roots.map((root) => {
      const relatedForRoot = relatedRoots.filter((r) => r.root === root.root);
      const relatedWordsParsed = (() => {
        try {
          return JSON.parse(root.relatedWords);
        } catch {
          return [];
        }
      })();

      return {
        root: root.root,
        meaning: root.meaning,
        origin: root.origin,
        type: root.type,
        relatedWords: relatedWordsParsed,
        derivedWords: relatedForRoot.map((r) => ({
          id: r.word.id,
          word: r.word.word,
          phonetic: r.word.phonetic,
          translation: r.word.meanings[0]?.translation || '',
          partOfSpeech: r.word.meanings[0]?.partOfSpeech || '',
          rootType: r.type,
        })),
      };
    });

    // 所有相关单词去重
    const allRelated = relatedRoots
      .map((r) => ({
        id: r.word.id,
        word: r.word.word,
        phonetic: r.word.phonetic,
        translation: r.word.meanings[0]?.translation || '',
        partOfSpeech: r.word.meanings[0]?.partOfSpeech || '',
      }))
      .filter((v, i, a) => a.findIndex((t) => t.id === v.id) === i);

    res.json({
      word: targetWord,
      phonetic: word.phonetic,
      meanings: word.meanings,
      roots: word.roots.map((r) => ({
        root: r.root,
        meaning: r.meaning,
        origin: r.origin,
        type: r.type,
      })),
      familyTree,
      relatedWords: allRelated,
    });
  } catch (error) {
    console.error('Word family error:', error);
    res.status(500).json({ error: '获取词族数据失败' });
  }
});
