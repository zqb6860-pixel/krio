#!/bin/bash
# LightWords 后端一键启动脚本
# 无需 Docker，只需 Node.js >= 18

echo "🚀 LightWords 后端环境配置..."
echo ""

# 1. Install dependencies
echo "📦 安装依赖..."
npm install

# 2. Copy env if not exists
if [ ! -f .env ]; then
  cp .env.example .env
  echo "✅ 已创建 .env 配置文件"
fi

# 3. Generate Prisma client
echo "🔧 生成 Prisma Client..."
npx prisma generate

# 4. Create database & tables
echo "🗄️  创建 SQLite 数据库..."
npx prisma db push

# 5. Seed data
echo "🌱 导入初始数据 (词库 + 演示用户)..."
npx tsx prisma/seed.ts

echo ""
echo "✅ 配置完成！"
echo ""
echo "📋 启动方式："
echo "   npm run dev"
echo ""
echo "🔑 演示账号："
echo "   邮箱: demo@lightwords.app"
echo "   密码: demo123456"
echo ""
echo "🌐 API 地址: http://localhost:3001"
