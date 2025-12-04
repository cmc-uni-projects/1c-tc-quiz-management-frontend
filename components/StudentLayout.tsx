// app/components/StudentLayout.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useUser } from '@/lib/user';
import ProfileDropdown from '@/components/ProfileDropdown';

// --- Global Constants (Bạn có thể chuyển ra file constants nếu cần) ---
const LOGO_TEXT_COLOR = "#E33AEC";

// --- Components Khai báo Lại Tạm thời (vì bạn không cung cấp code của /lib/user, tôi giữ nguyên cấu trúc) ---
// Note: Giả định các hàm Firebase không cần thiết cho layout và sẽ được khởi tạo trong các trang cụ thể.

/* ===========================================================
    STUDENT AUTH GUARD
=========================================================== */
export const StudentAuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading, isAuthenticated } = useUser();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (isLoading || isRedirecting) return;

    let redirectPath = null;
    let toastMessage = null;

    if (!isAuthenticated) {
      redirectPath = "/auth/login";
      toastMessage = "Bạn cần đăng nhập để truy cập trang này.";
    } else if (user?.role !== "STUDENT") {
      redirectPath = "/";
      toastMessage = "Bạn không có quyền truy cập vào khu vực học sinh.";
    }

    if (redirectPath) {
      setIsRedirecting(true);
      toastMessage && toast.error(toastMessage);
      router.push(redirectPath);
    }
  }, [user, isLoading, isAuthenticated, router, isRedirecting]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-green-600 border-b-2" />
          <p className="mt-4 text-lg font-semibold text-gray-700">Đang tải dữ liệu người dùng...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "STUDENT") return null;

  return <>{children}</>;
};

/* ===========================================================
    TOP BAR
=========================================================== */
export const StudentTopBar = () => (
  <header className="w-full border-b border-zinc-200 bg-white shadow-sm">
    <div className="mx-auto flex w-full items-center justify-between px-4 py-3 md:px-6">
      <a
        href="/student/studenthome"
        className="text-3xl font-black tracking-tighter"
        style={{ color: LOGO_TEXT_COLOR }}
      >
        QuizzZone
      </a>

      <nav className="flex flex-1 items-center justify-center text-lg font-medium text-zinc-600 space-x-6">
        <a 
          href="/student/studenthome" 
          className="hover:text-zinc-900 transition"
        >
          Trang chủ
        </a>
        <a 
          href="/student/list-exams" 
          className="hover:text-zinc-900 transition"
        >
          Danh sách bài thi
        </a>
      </nav>

      <div className="flex shrink-0 items-center gap-3 relative">
        <ProfileDropdown />
      </div>
    </div>
  </header>
);

/* ===========================================================
    MAIN LAYOUT
=========================================================== */
export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <StudentAuthGuard>
      <div className="flex flex-col min-h-screen">
        <StudentTopBar />
        <main className="flex-grow">{children}</main>
        <footer className="mt-auto border-t border-zinc-100 bg-white py-6 text-center">
          <p className="text-sm text-zinc-600">&copy; 2025 QuizzZone. Mọi quyền được bảo lưu.</p>
        </footer>
      </div>
    </StudentAuthGuard>
  );
}