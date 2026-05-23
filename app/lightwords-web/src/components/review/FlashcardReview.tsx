'use client';

import { useState } from 'react';

interface FlashcardReviewProps {
  onComplete: () => void;
}

const reviewWords = [
  { id: '1', word: 'accomplish', phonetic: '/əˈkɑːmplɪʃ/', meaning: 'v. 完成；实现' },
  { id: '2', word: 'abundant', phonetic: '/əˈbʌndənt/', meaning: 'adj. 充裕的；丰富的' },
  { id: '3', word: 'beneath', phonetic: '/bɪˈniːθ/', meaning: 'prep. 在...之下' },
  { id: '4', word: 'compassion', phonetic: '/kəmˈpæʃn/', meaning: 'n. 同情心；怜悯' },
  { id: '5', word: 'deliberate', phonetic: '/dɪˈlɪbərət/', meaning: 'adj. 故意的；深思熟虑的' },
  { id: '6', word: 'elaborate', phonetic: '/ɪˈlæbərət/', meaning: 'adj. 精心制作的；详尽的' },
];

export function FlashcardReview({ onComplete }: FlashcardReviewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showMeaning, setShowMeaning] = useState(false);
  const [results, setResults] = useState<Record<string, 'known' | 'vague' | 'unknown'>>({});

  const word = reviewWords[currentIndex];
  const isLast = currentIndex >= reviewWords.length - 1;

  const handleResult = (status: 'known' | 'vague' | 'unknown') => {
    setResults((prev) => ({ ...prev, [word.id]: status }));
    setShowMeaning(false);
    if (isLast) {
      onComplete();
    } else {
      setCurrentIndex((i) => i + 1);
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Progress */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-slate-500">
          {currentIndex + 1} / {reviewWords.length}
        </span>
        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 rounded-full transition-all"
            style={{ width: `${((currentIndex + 1) / reviewWords.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Flashcard */}
      <div
        className="glass-card p-8 min-h-[280px] flex flex-col items-center justify-center cursor-pointer hover:shadow-xl transition-shadow"
        onClick={() => setShowMeaning(true)}
      >
        <h2 className="text-4xl font-bold text-slate-800 mb-2">{word.word}</h2>
        <p className="text-slate-400">{word.phonetic}</p>
        
        {showMeaning ? (
          <div className="mt-6 text-center">
            <p className="text-xl text-blue-600 font-medium">{word.meaning}</p>
          </div>
        ) : (
          <p className="mt-6 text-sm text-slate-400">点击卡片翻转查看释义</p>
        )}
      </div>

      {/* Action Buttons */}
      {showMeaning && (
        <div className="flex gap-3">
          <button
            onClick={() => handleResult('unknown')}
            className="flex-1 py-3 bg-red-50 hover:bg-red-100 text-red-600 font-medium rounded-xl transition-colors"
          >
            😣 不认识
          </button>
          <button
            onClick={() => handleResult('vague')}
            className="flex-1 py-3 bg-yellow-50 hover:bg-yellow-100 text-yellow-600 font-medium rounded-xl transition-colors"
          >
            🤔 模糊
          </button>
          <button
            onClick={() => handleResult('known')}
            className="flex-1 py-3 bg-green-50 hover:bg-green-100 text-green-600 font-medium rounded-xl transition-colors"
          >
            😊 认识
          </button>
        </div>
      )}
    </div>
  );
}
