# LightWords 安全加固与生产就绪实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复所有安全漏洞，建立质量基础设施，实现生产就绪配置。

**Architecture:** 按 3 个阶段增量推进：安全加固 → 质量基础设施 → 生产就绪。每个阶段独立可验证，完成后项目状态均优于前一状态。

**Tech Stack:** Express, helmet, express-rate-limit, pino, ESLint 9, Prettier, Husky, Vitest, GitHub Actions

---

## 阶段 1：安全加固

### Task 1: JWT 密钥管理

**Files:**
- Modify: `server/src/middleware/auth.ts`
- Modify: `server/src/routes/auth.ts:438-459`

- [ ] **Step 1: 修改 auth.ts 中间件，移除硬编码回退**

替换 `server/src/middleware/auth.ts` 全部内容：

```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is required');
  process.exit(1);
}

const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || JWT_SECRET + '-refresh';

export interface AuthRequest extends Request {
  userId?: string;
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未登录，请先登录' });
  }

  const token = authHeader.substring(7);

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
    req.userId = payload.userId;
    next();
  } catch (error) {
    return res.status(401).json({ error: '登录已过期，请重新登录' });
  }
}

export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30m' });
}

export function generateRefreshToken(userId: string): string {
  return jwt.sign({ userId, type: 'refresh' }, JWT_REFRESH_SECRET, { expiresIn: '30d' });
}

export function verifyRefreshToken(token: string): { userId: string } {
  const payload = jwt.verify(token, JWT_REFRESH_SECRET) as { userId: string; type?: string };
  if (payload.type !== 'refresh') {
    throw new Error('Invalid token type');
  }
  return { userId: payload.userId };
}
```

- [ ] **Step 2: 修改 auth.ts 路由中的 refresh 端点**

在 `server/src/routes/auth.ts` 中，替换 import 和 refresh 端点：

将第 5 行的 import 改为：
```typescript
import { generateToken, generateRefreshToken, verifyRefreshToken } from '../middleware/auth';
```

将第 438-459 行的 refresh 端点替换为：
```typescript
// ===== POST /api/auth/refresh =====
authRouter.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: 'Missing refresh token' });
    }

    const payload = verifyRefreshToken(refreshToken);
    const newToken = generateToken(payload.userId);
    res.json({ token: newToken });
  } catch {
    res.status(401).json({ error: 'Token 已过期' });
  }
});
```

- [ ] **Step 3: 验证 TypeScript 编译**

Run: `cd server && npx tsc --noEmit`
Expected: 无错误输出

- [ ] **Step 4: 提交**

```bash
git add server/src/middleware/auth.ts server/src/routes/auth.ts
git commit -m "fix(security): JWT secret from env, separate refresh secret, 30m access token"
```

---

### Task 2: CORS 配置 + Helmet + 请求体限制

**Files:**
- Modify: `server/src/index.ts`
- Modify: `server/package.json`

- [ ] **Step 1: 安装依赖**

Run: `cd server && npm install helmet express-rate-limit`

- [ ] **Step 2: 替换 server/src/index.ts 全部内容**

```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { PrismaClient } from '@prisma/client';
import { authRouter } from './routes/auth';
import { wordRouter } from './routes/words';
import { learningRouter } from './routes/learning';
import { levelRouter } from './routes/levels';
import { achievementRouter } from './routes/achievements';
import { userRouter } from './routes/user';
import { checkinRouter } from './routes/checkin';
import { importRouter } from './routes/import';

export const prisma = new PrismaClient();

const app = express();
const PORT = process.env.PORT || 3001;

// Validate CORS_ORIGIN in production
const corsOrigin = process.env.CORS_ORIGIN;
if (process.env.NODE_ENV === 'production' && !corsOrigin) {
  console.error('FATAL: CORS_ORIGIN is required in production');
  process.exit(1);
}

// Security middleware
app.use(helmet());
app.use(cors({
  origin: corsOrigin || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));

// Health check
app.get('/api/health', (_, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);
app.use('/api/words', wordRouter);
app.use('/api/learning', learningRouter);
app.use('/api/levels', levelRouter);
app.use('/api/achievements', achievementRouter);
app.use('/api/checkin', checkinRouter);
app.use('/api/import', importRouter);

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Server error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 LightWords API running at http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
```

