// app/student/list-exams/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
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
    level: string;
    startTime: string;
    endTime: string;
}

const ListExamsContent = () => {
    const router = useRouter();
    const [exams, setExams] = useState<Exam[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [difficulty, setDifficulty] = useState<string>(''); // Default: All difficulties
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);

    // Fetch Categories
    useEffect(() => {
        fetchApi("/categories/all").then(setCategories).catch(console.error);
    }, []);

    // Lấy dữ liệu Bài thi từ API
    useEffect(() => {
        const fetchExams = async () => {
            try {
                const params = new URLSearchParams();
                if (searchQuery) params.append('title', searchQuery);
                if (selectedCategory) params.append('categoryId', selectedCategory);
                if (difficulty) params.append('examLevel', difficulty);

                const response = await fetchApi(`/student/exams/search?${params.toString()}`);
                // Backend returns Page<ExamResponseDto>. Content is in response.content
                const data = response.content || response.data || [];

                const mapLevel = (level: string) => {
                    const map: Record<string, string> = {
                        'EASY': 'Dễ',
                        'MEDIUM': 'Trung bình',
                        'HARD': 'Khó'
                    };
                    return map[level] || level;
                };

                const mappedExams = Array.isArray(data) ? data.map((exam: any) => ({
                    id: exam.examId,
                    title: exam.title,
                    category: exam.category?.name,
                    duration: `${exam.durationMinutes} phút`,
                    questionCount: exam.questionCount || 0,
                    level: mapLevel(exam.examLevel),
                    startTime: exam.startTime ? new Date(exam.startTime).toLocaleString('vi-VN') : 'Tự do',
                    endTime: exam.endTime ? new Date(exam.endTime).toLocaleString('vi-VN') : 'Tự do'
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
    }, [difficulty, searchQuery, selectedCategory]); // Re-fetch when filters change

    const handleStartExam = (exam: Exam) => {
        Swal.fire({
            title: `Bắt đầu bài thi ${exam.title}?`,
            text: "Bạn có chắc chắn muốn bắt đầu làm bài không?",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#E33AEC',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Bắt đầu ngay',
            cancelButtonText: 'Hủy'
        }).then((result) => {
            if (result.isConfirmed) {
                router.push(`/student/do-exam?examId=${exam.id}`);
            }
        });
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">

            <h2 className="text-3xl font-bold text-gray-900 mb-8">Danh sách bài thi</h2>

            {/* Thanh tìm kiếm theo giao diện bạn cung cấp */}
            <div className='flex gap-4 mb-8 p-4 bg-white rounded-lg shadow-sm flex-wrap'>
                <select
                    className='border rounded-lg p-2 flex-1 min-w-[150px]'
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                >
                    <option value="">Tất cả danh mục</option>
                    {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>

                <select
                    className='border rounded-lg p-2 flex-1 min-w-[150px]'
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                >
                    <option value="">Tất cả độ khó</option>
                    <option value="EASY">Dễ</option>
                    <option value="MEDIUM">Trung bình</option>
                    <option value="HARD">Khó</option>
                </select>

                <input
                    type='text'
                    placeholder='Nhập tên bài thi...'
                    className='border rounded-lg p-2 flex-[2] min-w-[200px]'
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button
                    onClick={() => {
                        setSearchQuery(searchQuery);
                    }}
                    className="bg-[#A53AEC] hover:bg-[#8B2BE2] text-white font-bold py-2 px-6 rounded-full transition duration-150"
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {exams.length > 0 ? (
                        exams.map((exam) => (
                            <div
                                key={exam.id}
                                className="flex items-center justify-between bg-white p-6 rounded-lg shadow hover:shadow-md transition duration-300"
                            >
                                <div>
                                    <h3 className="text-xl font-semibold text-purple-700">{exam.title}</h3>
                                    <div className="text-sm text-gray-500 mt-2 space-y-1">
                                        <p><span className="font-semibold">Số lượng câu hỏi:</span> {exam.questionCount}</p>
                                        <p><span className="font-semibold">Mức độ:</span> {exam.level}</p>
                                        <p><span className="font-semibold">Thời gian làm bài:</span> {exam.duration}</p>
                                        <p><span className="font-semibold">Thời gian bắt đầu:</span> {exam.startTime}</p>
                                        <p><span className="font-semibold">Thời gian kết thúc:</span> {exam.endTime}</p>
                                        <p><span className="font-semibold">Danh mục:</span> {exam.category}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleStartExam(exam)}
                                    className="bg-[#A53AEC] hover:bg-[#8B2BE2] text-white font-bold py-2 px-6 rounded-full transition duration-150"
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
export default ListExamsContent;