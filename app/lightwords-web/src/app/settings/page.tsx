'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import Link from 'next/link';

const BATCH_SIZE_OPTIONS = [5, 10, 15, 20, 30];

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState({
    dailyWordGoal: 30,
    dailyTimeGoal: 30,
    weeklyDaysGoal: 5,
    batchSize: 10,
    pronunciation: 'us',
    theme: 'light',
    fontSize: 'medium',
    reminderTime: '',
  });
  const [useCustomBatch, setUseCustomBatch] = useState(false);
  const [customBatchValue, setCustomBatchValue] = useState('');

  useEffect(() => {
    if (user?.settings) {
      const batch = user.settings.batchSize || 10;
      const isPreset = BATCH_SIZE_OPTIONS.includes(batch);
      setSettings({
        dailyWordGoal: user.settings.dailyWordGoal || 30,
        dailyTimeGoal: user.settings.dailyTimeGoal || 30,
        weeklyDaysGoal: user.settings.weeklyDaysGoal || 5,
        batchSize: batch,
        pronunciation: user.settings.pronunciation || 'us',
        theme: user.settings.theme || 'light',
        fontSize: user.settings.fontSize || 'medium',
        reminderTime: user.settings.reminderTime || '',
      });
      if (!isPreset) {
        setUseCustomBatch(true);
        setCustomBatchValue(String(batch));
      }
    }
  }, [user]);

  const handleBatchSelect = (value: number) => {
    setUseCustomBatch(false);
    setCustomBatchValue('');
    setSettings(s => ({ ...s, batchSize: value }));
  };

  const handleCustomBatchToggle = () => {
    setUseCustomBatch(true);
    setCustomBatchValue(String(settings.batchSize));
  };

  const handleCustomBatchChange = (value: string) => {
    setCustomBatchValue(value);
    const num = parseInt(value, 10);
    if (!isNaN(num) && num >= 1 && num <= 200) {
      setSettings(s => ({ ...s, batchSize: num }));
    }
  };

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
          <Link href="/profile" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">← 返回</Link>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">⚙️ 学习设置</h2>
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
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">🎯 学习目标</h3>
        <div className="space-y-5">
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">每日单词目标</label>
              <span className="text-sm text-blue-600 dark:text-blue-400 font-bold">{settings.dailyWordGoal} 个</span>
            </div>
            <input
              type="range" min="5" max="100" step="5"
              value={settings.dailyWordGoal}
              onChange={(e) => setSettings(s => ({ ...s, dailyWordGoal: Number(e.target.value) }))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>5个</span><span>50个</span><span>100个</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">每日学习时长目标</label>
              <span className="text-sm text-blue-600 dark:text-blue-400 font-bold">{settings.dailyTimeGoal} 分钟</span>
            </div>
            <input
              type="range" min="10" max="120" step="5"
              value={settings.dailyTimeGoal}
              onChange={(e) => setSettings(s => ({ ...s, dailyTimeGoal: Number(e.target.value) }))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>10分钟</span><span>60分钟</span><span>120分钟</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">每周学习天数</label>
              <span className="text-sm text-blue-600 dark:text-blue-400 font-bold">{settings.weeklyDaysGoal} 天</span>
            </div>
            <div className="flex gap-2">
              {[3, 4, 5, 6, 7].map((d) => (
                <button
                  key={d}
                  onClick={() => setSettings(s => ({ ...s, weeklyDaysGoal: d }))}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    settings.weeklyDaysGoal === d
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  {d}天
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Batch Size - 每段学习数量 */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">📦 每段学习数量</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">设置每次学习时加载的单词数量，学完后可继续下一段</p>
        <div className="space-y-4">
          {/* Preset options */}
          <div className="flex flex-wrap gap-2">
            {BATCH_SIZE_OPTIONS.map((n) => (
              <button
                key={n}
                onClick={() => handleBatchSelect(n)}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  !useCustomBatch && settings.batchSize === n
                    ? 'bg-blue-500 text-white shadow-md shadow-blue-500/25 scale-105'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                {n} 个
              </button>
            ))}
            {/* Custom toggle button */}
            <button
              onClick={handleCustomBatchToggle}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                useCustomBatch
                  ? 'bg-blue-500 text-white shadow-md shadow-blue-500/25 scale-105'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              自定义
            </button>
          </div>

          {/* Custom input */}
          {useCustomBatch && (
            <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800/30 animate-fadeIn">
              <label className="text-sm text-slate-600 dark:text-slate-300 flex-shrink-0">自定义数量：</label>
              <input
                type="number"
                min="1"
                max="200"
                value={customBatchValue}
                onChange={(e) => handleCustomBatchChange(e.target.value)}
                placeholder="输入 1-200"
                className="w-24 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-center font-medium bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
              />
              <span className="text-sm text-slate-500 dark:text-slate-400">个/段</span>
              {customBatchValue && (parseInt(customBatchValue) < 1 || parseInt(customBatchValue) > 200) && (
                <span className="text-xs text-red-500">请输入 1-200 之间的数字</span>
              )}
            </div>
          )}

          {/* Current selection hint */}
          <p className="text-xs text-slate-400 dark:text-slate-500">
            当前设置：每段学习 <span className="font-bold text-blue-600 dark:text-blue-400">{settings.batchSize}</span> 个单词
          </p>
        </div>
      </div>

      {/* Pronunciation */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">🔊 发音设置</h3>
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
                  ? 'border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <p className="font-medium text-slate-800 dark:text-slate-100">{opt.label}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{opt.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Display */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">🎨 显示设置</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">字体大小</label>
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
                      ? 'border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <span className={opt.sample}>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">学习提醒时间</label>
            <input
              type="time"
              value={settings.reminderTime}
              onChange={(e) => setSettings(s => ({ ...s, reminderTime: e.target.value }))}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">设置每日学习提醒时间</p>
          </div>
        </div>
      </div>

      {/* Account */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">👤 账户信息</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-slate-600 dark:text-slate-400">用户名</span>
            <span className="text-sm font-medium text-slate-800 dark:text-slate-100">{user?.username}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-t border-slate-100 dark:border-slate-700">
            <span className="text-sm text-slate-600 dark:text-slate-400">邮箱</span>
            <span className="text-sm font-medium text-slate-800 dark:text-slate-100">{user?.email}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-t border-slate-100 dark:border-slate-700">
            <span className="text-sm text-slate-600 dark:text-slate-400">等级</span>
            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">Lv.{user?.level}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-t border-slate-100 dark:border-slate-700">
            <span className="text-sm text-slate-600 dark:text-slate-400">经验值</span>
            <span className="text-sm font-medium text-slate-800 dark:text-slate-100">{user?.experience} XP</span>
          </div>
        </div>
      </div>
    </div>
  );
}
