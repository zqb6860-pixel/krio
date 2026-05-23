'use client';

export function MemoryCurve() {
  // Simulated memory curve data points
  const curvePoints = [
    { day: 0, retention: 100 },
    { day: 1, retention: 58 },
    { day: 2, retention: 44 },
    { day: 3, retention: 36 },
    { day: 7, retention: 23 },
    { day: 14, retention: 16 },
    { day: 30, retention: 10 },
  ];

  const withReview = [
    { day: 0, retention: 100 },
    { day: 1, retention: 75 },
    { day: 2, retention: 85 },
    { day: 3, retention: 78 },
    { day: 7, retention: 82 },
    { day: 14, retention: 88 },
    { day: 30, retention: 90 },
  ];

  return (
    <div className="glass-card p-6">
      <h3 className="text-lg font-semibold text-slate-800 mb-2">📈 记忆曲线分析</h3>
      <p className="text-sm text-slate-500 mb-6">基于你的学习数据，智能计算最优复习节点</p>
      
      {/* Simple chart visualization */}
      <div className="relative h-48 border-b border-l border-slate-200 mb-4">
        {/* Y-axis labels */}
        <div className="absolute -left-8 top-0 text-xs text-slate-400">100%</div>
        <div className="absolute -left-6 top-1/4 text-xs text-slate-400">75%</div>
        <div className="absolute -left-6 top-1/2 text-xs text-slate-400">50%</div>
        <div className="absolute -left-6 top-3/4 text-xs text-slate-400">25%</div>
        
        {/* Grid lines */}
        <div className="absolute left-0 right-0 top-1/4 border-t border-dashed border-slate-100" />
        <div className="absolute left-0 right-0 top-1/2 border-t border-dashed border-slate-100" />
        <div className="absolute left-0 right-0 top-3/4 border-t border-dashed border-slate-100" />

        {/* Without review curve (red/orange) */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <polyline
            points={curvePoints.map((p, i) => `${(i / (curvePoints.length - 1)) * 100},${100 - p.retention}`).join(' ')}
            fill="none"
            stroke="#f97316"
            strokeWidth="1.5"
            strokeDasharray="3,3"
          />
          <polyline
            points={withReview.map((p, i) => `${(i / (withReview.length - 1)) * 100},${100 - p.retention}`).join(' ')}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
          />
        </svg>
      </div>

      {/* X-axis */}
      <div className="flex justify-between text-xs text-slate-400 px-2">
        <span>今天</span>
        <span>1天</span>
        <span>2天</span>
        <span>3天</span>
        <span>7天</span>
        <span>14天</span>
        <span>30天</span>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-blue-500" />
          <span className="text-xs text-slate-600">科学复习后</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-orange-400 border-dashed" style={{ borderTopWidth: 1, height: 0 }} />
          <span className="text-xs text-slate-600">不复习</span>
        </div>
      </div>

      {/* Key Insight */}
      <div className="mt-4 p-3 bg-blue-50 rounded-xl">
        <p className="text-sm text-blue-700">
          💡 <strong>智能提醒：</strong>你有 18 个单词即将到达遗忘临界点，建议现在复习以巩固记忆。
        </p>
      </div>
    </div>
  );
}
