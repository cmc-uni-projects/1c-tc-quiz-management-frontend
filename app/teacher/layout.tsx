'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/user';
import toast from 'react-hot-toast';
import Sidebar from "@/components/teacher/Sidebar";
import ProfileDropdown from '@/components/ProfileDropdown';

const LOGO_TEXT_COLOR = "#E33AEC";

/** @type {React.FC<{ children: React.ReactNode }>} */
const TeacherAuthGuard = ({ children }) => {
  const { user, isLoading, isAuthenticated } = useUser();
  const router = useRouter();
  
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (isLoading || isRedirecting) {
      return;
    }

    let redirectPath = null;
    let toastMessage = null;

    if (!isAuthenticated) {
      redirectPath = "/auth/login";
      toastMessage = "Bạn cần đăng nhập để truy cập trang này.";
    } else if (user?.role !== "TEACHER") {
      redirectPath = "/";
      toastMessage = "Bạn không có quyền truy cập vào khu vực giáo viên.";
    }

    if (redirectPath) {
        setIsRedirecting(true);
        if (toastMessage) {
            toast.error(toastMessage);
        }
        router.push(redirectPath);
    }

  }, [user, isLoading, isAuthenticated, router, isRedirecting]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-blue-600 border-b-2"></div>
          <p className="mt-4 text-lg font-semibold text-gray-700">Đang tải dữ liệu người dùng...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "TEACHER") {
    return null;
  }

  return <>{children}</>;
};

/** @type {React.FC} */
const TeacherTopBar = () => {
  return (
    <header className="w-full border-b border-zinc-200 bg-white shadow-sm">
      <div className="flex items-center justify-between px-4 py-2 md:py-3">
        <div className="flex items-center">
            <h1 className="text-xl font-semibold text-zinc-800">Bảng điều khiển Giáo viên</h1>
        </div>

        <div className="flex-1"></div>

        <ProfileDropdown />
      </div>
    </header>
  );
};

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TeacherAuthGuard>
      <div className="flex min-h-screen bg-[#F5F5F5]">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <TeacherTopBar />
          <main className="flex-1 p-4 md:p-8">
            {children}
          </main>
        </div>
      </div>
    </TeacherAuthGuard>
  );
}
