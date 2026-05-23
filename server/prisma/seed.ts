import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ===== Create Word Books =====
  const cet4Book = await prisma.wordBook.create({
    data: {
      name: 'CET-4 大学英语四级核心词汇',
      description: '大学英语四级考试高频核心词汇，精选最常考的单词',
      category: 'cet4',
      difficulty: 3,
      isSystem: true,
    },
  });

  const cet6Book = await prisma.wordBook.create({
    data: {
      name: 'CET-6 大学英语六级核心词汇',
      description: '大学英语六级考试高频核心词汇',
      category: 'cet6',
      difficulty: 4,
      isSystem: true,
    },
  });

  await prisma.wordBook.createMany({
    data: [
      { name: '高中英语必备词汇', description: '高考必背3500词精选', category: 'high_school', difficulty: 2, isSystem: true },
      { name: 'IELTS 雅思核心词汇', description: '雅思考试高频词汇', category: 'ielts', difficulty: 4, isSystem: true },
      { name: '考研英语核心词汇', description: '考研英语高频考点词', category: 'postgraduate', difficulty: 4, isSystem: true },
      { name: '日常口语高频词', description: '日常交流最常用词汇', category: 'travel', difficulty: 1, isSystem: true },
      { name: '商务英语词汇', description: '职场商务常用词汇', category: 'business', difficulty: 3, isSystem: true },
    ],
  });

  // ===== Create Words (CET-4 core) =====
  const wordsData = getCET4Words();

  for (let i = 0; i < wordsData.length; i++) {
    const w = wordsData[i];
    const word = await prisma.word.create({
      data: {
        word: w.word,
        phonetic: w.phonetic,
        phoneticUs: w.phonetic,
        difficulty: w.difficulty,
        frequency: wordsData.length - i,
        meanings: {
          create: w.meanings.map((m, idx) => ({
            partOfSpeech: m.pos,
            definition: m.def,
            translation: m.cn,
            order: idx,
          })),
        },
        roots: w.roots ? {
          create: w.roots.map((r) => ({
            root: r.root,
            meaning: r.meaning,
            origin: r.origin || 'Latin',
            type: r.type,
            relatedWords: r.related || [],
          })),
        } : undefined,
        collocations: w.collocations ? {
          create: w.collocations.map((c) => ({
            phrase: c.phrase,
            translation: c.cn,
            example: c.example,
          })),
        } : undefined,
        examples: {
          create: w.examples.map((e) => ({
            sentence: e.en,
            translation: e.cn,
            source: e.source,
          })),
        },
      },
    });

    // Add to CET-4 book
    await prisma.wordBookWord.create({
      data: { wordBookId: cet4Book.id, wordId: word.id, order: i },
    });
  }

  // Update word count
  await prisma.wordBook.update({
    where: { id: cet4Book.id },
    data: { wordCount: wordsData.length },
  });

  console.log(`✅ Created ${wordsData.length} words`);

  // ===== Create Achievements =====
  await prisma.achievement.createMany({
    data: [
      { name: '初学者', description: '完成第一次学习', icon: '🌱', category: 'learning', requirement: 1, rewardCoins: 10, rewardExp: 20 },
      { name: '词汇新手', description: '累计学习50个单词', icon: '📗', category: 'learning', requirement: 50, rewardCoins: 50, rewardExp: 100 },
      { name: '词汇达人', description: '累计学习500个单词', icon: '📚', category: 'learning', requirement: 500, rewardCoins: 200, rewardExp: 500 },
      { name: '千词斩', description: '累计学习1000个单词', icon: '🗡️', category: 'vocabulary', requirement: 1000, rewardCoins: 500, rewardExp: 1000 },
      { name: '万词王', description: '累计掌握5000个单词', icon: '👑', category: 'vocabulary', requirement: 5000, rewardCoins: 2000, rewardExp: 5000 },
      { name: '坚持一周', description: '连续打卡7天', icon: '🔥', category: 'persistence', requirement: 7, rewardCoins: 50, rewardExp: 100 },
      { name: '月度之星', description: '连续打卡30天', icon: '⭐', category: 'persistence', requirement: 30, rewardCoins: 200, rewardExp: 500 },
      { name: '百日坚持', description: '连续打卡100天', icon: '💎', category: 'persistence', requirement: 100, rewardCoins: 1000, rewardExp: 2000 },
      { name: '完美通关', description: '以3星通过任意关卡', icon: '🏆', category: 'skill', requirement: 1, rewardCoins: 30, rewardExp: 50 },
      { name: '连击大师', description: '达到20连击', icon: '⚡', category: 'skill', requirement: 20, rewardCoins: 100, rewardExp: 200 },
    ],
  });
  console.log('✅ Created achievements');

  // ===== Create Learning Paths =====
  const vocabPath = await prisma.learningPath.create({
    data: {
      name: '基础词汇路径',
      description: '从零开始，系统学习英语核心词汇',
      category: 'vocabulary',
      order: 1,
      icon: '📚',
    },
  });

  const units = [
    { title: '基础入门', desc: '日常生活基础词汇', icon: '🌱' },
    { title: '日常生活', desc: '衣食住行常用词', icon: '🏠' },
    { title: '校园学习', desc: '学习与工作词汇', icon: '📖' },
    { title: '进阶表达', desc: '中高级表达词汇', icon: '🚀' },
  ];

  for (let i = 0; i < units.length; i++) {
    const unit = await prisma.unit.create({
      data: {
        pathId: vocabPath.id,
        title: units[i].title,
        description: units[i].desc,
        order: i + 1,
        icon: units[i].icon,
      },
    });

    // Create 5 levels per unit
    const levelNames = [
      ['日常问候', '数字颜色', '家庭称谓', '食物饮料', '天气季节'],
      ['购物用语', '餐厅点餐', '交通出行', '工作办公', '休闲娱乐'],
      ['课堂用语', '图书馆', '考试词汇', '学科名称', '论文写作'],
      ['情感表达', '观点陈述', '新闻阅读', '学术词汇', '商务英语'],
    ];

    for (let j = 0; j < 5; j++) {
      await prisma.level.create({
        data: {
          unitId: unit.id,
          title: levelNames[i][j],
          description: `${units[i].title} - 第${j + 1}关`,
          order: j + 1,
        },
      });
    }
  }
  console.log('✅ Created learning paths');

  // ===== Create demo user =====
  const demoHash = await bcrypt.hash('demo123456', 12);
  const demoUser = await prisma.user.create({
    data: {
      email: 'demo@lightwords.app',
      username: 'demo_user',
      passwordHash: demoHash,
      level: 5,
      experience: 450,
      coins: 1250,
      streak: 7,
      lastStudyDate: new Date().toISOString().split('T')[0],
      settings: {
        create: { dailyWordGoal: 30, dailyTimeGoal: 30 },
      },
    },
  });
  console.log(`✅ Demo user: demo@lightwords.app / demo123456`);

  console.log('🎉 Seeding complete!');
}

