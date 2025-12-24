// Cleaned & optimized version — functionality unchanged
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/apiClient";
import toast from "react-hot-toast";

// ICONS
const ClockIcon = () => <span>🕒</span>;
const CalendarIcon = () => <span>📅</span>;

interface Exam {
  examId: number;
  title: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  questionCount: number;
  status?: string;
}

export default function HistoryExamPage() {
  const router = useRouter();

  // OFFLINE STATE
  const [exams, setExams] = useState<Exam[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ==================== FETCH OFFLINE EXAMS ====================
  useEffect(() => {
    const fetchExams = async () => {
      try {
        const data = await fetchApi("/exams/my");
        const validExams = Array.isArray(data)
          ? data.filter((e: any) => e.status !== "DRAFT")
          : [];

        const mapped: Exam[] = validExams.map((e: any) => ({
          examId: e.examId,
          title: e.title,
          startTime: e.startTime
            ? new Date(e.startTime).toLocaleString("vi-VN")
            : "Không giới hạn",
          endTime: e.endTime
            ? new Date(e.endTime).toLocaleString("vi-VN")
            : "Không giới hạn",
          durationMinutes: e.durationMinutes,
          questionCount: e.questionCount || e.examQuestions?.length || 0,
          status: calculateStatus(e.startTime, e.endTime),
        }));

        setExams(mapped);
      } catch (error) {
        console.error("Fetch exams error:", error);
        toast.error("Không thể tải danh sách bài thi.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchExams();
  }, []);

  // ==================== UTIL: STATUS ====================
  const calculateStatus = (start?: string, end?: string) => {
    const now = new Date();
    if (end && new Date(end) < now) return "Đã kết thúc";
    if (start && new Date(start) > now) return "Chưa bắt đầu";
    return "Đang diễn ra";
  };

  const navigateToDetail = (examId: number) => {
    router.push(`/teacher/list-history-exam?examId=${examId}`);
  };

  // ==================== RENDER ====================
  return (
    <div className="flex flex-col bg-[#F5F5F5] flex-1 min-h-full">
      <main className="px-10 py-8 flex-1">

        {/* ===================== TAB ===================== */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex gap-8 text-sm font-bold border-b border-gray-200 w-full">
            <button
              onClick={() => router.push("/teacher/list-exam")}
              className="pb-3 text-gray-500 hover:text-[#A53AEC]"
            >
              <span className="text-base">Bài thi</span>
            </button>

            <button
              className="pb-3 text-[#A53AEC] border-b-2 border-[#A53AEC]"
            >
              <span className="text-base">Lịch sử thi offline</span>
            </button>

            <button
              onClick={() => router.push("/teacher/history-exam-online")}
              className="pb-3 text-gray-500 hover:text-[#A53AEC]"
            >
              <span className="text-base">Lịch sử thi online</span>
            </button>
          </div>
        </div>

        {/* ==================== TÌM KIẾM ==================== */}
        <div className="p-6 rounded-lg mb-8 bg-transparent">
          <div className="flex flex-wrap items-end gap-4">
            <input
              placeholder="Nhập từ khóa tìm kiếm..."
              className="h-10 px-4 border border-gray-300 rounded-full bg-white w-[200px]"
            />

            <div className="flex flex-col">
              <label className="text-sm mb-1">Thời gian bắt đầu:</label>
              <input
                type="date"
                className="h-10 px-4 border border-gray-300 rounded-full bg-white w-[200px]"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-sm mb-1">Thời gian kết thúc:</label>
              <input
                type="date"
                className="h-10 px-4 border border-gray-300 rounded-full bg-white w-[200px]"
              />
            </div>

            <button className="bg-[#A53AEC] text-white px-6 py-2 rounded-full">
              Tìm kiếm
            </button>
          </div>
        </div>

        {/* ==================== OFFLINE LIST ==================== */}
        {isLoading ? (
          <div className="text-center py-10">Đang tải dữ liệu...</div>
        ) : exams.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            Chưa có bài thi nào.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exams.map((exam) => (
              <div
                key={exam.examId}
                className="bg-white border rounded-lg p-4 shadow hover:shadow-md transition"
              >
                <p className="font-semibold text-lg mb-2 line-clamp-1">
                  {exam.title}
                </p>

                <p><ClockIcon /> Bắt đầu: {exam.startTime}</p>
                <p><CalendarIcon /> Kết thúc: {exam.endTime}</p>
                <p>⏳ Thời gian: {exam.durationMinutes} phút</p>
                <p>📘 Câu hỏi: {exam.questionCount} câu</p>

                <div className="flex flex-col items-center mt-4">
                  <span
                    className={`font-semibold ${exam.status === "Đã kết thúc"
                        ? "text-red-500"
                        : "text-green-600"
                      }`}
                  >
                    ● {exam.status}
                  </span>

                  <button
                    onClick={() => navigateToDetail(exam.examId)}
                    className="text-blue-600 text-sm hover:underline mt-1"
                  >
                    Xem lịch sử làm bài
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