- [ ] **Step 3: 验证编译**

Run: `cd server && npx tsc --noEmit`
Expected: 无错误

- [ ] **Step 4: 提交**

```bash
git add server/src/index.ts server/package.json server/package-lock.json
git commit -m "fix(security): add helmet, strict CORS, request body size limit"
```

---

### Task 3: 速率限制

**Files:**
- Create: `server/src/middleware/rateLimit.ts`
- Modify: `server/src/routes/auth.ts`
- Modify: `server/src/index.ts`

- [ ] **Step 1: 创建速率限制中间件**

创建 `server/src/middleware/rateLimit.ts`：

```typescript
import rateLimit from 'express-rate-limit';

export const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: '请求过于频繁，请稍后重试' },
});

export const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: '登录尝试过于频繁，请1分钟后再试' },
});

export const registerLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: '注册请求过于频繁，请稍后重试' },
});

export const smsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: '验证码发送过于频繁，请稍后重试' },
});
```

- [ ] **Step 2: 在 index.ts 中添加全局限制**

在 `server/src/index.ts` 的 `app.use(express.json({ limit: '1mb' }));` 之后添加：

```typescript
import { globalLimiter } from './middleware/rateLimit';

app.use('/api', globalLimiter);
```

- [ ] **Step 3: 在 auth.ts 路由中添加路由级限制**

在 `server/src/routes/auth.ts` 顶部 import 之后添加：

```typescript
import { authLimiter, registerLimiter, smsLimiter } from '../middleware/rateLimit';
```

然后在各路由定义前添加限制器：

```typescript
authRouter.post('/register', registerLimiter, async (req: Request, res: Response) => {
// ... 原有代码不变

authRouter.post('/login', authLimiter, async (req: Request, res: Response) => {
// ... 原有代码不变

authRouter.post('/sms/send', smsLimiter, async (req: Request, res: Response) => {
// ... 原有代码不变

authRouter.post('/phone/register', registerLimiter, async (req: Request, res: Response) => {
// ... 原有代码不变
```

- [ ] **Step 4: 验证编译**

Run: `cd server && npx tsc --noEmit`
Expected: 无错误

- [ ] **Step 5: 提交**

```bash
git add server/src/middleware/rateLimit.ts server/src/index.ts server/src/routes/auth.ts
git commit -m "fix(security): add rate limiting to auth endpoints"
```

---

### Task 4: SMS 验证码安全 + 注册错误消息 + WeChat CSRF

**Files:**
- Modify: `server/src/routes/auth.ts`

- [ ] **Step 1: 替换 SMS 验证码生成**

在 `server/src/routes/auth.ts` 顶部添加 import：

```typescript
import crypto from 'crypto';
```

将第 171 行：
```typescript
const code = String(Math.floor(100000 + Math.random() * 900000));
```
替换为：
```typescript
const code = String(crypto.randomInt(100000, 1000000));
```

- [ ] **Step 2: 修复注册错误消息**

将第 98-101 行：
```typescript
if (existing) {
  return res.status(409).json({
    error: existing.email === body.email ? '邮箱已被注册' : '用户名已被占用',
  });
}
```
替换为：
```typescript
if (existing) {
  return res.status(409).json({ error: '该邮箱或用户名已被注册' });
}
```

同样修复第 287-294 行的手机号注册错误消息：
```typescript
if (existing) {
  return res.status(409).json({
    error: existing.phone === body.phone ? '该手机号已注册' : '用户名已被占用',
  });
}
```
替换为：
```typescript
if (existing) {
  return res.status(409).json({ error: '该手机号或用户名已被注册' });
}
```

- [ ] **Step 3: 修复 WeChat CSRF state 生成**

将第 425 行：
```typescript
const state = Math.random().toString(36).slice(2, 15);
```
替换为：
```typescript
const state = crypto.randomBytes(16).toString('hex');
```

- [ ] **Step 4: 验证编译**

Run: `cd server && npx tsc --noEmit`
Expected: 无错误

- [ ] **Step 5: 提交**

```bash
git add server/src/routes/auth.ts
git commit -m "fix(security): crypto.randomInt for SMS, hide user enumeration, crypto.randomBytes for CSRF"
```

