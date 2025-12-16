'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useUser } from '@/lib/user';
import { fetchApi } from '@/lib/apiClient';

// Icons
const PlusIcon = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const BookIcon = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const FolderIcon = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const PlayIcon = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <polygon points="5 3 19 12 5 21 5 3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ClockIcon = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const UsersIcon = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="9" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

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

interface Exam {
  examId: number;
  title: string;
  startTime: string;
  endTime: string;
  questionCount: number;
  durationMinutes: number;
  status?: string;
  category?: { id: number; name: string };
}

interface OnlineExam {
  id: number;
  name: string;
  accessCode: string;
  status: string;
  durationMinutes: number;
  actualQuestionCount: number;
  participantCount?: number;
}

const TeacherHome = () => {
  const router = useRouter();
  const { user } = useUser();
  const [roomCode, setRoomCode] = useState('');
  const [stats, setStats] = useState({ exams: 0, questions: 0, students: 0 });
  const [recentExams, setRecentExams] = useState<Exam[]>([]);
  const [activeOnlineExams, setActiveOnlineExams] = useState<OnlineExam[]>([]);
  const activeWrapRef = useRef<HTMLDivElement | null>(null);
  const recentWrapRef = useRef<HTMLDivElement | null>(null);
  const [activeLimit, setActiveLimit] = useState<number>(3);
  const [recentLimit, setRecentLimit] = useState<number>(3);
  const username = user?.username;
  
  const ONLINE_EXAMS_LIMIT = 3;

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

  // Compute how many cards fit in one row for each section using fixed card width, then add +1
  useEffect(() => {
    const CARD_TOTAL = 292; // ~ w-64 + paddings
    const GAP = 16; // gap-4
    const calc = (el: HTMLDivElement | null) => {
      if (!el) return 3;
      const width = el.clientWidth;
      if (!width) return 3;
      let n = Math.max(1, Math.floor((width + GAP) / (CARD_TOTAL + GAP)));
      while ((n + 1) * CARD_TOTAL + n * GAP <= width) n += 1;
      while (n > 1 && n * CARD_TOTAL + (n - 1) * GAP > width) n -= 1;
      return n;
    };

    const update = () => {
      const a = calc(activeWrapRef.current);
      const r = calc(recentWrapRef.current);
      setActiveLimit(a + 1);
      setRecentLimit(r + 1);
    };

    update();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null;
    if (ro) {
      if (activeWrapRef.current) ro.observe(activeWrapRef.current);
      if (recentWrapRef.current) ro.observe(recentWrapRef.current);
    } else {
      window.addEventListener('resize', update);
    }
    return () => {
      if (ro) {
        try { if (activeWrapRef.current) ro.unobserve(activeWrapRef.current); } catch {}
        try { if (recentWrapRef.current) ro.unobserve(recentWrapRef.current); } catch {}
        ro.disconnect();
      } else {
        window.removeEventListener('resize', update);
      }
    };
  }, []);

  // Load teacher statistics and data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch offline exams
        const exams = await fetchApi('/exams/my');
        const examsArray = Array.isArray(exams) ? exams : [];

        const examsCount = examsArray.length;
        const questionsCount = examsArray.reduce((sum: number, exam: any) => {
          if (typeof exam.questionCount === 'number') return sum + exam.questionCount;
          if (Array.isArray(exam.examQuestions)) return sum + exam.examQuestions.length;
          return sum;
        }, 0);

        // Get 5 most recent exams
        const sortedExams = [...examsArray]
          .sort((a: any, b: any) => new Date(b.startTime || 0).getTime() - new Date(a.startTime || 0).getTime())
          .slice(0, 6);
        setRecentExams(sortedExams);

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

        // Fetch online exams
        try {
          const onlineExams = await fetchApi('/online-exams/my');
          const activeExams = (onlineExams || []).filter(
            (e: any) => e.status === 'WAITING' || e.status === 'IN_PROGRESS' || e.status === 'DRAFT'
          );
          setActiveOnlineExams(activeExams);
        } catch (err) {
          console.error('Failed to load online exams', err);
        }

      } catch (error: any) {
        console.error('Failed to load teacher stats', error);
        toast.error(error?.message || 'Không thể tải thống kê.');
      }
    };

    fetchData();
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

          {/* ACTIVE ONLINE EXAMS */}
          {activeOnlineExams.length > 0 && (
            <section className="px-6 sm:px-8 mt-4 pb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">Bài thi online đang hoạt động ({activeOnlineExams.length})</h2>
                <button
                  onClick={() => router.push('/teacher/list-exam')}
                  className="text-sm font-medium hover:underline"
                  style={{ color: '#A53AEC' }}
                >
                  Xem tất cả →
                </button>
              </div>
              <div className="flex flex-wrap gap-4 w-full" ref={activeWrapRef}>
                {activeOnlineExams.slice(0, activeLimit).map((exam) => (
                  <div
                    key={exam.id}
                    className={`w-64 bg-white rounded-xl p-4 shadow-md border-l-4 ${
                      exam.status === 'IN_PROGRESS' ? 'border-l-green-500' :
                      exam.status === 'WAITING' ? 'border-l-blue-500' :
                      'border-l-yellow-500'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-gray-800 truncate flex-1">{exam.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        exam.status === 'IN_PROGRESS' ? 'bg-green-100 text-green-700' :
                        exam.status === 'WAITING' ? 'bg-blue-100 text-blue-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {exam.status === 'IN_PROGRESS' ? 'Đang thi' :
                         exam.status === 'WAITING' ? 'Phòng chờ' : 'Nháp'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1 mb-3">
                      <p className="flex items-center gap-2">
                        <ClockIcon /> {exam.durationMinutes} phút
                      </p>
                      <p>📝 {exam.actualQuestionCount || 0} câu hỏi</p>
                      <p className="font-mono text-purple-600">Mã: {exam.accessCode}</p>
                    </div>
                    <button
                      onClick={() => {
                        if (exam.status === 'IN_PROGRESS') {
                          router.push(`/teacher/exam-online/${exam.id}/monitor`);
                        } else if (exam.status === 'WAITING') {
                          router.push(`/teacher/waiting-room/${exam.accessCode}`);
                        } else {
                          router.push(`/teacher/exam-online/edit/${exam.id}`);
                        }
                      }}
                      className="w-full py-2 rounded-lg text-white text-sm font-medium"
                      style={{ backgroundColor: '#A53AEC' }}
                    >
                      {exam.status === 'IN_PROGRESS' ? 'Giám sát' :
                       exam.status === 'WAITING' ? 'Vào phòng chờ' : 'Chỉnh sửa'}
                    </button>
                  </div>
                ))}
              </div>
              
            </section>
          )}

          {/* RECENT EXAMS */}
          <section className="px-6 sm:px-8 pb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Bài thi gần đây</h2>
              <button
                onClick={() => router.push('/teacher/list-exam')}
                className="text-sm font-medium hover:underline"
                style={{ color: '#A53AEC' }}
              >
                Xem tất cả →
              </button>
            </div>

            {recentExams.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center text-gray-500 shadow-sm">
                <p>Bạn chưa có bài thi nào.</p>
                <button
                  onClick={() => router.push('/teacher/exam-offline/create')}
                  className="mt-4 px-6 py-2 rounded-full text-white font-medium"
                  style={{ backgroundColor: '#A53AEC' }}
                >
                  Tạo bài thi đầu tiên
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-4 w-full" ref={recentWrapRef}>
                {recentExams.slice(0, recentLimit).map((exam) => (
                  <div
                    key={exam.examId}
                    className={`w-64 bg-white rounded-xl p-4 shadow-md border-l-4 ${
                      exam.status === 'PUBLISHED' ? 'border-l-green-500' : 'border-l-yellow-400'
                    }`}
                  >
                    <p className="font-semibold text-lg mb-2 truncate" title={exam.title}>{exam.title}</p>
                    <div className="text-sm space-y-1 text-gray-600">
                      <p className="flex items-center gap-2">
                        <ClockIcon /> Bắt đầu: {exam.startTime ? new Date(exam.startTime).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }) : 'N/A'}
                      </p>
                      <p className="flex items-center gap-2">
                        <ClockIcon /> Kết thúc: {exam.endTime ? new Date(exam.endTime).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }) : 'N/A'}
                      </p>
                      <p>⏳ Thời gian: {exam.durationMinutes} phút</p>
                      {exam.status !== 'PUBLISHED' && (
                        <p className="text-yellow-600 font-medium">⚠ Bản nháp</p>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      {exam.status !== 'PUBLISHED' ? (
                        <button
                          onClick={() => router.push(`/teacher/update-exam/${exam.examId}`)}
                          className="text-sm bg-yellow-100 text-yellow-700 px-3 py-1 rounded hover:bg-yellow-200"
                        >
                          Tiếp tục chỉnh sửa
                        </button>
                      ) : (
                        <button
                          onClick={() => router.push(`/teacher/detail-exam/${exam.examId}`)}
                          className="text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded hover:bg-purple-200"
                        >
                          Xem chi tiết
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>

      </div>
    </>
  );
};

export default TeacherHome;
