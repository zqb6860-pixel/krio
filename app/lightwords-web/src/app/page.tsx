'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { useApi } from '@/hooks/useApi';

export default function DashboardPage() {
  const { user, refreshUser } = useAuth();
  const { data: stats, loading: statsLoading } = useApi(() => api.getLearningStats(), []);
  const { data: weeklyStats, loading: weeklyLoading } = useApi(() => api.getWeeklyStats(), []);
  const { data: checkins } = useApi(() => api.getCheckinHistory(30), []);
  const { data: distribution } = useApi(() => api.getDistribution(), []);

  const todayGoalPercent = stats
    ? Math.min(100, Math.round(((stats.todayStats?.wordsLearned || 0) / (user?.settings?.dailyWordGoal || 30)) * 100))
    : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="glass-card p-6 gradient-primary text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">
              {getGreeting()}，{user?.username || '学习者'}！
            </h2>
            <p className="text-blue-100 mt-1">
              {user?.streak && user.streak > 0
                ? `连续学习第 ${user.streak} 天，继续加油！🔥`
                : '开始今天的学习吧！'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-blue-100">今日目标完成度</p>
            <p className="text-3xl font-bold">{todayGoalPercent}%</p>
          </div>
        </div>
        <div className="mt-4 h-2 bg-white/20 rounded-full overflow-hidden">
          <div className="h-full bg-white rounded-full transition-all duration-500" style={{ width: `${todayGoalPercent}%` }} />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon="📖" label="今日已学"
          value={statsLoading ? '...' : String(stats?.todayStats?.wordsLearned || 0)}
          unit="个单词" bgColor="bg-blue-50"
        />
        <StatCard
          icon="🔄" label="待复习"
          value={statsLoading ? '...' : String(stats?.pendingReview || 0)}
          unit="个单词" bgColor="bg-orange-50"
        />
        <StatCard
          icon="✅" label="已掌握"
          value={statsLoading ? '...' : String(stats?.mastered || 0)}
          unit="个单词" bgColor="bg-green-50"
        />
        <StatCard
          icon="⏱️" label="学习时长"
          value={statsLoading ? '...' : String(stats?.todayStats?.timeSpent || 0)}
          unit="分钟" bgColor="bg-purple-50"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Today Goal */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800">📋 今日目标</h3>
              <span className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-full font-medium">
                {todayGoalPercent >= 100 ? '已完成 ✓' : `${todayGoalPercent}%`}
              </span>
            </div>
            <div className="space-y-4">
              <GoalItem
                icon="📚" label="新学单词"
                current={stats?.todayStats?.wordsLearned || 0}
                target={user?.settings?.dailyWordGoal || 30}
                color="bg-blue-500"
              />
              <GoalItem
                icon="🔄" label="复习单词"
                current={stats?.todayStats?.wordsReviewed || 0}
                target={Math.max(stats?.pendingReview || 0, 10)}
                color="bg-orange-500"
              />
              <GoalItem
                icon="⏱️" label="学习时长"
                current={stats?.todayStats?.timeSpent || 0}
                target={user?.settings?.dailyTimeGoal || 30}
                color="bg-green-500" unit="分钟"
              />
            </div>
          </div>

          {/* 遗忘曲线可视化 (参考不背单词) */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800">📈 记忆遗忘曲线</h3>
              <span className="text-xs text-slate-400">基于艾宾浩斯遗忘曲线</span>
            </div>
            <ForgettingCurveChart distribution={distribution} stats={stats} />
          </div>

          {/* Weekly Chart */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-6">📊 本周学习趋势</h3>
            {weeklyLoading ? (
              <div className="h-40 flex items-center justify-center text-slate-400">加载中...</div>
            ) : (
              <WeeklyChart data={weeklyStats || []} />
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">⚡ 快速开始</h3>
            <div className="grid grid-cols-2 gap-3">
              <a href="/learn" className="bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-xl text-center transition-all hover:shadow-lg hover:-translate-y-0.5">
                <span className="text-2xl block mb-1">📖</span>
                <span className="text-xs font-medium">开始学习</span>
              </a>
              <a href="/challenge" className="bg-purple-500 hover:bg-purple-600 text-white p-4 rounded-xl text-center transition-all hover:shadow-lg hover:-translate-y-0.5">
                <span className="text-2xl block mb-1">🎮</span>
                <span className="text-xs font-medium">闯关模式</span>
              </a>
              <a href="/review" className="bg-orange-500 hover:bg-orange-600 text-white p-4 rounded-xl text-center transition-all hover:shadow-lg hover:-translate-y-0.5">
                <span className="text-2xl block mb-1">🔄</span>
                <span className="text-xs font-medium">复习单词</span>
              </a>
              <a href="/spelling" className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-xl text-center transition-all hover:shadow-lg hover:-translate-y-0.5">
                <span className="text-2xl block mb-1">✍️</span>
                <span className="text-xs font-medium">默写模式</span>
              </a>
            </div>
          </div>

          {/* 记忆强度热力图 (参考不背单词) */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">🔥 记忆强度</h3>
            <MemoryHeatmap distribution={distribution} />
          </div>

          {/* Calendar */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">📅 学习日历</h3>
            <LearningCalendar checkins={checkins || []} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== 遗忘曲线图表组件 =====
function ForgettingCurveChart({ distribution, stats }: { distribution: any; stats: any }) {
  const dist = distribution || { mastered: 0, familiar: 0, vague: 0, unknown: 0 };
  const total = dist.mastered + dist.familiar + dist.vague + dist.unknown;

  if (total === 0) {
    return (
      <div className="text-center py-8 text-slate-400 text-sm">
        开始学习后，这里将展示你的记忆遗忘曲线
      </div>
    );
  }

  // 模拟遗忘曲线数据点 (基于艾宾浩斯曲线 R = e^(-t/S))
  const timePoints = [0, 0.33, 1, 2, 4, 7, 15, 30]; // 天数
  const labels = ['刚学', '20分', '1天', '2天', '4天', '7天', '15天', '30天'];

  // 未复习的标准遗忘曲线
  const standardCurve = timePoints.map(t => Math.round(100 * Math.exp(-t / 3)));
  // 经过复习的强化曲线 (根据用户实际掌握数据估算)
  const masteryRatio = total > 0 ? (dist.mastered + dist.familiar) / total : 0;
  const userCurve = timePoints.map(t => Math.round(100 * Math.exp(-t / (3 + masteryRatio * 12))));

  const maxVal = 100;
  const chartHeight = 120;

  return (
    <div className="space-y-4">
      {/* SVG Chart */}
      <div className="relative bg-slate-50 rounded-xl p-4">
        <svg viewBox="0 0 320 140" className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map(val => {
            const y = 10 + (1 - val / maxVal) * chartHeight;
            return (
              <g key={val}>
                <line x1="40" y1={y} x2="310" y2={y} stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="3,3" />
                <text x="35" y={y + 3} textAnchor="end" fontSize="8" fill="#94a3b8">{val}%</text>
              </g>
            );
          })}

          {/* Standard forgetting curve (no review) */}
          <polyline
            fill="none"
            stroke="#f87171"
            strokeWidth="1.5"
            strokeDasharray="4,3"
            opacity="0.6"
            points={timePoints.map((_, i) => {
              const x = 40 + (i / (timePoints.length - 1)) * 270;
              const y = 10 + (1 - standardCurve[i] / maxVal) * chartHeight;
              return `${x},${y}`;
            }).join(' ')}
          />

          {/* User's reinforced curve */}
          <polyline
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={timePoints.map((_, i) => {
              const x = 40 + (i / (timePoints.length - 1)) * 270;
              const y = 10 + (1 - userCurve[i] / maxVal) * chartHeight;
              return `${x},${y}`;
            }).join(' ')}
          />

          {/* Fill under user curve */}
          <polygon
            fill="url(#curveGradient)"
            opacity="0.15"
            points={[
              ...timePoints.map((_, i) => {
                const x = 40 + (i / (timePoints.length - 1)) * 270;
                const y = 10 + (1 - userCurve[i] / maxVal) * chartHeight;
                return `${x},${y}`;
              }),
              `310,${10 + chartHeight}`,
              `40,${10 + chartHeight}`,
            ].join(' ')}
          />

          {/* Data points on user curve */}
          {timePoints.map((_, i) => {
            const x = 40 + (i / (timePoints.length - 1)) * 270;
            const y = 10 + (1 - userCurve[i] / maxVal) * chartHeight;
            return <circle key={i} cx={x} cy={y} r="3" fill="#3b82f6" stroke="white" strokeWidth="1.5" />;
          })}

          {/* X-axis labels */}
          {labels.map((label, i) => {
            const x = 40 + (i / (labels.length - 1)) * 270;
            return <text key={i} x={x} y="138" textAnchor="middle" fontSize="7" fill="#94a3b8">{label}</text>;
          })}

          {/* Gradient definition */}
          <defs>
            <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-2">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-0.5 bg-blue-500 rounded" />
            <span className="text-xs text-slate-600">你的记忆曲线</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-0.5 bg-red-400 rounded" style={{ borderTop: '1.5px dashed #f87171' }} />
            <span className="text-xs text-slate-600">未复习时遗忘</span>
          </div>
        </div>
      </div>

      {/* Insight */}
      <div className="p-3 bg-blue-50 rounded-xl">
        <p className="text-xs text-blue-700">
          💡 坚持按时复习可以显著减缓遗忘速度。你当前有 <span className="font-bold">{Math.round(masteryRatio * 100)}%</span> 的单词处于良好记忆状态。
          {masteryRatio < 0.5 ? '建议增加复习频率！' : masteryRatio < 0.8 ? '继续保持！' : '记忆状态非常好！'}
        </p>
      </div>
    </div>
  );
}

// ===== 记忆强度热力图组件 =====
function MemoryHeatmap({ distribution }: { distribution: any }) {
  const dist = distribution || { mastered: 0, familiar: 0, vague: 0, unknown: 0 };
  const total = dist.mastered + dist.familiar + dist.vague + dist.unknown;

  if (total === 0) {
    return <p className="text-slate-400 text-sm text-center py-4">开始学习后查看记忆强度</p>;
  }

  // 生成热力图网格 (5x5 grid representing word distribution)
  const gridSize = 25;
  const cells: string[] = [];
  const masteredCells = Math.round((dist.mastered / total) * gridSize);
  const familiarCells = Math.round((dist.familiar / total) * gridSize);
  const vagueCells = Math.round((dist.vague / total) * gridSize);
  const unknownCells = gridSize - masteredCells - familiarCells - vagueCells;

  for (let i = 0; i < masteredCells; i++) cells.push('mastered');
  for (let i = 0; i < familiarCells; i++) cells.push('familiar');
  for (let i = 0; i < vagueCells; i++) cells.push('vague');
  for (let i = 0; i < Math.max(0, unknownCells); i++) cells.push('unknown');

  // Fill remaining if rounding caused issues
  while (cells.length < gridSize) cells.push('unknown');

  const getColor = (type: string) => {
    switch (type) {
      case 'mastered': return 'bg-green-500';
      case 'familiar': return 'bg-blue-400';
      case 'vague': return 'bg-yellow-400';
      case 'unknown': return 'bg-red-400';
      default: return 'bg-slate-200';
    }
  };

  return (
    <div className="space-y-4">
      {/* Heat Grid */}
      <div className="grid grid-cols-5 gap-1.5">
        {cells.slice(0, gridSize).map((type, i) => (
          <div
            key={i}
            className={`aspect-square rounded-md ${getColor(type)} opacity-80 hover:opacity-100 transition-opacity`}
            title={type === 'mastered' ? '已掌握' : type === 'familiar' ? '熟悉' : type === 'vague' ? '模糊' : '陌生'}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-500" />
          <span className="text-slate-600">已掌握 {dist.mastered}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-blue-400" />
          <span className="text-slate-600">熟悉 {dist.familiar}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-yellow-400" />
          <span className="text-slate-600">模糊 {dist.vague}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-red-400" />
          <span className="text-slate-600">陌生 {dist.unknown}</span>
        </div>
      </div>

      {/* Summary bar */}
      <div className="h-3 rounded-full overflow-hidden flex">
        {total > 0 && (
          <>
            <div className="bg-green-500 transition-all" style={{ width: `${(dist.mastered / total) * 100}%` }} />
            <div className="bg-blue-400 transition-all" style={{ width: `${(dist.familiar / total) * 100}%` }} />
            <div className="bg-yellow-400 transition-all" style={{ width: `${(dist.vague / total) * 100}%` }} />
            <div className="bg-red-400 transition-all" style={{ width: `${(dist.unknown / total) * 100}%` }} />
          </>
        )}
      </div>
      <p className="text-xs text-center text-slate-500">
        共 <span className="font-bold text-slate-700">{total}</span> 个单词
      </p>
    </div>
  );
}

// ===== 其他组件 =====

function StatCard({ icon, label, value, unit, bgColor }: { icon: string; label: string; value: string; unit: string; bgColor: string }) {
  return (
    <div className="glass-card p-4 hover:shadow-xl transition-shadow duration-300">
      <div className="flex items-center justify-between mb-3">
        <span className={`${bgColor} p-2 rounded-lg text-xl`}>{icon}</span>
      </div>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
      <p className="text-xs text-slate-500 mt-1">{label} · {unit}</p>
    </div>
  );
}

function GoalItem({ icon, label, current, target, color, unit }: { icon: string; label: string; current: number; target: number; color: string; unit?: string }) {
  const percent = Math.min(100, Math.round((current / target) * 100));
  const isComplete = current >= target;
  return (
    <div className="flex items-center gap-4">
      <span className="text-xl w-8">{icon}</span>
      <div className="flex-1">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-slate-700">{label}</span>
          <span className="text-xs text-slate-500">
            {current}/{target}{unit || ''} {isComplete && '✓'}
          </span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-500 ${isComplete ? 'bg-green-500' : color}`} style={{ width: `${percent}%` }} />
        </div>
      </div>
    </div>
  );
}

function WeeklyChart({ data }: { data: any[] }) {
  const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
  const maxWords = Math.max(1, ...data.map((d: any) => d.wordsLearned || 0));
  const totalWords = data.reduce((s: number, d: any) => s + (d.wordsLearned || 0), 0);
  const totalTime = data.reduce((s: number, d: any) => s + (d.timeSpent || 0), 0);
  const avgRate = data.length > 0
    ? Math.round(data.reduce((s: number, d: any) => s + (d.correctRate || 0), 0) / data.length)
    : 0;

  return (
    <>
      <div className="flex items-end justify-between gap-2 h-32">
        {days.map((day, i) => {
          const d = data[i];
          const words = d?.wordsLearned || 0;
          const height = maxWords > 0 ? (words / maxWords) * 100 : 0;
          const isToday = i === (new Date().getDay() + 6) % 7;
          return (
            <div key={day} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex justify-center items-end" style={{ height: '100px' }}>
                <div className={`w-5 ${isToday ? 'bg-blue-600' : 'bg-blue-400'} rounded-t transition-all duration-500 relative group`} style={{ height: `${Math.max(height, 4)}%` }}>
                  <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs text-blue-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">{words}</span>
                </div>
              </div>
              <span className={`text-xs ${isToday ? 'text-blue-600 font-bold' : 'text-slate-500'}`}>{day}</span>
            </div>
          );
        })}
      </div>
      <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-lg font-bold text-slate-800">{totalWords}</p>
          <p className="text-xs text-slate-500">本周单词</p>
        </div>
        <div>
          <p className="text-lg font-bold text-slate-800">{totalTime > 60 ? `${(totalTime / 60).toFixed(1)}h` : `${totalTime}m`}</p>
          <p className="text-xs text-slate-500">学习时长</p>
        </div>
        <div>
          <p className="text-lg font-bold text-slate-800">{avgRate}%</p>
          <p className="text-xs text-slate-500">正确率</p>
        </div>
      </div>
    </>
  );
}

function LearningCalendar({ checkins }: { checkins: any[] }) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const currentDay = today.getDate();

  const checkinDates = new Set(checkins.map((c: any) => {
    const d = new Date(c.date || c.createdAt);
    return d.getDate();
  }));

  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  return (
    <>
      <div className="grid grid-cols-7 gap-1 text-center">
        {weekDays.map((d) => (
          <div key={d} className="text-xs text-slate-400 py-1 font-medium">{d}</div>
        ))}
        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <div key={`e-${i}`} className="aspect-square" />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const isLearned = checkinDates.has(day);
          const isToday = day === currentDay;
          return (
            <div key={day} className={`aspect-square flex items-center justify-center text-xs rounded-lg ${
              isToday ? 'bg-blue-500 text-white font-bold' :
              isLearned ? 'bg-green-100 text-green-700 font-medium' :
              day > currentDay ? 'text-slate-300' : 'text-slate-400'
            }`}>
              {day}
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-green-100" /><span>已学习</span></div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-blue-500" /><span>今天</span></div>
      </div>
    </>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 6) return '夜深了';
  if (h < 12) return '早上好';
  if (h < 14) return '中午好';
  if (h < 18) return '下午好';
  return '晚上好';
}