---

### Task 5: Docker Compose 安全加固

**Files:**
- Modify: `docker-compose.yml`

- [ ] **Step 1: 替换 docker-compose.yml**

```yaml
services:
  # PostgreSQL Database
  db:
    image: postgres:16-alpine
    container_name: lightwords-db
    environment:
      POSTGRES_USER: ${POSTGRES_USER:?POSTGRES_USER is required}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:?POSTGRES_PASSWORD is required}
      POSTGRES_DB: ${POSTGRES_DB:-lightwords}
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $${POSTGRES_USER:-postgres}"]
      interval: 5s
      timeout: 5s
      retries: 5

  # Backend API
  server:
    build:
      context: ./server
      dockerfile: Dockerfile
    container_name: lightwords-server
    environment:
      DATABASE_URL: "postgresql://${POSTGRES_USER:-postgres}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB:-lightwords}?schema=public"
      JWT_SECRET: "${JWT_SECRET:?JWT_SECRET is required}"
      PORT: "3001"
      CORS_ORIGIN: "${CORS_ORIGIN:?CORS_ORIGIN is required}"
      NODE_ENV: "production"
    ports:
      - "3001:3001"
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped

  # Web Frontend
  web:
    build:
      context: .
      dockerfile: ./app/lightwords-web/Dockerfile
    container_name: lightwords-web
    environment:
      NEXT_PUBLIC_API_URL: "${NEXT_PUBLIC_API_URL:-http://localhost:3001/api}"
    ports:
      - "3000:3000"
    depends_on:
      - server
    restart: unless-stopped

volumes:
  pgdata:
```

- [ ] **Step 2: 创建 .env.docker 示例文件**

创建 `docker-compose.env.example`：

```env
# Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your-strong-password-here
POSTGRES_DB=lightwords

# Server
JWT_SECRET=your-jwt-secret-at-least-32-chars
CORS_ORIGIN=http://localhost:3000

# Web
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

- [ ] **Step 3: 更新 .gitignore 确保忽略 .env.docker**

确认 `.gitignore` 包含 `.env*` 模式（已有）。

- [ ] **Step 4: 提交**

```bash
git add docker-compose.yml docker-compose.env.example
git commit -m "fix(security): remove hardcoded secrets from docker-compose, require env vars"
```

---

## 阶段 2：质量基础设施

### Task 6: ESLint 配置

**Files:**
- Create: `eslint.config.mjs`
- Modify: `package.json` (root)
- Modify: `server/package.json`
- Modify: `app/lightwords-web/package.json`

- [ ] **Step 1: 安装依赖**

Run: `npm install -D eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint-plugin-react eslint-plugin-react-hooks --workspace-root`

- [ ] **Step 2: 创建 eslint.config.mjs**

```javascript
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  {
    ignores: ['**/node_modules/**', '**/dist/**', '**/.next/**', '**/prisma/**', '**/*.js'],
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  {
    files: ['app/lightwords-web/**/*.tsx', 'app/lightwords-web/**/*.ts'],
    plugins: {
      react,
      'react-hooks': reactHooks,
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
    },
    settings: {
      react: { version: 'detect' },
    },
  },
];
```

- [ ] **Step 3: 添加 lint 脚本**

根目录 `package.json` 的 scripts 中添加：

```json
"lint": "eslint . --fix",
"lint:check": "eslint ."
```

`server/package.json` 的 scripts 中添加：

```json
"lint": "eslint src/ --fix",
"lint:check": "eslint src/"
```

`app/lightwords-web/package.json` 的 scripts 中添加：

```json
"lint:check": "next lint"
```

- [ ] **Step 4: 验证 lint 运行**

Run: `npm run lint:check` (预期有一些 warning，但无 crash)
Expected: 命令能正常执行

- [ ] **Step 5: 提交**

```bash
git add eslint.config.mjs package.json server/package.json app/lightwords-web/package.json package-lock.json
git commit -m "chore: add ESLint 9 flat config with TypeScript and React support"
```

---

### Task 7: Prettier 配置

**Files:**
- Create: `.prettierrc`
- Create: `.prettierignore`
- Modify: `package.json` (root)

- [ ] **Step 1: 安装依赖**

Run: `npm install -D prettier --workspace-root`

- [ ] **Step 2: 创建 .prettierrc**

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

- [ ] **Step 3: 创建 .prettierignore**

```
node_modules
dist
.next
prisma
*.db
package-lock.json
```

- [ ] **Step 4: 添加格式化脚本**

根目录 `package.json` 的 scripts 中添加：

```json
"format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,css}\"",
"format:check": "prettier --check \"**/*.{ts,tsx,js,jsx,json,css}\""
```

- [ ] **Step 5: 验证运行**

Run: `npm run format:check`
Expected: 命令能正常执行（可能有格式差异，正常）

- [ ] **Step 6: 提交**

```bash
git add .prettierrc .prettierignore package.json package-lock.json
git commit -m "chore: add Prettier configuration"
```

---

### Task 8: Husky + lint-staged

**Files:**
- Create: `.husky/pre-commit`
- Modify: `package.json` (root)

- [ ] **Step 1: 安装依赖**

Run: `npm install -D husky lint-staged --workspace-root`

- [ ] **Step 2: 初始化 Husky**

Run: `npx husky init`

- [ ] **Step 3: 配置 pre-commit hook**

替换 `.husky/pre-commit` 内容：

```bash
npx lint-staged
```

- [ ] **Step 4: 添加 lint-staged 配置**

根目录 `package.json` 中添加：

```json
"lint-staged": {
  "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
  "*.{json,css,md}": ["prettier --write"]
}
```

- [ ] **Step 5: 提交**

```bash
git add .husky/pre-commit package.json package-lock.json
git commit -m "chore: add Husky pre-commit hook with lint-staged"
```

---

### Task 9: Vitest 测试框架搭建

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json` (root)

