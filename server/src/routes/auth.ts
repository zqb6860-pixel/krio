import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../index';
import { generateToken, generateRefreshToken, verifyRefreshToken } from '../middleware/auth';
import { authLimiter, registerLimiter, smsLimiter } from '../middleware/rateLimit';
import { logger } from '../utils/logger';

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

const phoneLoginSchema = z.object({
  phone: z.string().regex(/^1[3-9]\d{9}$/, '请输入有效的手机号'),
  code: z.string().length(6, '验证码为6位数字'),
});

const sendCodeSchema = z.object({
  phone: z.string().regex(/^1[3-9]\d{9}$/, '请输入有效的手机号'),
  type: z.enum(['login', 'register', 'bind']).default('login'),
});

const phoneRegisterSchema = z.object({
  phone: z.string().regex(/^1[3-9]\d{9}$/, '请输入有效的手机号'),
  code: z.string().length(6, '验证码为6位数字'),
  username: z.string().min(2, '用户名至少2个字符').max(20, '用户名最多20个字符'),
  password: z.string().min(6, '密码至少6个字符').optional(),
});

const wechatLoginSchema = z.object({
  code: z.string().min(1, '微信授权码不能为空'),
});

// ===== Helper: Create user response =====
function buildUserResponse(user: any) {
  return {
    id: user.id,
    email: user.email,
    phone: user.phone,
    username: user.username,
    avatar: user.avatar,
    level: user.level,
    experience: user.experience,
    coins: user.coins,
    hearts: user.hearts,
    streak: user.streak,
    settings: user.settings,
  };
}

// ===== Helper: Create new user with defaults =====
async function createNewUser(data: {
  email?: string;
  phone?: string;
  username: string;
  passwordHash?: string;
  avatar?: string;
  wechatOpenId?: string;
  wechatUnionId?: string;
}) {
  const user = await prisma.user.create({
    data: {
      ...data,
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

  return user;
}

// ===== POST /api/auth/register (Email) =====
authRouter.post('/register', registerLimiter, async (req: Request, res: Response) => {
  try {
    const body = registerSchema.parse(req.body);

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email: body.email }, { username: body.username }] },
    });
    if (existing) {
      return res.status(409).json({ error: '该邮箱或用户名已被注册' });
    }

    const passwordHash = await bcrypt.hash(body.password, 12);
    const user = await createNewUser({ email: body.email, username: body.username, passwordHash });

    const token = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    res.status(201).json({ user: buildUserResponse(user), token, refreshToken });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    logger.error({ err: error }, 'Register error');
    res.status(500).json({ error: '注册失败，请稍后重试' });
  }
});

// ===== POST /api/auth/login (Email + Password) =====
authRouter.post('/login', authLimiter, async (req: Request, res: Response) => {
  try {
    const body = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: body.email },
      include: { settings: true },
    });

    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: '邮箱或密码错误' });
    }

    const valid = await bcrypt.compare(body.password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: '邮箱或密码错误' });
    }

    const token = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    res.json({ user: buildUserResponse(user), token, refreshToken });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: '请输入有效的邮箱和密码' });
    }
    logger.error({ err: error }, 'Login error');
    res.status(500).json({ error: '登录失败，请稍后重试' });
  }
});

