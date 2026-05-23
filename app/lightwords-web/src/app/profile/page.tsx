'use client';

import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { useApi } from '@/hooks/useApi';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { data: stats } = useApi(() => api.getLearningStats(), []);
  const { data: achievements } = useApi(() => api.getAchievements(), []);
  const { data: wordBooks } = useApi(() => api.getWordBooks(), []);
  const { data: distribution } = useApi(() => api.getDistribution(), []);

  const totalWords = (stats?.total || 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* User Header */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-400 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-lg">
            {user?.username?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-slate-800">{user?.username || '用户'}</h2>
            <p className="text-sm text-slate-500 mt-1">Lv.{user?.level || 1} · {user?.email}</p>
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-1.5">
                <span className="text-orange-500">🔥</span>
                <span className="text-sm font-medium text-slate-700">连续 {user?.streak || 0} 天</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-yellow-500">💰</span>
                <span className="text-sm font-medium text-slate-700">{user?.coins || 0} 金币</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-blue-500">📚</span>
                <span className="text-sm font-medium text-slate-700">{totalWords} 词汇</span>
              </div>
            </div>
          </div>
          <button onClick={logout} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm text-slate-600 transition-colors">
            退出登录
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: '累计学习', value: totalWords, unit: '单词', icon: '📖' },
          { label: '已掌握', value: stats?.mastered || 0, unit: '单词', icon: '✅' },
          { label: '学习中', value: stats?.learning || 0, unit: '单词', icon: '📝' },
          { label: '待复习', value: stats?.pendingReview || 0, unit: '单词', icon: '🔄' },
        ].map((stat) => (
          <div key={stat.label} className="glass-card p-4 text-center">
            <span className="text-2xl">{stat.icon}</span>
            <p className="text-xl font-bold text-slate-800 mt-2">{stat.value}</p>
            <p className="text-xs text-slate-500">{stat.label} · {stat.unit}</p>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mastery Distribution */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">📊 掌握度分布</h3>
          {distribution ? (
            <div className="space-y-3">
              {[
                { name: '已掌握', score: distribution.mastered || 0, icon: '✅', color: '#10b981' },
                { name: '熟悉', score: distribution.familiar || 0, icon: '📗', color: '#3b82f6' },
                { name: '模糊', score: distribution.vague || 0, icon: '🤔', color: '#f59e0b' },
                { name: '陌生', score: distribution.unknown || 0, icon: '❓', color: '#ef4444' },
              ].map((item) => {
                const total = (distribution.mastered || 0) + (distribution.familiar || 0) + (distribution.vague || 0) + (distribution.unknown || 0);
                const pct = total > 0 ? Math.round((item.score / total) * 100) : 0;
                return (
                  <div key={item.name} className="flex items-center gap-3">
                    <span className="text-xl w-8">{item.icon}</span>
                    <span className="text-sm text-slate-700 w-12">{item.name}</span>
                    <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: item.color }} />
                    </div>
                    <span className="text-sm font-bold text-slate-700 w-10 text-right">{item.score}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-slate-400 text-sm text-center py-6">暂无数据</p>
          )}
        </div>

        {/* Achievements */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-800">🏆 成就墙</h3>
            <span className="text-xs text-slate-500">
              {achievements?.filter((a: any) => a.isUnlocked).length || 0}/{achievements?.length || 0} 已解锁
            </span>
          </div>
          {achievements && achievements.length > 0 ? (
            <div className="grid grid-cols-3 gap-3">
              {achievements.map((ach: any) => (
                <div key={ach.id} className={`p-3 rounded-xl text-center transition-all ${ach.isUnlocked ? 'bg-gradient-to-b from-yellow-50 to-orange-50 border border-yellow-200' : 'bg-slate-50 opacity-50'}`}>
                  <span className="text-2xl">{ach.icon}</span>
                  <p className="text-xs font-medium text-slate-700 mt-1">{ach.name}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{ach.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 text-sm text-center py-6">暂无成就数据</p>
          )}
        </div>
      </div>

      {/* Word Books */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-800">📖 词库管理</h3>
        </div>
        {wordBooks && wordBooks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {wordBooks.map((book: any) => (
              <div key={book.id} className="p-4 rounded-xl border-2 border-slate-100 hover:border-slate-200 hover:shadow-md transition-all">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📚</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{book.name}</p>
                    <p className="text-xs text-slate-500">{book.wordCount} 词 · 难度 {'⭐'.repeat(book.difficulty)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-400 text-sm text-center py-6">暂无词库数据</p>
        )}
      </div>
    </div>
  );
}
