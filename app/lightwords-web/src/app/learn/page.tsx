'use client';

import { useState, useCallback, useRef } from 'react';
import { api } from '@/lib/api';
import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/contexts/AuthContext';
import { AudioButton } from '@/components/common/AudioButton';

export default function LearnPage() {
  const { refreshUser } = useAuth();
  const { data: words, loading, error } = useApi(() => api.getTodayWords(), []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [learnedCount, setLearnedCount] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [activeTab, setActiveTab] = useState<'root' | 'example' | 'collocation'>('root');
  const [submitting, setSubmitting] = useState(false);
  const startTimeRef = useRef<number>(Date.now());

  const totalWords = words?.length || 0;
  const currentWord = words?.[currentIndex];

  const handleReveal = () => {
    startTimeRef.current = Date.now();
    setShowAnswer(true);
  };

  const handleAction = useCallback(async (status: 'known' | 'vague' | 'unknown') => {
    if (!currentWord || submitting) return;
    setSubmitting(true);

    const responseTimeMs = Date.now() - startTimeRef.current;
    const correct = status === 'known';

    try {
      await api.recordAnswer(currentWord.id, correct, responseTimeMs);
      if (correct || status === 'vague') {
        setLearnedCount((c) => c + 1);
      }
    } catch (err) {
      console.error('Failed to record answer:', err);
    }

    setSubmitting(false);
    setShowAnswer(false);
    setActiveTab('root');

    if (currentIndex < totalWords - 1) {
      setCurrentIndex((i) => i + 1);
    }
  }, [currentWord, currentIndex, totalWords, submitting]);

  // Loading state
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500">正在加载今日单词...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-center h-[60vh]">
        <div className="text-center glass-card p-8">
          <span className="text-4xl">😥</span>
          <p className="text-slate-700 mt-4 font-medium">加载失败</p>
          <p className="text-slate-500 text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (!words || words.length === 0) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-center h-[60vh]">
        <div className="text-center glass-card p-8">
          <span className="text-5xl">📖</span>
          <h3 className="text-xl font-bold text-slate-800 mt-4">没有待学习的单词</h3>
          <p className="text-slate-500 mt-2">请先选择一本词库，或者你已经学完了当前词库的全部单词</p>
          <div className="flex gap-3 mt-6 justify-center">
            <a href="/books" className="px-5 py-2.5 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600">选择词库</a>
            <a href="/review" className="px-5 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-medium hover:bg-orange-600">去复习</a>
          </div>
        </div>
      </div>
    );
  }

  // Completed state
  if (currentIndex >= totalWords - 1 && showAnswer === false && learnedCount > 0 && currentIndex > 0) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-center h-[60vh]">
        <div className="glass-card p-8 text-center">
          <span className="text-5xl">🎉</span>
          <h3 className="text-xl font-bold text-slate-800 mt-4">今日学习完成！</h3>
          <p className="text-slate-500 mt-2">你已学习 <span className="font-bold text-blue-600">{learnedCount}</span> 个单词，继续保持！</p>
          <div className="flex gap-3 mt-6 justify-center">
            <a href="/review" className="px-5 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-medium hover:bg-orange-600">去复习</a>
            <a href="/" className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-200">返回首页</a>
          </div>
        </div>
      </div>
    );
  }

  const word = currentWord;
  const meanings = word.meanings || [];
  const roots = word.roots || [];
  const examples = word.examples || [];
  const collocations = word.collocations || [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress Header */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-slate-800">📚 单词学习</h2>
          <span className="text-sm text-slate-500">{currentIndex + 1} / {totalWords}</span>
        </div>
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
          <span>进度 {Math.round(((currentIndex + 1) / totalWords) * 100)}%</span>
          <span className="text-green-600">已学 {learnedCount} 个</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-300" style={{ width: `${((currentIndex + 1) / totalWords) * 100}%` }} />
        </div>
      </div>

      {/* Word Card */}
      <div className="glass-card overflow-hidden">
        {/* Word Header */}
        <div className="p-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold">{word.word}</h2>
              <p className="text-blue-100 mt-1">{word.phonetic || word.phoneticUs || ''}</p>
            </div>
            <AudioButton audioUrl={word.audioUs} word={word.word} size="lg" variant="white" />
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {!showAnswer ? (
            <div className="text-center py-8">
              <p className="text-slate-400 text-sm mb-4">你认识这个单词吗？</p>
              <button onClick={handleReveal} className="px-6 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 font-medium transition-colors">
                显示释义
              </button>
            </div>
          ) : (
            <>
              {/* Meaning */}
              <div className="p-4 bg-blue-50 rounded-xl">
                {meanings.map((m: any, i: number) => (
                  <div key={i} className={i > 0 ? 'mt-2 pt-2 border-t border-blue-100' : ''}>
                    <span className="text-xs text-blue-600 font-medium">{m.partOfSpeech}</span>
                    <p className="text-lg font-semibold text-slate-800 mt-0.5">{m.translation}</p>
                    {m.definition && <p className="text-sm text-slate-500 mt-0.5">{m.definition}</p>}
                  </div>
                ))}
              </div>

              {/* Tabs */}
              <div className="flex gap-2 border-b border-slate-100 pb-2">
                {[
                  { key: 'root', label: '词根词缀', icon: '🌱', show: roots.length > 0 },
                  { key: 'example', label: '例句', icon: '📝', show: examples.length > 0 },
                  { key: 'collocation', label: '搭配', icon: '🔗', show: collocations.length > 0 },
                ].filter(t => t.show).map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`px-3 py-2 text-sm rounded-lg transition-colors ${activeTab === tab.key ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="min-h-[120px]">
                {activeTab === 'root' && roots.length > 0 && (
                  <div className="space-y-3">
                    {roots.map((r: any, i: number) => (
                      <div key={i} className="p-3 bg-green-50 rounded-lg">
                        <p className="text-sm font-medium text-green-800">
                          {r.type === 'prefix' ? '前缀' : r.type === 'suffix' ? '后缀' : '词根'}：{r.root}
                        </p>
                        <p className="text-sm text-green-700 mt-1">含义：{r.meaning}（{r.origin}）</p>
                        {r.relatedWords && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {(typeof r.relatedWords === 'string' ? JSON.parse(r.relatedWords) : r.relatedWords).map((w: string) => (
                              <span key={w} className="px-2 py-0.5 bg-green-100 rounded text-xs text-green-700">{w}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'example' && examples.length > 0 && (
                  <div className="space-y-3">
                    {examples.map((e: any, i: number) => (
                      <div key={i} className="p-4 bg-slate-50 rounded-lg border-l-4 border-blue-400">
                        <p className="text-sm text-slate-800 leading-relaxed">{e.sentence}</p>
                        <p className="text-sm text-slate-500 mt-2">{e.translation}</p>
                        <p className="text-xs text-slate-400 mt-2">—— {e.source}</p>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'collocation' && collocations.length > 0 && (
                  <div className="space-y-2">
                    {collocations.map((c: any, i: number) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                        <span className="text-sm font-medium text-blue-600">{c.phrase}</span>
                        <span className="text-xs text-slate-400">—</span>
                        <span className="text-sm text-slate-600">{c.translation}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Action Buttons */}
        {showAnswer && (
          <div className="p-4 border-t border-slate-100 flex gap-3">
            <button onClick={() => handleAction('unknown')} disabled={submitting}
              className="flex-1 py-3 bg-red-50 hover:bg-red-100 text-red-600 font-medium rounded-xl transition-colors disabled:opacity-50">
              不认识
            </button>
            <button onClick={() => handleAction('vague')} disabled={submitting}
              className="flex-1 py-3 bg-yellow-50 hover:bg-yellow-100 text-yellow-600 font-medium rounded-xl transition-colors disabled:opacity-50">
              模糊
            </button>
            <button onClick={() => handleAction('known')} disabled={submitting}
              className="flex-1 py-3 bg-green-50 hover:bg-green-100 text-green-600 font-medium rounded-xl transition-colors disabled:opacity-50">
              认识
            </button>
          </div>
        )}
      </div>

      {/* Prev/Next Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => { setCurrentIndex(i => Math.max(0, i - 1)); setShowAnswer(false); setActiveTab('root'); }}
          disabled={currentIndex === 0}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          ← 上一个
        </button>
        <span className="text-xs text-slate-400">{currentIndex + 1} / {totalWords}</span>
        <button
          onClick={() => { if (currentIndex < totalWords - 1) { setCurrentIndex(i => i + 1); setShowAnswer(false); setActiveTab('root'); } }}
          disabled={currentIndex >= totalWords - 1}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          下一个 →
        </button>
      </div>
    </div>
  );
}
