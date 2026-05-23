'use client';

const weeklyData = [
  { day: '周一', words: 45, time: 35 },
  { day: '周二', words: 52, time: 40 },
  { day: '周三', words: 38, time: 25 },
  { day: '周四', words: 60, time: 45 },
  { day: '周五', words: 48, time: 30 },
  { day: '周六', words: 55, time: 50 },
  { day: '周日', words: 32, time: 25 },
];

export function WeeklyChart() {
  const maxWords = Math.max(...weeklyData.map((d) => d.words));

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-800">📊 本周学习趋势</h3>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-slate-500">单词数</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-purple-500" />
            <span className="text-slate-500">时长(分)</span>
          </div>
        </div>
      </div>

      {/* Simple bar chart */}
      <div className="flex items-end justify-between gap-2 h-40">
        {weeklyData.map((data) => (
          <div key={data.day} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full flex flex-col items-center gap-0.5" style={{ height: '120px' }}>
              <div className="flex gap-0.5 items-end h-full w-full justify-center">
                {/* Words bar */}
                <div
                  className="w-3 bg-blue-500 rounded-t transition-all duration-500"
                  style={{ height: `${(data.words / maxWords) * 100}%` }}
                />
                {/* Time bar */}
                <div
                  className="w-3 bg-purple-400 rounded-t transition-all duration-500"
                  style={{ height: `${(data.time / 60) * 100}%` }}
                />
              </div>
            </div>
            <span className="text-xs text-slate-500 mt-1">{data.day}</span>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-lg font-bold text-slate-800">330</p>
          <p className="text-xs text-slate-500">本周单词</p>
        </div>
        <div>
          <p className="text-lg font-bold text-slate-800">4.2h</p>
          <p className="text-xs text-slate-500">学习时长</p>
        </div>
        <div>
          <p className="text-lg font-bold text-slate-800">87%</p>
          <p className="text-xs text-slate-500">正确率</p>
        </div>
      </div>
    </div>
  );
}
