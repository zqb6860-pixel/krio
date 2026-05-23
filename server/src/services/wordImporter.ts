/**
 * Word Importer Service
 * 从免费 Dictionary API (dictionaryapi.dev) 导入真实词库数据
 * 包含音标、释义、例句、发音音频
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const DICT_API = 'https://api.dictionaryapi.dev/api/v2/entries/en';

interface DictAPIResponse {
  word: string;
  phonetic?: string;
  phonetics?: { text?: string; audio?: string }[];
  meanings?: {
    partOfSpeech: string;
    definitions: { definition: string; example?: string }[];
    synonyms?: string[];
  }[];
}

import { CN_TRANSLATIONS } from '../../data/translations';


/**
 * 从 Free Dictionary API 获取单词详情
 */
async function fetchWordFromAPI(word: string): Promise<DictAPIResponse | null> {
  try {
    const res = await fetch(`${DICT_API}/${word}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data[0] || null;
  } catch {
    return null;
  }
}

/**
 * 延迟函数，避免 API 限流
 */
function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 导入单个单词到数据库
 */
export async function importWord(wordStr: string, bookId?: string, order?: number) {
  // 检查是否已存在
  const existing = await prisma.word.findUnique({ where: { word: wordStr } });
  if (existing) {
    // 如果已存在但需要关联到词库
    if (bookId) {
      const link = await prisma.wordBookWord.findFirst({
        where: { wordBookId: bookId, wordId: existing.id },
      });
      if (!link) {
        await prisma.wordBookWord.create({
          data: { wordBookId: bookId, wordId: existing.id, order: order || 0 },
        });
      }
    }
    return existing;
  }

  // 从 API 获取真实数据
  const apiData = await fetchWordFromAPI(wordStr);
  const cnTranslation = CN_TRANSLATIONS[wordStr] || '';


  // 提取音标
  const phonetic = apiData?.phonetic || apiData?.phonetics?.find(p => p.text)?.text || '';
  const audioUrl = apiData?.phonetics?.find(p => p.audio)?.audio || '';

  // 构建释义
  const meanings: { partOfSpeech: string; definition: string; translation: string; order: number }[] = [];
  if (apiData?.meanings) {
    let idx = 0;
    for (const m of apiData.meanings) {
      const def = m.definitions[0];
      if (def) {
        meanings.push({
          partOfSpeech: m.partOfSpeech,
          definition: def.definition,
          translation: cnTranslation || def.definition,
          order: idx++,
        });
      }
    }
  } else if (cnTranslation) {
    meanings.push({
      partOfSpeech: '',
      definition: wordStr,
      translation: cnTranslation,
      order: 0,
    });
  }

  // 构建例句
  const examples: { sentence: string; translation: string; source: string }[] = [];
  if (apiData?.meanings) {
    for (const m of apiData.meanings) {
      for (const def of m.definitions) {
        if (def.example) {
          examples.push({
            sentence: def.example,
            translation: '',
            source: 'Dictionary',
          });
          if (examples.length >= 2) break;
        }
      }
      if (examples.length >= 2) break;
    }
  }


  // 创建单词
  const word = await prisma.word.create({
    data: {
      word: wordStr,
      phonetic,
      phoneticUs: phonetic,
      audioUs: audioUrl,
      difficulty: 3,
      frequency: order ? 10000 - order : 5000,
      meanings: meanings.length > 0 ? { create: meanings } : undefined,
      examples: examples.length > 0 ? { create: examples } : undefined,
    },
  });

  // 关联到词库
  if (bookId) {
    await prisma.wordBookWord.create({
      data: { wordBookId: bookId, wordId: word.id, order: order || 0 },
    });
  }

  return word;
}

/**
 * 批量导入词库
 * @param words 单词列表
 * @param bookId 词库ID
 * @param batchDelay API调用间隔(ms)，防止限流
 */
export async function importWordBatch(
  words: string[],
  bookId: string,
  batchDelay = 300
): Promise<{ success: number; failed: string[] }> {
  let success = 0;
  const failed: string[] = [];

  for (let i = 0; i < words.length; i++) {
    try {
      await importWord(words[i], bookId, i);
      success++;
      console.log(`  [${i + 1}/${words.length}] ✓ ${words[i]}`);
    } catch (err) {
      failed.push(words[i]);
      console.log(`  [${i + 1}/${words.length}] ✗ ${words[i]}`);
    }
    // 每个单词间隔一段时间，避免 API 限流
    if (batchDelay > 0 && i < words.length - 1) {
      await delay(batchDelay);
    }
  }

  // 更新词库单词数
  await prisma.wordBook.update({
    where: { id: bookId },
    data: { wordCount: success },
  });

  return { success, failed };
}
