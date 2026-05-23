FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache openssl

COPY package.json ./
RUN npm install

COPY prisma ./prisma/
# Docker 环境使用 PostgreSQL，替换 sqlite provider
RUN sed -i 's/provider = "sqlite"/provider = "postgresql"/' prisma/schema.prisma
ENV DATABASE_URL="postgresql://postgres:postgres@db:5432/lightwords?schema=public"
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src/
COPY data ./data/
RUN npx tsc

FROM node:20-alpine AS runner

WORKDIR /app

RUN apk add --no-cache openssl

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./

EXPOSE 3001

CMD ["sh", "-c", "sed -i 's/provider = \"sqlite\"/provider = \"postgresql\"/' prisma/schema.prisma && npx prisma db push --skip-generate && node dist/index.js"]
