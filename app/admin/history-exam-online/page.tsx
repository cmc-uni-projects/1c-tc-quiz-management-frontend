// Cleaned & optimized version
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/apiClient";
import { toastError } from "@/lib/toast";
import { FileText, Users, TrendingUp, Eye, Loader2, Calendar } from "lucide-react";

interface FinishedExam {
    id: number;
    name: string;
    finishedAt: string;
    totalSubmissions: number;
    averageScore: number;
}

export default function AdminExamHistoryPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [exams, setExams] = useState<FinishedExam[]>([]);

    useEffect(() => {
        const fetchFinishedExams = async () => {
            try {
                setLoading(true);
                // Fetch all exams (Admin sees all)
                const allExams = await fetchApi("/online-exams/all");

                // Filter only FINISHED exams
                const finishedExams = allExams.filter((exam: any) => exam.status === "FINISHED");

                // For each exam, fetch submission count
                const examsWithStats = await Promise.all(
                    finishedExams.map(async (exam: any) => {
                        try {
                            const histories = await fetchApi(`/examHistory/online-exam/${exam.id}`);
                            const totalSubmissions = histories.length;
                            const averageScore = totalSubmissions > 0
                                ? histories.reduce((sum: number, h: any) => sum + h.score, 0) / totalSubmissions
                                : 0;

                            return {
                                id: exam.id,
                                name: exam.name,
                                finishedAt: exam.finishedAt,
                                totalSubmissions,
                                averageScore,
                            };
                        } catch {
                            return {
                                id: exam.id,
                                name: exam.name,
                                finishedAt: exam.finishedAt,
                                totalSubmissions: 0,
                                averageScore: 0,
                            };
                        }
                    })
                );

                setExams(examsWithStats);
            } catch (error: any) {
                console.error("Failed to load finished exams:", error);
                toastError(error.message || "Không thể tải lịch sử bài thi");
            } finally {
                setLoading(false);
            }
        };

        fetchFinishedExams();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex items-center gap-2 text-purple-600">
                    <Loader2 className="animate-spin" />
                    <span>Đang tải lịch sử...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6 flex flex-col">
            <div className="max-w-7xl mx-auto w-full">

                {/* ===================== TAB ===================== */}
                <div className="flex items-center justify-between mb-8 bg-white px-6 py-2 rounded-xl shadow-sm">
                    <div className="flex gap-8 text-sm font-bold border-b border-gray-100 w-full">
                        <button
                            onClick={() => router.push("/admin/list-exam")}
                            className="pb-3 pt-2 text-gray-500 hover:text-[#A53AEC]"
                        >
                            <span className="text-base">Bài thi</span>
                        </button>

                        <button
                            onClick={() => router.push("/admin/history-exam")}
                            className="pb-3 pt-2 text-gray-500 hover:text-[#A53AEC]"
                        >
                            <span className="text-base">Lịch sử thi offline</span>
                        </button>

                        <button
                            className="pb-3 pt-2 text-[#A53AEC] border-b-2 border-[#A53AEC]"
                        >
                            <span className="text-base">Lịch sử thi online</span>
                        </button>
                    </div>
                </div>

                {/* Header */}
                <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-purple-100 rounded-lg">
                            <FileText className="text-purple-600" size={32} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">Lịch sử bài thi Online</h1>
                            <p className="text-gray-600 text-sm">
                                Tổng số bài thi đã kết thúc: {exams.length}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Exams Table */}
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-semibold">Tên bài thi</th>
                                    <th className="px-6 py-4 text-center text-sm font-semibold">Ngày kết thúc</th>
                                    <th className="px-6 py-4 text-center text-sm font-semibold">Số bài nộp</th>
                                    <th className="px-6 py-4 text-center text-sm font-semibold">Điểm TB</th>
                                    <th className="px-6 py-4 text-center text-sm font-semibold">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {exams.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                            <FileText size={48} className="mx-auto mb-2 opacity-50" />
                                            <p>Chưa có bài thi online nào đã kết thúc</p>
                                        </td>
                                    </tr>
                                ) : (
                                    exams.map((exam) => (
                                        <tr key={exam.id} className="hover:bg-gray-50 transition">
                                            <td className="px-6 py-4">
                                                <span className="font-medium text-gray-900">{exam.name}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center text-gray-600">
                                                <div className="flex items-center justify-center gap-1">
                                                    <Calendar size={16} />
                                                    {exam.finishedAt
                                                        ? new Date(exam.finishedAt).toLocaleDateString("vi-VN")
                                                        : "---"}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center gap-1 text-blue-600">
                                                    <Users size={16} />
                                                    <span className="font-semibold">{exam.totalSubmissions}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center gap-1 text-purple-600">
                                                    <TrendingUp size={16} />
                                                    <span className="font-bold">{exam.averageScore.toFixed(1)}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={() => router.push(`/admin/exam-online/${exam.id}/results`)}
                                                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition flex items-center gap-2 mx-auto"
                                                >
                                                    <Eye size={16} />
                                                    Xem kết quả
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

