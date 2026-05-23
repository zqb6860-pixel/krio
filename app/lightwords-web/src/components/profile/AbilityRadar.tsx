'use client';

export function AbilityRadar() {
  const abilities = [
    { name: '词汇', score: 82, icon: '📚' },
    { name: '听力', score: 65, icon: '🎧' },
    { name: '口语', score: 45, icon: '🗣️' },
    { name: '阅读', score: 78, icon: '📖' },
    { name: '写作', score: 52, icon: '✍️' },
    { name: '语法', score: 70, icon: '📐' },
  ];

  return (
    <div className="glass-card p-6">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">📊 能力分析</h3>
      <div className="space-y-3">
        {abilities.map((ability) => (
          <div key={ability.name} className="flex items-center gap-3">
            <span className="text-xl w-8">{ability.icon}</span>
            <span className="text-sm text-slate-700 w-10">{ability.name}</span>
            <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${ability.score}%`,
                  background: `linear-gradient(to right, ${
                    ability.score >= 75 ? '#10b981, #059669' :
                    ability.score >= 50 ? '#3b82f6, #2563eb' :
                    '#f59e0b, #d97706'
                  })`,
                }}
              />
            </div>
            <span className="text-sm font-bold text-slate-700 w-10 text-right">{ability.score}</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-400 mt-4 text-center">
        综合评分: <span className="font-bold text-blue-600">65.3</span> / 100
      </p>
    </div>
  );
}
