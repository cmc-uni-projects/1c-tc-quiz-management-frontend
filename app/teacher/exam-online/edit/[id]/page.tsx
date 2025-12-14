"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchApi } from "@/lib/apiClient";
import { toastError, toastSuccess } from "@/lib/toast";

interface DraftAnswer {
    text: string;
    isCorrect: boolean;
}

function EyeIcon(props: any) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    );
}

interface DraftQuestion {
    title: string;
    type: "SINGLE" | "MULTIPLE" | "TRUE_FALSE";
    difficulty: "EASY" | "MEDIUM" | "HARD";
    answers: DraftAnswer[];
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
    categoryId?: number;
    categoryName?: string;
}

export default function AddQuestionsToExamPage() {
    const params = useParams();
    const router = useRouter();
    const examId = params.id as string;

    const [exam, setExam] = useState<ExamOnline | null>(null);
    const [loading, setLoading] = useState(true);

    // Draft questions created directly on this page
    const [questions, setQuestions] = useState<DraftQuestion[]>([]);

    // Question library state
    const [showLibrary, setShowLibrary] = useState(false);
    const [libraryQuestions, setLibraryQuestions] = useState<any[]>([]);
    const [libraryLoading, setLibraryLoading] = useState(false);
    const [selectedExistingIds, setSelectedExistingIds] = useState<number[]>([]);
    const [selectedLibraryQuestions, setSelectedLibraryQuestions] = useState<any[]>([]);
    const [libraryPage, setLibraryPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchDifficulty, setSearchDifficulty] = useState("");
    const [searchType, setSearchType] = useState("");
    const [searchCategory, setSearchCategory] = useState("");
    const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);

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
            .finally(() => {
                setLoading(false);

                // Khởi tạo mặc định 1 câu hỏi trống khi đã có thông tin bài thi
                setQuestions([
                    {
                        title: "",
                        type: "SINGLE",
                        difficulty: "EASY",
                        answers: [
                            { text: "", isCorrect: false },
                            { text: "", isCorrect: false },
                        ],
                    },
                ]);
            });
    }, [examId, router]);

    // Load categories for library filters
    useEffect(() => {
        fetchApi("/categories/all")
            .then((data) => setCategories(data || []))
            .catch((err) => {
                console.error("Failed to fetch categories:", err);
            });
    }, []);

    const handleChangeQuestionField = (
        index: number,
        field: keyof DraftQuestion,
        value: any
    ) => {
        setQuestions((prev) => {
            const copy = [...prev];
            (copy[index] as any)[field] = value;
            return copy;
        });
    };

    const handleAnswerTextChange = (qIndex: number, aIndex: number, value: string) => {
        setQuestions((prev) => {
            const copy = [...prev];
            const q = { ...copy[qIndex] };
            const answers = [...q.answers];
            answers[aIndex] = { ...answers[aIndex], text: value };
            q.answers = answers;
            copy[qIndex] = q;
            return copy;
        });
    };

    const handleAnswerCorrectChange = (qIndex: number, aIndex: number) => {
        setQuestions((prev) => {
            const copy = [...prev];
            const q = { ...copy[qIndex] };
            const answers = q.answers.map((ans, idx) => {
                if (q.type === "SINGLE" || q.type === "TRUE_FALSE") {
                    return { ...ans, isCorrect: idx === aIndex };
                }
                if (idx === aIndex) {
                    return { ...ans, isCorrect: !ans.isCorrect };
                }
                return ans;
            });
            q.answers = answers;
            copy[qIndex] = q;
            return copy;
        });
    };

    const handleAddAnswer = (qIndex: number) => {
        setQuestions((prev) => {
            const copy = [...prev];
            const q = { ...copy[qIndex] };
            if (q.type === "TRUE_FALSE") return copy;
            q.answers = [...q.answers, { text: "", isCorrect: false }];
            copy[qIndex] = q;
            return copy;
        });
    };

    const handleRemoveAnswer = (qIndex: number, aIndex: number) => {
        setQuestions((prev) => {
            const copy = [...prev];
            const q = { ...copy[qIndex] };
            if (q.answers.length <= 2) return copy;
            q.answers = q.answers.filter((_, idx) => idx !== aIndex);
            copy[qIndex] = q;
            return copy;
        });
    };

    const handleAddQuestionCard = () => {
        setQuestions((prev) => [
            ...prev,
            {
                title: "",
                type: "SINGLE",
                difficulty: "EASY",
                answers: [
                    { text: "", isCorrect: false },
                    { text: "", isCorrect: false },
                ],
            },
        ]);
    };

    const handleRemoveQuestionCard = (index: number) => {
        setQuestions((prev) => {
            if (prev.length <= 1) return prev;
            return prev.filter((_, idx) => idx !== index);
        });
    };

    // ====== LIBRARY HANDLERS ======
    const handleSearchLibrary = async () => {
        try {
            setLibraryLoading(true);
            const params = new URLSearchParams();
            if (searchQuery) params.append("q", searchQuery);
            if (searchDifficulty) params.append("difficulty", searchDifficulty);
            if (searchType) params.append("type", searchType);
            if (searchCategory) params.append("categoryId", searchCategory);

            const data = await fetchApi(`/questions/search?${params.toString()}`);

            const mapped = data.content.map((q: any) => {
                const mappedAnswers = q.answers.map((a: any) => ({
                    id: a.id,
                    text: a.text,
                    isCorrect: a.correct,
                }));

                if (!mappedAnswers.some((a: any) => a.isCorrect) && q.correctAnswer) {
                    mappedAnswers.forEach((a: any) => {
                        if (a.text === q.correctAnswer || a.text.toLowerCase() === q.correctAnswer.toLowerCase()) {
                            a.isCorrect = true;
                        }
                    });
                }

                return {
                    id: q.id,
                    title: q.title,
                    type: q.type.trim(),
                    difficulty: q.difficulty,
                    categoryId: q.category?.id,
                    categoryName: q.categoryName || q.category?.name,
                    createdBy: q.createdBy,
                    visibility: q.visibility,
                    answers: mappedAnswers,
                };
            });

            setLibraryQuestions(mapped);
            setLibraryPage(1);
        } catch (error) {
            console.error("Search error:", error);
            toastError("Không thể tải thư viện câu hỏi.");
        } finally {
            setLibraryLoading(false);
        }
    };

    const toggleExistingFromLibrary = (id: number) => {
        setSelectedExistingIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const handleRemoveLibraryQuestion = (id: number) => {
        setSelectedExistingIds((prev) => prev.filter((x) => x !== id));
        setSelectedLibraryQuestions((prev) => prev.filter((q: any) => q.id !== id));
    };

    const handleToggleLibrary = () => {
        setShowLibrary((prev) => {
            const next = !prev;
            if (next && libraryQuestions.length === 0) {
                handleSearchLibrary();
            }
            return next;
        });
    };

    const handleSaveQuestionsToExam = async () => {
        if (!exam) return;

        if (questions.length === 0 && selectedExistingIds.length === 0) {
            toastError("Vui lòng tạo hoặc chọn ít nhất 1 câu hỏi.");
            return;
        }

        // Validate draft questions
        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            if (!q.title.trim()) {
                toastError(`Câu hỏi ${i + 1} chưa có nội dung.`);
                return;
            }
            if (!q.answers || q.answers.length < 2) {
                toastError(`Câu hỏi ${i + 1} phải có ít nhất 2 đáp án.`);
                return;
            }
            if (!q.answers.some((a) => a.isCorrect)) {
                toastError(`Câu hỏi ${i + 1} phải có ít nhất 1 đáp án đúng.`);
                return;
            }
        }

        const categoryId = exam.categoryId ?? undefined;
        if (!categoryId) {
            toastError("Bài thi chưa có danh mục hợp lệ để gán cho câu hỏi.");
            return;
        }

        try {
            setLoading(true);
            const questionIds: number[] = [...selectedExistingIds];

            // Tạo lần lượt từng câu hỏi mới
            for (const q of questions) {
                const trimmedAnswers = q.answers
                    .map((a) => ({ ...a, text: a.text.trim() }))
                    .filter((a) => a.text !== "");

                let derivedCorrectAnswer: string | undefined = undefined;
                if (q.type === "TRUE_FALSE") {
                    const correctOne = trimmedAnswers.find((a) => a.isCorrect);
                    if (correctOne) {
                        derivedCorrectAnswer = correctOne.text;
                    }
                }

                const payload: any = {
                    title: q.title.trim(),
                    type: q.type,
                    difficulty: q.difficulty,
                    categoryId: Number(categoryId),
                    answers: trimmedAnswers.map((a) => ({ text: a.text, correct: a.isCorrect })),
                    correctAnswer: derivedCorrectAnswer,
                    visibility: "PRIVATE",
                };

                const created = await fetchApi("/questions/create", {
                    method: "POST",
                    body: payload,
                });

                if (!created || !created.id) {
                    throw new Error("Không thể tạo một câu hỏi mới.");
                }
                questionIds.push(created.id);
            }

            if (!questionIds.length) {
                toastError("Không có câu hỏi hợp lệ để thêm vào bài thi.");
                return;
            }

            await fetchApi(`/online-exams/${examId}/questions`, {
                method: "POST",
                body: { questionIds },
            });

            toastSuccess(`Đã thêm ${questionIds.length} câu hỏi vào bài thi`);

            // Chuyển giáo viên sang phòng chờ của bài thi online sau khi lưu câu hỏi
            if (exam.accessCode) {
                router.push(`/teacher/waiting-room/${exam.accessCode}`);
            } else {
                router.push("/teacher/list-exam");
            }
        } catch (error: any) {
            console.error("Failed to save questions:", error);
            toastError(error.message || "Không thể lưu câu hỏi cho bài thi");
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
                            <span className="text-gray-600">Câu hỏi mới trong trang này:</span>{" "}
                            <span className="font-medium text-purple-600">{questions.length}</span>
                        </div>
                    </div>
                </div>

                {/* MAIN QUESTION EDITOR */}
                <div className="bg-white rounded-2xl shadow p-8">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-semibold">Danh sách câu hỏi</h2>
                        <button
                            type="button"
                            onClick={handleToggleLibrary}
                            className="px-5 py-2 rounded-full border border-[#A53AEC] text-[#A53AEC] hover:bg-purple-50 text-sm"
                        >
                            Thư viện câu hỏi
                        </button>
                    </div>

                    {/* Question cards */}
                    <div className="space-y-6">
                        {questions.map((q, qIndex) => (
                            <div
                                key={qIndex}
                                className="border rounded-2xl px-6 py-5 bg-white shadow-sm"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-semibold text-lg">Câu hỏi {qIndex + 1}</h3>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveQuestionCard(qIndex)}
                                        className="text-sm px-4 py-1 rounded-full border border-red-400 text-red-500 hover:bg-red-50"
                                        disabled={questions.length <= 1}
                                    >
                                        Xóa câu hỏi
                                    </button>
                                </div>

                                {/* Nội dung câu hỏi */}
                                <input
                                    type="text"
                                    value={q.title}
                                    onChange={(e) => handleChangeQuestionField(qIndex, "title", e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-4"
                                    placeholder="Nhập câu hỏi..."
                                />

                                {/* Loại câu hỏi + Độ khó */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <select
                                        value={q.type}
                                        onChange={(e) => {
                                            const newType = e.target.value as DraftQuestion["type"];
                                            handleChangeQuestionField(qIndex, "type", newType);

                                            if (newType === "TRUE_FALSE") {
                                                setQuestions((prev) => {
                                                    const copy = [...prev];
                                                    copy[qIndex] = {
                                                        ...copy[qIndex],
                                                        answers: [
                                                            { text: "Đúng", isCorrect: false },
                                                            { text: "Sai", isCorrect: false },
                                                        ],
                                                    };
                                                    return copy;
                                                });
                                            } else if (q.answers.length < 2) {
                                                setQuestions((prev) => {
                                                    const copy = [...prev];
                                                    copy[qIndex] = {
                                                        ...copy[qIndex],
                                                        answers: [
                                                            { text: "", isCorrect: false },
                                                            { text: "", isCorrect: false },
                                                        ],
                                                    };
                                                    return copy;
                                                });
                                            }
                                        }}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white"
                                    >
                                        <option value="SINGLE">Chọn 1 đáp án</option>
                                        <option value="MULTIPLE">Chọn nhiều đáp án</option>
                                        <option value="TRUE_FALSE">Đúng/Sai</option>
                                    </select>

                                    <select
                                        value={q.difficulty}
                                        onChange={(e) =>
                                            handleChangeQuestionField(
                                                qIndex,
                                                "difficulty",
                                                e.target.value as DraftQuestion["difficulty"]
                                            )
                                        }
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white"
                                    >
                                        <option value="EASY">Dễ</option>
                                        <option value="MEDIUM">Trung bình</option>
                                        <option value="HARD">Khó</option>
                                    </select>
                                </div>

                                {/* Danh sách đáp án */}
                                <div className="space-y-2">
                                    {q.answers.map((a, aIndex) => (
                                        <div key={aIndex} className="flex items-center gap-3">
                                            <input
                                                type={q.type === "MULTIPLE" ? "checkbox" : "radio"}
                                                checked={a.isCorrect}
                                                onChange={() => handleAnswerCorrectChange(qIndex, aIndex)}
                                                className="w-4 h-4"
                                            />
                                            <input
                                                type="text"
                                                value={a.text}
                                                onChange={(e) =>
                                                    handleAnswerTextChange(qIndex, aIndex, e.target.value)
                                                }
                                                className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
                                                placeholder={`Đáp án ${aIndex + 1}`}
                                            />
                                            {q.answers.length > 2 && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveAnswer(qIndex, aIndex)}
                                                    className="text-xs text-red-500 hover:underline"
                                                >
                                                    Xóa
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {q.type !== "TRUE_FALSE" && (
                                    <div className="flex justify-end mt-3">
                                        <button
                                            type="button"
                                            onClick={() => handleAddAnswer(qIndex)}
                                            className="text-sm text-[#A53AEC] border border-[#A53AEC] rounded-full px-4 py-1 hover:bg-purple-50"
                                        >
                                            + Thêm đáp án
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Add question button */}
                    <div className="flex justify-center mt-8">
                        <button
                            type="button"
                            onClick={handleAddQuestionCard}
                            className="px-8 py-2 rounded-full bg-[#A53AEC] text-white font-semibold shadow hover:bg-[#8B2FC9]"
                        >
                            + Thêm câu hỏi
                        </button>
                    </div>

                    {/* Library section as modal (similar to update-exam page, with filters and table) */}
                    {showLibrary && (
                        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                            <div className="bg-white rounded-xl p-6 relative w-[95%] max-w-[1000px] min-h-[80vh] max-h-[90vh] flex flex-col">
                                <button
                                    type="button"
                                    onClick={() => setShowLibrary(false)}
                                    className="absolute top-3 right-4 text-gray-500 text-lg hover:text-black"
                                >
                                    x
                                </button>

                                <h3 className="text-xl font-semibold mb-4">Thư viện câu hỏi</h3>

                                {/* Filter row */}
                                <div className="flex flex-wrap gap-3 mb-4 items-center">
                                    <input
                                        placeholder="Nhập tiêu đề / đáp án..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="flex-1 h-[40px] rounded-full border border-gray-300 px-4 text-sm"
                                    />
                                    <select
                                        value={searchDifficulty}
                                        onChange={(e) => setSearchDifficulty(e.target.value)}
                                        className="h-[40px] px-4 rounded-full border border-gray-300 text-sm"
                                    >
                                        <option value="">Chọn độ khó</option>
                                        <option value="EASY">Dễ</option>
                                        <option value="MEDIUM">Trung bình</option>
                                        <option value="HARD">Khó</option>
                                    </select>
                                    <select
                                        value={searchType}
                                        onChange={(e) => setSearchType(e.target.value)}
                                        className="h-[40px] px-4 rounded-full border border-gray-300 text-sm"
                                    >
                                        <option value="">Chọn loại câu hỏi</option>
                                        <option value="SINGLE">Một đáp án</option>
                                        <option value="MULTIPLE">Nhiều đáp án</option>
                                        <option value="TRUE_FALSE">Đúng / Sai</option>
                                    </select>
                                    <select
                                        value={searchCategory}
                                        onChange={(e) => setSearchCategory(e.target.value)}
                                        className="h-[40px] px-4 rounded-full border border-gray-300 text-sm"
                                    >
                                        <option value="">Chọn danh mục</option>
                                        {categories.map((c) => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                    <button
                                        type="button"
                                        onClick={handleSearchLibrary}
                                        className="bg-[#A53AEC] text-white px-5 py-2 rounded-full text-sm"
                                    >
                                        Tìm kiếm
                                    </button>
                                </div>

                                {/* Table */}
                                <div className="flex-1 overflow-auto border border-gray-200 rounded-lg">
                                    {libraryLoading ? (
                                        <div className="p-4 text-gray-500 text-sm">Đang tải thư viện câu hỏi...</div>
                                    ) : libraryQuestions.length === 0 ? (
                                        <div className="p-4 text-gray-500 text-sm">Chưa có câu hỏi trong thư viện.</div>
                                    ) : (
                                        <table className="w-full border-collapse text-center text-sm">
                                            <thead className="bg-gray-50 sticky top-0">
                                                <tr>
                                                    <th className="p-3 border-b w-10">STT</th>
                                                    <th className="p-3 border-b">Tiêu đề</th>
                                                    <th className="p-3 border-b">Loại câu hỏi</th>
                                                    <th className="p-3 border-b">Độ khó</th>
                                                    <th className="p-3 border-b">Danh mục</th>
                                                    <th className="p-3 border-b">Người tạo</th>
                                                    <th className="p-3 border-b">Thao tác</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {libraryQuestions
                                                    .slice((libraryPage - 1) * 10, libraryPage * 10)
                                                    .map((q, index) => {
                                                        const isSelected = selectedExistingIds.includes(q.id);
                                                        return (
                                                            <tr key={q.id} className="hover:bg-gray-50">
                                                                <td className="p-3 border-b">{(libraryPage - 1) * 10 + index + 1}</td>
                                                                <td className="p-3 border-b text-left px-4 max-w-[220px] truncate" title={q.title}>{q.title}</td>
                                                                <td className="p-3 border-b">
                                                                    {q.type?.trim() === "SINGLE"
                                                                        ? "Một đáp án"
                                                                        : q.type?.trim() === "MULTIPLE"
                                                                            ? "Nhiều đáp án"
                                                                            : q.type?.trim() === "TRUE_FALSE"
                                                                                ? "Đúng / Sai"
                                                                                : q.type}
                                                                </td>
                                                                <td className="p-3 border-b">
                                                                    {q.difficulty === "EASY"
                                                                        ? "Dễ"
                                                                        : q.difficulty === "MEDIUM"
                                                                            ? "Trung bình"
                                                                            : q.difficulty === "HARD"
                                                                                ? "Khó"
                                                                                : q.difficulty}
                                                                </td>
                                                                <td className="p-3 border-b">{q.categoryName || "-"}</td>
                                                                <td className="p-3 border-b">{q.createdBy || "TBD"}</td>
                                                                <td className="p-3 border-b">
                                                                    <div className="flex items-center justify-center gap-2">
                                                                        <button
                                                                            type="button"
                                                                            className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-full transition"
                                                                            title="Xem chi tiết"
                                                                        >
                                                                            <EyeIcon />
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            disabled={isSelected}
                                                                            onClick={() => {
                                                                                if (isSelected) return;
                                                                                setSelectedExistingIds((prev) => [...prev, q.id]);
                                                                                setSelectedLibraryQuestions((prev) =>
                                                                                    prev.some((item: any) => item.id === q.id)
                                                                                        ? prev
                                                                                        : [...prev, q]
                                                                                );
                                                                            }}
                                                                            className={`px-4 py-1 rounded-full text-xs font-semibold ${
                                                                                isSelected
                                                                                    ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                                                                                    : "bg-green-500 text-white hover:bg-green-600"
                                                                            }`}
                                                                        >
                                                                            {isSelected ? "Đã thêm" : "Thêm"}
                                                                        </button>
                                                                        {isSelected && (
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleRemoveLibraryQuestion(q.id)}
                                                                                className="px-4 py-1 rounded-full text-xs font-semibold bg-red-500 text-white hover:bg-red-600"
                                                                            >
                                                                                Xóa
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                            </tbody>
                                        </table>
                                    )}
                                </div>

                                {/* Simple pagination */}
                                {libraryQuestions.length > 10 && (
                                    <div className="mt-4 flex justify-center items-center gap-2 text-sm">
                                        <button
                                            type="button"
                                            onClick={() => setLibraryPage((p) => Math.max(1, p - 1))}
                                            className="px-2 py-1 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-50"
                                        >
                                            
                                        </button>
                                        <span className="px-3 py-1 rounded-full bg-[#A53AEC] text-white font-semibold">
                                            {libraryPage}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const maxPage = Math.ceil(libraryQuestions.length / 10);
                                                setLibraryPage((p) => Math.min(maxPage, p + 1));
                                            }}
                                            className="px-2 py-1 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-50"
                                        >
                                            
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Selected questions from library - detailed read-only cards */}
                {selectedLibraryQuestions.length > 0 && (
                    <div className="mt-6 bg-white rounded-2xl shadow p-6 space-y-4">
                        <h3 className="text-lg font-semibold">Câu hỏi từ thư viện đã thêm vào bài thi</h3>
                        <div className="space-y-6">
                            {selectedLibraryQuestions.map((q: any, index: number) => (
                                <section
                                    key={q.id}
                                    className="bg-gray-50 rounded-2xl p-6 relative border border-gray-200"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h4 className="text-lg font-semibold flex items-center gap-2">
                                                Câu hỏi từ thư viện {index + 1}
                                                <span className="text-xs bg-gray-200 px-2 py-1 rounded">Thư viện</span>
                                            </h4>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveLibraryQuestion(q.id)}
                                            className="text-xs px-3 py-1 rounded-full border border-red-400 text-red-500 hover:bg-red-50"
                                        >
                                            Xóa
                                        </button>
                                    </div>

                                    {/* Tiêu đề câu hỏi */}
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium mb-1">Tiêu đề câu hỏi</label>
                                        <input
                                            type="text"
                                            value={q.title}
                                            readOnly
                                            className="w-full border px-3 py-2 rounded-md bg-gray-100 cursor-not-allowed"
                                        />
                                    </div>

                                    {/* Loại câu hỏi + Độ khó */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Loại câu hỏi</label>
                                            <select
                                                disabled
                                                value={q.type}
                                                className="w-full border px-3 py-2 rounded-md bg-gray-100 cursor-not-allowed"
                                            >
                                                <option value="SINGLE">Một đáp án</option>
                                                <option value="MULTIPLE">Nhiều đáp án</option>
                                                <option value="TRUE_FALSE">Đúng / Sai</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Độ khó</label>
                                            <select
                                                disabled
                                                value={q.difficulty}
                                                className="w-full border px-3 py-2 rounded-md bg-gray-100 cursor-not-allowed"
                                            >
                                                <option value="EASY">Dễ</option>
                                                <option value="MEDIUM">Trung bình</option>
                                                <option value="HARD">Khó</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Danh mục */}
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium mb-1">Danh mục</label>
                                        <input
                                            type="text"
                                            value={q.categoryName || "-"}
                                            readOnly
                                            className="w-full border px-3 py-2 rounded-md bg-gray-100 cursor-not-allowed"
                                        />
                                    </div>

                                    {/* Danh sách đáp án */}
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium mb-1">Đáp án</p>
                                        {q.answers?.map((a: any, aIndex: number) => (
                                            <div key={aIndex} className="flex items-center gap-3">
                                                <input
                                                    type={q.type === "MULTIPLE" ? "checkbox" : "radio"}
                                                    checked={!!a.isCorrect}
                                                    readOnly
                                                    className="w-4 h-4"
                                                />
                                                <input
                                                    type="text"
                                                    value={a.text}
                                                    readOnly
                                                    className="flex-1 border px-3 py-2 rounded-md bg-gray-100 cursor-not-allowed"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            ))}
                        </div>
                    </div>
                )}

                {/* Bottom Action Bar */}
                <div className="mt-6 bg-white rounded-2xl shadow p-6 flex justify-between items-center">
                    <div className="text-sm">
                        Câu hỏi mới: <span className="font-semibold text-purple-600">{questions.length}</span> |
                        &nbsp;Từ thư viện: <span className="font-semibold text-purple-600">{selectedExistingIds.length}</span>
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
                            onClick={handleSaveQuestionsToExam}
                            disabled={loading || (questions.length === 0 && selectedExistingIds.length === 0)}
                            className="px-6 py-2 bg-[#A53AEC] text-white rounded-lg hover:bg-[#8B2FC9] disabled:opacity-50"
                        >
                            {loading ? "Đang lưu..." : "Lưu câu hỏi cho bài thi"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