- [ ] **Step 1: 安装依赖**

Run: `npm install -D vitest @vitest/coverage-v8 --workspace-root`

- [ ] **Step 2: 创建 vitest.config.ts**

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    include: ['**/__tests__/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['server/src/**/*.ts', 'shared/**/*.ts'],
      exclude: ['**/__tests__/**', '**/node_modules/**'],
    },
  },
});
```

- [ ] **Step 3: 添加测试脚本**

根目录 `package.json` 的 scripts 中添加：

```json
"test": "vitest run",
"test:watch": "vitest",
"test:coverage": "vitest run --coverage"
```

- [ ] **Step 4: 提交**

```bash
git add vitest.config.ts package.json package-lock.json
git commit -m "chore: add Vitest test framework configuration"
```

---

### Task 10: SM-2 算法测试

**Files:**
- Create: `server/src/__tests__/sm2.test.ts`

- [ ] **Step 1: 创建测试文件**

```typescript
import { describe, it, expect } from 'vitest';
import { calculateSM2, evaluateQuality, getWordStatus } from '../utils/sm2';

describe('calculateSM2', () => {
  it('should reset on quality < 3 (failed)', () => {
    const result = calculateSM2(1, 2.5, 10, 5);
    expect(result.repetitions).toBe(0);
    expect(result.interval).toBe(1);
    expect(result.easeFactor).toBeLessThan(2.5);
  });

  it('should increment repetitions on quality >= 3 (passed)', () => {
    const result = calculateSM2(4, 2.5, 1, 0);
    expect(result.repetitions).toBe(1);
    expect(result.interval).toBe(1);
  });

  it('should set interval to 6 on second repetition', () => {
    const result = calculateSM2(4, 2.5, 1, 1);
    expect(result.repetitions).toBe(2);
    expect(result.interval).toBe(6);
  });

  it('should calculate interval using ease factor on third+ repetition', () => {
    const result = calculateSM2(4, 2.5, 6, 2);
    expect(result.repetitions).toBe(3);
    expect(result.interval).toBe(Math.round(6 * result.easeFactor));
  });

  it('should not let ease factor drop below 1.3', () => {
    const result = calculateSM2(0, 1.3, 1, 0);
    expect(result.easeFactor).toBeGreaterThanOrEqual(1.3);
  });

  it('should return a future nextReviewAt', () => {
    const result = calculateSM2(4, 2.5, 1, 0);
    expect(result.nextReviewAt.getTime()).toBeGreaterThan(Date.now());
  });

  it('should calculate mastery level correctly for mastered words', () => {
    const result = calculateSM2(5, 2.5, 10, 4);
    expect(result.masteryLevel).toBeGreaterThanOrEqual(70);
  });

  it('should calculate low mastery for failed quality', () => {
    const result = calculateSM2(1, 2.5, 10, 4);
    expect(result.masteryLevel).toBeLessThanOrEqual(20);
  });
});

