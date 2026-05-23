/**
 * Exercise Generator Service
 * 从真实词库数据自动生成闯关题目
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface GeneratedExercise {
  type: string;
  question: string;
  options: string;
  correctAnswer: string;
  wordId: string;
}

/**
 * 从数据库词库中随机生成 N 道选择题
 */
export async function generateExercises(count: number = 5): Promise<GeneratedExercise[]> {
  // 获取有释义的单词
  const allWords = await prisma.word.findMany({
    where: { meanings: { some: {} } },
    include: { meanings: { take: 1 } },
    take: Math.max(count * 4, 40),
  });

  if (allWords.length < 8) return [];

  const shuffled = shuffleArray([...allWords]);
  const selected = shuffled.slice(0, Math.min(count, shuffled.length));
  const exercises: GeneratedExercise[] = [];

  for (const word of selected) {
    const meaning = word.meanings[0];
    if (!meaning) continue;

    const exerciseType = Math.random() > 0.5 ? 'en_to_cn' : 'cn_to_en';

    if (exerciseType === 'en_to_cn') {
      const correctAnswer = meaning.translation;
      const distractors = getDistractors(shuffled, word.id, 'translation', 3);
      const options = shuffleArray([correctAnswer, ...distractors]);
      exercises.push({
        type: 'choose_translation',
        question: `"${word.word}" 的中文意思是？`,
        options: JSON.stringify(options),
        correctAnswer,
        wordId: word.id,
      });
    } else {
      const correctAnswer = word.word;
      const distractors = getDistractors(shuffled, word.id, 'word', 3);
      const options = shuffleArray([correctAnswer, ...distractors]);
      exercises.push({
        type: 'choose_translation',
        question: `"${meaning.translation}" 对应的英文单词是？`,
        options: JSON.stringify(options),
        correctAnswer,
        wordId: word.id,
      });
    }
  }

  return exercises;
}

function getDistractors(allWords: any[], excludeId: string, field: 'translation' | 'word', count: number): string[] {
  const others = allWords.filter((w) => w.id !== excludeId);
  const shuffled = shuffleArray(others);
  const result: string[] = [];
  for (const w of shuffled) {
    if (result.length >= count) break;
    const value = field === 'translation' ? w.meanings?.[0]?.translation : w.word;
    if (value && !result.includes(value)) result.push(value);
  }
  while (result.length < count) {
    const fallbacks = field === 'translation' ? ['未知含义', '其他意思', '无此释义'] : ['unknown', 'other', 'none'];
    result.push(fallbacks[result.length % 3]);
  }
  return result;
}

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
