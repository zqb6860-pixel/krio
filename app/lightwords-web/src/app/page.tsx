'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { useApi } from '@/hooks/useApi';

// 每日名句数据
const dailyQuotes = [
  { en: "The limits of my language mean the limits of my world.", author: "Ludwig Wittgenstein", zh: "语言的边界就是世界的边界。" },
  { en: "One language sets you in a corridor for life. Two languages open every door along the way.", author: "Frank Smith", zh: "一门语言为你打开人生的走廊，两门语言为你打开沿途的每扇门。" },
  { en: "To have another language is to possess a second soul.", author: "Charlemagne", zh: "掌握另一门语言，就是拥有第二个灵魂。" },
  { en: "Learning is a treasure that will follow its owner everywhere.", author: "Chinese Proverb", zh: "学问是随身携带的财富。" },
  { en: "The beautiful thing about learning is that nobody can take it away from you.", author: "B.B. King", zh: "学习最美好的地方在于，没有人能将它从你身边夺走。" },
  { en: "A different language is a different vision of life.", author: "Federico Fellini", zh: "不同的语言是对生活不同的洞察。" },
  { en: "You can never understand one language until you understand at least two.", author: "Geoffrey Willans", zh: "只有理解了至少两种语言，你才能真正理解一种语言。" },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: stats, loading: statsLoading } = useApi(() => api.getLearningStats(), []);
  const { data: weeklyStats, loading: weeklyLoading } = useApi(() => api.getWeeklyStats(), []);
  const { data: checkins } = useApi(() => api.getCheckinHistory(30), []);
  const { data: distribution } = useApi(() => api.getDistribution(), []);

  // 每日名句 (基于日期选择)
  const todayQuote = dailyQuotes[new Date().getDate() % dailyQuotes.length];

  const todayGoalPercent = stats
    ? Math.min(100, Math.round(((stats.todayStats?.wordsLearned || 0) / (user?.settings?.dailyWordGoal || 30)) * 100))
    : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* Daily Quote Banner (参考不背单词的每日一句) */}
      <div className="glass-card overflow-hidden card-hover">
        <div className="relative p-6 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 animate-gradient text-white">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
          <div className="relative z-10">
            <div className="flex items-start justify-between">
              <div className="flex-1 max-w-xl">
                <p className="text-lg font-medium italic leading-relaxed opacity-95">"{todayQuote.en}"</p>
                <p className="text-sm text-white/70 mt-2">{todayQuote.zh}</p>
                <p className="text-xs text-white/50 mt-2">—— {todayQuote.author}</p>
              </div>
              <div className="text-right ml-6 flex-shrink-0">
                <p className="text-xs text-white/60">{getGreeting()}</p>
                <p className="text-xl font-bold mt-1">{user?.username || '学习者'}</p>
                {user?.streak && user.streak > 0 ? (
                  <div className="flex items-center gap-1 mt-2 justify-end">
                    <span className="text-lg">🔥</span>
                    <span className="text-sm font-medium">连续 {user.streak} 天</span>
                  </div>
                ) : (
                  <p className="text-xs text-white/60 mt-2">开始今天的学习吧</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Today's Progress Ring + Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Progress Ring */}
        <div className="glass-card p-6 flex items-center gap-5 card-hover">
          <div className="relative w-20 h-20 flex-shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" strokeWidth="8" className="stroke-slate-100 dark:stroke-slate-700" />
              <circle cx="50" cy="50" r="42" fill="none" strokeWidth="8" strokeLinecap="round"
                className="stroke-blue-500" strokeDasharray={`${todayGoalPercent * 2.64} 264`}
                style={{ transition: 'stroke-dasharray 1s ease' }} />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold text-slate-800 dark:text-slate-100">{todayGoalPercent}%</span>
            </div>
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">今日目标</p>
            <p className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-0.5">
              {stats?.todayStats?.wordsLearned || 0}/{user?.settings?.dailyWordGoal || 30}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {todayGoalPercent >= 100 ? '✨ 已完成！' : '继续加油'}
            </p>
          </div>
        </div>

        {/* Stat Cards */}
        <StatCard icon="📖" label="今日已学" value={statsLoading ? '...' : String(stats?.todayStats?.wordsLearned || 0)} unit="词" trend={stats?.todayStats?.wordsLearned > 0 ? '+' + stats.todayStats.wordsLearned : ''} color="blue" />
        <StatCard icon="🔄" label="待复习" value={statsLoading ? '...' : String(stats?.pendingReview || 0)} unit="词" trend={stats?.pendingReview > 10 ? '需复习' : '正常'} color="orange" />
        <StatCard icon="✅" label="已掌握" value={statsLoading ? '...' : String(stats?.mastered || 0)} unit="词" trend="" color="green" />
      </div>


      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Actions - 不背单词风格的极简入口 */}
          <div className="glass-card p-6 card-hover">
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-4">⚡ 快速开始</h3>
            <div className="grid grid-cols-4 gap-3">
              <QuickAction href="/learn" icon="📚" label="学新词" gradient="from-blue-500 to-indigo-500" />
              <QuickAction href="/review" icon="🔄" label="去复习" gradient="from-orange-400 to-rose-500" badge={stats?.pendingReview || 0} />
              <QuickAction href="/spelling" icon="✍️" label="练拼写" gradient="from-emerald-400 to-teal-500" />
              <QuickAction href="/challenge" icon="🎮" label="闯关" gradient="from-purple-500 to-fuchsia-500" />
            </div>
          </div>

          {/* Today Goal Details */}
          <div className="glass-card p-6 card-hover">
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


          {/* 遗忘曲线可视化 */}
          <div className="glass-card p-6 card-hover">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">📈 记忆遗忘曲线</h3>
              <span className="text-xs text-slate-400">基于艾宾浩斯记忆理论</span>
            </div>
            <ForgettingCurveChart distribution={distribution} stats={stats} />
          </div>

          {/* Weekly Chart */}
          <div className="glass-card p-6 card-hover">
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-6">📊 本周学习趋势</h3>
            {weeklyLoading ? (
              <div className="h-40 flex items-center justify-center text-slate-400">加载中...</div>
            ) : (
              <WeeklyChart data={weeklyStats || []} />
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* 记忆强度 (参考不背单词的词汇分布) */}
          <div className="glass-card p-6 card-hover">
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-4">💪 词汇掌握度</h3>
            <MemoryDistribution distribution={distribution} />
          </div>

          {/* Calendar */}
          <div className="glass-card p-6 card-hover">
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-4">📅 学习日历</h3>
            <LearningCalendar checkins={checkins || []} />
          </div>

          {/* 学习小贴士 */}
          <div className="glass-card p-5 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-100 dark:border-amber-800/30 card-hover">
            <div className="flex items-start gap-3">
              <span className="text-2xl">💡</span>
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">学习小贴士</p>
                <p className="text-xs text-amber-700/80 dark:text-amber-400/80 mt-1 leading-relaxed">
                  {getLearningTip()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


// ===== Components =====

function StatCard({ icon, label, value, unit, trend, color }: { icon: string; label: string; value: string; unit: string; trend: string; color: string }) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
  };
  return (
    <div className="glass-card p-5 card-hover">
      <div className="flex items-center justify-between mb-3">
        <span className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg ${colorMap[color] || colorMap.blue}`}>{icon}</span>
        {trend && <span className="text-[10px] text-slate-400 dark:text-slate-500">{trend}</span>}
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


// ===== 遗忘曲线图表 =====
function ForgettingCurveChart({ distribution, stats }: { distribution: any; stats: any }) {
  const dist = distribution || { mastered: 0, familiar: 0, vague: 0, unknown: 0 };
  const total = dist.mastered + dist.familiar + dist.vague + dist.unknown;

  if (total === 0) {
    return (
      <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-sm">
        <span className="text-3xl block mb-2">📈</span>
        开始学习后，这里将展示你的记忆遗忘曲线
      </div>
    );
  }

  const timePoints = [0, 0.33, 1, 2, 4, 7, 15, 30];
  const labels = ['刚学', '20分', '1天', '2天', '4天', '7天', '15天', '30天'];
  const standardCurve = timePoints.map(t => Math.round(100 * Math.exp(-t / 3)));
  const masteryRatio = total > 0 ? (dist.mastered + dist.familiar) / total : 0;
  const userCurve = timePoints.map(t => Math.round(100 * Math.exp(-t / (3 + masteryRatio * 12))));
  const maxVal = 100;
  const chartHeight = 120;

  return (
    <div className="space-y-4">
      <div className="relative bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
        <svg viewBox="0 0 320 140" className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
          {[0, 25, 50, 75, 100].map(val => {
            const y = 10 + (1 - val / maxVal) * chartHeight;
            return (
              <g key={val}>
                <line x1="40" y1={y} x2="310" y2={y} stroke="currentColor" className="text-slate-200 dark:text-slate-700" strokeWidth="0.5" strokeDasharray="3,3" />
                <text x="35" y={y + 3} textAnchor="end" fontSize="8" className="fill-slate-400">{val}%</text>
              </g>
            );
          })}
          <polyline fill="none" stroke="#f87171" strokeWidth="1.5" strokeDasharray="4,3" opacity="0.5"
            points={timePoints.map((_, i) => `${40 + (i / (timePoints.length - 1)) * 270},${10 + (1 - standardCurve[i] / maxVal) * chartHeight}`).join(' ')} />
          <polyline fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            points={timePoints.map((_, i) => `${40 + (i / (timePoints.length - 1)) * 270},${10 + (1 - userCurve[i] / maxVal) * chartHeight}`).join(' ')} />
          <polygon fill="url(#curveGrad)" opacity="0.12"
            points={[...timePoints.map((_, i) => `${40 + (i / (timePoints.length - 1)) * 270},${10 + (1 - userCurve[i] / maxVal) * chartHeight}`), `310,${10 + chartHeight}`, `40,${10 + chartHeight}`].join(' ')} />
          {timePoints.map((_, i) => (
            <circle key={i} cx={40 + (i / (timePoints.length - 1)) * 270} cy={10 + (1 - userCurve[i] / maxVal) * chartHeight} r="3" fill="#3b82f6" stroke="white" strokeWidth="1.5" />
          ))}
          {labels.map((label, i) => (
            <text key={i} x={40 + (i / (labels.length - 1)) * 270} y="138" textAnchor="middle" fontSize="7" className="fill-slate-400">{label}</text>
          ))}
          <defs><linearGradient id="curveGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3b82f6" /><stop offset="100%" stopColor="#3b82f6" stopOpacity="0" /></linearGradient></defs>
        </svg>
        <div className="flex items-center justify-center gap-6 mt-2">
          <div className="flex items-center gap-1.5"><div className="w-4 h-0.5 bg-blue-500 rounded" /><span className="text-xs text-slate-500 dark:text-slate-400">你的记忆曲线</span></div>
          <div className="flex items-center gap-1.5"><div className="w-4 h-0.5 border-t-2 border-dashed border-red-400" /><span className="text-xs text-slate-500 dark:text-slate-400">未复习遗忘</span></div>
        </div>
      </div>
      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
        <p className="text-xs text-blue-700 dark:text-blue-300">
          💡 你有 <span className="font-bold">{Math.round(masteryRatio * 100)}%</span> 的单词处于良好记忆状态。
          {masteryRatio < 0.5 ? '建议增加复习频率！' : masteryRatio < 0.8 ? '继续保持！' : '记忆状态非常好！'}
        </p>
      </div>
    </div>
  );
}


// ===== 记忆分布组件 (参考不背单词的词汇分级) =====
function MemoryDistribution({ distribution }: { distribution: any }) {
  const dist = distribution || { mastered: 0, familiar: 0, vague: 0, unknown: 0 };
  const total = dist.mastered + dist.familiar + dist.vague + dist.unknown;

  if (total === 0) {
    return <p className="text-slate-400 dark:text-slate-500 text-sm text-center py-6">开始学习后查看词汇分布</p>;
  }

  const items = [
    { label: '已掌握', count: dist.mastered, color: '#10b981', bg: 'bg-emerald-500', lightBg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { label: '熟悉', count: dist.familiar, color: '#3b82f6', bg: 'bg-blue-500', lightBg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: '模糊', count: dist.vague, color: '#f59e0b', bg: 'bg-amber-500', lightBg: 'bg-amber-50 dark:bg-amber-900/20' },
    { label: '陌生', count: dist.unknown, color: '#ef4444', bg: 'bg-red-500', lightBg: 'bg-red-50 dark:bg-red-900/20' },
  ];

  return (
    <div className="space-y-4">
      {/* Donut chart-like bar */}
      <div className="h-3 rounded-full overflow-hidden flex shadow-inner">
        {items.map(item => {
          const pct = (item.count / total) * 100;
          if (pct === 0) return null;
          return <div key={item.label} className={`${item.bg} transition-all duration-700`} style={{ width: `${pct}%` }} />;
        })}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2">
        {items.map(item => {
          const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
          return (
            <div key={item.label} className={`${item.lightBg} p-3 rounded-xl text-center`}>
              <p className="text-lg font-bold" style={{ color: item.color }}>{item.count}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">{item.label} · {pct}%</p>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-center text-slate-400 dark:text-slate-500 pt-1">
        总词汇量 <span className="font-bold text-slate-700 dark:text-slate-200">{total}</span> 个
      </p>
    </div>
  );
}


// ===== Weekly Chart =====
function WeeklyChart({ data }: { data: any[] }) {
  const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
  const maxWords = Math.max(1, ...data.map((d: any) => d.wordsLearned || 0));
  const totalWords = data.reduce((s: number, d: any) => s + (d.wordsLearned || 0), 0);
  const totalTime = data.reduce((s: number, d: any) => s + (d.timeSpent || 0), 0);
  const avgRate = data.length > 0 ? Math.round(data.reduce((s: number, d: any) => s + (d.correctRate || 0), 0) / data.length) : 0;

  return (
    <>
      <div className="flex items-end justify-between gap-2 h-28">
        {days.map((day, i) => {
          const d = data[i];
          const words = d?.wordsLearned || 0;
          const height = maxWords > 0 ? (words / maxWords) * 100 : 0;
          const isToday = i === (new Date().getDay() + 6) % 7;
          return (
            <div key={day} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex justify-center items-end" style={{ height: '90px' }}>
                <div className={`w-6 rounded-t-lg transition-all duration-500 relative group ${isToday ? 'bg-gradient-to-t from-blue-600 to-blue-400' : 'bg-gradient-to-t from-blue-400 to-blue-300 dark:from-blue-600 dark:to-blue-500'}`}
                  style={{ height: `${Math.max(height, 6)}%` }}>
                  <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] text-blue-600 dark:text-blue-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">{words}</span>
                </div>
              </div>
              <span className={`text-[11px] ${isToday ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-400 dark:text-slate-500'}`}>{day}</span>
            </div>
          );
        })}
      </div>
      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 grid grid-cols-3 gap-4 text-center">
        <div><p className="text-lg font-bold text-slate-800 dark:text-slate-100">{totalWords}</p><p className="text-[11px] text-slate-500 dark:text-slate-400">本周单词</p></div>
        <div><p className="text-lg font-bold text-slate-800 dark:text-slate-100">{totalTime > 60 ? `${(totalTime / 60).toFixed(1)}h` : `${totalTime}m`}</p><p className="text-[11px] text-slate-500 dark:text-slate-400">学习时长</p></div>
        <div><p className="text-lg font-bold text-slate-800 dark:text-slate-100">{avgRate}%</p><p className="text-[11px] text-slate-500 dark:text-slate-400">正确率</p></div>
      </div>
    </>
  );
}


