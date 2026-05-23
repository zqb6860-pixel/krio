'use client';

import { usePathname } from 'next/navigation';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

function AppBackground({ children }: { children: React.ReactNode }) {
  const { wallpaper } = useTheme();

  const getWallpaperStyle = () => {
    switch (wallpaper) {
      case 'gradient-ocean':
        return { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #6B8DD6 100%)' };
      case 'gradient-sunset':
        return { background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 50%, #fda085 100%)' };
      case 'gradient-forest':
        return { background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 50%, #2BC0E4 100%)' };
      case 'gradient-aurora':
        return { background: 'linear-gradient(135deg, #7F7FD5 0%, #86A8E7 50%, #91EAE4 100%)' };
      default:
        return {};
    }
  };

  const hasWallpaper = wallpaper !== 'none';

  return (
    <div className="relative h-screen overflow-hidden">
      {/* Wallpaper layer */}
      {hasWallpaper && (
        <div
          className="absolute inset-0 z-0 opacity-20 transition-opacity duration-500"
          style={getWallpaperStyle()}
        />
      )}
      <div className="relative z-10 h-full">
        {children}
      </div>
    </div>
  );
}

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
          <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center text-white font-bold text-xl mx-auto mb-4 animate-breathe shadow-lg shadow-blue-500/25">
            L
          </div>
          <p className="text-slate-500 text-sm animate-fadeIn">LightWords 加载中...</p>
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
    <AppBackground>
      <div className="flex h-full overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-6 page-enter">
            {children}
          </main>
        </div>
      </div>
    </AppBackground>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <LayoutContent>{children}</LayoutContent>
      </AuthProvider>
    </ThemeProvider>
  );
}
