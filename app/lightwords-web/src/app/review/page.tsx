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
  const [flipAnim, setFlipAnim] = useState(false);
  const startTimeRef = useRef<number>(Date.now());

  const allWords = reviewData?.words || [];
  const totalPending = reviewData?.totalPending || 0;


  const getWordsForMode = () => {
    switch (mode) {
      case 'quick': return allWords.slice(0, 20);
      case 'deep': return [...allWords].sort((a, b) => (a.record?.masteryLevel || 0) - (b.record?.masteryLevel || 0)).slice(0, 15);
      case 'exam': return shuffleArray([...allWords].slice(0, 30));
      default: return allWords;
    }
  };

  const words = mode === 'overview' ? allWords : getWordsForMode();

  // Keyboard shortcuts
  useEffect(() => {
    if (mode === 'overview') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      switch (e.key) {
        case ' ': case 'Enter': e.preventDefault(); if (!showMeaning) handleReveal(); break;
        case '1': if (showMeaning) handleResult('unknown'); break;
        case '2': if (showMeaning) handleResult('vague'); break;
        case '3': if (showMeaning) handleResult('known'); break;
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
      if (correct || status === 'vague') setReviewed(r => r + 1);
    } catch (err) { console.error('Record error:', err); }
    setSubmitting(false);

    if (currentIndex < words.length - 1) {
      setFlipAnim(true);
      setTimeout(() => {
        setShowMeaning(false);
        setActiveDetailTab('example');
        setCurrentIndex(i => i + 1);
        setFlipAnim(false);
      }, 150);
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
          <p className="text-slate-500 dark:text-slate-400 text-sm">加载复习数据...</p>
        </div>
      </div>
    );
  }


  // ===== Review Mode (quick/deep/exam) =====
  if (mode !== 'overview') {
    if (words.length === 0) {
      return (
        <div className="max-w-lg mx-auto flex items-center justify-center h-[60vh]">
          <div className="glass-card p-8 text-center">
            <span className="text-5xl">✅</span>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-4">没有待复习单词</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-2">所有单词都复习完了，太棒了！</p>
            <button onClick={() => setMode('overview')} className="mt-4 px-5 py-2 bg-blue-500 text-white rounded-xl text-sm hover:bg-blue-600 transition-colors">返回</button>
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

    // 计算记忆阶段 (参考不背单词的记忆阶段可视化)
    const masteryLevel = word?.record?.masteryLevel || 0;
    const memoryStage = getMemoryStage(masteryLevel);

    return (
      <div className="max-w-2xl mx-auto space-y-5">
        {/* Mode Header */}
        <div className={`glass-card p-4 border-t-4 ${modeConfig.borderColor}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">{modeConfig.icon}</span>
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">{modeConfig.title}</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{modeConfig.desc}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-slate-400 hidden sm:inline">空格翻转 · 1/2/3选择</span>
              <button onClick={() => setMode('overview')} className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">退出</button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 dark:text-slate-400">{currentIndex + 1}/{words.length}</span>
            <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div className={`h-full ${modeConfig.progressColor} rounded-full transition-all duration-300`} style={{ width: `${((currentIndex + 1) / words.length) * 100}%` }} />
            </div>
            <span className="text-xs text-green-600 dark:text-green-400">✓ {reviewed}</span>
          </div>
        </div>


        {/* Flashcard */}
        <div className={`glass-card overflow-hidden transition-all duration-200 ${flipAnim ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
          onClick={!showMeaning ? handleReveal : undefined} style={{ cursor: !showMeaning ? 'pointer' : 'default' }}>
          {/* Word Header */}
          <div className={`p-6 text-center text-white relative overflow-hidden ${
            mode === 'exam' ? 'bg-gradient-to-r from-red-500 to-orange-500' :
            mode === 'deep' ? 'bg-gradient-to-r from-purple-500 to-indigo-600' :
            'bg-gradient-to-r from-blue-500 to-cyan-500'
          }`}>
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
            <h2 className="text-4xl font-bold mb-1.5 relative z-10">{word?.word}</h2>
            <div className="flex items-center justify-center gap-3 relative z-10">
              <p className="text-white/70 text-sm">{word?.phonetic || word?.phoneticUs}</p>
              <AudioButton audioUrl={word?.audioUs} word={word?.word} size="sm" variant="white" />
            </div>
            {/* 记忆阶段指示 (参考不背单词) */}
            {word?.record && (
              <div className="mt-3 flex items-center justify-center gap-2 relative z-10">
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${memoryStage.badgeColor}`}>
                  {memoryStage.icon} {memoryStage.label}
                </span>
                <span className="text-[11px] bg-white/15 px-2 py-0.5 rounded-full">
                  复习 {word.record.reviewCount || 0} 次
                </span>
                <span className="text-[11px] bg-white/15 px-2 py-0.5 rounded-full">
                  掌握 {masteryLevel}%
                </span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-6">
            {showMeaning ? (
              <div className="space-y-4 animate-fadeIn">
                {/* Meanings */}
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800/30">
                  {meanings.map((m: any, i: number) => (
                    <div key={i} className={i > 0 ? 'mt-2 pt-2 border-t border-blue-100 dark:border-blue-800/30' : ''}>
                      <span className="text-xs text-blue-500 dark:text-blue-400 font-medium">{m.partOfSpeech}</span>
                      <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">{m.translation}</p>
                    </div>
                  ))}
                </div>

                {/* Memory Stage Progress (参考不背单词的记忆阶段) */}
                <MemoryStageIndicator masteryLevel={masteryLevel} reviewCount={word?.record?.reviewCount || 0} />

                {/* Deep mode: extra details */}
                {mode === 'deep' && (examples.length > 0 || roots.length > 0 || collocations.length > 0) && (
                  <>
                    <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                      {examples.length > 0 && (
                        <button onClick={() => setActiveDetailTab('example')} className={`flex-1 px-3 py-1.5 text-xs rounded-lg transition-all ${activeDetailTab === 'example' ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-sm font-medium' : 'text-slate-400'}`}>📝 例句</button>
                      )}
                      {roots.length > 0 && (
                        <button onClick={() => setActiveDetailTab('root')} className={`flex-1 px-3 py-1.5 text-xs rounded-lg transition-all ${activeDetailTab === 'root' ? 'bg-white dark:bg-slate-700 text-green-700 dark:text-green-300 shadow-sm font-medium' : 'text-slate-400'}`}>🌱 词根</button>
                      )}
                      {collocations.length > 0 && (
                        <button onClick={() => setActiveDetailTab('collocation')} className={`flex-1 px-3 py-1.5 text-xs rounded-lg transition-all ${activeDetailTab === 'collocation' ? 'bg-white dark:bg-slate-700 text-purple-700 dark:text-purple-300 shadow-sm font-medium' : 'text-slate-400'}`}>🔗 搭配</button>
                      )}
                    </div>
                    <div className="min-h-[80px]">
                      {activeDetailTab === 'example' && examples.slice(0, 2).map((e: any, i: number) => (
                        <div key={i} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg mb-2 border-l-3 border-blue-300 dark:border-blue-600">
                          <p className="text-sm text-slate-700 dark:text-slate-200">{e.sentence}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{e.translation}</p>
                        </div>
                      ))}
                      {activeDetailTab === 'root' && roots.map((r: any, i: number) => (
                        <div key={i} className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg mb-2">
                          <p className="text-sm text-green-800 dark:text-green-300">
                            <span className="font-bold">{r.root}</span> = {r.meaning} ({r.origin})
                          </p>
                        </div>
                      ))}
                      {activeDetailTab === 'collocation' && collocations.slice(0, 4).map((c: any, i: number) => (
                        <div key={i} className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg mb-1">
                          <span className="text-sm font-medium text-blue-600 dark:text-blue-400">{c.phrase}</span>
                          <span className="text-xs text-slate-400">—</span>
                          <span className="text-sm text-slate-600 dark:text-slate-300">{c.translation}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-slate-400 dark:text-slate-500 text-sm">
                  {mode === 'exam' ? '回忆这个单词的含义...' : '点击卡片翻转查看释义'}
                </p>
                {mode === 'exam' && <p className="text-xs text-slate-300 dark:text-slate-600 mt-3">⏱️ 计时中...</p>}
              </div>
            )}
          </div>
        </div>


        {/* Action Buttons */}
        {showMeaning && (
          <div className="flex gap-3">
            <button onClick={() => handleResult('unknown')} disabled={submitting}
              className="flex-1 py-3.5 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 font-medium rounded-xl transition-all disabled:opacity-50 active:scale-95">
              <span className="text-lg">😣</span><span className="block text-xs mt-0.5">不认识</span>
            </button>
            <button onClick={() => handleResult('vague')} disabled={submitting}
              className="flex-1 py-3.5 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 text-amber-600 dark:text-amber-400 font-medium rounded-xl transition-all disabled:opacity-50 active:scale-95">
              <span className="text-lg">🤔</span><span className="block text-xs mt-0.5">模糊</span>
            </button>
            <button onClick={() => handleResult('known')} disabled={submitting}
              className="flex-1 py-3.5 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400 font-medium rounded-xl transition-all disabled:opacity-50 active:scale-95">
              <span className="text-lg">😊</span><span className="block text-xs mt-0.5">认识</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  // ===== Overview Mode =====
  const dist = distribution || { mastered: 0, familiar: 0, vague: 0, unknown: 0 };
  const totalDist = dist.mastered + dist.familiar + dist.vague + dist.unknown;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">🔄 复习中心</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">基于智能间隔算法，精准安排每次复习</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-500 dark:text-slate-400">待复习</p>
            <p className={`text-2xl font-bold ${totalPending > 0 ? 'text-orange-500' : 'text-green-500'}`}>{totalPending}</p>
          </div>
        </div>
      </div>

      {reviewed > 0 && (
        <div className="glass-card p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30 animate-slideUp">
          <p className="text-green-700 dark:text-green-300 text-sm font-medium">✅ 刚才复习了 {reviewed} 个单词，记忆在加深！</p>
        </div>
      )}


      {/* 三种复习模式卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ReviewModeCard icon="⚡" title="快速复习" desc="闪卡快速过，强化短期记忆"
          detail={`${Math.min(totalPending, 20)} 个单词 · 约 ${Math.min(totalPending, 20)}分钟`}
          gradient="from-blue-500 to-cyan-500" borderColor="border-blue-200 dark:border-blue-800"
          disabled={totalPending === 0} onClick={() => handleStartReview('quick')} />
        <ReviewModeCard icon="🔬" title="深度复习" desc="含例句词根，强化薄弱词汇"
          detail={`${Math.min(allWords.filter((w: any) => (w.record?.masteryLevel || 0) < 60).length, 15)} 个薄弱词`}
          gradient="from-purple-500 to-indigo-600" borderColor="border-purple-200 dark:border-purple-800"
          disabled={allWords.length === 0} onClick={() => handleStartReview('deep')} />
        <ReviewModeCard icon="🎯" title="考前突击" desc="随机顺序，模拟考试氛围"
          detail={`${Math.min(allWords.length, 30)} 个单词 · 限时挑战`}
          gradient="from-red-500 to-orange-500" borderColor="border-red-200 dark:border-red-800"
          disabled={allWords.length === 0} onClick={() => handleStartReview('exam')} />
      </div>

      {/* 间隔复习时间线 (参考不背单词的复习安排可视化) */}
      <div className="glass-card p-6 card-hover">
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-4">⏰ 间隔复习安排</h3>
        <ReviewTimeline words={allWords} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Mastery Distribution */}
        <div className="glass-card p-6 card-hover">
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-4">📊 掌握度分布</h3>
          {totalDist === 0 ? (
            <p className="text-slate-400 dark:text-slate-500 text-sm py-8 text-center">还没有学习记录</p>
          ) : (
            <div className="space-y-3">
              {[
                { label: '已掌握', count: dist.mastered, pct: Math.round((dist.mastered / totalDist) * 100), color: 'bg-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
                { label: '熟悉', count: dist.familiar, pct: Math.round((dist.familiar / totalDist) * 100), color: 'bg-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                { label: '模糊', count: dist.vague, pct: Math.round((dist.vague / totalDist) * 100), color: 'bg-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
                { label: '陌生', count: dist.unknown, pct: Math.round((dist.unknown / totalDist) * 100), color: 'bg-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <span className="text-sm text-slate-600 dark:text-slate-300 w-14">{item.label}</span>
                  <div className="flex-1 h-5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className={`h-full ${item.color} rounded-full flex items-center justify-end pr-2 transition-all duration-700`} style={{ width: `${Math.max(item.pct, 4)}%` }}>
                      {item.count > 0 && <span className="text-[10px] text-white font-medium">{item.count}</span>}
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 w-10 text-right">{item.pct}%</span>
                </div>
              ))}
              <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">总词汇量: <span className="font-bold text-slate-800 dark:text-slate-100">{totalDist}</span></p>
            </div>
          )}
        </div>

        {/* Review Insight */}
        <div className="glass-card p-6 card-hover">
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-4">💡 复习建议</h3>
          <div className="space-y-3">
            <InsightRow label="待复习单词" value={`${totalPending} 个`} color={totalPending > 0 ? 'text-orange-500' : 'text-green-500'} />
            <InsightRow label="薄弱词汇" value={`${allWords.filter((w: any) => (w.record?.masteryLevel || 0) < 40).length} 个`} color="text-amber-600 dark:text-amber-400" />
            <InsightRow label="已掌握词汇" value={`${dist.mastered || 0} 个`} color="text-green-600 dark:text-green-400" />
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800/30 mt-2">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {totalPending > 10 ? '💡 你有较多单词即将到达遗忘临界点，建议使用「快速复习」尽快回顾！' :
                 totalPending > 0 ? '💡 还有少量单词需复习，可使用「深度复习」巩固薄弱词汇。' :
                 '🎉 当前没有紧急需要复习的单词，可使用「考前突击」巩固记忆。'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


// ===== 记忆阶段指示组件 (参考不背单词的阶段展示) =====
function MemoryStageIndicator({ masteryLevel, reviewCount }: { masteryLevel: number; reviewCount: number }) {
  const stages = [
    { min: 0, max: 20, label: '初识', icon: '🌱', color: 'bg-red-400' },
    { min: 20, max: 40, label: '短期记忆', icon: '🌿', color: 'bg-orange-400' },
    { min: 40, max: 60, label: '中期记忆', icon: '🌲', color: 'bg-amber-400' },
    { min: 60, max: 80, label: '长期记忆', icon: '🌳', color: 'bg-blue-400' },
    { min: 80, max: 100, label: '永久记忆', icon: '💎', color: 'bg-green-400' },
  ];

  const currentStageIndex = stages.findIndex(s => masteryLevel >= s.min && masteryLevel < s.max);
  const activeStage = currentStageIndex >= 0 ? currentStageIndex : stages.length - 1;

  return (
    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-slate-600 dark:text-slate-300">记忆阶段进度</span>
        <span className="text-[11px] text-slate-400">第 {reviewCount} 次复习</span>
      </div>
      <div className="flex items-center gap-1">
        {stages.map((stage, i) => (
          <div key={i} className="flex-1 flex flex-col items-center">
            <div className={`w-full h-2 rounded-full transition-all duration-500 ${i <= activeStage ? stage.color : 'bg-slate-200 dark:bg-slate-700'}`} />
            <span className={`text-[9px] mt-1 ${i === activeStage ? 'font-bold text-slate-700 dark:text-slate-200' : 'text-slate-400 dark:text-slate-500'}`}>
              {i === activeStage ? stage.icon : ''} {stage.label}
            </span>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-center text-slate-400 dark:text-slate-500 mt-2">
        {masteryLevel < 40 ? '💡 多复习几次即可进入长期记忆' :
         masteryLevel < 80 ? '✨ 记忆在加深中，再坚持复习几次' :
         '🎉 已接近永久记忆，保持偶尔回顾即可'}
      </p>
    </div>
  );
}

// ===== 间隔复习时间线 (参考不背单词) =====
function ReviewTimeline({ words }: { words: any[] }) {
  if (words.length === 0) {
    return <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-6">暂无复习安排</p>;
  }

  // 模拟间隔时间段分组
  const now = Date.now();
  const groups = [
    { label: '已过期', icon: '🔴', words: words.filter((w: any) => { const next = w.record?.nextReviewAt; return next && new Date(next).getTime() < now; }) },
    { label: '今天', icon: '🟡', words: words.filter((w: any) => { const next = w.record?.nextReviewAt; if (!next) return false; const d = new Date(next); const t = new Date(); return d.getTime() >= now && d.toDateString() === t.toDateString(); }) },
    { label: '明天', icon: '🟢', words: words.filter((w: any) => { const next = w.record?.nextReviewAt; if (!next) return false; const d = new Date(next); const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1); return d.toDateString() === tomorrow.toDateString(); }) },
    { label: '本周内', icon: '🔵', words: words.filter((w: any) => { const next = w.record?.nextReviewAt; if (!next) return false; const d = new Date(next); const weekLater = new Date(); weekLater.setDate(weekLater.getDate() + 7); const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 2); return d >= tomorrow && d <= weekLater; }) },
  ].filter(g => g.words.length > 0);

  if (groups.length === 0) {
    // Fallback: show all as due
    return (
      <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
        <span className="text-xl">✅</span>
        <p className="text-sm text-green-700 dark:text-green-300">当前没有紧急待复习的单词，继续保持！</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {groups.map((group) => (
        <div key={group.label} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
          <span className="text-lg">{group.icon}</span>
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{group.label}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">{group.words.length} 个单词待复习</p>
          </div>
          <div className="flex -space-x-1">
            {group.words.slice(0, 4).map((w: any, i: number) => (
              <span key={i} className="inline-block px-2 py-0.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-[10px] text-slate-600 dark:text-slate-300 shadow-sm">
                {w.word?.slice(0, 6)}{w.word?.length > 6 ? '…' : ''}
              </span>
            ))}
            {group.words.length > 4 && (
              <span className="inline-block px-2 py-0.5 bg-slate-100 dark:bg-slate-600 border border-slate-200 dark:border-slate-500 rounded text-[10px] text-slate-500 dark:text-slate-300">
                +{group.words.length - 4}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}


// ===== Sub Components =====

function ReviewModeCard({ icon, title, desc, detail, gradient, borderColor, disabled, onClick }: {
  icon: string; title: string; desc: string; detail: string;
  gradient: string; borderColor: string; disabled: boolean; onClick: () => void;
}) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={`glass-card p-5 text-left border-2 ${borderColor} hover:shadow-lg hover:-translate-y-1 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none w-full`}>
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-2xl text-white mb-3 shadow-lg`}>
        {icon}
      </div>
      <h4 className="text-base font-bold text-slate-800 dark:text-slate-100">{title}</h4>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{desc}</p>
      <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 font-medium">{detail}</p>
    </button>
  );
}

function InsightRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
      <span className="text-sm text-slate-700 dark:text-slate-300">{label}</span>
      <span className={`text-sm font-bold ${color}`}>{value}</span>
    </div>
  );
}

// ===== Utility Functions =====

function getMemoryStage(masteryLevel: number) {
  if (masteryLevel >= 80) return { label: '永久记忆', icon: '💎', badgeColor: 'bg-green-400/20 text-green-100' };
  if (masteryLevel >= 60) return { label: '长期记忆', icon: '🌳', badgeColor: 'bg-blue-400/20 text-blue-100' };
  if (masteryLevel >= 40) return { label: '中期记忆', icon: '🌲', badgeColor: 'bg-amber-400/20 text-amber-100' };
  if (masteryLevel >= 20) return { label: '短期记忆', icon: '🌿', badgeColor: 'bg-orange-400/20 text-orange-100' };
  return { label: '初识', icon: '🌱', badgeColor: 'bg-red-400/20 text-red-100' };
}

function getReviewModeConfig(mode: ReviewMode) {
  switch (mode) {
    case 'quick': return { icon: '⚡', title: '快速复习', desc: '闪卡快速过一遍待复习单词', borderColor: 'border-cyan-400', progressColor: 'bg-cyan-500' };
    case 'deep': return { icon: '🔬', title: '深度复习', desc: '含例句词根，强化薄弱词汇', borderColor: 'border-purple-400', progressColor: 'bg-purple-500' };
    case 'exam': return { icon: '🎯', title: '考前突击', desc: '随机顺序，模拟考试氛围', borderColor: 'border-red-400', progressColor: 'bg-red-500' };
    default: return { icon: '🔄', title: '复习', desc: '', borderColor: 'border-blue-400', progressColor: 'bg-blue-500' };
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
