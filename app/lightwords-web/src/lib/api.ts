const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

class ApiClient {
  private token: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('token');
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
    }
  }

  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });

    if (res.status === 401) {
      this.clearToken();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      throw new Error('Unauthorized');
    }

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || 'Request failed');
    }

    return res.json();
  }

  // Auth
  async login(email: string, password: string) {
    const data = await this.request<{ user: any; token: string; refreshToken: string }>(
      '/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }
    );
    this.setToken(data.token);
    if (typeof window !== 'undefined') {
      localStorage.setItem('refreshToken', data.refreshToken);
    }
    return data;
  }

  async register(username: string, email: string, password: string) {
    const data = await this.request<{ user: any; token: string; refreshToken: string }>(
      '/auth/register', { method: 'POST', body: JSON.stringify({ username, email, password }) }
    );
    this.setToken(data.token);
    if (typeof window !== 'undefined') {
      localStorage.setItem('refreshToken', data.refreshToken);
    }
    return data;
  }

  // SMS Auth
  async sendSmsCode(phone: string, type: 'login' | 'register' | 'bind' = 'login') {
    return this.request<{ success: boolean; message: string; devCode?: string }>(
      '/auth/sms/send', { method: 'POST', body: JSON.stringify({ phone, type }) }
    );
  }

  async loginByPhone(phone: string, code: string) {
    const data = await this.request<{ user: any; token: string; refreshToken: string; isNewUser?: boolean }>(
      '/auth/sms/login', { method: 'POST', body: JSON.stringify({ phone, code }) }
    );
    this.setToken(data.token);
    if (typeof window !== 'undefined') {
      localStorage.setItem('refreshToken', data.refreshToken);
    }
    return data;
  }

  async registerByPhone(phone: string, code: string, username: string, password?: string) {
    const data = await this.request<{ user: any; token: string; refreshToken: string }>(
      '/auth/phone/register', { method: 'POST', body: JSON.stringify({ phone, code, username, password }) }
    );
    this.setToken(data.token);
    if (typeof window !== 'undefined') {
      localStorage.setItem('refreshToken', data.refreshToken);
    }
    return data;
  }

  // WeChat Auth
  async getWechatQrcode() {
    return this.request<{ configured: boolean; appId?: string; qrcodeUrl?: string; state?: string }>(
      '/auth/wechat/qrcode'
    );
  }

  async loginByWechat(code: string) {
    const data = await this.request<{ user: any; token: string; refreshToken: string; isNewUser?: boolean }>(
      '/auth/wechat/login', { method: 'POST', body: JSON.stringify({ code }) }
    );
    this.setToken(data.token);
    if (typeof window !== 'undefined') {
      localStorage.setItem('refreshToken', data.refreshToken);
    }
    return data;
  }

  // User
  getProfile() { return this.request<any>('/user/profile'); }
  updateSettings(settings: any) { return this.request<any>('/user/settings', { method: 'PATCH', body: JSON.stringify(settings) }); }
  getWeeklyStats() { return this.request<any[]>('/user/stats/weekly'); }
  setCurrentBook(bookId: string) { return this.request<any>('/user/current-book', { method: 'PUT', body: JSON.stringify({ bookId }) }); }
  getCurrentBook() { return this.request<any>('/user/current-book'); }

  // Words
  getWordBooks() { return this.request<any[]>('/words/books'); }
  getBookWords(bookId: string, page = 1) { return this.request<any>(`/words/books/${bookId}/words?page=${page}`); }
  getTodayWords() { return this.request<any[]>('/words/today'); }
  searchWords(query: string) { return this.request<any[]>(`/words/search?q=${query}`); }
  getWordDetail(id: string) { return this.request<any>(`/words/${id}`); }

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
  completeLevel(id: string, data: { stars: number; score: number; maxCombo: number }) {
    return this.request<any>(`/levels/${id}/complete`, { method: 'POST', body: JSON.stringify(data) });
  }

  // Checkin
  checkin(data: any) { return this.request<any>('/checkin', { method: 'POST', body: JSON.stringify(data) }); }
  getCheckinHistory(days = 30) { return this.request<any[]>(`/checkin/history?days=${days}`); }

  // Achievements
  getAchievements() { return this.request<any[]>('/achievements'); }
  checkAchievements() { return this.request<any>('/achievements/check', { method: 'POST' }); }

  // Typing (Qwerty Learner style)
  recordTypingSession(data: {
    bookId?: string; mode?: string; wordsTyped: number; correctWords: number;
    totalChars: number; correctChars: number; wpm: number; accuracy: number;
    maxCombo: number; duration: number; chapterIndex?: number;
  }) {
    return this.request<any>('/typing/session', { method: 'POST', body: JSON.stringify(data) });
  }
  getTypingStats() { return this.request<any>('/typing/stats'); }
  getChapterWords(bookId: string, chapter = 0, size = 20) {
    return this.request<any>(`/typing/chapter-words?bookId=${bookId}&chapter=${chapter}&size=${size}`);
  }
  getTypingLeaderboard(period = 'weekly') { return this.request<any[]>(`/typing/leaderboard?period=${period}`); }

  // Word Family (不背单词 style 派生树)
  getWordFamily(word: string) { return this.request<any>(`/word-family/${word}`); }
  getWordsByRoot(root: string) { return this.request<any>(`/word-family/root/${root}`); }
  getPopularRoots() { return this.request<any[]>('/word-family/explore/roots'); }

  // Listening
  getListeningExercises(mode = 'word', bookId?: string, limit = 10) {
    const params = new URLSearchParams({ mode, limit: String(limit) });
    if (bookId) params.set('bookId', bookId);
    return this.request<any>(`/listening/words?${params.toString()}`);
  }
  recordListeningSession(data: { mode: string; totalItems: number; correctItems: number; duration: number }) {
    return this.request<any>('/listening/session', { method: 'POST', body: JSON.stringify(data) });
  }
  getListeningStats() { return this.request<any>('/listening/stats'); }
}

export const api = new ApiClient();
