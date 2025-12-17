"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Formik, Form, Field, FieldArray, ErrorMessage } from "formik";
import * as Yup from "yup";
import { fetchApi } from "@/lib/apiClient";
import { toastError, toastSuccess } from "@/lib/toast";

// ===== TYPES =====
interface Answer {
    id?: number;
    text: string;
    isCorrect: boolean;
}

interface ManualQuestion {
    title: string;
    type: string;
    difficulty: string;
    categoryId: string | number;
    answers: Answer[];
}

interface LibraryQuestion {
    id: number;
    title: string;
    difficulty: string;
    type: string;
    category: {
        id: number;
        name: string;
    };
    categoryName?: string;
    createdBy?: string;
    createdByName?: string;
    visibility?: string;
    answers?: Answer[];
}

interface Category {
    id: number;
    name: string;
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
    category: {
        id: number;
        name: string;
    };
}

interface FormValues {
    name: string;
    level: string;
    durationMinutes: number;
    passingScore: number;
    maxParticipants: number;
    categoryId: number;
    manualQuestions: ManualQuestion[];
}

// ===== VALIDATION SCHEMA =====
const validationSchema = Yup.object().shape({
    name: Yup.string().required("Tên bài thi là bắt buộc"),
    level: Yup.string().required("Độ khó là bắt buộc"),
    durationMinutes: Yup.number().required("Thời gian làm bài là bắt buộc").min(1, "Thời gian phải lớn hơn 0"),
    passingScore: Yup.number().required("Điểm đạt là bắt buộc").min(0, "Điểm đạt phải từ 0-10").max(10, "Điểm đạt phải từ 0-10"),
    maxParticipants: Yup.number().required("Số người tham gia là bắt buộc").min(1, "Số người phải lớn hơn 0"),
    categoryId: Yup.number().required("Danh mục là bắt buộc"),
    manualQuestions: Yup.array().of(
        Yup.object().shape({
            title: Yup.string().required("Tiêu đề câu hỏi là bắt buộc"),
            type: Yup.string().required("Loại câu hỏi là bắt buộc"),
            difficulty: Yup.string().required("Độ khó là bắt buộc"),
            answers: Yup.array()
                .of(
                    Yup.object().shape({
                        text: Yup.string().required("Nội dung đáp án là bắt buộc"),
                    })
                )
                .min(2, "Phải có ít nhất 2 đáp án")
                .test(
                    "one-correct",
                    "Phải có ít nhất 1 đáp án đúng",
                    (answers) => answers?.some((a: any) => a.isCorrect) || false
                ),
        })
    ),
});

// ===== HELPER COMPONENTS =====
const EyeIcon = (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);

function DifficultyBadge({ difficulty }: { difficulty: string }) {
    const diff = difficulty?.toUpperCase();
    let colorClass = "bg-gray-100 text-gray-800";
    switch (diff) {
        case "EASY":
            colorClass = "bg-green-100 text-green-800";
            break;
        case "MEDIUM":
            colorClass = "bg-yellow-100 text-yellow-800";
            break;
        case "HARD":
            colorClass = "bg-red-100 text-red-800";
            break;
    }
    const label = diff === "EASY" ? "Dễ" : diff === "MEDIUM" ? "Trung bình" : diff === "HARD" ? "Khó" : difficulty;
    return <span className={`px-2 py-1 rounded text-xs font-semibold ${colorClass}`}>{label}</span>;
}

function VisibilityBadge({ visibility }: { visibility?: string }) {
    if (!visibility) return <span className="px-2 py-1 rounded text-xs font-semibold bg-gray-100 text-gray-800">N/A</span>;
    const vis = visibility.toUpperCase();
    const colorClass = vis === "PUBLIC" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800";
    const label = vis === "PUBLIC" ? "Công khai" : "Riêng tư";
    return <span className={`px-2 py-1 rounded text-xs font-semibold ${colorClass}`}>{label}</span>;
}

