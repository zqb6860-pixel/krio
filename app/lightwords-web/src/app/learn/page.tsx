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
  const [activeTab, setActiveTab] = useState<'context' | 'root' | 'derivation' | 'mnemonic'>('context');
  const [submitting, setSubmitting] = useState(false);
  const [flipAnimation, setFlipAnimation] = useState(false);
  const startTimeRef = useRef<number>(Date.now());

  const totalWords = words?.length || 0;
  const currentWord = words?.[currentIndex];


  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      switch (e.key) {
        case ' ':
        case 'Enter':
          e.preventDefault();
          if (!showAnswer) handleReveal();
          break;
        case '1': if (showAnswer) handleAction('unknown'); break;
        case '2': if (showAnswer) handleAction('vague'); break;
        case '3': if (showAnswer) handleAction('known'); break;
        case 'ArrowLeft':
          e.preventDefault();
          if (currentIndex > 0) { navigateTo(currentIndex - 1); }
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (currentIndex < totalWords - 1) { navigateTo(currentIndex + 1); }
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAnswer, currentIndex, totalWords]);

  const navigateTo = (index: number) => {
    setFlipAnimation(true);
    setTimeout(() => {
      setCurrentIndex(index);
      setShowAnswer(false);
      setActiveTab('context');
      setFlipAnimation(false);
    }, 150);
  };

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
      if (correct || status === 'vague') setLearnedCount(c => c + 1);
    } catch (err) { console.error('Failed to record:', err); }
    setSubmitting(false);
    if (currentIndex < totalWords - 1) {
      navigateTo(currentIndex + 1);
    } else {
      setShowAnswer(false);
    }
  }, [currentWord, currentIndex, totalWords, submitting]);


  // Loading state
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400">正在加载今日单词...</p>
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
          <p className="text-slate-700 dark:text-slate-200 mt-4 font-medium">加载失败</p>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{error}</p>
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
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-4">没有待学习的单词</h3>
          <p className="text-slate-500 dark:text-slate-400 mt-2">请先选择词库，或你已学完当前词库</p>
          <div className="flex gap-3 mt-6 justify-center">
            <a href="/books" className="px-5 py-2.5 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors">选择词库</a>
            <a href="/review" className="px-5 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-medium hover:bg-orange-600 transition-colors">去复习</a>
          </div>
        </div>
      </div>
    );
  }

  // Completed state
  if (currentIndex >= totalWords - 1 && !showAnswer && learnedCount > 0 && currentIndex > 0) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-center h-[60vh]">
        <div className="glass-card p-8 text-center animate-bounceIn">
          <span className="text-5xl">🎉</span>
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-4">今日学习完成！</h3>
          <p className="text-slate-500 dark:text-slate-400 mt-2">你已学习 <span className="font-bold text-blue-600">{learnedCount}</span> 个单词</p>
          <div className="flex gap-3 mt-6 justify-center">
            <a href="/review" className="px-5 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-medium hover:bg-orange-600">去复习</a>
            <a href="/" className="px-5 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-600">返回首页</a>
          </div>
        </div>
      </div>
    );
  }


  const word = currentWord;
  const meanings = word?.meanings || [];
  const roots = word?.roots || [];
  const examples = word?.examples || [];
  const collocations = word?.collocations || [];

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Progress Header */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">📚 单词学习</h2>
            <span className="text-xs px-2 py-0.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-full font-medium">已学 {learnedCount}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-slate-400 hidden sm:inline">空格翻转 · 1/2/3选择 · ←→切换</span>
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{currentIndex + 1}/{totalWords}</span>
          </div>
        </div>
        <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500" style={{ width: `${((currentIndex + 1) / totalWords) * 100}%` }} />
        </div>
      </div>

      {/* Word Card */}
      <div className={`glass-card overflow-hidden transition-all duration-300 ${flipAnimation ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
        {/* Word Header - Gradient */}
        <div className="p-6 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-3xl font-bold">{word?.word}</h2>
                {/* 考试频次标注 (参考不背单词) */}
                {word?.frequency && (
                  <span className="px-2 py-0.5 bg-red-500/80 text-white text-[10px] rounded-full font-medium backdrop-blur-sm">
                    🔥 高频词
                  </span>
                )}
                {word?.examTags && (
                  <div className="flex gap-1">
                    {(typeof word.examTags === 'string' ? word.examTags.split(',') : word.examTags || []).map((tag: string) => (
                      <span key={tag} className="px-1.5 py-0.5 bg-white/20 text-[10px] rounded font-medium backdrop-blur-sm">
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-blue-100 mt-1.5 text-sm">{word?.phonetic || word?.phoneticUs || ''}</p>
            </div>
            <AudioButton audioUrl={word?.audioUs} word={word?.word} size="lg" variant="white" />
          </div>
        </div>


        {/* Content */}
        <div className="p-6 space-y-4">
          {!showAnswer ? (
            <div className="text-center py-10">
              <p className="text-slate-400 dark:text-slate-500 text-sm mb-5">你认识这个单词吗？</p>
              <button onClick={handleReveal} className="px-8 py-3.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl text-slate-700 dark:text-slate-200 font-medium transition-all hover:shadow-md active:scale-95">
                点击显示释义
              </button>
            </div>
          ) : (
            <>
              {/* Meanings */}
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800/30 animate-fadeIn">
                {meanings.map((m: any, i: number) => (
                  <div key={i} className={i > 0 ? 'mt-2.5 pt-2.5 border-t border-blue-100 dark:border-blue-800/30' : ''}>
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-medium bg-blue-100 dark:bg-blue-800/40 px-1.5 py-0.5 rounded">{m.partOfSpeech}</span>
                    <p className="text-lg font-semibold text-slate-800 dark:text-slate-100 mt-1">{m.translation}</p>
                    {m.definition && <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 italic">{m.definition}</p>}
                  </div>
                ))}
              </div>

              {/* Tab Navigation (参考不背单词的Tab设计) */}
              <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                {[
                  { key: 'context', label: '语境例句', icon: '📝', show: examples.length > 0 },
                  { key: 'root', label: '词根词缀', icon: '🌱', show: roots.length > 0 },
                  { key: 'derivation', label: '派生词族', icon: '🌳', show: roots.length > 0 },
                  { key: 'mnemonic', label: '记忆技巧', icon: '💡', show: true },
                ].filter(t => t.show).map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`flex-1 px-3 py-2 text-xs rounded-lg transition-all font-medium ${
                      activeTab === tab.key
                        ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-sm'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>


              {/* Tab Content */}
              <div className="min-h-[140px] animate-fadeIn">
                {/* 语境例句 (参考不背单词的真实语境) */}
                {activeTab === 'context' && examples.length > 0 && (
                  <div className="space-y-3">
                    {examples.map((e: any, i: number) => {
                      const sourceTag = getSourceTag(e.source);
                      const highlighted = highlightWord(e.sentence, word?.word || '');
                      return (
                        <div key={i} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border-l-4 border-blue-400 dark:border-blue-500 group hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${sourceTag.color}`}>
                              {sourceTag.icon} {sourceTag.label}
                            </span>
                            {e.sourceYear && <span className="text-[11px] text-slate-400">{e.sourceYear}</span>}
                          </div>
                          <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed" dangerouslySetInnerHTML={{ __html: highlighted }} />
                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 border-t border-slate-200 dark:border-slate-700 pt-2">{e.translation}</p>
                          {e.source && <p className="text-[11px] text-slate-400 mt-1.5">—— {e.source}</p>}
                        </div>
                      );
                    })}
                    {/* 搭配用法 */}
                    {collocations.length > 0 && (
                      <div className="mt-3 p-4 bg-purple-50/50 dark:bg-purple-900/10 rounded-xl border border-purple-100 dark:border-purple-800/30">
                        <p className="text-xs font-medium text-purple-700 dark:text-purple-300 mb-2">🔗 常见搭配</p>
                        <div className="flex flex-wrap gap-2">
                          {collocations.map((c: any, i: number) => (
                            <span key={i} className="text-xs px-2.5 py-1 bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-700 rounded-lg text-purple-700 dark:text-purple-300">
                              {c.phrase} <span className="text-slate-400">- {c.translation}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}


                {/* 词根词缀 */}
                {activeTab === 'root' && roots.length > 0 && (
                  <div className="space-y-4">
                    <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-100 dark:border-green-800/30">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-lg">🌱</span>
                        <h4 className="text-sm font-bold text-green-800 dark:text-green-300">词源拆解</h4>
                      </div>
                      <div className="bg-white/70 dark:bg-slate-800/70 rounded-lg p-4">
                        <p className="font-mono font-bold text-base text-slate-800 dark:text-slate-100 mb-3">{word?.word}</p>
                        <div className="border-l-2 border-green-300 dark:border-green-600 pl-4 space-y-3">
                          {roots.map((r: any, i: number) => (
                            <div key={i} className="relative">
                              <div className="absolute -left-[21px] top-2 w-2.5 h-2.5 rounded-full bg-green-400 dark:bg-green-500 border-2 border-white dark:border-slate-800" />
                              <div className="flex items-start gap-2">
                                <span className="text-[10px] px-1.5 py-0.5 bg-green-100 dark:bg-green-800/40 text-green-700 dark:text-green-300 rounded font-medium flex-shrink-0">
                                  {r.type === 'prefix' ? '前缀' : r.type === 'suffix' ? '后缀' : '词根'}
                                </span>
                                <div>
                                  <p className="text-sm text-slate-800 dark:text-slate-200">
                                    <span className="font-bold text-green-600 dark:text-green-400">{r.root}</span> = {r.meaning}
                                  </p>
                                  <p className="text-[11px] text-slate-400 mt-0.5">来源: {r.origin}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 pt-3 border-t border-green-100 dark:border-green-800/30">
                          <p className="text-xs text-green-700 dark:text-green-400">
                            💡 {roots.map((r: any) => `"${r.meaning}"`).join(' + ')} → {meanings[0]?.translation || ''}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}


                {/* 派生词族 (参考不背单词的派生树) */}
                {activeTab === 'derivation' && roots.length > 0 && (
                  <div className="space-y-4">
                    <div className="p-4 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800/30">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-lg">🌳</span>
                        <h4 className="text-sm font-bold text-indigo-800 dark:text-indigo-300">派生词族树</h4>
                        <span className="text-[10px] text-indigo-400 dark:text-indigo-500">同根词联想记忆</span>
                      </div>
                      {/* Derivation Tree Visual */}
                      <div className="bg-white/70 dark:bg-slate-800/70 rounded-lg p-4">
                        {/* Center word */}
                        <div className="text-center mb-4">
                          <span className="inline-block px-4 py-2 bg-indigo-500 text-white rounded-xl font-bold text-sm shadow-md shadow-indigo-500/25">
                            {word?.word}
                          </span>
                        </div>
                        {/* Root connections */}
                        {roots.map((r: any, i: number) => {
                          const relatedWords = typeof r.relatedWords === 'string' ? (() => { try { return JSON.parse(r.relatedWords); } catch { return []; } })() : (r.relatedWords || []);
                          if (relatedWords.length === 0) return null;
                          return (
                            <div key={i} className="mb-3 last:mb-0">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="h-px flex-1 bg-indigo-200 dark:bg-indigo-700" />
                                <span className="text-[11px] px-2 py-0.5 bg-indigo-100 dark:bg-indigo-800/50 text-indigo-600 dark:text-indigo-300 rounded-full font-medium">
                                  词根 {r.root} ({r.meaning})
                                </span>
                                <div className="h-px flex-1 bg-indigo-200 dark:bg-indigo-700" />
                              </div>
                              <div className="flex flex-wrap gap-2 justify-center">
                                {relatedWords.map((w: string) => (
                                  <span key={w} className="px-3 py-1.5 bg-white dark:bg-slate-700 border border-indigo-200 dark:border-indigo-700 rounded-lg text-sm text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors cursor-default shadow-sm">
                                    {w}
                                  </span>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                        {/* If no related words found */}
                        {roots.every((r: any) => {
                          const rw = typeof r.relatedWords === 'string' ? (() => { try { return JSON.parse(r.relatedWords); } catch { return []; } })() : (r.relatedWords || []);
                          return rw.length === 0;
                        }) && (
                          <p className="text-center text-sm text-slate-400 dark:text-slate-500 py-4">暂无派生词数据，学习更多后将自动关联</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}


                {/* 记忆技巧 */}
                {activeTab === 'mnemonic' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-xl border border-amber-100 dark:border-amber-800/30">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-lg">💡</span>
                        <h4 className="text-sm font-bold text-amber-800 dark:text-amber-300">记忆技巧</h4>
                      </div>
                      <p className="text-sm text-amber-900 dark:text-amber-200 leading-relaxed">
                        {generateMnemonic(word?.word || '', roots, meanings)}
                      </p>
                    </div>
                    {roots.length > 0 && (
                      <div className="p-4 bg-purple-50/70 dark:bg-purple-900/10 rounded-xl border border-purple-100 dark:border-purple-800/30">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">🧠</span>
                          <h4 className="text-sm font-bold text-purple-800 dark:text-purple-300">词缀规律</h4>
                        </div>
                        <div className="space-y-2">
                          {roots.map((r: any, i: number) => (
                            <p key={i} className="text-sm text-purple-700 dark:text-purple-300">
                              <span className="font-bold">{r.type === 'prefix' ? '前缀' : r.type === 'suffix' ? '后缀' : '词根'} {r.root}-</span>
                              {' '}常表示「{r.meaning}」(来自{r.origin})
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* 近义词/反义词 (参考不背单词) */}
                    {(word?.synonyms || word?.antonyms) && (
                      <div className="p-4 bg-cyan-50/70 dark:bg-cyan-900/10 rounded-xl border border-cyan-100 dark:border-cyan-800/30">
                        <p className="text-xs font-medium text-cyan-700 dark:text-cyan-300 mb-2">📎 关联词汇</p>
                        <div className="space-y-2">
                          {word.synonyms && (
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[11px] text-slate-400">近义:</span>
                              {(typeof word.synonyms === 'string' ? word.synonyms.split(',') : word.synonyms).map((s: string) => (
                                <span key={s} className="text-xs px-2 py-0.5 bg-cyan-100 dark:bg-cyan-800/30 text-cyan-700 dark:text-cyan-300 rounded-full">{s.trim()}</span>
                              ))}
                            </div>
                          )}
                          {word.antonyms && (
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[11px] text-slate-400">反义:</span>
                              {(typeof word.antonyms === 'string' ? word.antonyms.split(',') : word.antonyms).map((s: string) => (
                                <span key={s} className="text-xs px-2 py-0.5 bg-rose-100 dark:bg-rose-800/30 text-rose-700 dark:text-rose-300 rounded-full">{s.trim()}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>


        {/* Action Buttons */}
        {showAnswer && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex gap-3">
            <button onClick={() => handleAction('unknown')} disabled={submitting}
              className="flex-1 py-3.5 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 font-medium rounded-xl transition-all disabled:opacity-50 active:scale-95 group">
              <span className="text-lg">😣</span>
              <span className="block text-xs mt-0.5">不认识</span>
              <span className="text-[10px] text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">按 1</span>
            </button>
            <button onClick={() => handleAction('vague')} disabled={submitting}
              className="flex-1 py-3.5 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 text-amber-600 dark:text-amber-400 font-medium rounded-xl transition-all disabled:opacity-50 active:scale-95 group">
              <span className="text-lg">🤔</span>
              <span className="block text-xs mt-0.5">模糊</span>
              <span className="text-[10px] text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity">按 2</span>
            </button>
            <button onClick={() => handleAction('known')} disabled={submitting}
              className="flex-1 py-3.5 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400 font-medium rounded-xl transition-all disabled:opacity-50 active:scale-95 group">
              <span className="text-lg">😊</span>
              <span className="block text-xs mt-0.5">认识</span>
              <span className="text-[10px] text-green-400 opacity-0 group-hover:opacity-100 transition-opacity">按 3</span>
            </button>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigateTo(Math.max(0, currentIndex - 1))} disabled={currentIndex === 0}
          className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
          ← 上一个
        </button>
        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(totalWords, 10) }).map((_, i) => {
            const idx = totalWords <= 10 ? i : Math.floor((currentIndex / totalWords) * 10) + i - 5;
            if (idx < 0 || idx >= totalWords) return null;
            return (
              <div key={i} className={`w-2 h-2 rounded-full transition-all ${idx === currentIndex ? 'w-5 bg-blue-500' : idx < currentIndex ? 'bg-green-300 dark:bg-green-600' : 'bg-slate-200 dark:bg-slate-700'}`} />
            );
          })}
        </div>
        <button onClick={() => { if (currentIndex < totalWords - 1) navigateTo(currentIndex + 1); }} disabled={currentIndex >= totalWords - 1}
          className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
          下一个 →
        </button>
      </div>
    </div>
  );
}


// ===== Helper Functions =====

function getSourceTag(source: string): { icon: string; label: string; color: string } {
  const s = (source || '').toLowerCase();
  if (s.includes('电影') || s.includes('movie') || s.includes('film')) return { icon: '🎬', label: '电影台词', color: 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300' };
  if (s.includes('美剧') || s.includes('tv') || s.includes('series') || s.includes('剧')) return { icon: '📺', label: '美剧原声', color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' };
  if (s.includes('新闻') || s.includes('news') || s.includes('bbc') || s.includes('cnn') || s.includes('times')) return { icon: '📰', label: '新闻报道', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' };
  if (s.includes('考研') || s.includes('四级') || s.includes('六级') || s.includes('高考') || s.includes('cet') || s.includes('真题')) return { icon: '📋', label: '考试真题', color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' };
  if (s.includes('文学') || s.includes('novel') || s.includes('book')) return { icon: '📚', label: '文学作品', color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' };
  if (s.includes('演讲') || s.includes('speech') || s.includes('ted')) return { icon: '🎤', label: 'TED演讲', color: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' };
  if (s.includes('纪录片') || s.includes('documentary')) return { icon: '🎞️', label: '纪录片', color: 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300' };
  return { icon: '📄', label: '真实语境', color: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300' };
}

function highlightWord(sentence: string, targetWord: string): string {
  if (!sentence || !targetWord) return sentence || '';
  const escaped = targetWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`\\b(${escaped}\\w*)\\b`, 'gi');
  return sentence.replace(regex, '<span class="text-blue-600 dark:text-blue-400 font-bold underline decoration-blue-300 dark:decoration-blue-600 decoration-2 underline-offset-2">$1</span>');
}

function generateMnemonic(word: string, roots: any[], meanings: any[]): string {
  const mainMeaning = meanings[0]?.translation || '';
  if (roots.length > 0) {
    const parts = roots.map((r: any) => `${r.type === 'prefix' ? '前缀' : r.type === 'suffix' ? '后缀' : '词根'} "${r.root}" 表示「${r.meaning}」`);
    return `${word} 可以拆解为：${parts.join('，')}。联合起来就是「${mainMeaning}」。掌握这些词根词缀后，遇到含有相同词根的生词也能快速推测含义。`;
  }
  if (word.length <= 4) {
    return `"${word}" 是一个简短的高频基础词汇，意为「${mainMeaning}」。建议通过多读例句，在实际语境中自然记忆。`;
  }
  return `"${word}" 意为「${mainMeaning}」。尝试将这个单词放在熟悉的场景中造句，或联想与发音相似的中文谐音辅助记忆。在不同语境中反复接触是最有效的记忆方式。`;
}
