'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

type RegisterMethod = 'phone' | 'email';

export default function RegisterPage() {
  const { register, registerByPhone } = useAuth();
  const router = useRouter();
  const [method, setMethod] = useState<RegisterMethod>('phone');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Common
  const [username, setUsername] = useState('');

  // Email register
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  // Phone register
  const [phone, setPhone] = useState('');
  const [smsCode, setSmsCode] = useState('');
  const [phonePassword, setPhonePassword] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [sendingCode, setSendingCode] = useState(false);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (countdown > 0) {
      countdownRef.current = setTimeout(() => setCountdown(c => c - 1), 1000);
    }
    return () => { if (countdownRef.current) clearTimeout(countdownRef.current); };
  }, [countdown]);

  const handleSendCode = async () => {
    if (!phone || countdown > 0 || sendingCode) return;
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      setError('请输入有效的手机号');
      return;
    }
    setError('');
    setSendingCode(true);
    try {
      const result = await api.sendSmsCode(phone, 'register');
      setCountdown(60);
      if (result.devCode) setSmsCode(result.devCode);
    } catch (err: any) {
      setError(err.message || '验证码发送失败');
    } finally {
      setSendingCode(false);
    }
  };

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirm) { setError('两次输入的密码不一致'); return; }
    if (password.length < 6) { setError('密码至少6个字符'); return; }
    if (username.length < 2) { setError('用户名至少2个字符'); return; }

    setLoading(true);
    try {
      await register(username, email, password);
      router.push('/');
    } catch (err: any) {
      setError(err.message || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!/^1[3-9]\d{9}$/.test(phone)) { setError('请输入有效的手机号'); return; }
    if (smsCode.length !== 6) { setError('请输入6位验证码'); return; }
    if (username.length < 2) { setError('用户名至少2个字符'); return; }

    setLoading(true);
    try {
      await registerByPhone(phone, smsCode, username, phonePassword || undefined);
      router.push('/');
    } catch (err: any) {
      setError(err.message || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4 shadow-lg shadow-blue-500/25">
            L
          </div>
          <h1 className="text-2xl font-bold text-slate-800">创建账号</h1>
          <p className="text-slate-500 mt-1">开始你的英语学习之旅</p>
        </div>

        {/* Register Card */}
        <div className="glass-card p-6 space-y-5">
          {/* Method Tabs */}
          <div className="flex gap-1 p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => { setMethod('phone'); setError(''); }}
              className={`flex-1 px-4 py-2.5 text-sm rounded-lg transition-all font-medium ${
                method === 'phone' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              📱 手机号注册
            </button>
            <button
              onClick={() => { setMethod('email'); setError(''); }}
              className={`flex-1 px-4 py-2.5 text-sm rounded-lg transition-all font-medium ${
                method === 'email' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              📧 邮箱注册
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 animate-fadeIn">
              {error}
            </div>
          )}

          {/* Phone Register Form */}
          {method === 'phone' && (
            <form onSubmit={handlePhoneRegister} className="space-y-4 animate-fadeIn">
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

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">用户名</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                  placeholder="给自己起个名字 (2-20个字符)"
                  required minLength={2} maxLength={20}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  密码 <span className="text-slate-400 font-normal">(可选，方便后续邮箱登录)</span>
                </label>
                <input
                  type="password"
                  value={phonePassword}
                  onChange={(e) => setPhonePassword(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                  placeholder="可选，至少6个字符"
                  minLength={6}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 gradient-primary text-white font-semibold rounded-xl hover:opacity-90 transition-all disabled:opacity-50 active:scale-[0.98] shadow-md shadow-blue-500/20"
              >
                {loading ? '注册中...' : '注册'}
              </button>
            </form>
          )}

          {/* Email Register Form */}
          {method === 'email' && (
            <form onSubmit={handleEmailRegister} className="space-y-4 animate-fadeIn">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">用户名</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                  placeholder="给自己起个名字"
                  required minLength={2} maxLength={20}
                />
              </div>

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
                  placeholder="至少6个字符"
                  required minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">确认密码</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                  placeholder="再次输入密码"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 gradient-primary text-white font-semibold rounded-xl hover:opacity-90 transition-all disabled:opacity-50 active:scale-[0.98] shadow-md shadow-blue-500/20"
              >
                {loading ? '注册中...' : '注册'}
              </button>
            </form>
          )}

          {/* Bottom Link */}
          <div className="text-center text-sm text-slate-500 pt-1">
            已有账号？{' '}
            <Link href="/login" className="text-blue-600 font-medium hover:underline">
              立即登录
            </Link>
          </div>
        </div>

        {/* Agreement */}
        <p className="text-center text-[11px] text-slate-400 mt-4 px-8">
          注册即表示同意 <span className="text-slate-500 cursor-pointer hover:underline">用户协议</span> 和 <span className="text-slate-500 cursor-pointer hover:underline">隐私政策</span>
        </p>
      </div>
    </div>
  );
}
