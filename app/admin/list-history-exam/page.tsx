"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchApi } from "@/lib/apiClient";
import toast from "react-hot-toast";

interface ExamHistory {
    id: number;
    studentId: number;
    displayName: string;
    submittedAt: string;
    attemptNumber: number;
    correctCount: number;
    totalQuestions: number;
    score: number;
}

export default function AdminListHistoryExamPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const examId = searchParams.get('examId');

    const [histories, setHistories] = useState<ExamHistory[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!examId) {
            toast.error("Không tìm thấy ID bài thi");
            router.push("/admin/history-exam");
            return;
        }

        const fetchHistory = async () => {
            try {
                const data = await fetchApi(`/examHistory/get/${examId}`); // GET /api/examHistory/get/{examId}

                // Map Data
                const mapped: ExamHistory[] = Array.isArray(data) ? data.map((h: any) => ({
                    id: h.id,
                    studentId: h.studentId,
                    displayName: h.displayName,
                    submittedAt: h.submittedAt ? new Date(h.submittedAt).toLocaleString('vi-VN') : '',
                    attemptNumber: h.attemptNumber || 1,
                    correctCount: h.correctCount,
                    totalQuestions: h.totalQuestions,
                    score: h.score
                })) : [];

                setHistories(mapped);
            } catch (error) {
                console.error("Fetch history error:", error);
                toast.error("Không thể tải lịch sử làm bài.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchHistory();
    }, [examId, router]);


    return (
        <div className="min-h-screen bg-[#F5F5F5] flex flex-col">

            {/* ========== CONTENT ========== */}
            <main className="flex-1 px-10 py-8">

                {/* ===== TAB ===== */}
                <div className="border-b border-gray-300 mb-6 flex gap-8 text-sm font-medium">

                    <button
                        onClick={() => router.push("/admin/history-exam")}
                        className="pb-2 text-gray-500 hover:text-black"
                    >
                        Bài thi
                    </button>

                    <button className="pb-2 border-b-2 border-black">
                        Danh sách lịch sử thi
                    </button>

                </div>

                {/* ===== BOX ===== */}
                <div className="bg-white rounded-xl p-6 shadow">

                    {/* ===== SEARCH ===== */}
                    <div className="flex items-center gap-4 mb-6">
                        <input
                            placeholder="Nhập tên sinh viên..."
                            className="h-10 px-4 border border-gray-300 rounded-full w-64"
                        />

                        <button className="bg-[#A53AEC] text-white px-6 py-2 rounded-full">
                            Tìm kiếm
                        </button>
                    </div>

                    {/* ===== TABLE ===== */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden min-h-[300px]">

                        <table className="w-full text-sm text-center border-collapse">
                            <thead className="pb-2 border-b-2 border-black">
                                <tr className="bg-gray-50 font-semibold text-gray-700">
                                    <th className="py-3 border">STT</th>
                                    <th className="py-3 border">Tên sinh viên</th>
                                    <th className="py-3 border">Thời gian nộp</th>
                                    <th className="py-3 border">Lượt thi</th>
                                    <th className="py-3 border">Số câu đúng</th>
                                    <th className="py-3 border">Điểm</th>
                                    <th className="py-3 border">Thao tác</th>
                                </tr>
                            </thead>

                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={7} className="py-10 text-center">Đang tải dữ liệu...</td>
                                    </tr>
                                ) : histories.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-10 text-center text-gray-500">Chưa có lượt thi nào.</td>
                                    </tr>
                                ) : (
                                    histories.map((h, index) => (
                                        <tr key={h.id} className="hover:bg-gray-50">
                                            <td className="py-3 border">{index + 1}</td>
                                            <td className="py-3 border font-medium text-gray-800">{h.displayName}</td>
                                            <td className="py-3 border">{h.submittedAt}</td>
                                            <td className="py-3 border">Lần {h.attemptNumber}</td>
                                            <td className="py-3 border text-green-600 font-semibold">{h.correctCount}/{h.totalQuestions}</td>
                                            <td className="py-3 border font-bold text-[#A53AEC]">{h.score}</td>
                                            <td className="py-3 border">
                                                <button className="text-blue-600 hover:text-blue-800 hover:underline">
                                                    Chi tiết
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>

                    </div>

                    {/* ===== PAGINATION ===== */}
                    <div className="flex justify-center items-center gap-2 mt-6">
                        <button className="border border-blue-500 text-blue-500 px-2 py-1 rounded hover:bg-blue-50">«</button>
                        <button className="border border-blue-500 text-blue-500 px-2 py-1 rounded hover:bg-blue-50">‹</button>

                        <button className="bg-blue-500 text-white px-4 py-1 rounded">1</button>

                        <button className="border border-blue-500 text-blue-500 px-2 py-1 rounded hover:bg-blue-50">›</button>
                        <button className="border border-blue-500 text-blue-500 px-2 py-1 rounded hover:bg-blue-50">»</button>
                    </div>

                </div>

            </main>

            {/* ========== FOOTER ========== */}
            <footer className="bg-[#F5F5F5] border-t border-gray-200 text-center text-sm text-gray-500 py-6 mt-10">
                © 2025 QuizzZone. Mọi quyền được bảo lưu.
            </footer>

        </div>
    );
}
