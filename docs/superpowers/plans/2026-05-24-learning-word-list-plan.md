# 今日学习列表 & 自定义每段单词数 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为学习(/learn)和默写(/spelling)页面增加今日学习列表（侧边栏+弹出面板）及跳转功能，并在设置页新增"每段学习单词数"自定义设置。

**Architecture:** 新建 `WordListPanel` 和 `WordItem` 两个通用组件，在 learn 和 spelling 页面以左右布局集成侧边栏，通过共享 props 实现侧边栏/面板双模式。API 层面 `/words/today` 新增 `limit` 参数，新增 `/learning/skip` 端点。

**Tech Stack:** Next.js 14 App Router, React 18, TypeScript, Tailwind CSS, Express, Prisma, PostgreSQL

---

### Task 1: 更新共享类型定义

**Files:**
- Modify: `shared/types/index.ts`
- Modify: `server/prisma/schema.prisma`
- Modify: `server/src/routes/user.ts`

- [ ] **Step 1: 在 shared/types 中加 `wordsPerSession` 字段**

```typescript
// shared/types/index.ts, line 27 (在 reminderTime 后添加)
export interface UserSettings {
  dailyWordGoal: number;
  dailyTimeGoal: number;
  weeklyDaysGoal: number;
  pronunciation: 'us' | 'uk';
  theme: 'light' | 'dark';
  fontSize: 'small' | 'medium' | 'large';
  reminderTime?: string;
  wordOrder?: string;           // 新增
  wordsPerSession?: number;     // 新增，默认 20
}
```

- [ ] **Step 2: 在 Prisma schema 中加对应字段**

```
// server/prisma/schema.prisma, model UserSettings 中添加
  wordOrder        String?  // 学习顺序: sequential | random
  wordsPerSession  Int     @default(20)  // 每段学习单词数
```

- [ ] **Step 3: 更新 server user route 的 PATCH settings 支持新字段**

编辑 `server/src/routes/user.ts:52` 的解构：

```typescript
const { dailyWordGoal, dailyTimeGoal, weeklyDaysGoal, pronunciation, theme, fontSize, reminderTime, wordOrder, wordsPerSession } = req.body;
```

在 update 对象中添加：

```typescript
...(wordOrder !== undefined && { wordOrder }),
...(wordsPerSession !== undefined && { wordsPerSession }),
```

在 create 对象中添加：

```typescript
wordsPerSession: wordsPerSession || 20,
```

- [ ] **Step 4: Commit**

```bash
git add shared/types/index.ts server/prisma/schema.prisma server/src/routes/user.ts
git commit -m "feat: add wordsPerSession and wordOrder to UserSettings"
```

---

### Task 2: 后端 — /api/words/today 支持 limit 参数

**Files:**
- Modify: `server/src/routes/words.ts:58-125`

- [ ] **Step 1: 修改 `/today` 端点，优先使用 `limit` query param**

将 `server/src/routes/words.ts:65` 的 dailyGoal 逻辑改为：

```typescript
const limitParam = parseInt(req.query.limit as string) || 0;
const dailyGoal = limitParam > 0 ? Math.min(limitParam, 200) : (settings?.wordsPerSession || settings?.dailyWordGoal || 30);
```

> 说明：如果传了 `limit` 参数（且 > 0），使用 `min(limit, 200)` 作为上限（防止一次拉太多）。否则回退到 `wordsPerSession` → `dailyWordGoal` → 30 的默认链。

- [ ] **Step 2: Commit**

```bash
git add server/src/routes/words.ts
git commit -m "feat: add limit param support to GET /api/words/today"
```

---

### Task 3: 后端 — POST /api/learning/skip 端点

**Files:**
- Modify: `server/src/routes/learning.ts`

- [ ] **Step 1: 在 learning.ts 末尾新增 skip 路由**

