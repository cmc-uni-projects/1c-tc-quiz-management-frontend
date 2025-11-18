'use client';

import Link from 'next/link';

export default function PendingApprovalPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50">
      <div className="mx-auto w-full max-w-md rounded-lg border border-zinc-200 bg-white p-8 text-center shadow-sm">
        <h1 className="mb-4 text-2xl font-bold text-zinc-900">Đăng ký thành công!</h1>
        <p className="mb-6 text-zinc-600">
          Tài khoản giáo viên của bạn đã được tạo và đang chờ quản trị viên phê duyệt.
          Bạn sẽ nhận được thông báo qua email khi tài khoản được kích hoạt.
        </p>
        <div className="mt-8">
          <Link href="/" className="rounded-full bg-[#E33AEC] px-8 py-3 font-semibold text-white shadow-sm hover:bg-[#d22adc]">
            Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}
