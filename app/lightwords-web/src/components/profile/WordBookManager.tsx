'use client';

const wordBooks = [
  { id: '1', name: 'CET-4 大学英语四级', words: 4500, progress: 28, icon: '🎓', active: true },
  { id: '2', name: 'CET-6 大学英语六级', words: 5500, progress: 0, icon: '🏫', active: false },
  { id: '3', name: '考研英语核心词汇', words: 5200, progress: 0, icon: '📕', active: false },
  { id: '4', name: '日常口语高频词', words: 2000, progress: 45, icon: '💬', active: false },
  { id: '5', name: 'IELTS 雅思核心词汇', words: 3500, progress: 0, icon: '🌍', active: false },
  { id: '6', name: '商务英语词汇', words: 2800, progress: 12, icon: '💼', active: false },
];

export function WordBookManager() {
  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-800">📖 词库管理</h3>
        <button className="text-sm text-blue-500 hover:text-blue-600 font-medium">
          + 导入词库
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {wordBooks.map((book) => (
          <div
            key={book.id}
            className={`p-4 rounded-xl border-2 transition-all hover:shadow-md ${
              book.active ? 'border-blue-400 bg-blue-50/50' : 'border-slate-100 hover:border-slate-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{book.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{book.name}</p>
                <p className="text-xs text-slate-500">{book.words} 词</p>
              </div>
              {book.active && (
                <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full">
                  学习中
                </span>
              )}
            </div>
            {book.progress > 0 && (
              <div className="mt-3">
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>进度</span>
                  <span>{book.progress}%</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${book.progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
