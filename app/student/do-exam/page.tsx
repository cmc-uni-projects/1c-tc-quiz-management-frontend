// app/student/do-exam/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import StudentLayout from '@/components/StudentLayout';
import Swal from 'sweetalert2';
import { fetchApi } from '@/lib/apiClient';
import toast from 'react-hot-toast';

// --- INTERFACES ---
interface AnswerOption {
    id: number;
    text: string;
}

interface Question {
    id: number;
    text: string;
    questionType: string; // ADDED: 'SINGLE', 'MULTIPLE', 'TRUE_FALSE'
    answers: AnswerOption[];
}

interface ExamData {
    examId: number;
    title: string;
    durationMinutes: number;
    questions: Question[];
    startTime?: string;
    endTime?: string;
}

/* ===========================================================
    MAIN CONTENT
=========================================================== */
const DoExamContent = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const examIdParam = searchParams.get('examId') || searchParams.get('subjectId');

    const [exam, setExam] = useState<ExamData | null>(null);
    const [secondsLeft, setSecondsLeft] = useState(0);
    const [isSubmitted, setIsSubmitted] = useState(false);

    // Store answers as Array regardless of type for consistency with backend DTO
    const [studentAnswers, setStudentAnswers] = useState<Record<number, number[]>>({});
    const [isLoading, setIsLoading] = useState(true);

    // Call API Start Exam
    useEffect(() => {
        if (!examIdParam) {
            toast.error("Không tìm thấy ID bài thi");
            router.push('/student/list-exams');
            return;
        }

        const startExam = async () => {
            try {
                const data = await fetchApi(`/student/exams/${examIdParam}/start`, {
                    method: 'POST'
                });

                // Map Data
                console.log("Exam Data:", data);
                const mappedExam: ExamData = {
                    examId: data.examId,
                    title: data.title,
                    durationMinutes: data.durationMinutes,
                    questions: data.questions || [],
                    startTime: data.startTime,
                    endTime: data.endTime
                };

                setExam(mappedExam);
                setSecondsLeft(data.durationMinutes * 60);
                setIsLoading(false);
            } catch (error: any) {
                console.error("Error starting exam:", error);

                // Hiển thị lỗi cụ thể nếu có (VD: Bài thi chưa bắt đầu)
                const msg = error.message || "Không thể bắt đầu bài thi.";
                toast.error(msg);

                // Nếu lỗi 400 (Bad Request) thường là chưa đến giờ, quay lại list
                setTimeout(() => router.push('/student/list-exams'), 2000);
            }
        };

        startExam();
    }, [examIdParam, router]);

    // Nộp bài
    const handleSubmit = useCallback(async (autoSubmit = false) => {
        if (!exam || isSubmitted) return;

        if (!autoSubmit) {
            const confirm = await Swal.fire({
                title: "Xác nhận nộp bài",
                text: "Bạn chắc chắn muốn nộp bài?",
                icon: "question",
                showCancelButton: true,
                confirmButtonText: "Nộp bài",
                cancelButtonText: "Hủy",
                confirmButtonColor: "#E33AEC",
            });
            if (!confirm.isConfirmed) return;
        }

        try {
            const payload = {
                examId: exam.examId,
                answers: studentAnswers
            };

            const result = await fetchApi('/student/exams/submit', {
                method: 'POST',
                body: payload
            });

            setIsSubmitted(true);
            setSecondsLeft(0);

            await Swal.fire({
                title: "Đã nộp bài!",
                text: `Điểm số: ${result.score} - Số câu đúng: ${result.correctCount}/${result.totalQuestions}`,
                icon: "success",
                confirmButtonColor: "#E33AEC",
            });

            router.push('/student/list-exams');

        } catch (error: any) {
            console.error("Submit error:", error);
            toast.error("Có lỗi khi nộp bài: " + error.message);
        }

    }, [exam, isSubmitted, studentAnswers, router]);


    // Timer
    useEffect(() => {
        if (isSubmitted || isLoading || !exam) return;

        if (secondsLeft <= 0) {
            Swal.fire({
                title: "Hết giờ!",
                text: "Hệ thống tự động nộp bài.",
                icon: "warning",
                confirmButtonColor: "#E33AEC",
            });
            handleSubmit(true);
            return;
        }

        const timer = setInterval(() => setSecondsLeft(s => s - 1), 1000);
        return () => clearInterval(timer);

    }, [secondsLeft, isSubmitted, handleSubmit, isLoading, exam]);


    // Handle Selection
    const handleAnswerChange = (questionId: number, answerId: number, type: string) => {
        if (isSubmitted) return;

        setStudentAnswers(prev => {
            const currentAnswers = prev[questionId] || [];

            // Check Question Type
            if (type === 'MULTIPLE') {
                // Checkbox logic (Toggle)
                if (currentAnswers.includes(answerId)) {
                    return { ...prev, [questionId]: currentAnswers.filter(id => id !== answerId) };
                } else {
                    return { ...prev, [questionId]: [...currentAnswers, answerId] };
                }
            } else {
                // Radio logic (Replace) -> SINGLE or TRUE_FALSE
                return { ...prev, [questionId]: [answerId] };
            }
        });
    };

    const handleGoBack = async () => {
        if (!isSubmitted) {
            const confirm = await Swal.fire({
                title: "Thoát khỏi bài thi?",
                text: "Nếu quay lại, bài thi sẽ coi như chưa nộp.",
                icon: "warning",
                showCancelButton: true,
                confirmButtonText: "Thoát",
                cancelButtonText: "Hủy",
                confirmButtonColor: "#E33AEC",
            });

            if (!confirm.isConfirmed) return;
        }
        router.push('/student/list-exams');
    };

    if (isLoading) return (
        <div className="flex h-screen items-center justify-center bg-white">
            <div className="text-center">
                <div className="mx-auto h-12 w-12 animate-spin rounded-full border-green-600 border-b-2" />
                <p className="mt-4 text-lg font-semibold text-gray-700">Đang tải đề thi...</p>
            </div>
        </div>
    );

    if (!exam) return <div className="p-8 text-center text-gray-500">Không có dữ liệu bài thi.</div>;

    return (
        <div className="bg-gray-50 min-h-[calc(100vh-65px)]">
            <div className="max-w-4xl mx-auto p-4 md:p-8">

                {/* Header */}
                <div className="flex justify-between items-center mb-6 p-4 bg-white rounded-lg shadow-md sticky top-0 z-10 transition-all">
                    <h1 className="text-xl font-bold text-gray-800 line-clamp-1 flex-1 mr-4">{exam.title}</h1>

                    <div className={`text-xl font-bold ${secondsLeft < 300 ? 'text-red-600 animate-pulse' : 'text-gray-700'}`}>
                        {Math.floor(secondsLeft / 60)}:
                        {(secondsLeft % 60).toString().padStart(2, '0')}
                    </div>
                </div>

                {/* Question List */}
                <div className="bg-white p-6 rounded-lg shadow-md space-y-8">
                    {(!exam.questions || exam.questions.length === 0) ? (
                        <div className="text-center py-10 text-gray-500">
                            <p>Bài thi này chưa có câu hỏi nào.</p>
                            <p className="text-sm mt-2">Vui lòng liên hệ giáo viên.</p>
                        </div>
                    ) : (
                        exam.questions.map((q, index) => {
                            const selectedForQ = studentAnswers[q.id] || [];
                            const isMultiple = q.questionType === 'MULTIPLE';

                            return (
                                <div key={q.id} className="border-b pb-6 last:border-0 hover:bg-gray-50 p-4 rounded-lg transition">
                                    <div className="flex justify-between items-start mb-3">
                                        <p className="font-semibold text-lg flex-1">Câu {index + 1}: {q.text}</p>
                                        <span className={`text-xs px-2 py-1 rounded ml-2 ${isMultiple ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                                            {isMultiple ? 'Chọn nhiều' : 'Chọn 1'}
                                        </span>
                                    </div>

                                    {isMultiple && <p className="text-sm text-gray-400 italic mb-2">(Chọn tất cả đáp án đúng)</p>}

                                    <div className="mt-3 space-y-2">
                                        {q.answers.map(a => {
                                            const isSelected = selectedForQ.includes(a.id);
                                            return (
                                                <label key={a.id} className="flex items-center cursor-pointer p-2 rounded hover:bg-gray-100 transition select-none">
                                                    <input
                                                        type={isMultiple ? "checkbox" : "radio"}
                                                        name={`q-${q.id}`}
                                                        checked={isSelected}
                                                        onChange={() => handleAnswerChange(q.id, a.id, q.questionType)}
                                                        className={`w-5 h-5 text-pink-600 focus:ring-pink-500 border-gray-300 ${!isMultiple ? 'rounded-full' : 'rounded'}`}
                                                    />
                                                    <span className={`ml-3 ${isSelected ? 'text-[#E33AEC] font-medium' : 'text-gray-700'}`}>
                                                        {a.text}
                                                    </span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer Buttons */}
                <div className="flex justify-center gap-6 mt-8 pb-10">
                    <button
                        onClick={handleGoBack}
                        className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-3 px-8 rounded-lg transition"
                    >
                        Quay lại
                    </button>

                    <button
                        onClick={() => handleSubmit(false)}
                        disabled={isSubmitted}
                        className="text-white font-bold py-3 px-8 rounded-lg disabled:opacity-50 transition shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                        style={{ backgroundColor: '#E33AEC' }}
                    >
                        {isSubmitted ? "Đã nộp bài" : "Nộp bài"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DoExamContent;
