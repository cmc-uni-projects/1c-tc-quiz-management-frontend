'use client';

import React from 'react';
import ChangePasswordForm from '@/components/ChangePasswordForm';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const TeacherChangePasswordPage = () => {
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
    setShowDropdown(false);
  };

  const handleLogoutConfirm = async () => {
    try {
      await fetch('/logout', { method: 'POST', credentials: 'include' });
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
      router.push('/');
    }
  };

  const handleLogoutCancel = () => {
    setShowLogoutConfirm(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-zinc-100 bg-white/95 backdrop-blur" onClick={() => setShowDropdown(false)}>
        <div className="mx-auto flex w-full max-w-full items-center justify-between gap-2 px-4 py-3 md:px-6">
          <a
            href="/teacher/teacherhome"
            className="shrink-0 text-3xl font-black tracking-tighter"
            style={{ color: '#E33AEC' }}
          >
            QuizzZone
          </a>
          <nav className="flex flex-1 items-center justify-center text-lg font-medium text-zinc-600">
            <a href="/teacher/teacherhome" className="hover:text-zinc-900 transition duration-150">
              Trang chủ
            </a>
          </nav>
          <div className="flex shrink-0 items-center gap-3 relative" onClick={(e) => e.stopPropagation()}>
            <span className="text-sm text-zinc-600">Xin chào, Teacher</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDropdown(!showDropdown);
              }}
              className="rounded-full bg-purple-100 p-2 text-purple-600 hover:bg-purple-200 transition"
            >
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            </button>
            
            {/* Dropdown Menu */}
            {showDropdown && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                <a href="/teacher/profile" className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-100">
                  Cập nhật thông tin
                </a>
                <a href="/teacher/change-password" className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-100">
                  Đổi mật khẩu
                </a>
                <button
                  onClick={handleLogoutClick}
                  className="w-full text-left px-3 py-2 text-sm text-purple-600 hover:bg-purple-50 flex items-center gap-2"
                >
                  <span>←</span>
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full" style={{ backgroundColor: '#6D0446' }}>
        <ChangePasswordForm />
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-zinc-100 bg-white py-6 text-center">
        <p className="text-sm text-zinc-600">
          &copy; 2025 QuizzZone. Mọi quyền được bảo lưu.
        </p>
      </footer>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Xác nhận đăng xuất</h3>
            <p className="text-gray-600 mb-6">Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleLogoutCancel}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition"
              >
                Hủy
              </button>
              <button
                onClick={handleLogoutConfirm}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherChangePasswordPage;
