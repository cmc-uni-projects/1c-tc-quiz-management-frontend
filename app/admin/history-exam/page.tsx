"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/apiClient";
import toast from "react-hot-toast";

// ===== ICON =====
const ClockIcon = () => <span>🕒</span>;
const CalendarIcon = () => <span>📅</span>;

const MoreIcon = () => (
    <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
        <circle cx="12" cy="6" r="2" />
        <circle cx="12" cy="12" r="2" />
        <circle cx="12" cy="18" r="2" />
    </svg>
);

interface Exam {
    examId: number;
    title: string;
    startTime: string;
    endTime: string;
    durationMinutes: number;
    questionCount: number;
    status?: string; // Derived
}

export default function AdminHistoryExamPage() {
    const router = useRouter();
    const [openMenu, setOpenMenu] = useState<number | null>(null);
    const [exams, setExams] = useState<Exam[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch Exams
    useEffect(() => {
        const fetchExams = async () => {
            try {
                const data = await fetchApi("/exams/my"); // GET /api/exams/my
                // Map response to UI
                const mapped: Exam[] = Array.isArray(data) ? data.map((e: any) => ({
                    examId: e.examId,
                    title: e.title,
                    startTime: e.startTime ? new Date(e.startTime).toLocaleString('vi-VN') : 'Không giới hạn',
                    endTime: e.endTime ? new Date(e.endTime).toLocaleString('vi-VN') : 'Không giới hạn',
                    durationMinutes: e.durationMinutes,
                    questionCount: e.questionCount || e.examQuestions?.length || 0,
                    status: calculateStatus(e.startTime, e.endTime)
                })) : [];
                setExams(mapped);
            } catch (error) {
                console.error("Fetch exams error:", error);
                toast.error("Không thể tải danh sách bài thi.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchExams();
    }, []);

    const calculateStatus = (start?: string, end?: string) => {
        const now = new Date();
        if (end && new Date(end) < now) return "Đã kết thúc";
        if (start && new Date(start) > now) return "Chưa bắt đầu";
        return "Đang diễn ra";
    };

    const navigateToDetail = (examId: number) => {
        router.push(`/admin/list-history-exam?examId=${examId}`);
    };

    return (
        <div className="min-h-screen flex flex-col bg-[#F5F5F5]">

            {/* ================= CONTENT ================= */}
            <main className="flex-1 px-10 py-8">

                {/* ===== TAB ===== */}
                <div className="border-b border-gray-200 mb-6 flex gap-6 text-sm">
                    <button
                        onClick={() => router.push("/admin/list-exam")}
                        className="pb-2 text-gray-500 hover:text-black"
                    >
                        Danh sách bài thi
                    </button>

                    <button className="pb-2 border-b-2 border-black font-medium">
                        Lịch sử
                    </button>
                </div>

                {/* ===== FILTER ===== */}
                <div className="p-6 rounded-lg mb-8">

                    <div className="flex flex-wrap items-end gap-4">

                        <input
                            placeholder="Nhập từ khóa tìm kiếm..."
                            className="h-10 px-4 border border-gray-300 rounded-full bg-white w-[200px]"
                        />

                        <div className="flex flex-col">
                            <label className="text-sm mb-1">Thời gian bắt đầu:</label>
                            <input
                                type="date"
                                className="h-10 px-4 border border-gray-300 rounded-full bg-white w-[200px]"
                            />
                        </div>

                        <div className="flex flex-col">
                            <label className="text-sm mb-1">Thời gian kết thúc:</label>
                            <input
                                type="date"
                                className="h-10 px-4 border border-gray-300 rounded-full bg-white w-[200px]"
                            />
                        </div>

                        <button className="bg-[#A53AEC] text-white px-6 py-2 rounded-full">
                            Tìm kiếm
                        </button>

                    </div>

                    {/* ===== CARD LIST ===== */}
                    {isLoading ? (
                        <div className="text-center py-10">Đang tải dữ liệu...</div>
                    ) : exams.length === 0 ? (
                        <div className="text-center py-10 text-gray-500">Chưa có bài thi nào.</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {exams.map((exam) => (
                                <div
                                    key={exam.examId}
                                    className="mt-10 w-full bg-white border rounded-lg p-4 relative shadow hover:shadow-md transition"
                                >
                                    <p className="font-semibold text-lg mb-2 line-clamp-1" title={exam.title}>{exam.title}</p>

                                    <div className="text-sm space-y-1 text-gray-600">
                                        <p className="flex items-center gap-2">
                                            <ClockIcon /> Bắt đầu: {exam.startTime}
                                        </p>

                                        <p className="flex items-center gap-2">
                                            <CalendarIcon /> Kết thúc: {exam.endTime}
                                        </p>

                                        <p>⏳ Thời gian: {exam.durationMinutes} phút</p>
                                        <p>📘 Câu hỏi: {exam.questionCount} câu</p>
                                    </div>

                                    {/* Trạng thái + xem chi tiết ở giữa */}
                                    <div className="flex flex-col items-center justify-center mt-4 gap-2">
                                        <span className={`font-semibold flex items-center gap-1 ${exam.status === 'Đã kết thúc' ? 'text-red-500' : 'text-green-600'}`}>
                                            ● {exam.status}
                                        </span>

                                        <button
                                            onClick={() => navigateToDetail(exam.examId)}
                                            className="text-sm text-blue-600 hover:text-blue-800 hover:underline font-medium"
                                        >
                                            Xem lịch sử làm bài
                                        </button>

                                    </div>

                                    {/* nút 3 chấm */}
                                    <button
                                        onClick={() =>
                                            setOpenMenu(openMenu === exam.examId ? null : exam.examId)
                                        }
                                        className="absolute right-3 bottom-3 text-gray-400 hover:text-gray-600"
                                    >
                                        <MoreIcon />
                                    </button>

                                    {/* MENU XÓA (Placeholder) */}
                                    {openMenu === exam.examId && (
                                        <div className="absolute right-3 bottom-12 bg-white border rounded-md shadow w-28 z-50">
                                            <button
                                                className="block w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
                                                onClick={() => setOpenMenu(null)}
                                            >
                                                Xóa bài thi
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {/* ================= FOOTER ================= */}
            <footer className="bg-[#F5F5F5] border-t text-center text-sm text-gray-500 py-4">
                © 2025 QuizzZone. Mọi quyền được bảo lưu.
            </footer>

        </div>
    );
}