describe('evaluateQuality', () => {
  it('should return 0 for incorrect with slow response', () => {
    expect(evaluateQuality(false, 4000)).toBe(0);
  });

  it('should return 1 for incorrect with fast response', () => {
    expect(evaluateQuality(false, 2000)).toBe(1);
  });

  it('should return 5 for correct with very fast response', () => {
    expect(evaluateQuality(true, 1000)).toBe(5);
  });

  it('should return 4 for correct with moderate response', () => {
    expect(evaluateQuality(true, 3000)).toBe(4);
  });

  it('should return 3 for correct with slow response', () => {
    expect(evaluateQuality(true, 5000)).toBe(3);
  });
});

describe('getWordStatus', () => {
  it('should return mastered for high mastery', () => {
    expect(getWordStatus(95)).toBe('mastered');
  });

  it('should return reviewing for medium mastery', () => {
    expect(getWordStatus(60)).toBe('reviewing');
  });

  it('should return learning for low mastery', () => {
    expect(getWordStatus(20)).toBe('learning');
  });

  it('should return new for zero mastery', () => {
    expect(getWordStatus(0)).toBe('new');
  });
});
```

- [ ] **Step 2: 运行测试**

Run: `npm test`
Expected: 所有测试通过

- [ ] **Step 3: 提交**

```bash
git add server/src/__tests__/sm2.test.ts
git commit -m "test: add SM-2 algorithm unit tests"
```

---

### Task 11: Shared 工具函数测试

**Files:**
- Create: `shared/__tests__/memoryAlgorithm.test.ts`
- Create: `shared/__tests__/utils.test.ts`

- [ ] **Step 1: 创建 memoryAlgorithm 测试**

```typescript
import { describe, it, expect } from 'vitest';
import {
  calculateNextReview,
  getNextReviewDate,
  evaluateQuality,
  initMemoryData,
  getMasteryLabel,
  getComboBonus,
} from '../utils/memoryAlgorithm';

describe('calculateNextReview', () => {
  it('should reset on quality < 3', () => {
    const data = { easeFactor: 2.5, interval: 10, repetitions: 5, lastReview: new Date() };
    const result = calculateNextReview(data, 1);
    expect(result.repetitions).toBe(0);
    expect(result.interval).toBe(1);
  });

  it('should increment on quality >= 3', () => {
    const data = initMemoryData();
    const result = calculateNextReview(data, 4);
    expect(result.repetitions).toBe(1);
    expect(result.interval).toBe(1);
  });

  it('should set interval to 6 on second pass', () => {
    const data = { easeFactor: 2.5, interval: 1, repetitions: 1, lastReview: new Date() };
    const result = calculateNextReview(data, 4);
    expect(result.repetitions).toBe(2);
    expect(result.interval).toBe(6);
  });

  it('should not let ease factor drop below 1.3', () => {
    const data = { easeFactor: 1.3, interval: 1, repetitions: 0, lastReview: new Date() };
    const result = calculateNextReview(data, 0);
    expect(result.easeFactor).toBeGreaterThanOrEqual(1.3);
  });
});

describe('getNextReviewDate', () => {
  it('should return a date interval days in the future', () => {
    const data = { easeFactor: 2.5, interval: 5, repetitions: 2, lastReview: new Date('2026-01-01') };
    const next = getNextReviewDate(data);
    expect(next.getDate()).toBe(6);
  });
});

describe('initMemoryData', () => {
  it('should return default values', () => {
    const data = initMemoryData();
    expect(data.easeFactor).toBe(2.5);
    expect(data.interval).toBe(0);
    expect(data.repetitions).toBe(0);
  });
});

describe('getMasteryLabel', () => {
  it('should return correct labels', () => {
    expect(getMasteryLabel(95)).toBe('已掌握');
    expect(getMasteryLabel(75)).toBe('熟悉');
    expect(getMasteryLabel(55)).toBe('一般');
    expect(getMasteryLabel(35)).toBe('模糊');
    expect(getMasteryLabel(10)).toBe('陌生');
  });
});

