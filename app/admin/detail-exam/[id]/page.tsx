"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchApi } from "@/lib/apiClient";
import { toastError } from "@/lib/toast";
import { useUser } from "@/lib/user";

// ===== TYPES =====
interface Answer {
    id?: number;
    text: string;
    isCorrect: boolean;
}

interface Question {
    id?: number;
    title: string;
    type: string;
    difficulty: string;
    categoryId: string | number;
    categoryName?: string;
    answers: Answer[];
    isReadOnly?: boolean;
}

interface ExamData {
    title: string;
    durationMinutes: number;
    categoryName: string;
    examLevel: string;
    startTime: string;
    endTime: string;
    questions: Question[];
}

interface Category {
    id: number;
    name: string;
}

const ReadOnlyField = ({ label, value }: { label: string, value: string | number }) => (
    <div>
        <label className="block text-sm font-medium text-gray-500">{label}</label>
        <div className="mt-1 p-2 bg-gray-100 border border-gray-200 rounded-md text-gray-800">
            {value}
        </div>
    </div>
);

function DifficultyBadge({ difficulty }: { difficulty: string }) {
    const diff = difficulty?.toUpperCase();
    let colorClass = "bg-gray-100 text-gray-800";
    switch (diff) {
        case "EASY": colorClass = "bg-green-100 text-green-800"; break;
        case "MEDIUM": colorClass = "bg-yellow-100 text-yellow-800"; break;
        case "HARD": colorClass = "bg-red-100 text-red-800"; break;
    }
    const difficultyMap: Record<string, string> = { 'EASY': 'Dễ', 'MEDIUM': 'Trung bình', 'HARD': 'Khó' };
    const text = diff ? (difficultyMap[diff] || diff) : "N/A";
    return <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>{text}</span>;
}

export default function DetailExamPage() {
    const { id } = useParams();
    const router = useRouter();
    const { user } = useUser();
    const [loading, setLoading] = useState(true);
    const [examData, setExamData] = useState<ExamData | null>(null);

    // Fetch Data
    useEffect(() => {
        const fetchData = async () => {
            if (!user || !id) return;
            try {
                const exam = await fetchApi(`/exams/get/${id}`);

                const startTimeObj = exam.startTime ? new Date(exam.startTime) : null;
                const endTimeObj = exam.endTime ? new Date(exam.endTime) : null;

                const mappedQuestions = exam.examQuestions?.map((eq: any) => ({
                    id: eq.question.id,
                    title: eq.question.title,
                    type: eq.question.type,
                    difficulty: eq.question.difficulty,
                    answers: eq.question.answers.map((a: any) => ({
                        id: a.id,
                        text: a.text,
                        isCorrect: a.correct || false,
                    })),
                })) || [];

                const difficultyMap: Record<string, string> = {
                    'EASY': 'Dễ',
                    'MEDIUM': 'Trung bình',
                    'HARD': 'Khó'
                };

                setExamData({
                    title: exam.title,
                    durationMinutes: exam.durationMinutes,
                    categoryName: exam.category?.name || "Không có",
                    examLevel: difficultyMap[exam.examLevel] || exam.examLevel,
                    startTime: startTimeObj ? startTimeObj.toLocaleString('vi-VN') : 'Không có',
                    endTime: endTimeObj ? endTimeObj.toLocaleString('vi-VN') : 'Không có',
                    questions: mappedQuestions,
                });
            } catch (error) {
                console.error("Failed to load data:", error);
                toastError("Không thể tải thông tin bài thi.");
                router.push("/admin/list-exam");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id, user, router]);

    const getQuestionTypeDisplay = (type: string) => {
        switch (type) {
            case "SINGLE": return "Chọn 1 đáp án";
            case "MULTIPLE": return "Chọn nhiều đáp án";
            case "TRUE_FALSE": return "Đúng/Sai";
            default: return type;
        }
    };

    if (loading || !examData) return <div className="p-10 text-center">Đang tải chi tiết bài thi...</div>;

    return (
        <div className="min-h-screen bg-white p-8">
            <div className="max-w-5xl mx-auto space-y-6">

                {/* Back Button */}
                <div className="mb-4">
                    <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600 hover:text-black font-medium">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        Quay lại
                    </button>
                </div>

                {/* ======= THÔNG TIN BÀI THI ======= */}
                <section className="bg-white rounded-2xl shadow border p-8">
                    <h2 className="text-2xl font-semibold text-center mb-8">
                        Chi tiết bài thi
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="col-span-2">
                            <ReadOnlyField label="Tên bài thi" value={examData.title} />
                        </div>
                        <div>
                            <ReadOnlyField label="Danh mục bài thi" value={examData.categoryName} />
                        </div>
                        <div>
                            <ReadOnlyField label="Loại đề thi" value={examData.examLevel} />
                        </div>
                        <div>
                             <ReadOnlyField label="Thời gian làm bài (phút)" value={examData.durationMinutes} />
                        </div>
                        <div>
                            <ReadOnlyField label="Thời gian bắt đầu" value={examData.startTime} />
                        </div>
                         <div>
                            <ReadOnlyField label="Thời gian kết thúc" value={examData.endTime} />
                        </div>
                    </div>
                </section>

                {/* ======= KHUNG NỘI DUNG CÂU HỎI ======= */}
                <section className="bg-white rounded-2xl shadow border p-8 space-y-6">
                    <h3 className="text-xl font-semibold">Danh sách câu hỏi ({examData.questions.length})</h3>

                    {examData.questions.map((q, qIndex) => (
                        <section key={qIndex} className="bg-white rounded-2xl p-6 border border-gray-200">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-lg font-semibold text-gray-800">
                                    Câu hỏi {qIndex + 1}
                                </h3>
                                <div className="flex items-center gap-4">
                                     <span className="text-sm bg-gray-100 text-gray-700 px-2 py-1 rounded">{getQuestionTypeDisplay(q.type)}</span>
                                     <DifficultyBadge difficulty={q.difficulty} />
                                </div>
                            </div>

                            <p className="mb-4 text-gray-900">{q.title}</p>
                            
                            {/* Danh sách đáp án */}
                            <div className="space-y-3">
                                {q.answers.map((a, aIndex) => (
                                    <div key={aIndex} className={`flex items-center gap-3 p-3 rounded-lg border ${a.isCorrect ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-100'}`}>
                                        <div className="w-5 h-5 flex-shrink-0">
                                            <input
                                                type={q.type === "MULTIPLE" ? "checkbox" : "radio"}
                                                checked={a.isCorrect}
                                                readOnly
                                                className="w-5 h-5 cursor-default"
                                            />
                                        </div>
                                        <span className={`flex-1 ${a.isCorrect ? 'font-semibold text-green-800' : ''}`}>{a.text}</span>
                                    </div>
                                ))}
                            </div>
                        </section>
                    ))}
                </section>
            </div>
        </div>
    );
}
