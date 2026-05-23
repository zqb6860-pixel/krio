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
  const { data: distribution } = useApi(() => api.getDistribution(), []);
  const { data: checkins } = useApi(() => api.getCheckinHistory(60), []);
  const { data: weeklyStats } = useApi(() => api.getWeeklyStats(), []);

  const totalWords = stats?.total || 0;
  const totalTime = weeklyStats?.reduce((s: number, d: any) => s + (d.timeSpent || 0), 0) || 0;

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
