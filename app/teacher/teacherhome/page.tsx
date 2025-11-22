'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import toast, { Toast } from 'react-hot-toast';
import { useUser } from '@/lib/user';

// Custom toast hook to prevent duplicate toasts
const useToast = () => {
  const toastRef = useRef<string | null>(null);

  const showError = (message: string) => {
    if (toastRef.current) {
      toast.dismiss(toastRef.current);
    }
    toastRef.current = toast.error(message);
    return toastRef.current;
  };

  const showSuccess = (message: string) => {
    if (toastRef.current) {
      toast.dismiss(toastRef.current);
    }
    toastRef.current = toast.success(message);
    return toastRef.current;
  };

  const dismiss = () => {
    if (toastRef.current) {
      toast.dismiss(toastRef.current);
      toastRef.current = null;
    }
  };

  return { showError, showSuccess, dismiss };
};

const TeacherHome = () => {
  const router = useRouter();
  const { user } = useUser();
  const [roomCode, setRoomCode] = useState('');

  const username = user?.username;

  const handleJoinRoom = () => {
    if (roomCode.trim()) {
      console.log('Joining room:', roomCode);
    }
  };

  const handleCreateQuiz = () => {
    console.log('Create new quiz');
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
    <>
      <div className="min-h-screen bg-gray-50 flex flex-1 flex-col">
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
    </>
  );
};

export default TeacherHome;
