'use client';

import { useState } from 'react';
import { WordCard } from '@/components/learn/WordCard';
import { WordProgress } from '@/components/learn/WordProgress';
import { mockWords } from '@/lib/mockData';

export default function LearnPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [learnedCount, setLearnedCount] = useState(0);
  const totalWords = mockWords.length;
  const currentWord = mockWords[currentIndex];

  const handleNext = (status: 'known' | 'vague' | 'unknown') => {
    if (status === 'known' || status === 'vague') {
      setLearnedCount((c) => c + 1);
    }
    if (currentIndex < totalWords - 1) {
      setCurrentIndex((i) => i + 1);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress Header */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-slate-800">📚 单词学习</h2>
          <span className="text-sm text-slate-500">
            {currentIndex + 1} / {totalWords}
          </span>
        </div>
        <WordProgress current={currentIndex + 1} total={totalWords} learned={learnedCount} />
      </div>

      {/* Word Card */}
      {currentWord && (
        <WordCard word={currentWord} onNext={handleNext} />
      )}

      {/* Completed */}
      {currentIndex >= totalWords - 1 && learnedCount > 0 && (
        <div className="glass-card p-8 text-center">
          <span className="text-5xl">🎉</span>
          <h3 className="text-xl font-bold text-slate-800 mt-4">今日学习完成！</h3>
          <p className="text-slate-500 mt-2">
            你已学习 {learnedCount} 个单词，继续保持！
          </p>
        </div>
      )}
    </div>
  );
}
