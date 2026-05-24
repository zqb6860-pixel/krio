'use client';

import { useState, useRef, useEffect } from 'react';
import { api } from '@/lib/api';
import { useApi } from '@/hooks/useApi';

/**
 * 听力练习页面
 * - 听音选词模式: 播放单词发音 → 选择正确释义
 * - 听写句子模式: 播放例句 → 输入听到的内容
 */

type ListeningMode = 'word' | 'sentence';

function speakText(text: string, rate = 0.85) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = rate;
  window.speechSynthesis.speak(utterance);
}

export default function ListeningPage() {
  const { data: books } = useApi(() => api.getWordBooks(), []);

  const [mode, setMode] = useState<ListeningMode>('word');
  const [selectedBook, setSelectedBook] = useState<string>('');
  const [isStarted, setIsStarted] = useState(false);
  const [exercises, setExercises] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Word mode state
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  // Sentence mode state
  const [typedText, setTypedText] = useState('');
  const [sentenceChecked, setSentenceChecked] = useState(false);

  // Stats
  const [correctCount, setCorrectCount] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const currentExercise = exercises[currentIndex];

  const handleStart = async () => {
    setIsLoading(true);
    try {
      const data = await api.getListeningExercises(mode, selectedBook || undefined, 10);
      setExercises(data.exercises || []);
      setIsStarted(true);
      setCurrentIndex(0);
      setCorrectCount(0);
      setTotalAnswered(0);
      setStartTime(Date.now());
      setIsComplete(false);
      setSelectedOption(null);
      setIsAnswered(false);
      setTypedText('');
      setSentenceChecked(false);
    } catch (err) {
      console.error('Failed to load exercises:', err);
    }
    setIsLoading(false);
  };

  // Auto-play audio when moving to next exercise
  useEffect(() => {
    if (isStarted && currentExercise && !isComplete) {
      setTimeout(() => {
        if (mode === 'word') {
          speakText(currentExercise.word);
        } else {
          speakText(currentExercise.sentence, 0.75);
        }
      }, 500);
    }
  }, [currentIndex, isStarted, isComplete]);

  // Focus input in sentence mode
  useEffect(() => {
    if (mode === 'sentence' && isStarted && !isComplete) {
      inputRef.current?.focus();
    }
  }, [currentIndex, isStarted, mode]);

  const handlePlayAudio = () => {
    if (!currentExercise) return;
    if (mode === 'word') {
      speakText(currentExercise.word);
    } else {
      speakText(currentExercise.sentence, 0.75);
    }
  };

  // Word mode: select option
  const handleSelectOption = (index: number) => {
    if (isAnswered) return;
    setSelectedOption(index);
    setIsAnswered(true);
    setTotalAnswered((t) => t + 1);

    const isCorrect = currentExercise.options[index] === currentExercise.correctAnswer;
    if (isCorrect) setCorrectCount((c) => c + 1);
  };

  // Sentence mode: check answer
  const handleCheckSentence = () => {
    if (sentenceChecked) return;
    setSentenceChecked(true);
    setTotalAnswered((t) => t + 1);

    // Simple check: normalize and compare
    const normalized = typedText.trim().toLowerCase().replace(/[.,!?;:'"]/g, '');
    const expected = (currentExercise.sentence || '').trim().toLowerCase().replace(/[.,!?;:'"]/g, '');
    const similarity = calculateSimilarity(normalized, expected);

    if (similarity >= 0.8) {
      setCorrectCount((c) => c + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < exercises.length - 1) {
      setCurrentIndex((i) => i + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setTypedText('');
      setSentenceChecked(false);
    } else {
      setIsComplete(true);
      submitSession();
    }
  };

  const submitSession = async () => {
    const duration = Math.round((Date.now() - startTime) / 1000);
    try {
      await api.recordListeningSession({
        mode,
        totalItems: totalAnswered + 1,
        correctItems: correctCount,
        duration,
      });
    } catch (err) {
      console.error('Submit failed:', err);
    }
  };

  // ===== Setup Screen =====
  if (!isStarted) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-3xl">🎧</span>
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">听力练习</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">训练英语听力辨识能力</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Mode */}
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">练习模式</label>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setMode('word')}
                  className={`p-4 rounded-xl border-2 text-center transition-all ${
                    mode === 'word' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-200 dark:border-slate-700'
                  }`}>
                  <span className="text-2xl block mb-1">🔊</span>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">听音选词</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">听发音，选择正确释义</p>
                </button>
                <button onClick={() => setMode('sentence')}
                  className={`p-4 rounded-xl border-2 text-center transition-all ${
                    mode === 'sentence' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-200 dark:border-slate-700'
                  }`}>
                  <span className="text-2xl block mb-1">📝</span>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">听写句子</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">听句子，输入听到的内容</p>
                </button>
              </div>
            </div>

            {/* Book (optional) */}
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                词库范围 <span className="text-slate-400 font-normal">(可选)</span>
              </label>
              <select
                value={selectedBook}
                onChange={(e) => setSelectedBook(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              >
                <option value="">全部已学单词</option>
                {(books || []).map((book: any) => (
                  <option key={book.id} value={book.id}>{book.name} ({book.wordCount}词)</option>
                ))}
              </select>
            </div>

            <button onClick={handleStart} disabled={isLoading}
              className="w-full py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-lg font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50">
              {isLoading ? '加载中...' : '开始听力练习 🎧'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===== Completion Screen =====
  if (isComplete) {
    const accuracy = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;
    return (
      <div className="max-w-lg mx-auto flex items-center justify-center min-h-[70vh]">
        <div className="glass-card p-8 text-center w-full animate-fadeIn">
          <span className="text-5xl">{accuracy >= 80 ? '🎉' : accuracy >= 60 ? '👏' : '💪'}</span>
          <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-4">练习完成！</h3>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            {mode === 'word' ? '听音选词' : '听写句子'} · {exercises.length} 题
          </p>

          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
              <p className="text-2xl font-bold text-green-600">{correctCount}</p>
              <p className="text-xs text-slate-500">正确</p>
            </div>
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl">
              <p className="text-2xl font-bold text-red-600">{totalAnswered - correctCount}</p>
              <p className="text-xs text-slate-500">错误</p>
            </div>
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <p className="text-2xl font-bold text-blue-600">{accuracy}%</p>
              <p className="text-xs text-slate-500">正确率</p>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button onClick={handleStart}
              className="flex-1 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors">
              再来一组
            </button>
            <button onClick={() => setIsStarted(false)}
              className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-medium">
              返回
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===== Word Mode =====
  if (mode === 'word' && currentExercise) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Progress */}
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <button onClick={() => setIsStarted(false)} className="text-sm text-slate-400 hover:text-slate-600">← 退出</button>
              <span className="text-sm text-slate-600 dark:text-slate-300">{currentIndex + 1}/{exercises.length}</span>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="text-green-600">✓ {correctCount}</span>
              <span className="text-red-500">✗ {totalAnswered - correctCount}</span>
            </div>
          </div>
          <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${((currentIndex + 1) / exercises.length) * 100}%` }} />
          </div>
        </div>

        {/* Audio Card */}
        <div className="glass-card p-8 text-center">
          <button onClick={handlePlayAudio}
            className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all active:scale-95">
            <span className="text-4xl">🔊</span>
          </button>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-4">点击播放发音</p>

          {/* Show word after answering */}
          {isAnswered && (
            <div className="mt-4 animate-fadeIn">
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{currentExercise.word}</p>
              <p className="text-sm text-slate-400">{currentExercise.phonetic}</p>
            </div>
          )}
        </div>

        {/* Options */}
        <div className="grid grid-cols-2 gap-3">
          {currentExercise.options.map((option: string, i: number) => {
            let btnClass = 'p-4 rounded-xl border-2 text-center transition-all font-medium text-sm ';
            if (!isAnswered) {
              btnClass += 'border-slate-200 dark:border-slate-700 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 text-slate-700 dark:text-slate-200 cursor-pointer';
            } else if (option === currentExercise.correctAnswer) {
              btnClass += 'border-green-400 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300';
            } else if (i === selectedOption) {
              btnClass += 'border-red-400 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300';
            } else {
              btnClass += 'border-slate-100 dark:border-slate-800 text-slate-400';
            }
            return (
              <button key={i} onClick={() => handleSelectOption(i)} disabled={isAnswered} className={btnClass}>
                {option}
                {isAnswered && option === currentExercise.correctAnswer && ' ✓'}
              </button>
            );
          })}
        </div>

        {/* Next */}
        {isAnswered && (
          <div className="text-center">
            <button onClick={handleNext}
              className="px-8 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors">
              {currentIndex < exercises.length - 1 ? '下一题 →' : '查看结果'}
            </button>
          </div>
        )}
      </div>
    );
  }

  // ===== Sentence Mode =====
  if (mode === 'sentence' && currentExercise) {
    const similarity = sentenceChecked ? calculateSimilarity(
      typedText.trim().toLowerCase().replace(/[.,!?;:'"]/g, ''),
      (currentExercise.sentence || '').trim().toLowerCase().replace(/[.,!?;:'"]/g, '')
    ) : 0;
    const isCorrect = similarity >= 0.8;

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Progress */}
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <button onClick={() => setIsStarted(false)} className="text-sm text-slate-400 hover:text-slate-600">← 退出</button>
              <span className="text-sm text-slate-600 dark:text-slate-300">{currentIndex + 1}/{exercises.length}</span>
            </div>
            <span className="text-xs text-slate-400">听写模式</span>
          </div>
          <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-cyan-500 rounded-full transition-all" style={{ width: `${((currentIndex + 1) / exercises.length) * 100}%` }} />
          </div>
        </div>

        {/* Audio + Word hint */}
        <div className="glass-card p-8 text-center">
          <button onClick={handlePlayAudio}
            className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg hover:scale-105 transition-all active:scale-95">
            <span className="text-3xl">🎵</span>
          </button>
          <p className="text-sm text-slate-400 mt-3">听句子，输入你听到的内容</p>
          <p className="text-xs text-slate-500 mt-1">
            提示: 包含单词 <span className="text-blue-500 font-medium">{currentExercise.word}</span>
          </p>
          {currentExercise.sentenceTranslation && (
            <p className="text-xs text-slate-400 mt-2 italic">{currentExercise.sentenceTranslation}</p>
          )}
        </div>

        {/* Input */}
        <div className="glass-card p-6">
          <input
            ref={inputRef}
            value={typedText}
            onChange={(e) => setTypedText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !sentenceChecked && handleCheckSentence()}
            placeholder="输入你听到的句子..."
            disabled={sentenceChecked}
            className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-cyan-500 disabled:opacity-50"
          />

          {/* Result */}
          {sentenceChecked && (
            <div className={`mt-4 p-4 rounded-xl ${isCorrect ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'}`}>
              <p className={`text-sm font-medium ${isCorrect ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                {isCorrect ? '✓ 正确！' : `✗ 匹配度 ${Math.round(similarity * 100)}%`}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
                <span className="text-xs text-slate-400">正确答案: </span>{currentExercise.sentence}
              </p>
            </div>
          )}

          {!sentenceChecked ? (
            <button onClick={handleCheckSentence} disabled={!typedText.trim()}
              className="mt-3 w-full py-3 bg-cyan-500 text-white rounded-xl font-medium hover:bg-cyan-600 transition-colors disabled:opacity-50">
              检查答案
            </button>
          ) : (
            <button onClick={handleNext}
              className="mt-3 w-full py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors">
              {currentIndex < exercises.length - 1 ? '下一题 →' : '查看结果'}
            </button>
          )}
        </div>
      </div>
    );
  }

  return null;
}

// Simple string similarity (Levenshtein-based)
function calculateSimilarity(s1: string, s2: string): number {
  if (!s1 || !s2) return 0;
  if (s1 === s2) return 1;

  const len1 = s1.length;
  const len2 = s2.length;
  const maxLen = Math.max(len1, len2);
  if (maxLen === 0) return 1;

  const matrix: number[][] = [];
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return 1 - matrix[len1][len2] / maxLen;
}
