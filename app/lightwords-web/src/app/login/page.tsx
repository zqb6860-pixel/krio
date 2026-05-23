'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

type LoginMethod = 'phone' | 'email' | 'wechat';

export default function LoginPage() {
  const { login, loginByPhone, loginByWechat } = useAuth();
  const router = useRouter();
  const [method, setMethod] = useState<LoginMethod>('phone');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Email login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Phone login state
  const [phone, setPhone] = useState('');
  const [smsCode, setSmsCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [sendingCode, setSendingCode] = useState(false);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // WeChat state
  const [wechatConfigured, setWechatConfigured] = useState<boolean | null>(null);
  const [wechatQrUrl, setWechatQrUrl] = useState('');

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      countdownRef.current = setTimeout(() => setCountdown(c => c - 1), 1000);
    }
    return () => { if (countdownRef.current) clearTimeout(countdownRef.current); };
  }, [countdown]);

  // Check wechat config when tab selected
  useEffect(() => {
    if (method === 'wechat' && wechatConfigured === null) {
      api.getWechatQrcode().then(data => {
        setWechatConfigured(data.configured);
        if (data.qrcodeUrl) setWechatQrUrl(data.qrcodeUrl);
      }).catch(() => setWechatConfigured(false));
    }
  }, [method]);

  const handleSendCode = async () => {
    if (!phone || countdown > 0 || sendingCode) return;
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      setError('请输入有效的手机号');
      return;
    }
    setError('');
    setSendingCode(true);
    try {
      const result = await api.sendSmsCode(phone, 'login');
      setCountdown(60);
      // 开发环境自动填充验证码
      if (result.devCode) {
        setSmsCode(result.devCode);
      }
    } catch (err: any) {
      setError(err.message || '验证码发送失败');
    } finally {
      setSendingCode(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      router.push('/');
    } catch (err: any) {
      setError(err.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      setError('请输入有效的手机号');
      return;
    }
    if (smsCode.length !== 6) {
      setError('请输入6位验证码');
      return;
    }
    setLoading(true);
    try {
      await loginByPhone(phone, smsCode);
      router.push('/');
    } catch (err: any) {
      setError(err.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  const methodTabs = [
    { key: 'phone' as const, label: '手机号登录', icon: '📱' },
    { key: 'email' as const, label: '邮箱登录', icon: '📧' },
    { key: 'wechat' as const, label: '微信登录', icon: '💬' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4 shadow-lg shadow-blue-500/25 animate-breathe">
            L
          </div>
          <h1 className="text-2xl font-bold text-slate-800">欢迎来到 LightWords</h1>
          <p className="text-slate-500 mt-1">登录账号，继续你的学习之旅</p>
        </div>

        {/* Login Card */}
        <div className="glass-card p-6 space-y-5">
          {/* Method Tabs */}
          <div className="flex gap-1 p-1 bg-slate-100 rounded-xl">
            {methodTabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => { setMethod(tab.key); setError(''); }}
                className={`flex-1 px-3 py-2.5 text-xs rounded-lg transition-all font-medium ${
                  method === tab.key
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <span className="mr-1">{tab.icon}</span> {tab.label}
              </button>
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 animate-fadeIn">
              {error}
            </div>
          )}

          {/* Phone Login Form */}
          {method === 'phone' && (
            <form onSubmit={handlePhoneLogin} className="space-y-4 animate-fadeIn">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">手机号</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">+86</span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                    className="w-full pl-14 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                    placeholder="请输入手机号"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">验证码</label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={smsCode}
                    onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="flex-1 px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all tracking-widest text-center font-mono"
                    placeholder="6位验证码"
                    maxLength={6}
                    required
                  />
                  <button
                    type="button"
                    onClick={handleSendCode}
                    disabled={countdown > 0 || sendingCode || phone.length !== 11}
                    className="px-4 py-3 bg-blue-50 text-blue-600 font-medium text-sm rounded-xl hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap min-w-[110px]"
                  >
                    {sendingCode ? '发送中...' : countdown > 0 ? `${countdown}s 后重发` : '获取验证码'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 gradient-primary text-white font-semibold rounded-xl hover:opacity-90 transition-all disabled:opacity-50 active:scale-[0.98] shadow-md shadow-blue-500/20"
              >
                {loading ? '登录中...' : '登录 / 注册'}
              </button>

              <p className="text-center text-xs text-slate-400">
                未注册手机号将自动创建新账户
              </p>
            </form>
          )}

          {/* Email Login Form */}
          {method === 'email' && (
            <form onSubmit={handleEmailLogin} className="space-y-4 animate-fadeIn">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">邮箱</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">密码</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                  placeholder="输入密码"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 gradient-primary text-white font-semibold rounded-xl hover:opacity-90 transition-all disabled:opacity-50 active:scale-[0.98] shadow-md shadow-blue-500/20"
              >
                {loading ? '登录中...' : '登录'}
              </button>

              <div className="text-center text-xs text-slate-400 pt-1">
                演示账号: demo@lightwords.app / demo123456
              </div>
            </form>
          )}

          {/* WeChat Login */}
          {method === 'wechat' && (
            <div className="text-center py-6 animate-fadeIn">
              {wechatConfigured === null ? (
                <div className="py-8">
                  <div className="w-8 h-8 border-3 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">检查微信登录配置...</p>
                </div>
              ) : wechatConfigured ? (
                <>
                  {/* WeChat QR Code Area */}
                  <div className="w-48 h-48 mx-auto bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center mb-4">
                    <div className="text-center">
                      <span className="text-4xl block mb-2">📱</span>
                      <p className="text-xs text-slate-400">微信扫码区域</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 font-medium">请使用微信扫描二维码登录</p>
                  <p className="text-xs text-slate-400 mt-1">扫描后在微信中确认授权</p>
                  {wechatQrUrl && (
                    <a
                      href={wechatQrUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-4 px-5 py-2.5 bg-[#07C160] text-white text-sm font-medium rounded-xl hover:bg-[#06AD56] transition-colors"
                    >
                      💬 打开微信授权页面
                    </a>
                  )}
                </>
              ) : (
                <div className="py-6">
                  <div className="w-20 h-20 mx-auto bg-green-50 rounded-2xl flex items-center justify-center mb-4">
                    <span className="text-4xl">💬</span>
                  </div>
                  <h3 className="text-base font-semibold text-slate-700 mb-2">微信登录暂未开通</h3>
                  <p className="text-sm text-slate-500 max-w-xs mx-auto leading-relaxed">
                    微信登录需要配置微信开放平台应用。请使用手机号或邮箱登录。
                  </p>
                  <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-100">
                    <p className="text-xs text-amber-700">
                      💡 提示：需要在服务器配置 WECHAT_APP_ID 和 WECHAT_APP_SECRET 后才能使用微信登录
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Divider */}
          {method !== 'wechat' && (
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-3 text-slate-400">或</span>
              </div>
            </div>
          )}

          {/* Bottom Links */}
          {method !== 'wechat' && (
            <div className="text-center text-sm text-slate-500">
              还没有账号？{' '}
              <Link href="/register" className="text-blue-600 font-medium hover:underline">
                立即注册
              </Link>
            </div>
          )}
        </div>

        {/* Agreement */}
        <p className="text-center text-[11px] text-slate-400 mt-4 px-8">
          登录即表示同意 <span className="text-slate-500 cursor-pointer hover:underline">用户协议</span> 和 <span className="text-slate-500 cursor-pointer hover:underline">隐私政策</span>
        </p>
      </div>
    </div>
  );
}
