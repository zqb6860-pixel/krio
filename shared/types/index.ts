// ============================================
// LightWords / 简词 - 共享类型定义
// ============================================

// ---- 用户相关 ----
export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  level: number;
  experience: number;
  streak: number; // 连续打卡天数
  coins: number;
  hearts: number; // 生命值
  createdAt: string;
  settings: UserSettings;
}

export interface UserSettings {
  dailyWordGoal: number; // 每日单词目标 5-100
  dailyTimeGoal: number; // 每日学习时长目标(分钟) 10-120
  weeklyDaysGoal: number; // 每周学习天数目标
  pronunciation: 'us' | 'uk'; // 默认发音
  theme: 'light' | 'dark'; // 界面主题
  fontSize: 'small' | 'medium' | 'large';
  reminderTime?: string; // 学习提醒时间
}

// ---- 单词相关 ----
export interface Word {
  id: string;
  word: string;
  phonetic: string;
  phoneticUs?: string;
  phoneticUk?: string;
  meanings: WordMeaning[];
  roots?: WordRoot[];
  collocations?: Collocation[];
  examples: Example[];
  images?: string[];
  audioUs?: string;
  audioUk?: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  tags: string[];
}

export interface WordMeaning {
  partOfSpeech: string; // 词性
  definition: string; // 英文释义
  translation: string; // 中文释义
}

export interface WordRoot {
  root: string;
  meaning: string;
  origin: string; // 来源(拉丁语、希腊语等)
  type: 'prefix' | 'suffix' | 'root';
  relatedWords: string[];
}

export interface Collocation {
  phrase: string;
  translation: string;
  example?: string;
}

export interface Example {
  sentence: string;
  translation: string;
  source: string; // 来源(电影/美剧/新闻/真题等)
  sourceYear?: string;
  audioUrl?: string;
}

// ---- 学习记录相关 ----
export interface LearningRecord {
  id: string;
  userId: string;
  wordId: string;
  status: WordStatus;
  masteryLevel: number; // 掌握度 0-100
  reviewCount: number;
  correctCount: number;
  incorrectCount: number;
  lastReviewAt: string;
  nextReviewAt: string; // 下次复习时间(基于遗忘曲线)
  firstLearnedAt: string;
  responseTime: number; // 平均响应时间(ms)
}

export type WordStatus = 'new' | 'learning' | 'reviewing' | 'mastered';

// ---- 词库相关 ----
export interface WordBook {
  id: string;
  name: string;
  description: string;
  category: WordBookCategory;
  wordCount: number;
  coverImage?: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  tags: string[];
}

export type WordBookCategory =
  | 'elementary' // 小学
  | 'middle_school' // 初中
  | 'high_school' // 高中
  | 'cet4' // 大学四级
  | 'cet6' // 大学六级
  | 'postgraduate' // 考研
  | 'toefl' // 托福
  | 'ielts' // 雅思
  | 'gre' // GRE
  | 'business' // 商务
  | 'technology' // 科技
  | 'medical' // 医学
  | 'legal' // 法律
  | 'travel' // 旅游
  | 'custom'; // 自定义

// ---- 闯关模式相关 ----
export interface Level {
  id: string;
  unitId: string;
  order: number;
  title: string;
  description: string;
  stars: 0 | 1 | 2 | 3; // 已获得星星数
  isLocked: boolean;
  exercises: Exercise[];
}

export interface Unit {
  id: string;
  pathId: string;
  order: number;
  title: string;
  description: string;
  levels: Level[];
  icon: string;
}

export interface LearningPath {
  id: string;
  name: string;
  description: string;
  category: 'vocabulary' | 'grammar' | 'dialogue' | 'exam';
  units: Unit[];
}

export interface Exercise {
  id: string;
  type: ExerciseType;
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation?: string;
  audioUrl?: string;
  imageUrl?: string;
  wordId?: string;
}

export type ExerciseType =
  | 'choose_translation' // 选择正确翻译
  | 'listen_choose' // 听音选词
  | 'spelling' // 单词拼写
  | 'sentence_order' // 句子排序
  | 'image_word' // 看图说词
  | 'fill_blank'; // 填空补全

// ---- 成就系统 ----
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'learning' | 'persistence' | 'skill' | 'collection' | 'hidden';
  requirement: number;
  currentProgress: number;
  isUnlocked: boolean;
  unlockedAt?: string;
}

// ---- 学习统计 ----
export interface DailyStats {
  date: string;
  wordsLearned: number;
  wordsReviewed: number;
  timeSpent: number; // 分钟
  correctRate: number; // 正确率
  streak: number;
  coinsEarned: number;
  experienceEarned: number;
}

export interface WeeklyStats {
  weekStart: string;
  weekEnd: string;
  totalWordsLearned: number;
  totalTimeSpent: number;
  averageCorrectRate: number;
  daysStudied: number;
  dailyStats: DailyStats[];
}

// ---- 社交相关 ----
export interface StudyBuddy {
  id: string;
  userId: string;
  buddyId: string;
  status: 'active' | 'pending' | 'ended';
  startedAt: string;
  sharedDays: number;
}

export interface StudyGroup {
  id: string;
  name: string;
  leaderId: string;
  members: string[];
  maxMembers: number;
  dailyGoal: number;
  streak: number;
  createdAt: string;
}

// ---- 复习系统 ----
export interface ReviewSession {
  id: string;
  userId: string;
  type: 'quick' | 'deep' | 'exam_prep';
  words: string[];
  completedWords: string[];
  startedAt: string;
  completedAt?: string;
  correctRate: number;
}

// ---- 排行榜 ----
export interface LeaderboardEntry {
  userId: string;
  username: string;
  avatar?: string;
  score: number;
  rank: number;
}

export type LeaderboardType = 'friends' | 'national' | 'vocabulary';
export type LeaderboardPeriod = 'weekly' | 'monthly' | 'all_time';
