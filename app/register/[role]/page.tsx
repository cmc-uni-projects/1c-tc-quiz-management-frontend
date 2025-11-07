'use client';

import Link from "next/link";
import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

export default function RegisterFormPage({ params }: { params: Promise<{ role: string }> }) {
  const router = useRouter();
  const { role } = use(params);
  const roleParam = (role || '').toLowerCase();
  const isStudent = roleParam === 'student';
  const isTeacher = roleParam === 'teacher';
  const apiRole = isStudent ? 'STUDENT' : isTeacher ? 'TEACHER' : '';
  const roleLabel = isStudent ? 'Học sinh' : isTeacher ? 'Giáo viên' : 'Người dùng';

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const passwordMismatch = confirmPassword && password !== confirmPassword;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!apiRole) {
      setError("Đường dẫn không hợp lệ. Vui lòng chọn vai trò đăng ký.");
      return;
    }
    if (passwordMismatch) {
      setError("Mật khẩu nhập lại không khớp.");
      return;
    }
    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          username,
          password,
          role: apiRole,
        }),
      });

      const text = await res.text();
      if (!res.ok) {
        throw new Error(text || "Đăng ký thất bại");
      }

      setSuccess(text || "Đăng ký thành công!");
      setTimeout(() => router.push("/login"), 1200);
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  const title = `Đăng ký ${roleLabel}`;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mx-auto w-full rounded-lg border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="mb-8 text-center text-2xl font-semibold text-zinc-900">{title}</h1>

        <form className="mx-auto max-w-2xl space-y-6" onSubmit={onSubmit}>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-zinc-800">
              Email <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder:text-zinc-400 focus:border-[#E33AEC] focus:outline-none focus:ring-2 focus:ring-[#E33AEC]/30"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-zinc-800">
              Tên hiển thị <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
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
                  <EyeSlashIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-zinc-800">
              Nhập lại mật khẩu <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-md border border-zinc-300 bg-white px-4 py-3 pr-12 text-zinc-900 placeholder:text-zinc-400 focus:border-[#E33AEC] focus:outline-none focus:ring-2 focus:ring-[#E33AEC]/30"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-700"
                aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showConfirmPassword ? (
                  <EyeSlashIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
            </div>
            {!passwordMismatch ? null : (
              <p className="text-sm text-rose-600 mt-1">Mật khẩu nhập lại không khớp.</p>
            )}
          </div>

          {(error || success) && (
            <div className={`rounded-md px-4 py-3 text-sm ${error ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
              {error || success}
            </div>
          )}

          <div className="flex items-center justify-between text-sm">
            <p className="text-zinc-600">
              Bạn đã có tài khoản? <Link href="/login" className="font-medium text-[#E33AEC] hover:underline">Đăng nhập</Link>
            </p>
          </div>

          <div className="pt-2 text-center">
            <button
              type="submit"
              disabled={loading}
              className="mx-auto w-56 rounded-full bg-[#E33AEC] px-6 py-3 font-semibold text-white shadow-sm hover:bg-[#d22adc] disabled:opacity-60"
            >
              {loading ? 'Đang đăng ký...' : 'Đăng ký'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
