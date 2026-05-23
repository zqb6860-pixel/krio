'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
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
  const [activeTab, setActiveTab] = useState<'root' | 'example' | 'collocation' | 'mnemonic'>('root');
  const [submitting, setSubmitting] = useState(false);
  const startTimeRef = useRef<number>(Date.now());
  const cardRef = useRef<HTMLDivElement>(null);

  const totalWords = words?.length || 0;
  const currentWord = words?.[currentIndex];

  // 键盘快捷键支持
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      switch (e.key) {
        case ' ':
        case 'Enter':
          e.preventDefault();
          if (!showAnswer) handleReveal();
          break;
        case '1':
          if (showAnswer) handleAction('unknown');
          break;
        case '2':
          if (showAnswer) handleAction('vague');
          break;
        case '3':
          if (showAnswer) handleAction('known');
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (currentIndex > 0) {
            setCurrentIndex(i => i - 1);
            setShowAnswer(false);
            setActiveTab('root');
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (currentIndex < totalWords - 1) {
            setCurrentIndex(i => i + 1);
            setShowAnswer(false);
            setActiveTab('root');
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAnswer, currentIndex, totalWords]);

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

  // 生成记忆技巧
  const mnemonicTip = generateMnemonic(word.word, roots, meanings);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress Header */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-slate-800">📚 单词学习</h2>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 hidden sm:inline">快捷键: 空格=翻转 1/2/3=选择 ←→=切换</span>
            <span className="text-sm text-slate-500">{currentIndex + 1} / {totalWords}</span>
          </div>
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
                  { key: 'mnemonic', label: '记忆技巧', icon: '💡', show: true },
                  { key: 'example', label: '语境例句', icon: '📝', show: examples.length > 0 },
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
                  <div className="space-y-4">
                    {/* 词源树形结构展示 (参考不背单词) */}
                    <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-lg">🌳</span>
                        <h4 className="text-sm font-bold text-green-800">词源拆解</h4>
                      </div>
                      <div className="font-mono text-sm text-green-900 bg-white/60 rounded-lg p-3">
                        <p className="font-bold text-base mb-2">{word.word}</p>
                        <div className="border-l-2 border-green-300 pl-3 space-y-2">
                          {roots.map((r: any, i: number) => (
                            <div key={i} className="relative">
                              <div className="absolute -left-[13px] top-2 w-2 h-2 rounded-full bg-green-400" />
                              <p className="text-green-800">
                                <span className="font-bold text-green-600">
                                  {r.type === 'prefix' ? '前缀' : r.type === 'suffix' ? '后缀' : '词根'}
                                </span>
                                {' '}<span className="bg-green-100 px-1.5 py-0.5 rounded font-bold">{r.root}</span>
                                {' = '}{r.meaning}
                                <span className="text-green-500 text-xs ml-1">({r.origin})</span>
                              </p>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 pt-2 border-t border-green-200">
                          <p className="text-xs text-green-600">
                            记忆：{roots.map((r: any) => `"${r.meaning}"`).join(' + ')} → {meanings[0]?.translation || ''}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 同根词联想 */}
                    {roots.some((r: any) => r.relatedWords) && (
                      <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-lg">🔗</span>
                          <h4 className="text-sm font-bold text-blue-800">同根词联想</h4>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {roots.flatMap((r: any) => {
                            const words = typeof r.relatedWords === 'string' ? JSON.parse(r.relatedWords) : (r.relatedWords || []);
                            return words.map((w: string) => (
                              <span key={w} className="px-3 py-1.5 bg-white border border-blue-200 rounded-full text-sm text-blue-700 hover:bg-blue-100 transition-colors cursor-default shadow-sm">
                                {w}
                              </span>
                            ));
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 记忆技巧 Tab */}
                {activeTab === 'mnemonic' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl border border-amber-100">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-lg">💡</span>
                        <h4 className="text-sm font-bold text-amber-800">记忆技巧</h4>
                      </div>
                      <p className="text-sm text-amber-900 leading-relaxed">{mnemonicTip}</p>
                    </div>
                    {roots.length > 0 && (
                      <div className="p-4 bg-purple-50/50 rounded-xl border border-purple-100">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">🧠</span>
                          <h4 className="text-sm font-bold text-purple-800">词缀规律</h4>
                        </div>
                        <div className="space-y-2">
                          {roots.map((r: any, i: number) => (
                            <p key={i} className="text-sm text-purple-700">
                              <span className="font-bold">{r.type === 'prefix' ? '前缀' : r.type === 'suffix' ? '后缀' : '词根'} {r.root}-</span>
                              {' '}常表示「{r.meaning}」，来自{r.origin}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'example' && examples.length > 0 && (
                  <div className="space-y-3">
                    {examples.map((e: any, i: number) => {
                      // 获取来源类型标签
                      const sourceTag = getSourceTag(e.source);
                      // 高亮目标单词
                      const highlightedSentence = highlightWord(e.sentence, word.word);
                      return (
                        <div key={i} className="p-4 bg-slate-50 rounded-lg border-l-4 border-blue-400">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sourceTag.color}`}>
                              {sourceTag.icon} {sourceTag.label}
                            </span>
                            {e.sourceYear && <span className="text-xs text-slate-400">{e.sourceYear}</span>}
                          </div>
                          <p className="text-sm text-slate-800 leading-relaxed" dangerouslySetInnerHTML={{ __html: highlightedSentence }} />
                          <p className="text-sm text-slate-500 mt-2">{e.translation}</p>
                          <p className="text-xs text-slate-400 mt-2">—— {e.source}</p>
                        </div>
                      );
                    })}
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
              className="flex-1 py-3 bg-red-50 hover:bg-red-100 text-red-600 font-medium rounded-xl transition-colors disabled:opacity-50 relative group">
              😣 不认识
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-100 text-red-500 text-xs rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">1</span>
            </button>
            <button onClick={() => handleAction('vague')} disabled={submitting}
              className="flex-1 py-3 bg-yellow-50 hover:bg-yellow-100 text-yellow-600 font-medium rounded-xl transition-colors disabled:opacity-50 relative group">
              🤔 模糊
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-100 text-yellow-500 text-xs rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">2</span>
            </button>
            <button onClick={() => handleAction('known')} disabled={submitting}
              className="flex-1 py-3 bg-green-50 hover:bg-green-100 text-green-600 font-medium rounded-xl transition-colors disabled:opacity-50 relative group">
              😊 认识
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-100 text-green-500 text-xs rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">3</span>
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



// ===== 辅助函数 =====

/** 根据来源文本识别例句类型标签 */
function getSourceTag(source: string): { icon: string; label: string; color: string } {
  const s = (source || '').toLowerCase();
  if (s.includes('电影') || s.includes('movie') || s.includes('film')) {
    return { icon: '🎬', label: '电影', color: 'bg-pink-100 text-pink-700' };
  }
  if (s.includes('美剧') || s.includes('tv') || s.includes('series') || s.includes('剧')) {
    return { icon: '📺', label: '美剧', color: 'bg-purple-100 text-purple-700' };
  }
  if (s.includes('新闻') || s.includes('news') || s.includes('bbc') || s.includes('cnn') || s.includes('times')) {
    return { icon: '📰', label: '新闻', color: 'bg-blue-100 text-blue-700' };
  }
  if (s.includes('考研') || s.includes('四级') || s.includes('六级') || s.includes('高考') || s.includes('cet') || s.includes('真题') || s.includes('考试')) {
    return { icon: '📋', label: '真题', color: 'bg-red-100 text-red-700' };
  }
  if (s.includes('文学') || s.includes('novel') || s.includes('book')) {
    return { icon: '📚', label: '文学', color: 'bg-amber-100 text-amber-700' };
  }
  if (s.includes('演讲') || s.includes('speech') || s.includes('ted')) {
    return { icon: '🎤', label: '演讲', color: 'bg-indigo-100 text-indigo-700' };
  }
  return { icon: '📄', label: '语境', color: 'bg-slate-100 text-slate-600' };
}

/** 在例句中高亮目标单词 */
function highlightWord(sentence: string, targetWord: string): string {
  if (!sentence || !targetWord) return sentence || '';
  // 转义正则特殊字符
  const escaped = targetWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`\\b(${escaped}\\w*)\\b`, 'gi');
  return sentence.replace(regex, '<span class="text-blue-600 font-bold underline decoration-blue-300 decoration-2 underline-offset-2">$1</span>');
}

/** 生成记忆技巧文本 */
function generateMnemonic(word: string, roots: any[], meanings: any[]): string {
  const mainMeaning = meanings[0]?.translation || '';
  
  if (roots.length > 0) {
    const parts = roots.map((r: any) => {
      const typeLabel = r.type === 'prefix' ? '前缀' : r.type === 'suffix' ? '后缀' : '词根';
      return `${typeLabel} "${r.root}" 表示「${r.meaning}」`;
    });
    return `${word} 可以拆解为：${parts.join('，')}。联合起来就是「${mainMeaning}」的意思。通过词根词缀记忆法，遇到包含相同词根的生词时也能快速推测含义。`;
  }
  
  // 如果没有词根信息，提供基于联想的记忆建议
  if (word.length <= 4) {
    return `"${word}" 是一个简短的基础词汇，意为「${mainMeaning}」。建议通过多读例句和搭配来加深印象，在实际语境中自然记住它。`;
  }
  
  return `"${word}" 意为「${mainMeaning}」。尝试将这个单词放在你熟悉的场景中造句，或者联想一个与发音相似的中文谐音来辅助记忆。反复在不同语境中接触这个单词是最有效的记忆方式。`;
}
