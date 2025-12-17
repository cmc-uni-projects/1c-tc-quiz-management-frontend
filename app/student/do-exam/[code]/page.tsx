"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchApi } from "@/lib/apiClient";
import { toastError, toastSuccess } from "@/lib/toast";
import toast from "react-hot-toast";
import { Clock, CheckCircle, Circle, Loader2 } from "lucide-react";

interface Answer {
    id: number;
    text: string;
}

interface Question {
    id: number;
    text: string;
    type: string;
    answers: Answer[];
}

interface ExamData {
    examId: number;
    title: string;
    description: string;
    durationMinutes: number;
    questions: Question[];
}

export default function StudentDoExamPage() {
    const params = useParams();
    const router = useRouter();
    const accessCode = params.code as string;

    const [loading, setLoading] = useState(true);
    const [exam, setExam] = useState<ExamData | null>(null);
    const [answers, setAnswers] = useState<Record<number, number[]>>({});
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const hasWarned = useRef(false);
    const startTimeRef = useRef<number>(Date.now());

    // Fetch exam data
    useEffect(() => {
        if (!accessCode) return;

        const fetchExam = async () => {
            try {
                setLoading(true);
                const data = await fetchApi(`/online-exams/${accessCode}/take`);
                setExam(data);
                setTimeRemaining(data.durationMinutes * 60);
                startTimeRef.current = Date.now();
            } catch (error: any) {
                console.error("Failed to load exam:", error);
                toastError(error.message || "Không thể tải bài thi");
                router.push("/student/join");
            } finally {
                setLoading(false);
            }
        };

        fetchExam();
    }, [accessCode, router]);

    // Timer countdown
    useEffect(() => {
        if (loading || !exam || isSubmitting) return;

        const interval = setInterval(() => {
            setTimeRemaining((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    handleSubmit(true); // Auto-submit
                    return 0;
                }

                // Warning at 5 minutes
                if (prev === 300 && !hasWarned.current) {
                    toastError("⚠️ Còn 5 phút!");
                    hasWarned.current = true;
                }

                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [loading, exam, isSubmitting]);

    const handleAnswerChange = (questionId: number, answerId: number, type: string) => {
        setAnswers((prev) => {
            const current = prev[questionId] || [];

            if (type === "MULTIPLE") {
                // Toggle checkbox
                if (current.includes(answerId)) {
                    return { ...prev, [questionId]: current.filter((id) => id !== answerId) };
                } else {
                    return { ...prev, [questionId]: [...current, answerId] };
                }
            } else {
                // Radio - replace
                return { ...prev, [questionId]: [answerId] };
            }
        });
    };

    const handleSubmit = useCallback(
        async (isAutoSubmit = false) => {
            if (!exam || isSubmitting) return;

            if (!isAutoSubmit) {
                toast((t) => (
                    <div className="flex flex-col gap-3 bg-white p-4 rounded-lg shadow-lg">
                        <p className="text-gray-800 font-medium">Bạn có chắc chắn muốn nộp bài?</p>
                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => toast.dismiss(t.id)}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={async () => {
                                    toast.dismiss(t.id);
                                    setIsSubmitting(true);

                                    try {
                                        const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000);

                                        const submissionData = {
                                            accessCode,
                                            timeSpent,
                                            answers: Object.entries(answers).map(([questionId, answerIds]) => ({
                                                questionId: Number(questionId),
                                                answerOptionIds: answerIds,
                                            })),
                                        };

                                        const result = await fetchApi("/online-exams/submit", {
                                            method: "POST",
                                            body: submissionData,
                                        });

                                        toastSuccess("Nộp bài thành công!");

                                        // Redirect to results page with historyId
                                        setTimeout(() => {
                                            router.push(`/student/exam-result/${result.examHistoryId}`);
                                        }, 1500);
                                    } catch (error: any) {
                                        console.error("Submit error:", error);
                                        toastError(error.message || "Không thể nộp bài");
                                        setIsSubmitting(false);
                                    }
                                }}
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
                            >
                                Xác nhận
                            </button>
                        </div>
                    </div>
                ), {
                    duration: Infinity,
                    position: "top-center",
                    style: {
                        background: 'white',
                        color: '#1f2937',
                        padding: 0,
                    },
                });
                return;
            }

            setIsSubmitting(true);

            try {
                const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000);

                const submissionData = {
                    accessCode,
                    timeSpent,
                    answers: Object.entries(answers).map(([questionId, answerIds]) => ({
                        questionId: Number(questionId),
                        answerOptionIds: answerIds,
                    })),
                };

                const result = await fetchApi("/online-exams/submit", {
                    method: "POST",
                    body: submissionData,
                });

                toastSuccess(
                    isAutoSubmit
                        ? "Hết giờ! Bài thi đã được nộp tự động."
                        : "Nộp bài thành công!"
                );

                // Redirect to results page with historyId
                setTimeout(() => {
                    router.push(`/student/exam-result/${result.examHistoryId}`);
                }, 1500);
            } catch (error: any) {
                console.error("Submit error:", error);
                toastError(error.message || "Không thể nộp bài");
                setIsSubmitting(false);
            }
        },
        [exam, answers, accessCode, isSubmitting, router]
    );

    const scrollToQuestion = (index: number) => {
        const element = document.getElementById(`question-${index}`);
        element?.scrollIntoView({ behavior: "smooth", block: "center" });
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex items-center gap-2 text-purple-600">
                    <Loader2 className="animate-spin" />
                    <span>Đang tải đề thi...</span>
                </div>
            </div>
        );
    }

    if (!exam) return null;

    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    const isLowTime = timeRemaining <= 300;

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto p-4 md:p-8">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-3">
                        {/* Header */}
                        <div className="bg-white p-4 rounded-lg shadow-md mb-6 sticky top-0 z-10">
                            <div className="flex justify-between items-center">
                                <h1 className="text-xl font-bold text-gray-800">{exam.title}</h1>
                                <div className="flex items-center gap-2">
                                    <Clock className={isLowTime ? "text-red-600" : "text-gray-600"} />
                                    <span
                                        className={`text-xl font-bold ${isLowTime ? "text-red-600 animate-pulse" : "text-gray-800"
                                            }`}
                                    >
                                        {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Questions */}
                        <div className="bg-white p-6 rounded-lg shadow-md space-y-8">
                            {exam.questions.map((q, index) => {
                                const selectedAnswers = answers[q.id] || [];
                                const isMultiple = q.type === "MULTIPLE";

                                return (
                                    <div
                                        key={q.id}
                                        id={`question-${index}`}
                                        className="border-b pb-6 last:border-0 scroll-mt-24"
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <p className="font-semibold text-lg flex-1">
                                                Câu {index + 1}: {q.text}
                                            </p>
                                            <span
                                                className={`text-xs px-2 py-1 rounded ml-2 ${isMultiple
                                                    ? "bg-blue-100 text-blue-700"
                                                    : "bg-gray-100 text-gray-600"
                                                    }`}
                                            >
                                                {isMultiple ? "Nhiều đáp án" : "Một đáp án"}
                                            </span>
                                        </div>

                                        {isMultiple && (
                                            <p className="text-sm text-gray-400 italic mb-2">
                                                (Chọn tất cả đáp án đúng)
                                            </p>
                                        )}

                                        <div className="space-y-2">
                                            {q.answers && q.answers.map((a) => {
                                                const isSelected = selectedAnswers.includes(a.id);
                                                return (
                                                    <label
                                                        key={a.id}
                                                        className="flex items-center cursor-pointer p-3 rounded hover:bg-gray-50 transition"
                                                    >
                                                        <input
                                                            type={isMultiple ? "checkbox" : "radio"}
                                                            name={`q-${q.id}`}
                                                            checked={isSelected}
                                                            onChange={() => handleAnswerChange(q.id, a.id, q.type)}
                                                            className="w-5 h-5 text-purple-600 focus:ring-purple-500"
                                                        />
                                                        <span
                                                            className={`ml-3 ${isSelected ? "text-purple-600 font-medium" : "text-gray-700"
                                                                }`}
                                                        >
                                                            {a.text}
                                                        </span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-center mt-8">
                            <button
                                onClick={() => handleSubmit(false)}
                                disabled={isSubmitting}
                                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-lg disabled:opacity-50 transition shadow-lg"
                            >
                                {isSubmitting ? "Đang nộp bài..." : "Nộp bài"}
                            </button>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24 bg-white p-4 rounded-lg shadow-md">
                            <h3 className="text-lg font-bold mb-4 text-gray-800 border-b pb-2">
                                Danh sách câu hỏi
                            </h3>

                            <div className="grid grid-cols-5 gap-2 mb-6">
                                {exam.questions.map((q, index) => {
                                    const hasAnswer = answers[q.id] && answers[q.id].length > 0;
                                    return (
                                        <button
                                            key={q.id}
                                            onClick={() => scrollToQuestion(index)}
                                            className={`w-10 h-10 rounded text-sm font-semibold flex items-center justify-center transition ${hasAnswer
                                                ? "bg-purple-600 text-white hover:bg-purple-700"
                                                : "bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200"
                                                }`}
                                        >
                                            {index + 1}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="space-y-2 text-xs text-gray-500">
                                <div className="flex items-center">
                                    <div className="w-3 h-3 rounded bg-purple-600 mr-2"></div>
                                    <span>Đã làm</span>
                                </div>
                                <div className="flex items-center">
                                    <div className="w-3 h-3 rounded bg-gray-100 border border-gray-200 mr-2"></div>
                                    <span>Chưa làm</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
