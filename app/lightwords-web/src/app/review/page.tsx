'use client';

import { useState, useRef, useEffect } from 'react';
import { api } from '@/lib/api';
import { useApi } from '@/hooks/useApi';
import { AudioButton } from '@/components/common/AudioButton';

type ReviewMode = 'overview' | 'quick' | 'deep' | 'exam';

export default function ReviewPage() {
  const { data: reviewData, loading, error, refetch } = useApi(() => api.getReviewWords(50), []);
  const { data: distribution } = useApi(() => api.getDistribution(), []);
  const [mode, setMode] = useState<ReviewMode>('overview');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showMeaning, setShowMeaning] = useState(false);
  const [reviewed, setReviewed] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [activeDetailTab, setActiveDetailTab] = useState<'example' | 'root' | 'collocation'>('example');
  const startTimeRef = useRef<number>(Date.now());

  const allWords = reviewData?.words || [];
  const totalPending = reviewData?.totalPending || 0;

  // 根据复习模式筛选单词
  const getWordsForMode = () => {
    switch (mode) {
      case 'quick':
        // 快速复习：所有待复习，限制20个
        return allWords.slice(0, 20);
      case 'deep':
        // 深度复习：薄弱词汇（masteryLevel低的）
        return [...allWords]
          .sort((a, b) => (a.record?.masteryLevel || 0) - (b.record?.masteryLevel || 0))
          .slice(0, 15);
      case 'exam':
        // 考前突击：高频+薄弱混合，打乱顺序
        const mixed = [...allWords].slice(0, 30);
        return shuffleArray(mixed);
      default:
        return allWords;
    }
  };

  const words = mode === 'overview' ? allWords : getWordsForMode();

  // 键盘快捷键
  useEffect(() => {
    if (mode === 'overview') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      switch (e.key) {
        case ' ':
        case 'Enter':
          e.preventDefault();
          if (!showMeaning) handleReveal();
          break;
        case '1':
          if (showMeaning) handleResult('unknown');
          break;
        case '2':
          if (showMeaning) handleResult('vague');
          break;
        case '3':
          if (showMeaning) handleResult('known');
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, showMeaning, currentIndex]);

  const handleStartReview = (reviewMode: ReviewMode) => {
    setMode(reviewMode);
    setCurrentIndex(0);
    setShowMeaning(false);
    setReviewed(0);
    setActiveDetailTab('example');
  };

  const handleReveal = () => {
    startTimeRef.current = Date.now();
    setShowMeaning(true);
  };

  const handleResult = async (status: 'known' | 'vague' | 'unknown') => {
    if (submitting) return;
    const word = words[currentIndex];
    if (!word) return;

    setSubmitting(true);
    const responseTimeMs = Date.now() - startTimeRef.current;
    const correct = status === 'known';

    try {
      await api.recordAnswer(word.id, correct, responseTimeMs);
      if (correct || status === 'vague') setReviewed((r) => r + 1);
    } catch (err) {
      console.error('Record error:', err);
    }

    setSubmitting(false);
    setShowMeaning(false);
    setActiveDetailTab('example');

    if (currentIndex < words.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      setMode('overview');
      refetch();
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 text-sm">加载复习数据...</p>
        </div>
      </div>
    );
  }

  // ===== 复习模式（快速/深度/考前突击） =====
  if (mode !== 'overview') {
    if (words.length === 0) {
      return (
        <div className="max-w-lg mx-auto flex items-center justify-center h-[60vh]">
          <div className="glass-card p-8 text-center">
            <span className="text-5xl">✅</span>
            <h3 className="text-xl font-bold text-slate-800 mt-4">没有待复习单词</h3>
            <p className="text-slate-500 mt-2">所有单词都复习完了，太棒了！</p>
            <button onClick={() => setMode('overview')} className="mt-4 px-5 py-2 bg-blue-500 text-white rounded-xl text-sm">返回</button>
          </div>
        </div>
      );
    }

    const word = words[currentIndex];
    const meanings = word?.meanings || [];
    const examples = word?.examples || [];
    const roots = word?.roots || [];
    const collocations = word?.collocations || [];
    const modeConfig = getReviewModeConfig(mode);

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Mode Header */}
        <div className={`glass-card p-4 border-t-4 ${modeConfig.borderColor}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">{modeConfig.icon}</span>
              <div>
                <h3 className="text-sm font-bold text-slate-800">{modeConfig.title}</h3>
                <p className="text-xs text-slate-500">{modeConfig.desc}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 hidden sm:inline">空格=翻转 1/2/3=选择</span>
              <button onClick={() => setMode('overview')} className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1 rounded hover:bg-slate-100">退出</button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">{currentIndex + 1} / {words.length}</span>
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className={`h-full ${modeConfig.progressColor} rounded-full transition-all duration-300`} style={{ width: `${((currentIndex + 1) / words.length) * 100}%` }} />
            </div>
            <span className="text-xs text-green-600">✓ {reviewed}</span>
          </div>
        </div>

        {/* Flashcard */}
        <div
          className="glass-card overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-200"
          onClick={!showMeaning ? handleReveal : undefined}
        >
          {/* Word Header */}
          <div className={`p-6 text-center ${mode === 'exam' ? 'bg-gradient-to-r from-red-500 to-orange-500' : mode === 'deep' ? 'bg-gradient-to-r from-purple-500 to-indigo-600' : 'bg-gradient-to-r from-blue-500 to-cyan-500'} text-white`}>
            <h2 className="text-4xl font-bold mb-1">{word?.word}</h2>
            <div className="flex items-center justify-center gap-3">
              <p className="text-white/70 text-sm">{word?.phonetic || word?.phoneticUs}</p>
              <AudioButton audioUrl={word?.audioUs} word={word?.word} size="sm" variant="white" />
            </div>
            {word?.record && (
              <div className="mt-3 flex items-center justify-center gap-2">
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                  复习 {word.record.reviewCount} 次
                </span>
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                  掌握度 {word.record.masteryLevel}%
                </span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-6">
            {showMeaning ? (
              <div className="space-y-4">
                {/* Meanings */}
                <div className="p-4 bg-blue-50 rounded-xl">
                  {meanings.map((m: any, i: number) => (
                    <div key={i} className={i > 0 ? 'mt-2 pt-2 border-t border-blue-100' : ''}>
                      <span className="text-xs text-blue-500 font-medium">{m.partOfSpeech}</span>
                      <p className="text-lg font-semibold text-slate-800">{m.translation}</p>
                    </div>
                  ))}
                </div>

                {/* 深度复习模式展示更多信息 */}
                {mode === 'deep' && (examples.length > 0 || roots.length > 0 || collocations.length > 0) && (
                  <>
                    <div className="flex gap-2 border-b border-slate-100 pb-2">
                      {examples.length > 0 && (
                        <button onClick={() => setActiveDetailTab('example')} className={`px-3 py-1.5 text-xs rounded-lg ${activeDetailTab === 'example' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-400'}`}>📝 例句</button>
                      )}
                      {roots.length > 0 && (
                        <button onClick={() => setActiveDetailTab('root')} className={`px-3 py-1.5 text-xs rounded-lg ${activeDetailTab === 'root' ? 'bg-green-50 text-green-700 font-medium' : 'text-slate-400'}`}>🌱 词根</button>
                      )}
                      {collocations.length > 0 && (
                        <button onClick={() => setActiveDetailTab('collocation')} className={`px-3 py-1.5 text-xs rounded-lg ${activeDetailTab === 'collocation' ? 'bg-purple-50 text-purple-700 font-medium' : 'text-slate-400'}`}>🔗 搭配</button>
                      )}
                    </div>
                    <div className="min-h-[80px]">
                      {activeDetailTab === 'example' && examples.slice(0, 2).map((e: any, i: number) => (
                        <div key={i} className="p-3 bg-slate-50 rounded-lg mb-2 border-l-3 border-blue-300">
                          <p className="text-sm text-slate-700">{e.sentence}</p>
                          <p className="text-xs text-slate-500 mt-1">{e.translation}</p>
                        </div>
                      ))}
                      {activeDetailTab === 'root' && roots.map((r: any, i: number) => (
                        <div key={i} className="p-3 bg-green-50 rounded-lg mb-2">
                          <p className="text-sm text-green-800">
                            <span className="font-bold">{r.root}</span> = {r.meaning} ({r.origin})
                          </p>
                        </div>
                      ))}
                      {activeDetailTab === 'collocation' && collocations.slice(0, 4).map((c: any, i: number) => (
                        <div key={i} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg mb-1">
                          <span className="text-sm font-medium text-blue-600">{c.phrase}</span>
                          <span className="text-xs text-slate-400">—</span>
                          <span className="text-sm text-slate-600">{c.translation}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-slate-400 text-sm">
                  {mode === 'exam' ? '回忆这个单词的含义...' : '点击卡片翻转查看释义'}
                </p>
                {mode === 'exam' && (
                  <div className="mt-4 flex items-center justify-center gap-4 text-xs text-slate-300">
                    <span>⏱️ 计时中...</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        {showMeaning && (
          <div className="flex gap-3">
            <button onClick={() => handleResult('unknown')} disabled={submitting}
              className="flex-1 py-3 bg-red-50 hover:bg-red-100 text-red-600 font-medium rounded-xl transition-colors disabled:opacity-50 relative group">
              😣 不认识
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-100 text-red-500 text-xs rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">1</span>
            </button>
            <button onClick={() => handleResult('vague')} disabled={submitting}
              className="flex-1 py-3 bg-yellow-50 hover:bg-yellow-100 text-yellow-600 font-medium rounded-xl transition-colors disabled:opacity-50 relative group">
              🤔 模糊
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-100 text-yellow-500 text-xs rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">2</span>
            </button>
            <button onClick={() => handleResult('known')} disabled={submitting}
              className="flex-1 py-3 bg-green-50 hover:bg-green-100 text-green-600 font-medium rounded-xl transition-colors disabled:opacity-50 relative group">
              😊 认识
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-100 text-green-500 text-xs rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">3</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  // ===== Overview 模式 =====
  const dist = distribution || { mastered: 0, familiar: 0, vague: 0, unknown: 0 };
  const totalDist = dist.mastered + dist.familiar + dist.vague + dist.unknown;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800">🔄 复习中心</h2>
            <p className="text-sm text-slate-500 mt-1">基于智能遗忘曲线，精准安排复习</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-500">待复习</p>
            <p className={`text-2xl font-bold ${totalPending > 0 ? 'text-orange-500' : 'text-green-500'}`}>{totalPending}</p>
          </div>
        </div>
      </div>

      {reviewed > 0 && (
        <div className="glass-card p-4 bg-green-50 border border-green-200">
          <p className="text-green-700 text-sm font-medium">✅ 刚才复习了 {reviewed} 个单词，记忆在加深！</p>
        </div>
      )}

      {/* 三种复习模式卡片 (参考不背单词) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ReviewModeCard
          icon="⚡"
          title="快速复习"
          desc="今日待复习单词，闪卡快速过"
          detail={`${Math.min(totalPending, 20)} 个单词 · 约 ${Math.min(totalPending, 20) * 0.5}分钟`}
          color="from-blue-500 to-cyan-500"
          borderColor="border-blue-200"
          disabled={totalPending === 0}
          onClick={() => handleStartReview('quick')}
        />
        <ReviewModeCard
          icon="🔬"
          title="深度复习"
          desc="薄弱词汇强化，含例句和词根"
          detail={`${Math.min(allWords.filter(w => (w.record?.masteryLevel || 0) < 60).length, 15)} 个薄弱词 · 约 ${Math.min(15, allWords.length)}分钟`}
          color="from-purple-500 to-indigo-600"
          borderColor="border-purple-200"
          disabled={allWords.length === 0}
          onClick={() => handleStartReview('deep')}
        />
        <ReviewModeCard
          icon="🎯"
          title="考前突击"
          desc="高频考点词汇，打乱随机复习"
          detail={`${Math.min(allWords.length, 30)} 个单词 · 模拟考试氛围`}
          color="from-red-500 to-orange-500"
          borderColor="border-red-200"
          disabled={allWords.length === 0}
          onClick={() => handleStartReview('exam')}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Mastery Distribution */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">📊 掌握度分布</h3>
          {totalDist === 0 ? (
            <p className="text-slate-400 text-sm py-8 text-center">还没有学习记录，开始学习吧！</p>
          ) : (
            <div className="space-y-3">
              {[
                { label: '已掌握', count: dist.mastered, pct: Math.round((dist.mastered / totalDist) * 100), color: 'bg-green-500', emoji: '🟢' },
                { label: '熟悉', count: dist.familiar, pct: Math.round((dist.familiar / totalDist) * 100), color: 'bg-blue-500', emoji: '🔵' },
                { label: '模糊', count: dist.vague, pct: Math.round((dist.vague / totalDist) * 100), color: 'bg-yellow-500', emoji: '🟡' },
                { label: '陌生', count: dist.unknown, pct: Math.round((dist.unknown / totalDist) * 100), color: 'bg-red-500', emoji: '🔴' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <span className="text-sm">{item.emoji}</span>
                  <span className="text-sm text-slate-600 w-14">{item.label}</span>
                  <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${item.color} rounded-full flex items-center justify-end pr-2 transition-all duration-500`} style={{ width: `${Math.max(item.pct, 5)}%` }}>
                      {item.count > 0 && <span className="text-xs text-white font-medium">{item.count}</span>}
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 w-10">{item.pct}%</span>
                </div>
              ))}
              <div className="mt-4 pt-4 border-t border-slate-100 text-center">
                <p className="text-sm text-slate-500">总词汇量: <span className="font-bold text-slate-800">{totalDist}</span> 个</p>
              </div>
            </div>
          )}
        </div>

        {/* Review Insight */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">💡 复习建议</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <span className="text-sm text-slate-700">待复习单词</span>
              <span className={`text-sm font-bold ${totalPending > 0 ? 'text-red-500' : 'text-green-500'}`}>
                {totalPending} 个
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <span className="text-sm text-slate-700">薄弱词汇</span>
              <span className="text-sm font-bold text-yellow-600">
                {allWords.filter(w => (w.record?.masteryLevel || 0) < 40).length} 个
              </span>
            </div>
            <div className="p-4 bg-blue-50 rounded-xl">
              <p className="text-sm text-blue-700">
                {totalPending > 10
                  ? '💡 你有较多单词即将到达遗忘临界点，建议使用「快速复习」模式尽快回顾！'
                  : totalPending > 0
                  ? '💡 还有少量单词需要复习，可以使用「深度复习」巩固薄弱词汇。'
                  : '🎉 太棒了！当前没有紧急需要复习的单词，可以使用「考前突击」模式巩固记忆。'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== 复习模式选择卡片组件 =====
function ReviewModeCard({ icon, title, desc, detail, color, borderColor, disabled, onClick }: {
  icon: string; title: string; desc: string; detail: string;
  color: string; borderColor: string; disabled: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`glass-card p-5 text-left border-2 ${borderColor} hover:shadow-lg hover:-translate-y-1 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none`}
    >
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-2xl text-white mb-3 shadow-lg`}>
        {icon}
      </div>
      <h4 className="text-base font-bold text-slate-800">{title}</h4>
      <p className="text-xs text-slate-500 mt-1">{desc}</p>
      <p className="text-xs text-slate-400 mt-2 font-medium">{detail}</p>
    </button>
  );
}

// ===== 工具函数 =====
function getReviewModeConfig(mode: ReviewMode) {
  switch (mode) {
    case 'quick':
      return {
        icon: '⚡', title: '快速复习', desc: '闪卡模式，快速过一遍待复习单词',
        borderColor: 'border-cyan-400', progressColor: 'bg-cyan-500'
      };
    case 'deep':
      return {
        icon: '🔬', title: '深度复习', desc: '含例句和词根，强化薄弱词汇',
        borderColor: 'border-purple-400', progressColor: 'bg-purple-500'
      };
    case 'exam':
      return {
        icon: '🎯', title: '考前突击', desc: '随机顺序，模拟考试氛围',
        borderColor: 'border-red-400', progressColor: 'bg-red-500'
      };
    default:
      return {
        icon: '🔄', title: '复习', desc: '',
        borderColor: 'border-blue-400', progressColor: 'bg-blue-500'
      };
  }
}

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
