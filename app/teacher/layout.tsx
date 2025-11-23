'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '@/lib/user';
import toast from 'react-hot-toast';
import ProfileDropdown from '@/components/ProfileDropdown';
import {
  HomeIcon,
  FolderIcon,
  DocumentTextIcon,
  QuestionMarkCircleIcon,
  ClipboardDocumentListIcon
} from "@heroicons/react/24/outline";

const LOGO_TEXT_COLOR = "#E33AEC";

/** @type {React.FC<{ children: React.ReactNode }>} */
const TeacherAuthGuard = ({ children }: { children: React.ReactNode }) => {
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
const TeacherSidebar = () => {
  const pathname = usePathname();

  const navItems = [
    { href: '/teacher/teacherhome', label: 'Trang chủ' },
    { href: '/teacher/categories', label: 'Danh mục câu hỏi' },
    { href: '/teacher/list-exam', label: 'Danh sách bài thi' },   
    { href: '#', label: 'Quản lý câu hỏi', disabled: true },
    { href: '#', label: 'Quản lý bài thi', disabled: true },
  ];

  // Icon mapping for menu items
  const getIcon = (label: string) => {
    switch (label) {
      case 'Trang chủ':
        return <HomeIcon className="w-5 h-5" />;
      case 'Danh mục câu hỏi':
        return <FolderIcon className="w-5 h-5" />;
      case 'Danh sách bài thi':
        return <DocumentTextIcon className="w-5 h-5" />;
      case 'Quản lý câu hỏi':
        return <QuestionMarkCircleIcon className="w-5 h-5" />;
      case 'Quản lý bài thi':
        return <ClipboardDocumentListIcon className="w-5 h-5" />;
      default:
        return null;
    }
  };

  return (
    <aside className="w-56 border-r border-zinc-200 bg-white flex flex-col">
      
      <nav className="flex-1 px-4 py-4 text-sm font-medium text-zinc-700 space-y-1">
        {navItems.map((item) => {
          if (item.disabled) {
            return (
              <div
                key={item.href}
                className="flex items-center rounded-lg px-3 py-2 text-zinc-400 cursor-not-allowed"
              >
                {getIcon(item.label)}
                <span className="ml-3">{item.label}</span>
              </div>
            );
          }
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center rounded-lg px-3 py-2 transition-colors duration-150 ${
                pathname === item.href
                  ? 'bg-zinc-100 text-purple-700 font-semibold'
                  : 'hover:bg-zinc-50'
              }`}
            >
              {getIcon(item.label)}
              <span className="ml-3">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
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
        <TeacherSidebar />
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
