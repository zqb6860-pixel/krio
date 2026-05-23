/**
 * CET-4 真实词库导入脚本
 * 从 Free Dictionary API 批量拉取 200 个核心高频词
 * 运行: npx tsx scripts/importCET4.ts
 */

import { PrismaClient } from '@prisma/client';
import { importWordBatch } from '../src/services/wordImporter';

const prisma = new PrismaClient();

// CET-4 高频核心词 200 个
const CET4_WORDS = [
  // A
  'abandon', 'ability', 'able', 'abroad', 'absent',
  'absolute', 'absorb', 'abstract', 'abundant', 'abuse',

  'academic', 'accelerate', 'accept', 'access', 'accident',
  'accommodate', 'accompany', 'accomplish', 'account', 'accurate',
  'achieve', 'acknowledge', 'acquire', 'adapt', 'adequate',
  'adjust', 'administration', 'admire', 'admit', 'adopt',
  'advance', 'advantage', 'adventure', 'advertise', 'advice',
  'affair', 'affect', 'afford', 'aggressive', 'agree',
  'agriculture', 'ahead', 'aid', 'aim', 'alarm',
  'allocate', 'allow', 'alternative', 'amaze', 'ambition',
  'amount', 'analyze', 'ancient', 'announce', 'annual',
  // B
  'anxious', 'apparent', 'appeal', 'appear', 'appetite',
  'apply', 'appoint', 'appreciate', 'approach', 'appropriate',
  'approve', 'argue', 'arise', 'arrange', 'arrest',
  'artificial', 'aspect', 'assess', 'assign', 'assist',
  'associate', 'assume', 'assure', 'atmosphere', 'attach',
  'attack', 'attempt', 'attend', 'attitude', 'attract',
  'attribute', 'authority', 'available', 'average', 'avoid',
  'aware', 'balance', 'ban', 'barrier', 'basis',
  'bear', 'behavior', 'belief', 'belong', 'benefit',
  'besides', 'blame', 'blank', 'block', 'bond',
  // C
  'bore', 'bother', 'boundary', 'branch', 'brand',
  'brave', 'brief', 'brilliant', 'broad', 'budget',
  'burden', 'campaign', 'capable', 'capacity', 'capture',
  'career', 'casual', 'category', 'cause', 'celebrate',
  'challenge', 'champion', 'channel', 'chapter', 'character',
  'charge', 'charity', 'chief', 'circumstance', 'civil',
  'claim', 'classify', 'climate', 'cling', 'collapse',
  'colleague', 'combine', 'comfort', 'command', 'comment',
  // D-E
  'commit', 'communicate', 'community', 'compare', 'compete',
  'complain', 'complex', 'component', 'concentrate', 'concern',
  'conclude', 'condition', 'conduct', 'confident', 'confirm',
  'conflict', 'confuse', 'connect', 'conscious', 'consequence',
  'consider', 'consist', 'constant', 'construct', 'consult',
  'consume', 'contact', 'contain', 'contemporary', 'content',
  'contribute', 'control', 'convenient', 'convince', 'cooperate',
  'correspond', 'count', 'courage', 'create', 'crisis',
  'critical', 'culture', 'curious', 'current', 'custom',
  'damage', 'debate', 'decline', 'defeat', 'defend',
];


async function main() {
  console.log('🚀 开始导入 CET-4 真实词库...');
  console.log(`   共 ${CET4_WORDS.length} 个单词\n`);

  // 确保 CET-4 词库存在
  let cet4Book = await prisma.wordBook.findFirst({
    where: { category: 'cet4' },
  });

  if (!cet4Book) {
    cet4Book = await prisma.wordBook.create({
      data: {
        name: 'CET-4 大学英语四级核心词汇',
        description: '大学英语四级考试高频核心词汇，包含音标、释义和例句',
        category: 'cet4',
        difficulty: 3,
        isSystem: true,
      },
    });
  }

  console.log(`📚 词库: ${cet4Book.name} (ID: ${cet4Book.id})\n`);

  // 分批导入 (每批 20 个，间隔 350ms)
  const BATCH_SIZE = 20;
  let totalSuccess = 0;
  const allFailed: string[] = [];

  for (let i = 0; i < CET4_WORDS.length; i += BATCH_SIZE) {
    const batch = CET4_WORDS.slice(i, i + BATCH_SIZE);
    console.log(`\n📦 批次 ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(CET4_WORDS.length / BATCH_SIZE)}`);

    const result = await importWordBatch(batch, cet4Book.id, 350);
    totalSuccess += result.success;
    allFailed.push(...result.failed);
  }

  console.log('\n========================================');
  console.log(`✅ 导入完成！`);
  console.log(`   成功: ${totalSuccess} 个`);
  console.log(`   失败: ${allFailed.length} 个`);
  if (allFailed.length > 0) {
    console.log(`   失败词汇: ${allFailed.join(', ')}`);
  }
  console.log('========================================\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
