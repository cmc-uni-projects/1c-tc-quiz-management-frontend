'use client';

import React, { useState } from 'react';

const StudentHome = () => {
  const [roomCode, setRoomCode] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

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
            <span className="text-sm text-zinc-600">Xin chào, Student</span>
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
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-100">
                  Cập nhật thông tin
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-100">
                  Đổi mật khẩu
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-purple-600 hover:bg-purple-50 flex items-center gap-2">
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
    </div>
  );
};

export default StudentHome;
