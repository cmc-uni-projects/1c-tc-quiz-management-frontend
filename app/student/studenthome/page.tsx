'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useUser } from '@/lib/user';

const StudentHome = () => {
  const router = useRouter();
  const { user } = useUser();
  const [roomCode, setRoomCode] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const username = user?.name;
  const avatar = user?.avatarUrl;

  const handleProfileClick = () => {
    setShowDropdown(false);
    router.push('/student/profile');
  };

  const handleChangePasswordClick = () => {
    setShowDropdown(false);
    router.push('/student/change-password');
  };

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
    setShowDropdown(false);
  };

  const handleLogoutConfirm = async () => {
    setShowLogoutConfirm(false);
    localStorage.removeItem('jwt'); // Clear JWT from localStorage
    router.push('/auth/login'); // Redirect to login page
    toast.success('Đăng xuất thành công');
  };

  const handleLogoutCancel = () => {
    setShowLogoutConfirm(false);
  };

  const handleJoinRoom = () => {
    if (roomCode.trim()) {
      console.log('Joining room:', roomCode);
    }
  };

  const subjects = [
    {
      id: 1,
      title: 'Toán học',
      subtitle: 'Giải tích',
      color: '#FBC02D',
      image: '/roles/Math.jpg',
    },
    {
      id: 2,
      title: 'Tiếng anh',
      subtitle: 'Tiếng anh cấp độ 1',
      color: '#FBC02D',
      image: '/roles/English.jpg',
    },
    {
      id: 3,
      title: 'Vật lý',
      subtitle: 'Cơ học',
      color: '#7B1FA2',
      image: '/roles/Physics.jpg',
    },
  ];
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-zinc-100 bg-white/95 backdrop-blur" onClick={() => setShowDropdown(false)}>
        <div className="mx-auto flex w-full max-w-full items-center justify-between gap-2 px-4 py-3 md:px-6">
          <a
            href="/"
            className="shrink-0 text-3xl font-black tracking-tighter"
            style={{ color: '#E33AEC' }}
          >
            QuizzZone
          </a>
          <nav className="flex flex-1 items-center justify-center text-lg font-medium text-zinc-600">
            <a href="/student/studenthome" className="hover:text-zinc-900 transition duration-150">
              Trang chủ
            </a>
          </nav>
          <div className="flex shrink-0 items-center gap-3 relative" onClick={(e) => e.stopPropagation()}>
            <span className="text-sm text-zinc-600">{`Xin chào, ${username || 'Student'}`}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDropdown(!showDropdown);
              }}
              className="grid h-8 w-8 place-items-center rounded-full bg-purple-100 text-purple-600 hover:bg-purple-200 transition overflow-hidden"
            >
              {avatar ? (
                <img src={avatar} alt="avatar" className="h-8 w-8 rounded-full object-cover" />
              ) : (
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              )}
            </button>
            
            {/* Dropdown Menu */}
            {showDropdown && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                <button onClick={handleProfileClick} className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-100">
                  Cập nhật thông tin
                </button>
                <button onClick={handleChangePasswordClick} className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-100">
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
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full">
        {/* Hero Section */}
        <div className="w-full p-8 text-white flex flex-col items-center" style={{ backgroundColor: '#6D0446' }}>
          <h1 className="mb-2 text-4xl font-extrabold">QuizzZone</h1>
          <p className="mb-6 text-lg">Hãy thử thách trí tuệ cùng QuizzZone.</p>
          <div className="flex gap-3 w-full max-w-xl">
            <input
              type="text"
              placeholder="Nhập mã phòng"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              className="flex-1 rounded-full border-0 px-5 py-3 bg-white text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-purple-400 outline-none"
            />
            <button
              onClick={handleJoinRoom}
              className="rounded-full px-8 py-3 font-semibold text-white transition hover:opacity-90"
              style={{ backgroundColor: '#E33AEC' }}
            >
              Tham gia
            </button>
          </div>
        </div>

        {/* Subjects Section */}
        <div className="px-8 py-8 bg-white">
          <div className="flex flex-col gap-8 max-w-xs">
            {subjects.map((subject) => (
              <div key={subject.id} className="flex flex-col">
                <h3 className="text-base font-bold text-gray-900 mb-3">{subject.title}</h3>
                <div className="overflow-hidden rounded-sm shadow-sm">
                  <div
                    className="w-40 h-32 bg-cover bg-center"
                    style={{
                      backgroundImage: `url(${subject.image})`,
                      backgroundColor: subject.color,
                    }}
                  />
                  <div className="bg-gray-400 text-gray-700 px-4 py-2 text-sm font-medium text-center w-40">
                    {subject.subtitle}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
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

export default StudentHome;
