"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchApi } from "@/lib/apiClient";
import { toastError, toastSuccess } from "@/lib/toast";

interface Category {
    id: number;
    name: string;
}

interface ExamOnline {
    id: number;
    name: string;
    categoryId: number;
    level: string;
    durationMinutes: number;
    passingScore: number;
    maxParticipants: number;
    status: string;
}

export default function UpdateOnlineExamPage() {
    const params = useParams();
    const router = useRouter();
    const examId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);

    // Form fields
    const [name, setName] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [level, setLevel] = useState("");
    const [durationMinutes, setDurationMinutes] = useState<number | "">(60);
    const [passingScore, setPassingScore] = useState<number | "">(5);
    const [maxParticipants, setMaxParticipants] = useState<number | "">(30);

    // Fetch exam details
    useEffect(() => {
        if (!examId) return;

        const fetchData = async () => {
            try {
                setLoading(true);

                // Fetch exam
                const exam: ExamOnline = await fetchApi(`/online-exams/${examId}`);

                if (exam.status !== "DRAFT") {
                    toastError("Chỉ có thể cập nhật bài thi ở trạng thái DRAFT");
                    router.push("/teacher/list-exam");
                    return;
                }

                // Set form values
                setName(exam.name);
                setCategoryId(exam.categoryId.toString());
                setLevel(exam.level);
                setDurationMinutes(exam.durationMinutes);
                setPassingScore(exam.passingScore);
                setMaxParticipants(exam.maxParticipants);

                // Fetch categories
                const cats = await fetchApi("/categories/all");
                setCategories(cats);
            } catch (error) {
                console.error("Failed to fetch exam:", error);
                toastError("Không thể tải thông tin bài thi");
                router.push("/teacher/list-exam");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [examId, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!name.trim()) {
            toastError("Vui lòng nhập tên bài thi");
            return;
        }
        if (!categoryId) {
            toastError("Vui lòng chọn danh mục");
            return;
        }
        if (!level) {
            toastError("Vui lòng chọn độ khó");
            return;
        }
        if (!durationMinutes || durationMinutes <= 0) {
            toastError("Thời gian làm bài phải lớn hơn 0");
            return;
        }
        if (passingScore === "" || passingScore < 0 || passingScore > 10) {
            toastError("Điểm đạt phải từ 0-10");
            return;
        }
        if (!maxParticipants || maxParticipants <= 0) {
            toastError("Số người tham gia phải lớn hơn 0");
            return;
        }

        const payload = {
            name: name.trim(),
            categoryId: parseInt(categoryId),
            level: level,
            durationMinutes: Number(durationMinutes),
            passingScore: Number(passingScore),
            maxParticipants: Number(maxParticipants),
        };

        try {
            setSaving(true);
            await fetchApi(`/online-exams/${examId}`, {
                method: "PUT",
                body: payload,
            });

            toastSuccess("Cập nhật bài thi thành công!");
            router.push("/teacher/list-exam");
        } catch (error: any) {
            console.error("Failed to update exam:", error);
            toastError(error.message || "Không thể cập nhật bài thi");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="flex-1 flex items-center justify-center">Đang tải...</div>;
    }

    return (
        <div className="flex-1 px-10 py-8">
            <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow p-8">
                <h1 className="text-2xl font-semibold text-center mb-8">
                    Cập nhật bài thi Online
                </h1>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Tên bài thi */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Tên bài thi <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2"
                            placeholder="Nhập tên bài thi..."
                        />
                    </div>

                    {/* Row 1: Category + Level */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Danh mục */}
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Danh mục <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={categoryId}
                                onChange={(e) => setCategoryId(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white"
                            >
                                <option value="">Chọn danh mục</option>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Độ khó */}
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Độ khó <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={level}
                                onChange={(e) => setLevel(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white"
                            >
                                <option value="">Chọn độ khó</option>
                                <option value="EASY">Dễ</option>
                                <option value="MEDIUM">Trung bình</option>
                                <option value="HARD">Khó</option>
                            </select>
                        </div>
                    </div>

                    {/* Row 2: Duration + Passing Score */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Thời gian làm bài */}
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Thời gian làm bài (phút) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                min="1"
                                value={durationMinutes}
                                onChange={(e) =>
                                    setDurationMinutes(e.target.value === "" ? "" : Number(e.target.value))
                                }
                                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                                placeholder="60"
                            />
                        </div>

                        {/* Điểm đạt */}
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Điểm đạt (0-10) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                min="0"
                                max="10"
                                step="0.5"
                                value={passingScore}
                                onChange={(e) =>
                                    setPassingScore(e.target.value === "" ? "" : Number(e.target.value))
                                }
                                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                                placeholder="5"
                            />
                        </div>
                    </div>

                    {/* Số người tham gia */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Số người tham gia tối đa <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            min="1"
                            value={maxParticipants}
                            onChange={(e) =>
                                setMaxParticipants(e.target.value === "" ? "" : Number(e.target.value))
                            }
                            className="w-full border border-gray-300 rounded-lg px-4 py-2"
                            placeholder="30"
                        />
                    </div>

                    {/* Buttons */}
                    <div className="flex justify-end gap-4 pt-4">
                        <button
                            type="button"
                            onClick={() => router.push("/teacher/list-exam")}
                            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            disabled={saving}
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-6 py-2 bg-[#A53AEC] text-white rounded-lg hover:bg-[#8B2FC9] disabled:opacity-50"
                        >
                            {saving ? "Đang lưu..." : "Cập nhật"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
