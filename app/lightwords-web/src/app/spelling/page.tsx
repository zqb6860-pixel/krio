'use client';

import { useState, useRef, useEffect } from 'react';
import { api } from '@/lib/api';
import { useApi } from '@/hooks/useApi';
import { AudioButton } from '@/components/common/AudioButton';

export default function SpellingPage() {
  const { data: words, loading } = useApi(() => api.getTodayWords(), []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [hintLevel, setHintLevel] = useState(0); // 0=无提示, 1=首字母提示, 2=例句提示
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const totalWords = words?.length || 0;
  const word = words?.[currentIndex];

  useEffect(() => {
    if (status === 'idle') inputRef.current?.focus();
  }, [currentIndex, status]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto flex items-center justify-center h-[60vh]">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!words || words.length === 0) {
    return (
      <div className="max-w-3xl mx-auto flex items-center justify-center h-[60vh]">
        <div className="text-center glass-card p-8">
          <span className="text-5xl">📝</span>
          <h3 className="text-xl font-bold text-slate-800 mt-4">没有可默写的单词</h3>
          <p className="text-slate-500 mt-2">请先选择词库并学习一些单词</p>
          <a href="/books" className="mt-4 inline-block px-5 py-2 bg-blue-500 text-white rounded-xl text-sm">选择词库</a>
        </div>
      </div>
    );
  }

  const meanings = word?.meanings || [];
  const mainMeaning = meanings[0]?.translation || meanings[0]?.definition || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!word || status !== 'idle') return;

    const userAnswer = input.trim().toLowerCase();
    const correctAnswer = word.word.toLowerCase();
    setAttempts(a => a + 1);

    if (userAnswer === correctAnswer) {
      setStatus('correct');
      setCorrectCount(c => c + 1);
      // Record as correct
      try {
        await api.recordAnswer(word.id, true, 5000);
      } catch {}
    } else {
      setStatus('wrong');
      setWrongCount(c => c + 1);
      // Record as incorrect
      try {
        await api.recordAnswer(word.id, false, 5000);
      } catch {}
    }
  };

  const handleNext = () => {
    if (currentIndex < totalWords - 1) {
      setCurrentIndex(i => i + 1);
    } else {
      setCurrentIndex(0); // loop back
    }
    setInput('');
    setStatus('idle');
    setHintLevel(0);
  };

  const handleRetry = () => {
    setInput('');
    setStatus('idle');
    setHintLevel(0);
  };

  const handleSkip = () => {
    setStatus('wrong');
    setHintLevel(2);
  };

  const handleHint = () => {
    setHintLevel(prev => Math.min(prev + 1, 2));
  };

  // Generate letter hint: show first letter and length
  const letterHint = word ? `${word.word[0]}${'_'.repeat(word.word.length - 1)} (${word.word.length}个字母)` : '';

  // Generate sentence hint: show example sentence with target word blanked out
  const getSentenceHint = () => {
    const examples = word?.examples || [];
    if (examples.length === 0) return null;
    const example = examples[0];
    const sentence = example.sentence || '';
    const targetWord = word?.word || '';
    // Replace the target word (and its variants) with underscores
    const escaped = targetWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\w*\\b`, 'gi');
    const blanked = sentence.replace(regex, (match: string) => '_'.repeat(match.length));
    return { blanked, translation: example.translation || '', source: example.source || '' };
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-slate-800">✍️ 默写模式</h2>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-green-600">✓ {correctCount}</span>
            <span className="text-red-500">✗ {wrongCount}</span>
            <span className="text-slate-400">{currentIndex + 1}/{totalWords}</span>
          </div>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / totalWords) * 100}%` }} />
        </div>
      </div>

      {/* Spelling Card */}
      <div className="glass-card p-8">
        {/* Meaning display */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 mb-3">
            <AudioButton audioUrl={word?.audioUs} word={word?.word} size="md" variant="default" />
            <span className="text-sm text-slate-400">听发音</span>
          </div>
          <div className="p-4 bg-blue-50 rounded-xl">
            {meanings.map((m: any, i: number) => (
              <p key={i} className="text-lg text-slate-800">
                <span className="text-sm text-blue-500 mr-2">{m.partOfSpeech}</span>
                <span className="font-semibold">{m.translation || m.definition}</span>
              </p>
            ))}
          </div>
          {word?.phonetic && (
            <p className="text-sm text-slate-400 mt-2">{word.phonetic}</p>
          )}
        </div>

        {/* Hints (multi-level) */}
        {hintLevel > 0 && status === 'idle' && (
          <div className="space-y-3 mb-4">
            {/* Level 1: Letter hint */}
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-xl text-center">
              <p className="text-xs text-amber-500 mb-1">💡 字母提示</p>
              <p className="text-base text-amber-700 dark:text-amber-300 font-mono font-bold tracking-wider">{letterHint}</p>
            </div>
            {/* Level 2: Sentence hint */}
            {hintLevel >= 2 && (() => {
              const sentenceHint = getSentenceHint();
              if (!sentenceHint) return (
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800/30 rounded-xl text-center">
                  <p className="text-xs text-purple-500 mb-1">📝 例句提示</p>
                  <p className="text-sm text-slate-400">暂无例句数据</p>
                </div>
              );
              return (
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800/30 rounded-xl">
                  <p className="text-xs text-purple-500 mb-2">📝 例句提示（单词已隐藏）</p>
                  <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed italic">
                    &quot;{sentenceHint.blanked}&quot;
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">{sentenceHint.translation}</p>
                  {sentenceHint.source && <p className="text-[11px] text-slate-400 mt-1">—— {sentenceHint.source}</p>}
                </div>
              );
            })()}
          </div>
        )}

        {/* Input */}
        {status === 'idle' ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="输入单词拼写..."
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                className="w-full px-6 py-4 text-center text-2xl font-mono border-2 border-slate-200 rounded-2xl focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all"
              />
            </div>
            <div className="flex gap-3 justify-center">
              <button type="submit" disabled={!input.trim()}
                className="px-8 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                确认
              </button>
              <button type="button" onClick={handleHint} disabled={hintLevel >= 2}
                className="px-6 py-3 bg-amber-50 text-amber-600 rounded-xl font-medium hover:bg-amber-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                {hintLevel === 0 ? '💡 字母提示' : hintLevel === 1 ? '📝 例句提示' : '已全部提示'}
              </button>
              <button type="button" onClick={handleSkip}
                className="px-6 py-3 bg-slate-100 text-slate-500 rounded-xl font-medium hover:bg-slate-200 transition-colors">
                跳过
              </button>
            </div>
          </form>
        ) : (
          /* Result */
          <div className="text-center space-y-4">
            {status === 'correct' ? (
              <div className="p-4 bg-green-50 border border-green-200 rounded-2xl">
                <span className="text-3xl">🎉</span>
                <p className="text-green-700 font-bold text-xl mt-2">正确！</p>
                <p className="text-green-600 font-mono text-2xl mt-1">{word.word}</p>
              </div>
            ) : (
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl">
                <span className="text-3xl">😅</span>
                <p className="text-red-600 font-medium mt-2">
                  {input.trim() ? (
                    <>你的拼写：<span className="line-through font-mono">{input}</span></>
                  ) : '已跳过'}
                </p>
                <p className="text-slate-800 font-mono text-2xl mt-2 font-bold">{word.word}</p>
                <p className="text-sm text-slate-500 mt-1">{word.phonetic}</p>
              </div>
            )}

            <div className="flex gap-3 justify-center">
              {status === 'wrong' && (
                <button onClick={handleRetry}
                  className="px-6 py-3 bg-orange-50 text-orange-600 rounded-xl font-medium hover:bg-orange-100 transition-colors">
                  再试一次
                </button>
              )}
              <button onClick={handleNext}
                className="px-8 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors">
                下一个 →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Stats Summary */}
      {(correctCount + wrongCount) > 0 && (
        <div className="glass-card p-4">
          <div className="flex items-center justify-around text-center">
            <div>
              <p className="text-2xl font-bold text-green-600">{correctCount}</p>
              <p className="text-xs text-slate-500">正确</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-500">{wrongCount}</p>
              <p className="text-xs text-slate-500">错误</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">
                {attempts > 0 ? Math.round((correctCount / attempts) * 100) : 0}%
              </p>
              <p className="text-xs text-slate-500">正确率</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
