/**
 * 艾宾浩斯遗忘曲线算法实现
 * 根据用户的学习记录计算下次最优复习时间
 */

export interface MemoryData {
  easeFactor: number; // 难度因子 (1.3 - 2.5)
  interval: number; // 当前间隔(天)
  repetitions: number; // 重复次数
  lastReview: Date;
}

export type ReviewQuality = 0 | 1 | 2 | 3 | 4 | 5;
// 0 = 完全忘记, 1 = 答错但看到答案想起, 2 = 答错
// 3 = 答对但很犹豫, 4 = 答对稍有迟疑, 5 = 完全掌握

/**
 * SM-2 算法 - 计算下次复习时间
 * 基于 SuperMemo 的 SM-2 算法改进
 */
export function calculateNextReview(
  data: MemoryData,
  quality: ReviewQuality
): MemoryData {
  let { easeFactor, interval, repetitions } = data;

  // 更新难度因子
  easeFactor = Math.max(
    1.3,
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );

  if (quality < 3) {
    // 回答错误，重置
    repetitions = 0;
    interval = 1;
  } else {
    // 回答正确
    repetitions += 1;
    if (repetitions === 1) {
      interval = 1;
    } else if (repetitions === 2) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
  }

  return {
    easeFactor,
    interval,
    repetitions,
    lastReview: new Date(),
  };
}

/**
 * 计算下次复习日期
 */
export function getNextReviewDate(data: MemoryData): Date {
  const next = new Date(data.lastReview);
  next.setDate(next.getDate() + data.interval);
  return next;
}

/**
 * 计算记忆保持率 (0-100)
 * 基于遗忘曲线公式: R = e^(-t/S)
 * t = 距上次复习的时间(天)
 * S = 记忆稳定性(与interval相关)
 */
export function calculateRetention(data: MemoryData): number {
  const now = new Date();
  const daysSinceReview =
    (now.getTime() - data.lastReview.getTime()) / (1000 * 60 * 60 * 24);
  const stability = data.interval * data.easeFactor;
  const retention = Math.exp(-daysSinceReview / stability) * 100;
  return Math.max(0, Math.min(100, Math.round(retention)));
}

/**
 * 根据响应时间评估掌握质量
 */
export function evaluateQuality(
  correct: boolean,
  responseTimeMs: number
): ReviewQuality {
  if (!correct) {
    return responseTimeMs < 3000 ? 1 : 0;
  }
  if (responseTimeMs < 2000) return 5;
  if (responseTimeMs < 4000) return 4;
  return 3;
}

/**
 * 初始化新单词的记忆数据
 */
export function initMemoryData(): MemoryData {
  return {
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
    lastReview: new Date(),
  };
}

/**
 * 获取单词掌握等级描述
 */
export function getMasteryLabel(retention: number): string {
  if (retention >= 90) return '已掌握';
  if (retention >= 70) return '熟悉';
  if (retention >= 50) return '一般';
  if (retention >= 30) return '模糊';
  return '陌生';
}

/**
 * 计算连击奖励金币
 */
export function getComboBonus(combo: number): number {
  if (combo >= 20) return 50;
  if (combo >= 10) return 25;
  if (combo >= 5) return 10;
  return 0;
}
