#!/bin/sh
set -e

echo "🔧 准备数据库..."

# 替换 sqlite 为 postgresql
sed -i 's/provider = "sqlite"/provider = "postgresql"/' prisma/schema.prisma

# 推送数据库 schema
npx prisma db push --skip-generate

# 检查是否需要 seed（如果 word_books 表为空则导入）
WORD_COUNT=$(node -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.wordBook.count().then(c => { console.log(c); p.\$disconnect(); }).catch(() => { console.log(0); p.\$disconnect(); });
" 2>/dev/null || echo "0")

if [ "$WORD_COUNT" = "0" ]; then
  echo "📦 首次启动，导入词库数据..."
  node dist/prisma/seed.js 2>/dev/null || echo "⚠️  Seed 脚本未编译，跳过自动导入。请手动运行: npm install -g tsx && tsx prisma/seed.ts"
fi

echo "🚀 启动服务器..."
exec node dist/src/index.js
