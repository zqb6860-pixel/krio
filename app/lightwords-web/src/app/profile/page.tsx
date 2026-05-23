'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { useApi } from '@/hooks/useApi';
import Link from 'next/link';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { data: stats } = useApi(() => api.getLearningStats(), []);
  const { data: achievements } = useApi(() => api.getAchievements(), []);
  const { data: wordBooks } = useApi(() => api.getWordBooks(), []);
  const { data: distribution } = useApi(() => api.getDistribution(), []);
  const { data: checkins } = useApi(() => api.getCheckinHistory(60), []);
  const { data: weeklyStats } = useApi(() => api.getWeeklyStats(), []);

  const totalWords = stats?.total || 0;
  const totalTime = weeklyStats?.reduce((s: number, d: any) => s + (d.timeSpent || 0), 0) || 0;
  const streak = user?.streak || 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6">

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
              <p className="text-white/70 text-sm mt-0.5">{user?.email}</p>
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


      {/* Stats Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: '累计学习', value: totalWords, unit: '词', icon: '📖', gradient: 'from-blue-500 to-indigo-500' },
          { label: '已掌握', value: stats?.mastered || 0, unit: '词', icon: '✅', gradient: 'from-green-500 to-emerald-500' },
          { label: '学习中', value: stats?.learning || 0, unit: '词', icon: '📝', gradient: 'from-orange-400 to-amber-500' },
          { label: '待复习', value: stats?.pendingReview || 0, unit: '词', icon: '🔄', gradient: 'from-purple-500 to-violet-500' },
          { label: '本周时长', value: totalTime > 60 ? `${(totalTime/60).toFixed(1)}h` : `${totalTime}m`, unit: '', icon: '⏱️', gradient: 'from-pink-500 to-rose-500' },
        ].map((stat, i) => (
          <div key={stat.label} className="glass-card p-4 text-center card-hover">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center text-lg mx-auto mb-2 shadow-sm`}>
              {stat.icon}
            </div>
            <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{stat.value}{stat.unit}</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 词汇量增长曲线 (参考不背单词) */}
        <div className="glass-card p-6 lg:col-span-2 card-hover">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">📈 词汇量增长曲线</h3>
            <span className="text-xs text-slate-400">近30天</span>
          </div>
          <VocabularyGrowthChart checkins={checkins || []} totalWords={totalWords} />
        </div>

        {/* 打卡激励 */}
        <div className="glass-card p-6 card-hover">
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-4">🔥 打卡激励</h3>
          <StreakPanel streak={streak} checkins={checkins || []} />
        </div>

        {/* Checkin Calendar */}
        <div className="glass-card p-6 card-hover">
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-4">📅 学习日历</h3>
          <CheckinCalendar checkins={checkins || []} streak={streak} />
        </div>
      </div>


      {/* Weekly Trend */}
      <div className="glass-card p-6 card-hover">
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-4">📊 本周学习趋势</h3>
        <WeeklyTrend data={weeklyStats || []} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mastery Distribution */}
        <div className="glass-card p-6 card-hover">
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-4">🎯 掌握度分析</h3>
          <MasteryChart distribution={distribution} />
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

      {/* Word Books */}
      <div className="glass-card p-6 card-hover">
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-4">📖 我的词库</h3>
        {wordBooks && wordBooks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {wordBooks.map((book: any) => (
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
    </div>
  );
}


// ===== Quick Stat =====
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

// ===== 词汇量增长曲线 (参考不背单词) =====
function VocabularyGrowthChart({ checkins, totalWords }: { checkins: any[]; totalWords: number }) {
  if (!checkins || checkins.length === 0) {
    return (
      <div className="text-center py-10 text-slate-400 dark:text-slate-500 text-sm">
        <span className="text-3xl block mb-2">📈</span>
        开始学习后，这里将展示你的词汇量增长曲线
      </div>
    );
  }

  // Build growth data from checkins (cumulative)
  const sorted = [...checkins].sort((a, b) => new Date(a.date || a.createdAt).getTime() - new Date(b.date || b.createdAt).getTime());
  let cumulative = Math.max(0, totalWords - sorted.reduce((s, c) => s + (c.wordsLearned || 0), 0));
  const dataPoints = sorted.map(c => {
    cumulative += (c.wordsLearned || 0);
    return { date: c.date || c.createdAt, total: cumulative, daily: c.wordsLearned || 0 };
  });

  // Take last 30 points max
  const points = dataPoints.slice(-30);
  if (points.length === 0) return <p className="text-slate-400 text-sm text-center py-8">暂无数据</p>;

  const maxVal = Math.max(...points.map(p => p.total), 1);
  const minVal = Math.min(...points.map(p => p.total));
  const range = maxVal - minVal || 1;
  const chartW = 600;
  const chartH = 120;
  const padding = 40;

  const getX = (i: number) => padding + (i / (points.length - 1 || 1)) * (chartW - padding * 2);
  const getY = (val: number) => chartH - 10 - ((val - minVal) / range) * (chartH - 30);

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${getX(i)},${getY(p.total)}`).join(' ');
  const areaPath = linePath + ` L${getX(points.length - 1)},${chartH - 5} L${getX(0)},${chartH - 5} Z`;

  return (
    <div className="space-y-3">
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 overflow-hidden">
        <svg viewBox={`0 0 ${chartW} ${chartH + 20}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map(pct => {
            const val = Math.round(minVal + range * pct);
            const y = getY(val);
            return (
              <g key={pct}>
                <line x1={padding} y1={y} x2={chartW - padding} y2={y} className="stroke-slate-200 dark:stroke-slate-700" strokeWidth="0.5" strokeDasharray="4,3" />
                <text x={padding - 5} y={y + 3} textAnchor="end" fontSize="9" className="fill-slate-400">{val}</text>
              </g>
            );
          })}
          {/* Area fill */}
          <path d={areaPath} fill="url(#growthGradient)" opacity="0.15" />
          {/* Line */}
          <path d={linePath} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          {/* End point */}
          <circle cx={getX(points.length - 1)} cy={getY(points[points.length - 1].total)} r="4" fill="#6366f1" stroke="white" strokeWidth="2" />
          {/* Start point */}
          <circle cx={getX(0)} cy={getY(points[0].total)} r="3" fill="#6366f1" opacity="0.5" />
          {/* Date labels */}
          {[0, Math.floor(points.length / 2), points.length - 1].map(i => {
            if (i >= points.length) return null;
            const d = new Date(points[i].date);
            return <text key={i} x={getX(i)} y={chartH + 15} textAnchor="middle" fontSize="8" className="fill-slate-400">{`${d.getMonth() + 1}/${d.getDate()}`}</text>;
          })}
          <defs>
            <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
        <span>起始: {points[0].total} 词</span>
        <span className="font-medium text-indigo-600 dark:text-indigo-400">当前: {points[points.length - 1].total} 词 (+{points[points.length - 1].total - points[0].total})</span>
      </div>
    </div>
  );
}


