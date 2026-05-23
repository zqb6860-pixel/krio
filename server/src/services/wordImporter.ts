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

// 中文翻译映射（CET-4 核心词汇）
const CN_TRANSLATIONS: Record<string, string> = {

  abandon: '放弃；遗弃',
  ability: '能力；才能',
  able: '能够的；有能力的',
  abroad: '在国外；到国外',
  absent: '缺席的；不在的',
  absolute: '绝对的；完全的',
  absorb: '吸收；吸引注意力',
  abstract: '抽象的；摘要',
  abundant: '丰富的；充裕的',
  abuse: '滥用；虐待',
  academic: '学术的；学业的',
  accelerate: '加速；促进',
  accept: '接受；认可',
  access: '进入；使用权',
  accident: '事故；意外',
  accommodate: '容纳；适应',
  accompany: '陪伴；伴随',
  accomplish: '完成；实现',
  account: '账户；描述',
  accurate: '准确的；精确的',
  achieve: '实现；取得',
  acknowledge: '承认；致谢',
  acquire: '获得；取得',
  adapt: '适应；改编',
  adequate: '足够的；适当的',
  adjust: '调整；适应',
  administration: '管理；行政',
  admire: '钦佩；赞赏',
  admit: '承认；允许进入',
  adopt: '采用；收养',
  advance: '前进；进步',
  advantage: '优势；有利条件',
  adventure: '冒险；奇遇',
  advertise: '做广告；宣传',
  advice: '建议；忠告',
  affair: '事务；事件',
  affect: '影响；感动',
  afford: '负担得起；提供',
  aggressive: '侵略性的；好斗的',
  agree: '同意；一致',
  agriculture: '农业；农学',
  ahead: '在前面；提前',
  aid: '帮助；援助',
  aim: '目标；瞄准',
  alarm: '警报；惊恐',
  allocate: '分配；拨出',
  allow: '允许；承认',

  alternative: '替代的；可选的',
  amaze: '使惊奇；使惊愕',
  ambition: '抱负；野心',
  amount: '数量；总额',
  analyze: '分析；解析',
  ancient: '古代的；古老的',
  announce: '宣布；声明',
  annual: '年度的；每年的',
  anxious: '焦虑的；渴望的',
  apparent: '明显的；表面上的',
  appeal: '呼吁；吸引力',
  appear: '出现；似乎',
  appetite: '食欲；胃口',
  apply: '应用；申请',
  appoint: '任命；约定',
  appreciate: '欣赏；感激',
  approach: '方法；接近',
  appropriate: '适当的；合适的',
  approve: '批准；赞成',
  argue: '争论；论证',
  arise: '出现；产生',
  arrange: '安排；整理',
  arrest: '逮捕；阻止',
  artificial: '人工的；虚假的',
  aspect: '方面；层面',
  assess: '评估；评定',
  assign: '分配；指派',
  assist: '协助；帮助',
  associate: '联想；关联',
  assume: '假设；承担',
  assure: '确保；使放心',
  atmosphere: '大气；气氛',
  attach: '附上；贴上',
  attack: '攻击；进攻',
  attempt: '尝试；企图',
  attend: '出席；照顾',
  attitude: '态度；姿态',
  attract: '吸引；引起',
  attribute: '属性；归因于',
  authority: '权威；当局',
  available: '可用的；有空的',
  average: '平均的；普通的',
  avoid: '避免；回避',
  aware: '意识到的；知道的',
  balance: '平衡；余额',
  ban: '禁止；禁令',
  barrier: '障碍；屏障',
  basis: '基础；根据',
  bear: '忍受；承担',

  behavior: '行为；举止',
  belief: '信仰；信念',
  belong: '属于；归属',
  benefit: '利益；好处',
  besides: '此外；除...之外',
  blame: '责备；归咎于',
  blank: '空白的；茫然的',
  block: '阻塞；街区',
  board: '董事会；板',
  bond: '纽带；债券',
  bore: '使厌烦；钻孔',
  bother: '打扰；烦恼',
  boundary: '边界；界限',
  branch: '分支；分部',
  brand: '品牌；商标',
  brave: '勇敢的',
  brief: '简短的；摘要',
  brilliant: '杰出的；灿烂的',
  broad: '宽广的；广泛的',
  budget: '预算；经费',
  burden: '负担；重担',
  campaign: '运动；战役',
  capable: '有能力的',
  capacity: '容量；能力',
  capture: '捕获；捕捉',
  career: '职业；事业',
  casual: '随意的；非正式的',
  category: '类别；范畴',
  cause: '原因；导致',
  celebrate: '庆祝；赞美',
  challenge: '挑战；质疑',
  champion: '冠军；拥护者',
  channel: '渠道；频道',
  chapter: '章节；阶段',
  character: '性格；角色',
  charge: '收费；指控',
  charity: '慈善；施舍',
  chief: '主要的；首领',
  circumstance: '情况；环境',
  civil: '公民的；文明的',
  claim: '声称；索赔',
  classify: '分类；归类',
  climate: '气候；风气',
  cling: '紧贴；坚持',
  collapse: '倒塌；崩溃',
  colleague: '同事；同僚',
  combine: '结合；联合',
  comfort: '安慰；舒适',
  command: '命令；指挥',
  comment: '评论；注释',
};


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
