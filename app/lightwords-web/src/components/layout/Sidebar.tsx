'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';

const navItems = [
  { href: '/', label: '首页', icon: '🏠', desc: '仪表盘' },
  { href: '/learn', label: '学习', icon: '📚', desc: '单词学习' },
  { href: '/challenge', label: '闯关', icon: '🎮', desc: '闯关模式' },
  { href: '/review', label: '复习', icon: '🔄', desc: '复习中心' },
  { href: '/profile', label: '我的', icon: '👤', desc: '个人中心' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-slate-100">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center text-white font-bold text-lg">
            L
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800">LightWords</h1>
            <p className="text-xs text-slate-500">简词</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                isActive
                  ? 'bg-blue-50 text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
              )}
            >
              <span className="text-xl">{item.icon}</span>
              <div>
                <p className={clsx('text-sm font-medium', isActive && 'font-semibold')}>
                  {item.label}
                </p>
                <p className="text-xs text-slate-400">{item.desc}</p>
              </div>
              {isActive && (
                <div className="ml-auto w-1.5 h-8 bg-blue-500 rounded-full" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Info Footer */}
      <div className="p-4 border-t border-slate-100">
        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white text-sm font-bold">
            U
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-700 truncate">用户</p>
            <p className="text-xs text-slate-400">Lv.5 学习达人</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