```typescript
// POST /api/learning/skip — 标记单词已掌握，跳过学习
learningRouter.post('/skip', async (req: AuthRequest, res: Response) => {
  try {
    const { wordId } = req.body;
    if (!wordId) return res.status(400).json({ error: '缺少单词ID' });

    const userId = req.userId!;

    // 查找或创建学习记录，标记为已知
    const existing = await prisma.learningRecord.findUnique({
      where: { userId_wordId: { userId, wordId } },
    });

    if (existing) {
      await prisma.learningRecord.update({
        where: { id: existing.id },
        data: {
          correct: true,
          masteryLevel: 60,
          status: 'reviewing',
          repetitions: { increment: 1 },
          nextReviewAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1天后
        },
      });
    } else {
      await prisma.learningRecord.create({
        data: {
          userId,
          wordId,
          correct: true,
          masteryLevel: 60,
          status: 'reviewing',
          easeFactor: 2.5,
          interval: 1,
          repetitions: 1,
          nextReviewAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });
    }

    // 奖励
    await prisma.user.update({
      where: { id: userId },
      data: { coins: { increment: 2 }, experience: { increment: 5 } },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Skip error:', error);
    res.status(500).json({ error: '标记跳过失败' });
  }
});
```

- [ ] **Step 2: Commit**

```bash
git add server/src/routes/learning.ts
git commit -m "feat: add POST /api/learning/skip endpoint"
```

---

### Task 4: 前端 — 更新 API Client

**Files:**
- Modify: `app/lightwords-web/src/lib/api.ts`

- [ ] **Step 1: 修改 `getTodayWords` 支持 limit 参数，新增 `skipWord`**

```typescript
// api.ts line 141, replace:
getTodayWords(limit?: number) {
  const params = limit ? `?limit=${limit}` : '';
  return this.request<any[]>(`/words/today${params}`);
}

// api.ts line 152, after recordAnswer, add:
skipWord(wordId: string) {
  return this.request<any>('/learning/skip', {
    method: 'POST', body: JSON.stringify({ wordId }),
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add app/lightwords-web/src/lib/api.ts
git commit -m "feat: update API client — getTodayWords(limit) and skipWord()"
```

---

### Task 5: 前端 — 设置页新增"每段学习单词数"

**Files:**
- Modify: `app/lightwords-web/src/app/settings/page.tsx`

- [ ] **Step 1: 在 settings state (line 12) 中添加 `wordsPerSession`**

```typescript
const [settings, setSettings] = useState({
  dailyWordGoal: 30,
  dailyTimeGoal: 30,
  weeklyDaysGoal: 5,
  pronunciation: 'us',
  theme: 'light',
  fontSize: 'medium',
  reminderTime: '',
  wordsPerSession: 20,  // 新增
});
```

- [ ] **Step 2: 在 useEffect (line 22) 中同步 `wordsPerSession`**

```typescript
wordsPerSession: user.settings.wordsPerSession || 20,
```

- [ ] **Step 3: 在"学习目标"区域末尾（line 123，`</div>` 之前）添加新控件**

```tsx
{/* 每段学习单词数 */}
<div>
  <div className="flex justify-between mb-2">
    <label className="text-sm font-medium text-slate-700">每段学习单词数</label>
    <span className="text-sm text-blue-600 font-bold">{settings.wordsPerSession} 个</span>
  </div>
  <div className="flex gap-2 flex-wrap">
    {[10, 15, 20, 30, 50].map((n) => (
      <button
        key={n}
        onClick={() => setSettings(s => ({ ...s, wordsPerSession: n }))}
        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
          settings.wordsPerSession === n
            ? 'bg-blue-500 text-white'
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
        }`}
      >
        {n}个
      </button>
    ))}
    <div className="relative">
      <input
        type="number"
        min={5}
        max={200}
        value={settings.wordsPerSession}
        onChange={(e) => {
          const val = Math.min(200, Math.max(5, Number(e.target.value) || 5));
          setSettings(s => ({ ...s, wordsPerSession: val }));
        }}
        className="w-20 px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500/20"
      />
      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">个</span>
    </div>
  </div>
</div>
```

- [ ] **Step 4: Commit**

```bash
git add app/lightwords-web/src/app/settings/page.tsx
git commit -m "feat: add wordsPerSession setting UI"
```

---

### Task 6: 前端 — 新建 WordItem 组件

**Files:**
- Create: `app/lightwords-web/src/components/learning/WordItem.tsx`

- [ ] **Step 1: 创建组件文件**

```tsx
'use client';

import { AudioButton } from '@/components/common/AudioButton';