// ===== CET-4 Core Vocabulary Data =====
function getCET4Words() {
  return [
    {
      word: 'abandon', phonetic: '/əˈbændən/', difficulty: 3,
      meanings: [{ pos: 'v.', def: 'to leave completely and finally', cn: '放弃；遗弃；抛弃' }],
      roots: [{ root: 'a-', meaning: '加强', type: 'prefix', origin: 'Latin', related: ['abuse', 'abound'] }, { root: 'bandon', meaning: '控制/命令', type: 'root', origin: 'French', related: ['band', 'bandit'] }],
      collocations: [{ phrase: 'abandon hope', cn: '放弃希望', example: 'Never abandon hope.' }, { phrase: 'abandon ship', cn: '弃船', example: 'The captain ordered to abandon ship.' }],
      examples: [{ en: 'They had to abandon the car in the snow.', cn: '他们不得不把车丢弃在雪地里。', source: '2020 CET-4' }],
    },
    {
      word: 'ability', phonetic: '/əˈbɪləti/', difficulty: 2,
      meanings: [{ pos: 'n.', def: 'the power or skill to do something', cn: '能力；才能' }],
      roots: [{ root: 'abil-', meaning: '能够', type: 'root', origin: 'Latin', related: ['able', 'enable', 'disable'] }],
      collocations: [{ phrase: 'ability to do', cn: '做某事的能力', example: 'He has the ability to lead.' }, { phrase: 'natural ability', cn: '天赋', example: 'She has a natural ability for music.' }],
      examples: [{ en: 'She has the ability to solve complex problems.', cn: '她有解决复杂问题的能力。', source: '2019 CET-4' }],
    },
    {
      word: 'abroad', phonetic: '/əˈbrɔːd/', difficulty: 2,
      meanings: [{ pos: 'adv.', def: 'in or to a foreign country', cn: '在国外；到国外' }],
      roots: [{ root: 'a-', meaning: '在...上', type: 'prefix', origin: 'Old English', related: ['aboard', 'ashore'] }, { root: 'broad', meaning: '宽广', type: 'root', origin: 'Old English', related: ['broad', 'broadcast'] }],
      collocations: [{ phrase: 'go abroad', cn: '出国', example: 'He plans to go abroad next year.' }, { phrase: 'study abroad', cn: '出国留学', example: 'Many students want to study abroad.' }],
      examples: [{ en: 'She spent two years working abroad.', cn: '她在国外工作了两年。', source: '2021 CET-4' }],
    },
    {
      word: 'absent', phonetic: '/ˈæbsənt/', difficulty: 2,
      meanings: [{ pos: 'adj.', def: 'not in the place where expected', cn: '缺席的；不在的' }],
      roots: [{ root: 'ab-', meaning: '离开', type: 'prefix', origin: 'Latin', related: ['abnormal', 'abstract'] }, { root: 'sent', meaning: '存在/感觉', type: 'root', origin: 'Latin', related: ['present', 'sense'] }],
      collocations: [{ phrase: 'be absent from', cn: '缺席...', example: 'He was absent from the meeting.' }],
      examples: [{ en: 'He was absent from school for three days.', cn: '他缺了三天课。', source: '高中英语' }],
    },
    {
      word: 'absorb', phonetic: '/əbˈzɔːrb/', difficulty: 3,
      meanings: [{ pos: 'v.', def: 'to take in liquid, gas, or another substance', cn: '吸收；吸引注意力' }],
      roots: [{ root: 'ab-', meaning: '加强', type: 'prefix', origin: 'Latin', related: ['abuse', 'abstract'] }, { root: 'sorb', meaning: '吸', type: 'root', origin: 'Latin', related: ['absorb', 'adsorb'] }],
      collocations: [{ phrase: 'absorb information', cn: '吸收信息', example: 'Children absorb information quickly.' }, { phrase: 'be absorbed in', cn: '全神贯注于', example: 'She was absorbed in her work.' }],
      examples: [{ en: 'Plants absorb carbon dioxide from the air.', cn: '植物从空气中吸收二氧化碳。', source: '2018 CET-4' }],
    },
    {
      word: 'abstract', phonetic: '/ˈæbstrækt/', difficulty: 4,
      meanings: [{ pos: 'adj.', def: 'existing in thought but not having a physical reality', cn: '抽象的' }, { pos: 'n.', def: 'a short summary of a longer text', cn: '摘要；概要' }],
      roots: [{ root: 'abs-', meaning: '离开', type: 'prefix', origin: 'Latin', related: ['absent', 'absorb'] }, { root: 'tract', meaning: '拉/拖', type: 'root', origin: 'Latin', related: ['attract', 'extract', 'contract'] }],
      collocations: [{ phrase: 'abstract concept', cn: '抽象概念', example: 'Justice is an abstract concept.' }, { phrase: 'abstract art', cn: '抽象艺术', example: 'He enjoys abstract art.' }],
      examples: [{ en: 'Beauty is an abstract concept that varies across cultures.', cn: '美是一个因文化而异的抽象概念。', source: '2020 CET-4' }],
    },
    {
      word: 'abundant', phonetic: '/əˈbʌndənt/', difficulty: 3,
      meanings: [{ pos: 'adj.', def: 'existing in large quantities; more than enough', cn: '充裕的；丰富的；大量的' }],
      roots: [{ root: 'ab-', meaning: '离开', type: 'prefix', origin: 'Latin', related: ['abroad', 'absorb'] }, { root: 'und', meaning: '波浪/涌', type: 'root', origin: 'Latin', related: ['inundate', 'redundant'] }],
      collocations: [{ phrase: 'abundant resources', cn: '丰富的资源', example: 'The country has abundant natural resources.' }, { phrase: 'abundant evidence', cn: '充分的证据', example: 'There is abundant evidence to support this.' }],
      examples: [{ en: 'The region has abundant natural resources.', cn: '该地区拥有丰富的自然资源。', source: '2019 CET-6' }],
    },
    {
      word: 'academic', phonetic: '/ˌækəˈdemɪk/', difficulty: 3,
      meanings: [{ pos: 'adj.', def: 'relating to education and scholarship', cn: '学术的；学业的' }, { pos: 'n.', def: 'a teacher or scholar at a university', cn: '大学教师；学者' }],
      roots: [{ root: 'academ-', meaning: '学园(柏拉图学园)', type: 'root', origin: 'Greek', related: ['academy'] }],
      collocations: [{ phrase: 'academic performance', cn: '学业表现', example: 'Her academic performance improved greatly.' }, { phrase: 'academic research', cn: '学术研究', example: 'He published several academic research papers.' }],
      examples: [{ en: 'The academic year starts in September.', cn: '学年从九月份开始。', source: '2021 CET-4' }],
    },
    {
      word: 'accelerate', phonetic: '/əkˈseləreɪt/', difficulty: 4,
      meanings: [{ pos: 'v.', def: 'to increase in speed', cn: '加速；促进' }],
      roots: [{ root: 'ac-', meaning: '向/加强', type: 'prefix', origin: 'Latin', related: ['accept', 'access'] }, { root: 'celer', meaning: '快', type: 'root', origin: 'Latin', related: ['decelerate'] }],
      collocations: [{ phrase: 'accelerate growth', cn: '加速增长', example: 'Technology can accelerate economic growth.' }, { phrase: 'accelerate the process', cn: '加速进程', example: 'We need to accelerate the process.' }],
      examples: [{ en: 'The car accelerated to 100 mph.', cn: '汽车加速到每小时100英里。', source: '2020 CET-4' }],
    },
    {
      word: 'access', phonetic: '/ˈækses/', difficulty: 3,
      meanings: [{ pos: 'n.', def: 'the means of approaching or entering a place', cn: '通道；使用权；接近' }, { pos: 'v.', def: 'to approach or enter', cn: '访问；进入' }],
      roots: [{ root: 'ac-', meaning: '向/到', type: 'prefix', origin: 'Latin', related: ['accept', 'accelerate'] }, { root: 'cess', meaning: '走/前进', type: 'root', origin: 'Latin', related: ['process', 'success', 'excess'] }],
      collocations: [{ phrase: 'have access to', cn: '有权使用', example: 'Students have access to the library.' }, { phrase: 'gain access', cn: '获得使用权', example: 'They gained access to the building.' }],
      examples: [{ en: 'Students have free access to the computer lab.', cn: '学生可以免费使用计算机实验室。', source: '2019 CET-4' }],
    },
    {
      word: 'accommodate', phonetic: '/əˈkɒmədeɪt/', difficulty: 4,
      meanings: [{ pos: 'v.', def: 'to provide lodging or sufficient space for', cn: '容纳；提供住宿；适应' }],
      roots: [{ root: 'ac-', meaning: '向', type: 'prefix', origin: 'Latin', related: ['accept', 'access'] }, { root: 'commod', meaning: '方便/适合', type: 'root', origin: 'Latin', related: ['commodity', 'commodious'] }],
      collocations: [{ phrase: 'accommodate guests', cn: '接待客人', example: 'The hotel can accommodate 200 guests.' }, { phrase: 'accommodate needs', cn: '满足需求', example: 'We will accommodate your needs.' }],
      examples: [{ en: 'The hall can accommodate 500 people.', cn: '这个大厅可以容纳500人。', source: '2020 CET-4' }],
    },
    {
      word: 'accomplish', phonetic: '/əˈkɒmplɪʃ/', difficulty: 3,
      meanings: [{ pos: 'v.', def: 'to achieve or complete successfully', cn: '完成；实现；达到' }],
      roots: [{ root: 'ac-', meaning: '加强', type: 'prefix', origin: 'Latin', related: ['accept', 'access'] }, { root: 'com-', meaning: '一起', type: 'prefix', origin: 'Latin', related: ['complete', 'compose'] }, { root: 'plish', meaning: '填满/完成', type: 'root', origin: 'Latin', related: ['complete', 'comply'] }],
      collocations: [{ phrase: 'accomplish a goal', cn: '实现目标', example: 'She accomplished all her goals.' }, { phrase: 'accomplish a task', cn: '完成任务', example: 'They accomplished the task on time.' }],
      examples: [{ en: 'She accomplished her goal of running a marathon.', cn: '她实现了跑马拉松的目标。', source: '2021 CET-4' }],
    },
    {
      word: 'account', phonetic: '/əˈkaʊnt/', difficulty: 2,
      meanings: [{ pos: 'n.', def: 'a report or description', cn: '账户；描述；解释' }, { pos: 'v.', def: 'to consider or regard', cn: '认为；解释' }],
      roots: [{ root: 'ac-', meaning: '向', type: 'prefix', origin: 'Latin', related: ['accept'] }, { root: 'count', meaning: '计算', type: 'root', origin: 'Latin', related: ['count', 'discount', 'recount'] }],
      collocations: [{ phrase: 'take into account', cn: '考虑到', example: 'Take the weather into account.' }, { phrase: 'account for', cn: '解释；占(比例)', example: 'Exports account for 40% of GDP.' }, { phrase: 'on account of', cn: '因为', example: 'The game was postponed on account of rain.' }],
      examples: [{ en: 'Please take all factors into account before making a decision.', cn: '做决定前请考虑所有因素。', source: '2018 CET-4' }],
    },
    {
      word: 'accurate', phonetic: '/ˈækjʊrət/', difficulty: 3,
      meanings: [{ pos: 'adj.', def: 'correct in all details; exact', cn: '准确的；精确的' }],
      roots: [{ root: 'ac-', meaning: '向/加强', type: 'prefix', origin: 'Latin', related: ['accept', 'access'] }, { root: 'cur', meaning: '关心/注意', type: 'root', origin: 'Latin', related: ['cure', 'curious', 'secure'] }],
      collocations: [{ phrase: 'accurate information', cn: '准确的信息', example: 'We need accurate information.' }, { phrase: 'accurate description', cn: '精确的描述', example: 'Give an accurate description.' }],
      examples: [{ en: 'The data must be accurate and up-to-date.', cn: '数据必须准确且最新。', source: '2019 CET-4' }],
    },
    {
      word: 'achieve', phonetic: '/əˈtʃiːv/', difficulty: 2,
      meanings: [{ pos: 'v.', def: 'to successfully reach a desired objective', cn: '实现；取得；达到' }],
      roots: [{ root: 'a-', meaning: '向', type: 'prefix', origin: 'Latin', related: ['arrive', 'assist'] }, { root: 'chieve', meaning: '头/首领(chief)', type: 'root', origin: 'French', related: ['chief', 'achievement'] }],
      collocations: [{ phrase: 'achieve success', cn: '取得成功', example: 'Hard work helps achieve success.' }, { phrase: 'achieve a goal', cn: '实现目标', example: 'We achieved our annual goal.' }],
      examples: [{ en: 'She achieved remarkable success in her career.', cn: '她在事业上取得了显著的成功。', source: '2020 CET-4' }],
    },
    {
      word: 'acknowledge', phonetic: '/əkˈnɒlɪdʒ/', difficulty: 4,
      meanings: [{ pos: 'v.', def: 'to accept or admit the existence or truth of', cn: '承认；致谢；确认收到' }],
      roots: [{ root: 'ac-', meaning: '向', type: 'prefix', origin: 'Latin', related: ['accept'] }, { root: 'knowledge', meaning: '知识/了解', type: 'root', origin: 'Old English', related: ['know', 'knowledge'] }],
      collocations: [{ phrase: 'acknowledge receipt', cn: '确认收到', example: 'Please acknowledge receipt of this email.' }, { phrase: 'widely acknowledged', cn: '广泛认可', example: 'He is widely acknowledged as an expert.' }],
      examples: [{ en: 'He acknowledged his mistake publicly.', cn: '他公开承认了自己的错误。', source: '2021 CET-4' }],
    },
    {
      word: 'acquire', phonetic: '/əˈkwaɪər/', difficulty: 3,
      meanings: [{ pos: 'v.', def: 'to obtain or get by effort', cn: '获得；取得；学到' }],
      roots: [{ root: 'ac-', meaning: '向', type: 'prefix', origin: 'Latin', related: ['accept', 'access'] }, { root: 'quire', meaning: '寻求/获取', type: 'root', origin: 'Latin', related: ['require', 'inquire', 'query'] }],
      collocations: [{ phrase: 'acquire knowledge', cn: '获取知识', example: 'He acquired extensive knowledge through reading.' }, { phrase: 'acquire skills', cn: '习得技能', example: 'You can acquire new skills online.' }],
      examples: [{ en: 'She acquired a taste for classical music during college.', cn: '她在大学期间开始喜欢古典音乐。', source: '2019 CET-4' }],
    },
    {
      word: 'adapt', phonetic: '/əˈdæpt/', difficulty: 3,
      meanings: [{ pos: 'v.', def: 'to adjust to new conditions', cn: '适应；改编' }],
      roots: [{ root: 'ad-', meaning: '向/去', type: 'prefix', origin: 'Latin', related: ['advance', 'admit'] }, { root: 'apt', meaning: '适合', type: 'root', origin: 'Latin', related: ['apt', 'aptitude'] }],
      collocations: [{ phrase: 'adapt to', cn: '适应...', example: 'You must adapt to the new environment.' }, { phrase: 'adapt from', cn: '改编自', example: 'The film was adapted from a novel.' }],
      examples: [{ en: 'It takes time to adapt to a new culture.', cn: '适应一种新文化需要时间。', source: '2020 CET-4' }],
    },
    {
      word: 'adequate', phonetic: '/ˈædɪkwət/', difficulty: 3,
      meanings: [{ pos: 'adj.', def: 'sufficient for a specific need or requirement', cn: '足够的；适当的；胜任的' }],
      roots: [{ root: 'ad-', meaning: '向', type: 'prefix', origin: 'Latin', related: ['adapt', 'admit'] }, { root: 'equ', meaning: '相等', type: 'root', origin: 'Latin', related: ['equal', 'equip', 'equivalent'] }],
      collocations: [{ phrase: 'adequate supply', cn: '充足的供应', example: 'There is an adequate supply of water.' }, { phrase: 'adequate preparation', cn: '充分准备', example: 'Adequate preparation is essential.' }],
      examples: [{ en: 'The funding is not adequate for the project.', cn: '项目资金不够充足。', source: '2021 CET-4' }],
    },
    {
      word: 'adjust', phonetic: '/əˈdʒʌst/', difficulty: 3,
      meanings: [{ pos: 'v.', def: 'to alter slightly to achieve a desired result', cn: '调整；适应；校准' }],
      roots: [{ root: 'ad-', meaning: '向', type: 'prefix', origin: 'Latin', related: ['adapt', 'admit'] }, { root: 'just', meaning: '公正/正确', type: 'root', origin: 'Latin', related: ['just', 'justice', 'justify'] }],
      collocations: [{ phrase: 'adjust to', cn: '适应', example: 'She quickly adjusted to her new role.' }, { phrase: 'adjust the settings', cn: '调整设置', example: 'Please adjust the settings accordingly.' }],
      examples: [{ en: 'You can adjust the temperature using this dial.', cn: '你可以用这个旋钮调节温度。', source: '2020 CET-4' }],
    },
  ];
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
