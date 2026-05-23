'use client';

interface WordProgressProps {
  current: number;
  total: number;
  learned: number;
}

export function WordProgress({ current, total, learned }: WordProgressProps) {
  const percent = Math.round((current / total) * 100);
  return (
    <div>
      <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
        <span>进度 {percent}%</span>
        <span className="text-green-600">已学 {learned} 个</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
