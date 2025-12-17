"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchApi } from "@/lib/apiClient";
import toast from "react-hot-toast";

interface ExamHistory {
    id: number;
    studentId: number;
    displayName: string;
    submittedAt: string;
    attemptNumber: number;
    correctCount: number;
    totalQuestions: number;
    score: number;
}

export default function AdminListHistoryExamPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const examId = searchParams.get('examId');

  const [histories, setHistories] = useState<ExamHistory[]>([]);
  const [filteredHistories, setFilteredHistories] = useState<ExamHistory[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);

    useEffect(() => {
        if (!examId) {
            toast.error("Không tìm thấy ID bài thi");
            router.push("/admin/history-exam");
            return;
        }

        const fetchHistory = async () => {
            try {
                const data = await fetchApi(`/examHistory/get/${examId}`); // GET /api/examHistory/get/{examId}

                // Map Data
                const mapped: ExamHistory[] = Array.isArray(data) ? data.map((h: any) => ({
                    id: h.id,
                    studentId: h.studentId,
                    displayName: h.displayName,
                    submittedAt: h.submittedAt ? new Date(h.submittedAt).toLocaleString('vi-VN') : '',
                    attemptNumber: h.attemptNumber || 1,
                    correctCount: h.correctCount,
                    totalQuestions: h.totalQuestions,
                    score: h.score
                })) : [];

                setHistories(mapped);
        setFilteredHistories(mapped);
      } catch (error) {
        console.error("Fetch history error:", error);
        toast.error("Không thể tải lịch sử làm bài.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [examId, router]);

  // Handle Search
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredHistories(histories);
    } else {
      const lower = searchTerm.toLowerCase();
      const filtered = histories.filter(h =>
        h.displayName.toLowerCase().includes(lower) ||
        h.studentId.toString().includes(lower)
      );
      setFilteredHistories(filtered);
    }
    setCurrentPage(0); // Reset page on search
  }, [searchTerm, histories]);


  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col text-gray-800">

      {/* ========== CONTENT ========== */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">

        {/* ===== HEADER / TABS ===== */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex gap-8 text-sm font-bold border-b border-gray-200 w-full">
            <button
              onClick={() => router.push("/admin/history-exam")}
              className="pb-3 text-gray-500 hover:text-[#A53AEC] transition-colors relative"
            >
              <span className="text-base">Bài thi</span>
            </button>

            <button className="pb-3 text-[#A53AEC] border-b-2 border-[#A53AEC] relative">
              <span className="text-base">Lịch sử thi</span>
            </button>
          </div>
        </div>

        {/* ===== BOX CARD ===== */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">

          {/* ===== TOOLBAR (Search & Actions) ===== */}
          <div className="flex justify-between items-center mb-8">
            {/* Search */}
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
              <button
                className="bg-[#A53AEC] hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-bold text-sm transition-colors h-10 shadow-sm shrink-0"
              >
                Tìm kiếm
              </button>
            </div>

            {/* Summary Badge */}
            <div className="bg-purple-50 text-[#A53AEC] px-4 py-2 rounded-lg text-sm font-semibold">
              Tổng số bài thi: {filteredHistories.length}
            </div>
          </div>

          {/* ===== TABLE ===== */}
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
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-500">
                      <div className="flex justify-center items-center gap-2">
                        <div className="w-5 h-5 border-2 border-[#A53AEC] border-t-transparent rounded-full animate-spin"></div>
                        <span>Đang tải dữ liệu...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredHistories.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center flex flex-col items-center justify-center text-gray-400">
                      <svg className="w-12 h-12 mb-2 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p>Chưa có dữ liệu bài thi nào.</p>
                    </td>
                  </tr>
                ) : (
                  (() => {
                    const ITEMS_PER_PAGE = 10;
                    const startIndex = currentPage * ITEMS_PER_PAGE;
                    const currentData = filteredHistories.slice(startIndex, startIndex + ITEMS_PER_PAGE);

                    return currentData.map((h, index) => (
                      <tr key={h.id} className="hover:bg-purple-50/30 transition-colors duration-150">
                        <td className="py-4 px-6 font-medium text-gray-500">{startIndex + index + 1}</td>
                        <td className="py-4 px-6 font-semibold text-gray-800">
                          <div className="flex items-center justify-center">
                            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-[#A53AEC] font-bold text-xs">
                              {h.displayName.charAt(0).toUpperCase()}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-gray-600">
                          {h.submittedAt}
                        </td>
                        <td className="py-4 px-6">
                          <span className="bg-gray-100 text-gray-600 py-1 px-3 rounded-full text-xs font-bold">
                            Lần {h.attemptNumber}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className="text-green-600 bg-green-50 px-3 py-1 rounded-full text-xs font-bold border border-green-100">
                            {h.correctCount}/{h.totalQuestions} câu đúng
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className="text-[#A53AEC] font-bold text-base">
                            {h.score}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <button
                            onClick={() => router.push(`/admin/history-result/${h.id}`)}
                            className="group flex items-center justify-center gap-1 mx-auto text-[#A53AEC] hover:text-white hover:bg-[#A53AEC] border border-[#A53AEC] px-3 py-1.5 rounded-lg transition-all duration-200 text-xs font-bold uppercase tracking-wide"
                          >
                            <span>Chi tiết</span>
                            <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ));
                  })()
                )}
              </tbody>
            </table>
          </div>

          {/* ===== PAGINATION ===== */}
          {filteredHistories.length > 0 && (() => {
            const ITEMS_PER_PAGE = 10;
            const totalPages = Math.ceil(filteredHistories.length / ITEMS_PER_PAGE);

            return (
              <div className="flex justify-center items-center gap-2 mt-8">
                {/* First Page */}
                <button
                  onClick={() => setCurrentPage(0)}
                  disabled={currentPage === 0}
                  className="px-3 py-1 rounded-full text-gray-400 hover:text-purple-700 hover:bg-purple-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  «
                </button>

                {/* Previous Page */}
                <button
                  onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                  className="px-3 py-1 rounded-full text-gray-400 hover:text-purple-700 hover:bg-purple-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  ‹
                </button>

                {/* Page Numbers */}
                {Array.from({ length: totalPages }, (_, i) => i).slice(Math.max(0, currentPage - 2), Math.min(totalPages, currentPage + 3)).map(i => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i)}
                    className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-semibold transition-colors ${currentPage === i
                      ? 'bg-purple-700 text-white shadow-lg'
                      : 'text-gray-600 hover:bg-purple-50'
                      }`}
                  >
                    {i + 1}
                  </button>
                ))}

                {/* Next Page */}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={currentPage === totalPages - 1}
                  className="px-3 py-1 rounded-full text-gray-400 hover:text-purple-700 hover:bg-purple-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  ›
                </button>

                {/* Last Page */}
                <button
                  onClick={() => setCurrentPage(totalPages - 1)}
                  disabled={currentPage === totalPages - 1}
                  className="px-3 py-1 rounded-full text-gray-400 hover:text-purple-700 hover:bg-purple-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  »
                </button>
              </div>
            );
          })()}
        </div>

      </main>

      {/* ========== FOOTER ========== */}
      <footer className="bg-white border-t border-gray-100 text-center text-sm text-gray-400 py-6 mt-auto">
        © 2025 QuizzZone. Education Platform.
      </footer>

    </div>
  );
}
