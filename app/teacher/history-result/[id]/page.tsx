"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchApi } from "@/lib/apiClient";
import toast from "react-hot-toast";

// --- Interfaces ---
interface StudentAnswerDto {
    questionId: number;
    answerId: number;
    isCorrect: boolean;
}

interface ExamResultDto {
    examHistoryId: number;
    examId: number;
    examTitle: string;
    score: number;
    correctCount: number;
    wrongCount: number;
    totalQuestions: number;
    submittedAt: string;
    studentAnswers: StudentAnswerDto[];
    studentName?: string;
    studentEmail?: string;
    studentId?: number; // Added if available
    displayName?: string; // Added if available
    attemptNumber?: number; // Added if available
    categoryName?: string;
}

interface AnswerOption {
    id: number;
    text: string;
    correct: boolean;
}

interface Question {
    id: number;
    title: string;
    type: string; // 'SINGLE' | 'MULTIPLE' | 'TRUE_FALSE'
    answers: AnswerOption[];
}

interface ExamDetail {
    examId: number;
    title: string;
    durationMinutes: number;
    examLevel: string;
    examQuestions: { question: Question }[];
}

export default function TeacherHistoryResultPage() {
    const params = useParams();
    const router = useRouter();
    const historyId = params.id;

    const [history, setHistory] = useState<ExamResultDto | null>(null);
    const [exam, setExam] = useState<ExamDetail | null>(null);
    const [loading, setLoading] = useState(true);

    // Helper: Map for fast lookup of selected answers: questionId -> { answerId: isCorrect }
    const [selectedAnswersMap, setSelectedAnswersMap] = useState<Record<number, Record<number, boolean>>>({});

    useEffect(() => {
        if (!historyId) return;

        const loadData = async () => {
            try {
                setLoading(true);

                // 1. Get History Detail
                const historyData: ExamResultDto = await fetchApi(`/examHistory/detail/${historyId}`);

                setHistory(historyData);
                console.log("History Loaded:", historyData);
                console.log("Student Answers:", historyData.studentAnswers);

                // Map student answers for easy lookup: questionId -> { answerId: isCorrect }
                const answersMap: Record<number, Record<number, boolean>> = {};
                if (historyData.studentAnswers) {
                    historyData.studentAnswers.forEach(sa => {
                        if (!answersMap[sa.questionId]) {
                            answersMap[sa.questionId] = {};
                        }
                        answersMap[sa.questionId][sa.answerId] = sa.isCorrect;
                    });
                }
                setSelectedAnswersMap(answersMap);

                // 2. Get Exam Questions (for text and options)
                if (historyData.examId) {
                    const examData = await fetchApi(`/exams/get/${historyData.examId}`);
                    setExam(examData);
                }

            } catch (error) {
                console.error("Load detail error:", error);
                toast.error("Không thể tải chi tiết lịch sử.");
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [historyId]);

    if (loading) return (
        <div className="flex justify-center items-center min-h-screen bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
    );

    if (!history || !exam) return (
        <div className="flex justify-center items-center min-h-screen">
            <p className="text-red-500 font-semibold">Không tìm thấy dữ liệu bài thi.</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-white text-sm text-gray-800">
            {/* Main Container */}
            <div className="max-w-5xl mx-auto py-8 px-4">

                {/* Back Button */}
                <button onClick={() => router.back()} className="mb-4 text-gray-500 hover:text-black flex items-center gap-1">
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Quay lại
                </button>

                {/* --- HEADER SECTION --- */}
                <div className="bg-gray-200/60 rounded-t-lg border-b border-gray-300">
                    <h1 className="text-2xl font-bold p-6">{history.examTitle}</h1>
                </div>

                {/* Info Bar 1 */}
                <div className="bg-gray-200/60 px-6 py-4 grid grid-cols-4 gap-4 border-b border-gray-300">
                    <div>
                        <span className="block text-gray-500 mb-1">Số lượng câu hỏi:</span>
                        <span className="font-semibold">{history.totalQuestions} câu hỏi</span>
                    </div>
                    <div>
                        <span className="block text-gray-500 mb-1">Loại đề thi:</span>
                        <span className="font-semibold">
                            {exam.examLevel.toUpperCase() === 'EASY' ? 'Dễ' : 
                             exam.examLevel.toUpperCase() === 'MEDIUM' ? 'Trung bình' : 
                             exam.examLevel.toUpperCase() === 'HARD' ? 'Khó' : exam.examLevel}
                        </span>
                    </div>
                    <div>
                        <span className="block text-gray-500 mb-1">Thời gian nộp bài:</span>
                        <span className="font-semibold">{new Date(history.submittedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                    </div>
                    <div>
                        <span className="block text-gray-500 mb-1">Danh mục:</span>
                        <span className="font-semibold">{history.categoryName || 'N/A'}</span>
                    </div>
                </div>

                {/* Info Bar 2 (Student & Stats) */}
                <div className="bg-gray-200/60 px-6 py-4 grid grid-cols-4 gap-4 rounded-b-lg mb-8 items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-600">
                            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        <div>
                            <p className="font-semibold text-base">{history.studentName || history.displayName || 'Học sinh'}</p>
                            <p className="text-gray-500 text-xs">{history.studentEmail || 'Không có email'}</p>
                        </div>
                    </div>

                    <div className="text-center">
                        <span className="block text-gray-500 mb-1">Số điểm:</span>
                        <span className="font-semibold text-lg">{history.score}</span>
                    </div>

                    <div className="text-center">
                        <span className="block text-gray-500 mb-1">Lượt thi:</span>
                        <span className="font-semibold text-lg">{history.attemptNumber || 1}</span>
                    </div>
                </div>

                {/* --- QUESTIONS LIST --- */}
                <div className="space-y-8">
                    {exam.examQuestions?.map(({ question: q }, index) => {
                        const studentSelectedIds = selectedAnswersMap[q.id]; // Now Record<number, boolean> | undefined
                        const isMultiple = q.type === 'MULTIPLE';

                        return (
                            <div key={q.id} className="border-b pb-6 last:border-0">
                                {/* Question Title */}
                                <div className="flex gap-2 mb-3">
                                    <span className="font-bold whitespace-nowrap">{index + 1}.</span>
                                    <h3 className="font-bold text-gray-900">{q.title}</h3>
                                </div>

                                {/* Answers */}
                                <div className="space-y-2 ml-6">
                                    {q.answers.map((ans) => {
                                        const selectedRecord = studentSelectedIds || {};
                                        const isSelected = selectedRecord[ans.id] !== undefined;
                                        const isSnapshotCorrect = isSelected ? selectedRecord[ans.id] : false;

                                        // Default
                                        let textStyle = "text-gray-700";
                                        let icon = (
                                            <div className="w-4 h-4 rounded-full border border-gray-400 mr-3 flex items-center justify-center"></div>
                                        );
                                        let containerStyle = "flex items-center p-2 rounded-lg";

                                        if (isSelected) {
                                            if (isSnapshotCorrect) { // User picked THIS ONE and it is CORRECT
                                                textStyle = "text-[#059669] font-bold"; // Green
                                                containerStyle += " bg-green-50 border border-green-200";
                                                icon = (
                                                    <div className="w-4 h-4 rounded-full border border-[#059669] bg-[#059669] mr-3 flex items-center justify-center">
                                                        <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                                    </div>
                                                );
                                            } else { // User picked THIS ONE and it is WRONG
                                                textStyle = "text-red-600 font-medium";
                                                containerStyle += " bg-red-50 border border-red-200";
                                                icon = (
                                                    <div className="w-4 h-4 rounded-full border border-red-500 bg-red-500 mr-3 flex items-center justify-center">
                                                        <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                                    </div>
                                                );
                                            }
                                        }

                                        return (
                                            <div key={ans.id} className={containerStyle}>
                                                {icon}
                                                <span className={textStyle}>{ans.text}</span>
                                            </div>
                                        )
                                    })}
                                </div>

                                {/* Correct Answer Box */}
                                <div className="mt-4 ml-6 p-4 bg-[#F3EBFD] rounded-lg">
                                    <div className="flex flex-col items-start gap-3">
                                        <span className="bg-[#4D1597] text-white text-xs px-2 py-1 rounded font-bold uppercase tracking-wider shrink-0">
                                            Đáp án
                                        </span>
                                        <div className="text-[#4D1597] font-medium flex flex-col gap-1">
                                            {q.answers.filter(a => a.correct).map(a => (
                                                <div key={a.id} className="flex items-center gap-2">
                                                    <span className="text-lg">✓</span>
                                                    <span>{a.text}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                            </div>
                        );
                    })}
                </div>

            </div>
        </div>
    );
}
