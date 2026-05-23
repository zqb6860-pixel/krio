'use client';

interface LearningMapProps {
  onSelectLevel: (levelId: string) => void;
}

const units = [
  {
    id: 'u1',
    title: '基础入门',
    icon: '🌱',
    levels: [
      { id: 'l1', title: '日常问候', stars: 3, locked: false },
      { id: 'l2', title: '数字与颜色', stars: 2, locked: false },
      { id: 'l3', title: '家庭成员', stars: 1, locked: false },
      { id: 'l4', title: '食物饮料', stars: 0, locked: false },
      { id: 'l5', title: '天气与季节', stars: 0, locked: true },
    ],
  },
  {
    id: 'u2',
    title: '日常生活',
    icon: '🏠',
    levels: [
      { id: 'l6', title: '购物用语', stars: 0, locked: true },
      { id: 'l7', title: '餐厅点餐', stars: 0, locked: true },
      { id: 'l8', title: '交通出行', stars: 0, locked: true },
      { id: 'l9', title: '工作办公', stars: 0, locked: true },
      { id: 'l10', title: '休闲娱乐', stars: 0, locked: true },
    ],
  },
  {
    id: 'u3',
    title: '进阶表达',
    icon: '🚀',
    levels: [
      { id: 'l11', title: '情感表达', stars: 0, locked: true },
      { id: 'l12', title: '观点陈述', stars: 0, locked: true },
      { id: 'l13', title: '新闻阅读', stars: 0, locked: true },
      { id: 'l14', title: '学术词汇', stars: 0, locked: true },
      { id: 'l15', title: '商务英语', stars: 0, locked: true },
    ],
  },
];

export function LearningMap({ onSelectLevel }: LearningMapProps) {
  return (
    <div className="space-y-6">
      {units.map((unit) => (
        <div key={unit.id} className="glass-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">{unit.icon}</span>
            <h3 className="text-lg font-semibold text-slate-800">{unit.title}</h3>
          </div>
          <div className="grid grid-cols-5 gap-3">
            {unit.levels.map((level) => (
              <button
                key={level.id}
                onClick={() => !level.locked && onSelectLevel(level.id)}
                disabled={level.locked}
                className={`relative p-4 rounded-xl text-center transition-all duration-200 ${
                  level.locked
                    ? 'bg-slate-100 cursor-not-allowed opacity-60'
                    : level.stars > 0
                    ? 'bg-gradient-to-b from-green-50 to-emerald-50 border-2 border-green-200 hover:shadow-md hover:-translate-y-0.5'
                    : 'bg-white border-2 border-blue-200 hover:shadow-md hover:-translate-y-0.5 hover:border-blue-400'
                }`}
              >
                {level.locked && (
                  <span className="absolute top-2 right-2 text-xs">🔒</span>
                )}
                <p className="text-xs font-medium text-slate-700 mb-2">{level.title}</p>
                <div className="flex justify-center gap-0.5">
                  {[1, 2, 3].map((star) => (
                    <span
                      key={star}
                      className={`text-sm ${
                        star <= level.stars ? 'text-yellow-400' : 'text-slate-200'
                      }`}
                    >
                      ⭐
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
