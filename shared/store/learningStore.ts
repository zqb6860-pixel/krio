import { create } from 'zustand';
import type { LearningRecord, ReviewSession, Level } from '../types';

interface LearningState {
  // 当前学习会话
  currentSession: {
    wordsLearned: number;
    wordsReviewed: number;
    correctAnswers: number;
    totalAnswers: number;
    combo: number; // 连击数
    maxCombo: number;
    startTime: number;
  } | null;
  
  // 学习记录
  learningRecords: LearningRecord[];
  
  // 当前复习会话
  currentReview: ReviewSession | null;
  
  // 待复习单词数
  pendingReviewCount: number;
  
  // 当前关卡
  currentLevel: Level | null;
  currentExerciseIndex: number;
  
  // Actions
  startSession: () => void;
  endSession: () => void;
  recordAnswer: (correct: boolean) => void;
  incrementCombo: () => void;
  resetCombo: () => void;
  setLearningRecords: (records: LearningRecord[]) => void;
  updateRecord: (record: LearningRecord) => void;
  setPendingReviewCount: (count: number) => void;
  setCurrentLevel: (level: Level | null) => void;
  nextExercise: () => void;
  resetExerciseIndex: () => void;
}

export const useLearningStore = create<LearningState>((set) => ({
  currentSession: null,
  learningRecords: [],
  currentReview: null,
  pendingReviewCount: 0,
  currentLevel: null,
  currentExerciseIndex: 0,

  startSession: () =>
    set({
      currentSession: {
        wordsLearned: 0,
        wordsReviewed: 0,
        correctAnswers: 0,
        totalAnswers: 0,
        combo: 0,
        maxCombo: 0,
        startTime: Date.now(),
      },
    }),

  endSession: () => set({ currentSession: null }),

  recordAnswer: (correct) =>
    set((state) => {
      if (!state.currentSession) return state;
      const session = { ...state.currentSession };
      session.totalAnswers += 1;
      if (correct) {
        session.correctAnswers += 1;
        session.combo += 1;
        session.maxCombo = Math.max(session.maxCombo, session.combo);
      } else {
        session.combo = 0;
      }
      return { currentSession: session };
    }),

  incrementCombo: () =>
    set((state) => {
      if (!state.currentSession) return state;
      const combo = state.currentSession.combo + 1;
      return {
        currentSession: {
          ...state.currentSession,
          combo,
          maxCombo: Math.max(state.currentSession.maxCombo, combo),
        },
      };
    }),

  resetCombo: () =>
    set((state) => {
      if (!state.currentSession) return state;
      return {
        currentSession: { ...state.currentSession, combo: 0 },
      };
    }),

  setLearningRecords: (records) => set({ learningRecords: records }),

  updateRecord: (record) =>
    set((state) => ({
      learningRecords: state.learningRecords.map((r) =>
        r.id === record.id ? record : r
      ),
    })),

  setPendingReviewCount: (count) => set({ pendingReviewCount: count }),

  setCurrentLevel: (level) => set({ currentLevel: level, currentExerciseIndex: 0 }),

  nextExercise: () =>
    set((state) => ({ currentExerciseIndex: state.currentExerciseIndex + 1 })),

  resetExerciseIndex: () => set({ currentExerciseIndex: 0 }),
}));
