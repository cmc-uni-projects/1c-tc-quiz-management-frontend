'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

type ForgotPasswordStep = 'email-otp' | 'reset';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<ForgotPasswordStep>('email-otp');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [otpSent, setOtpSent] = useState(false);

  const handleSendOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // If OTP already sent, verify it instead
    if (otpSent) {
      return handleOtpVerify();
    }

    setLoading(true);

    try {
      const res = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const text = await res.text();
      console.log('Raw response:', text);
      
      let responseData;
      try {
        responseData = JSON.parse(text);
        console.log('Parsed JSON response:', responseData);
      } catch {
        console.error('Failed to parse response as JSON:', text);
        // Thông báo thân thiện khi phản hồi từ server không đúng định dạng JSON
        throw new Error('Phản hồi từ máy chủ không đúng định dạng. Vui lòng thử lại sau.');
      }

      if (!res.ok) {
        throw new Error(responseData.error || 'Gửi yêu cầu thất bại');
      }
      
      toast.success('Mã OTP đã được gửi đến email của bạn');
      
      setOtpSent(true);
      setResendCountdown(60);
      startResendCountdown();
    } catch (error: unknown) {
      let errorMessage: string;
      let showToast = false; // Default to no toast

      if (error instanceof Error) {
        if (error.message === 'User with this email not found') {
          errorMessage = 'Email không tồn tại.';
        } else if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Lỗi kết nối. Vui lòng kiểm tra lại đường truyền mạng.';
          showToast = true; // Only show toast for connection errors
        } else {
          errorMessage = error.message;
        }
      } else {
        errorMessage = 'Gửi yêu cầu thất bại. Vui lòng thử lại.';
      }
      
      setError(errorMessage);
      if (showToast) {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerify = async () => {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/validate-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: otp }),
      });

      if (!res.ok) {
        const errorData = await res.text();
        throw new Error(errorData || 'Xác nhận OTP thất bại');
      }

      toast.success('OTP hợp lệ, vui lòng đặt mật khẩu mới');
      setStep('reset');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Xác nhận OTP thất bại';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const startResendCountdown = () => {
    let countdown = 60;
    const interval = setInterval(() => {
      countdown--;
      setResendCountdown(countdown);
      if (countdown <= 0) clearInterval(interval);
    }, 1000);
  };

  const handleResendOtp = async () => {
    if (resendCountdown > 0) return;

    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        throw new Error('Gửi lại mã OTP thất bại');
      }
      
      toast.success('Mã OTP mới đã được gửi');
      
      setResendCountdown(60);
      startResendCountdown();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Gửi lại mã OTP thất bại';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };


  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu không trùng khớp');
      return;
    }

    if (newPassword.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: otp,
          newPassword,
          confirmPassword,
        }),
      });

      if (!res.ok) {
        const errorData = await res.text();
        throw new Error(errorData || 'Đặt lại mật khẩu thất bại');
      }

      toast.success('Thay đổi mật khẩu thành công');
      setTimeout(() => router.push('/login'), 2000);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Đặt lại mật khẩu thất bại';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mx-auto w-full rounded-lg border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="mb-8 text-center text-2xl font-semibold text-zinc-900">
          Quên mật khẩu
        </h1>

        {error && (
          <div className="mb-6 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {success}
          </div>
        )}

        {/* Step 1: Email & OTP */}
        {step === 'email-otp' && (
          <form className="mx-auto max-w-2xl space-y-6" onSubmit={handleSendOtp}>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-zinc-800">
                Email <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Nhập email của bạn"
                className="w-full rounded-md border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder:text-zinc-400 focus:border-[#E33AEC] focus:outline-none focus:ring-2 focus:ring-[#E33AEC]/30"
                disabled={otpSent}
                required
              />
            </div>

            {otpSent && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-zinc-800">
                  Nhập mã OTP <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Nhập mã OTP 6 chữ số"
                  maxLength={6}
                  className="w-full rounded-md border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder:text-zinc-400 focus:border-[#E33AEC] focus:outline-none focus:ring-2 focus:ring-[#E33AEC]/30"
                  required
                />
                <p className="text-xs text-red-500">Mã OTP sẽ được gửi đến email của bạn.</p>
                <div className="flex items-center justify-between text-xs">
                  <p className="text-zinc-600">
                    {resendCountdown > 0 ? (
                      <>Gửi lại mã trong <strong>{resendCountdown}s</strong></>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        className="font-medium text-[#E33AEC] hover:underline"
                      >
                        Gửi lại mã
                      </button>
                    )}
                  </p>
                </div>
              </div>
            )}

            <div className="pt-2 text-center">
              <button
                type="submit"
                disabled={loading || (otpSent && !otp)}
                className="mx-auto rounded-full bg-[#E33AEC] px-10 py-3 font-semibold text-white shadow-sm hover:bg-[#d22adc] disabled:opacity-60"
              >
                {!otpSent ? (loading ? 'Đang gửi...' : 'Tiếp tục') : (loading ? 'Đang xác nhận...' : 'Tiếp tục')}
              </button>
            </div>

            <div className="text-center text-sm">
              <p className="text-zinc-600">
                Bạn nhớ mật khẩu?{' '}
                <Link href="/login" className="font-medium text-[#E33AEC] hover:underline">
                  Đăng nhập
                </Link>
              </p>
            </div>
          </form>
        )}

        {/* Step 2: Reset Password */}
        {step === 'reset' && (
          <form className="mx-auto max-w-2xl space-y-6" onSubmit={handleResetPassword}>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-zinc-800">
                Email <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full rounded-md border border-zinc-300 bg-gray-100 px-4 py-3 text-zinc-900"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-zinc-800">
                Nhập mật khẩu <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nhập mật khẩu mới"
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

            <div className="space-y-2">
              <label className="block text-sm font-medium text-zinc-800">
                Nhập lại mật khẩu <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu"
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

            <div className="pt-2 text-center">
              <button
                type="submit"
                disabled={loading}
                className="mx-auto rounded-full bg-[#E33AEC] px-10 py-3 font-semibold text-white shadow-sm hover:bg-[#d22adc] disabled:opacity-60"
              >
                {loading ? 'Đang cập nhật...' : 'Đăng nhập'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}