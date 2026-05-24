'use client';

import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { useApi } from '@/hooks/useApi';

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: stats, loading: statsLoading } = useApi(() => api.getLearningStats(), []);

  const todayGoalPercent = stats
    ? Math.min(100, Math.round(((stats.todayStats?.wordsLearned || 0) / (user?.settings?.dailyWordGoal || 30)) * 100))
    : 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      {/* Greeting Banner */}
      <div className="glass-card overflow-hidden">
        <div className="relative p-6 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-xs text-white/60">{getGreeting()}</p>
              <p className="text-xl font-bold mt-1">{user?.username || '学习者'}</p>
              {user?.streak && user.streak > 0 ? (
                <div className="flex items-center gap-1 mt-2">
                  <span className="text-lg">🔥</span>
                  <span className="text-sm font-medium">连续 {user.streak} 天</span>
                </div>
              ) : (
                <p className="text-xs text-white/60 mt-2">开始今天的学习吧</p>
              )}
            </div>
            {/* Progress Ring */}
            <div className="relative w-20 h-20 flex-shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" strokeWidth="8" className="stroke-white/20" />
                <circle cx="50" cy="50" r="42" fill="none" strokeWidth="8" strokeLinecap="round"
                  className="stroke-white" strokeDasharray={`${todayGoalPercent * 2.64} 264`}
                  style={{ transition: 'stroke-dasharray 1s ease' }} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-bold">{todayGoalPercent}%</span>
                <span className="text-[10px] text-white/70">今日目标</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Today Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="📚" label="今日已学" value={statsLoading ? '...' : String(stats?.todayStats?.wordsLearned || 0)} unit="词" color="blue" />
        <StatCard icon="🔄" label="待复习" value={statsLoading ? '...' : String(stats?.pendingReview || 0)} unit="词" color="orange" />
        <StatCard icon="✅" label="已掌握" value={statsLoading ? '...' : String(stats?.mastered || 0)} unit="词" color="green" />
        <StatCard icon="⏱️" label="今日时长" value={statsLoading ? '...' : String(stats?.todayStats?.timeSpent || 0)} unit="分钟" color="purple" />
      </div>

      {/* Quick Actions */}
      <div className="glass-card p-6">
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-4">⚡ 快速开始</h3>
        <div className="grid grid-cols-4 md:grid-cols-7 gap-3">
          <QuickAction href="/learn" icon="📚" label="学新词" gradient="from-blue-500 to-indigo-500" />
          <QuickAction href="/review" icon="🔄" label="去复习" gradient="from-orange-400 to-rose-500" badge={stats?.pendingReview || 0} />
          <QuickAction href="/typing" icon="⌨️" label="打字练" gradient="from-cyan-500 to-blue-600" />
          <QuickAction href="/spelling" icon="✍️" label="练拼写" gradient="from-emerald-400 to-teal-500" />
          <QuickAction href="/listening" icon="🎧" label="听力" gradient="from-violet-500 to-purple-600" />
          <QuickAction href="/word-family" icon="🌳" label="词根" gradient="from-green-500 to-emerald-600" />
          <QuickAction href="/challenge" icon="🎮" label="闯关" gradient="from-purple-500 to-fuchsia-500" />
        </div>
      </div>

      {/* Today Progress Details */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">📋 今日进度</h3>
          <span className="text-xs px-2.5 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full font-medium">
            {todayGoalPercent >= 100 ? '已完成 ✓' : `${todayGoalPercent}%`}
          </span>
        </div>
        <div className="space-y-4">
          <GoalItem icon="📚" label="新学单词" current={stats?.todayStats?.wordsLearned || 0} target={user?.settings?.dailyWordGoal || 30} color="bg-blue-500" />
          <GoalItem icon="🔄" label="复习单词" current={stats?.todayStats?.wordsReviewed || 0} target={Math.max(stats?.pendingReview || 0, 10)} color="bg-orange-500" />
          <GoalItem icon="⏱️" label="学习时长" current={stats?.todayStats?.timeSpent || 0} target={user?.settings?.dailyTimeGoal || 30} color="bg-emerald-500" unit="分钟" />
        </div>
      </div>
    </div>
  );
}


// ===== Components =====

function StatCard({ icon, label, value, unit, color }: { icon: string; label: string; value: string; unit: string; color: string }) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
  };
  return (
    <div className="glass-card p-5 card-hover">
      <div className="flex items-center gap-2 mb-3">
        <span className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg ${colorMap[color] || colorMap.blue}`}>{icon}</span>
      </div>
      <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{value}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{label} · {unit}</p>
    </div>
  );
}

function QuickAction({ href, icon, label, gradient, badge }: { href: string; icon: string; label: string; gradient: string; badge?: number }) {
  return (
    <a href={href} className="group relative">
      <div className={`bg-gradient-to-br ${gradient} p-4 rounded-xl text-center text-white transition-all hover:shadow-lg hover:-translate-y-1 hover:scale-105`}>
        <span className="text-2xl block mb-1.5 group-hover:scale-110 transition-transform">{icon}</span>
        <span className="text-xs font-medium">{label}</span>
      </div>
      {badge !== undefined && badge > 0 && (
        <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </a>
  );
}

function GoalItem({ icon, label, current, target, color, unit }: { icon: string; label: string; current: number; target: number; color: string; unit?: string }) {
  const percent = Math.min(100, Math.round((current / target) * 100));
  const isComplete = current >= target;
  return (
    <div className="flex items-center gap-4">
      <span className="text-lg w-7">{icon}</span>
      <div className="flex-1">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {current}/{target}{unit || ''} {isComplete && '✓'}
          </span>
        </div>
        <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-700 ${isComplete ? 'bg-green-500' : color}`} style={{ width: `${percent}%` }} />
        </div>
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 6) return '夜深了 🌙';
  if (h < 12) return '早上好 ☀️';
  if (h < 14) return '中午好 🌤️';
  if (h < 18) return '下午好 ⛅';
  return '晚上好 🌆';
}
