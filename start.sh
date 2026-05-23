#!/bin/bash
# LightWords 全栈一键启动脚本
# 前提: Node.js >= 18

set -e

echo "======================================"
echo "  LightWords 简词 - 一键启动"
echo "======================================"
echo ""

# --- Backend Setup ---
echo "🔧 [1/4] 配置后端..."
cd server

if [ ! -d "node_modules" ]; then
  echo "   📦 安装后端依赖..."
  npm install
fi

if [ ! -f ".env" ]; then
  cp .env.example .env
  echo "   ✅ 已创建 .env"
fi

echo "   🔧 生成 Prisma Client..."
npx prisma generate --quiet

if [ ! -f "prisma/dev.db" ]; then
  echo "   🗄️  创建数据库..."
  npx prisma db push --quiet
  echo "   🌱 导入初始数据..."
  npx tsx prisma/seed.ts
fi

cd ..

# --- Frontend Setup ---
echo ""
echo "🔧 [2/4] 配置前端..."
cd app/lightwords-web

if [ ! -d "node_modules" ]; then
  echo "   📦 安装前端依赖..."
  npm install
fi

cd ../..

# --- Start Backend ---
echo ""
echo "🚀 [3/4] 启动后端 API (端口 3001)..."
cd server
npm run dev &
BACKEND_PID=$!
cd ..

# Wait for backend to be ready
sleep 3

# --- Start Frontend ---
echo ""
echo "🚀 [4/4] 启动 Web 前端 (端口 3000)..."
cd app/lightwords-web
npm run dev &
FRONTEND_PID=$!
cd ../..

echo ""
echo "======================================"
echo "  ✅ 全部启动完成！"
echo "======================================"
echo ""
echo "  🌐 Web 前端:  http://localhost:3000"
echo "  🔌 API 后端:  http://localhost:3001"
echo ""
echo "  🔑 演示账号:"
echo "     邮箱: demo@lightwords.app"
echo "     密码: demo123456"
echo ""
echo "  按 Ctrl+C 停止所有服务"
echo "======================================"

# Wait for either process to exit
wait $BACKEND_PID $FRONTEND_PID
