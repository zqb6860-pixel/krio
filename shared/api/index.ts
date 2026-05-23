import axios from 'axios';
import type { Word, WordBook, User, LearningRecord, DailyStats, Achievement, LeaderboardEntry } from '../types';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  timeout: 10000,
});

// ---- 用户 API ----
export const userApi = {
  login: (email: string, password: string) =>
    api.post<{ user: User; token: string }>('/auth/login', { email, password }),

  register: (data: { username: string; email: string; password: string }) =>
    api.post<{ user: User; token: string }>('/auth/register', data),

  getProfile: () => api.get<User>('/user/profile'),

  updateSettings: (settings: Partial<User['settings']>) =>
    api.patch<User>('/user/settings', settings),
};

// ---- 单词 API ----
export const wordApi = {
  getWordBooks: () => api.get<WordBook[]>('/wordbooks'),

  getWords: (bookId: string, page: number = 1, limit: number = 20) =>
    api.get<{ words: Word[]; total: number }>(`/wordbooks/${bookId}/words`, {
      params: { page, limit },
    }),

  getWordDetail: (wordId: string) => api.get<Word>(`/words/${wordId}`),

  searchWords: (query: string) =>
    api.get<Word[]>('/words/search', { params: { q: query } }),

  getTodayWords: () => api.get<Word[]>('/words/today'),
};

// ---- 学习记录 API ----
export const learningApi = {
  getRecords: (userId: string) =>
    api.get<LearningRecord[]>(`/learning/records/${userId}`),

  updateRecord: (record: Partial<LearningRecord> & { id: string }) =>
    api.put<LearningRecord>(`/learning/records/${record.id}`, record),

  getReviewWords: () => api.get<Word[]>('/learning/review'),

  getDailyStats: () => api.get<DailyStats>('/learning/stats/today'),

  getWeeklyStats: () => api.get<DailyStats[]>('/learning/stats/weekly'),

  checkin: () => api.post('/learning/checkin'),
};

// ---- 闯关 API ----
export const levelApi = {
  getPaths: () => api.get('/levels/paths'),

  getLevelDetail: (levelId: string) => api.get(`/levels/${levelId}`),

  completeLevel: (levelId: string, data: { stars: number; score: number }) =>
    api.post(`/levels/${levelId}/complete`, data),
};

// ---- 成就 API ----
export const achievementApi = {
  getAchievements: () => api.get<Achievement[]>('/achievements'),

  unlockAchievement: (achievementId: string) =>
    api.post(`/achievements/${achievementId}/unlock`),
};

// ---- 排行榜 API ----
export const leaderboardApi = {
  getLeaderboard: (type: string, period: string) =>
    api.get<LeaderboardEntry[]>('/leaderboard', { params: { type, period } }),
};

export default api;
