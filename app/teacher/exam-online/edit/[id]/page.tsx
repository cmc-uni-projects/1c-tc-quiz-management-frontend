"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchApi } from "@/lib/apiClient";
import { toastError, toastSuccess } from "@/lib/toast";

interface Question {
    id: number;
    title: string;
    difficulty: string;
    type: string;
    category: {
        id: number;
        name: string;
    };
}

interface ExamOnline {
    id: number;
    name: string;
    level: string;
    durationMinutes: number;
    passingScore: number;
    maxParticipants: number;
    status: string;
    actualQuestionCount: number;
    accessCode: string;
}

export default function AddQuestionsToExamPage() {
    const params = useParams();
    const router = useRouter();
    const examId = params.id as string;

    const [exam, setExam] = useState<ExamOnline | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedQuestions, setSelectedQuestions] = useState<number[]>([]);
    const [allQuestions, setAllQuestions] = useState<Question[]>([]);
    const [questionsLoading, setQuestionsLoading] = useState(false);

    // Filters
    const [searchQuery, setSearchQuery] = useState("");
    const [difficulty, setDifficulty] = useState("");

    // Fetch exam details
    useEffect(() => {
        if (!examId) return;

        fetchApi(`/online-exams/${examId}`)
            .then((data) => {
                setExam(data);
                if (data.status !== "DRAFT") {
                    toastError("Chỉ có thể thêm câu hỏi cho bài thi ở trạng thái DRAFT");
                    router.push("/teacher/list-exam");
                }
            })
            .catch((err) => {
                console.error("Failed to fetch exam:", err);
                toastError("Không thể tải thông tin bài thi");
                router.push("/teacher/list-exam");
            })
            .finally(() => setLoading(false));
    }, [examId, router]);

    // Fetch available questions
    useEffect(() => {
        const fetchQuestions = async () => {
            setQuestionsLoading(true);
            try {
                const params = new URLSearchParams({
                    page: "0",
                    size: "100",
                });
                if (searchQuery) params.append("search", searchQuery);
                if (difficulty) params.append("difficulty", difficulty);

                const response = await fetchApi(`/questions/all?${params.toString()}`);
                setAllQuestions(response.content || []);
            } catch (error) {
                console.error("Failed to fetch questions:", error);
                toastError("Không thể tải danh sách câu hỏi");
            } finally {
                setQuestionsLoading(false);
            }
        };

        fetchQuestions();
    }, [searchQuery, difficulty]);

    const toggleQuestion = (questionId: number) => {
        setSelectedQuestions((prev) =>
            prev.includes(questionId)
                ? prev.filter((id) => id !== questionId)
                : [...prev, questionId]
        );
    };

    const handleAddQuestions = async () => {
        if (selectedQuestions.length === 0) {
            toastError("Vui lòng chọn ít nhất một câu hỏi");
            return;
        }

        try {
            setLoading(true);
            await fetchApi(`/online-exams/${examId}/questions`, {
                method: "POST",
                body: { questionIds: selectedQuestions },
            });

            toastSuccess(`Đã thêm ${selectedQuestions.length} câu hỏi vào bài thi`);
            router.push("/teacher/list-exam");
        } catch (error: any) {
            console.error("Failed to add questions:", error);
            toastError(error.message || "Không thể thêm câu hỏi");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="flex-1 flex items-center justify-center">Đang tải...</div>;
    }

    if (!exam) {
        return <div className="flex-1 flex items-center justify-center">Không tìm thấy bài thi</div>;
    }

    return (
        <div className="flex-1 px-10 py-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-2xl shadow p-6 mb-6">
                    <h1 className="text-2xl font-semibold mb-4">{exam.name}</h1>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                            <span className="text-gray-600">Độ khó:</span>{" "}
                            <span className="font-medium">{exam.level}</span>
                        </div>
                        <div>
                            <span className="text-gray-600">Thời gian:</span>{" "}
                            <span className="font-medium">{exam.durationMinutes} phút</span>
                        </div>
                        <div>
                            <span className="text-gray-600">Điểm đạt:</span>{" "}
                            <span className="font-medium">{exam.passingScore}/10</span>
                        </div>
                        <div>
                            <span className="text-gray-600">Số câu hỏi đã thêm:</span>{" "}
                            <span className="font-medium text-purple-600">{selectedQuestions.length}</span>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-2xl shadow p-6 mb-6">
                    <h2 className="text-lg font-semibold mb-4">Tìm kiếm câu hỏi</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                            type="text"
                            placeholder="Tìm kiếm theo tiêu đề..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="border border-gray-300 rounded-lg px-4 py-2"
                        />
                        <select
                            value={difficulty}
                            onChange={(e) => setDifficulty(e.target.value)}
                            className="border border-gray-300 rounded-lg px-4 py-2 bg-white"
                        >
                            <option value="">Tất cả độ khó</option>
                            <option value="EASY">Dễ</option>
                            <option value="MEDIUM">Trung bình</option>
                            <option value="HARD">Khó</option>
                        </select>
                    </div>
                </div>

                {/* Questions List */}
                <div className="bg-white rounded-2xl shadow p-6">
                    <h2 className="text-lg font-semibold mb-4">
                        Danh sách câu hỏi ({allQuestions.length})
                    </h2>

                    {questionsLoading ? (
                        <div className="text-center py-8 text-gray-500">Đang tải câu hỏi...</div>
                    ) : allQuestions.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">Không tìm thấy câu hỏi</div>
                    ) : (
                        <div className="space-y-3 max-h-[500px] overflow-y-auto">
                            {allQuestions.map((q) => (
                                <div
                                    key={q.id}
                                    onClick={() => toggleQuestion(q.id)}
                                    className={`p-4 border rounded-lg cursor-pointer transition-all ${selectedQuestions.includes(q.id)
                                        ? "border-purple-500 bg-purple-50"
                                        : "border-gray-200 hover:border-gray-300"
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedQuestions.includes(q.id)}
                                            onChange={() => toggleQuestion(q.id)}
                                            className="mt-1"
                                        />
                                        <div className="flex-1">
                                            <p className="font-medium mb-2">{q.title}</p>
                                            <div className="flex gap-4 text-sm text-gray-600">
                                                <span>📂 {q.category?.name || "Không có danh mục"}</span>
                                                <span>
                                                    📊{" "}
                                                    {q.difficulty === "EASY"
                                                        ? "Dễ"
                                                        : q.difficulty === "MEDIUM"
                                                            ? "Trung bình"
                                                            : "Khó"}
                                                </span>
                                                <span>
                                                    {q.type === "SINGLE"
                                                        ? "Chọn 1"
                                                        : q.type === "MULTIPLE"
                                                            ? "Chọn nhiều"
                                                            : "Đúng/Sai"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Bottom Action Bar */}
                <div className="mt-6 bg-white rounded-2xl shadow p-6 flex justify-between items-center">
                    <div className="text-sm">
                        Đã chọn: <span className="font-semibold text-purple-600">{selectedQuestions.length}</span> câu hỏi
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={() => router.push("/teacher/list-exam")}
                            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            disabled={loading}
                        >
                            Hủy
                        </button>
                        <button
                            onClick={handleAddQuestions}
                            disabled={loading || selectedQuestions.length === 0}
                            className="px-6 py-2 bg-[#A53AEC] text-white rounded-lg hover:bg-[#8B2FC9] disabled:opacity-50"
                        >
                            {loading ? "Đang thêm..." : "Thêm câu hỏi"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
