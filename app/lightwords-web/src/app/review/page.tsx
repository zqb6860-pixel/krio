'use client';

import { useState } from 'react';
import { ReviewStats } from '@/components/review/ReviewStats';
import { FlashcardReview } from '@/components/review/FlashcardReview';
import { MemoryCurve } from '@/components/review/MemoryCurve';

export default function ReviewPage() {
  const [mode, setMode] = useState<'overview' | 'flashcard' | 'test'>('overview');

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800">🔄 复习中心</h2>
            <p className="text-sm text-slate-500 mt-1">
              基于智能遗忘曲线，精准安排复习
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMode('flashcard')}
              className="px-4 py-2 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors"
            >
              开始复习 (18个)
            </button>
          </div>
        </div>
      </div>

      {mode === 'overview' && (
        <>
          <ReviewStats />
          <MemoryCurve />
        </>
      )}

      {mode === 'flashcard' && (
        <FlashcardReview onComplete={() => setMode('overview')} />
      )}
    </div>
  );
}