// ===== Streak Panel (参考不背单词打卡激励) =====
function StreakPanel({ streak, checkins }: { streak: number; checkins: any[] }) {
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
        <div className={`w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg ${
          streak > 0 ? 'bg-gradient-to-br from-orange-400 to-red-500 shadow-orange-200 dark:shadow-orange-900/30' : 'bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600'
        }`}>
          <div className="text-center text-white">
            <p className="text-2xl font-black">{streak}</p>
            <p className="text-[10px] opacity-80">连续天</p>
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
          <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-orange-400 to-red-500 rounded-full transition-all duration-1000" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">还差 {Math.max(0, nextMilestone.days - streak)} 天</p>
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

      {/* Tip */}
      <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-100 dark:border-orange-800/30">
        <p className="text-xs text-orange-700 dark:text-orange-300">
          {streak === 0 && '💡 今天开始打卡吧！坚持7天获得第一个成就。'}
          {streak > 0 && streak < 7 && `💪 再坚持 ${7 - streak} 天获得「新手坚持」成就！`}
          {streak >= 7 && streak < 30 && `🌟 已坚持${streak}天，向30天「月度达人」冲刺！`}
          {streak >= 30 && streak < 100 && `🔥 ${streak}天连续学习，你的坚持正在创造奇迹！`}
          {streak >= 100 && `👑 ${streak}天！你是真正的词汇王者！`}
        </p>
      </div>
    </div>
  );
}