describe('getComboBonus', () => {
  it('should return correct bonus tiers', () => {
    expect(getComboBonus(25)).toBe(50);
    expect(getComboBonus(15)).toBe(25);
    expect(getComboBonus(7)).toBe(10);
    expect(getComboBonus(3)).toBe(0);
  });
});
```

- [ ] **Step 2: 创建 utils 测试**

```typescript
import { describe, it, expect } from 'vitest';
import {
  formatStudyTime,
  formatNumber,
  calculateAccuracy,
  getTodayStr,
  isToday,
  getLevelStars,
  getStreakBadge,
} from '../utils/index';

describe('formatStudyTime', () => {
  it('should format minutes only', () => {
    expect(formatStudyTime(30)).toBe('30分钟');
  });

  it('should format hours and minutes', () => {
    expect(formatStudyTime(90)).toBe('1小时30分钟');
  });

  it('should format exact hours', () => {
    expect(formatStudyTime(120)).toBe('2小时');
  });
});

describe('formatNumber', () => {
  it('should format small numbers', () => {
    expect(formatNumber(500)).toBe('500');
  });

  it('should format thousands', () => {
    expect(formatNumber(1500)).toBe('1.5k');
  });

  it('should format ten thousands', () => {
    expect(formatNumber(25000)).toBe('2.5万');
  });
});

describe('calculateAccuracy', () => {
  it('should calculate percentage', () => {
    expect(calculateAccuracy(8, 10)).toBe(80);
  });

  it('should return 0 for zero total', () => {
    expect(calculateAccuracy(0, 0)).toBe(0);
  });

  it('should return 100 for all correct', () => {
    expect(calculateAccuracy(5, 5)).toBe(100);
  });
});

describe('getTodayStr', () => {
  it('should return YYYY-MM-DD format', () => {
    const result = getTodayStr();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('isToday', () => {
  it('should return true for today', () => {
    expect(isToday(getTodayStr())).toBe(true);
  });

  it('should return false for yesterday', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(isToday(yesterday.toISOString().split('T')[0])).toBe(false);
  });
});

describe('getLevelStars', () => {
  it('should return 3 for 100%', () => {
    expect(getLevelStars(100)).toBe(3);
  });

  it('should return 2 for 80-99%', () => {
    expect(getLevelStars(85)).toBe(2);
  });

  it('should return 1 for 60-79%', () => {
    expect(getLevelStars(65)).toBe(1);
  });

  it('should return 0 for below 60%', () => {
    expect(getLevelStars(50)).toBe(0);
  });
});

describe('getStreakBadge', () => {
  it('should return badge for 100+ days', () => {
    expect(getStreakBadge(100)).toBe('百日坚持');
  });

  it('should return badge for 30+ days', () => {
    expect(getStreakBadge(30)).toBe('月度之星');
  });

  it('should return badge for 7+ days', () => {
    expect(getStreakBadge(7)).toBe('周学达人');
  });

  it('should return null for less than 7 days', () => {
    expect(getStreakBadge(3)).toBeNull();
  });
});
```

- [ ] **Step 3: 运行测试**

Run: `npm test`
Expected: 所有测试通过

- [ ] **Step 4: 提交**

```bash
git add shared/__tests__/memoryAlgorithm.test.ts shared/__tests__/utils.test.ts
git commit -m "test: add shared memory algorithm and utils unit tests"
```

---

### Task 12: GitHub Actions CI

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: 创建 CI 配置**

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  ci:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint check
        run: npm run lint:check || true

      - name: Format check
        run: npm run format:check || true

      - name: Run tests
        run: npm test

      - name: Generate Prisma client
        run: cd server && npx prisma generate

      - name: Build server
        run: cd server && npm run build

      - name: Build web
        run: cd app/lightwords-web && npm run build
```

- [ ] **Step 2: 提交**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add GitHub Actions workflow for lint, test, and build"
```

---

## 阶段 3：生产就绪

### Task 13: Pino 日志框架

**Files:**
- Create: `server/src/utils/logger.ts`
- Modify: `server/package.json`

- [ ] **Step 1: 安装依赖**

Run: `cd server && npm install pino && npm install -D pino-pretty`

- [ ] **Step 2: 创建 logger 工具**

创建 `server/src/utils/logger.ts`：

```typescript
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport:
    process.env.NODE_ENV !== 'production'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
});
```

- [ ] **Step 3: 提交**

```bash
git add server/src/utils/logger.ts server/package.json server/package-lock.json
git commit -m "feat: add Pino structured logging framework"
```

---

### Task 14: 替换 console.log/error + 请求日志

**Files:**
- Modify: `server/src/index.ts`
- Modify: `server/src/routes/auth.ts`
- Modify: `server/src/routes/checkin.ts`

- [ ] **Step 1: 更新 index.ts 使用 logger**

替换 `server/src/index.ts` 全部内容：

```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { PrismaClient } from '@prisma/client';
import { logger } from './utils/logger';
import { globalLimiter } from './middleware/rateLimit';
import { authRouter } from './routes/auth';
import { wordRouter } from './routes/words';
import { learningRouter } from './routes/learning';
import { levelRouter } from './routes/levels';
import { achievementRouter } from './routes/achievements';
import { userRouter } from './routes/user';
import { checkinRouter } from './routes/checkin';
import { importRouter } from './routes/import';

export const prisma = new PrismaClient();

const app = express();
const PORT = process.env.PORT || 3001;

// Validate CORS_ORIGIN in production
const corsOrigin = process.env.CORS_ORIGIN;
if (process.env.NODE_ENV === 'production' && !corsOrigin) {
  logger.fatal('CORS_ORIGIN is required in production');
  process.exit(1);
}

// Security middleware
app.use(helmet());
app.use(cors({
  origin: corsOrigin || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use('/api', globalLimiter);

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    logger.info({
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: Date.now() - start,
      ip: req.ip,
    });
  });
  next();
});

