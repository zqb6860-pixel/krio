'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { api } from '@/lib/api';
import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/contexts/AuthContext';
import { AudioButton } from '@/components/common/AudioButton';

// 生成选择题选项
function generateQuizOptions(words: any[], currentIndex: number): { text: string; isCorrect: boolean }[] {
  const currentWord = words[currentIndex];
  const correctMeaning = currentWord?.meanings?.[0]?.translation || currentWord?.meanings?.[0]?.definition || '未知';

  const otherMeanings: string[] = [];
  for (let i = 0; i < words.length; i++) {
    if (i === currentIndex) continue;
    const m = words[i]?.meanings?.[0]?.translation || words[i]?.meanings?.[0]?.definition;
    if (m && m !== correctMeaning && !otherMeanings.includes(m)) {
      otherMeanings.push(m);
    }
  }

  const shuffled = otherMeanings.sort(() => Math.random() - 0.5);
  const distractors = shuffled.slice(0, 3);
  const fallbacks = ['使变化', '承认；接受', '增加；添加', '决定；判断', '考虑；认为', '表达；表示'];
  while (distractors.length < 3) {
    const fb = fallbacks[distractors.length];
    if (fb && fb !== correctMeaning) distractors.push(fb);
    else break;
  }

  return [
    { text: correctMeaning, isCorrect: true },
    ...distractors.map(d => ({ text: d, isCorrect: false })),
  ].sort(() => Math.random() - 0.5);
}