export interface WordSessionItem {
  wordId: string;
  word: string;
  meaning: string;
  phonetic: string;
  audioUs?: string;
  status: 'pending' | 'current' | 'done' | 'skipped';
}

interface WordItemProps {
  item: WordSessionItem;
  index: number;
  isCurrent: boolean;
  compact?: boolean;
  onSelect: (index: number) => void;
  onSkip: (index: number) => void;
  onReset: (index: number) => void;
}

export function WordItem({ item, index, isCurrent, compact, onSelect, onSkip, onReset }: WordItemProps) {
  const statusIcon: Record<string, string> = {
    pending: '○',
    current: '▶',
    done: '✓',
    skipped: '⊘',
  };

  const statusColor: Record<string, string> = {
    pending: 'text-slate-300',
    current: 'text-blue-500',
    done: 'text-green-500',
    skipped: 'text-amber-400',
  };

  return (
    <div
      onClick={() => onSelect(index)}
      className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
        isCurrent
          ? 'bg-blue-50 border border-blue-200'
          : 'hover:bg-slate-50 border border-transparent'
      }`}
    >
      {/* Status icon */}
      <span className={`text-xs w-5 text-center flex-shrink-0 ${statusColor[item.status]}`}>
        {statusIcon[item.status]}
      </span>

      {/* Number */}
      <span className="text-xs text-slate-400 w-6 text-right flex-shrink-0">
        {index + 1}
      </span>

      {/* Word + meaning */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">{item.word}</p>
        {!compact && (
          <p className="text-xs text-slate-400 truncate">{item.meaning}</p>
        )}
      </div>

      {/* Audio button */}
      {item.audioUs && (
        <AudioButton src={item.audioUs} small />
      )}

      {/* Actions menu — visible on hover */}
      <div className="hidden group-hover:flex items-center gap-1">
        {(item.status === 'pending' || item.status === 'current') && (
          <button
            onClick={(e) => { e.stopPropagation(); onSkip(index); }}
            className="text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-600 hover:bg-amber-200"
            title="标记已掌握"
          >
            ✓
          </button>
        )}
        {(item.status === 'done' || item.status === 'skipped') && (
          <button
            onClick={(e) => { e.stopPropagation(); onReset(index); }}
            className="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 hover:bg-slate-200"
            title="重新学习"
          >
            ↺
          </button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/lightwords-web/src/components/learning/WordItem.tsx
git commit -m "feat: add WordItem component"
```

---

### Task 7: 前端 — 新建 WordListPanel 组件

**Files:**
- Create: `app/lightwords-web/src/components/learning/WordListPanel.tsx`

- [ ] **Step 1: 创建组件文件**

```tsx
'use client';

import { useState } from 'react';
import { WordItem, type WordSessionItem } from './WordItem';

interface WordListPanelProps {
  words: WordSessionItem[];
  currentIndex: number;
  onSelect: (index: number) => void;
  onSkip: (index: number) => void;
  onReset: (index: number) => void;
}

export function WordListPanel({ words, currentIndex, onSelect, onSkip, onReset }: WordListPanelProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const doneCount = words.filter(w => w.status === 'done' || w.status === 'skipped').length;

  const listContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200">
        <span className="text-sm font-semibold text-slate-700">
          📋 今日单词 ({doneCount}/{words.length})
        </span>
        <button
          onClick={() => setModalOpen(true)}
          className="text-xs text-blue-500 hover:text-blue-600"
        >
          全屏
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto py-1">
        {words.map((item, i) => (
          <WordItem
            key={item.wordId}
            item={item}
            index={i}
            isCurrent={i === currentIndex}
            compact
            onSelect={onSelect}
            onSkip={onSkip}
            onReset={onReset}
          />
        ))}
        {words.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-8">暂无今日单词</p>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Sidebar */}
      <div className={`border-r border-slate-200 bg-white transition-all duration-300 flex flex-col ${
        sidebarOpen ? 'w-[260px]' : 'w-[40px]'
      }`}>
        {sidebarOpen ? (
          <>
            {listContent}
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-xs text-slate-400 hover:text-slate-600 px-3 py-2 border-t border-slate-100"
            >
              ◀ 收起列表
            </button>
          </>
        ) : (
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex-1 text-xs text-slate-400 hover:text-slate-600 writing-vertical"
          >
            展开列表 ▶
          </button>
        )}
      </div>

      {/* Full-screen Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setModalOpen(false)}>
          <div
            className="bg-white rounded-2xl shadow-xl w-[480px] max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
              <h3 className="font-semibold text-slate-800">今日单词列表</h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-1">
              {words.map((item, i) => (
                <WordItem
                  key={item.wordId}
                  item={item}
                  index={i}
                  isCurrent={i === currentIndex}
                  onSelect={(idx) => { onSelect(idx); setModalOpen(false); }}
                  onSkip={onSkip}
                  onReset={onReset}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/lightwords-web/src/components/learning/WordListPanel.tsx
git commit -m "feat: add WordListPanel component (sidebar + modal)"
```

---

### Task 8: 前端 — 改造学习页面 (/learn)

**Files:**
- Modify: `app/lightwords-web/src/app/learn/page.tsx`

核心改动：
1. 从 `useApi` 改为手动 fetch，支持传 `limit` 参数（从 settings 读取 `wordsPerSession`）
2. 构建 `WordSessionItem[]` 数组
3. 整合 `WordListPanel` 为左侧栏
4. `navigateTo` 支持从列表跳转
5. 各完成/跳过操作更新 session item 状态

- [ ] **Step 1: 修改 import 和类型**

在 `page.tsx` 顶部添加：

```typescript
import { useState, useCallback, useRef, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { AudioButton } from '@/components/common/AudioButton';
import { WordListPanel } from '@/components/learning/WordListPanel';
import { type WordSessionItem } from '@/components/learning/WordItem';
```

- [ ] **Step 2: 替换数据获取逻辑，用 `useState` + `useEffect` 替换 `useApi`**

```typescript
export default function LearnPage() {
  const { user, refreshUser } = useAuth();
  const [words, setWords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch words with user's wordsPerSession
  useEffect(() => {
    const fetchWords = async () => {
      try {
        setLoading(true);
        const perSession = user?.settings?.wordsPerSession || 20;
        const data = await api.getTodayWords(perSession);
        setWords(data);
      } catch (e: any) {
        setError(e.message || 'Failed to load words');
      } finally {
        setLoading(false);
      }
    };
    fetchWords();
  }, [user?.settings?.wordsPerSession]);

  // ...existing state variables continue here
```

- [ ] **Step 3: 构建 WordSessionItem 数组**

在 state 定义区域添加：

```typescript
const buildSessionItems = (): WordSessionItem[] => {
  return words.map((w: any) => ({
    wordId: w.id,
    word: w.word,
    meaning: w.meanings?.[0]?.translation || w.meanings?.[0]?.definition || '',
    phonetic: w.phonetic || '',
    audioUs: w.audioUs,
    status: 'pending' as const,
  }));
};

const [sessionItems, setSessionItems] = useState<WordSessionItem[]>([]);

// 当 words 加载完成后初始化 sessionItems
useEffect(() => {
  if (words.length > 0) {
    const items = buildSessionItems();
    items[0] = { ...items[0], status: 'current' as const };
    setSessionItems(items);
    setCurrentIndex(0);
    setLearnedCount(0);
    setShowAnswer(false);
  }
}, [words]);
```

- [ ] **Step 4: 更新 session 状态的辅助函数**

```typescript
const updateItemStatus = (index: number, status: WordSessionItem['status']) => {
  setSessionItems(prev => prev.map((item, i) =>
    i === index ? { ...item, status } : item
  ));
};

const markCurrentDone = () => {
  updateItemStatus(currentIndex, 'done');
  setLearnedCount(c => c + 1);
};

const handleSkip = async (index: number) => {
  const item = sessionItems[index];
  if (!item || (item.status !== 'pending' && item.status !== 'current')) return;
  try {
    await api.skipWord(item.wordId);
    updateItemStatus(index, 'skipped');
    if (index === currentIndex && index < totalWords - 1) {
      // 继续下一个
      setShowAnswer(false);
      setActiveTab('context');
      setSelectedOption(null);
      setQuizAnswered(false);
      setFlipAnimation(true);
      setTimeout(() => { setCurrentIndex(index + 1); setFlipAnimation(false); }, 150);
    }
  } catch (e) { console.error('Skip failed:', e); }
};

const handleReset = async (index: number) => {
  updateItemStatus(index, 'pending');
  if (index === currentIndex) {
    setShowAnswer(false);
    setActiveTab('context');
    setSelectedOption(null);
    setQuizAnswered(false);
  }
};
```

- [ ] **Step 5: 修改 `navigateTo` 函数，同步更新 session 状态**

```typescript
const navigateTo = useCallback((newIndex: number) => {
  if (newIndex < 0 || newIndex >= totalWords) return;
  setFlipAnimation(true);
  setTimeout(() => {
    // 清除旧 current 标记
    updateItemStatus(currentIndex, sessionItems[currentIndex]?.status === 'done' ? 'done'
      : sessionItems[currentIndex]?.status === 'skipped' ? 'skipped' : 'pending');
    // 标记新位置为 current
    updateItemStatus(newIndex, 'current');
    setCurrentIndex(newIndex);
    setShowAnswer(false);
    setActiveTab('context');
    setSelectedOption(null);
    setQuizAnswered(false);
    setFlipAnimation(false);
  }, 150);
}, [totalWords, currentIndex, sessionItems]);
```

- [ ] **Step 6: 修改 `handleAction`，标记 done 并更新 session**

```typescript
// 在 handleAction 中，完成词后
const handleAction = useCallback(async (type: 'unknown' | 'vague' | 'known') => {
  if (submitting || !currentWord) return;
  setSubmitting(true);
  const isCorrect = type !== 'unknown';
  const responseTimeMs = Date.now() - startTimeRef.current;
  try {
    await api.recordAnswer(currentWord.id, isCorrect, responseTimeMs);
    if (isCorrect) {
      markCurrentDone();
    }
    if (currentIndex < totalWords - 1) {
      navigateTo(currentIndex + 1);
    } else {
      setShowAnswer(false);
    }
  } catch (e) { console.error('Record failed:', e); }
  setSubmitting(false);
}, [submitting, currentWord, currentIndex, totalWords, navigateTo]);
```

- [ ] **Step 7: 修改页面 JSX 布局为左右结构**

将整个 return 内容改为：

```tsx
return (
  <div className="flex h-[calc(100vh-4rem)]">
    {/* Word List Sidebar */}
    {words.length > 0 && !loading && (
      <WordListPanel
        words={sessionItems}
        currentIndex={currentIndex}
        onSelect={(idx) => navigateTo(idx)}
        onSkip={handleSkip}
        onReset={handleReset}
      />
    )}

    {/* Main Content */}
    <div className="flex-1 overflow-y-auto p-6">
      {/* 原有的 loading / error / empty / completed / learning 内容保持不变 */}
      {loading && ( /* ...保持原有... */ )}
      {error && ( /* ...保持原有... */ )}
      {/* ...rest of original rendering... */}
    </div>
  </div>
);
```

> 注意：需要在 MarkCurrentDone 被调用处（原来 `setLearnedCount(c => c + 1)` 的地方）同时调用 `markCurrentDone()`。

- [ ] **Step 8: Commit**

```bash
git add app/lightwords-web/src/app/learn/page.tsx
git commit -m "feat: integrate WordListPanel into learn page"
```

---

### Task 9: 前端 — 改造默写页面 (/spelling)

**Files:**
- Modify: `app/lightwords-web/src/app/spelling/page.tsx`

改动模式同 Task 8：数据获取、sessionItems 管理、WordListPanel 集成。

- [ ] **Step 1: 添加 import**

```typescript
import { WordListPanel } from '@/components/learning/WordListPanel';
import { type WordSessionItem } from '@/components/learning/WordItem';
```

- [ ] **Step 2: 替换数据获取（同 learn page 模式）**

```typescript
const [words, setWords] = useState<any[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const fetchWords = async () => {
    try {
      setLoading(true);
      // 不传 limit，服务端自动从 wordsPerSession → dailyWordGoal → 30 默认链取值
      const data = await api.getTodayWords();
      setWords(data);
    } catch (e) {
      console.error('Failed to load words', e);
    } finally {
      setLoading(false);
    }
  };
  fetchWords();
}, []);
```

- [ ] **Step 3: 添加 sessionItems 状态和辅助函数**

```typescript
const [sessionItems, setSessionItems] = useState<WordSessionItem[]>([]);

useEffect(() => {
  if (words.length > 0) {
    setSessionItems(words.map((w: any) => ({
      wordId: w.id,
      word: w.word,
      meaning: w.meanings?.[0]?.translation || w.meanings?.[0]?.definition || '',
      phonetic: w.phonetic || '',
      audioUs: w.audioUs,
      status: 'pending' as const,
    })));
  }
}, [words]);

const handleSkip = async (index: number) => {
  const item = sessionItems[index];
  if (!item) return;
  try {
    await api.skipWord(item.wordId);
    setSessionItems(prev => prev.map((x, i) => i === index ? { ...x, status: 'skipped' } : x));
  } catch (e) { console.error('Skip failed:', e); }
};

const handleReset = (index: number) => {
  setSessionItems(prev => prev.map((x, i) => i === index ? { ...x, status: 'pending' } : x));
};
```

- [ ] **Step 4: 在拼写正确完成时更新 session 状态**

在拼写完成逻辑中添加：

```typescript
// 在 isWordComplete 的处理中
setSessionItems(prev => prev.map((x, i) =>
  i === currentIndex ? { ...x, status: 'done' as const } : x
));
```

- [ ] **Step 5: 在 `goNext` 中标记新词为 current**

```typescript
const goNext = useCallback(() => {
  const nextIndex = (currentIndex + 1) % totalWords;
  setCurrentIndex(nextIndex);
  setSessionItems(prev => prev.map((x, i) =>
    i === nextIndex ? { ...x, status: 'current' as const } : x
  ));
}, [currentIndex, totalWords]);
```

- [ ] **Step 6: 修改 JSX 为左右布局**

```tsx
return (
  <div className="flex h-[calc(100vh-4rem)]" ref={containerRef} tabIndex={0} onKeyDown={handleKeyDown}>
    {words.length > 0 && !loading && (
      <WordListPanel
        words={sessionItems}
        currentIndex={currentIndex}
        onSelect={(idx) => {
          setCurrentIndex(idx);
          setSessionItems(prev => prev.map((x, i) =>
            i === idx ? { ...x, status: 'current' as const } : x
          ));
        }}
        onSkip={handleSkip}
        onReset={handleReset}
      />
    )}
    <div className="flex-1 overflow-y-auto p-6">
      {/* 原有的 loading / empty / dictation 内容 */}
      ...
    </div>
  </div>
);
```

- [ ] **Step 7: Commit**

```bash
git add app/lightwords-web/src/app/spelling/page.tsx
git commit -m "feat: integrate WordListPanel into spelling page"
```

---

### Task 10: 重建 Docker 并验证

- [ ] **Step 1: 重建容器**

```bash
cd "d:\Study\Vibe Coding\LightWords\krio" && docker compose up --build -d
```

- [ ] **Step 2: 验证 API**

```bash
# 验证 limit 参数
curl -s -H "Authorization: Bearer $(curl -s -X POST http://localhost:3001/api/auth/login -H 'Content-Type: application/json' -d '{"email":"demo@lightwords.app","password":"demo123456"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)" "http://localhost:3001/api/words/today?limit=5" | python -c "import sys,json; d=json.load(sys.stdin); print(f'Returned {len(d)} words')"

# 验证 skip 端点
curl -s -X POST http://localhost:3001/api/learning/skip -H 'Content-Type: application/json' -H "Authorization: Bearer <token>" -d '{"wordId":"<any_word_id>"}'
```

- [ ] **Step 3: 在浏览器中验证**

打开 http://localhost:3000：
1. 进入设置页 → 修改每段单词数为 10 → 保存
2. 进入学习页 → 左侧可见今日学习列表，共 10 个单词
3. 点击列表中的词条 → 跳转到该词
4. 完成一个词 → 列表状态变为 ✓
5. hover 词条 → 出现操作按钮（标记已掌握 / 重新学习）
6. 点击"全屏" → 弹出面板
7. 收起侧边栏 → 折叠为 40px 窄条
8. 进入默写页 → 同样功能可用

- [ ] **Step 4: Commit any remaining changes**

```bash
git diff  # 检查是否有遗漏
git add -A
git commit -m "chore: final touches for word list feature"
```
