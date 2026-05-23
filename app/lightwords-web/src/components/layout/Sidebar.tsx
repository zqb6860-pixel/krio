'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

const navItems = [
  { href: '/', label: '首页', icon: '🏠', desc: '学习概览' },
  { href: '/learn', label: '学习', icon: '📚', desc: '新词学习' },
  { href: '/review', label: '复习', icon: '🔄', desc: '智能复习' },
  { href: '/spelling', label: '默写', icon: '✍️', desc: '拼写训练' },
  { href: '/books', label: '词库', icon: '📖', desc: '词书管理' },
  { href: '/challenge', label: '闯关', icon: '🎮', desc: '趣味挑战' },
  { href: '/profile', label: '我的', icon: '👤', desc: '个人中心' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <aside className="w-64 sidebar-bg bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-colors duration-300">
      {/* Logo */}
      <div className="p-6 border-b border-slate-100 dark:border-slate-800">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-11 h-11 rounded-xl gradient-primary flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/25 group-hover:shadow-blue-500/40 transition-shadow">
            L
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">LightWords</h1>
            <p className="text-xs text-slate-400">简词 · 轻松记单词</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <span className={`text-xl transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>{item.icon}</span>
              <div className="flex-1">
                <p className={`text-sm font-medium ${isActive ? 'font-semibold' : ''}`}>
                  {item.label}
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">{item.desc}</p>
              </div>
              {isActive && (
                <div className="w-1.5 h-7 bg-blue-500 rounded-full shadow-sm shadow-blue-500/50" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Theme Toggle & User */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
        >
          <span className="text-lg">{theme === 'dark' ? '🌙' : '☀️'}</span>
          <span>{theme === 'dark' ? '深色模式' : '浅色模式'}</span>
          <div className={`ml-auto w-9 h-5 rounded-full transition-colors relative ${theme === 'dark' ? 'bg-blue-500' : 'bg-slate-200'}`}>
            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${theme === 'dark' ? 'translate-x-4' : 'translate-x-0.5'}`} />
          </div>
        </button>

        {/* User info */}
        <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
          <div className="w-9 h-9 bg-gradient-to-br from-purple-400 to-pink-400 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-sm">
            {user?.username?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{user?.username || '用户'}</p>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>Lv.{user?.level || 1}</span>
              <span>·</span>
              <span className="text-orange-500">🔥{user?.streak || 0}天</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