export default function LearnPage() {
  const { refreshUser } = useAuth();
  const { data: words, loading, error } = useApi(() => api.getTodayWords(), []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [learnedCount, setLearnedCount] = useState(0);
  const [showDetail, setShowDetail] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [flipAnimation, setFlipAnimation] = useState(false);
  const startTimeRef = useRef<number>(Date.now());
  const [quizOptions, setQuizOptions] = useState<{ text: string; isCorrect: boolean }[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quizAnswered, setQuizAnswered] = useState(false);

  const totalWords = words?.length || 0;
  const currentWord = words?.[currentIndex];

  // 每次切换单词时生成新选项
  useEffect(() => {
    if (words && words.length > 0) {
      setQuizOptions(generateQuizOptions(words, currentIndex));
      setSelectedOption(null);
      setQuizAnswered(false);
      startTimeRef.current = Date.now();
    }
  }, [currentIndex, words]);


  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      switch (e.key) {
        case ' ':
        case 'Enter':
          e.preventDefault();
          if (quizAnswered && !showDetail) setShowDetail(true);
          break;
        case '1':
          if (!quizAnswered && quizOptions.length >= 1) handleQuizSelect(0);
          else if (showDetail) handleAction('unknown');
          break;
        case '2':
          if (!quizAnswered && quizOptions.length >= 2) handleQuizSelect(1);
          else if (showDetail) handleAction('vague');
          break;
        case '3':
          if (!quizAnswered && quizOptions.length >= 3) handleQuizSelect(2);
          else if (showDetail) handleAction('known');
          break;
        case '4':
          if (!quizAnswered && quizOptions.length >= 4) handleQuizSelect(3);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (currentIndex > 0) navigateTo(currentIndex - 1);
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (currentIndex < totalWords - 1) navigateTo(currentIndex + 1);
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showDetail, currentIndex, totalWords, quizAnswered, quizOptions]);


  const navigateTo = (index: number) => {
    setFlipAnimation(true);
    setTimeout(() => {
      setCurrentIndex(index);
      setShowDetail(false);
      setFlipAnimation(false);
      setSelectedOption(null);
      setQuizAnswered(false);
    }, 150);
  };

  const handleQuizSelect = async (optionIndex: number) => {
    if (quizAnswered || !currentWord) return;
    setSelectedOption(optionIndex);
    setQuizAnswered(true);
    const isCorrect = quizOptions[optionIndex]?.isCorrect || false;
    const responseTimeMs = Date.now() - startTimeRef.current;
    try {
      await api.recordAnswer(currentWord.id, isCorrect, responseTimeMs);
      if (isCorrect) setLearnedCount(c => c + 1);
    } catch (err) { console.error('Failed to record:', err); }
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
      setShowDetail(false);
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
  if (currentIndex >= totalWords - 1 && !showDetail && learnedCount > 0 && currentIndex > 0) {
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
            <span className="text-[11px] text-slate-400 hidden sm:inline">1/2/3/4选择 · 空格查看 · ←→切换</span>
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{currentIndex + 1}/{totalWords}</span>
          </div>
        </div>
        <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500" style={{ width: `${((currentIndex + 1) / totalWords) * 100}%` }} />
        </div>
      </div>


      {/* Word Card */}
      <div className={`glass-card overflow-hidden transition-all duration-300 ${flipAnimation ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
        {/* Word Header */}
        <div className="p-6 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-3xl font-bold">{word?.word}</h2>
                {/* 词性标签 */}
                {meanings.length > 0 && (
                  <div className="flex gap-1">
                    {meanings.map((m: any, i: number) => (
                      <span key={i} className="px-2 py-0.5 bg-white/20 text-[11px] rounded-full font-medium backdrop-blur-sm">
                        {m.partOfSpeech}
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
          {!showDetail ? (
            <div className="py-4">
              {/* 选择题模式 */}
              {!quizAnswered ? (
                <div className="space-y-4">
                  <p className="text-center text-slate-500 dark:text-slate-400 text-sm mb-2">请选择正确的释义：</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {quizOptions.map((opt, i) => (
                      <button
                        key={i}
                        onClick={() => handleQuizSelect(i)}
                        className="p-4 text-left border-2 border-slate-200 dark:border-slate-700 rounded-xl hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all active:scale-[0.98] group"
                      >
                        <div className="flex items-start gap-3">
                          <span className="flex-shrink-0 w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-sm font-bold text-slate-500 dark:text-slate-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-800/30 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {String.fromCharCode(65 + i)}
                          </span>
                          <span className="text-sm text-slate-700 dark:text-slate-200 font-medium leading-relaxed">{opt.text}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                  <p className="text-center text-[11px] text-slate-400 mt-2">按 1/2/3/4 快速选择</p>
                </div>
              ) : (
                /* 答题结果反馈 */
                <div className="space-y-4">
                  <div className={`p-4 rounded-xl text-center ${
                    quizOptions[selectedOption!]?.isCorrect
                      ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30'
                      : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30'
                  }`}>
                    <span className="text-3xl">{quizOptions[selectedOption!]?.isCorrect ? '🎉' : '😅'}</span>
                    <p className={`font-bold mt-2 ${quizOptions[selectedOption!]?.isCorrect ? 'text-green-700 dark:text-green-300' : 'text-red-600 dark:text-red-400'}`}>
                      {quizOptions[selectedOption!]?.isCorrect ? '回答正确！' : '答错了~'}
                    </p>
                  </div>


                  {/* 显示所有选项正误 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {quizOptions.map((opt, i) => (
                      <div key={i} className={`p-3 rounded-xl border-2 transition-all ${
                        opt.isCorrect
                          ? 'border-green-400 dark:border-green-600 bg-green-50 dark:bg-green-900/20'
                          : i === selectedOption && !opt.isCorrect
                          ? 'border-red-400 dark:border-red-600 bg-red-50 dark:bg-red-900/20'
                          : 'border-slate-100 dark:border-slate-700 opacity-50'
                      }`}>
                        <div className="flex items-start gap-2">
                          <span className="flex-shrink-0 text-sm">
                            {opt.isCorrect ? '✓' : i === selectedOption && !opt.isCorrect ? '✗' : ' '}
                          </span>
                          <span className="text-sm text-slate-700 dark:text-slate-200">{opt.text}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* 答题后立即显示一条例句预览（参考不背单词） */}
                  {examples.length > 0 && (
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border-l-4 border-indigo-400 dark:border-indigo-500">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">📝 例句</span>
                        <AudioButton audioUrl={examples[0]?.audioUrl} word={examples[0]?.sentence} size="sm" variant="ghost" />
                      </div>
                      <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed" dangerouslySetInnerHTML={{ __html: highlightWord(examples[0]?.sentence || '', word?.word || '') }} />
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">{examples[0]?.translation}</p>
                    </div>
                  )}

                  {/* 按钮：查看详情 / 下一个 */}
                  <div className="flex gap-3 justify-center">
                    <button onClick={() => setShowDetail(true)}
                      className="px-6 py-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl font-medium hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-sm">
                      📖 查看详细释义
                    </button>
                    <button onClick={() => { if (currentIndex < totalWords - 1) navigateTo(currentIndex + 1); }}
                      disabled={currentIndex >= totalWords - 1}
                      className="px-6 py-2.5 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors text-sm disabled:opacity-40">
                      下一个 →
                    </button>
                  </div>
                </div>
              )}
            </div>


          ) : (
            <>
              {/* 详细释义区域 */}
              <div className="space-y-4">
                {/* 词性+释义 (参考不背单词的释义展示) */}
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800/30">
                  {meanings.map((m: any, i: number) => (
                    <div key={i} className={i > 0 ? 'mt-3 pt-3 border-t border-blue-100 dark:border-blue-800/30' : ''}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold bg-blue-100 dark:bg-blue-800/40 px-2 py-0.5 rounded">{m.partOfSpeech}</span>
                      </div>
                      <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">{m.translation}</p>
                      {m.definition && <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 italic">{m.definition}</p>}
                    </div>
                  ))}
                </div>

                {/* 例句区域（核心增强）—— 参考不背单词的真实语境例句 */}
                {examples.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">📝 真实语境例句</span>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500">({examples.length}条)</span>
                    </div>
                    {examples.map((e: any, i: number) => {
                      const sourceTag = getSourceTag(e.source);
                      return (
                        <div key={i} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border-l-4 border-blue-400 dark:border-blue-500 group hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${sourceTag.color}`}>
                                {sourceTag.icon} {sourceTag.label}
                              </span>
                            </div>
                            <AudioButton audioUrl={e.audioUrl} word={e.sentence} size="sm" variant="ghost" />
                          </div>
                          <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed" dangerouslySetInnerHTML={{ __html: highlightWord(e.sentence, word?.word || '') }} />
                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 border-t border-slate-200 dark:border-slate-700 pt-2">{e.translation}</p>
                          {e.source && <p className="text-[11px] text-slate-400 mt-1.5">—— {e.source}</p>}
                        </div>
                      );
                    })}
                  </div>
                )}


                {/* 搭配用法 */}
                {collocations.length > 0 && (
                  <div className="p-4 bg-purple-50/50 dark:bg-purple-900/10 rounded-xl border border-purple-100 dark:border-purple-800/30">
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

                {/* 词根词缀 */}
                {roots.length > 0 && (
                  <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-100 dark:border-green-800/30">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-sm font-semibold text-green-800 dark:text-green-300">🌱 词根词缀</span>
                    </div>
                    <div className="border-l-2 border-green-300 dark:border-green-600 pl-4 space-y-2">
                      {roots.map((r: any, i: number) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="text-[10px] px-1.5 py-0.5 bg-green-100 dark:bg-green-800/40 text-green-700 dark:text-green-300 rounded font-medium flex-shrink-0">
                            {r.type === 'prefix' ? '前缀' : r.type === 'suffix' ? '后缀' : '词根'}
                          </span>
                          <p className="text-sm text-slate-700 dark:text-slate-200">
                            <span className="font-bold text-green-600 dark:text-green-400">{r.root}</span> = {r.meaning}
                          </p>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-green-700 dark:text-green-400 mt-3 pt-2 border-t border-green-100 dark:border-green-800/30">
                      💡 {roots.map((r: any) => `"${r.meaning}"`).join(' + ')} → {meanings[0]?.translation || ''}
                    </p>
                  </div>
                )}

                {/* 记忆技巧 */}
                <div className="p-4 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-xl border border-amber-100 dark:border-amber-800/30">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-semibold text-amber-800 dark:text-amber-300">💡 记忆技巧</span>
                  </div>
                  <p className="text-sm text-amber-900 dark:text-amber-200 leading-relaxed">
                    {generateMnemonic(word?.word || '', roots, meanings)}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>


        {/* Action Buttons */}
        {showDetail && (
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