// ===== Checkin Calendar =====
function CheckinCalendar({ checkins, streak }: { checkins: any[]; streak: number }) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const currentDay = today.getDate();

  const checkinMap = new Map<number, any>();
  checkins.forEach((c: any) => {
    const date = c.date || '';
    const parts = date.split('-');
    if (parts.length === 3 && parseInt(parts[1]) === month + 1 && parseInt(parts[0]) === year) {
      checkinMap.set(parseInt(parts[2]), c);
    }
  });

  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
  const months = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
  const monthCheckins = checkins.filter((c: any) => {
    const d = c.date || '';
    return d.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`);
  }).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{year}年 {months[month]}</span>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-orange-500">🔥 {streak}天连续</span>
          <span className="text-slate-400">·</span>
          <span className="text-slate-500 dark:text-slate-400">本月{monthCheckins}天</span>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {weekDays.map(d => (<div key={d} className="text-[10px] text-slate-400 dark:text-slate-500 py-1 font-medium">{d}</div>))}
        {Array.from({ length: firstDayOfWeek }).map((_, i) => (<div key={`e-${i}`} className="aspect-square" />))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const checkin = checkinMap.get(day);
          const isToday = day === currentDay;
          const isChecked = !!checkin;
          return (
            <div key={day} title={isChecked ? `学习${checkin.wordsLearned || 0}词` : ''}
              className={`aspect-square flex items-center justify-center text-[11px] rounded-lg transition-colors ${
                isToday ? 'bg-blue-500 text-white font-bold shadow-sm shadow-blue-500/30' :
                isChecked ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-medium' :
                day > currentDay ? 'text-slate-200 dark:text-slate-700' : 'text-slate-400 dark:text-slate-500'
              }`}>{day}</div>
          );
        })}
      </div>
      <div className="mt-3 flex items-center gap-4 text-[11px] text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-700" /><span>已打卡</span></div>
        <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded bg-blue-500" /><span>今天</span></div>
      </div>
    </div>
  );
}


// ===== Mastery Chart =====
function MasteryChart({ distribution }: { distribution: any }) {
  if (!distribution) return <p className="text-slate-400 dark:text-slate-500 text-sm text-center py-8">暂无数据</p>;
  const total = (distribution.mastered || 0) + (distribution.familiar || 0) + (distribution.vague || 0) + (distribution.unknown || 0);
  if (total === 0) return <p className="text-slate-400 dark:text-slate-500 text-sm text-center py-8">开始学习后显示掌握度</p>;

  const items = [
    { label: '已掌握', count: distribution.mastered || 0, color: '#10b981', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { label: '熟悉', count: distribution.familiar || 0, color: '#3b82f6', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: '模糊', count: distribution.vague || 0, color: '#f59e0b', bg: 'bg-amber-50 dark:bg-amber-900/20' },
    { label: '陌生', count: distribution.unknown || 0, color: '#ef4444', bg: 'bg-red-50 dark:bg-red-900/20' },
  ];

  return (
    <div className="space-y-4">
      {/* Horizontal bar */}
      <div className="h-4 rounded-full overflow-hidden flex shadow-inner bg-slate-100 dark:bg-slate-700">
        {items.map(item => {
          const pct = (item.count / total) * 100;
          if (pct === 0) return null;
          return <div key={item.label} style={{ width: `${pct}%`, backgroundColor: item.color }} className="h-full transition-all duration-700" />;
        })}
      </div>
      {/* Legend grid */}
      <div className="grid grid-cols-2 gap-2">
        {items.map(item => {
          const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
          return (
            <div key={item.label} className={`${item.bg} p-3 rounded-xl flex items-center gap-2`}>
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{item.count}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">{item.label} ({pct}%)</p>
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-center text-slate-400 dark:text-slate-500">总词汇量: <span className="font-bold text-slate-700 dark:text-slate-200">{total}</span></p>
    </div>
  );
}

// ===== Weekly Trend =====
function WeeklyTrend({ data }: { data: any[] }) {
  if (!data || data.length === 0) return <p className="text-slate-400 dark:text-slate-500 text-sm text-center py-8">暂无本周数据</p>;

  const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
  const maxWords = Math.max(1, ...data.map((d: any) => d.wordsLearned || 0));

  return (
    <div>
      <div className="flex items-end justify-between gap-3 h-28">
        {days.map((day, i) => {
          const d = data[i];
          const words = d?.wordsLearned || 0;
          const pct = (words / maxWords) * 100;
          const isToday = i === (new Date().getDay() + 6) % 7;
          return (
            <div key={day} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[10px] text-slate-500 dark:text-slate-400">{words > 0 ? words : ''}</span>
              <div className="w-full flex justify-center items-end" style={{ height: '80px' }}>
                <div className={`w-6 rounded-t-lg transition-all duration-500 ${
                  isToday ? 'bg-gradient-to-t from-indigo-600 to-indigo-400' : 'bg-gradient-to-t from-indigo-400 to-indigo-300 dark:from-indigo-600 dark:to-indigo-500'
                }`} style={{ height: `${Math.max(pct, 6)}%` }} />
              </div>
              <span className={`text-[11px] ${isToday ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-400 dark:text-slate-500'}`}>{day}</span>
            </div>
          );
        })}
      </div>
      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 grid grid-cols-3 gap-4 text-center">
        <div><p className="text-lg font-bold text-slate-800 dark:text-slate-100">{data.reduce((s: number, d: any) => s + (d.wordsLearned || 0), 0)}</p><p className="text-[11px] text-slate-500 dark:text-slate-400">本周单词</p></div>
        <div><p className="text-lg font-bold text-slate-800 dark:text-slate-100">{data.reduce((s: number, d: any) => s + (d.wordsReviewed || 0), 0)}</p><p className="text-[11px] text-slate-500 dark:text-slate-400">本周复习</p></div>
        <div><p className="text-lg font-bold text-slate-800 dark:text-slate-100">{data.filter((d: any) => d.wordsLearned > 0).length}</p><p className="text-[11px] text-slate-500 dark:text-slate-400">学习天数</p></div>
      </div>
    </div>
  );
}
