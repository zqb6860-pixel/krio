'use client';

import { AchievementWall } from '@/components/profile/AchievementWall';
import { AbilityRadar } from '@/components/profile/AbilityRadar';
import { WordBookManager } from '@/components/profile/WordBookManager';

export default function ProfilePage() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* User Header */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-400 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-lg">
            U
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-slate-800">学习者</h2>
            <p className="text-sm text-slate-500 mt-1">Lv.5 · 学习达人 · 已加入 45 天</p>
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-1.5">
                <span className="text-orange-500">🔥</span>
                <span className="text-sm font-medium text-slate-700">连续 7 天</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-yellow-500">💰</span>
                <span className="text-sm font-medium text-slate-700">1,250 金币</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-blue-500">📚</span>
                <span className="text-sm font-medium text-slate-700">1,256 词汇</span>
              </div>
            </div>
          </div>
          <button className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm text-slate-600 transition-colors">
            ⚙️ 设置
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: '累计学习', value: '1,256', unit: '单词', icon: '📖' },
          { label: '学习时长', value: '42.5', unit: '小时', icon: '⏱️' },
          { label: '完成关卡', value: '8', unit: '个', icon: '🎮' },
          { label: '最高连击', value: '23', unit: '连击', icon: '🔥' },
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
        <AbilityRadar />
        <AchievementWall />
      </div>

      <WordBookManager />
    </div>
  );
}
