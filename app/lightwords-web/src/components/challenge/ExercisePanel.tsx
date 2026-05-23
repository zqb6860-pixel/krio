'use client';

import { useState } from 'react';

interface ExercisePanelProps {
  levelId: string;
  onBack: () => void;
}

interface Exercise {
  id: string;
  type: 'choose_translation' | 'listen_choose' | 'spelling' | 'fill_blank';
  question: string;
  options: string[];
  correctIndex: number;
  word: string;
}

const mockExercises: Exercise[] = [
  {
    id: 'e1',
    type: 'choose_translation',
    question: '"transport" 的中文意思是？',
    options: ['运输', '转换', '传播', '透明'],
    correctIndex: 0,
    word: 'transport',
  },
  {
    id: 'e2',
    type: 'choose_translation',
    question: '"aboard" 的中文意思是？',
    options: ['国外的', '在船上', '关于', '到处'],
    correctIndex: 1,
    word: 'aboard',
  },
  {
    id: 'e3',
    type: 'choose_translation',
    question: '"accomplish" 的中文意思是？',
    options: ['陪伴', '积累', '完成', '适应'],
    correctIndex: 2,
    word: 'accomplish',
  },
  {
    id: 'e4',
    type: 'fill_blank',
    question: 'The goods were _____ by rail. (运输)',
    options: ['transported', 'transformed', 'translated', 'transferred'],
    correctIndex: 0,
    word: 'transport',
  },
  {
    id: 'e5',
    type: 'choose_translation',
    question: '"portable" 的中文意思是？',
    options: ['重要的', '可能的', '便携的', '珍贵的'],
    correctIndex: 2,
    word: 'portable',
  },
];

export function ExercisePanel({ levelId, onBack }: ExercisePanelProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [combo, setCombo] = useState(0);
  const [hearts, setHearts] = useState(5);
  const [isComplete, setIsComplete] = useState(false);

  const exercise = mockExercises[currentIndex];

  const handleSelect = (index: number) => {
    if (isAnswered) return;
    setSelectedOption(index);
    setIsAnswered(true);

    if (index === exercise.correctIndex) {
      setCorrectCount((c) => c + 1);
      setCombo((c) => c + 1);
    } else {
      setCombo(0);
      setHearts((h) => Math.max(0, h - 1));
    }
  };

  const handleNext = () => {
    if (currentIndex < mockExercises.length - 1) {
      setCurrentIndex((i) => i + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setIsComplete(true);
    }
  };

  if (isComplete) {
    const stars = correctCount === mockExercises.length ? 3 : correctCount >= 4 ? 2 : correctCount >= 3 ? 1 : 0;
    return (
      <div className="glass-card p-8 text-center max-w-lg mx-auto">
        <div className="text-5xl mb-4">
          {stars >= 2 ? '🎉' : stars >= 1 ? '👏' : '😅'}
        </div>
        <h3 className="text-2xl font-bold text-slate-800">关卡完成！</h3>
        <div className="flex justify-center gap-2 my-4">
          {[1, 2, 3].map((s) => (
            <span key={s} className={`text-3xl ${s <= stars ? 'text-yellow-400' : 'text-slate-200'}`}>
              ⭐
            </span>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-4 my-6">
          <div className="p-3 bg-blue-50 rounded-xl">
            <p className="text-lg font-bold text-blue-600">{correctCount}/{mockExercises.length}</p>
            <p className="text-xs text-slate-500">正确数</p>
          </div>
          <div className="p-3 bg-purple-50 rounded-xl">
            <p className="text-lg font-bold text-purple-600">{combo}</p>
            <p className="text-xs text-slate-500">最大连击</p>
          </div>
          <div className="p-3 bg-yellow-50 rounded-xl">
            <p className="text-lg font-bold text-yellow-600">+{stars * 10}</p>
            <p className="text-xs text-slate-500">金币</p>
          </div>
        </div>
        <button
          onClick={onBack}
          className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-medium"
        >
          返回地图
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Exercise Header */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-3">
          <button onClick={onBack} className="text-sm text-slate-500 hover:text-slate-700">
            ← 返回
          </button>
          <div className="flex items-center gap-3">
            {combo > 0 && (
              <span className="px-2 py-1 bg-orange-50 text-orange-600 text-xs font-bold rounded-full">
                🔥 {combo}连击
              </span>
            )}
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className={`text-sm ${i < hearts ? 'text-red-500' : 'text-slate-200'}`}>
                  ❤️
                </span>
              ))}
            </div>
          </div>
        </div>
        {/* Progress */}
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / mockExercises.length) * 100}%` }}
          />
        </div>
        <p className="text-xs text-slate-400 mt-1 text-right">
          {currentIndex + 1} / {mockExercises.length}
        </p>
      </div>

      {/* Exercise Content */}
      <div className="glass-card p-8">
        <p className="text-lg font-semibold text-slate-800 text-center mb-6">
          {exercise.question}
        </p>
        <div className="grid grid-cols-2 gap-3">
          {exercise.options.map((option, index) => {
            let btnClass = 'p-4 border-2 rounded-xl text-center transition-all duration-200 font-medium ';
            if (!isAnswered) {
              btnClass += 'border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-slate-700';
            } else if (index === exercise.correctIndex) {
              btnClass += 'border-green-400 bg-green-50 text-green-700';
            } else if (index === selectedOption) {
              btnClass += 'border-red-400 bg-red-50 text-red-700 animate-shake';
            } else {
              btnClass += 'border-slate-100 text-slate-400';
            }
            return (
              <button
                key={index}
                onClick={() => handleSelect(index)}
                disabled={isAnswered}
                className={btnClass}
              >
                {option}
                {isAnswered && index === exercise.correctIndex && ' ✓'}
                {isAnswered && index === selectedOption && index !== exercise.correctIndex && ' ✗'}
              </button>
            );
          })}
        </div>
      </div>

      {/* Next Button */}
      {isAnswered && (
        <div className="text-center">
          <button
            onClick={handleNext}
            className="px-8 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-medium shadow-lg shadow-blue-500/25"
          >
            {currentIndex < mockExercises.length - 1 ? '下一题 →' : '查看结果'}
          </button>
        </div>
      )}
    </div>
  );
}
