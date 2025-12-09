"use client";

import React, { useState, useEffect } from "react";
import { fetchApi } from '@/lib/apiClient'; // Import fetchApi
import { toastError, toastSuccess } from '@/lib/toast'; // Import toastError

// TYPES

interface Option {
  id: number | string;
  name: string;
}

type Answer = {
  id: number;
  text: string;
  isCorrect: boolean;
};

type Question = {
  id: number;
  title: string;
  questionType: string;
  category: string;
  difficulty: string;
  answers: Answer[];
};

// API Endpoints
const ENDPOINTS = {
  types: '/questions/question-types',
  difficulties: '/questions/difficulties',
  categories: '/categories/all',
};

// Helper function to fetch data
const fetchOptions = async (url: string, fallback: Option[] = []) => {
  try {
    const res = await fetchApi(url);
    // Assuming the API returns an array of objects with 'id' and 'name'
    const data = Array.isArray(res) ? res.map((item: any) => {
      if (typeof item === 'string') {
        return { id: item, name: item };
      }
      return { id: item.id || item.name, name: item.name };
    }) : fallback;
    return data;
  } catch (error) {
    console.error(`Error fetching options from ${url}:`, error);
    toastError(`Failed to load options from ${url.split('/').pop()}.`);
    return fallback;
  }
};


// COMPONENT CHÍNH

