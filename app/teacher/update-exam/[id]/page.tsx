"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Formik, Form, Field, FieldArray, ErrorMessage } from "formik";
import * as Yup from "yup";
import { fetchApi } from "@/lib/apiClient";
import { toastSuccess, toastError } from "@/lib/toast";
import { useUser } from "@/lib/user";

// ===== TYPES =====
interface Answer {
    id?: number;
    text: string;
    isCorrect: boolean;
}

interface Question {
    id?: number;
    title: string;
    type: string;
    difficulty: string;
    categoryId: string | number;
    categoryName?: string; // New field
    answers: Answer[];
    createdBy?: string; // New field
    visibility?: string; // New field
    isReadOnly?: boolean;
}

interface ExamFormValues {
    title: string;
    durationMinutes: number;
    categoryId: string | number;
    examLevel: string; // NEW: Exam Difficulty
    startTime: string; // HH:mm
    startDate: string; // YYYY-MM-DD
    endTime: string;   // HH:mm
    endDate: string;   // YYYY-MM-DD
    questions: Question[];
}

interface Category {
    id: number;
    name: string;
}

interface Option {
    id: string;
    name: string;
}

// ===== VALIDATION SCHEMA =====
const validationSchema = Yup.object().shape({
    title: Yup.string().required("Tiêu đề bài thi là bắt buộc"),
    durationMinutes: Yup.number()
        .required("Thời gian làm bài là bắt buộc")
        .min(1, "Thời gian phải lớn hơn 0"),
    categoryId: Yup.string().required("Danh mục là bắt buộc"),
    examLevel: Yup.string().required("Độ khó là bắt buộc"), // NEW Validation
    questions: Yup.array().of(
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

/* --- HELPER COMPONENTS (Copied from Questions Page) --- */
const XIcon = (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
    </svg>
);

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
        case "EASY": colorClass = "bg-green-100 text-green-800"; break;
        case "MEDIUM": colorClass = "bg-yellow-100 text-yellow-800"; break;
        case "HARD": colorClass = "bg-red-100 text-red-800"; break;
    }
    const difficultyMap: Record<string, string> = { 'EASY': 'Dễ', 'MEDIUM': 'Trung bình', 'HARD': 'Khó' };
    const text = diff ? (difficultyMap[diff] || diff) : "N/A";
    return <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>{text}</span>;
}

function VisibilityBadge({ visibility }: { visibility: string }) {
    const vis = visibility?.toUpperCase();
    let colorClass = "bg-gray-100 text-gray-800";
    let displayText = "N/A";

    switch (vis) {
        case "PUBLIC":
            colorClass = "bg-sky-100 text-sky-800";
            displayText = "Công khai";
            break;
        case "PRIVATE":
        case "HIDDEN": // Treat HIDDEN questions as PRIVATE for display
            colorClass = "bg-orange-100 text-orange-800";
            displayText = "Riêng tư";
            break;
    }
    return <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${colorClass}`}>{displayText}</span>;
}

function QuestionDetailModal({ open, onClose, question }: { open: boolean; onClose: () => void; question: any }) {
    if (!open || !question) return null;
    return (
        <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between p-6 pb-0 mb-4 bg-white rounded-t-2xl z-10 shrink-0">
                    <h3 className="text-xl font-bold text-gray-800">Chi tiết câu hỏi</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><XIcon /></button>
                </div>
                <div className="space-y-4 overflow-y-auto flex-1 px-6 pb-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Loại câu hỏi</label>
                            <p className="font-medium text-gray-900 mt-1">
                                {question.type === "SINGLE" ? "Một đáp án" : question.type === "MULTIPLE" ? "Nhiều đáp án" : question.type === "TRUE_FALSE" ? "Đúng / Sai" : question.type}
                            </p>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Độ khó</label>
                            <div className="mt-1"><DifficultyBadge difficulty={question.difficulty} /></div>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Danh mục</label>
                            <p className="font-medium text-gray-900 mt-1">{question.categoryName || "___"}</p>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Trạng thái</label>
                            <div className="mt-1"><VisibilityBadge visibility={question.visibility} /></div>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Người tạo</label>
                            <p className="font-medium text-gray-900 mt-1">{question.createdBy || "N/A"}</p>
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
                            {question.answers && question.answers.map((ans: any, idx: number) => (
                                <div key={idx} className={`p-3 rounded-lg border flex items-start gap-3 ${ans.isCorrect ? "bg-green-50 border-green-200" : "bg-white border-gray-200"}`}>
                                    <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border ${ans.isCorrect ? "bg-green-500 text-white border-green-500" : "bg-gray-100 text-gray-500 border-gray-300"}`}>
                                        {String.fromCharCode(65 + idx)}
                                    </div>
                                    <div className="flex-1">
                                        <p className={`text-sm ${ans.isCorrect ? "font-bold text-green-800" : "text-gray-700"}`}>{ans.text}</p>
                                    </div>
                                    {ans.isCorrect && <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded">Đúng</span>}
                                </div>
                            ))}
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

