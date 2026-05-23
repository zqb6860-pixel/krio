'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark';
type WallpaperPreset = 'none' | 'gradient-ocean' | 'gradient-sunset' | 'gradient-forest' | 'gradient-aurora' | 'custom';

interface ThemeContextType {
  theme: Theme;
  wallpaper: WallpaperPreset;
  toggleTheme: () => void;
  setWallpaper: (wp: WallpaperPreset) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  wallpaper: 'none',
  toggleTheme: () => {},
  setWallpaper: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const [wallpaper, setWallpaperState] = useState<WallpaperPreset>('none');

  useEffect(() => {
    const saved = localStorage.getItem('lw-theme') as Theme;
    const savedWp = localStorage.getItem('lw-wallpaper') as WallpaperPreset;
    if (saved) setTheme(saved);
    if (savedWp) setWallpaperState(savedWp);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('lw-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('lw-wallpaper', wallpaper);
  }, [wallpaper]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const setWallpaper = (wp: WallpaperPreset) => {
    setWallpaperState(wp);
  };

  return (
    <ThemeContext.Provider value={{ theme, wallpaper, toggleTheme, setWallpaper }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
