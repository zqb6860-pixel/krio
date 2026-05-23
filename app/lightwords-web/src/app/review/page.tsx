'use client';

import { useState, useRef } from 'react';
import { api } from '@/lib/api';
import { useApi } from '@/hooks/useApi';

export default function ReviewPage() {
  const { data: reviewData, loading, error, refetch } = useApi(() => api.getReviewWords(20), []);
  const { data: distribution } = useApi(() => api.getDistribution(), []);
  const [mode, setMode] = useState<'overview' | 'flashcard'>('overview');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showMeaning, setShowMeaning] = useState(false);
  const [reviewed, setReviewed] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const startTimeRef = useRef<number>(Date.now());

  const words = reviewData?.words || [];
  const totalPending = reviewData?.totalPending || 0;

  const handleStartReview = () => {
    setMode('flashcard');
    setCurrentIndex(0);
    setShowMeaning(false);
    setReviewed(0);
  };

  const handleReveal = () => {
    startTimeRef.current = Date.now();
    setShowMeaning(true);
  };

  const handleResult = async (status: 'known' | 'vague' | 'unknown') => {
    if (submitting) return;
    const word = words[currentIndex];
    if (!word) return;

    setSubmitting(true);
    const responseTimeMs = Date.now() - startTimeRef.current;
    const correct = status === 'known';

    try {
      await api.recordAnswer(word.id, correct, responseTimeMs);
      if (correct || status === 'vague') setReviewed((r) => r + 1);
    } catch (err) {
      console.error('Record error:', err);
    }

    setSubmitting(false);
    setShowMeaning(false);

    if (currentIndex < words.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      // Done
      setMode('overview');
      refetch();
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto flex items-center justify-center h-[60vh]">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Flashcard mode
  if (mode === 'flashcard') {
    if (words.length === 0) {
      return (
        <div className="max-w-lg mx-auto flex items-center justify-center h-[60vh]">
          <div className="glass-card p-8 text-center">
            <span className="text-5xl">✅</span>
            <h3 className="text-xl font-bold text-slate-800 mt-4">没有待复习单词</h3>
            <p className="text-slate-500 mt-2">所有单词都复习完了，太棒了！</p>
            <button onClick={() => setMode('overview')} className="mt-4 px-5 py-2 bg-blue-500 text-white rounded-xl text-sm">返回</button>
          </div>
        </div>
      );
    }

    const word = words[currentIndex];
    const meanings = word?.meanings || [];

    return (
      <div className="max-w-lg mx-auto space-y-6">
        {/* Progress */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500">{currentIndex + 1} / {words.length}</span>
          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${((currentIndex + 1) / words.length) * 100}%` }} />
          </div>
          <button onClick={() => setMode('overview')} className="text-xs text-slate-400 hover:text-slate-600">退出</button>
        </div>

        {/* Flashcard */}
        <div
          className="glass-card p-8 min-h-[280px] flex flex-col items-center justify-center cursor-pointer hover:shadow-xl transition-shadow"
          onClick={!showMeaning ? handleReveal : undefined}
        >
          <h2 className="text-4xl font-bold text-slate-800 mb-2">{word?.word}</h2>
          <p className="text-slate-400">{word?.phonetic || word?.phoneticUs}</p>

          {showMeaning ? (
            <div className="mt-6 text-center space-y-1">
              {meanings.map((m: any, i: number) => (
                <p key={i} className="text-lg text-blue-600 font-medium">
                  <span className="text-sm text-blue-400">{m.partOfSpeech}</span> {m.translation}
                </p>
              ))}
            </div>
          ) : (
            <p className="mt-6 text-sm text-slate-400">点击卡片翻转查看释义</p>
          )}
        </div>

        {/* Action Buttons */}
        {showMeaning && (
          <div className="flex gap-3">
            <button onClick={() => handleResult('unknown')} disabled={submitting}
              className="flex-1 py-3 bg-red-50 hover:bg-red-100 text-red-600 font-medium rounded-xl transition-colors disabled:opacity-50">
              😣 不认识
            </button>
            <button onClick={() => handleResult('vague')} disabled={submitting}
              className="flex-1 py-3 bg-yellow-50 hover:bg-yellow-100 text-yellow-600 font-medium rounded-xl transition-colors disabled:opacity-50">
              🤔 模糊
            </button>
            <button onClick={() => handleResult('known')} disabled={submitting}
              className="flex-1 py-3 bg-green-50 hover:bg-green-100 text-green-600 font-medium rounded-xl transition-colors disabled:opacity-50">
              😊 认识
            </button>
          </div>
        )}
      </div>
    );
  }

  // Overview mode
  const dist = distribution || { mastered: 0, familiar: 0, vague: 0, unknown: 0 };
  const totalDist = dist.mastered + dist.familiar + dist.vague + dist.unknown;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800">🔄 复习中心</h2>
            <p className="text-sm text-slate-500 mt-1">基于智能遗忘曲线，精准安排复习</p>
          </div>
          <button onClick={handleStartReview}
            className="px-4 py-2 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
            disabled={totalPending === 0}>
            {totalPending > 0 ? `开始复习 (${totalPending}个)` : '暂无待复习'}
          </button>
        </div>
      </div>

      {reviewed > 0 && (
        <div className="glass-card p-4 bg-green-50 border border-green-200">
          <p className="text-green-700 text-sm font-medium">✅ 刚才复习了 {reviewed} 个单词，记忆在加深！</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Mastery Distribution */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">📊 掌握度分布</h3>
          {totalDist === 0 ? (
            <p className="text-slate-400 text-sm py-8 text-center">还没有学习记录，开始学习吧！</p>
          ) : (
            <div className="space-y-3">
              {[
                { label: '已掌握', count: dist.mastered, pct: Math.round((dist.mastered / totalDist) * 100), color: 'bg-green-500' },
                { label: '熟悉', count: dist.familiar, pct: Math.round((dist.familiar / totalDist) * 100), color: 'bg-blue-500' },
                { label: '模糊', count: dist.vague, pct: Math.round((dist.vague / totalDist) * 100), color: 'bg-yellow-500' },
                { label: '陌生', count: dist.unknown, pct: Math.round((dist.unknown / totalDist) * 100), color: 'bg-red-500' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <span className="text-sm text-slate-600 w-16">{item.label}</span>
                  <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${item.color} rounded-full flex items-center justify-end pr-2 transition-all duration-500`} style={{ width: `${Math.max(item.pct, 5)}%` }}>
                      {item.count > 0 && <span className="text-xs text-white font-medium">{item.count}</span>}
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 w-10">{item.pct}%</span>
                </div>
              ))}
              <div className="mt-4 pt-4 border-t border-slate-100 text-center">
                <p className="text-sm text-slate-500">总词汇量: <span className="font-bold text-slate-800">{totalDist}</span> 个</p>
              </div>
            </div>
          )}
        </div>

        {/* Review Insight */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">💡 复习建议</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <span className="text-sm text-slate-700">待复习单词</span>
              <span className={`text-sm font-bold ${totalPending > 0 ? 'text-red-500' : 'text-green-500'}`}>
                {totalPending} 个
              </span>
            </div>
            <div className="p-4 bg-blue-50 rounded-xl">
              <p className="text-sm text-blue-700">
                {totalPending > 10
                  ? '💡 你有较多单词即将到达遗忘临界点，建议尽快复习！'
                  : totalPending > 0
                  ? '💡 还有少量单词需要复习，保持节奏！'
                  : '🎉 太棒了！当前没有需要复习的单词。'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