// Health check
app.get('/api/health', async (_, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'ok',
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: 'connected',
    });
  } catch {
    res.status(503).json({
      status: 'unhealthy',
      database: 'disconnected',
    });
  }
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);
app.use('/api/words', wordRouter);
app.use('/api/learning', learningRouter);
app.use('/api/levels', levelRouter);
app.use('/api/achievements', achievementRouter);
app.use('/api/checkin', checkinRouter);
app.use('/api/import', importRouter);

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error({ err, req: { method: req.method, url: req.url } }, 'Unhandled error');
  const message = process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message;
  res.status(500).json({ error: message });
});

app.listen(PORT, () => {
  logger.info(`LightWords API running at http://localhost:${PORT}`);
});

// Graceful shutdown
const shutdown = async (signal: string) => {
  logger.info(`${signal} received, shutting down gracefully`);
  await prisma.$disconnect();
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
```

- [ ] **Step 2: 更新 auth.ts 使用 logger**

在 `server/src/routes/auth.ts` 顶部添加 import：

```typescript
import { logger } from '../utils/logger';
```

将所有 `console.error(` 替换为 `logger.error(`，将所有 `console.log(` 替换为 `logger.info(`。

- [ ] **Step 3: 更新 checkin.ts 使用 logger**

在 `server/src/routes/checkin.ts` 顶部添加 import：

```typescript
import { logger } from '../utils/logger';
```

将第 67 行 `console.error('Checkin error:', error)` 替换为 `logger.error({ err: error }, 'Checkin error')`。

- [ ] **Step 4: 验证编译**

Run: `cd server && npx tsc --noEmit`
Expected: 无错误

- [ ] **Step 5: 提交**

```bash
git add server/src/index.ts server/src/routes/auth.ts server/src/routes/checkin.ts
git commit -m "feat: replace console with pino logger, add request logging, enhance health check"
```

---

### Task 15: 环境变量校验

**Files:**
- Create: `server/src/utils/env.ts`
- Modify: `server/src/index.ts`
- Modify: `server/.env.example`

- [ ] **Step 1: 创建环境变量校验工具**

创建 `server/src/utils/env.ts`：

```typescript
import { logger } from './logger';

export function validateEnv(): void {
  const required = ['JWT_SECRET'];

  if (process.env.NODE_ENV === 'production') {
    required.push('CORS_ORIGIN');
  }

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    logger.fatal(`Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }

  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    logger.warn('JWT_SECRET should be at least 32 characters for security');
  }
}
```

- [ ] **Step 2: 在 index.ts 中调用校验**

在 `server/src/index.ts` 顶部 import 区域添加：

```typescript
import { validateEnv } from './utils/env';
```

在 `export const prisma = new PrismaClient();` 之前添加：

```typescript
validateEnv();
```

同时移除 index.ts 中原有的 CORS_ORIGIN 检查（已移到 env.ts 中）。

- [ ] **Step 3: 更新 .env.example**

替换 `server/.env.example` 全部内容：

```env
# === 必需 ===
# JWT 密钥，至少 32 字符，生产环境必须设置
JWT_SECRET=

# === 生产环境必需 ===
# 允许的前端域名，多个用逗号分隔
CORS_ORIGIN=

# === 可选 ===
# Refresh Token 密钥，默认为 JWT_SECRET + '-refresh'
JWT_REFRESH_SECRET=

# 数据库连接字符串，默认使用 SQLite
# DATABASE_URL="postgresql://user:password@localhost:5432/lightwords?schema=public"
DATABASE_URL="file:./dev.db"

# 服务端口
PORT=3001

# 日志级别: trace, debug, info, warn, error, fatal
LOG_LEVEL=info

# 环境
NODE_ENV=development

# === 功能开关（未配置则对应功能禁用） ===
# WECHAT_APP_ID=
# WECHAT_APP_SECRET=
# WECHAT_REDIRECT_URI=http://localhost:3000/api/auth/wechat/callback
```

- [ ] **Step 4: 验证编译**

Run: `cd server && npx tsc --noEmit`
Expected: 无错误

- [ ] **Step 5: 提交**

```bash
git add server/src/utils/env.ts server/src/index.ts server/.env.example
git commit -m "feat: add environment variable validation on startup"
```

---

### Task 16: PrismaClient 单例修复

**Files:**
- Modify: `server/src/services/exerciseGenerator.ts`

- [ ] **Step 1: 替换 PrismaClient 实例**

将 `server/src/services/exerciseGenerator.ts` 第 6-8 行：

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
```

替换为：

```typescript
import { prisma } from '../index';
```

- [ ] **Step 2: 验证编译**

Run: `cd server && npx tsc --noEmit`
Expected: 无错误

- [ ] **Step 3: 提交**

```bash
git add server/src/services/exerciseGenerator.ts
git commit -m "fix: use shared PrismaClient singleton in exerciseGenerator"
```

---

### Task 17: 移动端 API 地址修复

**Files:**
- Modify: `app/lightwords-app/src/lib/api.ts`
- Modify: `app/lightwords-app/app.json`

- [ ] **Step 1: 更新 api.ts 使用环境变量**

将 `app/lightwords-app/src/lib/api.ts` 第 1-5 行：

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = 'http://10.0.2.2:3001/api'; // Android emulator → localhost
// const API_BASE = 'http://localhost:3001/api'; // iOS simulator
// 真机调试时改为电脑局域网 IP，如 'http://192.168.1.100:3001/api'
```

替换为：

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const API_BASE =
  (Constants.expoConfig?.extra?.apiUrl as string) ||
  process.env.EXPO_PUBLIC_API_URL ||
  'http://10.0.2.2:3001/api';
```

- [ ] **Step 2: 更新 app.json 添加 extra 配置**

在 `app/lightwords-app/app.json` 的 `"scheme": "lightwords"` 之后添加：

```json
"extra": {
  "apiUrl": "http://localhost:3001/api"
}
```

- [ ] **Step 3: 提交**

```bash
git add app/lightwords-app/src/lib/api.ts app/lightwords-app/app.json
git commit -m "fix: mobile API URL from env var with emulator fallback"
```

---

## 验证清单

完成所有任务后，运行以下验证：

- [ ] `cd server && npx tsc --noEmit` — 无错误
- [ ] `npm run lint:check` — 能正常执行
- [ ] `npm run format:check` — 能正常执行
- [ ] `npm test` — 所有测试通过
- [ ] `cd server && npm run build` — 编译成功
- [ ] `cd app/lightwords-web && npm run build` — 构建成功
