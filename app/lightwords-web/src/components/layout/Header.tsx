'use client';

import { useState } from 'react';

export function Header() {
  const [streak] = useState(7);
  const [coins] = useState(1250);
  const [hearts] = useState(5);

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <input
            type="text"
            placeholder="搜索单词..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            🔍
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4">
        {/* Streak */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 rounded-lg">
          <span className="text-lg">🔥</span>
          <span className="text-sm font-semibold text-orange-600">{streak}</span>
        </div>
        
        {/* Coins */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-50 rounded-lg">
          <span className="text-lg">💰</span>
          <span className="text-sm font-semibold text-yellow-600">{coins}</span>
        </div>

        {/* Hearts */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 rounded-lg">
          <span className="text-lg">❤️</span>
          <span className="text-sm font-semibold text-red-500">{hearts}</span>
        </div>

        {/* Notifications */}
        <button className="relative p-2 hover:bg-slate-50 rounded-lg transition-colors">
          <span className="text-xl">🔔</span>
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>
      </div>
    </header>
  );
}
