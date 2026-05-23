/**
 * Import word dictionaries from Qwerty Learner format
 * Format: [{ name: string, trans: string[], usphone: string, ukphone: string }]
 * 
 * Usage: npx tsx scripts/importQwertyDicts.ts [dictName]
 * Examples:
 *   npx tsx scripts/importQwertyDicts.ts         # Import all
 *   npx tsx scripts/importQwertyDicts.ts CET4    # Import only CET4
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface QwertyWord {
  name: string;
  trans: string[];
  usphone?: string;
  ukphone?: string;
}

const DICT_CONFIG: Record<string, { name: string; description: string; category: string; difficulty: number }> = {
  CET4: { name: 'CET-4 四级词汇', description: '大学英语四级核心词汇 (来源: Qwerty Learner)', category: 'cet4', difficulty: 3 },
  CET6: { name: 'CET-6 六级词汇', description: '大学英语六级核心词汇 (来源: Qwerty Learner)', category: 'cet6', difficulty: 4 },
  KaoYan: { name: '考研英语词汇', description: '研究生英语入学考试词汇 (来源: Qwerty Learner)', category: 'postgraduate', difficulty: 4 },
  IELTS: { name: '雅思 IELTS 词汇', description: '雅思考试核心词汇 (来源: Qwerty Learner)', category: 'ielts', difficulty: 4 },
  GaoKao: { name: '高考 3500 词', description: '高考英语核心 3500 词汇 (来源: Qwerty Learner)', category: 'gaokao', difficulty: 2 },
  TOEFL: { name: '托福 TOEFL 词汇', description: '托福考试核心词汇 (来源: Qwerty Learner)', category: 'toefl', difficulty: 5 },
};

async function importDict(dictName: string) {
  const config = DICT_CONFIG[dictName];
  if (!config) {
    console.error(`Unknown dict: ${dictName}. Available: ${Object.keys(DICT_CONFIG).join(', ')}`);
    return;
  }

  const filePath = path.join(__dirname, '../data/qwerty-dicts', `${dictName}.json`);
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return;
  }

  console.log(`\n📖 Importing ${dictName}: ${config.name}...`);

  const raw = fs.readFileSync(filePath, 'utf-8');
  const words: QwertyWord[] = JSON.parse(raw);
  console.log(`   Found ${words.length} words in file`);

  // Create or find the word book
  let book = await prisma.wordBook.findFirst({ where: { category: config.category, name: config.name } });
  if (!book) {
    book = await prisma.wordBook.create({
      data: {
        name: config.name,
        description: config.description,
        category: config.category,
        difficulty: config.difficulty,
        isSystem: true,
        wordCount: 0,
      },
    });
    console.log(`   Created word book: ${book.name} (${book.id})`);
  } else {
    console.log(`   Using existing book: ${book.name} (${book.id})`);
  }

  let imported = 0;
  let skipped = 0;

  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    if (!w.name || w.name.length < 2) { skipped++; continue; }

    try {
      // Check if word already exists
      let wordRecord = await prisma.word.findUnique({ where: { word: w.name } });

      if (!wordRecord) {
        // Parse translations - split by Chinese semicolons/commas
        const meanings = w.trans.map((t, idx) => {
          // Try to extract part of speech from translation like "n. 取消"
          const posMatch = t.match(/^((?:n|v|adj|adv|prep|conj|pron|art|int|vi|vt|aux)\.\s*)/i);
          const partOfSpeech = posMatch ? posMatch[1].trim() : '';
          const translation = posMatch ? t.slice(posMatch[0].length).trim() : t.trim();
          return { partOfSpeech, definition: translation, translation, order: idx };
        });

        wordRecord = await prisma.word.create({
          data: {
            word: w.name,
            phonetic: w.usphone ? `/${w.usphone}/` : undefined,
            phoneticUs: w.usphone ? `/${w.usphone}/` : undefined,
            phoneticUk: w.ukphone ? `/${w.ukphone}/` : undefined,
            difficulty: config.difficulty,
            frequency: words.length - i,
            meanings: meanings.length > 0 ? { create: meanings } : undefined,
          },
        });
      }

      // Link to word book (if not already linked)
      const existingLink = await prisma.wordBookWord.findFirst({
        where: { wordBookId: book.id, wordId: wordRecord.id },
      });
      if (!existingLink) {
        await prisma.wordBookWord.create({
          data: { wordBookId: book.id, wordId: wordRecord.id, order: i },
        });
      }

      imported++;
      if (imported % 200 === 0) {
        console.log(`   Progress: ${imported}/${words.length}`);
      }
    } catch (err: any) {
      skipped++;
      if (skipped <= 5) console.warn(`   Skip "${w.name}": ${err.message}`);
    }
  }

  // Update word count
  const finalCount = await prisma.wordBookWord.count({ where: { wordBookId: book.id } });
  await prisma.wordBook.update({ where: { id: book.id }, data: { wordCount: finalCount } });

  console.log(`   ✅ Done! Imported: ${imported}, Skipped: ${skipped}, Total in book: ${finalCount}`);
}

async function main() {
  const targetDict = process.argv[2];

  if (targetDict) {
    await importDict(targetDict);
  } else {
    console.log('🚀 Importing all Qwerty Learner dictionaries...');
    for (const dictName of Object.keys(DICT_CONFIG)) {
      await importDict(dictName);
    }
  }

  console.log('\n🎉 All done!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
