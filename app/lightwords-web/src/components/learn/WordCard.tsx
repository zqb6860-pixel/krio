'use client';

import { useState } from 'react';

interface WordData {
  id: string;
  word: string;
  phonetic: string;
  partOfSpeech: string;
  meaning: string;
  rootAnalysis: string;
  memoryTip: string;
  relatedWords: string[];
  example: { sentence: string; translation: string; source: string };
  collocations: { phrase: string; meaning: string }[];
}

interface WordCardProps {
  word: WordData;
  onNext: (status: 'known' | 'vague' | 'unknown') => void;
}

export function WordCard({ word, onNext }: WordCardProps) {
  const [showAnswer, setShowAnswer] = useState(false);
  const [activeTab, setActiveTab] = useState<'root' | 'example' | 'collocation'>('root');

  const handleAction = (status: 'known' | 'vague' | 'unknown') => {
    setShowAnswer(false);
    setActiveTab('root');
    onNext(status);
  };

  return (
    <div className="glass-card overflow-hidden">
      {/* Word Header */}
      <div className="p-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">{word.word}</h2>
            <p className="text-blue-100 mt-1">{word.phonetic}</p>
          </div>
          <button className="p-3 bg-white/20 rounded-xl hover:bg-white/30 transition-colors">
            🔊
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        {!showAnswer ? (
          <div className="text-center py-8">
            <p className="text-slate-400 text-sm mb-4">你认识这个单词吗？</p>
            <button
              onClick={() => setShowAnswer(true)}
              className="px-6 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 font-medium transition-colors"
            >
              显示释义
            </button>
          </div>
        ) : (
          <>
            {/* Meaning */}
            <div className="p-4 bg-blue-50 rounded-xl">
              <span className="text-xs text-blue-600 font-medium">{word.partOfSpeech}</span>
              <p className="text-lg font-semibold text-slate-800 mt-1">{word.meaning}</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-slate-100 pb-2">
              {[
                { key: 'root', label: '词根词缀', icon: '🌱' },
                { key: 'example', label: '例句', icon: '📝' },
                { key: 'collocation', label: '搭配', icon: '🔗' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as typeof activeTab)}
                  className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                    activeTab === tab.key
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="min-h-[120px]">
              {activeTab === 'root' && (
                <div className="space-y-3">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-sm font-medium text-green-800">🌱 词根分析</p>
                    <p className="text-sm text-green-700 mt-1">{word.rootAnalysis}</p>
                  </div>
                  <div className="p-3 bg-amber-50 rounded-lg">
                    <p className="text-sm font-medium text-amber-800">💡 记忆技巧</p>
                    <p className="text-sm text-amber-700 mt-1">{word.memoryTip}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-2">同根词：</p>
                    <div className="flex flex-wrap gap-2">
                      {word.relatedWords.map((w) => (
                        <span key={w} className="px-2 py-1 bg-slate-100 rounded text-xs text-slate-600">
                          {w}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'example' && (
                <div className="space-y-3">
                  <div className="p-4 bg-slate-50 rounded-lg border-l-4 border-blue-400">
                    <p className="text-sm text-slate-800 leading-relaxed">{word.example.sentence}</p>
                    <p className="text-sm text-slate-500 mt-2">{word.example.translation}</p>
                    <p className="text-xs text-slate-400 mt-2">—— {word.example.source}</p>
                  </div>
                </div>
              )}

              {activeTab === 'collocation' && (
                <div className="space-y-2">
                  {word.collocations.map((col) => (
                    <div key={col.phrase} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                      <span className="text-sm font-medium text-blue-600">{col.phrase}</span>
                      <span className="text-xs text-slate-400">—</span>
                      <span className="text-sm text-slate-600">{col.meaning}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Action Buttons */}
      {showAnswer && (
        <div className="p-4 border-t border-slate-100 flex gap-3">
          <button
            onClick={() => handleAction('unknown')}
            className="flex-1 py-3 bg-red-50 hover:bg-red-100 text-red-600 font-medium rounded-xl transition-colors"
          >
            不认识
          </button>
          <button
            onClick={() => handleAction('vague')}
            className="flex-1 py-3 bg-yellow-50 hover:bg-yellow-100 text-yellow-600 font-medium rounded-xl transition-colors"
          >
            模糊
          </button>
          <button
            onClick={() => handleAction('known')}
            className="flex-1 py-3 bg-green-50 hover:bg-green-100 text-green-600 font-medium rounded-xl transition-colors"
          >
            认识
          </button>
        </div>
      )}
    </div>
  );
}