// ===== Learning Calendar =====
function LearningCalendar({ checkins }: { checkins: any[] }) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const currentDay = today.getDate();
  const checkinDates = new Set(checkins.map((c: any) => { const d = new Date(c.date || c.createdAt); return d.getDate(); }));
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  return (
    <>
      <div className="grid grid-cols-7 gap-1 text-center">
        {weekDays.map((d) => (<div key={d} className="text-[10px] text-slate-400 dark:text-slate-500 py-1 font-medium">{d}</div>))}
        {Array.from({ length: firstDayOfWeek }).map((_, i) => (<div key={`e-${i}`} className="aspect-square" />))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const isLearned = checkinDates.has(day);
          const isToday = day === currentDay;
          return (
            <div key={day} className={`aspect-square flex items-center justify-center text-[11px] rounded-lg transition-colors ${
              isToday ? 'bg-blue-500 text-white font-bold shadow-sm shadow-blue-500/30' :
              isLearned ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-medium' :
              day > currentDay ? 'text-slate-200 dark:text-slate-700' : 'text-slate-400 dark:text-slate-500'
            }`}>{day}</div>
          );
        })}
      </div>
      <div className="mt-3 flex items-center gap-4 text-[11px] text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-700" /><span>已学习</span></div>
        <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded bg-blue-500" /><span>今天</span></div>
      </div>
    </>
  );
}


// ===== Helper Functions =====
function getGreeting() {
  const h = new Date().getHours();
  if (h < 6) return '夜深了 🌙';
  if (h < 12) return '早上好 ☀️';
  if (h < 14) return '中午好 🌤️';
  if (h < 18) return '下午好 ⛅';
  return '晚上好 🌆';
}

function getLearningTip() {
  const tips = [
    '研究表明，每天学习15-30个新单词，配合间隔复习效果最佳。',
    '在真实语境中遇到单词比单纯背诵记忆更牢固，试试多读英文原文。',
    '词根词缀记忆法可以帮你举一反三，一个词根带出一族单词。',
    '复习的最佳时机是即将遗忘之前，坚持按时复习事半功倍。',
    '将新单词和已知信息建立联系，形成记忆网络更不容易遗忘。',
    '大声朗读单词和例句，调动听觉记忆通道，加深印象。',
    '利用碎片时间复习比集中长时间背诵效率更高。',
  ];
  return tips[new Date().getDate() % tips.length];
}
