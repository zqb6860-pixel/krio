import { create } from 'zustand';
import type { User, UserSettings, DailyStats, Achievement } from '../types';

interface UserState {
  user: User | null;
  isLoggedIn: boolean;
  dailyStats: DailyStats | null;
  achievements: Achievement[];
  
  // Actions
  setUser: (user: User) => void;
  logout: () => void;
  updateSettings: (settings: Partial<UserSettings>) => void;
  addCoins: (amount: number) => void;
  addExperience: (amount: number) => void;
  loseHeart: () => void;
  restoreHeart: () => void;
  incrementStreak: () => void;
  setDailyStats: (stats: DailyStats) => void;
  unlockAchievement: (achievementId: string) => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  isLoggedIn: false,
  dailyStats: null,
  achievements: [],

  setUser: (user) => set({ user, isLoggedIn: true }),
  
  logout: () => set({ user: null, isLoggedIn: false }),
  
  updateSettings: (settings) =>
    set((state) => ({
      user: state.user
        ? { ...state.user, settings: { ...state.user.settings, ...settings } }
        : null,
    })),
  
  addCoins: (amount) =>
    set((state) => ({
      user: state.user
        ? { ...state.user, coins: state.user.coins + amount }
        : null,
    })),
  
  addExperience: (amount) =>
    set((state) => {
      if (!state.user) return state;
      const newExp = state.user.experience + amount;
      const newLevel = Math.floor(newExp / 100) + 1;
      return {
        user: { ...state.user, experience: newExp, level: newLevel },
      };
    }),
  
  loseHeart: () =>
    set((state) => ({
      user: state.user
        ? { ...state.user, hearts: Math.max(0, state.user.hearts - 1) }
        : null,
    })),
  
  restoreHeart: () =>
    set((state) => ({
      user: state.user
        ? { ...state.user, hearts: Math.min(5, state.user.hearts + 1) }
        : null,
    })),
  
  incrementStreak: () =>
    set((state) => ({
      user: state.user
        ? { ...state.user, streak: state.user.streak + 1 }
        : null,
    })),
  
  setDailyStats: (stats) => set({ dailyStats: stats }),
  
  unlockAchievement: (achievementId) =>
    set((state) => ({
      achievements: state.achievements.map((a) =>
        a.id === achievementId
          ? { ...a, isUnlocked: true, unlockedAt: new Date().toISOString() }
          : a
      ),
    })),
}));