export default function UpdateExamPage() {
    const { id } = useParams();
    const router = useRouter();
    const { user } = useUser();
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState<Category[]>([]);
    const [difficultyOptions, setDifficultyOptions] = useState<Option[]>([]);
    const [initialValues, setInitialValues] = useState<ExamFormValues | null>(null);

    // Library State
    const [openLibrary, setOpenLibrary] = useState(false);
    const [libraryQuestions, setLibraryQuestions] = useState<Question[]>([]);
    const [libraryPage, setLibraryPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchCategory, setSearchCategory] = useState("");
    const [searchDifficulty, setSearchDifficulty] = useState("");
    const [searchType, setSearchType] = useState("");

    // Detail Modal State
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [viewingQuestion, setViewingQuestion] = useState(null);

    const openDetail = (q: any) => {
        setViewingQuestion(q);
        setDetailModalOpen(true);
    };

    // Fetch Data
    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            try {
                // 1. Fetch Categories & Difficulties
                const [cats, difficulties] = await Promise.all([
                    fetchApi("/categories/all"),
                    fetchApi("/questions/difficulties")
                ]);
                setCategories(cats);

                // Map difficulties
                const difficultyMap: Record<string, string> = {
                    'Easy': 'Dễ',
                    'Medium': 'Trung bình',
                    'Hard': 'Khó',
                    'EASY': 'Dễ',
                    'MEDIUM': 'Trung bình',
                    'HARD': 'Khó'
                };

                const formattedDifficulties = Array.isArray(difficulties) ? difficulties.map((d: any) => {
                    const val = typeof d === 'string' ? d : d.name;
                    return { id: val, name: difficultyMap[val] || val };
                }) : [];
                setDifficultyOptions(formattedDifficulties);

                // 2. Fetch Exam Details
                const exam = await fetchApi(`/exams/get/${id}`);

                // 3. Map to Form Values
                const startTimeObj = exam.startTime ? new Date(exam.startTime) : new Date();
                const endTimeObj = exam.endTime ? new Date(exam.endTime) : new Date();

                const mappedQuestions = exam.examQuestions?.map((eq: any) => ({
                    id: eq.question.id,
                    title: eq.question.title,
                    type: eq.question.type,
                    difficulty: eq.question.difficulty,
                    categoryId: eq.question.category?.id || exam.category?.id || "",
                    answers: eq.question.answers.map((a: any) => ({
                        id: a.id,
                        text: a.text,
                        isCorrect: a.correct || false,
                    })),
                    visibility: eq.question.visibility,
                    isReadOnly: eq.question.createdBy !== user.username || eq.question.visibility === 'PUBLIC'
                })) || [];

                // Empty default
                if (mappedQuestions.length === 0) {
                    mappedQuestions.push({
                        title: "",
                        type: "SINGLE",
                        difficulty: "EASY",
                        categoryId: exam.category?.id || "",
                        answers: [
                            { text: "", isCorrect: false },
                            { text: "", isCorrect: false },
                        ],
                        isReadOnly: false
                    });
                }

                setInitialValues({
                    title: exam.title,
                    durationMinutes: exam.durationMinutes,
                    categoryId: exam.category?.id || "",
                    examLevel: exam.examLevel || "", // Map examLevel
                    startTime: startTimeObj.toTimeString().slice(0, 5),
                    startDate: startTimeObj.toISOString().slice(0, 10),
                    endTime: endTimeObj.toTimeString().slice(0, 5),
                    endDate: endTimeObj.toISOString().slice(0, 10),
                    questions: mappedQuestions,
                });
            } catch (error) {
                console.error("Failed to load data:", error);
                toastError("Không thể tải thông tin bài thi.");
            } finally {
                setLoading(false);
            }
        };

        if (id && user) fetchData();
    }, [id, user]);

    // Search Library
    const handleSearchLibrary = async () => {
        try {
            const params = new URLSearchParams();
            if (searchQuery) params.append("q", searchQuery);
            if (searchCategory) params.append("categoryId", searchCategory);
            if (searchDifficulty) params.append("difficulty", searchDifficulty);
            if (searchType) params.append("type", searchType);

            const data = await fetchApi(`/questions/search?${params.toString()}`);

            const mapped = data.content.map((q: any) => {
                const mappedAnswers = q.answers.map((a: any) => ({
                    id: a.id,
                    text: a.text,
                    isCorrect: a.correct
                }));

                // Fallback
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
                    type: q.type,
                    difficulty: q.difficulty,
                    categoryId: q.category?.id,
                    categoryName: q.categoryName || q.category?.name,
                    createdBy: q.createdBy,
                    visibility: q.visibility,
                    answers: mappedAnswers,
                    isReadOnly: true
                };
            });
            setLibraryQuestions(mapped);
            setLibraryPage(1);
        } catch (error) {
            console.error("Search error:", error);
            toastError("Lỗi tìm kiếm câu hỏi.");
        }
    };

    // State for submit action
    const [submitAction, setSubmitAction] = useState<'DRAFT' | 'PUBLISHED'>('DRAFT');

    // Submit Handler
    const handleSubmit = async (values: ExamFormValues) => {
        try {
            const questionIds: number[] = [];

            // 1. Process Questions (Create/Update)
            for (const q of values.questions) {
                if (q.isReadOnly && q.id) {
                    questionIds.push(q.id);
                    continue;
                }

                // Build answers - only include essential fields
                const answers = q.answers.map((a) => ({
                    text: a.text.trim(),
                    correct: a.isCorrect,
                    ...(a.id && { id: a.id }), // Only include ID if it exists
                }));

                // Calculate correctAnswer for TRUE_FALSE
                let derivedCorrectAnswer = undefined;
                if (q.type === "TRUE_FALSE") {
                    const correctOne = answers.find(a => a.correct);
                    if (correctOne) derivedCorrectAnswer = correctOne.text;
                }

                const payload = {
                    title: q.title.trim(),
                    type: q.type,
                    difficulty: q.difficulty,
                    categoryId: Number(q.categoryId || values.categoryId),
                    answers: answers,
                    correctAnswer: derivedCorrectAnswer
                };

                let savedQ;
                if (q.id) {
                    // Update existing
                    console.log(`[DEBUG] Updating question ${q.id}:`, payload);
                    savedQ = await fetchApi(`/questions/edit/${q.id}`, {
                        method: "PATCH",
                        body: JSON.stringify(payload),
                    });
                } else {
                    // Create new
                    const createPayload = {
                        ...payload,
                        visibility: "PRIVATE", // Changed from "HIDDEN" to "PRIVATE"
                        createdBy: "TEACHER",
                    };
                    console.log(`[DEBUG] Creating new question:`, createPayload);
                    savedQ = await fetchApi("/questions/create", {
                        method: "POST",
                        body: JSON.stringify(createPayload),
                    });
                }

                if (savedQ && savedQ.id) {
                    questionIds.push(savedQ.id);
                }
            }

            // Validate that we have at least one question ID before updating exam
            if (!questionIds.length) {
                toastError("Phải có ít nhất 1 câu hỏi hợp lệ trong bài thi.");
                return;
            }

            const normalizedCategoryId = Number(values.categoryId);
            if (Number.isNaN(normalizedCategoryId)) {
                toastError("Danh mục bài thi không hợp lệ.");
                return;
            }

            // 2. Update Exam
            const examPayload = {
                title: values.title.trim(),
                durationMinutes: Number(values.durationMinutes),
                categoryId: normalizedCategoryId,
                examLevel: values.examLevel ? values.examLevel.toUpperCase() : "",
                startTime: `${values.startDate}T${values.startTime}:00`,
                endTime: `${values.endDate}T${values.endTime}:00`,
                questionIds: questionIds,
                description: "",
                status: submitAction // Use state
            };

            console.log(`[DEBUG] Updating exam ${id}:`, examPayload);

            await fetchApi(`/exams/edit/${id}`, {
                method: "PUT",
                body: JSON.stringify(examPayload),
            });

            toastSuccess(submitAction === 'DRAFT' ? "Đã lưu nháp!" : "Đã đăng bài thành công!");
            router.push("/teacher/list-exam");
        } catch (error: unknown) {
            const err = error as Error & { message?: string };
            console.error("Submit error:", error);
            toastError(err.message || "Có lỗi xảy ra khi lưu bài thi.");
        }
    };

    if (loading || !initialValues) return <div className="p-10">Đang tải...</div>;

    return (
        <div className="min-h-screen bg-[#F5F5F5] p-8">
            <Formik
                initialValues={initialValues}
                validationSchema={validationSchema}
                onSubmit={handleSubmit}
                enableReinitialize
            >
                {({ values, setFieldValue, errors, touched }) => (
                    <Form className="max-w-5xl mx-auto space-y-6">

                        {/* ======= THÔNG TIN BÀI THI ======= */}
                        <section className="bg-white rounded-2xl shadow p-8">
                            <h2 className="text-2xl font-semibold text-center mb-8">
                                Cập nhật bài thi
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Tên bài thi */}
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium mb-1">Tên bài thi</label>
                                    <Field
                                        name="title"
                                        className="w-full border px-3 py-2 rounded-md"
                                        placeholder="Nhập tên bài thi"
                                    />
                                    <ErrorMessage name="title" component="div" className="text-red-500 text-xs mt-1" />
                                </div>

                                {/* Danh mục */}
                                <div>
                                    <label className="block text-sm font-medium mb-1">Danh mục bài thi</label>
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

                                {/* Loại đề thi / Difficulty */}
                                <div>
                                    <label className="block text-sm font-medium mb-1">Loại đề thi</label>
                                    <Field
                                        as="select"
                                        name="examLevel"
                                        className="w-full border px-3 py-2 rounded-md bg-white"
                                    >
                                        <option value="">Chọn độ khó</option>
                                        {difficultyOptions.map((opt) => (
                                            <option key={opt.id} value={opt.id}>
                                                {opt.name}
                                            </option>
                                        ))}
                                    </Field>
                                    <ErrorMessage name="examLevel" component="div" className="text-red-500 text-xs mt-1" />
                                </div>

                                {/* Thời gian nộp bài */}
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium mb-1">Thời gian nộp bài</label>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm">Khoảng thời gian:</span>
                                        <Field
                                            type="number"
                                            name="durationMinutes"
                                            className="w-24 border px-3 py-1 rounded-md"
                                        />
                                        <span className="text-sm">Phút</span>
                                    </div>
                                    <ErrorMessage name="durationMinutes" component="div" className="text-red-500 text-xs mt-1" />
                                </div>

                                {/* Thời gian bắt đầu / kết thúc trên cùng một dòng */}
                                <div className="col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Thời gian bắt đầu */}
                                    <div>
                                        <label className="block text-sm font-medium mb-1"> Thời gian bắt đầu:</label>
                                        <div className="flex gap-2">
                                            <Field type="time" name="startTime" className="border px-2 py-1 rounded-md" />
                                            <Field type="date" name="startDate" className="border px-2 py-1 rounded-md" />
                                        </div>
                                    </div>

                                    {/* Thời gian kết thúc */}
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Thời gian kết thúc:</label>
                                        <div className="flex gap-2">
                                            <Field type="time" name="endTime" className="border px-2 py-1 rounded-md" />
                                            <Field type="date" name="endDate" className="border px-2 py-1 rounded-md" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* ======= KHUNG NỘI DUNG CÂU HỎI ======= */}
                        <section className="bg-white rounded-2xl shadow p-8 space-y-6">
                            <FieldArray name="questions">
                                {({ push, remove }) => (
                                    <>
                                        <div className="space-y-6">
                                            <div className="flex justify-between items-center">
                                                <h3 className="text-xl font-semibold">Danh sách câu hỏi</h3>
                                                <div className="flex items-center gap-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setOpenLibrary(true);
                                                            handleSearchLibrary(); // Load initial
                                                        }}
                                                        className="px-5 py-2 border-2 border-[#A53AEC] text-[#A53AEC] bg-white rounded-full hover:bg-purple-50"
                                                    >
                                                        Thư viện câu hỏi
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            push({
                                                                title: "",
                                                                type: "SINGLE",
                                                                difficulty: "EASY",
                                                                categoryId: values.categoryId,
                                                                answers: [
                                                                    { text: "", isCorrect: false },
                                                                    { text: "", isCorrect: false },
                                                                ],
                                                            })
                                                        }
                                                        className="px-5 py-2 rounded-full bg-purple-600 text-white hover:bg-purple-700"
                                                    >
                                                        + Thêm câu hỏi
                                                    </button>
                                                </div>
                                            </div>

                                            {values.questions.map((q, qIndex) => (
                                                <section
                                                    key={qIndex}
                                                    className={`bg-white rounded-2xl p-8 relative border ${q.isReadOnly ? 'border-gray-200 bg-gray-50' : 'border-black'}`}
                                                >
                                                    <div className="flex justify-between items-center mb-4">
                                                        <h3 className="text-lg font-semibold">
                                                            Câu hỏi {qIndex + 1} {q.isReadOnly && <span className="text-xs bg-gray-200 px-2 py-1 rounded ml-2">Thư viện</span>}
                                                        </h3>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                        {/* Tiêu đề câu hỏi */}
                                                        <div className="col-span-2">
                                                            <Field
                                                                name={`questions.${qIndex}.title`}
                                                                placeholder="Nhập câu hỏi..."
                                                                disabled={q.isReadOnly}
                                                                className={`w-full border px-3 py-2 rounded-md ${q.isReadOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                                            />
                                                            <ErrorMessage
                                                                name={`questions.${qIndex}.title`}
                                                                component="div"
                                                                className="text-red-500 text-xs mt-1"
                                                            />
                                                        </div>

                                                        {/* Loại câu hỏi */}
                                                        <div>
                                                            <Field
                                                                as="select"
                                                                name={`questions.${qIndex}.type`}
                                                                disabled={q.isReadOnly}
                                                                className={`w-full border px-3 py-2 rounded-md bg-white ${q.isReadOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                                                                    const newType = e.target.value;
                                                                    setFieldValue(`questions.${qIndex}.type`, newType);
                                                                    if (newType === 'TRUE_FALSE') {
                                                                        setFieldValue(`questions.${qIndex}.answers`, [
                                                                            { text: "Đúng", isCorrect: false },
                                                                            { text: "Sai", isCorrect: false }
                                                                        ]);
                                                                    }
                                                                }}
                                                            >
                                                                <option value="SINGLE">Chọn 1 đáp án</option>
                                                                <option value="MULTIPLE">Chọn nhiều đáp án</option>
                                                                <option value="TRUE_FALSE">Đúng/Sai</option>
                                                            </Field>
                                                        </div>

                                                        {/* Độ khó */}
                                                        <div>
                                                            <Field
                                                                as="select"
                                                                name={`questions.${qIndex}.difficulty`}
                                                                disabled={q.isReadOnly}
                                                                className={`w-full border px-3 py-2 rounded-md bg-white ${q.isReadOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                                            >
                                                                <option value="EASY">Dễ</option>
                                                                <option value="MEDIUM">Trung bình</option>
                                                                <option value="HARD">Khó</option>
                                                            </Field>
                                                        </div>
                                                    </div>

                                                    {/* Danh sách đáp án */}
                                                    <FieldArray name={`questions.${qIndex}.answers`}>
                                                        {({ push: pushAnswer, remove: removeAnswer }) => (
                                                            <div className="space-y-3">
                                                                {q.answers.map((a, aIndex) => (
                                                                    <div key={aIndex} className="flex items-center gap-3">
                                                                        <Field
                                                                            type={q.type === "MULTIPLE" ? "checkbox" : "radio"}
                                                                            name={`questions.${qIndex}.answers.${aIndex}.isCorrect`}
                                                                            checked={a.isCorrect}
                                                                            disabled={q.isReadOnly}
                                                                            onChange={() => {
                                                                                if (q.isReadOnly) return;
                                                                                if (q.type === "SINGLE" || q.type === "TRUE_FALSE") {
                                                                                    // Reset others for unique selection
                                                                                    q.answers.forEach((_, idx) => {
                                                                                        setFieldValue(
                                                                                            `questions.${qIndex}.answers.${idx}.isCorrect`,
                                                                                            idx === aIndex
                                                                                        );
                                                                                    });
                                                                                } else {
                                                                                    setFieldValue(
                                                                                        `questions.${qIndex}.answers.${aIndex}.isCorrect`,
                                                                                        !a.isCorrect
                                                                                    );
                                                                                }
                                                                            }}
                                                                            className="w-5 h-5"
                                                                        />
                                                                        <Field
                                                                            name={`questions.${qIndex}.answers.${aIndex}.text`}
                                                                            placeholder={`Đáp án ${aIndex + 1}`}
                                                                            disabled={q.isReadOnly}
                                                                            className={`flex-1 border px-3 py-2 rounded-md ${q.isReadOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                                                        />
                                                                        {q.answers.length > 2 && (
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => removeAnswer(aIndex)}
                                                                                disabled={q.isReadOnly}
                                                                                className={`${q.isReadOnly
                                                                                    ? 'text-gray-300 cursor-not-allowed'
                                                                                    : 'text-gray-400 hover:text-red-500'
                                                                                    }`}
                                                                            >
                                                                                🗑
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                                <ErrorMessage name={`questions.${qIndex}.answers`}>
                                                                    {(msg) => typeof msg === 'string' ? <div className="text-red-500 text-xs">{msg}</div> : null}
                                                                </ErrorMessage>

                                                                {!q.isReadOnly && (
                                                                    <div className="flex justify-end gap-3 mt-2">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => pushAnswer({ text: "", isCorrect: false })}
                                                                            className="text-sm text-purple-600 border border-purple-600 px-3 py-1 rounded-md hover:bg-purple-50"
                                                                        >
                                                                            + Thêm đáp án
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                if (values.questions.length > 1) {
                                                                                    remove(qIndex);
                                                                                } else {
                                                                                    toastError("Phải có ít nhất 1 câu hỏi");
                                                                                }
                                                                            }}
                                                                            className="text-sm text-red-500 border border-red-500 px-3 py-1 rounded-md hover:bg-red-50"
                                                                        >
                                                                            Xóa câu hỏi
                                                                        </button>
                                                                    </div>
                                                                )}
                                                                {q.isReadOnly && (
                                                                    <div className="flex justify-end gap-3 mt-2">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                if (values.questions.length > 1) {
                                                                                    remove(qIndex);
                                                                                } else {
                                                                                    toastError("Phải có ít nhất 1 câu hỏi");
                                                                                }
                                                                            }}
                                                                            className="text-sm text-red-500 border border-red-500 px-3 py-1 rounded-md hover:bg-red-50"
                                                                        >
                                                                            Xóa câu hỏi
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </FieldArray>
                                                </section>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </FieldArray>
                        </section>

                        {/* ======= ACTIONS ======= */}
                        <div className="flex justify-end gap-4 mt-8 pb-10">
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                            >
                                Hủy
                            </button>
                            <button
                                type="submit"
                                onClick={() => setSubmitAction('DRAFT')}
                                className="px-6 py-2 border border-purple-700 text-purple-700 font-medium rounded-lg hover:bg-purple-50 transition"
                            >
                                Lưu nháp
                            </button>
                            <button
                                type="submit"
                                onClick={() => setSubmitAction('PUBLISHED')}
                                className="px-6 py-2 bg-purple-700 hover:bg-purple-800 text-white font-medium rounded-lg transition shadow-md"
                            >
                                Đăng bài
                            </button>
                        </div>

                        {/* ================== MODAL THƯ VIỆN ================== */}
                        {openLibrary && (
                            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                                <div className="bg-white rounded-xl p-6 relative w-[95%] max-w-[1000px] min-h-[80vh] flex flex-col">
                                    <button
                                        type="button"
                                        onClick={() => setOpenLibrary(false)}
                                        className="absolute top-3 right-4 text-gray-500 text-lg hover:text-black"
                                    >
                                        x
                                    </button>

                                    <h2 className="text-xl font-semibold mb-4">Thư viện câu hỏi</h2>

                                    {/* Filter */}
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
                                                        const isAdded = values.questions.some((cq: any) => cq.id === q.id);
                                                        return (
                                                            <tr key={q.id} className="hover:bg-gray-50">
                                                                <td className="p-3 border-b">{(libraryPage - 1) * 10 + index + 1}</td>
                                                                <td className="p-3 border-b text-left px-4 max-w-[220px] truncate" title={q.title}>{q.title}</td>
                                                                <td className="p-3 border-b">
                                                                    {q.type === "SINGLE"
                                                                        ? "Một đáp án"
                                                                        : q.type === "MULTIPLE"
                                                                            ? "Nhiều đáp án"
                                                                            : q.type === "TRUE_FALSE"
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
                                                                            onClick={() => openDetail(q)}
                                                                        >
                                                                            <EyeIcon />
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            disabled={isAdded}
                                                                            onClick={() => {
                                                                                if (isAdded) return;
                                                                                const currentQuestions = values.questions;
                                                                                setFieldValue("questions", [...currentQuestions, q]);
                                                                                toastSuccess("Đã thêm câu hỏi.");
                                                                            }}
                                                                            className={
                                                                                "px-4 py-1 rounded-full text-xs font-medium " +
                                                                                (isAdded
                                                                                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                                                                    : "bg-green-500 text-white hover:bg-green-600")
                                                                            }
                                                                        >
                                                                            {isAdded ? "Đã thêm" : "Thêm"}
                                                                        </button>
                                                                        {isAdded && (
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    const updatedQuestions = values.questions.filter(
                                                                                        (cq: any) => cq.id !== q.id
                                                                                    );
                                                                                    setFieldValue("questions", updatedQuestions);
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
                                                {libraryQuestions.length === 0 && (
                                                    <tr>
                                                        <td colSpan={7} className="p-10 text-center text-gray-500">
                                                            Không tìm thấy câu hỏi nào.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Pagination */}
                                    {libraryQuestions.length > 0 && (() => {
                                        const totalPages = Math.max(1, Math.ceil(libraryQuestions.length / 10));
                                        const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
                                        return (
                                            <div className="flex items-center justify-center mt-4 text-sm gap-2">
                                                {/* First */}
                                                <button
                                                    type="button"
                                                    disabled={libraryPage === 1}
                                                    onClick={() => setLibraryPage(1)}
                                                    className={`px-2 text-lg ${libraryPage === 1 ? "text-gray-300 cursor-not-allowed" : "text-gray-500 hover:text-gray-700"}`}
                                                >
                                                    «
                                                </button>

                                                {/* Prev */}
                                                <button
                                                    type="button"
                                                    disabled={libraryPage === 1}
                                                    onClick={() => setLibraryPage((prev) => Math.max(1, prev - 1))}
                                                    className={`px-2 text-lg ${libraryPage === 1 ? "text-gray-300 cursor-not-allowed" : "text-gray-500 hover:text-gray-700"}`}
                                                >
                                                    ‹
                                                </button>

                                                {/* Page numbers */}
                                                {pages.map((page) => (
                                                    <button
                                                        key={page}
                                                        type="button"
                                                        onClick={() => setLibraryPage(page)}
                                                        className={
                                                            page === libraryPage
                                                                ? "w-8 h-8 rounded-full bg-[#A53AEC] text-white flex items-center justify-center shadow"
                                                                : "w-8 h-8 rounded-full text-gray-700 flex items-center justify-center hover:bg-gray-100"
                                                        }
                                                    >
                                                        {page}
                                                    </button>
                                                ))}

                                                {/* Next */}
                                                <button
                                                    type="button"
                                                    disabled={libraryPage === totalPages}
                                                    onClick={() => setLibraryPage((prev) => Math.min(totalPages, prev + 1))}
                                                    className={`px-2 text-lg ${libraryPage === totalPages ? "text-gray-300 cursor-not-allowed" : "text-gray-500 hover:text-gray-700"}`}
                                                >
                                                    ›
                                                </button>

                                                {/* Last */}
                                                <button
                                                    type="button"
                                                    disabled={libraryPage === totalPages}
                                                    onClick={() => setLibraryPage(totalPages)}
                                                    className={`px-2 text-lg ${libraryPage === totalPages ? "text-gray-300 cursor-not-allowed" : "text-gray-500 hover:text-gray-700"}`}
                                                >
                                                    »
                                                </button>
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                        )}

                        <QuestionDetailModal
                            open={detailModalOpen}
                            onClose={() => { setDetailModalOpen(false); setViewingQuestion(null); }}
                            question={viewingQuestion}
                        />
                    </Form>
                )}
            </Formik>
        </div >
    );
}
