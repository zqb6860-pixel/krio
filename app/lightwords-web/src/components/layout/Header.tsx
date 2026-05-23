'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { api } from '@/lib/api';
import { AudioButton } from '@/components/common/AudioButton';

export function Header() {
  const { user } = useAuth();
  const { wallpaper, setWallpaper } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [showWallpaperPicker, setShowWallpaperPicker] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const wpRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchResults([]);
        setSearchQuery('');
      }
      if (wpRef.current && !wpRef.current.contains(e.target as Node)) {
        setShowWallpaperPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const wallpapers = [
    { id: 'none' as const, label: '默认', preview: 'bg-slate-100 dark:bg-slate-700' },
    { id: 'gradient-ocean' as const, label: '海洋', preview: 'bg-gradient-to-r from-blue-400 to-indigo-500' },
    { id: 'gradient-sunset' as const, label: '日落', preview: 'bg-gradient-to-r from-rose-400 to-orange-400' },
    { id: 'gradient-forest' as const, label: '森林', preview: 'bg-gradient-to-r from-emerald-400 to-teal-500' },
    { id: 'gradient-aurora' as const, label: '极光', preview: 'bg-gradient-to-r from-violet-400 to-cyan-400' },
  ];

  return (
    <header className="h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between px-6 transition-colors duration-300">
      {/* Search */}
      <div ref={searchRef} className="flex-1 max-w-md relative">
        <div className="relative">
          <input
            type="text"
            placeholder="搜索单词... (支持模糊搜索)"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all placeholder:text-slate-400"
          />
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(''); setSearchResults([]); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {searchQuery.length >= 2 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 max-h-72 overflow-y-auto animate-slideUp">
            {searching ? (
              <div className="p-4 text-center text-slate-400 text-sm">
                <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                搜索中...
              </div>
            ) : searchResults.length > 0 ? (
              searchResults.map((word: any) => (
                <div key={word.id} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700 last:border-b-0 cursor-pointer transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{word.word}</span>
                      {word.frequency && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-red-50 dark:bg-red-900/30 text-red-500 rounded-full font-medium">
                          高频
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">{word.phonetic || word.phoneticUs}</span>
                      <AudioButton audioUrl={word.audioUs} word={word.word} size="sm" variant="ghost" />
                    </div>
                  </div>
                  {word.meanings?.[0] && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      <span className="text-blue-500 mr-1">{word.meanings[0].partOfSpeech}</span>
                      {word.meanings[0].translation}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-slate-400 text-sm">
                没有找到 "{searchQuery}" 相关单词
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right section */}
      <div className="flex items-center gap-3">
        {/* Wallpaper picker */}
        <div ref={wpRef} className="relative">
          <button
            onClick={() => setShowWallpaperPicker(!showWallpaperPicker)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-sm"
            title="切换壁纸"
          >
            <span>🎨</span>
          </button>
          {showWallpaperPicker && (
            <div className="absolute top-full right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-3 z-50 animate-slideUp">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 font-medium">主题壁纸</p>
              <div className="flex gap-2">
                {wallpapers.map(wp => (
                  <button
                    key={wp.id}
                    onClick={() => { setWallpaper(wp.id); setShowWallpaperPicker(false); }}
                    className={`w-10 h-10 rounded-lg ${wp.preview} transition-all ${
                      wallpaper === wp.id ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-slate-800 scale-110' : 'hover:scale-105'
                    }`}
                    title={wp.label}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Stats */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
            <span className="text-base">🔥</span>
            <span className="text-sm font-semibold text-orange-600 dark:text-orange-400">{user?.streak || 0}</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <span className="text-base">💰</span>
            <span className="text-sm font-semibold text-yellow-600 dark:text-yellow-400">{user?.coins || 0}</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <span className="text-base">❤️</span>
            <span className="text-sm font-semibold text-red-500 dark:text-red-400">{user?.hearts || 5}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
