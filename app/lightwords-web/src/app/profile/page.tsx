'use client';

import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { useApi } from '@/hooks/useApi';
import Link from 'next/link';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { data: stats } = useApi(() => api.getLearningStats(), []);
  const { data: achievements } = useApi(() => api.getAchievements(), []);
  const { data: wordBooks } = useApi(() => api.getWordBooks(), []);
  const { data: checkins } = useApi(() => api.getCheckinHistory(60), []);

  const totalWords = stats?.total || 0;
  const streak = user?.streak || 0;

  // 本月打卡天数
  const today = new Date();
  const monthCheckins = (checkins || []).filter((c: any) => {
    const d = c.date || '';
    return d.startsWith(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`);
  }).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* User Header Card */}
      <div className="glass-card overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
          <div className="relative z-10 flex items-center gap-6">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-lg ring-4 ring-white/20">
              {user?.username?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{user?.username || '用户'}</h2>
              <p className="text-white/70 text-sm mt-0.5">{user?.email || user?.phone || ''}</p>
              {/* Experience bar */}
              <div className="mt-3 max-w-xs">
                <div className="flex justify-between text-xs text-white/60 mb-1">
                  <span>Lv.{user?.level || 1} · {user?.experience || 0} XP</span>
                  <span>下一级 {((user?.level || 1)) * 100} XP</span>
                </div>
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-white/80 rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(100, ((user?.experience || 0) % 100))}%` }} />
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Link href="/settings" className="px-4 py-2 bg-white/15 hover:bg-white/25 rounded-xl text-sm transition-colors text-center backdrop-blur-sm">
                ⚙️ 设置
              </Link>
              <button onClick={logout} className="px-4 py-2 bg-white/10 hover:bg-red-500/50 rounded-xl text-sm transition-colors">
                退出登录
              </button>
            </div>
          </div>
        </div>
        {/* Quick stats bar */}
        <div className="p-4 flex items-center justify-around border-t border-slate-100 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50">
          <QuickStat icon="🔥" value={streak} label="连续天数" color="text-orange-500" />
          <div className="w-px h-8 bg-slate-200 dark:bg-slate-700" />
          <QuickStat icon="💰" value={user?.coins || 0} label="金币" color="text-yellow-500" />
          <div className="w-px h-8 bg-slate-200 dark:bg-slate-700" />
          <QuickStat icon="❤️" value={user?.hearts || 5} label="生命" color="text-red-500" />
          <div className="w-px h-8 bg-slate-200 dark:bg-slate-700" />
          <QuickStat icon="📚" value={totalWords} label="总词汇" color="text-blue-500" />
        </div>
      </div>


      {/* 打卡激励 + 成就 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 打卡激励 */}
        <div className="glass-card p-6 card-hover">
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-4">🔥 打卡激励</h3>
          <StreakPanel streak={streak} />
        </div>

        {/* Achievements */}
        <div className="glass-card p-6 card-hover">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">🏆 成就墙</h3>
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {achievements?.filter((a: any) => a.isUnlocked).length || 0}/{achievements?.length || 0}
            </span>
          </div>
          {achievements && achievements.length > 0 ? (
            <div className="grid grid-cols-5 gap-2">
              {achievements.map((ach: any) => (
                <div key={ach.id} className={`p-2.5 rounded-xl text-center transition-all ${
                  ach.isUnlocked
                    ? 'bg-gradient-to-b from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800 opacity-40'
                }`} title={`${ach.name}: ${ach.description}`}>
                  <span className="text-xl">{ach.icon}</span>
                  <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-0.5 truncate">{ach.name}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 dark:text-slate-500 text-sm text-center py-6">暂无成就数据</p>
          )}
        </div>
      </div>


      {/* 学习数据概览 */}
      <div className="glass-card p-6 card-hover">
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-4">📊 学习数据</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <DataCard label="累计学习" value={`${totalWords}`} unit="词" icon="📖" />
          <DataCard label="已掌握" value={`${stats?.mastered || 0}`} unit="词" icon="✅" />
          <DataCard label="学习中" value={`${stats?.learning || 0}`} unit="词" icon="📝" />
          <DataCard label="本月打卡" value={`${monthCheckins}`} unit="天" icon="📅" />
        </div>
      </div>


      {/* Word Books */}
      <div className="glass-card p-6 card-hover">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">📖 我的词库</h3>
          <Link href="/books" className="text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400">
            管理词库 →
          </Link>
        </div>
        {wordBooks && wordBooks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {wordBooks.slice(0, 6).map((book: any) => (
              <div key={book.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-700 transition-colors">
                <span className="text-2xl">📚</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{book.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{book.wordCount} 词 · {'⭐'.repeat(Math.min(book.difficulty, 5))}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-400 dark:text-slate-500 text-sm text-center py-6">暂无词库</p>
        )}
      </div>

      {/* 快捷操作 */}
      <div className="glass-card p-6 card-hover">
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-4">⚡ 快捷操作</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Link href="/settings" className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-center hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors border border-slate-100 dark:border-slate-700">
            <span className="text-2xl block mb-1">⚙️</span>
            <span className="text-xs text-slate-600 dark:text-slate-300">学习设置</span>
          </Link>
          <Link href="/books" className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-center hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors border border-slate-100 dark:border-slate-700">
            <span className="text-2xl block mb-1">📚</span>
            <span className="text-xs text-slate-600 dark:text-slate-300">切换词库</span>
          </Link>
          <Link href="/review" className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-center hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors border border-slate-100 dark:border-slate-700">
            <span className="text-2xl block mb-1">🔄</span>
            <span className="text-xs text-slate-600 dark:text-slate-300">去复习</span>
          </Link>
          <Link href="/challenge" className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-center hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors border border-slate-100 dark:border-slate-700">
            <span className="text-2xl block mb-1">🎮</span>
            <span className="text-xs text-slate-600 dark:text-slate-300">闯关挑战</span>
          </Link>
        </div>
      </div>
    </div>
  );
}


// ===== Components =====

function QuickStat({ icon, value, label, color }: { icon: string; value: number | string; label: string; color: string }) {
  return (
    <div className="text-center px-3">
      <div className="flex items-center justify-center gap-1.5">
        <span className="text-lg">{icon}</span>
        <span className={`text-lg font-bold ${color}`}>{value}</span>
      </div>
      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{label}</p>
    </div>
  );
}

function DataCard({ label, value, unit, icon }: { label: string; value: string; unit: string; icon: string }) {
  return (
    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-center border border-slate-100 dark:border-slate-700">
      <span className="text-2xl block mb-2">{icon}</span>
      <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{value}<span className="text-sm font-normal text-slate-500 dark:text-slate-400 ml-0.5">{unit}</span></p>
      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{label}</p>
    </div>
  );
}

function StreakPanel({ streak }: { streak: number }) {
  const milestones = [
    { days: 7, label: '7天', icon: '🌟', reward: '新手坚持' },
    { days: 14, label: '14天', icon: '💎', reward: '习惯养成' },
    { days: 30, label: '30天', icon: '🏆', reward: '月度达人' },
    { days: 50, label: '50天', icon: '🔥', reward: '半百挑战' },
    { days: 100, label: '100天', icon: '👑', reward: '百日王者' },
    { days: 365, label: '365天', icon: '🎖️', reward: '年度传奇' },
  ];

  const nextMilestone = milestones.find(m => m.days > streak) || milestones[milestones.length - 1];
  const prevMilestone = [...milestones].reverse().find(m => m.days <= streak);
  const progress = nextMilestone ? Math.min(100, (streak / nextMilestone.days) * 100) : 100;

  return (
    <div className="space-y-4">
      {/* Streak Counter */}
      <div className="flex items-center gap-5">
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg ${
          streak > 0 ? 'bg-gradient-to-br from-orange-400 to-red-500 shadow-orange-200 dark:shadow-orange-900/30' : 'bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600'
        }`}>
          <div className="text-center text-white">
            <p className="text-xl font-black">{streak}</p>
            <p className="text-[9px] opacity-80">连续天</p>
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {prevMilestone ? `✓ ${prevMilestone.reward}` : '开始打卡吧'}
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500">
              目标: {nextMilestone.icon} {nextMilestone.label}
            </span>
          </div>
          <div className="h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-orange-400 to-red-500 rounded-full transition-all duration-1000" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">还差 {Math.max(0, nextMilestone.days - streak)} 天达成下一个里程碑</p>
        </div>
      </div>

      {/* Milestones row */}
      <div className="flex gap-1.5 overflow-x-auto py-1">
        {milestones.map(m => {
          const achieved = streak >= m.days;
          return (
            <div key={m.days} className={`flex-shrink-0 flex flex-col items-center px-2.5 py-2 rounded-xl text-center ${
              achieved ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700' : 'bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 opacity-50'
            }`}>
              <span className={`text-lg ${achieved ? '' : 'grayscale'}`}>{m.icon}</span>
              <span className="text-[10px] mt-0.5 font-medium text-slate-600 dark:text-slate-300">{m.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
