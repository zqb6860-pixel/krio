'use client';

export function ReviewStats() {
  const distribution = [
    { label: '已掌握', count: 856, percent: 68, color: 'bg-green-500' },
    { label: '熟悉', count: 215, percent: 17, color: 'bg-blue-500' },
    { label: '模糊', count: 125, percent: 10, color: 'bg-yellow-500' },
    { label: '陌生', count: 60, percent: 5, color: 'bg-red-500' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Mastery Distribution */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">📊 掌握度分布</h3>
        <div className="space-y-3">
          {distribution.map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <span className="text-sm text-slate-600 w-16">{item.label}</span>
              <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${item.color} rounded-full flex items-center justify-end pr-2 transition-all duration-500`}
                  style={{ width: `${item.percent}%` }}
                >
                  <span className="text-xs text-white font-medium">{item.count}</span>
                </div>
              </div>
              <span className="text-xs text-slate-400 w-10">{item.percent}%</span>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-slate-100 text-center">
          <p className="text-sm text-slate-500">
            总词汇量: <span className="font-bold text-slate-800">1,256</span> 个
          </p>
        </div>
      </div>

      {/* Review Schedule */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">📅 复习计划</h3>
        <div className="space-y-3">
          {[
            { time: '今天', count: 18, urgency: 'high' },
            { time: '明天', count: 12, urgency: 'medium' },
            { time: '后天', count: 8, urgency: 'low' },
            { time: '本周内', count: 35, urgency: 'low' },
          ].map((item) => (
            <div key={item.time} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <span className="text-sm text-slate-700">{item.time}</span>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-bold ${
                  item.urgency === 'high' ? 'text-red-500' :
                  item.urgency === 'medium' ? 'text-orange-500' : 'text-slate-600'
                }`}>
                  {item.count} 个
                </span>
                {item.urgency === 'high' && (
                  <span className="text-xs px-2 py-0.5 bg-red-100 text-red-600 rounded-full">
                    待复习
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
