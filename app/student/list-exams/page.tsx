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
    status?: 'BEFORE' | 'READY' | 'ENDED' | 'UNKNOWN';
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

                const mappedExams = Array.isArray(data)
                    ? [...data]
                        .sort((a: any, b: any) =>
                            Number(new Date(b.startTime || 0)) - Number(new Date(a.startTime || 0))
                        )
                        .map((exam: any) => {
                            let status: Exam['status'] = 'UNKNOWN';
                            if (exam.startTime && exam.endTime) {
                                const now = new Date();
                                const start = new Date(exam.startTime);
                                const end = new Date(exam.endTime);

                                if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                                    if (now < start) status = 'BEFORE';
                                    else if (now > end) status = 'ENDED';
                                    else status = 'READY';
                                }
                            }

                            return {
                                id: exam.examId,
                                title: exam.title,
                                category: exam.category?.name,
                                duration: `${exam.durationMinutes} phút`,
                                questionCount: exam.questionCount || 0,
                                level: mapLevel(exam.examLevel),
                                startTime: exam.startTime ? new Date(exam.startTime).toLocaleString('vi-VN') : 'Tự do',
                                endTime: exam.endTime ? new Date(exam.endTime).toLocaleString('vi-VN') : 'Tự do',
                                status,
                            } as Exam;
                        })
                    : [];

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
            text: "Bạn có chắc chắn muốn bắt đầu làm bài không? Đã bắt đầu bài thi thì sẽ không thể quay lại.",
            icon: 'warning',
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
            ) : exams.length === 0 ? (
                <p className="text-center text-gray-500 pt-10">Không tìm thấy bài thi nào phù hợp.</p>
            ) : (
                <div className="space-y-12">
                    {Object.entries(
                        exams.reduce((acc, exam) => {
                            const cat = exam.category || "Chưa phân loại";
                            if (!acc[cat]) acc[cat] = [];
                            acc[cat].push(exam);
                            return acc;
                        }, {} as Record<string, Exam[]>)
                    ).map(([categoryName, categoryExams]) => (
                        <div key={categoryName}>
                            <h3 className="text-2xl font-bold text-gray-800 mb-6 border-l-4 border-[#A53AEC] pl-4">
                                {categoryName}
                            </h3>
                            <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-5">
                                {categoryExams.map((exam) => (
                                    <div
                                        key={exam.id}
                                        className="flex flex-col bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition duration-300 border border-gray-100 h-full"
                                    >
                                        <div className="flex-1">
                                            <h4 className="text-base font-bold text-[#A53AEC] mb-2 leading-tight line-clamp-2">{exam.title}</h4>

                                            <div className="text-xs text-gray-600 space-y-1">
                                                <p>
                                                    <span className="text-gray-500">Số câu:</span>
                                                    <span className="font-semibold text-gray-800 ml-1">{exam.questionCount}</span>
                                                </p>
                                                <p>
                                                    <span className="text-gray-500">Mức độ:</span>
                                                    <span className="font-semibold text-gray-800 ml-1">{exam.level}</span>
                                                </p>
                                                <p>
                                                    <span className="text-gray-500">Thời gian:</span>
                                                    <span className="font-semibold text-gray-800 ml-1">{exam.duration}</span>
                                                </p>
                                            </div>

                                            <div className="mt-3 pt-2 border-t border-gray-100 text-xs text-gray-500 space-y-1">
                                                <p className="flex items-center gap-1">
                                                    <span>Bắt đầu:</span>
                                                    <span className="font-medium text-gray-700">{exam.startTime}</span>
                                                </p>
                                                <p className="flex items-center gap-1">
                                                    <span>Kết thúc:</span>
                                                    <span className="font-medium text-gray-700">{exam.endTime}</span>
                                                </p>
                                                <p className="flex items-center gap-1">
                                                    <span>Trạng thái:</span>
                                                    <span className="font-semibold">
                                                        {exam.status === 'READY' && (
                                                            <span className="text-green-600">Sẵn sàng</span>
                                                        )}
                                                        {exam.status === 'BEFORE' && (
                                                            <span className="text-blue-600">Chưa bắt đầu</span>
                                                        )}
                                                        {exam.status === 'ENDED' && (
                                                            <span className="text-gray-500">Đã kết thúc</span>
                                                        )}
                                                        {(!exam.status || exam.status === 'UNKNOWN') && (
                                                            <span className="text-gray-400">Không xác định</span>
                                                        )}
                                                    </span>
                                                </p>
                                            </div>
                                        </div>
                                        <div className="mt-3 flex justify-center">
                                            <button
                                                onClick={() => handleStartExam(exam)}
                                                className="bg-[#A53AEC] hover:bg-[#8B2BE2] text-white text-xs font-bold py-2 px-6 rounded-full transition duration-150 shadow-sm"
                                            >
                                                Làm Bài
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

/* ===========================================================
    WRAPPER EXPORT (Sử dụng Layout mới)
=========================================================== */
export default ListExamsContent;