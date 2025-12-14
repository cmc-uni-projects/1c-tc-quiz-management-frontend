"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchApi } from "@/lib/apiClient";
import { toastError } from "@/lib/toast";
import { CheckCircle, XCircle, Clock, Trophy, Home, Loader2 } from "lucide-react";

interface ExamResult {
    examHistoryId: number;
    examId: number;
    examOnlineId?: number;
    examTitle: string;
    score: number;
    correctCount: number;
    wrongCount: number;
    totalQuestions: number;
    passed: boolean;
    submittedAt: string;
}

export default function StudentExamResultPage() {
    const params = useParams();
    const router = useRouter();
    const historyId = params.historyId as string;

    const [loading, setLoading] = useState(true);
    const [result, setResult] = useState<ExamResult | null>(null);
    const [rank, setRank] = useState<number | null>(null);
    const [totalParticipants, setTotalParticipants] = useState<number>(0);

    useEffect(() => {
        if (!historyId) return;

        const fetchResult = async () => {
            try {
                setLoading(true);
                const data = await fetchApi(`/examHistory/detail/${historyId}`);
                console.log("[DEBUG] Exam result data:", data);
                console.log("[DEBUG] examOnlineId:", data.examOnlineId);
                setResult(data);

                // Fetch ranking if this is an online exam
                if (data.examOnlineId) {
                    console.log("[DEBUG] Fetching ranking for examOnlineId:", data.examOnlineId);
                    try {
                        const allResults = await fetchApi(`/examHistory/online-exam/${data.examOnlineId}`);
                        console.log("[DEBUG] All results:", allResults);
                        // Sort by score descending
                        const sorted = allResults.sort((a: any, b: any) => b.score - a.score);
                        const studentRank = sorted.findIndex((r: any) => r.id === data.examHistoryId) + 1;
                        console.log("[DEBUG] Student rank:", studentRank, "out of", sorted.length);
                        setRank(studentRank);
                        setTotalParticipants(sorted.length);
                    } catch (rankError) {
                        console.error("Failed to load ranking:", rankError);
                    }
                } else {
                    console.log("[DEBUG] No examOnlineId found, skipping ranking");
                }
            } catch (error: any) {
                console.error("Failed to load result:", error);
                toastError(error.message || "Không thể tải kết quả");
                router.push("/student/studenthome");
            } finally {
                setLoading(false);
            }
        };

        fetchResult();
    }, [historyId, router]);

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

    if (!result) return null;

    const percentage = (result.score / 10) * 100;

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-24 h-24 rounded-full mb-4 bg-purple-100">
                        <Trophy size={48} className="text-purple-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">
                        Kết quả bài thi
                    </h1>
                    <p className="text-gray-600">{result.examTitle}</p>
                </div>

                {/* Score Card */}
                <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
                    <div className="text-center mb-8">
                        <div className="text-6xl font-bold text-purple-600 mb-2">
                            {result.score.toFixed(1)}
                            <span className="text-3xl text-gray-400">/10</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-4 mt-4">
                            <div
                                className="h-4 rounded-full transition-all bg-purple-500"
                                style={{ width: `${percentage}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Statistics */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="text-center p-4 bg-green-50 rounded-xl">
                            <CheckCircle className="mx-auto mb-2 text-green-600" size={32} />
                            <div className="text-2xl font-bold text-green-600">{result.correctCount}</div>
                            <div className="text-sm text-gray-600">Câu đúng</div>
                        </div>

                        <div className="text-center p-4 bg-red-50 rounded-xl">
                            <XCircle className="mx-auto mb-2 text-red-600" size={32} />
                            <div className="text-2xl font-bold text-red-600">{result.wrongCount}</div>
                            <div className="text-sm text-gray-600">Câu sai</div>
                        </div>

                        <div className="text-center p-4 bg-blue-50 rounded-xl">
                            <Trophy className="mx-auto mb-2 text-blue-600" size={32} />
                            <div className="text-2xl font-bold text-blue-600">{result.totalQuestions}</div>
                            <div className="text-sm text-gray-600">Tổng câu hỏi</div>
                        </div>

                        {rank && (
                            <div className="text-center p-4 bg-yellow-50 rounded-xl">
                                <div className="mx-auto mb-2 text-4xl">
                                    {rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : "🏅"}
                                </div>
                                <div className="text-2xl font-bold text-yellow-600">#{rank}</div>
                                <div className="text-sm text-gray-600">Xếp hạng ({totalParticipants} người)</div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                    <h3 className="font-bold text-lg mb-4 text-gray-800">Thông tin chi tiết</h3>
                    <div className="space-y-3 text-gray-700">
                        <div className="flex justify-between">
                            <span>Thời gian nộp bài:</span>
                            <span className="font-medium">
                                {new Date(result.submittedAt).toLocaleString("vi-VN")}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span>Tỷ lệ đúng:</span>
                            <span className="font-medium">{percentage.toFixed(1)}%</span>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-center gap-4">
                    <button
                        onClick={() => router.push("/student/studenthome")}
                        className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold flex items-center gap-2 transition shadow-lg"
                    >
                        <Home size={20} />
                        Về trang chủ
                    </button>
                </div>

                {/* Motivational Message */}
                <div className="mt-8 text-center">
                    <p className="text-gray-600 italic">
                        "Thành công là kết quả của sự chuẩn bị, làm việc chăm chỉ và học hỏi từ kinh nghiệm." 🎉
                    </p>
                </div>
            </div>
        </div>
    );
}
