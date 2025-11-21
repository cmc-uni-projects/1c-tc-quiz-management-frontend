'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useUser } from '@/lib/user';
import ProfileDropdown from '@/components/ProfileDropdown';

const LOGO_TEXT_COLOR = "#E33AEC";

/** @type {React.FC<{ children: React.ReactNode }>} */
const StudentAuthGuard = ({ children }) => {
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
    } else if (user?.role !== "STUDENT") {
      redirectPath = "/";
      toastMessage = "Bạn không có quyền truy cập vào khu vực học sinh.";
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
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-green-600 border-b-2"></div>
          <p className="mt-4 text-lg font-semibold text-gray-700">Đang tải dữ liệu người dùng...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "STUDENT") {
    return null;
  }

  return <>{children}</>;
};

/** @type {React.FC} */
const StudentTopBar = () => {
  return (
    <header className="w-full border-b border-zinc-200 bg-white shadow-sm">
      <div className="mx-auto flex w-full max-w-full items-center justify-between gap-2 px-4 py-3 md:px-6">
        <a
          href="/student/studenthome"
          className="shrink-0 text-3xl font-black tracking-tighter"
          style={{ color: LOGO_TEXT_COLOR }}
        >
          QuizzZone
        </a>
        <nav className="flex flex-1 items-center justify-center text-lg font-medium text-zinc-600">
          <a href="/student/studenthome" className="hover:text-zinc-900 transition duration-150">
            Trang chủ
          </a>
        </nav>
        <div className="flex shrink-0 items-center gap-3 relative">
          <ProfileDropdown />
        </div>
      </div>
    </header>
  );
};

const StudentHomeContent = () => {
  const router = useRouter();
  const { user } = useUser();
  const [roomCode, setRoomCode] = useState('');

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

export default function StudentHomeWrapper() {
  return (
    <StudentAuthGuard>
      <StudentTopBar />
      <StudentHomeContent />
    </StudentAuthGuard>
  );
}
