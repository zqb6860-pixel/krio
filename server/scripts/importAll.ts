/**
 * 全量词库导入脚本
 * 从 Free Dictionary API 批量拉取真实词库数据
 * 支持: CET-4 (800词) / CET-6 (500词) / IELTS (400词) / 考研 (300词)
 * 
 * 运行方式:
 *   npx tsx scripts/importAll.ts          # 导入所有词库
 *   npx tsx scripts/importAll.ts cet4     # 只导入CET-4
 *   npx tsx scripts/importAll.ts cet6     # 只导入CET-6
 *   npx tsx scripts/importAll.ts ielts    # 只导入IELTS
 *   npx tsx scripts/importAll.ts postgrad # 只导入考研
 */

import { PrismaClient } from '@prisma/client';
import { CET4_WORDS, CET6_WORDS, IELTS_WORDS, POSTGRAD_WORDS } from '../data/wordlists';
import { importWordBatch } from '../src/services/wordImporter';

const prisma = new PrismaClient();

interface BookConfig {
  key: string;
  name: string;
  description: string;
  category: string;
  difficulty: number;
  words: string[];
}

const BOOKS: BookConfig[] = [
  {
    key: 'cet4',
    name: 'CET-4 大学英语四级核心词汇',
    description: '大学英语四级考试高频核心词汇800词，含真实音标、释义和例句',
    category: 'cet4',
    difficulty: 3,
    words: CET4_WORDS,
  },
  {
    key: 'cet6',
    name: 'CET-6 大学英语六级核心词汇',
    description: '大学英语六级考试高频核心词汇500词，难度高于四级',
    category: 'cet6',
    difficulty: 4,
    words: CET6_WORDS,
  },
  {
    key: 'ielts',
    name: 'IELTS 雅思学术词汇',
    description: '雅思考试学术类高频词汇400词，适合出国留学备考',
    category: 'ielts',
    difficulty: 4,
    words: IELTS_WORDS,
  },
  {
    key: 'postgrad',
    name: '考研英语核心词汇',
    description: '全国硕士研究生入学考试英语高频词汇300词',
    category: 'postgraduate',
    difficulty: 4,
    words: POSTGRAD_WORDS,
  },
];

async function importBook(config: BookConfig) {
  console.log(`\n📚 导入词库: ${config.name}`);
  console.log(`   共 ${config.words.length} 个单词\n`);

  // 确保词库存在
  let book = await prisma.wordBook.findFirst({
    where: { category: config.category },
  });

  if (!book) {
    book = await prisma.wordBook.create({
      data: {
        name: config.name,
        description: config.description,
        category: config.category,
        difficulty: config.difficulty,
        isSystem: true,
      },
    });
  }

  // 分批导入
  const BATCH_SIZE = 25;
  let totalSuccess = 0;
  const allFailed: string[] = [];

  for (let i = 0; i < config.words.length; i += BATCH_SIZE) {
    const batch = config.words.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(config.words.length / BATCH_SIZE);
    
    process.stdout.write(`   批次 ${batchNum}/${totalBatches} (${i+1}-${Math.min(i+BATCH_SIZE, config.words.length)})...`);
    
    const result = await importWordBatch(batch, book.id, 250);
    totalSuccess += result.success;
    allFailed.push(...result.failed);
    
    console.log(` ✓ ${result.success}成功${result.failed.length > 0 ? ` ${result.failed.length}失败` : ''}`);
  }

  console.log(`\n   ✅ ${config.name}: ${totalSuccess}/${config.words.length} 成功`);
  if (allFailed.length > 0) {
    console.log(`   ⚠️  失败: ${allFailed.slice(0, 10).join(', ')}${allFailed.length > 10 ? '...' : ''}`);
  }

  return { success: totalSuccess, failed: allFailed.length };
}

async function main() {
  const target = process.argv[2]; // cet4, cet6, ielts, postgrad, or undefined (all)
  
  console.log('╔══════════════════════════════════════════╗');
  console.log('║   LightWords 词库批量导入工具            ║');
  console.log('║   数据源: Free Dictionary API            ║');
  console.log('╚══════════════════════════════════════════╝');

  const booksToImport = target 
    ? BOOKS.filter(b => b.key === target)
    : BOOKS;

  if (booksToImport.length === 0) {
    console.log(`\n❌ 未知词库: ${target}`);
    console.log('   可用: cet4, cet6, ielts, postgrad');
    process.exit(1);
  }

  const totalWords = booksToImport.reduce((sum, b) => sum + b.words.length, 0);
  console.log(`\n📊 计划导入 ${booksToImport.length} 个词库，共 ${totalWords} 个单词`);
  console.log(`⏱️  预计耗时: ${Math.ceil(totalWords * 0.3 / 60)} 分钟\n`);

  let grandSuccess = 0;
  let grandFailed = 0;

  for (const book of booksToImport) {
    const result = await importBook(book);
    grandSuccess += result.success;
    grandFailed += result.failed;
  }

  console.log('\n╔══════════════════════════════════════════╗');
  console.log(`║   导入完成！成功: ${grandSuccess} | 失败: ${grandFailed}       `);
  console.log('╚══════════════════════════════════════════╝\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
