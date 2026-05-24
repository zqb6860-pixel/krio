# LightWords 安全加固与生产就绪设计文档

**日期**: 2026-05-23
**状态**: 已批准
**范围**: server、lightwords-web、lightwords-app、shared

## 背景

LightWords 项目在功能开发上已趋完善，但在安全、质量和基础设施方面存在多个阻塞性问题。经评估发现：
- 4 个严重安全漏洞（JWT 硬编码密钥、CORS 通配符、无速率限制、Next.js 高危 CVE）
- 零测试覆盖、无 CI/CD 流水线
- 无结构化日志、无健康检查、环境变量管理不完善

本设计按逐阶段增量方案（方案 A）修复所有问题，共 3 个阶段。

## 阶段 1：安全加固

### 1.1 JWT 密钥管理

**问题**: `server/src/middleware/auth.ts:4` 和 `server/src/routes/auth.ts:447` 有硬编码回退密钥 `lightwords-secret-key-change-in-production`。

**修复**:
- 启动时检查 `JWT_SECRET` 环境变量，缺失则 `process.exit(1)`
- 新增 `JWT_REFRESH_SECRET`（可选，默认 `JWT_SECRET + '-refresh'`）
- 删除所有硬编码密钥字符串
- `docker-compose.yml` 移除默认 JWT_SECRET，改为必须通过环境变量注入

**文件变更**:
- `server/src/middleware/auth.ts` — 移除回退值，启动校验
- `server/src/routes/auth.ts` — 移除 447 行回退值，复用 auth.ts 导出
- `docker-compose.yml` — 移除 JWT_SECRET 默认值

### 1.2 Token 有效期调整

**当前**: Access Token 30天，Refresh Token 90天
**修复**: Access Token → 30分钟，Refresh Token → 30天

**文件变更**:
- `server/src/middleware/auth.ts` — `expiresIn: '30m'` 和 `expiresIn: '30d'`

### 1.3 CORS 配置

**问题**: `server/src/index.ts:19-22` 使用 `origin: '*'` + `credentials: true`

**修复**:
- 生产环境必须设置 `CORS_ORIGIN`，缺失则拒绝启动
- 开发环境默认 `http://localhost:3000`

**文件变更**:
- `server/src/index.ts` — 启动校验 + 移除通配符回退

### 1.4 速率限制

**新增依赖**: `express-rate-limit`

| 端点 | 限制 |
|------|------|
| `POST /api/auth/login` | 5次/分钟/IP |
| `POST /api/auth/register` | 3次/分钟/IP |
| `POST /api/auth/sms/send` | 3次/分钟/IP |
| `POST /api/auth/phone/register` | 3次/分钟/IP |
| 全局默认 | 100次/分钟/IP |

**文件变更**:
- `server/src/middleware/rateLimit.ts` — 新建，定义各端点限制
- `server/src/index.ts` — 应用全局限制
- `server/src/routes/auth.ts` — 应用路由级限制

### 1.5 Helmet 安全头

**新增依赖**: `helmet`

**文件变更**:
- `server/src/index.ts` — 添加 `app.use(helmet())`

### 1.6 SMS 验证码安全

**问题**: `server/src/routes/auth.ts:171` 使用 `Math.random()` 生成验证码

**修复**: 改用 `crypto.randomInt(100000, 1000000)`

**文件变更**:
- `server/src/routes/auth.ts` — 导入 crypto，替换 Math.random

### 1.7 WeChat/SMS 功能标记

WeChat 路由已有 503 返回（未配置时），SMS 的 `devCode` 仅在开发环境返回。保持现状，添加清晰 TODO 注释标记待集成的真实服务商。

### 1.8 其他安全修复

| 问题 | 修复 | 文件 |
|------|------|------|
| 注册错误暴露用户存在性 | 统一返回"该邮箱或用户名已被注册" | `server/src/routes/auth.ts:99-101` |
| 请求体无大小限制 | `express.json({ limit: '1mb' })` | `server/src/index.ts` |
| docker-compose 硬编码密码 | 移除默认值，改为必须注入 | `docker-compose.yml:8` |
| WeChat CSRF state 用 Math.random | 改用 `crypto.randomBytes` | `server/src/routes/auth.ts:425` |

## 阶段 2：质量基础设施

### 2.1 ESLint 配置

使用 ESLint 9 flat config 格式。

**根目录 `eslint.config.mjs`**:
- 继承 `@typescript-eslint/recommended`
- 集成 `eslint-plugin-react` + `eslint-plugin-react-hooks`
- 忽略 `node_modules`、`dist`、`.next`、`prisma`

**新增依赖**（根目录 devDependencies）:
```
eslint
@typescript-eslint/eslint-plugin
@typescript-eslint/parser
eslint-plugin-react
eslint-plugin-react-hooks
```

**各子项目 package.json 添加**:
```json
"lint": "eslint src/ --fix",
"lint:check": "eslint src/"
```

### 2.2 Prettier 配置

**根目录 `.prettierrc`**:
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

**根目录 package.json 添加**:
```json
"format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,css}\"",
"format:check": "prettier --check \"**/*.{ts,tsx,js,jsx,json,css}\""
```

### 2.3 Pre-commit Hooks

**新增依赖**（根目录 devDependencies）: `husky`, `lint-staged`

