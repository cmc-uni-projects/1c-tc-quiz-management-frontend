// app/student/do-exam/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import StudentLayout from '@/components/StudentLayout';
import Swal from 'sweetalert2';

// --- INTERFACES ---
interface Answer {
    id: string;
    text: string;
}

interface Question {
    id: number;
    text: string;
    answers: Answer[];
    correctAnswerId: string;
    studentSelection: string | null;
}

interface ExamData {
    id: number;
    title: string;
    timeLimit: number;
    questions: Question[];
}

// Mock Data
const MOCK_EXAM_DATA: ExamData = {
    id: 1,
    title: 'Bài thi Triết học Mác-Lênin',
    timeLimit: 3600,
    questions: [
        {
            id: 23,
            text: 'Ý thức lý luận ra đời do:',
            answers: [
                { id: 'a', text: 'Sự phát triển cao của ý thức xã hội thông thường' },
                { id: 'b', text: 'Thực tế xã hội' },
                { id: 'c', text: 'Sự khái quát tổng kết từ kinh nghiệm của ý thức xã hội thông thường' },
                { id: 'd', text: 'Sản phẩm tư duy của các nhà lý luận, các nhà khoa học' },
            ],
            correctAnswerId: 'c',
            studentSelection: null,
        },
        {
            id: 24,
            text: 'Trong các mối liên hệ cộng đồng sau đây, hình thức liên hệ nào là quan trọng nhất, quy định đặc trưng của dân tộc?',
            answers: [
                { id: 'a', text: 'Cộng đồng lãnh thổ' },
                { id: 'b', text: 'Cộng đồng kinh tế' },
                { id: 'c', text: 'Cộng đồng ngôn ngữ' },
                { id: 'd', text: 'Cộng đồng văn hóa' },
            ],
            correctAnswerId: 'd',
            studentSelection: null,
        },
        {
            id: 25,
            text: 'Điều kiện cơ bản để lực lượng sản xuất phát triển mạnh mẽ là gì?',
            answers: [
                { id: 'a', text: 'Quan hệ sản xuất phù hợp với trình độ phát triển của lực lượng sản xuất' },
                { id: 'b', text: 'Sự đổi mới về tư liệu sản xuất' },
                { id: 'c', text: 'Sự tăng cường lao động' },
                { id: 'd', text: 'Tất cả các đáp án trên' },
            ],
            correctAnswerId: 'a',
            studentSelection: null,
        },
    ],
};

/* ===========================================================
    MAIN CONTENT
=========================================================== */
const DoExamContent = () => {
    const router = useRouter();
    
    const [exam, setExam] = useState<ExamData | null>(null);
    const [secondsLeft, setSecondsLeft] = useState(MOCK_EXAM_DATA.timeLimit);
    const [isSubmitted, setIsSubmitted] = useState(false);

    // Nộp bài (SweetAlert2)
    const handleSubmit = useCallback(async () => {
        if (!exam || isSubmitted) return;

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

        setIsSubmitted(true);
        setSecondsLeft(0);

        const totalCorrect = exam.questions.filter(q => q.studentSelection === q.correctAnswerId).length;

        Swal.fire({
            title: "Đã nộp bài!",
            text: `Bạn trả lời đúng ${totalCorrect}/${exam.questions.length} câu.`,
            icon: "success",
            confirmButtonColor: "#E33AEC",
        });
    }, [exam, isSubmitted]);


    // Tải đề thi
    useEffect(() => {
        setExam(MOCK_EXAM_DATA);
    }, []);

    // Đếm ngược + auto submit
    useEffect(() => {
        if (isSubmitted) return;

        if (secondsLeft <= 0) {
            Swal.fire({
                title: "Hết giờ!",
                text: "Hệ thống tự động nộp bài.",
                icon: "warning",
                confirmButtonColor: "#E33AEC",
            });
            handleSubmit();
            return;
        }

        const timer = setInterval(() => setSecondsLeft(s => s - 1), 1000);
        return () => clearInterval(timer);

    }, [secondsLeft, isSubmitted, handleSubmit]);


    // Chọn đáp án
    const handleAnswerChange = (questionId: number, selectedId: string) => {
        if (!exam || isSubmitted) return;

        setExam(prev => {
            if (!prev) return null;
            return {
                ...prev,
                questions: prev.questions.map(q =>
                    q.id === questionId ? { ...q, studentSelection: selectedId } : q
                ),
            };
        });
    };

    // Quay lại (SweetAlert)
    const handleGoBack = async () => {
        if (!isSubmitted) {
            const confirm = await Swal.fire({
                title: "Thoát khỏi bài thi?",
                text: "Nếu quay lại, bài thi sẽ bị hủy và không thể khôi phục.",
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

    if (!exam) return <div className="p-8 text-center text-gray-500">Đang tải bài thi...</div>;


    /* ===========================================================
        UI
    ============================================================ */
    return (
        <div className="bg-gray-50 min-h-[calc(100vh-65px)]">
            <div className="max-w-4xl mx-auto p-4 md:p-8">

                {/* Header */}
                <div className="flex justify-between items-center mb-6 p-4 bg-white rounded-lg shadow-md">
                    <h1 className="text-2xl font-bold text-gray-800">{exam.title}</h1>

                    <div className="text-xl font-bold text-gray-700">
                        {Math.floor(secondsLeft / 60)}:
                        {(secondsLeft % 60).toString().padStart(2, '0')}
                    </div>
                </div>

                {/* Danh sách câu hỏi */}
                <div className="bg-white p-6 rounded-lg shadow-md space-y-6">
                    {exam.questions.map(q => (
                        <div key={q.id} className="border-b pb-4">
                            <p className="font-semibold text-lg">{q.id}. {q.text}</p>

                            <div className="mt-3 space-y-2">
                                {q.answers.map(a => (
                                    <div key={a.id} className="flex items-center">
                                        <input
                                            type="radio"
                                            name={`q-${q.id}`}
                                            checked={q.studentSelection === a.id}
                                            onChange={() => handleAnswerChange(q.id, a.id)}
                                            className="w-4 h-4"
                                        />
                                        <span className={`ml-2 ${q.studentSelection === a.id ? 'text-[#E33AEC] font-medium' : ''}`}>
                                            {a.text}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Buttons */}
                <div className="flex justify-center gap-6 mt-8">
                    <button
                        onClick={handleGoBack}
                        className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-3 px-8 rounded-lg"
                    >
                        Quay lại
                    </button>

                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitted}
                        className="text-white font-bold py-3 px-8 rounded-lg disabled:opacity-50"
                        style={{ backgroundColor: '#E33AEC' }}
                    >
                        {isSubmitted ? "Đã nộp bài" : "Nộp bài"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default function DoExamWrapper() {
    return (
        <StudentLayout>
            <DoExamContent />
        </StudentLayout>
    );
}
