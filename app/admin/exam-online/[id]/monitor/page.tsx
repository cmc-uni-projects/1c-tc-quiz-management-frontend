"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchApi } from "@/lib/apiClient";
import { toastError, toastSuccess } from "@/lib/toast";
import Swal from "sweetalert2";
import { Trophy, Clock, Users, Loader2, LogOut, StopCircle } from "lucide-react";

interface LiveProgress {
    studentId: number;
    displayName: string;
    avatarUrl: string;
    questionsAnswered: number;
    totalQuestions: number;
    currentScore: number;
    timeSpent: number; // seconds
}

interface ExamInfo {
    id: number;
    name: string;
    status: string;
    durationMinutes: number;
    maxParticipants: number;
    startedAt: string;
}

export default function TeacherMonitorPage() {
    const params = useParams();
    const router = useRouter();
    const examId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [exam, setExam] = useState<ExamInfo | null>(null);
    const [participants, setParticipants] = useState<LiveProgress[]>([]);
    const [isFinishing, setIsFinishing] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0);

    // Fetch exam info
    useEffect(() => {
        if (!examId) return;

        const fetchExamInfo = async () => {
            try {
                const data = await fetchApi(`/online-exams/${examId}`);
                setExam(data);

                // Calculate elapsed time
                if (data.startedAt) {
                    const start = new Date(data.startedAt).getTime();
                    const now = Date.now();
                    setElapsedTime(Math.floor((now - start) / 1000));
                }
            } catch (error: any) {
                console.error("Failed to load exam:", error);
                toastError(error.message || "Không thể tải thông tin bài thi");
                router.push("/admin/list-exam");
            } finally {
                setLoading(false);
            }
        };

        fetchExamInfo();
    }, [examId, router]);

    // Poll live progress every 5 seconds
    useEffect(() => {
        if (!examId || loading) return;

        const fetchProgress = async () => {
            try {
                const data = await fetchApi(`/online-exams/${examId}/live-progress`);
                setParticipants(data || []);
            } catch (error: any) {
                console.error("Failed to fetch progress:", error);
            }
        };

        fetchProgress(); // Initial fetch

        const interval = setInterval(fetchProgress, 5000);
        return () => clearInterval(interval);
    }, [examId, loading]);

    // Update elapsed time every second
    useEffect(() => {
        if (!exam?.startedAt) return;

        const interval = setInterval(() => {
            const start = new Date(exam.startedAt).getTime();
            const now = Date.now();
            setElapsedTime(Math.floor((now - start) / 1000));
        }, 1000);

        return () => clearInterval(interval);
    }, [exam]);

    const getStatusText = (status: string) => {
        const statusMap: Record<string, string> = {
            'DRAFT': 'Nháp',
            'WAITING': 'Chờ',
            'IN_PROGRESS': 'Đang diễn ra',
            'FINISHED': 'Đã kết thúc'
        };
        return statusMap[status] || status;
    };

    const handleFinishExam = async () => {
        if (!exam) return;

        const result = await Swal.fire({
            title: 'Kết thúc bài thi?',
            html: `Bạn có chắc chắn muốn kết thúc bài thi <strong>"${exam.name}"</strong>?<br/>Tất cả học sinh sẽ tự động nộp bài.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Kết thúc',
            cancelButtonText: 'Hủy',
        });
        if (!result.isConfirmed) return;

        setIsFinishing(true);
        try {
            await fetchApi(`/online-exams/${examId}/finish`, { method: "POST" });
            toastSuccess("Đã kết thúc bài thi!");
            setTimeout(() => {
                router.push(`/admin/exam-online/${examId}/results`);
            }, 1500);
        } catch (error: any) {
            console.error("Failed to finish exam:", error);
            toastError(error.message || "Không thể kết thúc bài thi");
            setIsFinishing(false);
        }
    };

    // Sort participants for leaderboard
    const leaderboard = [...participants].sort((a, b) => {
        // Sort by: score DESC, questionsAnswered DESC, timeSpent ASC
        if (b.currentScore !== a.currentScore) {
            return b.currentScore - a.currentScore;
        }
        if (b.questionsAnswered !== a.questionsAnswered) {
            return b.questionsAnswered - a.questionsAnswered;
        }
        return a.timeSpent - b.timeSpent;
    });

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    };

    const getRankBadge = (rank: number) => {
        if (rank === 1) return "🥇";
        if (rank === 2) return "🥈";
        if (rank === 3) return "🥉";
        return `#${rank}`;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex items-center gap-2 text-purple-600">
                    <Loader2 className="animate-spin" />
                    <span>Đang tải...</span>
                </div>
            </div>
        );
    }

    if (!exam) return null;

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800 mb-2">{exam.name}</h1>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                                <div className="flex items-center gap-1">
                                    <Clock size={16} />
                                    <span>Thời gian: {formatTime(elapsedTime)}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Users size={16} />
                                    <span>
                                        {participants.length} / {exam.maxParticipants} học sinh
                                    </span>
                                </div>
                                <span
                                    className={`px-3 py-1 rounded-full text-xs font-medium ${exam.status === "IN_PROGRESS"
                                        ? "bg-green-100 text-green-700"
                                        : "bg-gray-100 text-gray-700"
                                        }`}
                                >
                                    {getStatusText(exam.status)}
                                </span>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => router.push("/admin/list-exam")}
                                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition flex items-center gap-2"
                            >
                                <LogOut size={18} />
                                Thoát
                            </button>
                            <button
                                onClick={handleFinishExam}
                                disabled={isFinishing}
                                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition flex items-center gap-2 disabled:opacity-50"
                            >
                                <StopCircle size={18} />
                                {isFinishing ? "Đang kết thúc..." : "Kết thúc bài thi"}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Leaderboard */}
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
                        <div className="flex items-center gap-3">
                            <Trophy size={32} />
                            <div>
                                <h2 className="text-2xl font-bold">Bảng xếp hạng trực tiếp</h2>
                                <p className="text-purple-100 text-sm">Cập nhật mỗi 5 giây</p>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Hạng
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Học sinh
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Tiến độ
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Điểm
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Thời gian
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {leaderboard.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                            <Users size={48} className="mx-auto mb-2 opacity-50" />
                                            <p>Chưa có học sinh nào làm bài</p>
                                        </td>
                                    </tr>
                                ) : (
                                    leaderboard.map((p, index) => {
                                        const rank = index + 1;
                                        const isTopThree = rank <= 3;
                                        const progressPercent = (p.questionsAnswered / p.totalQuestions) * 100;

                                        return (
                                            <tr
                                                key={p.studentId}
                                                className={`hover:bg-gray-50 transition ${isTopThree ? "bg-yellow-50" : ""
                                                    }`}
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span
                                                        className={`text-2xl font-bold ${rank === 1
                                                            ? "text-yellow-500"
                                                            : rank === 2
                                                                ? "text-gray-400"
                                                                : rank === 3
                                                                    ? "text-orange-600"
                                                                    : "text-gray-600"
                                                            }`}
                                                    >
                                                        {getRankBadge(rank)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <img
                                                            src={
                                                                p.avatarUrl ||
                                                                `https://ui-avatars.com/api/?name=${p.displayName}&background=random`
                                                            }
                                                            alt={p.displayName}
                                                            className="w-10 h-10 rounded-full mr-3"
                                                        />
                                                        <span className="font-medium text-gray-900">{p.displayName}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-sm font-medium text-gray-900 mb-1">
                                                            {p.questionsAnswered} / {p.totalQuestions}
                                                        </span>
                                                        <div className="w-24 bg-gray-200 rounded-full h-2">
                                                            <div
                                                                className="bg-purple-600 h-2 rounded-full transition-all"
                                                                style={{ width: `${progressPercent}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <span className="text-lg font-bold text-purple-600">
                                                        {p.currentScore.toFixed(1)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                                                    {formatTime(p.timeSpent)}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
