import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../index';
import { generateToken, generateRefreshToken } from '../middleware/auth';

export const authRouter = Router();

const registerSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  username: z.string().min(2, '用户名至少2个字符').max(20, '用户名最多20个字符'),
  password: z.string().min(6, '密码至少6个字符'),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// POST /api/auth/register
authRouter.post('/register', async (req: Request, res: Response) => {
  try {
    const body = registerSchema.parse(req.body);

    // Check if email/username exists
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email: body.email }, { username: body.username }] },
    });
    if (existing) {
      return res.status(409).json({
        error: existing.email === body.email ? '邮箱已被注册' : '用户名已被占用',
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(body.password, 12);

    // Create user + default settings
    const user = await prisma.user.create({
      data: {
        email: body.email,
        username: body.username,
        passwordHash,
        settings: {
          create: {
            dailyWordGoal: 30,
            dailyTimeGoal: 30,
          },
        },
      },
      include: { settings: true },
    });

    // Initialize achievements for new user
    const achievements = await prisma.achievement.findMany();
    if (achievements.length > 0) {
      await prisma.userAchievement.createMany({
        data: achievements.map((a) => ({
          userId: user.id,
          achievementId: a.id,
          progress: 0,
        })),
      });
    }

    const token = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        level: user.level,
        experience: user.experience,
        coins: user.coins,
        hearts: user.hearts,
        streak: user.streak,
        settings: user.settings,
      },
      token,
      refreshToken,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Register error:', error);
    res.status(500).json({ error: '注册失败，请稍后重试' });
  }
});

// POST /api/auth/login
authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const body = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: body.email },
      include: { settings: true },
    });

    if (!user) {
      return res.status(401).json({ error: '邮箱或密码错误' });
    }

    const valid = await bcrypt.compare(body.password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: '邮箱或密码错误' });
    }

    const token = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        avatar: user.avatar,
        level: user.level,
        experience: user.experience,
        coins: user.coins,
        hearts: user.hearts,
        streak: user.streak,
        settings: user.settings,
      },
      token,
      refreshToken,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: '请输入有效的邮箱和密码' });
    }
    console.error('Login error:', error);
    res.status(500).json({ error: '登录失败，请稍后重试' });
  }
});

// POST /api/auth/refresh
authRouter.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: 'Missing refresh token' });
    }

    const jwt = await import('jsonwebtoken');
    const secret = process.env.JWT_SECRET || 'lightwords-secret-key-change-in-production';
    const payload = jwt.default.verify(refreshToken, secret) as { userId: string; type?: string };

    if (payload.type !== 'refresh') {
      return res.status(401).json({ error: 'Invalid token type' });
    }

    const newToken = generateToken(payload.userId);
    res.json({ token: newToken });
  } catch {
    res.status(401).json({ error: 'Token 已过期' });
  }
});
