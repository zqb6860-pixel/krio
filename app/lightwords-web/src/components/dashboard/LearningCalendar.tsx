'use client';

export function LearningCalendar() {
  // Generate mock calendar data
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  // Mock learned days
  const learnedDays = new Set([1, 2, 3, 5, 6, 7, 8, 10, 11, 12, 13, 14, 15, 17, 18, 19, 20, 21, 22, 23]);
  const currentDay = today.getDate();

  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  return (
    <div className="glass-card p-6">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">
        📅 学习日历
      </h3>
      <div className="grid grid-cols-7 gap-1 text-center">
        {/* Week headers */}
        {weekDays.map((day) => (
          <div key={day} className="text-xs text-slate-400 py-1 font-medium">
            {day}
          </div>
        ))}
        {/* Empty cells before first day */}
        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}
        {/* Days */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const isLearned = learnedDays.has(day);
          const isToday = day === currentDay;
          return (
            <div
              key={day}
              className={`aspect-square flex items-center justify-center text-xs rounded-lg transition-colors ${
                isToday
                  ? 'bg-blue-500 text-white font-bold'
                  : isLearned
                  ? 'bg-green-100 text-green-700 font-medium'
                  : day > currentDay
                  ? 'text-slate-300'
                  : 'text-slate-400'
              }`}
            >
              {day}
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-green-100" />
          <span>已学习</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-blue-500" />
          <span>今天</span>
        </div>
      </div>
    </div>
  );
}
