'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function BooksPage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const { data: books, loading } = useApi(() => api.getWordBooks(), []);
  const { data: currentBookData } = useApi(() => api.getCurrentBook(), []);
  const [selecting, setSelecting] = useState<string | null>(null);
  const [wordOrder, setWordOrder] = useState<'sequential' | 'random'>(
    (user?.settings?.wordOrder as any) || 'sequential'
  );

  const currentBookId = currentBookData?.currentBook?.id;

  const handleSelect = async (bookId: string) => {
    setSelecting(bookId);
    try {
      await api.setCurrentBook(bookId);
      await api.updateSettings({ wordOrder });
      await refreshUser();
      router.push('/learn');
    } catch (err) {
      console.error('Failed to set book:', err);
    }
    setSelecting(null);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-center h-[60vh]">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const difficultyLabel = (d: number) => {
    if (d <= 1) return { text: '入门', color: 'text-green-600 bg-green-50' };
    if (d <= 2) return { text: '基础', color: 'text-blue-600 bg-blue-50' };
    if (d <= 3) return { text: '中级', color: 'text-yellow-600 bg-yellow-50' };
    if (d <= 4) return { text: '进阶', color: 'text-orange-600 bg-orange-50' };
    return { text: '高级', color: 'text-red-600 bg-red-50' };
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="glass-card p-6">
        <h2 className="text-xl font-bold text-slate-800">📖 选择词库</h2>
        <p className="text-sm text-slate-500 mt-1">
          选择一本词库开始学习，系统将按顺序为你安排每日单词
        </p>
        {currentBookId && (
          <div className="mt-3 p-3 bg-blue-50 rounded-xl">
            <p className="text-sm text-blue-700">
              📌 当前正在学习：<span className="font-semibold">{currentBookData?.currentBook?.name}</span>
            </p>
          </div>
        )}
      </div>

      {/* Word Order Setting */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">📋 出词顺序</h3>
        <div className="flex gap-3">
          <button
            onClick={() => setWordOrder('sequential')}
            className={`flex-1 p-3 rounded-xl border-2 text-center transition-all ${
              wordOrder === 'sequential'
                ? 'border-blue-400 bg-blue-50 text-blue-700'
                : 'border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            <span className="text-lg block">📖</span>
            <span className="text-sm font-medium block mt-1">按顺序</span>
            <span className="text-xs text-slate-400">从前到后依次学习</span>
          </button>
          <button
            onClick={() => setWordOrder('random')}
            className={`flex-1 p-3 rounded-xl border-2 text-center transition-all ${
              wordOrder === 'random'
                ? 'border-blue-400 bg-blue-50 text-blue-700'
                : 'border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            <span className="text-lg block">🎲</span>
            <span className="text-sm font-medium block mt-1">随机打乱</span>
            <span className="text-xs text-slate-400">每次随机出词</span>
          </button>
        </div>
      </div>

      {/* Book Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {books?.map((book: any) => {
          const isActive = book.id === currentBookId;
          const diff = difficultyLabel(book.difficulty);
          return (
            <div
              key={book.id}
              className={`glass-card p-5 transition-all duration-200 hover:shadow-lg cursor-pointer ${
                isActive ? 'ring-2 ring-blue-500 bg-blue-50/30' : 'hover:-translate-y-0.5'
              }`}
              onClick={() => !isActive && handleSelect(book.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-800">{book.name}</h3>
                    {isActive && (
                      <span className="text-xs px-2 py-0.5 bg-blue-500 text-white rounded-full">学习中</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{book.description}</p>
                  <div className="flex items-center gap-3 mt-3">
                    <span className="text-sm font-medium text-slate-700">
                      📚 {book.wordCount || 0} 词
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${diff.color}`}>
                      {diff.text}
                    </span>
                    <span className="text-xs text-slate-400">
                      {'⭐'.repeat(Math.min(book.difficulty, 5))}
                    </span>
                  </div>
                </div>
                <div className="ml-4">
                  {isActive ? (
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-lg">✓</span>
                    </div>
                  ) : selecting === book.id ? (
                    <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <div className="w-10 h-10 bg-slate-100 hover:bg-blue-100 rounded-full flex items-center justify-center transition-colors">
                      <span className="text-slate-400 text-lg">→</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {(!books || books.length === 0) && (
        <div className="glass-card p-8 text-center">
          <span className="text-4xl">📭</span>
          <p className="text-slate-500 mt-4">暂无词库，请先运行导入脚本</p>
          <code className="text-xs text-slate-400 block mt-2">npm run import:all</code>
        </div>
      )}
    </div>
  );
}
