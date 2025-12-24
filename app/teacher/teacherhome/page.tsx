'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useUser } from '@/lib/user';
import { fetchApi } from '@/lib/apiClient';

// Custom toast hook
const useToast = () => {
  const toastRef = useRef<string | null>(null);

  const showError = (message: string) => {
    if (toastRef.current) toast.dismiss(toastRef.current);
    toastRef.current = toast.error(message);
    return toastRef.current;
  };

  const showSuccess = (message: string) => {
    if (toastRef.current) toast.dismiss(toastRef.current);
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
  const [stats, setStats] = useState({ exams: 0, questions: 0, students: 0 });
  const username = user?.username;

  const displayName = (() => {
    if (!user) return '';

    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    if (fullName) return fullName;

    const rawUser = user.username || (user as any).email || '';
    if (typeof rawUser === 'string' && rawUser.includes('@')) {
      return rawUser.split('@')[0];
    }

    return rawUser;
  })();

  const handleJoinRoom = () => {
    if (roomCode.trim()) {
      console.log('Joining room:', roomCode);
    }
  };

  const handleCreateQuiz = () => {
    console.log('Create new quiz');
  };

  // Load teacher statistics
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const exams = await fetchApi('/exams/my');
        const examsArray = Array.isArray(exams) ? exams : [];

        const examsCount = examsArray.length;
        const questionsCount = examsArray.reduce((sum: number, exam: any) => {
          if (typeof exam.questionCount === 'number') return sum + exam.questionCount;
          if (Array.isArray(exam.examQuestions)) return sum + exam.examQuestions.length;
          return sum;
        }, 0);

        // Tính số học viên đã thi (đếm studentId duy nhất trong lịch sử bài thi)
        const uniqueStudentIds = new Set<number>();
        try {
          const historyResponses = await Promise.all(
            examsArray
              .filter((exam: any) => exam.examId)
              .map((exam: any) =>
                fetchApi(`/examHistory/get/${exam.examId}`).catch(() => [])
              )
          );

          for (const histories of historyResponses) {
            if (Array.isArray(histories)) {
              for (const h of histories as any[]) {
                if (h && typeof h.studentId === 'number') {
                  uniqueStudentIds.add(h.studentId);
                }
              }
            }
          }
        } catch (err) {
          console.error('Failed to load exam history stats', err);
        }

        setStats({ exams: examsCount, questions: questionsCount, students: uniqueStudentIds.size });
      } catch (error: any) {
        console.error('Failed to load teacher stats', error);
        toast.error(error?.message || 'Không thể tải thống kê.');
      }
    };

    fetchStats();
  }, []);

  return (
    <>
      <div className="bg-gray-50 flex flex-col min-h-full">

        {/* MAIN CONTENT */}
        <main className="flex-1 pb-10 bg-gray-50 w-full">

          {/* HERO BANNER — FULL WIDTH, VUÔNG, KHÔNG BO GÓC */}
          <section
            className="shadow-lg overflow-hidden text-white min-h-[220px] sm:min-h-[260px] lg:min-h-[300px]"
            style={{
              backgroundImage: "url('/roles/home.jpg')",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div className="flex flex-col lg:flex-row bg-black/10 px-6 sm:px-8 py-6 sm:py-8">
              <div className="flex-1 flex flex-col gap-4">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-2">
                  {displayName ? `Chào mừng, ${displayName}!` : 'Chào mừng bạn!'}
                </h1>

                <p className="text-sm sm:text-base text-purple-100 max-w-xl">
                  Bắt đầu xây dựng ngân hàng đề thi chất lượng ngay hôm nay.
                </p>

                {/* JOIN ROOM INSIDE BANNER */}
                <div className="mt-4 max-w-xl">
                  <div
                    className="flex items-stretch rounded-xl px-3 py-2 shadow-md"
                    style={{ backgroundColor: '#f1eff3ff' }}
                  >
                    <input
                      type="text"
                      placeholder="Nhập mã phòng....."
                      value={roomCode}
                      onChange={(e) => setRoomCode(e.target.value)}
                      className="flex-1 bg-transparent border-none px-2 sm:px-4 py-1 sm:py-2 text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-0"
                    />

                    <button
                      onClick={handleJoinRoom}
                      className="ml-2 rounded-full px-6 sm:px-8 py-2 text-sm sm:text-base font-semibold text-white shadow-md hover:brightness-110"
                      style={{ backgroundImage: 'linear-gradient(90deg,#A53AEC)' }}
                    >
                      Tham gia
                    </button>
                  </div>
                </div>

                {/* STATS CARD */}
                <div className="mt-4 bg-white/95 rounded-xl px-4 sm:px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 max-w-xl">
                  <div className="flex-1 text-center">
                    <div className="text-xs sm:text-sm font-semibold text-zinc-700">Bài thi đã tạo:</div>
                    <div className="text-2xl sm:text-3xl font-extrabold" style={{ color: '#E33AEC' }}>{stats.exams}</div>
                  </div>

                  <div className="flex-1 text-center">
                    <div className="text-xs sm:text-sm font-semibold text-zinc-700">Tổng câu hỏi:</div>
                    <div className="text-2xl sm:text-3xl font-extrabold" style={{ color: '#E33AEC' }}>{stats.questions}</div>
                  </div>

                  <div className="flex-1 text-center">
                    <div className="text-xs sm:text-sm font-semibold text-zinc-700">Học viên đã thi:</div>
                    <div className="text-2xl sm:text-3xl font-extrabold" style={{ color: '#E33AEC' }}>{stats.students}</div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>

      </div>
    </>
  );
};

export default TeacherHome;
