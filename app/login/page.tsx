'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const form = new URLSearchParams();
      form.append('email', username);
      form.append('password', password);

      const res = await fetch('/api/perform_login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: form.toString(),
        credentials: 'include',
        redirect: 'follow',
      });

      if (res.ok || res.redirected || res.type === 'opaqueredirect') {
        try {
          const finalUrl = res.url || '';
          if (finalUrl.includes('/student/')) {
            router.push('/student/studenthome');
          } else if (finalUrl.includes('/teacher/')) {
            router.push('/teacher/teacherhome');
          } else if (finalUrl.includes('/admin')) {
            router.push('/admin');
          } else {
            router.push('/student/studenthome');
          }
        } catch (_) {
          router.push('/student/studenthome');
        }
        return;
      }

      const text = await res.text();
      throw new Error(text || 'Đăng nhập thất bại');
    } catch (err: any) {
      setError(err.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mx-auto w-full rounded-lg border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="mb-8 text-center text-2xl font-semibold text-zinc-900">
          Đăng nhập tài khoản của bạn
        </h1>

        <form className="mx-auto max-w-2xl space-y-6" onSubmit={onSubmit}>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-zinc-800">
              Email <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your email"
              className="w-full rounded-md border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder:text-zinc-400 focus:border-[#E33AEC] focus:outline-none focus:ring-2 focus:ring-[#E33AEC]/30"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-zinc-800">
              Mật khẩu <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-zinc-300 bg-white px-4 py-3 pr-12 text-zinc-900 placeholder:text-zinc-400 focus:border-[#E33AEC] focus:outline-none focus:ring-2 focus:ring-[#E33AEC]/30"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-700"
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? (
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
          )}

          <div className="flex items-center justify-between text-sm">
            <a href="#" className="font-medium text-[#E33AEC] hover:underline">
              Quên mật khẩu?
            </a>
            <p className="text-zinc-600">
              Bạn chưa có tài khoản?{' '}
              <Link href="/register" className="font-medium text-[#E33AEC] hover:underline">
                Đăng ký
              </Link>
            </p>
          </div>

          <div className="pt-2 text-center">
            <button
              type="submit"
              disabled={loading}
              className="mx-auto w-56 rounded-full bg-[#E33AEC] px-6 py-3 font-semibold text-white shadow-sm hover:bg-[#d22adc] disabled:opacity-60"
            >
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
