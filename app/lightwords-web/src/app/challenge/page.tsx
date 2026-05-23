'use client';

import { useState } from 'react';
import { LearningMap } from '@/components/challenge/LearningMap';
import { ExercisePanel } from '@/components/challenge/ExercisePanel';

export default function ChallengePage() {
  const [activeLevel, setActiveLevel] = useState<string | null>(null);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800">🎮 闯关模式</h2>
            <p className="text-sm text-slate-500 mt-1">完成关卡，解锁新内容，收获成就！</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-500">⭐ 24</p>
              <p className="text-xs text-slate-500">已获星星</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-500">🏆 8</p>
              <p className="text-xs text-slate-500">已通关卡</p>
            </div>
          </div>
        </div>
      </div>

      {activeLevel ? (
        <ExercisePanel levelId={activeLevel} onBack={() => setActiveLevel(null)} />
      ) : (
        <LearningMap onSelectLevel={setActiveLevel} />
      )}
    </div>
  );
}
