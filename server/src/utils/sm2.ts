/**
 * SM-2 Spaced Repetition Algorithm
 * Calculates next review interval based on user performance
 */

export type ReviewQuality = 0 | 1 | 2 | 3 | 4 | 5;

export interface SM2Result {
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReviewAt: Date;
  masteryLevel: number;
}

export function calculateSM2(
  quality: ReviewQuality,
  easeFactor: number,
  interval: number,
  repetitions: number
): SM2Result {
  // Update ease factor
  let newEF = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  newEF = Math.max(1.3, newEF);

  let newInterval: number;
  let newReps: number;

  if (quality < 3) {
    // Failed - reset
    newReps = 0;
    newInterval = 1;
  } else {
    // Passed
    newReps = repetitions + 1;
    if (newReps === 1) {
      newInterval = 1;
    } else if (newReps === 2) {
      newInterval = 6;
    } else {
      newInterval = Math.round(interval * newEF);
    }
  }

  // Calculate next review date
  const nextReviewAt = new Date();
  nextReviewAt.setDate(nextReviewAt.getDate() + newInterval);

  // Calculate mastery level (0-100)
  let masteryLevel: number;
  if (quality >= 4 && newReps >= 4) {
    masteryLevel = Math.min(100, 70 + newReps * 5);
  } else if (quality >= 3) {
    masteryLevel = Math.min(80, 30 + newReps * 10);
  } else {
    masteryLevel = Math.max(0, 20 - (5 - quality) * 10);
  }

  return {
    easeFactor: newEF,
    interval: newInterval,
    repetitions: newReps,
    nextReviewAt,
    masteryLevel,
  };
}

/**
 * Convert response time + correctness to quality score
 */
export function evaluateQuality(correct: boolean, responseTimeMs: number): ReviewQuality {
  if (!correct) {
    return responseTimeMs < 3000 ? 1 : 0;
  }
  if (responseTimeMs < 2000) return 5;
  if (responseTimeMs < 4000) return 4;
  return 3;
}

/**
 * Determine word status based on mastery level
 */
export function getWordStatus(masteryLevel: number): string {
  if (masteryLevel >= 90) return 'mastered';
  if (masteryLevel >= 50) return 'reviewing';
  if (masteryLevel > 0) return 'learning';
  return 'new';
}
