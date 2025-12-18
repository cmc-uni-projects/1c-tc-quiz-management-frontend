
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import { useUser } from '@/lib/user';
import { fetchApi } from '@/lib/apiClient';

interface HotExam {
    id: number;
    title: string;
    questionCount: number;
    level: string;
    duration: string;
    startTime: string;
    endTime: string;
    status?: 'BEFORE' | 'READY' | 'ENDED' | 'UNKNOWN';
}

const StudentHomeContent = () => {
    const router = useRouter();
    const { user } = useUser();

    const [roomCode, setRoomCode] = useState('');
    const [isJoining, setIsJoining] = useState(false);
    const [hotExams, setHotExams] = useState<HotExam[]>([]);
    const [completedExams, setCompletedExams] = useState<number | null>(null);
    const [averageScore, setAverageScore] = useState<number | null>(null);

    const displayName = (() => {
        if (!user) return '';

        const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
        if (fullName) return fullName;

        const rawUser = user.username || user.email || '';
        if (typeof rawUser === 'string' && rawUser.includes('@')) {
            return rawUser.split('@')[0];
        }

        return rawUser;
    })();

    useEffect(() => {
        const fetchHotExams = async () => {
            try {
                const response = await fetchApi(`/student/exams/search`);
                const data = response?.content || response?.data || [];

                if (!Array.isArray(data)) {
                    setHotExams([]);
                    return;
                }

                const sorted = [...data].sort((a: any, b: any) => {
                    const attemptsA =
                        typeof a.attemptCount === 'number'
                            ? a.attemptCount
                            : typeof a.timesTaken === 'number'
                                ? a.timesTaken
                                : 0;
                    const attemptsB =
                        typeof b.attemptCount === 'number'
                            ? b.attemptCount
                            : typeof b.timesTaken === 'number'
                                ? b.timesTaken
                                : 0;

                    if (attemptsA !== attemptsB) {
                        return attemptsB - attemptsA;
                    }

                    const qa = typeof a.questionCount === 'number' ? a.questionCount : 0;
                    const qb = typeof b.questionCount === 'number' ? b.questionCount : 0;
                    return qb - qa;
                });

                const topExams: HotExam[] = sorted.slice(0, 4).map((exam: any) => {
                    const questionCount = typeof exam.questionCount === 'number' ? exam.questionCount : 0;
                    const duration = typeof exam.durationMinutes === 'number' ? `${exam.durationMinutes} phút` : '';
                    const level = exam.examLevel || '';
                    let status: HotExam['status'] = 'UNKNOWN';

                    if (exam.startTime && exam.endTime) {
                        const now = new Date();
                        const start = new Date(exam.startTime);
                        const end = new Date(exam.endTime);

                        if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                            if (now < start) status = 'BEFORE';
                            else if (now > end) status = 'ENDED';
                            else status = 'READY';
                        }
                    }

                    return {
                        id: exam.examId,
                        title: exam.title || 'Bài thi',
                        questionCount,
                        level,
                        duration,
                        startTime: exam.startTime ? new Date(exam.startTime).toLocaleString('vi-VN') : 'Tự do',
                        endTime: exam.endTime ? new Date(exam.endTime).toLocaleString('vi-VN') : 'Tự do',
                        status,
                    };
                });

                setHotExams(topExams);

            } catch (error) {
                console.error('Failed to fetch hot exams:', error);
                toast.error('Không thể tải danh sách bài thi hot.');
            }
        };

        fetchHotExams();
    }, []);

    useEffect(() => {
        if (!user || typeof (user as any).id === 'undefined') return;

        const loadStats = async () => {
            try {
                const histories = await fetchApi(`/examHistory/student/${(user as any).id}`);

                if (Array.isArray(histories) && histories.length > 0) {
                    const examsDone = histories.length;
                    const totalScore = histories.reduce((sum: number, h: any) => {
                        const s = typeof h.score === 'number' ? h.score : 0;
                        return sum + s;
                    }, 0);

                    const avg = totalScore / examsDone;

                    setCompletedExams(examsDone);
                    setAverageScore(Number.isFinite(avg) ? parseFloat(avg.toFixed(1)) : 0);
                } else {
                    setCompletedExams(0);
                    setAverageScore(0);
                }
            } catch (error) {
                console.error('Không thể tải thống kê học viên:', error);
            }
        };

        loadStats();
    }, [user]);

    const handleJoinRoom = async () => {
        if (!roomCode.trim()) {
            toast.error("Vui lòng nhập mã phòng.");
            return;
        }

        setIsJoining(true);

        try {
            const code = roomCode.trim();

            const response = await fetchApi(`/online-exams/join/${code}`, {
                method: "POST",
            });

            if (response) {
                toast.success(`Tham gia phòng ${code} thành công!`);
                router.push(`/student/waiting-room/${code}`);
            }
        } catch (error: any) {
            console.error("Join room error:", error);
            if (error.message) {
                toast.error(error.message);
            } else {
                toast.error("Mã phòng không hợp lệ hoặc bài thi chưa bắt đầu.");
            }
        } finally {
            setIsJoining(false);
        }
    };

    const handleStartHotExam = (exam: HotExam) => {
        Swal.fire({
            title: `Bắt đầu bài thi ${exam.title}?`,
            text: 'Bạn có chắc chắn muốn bắt đầu làm bài không? Đã bắt đầu bài thi thì sẽ không thể quay lại.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#E33AEC',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Bắt đầu ngay',
            cancelButtonText: 'Hủy',
        }).then((result) => {
            if (result.isConfirmed) {
                router.push(`/student/do-exam?examId=${exam.id}`);
            }
        });
    };

    return (
        <div className="bg-gray-50">
            <div
                className="w-full text-white bg-cover bg-center min-h-[220px] sm:min-h-[260px] lg:min-h-[300px]"
                style={{
                    backgroundImage: "url('/roles/home.jpg')",
                    backgroundPosition: 'center',
                }}
            >
                <div className="flex flex-col lg:flex-row bg-black/10 px-6 sm:px-8 py-6 sm:py-8">
                    <div className="flex-1 flex flex-col gap-4">
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-2">
                            {displayName ? `Chào mừng, ${displayName}!` : 'Chào mừng bạn!'}
                        </h1>

                        <p className="text-sm sm:text-base text-purple-100 max-w-xl">
                            Bạn đã sẵn sàng để chinh phục bài Quizz tiếp theo chưa?
                        </p>

                        <div className="mt-4 max-w-xl">
                            <div className="flex items-stretch rounded-lg px-4 py-2 shadow-md bg-white/95">
                                <input
                                    type="text"
                                    placeholder="Nhập mã phòng"
                                    value={roomCode}
                                    onChange={(e) => setRoomCode(e.target.value)}
                                    className="flex-1 bg-transparent border-none px-3 sm:px-4 py-2 text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-0"
                                />
                                <button
                                    onClick={handleJoinRoom}
                                    className="ml-2 rounded-full px-6 sm:px-8 py-2 text-sm sm:text-base font-semibold text-white shadow-md hover:brightness-110"
                                    style={{ backgroundColor: '#A020F0' }}
                                >
                                    {isJoining ? "Đang tham gia..." : "Tham gia"}
                                </button>
                            </div>
                        </div>

                        <div className="mt-4 bg-white/95 rounded-xl px-4 sm:px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 max-w-xl">
                            <div className="flex-1 text-center">
                                <div className="text-xs sm:text-sm font-semibold text-zinc-700">Bài thi đã hoàn thành</div>
                                <div className="text-2xl sm:text-3xl font-extrabold" style={{ color: '#E33AEC' }}>
                                    {completedExams !== null ? completedExams : '-'}
                                </div>
                            </div>

                            <div className="flex-1 text-center">
                                <div className="text-xs sm:text-sm font-semibold text-zinc-700">Điểm trung bình</div>
                                <div className="text-2xl sm:text-3xl font-extrabold" style={{ color: '#E33AEC' }}>
                                    {averageScore !== null ? averageScore : '-'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-6 sm:px-8 py-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">🔥 Bài thi HOT</h2>
                {hotExams.length === 0 ? (
                    <p className="text-gray-500">Hiện chưa có bài thi hot để hiển thị.</p>
                ) : (
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-5">
                        {hotExams.map((exam) => (
                            <div
                                key={exam.id}
                                className="flex flex-col bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition duration-300 border border-gray-100 h-full"
                            >
                                <div className="flex-1">
                                    <h4 className="text-base font-bold text-[#A53AEC] mb-2 leading-tight line-clamp-2">
                                        {exam.title}
                                    </h4>

                                    <div className="text-xs text-gray-600 space-y-1">
                                        <p>
                                            <span className="text-gray-500">Số câu:</span>
                                            <span className="font-semibold text-gray-800 ml-1">{exam.questionCount}</span>
                                        </p>
                                        <p>
                                            <span className="text-gray-500">Mức độ:</span>
                                            <span className="font-semibold text-gray-800 ml-1">{exam.level}</span>
                                        </p>
                                        <p>
                                            <span className="text-gray-500">Thời gian:</span>
                                            <span className="font-semibold text-gray-800 ml-1">{exam.duration}</span>
                                        </p>
                                    </div>

                                    <div className="mt-3 pt-2 border-t border-gray-100 text-xs text-gray-500 space-y-1">
                                        <p className="flex items-center gap-1">
                                            <span>Bắt đầu:</span>
                                            <span className="font-medium text-gray-700">{exam.startTime}</span>
                                        </p>
                                        <p className="flex items-center gap-1">
                                            <span>Kết thúc:</span>
                                            <span className="font-medium text-gray-700">{exam.endTime}</span>
                                        </p>
                                        <p className="flex items-center gap-1">
                                            <span>Trạng thái:</span>
                                            <span className="font-semibold">
                                                {exam.status === 'READY' && <span className="text-green-600">Sẵn sàng</span>}
                                                {exam.status === 'BEFORE' && <span className="text-blue-600">Chưa bắt đầu</span>}
                                                {exam.status === 'ENDED' && <span className="text-gray-500">Đã kết thúc</span>}
                                                {(!exam.status || exam.status === 'UNKNOWN') && (
                                                    <span className="text-gray-400">Không xác định</span>
                                                )}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-3 flex justify-center">
                                    <button
                                        onClick={() => handleStartHotExam(exam)}
                                        className="bg-[#A53AEC] hover:bg-[#8B2BE2] text-white text-xs font-bold py-2 px-6 rounded-full transition duration-150 shadow-sm"
                                    >
                                        Làm Bài
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentHomeContent;