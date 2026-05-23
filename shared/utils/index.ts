export * from './memoryAlgorithm';

/**
 * 格式化学习时间
 */
export function formatStudyTime(minutes: number): string {
  if (minutes < 60) return `${minutes}分钟`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`;
}

/**
 * 格式化数字(超过1000显示k)
 */
export function formatNumber(num: number): string {
  if (num >= 10000) return `${(num / 10000).toFixed(1)}万`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
  return num.toString();
}

/**
 * 计算正确率
 */
export function calculateAccuracy(correct: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((correct / total) * 100);
}

/**
 * 获取今天的日期字符串 YYYY-MM-DD
 */
export function getTodayStr(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * 判断是否是今天
 */
export function isToday(dateStr: string): boolean {
  return dateStr === getTodayStr();
}

/**
 * 生成随机ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * 关卡评级
 */
export function getLevelStars(correctRate: number): 0 | 1 | 2 | 3 {
  if (correctRate >= 100) return 3;
  if (correctRate >= 80) return 2;
  if (correctRate >= 60) return 1;
  return 0;
}

/**
 * 打卡徽章判断
 */
export function getStreakBadge(streak: number): string | null {
  if (streak >= 100) return '百日坚持';
  if (streak >= 30) return '月度之星';
  if (streak >= 7) return '周学达人';
  return null;
}
