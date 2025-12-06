// app/student/list-exams/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import StudentLayout from '@/components/StudentLayout'; // Import layout mới
import { fetchApi } from '@/lib/apiClient'; // Import fetchApi trực tiếp

/* ===========================================================
    MAIN CONTENT
=========================================================== */

interface Exam {
    id: number;
    title: string;
    category: string;
    duration: string;
    questionCount: number;
}

const ListExamsContent = () => {
    const router = useRouter();
    const [exams, setExams] = useState<Exam[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Lấy dữ liệu Bài thi từ API
    useEffect(() => {
        const fetchExams = async () => {
            try {
                const response = await fetchApi('/student/exams/search');
                // Backend returns Page<ExamResponseDto>. Content is in response.content
                const data = response.content || response.data || [];

                const mappedExams = Array.isArray(data) ? data.map((exam: any) => ({
                    id: exam.examId,
                    title: exam.title,
                    category: exam.category?.name || 'Chưa phân loại',
                    duration: `${exam.durationMinutes} phút`,
                    questionCount: exam.questionCount || 0
                })) : [];

                setExams(mappedExams);
            } catch (error) {
                console.error("Failed to fetch exams:", error);
                toast.error("Không thể tải danh sách bài thi.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchExams();
    }, []);

    const handleStartExam = (examId: number) => {
        // Chuyển hướng đến trang bắt đầu bài thi
        router.push(`/student/startexam?examId=${examId}`);
    };

    return (
        <div className="bg-gray-50 p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Danh sách bài thi</h2>

            {/* Thanh tìm kiếm theo giao diện bạn cung cấp */}
            <div className='flex gap-4 mb-8 p-4 bg-white rounded-lg shadow-sm'>
                <select className='border rounded-lg p-2 flex-1 max-w-xs'>
                    <option>Chọn danh mục</option>
                    {/* Categories should also be dynamic ideally, but keeping static for now or can fetch */}
                    <option>Toán học</option>
                    <option>Tiếng Anh</option>
                </select>
                <input
                    type='text'
                    placeholder='Nhập tên bài thi...'
                    className='border rounded-lg p-2 flex-1'
                />
                <button
                    className='bg-pink-600 hover:bg-pink-700 text-white font-semibold py-2 px-6 rounded-lg transition'
                >
                    Tìm kiếm
                </button>
            </div>

            {isLoading ? (
                <div className="text-center py-10">
                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-purple-500 border-b-2" />
                    <p className="mt-4 text-gray-700">Đang tải bài thi...</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {exams.length > 0 ? (
                        exams.map((exam) => (
                            <div
                                key={exam.id}
                                className="flex items-center justify-between bg-white p-6 rounded-lg shadow hover:shadow-md transition duration-300"
                            >
                                <div>
                                    <h3 className="text-xl font-semibold text-purple-700">{exam.title}</h3>
                                    <p className="text-sm text-gray-500 mt-1">
                                        <span className="font-medium text-gray-600">{exam.category}</span> | {exam.questionCount} câu hỏi | {exam.duration}
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleStartExam(exam.id)}
                                    className="bg-pink-500 hover:bg-pink-600 text-white font-bold py-2 px-6 rounded-full transition duration-150"
                                >
                                    Làm Bài
                                </button>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-gray-500 pt-10">Không tìm thấy bài thi nào phù hợp.</p>
                    )}
                </div>
            )}
        </div>
    );
};

/* ===========================================================
    WRAPPER EXPORT (Sử dụng Layout mới)
=========================================================== */
export default function ListExamsWrapper() {
    return (
        <StudentLayout>
            <ListExamsContent />
        </StudentLayout>
    );
}