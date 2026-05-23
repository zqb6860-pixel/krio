'use client';

const achievements = [
  { id: '1', name: '初学者', icon: '🌱', desc: '完成第一次学习', unlocked: true },
  { id: '2', name: '持之以恒', icon: '🔥', desc: '连续打卡7天', unlocked: true },
  { id: '3', name: '词汇达人', icon: '📚', desc: '累计学习500词', unlocked: true },
  { id: '4', name: '完美通关', icon: '⭐', desc: '获得3星通关', unlocked: true },
  { id: '5', name: '速度之星', icon: '⚡', desc: '10秒内答对5题', unlocked: true },
  { id: '6', name: '月度之星', icon: '🏆', desc: '连续打卡30天', unlocked: false },
  { id: '7', name: '千词斩', icon: '🗡️', desc: '累计学习1000词', unlocked: true },
  { id: '8', name: '社交达人', icon: '🤝', desc: '邀请3位好友', unlocked: false },
  { id: '9', name: '百日坚持', icon: '💎', desc: '连续打卡100天', unlocked: false },
];

export function AchievementWall() {
  const unlocked = achievements.filter((a) => a.unlocked).length;
  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-800">🏆 成就墙</h3>
        <span className="text-xs text-slate-500">{unlocked}/{achievements.length} 已解锁</span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {achievements.map((ach) => (
          <div
            key={ach.id}
            className={`p-3 rounded-xl text-center transition-all ${
              ach.unlocked
                ? 'bg-gradient-to-b from-yellow-50 to-orange-50 border border-yellow-200'
                : 'bg-slate-50 opacity-50'
            }`}
          >
            <span className="text-2xl">{ach.icon}</span>
            <p className="text-xs font-medium text-slate-700 mt-1">{ach.name}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{ach.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
