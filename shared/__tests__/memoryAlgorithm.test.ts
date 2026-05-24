import { describe, it, expect } from 'vitest';
import {
  calculateNextReview,
  getNextReviewDate,
  initMemoryData,
  getMasteryLabel,
  getComboBonus,
} from '../utils/memoryAlgorithm';

describe('calculateNextReview', () => {
  it('should reset on quality < 3', () => {
    const data = { easeFactor: 2.5, interval: 10, repetitions: 5, lastReview: new Date() };
    const result = calculateNextReview(data, 1);
    expect(result.repetitions).toBe(0);
    expect(result.interval).toBe(1);
  });

  it('should increment on quality >= 3', () => {
    const data = initMemoryData();
    const result = calculateNextReview(data, 4);
    expect(result.repetitions).toBe(1);
    expect(result.interval).toBe(1);
  });

  it('should set interval to 6 on second pass', () => {
    const data = { easeFactor: 2.5, interval: 1, repetitions: 1, lastReview: new Date() };
    const result = calculateNextReview(data, 4);
    expect(result.repetitions).toBe(2);
    expect(result.interval).toBe(6);
  });

  it('should not let ease factor drop below 1.3', () => {
    const data = { easeFactor: 1.3, interval: 1, repetitions: 0, lastReview: new Date() };
    const result = calculateNextReview(data, 0);
    expect(result.easeFactor).toBeGreaterThanOrEqual(1.3);
  });
});

describe('getNextReviewDate', () => {
  it('should return a date interval days in the future', () => {
    const data = {
      easeFactor: 2.5,
      interval: 5,
      repetitions: 2,
      lastReview: new Date('2026-01-01'),
    };
    const next = getNextReviewDate(data);
    expect(next.getDate()).toBe(6);
  });
});

describe('initMemoryData', () => {
  it('should return default values', () => {
    const data = initMemoryData();
    expect(data.easeFactor).toBe(2.5);
    expect(data.interval).toBe(0);
    expect(data.repetitions).toBe(0);
  });
});

describe('getMasteryLabel', () => {
  it('should return correct labels', () => {
    expect(getMasteryLabel(95)).toBe('已掌握');
    expect(getMasteryLabel(75)).toBe('熟悉');
    expect(getMasteryLabel(55)).toBe('一般');
    expect(getMasteryLabel(35)).toBe('模糊');
    expect(getMasteryLabel(10)).toBe('陌生');
  });
});

describe('getComboBonus', () => {
  it('should return correct bonus tiers', () => {
    expect(getComboBonus(25)).toBe(50);
    expect(getComboBonus(15)).toBe(25);
    expect(getComboBonus(7)).toBe(10);
    expect(getComboBonus(3)).toBe(0);
  });
});
