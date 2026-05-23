'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useApi } from '@/hooks/useApi';

export default function ChallengePage() {
  const { data: paths, loading, error, refetch } = useApi(() => api.getLearningPaths(), []);
  const [activeLevel, setActiveLevel] = useState<string | null>(null);
  const [exercises, setExercises] = useState<any[]>([]);
  const [exLoading, setExLoading] = useState(false);

  const handleSelectLevel = async (levelId: string) => {
    setExLoading(true);
    try {
      const level = await api.getLevelDetail(levelId);
      setExercises(level.exercises || []);
      setActiveLevel(levelId);
    } catch (err) {
      console.error('Failed to load level:', err);
    }
    setExLoading(false);
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto flex items-center justify-center h-[60vh]">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800">🎮 闯关模式</h2>
            <p className="text-sm text-slate-500 mt-1">完成关卡，解锁新内容，收获成就！</p>
          </div>
        </div>
      </div>

      {activeLevel ? (
        <ExercisePanel
          levelId={activeLevel}
          exercises={exercises}
          onBack={() => { setActiveLevel(null); refetch(); }}
        />
      ) : (
        <LearningMap paths={paths || []} onSelectLevel={handleSelectLevel} loading={exLoading} />
      )}
    </div>
  );
}

function LearningMap({ paths, onSelectLevel, loading }: { paths: any[]; onSelectLevel: (id: string) => void; loading: boolean }) {
  if (paths.length === 0) {
    return (
      <div className="glass-card p-8 text-center">
        <span className="text-4xl">📚</span>
        <p className="text-slate-500 mt-4">暂无学习路径，请联系管理员添加</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {loading && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl">
            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-slate-500 mt-3">加载关卡...</p>
          </div>
        </div>
      )}
      {paths.map((path: any) => (
        <div key={path.id}>
          {path.units?.map((unit: any) => (
            <div key={unit.id} className="glass-card p-6 mb-4">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">{unit.icon}</span>
                <h3 className="text-lg font-semibold text-slate-800">{unit.title}</h3>
                <span className="text-xs text-slate-400">{unit.description}</span>
              </div>
              <div className="grid grid-cols-5 gap-3">
                {unit.levels?.map((level: any) => (
                  <button
                    key={level.id}
                    onClick={() => !level.isLocked && onSelectLevel(level.id)}
                    disabled={level.isLocked}
                    className={`relative p-4 rounded-xl text-center transition-all duration-200 ${
                      level.isLocked
                        ? 'bg-slate-100 cursor-not-allowed opacity-60'
                        : level.stars > 0
                        ? 'bg-gradient-to-b from-green-50 to-emerald-50 border-2 border-green-200 hover:shadow-md hover:-translate-y-0.5'
                        : 'bg-white border-2 border-blue-200 hover:shadow-md hover:-translate-y-0.5 hover:border-blue-400'
                    }`}
                  >
                    {level.isLocked && <span className="absolute top-2 right-2 text-xs">🔒</span>}
                    <p className="text-xs font-medium text-slate-700 mb-2">{level.title}</p>
                    <div className="flex justify-center gap-0.5">
                      {[1, 2, 3].map((star) => (
                        <span key={star} className={`text-sm ${star <= level.stars ? 'text-yellow-400' : 'text-slate-200'}`}>⭐</span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function ExercisePanel({ levelId, exercises, onBack }: { levelId: string; exercises: any[]; onBack: () => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [hearts, setHearts] = useState(5);
  const [isComplete, setIsComplete] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // If no exercises from backend, use fallback
  const exerciseList = exercises.length > 0 ? exercises : fallbackExercises;
  const exercise = exerciseList[currentIndex];

  const handleSelect = (index: number) => {
    if (isAnswered) return;
    setSelectedOption(index);
    setIsAnswered(true);

    const options = typeof exercise.options === 'string' ? JSON.parse(exercise.options) : exercise.options;
    const isCorrect = options[index] === exercise.correctAnswer;

    if (isCorrect) {
      setCorrectCount((c) => c + 1);
      const newCombo = combo + 1;
      setCombo(newCombo);
      if (newCombo > maxCombo) setMaxCombo(newCombo);
    } else {
      setCombo(0);
      setHearts((h) => Math.max(0, h - 1));
    }
  };

  const handleNext = async () => {
    if (currentIndex < exerciseList.length - 1) {
      setCurrentIndex((i) => i + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      // Submit completion
      setSubmitting(true);
      const stars = correctCount === exerciseList.length ? 3 : correctCount >= Math.ceil(exerciseList.length * 0.8) ? 2 : correctCount >= Math.ceil(exerciseList.length * 0.6) ? 1 : 0;
      try {
        await api.completeLevel(levelId, { stars, score: correctCount * 20, maxCombo });
      } catch (err) {
        console.error('Failed to submit:', err);
      }
      setSubmitting(false);
      setIsComplete(true);
    }
  };

  if (isComplete) {
    const stars = correctCount === exerciseList.length ? 3 : correctCount >= Math.ceil(exerciseList.length * 0.8) ? 2 : correctCount >= Math.ceil(exerciseList.length * 0.6) ? 1 : 0;
    return (
      <div className="glass-card p-8 text-center max-w-lg mx-auto">
        <div className="text-5xl mb-4">{stars >= 2 ? '🎉' : stars >= 1 ? '👏' : '😅'}</div>
        <h3 className="text-2xl font-bold text-slate-800">关卡完成！</h3>
        <div className="flex justify-center gap-2 my-4">
          {[1, 2, 3].map((s) => (
            <span key={s} className={`text-3xl ${s <= stars ? 'text-yellow-400' : 'text-slate-200'}`}>⭐</span>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-4 my-6">
          <div className="p-3 bg-blue-50 rounded-xl">
            <p className="text-lg font-bold text-blue-600">{correctCount}/{exerciseList.length}</p>
            <p className="text-xs text-slate-500">正确数</p>
          </div>
          <div className="p-3 bg-purple-50 rounded-xl">
            <p className="text-lg font-bold text-purple-600">{maxCombo}</p>
            <p className="text-xs text-slate-500">最大连击</p>
          </div>
          <div className="p-3 bg-yellow-50 rounded-xl">
            <p className="text-lg font-bold text-yellow-600">+{stars * 10}</p>
            <p className="text-xs text-slate-500">金币</p>
          </div>
        </div>
        <button onClick={onBack} className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-medium">
          返回地图
        </button>
      </div>
    );
  }

  const options = typeof exercise.options === 'string' ? JSON.parse(exercise.options) : (exercise.options || []);
  const correctAnswer = exercise.correctAnswer;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-3">
          <button onClick={onBack} className="text-sm text-slate-500 hover:text-slate-700">← 返回</button>
          <div className="flex items-center gap-3">
            {combo > 0 && <span className="px-2 py-1 bg-orange-50 text-orange-600 text-xs font-bold rounded-full">🔥 {combo}连击</span>}
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className={`text-sm ${i < hearts ? '' : 'opacity-30'}`}>❤️</span>
              ))}
            </div>
          </div>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-300" style={{ width: `${((currentIndex + 1) / exerciseList.length) * 100}%` }} />
        </div>
        <p className="text-xs text-slate-400 mt-1 text-right">{currentIndex + 1} / {exerciseList.length}</p>
      </div>

      {/* Exercise Content */}
      <div className="glass-card p-8">
        <p className="text-lg font-semibold text-slate-800 text-center mb-6">{exercise.question}</p>
        <div className="grid grid-cols-2 gap-3">
          {options.map((option: string, index: number) => {
            let btnClass = 'p-4 border-2 rounded-xl text-center transition-all duration-200 font-medium ';
            if (!isAnswered) {
              btnClass += 'border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-slate-700 cursor-pointer';
            } else if (option === correctAnswer) {
              btnClass += 'border-green-400 bg-green-50 text-green-700';
            } else if (index === selectedOption) {
              btnClass += 'border-red-400 bg-red-50 text-red-700';
            } else {
              btnClass += 'border-slate-100 text-slate-400';
            }
            return (
              <button key={index} onClick={() => handleSelect(index)} disabled={isAnswered} className={btnClass}>
                {option}
                {isAnswered && option === correctAnswer && ' ✓'}
                {isAnswered && index === selectedOption && option !== correctAnswer && ' ✗'}
              </button>
            );
          })}
        </div>
      </div>

      {/* Next Button */}
      {isAnswered && (
        <div className="text-center">
          <button onClick={handleNext} disabled={submitting}
            className="px-8 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-medium shadow-lg shadow-blue-500/25 disabled:opacity-50">
            {submitting ? '提交中...' : currentIndex < exerciseList.length - 1 ? '下一题 →' : '查看结果'}
          </button>
        </div>
      )}
    </div>
  );
}

const fallbackExercises = [
  { question: '"abandon" 的中文意思是？', options: '["放弃","丰富","能力","国外"]', correctAnswer: '放弃' },
  { question: '"ability" 的中文意思是？', options: '["缺席","能力","吸收","加速"]', correctAnswer: '能力' },
  { question: '"abroad" 的中文意思是？', options: '["抽象的","在国外","吸收","学术的"]', correctAnswer: '在国外' },
  { question: '"absorb" 的中文意思是？', options: '["适应","充裕的","吸收","准确的"]', correctAnswer: '吸收' },
  { question: '"accomplish" 的中文意思是？', options: '["陪伴","积累","完成","适应"]', correctAnswer: '完成' },
];
