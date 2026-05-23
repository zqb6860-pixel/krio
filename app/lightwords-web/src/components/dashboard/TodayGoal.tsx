'use client';

const goals = [
  { label: '新学单词', current: 32, target: 50, icon: '📚', color: 'bg-blue-500' },
  { label: '复习单词', current: 12, target: 18, icon: '🔄', color: 'bg-orange-500' },
  { label: '闯关关卡', current: 2, target: 3, icon: '🎮', color: 'bg-purple-500' },
  { label: '学习时长', current: 25, target: 30, unit: '分钟', icon: '⏱️', color: 'bg-green-500' },
];

export function TodayGoal() {
  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-800">📋 今日目标</h3>
        <span className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-full font-medium">
          3/4 已完成
        </span>
      </div>
      <div className="space-y-4">
        {goals.map((goal) => {
          const percent = Math.min(100, Math.round((goal.current / goal.target) * 100));
          const isComplete = goal.current >= goal.target;
          return (
            <div key={goal.label} className="flex items-center gap-4">
              <span className="text-xl w-8">{goal.icon}</span>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-slate-700">{goal.label}</span>
                  <span className="text-xs text-slate-500">
                    {goal.current}/{goal.target}{goal.unit ? goal.unit : ''}
                    {isComplete && ' ✓'}
                  </span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isComplete ? 'bg-green-500' : goal.color
                    }`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
