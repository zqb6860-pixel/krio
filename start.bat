@echo off
chcp 65001 >nul
echo ======================================
echo   LightWords 简词 - Windows 一键启动
echo ======================================
echo.

REM --- Backend Setup ---
echo [1/4] 配置后端...
cd server

if not exist "node_modules" (
    echo    安装后端依赖...
    call npm install
)

if not exist ".env" (
    copy .env.example .env >nul
    echo    已创建 .env 配置文件
)

echo    生成 Prisma Client...
call npx prisma generate

if not exist "prisma\dev.db" (
    echo    创建 SQLite 数据库...
    call npx prisma db push
    echo    导入初始数据...
    call npx tsx prisma/seed.ts
)

cd ..

REM --- Frontend Setup ---
echo.
echo [2/4] 配置前端...
cd app\lightwords-web

if not exist "node_modules" (
    echo    安装前端依赖...
    call npm install
)

cd ..\..

echo.
echo ======================================
echo   配置完成！请分别启动前后端：
echo ======================================
echo.
echo   后端（在 server 目录下）:
echo     cd server
echo     npm run dev
echo.
echo   前端（新开窗口，在 app\lightwords-web 目录下）:
echo     cd app\lightwords-web
echo     npm run dev
echo.
echo   然后打开浏览器访问:
echo     http://localhost:3000
echo.
echo   演示账号:
echo     邮箱: demo@lightwords.app
echo     密码: demo123456
echo ======================================
echo.
pause
