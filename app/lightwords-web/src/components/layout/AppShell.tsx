'use client';

import { usePathname } from 'next/navigation';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isLoggedIn, isLoading } = useAuth();

  // Auth pages - no sidebar/header
  const isAuthPage = pathname === '/login' || pathname === '/register';
  if (isAuthPage) return <>{children}</>;

  // Loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center text-white font-bold text-lg mx-auto mb-3 animate-pulse">
            L
          </div>
          <p className="text-slate-500 text-sm">加载中...</p>
        </div>
      </div>
    );
  }

  // Not logged in - redirect handled by api client
  if (!isLoggedIn) {
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <LayoutContent>{children}</LayoutContent>
    </AuthProvider>
  );
}
