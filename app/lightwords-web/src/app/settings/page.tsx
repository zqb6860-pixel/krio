'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import Link from 'next/link';

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState({
    dailyWordGoal: 30,
    dailyTimeGoal: 30,
    weeklyDaysGoal: 5,
    pronunciation: 'us',
    theme: 'light',
    fontSize: 'medium',
    reminderTime: '',
  });

  useEffect(() => {
    if (user?.settings) {
      setSettings({
        dailyWordGoal: user.settings.dailyWordGoal || 30,
        dailyTimeGoal: user.settings.dailyTimeGoal || 30,
        weeklyDaysGoal: user.settings.weeklyDaysGoal || 5,
        pronunciation: user.settings.pronunciation || 'us',
        theme: user.settings.theme || 'light',
        fontSize: user.settings.fontSize || 'medium',
        reminderTime: user.settings.reminderTime || '',
      });
    }
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateSettings(settings);
      await refreshUser();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Save failed:', err);
    }
    setSaving(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/profile" className="text-slate-400 hover:text-slate-600">← 返回</Link>
          <h2 className="text-xl font-bold text-slate-800">⚙️ 学习设置</h2>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
        >
          {saving ? '保存中...' : saved ? '✓ 已保存' : '保存设置'}
        </button>
      </div>

      {/* Learning Goals */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">🎯 学习目标</h3>
        <div className="space-y-5">
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium text-slate-700">每日单词目标</label>
              <span className="text-sm text-blue-600 font-bold">{settings.dailyWordGoal} 个</span>
            </div>
            <input
              type="range" min="5" max="100" step="5"
              value={settings.dailyWordGoal}
              onChange={(e) => setSettings(s => ({ ...s, dailyWordGoal: Number(e.target.value) }))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>5个</span><span>50个</span><span>100个</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium text-slate-700">每日学习时长目标</label>
              <span className="text-sm text-blue-600 font-bold">{settings.dailyTimeGoal} 分钟</span>
            </div>
            <input
              type="range" min="10" max="120" step="5"
              value={settings.dailyTimeGoal}
              onChange={(e) => setSettings(s => ({ ...s, dailyTimeGoal: Number(e.target.value) }))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>10分钟</span><span>60分钟</span><span>120分钟</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium text-slate-700">每周学习天数</label>
              <span className="text-sm text-blue-600 font-bold">{settings.weeklyDaysGoal} 天</span>
            </div>
            <div className="flex gap-2">
              {[3, 4, 5, 6, 7].map((d) => (
                <button
                  key={d}
                  onClick={() => setSettings(s => ({ ...s, weeklyDaysGoal: d }))}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    settings.weeklyDaysGoal === d
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {d}天
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Pronunciation */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">🔊 发音设置</h3>
        <div className="flex gap-3">
          {[
            { value: 'us', label: '🇺🇸 美式发音', desc: 'American English' },
            { value: 'uk', label: '🇬🇧 英式发音', desc: 'British English' },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSettings(s => ({ ...s, pronunciation: opt.value }))}
              className={`flex-1 p-4 rounded-xl border-2 text-left transition-all ${
                settings.pronunciation === opt.value
                  ? 'border-blue-400 bg-blue-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <p className="font-medium text-slate-800">{opt.label}</p>
              <p className="text-xs text-slate-500 mt-1">{opt.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Display */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">🎨 显示设置</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">字体大小</label>
            <div className="flex gap-3">
              {[
                { value: 'small', label: '小', sample: 'text-sm' },
                { value: 'medium', label: '中', sample: 'text-base' },
                { value: 'large', label: '大', sample: 'text-lg' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSettings(s => ({ ...s, fontSize: opt.value }))}
                  className={`flex-1 py-3 rounded-xl border-2 text-center transition-all ${
                    settings.fontSize === opt.value
                      ? 'border-blue-400 bg-blue-50 text-blue-700'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <span className={opt.sample}>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">学习提醒时间</label>
            <input
              type="time"
              value={settings.reminderTime}
              onChange={(e) => setSettings(s => ({ ...s, reminderTime: e.target.value }))}
              className="px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <p className="text-xs text-slate-400 mt-1">设置每日学习提醒时间</p>
          </div>
        </div>
      </div>

      {/* Account */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">👤 账户信息</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-slate-600">用户名</span>
            <span className="text-sm font-medium text-slate-800">{user?.username}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-t border-slate-100">
            <span className="text-sm text-slate-600">邮箱</span>
            <span className="text-sm font-medium text-slate-800">{user?.email}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-t border-slate-100">
            <span className="text-sm text-slate-600">等级</span>
            <span className="text-sm font-medium text-blue-600">Lv.{user?.level}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-t border-slate-100">
            <span className="text-sm text-slate-600">经验值</span>
            <span className="text-sm font-medium text-slate-800">{user?.experience} XP</span>
          </div>
        </div>
      </div>
    </div>
  );
}
