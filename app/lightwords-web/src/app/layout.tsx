import type { Metadata } from 'next';
import './globals.css';
import { AppShell } from '@/components/layout/AppShell';

export const metadata: Metadata = {
  title: 'LightWords 简词 - 让英语学习更简单',
  description: '融合科学记忆算法与趣味化学习机制的英语学习应用',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-slate-50">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
