'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { AudioButton } from '@/components/common/AudioButton';

export function Header() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const results = await api.searchWords(q);
      setSearchResults(results);
    } catch {
      setSearchResults([]);
    }
    setSearching(false);
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
      {/* Search */}
      <div className="flex-1 max-w-md relative">
        <div className="relative">
          <input
            type="text"
            placeholder="搜索单词..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
        </div>

        {/* Search Results Dropdown */}
        {searchQuery.length >= 2 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 max-h-64 overflow-y-auto">
            {searching ? (
              <div className="p-3 text-center text-slate-400 text-sm">搜索中...</div>
            ) : searchResults.length > 0 ? (
              searchResults.map((word: any) => (
                <div key={word.id} className="p-3 hover:bg-slate-50 border-b border-slate-100 last:border-b-0 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-800 text-sm">{word.word}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">{word.phonetic || word.phoneticUs}</span>
                      <AudioButton audioUrl={word.audioUs} word={word.word} size="sm" variant="ghost" />
                    </div>
                  </div>
                  {word.meanings?.[0] && (
                    <p className="text-xs text-slate-500 mt-0.5">
                      {word.meanings[0].partOfSpeech} {word.meanings[0].translation}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <div className="p-3 text-center text-slate-400 text-sm">没有找到相关单词</div>
            )}
          </div>
        )}
      </div>

      {/* User Stats */}
      <div className="flex items-center gap-4">
        {/* Streak */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 rounded-lg">
          <span className="text-lg">🔥</span>
          <span className="text-sm font-semibold text-orange-600">{user?.streak || 0}</span>
        </div>

        {/* Coins */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-50 rounded-lg">
          <span className="text-lg">💰</span>
          <span className="text-sm font-semibold text-yellow-600">{user?.coins || 0}</span>
        </div>

        {/* Hearts */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 rounded-lg">
          <span className="text-lg">❤️</span>
          <span className="text-sm font-semibold text-red-500">{user?.hearts || 5}</span>
        </div>

        {/* Level */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 rounded-lg">
          <span className="text-sm font-semibold text-blue-600">Lv.{user?.level || 1}</span>
        </div>
      </div>
    </header>
  );
}
