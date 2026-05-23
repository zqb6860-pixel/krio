'use client';

import { StatsCards } from '@/components/dashboard/StatsCards';
import { TodayGoal } from '@/components/dashboard/TodayGoal';
import { LearningCalendar } from '@/components/dashboard/LearningCalendar';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { WeeklyChart } from '@/components/dashboard/WeeklyChart';

export default function DashboardPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="glass-card p-6 gradient-primary text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">早上好，学习者！👋</h2>
            <p className="text-blue-100 mt-1">
              今天是你连续学习的第 <span className="font-bold text-white">7</span> 天，继续加油！
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-blue-100">今日目标完成度</p>
            <p className="text-3xl font-bold">65%</p>
          </div>
        </div>
        {/* Progress Bar */}
        <div className="mt-4 h-2 bg-white/20 rounded-full overflow-hidden">
          <div className="h-full bg-white rounded-full transition-all duration-500" style={{ width: '65%' }} />
        </div>
      </div>

      {/* Stats Cards */}
      <StatsCards />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Today Goal + Quick Actions */}
        <div className="lg:col-span-2 space-y-6">
          <TodayGoal />
          <WeeklyChart />
        </div>

        {/* Right: Calendar + Quick Actions */}
        <div className="space-y-6">
          <QuickActions />
          <LearningCalendar />
        </div>
      </div>
    </div>
  );
}
