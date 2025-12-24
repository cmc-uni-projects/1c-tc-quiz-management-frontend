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
    status?: 'DRAFT' | 'PUBLISHED';
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

export default function AdminUpdateExamPage() {
    const { id } = useParams();
    const router = useRouter();
    const { user } = useUser();
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState<Category[]>([]);
    const [difficultyOptions, setDifficultyOptions] = useState<Option[]>([]);
    const [initialValues, setInitialValues] = useState<ExamFormValues | null>(null);
    const [submitAction, setSubmitAction] = useState<'DRAFT' | 'PUBLISHED' | null>(null);

    // Library State
    const [openLibrary, setOpenLibrary] = useState(false);
    const [libraryQuestions, setLibraryQuestions] = useState<Question[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchCategory, setSearchCategory] = useState("");
    const [searchDifficulty, setSearchDifficulty] = useState("");
    const [searchType, setSearchType] = useState("");

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

                // Map difficulties (assuming response is array of strings or objects)
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
                    isReadOnly: eq.question.createdBy !== user.username
                })) || [];

                // Empty default if needed... omitted for brevity or keeping original logic
                if (mappedQuestions.length === 0) {
                    mappedQuestions.push({
                        title: "",
                        type: "SINGLE",
                        difficulty: "EASY",
                        categoryId: exam.category?.id || "",
                        answers: [
                            { text: "", isCorrect: false },
                            { text: "", isCorrect: false },
                            { text: "", isCorrect: false },
                        ],
                        isReadOnly: false
                    });
                }

                const formatLocalDate = (date: Date) => {
                    const year = date.getFullYear();
                    const month = (date.getMonth() + 1).toString().padStart(2, '0');
                    const day = date.getDate().toString().padStart(2, '0');
                    return `${year}-${month}-${day}`;
                };

                setInitialValues({
                    title: exam.title,
                    durationMinutes: exam.durationMinutes,
                    categoryId: exam.category?.id || "",
                    examLevel: exam.examLevel || "", // Map examLevel
                    startTime: startTimeObj.toTimeString().slice(0, 5),
                    startDate: formatLocalDate(startTimeObj), // Use local formatted date
                    endTime: endTimeObj.toTimeString().slice(0, 5),
                    endDate: formatLocalDate(endTimeObj),   // Use local formatted date
                    questions: mappedQuestions,
                    status: exam.status || 'DRAFT'
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
            // Map API response to Question interface
            const mapped = data.content.map((q: any) => {
                const mappedAnswers = q.answers.map((a: any) => ({
                    id: a.id,
                    text: a.text,
                    isCorrect: a.correct
                }));

                // Fallback: If no answer is marked correct, check q.correctAnswer
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
                    categoryName: q.categoryName || q.category?.name, // Map category name
                    createdBy: q.createdBy, // Map creator
                    answers: mappedAnswers,
                    isReadOnly: true // Mark as read-only
                };
            });
            setLibraryQuestions(mapped);
        } catch (error) {
            console.error("Search error:", error);
            toastError("Lỗi tìm kiếm câu hỏi.");
        }
    };

    // Submit Handler
    const handleSubmit = async (values: ExamFormValues) => {
        try {
            const currentStatus = submitAction || 'DRAFT';
            const questionIds: number[] = [];

            // 1. Process Questions (Create/Update)
            for (const q of values.questions) {
                // If ReadOnly, just push ID and skip update
                if (q.isReadOnly && q.id) {
                    questionIds.push(q.id);
                    continue;
                }

                const payload = {
                    title: q.title,
                    type: q.type,
                    difficulty: q.difficulty,
                    categoryId: q.categoryId || values.categoryId,
                    answers: q.answers.map((a) => ({
                        id: a.id,
                        text: a.text,
                        correct: a.isCorrect,
                    })),
                    correctAnswer: "",
                };

                let savedQ;
                if (q.id) {
                    // Update existing
                    savedQ = await fetchApi(`/questions/edit/${q.id}`, {
                        method: "PATCH",
                        body: JSON.stringify(payload),
                    });
                } else {
                    // Create new
                    savedQ = await fetchApi("/questions/create", {
                        method: "POST",
                        body: JSON.stringify({ ...payload, createdBy: "Admin", visibility: "PRIVATE" }),
                    });
                }

                if (savedQ && savedQ.id) {
                    questionIds.push(savedQ.id);
                }
            }

            // 2. Update Exam
            const examPayload = {
                title: values.title,
                durationMinutes: values.durationMinutes,
                categoryId: values.categoryId,
                examLevel: values.examLevel, // Include examLevel
                startTime: `${values.startDate}T${values.startTime}:00`,
                endTime: `${values.endDate}T${values.endTime}:00`,
                questionIds: questionIds,
                description: "",
                status: currentStatus
            };

            await fetchApi(`/exams/edit/${id}`, {
                method: "PUT",
                body: JSON.stringify(examPayload),
            });

            toastSuccess(currentStatus === 'DRAFT' ? "Đã lưu nháp!" : "Đã đăng bài thành công!");
            router.push("/admin/list-exam");
        } catch (error: any) {
            console.error("Submit error:", error);
            toastError(error.message || "Có lỗi xảy ra khi lưu bài thi.");
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
                                Cập nhật bài thi - Admin
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
                                    <label className="block text-sm font-medium mb-1">Danh mục</label>
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

                                {/* Thời gian làm bài */}
                                <div>
                                    <label className="block text-sm font-medium mb-1">Thời gian (phút)</label>
                                    <Field
                                        type="number"
                                        name="durationMinutes"
                                        className="w-full border px-3 py-2 rounded-md"
                                    />
                                    <ErrorMessage name="durationMinutes" component="div" className="text-red-500 text-xs mt-1" />
                                </div>

                                {/* Thời gian bắt đầu */}
                                <div>
                                    <label className="block text-sm font-medium mb-1">Bắt đầu</label>
                                    <div className="flex gap-2">
                                        <Field type="time" name="startTime" className="border px-2 py-1 rounded-md" />
                                        <Field type="date" name="startDate" className="border px-2 py-1 rounded-md" />
                                    </div>
                                </div>

                                {/* Thời gian kết thúc */}
                                <div>
                                    <label className="block text-sm font-medium mb-1">Kết thúc</label>
                                    <div className="flex gap-2">
                                        <Field type="time" name="endTime" className="border px-2 py-1 rounded-md" />
                                        <Field type="date" name="endDate" className="border px-2 py-1 rounded-md" />
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* ======= DANH SÁCH CÂU HỎI ======= */}
                        <FieldArray name="questions">
                            {({ push, remove }) => (
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-xl font-semibold">Danh sách câu hỏi</h3>
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
                                    </div>

                                    {values.questions.map((q, qIndex) => (
                                        <section key={qIndex} className={`bg-white rounded-2xl shadow p-8 relative ${q.isReadOnly ? 'border-2 border-gray-200 bg-gray-50' : ''}`}>
                                            <div className="flex justify-between items-center mb-4">
                                                <h3 className="text-lg font-semibold">
                                                    Câu hỏi {qIndex + 1} {q.isReadOnly && <span className="text-xs bg-gray-200 px-2 py-1 rounded ml-2">Thư viện</span>}
                                                </h3>
                                                <button
                                                    type="button"
                                                    onClick={() => remove(qIndex)}
                                                    className="text-red-500 hover:bg-red-50 p-2 rounded"
                                                >
                                                    Xóa câu hỏi
                                                </button>
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
                                                                            // Reset others
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
                                                                    disabled={q.isReadOnly || q.type === "TRUE_FALSE"}
                                                                    className={`flex-1 border px-3 py-2 rounded-md ${q.isReadOnly || q.type === "TRUE_FALSE" ? 'bg-gray-100' : ''}`}
                                                                />
                                                                {!q.isReadOnly && q.type !== "TRUE_FALSE" && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => removeAnswer(aIndex)}
                                                                        className="text-gray-400 hover:text-red-500"
                                                                    >
                                                                        🗑
                                                                    </button>
                                                                )}
                                                            </div>
                                                        ))}
                                                        <ErrorMessage name={`questions.${qIndex}.answers`}>
                                                            {(msg) => typeof msg === 'string' ? <div className="text-red-500 text-xs">{msg}</div> : null}
                                                        </ErrorMessage>

                                                        {!q.isReadOnly && q.type !== "TRUE_FALSE" && (
                                                            <button
                                                                type="button"
                                                                onClick={() => pushAnswer({ text: "", isCorrect: false })}
                                                                className="text-sm text-purple-600 border border-purple-600 px-3 py-1 rounded hover:bg-purple-50"
                                                            >
                                                                + Thêm đáp án
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </FieldArray>
                                        </section>
                                    ))}

                                    {/* Add Question Button */}
                                    <div className="flex justify-center mt-6">
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
                                            className="px-6 py-2 rounded-full bg-purple-600 text-white hover:bg-purple-700 shadow-md transition-all hover:scale-105"
                                        >
                                            + Thêm câu hỏi
                                        </button>
                                    </div>
                                </div>
                            )}
                        </FieldArray>

                        {/* ======= ACTIONS ======= */}
                        <div className="flex justify-end gap-4 mt-8 pb-10">
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
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
                                <div className="bg-white rounded-xl p-6 relative w-[95%] max-w-[1000px] min-h-[80vh] max-h-[90vh] flex flex-col">
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
                                            placeholder="Nhập tiêu đề..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="flex-1 h-[40px] rounded-full border border-gray-300 px-4 text-sm"
                                        />
                                        <select
                                            value={searchDifficulty}
                                            onChange={(e) => setSearchDifficulty(e.target.value)}
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
                                            <option value="">Tất cả loại</option>
                                            <option value="SINGLE">Một đáp án</option>
                                            <option value="MULTIPLE">Nhiều đáp án</option>
                                            <option value="TRUE_FALSE">Đúng/Sai</option>
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
                                        <table className="w-full border-collapse text-left text-sm">
                                            <thead className="bg-gray-50 sticky top-0">
                                                <tr>
                                                    <th className="p-3 border-b w-10">#</th>
                                                    <th className="p-3 border-b">Tiêu đề</th>
                                                    <th className="p-3 border-b">Danh mục</th>
                                                    <th className="p-3 border-b">Loại</th>
                                                    <th className="p-3 border-b">Độ khó</th>
                                                    <th className="p-3 border-b">Đáp án</th>
                                                    <th className="p-3 border-b">Người tạo</th>
                                                    <th className="p-3 border-b text-center">Thao tác</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {libraryQuestions
                                                    .filter(q => !values.questions.some(cq => cq.id === q.id))
                                                    .map((q, index) => (
                                                        <tr key={q.id} className="hover:bg-gray-50">
                                                            <td className="p-3 border-b text-center">{index + 1}</td>
                                                            <td className="p-3 border-b font-medium max-w-[200px] truncate" title={q.title}>{q.title}</td>
                                                            <td className="p-3 border-b">{q.categoryName || "-"}</td>
                                                            <td className="p-3 border-b">
                                                                {q.type === "SINGLE" ? "Một đáp án" : "Nhiều đáp án"}
                                                            </td>
                                                            <td className="p-3 border-b">
                                                                <span className={`px-2 py-1 rounded text-xs ${q.difficulty === "EASY" ? "bg-green-100 text-green-700" :
                                                                    q.difficulty === "MEDIUM" ? "bg-yellow-100 text-yellow-700" :
                                                                        "bg-red-100 text-red-700"
                                                                    }`}>
                                                                    {q.difficulty === "EASY" ? "Dễ" : q.difficulty === "MEDIUM" ? "TB" : "Khó"}
                                                                </span>
                                                            </td>
                                                            <td className="p-3 border-b max-w-[250px]">
                                                                <ul className="list-disc list-inside text-xs text-gray-600">
                                                                    {q.answers.map((a, idx) => (
                                                                        <li key={idx} className={a.isCorrect ? "text-green-600 font-medium" : ""}>
                                                                            {a.text}
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </td>
                                                            <td className="p-3 border-b text-gray-500 text-xs">{q.createdBy || "Unknown"}</td>
                                                            <td className="p-3 border-b text-center">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        // Add to form
                                                                        const currentQuestions = values.questions;
                                                                        // Check if exists
                                                                        if (currentQuestions.some(cq => cq.id === q.id)) {
                                                                            toastError("Câu hỏi này đã có trong bài thi.");
                                                                            return;
                                                                        }
                                                                        setFieldValue("questions", [...currentQuestions, q]);
                                                                        toastSuccess("Đã thêm câu hỏi.");
                                                                    }}
                                                                    className="text-purple-600 hover:underline font-medium"
                                                                >
                                                                    Thêm
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                {libraryQuestions.length === 0 && (
                                                    <tr>
                                                        <td colSpan={8} className="p-10 text-center text-gray-500">
                                                            Không tìm thấy câu hỏi nào.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}
                    </Form>
                )}
            </Formik>
        </div >
    );
}
