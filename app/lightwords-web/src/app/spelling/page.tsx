'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { useApi } from '@/hooks/useApi';
import { AudioButton } from '@/components/common/AudioButton';

export default function SpellingPage() {
  const { data: words, loading } = useApi(() => api.getTodayWords(), []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [typedChars, setTypedChars] = useState<string[]>([]);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [totalKeystrokes, setTotalKeystrokes] = useState(0);
  const [correctKeystrokes, setCorrectKeystrokes] = useState(0);
  const [wordStartTime, setWordStartTime] = useState<number>(Date.now());
  const [sessionStartTime] = useState<number>(Date.now());
  const [isWordComplete, setIsWordComplete] = useState(false);
  const [isWordWrong, setIsWordWrong] = useState(false);
  const [showMeaning, setShowMeaning] = useState(true);
  const [showPhonetic, setShowPhonetic] = useState(true);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const totalWords = words?.length || 0;
  const word = words?.[currentIndex];
  const targetWord = word?.word || '';
  const meanings = word?.meanings || [];
  const examples = word?.examples || [];

  // Focus the container for keyboard capture
  useEffect(() => {
    containerRef.current?.focus();
  }, [currentIndex, isWordComplete]);

  // Reset word state when index changes
  useEffect(() => {
    setTypedChars([]);
    setIsWordComplete(false);
    setIsWordWrong(false);
    setWordStartTime(Date.now());
  }, [currentIndex]);

  // Handle keyboard input
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!word || isWordComplete) {
      // After word is complete, press Enter/Space to go next
      if (isWordComplete && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        goNext();
      }
      return;
    }

    // Ignore modifier keys
    if (e.metaKey || e.ctrlKey || e.altKey) return;

    if (e.key === 'Backspace') {
      e.preventDefault();
      setTypedChars(prev => prev.slice(0, -1));
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      // Reset current word
      setTypedChars([]);
      return;
    }

    // Only accept single printable characters
    if (e.key.length !== 1) return;
    e.preventDefault();

    const newTyped = [...typedChars, e.key];
    setTypedChars(newTyped);
    setTotalKeystrokes(prev => prev + 1);

    const charIndex = newTyped.length - 1;
    const isCharCorrect = e.key.toLowerCase() === targetWord[charIndex]?.toLowerCase();

    if (isCharCorrect) {
      setCorrectKeystrokes(prev => prev + 1);
    }

    // Check if word is complete
    if (newTyped.length === targetWord.length) {
      const isAllCorrect = newTyped.every((ch, i) => ch.toLowerCase() === targetWord[i]?.toLowerCase());
      setIsWordComplete(true);

      if (isAllCorrect) {
        setCorrectCount(prev => prev + 1);
        setStreak(prev => {
          const newStreak = prev + 1;
          setMaxStreak(ms => Math.max(ms, newStreak));
          return newStreak;
        });
        // Record correct answer
        const responseTime = Date.now() - wordStartTime;
        try { api.recordAnswer(word.id, true, responseTime); } catch {}
      } else {
        setWrongCount(prev => prev + 1);
        setStreak(0);
        setIsWordWrong(true);
        // Record wrong answer
        const responseTime = Date.now() - wordStartTime;
        try { api.recordAnswer(word.id, false, responseTime); } catch {}
      }
    }
  }, [word, typedChars, targetWord, isWordComplete, wordStartTime]);

  const goNext = () => {
    if (currentIndex < totalWords - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Loop back or show completion
      setCurrentIndex(0);
    }
  };

  // Calculate stats
  const elapsedSeconds = Math.max(1, (Date.now() - sessionStartTime) / 1000);
  const wordsCompleted = correctCount + wrongCount;
  const wpm = Math.round((correctCount / elapsedSeconds) * 60);
  const accuracy = totalKeystrokes > 0 ? Math.round((correctKeystrokes / totalKeystrokes) * 100) : 100;

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!words || words.length === 0) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="text-center glass-card p-8">
          <span className="text-5xl">✍️</span>
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-4">没有可默写的单词</h3>
          <p className="text-slate-500 dark:text-slate-400 mt-2">请先选择词库并学习一些单词</p>
          <a href="/books" className="mt-4 inline-block px-5 py-2 bg-blue-500 text-white rounded-xl text-sm hover:bg-blue-600 transition-colors">选择词库</a>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="h-[calc(100vh-8rem)] flex flex-col items-center justify-center outline-none select-none relative"
    >
      {/* Top Stats Bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 dark:text-slate-500">进度</span>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{currentIndex + 1}/{totalWords}</span>
          </div>
          <div className="w-32 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full transition-all duration-300" style={{ width: `${((currentIndex + 1) / totalWords) * 100}%` }} />
          </div>
        </div>
        <div className="flex items-center gap-5 text-xs">
          <div className="text-center">
            <p className="text-slate-400 dark:text-slate-500">速度</p>
            <p className="text-sm font-bold text-blue-600 dark:text-blue-400">{wpm}<span className="text-[10px] font-normal ml-0.5">词/分</span></p>
          </div>
          <div className="text-center">
            <p className="text-slate-400 dark:text-slate-500">正确率</p>
            <p className={`text-sm font-bold ${accuracy >= 90 ? 'text-green-600 dark:text-green-400' : accuracy >= 70 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>{accuracy}%</p>
          </div>
          <div className="text-center">
            <p className="text-slate-400 dark:text-slate-500">连击</p>
            <p className="text-sm font-bold text-orange-500">{streak > 0 ? `🔥${streak}` : '-'}</p>
          </div>
        </div>
      </div>

      {/* Settings toggles */}
      <div className="absolute top-0 right-6 mt-12 flex items-center gap-2">
        <button
          onClick={() => setShowPhonetic(prev => !prev)}
          className={`px-2 py-1 rounded-lg text-[11px] transition-colors ${showPhonetic ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}
        >
          音标
        </button>
        <button
          onClick={() => setShowMeaning(prev => !prev)}
          className={`px-2 py-1 rounded-lg text-[11px] transition-colors ${showMeaning ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}
        >
          释义
        </button>
      </div>

      {/* Main Content - Centered */}
      <div className="flex flex-col items-center gap-6 w-full max-w-2xl px-4">
        {/* Phonetic */}
        {showPhonetic && word?.phonetic && (
          <div className="flex items-center gap-2 animate-fadeIn">
            <AudioButton audioUrl={word?.audioUs} word={word?.word} size="sm" variant="ghost" />
            <span className="text-base text-slate-400 dark:text-slate-500">{word.phonetic}</span>
          </div>
        )}

        {/* Word Display - Letter by Letter */}
        <div className="flex items-center justify-center gap-0.5 flex-wrap">
          {targetWord.split('').map((char: string, i: number) => {
            let status: 'pending' | 'correct' | 'wrong' | 'current' = 'pending';

            if (i < typedChars.length) {
              status = typedChars[i].toLowerCase() === char.toLowerCase() ? 'correct' : 'wrong';
            } else if (i === typedChars.length && !isWordComplete) {
              status = 'current';
            }

            return (
              <span
                key={i}
                className={`inline-block text-5xl font-mono font-bold transition-all duration-150 ${
                  status === 'correct' ? 'text-green-500 dark:text-green-400 scale-100' :
                  status === 'wrong' ? 'text-red-500 dark:text-red-400 animate-shake scale-100' :
                  status === 'current' ? 'text-blue-500 dark:text-blue-400 border-b-4 border-blue-500 dark:border-blue-400 pb-1' :
                  'text-slate-300 dark:text-slate-600'
                }`}
              >
                {status === 'wrong' ? typedChars[i] : char}
              </span>
            );
          })}
        </div>

        {/* Meaning */}
        {showMeaning && meanings.length > 0 && (
          <div className="text-center animate-fadeIn">
            {meanings.map((m: any, i: number) => (
              <p key={i} className="text-base text-slate-600 dark:text-slate-300">
                <span className="text-sm text-blue-500 dark:text-blue-400 mr-1.5">{m.partOfSpeech}</span>
                <span>{m.translation || m.definition}</span>
              </p>
            ))}
          </div>
        )}

        {/* Sentence hint (shown after first wrong attempt or on demand) */}
        {examples.length > 0 && isWordWrong && (
          <div className="mt-2 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl max-w-xl text-center animate-fadeIn border border-slate-200 dark:border-slate-700">
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">📝 例句</p>
            <p className="text-sm text-slate-600 dark:text-slate-300 italic leading-relaxed">
              {examples[0].sentence?.replace(
                new RegExp(`\\b${targetWord}\\w*\\b`, 'gi'),
                (match: string) => `[${match}]`
              )}
            </p>
            {examples[0].translation && (
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">{examples[0].translation}</p>
            )}
          </div>
        )}

        {/* Completion feedback */}
        {isWordComplete && (
          <div className={`mt-2 px-6 py-3 rounded-xl text-center animate-fadeIn ${
            isWordWrong
              ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30'
              : 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30'
          }`}>
            {isWordWrong ? (
              <div>
                <p className="text-red-600 dark:text-red-400 font-medium text-sm">
                  正确拼写: <span className="font-mono font-bold text-base">{targetWord}</span>
                </p>
              </div>
            ) : (
              <p className="text-green-600 dark:text-green-400 font-medium text-sm">
                ✓ 正确！
                {streak > 1 && <span className="ml-2 text-orange-500">🔥 {streak} 连击</span>}
              </p>
            )}
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">按 Enter 或 Space 继续</p>
          </div>
        )}

        {/* Typing cursor indicator (when idle) */}
        {!isWordComplete && typedChars.length === 0 && (
          <p className="text-xs text-slate-400 dark:text-slate-500 animate-pulse">开始输入...</p>
        )}
      </div>

      {/* Bottom Stats Summary */}
      <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-8 text-xs text-slate-400 dark:text-slate-500">
        <span>✓ <span className="text-green-600 dark:text-green-400 font-medium">{correctCount}</span></span>
        <span>✗ <span className="text-red-500 dark:text-red-400 font-medium">{wrongCount}</span></span>
        <span>最大连击 <span className="text-orange-500 font-medium">{maxStreak}</span></span>
        <span className="hidden sm:inline">Esc 重置 · Backspace 退格</span>
      </div>
    </div>
  );
}
