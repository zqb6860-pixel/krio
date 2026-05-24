'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useApi } from '@/hooks/useApi';
import { AudioButton } from '@/components/common/AudioButton';

/**
 * 单词族谱/派生树页面 (参考不背单词)
 * - 词根词缀树状可视化
 * - 同根词联想记忆
 * - 热门词根浏览
 */

interface RootInfo {
  root: string;
  meaning: string;
  origin: string;
  type: string;
  wordCount?: number;
}

interface FamilyWord {
  id: string;
  word: string;
  phonetic?: string;
  translation: string;
  partOfSpeech: string;
  rootType?: string;
}

export default function WordFamilyPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [familyData, setFamilyData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'explore' | 'detail'>('explore');

  const { data: popularRoots, loading: rootsLoading } = useApi(() => api.getPopularRoots(), []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const data = await api.getWordFamily(searchQuery.trim().toLowerCase());
      setFamilyData(data);
      setSelectedWord(searchQuery.trim().toLowerCase());
      setView('detail');
    } catch (err) {
      console.error('Search failed:', err);
    }
    setLoading(false);
  };

  const handleRootClick = async (root: string) => {
    setLoading(true);
    try {
      const data = await api.getWordsByRoot(root);
      setFamilyData({
        word: root,
        roots: [{ root: data.root, meaning: data.meaning, origin: data.origin, type: data.type }],
        familyTree: [{
          root: data.root,
          meaning: data.meaning,
          origin: data.origin,
          type: data.type,
          derivedWords: data.words,
        }],
        relatedWords: data.words,
      });
      setSelectedWord(root);
      setView('detail');
    } catch (err) {
      console.error('Root lookup failed:', err);
    }
    setLoading(false);
  };

  const handleWordClick = async (word: string) => {
    setSearchQuery(word);
    setLoading(true);
    try {
      const data = await api.getWordFamily(word);
      setFamilyData(data);
      setSelectedWord(word);
    } catch (err) {
      console.error('Word family lookup failed:', err);
    }
    setLoading(false);
  };

  // ===== Detail View =====
  if (view === 'detail' && familyData) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setView('explore')}
                className="text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                ← 返回
              </button>
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">🌳 词族树</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {selectedWord} 的词根关系
                </p>
              </div>
            </div>
            {/* Search in detail */}
            <div className="flex items-center gap-2">
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="搜索单词..."
                className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm w-40"
              />
              <button onClick={handleSearch}
                className="px-3 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors">
                查询
              </button>
            </div>
          </div>
        </div>

        {/* Word Info Card */}
        {familyData.phonetic && (
          <div className="glass-card p-6 bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-3xl font-bold">{familyData.word}</h3>
                <p className="text-emerald-100 mt-1">{familyData.phonetic}</p>
                {familyData.meanings?.map((m: any, i: number) => (
                  <p key={i} className="text-sm text-emerald-50 mt-1">
                    <span className="text-emerald-200 mr-1">{m.partOfSpeech}</span>
                    {m.translation}
                  </p>
                ))}
              </div>
              <AudioButton audioUrl={null} word={familyData.word} size="lg" variant="white" />
            </div>
          </div>
        )}

        {/* Root Tree Visualization */}
        {familyData.familyTree && familyData.familyTree.length > 0 && (
          <div className="space-y-4">
            {familyData.familyTree.map((tree: any, treeIdx: number) => (
              <div key={treeIdx} className="glass-card p-6">
                {/* Root Node */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    {tree.type === 'prefix' ? '前' : tree.type === 'suffix' ? '后' : '根'}
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                      <span className="text-emerald-600 dark:text-emerald-400">{tree.root}</span>
                      <span className="text-slate-400 mx-2">=</span>
                      <span>{tree.meaning}</span>
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      来源: {tree.origin} · {tree.type === 'prefix' ? '前缀' : tree.type === 'suffix' ? '后缀' : '词根'}
                    </p>
                  </div>
                </div>

                {/* Tree branches */}
                <div className="ml-6 border-l-2 border-emerald-200 dark:border-emerald-800 pl-6 space-y-3">
                  {(tree.derivedWords || []).map((dw: any, i: number) => (
                    <div key={i}
                      onClick={() => handleWordClick(dw.word)}
                      className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-900/10 cursor-pointer transition-colors group border border-transparent hover:border-emerald-200 dark:hover:border-emerald-800/50"
                    >
                      <div className="flex items-center gap-3">
                        {/* Connection dot */}
                        <div className="w-3 h-3 rounded-full bg-emerald-400 dark:bg-emerald-500 -ml-[1.85rem] border-2 border-white dark:border-slate-900 shadow-sm" />
                        <div>
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">
                            {dw.word}
                          </p>
                          {dw.phonetic && <p className="text-[11px] text-slate-400">{dw.phonetic}</p>}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">
                          {dw.partOfSpeech}
                        </span>
                        <p className="text-sm text-slate-600 dark:text-slate-300 mt-0.5">{dw.translation}</p>
                      </div>
                    </div>
                  ))}

                  {/* Related words from root data */}
                  {tree.relatedWords && tree.relatedWords.length > 0 && (
                    <div className="pt-2 mt-2 border-t border-dashed border-slate-200 dark:border-slate-700">
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-2">更多相关词:</p>
                      <div className="flex flex-wrap gap-2">
                        {(typeof tree.relatedWords === 'string' ? JSON.parse(tree.relatedWords) : tree.relatedWords).map((rw: string, i: number) => (
                          <button key={i} onClick={() => handleWordClick(rw)}
                            className="text-xs px-2.5 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-full hover:border-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                            {rw}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No roots found */}
        {(!familyData.familyTree || familyData.familyTree.length === 0) && (
          <div className="glass-card p-8 text-center">
            <span className="text-4xl">🔍</span>
            <p className="text-slate-500 dark:text-slate-400 mt-4">该单词暂无词根词缀数据</p>
            <p className="text-xs text-slate-400 mt-1">尝试搜索其他单词，如: communicate, international, incredible</p>
          </div>
        )}

        {/* Related Words Grid */}
        {familyData.relatedWords && familyData.relatedWords.length > 0 && (
          <div className="glass-card p-6">
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-4">
              🔗 同根词汇 ({familyData.relatedWords.length})
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {familyData.relatedWords.map((rw: FamilyWord) => (
                <button key={rw.id} onClick={() => handleWordClick(rw.word)}
                  className="p-3 text-left bg-slate-50 dark:bg-slate-800/50 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-colors border border-transparent hover:border-emerald-200 dark:hover:border-emerald-800/50">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{rw.word}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    <span className="text-emerald-500">{rw.partOfSpeech}</span> {rw.translation}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ===== Explore View (default) =====
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">🌳</span>
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">词根词缀 · 派生树</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              用英文的"偏旁部首"串记单词，一个词根记住一族词
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="flex gap-2">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="输入单词查看词族关系... (如 international)"
            className="flex-1 px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
          <button onClick={handleSearch} disabled={loading}
            className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50">
            {loading ? '...' : '🔍 查询'}
          </button>
        </div>
      </div>

      {/* Popular Roots Grid */}
      <div className="glass-card p-6">
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-4">
          🔥 高频词根词缀
        </h3>
        {rootsLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {(popularRoots || []).slice(0, 20).map((root: RootInfo, i: number) => (
              <button key={i} onClick={() => handleRootClick(root.root)}
                className="p-4 text-left bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-600 hover:shadow-md transition-all group">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                    {root.root}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full">
                    {root.wordCount} 词
                  </span>
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-200 font-medium">{root.meaning}</p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                  {root.type === 'prefix' ? '前缀' : root.type === 'suffix' ? '后缀' : '词根'} · {root.origin}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Knowledge Tips */}
      <div className="glass-card p-6 border-l-4 border-emerald-400">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">💡 词根记忆法</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          英语中约 60% 的词汇由词根词缀组合而成。掌握常见的前缀（如 un-, re-, pre-）、
          后缀（如 -tion, -ness, -able）和词根（如 duct-导引, port-搬运, spect-看），
          就能快速推断生词含义，实现「见词知义」。这是不背单词 App 的核心记忆策略之一。
        </p>
      </div>
    </div>
  );
}
