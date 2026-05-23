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
  const [showCheckinAnim, setShowCheckinAnim] = useState(false);
  const [showMilestone, setShowMilestone] = useState<number | null>(null);

  const totalWords = stats?.total || 0;
  const totalTime = weeklyStats?.reduce((s: number, d: any) => s + (d.timeSpent || 0), 0) || 0;
  const streak = user?.streak || 0;

  // 检查是否达到里程碑
  useEffect(() => {
    const milestones = [7, 14, 30, 50, 100, 200, 365];
    const hitMilestone = milestones.find(m => m === streak);
    if (hitMilestone && streak > 0) {
      setShowMilestone(hitMilestone);
    }
  }, [streak]);

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
            {/* Experience bar */}
            <div className="mt-2 max-w-xs">
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>{user?.experience || 0} XP</span>
                <span>下一级 {((user?.level || 1)) * 100} XP</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                  style={{ width: `${Math.min(100, ((user?.experience || 0) % 100))}%` }} />
              </div>
            </div>
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
                <span className="text-red-500">❤️</span>
                <span className="text-sm font-medium text-slate-700">{user?.hearts || 5} 生命</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Link href="/settings" className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm text-slate-600 transition-colors text-center">
              ⚙️ 设置
            </Link>
            <button onClick={logout} className="px-4 py-2 bg-red-50 hover:bg-red-100 rounded-xl text-sm text-red-500 transition-colors">
              退出登录
            </button>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: '累计学习', value: totalWords, unit: '词', icon: '📖', color: 'text-blue-600' },
          { label: '已掌握', value: stats?.mastered || 0, unit: '词', icon: '✅', color: 'text-green-600' },
          { label: '学习中', value: stats?.learning || 0, unit: '词', icon: '📝', color: 'text-orange-600' },
          { label: '待复习', value: stats?.pendingReview || 0, unit: '词', icon: '🔄', color: 'text-purple-600' },
          { label: '本周时长', value: totalTime > 60 ? `${(totalTime/60).toFixed(1)}h` : `${totalTime}m`, unit: '', icon: '⏱️', color: 'text-pink-600' },
        ].map((stat) => (
          <div key={stat.label} className="glass-card p-4 text-center">
            <span className="text-xl">{stat.icon}</span>
            <p className={`text-xl font-bold mt-1 ${stat.color}`}>{stat.value}{stat.unit}</p>
            <p className="text-xs text-slate-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 打卡激励系统 (参考不背单词) */}
        <div className="glass-card p-6 lg:col-span-2">
          <StreakIncentivePanel
            streak={streak}
            checkins={checkins || []}
            showAnim={showCheckinAnim}
            onAnimEnd={() => setShowCheckinAnim(false)}
          />
        </div>

        {/* Milestone Celebration Modal */}
        {showMilestone && (
          <MilestoneCelebration
            days={showMilestone}
            onClose={() => setShowMilestone(null)}
          />
        )}

        {/* Checkin Calendar */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">📅 打卡日历</h3>
          <CheckinCalendar checkins={checkins || []} streak={user?.streak || 0} />
        </div>

        {/* Mastery Distribution */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">📊 掌握度分布</h3>
          <MasteryChart distribution={distribution} />
        </div>
      </div>

      {/* Weekly Trend */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">📈 学习趋势（近7天）</h3>
        <WeeklyTrend data={weeklyStats || []} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Achievements */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-800">🏆 成就墙</h3>
            <span className="text-xs text-slate-500">
              {achievements?.filter((a: any) => a.isUnlocked).length || 0}/{achievements?.length || 0}
            </span>
          </div>
          {achievements && achievements.length > 0 ? (
            <div className="grid grid-cols-5 gap-2">
              {achievements.map((ach: any) => (
                <div key={ach.id} className={`p-2 rounded-xl text-center transition-all ${ach.isUnlocked ? 'bg-gradient-to-b from-yellow-50 to-orange-50' : 'bg-slate-50 opacity-40'}`}
                  title={`${ach.name}: ${ach.description}`}>
                  <span className="text-xl">{ach.icon}</span>
                  <p className="text-[10px] text-slate-600 mt-0.5 truncate">{ach.name}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 text-sm text-center py-4">暂无成就数据</p>
          )}
        </div>

        {/* Word Books */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">📖 我的词库</h3>
          {wordBooks && wordBooks.length > 0 ? (
            <div className="space-y-3">
              {wordBooks.map((book: any) => (
                <div key={book.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <span className="text-xl">📚</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{book.name}</p>
                    <p className="text-xs text-slate-500">{book.wordCount} 词 · {'⭐'.repeat(Math.min(book.difficulty, 5))}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 text-sm text-center py-4">暂无词库</p>
          )}
        </div>
      </div>
    </div>
  );
}

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

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-slate-700">{year}年 {months[month]}</span>
        <div className="flex items-center gap-1 text-sm">
          <span className="text-orange-500">🔥</span>
          <span className="font-bold text-orange-600">{streak}</span>
          <span className="text-slate-400">天连续</span>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {weekDays.map((d) => (
          <div key={d} className="text-xs text-slate-400 py-1 font-medium">{d}</div>
        ))}
        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <div key={`e-${i}`} className="aspect-square" />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const checkin = checkinMap.get(day);
          const isToday = day === currentDay;
          const isChecked = !!checkin;
          const words = checkin?.wordsLearned || 0;
          return (
            <div key={day}
              title={isChecked ? `学习了${words}个单词` : ''}
              className={`aspect-square flex items-center justify-center text-xs rounded-lg transition-colors relative ${
                isToday ? 'bg-blue-500 text-white font-bold ring-2 ring-blue-300' :
                isChecked ? 'bg-green-100 text-green-700 font-medium' :
                day > currentDay ? 'text-slate-200' : 'text-slate-400'
              }`}
            >
              {day}
              {isChecked && !isToday && <div className="absolute bottom-0.5 w-1 h-1 bg-green-500 rounded-full" />}
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-green-100 border border-green-200" /><span>已打卡</span></div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-blue-500" /><span>今天</span></div>
        <div className="flex-1 text-right text-slate-400">本月打卡 {checkins.filter((c: any) => {
          const d = c.date || '';
          return d.startsWith(`${year}-${String(month+1).padStart(2,'0')}`);
        }).length} 天</div>
      </div>
    </div>
  );
}

function MasteryChart({ distribution }: { distribution: any }) {
  if (!distribution) return <p className="text-slate-400 text-sm text-center py-8">暂无数据</p>;
  
  const total = (distribution.mastered || 0) + (distribution.familiar || 0) + (distribution.vague || 0) + (distribution.unknown || 0);
  if (total === 0) return <p className="text-slate-400 text-sm text-center py-8">开始学习后这里会显示掌握度分析</p>;

  const items = [
    { label: '已掌握', count: distribution.mastered || 0, color: '#10b981', emoji: '🟢' },
    { label: '熟悉', count: distribution.familiar || 0, color: '#3b82f6', emoji: '🔵' },
    { label: '模糊', count: distribution.vague || 0, color: '#f59e0b', emoji: '🟡' },
    { label: '陌生', count: distribution.unknown || 0, color: '#ef4444', emoji: '🔴' },
  ];

  return (
    <div>
      {/* Donut-like visual */}
      <div className="flex items-center justify-center gap-1 h-6 mb-4 rounded-full overflow-hidden">
        {items.map((item) => {
          const pct = (item.count / total) * 100;
          if (pct === 0) return null;
          return <div key={item.label} style={{ width: `${pct}%`, backgroundColor: item.color }} className="h-full" />;
        })}
      </div>
      <div className="space-y-3">
        {items.map((item) => {
          const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
          return (
            <div key={item.label} className="flex items-center gap-3">
              <span>{item.emoji}</span>
              <span className="text-sm text-slate-600 w-12">{item.label}</span>
              <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${Math.max(pct, 2)}%`, backgroundColor: item.color }} />
              </div>
              <span className="text-xs text-slate-500 w-16 text-right">{item.count} ({pct}%)</span>
            </div>
          );
        })}
      </div>
      <p className="text-center text-sm text-slate-500 mt-4">总词汇量: <span className="font-bold text-slate-800">{total}</span></p>
    </div>
  );
}

function WeeklyTrend({ data }: { data: any[] }) {
  if (!data || data.length === 0) {
    return <p className="text-slate-400 text-sm text-center py-8">暂无本周数据，学习后这里会显示趋势图</p>;
  }

  const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
  const maxWords = Math.max(1, ...data.map((d: any) => d.wordsLearned || 0));

  return (
    <div>
      <div className="flex items-end justify-between gap-3 h-32">
        {days.map((day, i) => {
          const d = data[i];
          const words = d?.wordsLearned || 0;
          const time = d?.timeSpent || 0;
          const pct = (words / maxWords) * 100;
          return (
            <div key={day} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xs text-slate-500">{words > 0 ? words : ''}</span>
              <div className="w-full flex justify-center items-end" style={{ height: '80px' }}>
                <div className="w-6 bg-gradient-to-t from-blue-500 to-blue-300 rounded-t transition-all duration-500"
                  style={{ height: `${Math.max(pct, 5)}%` }}
                  title={`${words}词 / ${time}分钟`} />
              </div>
              <span className="text-xs text-slate-500">{day}</span>
            </div>
          );
        })}
      </div>
      <div className="mt-3 pt-3 border-t border-slate-100 flex justify-around text-center">
        <div>
          <p className="text-lg font-bold text-slate-800">{data.reduce((s: number, d: any) => s + (d.wordsLearned || 0), 0)}</p>
          <p className="text-xs text-slate-500">本周单词</p>
        </div>
        <div>
          <p className="text-lg font-bold text-slate-800">{data.reduce((s: number, d: any) => s + (d.wordsReviewed || 0), 0)}</p>
          <p className="text-xs text-slate-500">本周复习</p>
        </div>
        <div>
          <p className="text-lg font-bold text-slate-800">{data.filter((d: any) => d.wordsLearned > 0).length}</p>
          <p className="text-xs text-slate-500">学习天数</p>
        </div>
      </div>
    </div>
  );
}



// ===== 打卡激励面板 (参考不背单词) =====
function StreakIncentivePanel({ streak, checkins, showAnim, onAnimEnd }: {
  streak: number; checkins: any[]; showAnim: boolean; onAnimEnd: () => void;
}) {
  const milestones = [
    { days: 7, label: '7天', icon: '🌟', reward: '新手坚持', color: 'from-blue-400 to-blue-500' },
    { days: 14, label: '14天', icon: '💎', reward: '习惯养成', color: 'from-purple-400 to-purple-500' },
    { days: 30, label: '30天', icon: '🏆', reward: '月度达人', color: 'from-yellow-400 to-orange-500' },
    { days: 50, label: '50天', icon: '🔥', reward: '半百挑战', color: 'from-red-400 to-red-500' },
    { days: 100, label: '100天', icon: '👑', reward: '百日王者', color: 'from-amber-400 to-amber-600' },
    { days: 365, label: '365天', icon: '🎖️', reward: '年度传奇', color: 'from-emerald-400 to-emerald-600' },
  ];

  // 找到下一个里程碑
  const nextMilestone = milestones.find(m => m.days > streak) || milestones[milestones.length - 1];
  const prevMilestone = [...milestones].reverse().find(m => m.days <= streak);
  const progressToNext = nextMilestone ? Math.min(100, (streak / nextMilestone.days) * 100) : 100;

  // 本月打卡天数
  const today = new Date();
  const thisMonthCheckins = checkins.filter((c: any) => {
    const d = c.date || '';
    return d.startsWith(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`);
  }).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-800">🔥 打卡激励</h3>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-slate-500">本月打卡 <span className="font-bold text-blue-600">{thisMonthCheckins}</span> 天</span>
        </div>
      </div>

      {/* Streak Display */}
      <div className="flex items-center gap-6">
        {/* Streak Fire Counter */}
        <div className="relative">
          <div className={`w-24 h-24 rounded-2xl bg-gradient-to-br ${streak > 0 ? 'from-orange-400 to-red-500' : 'from-slate-200 to-slate-300'} flex items-center justify-center shadow-lg ${streak > 0 ? 'shadow-orange-200' : ''}`}>
            <div className="text-center text-white">
              <p className="text-3xl font-black">{streak}</p>
              <p className="text-xs opacity-80">连续天</p>
            </div>
          </div>
          {streak > 0 && (
            <div className="absolute -top-2 -right-2 text-2xl animate-bounce">🔥</div>
          )}
        </div>

        {/* Progress to next milestone */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-600">
              {prevMilestone ? `已达成: ${prevMilestone.icon} ${prevMilestone.reward}` : '开始你的打卡之旅'}
            </span>
            <span className="text-sm text-slate-500">
              下一目标: {nextMilestone.icon} {nextMilestone.label}
            </span>
          </div>
          <div className="h-4 bg-slate-100 rounded-full overflow-hidden relative">
            <div
              className="h-full bg-gradient-to-r from-orange-400 to-red-500 rounded-full transition-all duration-1000 relative"
              style={{ width: `${progressToNext}%` }}
            >
              <div className="absolute right-0 top-0 bottom-0 w-3 bg-white/30 rounded-full animate-pulse" />
            </div>
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-slate-400">{streak}天</span>
            <span className="text-xs text-slate-400">还差 {Math.max(0, nextMilestone.days - streak)} 天</span>
          </div>
        </div>
      </div>

      {/* Milestone Timeline */}
      <div className="flex items-center gap-1 overflow-x-auto py-2">
        {milestones.map((m) => {
          const achieved = streak >= m.days;
          return (
            <div
              key={m.days}
              className={`flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-xl transition-all ${
                achieved ? 'bg-gradient-to-b from-amber-50 to-orange-50 border border-amber-200' : 'bg-slate-50 border border-slate-100 opacity-50'
              }`}
            >
              <span className={`text-xl ${achieved ? '' : 'grayscale'}`}>{m.icon}</span>
              <span className={`text-xs mt-1 font-medium ${achieved ? 'text-amber-700' : 'text-slate-400'}`}>{m.label}</span>
              <span className="text-[10px] text-slate-400">{m.reward}</span>
              {achieved && <span className="text-[10px] text-green-600 font-bold mt-0.5">✓</span>}
            </div>
          );
        })}
      </div>

      {/* Streak Tips */}
      <div className="p-3 bg-orange-50 rounded-xl border border-orange-100">
        <p className="text-xs text-orange-700">
          {streak === 0 && '💡 今天开始打卡吧！坚持7天就能获得第一个成就。'}
          {streak > 0 && streak < 7 && `💪 再坚持 ${7 - streak} 天就能获得「新手坚持」成就！加油！`}
          {streak >= 7 && streak < 30 && `🌟 已经坚持了${streak}天，向30天「月度达人」冲刺！`}
          {streak >= 30 && streak < 100 && `🔥 ${streak}天连续学习，你的坚持正在创造奇迹！`}
          {streak >= 100 && `👑 ${streak}天！你是真正的词汇王者！`}
        </p>
      </div>
    </div>
  );
}

// ===== 里程碑庆祝弹窗 =====
function MilestoneCelebration({ days, onClose }: { days: number; onClose: () => void }) {
  const milestoneInfo: Record<number, { icon: string; title: string; desc: string; reward: string }> = {
    7: { icon: '🌟', title: '7天连续打卡！', desc: '你已经养成了学习习惯', reward: '+50 金币' },
    14: { icon: '💎', title: '14天坚持！', desc: '习惯已经扎根，继续保持', reward: '+100 金币' },
    30: { icon: '🏆', title: '月度达人！', desc: '一个月的坚持，了不起！', reward: '+200 金币 + 稀有徽章' },
    50: { icon: '🔥', title: '50天挑战达成！', desc: '半百坚持，你就是学习榜样', reward: '+300 金币' },
    100: { icon: '👑', title: '百日王者！', desc: '100天连续学习，传说般的存在', reward: '+500 金币 + 限定头像框' },
    365: { icon: '🎖️', title: '年度传奇！', desc: '365天不间断，你创造了传奇', reward: '+1000 金币 + 永久勋章' },
  };

  const info = milestoneInfo[days] || { icon: '🎉', title: `${days}天打卡！`, desc: '恭喜达成里程碑', reward: '+金币奖励' };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fadeIn" onClick={onClose}>
      <div className="bg-white rounded-3xl p-8 max-w-sm mx-4 text-center shadow-2xl transform animate-bounceIn" onClick={e => e.stopPropagation()}>
        {/* Celebration Animation */}
        <div className="relative">
          <div className="text-7xl mb-4 animate-bounce">{info.icon}</div>
          <div className="absolute -top-4 -left-4 text-2xl animate-ping opacity-50">✨</div>
          <div className="absolute -top-2 -right-6 text-2xl animate-ping opacity-50 delay-100">🎉</div>
          <div className="absolute top-8 -right-4 text-xl animate-ping opacity-50 delay-200">⭐</div>
        </div>
        
        <h2 className="text-2xl font-black text-slate-800 mb-2">{info.title}</h2>
        <p className="text-slate-500 mb-4">{info.desc}</p>
        
        <div className="p-3 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl border border-amber-200 mb-6">
          <p className="text-sm font-bold text-amber-700">🎁 奖励: {info.reward}</p>
        </div>

        <button
          onClick={onClose}
          className="px-8 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl hover:shadow-lg transition-all"
        >
          太棒了！继续努力
        </button>
      </div>
    </div>
  );
}
