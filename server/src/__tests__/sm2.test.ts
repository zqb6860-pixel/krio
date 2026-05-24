import { describe, it, expect } from 'vitest';
import { calculateSM2, evaluateQuality, getWordStatus } from '../utils/sm2';

describe('calculateSM2', () => {
  it('should reset on quality < 3 (failed)', () => {
    const result = calculateSM2(1, 2.5, 10, 5);
    expect(result.repetitions).toBe(0);
    expect(result.interval).toBe(1);
    expect(result.easeFactor).toBeLessThan(2.5);
  });

  it('should increment repetitions on quality >= 3 (passed)', () => {
    const result = calculateSM2(4, 2.5, 1, 0);
    expect(result.repetitions).toBe(1);
    expect(result.interval).toBe(1);
  });

  it('should set interval to 6 on second repetition', () => {
    const result = calculateSM2(4, 2.5, 1, 1);
    expect(result.repetitions).toBe(2);
    expect(result.interval).toBe(6);
  });

  it('should calculate interval using ease factor on third+ repetition', () => {
    const result = calculateSM2(4, 2.5, 6, 2);
    expect(result.repetitions).toBe(3);
    expect(result.interval).toBe(Math.round(6 * result.easeFactor));
  });

  it('should not let ease factor drop below 1.3', () => {
    const result = calculateSM2(0, 1.3, 1, 0);
    expect(result.easeFactor).toBeGreaterThanOrEqual(1.3);
  });

  it('should return a future nextReviewAt', () => {
    const result = calculateSM2(4, 2.5, 1, 0);
    expect(result.nextReviewAt.getTime()).toBeGreaterThan(Date.now());
  });

  it('should calculate mastery level correctly for mastered words', () => {
    const result = calculateSM2(5, 2.5, 10, 4);
    expect(result.masteryLevel).toBeGreaterThanOrEqual(70);
  });

  it('should calculate low mastery for failed quality', () => {
    const result = calculateSM2(1, 2.5, 10, 4);
    expect(result.masteryLevel).toBeLessThanOrEqual(20);
  });
});

describe('evaluateQuality', () => {
  it('should return 0 for incorrect with slow response', () => {
    expect(evaluateQuality(false, 4000)).toBe(0);
  });

  it('should return 1 for incorrect with fast response', () => {
    expect(evaluateQuality(false, 2000)).toBe(1);
  });

  it('should return 5 for correct with very fast response', () => {
    expect(evaluateQuality(true, 1000)).toBe(5);
  });

  it('should return 4 for correct with moderate response', () => {
    expect(evaluateQuality(true, 3000)).toBe(4);
  });

  it('should return 3 for correct with slow response', () => {
    expect(evaluateQuality(true, 5000)).toBe(3);
  });
});

describe('getWordStatus', () => {
  it('should return mastered for high mastery', () => {
    expect(getWordStatus(95)).toBe('mastered');
  });

  it('should return reviewing for medium mastery', () => {
    expect(getWordStatus(60)).toBe('reviewing');
  });

  it('should return learning for low mastery', () => {
    expect(getWordStatus(20)).toBe('learning');
  });

  it('should return new for zero mastery', () => {
    expect(getWordStatus(0)).toBe('new');
  });
});
