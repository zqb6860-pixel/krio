'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { useApi } from '@/hooks/useApi';
import { AudioButton } from '@/components/common/AudioButton';

type Mode = 'practice' | 'hideAll' | 'hideVowel' | 'hideConsonant' | 'randomHide';
const VOWELS = new Set(['a', 'e', 'i', 'o', 'u']);

function speakWord(text: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = 0.85;
  const voices = window.speechSynthesis.getVoices();
  const enVoice = voices.find(v => v.lang.startsWith('en-US')) || voices.find(v => v.lang.startsWith('en'));
  if (enVoice) utterance.voice = enVoice;
  window.speechSynthesis.speak(utterance);
}

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
  const [mode, setMode] = useState<Mode>('practice');
  const [shakeAnimation, setShakeAnimation] = useState(false);
  const [wrongFlash, setWrongFlash] = useState(false);
  const [randomVisible, setRandomVisible] = useState<boolean[]>([]);
  const [isHoveringWord, setIsHoveringWord] = useState(false);
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

  // Reset word state when index changes + auto pronounce
  useEffect(() => {
    setTypedChars([]);
    setIsWordComplete(false);
    setIsWordWrong(false);
    setWordStartTime(Date.now());
    setShakeAnimation(false);
    setWrongFlash(false);
    // Generate random visibility for randomHide mode
    if (targetWord) {
      setRandomVisible(targetWord.split('').map(() => Math.random() > 0.4));
    }
    // Auto pronounce the word when it appears
    if (word?.word) {
      setTimeout(() => {
        if (word.audioUs) {
          const audio = new Audio(word.audioUs);
          audio.play().catch(() => {
            // Fallback to TTS if audio fails
            speakWord(word.word);
          });
        } else {
          speakWord(word.word);
        }
      }, 300);
    }
  }, [currentIndex, targetWord]);

  // Handle keyboard input
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!word) return;

    // After word is complete, press Enter/Space to go next
    if (isWordComplete) {
      if (e.key === 'Enter' || e.key === ' ') {
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
      setTypedChars([]);
      return;
    }

    // Only accept single printable characters
    if (e.key.length !== 1) return;
    e.preventDefault();

    const newTyped = [...typedChars, e.key];
    setTotalKeystrokes(prev => prev + 1);

    if (mode !== 'practice') {
      // === DICTATION MODES: check each char immediately, wrong = shake & clear ===
      const charIndex = newTyped.length - 1;
      const isCharCorrect = e.key.toLowerCase() === targetWord[charIndex]?.toLowerCase();

      if (!isCharCorrect) {
        // Show wrong char briefly in red, then clear
        setTypedChars(newTyped);
        setShakeAnimation(true);
        setWrongFlash(true);
        setTimeout(() => {
          setTypedChars([]);
          setShakeAnimation(false);
          // Re-pronounce the word after clearing
          if (word.audioUs) {
            const audio = new Audio(word.audioUs);
            audio.play().catch(() => speakWord(word.word));
          } else {
            speakWord(word.word);
          }
        }, 200);
        setTimeout(() => setWrongFlash(false), 400);
        return;
      }

      setTypedChars(newTyped);
      setCorrectKeystrokes(prev => prev + 1);

      if (newTyped.length === targetWord.length) {
        setIsWordComplete(true);
        setCorrectCount(prev => prev + 1);
        setStreak(prev => {
          const newStreak = prev + 1;
          setMaxStreak(ms => Math.max(ms, newStreak));
          return newStreak;
        });
        const responseTime = Date.now() - wordStartTime;
        try { api.recordAnswer(word.id, true, responseTime); } catch {}
      }
    } else if (mode === 'practice') {
      // === PRACTICE MODE: show each char result, allow completing full word ===
      setTypedChars(newTyped);

      const charIndex = newTyped.length - 1;
      const isCharCorrect = e.key.toLowerCase() === targetWord[charIndex]?.toLowerCase();
      if (isCharCorrect) {
        setCorrectKeystrokes(prev => prev + 1);
      }

      // Check if word is complete
      if (newTyped.length === targetWord.length) {
        const isAllCorrect = newTyped.every((ch: string, i: number) => ch.toLowerCase() === targetWord[i]?.toLowerCase());
        setIsWordComplete(true);

        if (isAllCorrect) {
          setCorrectCount(prev => prev + 1);
          setStreak(prev => {
            const newStreak = prev + 1;
            setMaxStreak(ms => Math.max(ms, newStreak));
            return newStreak;
          });
          const responseTime = Date.now() - wordStartTime;
          try { api.recordAnswer(word.id, true, responseTime); } catch {}
        } else {
          setWrongCount(prev => prev + 1);
          setStreak(0);
          setIsWordWrong(true);
          const responseTime = Date.now() - wordStartTime;
          try { api.recordAnswer(word.id, false, responseTime); } catch {}
        }
      }
    }
  }, [word, typedChars, targetWord, isWordComplete, wordStartTime, mode]);

  const goNext = () => {
    if (currentIndex < totalWords - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  // Calculate stats
  const elapsedSeconds = Math.max(1, (Date.now() - sessionStartTime) / 1000);
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

      {/* Mode Switch + Settings */}
      <div className="absolute top-0 right-6 mt-12 flex items-center gap-3">
        {/* Mode Toggle */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
          {([
            { key: 'practice', label: '练习' },
            { key: 'hideAll', label: '全隐藏' },
            { key: 'hideVowel', label: '隐元音' },
            { key: 'hideConsonant', label: '隐辅音' },
            { key: 'randomHide', label: '随机' },
          ] as { key: Mode; label: string }[]).map((m) => (
            <button
              key={m.key}
              onClick={() => { setMode(m.key); setTypedChars([]); }}
              className={`px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all ${mode === m.key ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
            >
              {m.label}
            </button>
          ))}
        </div>
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

        {/* Word Display */}
        <div
          className={`flex items-center justify-center gap-1 flex-wrap transition-all duration-300 min-h-[5rem] ${shakeAnimation ? 'animate-[headShake_0.2s_ease-in-out]' : ''}`}
          onMouseEnter={() => setIsHoveringWord(true)}
          onMouseLeave={() => setIsHoveringWord(false)}
        >
          {mode === 'practice' ? (
            // PRACTICE MODE: show letters directly, no underlines
            targetWord.split('').map((char: string, i: number) => {
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
                    status === 'correct' ? 'text-green-500 dark:text-green-400' :
                    status === 'wrong' ? 'text-red-500 dark:text-red-400' :
                    status === 'current' ? 'text-blue-500 dark:text-blue-400' :
                    'text-slate-300 dark:text-slate-600'
                  }`}
                >
                  {status === 'wrong' ? typedChars[i] : char}
                </span>
              );
            })
          ) : (
            // DICTATION MODES: hide letters based on mode, with single underline
            targetWord.split('').map((char: string, i: number) => {
              const isTyped = i < typedChars.length;
              const isCurrent = i === typedChars.length && !isWordComplete;
              let isVisible = false;
              if (isHoveringWord) {
                isVisible = true; // Show all letters on hover
              } else if (mode === 'hideVowel') {
                isVisible = !VOWELS.has(char.toLowerCase());
              } else if (mode === 'hideConsonant') {
                isVisible = VOWELS.has(char.toLowerCase());
              } else if (mode === 'randomHide') {
                isVisible = randomVisible[i] ?? false;
              }

              return (
                <span
                  key={i}
                  className={`inline-block text-5xl font-mono font-bold min-w-[2rem] text-center border-b-2 mx-0.5 pb-1 transition-colors duration-200 ${
                    shakeAnimation
                      ? 'text-red-500 dark:text-red-400 border-red-400 dark:border-red-500'
                      : isTyped
                      ? 'text-green-500 dark:text-green-400 border-green-400 dark:border-green-500'
                      : isCurrent
                      ? 'border-blue-500 dark:border-blue-400'
                      : 'border-slate-300 dark:border-slate-600'
                  }`}
                >
                  {isTyped ? typedChars[i] : isVisible ? <span className="text-slate-400 dark:text-slate-500">{char}</span> : '\u00A0'}
                </span>
              );
            })
          )}
        </div>

        {/* Word length hint in dictation modes */}
        {mode !== 'practice' && !isWordComplete && (
          <p className="text-xs text-slate-400 dark:text-slate-500">
            {targetWord.length} 个字母
            {typedChars.length > 0 && <span className="ml-2 text-blue-500">已输入 {typedChars.length}/{targetWord.length}</span>}
          </p>
        )}

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

        {/* Wrong feedback in dictation modes (fixed height to prevent layout shift) */}
        <div className="h-6 flex items-center justify-center">
          {mode !== 'practice' && wrongFlash && (
            <p className="text-sm text-red-500 dark:text-red-400 animate-fadeIn font-medium">
              ✗ 输错了，重新开始
            </p>
          )}
        </div>

        {/* Sentence hint (shown after wrong in practice mode) */}
        {examples.length > 0 && isWordWrong && mode === 'practice' && (
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
              <p className="text-red-600 dark:text-red-400 font-medium text-sm">
                正确拼写: <span className="font-mono font-bold text-base">{targetWord}</span>
              </p>
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
        {!isWordComplete && typedChars.length === 0 && !wrongFlash && (
          <p className="text-xs text-slate-400 dark:text-slate-500 animate-pulse">
            {mode !== 'practice' ? '根据释义和发音，输入单词...' : '开始输入...'}
          </p>
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
