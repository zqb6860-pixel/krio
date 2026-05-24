'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { useApi } from '@/hooks/useApi';

/**
 * Qwerty Learner 风格的打字练习页面
 * - 全屏专注打字界面
 * - 实时 WPM / 正确率 / 连击
 * - 章节制词库进度
 * - 输错整词重来机制
 * - 音标和释义实时显示
 */

type TypingMode = 'normal' | 'zen' | 'speed';

interface ChapterWord {
  id: string;
  word: string;
  phonetic: string;
  translation: string;
  partOfSpeech: string;
}

function speakWord(text: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = 0.85;
  window.speechSynthesis.speak(utterance);
}

export default function TypingPage() {
  const { data: books } = useApi(() => api.getWordBooks(), []);

  const [selectedBook, setSelectedBook] = useState<string>('');
  const [chapter, setChapter] = useState(0);
  const [chapterData, setChapterData] = useState<{ words: ChapterWord[]; totalChapters: number } | null>(null);
  const [mode, setMode] = useState<TypingMode>('normal');
  const [isStarted, setIsStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Typing state
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [typedChars, setTypedChars] = useState<string[]>([]);
  const [isWordWrong, setIsWordWrong] = useState(false);
  const [shakeAnim, setShakeAnim] = useState(false);

  // Stats
  const [correctWords, setCorrectWords] = useState(0);
  const [wrongWords, setWrongWords] = useState(0);
  const [totalChars, setTotalChars] = useState(0);
  const [correctChars, setCorrectChars] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const words = chapterData?.words || [];
  const currentWord = words[currentWordIndex];
  const targetWord = currentWord?.word || '';

  // Calculate real-time WPM
  const elapsed = startTime > 0 ? (Date.now() - startTime) / 1000 / 60 : 0;
  const wpm = elapsed > 0 ? Math.round(correctWords / elapsed) : 0;
  const accuracy = totalChars > 0 ? Math.round((correctChars / totalChars) * 100) : 100;

  // Load chapter
  const loadChapter = useCallback(async (bookId: string, chapterIdx: number) => {
    setIsLoading(true);
    try {
      const data = await api.getChapterWords(bookId, chapterIdx, 20);
      setChapterData(data);
      setCurrentWordIndex(0);
      setTypedChars([]);
      setIsWordWrong(false);
    } catch (err) {
      console.error('Failed to load chapter:', err);
    }
    setIsLoading(false);
  }, []);

  // Start typing session
  const handleStart = async () => {
    if (!selectedBook) return;
    await loadChapter(selectedBook, chapter);
    setIsStarted(true);
    setStartTime(Date.now());
    setCorrectWords(0);
    setWrongWords(0);
    setTotalChars(0);
    setCorrectChars(0);
    setCombo(0);
    setMaxCombo(0);
    setIsComplete(false);
    setTimeout(() => containerRef.current?.focus(), 100);
  };

  // Auto-pronounce word
  useEffect(() => {
    if (isStarted && currentWord) {
      speakWord(currentWord.word);
    }
  }, [currentWordIndex, isStarted]);

  // Focus container
  useEffect(() => {
    if (isStarted) containerRef.current?.focus();
  }, [isStarted]);

  // Handle key input
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isStarted || !currentWord || isComplete) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      setTypedChars([]);
      setIsWordWrong(false);
      return;
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      // Skip word
      handleWordComplete(false);
      return;
    }

    if (e.key.length !== 1) return;
    e.preventDefault();

    const charIndex = typedChars.length;
    const expectedChar = targetWord[charIndex];
    const isCorrect = e.key.toLowerCase() === expectedChar?.toLowerCase();

    setTotalChars((c) => c + 1);

    if (isCorrect) {
      setCorrectChars((c) => c + 1);
      const newTyped = [...typedChars, e.key];
      setTypedChars(newTyped);
      setIsWordWrong(false);

      // Word complete
      if (newTyped.length === targetWord.length) {
        handleWordComplete(true);
      }
    } else {
      // Qwerty Learner 核心: 输错整词重来
      setIsWordWrong(true);
      setShakeAnim(true);
      setTypedChars([...typedChars, e.key]); // Show wrong char briefly

      setTimeout(() => {
        setTypedChars([]);
        setShakeAnim(false);
        setIsWordWrong(false);
        // Re-pronounce
        speakWord(targetWord);
      }, 400);
    }
  }, [isStarted, currentWord, typedChars, targetWord, isComplete]);

  const handleWordComplete = (correct: boolean) => {
    if (correct) {
      setCorrectWords((c) => c + 1);
      const newCombo = combo + 1;
      setCombo(newCombo);
      setMaxCombo((m) => Math.max(m, newCombo));
    } else {
      setWrongWords((w) => w + 1);
      setCombo(0);
    }

    // Move to next word
    if (currentWordIndex < words.length - 1) {
      setCurrentWordIndex((i) => i + 1);
      setTypedChars([]);
      setIsWordWrong(false);
    } else {
      // Chapter complete
      setIsComplete(true);
      submitSession();
    }
  };

  const submitSession = async () => {
    const duration = Math.round((Date.now() - startTime) / 1000);
    try {
      await api.recordTypingSession({
        bookId: selectedBook,
        mode,
        wordsTyped: correctWords + wrongWords + 1,
        correctWords: correctWords + 1,
        totalChars,
        correctChars,
        wpm: elapsed > 0 ? Math.round((correctWords + 1) / elapsed) : 0,
        accuracy: totalChars > 0 ? Math.round((correctChars / totalChars) * 100) : 100,
        maxCombo,
        duration,
        chapterIndex: chapter,
      });
    } catch (err) {
      console.error('Failed to submit session:', err);
    }
  };

  const handleNextChapter = () => {
    const nextChapter = chapter + 1;
    if (chapterData && nextChapter < chapterData.totalChapters) {
      setChapter(nextChapter);
      loadChapter(selectedBook, nextChapter);
      setIsComplete(false);
      setStartTime(Date.now());
      setCorrectWords(0);
      setWrongWords(0);
      setTotalChars(0);
      setCorrectChars(0);
      setCombo(0);
      setMaxCombo(0);
    }
  };

  // ===== Setup Screen =====
  if (!isStarted) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-3xl">⌨️</span>
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Qwerty 打字练习</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">在打字中背单词，建立英文肌肉记忆</p>
            </div>
          </div>

          {/* Book Selection */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">选择词库</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {(books || []).map((book: any) => (
                  <button
                    key={book.id}
                    onClick={() => setSelectedBook(book.id)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      selectedBook === book.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-slate-200 dark:border-slate-700 hover:border-blue-300'
                    }`}
                  >
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{book.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{book.wordCount} 词</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Mode Selection */}
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">练习模式</label>
              <div className="flex gap-3">
                {([
                  { key: 'normal', label: '标准模式', desc: '显示音标和释义', icon: '📖' },
                  { key: 'zen', label: '专注模式', desc: '极简界面，无干扰', icon: '🧘' },
                  { key: 'speed', label: '速度模式', desc: '计时挑战', icon: '⚡' },
                ] as { key: TypingMode; label: string; desc: string; icon: string }[]).map((m) => (
                  <button
                    key={m.key}
                    onClick={() => setMode(m.key)}
                    className={`flex-1 p-4 rounded-xl border-2 text-center transition-all ${
                      mode === m.key
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-slate-200 dark:border-slate-700 hover:border-purple-300'
                    }`}
                  >
                    <span className="text-2xl block mb-1">{m.icon}</span>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{m.label}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{m.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Chapter */}
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                起始章节 <span className="text-slate-400 font-normal">(每章 20 词)</span>
              </label>
              <input
                type="number"
                min={0}
                value={chapter}
                onChange={(e) => setChapter(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-24 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              />
            </div>

            <button
              onClick={handleStart}
              disabled={!selectedBook || isLoading}
              className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-lg font-bold rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '加载中...' : '开始打字练习 ⌨️'}
            </button>
          </div>
        </div>

        {/* Tips */}
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">💡 使用说明</h3>
          <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-2">
            <li>• 看到单词后，直接用键盘输入单词拼写</li>
            <li>• <span className="text-red-500 font-medium">输错任何字母会清空重来</span>，确保形成正确的肌肉记忆</li>
            <li>• 每个单词自动播放发音，帮助建立音-形联结</li>
            <li>• 按 <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-[10px]">Tab</kbd> 跳过当前单词</li>
            <li>• 按 <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-[10px]">Esc</kbd> 清空已输入</li>
          </ul>
        </div>
      </div>
    );
  }

  // ===== Completion Screen =====
  if (isComplete) {
    const finalWpm = elapsed > 0 ? Math.round(correctWords / elapsed) : 0;
    const finalAccuracy = totalChars > 0 ? Math.round((correctChars / totalChars) * 100) : 100;
    return (
      <div className="max-w-lg mx-auto flex items-center justify-center min-h-[70vh]">
        <div className="glass-card p-8 text-center w-full animate-fadeIn">
          <span className="text-5xl">🎉</span>
          <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-4">章节完成！</h3>
          <p className="text-slate-500 dark:text-slate-400 mt-2">第 {chapter + 1} 章 · {words.length} 个单词</p>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{finalWpm}</p>
              <p className="text-xs text-slate-500">WPM 速度</p>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{finalAccuracy}%</p>
              <p className="text-xs text-slate-500">正确率</p>
            </div>
            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{maxCombo}</p>
              <p className="text-xs text-slate-500">最大连击</p>
            </div>
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{correctWords}</p>
              <p className="text-xs text-slate-500">正确词数</p>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            {chapterData && chapter + 1 < chapterData.totalChapters && (
              <button onClick={handleNextChapter}
                className="flex-1 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors">
                下一章 →
              </button>
            )}
            <button onClick={() => { setIsStarted(false); setIsComplete(false); }}
              className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
              返回设置
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===== Main Typing Interface =====
  const isZen = mode === 'zen';

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className={`min-h-[calc(100vh-6rem)] flex flex-col outline-none select-none ${
        isZen ? 'items-center justify-center' : ''
      }`}
    >
      {/* Top Stats Bar */}
      {!isZen && (
        <div className="flex items-center justify-between px-4 py-3 mb-4 glass-card">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsStarted(false)} className="text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
              ← 退出
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">章节</span>
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{chapter + 1}</span>
            </div>
            <div className="w-32 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${((currentWordIndex + 1) / words.length) * 100}%` }} />
            </div>
            <span className="text-xs text-slate-400">{currentWordIndex + 1}/{words.length}</span>
          </div>
          <div className="flex items-center gap-6 text-xs">
            <div className="text-center">
              <p className="text-slate-400">WPM</p>
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{wpm}</p>
            </div>
            <div className="text-center">
              <p className="text-slate-400">正确率</p>
              <p className={`text-lg font-bold ${accuracy >= 90 ? 'text-green-500' : accuracy >= 70 ? 'text-amber-500' : 'text-red-500'}`}>{accuracy}%</p>
            </div>
            <div className="text-center">
              <p className="text-slate-400">连击</p>
              <p className="text-lg font-bold text-orange-500">{combo > 0 ? `🔥${combo}` : '-'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Typing Area */}
      <div className={`flex-1 flex flex-col items-center justify-center gap-6 ${isZen ? '' : 'px-4'}`}>
        {/* Upcoming words preview */}
        {!isZen && (
          <div className="flex items-center gap-3 opacity-40">
            {words.slice(currentWordIndex + 1, currentWordIndex + 4).map((w, i) => (
              <span key={i} className="text-sm text-slate-400 dark:text-slate-500">{w.word}</span>
            ))}
          </div>
        )}

        {/* Translation (above) */}
        {!isZen && currentWord && (
          <div className="text-center animate-fadeIn">
            <span className="text-xs text-blue-500 dark:text-blue-400 mr-1.5">{currentWord.partOfSpeech}</span>
            <span className="text-base text-slate-600 dark:text-slate-300">{currentWord.translation}</span>
          </div>
        )}

        {/* Word Display - Character by character */}
        <div className={`flex items-center justify-center gap-0.5 flex-wrap min-h-[4rem] transition-all ${
          shakeAnim ? 'animate-[headShake_0.3s_ease-in-out]' : ''
        }`}>
          {targetWord.split('').map((char, i) => {
            let status: 'pending' | 'correct' | 'wrong' | 'current' = 'pending';
            if (i < typedChars.length) {
              status = typedChars[i].toLowerCase() === char.toLowerCase() ? 'correct' : 'wrong';
            } else if (i === typedChars.length) {
              status = 'current';
            }

            return (
              <span
                key={i}
                className={`inline-flex items-center justify-center text-5xl md:text-6xl font-mono font-bold w-12 md:w-14 transition-all duration-100 ${
                  status === 'correct' ? 'text-green-500 dark:text-green-400 scale-95' :
                  status === 'wrong' ? 'text-red-500 dark:text-red-400 scale-110' :
                  status === 'current' ? 'text-blue-500 dark:text-blue-400 border-b-3 border-blue-500' :
                  'text-slate-300 dark:text-slate-600'
                }`}
              >
                {status === 'wrong' ? typedChars[i] : char}
              </span>
            );
          })}
        </div>

        {/* Phonetic */}
        {!isZen && currentWord?.phonetic && (
          <p className="text-sm text-slate-400 dark:text-slate-500">{currentWord.phonetic}</p>
        )}

        {/* Combo indicator */}
        {combo >= 5 && (
          <div className="animate-bounce text-center">
            <span className="text-2xl">🔥</span>
            <span className="text-sm font-bold text-orange-500 ml-1">{combo} 连击!</span>
          </div>
        )}

        {/* Error hint */}
        {isWordWrong && (
          <p className="text-sm text-red-500 dark:text-red-400 animate-fadeIn">✗ 输错了，整词重来！</p>
        )}

        {/* Idle hint */}
        {!isWordWrong && typedChars.length === 0 && (
          <p className="text-xs text-slate-400 dark:text-slate-500 animate-pulse">开始输入...</p>
        )}
      </div>

      {/* Bottom hint */}
      {isZen && (
        <div className="absolute bottom-4 left-0 right-0 text-center">
          <p className="text-[11px] text-slate-400 dark:text-slate-600">
            {currentWordIndex + 1}/{words.length} · WPM {wpm} · {accuracy}%
          </p>
        </div>
      )}
    </div>
  );
}
