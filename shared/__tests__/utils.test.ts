import { describe, it, expect } from 'vitest';
import {
  formatStudyTime,
  formatNumber,
  calculateAccuracy,
  getTodayStr,
  isToday,
  getLevelStars,
  getStreakBadge,
} from '../utils/index';

describe('formatStudyTime', () => {
  it('should format minutes only', () => {
    expect(formatStudyTime(30)).toBe('30分钟');
  });

  it('should format hours and minutes', () => {
    expect(formatStudyTime(90)).toBe('1小时30分钟');
  });

  it('should format exact hours', () => {
    expect(formatStudyTime(120)).toBe('2小时');
  });
});

describe('formatNumber', () => {
  it('should format small numbers', () => {
    expect(formatNumber(500)).toBe('500');
  });

  it('should format thousands', () => {
    expect(formatNumber(1500)).toBe('1.5k');
  });

  it('should format ten thousands', () => {
    expect(formatNumber(25000)).toBe('2.5万');
  });
});

describe('calculateAccuracy', () => {
  it('should calculate percentage', () => {
    expect(calculateAccuracy(8, 10)).toBe(80);
  });

  it('should return 0 for zero total', () => {
    expect(calculateAccuracy(0, 0)).toBe(0);
  });

  it('should return 100 for all correct', () => {
    expect(calculateAccuracy(5, 5)).toBe(100);
  });
});

describe('getTodayStr', () => {
  it('should return YYYY-MM-DD format', () => {
    const result = getTodayStr();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('isToday', () => {
  it('should return true for today', () => {
    expect(isToday(getTodayStr())).toBe(true);
  });

  it('should return false for yesterday', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(isToday(yesterday.toISOString().split('T')[0])).toBe(false);
  });
});

describe('getLevelStars', () => {
  it('should return 3 for 100%', () => {
    expect(getLevelStars(100)).toBe(3);
  });

  it('should return 2 for 80-99%', () => {
    expect(getLevelStars(85)).toBe(2);
  });

  it('should return 1 for 60-79%', () => {
    expect(getLevelStars(65)).toBe(1);
  });

  it('should return 0 for below 60%', () => {
    expect(getLevelStars(50)).toBe(0);
  });
});

describe('getStreakBadge', () => {
  it('should return badge for 100+ days', () => {
    expect(getStreakBadge(100)).toBe('百日坚持');
  });

  it('should return badge for 30+ days', () => {
    expect(getStreakBadge(30)).toBe('月度之星');
  });

  it('should return badge for 7+ days', () => {
    expect(getStreakBadge(7)).toBe('周学达人');
  });

  it('should return null for less than 7 days', () => {
    expect(getStreakBadge(3)).toBeNull();
  });
});
