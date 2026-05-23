# LightWords 简词 - 英语学习应用

一款融合科学记忆算法与趣味化学习机制的英语学习应用，支持 Web 和移动端。

## 技术栈

| 层级 | 技术 |
|------|------|
| 后端 API | Node.js + Express + TypeScript + Prisma |
| 数据库 | PostgreSQL |
| Web 前端 | Next.js 14 + React + Tailwind CSS |
| 移动端 | Expo 51 + React Native |
| 状态管理 | Zustand |
| 认证 | JWT + bcrypt |
| 记忆算法 | SM-2 间隔重复 |

## 项目结构

```
krio/
├── server/              # 后端 API 服务
│   ├── src/
│   │   ├── routes/      # API 路由
│   │   ├── middleware/  # 认证中间件
│   │   ├── services/    # 业务逻辑
│   │   └── utils/       # SM-2 算法等工具
│   └── prisma/          # 数据库 Schema + Seed
├── app/
│   ├── lightwords-web/  # Next.js Web 端
│   └── lightwords-app/  # React Native 移动端
├── shared/              # 共享代码层
│   ├── types/           # TypeScript 类型
│   ├── store/           # Zustand 状态管理
│   └── utils/           # 工具函数
└── docker-compose.yml   # 一键部署
```

## 快速开始

### 1. 数据库 (PostgreSQL)

```bash
# 使用 Docker 启动 PostgreSQL
docker run -d --name lightwords-db \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=lightwords \
  -p 5432:5432 postgres:16-alpine
```

### 2. 后端 API

```bash
cd server
cp .env.example .env  # 配置环境变量
npm install
npx prisma db push    # 创建数据库表
npx prisma db seed    # 导入初始数据（含CET-4词库+演示用户）
npm run dev           # 启动开发服务器 http://localhost:3001
```

### 3. Web 前端

```bash
cd app/lightwords-web
npm install
npm run dev           # 启动开发服务器 http://localhost:3000
```

### 4. 移动端

```bash
cd app/lightwords-app
npm install
npx expo start        # 使用 Expo Go 扫码预览
```

### Docker 一键部署

```bash
docker-compose up -d
# Web: http://localhost:3000
# API: http://localhost:3001
```

## 演示账号

- 邮箱: `demo@lightwords.app`
- 密码: `demo123456`

## 核心功能

- **单词学习**: 词根词缀记忆法 + 语境例句 + 词组搭配
- **智能复习**: SM-2 遗忘曲线算法，精准计算最佳复习时间
- **闯关模式**: 游戏化学习，连击系统 + 生命值 + 星级评价
- **打卡系统**: 连续打卡统计 + 成就解锁
- **数据分析**: 学习日历 + 掌握度分布 + 能力雷达图
- **多词库**: CET-4/6、高考、雅思、考研等系统词库

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/register | 用户注册 |
| POST | /api/auth/login | 用户登录 |
| GET | /api/user/profile | 获取用户信息 |
| GET | /api/words/today | 获取今日学习单词 |
| GET | /api/words/books | 获取词库列表 |
| POST | /api/learning/record | 记录学习结果 |
| GET | /api/learning/review | 获取待复习单词 |
| GET | /api/learning/stats | 获取学习统计 |
| GET | /api/levels/paths | 获取闯关路径 |
| POST | /api/levels/:id/complete | 提交关卡结果 |
| POST | /api/checkin | 每日打卡 |
| GET | /api/achievements | 获取成就列表 |

## License

MIT
