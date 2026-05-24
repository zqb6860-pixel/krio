import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const API_BASE =
  (Constants.expoConfig?.extra?.apiUrl as string) ||
  process.env.EXPO_PUBLIC_API_URL ||
  'http://10.0.2.2:3001/api';

class ApiClient {
  private token: string | null = null;

  async init() {
    this.token = await AsyncStorage.getItem('token');
  }

  async setToken(token: string) {
    this.token = token;
    await AsyncStorage.setItem('token', token);
  }

  async clearToken() {
    this.token = null;
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('refreshToken');
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;

    const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

    if (res.status === 401) {
      await this.clearToken();
      throw new Error('Unauthorized');
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(err.error || 'Request failed');
    }
    return res.json();
  }

  // Auth
  async login(email: string, password: string) {
    const data = await this.request<any>('/auth/login', {
      method: 'POST', body: JSON.stringify({ email, password }),
    });
    await this.setToken(data.token);
    await AsyncStorage.setItem('refreshToken', data.refreshToken);
    return data;
  }

  async register(username: string, email: string, password: string) {
    const data = await this.request<any>('/auth/register', {
      method: 'POST', body: JSON.stringify({ username, email, password }),
    });
    await this.setToken(data.token);
    return data;
  }

  // User
  getProfile() { return this.request<any>('/user/profile'); }
  updateSettings(s: any) { return this.request<any>('/user/settings', { method: 'PATCH', body: JSON.stringify(s) }); }
  getWeeklyStats() { return this.request<any[]>('/user/stats/weekly'); }

  // Words
  getWordBooks() { return this.request<any[]>('/words/books'); }
  getTodayWords() { return this.request<any[]>('/words/today'); }
  searchWords(q: string) { return this.request<any[]>(`/words/search?q=${q}`); }

  // Learning
  recordAnswer(wordId: string, correct: boolean, responseTimeMs: number) {
    return this.request<any>('/learning/record', {
      method: 'POST', body: JSON.stringify({ wordId, correct, responseTimeMs }),
    });
  }
  getReviewWords(limit = 20) { return this.request<any>(`/learning/review?limit=${limit}`); }
  getLearningStats() { return this.request<any>('/learning/stats'); }
  getDistribution() { return this.request<any>('/learning/distribution'); }

  // Levels
  getLearningPaths() { return this.request<any[]>('/levels/paths'); }
  getLevelDetail(id: string) { return this.request<any>(`/levels/${id}`); }
  completeLevel(id: string, data: any) {
    return this.request<any>(`/levels/${id}/complete`, { method: 'POST', body: JSON.stringify(data) });
  }

  // Checkin
  checkin(data: any) { return this.request<any>('/checkin', { method: 'POST', body: JSON.stringify(data) }); }
  getCheckinHistory(days = 30) { return this.request<any[]>(`/checkin/history?days=${days}`); }

  // Achievements
  getAchievements() { return this.request<any[]>('/achievements'); }
}

export const api = new ApiClient();
