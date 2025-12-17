"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchApi } from "@/lib/apiClient";
import toast from "react-hot-toast";

interface ExamHistory {
  id: number;
  studentId: number;
  studentName: string; // Changed from displayName
  submittedAt: string;
  attemptNumber: number;
  correctCount: number;
  totalQuestions: number;
  score: number;
}

export default function ListHistoryExamPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const examId = searchParams.get("examId");

  const [histories, setHistories] = useState<ExamHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!examId) {
      toast.error("Không tìm thấy mã bài thi.");
      setLoading(false);
      return;
    }

    const loadHistories = async () => {
      try {
        setLoading(true);
        const data = await fetchApi(`/examHistory/exam/${examId}`);
        if (Array.isArray(data)) {
          setHistories(data);
        } else {
          setHistories([]);
          console.warn("API did not return an array for exam histories:", data);
        }
      } catch (error) {
        console.error("Load exam histories error:", error);
        toast.error("Không thể tải lịch sử làm bài của bài thi này.");
        setHistories([]);
      } finally {
        setLoading(false);
      }
    };

    loadHistories();
  }, [examId]);

  // ====== MOCK THỐNG KÊ NHƯ ẢNH ======
  // TODO: Replace with real calculations from fetched data
  const examStats = {
    accuracy: "80%",
    completion: "80%",
    totalStudents: "80%",
    questionCount: histories[0]?.totalQuestions || 5,
  };

  const filtered = histories.filter((h) =>
    h.studentName.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const formatDate = (isoString: string) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleDateString('vi-VN') + ' ' + date.toLocaleTimeString('en-US', { hour12: true });
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col text-gray-800">

      {/* CONTENT */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">

        {/* BACK BUTTON */}
        {/* HEADER / TABS */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex gap-8 text-sm font-bold border-b border-gray-200 w-full">
            <button
              onClick={() => router.push("/teacher/history-exam")}
              className="pb-3 text-gray-500 hover:text-[#A53AEC] transition-colors"
            >
              <span className="text-base">Bài thi</span>
            </button>

            <button className="pb-3 text-[#A53AEC] border-b-2 border-[#A53AEC]">
              <span className="text-base">Lịch sử thi</span>
            </button>
          </div>
        </div>

        {/* CARD */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">


          {/* =====================================================
               PHẦN THỐNG KÊ – THÊM MỚI (GIỐNG ẢNH BẠN GỬI)
             ===================================================== */}
          <div className="grid grid-cols-4 text-center border rounded-xl p-4 mb-8 bg-gray-50">

            <div className="flex flex-col">
              <span className="text-gray-600 text-sm font-medium">Độ chính xác:</span>
              <span className="font-semibold">{examStats.accuracy}</span>
            </div>

            <div className="flex flex-col">
              <span className="text-gray-600 text-sm font-medium">Tỉ lệ hoàn thành:</span>
              <span className="font-semibold">{examStats.completion}</span>
            </div>

            <div className="flex flex-col">
              <span className="text-gray-600 text-sm font-medium">Tổng số học sinh:</span>
              <span className="font-semibold">{examStats.totalStudents}</span>
            </div>

            <div className="flex flex-col">
              <span className="text-gray-600 text-sm font-medium">Câu hỏi:</span>
              <span className="font-semibold">{examStats.questionCount}</span>
            </div>

          </div>
          {/* ===================================================== */}



          {/* TOOLBAR */}
          <div className="flex justify-between items-center mb-8">
            <div className="relative w-full md:w-96 flex gap-2">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm kiếm sinh viên..."
                  className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A53AEC] focus:border-transparent bg-gray-50 hover:bg-white transition-all text-sm h-10"
                />
              </div>
            </div>

            <div className="bg-purple-50 text-[#A53AEC] px-4 py-2 rounded-lg text-sm font-semibold">
              Tổng số bài thi: {filtered.length}
            </div>
          </div>

          {/* TABLE */}
          <div className="overflow-hidden rounded-xl border border-gray-100">
            <table className="w-full text-sm text-left">
              <thead className="bg-[#F3EBFD] text-[#4D1597] uppercase text-xs font-bold tracking-wider">
                <tr>
                  <th className="py-4 px-6">STT</th>
                  <th className="py-4 px-6">Sinh viên</th>
                  <th className="py-4 px-6">Thời gian nộp</th>
                  <th className="py-4 px-6">Lượt thi</th>
                  <th className="py-4 px-6 text-center">Kết quả</th>
                  <th className="py-4 px-6 text-center">Điểm số</th>
                  <th className="py-4 px-6 text-center">Thao tác</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-500">
                        <div className="flex justify-center items-center gap-2">
                            <div className="w-5 h-5 border-2 border-[#A53AEC] border-t-transparent rounded-full animate-spin"></div>
                            <span>Đang tải dữ liệu...</span>
                        </div>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-400">
                      Không có dữ liệu
                    </td>
                  </tr>
                ) : (
                  filtered.map((h, index) => (
                    <tr key={h.id} className="hover:bg-purple-50/30 transition-colors">
                      <td className="py-4 px-6">#{index + 1}</td>
                      <td className="py-4 px-6 font-semibold">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-[#A53AEC] font-bold text-xs">
                            {(h.studentName || "S").charAt(0).toUpperCase()}
                          </div>
                          {h.studentName}
                        </div>
                      </td>
                      <td className="py-4 px-6">{formatDate(h.submittedAt)}</td>
                      <td className="py-4 px-6">Lần {h.attemptNumber}</td>
                      <td className="py-4 px-6 text-center">
                        <span className="text-green-600 bg-green-50 px-3 py-1 rounded-full text-xs font-bold">
                          {h.correctCount}/{h.totalQuestions}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center font-bold text-[#A53AEC]">{h.score}</td>
                      <td className="py-4 px-6 text-center">
                        <button
                          onClick={() => router.push(`/teacher/history-result/${h.id}`)}
                          className="text-[#A53AEC] hover:text-white hover:bg-[#A53AEC] border border-[#A53AEC] px-3 py-1.5 rounded-lg text-xs uppercase font-bold transition-all"
                        >
                          Chi tiết
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-gray-100 text-center text-sm text-gray-400 py-6 mt-auto">
        © 2025 QuizzZone. Education Platform.
      </footer>
    </div>
  );
}
