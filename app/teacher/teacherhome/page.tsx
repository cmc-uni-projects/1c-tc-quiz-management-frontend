'use client';

import Image from "next/image"; // Import Image
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

import Sidebar from '@/components/teacher/Sidebar';

const TeacherHome = () => {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/profile');
        if (res.ok) {
          const data = await res.json();
          // Ưu tiên username
          let displayName: string | null = data.username || null;
          if (!displayName && data.email) {
            const email: string = data.email;
            displayName = email.includes('@') ? email.split('@')[0] : email;
          }
          setUsername(displayName);
          setAvatar(data.avatar || null);
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
      }
    };
    fetchProfile();
  }, []);

  const handleProfileClick = () => {
    setShowDropdown(false);
    router.push('/teacher/profile');
  };

  const handleChangePasswordClick = () => {
    setShowDropdown(false);
    router.push('/teacher/change-password');
  };

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
    setShowDropdown(false);
  };

  const handleLogoutConfirm = async () => {
    try {
      await fetch('/api/perform_logout', { method: 'POST', credentials: 'include' });
      // Consider logout successful if request completes
      toast.success('Đăng xuất thành công');
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Có lỗi khi đăng xuất');
      router.push('/');
    }
  };

  const handleLogoutCancel = () => {
    setShowLogoutConfirm(false);
  };

  const handleJoinRoom = () => {
    if (roomCode.trim()) {
      console.log('Joining room:', roomCode);
    }
  };

  const handleCreateQuiz = () => {
    console.log('Create new quiz');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />

      {/* Main column */}
      <div className="flex-1 flex flex-col">
        {/* Top greeting bar */}
        <header
          className="flex justify-end items-center px-8 py-4 border-b border-zinc-200 bg-white"
          onClick={() => setShowDropdown(false)}
        >
          <div className="relative flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
            <span className="text-sm text-zinc-700">
              {`Xin chào, ${username || 'Giáo viên'}`}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDropdown(!showDropdown);
              }}
              className="flex items-center gap-2 rounded-full bg-purple-50 px-2 py-1 shadow-sm hover:bg-purple-100 transition overflow-hidden"
            >
              <div className="h-8 w-8 rounded-full bg-purple-300 flex items-center justify-center text-purple-800 overflow-hidden">
                {avatar ? (
                  <Image src={avatar} alt="avatar" width={32} height={32} className="h-8 w-8 rounded-full object-cover" />
                ) : (
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                )}
              </div>
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                <button
                  onClick={handleProfileClick}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-100"
                >
                  Cập nhật thông tin
                </button>
                <button
                  onClick={handleChangePasswordClick}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-100"
                >
                  Đổi mật khẩu
                </button>
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
        </header>

        {/* Main content */}
        <main className="flex-1 px-4 md:px-8 pb-10 bg-gray-50">
          {/* Hero banner */}
          <section
            className="mt-6 rounded-2xl shadow-lg overflow-hidden bg-gradient-to-r from-[#6D0446] to-[#A53AEC] text-white"
          >
            <div className="flex flex-col lg:flex-row">
              <div className="flex-1 px-6 sm:px-8 py-6 sm:py-8 flex flex-col gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-2">
                    {username ? `Chào mừng, ${username}!` : 'Chào mừng bạn!'}
                  </h1>
                  <p className="text-sm sm:text-base text-purple-100 max-w-xl">
                    Bắt đầu xây dựng ngân hàng đề thi chất lượng ngay hôm nay.
                  </p>
                </div>

                {/* Stats card */}
                <div className="mt-2 bg-white/95 rounded-xl px-4 sm:px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1 text-center">
                    <div className="text-xs sm:text-sm font-semibold text-zinc-700">Bài thi đã tạo:</div>
                    <div className="text-2xl sm:text-3xl font-extrabold" style={{ color: '#E33AEC' }}>
                      120
                    </div>
                  </div>
                  <div className="flex-1 text-center">
                    <div className="text-xs sm:text-sm font-semibold text-zinc-700">Tổng câu hỏi:</div>
                    <div className="text-2xl sm:text-3xl font-extrabold" style={{ color: '#E33AEC' }}>
                      1200
                    </div>
                  </div>
                  <div className="flex-1 text-center">
                    <div className="text-xs sm:text-sm font-semibold text-zinc-700">Học viên đã thi:</div>
                    <div className="text-2xl sm:text-3xl font-extrabold" style={{ color: '#E33AEC' }}>
                      1000
                    </div>
                  </div>
                  <div className="flex-1 flex justify-center md:justify-end">
                    <button
                      onClick={handleCreateQuiz}
                      className="rounded-full px-5 sm:px-6 py-2 text-sm sm:text-base font-semibold text-white shadow-md hover:brightness-110"
                      style={{ backgroundColor: '#E33AEC' }}
                    >
                      Tạo bài thi mới
                    </button>
                  </div>
                </div>
              </div>

              {/* Right illustration placeholder */}
              <div className="flex-1 hidden lg:block bg-cover bg-center" style={{ backgroundImage: "url('')" }} />
            </div>
          </section>

          {/* Join room section */}
          <section className="mt-8 max-w-xl">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch">
              <input
                type="text"
                placeholder="Nhập mã phòng"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                className="flex-1 rounded-full border border-zinc-200 px-5 py-3 bg-white text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-purple-400 focus:border-purple-400 outline-none"
              />
              <button
                onClick={handleJoinRoom}
                className="rounded-full px-6 py-3 font-semibold text-white shadow-md hover:brightness-110"
                style={{ backgroundColor: '#E33AEC' }}
              >
                Tham gia phòng
              </button>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="mt-auto border-t border-zinc-100 bg-white py-4 text-center text-sm text-zinc-600">
          &copy; 2025 QuizzZone. Mọi quyền được bảo lưu.
        </footer>
      </div>

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

export default TeacherHome;