// ===== POST /api/auth/sms/send - 发送短信验证码 =====
authRouter.post('/sms/send', smsLimiter, async (req: Request, res: Response) => {
  try {
    const body = sendCodeSchema.parse(req.body);

    // 限流: 60秒内不能重复发送
    const recent = await prisma.smsCode.findFirst({
      where: {
        phone: body.phone,
        createdAt: { gt: new Date(Date.now() - 60 * 1000) },
      },
    });
    if (recent) {
      return res.status(429).json({ error: '发送过于频繁，请60秒后重试' });
    }

    // 生成6位随机验证码
    const code = String(crypto.randomInt(100000, 1000000));

    // 存储验证码 (5分钟过期)
    await prisma.smsCode.create({
      data: {
        phone: body.phone,
        code,
        type: body.type,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
    });

    // TODO: 接入真实短信服务商 (阿里云SMS / 腾讯云SMS)
    // 开发环境直接返回验证码 (生产环境删除此行)
    logger.info({ phone: body.phone }, 'SMS code sent');

    res.json({
      success: true,
      message: '验证码已发送',
      // 开发环境返回验证码便于测试 (生产环境移除)
      ...(process.env.NODE_ENV !== 'production' && { devCode: code }),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    logger.error({ err: error }, 'Send SMS error');
    res.status(500).json({ error: '验证码发送失败，请稍后重试' });
  }
});

// ===== POST /api/auth/sms/login - 手机号验证码登录 (自动注册) =====
authRouter.post('/sms/login', async (req: Request, res: Response) => {
  try {
    const body = phoneLoginSchema.parse(req.body);

    // 验证验证码
    const smsCode = await prisma.smsCode.findFirst({
      where: {
        phone: body.phone,
        code: body.code,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!smsCode) {
      return res.status(401).json({ error: '验证码错误或已过期' });
    }

    // 标记验证码已使用
    await prisma.smsCode.update({
      where: { id: smsCode.id },
      data: { used: true },
    });

    // 查找是否已有该手机号用户
    let user = await prisma.user.findUnique({
      where: { phone: body.phone },
      include: { settings: true },
    });

    if (!user) {
      // 自动注册: 生成默认用户名
      const username = `用户${body.phone.slice(-4)}${Math.floor(Math.random() * 100)}`;
      user = await createNewUser({ phone: body.phone, username });
    }

    const token = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    res.json({
      user: buildUserResponse(user),
      token,
      refreshToken,
      isNewUser: !user.email, // 提示前端是否需要完善资料
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    logger.error({ err: error }, 'Phone login error');
    res.status(500).json({ error: '登录失败，请稍后重试' });
  }
});

// ===== POST /api/auth/phone/register - 手机号注册 (带用户名) =====
authRouter.post('/phone/register', registerLimiter, async (req: Request, res: Response) => {
  try {
    const body = phoneRegisterSchema.parse(req.body);

    // 验证验证码
    const smsCode = await prisma.smsCode.findFirst({
      where: {
        phone: body.phone,
        code: body.code,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!smsCode) {
      return res.status(401).json({ error: '验证码错误或已过期' });
    }

    // 标记验证码已使用
    await prisma.smsCode.update({
      where: { id: smsCode.id },
      data: { used: true },
    });

    // 检查手机号和用户名唯一性
    const existing = await prisma.user.findFirst({
      where: { OR: [{ phone: body.phone }, { username: body.username }] },
    });
    if (existing) {
      return res.status(409).json({ error: '该手机号或用户名已被注册' });
    }

    const passwordHash = body.password ? await bcrypt.hash(body.password, 12) : undefined;
    const user = await createNewUser({
      phone: body.phone,
      username: body.username,
      passwordHash,
    });

    const token = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    res.status(201).json({ user: buildUserResponse(user), token, refreshToken });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    logger.error({ err: error }, 'Phone register error');
    res.status(500).json({ error: '注册失败，请稍后重试' });
  }
});

// ===== POST /api/auth/wechat/login - 微信登录 =====
authRouter.post('/wechat/login', async (req: Request, res: Response) => {
  try {
    const body = wechatLoginSchema.parse(req.body);

    // TODO: 使用微信开放平台API换取access_token和用户信息
    // 1. 用code换取access_token: https://api.weixin.qq.com/sns/oauth2/access_token
    // 2. 用access_token获取用户信息: https://api.weixin.qq.com/sns/userinfo
    //
    // 需要在 .env 中配置:
    // WECHAT_APP_ID=your_app_id
    // WECHAT_APP_SECRET=your_app_secret

    const WECHAT_APP_ID = process.env.WECHAT_APP_ID;
    const WECHAT_APP_SECRET = process.env.WECHAT_APP_SECRET;

    if (!WECHAT_APP_ID || !WECHAT_APP_SECRET) {
      return res.status(503).json({
        error: '微信登录功能暂未配置，请使用其他方式登录',
        hint: '需要在服务器配置 WECHAT_APP_ID 和 WECHAT_APP_SECRET',
      });
    }

    // 调用微信API获取用户信息
    const tokenUrl = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${WECHAT_APP_ID}&secret=${WECHAT_APP_SECRET}&code=${body.code}&grant_type=authorization_code`;

    const tokenRes = await fetch(tokenUrl);
    const tokenData = await tokenRes.json();

    if (tokenData.errcode) {
      logger.error({ data: tokenData }, 'WeChat token error');
      return res.status(401).json({ error: '微信授权失败，请重试' });
    }

    const { access_token, openid, unionid } = tokenData;

    // 获取用户信息
    const userInfoUrl = `https://api.weixin.qq.com/sns/userinfo?access_token=${access_token}&openid=${openid}&lang=zh_CN`;
    const userInfoRes = await fetch(userInfoUrl);
    const wechatUser = await userInfoRes.json();

    if (wechatUser.errcode) {
      logger.error({ data: wechatUser }, 'WeChat userinfo error');
      return res.status(401).json({ error: '获取微信用户信息失败' });
    }

    // 查找已绑定用户
    let user = await prisma.user.findFirst({
      where: {
        OR: [{ wechatOpenId: openid }, ...(unionid ? [{ wechatUnionId: unionid }] : [])],
      },
      include: { settings: true },
    });

    if (!user) {
      // 自动创建新用户
      const username = wechatUser.nickname || `微信用户${openid.slice(-6)}`;
      // 确保用户名唯一
      let finalUsername = username;
      let suffix = 1;
      while (await prisma.user.findUnique({ where: { username: finalUsername } })) {
        finalUsername = `${username}${suffix}`;
        suffix++;
      }

      user = await createNewUser({
        username: finalUsername,
        avatar: wechatUser.headimgurl,
        wechatOpenId: openid,
        wechatUnionId: unionid,
      });
    }

    const token = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    res.json({
      user: buildUserResponse(user),
      token,
      refreshToken,
      isNewUser: !user.email && !user.phone,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    logger.error({ err: error }, 'WeChat login error');
    res.status(500).json({ error: '微信登录失败，请稍后重试' });
  }
});

// ===== GET /api/auth/wechat/qrcode - 获取微信登录二维码参数 =====
authRouter.get('/wechat/qrcode', async (_req: Request, res: Response) => {
  const WECHAT_APP_ID = process.env.WECHAT_APP_ID;
  const WECHAT_REDIRECT_URI =
    process.env.WECHAT_REDIRECT_URI || 'http://localhost:3000/api/auth/wechat/callback';

  if (!WECHAT_APP_ID) {
    return res.status(503).json({
      error: '微信登录暂未开通',
      configured: false,
    });
  }

  // 生成随机state防止CSRF
  const state = crypto.randomBytes(16).toString('hex');

  res.json({
    configured: true,
    appId: WECHAT_APP_ID,
    redirectUri: WECHAT_REDIRECT_URI,
    state,
    // 前端用这些参数构建微信扫码页面的URL
    qrcodeUrl: `https://open.weixin.qq.com/connect/qrconnect?appid=${WECHAT_APP_ID}&redirect_uri=${encodeURIComponent(WECHAT_REDIRECT_URI)}&response_type=code&scope=snsapi_login&state=${state}#wechat_redirect`,
  });
});

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
