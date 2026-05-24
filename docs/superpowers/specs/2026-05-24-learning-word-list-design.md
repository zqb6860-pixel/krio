# 今日学习列表 & 自定义每段单词数

**Status:** design  
**Date:** 2026-05-24  
**Scope:** 学习模式 & 默写模式 用户体验增强

---

## 背景

当前学习和默写页面没有今日学习列表视图，用户无法一览今日要学的所有单词，也无法跳转到某个特定单词。同时每次学习的单词量固定为 `dailyWordGoal`（默认 30），用户无法按"每段"（session）粒度自定义。

目标：参照不背单词 App 和 Qwerty Learner 的设计，新增今日学习列表（侧边栏 + 弹出面板）和每段单词数自定义功能。

---

## 功能

### 1. 自定义每段单词数

| 字段 | 详情 |
|------|------|
| 新增设置 | `wordsPerSession` |
| 默认值 | 20 |
| 范围 | 5 ~ 200 |
| UI | 预设按钮 10 / 15 / 20 / 30 / 50 + 自定义输入框 |
| 位置 | 设置页新增一行 |
| 生效 | `GET /api/words/today?limit=N` 返回 N 个单词 |

### 2. 今日学习列表

学习（/learn）和默写（/spelling）页面均展示今日单词列表。

**两个展示模式：**
- **侧边栏**：左侧 ~260px，常驻可见，可折叠
- **弹出面板**：按钮/快捷键触发，居中模态框

**每个词条展示：**
- 序号、单词、中文释义（取第一条）、发音按钮、状态图标

**状态图标：**
- ○ 未学 — 还没到该词
- ▶ 当前 — 正在学习/默写
- ✓ 已完成 — 已学完/拼写正确
- ⊘ 已跳过 — 用户标记跳过

**操作：**
- 点击词条 → 跳转到该词
- 右侧 `...` 菜单：
  - 标记已掌握（跳过，计入完成）
  - 重新学习（重置状态）

 点击外部或 X 关闭

---

## 页面布局

```
┌────────────────────┬──────────────────────────────┐
│  📋 今日单词列表    │                              │
│   [收起] [全屏]    │    当前单词卡片                │
│                    │                              │
│  1. cancel  🔊 ✓  │    ┌──────────────────┐       │
│  2. explosive 🔊  │    │   explosive      │       │
│  3. numerous 🔊 ○ │    │   /ɪkˈspləʊsɪv/  │       │
│  ...               │    └──────────────────┘       │
│                    │                              │
│                    │    进度 3/20  ████░░░         │
└────────────────────┴──────────────────────────────┘
```

---

## 数据模型

### 新增 & 修改字段

```typescript
// UserSettings (shared/types/index.ts)
interface UserSettings {
  // ...existing fields
  wordsPerSession: number  // 默认 20，范围 5-200
}
```

### 前端会话状态

```typescript
// learn & spelling 页面共享的本地状态
interface WordSessionItem {
  wordId: string
  word: string
  meaning: string    // 第一条释义
  phonetic: string
  audioUs?: string
  status: 'pending' | 'current' | 'done' | 'skipped'
}
```

### 用户设置保存

```
PATCH /api/user/settings  { wordsPerSession: 25 }
```
修改 server 端 `userRouter` PATCH 路由——直接透传

---

## API 变更

### GET /api/words/today — 支持 limit 参数

```
GET /api/words/today?limit=20
```
- 新增 `limit` query param，默认使用 `dailyWordGoal`
- 返回最多 `limit` 个单词

### POST /api/learning/skip — 标记已掌握跳过

```
POST /api/learning/skip
{ wordId: "cmpifwjh0000730fc5dwgt8a5" }
```

| 逻辑 | 说明 |
|------|------|
| 创建/更新 learningRecord | 标记 `correct: true`, `masteryLevel: 60`, `status: 'reviewing'` |
| 设置 nextReviewAt | 1 天后 |
| 奖励 | 正常给 2 coins + 5 xp |
| 响应 | `{ success: true }` |

> 注意：`skip` 本质是“我会了，不用学了”——而非“跳过不学”。所以正常进入复习队列。

---

## 文件变更清单

| 文件 | 改动类型 | 说明 |
|------|----------|------|
| `shared/types/index.ts` | 修改 | `UserSettings` 加 `wordsPerSession` |
| `app/lightwords-web/src/app/settings/page.tsx` | 修改 | 加 wordsPerSession 预设 + 自定义输入 UI |
| `app/lightwords-web/src/app/learn/page.tsx` | 修改 | 加侧边栏 + 跳转逻辑 + 会话状态管理 |
| `app/lightwords-web/src/app/spelling/page.tsx` | 修改 | 加侧边栏 + 跳转逻辑 + 会话状态管理 |
| `app/lightwords-web/src/components/learning/WordListPanel.tsx` | **新建** | 通用单词列表组件（侧边栏 & 面板复用） |
| `app/lightwords-web/src/components/learning/WordItem.tsx` | **新建** | 单行词条组件 |
| `app/lightwords-web/src/lib/api.ts` | 修改 | 新增 `getTodayWords(limit)`, `skipWord(wordId)` |
| `server/src/routes/words.ts` | 修改 | `/today` 支持 `limit` 参数 |
| `server/src/routes/learning.ts` | 修改 | 新增 `POST /skip` |
| `server/src/routes/user.ts` | 修改 | settings 支持 `wordsPerSession` |

### 新建组件

**`WordListPanel.tsx`** — 通用单词列表面板
- Props: `words`, `currentIndex`, `onSelect`, `onSkip`, `onReset`, `compact` (侧边栏 vs 面板)
- 两种渲染模式：侧边栏（紧凑） / 面板（完整）
- 折叠/展开控制

**`WordItem.tsx`** — 单个词条行
- Props: `word`, `status`, `isCurrent`, `onClick`, `onSkip`, `onReset`
- 显示：序号 · 单词 · 释义 · 发音按钮 · 状态图标 · `...` 菜单

---

## 验证方式

1. 进入设置页 → 修改"每段单词数"为 10 → 保存
2. 进入学习页 → 左侧显示今日学习列表，共 10 个单词
3. 点击列表中的词条 → 跳转到该词继续学习
4. 完成某个词 → 列表状态更新为 ✓
5. 使用 `...` 菜单 → 标记跳过 / 重新学习
6. 点击"全屏"按钮 → 弹出面板展示全部单词
7. 点击"收起" → 侧边栏折叠
8. 进入默写页 → 同样的列表功能可用
9. 调用 `POST /api/learning/skip` → 验证 learningRecord 正确创建

---

## 边界情况

- `wordsPerSession` 设置太大（大于未学单词数）→ 返回所有可用单词
- 跳转到未完成单词 → 重置该词的状态
- 全部完成 → 显示完成页
- 侧边栏中无单词 → 显示空状态
- 默写模式下拼写中断 → 列表状态保持正确
