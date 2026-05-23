'use client';

const stats = [
  {
    label: '今日已学',
    value: '32',
    unit: '个单词',
    icon: '📖',
    color: 'from-blue-400 to-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    label: '待复习',
    value: '18',
    unit: '个单词',
    icon: '🔄',
    color: 'from-orange-400 to-orange-600',
    bgColor: 'bg-orange-50',
  },
  {
    label: '已掌握',
    value: '1,256',
    unit: '个单词',
    icon: '✅',
    color: 'from-green-400 to-green-600',
    bgColor: 'bg-green-50',
  },
  {
    label: '学习时长',
    value: '25',
    unit: '分钟',
    icon: '⏱️',
    color: 'from-purple-400 to-purple-600',
    bgColor: 'bg-purple-50',
  },
];

export function StatsCards() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="glass-card p-4 hover:shadow-xl transition-shadow duration-300"
        >
          <div className="flex items-center justify-between mb-3">
            <span className={`${stat.bgColor} p-2 rounded-lg text-xl`}>{stat.icon}</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
          <p className="text-xs text-slate-500 mt-1">
            {stat.label} · {stat.unit}
          </p>
        </div>
      ))}
    </div>
  );
}
