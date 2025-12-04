"use client";

import React, { useState, useEffect } from "react";
import { fetchApi } from "@/lib/apiClient";
import { toastError, toastSuccess } from "@/lib/toast";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";


type Category = {
    id: number;
    name: string;
};

type DifficultyOption = { id: string; name: string };

interface ExamFormData {
    title: string;
    categoryId: string;
    durationMinutes: number | "";
    startTime: string | null;
    endTime: string | null;
    description: string;
}

// Helper to format date for input fields
const formatDateTimeForInput = (isoString: string | null) => {
    if (!isoString) return { date: "", time: "" };
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return { date: "", time: "" }; // Invalid date
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return {
        date: `${yyyy}-${mm}-${dd}`,
        time: `${hh}:${min}`,
    };
};

export default function AdminUpdateExamPage() {
    const router = useRouter();
    const params = useParams();
    const examId = params?.id as string;


    const [formData, setFormData] = useState<ExamFormData>({
        title: "",
        categoryId: "",
        durationMinutes: "",
        startTime: null,
        endTime: null,
        description: "",
    });

    const [startDate, setStartDate] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endDate, setEndDate] = useState("");
    const [endTime, setEndTime] = useState("");

    const [categoryOptions, setCategoryOptions] = useState<Category[]>([]);
    const [difficultyOptions, setDifficultyOptions] = useState<DifficultyOption[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch dropdowns and existing exam data
    useEffect(() => {
        if (!examId) return;

        const fetchInitialData = async () => {
            setLoading(true);
            try {
                // Fetch categories and difficulties
                const [categoriesRes, difficultiesRes, examRes] = await Promise.all([
                    fetchApi('/categories'),
                    fetchApi('/questions/difficulties'),
                    fetchApi(`/exams/get/${examId}`)
                ]);

                setCategoryOptions(categoriesRes);

                // Format difficulties
                const difficultyMap: Record<string, string> = { 'Easy': 'Dễ', 'Medium': 'Trung bình', 'Hard': 'Khó' };
                const formattedDifficulties = Array.isArray(difficultiesRes) ? difficultiesRes.map((d: any) => {
                    const val = typeof d === 'string' ? d : d.name;
                    return { id: val, name: difficultyMap[val] || val };
                }) : [];
                setDifficultyOptions(formattedDifficulties);

                // Populate form with exam data
                const { date: startDateVal, time: startTimeVal } = formatDateTimeForInput(examRes.startTime);
                const { date: endDateVal, time: endTimeVal } = formatDateTimeForInput(examRes.endTime);

                setFormData({
                    title: examRes.title,
                    categoryId: examRes.categoryId.toString(),
                    durationMinutes: examRes.durationMinutes,
                    startTime: examRes.startTime,
                    endTime: examRes.endTime,
                    description: examRes.description,
                });

                setStartDate(startDateVal);
                setStartTime(startTimeVal);
                setEndDate(endDateVal);
                setEndTime(endTimeVal);


            } catch (error) {
                toastError("Không thể tải dữ liệu bài thi.");
                console.error("Failed to fetch initial data:", error);
                router.push('/admin/list-exam'); // Redirect if fails
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();
    }, [examId, router]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleUpdateExam = async () => {
        if (!examId) return;

        // Basic Validation
        if (!formData.title.trim()) {
            toastError("Vui lòng nhập tên bài thi");
            return;
        }
        if (!formData.categoryId) {
            toastError("Vui lòng chọn danh mục");
            return;
        }
        if (!formData.durationMinutes || Number(formData.durationMinutes) <= 0) {
            toastError("Thời gian làm bài phải lớn hơn 0");
            return;
        }


        try {
            const examPayload = {
                ...formData,
                durationMinutes: Number(formData.durationMinutes),
                startTime: startDate && startTime ? `${startDate}T${startTime}:00` : null,
                endTime: endDate && endTime ? `${endDate}T${endTime}:00` : null,
                questionIds: [] // You might want to handle questions separately
            };

            await fetchApi(`/exams/edit/${examId}`, {
                method: 'PUT',
                body: examPayload,
            });

            toastSuccess("Cập nhật bài thi thành công!");
            router.push('/admin/list-exam');

        } catch (error: any) {
            console.error("Error updating exam:", error);
            toastError(error.message || "Có lỗi xảy ra khi cập nhật bài thi");
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-screen">Đang tải...</div>;
    }

    return (
        <div className="min-h-screen flex bg-[#F5F5F5] text-gray-900">
            <div className="flex-1 flex flex-col">
                <main className="flex-1 overflow-y-auto px-10 py-8">
                    <section className="bg-white rounded-2xl shadow p-8 mb-6">
                        <h2 className="text-2xl font-semibold text-center mb-8">
                            Cập nhật bài thi - Admin
                        </h2>

                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-sm mb-1">Tên bài thi</label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    className="w-full border px-3 py-2 rounded-md"
                                />
                            </div>
                             <div>
                                <label className="block text-sm mb-1">Mô tả (Độ khó)</label>
                                <select
                                    name="description"
                                    value={formData.description.split(' ')[2] || ''} // Extracts difficulty from "Bài thi [difficulty]"
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: `Bài thi ${e.target.value}` }))}
                                    className="w-full border px-3 py-2 rounded-md bg-white"
                                >
                                    <option value="">Chọn độ khó</option>
                                    {difficultyOptions.map(opt => (
                                        <option key={opt.id} value={opt.id}>{opt.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm mb-1">Danh mục bài thi</label>
                                <select
                                    name="categoryId"
                                    value={formData.categoryId}
                                    onChange={handleChange}
                                    className="w-full border px-3 py-2 rounded-md bg-white"
                                >
                                    <option value="">Chọn danh mục</option>
                                    {categoryOptions.map(opt => (
                                        <option key={opt.id} value={opt.id}>{opt.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Thời gian làm bài (phút)
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        name="durationMinutes"
                                        value={formData.durationMinutes}
                                        onChange={handleChange}
                                        className="w-28 border px-2 py-1 rounded-md"
                                    />
                                    <span>Phút</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm mb-1">Thời gian bắt đầu:</p>
                                    <div className="flex gap-2">
                                        <input
                                            type="time"
                                            value={startTime}
                                            onChange={(e) => setStartTime(e.target.value)}
                                            className="w-32 border px-2 py-1 rounded-md"
                                        />
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="border px-2 py-1 rounded-md"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <p className="text-sm mb-1">Thời gian kết thúc:</p>
                                    <div className="flex gap-2">
                                        <input
                                            type="time"
                                            value={endTime}
                                            onChange={(e) => setEndTime(e.target.value)}
                                            className="w-32 border px-2 py-1 rounded-md"
                                        />
                                        <input
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            className="border px-2 py-1 rounded-md"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <div className="mt-6 flex justify-end gap-4">
                        <button
                            onClick={() => router.push('/admin/list-exam')}
                            className="px-6 py-2 border border-gray-400 text-gray-700 rounded-md"
                        >
                            Hủy
                        </button>
                        <button
                            onClick={handleUpdateExam}
                            className="px-6 py-2 bg-purple-700 text-white rounded-md"
                        >
                            Lưu thay đổi
                        </button>
                    </div>
                </main>
            </div>
        </div>
    );
}