function QuestionDetailModal({ question, onClose }: { question: any; onClose: () => void }) {
    if (!question) return null;
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
                <div className="p-6 border-b border-gray-100 shrink-0">
                    <h2 className="text-2xl font-bold text-gray-900">Chi tiết câu hỏi</h2>
                </div>
                <div className="p-6 overflow-y-auto flex-1 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Loại câu hỏi</label>
                            <p className="font-medium text-gray-900 mt-1">
                                {question.type === "SINGLE" ? "Một đáp án" : question.type === "MULTIPLE" ? "Nhiều đáp án" : "Đúng / Sai"}
                            </p>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Độ khó</label>
                            <div className="mt-1"><DifficultyBadge difficulty={question.difficulty} /></div>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Danh mục</label>
                            <p className="font-medium text-gray-900 mt-1">{question.categoryName || question.category?.name || "___"}</p>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Trạng thái</label>
                            <div className="mt-1"><VisibilityBadge visibility={question.visibility} /></div>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Người tạo</label>
                            <p className="font-medium text-gray-900 mt-1">{question.createdByName || question.createdBy || "N/A"}</p>
                        </div>
                    </div>
                    <div className="pt-4 border-t border-gray-100">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Nội dung câu hỏi</label>
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                            <p className="text-lg font-bold text-gray-800">{question.title}</p>
                        </div>
                    </div>
                    <div className="pt-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Danh sách đáp án</label>
                        <div className="space-y-2">
                            {question.answers && question.answers.map((ans: any, idx: number) => {
                                const isCorrect = ans.isCorrect || ans.correct;
                                return (
                                    <div key={idx} className={`p-3 rounded-lg border flex items-start gap-3 ${isCorrect ? "bg-green-50 border-green-200" : "bg-white border-gray-200"}`}>
                                        <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border ${isCorrect ? "bg-green-500 text-white border-green-500" : "bg-gray-100 text-gray-500 border-gray-300"}`}>
                                            {String.fromCharCode(65 + idx)}
                                        </div>
                                        <div className="flex-1">
                                            <p className={`text-sm ${isCorrect ? "font-bold text-green-800" : "text-gray-700"}`}>{ans.text}</p>
                                        </div>
                                        {isCorrect && <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded">Đúng</span>}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
                <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl shrink-0 flex justify-end">
                    <button onClick={onClose} className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-xl transition">Đóng</button>
                </div>
            </div>
        </div>
    );
}

export default function AddQuestionsToExamPage() {
    const params = useParams();
    const router = useRouter();
    const examId = params.id as string;

    const [exam, setExam] = useState<ExamOnline | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Library modal state
    const [openLibrary, setOpenLibrary] = useState(false);
    const [libraryQuestions, setLibraryQuestions] = useState<LibraryQuestion[]>([]);
    const [selectedLibraryQuestions, setSelectedLibraryQuestions] = useState<number[]>([]);
    const [questionsLoading, setQuestionsLoading] = useState(false);

    // Filters
    const [searchQuery, setSearchQuery] = useState("");
    const [difficulty, setDifficulty] = useState("");
    const [searchType, setSearchType] = useState("");
    const [searchCategory, setSearchCategory] = useState("");

    // Detail Modal State
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [viewingQuestion, setViewingQuestion] = useState<LibraryQuestion | null>(null);

    const openDetail = (q: LibraryQuestion) => {
        setViewingQuestion(q);
        setDetailModalOpen(true);
    };

    // Initial form values
    const [initialValues, setInitialValues] = useState<FormValues | null>(null);

    // Fetch exam details and categories
    useEffect(() => {
        if (!examId) return;

        const fetchData = async () => {
            try {
                const [examData, categoriesData] = await Promise.all([
                    fetchApi(`/online-exams/${examId}`),
                    fetchApi("/categories/all")
                ]);

                setExam(examData);
                setCategories(categoriesData);

                if (examData.status !== "DRAFT") {
                    toastError("Chỉ có thể chỉnh sửa bài thi ở trạng thái DRAFT");
                    router.push("/admin/list-exam");
                    return;
                }

                setInitialValues({
                    name: examData.name,
                    level: examData.level,
                    durationMinutes: examData.durationMinutes,
                    passingScore: examData.passingScore,
                    maxParticipants: examData.maxParticipants,
                    categoryId: examData.category?.id || examData.categoryId || 0,
                    manualQuestions: [
                        {
                            title: "",
                            type: "SINGLE",
                            difficulty: "EASY",
                            categoryId: examData.category?.id || examData.categoryId || 0,
                            answers: [
                                { text: "", isCorrect: false },
                                { text: "", isCorrect: false },
                            ],
                        },
                    ],
                });
            } catch (err) {
                console.error("Failed to fetch data:", err);
                toastError("Không thể tải thông tin bài thi");
                router.push("/admin/list-exam");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [examId, router]);

    // Search library questions
    const handleSearchLibrary = async () => {
        setQuestionsLoading(true);
        try {
            const params = new URLSearchParams({
                page: "0",
                size: "100",
            });
            if (searchQuery) params.append("search", searchQuery);
            if (difficulty) params.append("difficulty", difficulty);
            if (searchType) params.append("type", searchType);
            if (searchCategory) params.append("categoryId", searchCategory);

            const response = await fetchApi(`/questions/all?${params.toString()}`);
            setLibraryQuestions(response.content || []);
        } catch (error) {
            console.error("Failed to fetch questions:", error);
            toastError("Không thể tải danh sách câu hỏi");
        } finally {
            setQuestionsLoading(false);
        }
    };

    const toggleLibraryQuestion = (questionId: number) => {
        setSelectedLibraryQuestions((prev) =>
            prev.includes(questionId)
                ? prev.filter((id) => id !== questionId)
                : [...prev, questionId]
        );
    };

    const handleSubmit = async (values: FormValues) => {
        // Filter out empty manual questions (questions without title or answers)
        const validManualQuestions = values.manualQuestions.filter(
            (q) => q.title.trim() !== "" && q.answers.some((a) => a.text.trim() !== "")
        );

        const totalQuestions = validManualQuestions.length + selectedLibraryQuestions.length;

        if (totalQuestions === 0) {
            toastError("Vui lòng thêm ít nhất một câu hỏi (thủ công hoặc từ thư viện)");
            return;
        }

        try {
            setSubmitting(true);
            const questionIds: number[] = [];

            // 1. Update exam info
            await fetchApi(`/online-exams/${examId}/update`, {
                method: "PUT",
                body: {
                    name: values.name.trim(),
                    level: values.level,
                    durationMinutes: values.durationMinutes,
                    passingScore: values.passingScore,
                    maxParticipants: values.maxParticipants,
                    categoryId: values.categoryId,
                },
            });

            // 2. Create manual questions (only valid ones)
            for (const q of validManualQuestions) {
                // Ensure categoryId is valid
                const questionCategoryId = Number(q.categoryId);
                const validCategoryId = questionCategoryId > 0 ? questionCategoryId : Number(values.categoryId);

                const payload = {
                    title: q.title.trim(),
                    type: q.type,
                    difficulty: q.difficulty,
                    categoryId: validCategoryId,
                    answers: q.answers
                        .filter((a) => a.text.trim() !== "") // Filter empty answers
                        .map((a) => ({
                            text: a.text.trim(),
                            correct: a.isCorrect,
                        })),
                    visibility: "PRIVATE",
                    createdBy: "TEACHER",
                };

                const savedQ = await fetchApi("/questions/create", {
                    method: "POST",
                    body: payload,
                });

                if (savedQ?.id) {
                    questionIds.push(savedQ.id);
                }
            }

            // 3. Add library question IDs
            questionIds.push(...selectedLibraryQuestions);

            // 4. Submit questions to exam
            if (questionIds.length > 0) {
                await fetchApi(`/online-exams/${examId}/questions`, {
                    method: "POST",
                    body: { questionIds },
                });
            }

            toastSuccess("Đã cập nhật bài thi thành công!");
            router.push("/admin/list-exam");
        } catch (error: any) {
            console.error("Failed to update exam:", error);
            toastError(error.message || "Không thể cập nhật bài thi");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading || !initialValues) {
        return <div className="flex-1 flex items-center justify-center">Đang tải...</div>;
    }

    if (!exam) {
        return <div className="flex-1 flex items-center justify-center">Không tìm thấy bài thi</div>;
    }

    return (
        <div className="flex-1 px-10 py-8">
            <Formik
                initialValues={initialValues}
                validationSchema={validationSchema}
                onSubmit={handleSubmit}
                enableReinitialize
            >
                {({ values, setFieldValue }) => (
                    <Form className="max-w-6xl mx-auto space-y-6">
                        {/* Exam Information Section */}
                        <div className="bg-white rounded-2xl shadow p-8">
                            <h2 className="text-2xl font-semibold text-center mb-8">
                                Chỉnh sửa bài thi Online
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Exam Name */}
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium mb-1">
                                        Tên bài thi <span className="text-red-500">*</span>
                                    </label>
                                    <Field
                                        name="name"
                                        className="w-full border px-3 py-2 rounded-md"
                                        placeholder="Nhập tên bài thi"
                                    />
                                    <ErrorMessage name="name" component="div" className="text-red-500 text-xs mt-1" />
                                </div>

                                {/* Category */}
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Danh mục <span className="text-red-500">*</span>
                                    </label>
                                    <Field
                                        as="select"
                                        name="categoryId"
                                        className="w-full border px-3 py-2 rounded-md bg-white"
                                    >
                                        <option value="">Chọn danh mục</option>
                                        {categories.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.name}
                                            </option>
                                        ))}
                                    </Field>
                                    <ErrorMessage name="categoryId" component="div" className="text-red-500 text-xs mt-1" />
                                </div>

                                {/* Level */}
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Độ khó <span className="text-red-500">*</span>
                                    </label>
                                    <Field
                                        as="select"
                                        name="level"
                                        className="w-full border px-3 py-2 rounded-md bg-white"
                                    >
                                        <option value="">Chọn độ khó</option>
                                        <option value="EASY">Dễ</option>
                                        <option value="MEDIUM">Trung bình</option>
                                        <option value="HARD">Khó</option>
                                    </Field>
                                    <ErrorMessage name="level" component="div" className="text-red-500 text-xs mt-1" />
                                </div>

                                {/* Duration */}
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Thời gian làm bài (phút) <span className="text-red-500">*</span>
                                    </label>
                                    <Field
                                        type="number"
                                        name="durationMinutes"
                                        min="1"
                                        className="w-full border px-3 py-2 rounded-md"
                                        placeholder="60"
                                    />
                                    <ErrorMessage name="durationMinutes" component="div" className="text-red-500 text-xs mt-1" />
                                </div>

                                {/* Passing Score */}
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Điểm đạt (0-10) <span className="text-red-500">*</span>
                                    </label>
                                    <Field
                                        type="number"
                                        name="passingScore"
                                        min="0"
                                        max="10"
                                        step="0.5"
                                        className="w-full border px-3 py-2 rounded-md"
                                        placeholder="5"
                                    />
                                    <ErrorMessage name="passingScore" component="div" className="text-red-500 text-xs mt-1" />
                                </div>

                                {/* Max Participants */}
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium mb-1">
                                        Số người tham gia tối đa <span className="text-red-500">*</span>
                                    </label>
                                    <Field
                                        type="number"
                                        name="maxParticipants"
                                        min="1"
                                        className="w-full border px-3 py-2 rounded-md"
                                        placeholder="30"
                                    />
                                    <ErrorMessage name="maxParticipants" component="div" className="text-red-500 text-xs mt-1" />
                                </div>
                            </div>
                        </div>

                        {/* Manual Questions Section */}
                        <div className="bg-white rounded-2xl shadow p-6">
                            <FieldArray name="manualQuestions">
                                {({ push, remove }) => (
                                    <>
                                        <div className="flex justify-between items-center mb-6">
                                            <h2 className="text-lg font-semibold">
                                                Danh sách câu hỏi
                                            </h2>
                                            <div className="flex gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setOpenLibrary(true);
                                                        handleSearchLibrary();
                                                    }}
                                                    className="px-5 py-2 border-2 border-[#A53AEC] text-[#A53AEC] bg-white rounded-full hover:bg-purple-50"
                                                >
                                                    Thư viện câu hỏi
                                                </button>
                                            </div>
                                        </div>

                                        {/* Manual Questions */}
                                        {values.manualQuestions.length > 0 && (
                                            <div className="space-y-6 mb-6">
                                                {values.manualQuestions.map((q, qIndex) => (
                                                    <div
                                                        key={qIndex}
                                                        className="border-2 border-black rounded-xl p-6 bg-white"
                                                    >
                                                        <div className="flex justify-between items-center mb-4">
                                                            <h3 className="text-lg font-semibold">
                                                                Câu hỏi {qIndex + 1}
                                                            </h3>
                                                        </div>

                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                            {/* Title */}
                                                            <div className="col-span-2">
                                                                <label className="block text-sm font-medium mb-1">
                                                                    Tiêu đề câu hỏi
                                                                </label>
                                                                <Field
                                                                    name={`manualQuestions.${qIndex}.title`}
                                                                    placeholder="Nhập câu hỏi..."
                                                                    className="w-full border px-3 py-2 rounded-md"
                                                                />
                                                                <ErrorMessage
                                                                    name={`manualQuestions.${qIndex}.title`}
                                                                    component="div"
                                                                    className="text-red-500 text-xs mt-1"
                                                                />
                                                            </div>

                                                            {/* Type */}
                                                            <div>
                                                                <label className="block text-sm font-medium mb-1">
                                                                    Loại câu hỏi
                                                                </label>
                                                                <Field
                                                                    as="select"
                                                                    name={`manualQuestions.${qIndex}.type`}
                                                                    className="w-full border px-3 py-2 rounded-md bg-white"
                                                                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                                                                        const newType = e.target.value;
                                                                        setFieldValue(`manualQuestions.${qIndex}.type`, newType);
                                                                        if (newType === "TRUE_FALSE") {
                                                                            setFieldValue(`manualQuestions.${qIndex}.answers`, [
                                                                                { text: "Đúng", isCorrect: false },
                                                                                { text: "Sai", isCorrect: false },
                                                                            ]);
                                                                        }
                                                                    }}
                                                                >
                                                                    <option value="SINGLE">Chọn 1 đáp án</option>
                                                                    <option value="MULTIPLE">Chọn nhiều đáp án</option>
                                                                    <option value="TRUE_FALSE">Đúng/Sai</option>
                                                                </Field>
                                                            </div>

                                                            {/* Difficulty */}
                                                            <div>
                                                                <label className="block text-sm font-medium mb-1">
                                                                    Độ khó
                                                                </label>
                                                                <Field
                                                                    as="select"
                                                                    name={`manualQuestions.${qIndex}.difficulty`}
                                                                    className="w-full border px-3 py-2 rounded-md bg-white"
                                                                >
                                                                    <option value="EASY">Dễ</option>
                                                                    <option value="MEDIUM">Trung bình</option>
                                                                    <option value="HARD">Khó</option>
                                                                </Field>
                                                            </div>
                                                        </div>

                                                        {/* Answers */}
                                                        <FieldArray name={`manualQuestions.${qIndex}.answers`}>
                                                            {({ push: pushAnswer, remove: removeAnswer }) => (
                                                                <div className="space-y-3">
                                                                    <label className="block text-sm font-medium">
                                                                        Danh sách đáp án
                                                                    </label>
                                                                    {q.answers.map((a, aIndex) => (
                                                                        <div key={aIndex} className="flex items-center gap-3">
                                                                            <Field
                                                                                type={q.type === "MULTIPLE" ? "checkbox" : "radio"}
                                                                                name={`manualQuestions.${qIndex}.answers.${aIndex}.isCorrect`}
                                                                                checked={a.isCorrect}
                                                                                onChange={() => {
                                                                                    if (q.type === "SINGLE" || q.type === "TRUE_FALSE") {
                                                                                        q.answers.forEach((_, idx) => {
                                                                                            setFieldValue(
                                                                                                `manualQuestions.${qIndex}.answers.${idx}.isCorrect`,
                                                                                                idx === aIndex
                                                                                            );
                                                                                        });
                                                                                    } else {
                                                                                        setFieldValue(
                                                                                            `manualQuestions.${qIndex}.answers.${aIndex}.isCorrect`,
                                                                                            !a.isCorrect
                                                                                        );
                                                                                    }
                                                                                }}
                                                                                className="w-5 h-5"
                                                                            />
                                                                            <Field
                                                                                name={`manualQuestions.${qIndex}.answers.${aIndex}.text`}
                                                                                placeholder={`Đáp án ${aIndex + 1}`}
                                                                                className="flex-1 border px-3 py-2 rounded-md"
                                                                            />
                                                                            {q.answers.length > 2 && q.type !== "TRUE_FALSE" && (
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => removeAnswer(aIndex)}
                                                                                    className="text-red-500 hover:text-red-700"
                                                                                >
                                                                                    🗑
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                    <ErrorMessage name={`manualQuestions.${qIndex}.answers`}>
                                                                        {(msg) =>
                                                                            typeof msg === "string" ? (
                                                                                <div className="text-red-500 text-xs">{msg}</div>
                                                                            ) : null
                                                                        }
                                                                    </ErrorMessage>

                                                                    <div className="flex justify-end gap-3 mt-2">
                                                                        {q.type !== "TRUE_FALSE" && (
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => pushAnswer({ text: "", isCorrect: false })}
                                                                                className="text-sm text-purple-600 border border-purple-600 px-3 py-1 rounded-md hover:bg-purple-50"
                                                                            >
                                                                                + Thêm đáp án
                                                                            </button>
                                                                        )}
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => remove(qIndex)}
                                                                            className="text-sm text-red-500 border border-red-500 px-3 py-1 rounded-md hover:bg-red-50"
                                                                        >
                                                                            Xóa câu hỏi
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </FieldArray>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Library Questions Display */}
                                        {selectedLibraryQuestions.length > 0 && (
                                            <div className="space-y-6 mt-6">
                                                {libraryQuestions
                                                    .filter(q => selectedLibraryQuestions.includes(q.id))
                                                    .map((q, index) => (
                                                        <div
                                                            key={q.id}
                                                            className="bg-gray-50 rounded-2xl p-8 relative border border-gray-200"
                                                        >
                                                            <div className="flex justify-between items-center mb-4">
                                                                <h3 className="text-lg font-semibold">
                                                                    Câu hỏi {values.manualQuestions.length + index + 1}{" "}
                                                                    <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded ml-2">
                                                                        Thư viện
                                                                    </span>
                                                                </h3>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => toggleLibraryQuestion(q.id)}
                                                                    className="text-sm text-red-500 border border-red-500 px-3 py-1 rounded-md hover:bg-red-50"
                                                                >
                                                                    Xóa câu hỏi
                                                                </button>
                                                            </div>

                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                                {/* Title */}
                                                                <div className="col-span-2">
                                                                    <label className="block text-sm font-medium mb-1">
                                                                        Tiêu đề câu hỏi
                                                                    </label>
                                                                    <input
                                                                        value={q.title}
                                                                        disabled
                                                                        className="w-full border px-3 py-2 rounded-md bg-gray-100 cursor-not-allowed"
                                                                    />
                                                                </div>

                                                                {/* Type */}
                                                                <div>
                                                                    <label className="block text-sm font-medium mb-1">
                                                                        Loại câu hỏi
                                                                    </label>
                                                                    <select
                                                                        value={q.type}
                                                                        disabled
                                                                        className="w-full border px-3 py-2 rounded-md bg-gray-100 cursor-not-allowed"
                                                                    >
                                                                        <option value="SINGLE">Chọn 1 đáp án</option>
                                                                        <option value="MULTIPLE">Chọn nhiều đáp án</option>
                                                                        <option value="TRUE_FALSE">Đúng/Sai</option>
                                                                    </select>
                                                                </div>

                                                                {/* Difficulty */}
                                                                <div>
                                                                    <label className="block text-sm font-medium mb-1">
                                                                        Độ khó
                                                                    </label>
                                                                    <select
                                                                        value={q.difficulty}
                                                                        disabled
                                                                        className="w-full border px-3 py-2 rounded-md bg-gray-100 cursor-not-allowed"
                                                                    >
                                                                        <option value="EASY">Dễ</option>
                                                                        <option value="MEDIUM">Trung bình</option>
                                                                        <option value="HARD">Khó</option>
                                                                    </select>
                                                                </div>
                                                            </div>

                                                            {/* Answers */}
                                                            <div className="space-y-3">
                                                                <label className="block text-sm font-medium">
                                                                    Danh sách đáp án
                                                                </label>
                                                                {q.answers && q.answers.map((a: any, aIndex: number) => {
                                                                    const isCorrect = a.isCorrect || a.correct;
                                                                    return (
                                                                        <div key={aIndex} className="flex items-center gap-3">
                                                                            <input
                                                                                type={q.type === "MULTIPLE" ? "checkbox" : "radio"}
                                                                                checked={isCorrect}
                                                                                disabled
                                                                                className="w-5 h-5"
                                                                            />
                                                                            <input
                                                                                value={a.text}
                                                                                disabled
                                                                                className="flex-1 border px-3 py-2 rounded-md bg-gray-100 cursor-not-allowed"
                                                                            />
                                                                            <button
                                                                                type="button"
                                                                                disabled
                                                                                className="text-gray-400 cursor-not-allowed"
                                                                            >
                                                                                🗑
                                                                            </button>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    ))}
                                            </div>
                                        )}

                                        {/* Add Question Button - Always at bottom */}
                                        <div className="mt-4 flex justify-center">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    push({
                                                        title: "",
                                                        type: "SINGLE",
                                                        difficulty: "EASY",
                                                        categoryId: values.categoryId || "",
                                                        answers: [
                                                            { text: "", isCorrect: false },
                                                            { text: "", isCorrect: false },
                                                        ],
                                                    })
                                                }
                                                className="px-5 py-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition"
                                            >
                                                + Thêm câu hỏi
                                            </button>
                                        </div>

                                        {/* Empty State */}
                                        {values.manualQuestions.length === 0 && selectedLibraryQuestions.length === 0 && (
                                            <div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                                                <p className="mb-2">Chưa có câu hỏi nào</p>
                                                <p className="text-sm">Nhấn "+ Thêm câu hỏi" để tạo mới hoặc "Thư viện câu hỏi" để chọn từ thư viện</p>
                                            </div>
                                        )}
                                    </>
                                )}
                            </FieldArray>
                        </div>

                        {/* Bottom Action Bar */}
                        <div className="bg-white rounded-2xl shadow p-6 flex justify-between items-center">
                            <div className="text-sm">
                                Tổng cộng:{" "}
                                <span className="font-semibold text-purple-600">
                                    {values.manualQuestions.length + selectedLibraryQuestions.length}
                                </span>{" "}
                                câu hỏi
                                {(values.manualQuestions.length > 0 || selectedLibraryQuestions.length > 0) && (
                                    <span className="text-gray-500 ml-2">
                                        ({values.manualQuestions.length} thủ công + {selectedLibraryQuestions.length} thư viện)
                                    </span>
                                )}
                            </div>
                            <div className="flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => router.push("/admin/list-exam")}
                                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                    disabled={submitting}
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-6 py-2 bg-[#A53AEC] text-white rounded-lg hover:bg-[#8B2FC9] disabled:opacity-50"
                                >
                                    {submitting ? "Đang lưu..." : "Lưu thay đổi"}
                                </button>
                            </div>
                        </div>

                        {/* Library Modal */}
                        {openLibrary && (
                            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                                <div className="bg-white rounded-xl p-6 relative w-[95%] max-w-[1000px] min-h-[80vh] max-h-[90vh] flex flex-col">
                                    <button
                                        type="button"
                                        onClick={() => setOpenLibrary(false)}
                                        className="absolute top-3 right-4 text-gray-500 text-2xl hover:text-black"
                                    >
                                        ×
                                    </button>

                                    <h2 className="text-xl font-semibold mb-4">
                                        Thư viện câu hỏi ({selectedLibraryQuestions.length} đã chọn)
                                    </h2>

                                    {/* Filters */}
                                    <div className="flex flex-wrap gap-3 mb-4 items-center">
                                        <input
                                            placeholder="Tìm kiếm theo tiêu đề..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="flex-1 h-[40px] rounded-full border border-gray-300 px-4 text-sm"
                                        />
                                        <select
                                            value={difficulty}
                                            onChange={(e) => setDifficulty(e.target.value)}
                                            className="h-[40px] px-4 rounded-full border border-gray-300 text-sm"
                                        >
                                            <option value="">Tất cả độ khó</option>
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
                                                <option key={c.id} value={c.id}>
                                                    {c.name}
                                                </option>
                                            ))}
                                        </select>
                                        <button
                                            type="button"
                                            onClick={handleSearchLibrary}
                                            className="bg-[#A53AEC] text-white px-5 py-2 rounded-full text-sm hover:bg-[#8B2FC9]"
                                        >
                                            Tìm kiếm
                                        </button>
                                    </div>

                                    {/* Table */}
                                    <div className="flex-1 overflow-auto border border-gray-200 rounded-lg">
                                        {questionsLoading ? (
                                            <div className="flex items-center justify-center h-full">
                                                <p className="text-gray-500">Đang tải câu hỏi...</p>
                                            </div>
                                        ) : libraryQuestions.length === 0 ? (
                                            <div className="flex items-center justify-center h-full">
                                                <p className="text-gray-500">Không tìm thấy câu hỏi nào.</p>
                                            </div>
                                        ) : (
                                            <table className="w-full border-collapse text-sm">
                                                <thead className="bg-gray-50 sticky top-0">
                                                    <tr>
                                                        <th className="p-3 border-b text-center w-12">STT</th>
                                                        <th className="p-3 border-b text-left">Tiêu đề</th>
                                                        <th className="p-3 border-b text-center">Loại câu hỏi</th>
                                                        <th className="p-3 border-b text-center">Độ khó</th>
                                                        <th className="p-3 border-b text-center">Danh mục</th>
                                                        <th className="p-3 border-b text-center">Người tạo</th>
                                                        <th className="p-3 border-b text-center">Thao tác</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {libraryQuestions.map((q, index) => {
                                                        const isSelected = selectedLibraryQuestions.includes(q.id);
                                                        return (
                                                            <tr key={q.id} className="hover:bg-gray-50">
                                                                <td className="p-3 border-b text-center">{index + 1}</td>
                                                                <td className="p-3 border-b text-left max-w-[300px] truncate" title={q.title}>
                                                                    {q.title}
                                                                </td>
                                                                <td className="p-3 border-b text-center">
                                                                    {q.type === "SINGLE"
                                                                        ? "Một đáp án"
                                                                        : q.type === "MULTIPLE"
                                                                            ? "Nhiều đáp án"
                                                                            : q.type === "TRUE_FALSE"
                                                                                ? "Đúng / Sai"
                                                                                : q.type}
                                                                </td>
                                                                <td className="p-3 border-b text-center">
                                                                    {q.difficulty === "EASY"
                                                                        ? "Dễ"
                                                                        : q.difficulty === "MEDIUM"
                                                                            ? "Trung bình"
                                                                            : q.difficulty === "HARD"
                                                                                ? "Khó"
                                                                                : q.difficulty}
                                                                </td>
                                                                <td className="p-3 border-b text-center">
                                                                    {q.categoryName || q.category?.name || "-"}
                                                                </td>
                                                                <td className="p-3 border-b text-center">
                                                                    {q.createdByName || q.createdBy || "N/A"}
                                                                </td>
                                                                <td className="p-3 border-b text-center">
                                                                    <div className="flex items-center justify-center gap-2">
                                                                        <button
                                                                            type="button"
                                                                            className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-full transition"
                                                                            title="Xem chi tiết"
                                                                            onClick={() => openDetail(q)}
                                                                        >
                                                                            <EyeIcon />
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            disabled={isSelected}
                                                                            onClick={() => {
                                                                                if (!isSelected) {
                                                                                    toggleLibraryQuestion(q.id);
                                                                                    toastSuccess("Đã thêm câu hỏi.");
                                                                                }
                                                                            }}
                                                                            className={
                                                                                "px-4 py-1 rounded-full text-xs font-medium " +
                                                                                (isSelected
                                                                                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                                                                    : "bg-green-500 text-white hover:bg-green-600")
                                                                            }
                                                                        >
                                                                            {isSelected ? "Đã thêm" : "Thêm"}
                                                                        </button>
                                                                        {isSelected && (
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    toggleLibraryQuestion(q.id);
                                                                                    toastSuccess("Đã xóa câu hỏi.");
                                                                                }}
                                                                                className="px-3 py-1 rounded-full text-xs font-medium bg-red-500 text-white hover:bg-red-600"
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

                                    {/* Modal Actions */}
                                    <div className="mt-4 flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => setOpenLibrary(false)}
                                            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                                        >
                                            Đóng
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </Form>
                )}
            </Formik>

            {/* Question Detail Modal */}
            {detailModalOpen && viewingQuestion && (
                <QuestionDetailModal
                    question={viewingQuestion}
                    onClose={() => setDetailModalOpen(false)}
                />
            )}
        </div>
    );
}