export default function CreateExamPage() {
  // ======= STATE BÀI THI =======
  const [examCategory, setExamCategory] = useState("");
  const [examTitle, setExamTitle] = useState("");
  // const [questionCount, setQuestionCount] = useState<number | "">(""); // Removed
  const [examType, setExamType] = useState(""); // This will store difficulty ID/name for the exam
  const [duration, setDuration] = useState<number | "">(0);
  const [startTime, setStartTime] = useState("00:00");
  const [startDate, setStartDate] = useState("");
  const [endTime, setEndTime] = useState("00:00");
  const [endDate, setEndDate] = useState("");

  // ======= STATE CHO CÁC TÙY CHỌN ĐỘNG =======
  const [categoryOptions, setCategoryOptions] = useState<Option[]>([]);
  const [difficultyOptions, setDifficultyOptions] = useState<Option[]>([]);
  const [questionTypeOptions, setQuestionTypeOptions] = useState<Option[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  // Fetch dynamic options on component mount
  useEffect(() => {
    const loadOptions = async () => {
      setLoadingOptions(true);
      const [categories, difficulties, types] = await Promise.all([
        fetchOptions(ENDPOINTS.categories),
        fetchOptions(ENDPOINTS.difficulties),
        fetchOptions(ENDPOINTS.types),
      ]);
      setCategoryOptions(categories);

      const difficultyMap: Record<string, string> = {
        'EASY': 'Dễ',
        'MEDIUM': 'Trung bình',
        'HARD': 'Khó'
      };
      const mappedDifficulties = difficulties.map((d: Option) => ({
        ...d,
        name: difficultyMap[d.name] || d.name
      }));
      setDifficultyOptions(mappedDifficulties);

      setQuestionTypeOptions(types);
      setLoadingOptions(false);
    };
    loadOptions();
  }, []);


  // ======= STATE CÂU HỎI =======
  const [questions, setQuestions] = useState<Question[]>([]);

  const removeQuestion = (questionId: number) => {
    if (questions.length === 1) {
      alert("Phải có ít nhất 1 câu hỏi");
      return;
    }
    setQuestions(questions.filter((q) => q.id !== questionId));
  };

  const updateQuestionField = (
    qid: number,
    field: keyof Question,
    value: string
  ) => {
    setQuestions(
      questions.map((q) =>
        q.id === qid
          ? {
            ...q,
            [field]: value,
          }
          : q
      )
    );
  };

  const addAnswer = (qid: number) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === qid) {
          const newAnswerId = q.answers.length > 0 ? q.answers[q.answers.length - 1].id + 1 : 1;
          return {
            ...q,
            answers: [
              ...q.answers,
              { id: newAnswerId, text: "", isCorrect: false },
            ],
          };
        }
        return q;
      })
    );
  };

  const removeAnswer = (qid: number, aid: number) => {
    setQuestions(
      questions.map((q) =>
        q.id === qid
          ? {
            ...q,
            answers: q.answers.length > 2 ? q.answers.filter((a) => a.id !== aid) : q.answers, // Keep at least 2 answers
          }
          : q
      )
    );
  };

  const updateAnswerText = (qid: number, aid: number, value: string) => {
    setQuestions(
      questions.map((q) =>
        q.id === qid
          ? {
            ...q,
            answers: q.answers.map((a) =>
              a.id === aid ? { ...a, text: value } : a
            ),
          }
          : q
      )
    );
  };

  // TYPES
  type QuestionTypeOption = { id: string; name: string };
  type DifficultyOption = { id: string; name: string };

  type ExamStatus = 'DRAFT' | 'PUBLISHED';

  interface Category {
    id: number;
    name: string;
  }

  interface Question {
    id: number;
    title: string;
    type: string;
    level: string;
    correctAnswer: string;
    answers: { id: number; text: string; isCorrect: boolean }[];
    category: { id: number; name: string };
    difficulty?: string;
    createdBy?: string;
  }

  interface Exam {
    title: string;
    description: string;
    durationMinutes: number;
    categoryId: number;
    examLevel: string;
    status: ExamStatus;
  }
  //... (keeping imports and other parts same, targeting handleCreateExam)

  const handleCreateExam = async (status: ExamStatus) => {
    // 1. Validation
    if (!examTitle.trim()) {
      toastError("Vui lòng nhập tên bài thi");
      return;
    }
    if (!examCategory) {
      toastError("Vui lòng chọn danh mục");
      return;
    }

    if (!examType) {
      toastError("Vui lòng chọn độ khó");
      return;
    }
    if (!duration || Number(duration) <= 0) {
      toastError("Thời gian làm bài phải lớn hơn 0");
      return;
    }

    if (!startDate || !startTime) {
      toastError("Vui lòng chọn ngày và giờ bắt đầu");
      return;
    }
    const now = new Date();
    const startDateTime = new Date(`${startDate}T${startTime}:00`);
    if (isNaN(startDateTime.getTime())) {
      toastError("Thời gian bắt đầu không hợp lệ");
      return;
    }
    if (startDateTime < now) {
      toastError("Thời gian bắt đầu phải lớn hơn hoặc bằng thời gian hiện tại");
      return;
    }

    if (!endDate || !endTime) {
      toastError("Vui lòng chọn ngày và giờ kết thúc");
      return;
    }
    const endDateTime = new Date(`${endDate}T${endTime}:00`);
    if (isNaN(endDateTime.getTime())) {
      toastError("Thời gian kết thúc không hợp lệ");
      return;
    }
    if (endDateTime <= startDateTime) {
      toastError("Thời gian kết thúc phải sau thời gian bắt đầu");
      return;
    }


    try {
      // 2. Prepare question IDs
      const questionIds: number[] = []; // Empty initially

      // 3. Create Exam
      const examPayload = {
        title: examTitle,
        categoryId: examCategory,
        durationMinutes: Number(duration),
        startTime: `${startDate}T${startTime}:00`,
        endTime: `${endDate}T${endTime}:00`,
        questionIds: questionIds,
        description: `Bài thi ${examType}`,
        examLevel: examType.toUpperCase(),
        status: status
      };

      await fetchApi('/exams/create', {
        method: 'POST',
        body: examPayload
      });

      toastSuccess(status === 'DRAFT' ? "Đã lưu nháp!" : "Đã đăng bài thành công!");
      // Reset form or redirect? For now just notify.
      // Redirect to list
      window.location.href = '/admin/list-exam';

    } catch (error: any) {
      console.error("Error creating exam:", error);
      toastError(error.message || "Có lỗi xảy ra khi tạo bài thi");
    }
  };

  return (
    <div className="min-h-screen flex bg-[#F5F5F5] text-gray-900">
      <div className="flex-1 flex flex-col">
        <main className="flex-1 overflow-y-auto px-10 py-8">
          <section className="bg-white rounded-2xl shadow p-8 mb-6">
            <h2 className="text-2xl font-semibold text-center mb-8">
              Tạo bài thi offline - Admin
            </h2>

            {/* Các input đầu */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm mb-1">Tên bài thi</label>
                <input
                  type="text"
                  value={examTitle}
                  onChange={(e) => setExamTitle(e.target.value)}
                  className="w-full border px-3 py-2 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Loại đề thi</label>
                <select
                  value={examType}
                  onChange={(e) => setExamType(e.target.value)}
                  className="w-full border px-3 py-2 rounded-md bg-white"
                  disabled={loadingOptions}
                >
                  <option value="">{loadingOptions ? "Đang tải..." : "Chọn độ khó"}</option>
                  {difficultyOptions.map(opt => (
                    <option key={opt.id} value={opt.id}>{opt.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm mb-1">Danh mục bài thi</label>
                <select
                  value={examCategory}
                  onChange={(e) => setExamCategory(e.target.value)}
                  className="w-full border px-3 py-2 rounded-md bg-white"
                  disabled={loadingOptions}
                >
                  <option value="">{loadingOptions ? "Đang tải..." : "Chọn danh mục"}</option>
                  {categoryOptions.map(opt => (
                    <option key={opt.id} value={opt.id}>{opt.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Thời gian nộp bài */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Thời gian nộp bài
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-sm">Khoảng thời gian:</span>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) =>
                      setDuration(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    className="w-20 border px-2 py-1 rounded-md"
                    min="1"
                  />
                  <span>Phút</span>
                </div>
              </div>

              {/* Bắt đầu */}
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

                {/* Kết thúc */}
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

          {/* NÚT LƯU – ĐĂNG BÀI */}
          <div className="mt-6 flex justify-end gap-4">
            <button
              onClick={() => window.location.href = '/admin/list-exam'}
              className="px-6 py-2 border border-purple-700 text-purple-700 rounded-md">
              Hủy
            </button>

            <button
              onClick={() => handleCreateExam('DRAFT')}
              className="px-6 py-2 bg-purple-700 text-white rounded-md"
            >
              Tạo bài thi
            </button>
          </div>
        </main>

        <footer className="h-12 bg-white border-t border-gray-200 flex items-center justify-center text-sm text-gray-500">
          © 2025 QuizzZone. Mọi quyền được bảo lưu.
        </footer>
      </div>
    </div>
  );
}
