"use client";

import React, { useState, useEffect } from "react";
import { fetchApi } from "@/lib/apiClient";
import { toastError, toastSuccess } from "@/lib/toast";
import { useRouter } from 'next/navigation';

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

export default function CreateExamPage() {
  // ======= STATE =======
  const [examCategory, setExamCategory] = useState("");
  const [examTitle, setExamTitle] = useState("");
  const [examType, setExamType] = useState("");
  const [duration, setDuration] = useState<number | "">(0);
  const [startTime, setStartTime] = useState("00:00");
  const [startDate, setStartDate] = useState("");
  const [endTime, setEndTime] = useState("00:00");
  const [endDate, setEndDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dynamic Options
  const [categoryOptions, setCategoryOptions] = useState<Category[]>([]);
  const [difficultyOptions, setDifficultyOptions] = useState<DifficultyOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  const router = useRouter();

  useEffect(() => {
    const fetchDropdownData = async () => {
      setLoadingOptions(true);
      try {
        const [categoriesRes, difficultiesRes] = await Promise.all([
          fetchApi('/categories/all'),
          fetchApi('/questions/difficulties'),
        ]);

        setCategoryOptions(categoriesRes);

        const difficultyMap: Record<string, string> = {
          'Easy': 'Dễ',
          'Medium': 'Trung bình',
          'Hard': 'Khó',
          'EASY': 'Dễ',
          'MEDIUM': 'Trung bình',
          'HARD': 'Khó'
        };

        const formattedDifficulties = Array.isArray(difficultiesRes) ? difficultiesRes.map((d: any) => {
          const val = typeof d === 'string' ? d : d.name;
          return { id: val, name: difficultyMap[val] || val };
        }) : [];
        setDifficultyOptions(formattedDifficulties);

      } catch (error) {
        toastError("Không thể tải các tùy chọn.");
        console.error("Failed to fetch dropdown options:", error);
      } finally {
        setLoadingOptions(false);
      }
    };
    fetchDropdownData();
  }, []);

  const handleSubmit = async (status: ExamStatus) => {
    if (!examTitle.trim()) {
      toastError("Vui lòng nhập tên bài thi");
      return;
    }
    if (!examType) {
      toastError("Vui lòng chọn độ khó");
      return;
    }
    if (!examCategory) {
      toastError("Vui lòng chọn danh mục");
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

    setIsSubmitting(true);
    try {
      const questionIds: number[] = []; // Initially empty as per original code behavior

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

      toastSuccess("Tạo bài thi thành công! (Đã lưu nháp)");
      router.push('/teacher/list-exam');

    } catch (error: any) {
      console.error("Error creating exam:", error);
      toastError(error.message || "Có lỗi xảy ra khi tạo bài thi");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#F5F5F5] text-gray-900">
      <div className="flex-1 flex flex-col">
        <main className="flex-1 overflow-y-auto px-10 py-8">
          <section className="bg-white rounded-2xl shadow p-8 mb-6">
            <h2 className="text-2xl font-semibold text-center mb-8">
              Tạo bài thi offline
            </h2>
            <div className="flex justify-start gap-6 border-b border-gray-300 mb-8">
              <a href="/teacher/exam-offline">
                <button className="pb-2 font-medium border-b-2 border-black">
                  Bài thi Offline
                </button>
              </a>
              <a href="/teacher/exam-online">
                <button className="pb-2 font-medium text-gray-500 hover:text-black hover:border-b-2 hover:border-gray-200">
                  Bài thi Online
                </button>
              </a>
            </div>

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
                    onChange={(e) => setDuration(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-20 border px-2 py-1 rounded-md"
                    min="1"
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
              onClick={() => router.back()}
              className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              onClick={() => handleSubmit('DRAFT')}
              disabled={isSubmitting}
              className="px-6 py-2 bg-purple-700 text-white rounded-md hover:bg-purple-800 disabled:opacity-50"
            >
              {isSubmitting ? "Đang xử lý..." : "Tạo bài thi"}
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