**配置**:
- `.husky/pre-commit` 执行 `lint-staged`
- `lint-staged` 配置（根目录 `package.json`）:
  - `*.{ts,tsx}` → `eslint --fix` + `prettier --write`
  - `*.{json,css,md}` → `prettier --write`

### 2.4 单元测试

**选型**: Vitest

**新增依赖**（根目录 devDependencies）: `vitest`, `@vitest/coverage-v8`

**测试文件**:

| 文件 | 测试内容 |
|------|----------|
| `server/src/__tests__/auth.test.ts` | Token 生成/验证/过期、Zod 校验 |
| `server/src/__tests__/sm2.test.ts` | SM-2 算法正确性 |
| `shared/__tests__/memoryAlgorithm.test.ts` | 记忆保持率、连击奖励 |
| `shared/__tests__/utils.test.ts` | 格式化函数、准确率计算 |

**根目录 package.json**:
```json
"test": "vitest run",
"test:watch": "vitest",
"test:coverage": "vitest run --coverage"
```

### 2.5 CI 流水线

**新增文件**: `.github/workflows/ci.yml`

**触发**: push 到 main、PR 到 main

**步骤**:
1. checkout + setup node 20
2. `npm ci`
3. `npm run lint:check`
4. `npm run format:check`
5. `npm run test`
6. `cd server && npx prisma generate && npm run build`
7. `cd app/lightwords-web && npm run build`

## 阶段 3：生产就绪

### 3.1 结构化日志

**选型**: Pino

**新增依赖**: `pino`, `pino-pretty`(dev), `express-pino-logger`

**新增文件**: `server/src/utils/logger.ts`

**变更**:
- 替换所有 `console.log` / `console.error` 为 `logger.info` / `logger.error`
- 添加请求日志中间件（method、url、status、duration、ip）

### 3.2 健康检查增强

**当前**: `/api/health` 仅返回 `{ status: 'ok' }`

**增强为**: 包含数据库连接状态、版本号、运行时间

### 3.3 环境变量管理

**完善 `server/.env.example`**: 列出所有环境变量及说明

**启动校验**（新增 `server/src/utils/env.ts`）:
- `JWT_SECRET` — 必需
- `CORS_ORIGIN` — 生产环境必需
- 其他变量可选

### 3.4 错误处理统一

- 全局错误处理器使用 `logger.error` 记录完整错误
- 生产环境向客户端返回通用错误消息，不暴露详情
- 各路由中的 `console.error` 统一替换

### 3.5 数据库安全

- `exerciseGenerator.ts` 中重复 PrismaClient 改为复用 `index.ts` 导出
- Graceful Shutdown 增强（SIGTERM + SIGINT）

### 3.6 移动端 API 地址

**当前**: 硬编码 `http://10.0.2.2:3001/api`

**修复**: 使用 Expo Constants + 环境变量 + 合理默认值

## 依赖变更汇总

### 新增依赖

| 包 | 位置 | 用途 |
|----|------|------|
| `express-rate-limit` | server | 速率限制 |
| `helmet` | server | 安全头 |
| `pino` | server | 结构化日志 |
| `pino-pretty` | server (dev) | 开发环境日志格式化 |
| `eslint` | root (dev) | 代码检查 |
| `@typescript-eslint/*` | root (dev) | TS ESLint 支持 |
| `eslint-plugin-react` | root (dev) | React ESLint 支持 |
| `eslint-plugin-react-hooks` | root (dev) | Hooks ESLint 支持 |
| `prettier` | root (dev) | 代码格式化 |
| `husky` | root (dev) | Git hooks |
| `lint-staged` | root (dev) | 暂存文件检查 |
| `vitest` | root (dev) | 测试框架 |
| `@vitest/coverage-v8` | root (dev) | 测试覆盖率 |

### 文件变更清单

| 文件 | 变更类型 | 阶段 |
|------|----------|------|
| `server/src/middleware/auth.ts` | 修改 | 1 |
| `server/src/index.ts` | 修改 | 1 |
| `server/src/routes/auth.ts` | 修改 | 1 |
| `server/src/middleware/rateLimit.ts` | 新建 | 1 |
| `server/package.json` | 修改 | 1 |
| `docker-compose.yml` | 修改 | 1 |
| `eslint.config.mjs` | 新建 | 2 |
| `.prettierrc` | 新建 | 2 |
| `.husky/pre-commit` | 新建 | 2 |
| `package.json` (root) | 修改 | 2 |
| `server/src/__tests__/auth.test.ts` | 新建 | 2 |
| `server/src/__tests__/sm2.test.ts` | 新建 | 2 |
| `shared/__tests__/memoryAlgorithm.test.ts` | 新建 | 2 |
| `shared/__tests__/utils.test.ts` | 新建 | 2 |
| `.github/workflows/ci.yml` | 新建 | 2 |
| `server/src/utils/logger.ts` | 新建 | 3 |
| `server/src/utils/env.ts` | 新建 | 3 |
| `server/.env.example` | 修改 | 3 |
| `server/src/services/exerciseGenerator.ts` | 修改 | 3 |
| `app/lightwords-app/src/lib/api.ts` | 修改 | 3 |
| `app/lightwords-app/app.json` | 修改 | 3 |

## 验证方式

每个阶段完成后：
1. `npm run lint:check` — 无错误
2. `npm run format:check` — 无差异
3. `npm run test` — 全部通过
4. `cd server && npm run build` — 编译成功
5. `cd app/lightwords-web && npm run build` — 构建成功
