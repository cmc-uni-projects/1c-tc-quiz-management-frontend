'use client';

import { useState } from 'react';
import type { SVGProps } from 'react';
import Link from 'next/link';

function Eye(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18" {...props}>
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOff(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18" {...props}>
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a21.77 21.77 0 0 1 5.06-6.14" />
      <path d="M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a21.83 21.83 0 0 1-3.17 4.49" />
      <path d="M14.12 14.12A3 3 0 1 1 9.88 9.88" />
      <path d="M1 1l22 22" />
    </svg>
  );
}

function MenuIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20" {...props}>
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function UserIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18" {...props}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export default function ChangePasswordPage() {
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Xử lý đổi mật khẩu ở đây
    console.log('Đổi mật khẩu');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Toolbar removed as requested */}

      <div className="flex w-full min-h-screen pb-16">
        {/* Sidebar */}
        <aside className="w-56 bg-[#F5F5F5] shadow-sm min-h-full">
          <nav className="border-r border-zinc-200">
            <Link
              href="/admin"
              className="block text-center px-6 py-3 text-sm text-zinc-700 border-b border-zinc-200 hover:bg-zinc-200/50"
            >
              Trang chủ
            </Link>
            <a
              href="#"
              className="block text-center px-6 py-3 text-sm text-zinc-700 border-b border-zinc-200 hover:bg-zinc-200/50"
            >
              Quản lý tài khoản
            </a>
            <a
              href="#"
              className="block text-center px-6 py-3 text-sm text-zinc-700 border-b border-zinc-200 hover:bg-zinc-200/50"
            >
              Duyệt tài khoản giáo viên
            </a>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 bg-gray-100 px-8 py-8">
          <div className="mx-auto max-w-xl">
            <div className="rounded-lg border border-zinc-300 bg-white p-8 shadow">
              <h2 className="mb-8 text-center text-xl font-semibold text-zinc-900">
                Thay đổi mật khẩu
              </h2>

              <div className="space-y-5">
                {/* Old Password */}
                <div className="space-y-1.5">
                  <label className="block text-sm text-zinc-700">
                    Nhập mật khẩu cũ <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showOldPassword ? "text" : "password"}
                      name="oldPassword"
                      className="w-full rounded border border-zinc-300 bg-white px-3 py-2.5 pr-10 text-sm text-zinc-900 focus:border-[#E33AEC] focus:outline-none focus:ring-1 focus:ring-[#E33AEC]"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowOldPassword(!showOldPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                    >
                      {showOldPassword ? <EyeOff width={18} height={18} /> : <Eye width={18} height={18} />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div className="space-y-1.5">
                  <label className="block text-sm text-zinc-700">
                    Nhập mật khẩu mới <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      name="newPassword"
                      className="w-full rounded border border-zinc-300 bg-white px-3 py-2.5 pr-10 text-sm text-zinc-900 focus:border-[#E33AEC] focus:outline-none focus:ring-1 focus:ring-[#E33AEC]"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                    >
                      {showNewPassword ? <EyeOff width={18} height={18} /> : <Eye width={18} height={18} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <label className="block text-sm text-zinc-700">
                    Nhập lại mật khẩu mới <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      className="w-full rounded border border-zinc-300 bg-white px-3 py-2.5 pr-10 text-sm text-zinc-900 focus:border-[#E33AEC] focus:outline-none focus:ring-1 focus:ring-[#E33AEC]"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                    >
                      {showConfirmPassword ? <EyeOff width={18} height={18} /> : <Eye width={18} height={18} />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-3 text-center">
                  <button
                    onClick={handleSubmit}
                    className="mx-auto rounded-full bg-[#E33AEC] px-12 py-2.5 text-sm font-semibold text-white shadow hover:bg-[#d22adc] transition-colors"
                  >
                    Đổi mật khẩu
                  </button>
                </div>
              </div>
            </div>

          </div>
        </main>
      </div>
      {/* Hide native password reveal/clear icons (Edge/Chromium/WebKit) */}
      <style jsx global>{`
        input[type="password"]::-ms-reveal,
        input[type="password"]::-ms-clear {
          display: none;
        }
        input[type="password"]::-webkit-credentials-auto-fill-button,
        input[type="password"]::-webkit-textfield-decoration-container {
          display: none;
          visibility: hidden;
        }
      `}</style>
    </div>
  );
}