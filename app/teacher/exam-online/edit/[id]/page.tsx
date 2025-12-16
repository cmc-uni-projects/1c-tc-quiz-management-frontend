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
    answers?: { text: string; correct: boolean }[];
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

interface Category {
    id: number;
    name: string;
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
    const [categories, setCategories] = useState<Category[]>([]);

    // State for creating a new custom question inline
    const [showCreateQuestion, setShowCreateQuestion] = useState(true);
    const [newTitle, setNewTitle] = useState("");
    const [newType, setNewType] = useState("SINGLE");
    const [newDifficulty, setNewDifficulty] = useState("EASY");
    const [newCategoryId, setNewCategoryId] = useState<string>("");
    const [newAnswers, setNewAnswers] = useState<{ text: string; correct: boolean }[]>([
        { text: "", correct: false },
        { text: "", correct: false },
    ]);
    const [savingQuestion, setSavingQuestion] = useState(false);

    // Filters for question library
    const [searchQuery, setSearchQuery] = useState("");
    const [difficulty, setDifficulty] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("");

    // Question library modal
    const [showLibraryModal, setShowLibraryModal] = useState(false);

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
                if (categoryFilter) params.append("categoryId", categoryFilter);

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
    }, [searchQuery, difficulty, categoryFilter]);

    // Fetch categories for inline question creation
    useEffect(() => {
        const loadCategories = async () => {
            try {
                const data = await fetchApi("/categories/all");
                setCategories(Array.isArray(data) ? data : data?.content || []);
            } catch (error) {
                console.error("Failed to fetch categories:", error);
            }
        };
        loadCategories();
    }, []);

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

    const handleLibraryAdd = (questionId: number) => {
        setSelectedQuestions((prev) =>
            prev.includes(questionId) ? prev : [...prev, questionId]
        );
    };

    const handleLibraryRemove = (questionId: number) => {
        setSelectedQuestions((prev) => prev.filter((id) => id !== questionId));
    };

    const handleNewAnswerTextChange = (index: number, value: string) => {
        setNewAnswers((prev) => {
            const next = [...prev];
            next[index] = { ...next[index], text: value };
            return next;
        });
    };

    const handleNewAnswerCorrectChange = (index: number) => {
        setNewAnswers((prev) => {
            if (newType === "MULTIPLE") {
                const next = [...prev];
                next[index] = { ...next[index], correct: !next[index].correct };
                return next;
            }
            // SINGLE / TRUE_FALSE: only one correct
            return prev.map((ans, i) => ({ ...ans, correct: i === index }));
        });
    };

    const addNewAnswer = () => {
        if (newType === "TRUE_FALSE") return;
        setNewAnswers((prev) => [...prev, { text: "", correct: false }]);
    };

    const removeNewAnswer = (index: number) => {
        setNewAnswers((prev) => (prev.length <= 2 ? prev : prev.filter((_, i) => i !== index)));
    };

    const handleCreateQuestion = async () => {
        if (!newTitle.trim()) {
            toastError("Vui lòng nhập nội dung câu hỏi");
            return;
        }
        if (!newCategoryId) {
            toastError("Vui lòng chọn danh mục");
            return;
        }

        const validAnswers = newAnswers.filter((a) => a.text.trim());
        if (validAnswers.length < 2) {
            toastError("Cần ít nhất 2 đáp án");
            return;
        }
        const correctAnswers = validAnswers.filter((a) => a.correct);
        if (correctAnswers.length === 0) {
            toastError("Chọn ít nhất 1 đáp án đúng");
            return;
        }
        if (newType === "SINGLE" && correctAnswers.length > 1) {
            toastError("Câu hỏi 1 lựa chọn chỉ có 1 đáp án đúng");
            return;
        }

        const payload = {
            title: newTitle.trim(),
            type: newType,
            difficulty: newDifficulty,
            categoryId: Number(newCategoryId),
            visibility: "PRIVATE",
            answers: validAnswers,
            correctAnswer: correctAnswers[0].text,
        };

        try {
            setSavingQuestion(true);
            const created = await fetchApi("/questions/create", {
                method: "POST",
                body: payload,
            });

            // Add to questions list & mark as selected
            if (created && typeof created.id === "number") {
                setAllQuestions((prev) => [created, ...prev]);
                setSelectedQuestions((prev) =>
                    prev.includes(created.id) ? prev : [...prev, created.id]
                );
            }

            toastSuccess("Đã tạo câu hỏi và thêm vào bài thi");

            // Reset form
            setNewTitle("");
            setNewType("SINGLE");
            setNewDifficulty("EASY");
            setNewCategoryId("");
            setNewAnswers([
                { text: "", correct: false },
                { text: "", correct: false },
            ]);
            setShowCreateQuestion(false);
        } catch (error: any) {
            console.error("Failed to create question:", error);
            toastError(error.message || "Không thể tạo câu hỏi");
        } finally {
            setSavingQuestion(false);
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

                {/* Inline create question - styled giống giao diện cập nhật bài thi */}
                <div className="bg-white rounded-2xl shadow p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold">Danh sách câu hỏi</h2>
                        <button
                            type="button"
                            onClick={() => setShowLibraryModal(true)}
                            className="px-4 py-1.5 rounded-full text-sm font-medium border border-fuchsia-400 text-fuchsia-600 hover:bg-fuchsia-50"
                        >
                            Thư viện câu hỏi
                        </button>
                    </div>

                    {showCreateQuestion && (
                        <div className="border border-gray-300 rounded-2xl p-6">
                            <div className="mb-4">
                                <h3 className="font-semibold mb-3">Câu hỏi 1</h3>

                                {/* Nội dung câu hỏi */}
                                <input
                                    type="text"
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-3"
                                    placeholder="Nhập câu hỏi..."
                                />

                                {/* Loại câu hỏi + độ khó */}
                                <div className="flex flex-col md:flex-row gap-3 mb-3">
                                    <select
                                        value={newType}
                                        onChange={(e) => setNewType(e.target.value)}
                                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 bg-white"
                                    >
                                        <option value="SINGLE">Chọn 1 đáp án</option>
                                        <option value="MULTIPLE">Chọn nhiều đáp án</option>
                                        <option value="TRUE_FALSE">Đúng / Sai</option>
                                    </select>
                                    <select
                                        value={newDifficulty}
                                        onChange={(e) => setNewDifficulty(e.target.value)}
                                        className="w-full md:w-40 border border-gray-300 rounded-lg px-3 py-2 bg-white"
                                    >
                                        <option value="EASY">Dễ</option>
                                        <option value="MEDIUM">Trung bình</option>
                                        <option value="HARD">Khó</option>
                                    </select>
                                </div>

                                {/* Danh mục câu hỏi */}
                                <div className="mb-4">
                                    <select
                                        value={newCategoryId}
                                        onChange={(e) => setNewCategoryId(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white"
                                    >
                                        <option value="">Chọn danh mục câu hỏi</option>
                                        {categories.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Đáp án */}
                                <div className="space-y-2 mb-4">
                                    {newAnswers.map((ans, idx) => (
                                        <div key={idx} className="flex items-center gap-2">
                                            <input
                                                type={newType === "MULTIPLE" ? "checkbox" : "radio"}
                                                name="newQuestionCorrectInline"
                                                checked={ans.correct}
                                                onChange={() => handleNewAnswerCorrectChange(idx)}
                                                className="w-4 h-4 text-purple-600 rounded"
                                            />
                                            <input
                                                type="text"
                                                value={ans.text}
                                                onChange={(e) => handleNewAnswerTextChange(idx, e.target.value)}
                                                className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5"
                                                placeholder={`Đáp án ${idx + 1}`}
                                                disabled={newType === "TRUE_FALSE"}
                                            />
                                        </div>
                                    ))}
                                </div>

                                <div className="flex justify-end gap-2">
                                    {newType !== "TRUE_FALSE" && (
                                        <button
                                            type="button"
                                            onClick={addNewAnswer}
                                            className="px-4 py-1.5 text-sm rounded-full border border-fuchsia-300 text-fuchsia-600 hover:bg-fuchsia-50"
                                        >
                                            + Thêm đáp án
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            // reset current question form
                                            setNewTitle("");
                                            setNewType("SINGLE");
                                            setNewDifficulty("EASY");
                                            setNewCategoryId("");
                                            setNewAnswers([
                                                { text: "", correct: false },
                                                { text: "", correct: false },
                                            ]);
                                        }}
                                        className="px-4 py-1.5 text-sm rounded-full border border-red-300 text-red-500 hover:bg-red-50"
                                    >
                                        Xóa câu hỏi
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Các câu hỏi được thêm từ Thư viện – hiển thị dạng card giống cập nhật bài thi */}
                {selectedQuestions.length > 0 && (
                    <div className="bg-white rounded-2xl shadow p-6 mb-6 space-y-4">
                        {selectedQuestions.map((id, index) => {
                            const q = allQuestions.find((qq) => qq.id === id);
                            if (!q) return null;

                            const humanType =
                                q.type === "SINGLE"
                                    ? "Chọn 1 đáp án"
                                    : q.type === "MULTIPLE"
                                        ? "Chọn nhiều đáp án"
                                        : "Đúng / Sai";
                            const humanDiff =
                                q.difficulty === "EASY"
                                    ? "Dễ"
                                    : q.difficulty === "MEDIUM"
                                        ? "Trung bình"
                                        : "Khó";

                            return (
                                <div
                                    key={q.id}
                                    className="border border-gray-300 rounded-2xl p-5 bg-white"
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-gray-900">
                                                Câu hỏi {index + 1}
                                            </h3>
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                                                Thư viện
                                            </span>
                                        </div>
                                    </div>

                                    {/* Nội dung câu hỏi (readonly) */}
                                    <input
                                        type="text"
                                        value={q.title}
                                        readOnly
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-3 bg-gray-100 cursor-default"
                                    />

                                    {/* Loại câu hỏi + độ khó (readonly) */}
                                    <div className="flex flex-col md:flex-row gap-3 mb-3">
                                        <select
                                            value={humanType}
                                            disabled
                                            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 bg-gray-100 cursor-default"
                                        >
                                            <option>{humanType}</option>
                                        </select>
                                        <select
                                            value={humanDiff}
                                            disabled
                                            className="w-full md:w-40 border border-gray-300 rounded-lg px-3 py-2 bg-gray-100 cursor-default"
                                        >
                                            <option>{humanDiff}</option>
                                        </select>
                                    </div>

                                    {/* Đáp án nếu có */}
                                    {Array.isArray(q.answers) && q.answers.length > 0 && (
                                        <div className="space-y-2 mb-3">
                                            {q.answers.map((ans, idx) => (
                                                <div key={idx} className="flex items-center gap-2">
                                                    <input
                                                        type={q.type === "MULTIPLE" ? "checkbox" : "radio"}
                                                        readOnly
                                                        checked={ans.correct}
                                                        className="w-4 h-4 text-purple-600"
                                                    />
                                                    <input
                                                        type="text"
                                                        readOnly
                                                        value={ans.text}
                                                        className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 bg-gray-100 cursor-default"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="flex justify-end mt-2">
                                        <button
                                            type="button"
                                            onClick={() => handleLibraryRemove(q.id)}
                                            className="px-4 py-1.5 text-sm rounded-full border border-red-300 text-red-500 hover:bg-red-50"
                                        >
                                            Xóa câu hỏi
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Nút thêm câu hỏi – đặt sau tất cả card câu hỏi */}
                <div className="mt-6 flex justify-center mb-4">
                    <button
                        type="button"
                        onClick={handleCreateQuestion}
                        disabled={savingQuestion}
                        className="px-8 py-2 rounded-full text-white font-semibold shadow-md"
                        style={{ background: "linear-gradient(90deg,#A53AEC,#E33AEC)" }}
                    >
                        {savingQuestion ? "Đang lưu..." : "+ Thêm câu hỏi"}
                    </button>
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
            {/* Question Library Modal */}
            {showLibraryModal && (
                <div className="fixed inset-0 z-40 flex items-center justify-end bg-black/40 p-4">
                    <div className="mr-24 bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b">
                            <h2 className="text-xl font-semibold">Thư viện câu hỏi</h2>
                            <button
                                type="button"
                                onClick={() => setShowLibraryModal(false)}
                                className="text-gray-500 hover:text-gray-800 text-lg font-bold"
                            >
                                ×
                            </button>
                        </div>

                        {/* Filters */}
                        <div className="px-6 pt-4 pb-3 flex flex-col lg:flex-row gap-3">
                            <input
                                type="text"
                                placeholder="Nhập tiêu đề / đáp án..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm"
                            />
                            <div className="flex flex-col md:flex-row gap-3">
                                <select
                                    value={difficulty}
                                    onChange={(e) => setDifficulty(e.target.value)}
                                    className="w-full md:w-40 border border-gray-300 rounded-full px-4 py-2 text-sm bg-white"
                                >
                                    <option value="">Chọn độ khó</option>
                                    <option value="EASY">Dễ</option>
                                    <option value="MEDIUM">Trung bình</option>
                                    <option value="HARD">Khó</option>
                                </select>
                                <select
                                    value={categoryFilter}
                                    onChange={(e) => setCategoryFilter(e.target.value)}
                                    className="w-full md:w-48 border border-gray-300 rounded-full px-4 py-2 text-sm bg-white"
                                >
                                    <option value="">Chọn danh mục</option>
                                    {categories.map((c) => (
                                        <option key={c.id} value={c.id.toString()}>
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <button
                                type="button"
                                className="px-6 py-2 rounded-full text-sm font-semibold text-white"
                                style={{ background: "linear-gradient(90deg,#A53AEC)" }}
                            >
                                Tìm kiếm
                            </button>
                        </div>

                        {/* Table */}
                        <div className="px-6 pb-4 flex-1 overflow-hidden flex flex-col">
                            <div className="border border-gray-200 rounded-2xl overflow-hidden flex-1 flex flex-col max-h-[400px] overflow-y-auto">
                                <table className="w-full text-sm text-gray-700">
                                    <thead className="bg-gray-50 border-b text-xs uppercase text-gray-500">
                                        <tr>
                                            <th className="px-3 py-2 text-left w-12">STT</th>
                                            <th className="px-3 py-2 text-left">Tiêu đề</th>
                                            <th className="px-3 py-2 text-left w-32">Loại câu hỏi</th>
                                            <th className="px-3 py-2 text-left w-20">Độ khó</th>
                                            <th className="px-3 py-2 text-left w-32">Danh mục</th>
                                            <th className="px-3 py-2 text-left w-40">Người tạo</th>
                                            <th className="px-3 py-2 text-center w-32">Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {questionsLoading ? (
                                            <tr>
                                                <td colSpan={7} className="px-3 py-6 text-center text-gray-500">
                                                    Đang tải câu hỏi...
                                                </td>
                                            </tr>
                                        ) : allQuestions.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="px-3 py-6 text-center text-gray-500">
                                                    Không tìm thấy câu hỏi
                                                </td>
                                            </tr>
                                        ) : (
                                            allQuestions.map((q, index) => {
                                                const added = selectedQuestions.includes(q.id);
                                                return (
                                                    <tr key={q.id} className="hover:bg-purple-50/40">
                                                        <td className="px-3 py-2 align-top">{index + 1}</td>
                                                        <td className="px-3 py-2 align-top max-w-xs">
                                                            <div className="font-medium truncate">{q.title}</div>
                                                        </td>
                                                        <td className="px-3 py-2 align-top">
                                                            {q.type === "SINGLE"
                                                                ? "Một đáp án"
                                                                : q.type === "MULTIPLE"
                                                                    ? "Nhiều đáp án"
                                                                    : "Đúng/Sai"}
                                                        </td>
                                                        <td className="px-3 py-2 align-top">
                                                            {q.difficulty === "EASY"
                                                                ? "Dễ"
                                                                : q.difficulty === "MEDIUM"
                                                                    ? "Trung bình"
                                                                    : "Khó"}
                                                        </td>
                                                        <td className="px-3 py-2 align-top">
                                                            {q.category?.name || "-"}
                                                        </td>
                                                        <td className="px-3 py-2 align-top text-xs text-gray-600">
                                                            {(q as any).createdBy || "-"}
                                                        </td>
                                                        <td className="px-3 py-2 align-top text-center">
                                                            {added ? (
                                                                <div className="flex items-center justify-center gap-2">
                                                                    <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-500 text-xs font-medium">
                                                                        Đã thêm
                                                                    </span>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleLibraryRemove(q.id)}
                                                                        className="px-3 py-1 rounded-full bg-red-500 text-white text-xs font-semibold hover:bg-red-600"
                                                                    >
                                                                        Xóa
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleLibraryAdd(q.id)}
                                                                    className="px-4 py-1 rounded-full bg-green-500 text-white text-xs font-semibold hover:bg-green-600"
                                                                >
                                                                    Thêm
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
