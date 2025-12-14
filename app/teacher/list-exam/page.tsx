"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/apiClient";
import { toastError, toastSuccess } from "@/lib/toast";
import Swal from "sweetalert2";
import { usePathname } from "next/navigation";

interface Exam {
  examId: number;
  title: string;
  startTime: string;
  endTime: string;
  questionCount: number;
  examQuestions: {
    question: {
      difficulty: string;
    };
  }[];
  category?: {
    id: number;
    name: string;
  };
  status?: "DRAFT" | "PUBLISHED" | "PRIVATE";
  durationMinutes: number;
  examLevel?: string;
  code?: string; // New field for private exams
  url?: string;  // New field for private exams
}

// ===== SVG ICONS =====
const ClockIcon = () => (
  <svg
    width="16"
    height="16"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    viewBox="0 0 24 24"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>
);

const CalendarIcon = () => (
  <svg
    width="16"
    height="16"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    viewBox="0 0 24 24"
  >
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const MoreIcon = () => (
  <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
    <circle cx="12" cy="6" r="2" />
    <circle cx="12" cy="12" r="2" />
    <circle cx="12" cy="18" r="2" />
  </svg>
);

// Helper to calculate difficulty
const getDifficultyLabel = (level?: string) => {
  switch (level) {
    case "EASY":
      return "Dễ";
    case "MEDIUM":
      return "Trung bình";
    case "HARD":
      return "Khó";
    default:
      return "Chưa xác định";
  }
};

export default function TeacherExamListPage() {
  const pathname = usePathname();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [openMenu, setOpenMenu] = useState<number | null>(null);
  const [openShare, setOpenShare] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [activeTab, setActiveTab] = useState<"link" | "qr">("link");

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [examLevel, setExamLevel] = useState("");
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);

  const router = useRouter();

  // Fetch Categories
  useEffect(() => {
    fetchApi("/categories/all").then(setCategories).catch(console.error);
  }, []);

  useEffect(() => {
    const fetchExams = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (searchQuery) params.append("title", searchQuery);
        if (categoryId) params.append("categoryId", categoryId);
        if (examLevel) params.append("examLevel", examLevel);

        // Fetch using the new search endpoint
        // Note: Backend returns Page<ExamResponseDto>, so we take .content
        const response = await fetchApi(`/exams/search?${params.toString()}`);
        const fetchedExams = (response.content || []).map((exam: any) => ({
          examId: exam.examId,
          title: exam.title,
          startTime: exam.startTime,
          endTime: exam.endTime,
          questionCount: exam.questionCount,
          examQuestions: exam.examQuestions,
          category: exam.category,
          status: exam.status,
          durationMinutes: exam.durationMinutes,
          examLevel: exam.examLevel,
          code: exam.code, // Map code
          url: exam.url,   // Map url
        }));
        setExams(fetchedExams);
      } catch (error) {
        console.error("Failed to fetch exams:", error);
        toastError("Không thể tải danh sách bài thi.");
      } finally {
        setLoading(false);
      }
    };

    // Debounce search slightly to avoid too many requests
    const timeoutId = setTimeout(() => {
      fetchExams();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, categoryId, examLevel]);

  // Helper: exam has ended (based on endTime)
  const isExamEnded = (exam: Exam) => {
    if (!exam.endTime) return false;
    const end = new Date(exam.endTime);
    if (isNaN(end.getTime())) return false;
    return end < new Date();
  };

  // Helper: exam is currently ongoing (based on startTime and endTime)
  const isExamOngoing = (exam: Exam) => {
    if (!exam.startTime || !exam.endTime) return false;
    const start = new Date(exam.startTime);
    const end = new Date(exam.endTime);
    const now = new Date();
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return false;
    return now >= start && now <= end;
  };

  // Sắp xếp từ mới nhất → cũ nhất
  const sortedExams = [...exams]
    .sort(
      (a, b) => Number(new Date(b.startTime || 0)) - Number(new Date(a.startTime || 0))
    );

  // Filter Logic trên danh sách đã lọc: chỉ các bài còn thời gian làm
  const draftExams = sortedExams.filter((x) => x.status === 'DRAFT' && !isExamEnded(x));
  const publishedExams = sortedExams.filter((x) => x.status === 'PUBLISHED' && !isExamEnded(x));
  const privateExams = sortedExams.filter((x) => x.status === 'PRIVATE' && !isExamEnded(x));

  const deleteExam = async (id: number) => {
    const result = await Swal.fire({
      title: "Xác nhận xóa",
      text: "Bạn có chắc chắn muốn xóa bài thi này?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy",
    });

    if (!result.isConfirmed) return;

    try {
      await fetchApi(`/exams/delete/${id}`, { method: "DELETE" });
      setExams(exams.filter((e) => e.examId !== id));
      setOpenMenu(null);
      toastSuccess("Đã xóa bài thi thành công");
    } catch (error: any) {
      toastError(error.message || "Không thể xóa bài thi.");
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  if (loading) return <div className="p-10">Đang tải...</div>;

  return (
    <div className="flex-1 flex flex-col">
      <main className="flex-1 px-10 py-8">
        <button
          onClick={() => router.push("/teacher/teacherhome")}
          className="mb-6 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <svg className="-ml-1 mr-2 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Quay lại
        </button>
    {/* TAB DANH SÁCH BÀI THI / LỊCH SỬ */}
<div className="flex items-center mb-8">
  <div className="flex gap-10 font-bold border-b border-gray-200 w-full">

    {/* Use the pathname declared at the top level */}
    <>
      {/* TAB BÀI THI */}
      <button
        onClick={() => router.push("/teacher/list-exam")}
        className={`pb-3 relative transition-colors ${
          pathname === "/teacher/list-exam"
            ? "text-[#A53AEC]"
            : "text-gray-500 hover:text-[#A53AEC]"
        }`}
      >
        <span className="text-base">Bài thi</span>

        {pathname === "/teacher/list-exam" && (
          <span className="absolute left-0 right-0 -bottom-[1px] h-[2px] bg-[#A53AEC] rounded-full" />
        )}
      </button>

      {/* TAB LỊCH SỬ THI OFFLINE */}
      <button
        onClick={() => router.push("/teacher/history-exam")}
        className={`pb-3 relative transition-colors ${
          pathname === "/teacher/history-exam"
            ? "text-[#A53AEC]"
            : "text-gray-500 hover:text-[#A53AEC]"
        }`}
      >
        <span className="text-base">Lịch sử thi offline</span>

        {pathname === "/teacher/history-exam" && (
          <span className="absolute left-0 right-0 -bottom-[1px] h-[2px] bg-[#A53AEC] rounded-full" />
        )}
      </button>

      {/* TAB LỊCH SỬ THI ONLINE */}
      <button
        onClick={() => router.push("/teacher/history-exam-online")}
        className={`pb-3 relative transition-colors ${
          pathname === "/teacher/history-exam-online"
            ? "text-[#A53AEC]"
            : "text-gray-500 hover:text-[#A53AEC]"
        }`}
      >
        <span className="text-base">Lịch sử thi online</span>

        {pathname === "/teacher/history-exam-online" && (
          <span className="absolute left-0 right-0 -bottom-[1px] h-[2px] bg-[#A53AEC] rounded-full" />
        )}
      </button>
    </>
  </div>
</div>



        {/* ========== SEARCH & FILTER TOOLBAR ========== */}
        <div className="flex flex-wrap gap-4 mb-8 bg-white p-4 rounded-lg shadow-sm">
          <select
            className="border rounded-lg p-2 min-w-[150px]"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">Tất cả danh mục</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select
            className="border rounded-lg p-2 min-w-[150px]"
            value={examLevel}
            onChange={(e) => setExamLevel(e.target.value)}
          >
            <option value="">Tất cả độ khó</option>
            <option value="EASY">Dễ</option>
            <option value="MEDIUM">Trung bình</option>
            <option value="HARD">Khó</option>
          </select>

          <input
            type="text"
            placeholder="Nhập tên bài thi..."
            className="border rounded-lg p-2 flex-1 min-w-[200px]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* ========== ĐANG TẠO (Draft) ========== */}
        <h2 className="text-xl font-semibold mb-4">Bài thi nháp</h2>
        {draftExams.length === 0 ? (
          <p className="text-gray-500 mb-8">Không có bài thi nháp.</p>
        ) : (
          <div className="flex flex-wrap gap-6 mb-8">
            {draftExams.map((exam) => (
              <div
                key={exam.examId}
                className="w-64 bg-white rounded-lg shadow p-4 relative border border-gray-100 border-l-4 border-l-yellow-400"
              >
                {isExamOngoing(exam) && (
                  <span className="absolute top-0 right-0 bg-blue-500 text-white text-xs px-2 py-1 rounded-bl-lg">Đang diễn ra</span>
                )}
                <p className="font-semibold text-lg mb-2 truncate" title={exam.title}>{exam.title}</p>
                <div className="text-sm space-y-1 text-gray-600">
                  <p>⏳ Thời gian: {exam.durationMinutes} phút</p>
                  <p className="text-yellow-600 font-medium">⚠ Bản nháp</p>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <button
                    onClick={() => router.push(`/teacher/update-exam/${exam.examId}`)}
                    className="text-sm bg-yellow-100 text-yellow-700 px-3 py-1 rounded hover:bg-yellow-200"
                  >
                    Tiếp tục chỉnh sửa
                  </button>
                  <button
                    onClick={() => deleteExam(exam.examId)}
                    className="text-gray-400 hover:text-red-500"
                    title="Xóa nháp"
                  >
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ========== BÀI THI CÔNG KHAI ========== */}
        <h2 className="text-xl font-semibold mb-4">Bài thi công khai</h2>
        {publishedExams.length === 0 ? (
          <p className="text-gray-500 mb-8">Chưa có bài thi công khai.</p>
        ) : (
          <div className="flex flex-wrap gap-6 mb-8">
            {publishedExams.map((exam) => (
              <div
                key={exam.examId}
                className="w-64 bg-white rounded-lg shadow p-4 relative border border-gray-100 border-l-4 border-l-green-500"
              >
                {isExamOngoing(exam) && (
                  <span className="absolute top-0 right-0 bg-blue-500 text-white text-xs px-2 py-1 rounded-bl-lg">Đang diễn ra</span>
                )}
                <p className="font-semibold text-lg mb-2 truncate" title={exam.title}>{exam.title}</p>
                <div className="text-sm space-y-1">
                  <p>⏳ {exam.durationMinutes} Phút</p>
                  <p>📘 Câu hỏi: {exam.questionCount}</p>
                  <p>📊 Độ khó: <span className="font-medium">{getDifficultyLabel(exam.examLevel)}</span></p>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="flex-1 text-center text-green-600 font-medium">Công khai</span>
                  <button onClick={() => setOpenMenu(openMenu === exam.examId ? null : exam.examId)} className="ml-2 p-1 rounded hover:bg-gray-100"><MoreIcon /></button>
                </div>
                {openMenu === exam.examId && (
                  <div className="absolute right-0 top-8 bg-white shadow-lg border rounded-md w-32 py-2 z-20">
                    <button onClick={() => router.push(`/teacher/detail-exam/${exam.examId}`)} className="block w-full text-left px-4 py-2 hover:bg-gray-100">Chi tiết</button>
                    <button onClick={() => router.push(`/teacher/update-exam/${exam.examId}`)} className="block w-full text-left px-4 py-2 hover:bg-gray-100">Cập nhật</button>
                    <button onClick={() => deleteExam(exam.examId)} className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600">Xóa</button>
                    <button
                      onClick={() => {
                        setShareLink(`${window.location.origin}/student/startexam?examId=${exam.examId}`);
                        setOpenShare(true);
                        setOpenMenu(null);
                      }}
                      className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                    >
                      Chia sẻ
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ========== BÀI THI RIÊNG TƯ ========== */}
        <h2 className="text-xl font-semibold mb-4">Bài thi riêng tư</h2>
        {privateExams.length === 0 ? (
          <p className="text-gray-500 mb-8">Chưa có bài thi riêng tư.</p>
        ) : (
          <div className="flex flex-wrap gap-6 mb-8">
            {privateExams.map((exam) => (
              <div
                key={exam.examId}
                className="w-64 bg-white rounded-lg shadow p-4 relative border border-gray-100 border-l-4 border-l-purple-500"
              >
                {isExamOngoing(exam) && (
                  <span className="absolute top-0 right-0 bg-blue-500 text-white text-xs px-2 py-1 rounded-bl-lg">Đang diễn ra</span>
                )}
                <p className="font-semibold text-lg mb-2 truncate" title={exam.title}>{exam.title}</p>
                <div className="text-sm space-y-1">
                  <p>⏳ {exam.durationMinutes} Phút</p>
                  <p>📘 Câu hỏi: {exam.questionCount}</p>
                  <p>📊 Độ khó: <span className="font-medium">{getDifficultyLabel(exam.examLevel)}</span></p>
                  {exam.code && <p>🔑 Mã: <span className="font-mono text-purple-700">{exam.code}</span></p>}
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="flex-1 text-center text-purple-600 font-medium">Riêng tư</span>
                  <button onClick={() => setOpenMenu(openMenu === exam.examId ? null : exam.examId)} className="ml-2 p-1 rounded hover:bg-gray-100"><MoreIcon /></button>
                </div>
                {openMenu === exam.examId && (
                  <div className="absolute right-0 top-8 bg-white shadow-lg border rounded-md w-32 py-2 z-20">
                    <button onClick={() => router.push(`/teacher/detail-exam/${exam.examId}`)} className="block w-full text-left px-4 py-2 hover:bg-gray-100">Chi tiết</button>
                    <button onClick={() => router.push(`/teacher/update-exam/${exam.examId}`)} className="block w-full text-left px-4 py-2 hover:bg-gray-100">Cập nhật</button>
                    <button onClick={() => deleteExam(exam.examId)} className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600">Xóa</button>
                    <button
                      onClick={() => {
                        setShareLink(`${window.location.origin}/student/startexam?examId=${exam.examId}`);
                        setOpenShare(true);
                        setOpenMenu(null);
                      }}
                      className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                    >
                      Chia sẻ
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
