"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchApi } from "@/lib/apiClient";
import { toastError } from "@/lib/toast";
import { Trophy, Users, TrendingUp, Clock, Home, Loader2, CheckCircle, XCircle } from "lucide-react";

interface StudentResult {
    id: number;
    studentName: string;
    score: number;
    correctCount: number;
    totalQuestions: number;
    timeSpent: number;
    passed: boolean;
    submittedAt: string;
}

interface ExamSummary {
    examId: number;
    examName: string;
    totalSubmissions: number;
    averageScore: number;
    passRate: number;
    highestScore: number;
    lowestScore: number;
}

export default function TeacherResultsPage() {
    const params = useParams();
    const router = useRouter();
    const examId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [results, setResults] = useState<StudentResult[]>([]);
    const [examInfo, setExamInfo] = useState<any>(null);

    useEffect(() => {
        if (!examId) return;

        const fetchResults = async () => {
            try {
                setLoading(true);

                // Fetch exam info
                const exam = await fetchApi(`/online-exams/${examId}`);
                setExamInfo(exam);

                // Fetch all exam history for this exam
                const histories = await fetchApi(`/examHistory/online-exam/${examId}`);

                // Transform to StudentResult format
                const studentResults: StudentResult[] = histories.map((h: any) => ({
                    id: h.id,
                    studentName: h.displayName || h.studentName,
                    score: h.score,
                    correctCount: h.correctCount,
                    totalQuestions: h.totalQuestions,
                    timeSpent: h.timeSpent || 0,
                    passed: h.passed,
                    submittedAt: h.submittedAt,
                }));

                // Sort by score DESC
                studentResults.sort((a, b) => b.score - a.score);
                setResults(studentResults);
            } catch (error: any) {
                console.error("Failed to load results:", error);
                toastError(error.message || "Không thể tải kết quả");
                router.push("/teacher/list-exam");
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
    }, [examId, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex items-center gap-2 text-purple-600">
                    <Loader2 className="animate-spin" />
                    <span>Đang tải kết quả...</span>
                </div>
            </div>
        );
    }

    // Calculate statistics
    const totalSubmissions = results.length;
    const averageScore = totalSubmissions > 0
        ? results.reduce((sum, r) => sum + r.score, 0) / totalSubmissions
        : 0;
    const passedCount = results.filter((r) => r.passed).length;
    const passRate = totalSubmissions > 0 ? (passedCount / totalSubmissions) * 100 : 0;
    const highestScore = totalSubmissions > 0 ? Math.max(...results.map((r) => r.score)) : 0;
    const lowestScore = totalSubmissions > 0 ? Math.min(...results.map((r) => r.score)) : 0;

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${String(secs).padStart(2, "0")}`;
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800 mb-1">
                                Kết quả bài thi: {examInfo?.name}
                            </h1>
                            <p className="text-gray-600 text-sm">
                                Tổng số bài nộp: {totalSubmissions} học sinh
                            </p>
                        </div>
                        <button
                            onClick={() => router.push("/teacher/list-exam")}
                            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition flex items-center gap-2"
                        >
                            <Home size={18} />
                            Quay lại
                        </button>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white rounded-xl shadow-md p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Users className="text-blue-600" size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Tổng số bài nộp</p>
                                <p className="text-2xl font-bold text-gray-800">{totalSubmissions}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-md p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <TrendingUp className="text-purple-600" size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Điểm trung bình</p>
                                <p className="text-2xl font-bold text-gray-800">{averageScore.toFixed(1)}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-md p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-yellow-100 rounded-lg">
                                <Trophy className="text-yellow-600" size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Điểm cao nhất</p>
                                <p className="text-2xl font-bold text-gray-800">{highestScore.toFixed(1)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Results Table */}
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
                        <h2 className="text-xl font-bold">Danh sách kết quả</h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Hạng
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Học sinh
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                        Điểm
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                        Đúng/Tổng
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                        Thời gian
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {results.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                            <Users size={48} className="mx-auto mb-2 opacity-50" />
                                            <p>Chưa có học sinh nào nộp bài</p>
                                        </td>
                                    </tr>
                                ) : (
                                    results.map((result, index) => {
                                        const rank = index + 1;
                                        const isTopThree = rank <= 3;

                                        return (
                                            <tr
                                                key={result.id}
                                                className={`hover:bg-gray-50 transition ${isTopThree ? "bg-yellow-50" : ""
                                                    }`}
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span
                                                        className={`text-xl font-bold ${rank === 1
                                                            ? "text-yellow-500"
                                                            : rank === 2
                                                                ? "text-gray-400"
                                                                : rank === 3
                                                                    ? "text-orange-600"
                                                                    : "text-gray-600"
                                                            }`}
                                                    >
                                                        {rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `#${rank}`}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="font-medium text-gray-900">{result.studentName}</span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <span className="text-lg font-bold text-purple-600">
                                                        {result.score.toFixed(1)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <span className="text-gray-700">
                                                        {result.correctCount}/{result.totalQuestions}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center text-gray-600">
                                                    {formatTime(result.timeSpent)}
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
