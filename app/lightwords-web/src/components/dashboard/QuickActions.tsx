'use client';

import Link from 'next/link';

const actions = [
  { href: '/learn', label: '开始学习', icon: '📖', color: 'bg-blue-500 hover:bg-blue-600' },
  { href: '/challenge', label: '闯关模式', icon: '🎮', color: 'bg-purple-500 hover:bg-purple-600' },
  { href: '/review', label: '复习单词', icon: '🔄', color: 'bg-orange-500 hover:bg-orange-600' },
  { href: '/learn/listening', label: '听力训练', icon: '🎧', color: 'bg-green-500 hover:bg-green-600' },
];

export function QuickActions() {
  return (
    <div className="glass-card p-6">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">⚡ 快速开始</h3>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className={`${action.color} text-white p-4 rounded-xl text-center transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5`}
          >
            <span className="text-2xl block mb-1">{action.icon}</span>
            <span className="text-xs font-medium">{action.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
