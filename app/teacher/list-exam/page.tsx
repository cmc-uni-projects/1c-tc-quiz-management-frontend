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
  status?: "DRAFT" | "PUBLISHED";
  durationMinutes: number;
  examLevel?: string;
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
  const [openMenu, setOpenMenu] = useState<number | string | null>(null);
  const [openShare, setOpenShare] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [activeTab, setActiveTab] = useState<"link" | "qr">("link");

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [examLevel, setExamLevel] = useState("");
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);

  const router = useRouter();

  // Online Exams State
  const [onlineExams, setOnlineExams] = useState<any[]>([]);
  // Show more / collapse per-category groups (Xem thêm / Thu gọn)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const isExpanded = (key: string) => !!expandedGroups[key];
  const toggleGroup = (key: string) => setExpandedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  const LIMIT = 6;

  // Fetch Categories
  useEffect(() => {
    fetchApi("/categories/all").then(setCategories).catch(console.error);
  }, []);

  // Load exams (reusable for debounce + manual search button)
  const loadExams = React.useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.append("title", searchQuery);
      if (categoryId) params.append("categoryId", categoryId);
      if (examLevel) params.append("examLevel", examLevel);

      const response = await fetchApi(`/exams/search?${params.toString()}`);
      setExams(response.content || []);
    } catch (error) {
      console.error("Failed to fetch exams:", error);
      toastError("Không thể tải danh sách bài thi.");
    } finally {
      setLoading(false);
    }
  }, [searchQuery, categoryId, examLevel]);

  // Debounced auto-search when filters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadExams();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [loadExams]);

  const handleSearchClick = () => {
    loadExams();
  };

  // Fetch Online Exams
  useEffect(() => {
    const fetchOnlineExams = async () => {
      try {
        const response = await fetchApi("/online-exams/my");
        setOnlineExams(response || []);
      } catch (error) {
        console.error("Failed to fetch online exams:", error);
      }
    };

    fetchOnlineExams();
  }, []);

  // Helper: exam has ended (based on endTime)
  const isExamEnded = (exam: Exam) => {
    if (!exam.endTime) return false;
    const end = new Date(exam.endTime);
    if (isNaN(end.getTime())) return false;
    return end < new Date();
  };

  // Sắp xếp từ mới nhất → cũ nhất, chỉ lấy các bài chưa kết thúc
  const sortedExams = [...exams]
    .filter((e) => !isExamEnded(e))
    .sort(
      (a, b) => Number(new Date(b.startTime || 0)) - Number(new Date(a.startTime || 0))
    );

  // Filter Logic trên danh sách đã lọc: chỉ các bài còn thời gian làm
  const draftExams = sortedExams.filter((x) => x.status === 'DRAFT');
  const readyExams = sortedExams.filter((x) => x.status === 'PUBLISHED');

  // Group exams by category name
  const groupByCategory = React.useCallback((list: Exam[]) => {
    const map = new Map<string, Exam[]>();
    list.forEach((e) => {
      const key = e.category?.name || 'Không có danh mục';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    });
    return Array.from(map.entries());
  }, []);

  // Group any items that may contain category info (e.g., online exams)
  const groupAnyByCategory = React.useCallback((list: any[]) => {
    const map = new Map<string, any[]>();
    list.forEach((e) => {
      const key = e?.category?.name || 'Không có danh mục';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    });
    return Array.from(map.entries());
  }, []);

  // Finished exams: offline exams that have ended
  const finishedOfflineExams = [...exams]
    .filter((e) => isExamEnded(e))
    .sort((a, b) => Number(new Date(b.endTime || 0)) - Number(new Date(a.endTime || 0)));

  // Finished online exams
  const finishedOnlineExams = onlineExams.filter((e) => e.status === 'FINISHED');

  // Active online exams (not finished)
  const activeOnlineExams = onlineExams.filter((e) => e.status !== 'FINISHED');

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
        {/* TAB DANH SÁCH BÀI THI / LỊCH SỬ */}
        <div className="flex items-center mb-8">
          <div className="flex gap-10 font-bold border-b border-gray-200 w-full">

            {/* Use the pathname declared at the top level */}
            <>
              {/* TAB BÀI THI */}
              <button
                onClick={() => router.push("/teacher/list-exam")}
                className={`pb-3 relative transition-colors ${pathname === "/teacher/list-exam"
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
                className={`pb-3 relative transition-colors ${pathname === "/teacher/history-exam"
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
                className={`pb-3 relative transition-colors ${pathname === "/teacher/history-exam-online"
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
        <div className="flex flex-wrap gap-4 mb-8 bg-white p-4 rounded-lg shadow-sm items-center">
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

          <button
            onClick={handleSearchClick}
            className="px-6 py-2 rounded-full text-white text-sm font-semibold shadow-md hover:brightness-110"
            style={{ backgroundColor: "#A53AEC" }}
          >
            Tìm kiếm
          </button>
        </div>

        {/* ========== ĐANG TẠO (Draft - No Questions) ========== */}
        <h2 className="text-xl font-semibold mb-4">Đang tạo</h2>

        {draftExams.length === 0 ? (
          <p className="text-gray-500 mb-8">Không có bài thi nháp.</p>
        ) : (
          <div className="space-y-6 mb-8">
            {Array.from(groupByCategory(draftExams)).map(([catName, items]) => (
              <div key={catName}>
                {catName !== 'Không có danh mục' && (
                  <h3 className="text-lg font-semibold mb-3">{catName}</h3>
                )}
                <div className="flex flex-wrap gap-6">
                  {(isExpanded(`draft:${catName}`) ? items : items.slice(0, LIMIT)).map((exam) => (
                    <div key={exam.examId} className="w-64 bg-white rounded-lg shadow p-4 relative border border-gray-100 border-l-4 border-l-yellow-400">
                      <p className="font-semibold text-lg mb-2 truncate" title={exam.title}>{exam.title}</p>
                      <div className="text-sm space-y-1 text-gray-600">
                        <p className="flex items-center gap-2">
                          <ClockIcon /> Bắt đầu: {exam.startTime ? new Date(exam.startTime).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }) : 'N/A'}
                        </p>
                        <p className="flex items-center gap-2">
                          <ClockIcon /> Kết thúc: {exam.endTime ? new Date(exam.endTime).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }) : 'N/A'}
                        </p>
                        <p>⏳ Thời gian: {exam.durationMinutes} phút</p>
                        <p className="text-yellow-600 font-medium">⚠ Bản nháp</p>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <button onClick={() => router.push(`/teacher/update-exam/${exam.examId}`)} className="text-sm bg-yellow-100 text-yellow-700 px-3 py-1 rounded hover:bg-yellow-200">Tiếp tục chỉnh sửa</button>
                        <button onClick={() => deleteExam(exam.examId)} className="text-gray-400 hover:text-red-500" title="Xóa nháp">
                          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" /></svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {items.length > LIMIT && (
                  <div className="mt-3">
                    <button
                      onClick={() => toggleGroup(`draft:${catName}`)}
                      className="px-4 py-2 rounded-full text-sm font-medium border-2 hover:bg-gray-50"
                      style={{ borderColor: '#A53AEC', color: '#A53AEC' }}
                    >
                      {isExpanded(`draft:${catName}`) ? 'Thu gọn' : `Xem thêm (${items.length - LIMIT})`}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ========== DANH SÁCH BÀI THI (Ready - Has Questions) ========== */}
        <h2 className="text-xl font-semibold mb-4">
          Danh sách bài thi
        </h2>

        {readyExams.length === 0 ? (
          <p className="text-gray-500">Chưa có bài thi nào.</p>
        ) : (
          <div className="space-y-6">
            {Array.from(groupByCategory(readyExams)).map(([catName, items]) => (
              <div key={catName}>
                {catName !== 'Không có danh mục' && (
                  <h3 className="text-lg font-semibold mb-3">{catName}</h3>
                )}
                <div className="flex flex-wrap gap-6">
                  {(isExpanded(`ready:${catName}`) ? items : items.slice(0, LIMIT)).map((exam) => (
                    <div key={exam.examId} className="w-64 bg-white rounded-lg shadow p-4 relative border border-gray-100">
                      <p className="font-semibold text-lg mb-2 truncate" title={exam.title}>{exam.title}</p>
                      <div className="text-sm space-y-1">
                        <p className="flex items-center gap-2">
                          <ClockIcon /> Bắt đầu: {exam.startTime ? new Date(exam.startTime).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }) : 'N/A'}
                        </p>
                        <p className="flex items-center gap-2">
                          <ClockIcon /> Kết thúc: {exam.endTime ? new Date(exam.endTime).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }) : 'N/A'}
                        </p>
                        <p>⏳ Thời gian: {exam.durationMinutes} phút</p>
                        <p>📘 Câu hỏi: {exam.questionCount}</p>
                        <p>🏷 Danh mục: {exam.category?.name || "N/A"}</p>
                        <p>📊 Độ khó: <span className="font-medium">{getDifficultyLabel(exam.examLevel)}</span></p>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <span className="flex-1 text-center text-green-600 font-medium">Sẵn sàng</span>
                        <button onClick={() => setOpenMenu(openMenu === exam.examId ? null : exam.examId)} className="ml-2 p-1 rounded hover:bg-gray-100">
                          <MoreIcon />
                        </button>
                      </div>
                      {openMenu === exam.examId && (
                        <div className="absolute right-0 top-8 bg-white shadow-lg border rounded-md w-32 py-2 z-20">
                          <button onClick={() => router.push(`/teacher/detail-exam/${exam.examId}`)} className="block w-full text-left px-4 py-2 hover:bg-gray-100">Chi tiết</button>
                          <button onClick={() => deleteExam(exam.examId)} className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600">Xóa bài thi</button>
                          <button onClick={() => router.push(`/teacher/update-exam/${exam.examId}`)} className="block w-full text-left px-4 py-2 hover:bg-gray-100">Cập nhật</button>
                          <button onClick={() => { setShareLink(`${window.location.origin}/teacher/exam/${exam.examId}`); setOpenShare(true); setOpenMenu(null); }} className="block w-full text-left px-4 py-2 hover:bg-gray-100">Chia sẻ</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {items.length > LIMIT && (
                  <div className="mt-3">
                    <button
                      onClick={() => toggleGroup(`ready:${catName}`)}
                      className="px-4 py-2 rounded-full text-sm font-medium border-2 hover:bg-gray-50"
                      style={{ borderColor: '#A53AEC', color: '#A53AEC' }}
                    >
                      {isExpanded(`ready:${catName}`) ? 'Thu gọn' : `Xem thêm (${items.length - LIMIT})`}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ONLINE EXAMS SECTION */}
        <div className="mt-12">
          <h2 className="text-xl font-semibold mb-6">Bài thi Online ({activeOnlineExams.length})</h2>

          {activeOnlineExams.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              Chưa có bài thi online nào
            </div>
          ) : (
            <div className="space-y-6">
              {groupAnyByCategory(activeOnlineExams).map(([catName, items]) => (
                <div key={`active-online-${catName}`}>
                  {catName !== 'Không có danh mục' && (
                    <h3 className="text-lg font-semibold mb-3">{catName}</h3>
                  )}
                  <div className="flex flex-wrap gap-6">
                    {(isExpanded(`onlineActive:${catName}`) ? items : items.slice(0, LIMIT)).map((exam: any) => (
                      <div
                        key={exam.id}
                        className={`w-64 bg-white rounded-lg shadow p-4 hover:shadow-lg transition-shadow cursor-pointer border-2 ${exam.status === 'DRAFT' ? 'border-yellow-400' :
                          exam.status === 'WAITING' ? 'border-blue-400' :
                            exam.status === 'IN_PROGRESS' ? 'border-green-400' :
                              'border-gray-200'
                          }`}
                      >
                  {/* Header với 3-dot menu */}
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-semibold line-clamp-2 pr-2">{exam.name}</h3>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${exam.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-700' :
                        exam.status === 'WAITING' ? 'bg-blue-100 text-blue-700' :
                          exam.status === 'IN_PROGRESS' ? 'bg-green-100 text-green-700' :
                            'bg-gray-100 text-gray-700'
                        }`}>
                        {exam.status === 'DRAFT' ? 'Nháp' :
                          exam.status === 'WAITING' ? 'Chờ' :
                            exam.status === 'IN_PROGRESS' ? 'Đang diễn ra' :
                              'Kết thúc'}
                      </span>

                      {/* 3-dot menu cho DRAFT */}
                      {exam.status === 'DRAFT' && (
                        <>
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenu(openMenu === `online-${exam.id}` ? null : `online-${exam.id}`);
                              }}
                              className="p-1 hover:bg-gray-100 rounded text-lg leading-none"
                            >
                              ⋮
                            </button>
                            {openMenu === `online-${exam.id}` && (
                              <>
                                <div
                                  className="fixed inset-0 z-10"
                                  onClick={() => setOpenMenu(null)}
                                />
                                <div className="absolute right-0 top-8 bg-white shadow-lg rounded-lg py-2 w-40 z-20 border">
                                  <button
                                    onClick={() => {
                                      router.push(`/teacher/exam-online/update/${exam.id}`);
                                      setOpenMenu(null);
                                    }}
                                    className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                                  >
                                    Cập nhật
                                  </button>
                                  <button
                                    onClick={async () => {
                                      setOpenMenu(null);
                                      if (confirm(`Bạn có chắc muốn xóa bài thi "${exam.name}"?`)) {
                                        try {
                                          await fetchApi(`/online-exams/${exam.id}`, { method: 'DELETE' });
                                          toastSuccess('Đã xóa bài thi');
                                          const response = await fetchApi("/online-exams/my");
                                          setOnlineExams(response || []);
                                        } catch (error: any) {
                                          toastError(error.message || 'Không thể xóa bài thi');
                                        }
                                      }
                                    }}
                                    className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600"
                                  >
                                    Xóa bài thi
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                          <button
                            onClick={async () => {
                              if (confirm(`Bạn có chắc muốn mở phòng chờ cho bài thi "${exam.name}"?`)) {
                                try {
                                  await fetchApi(`/online-exams/${exam.id}/start`, { method: "POST" });
                                  toastSuccess("Đã mở phòng chờ!");
                                  router.push(`/teacher/waiting-room/${exam.accessCode}`);
                                } catch (error: any) {
                                  toastError(error.message || "Không thể mở phòng chờ");
                                }
                              }
                            }}
                            className="px-3 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                            title="Mở phòng chờ"
                          >
                            ▶
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Độ khó:</span>
                      <span className="font-medium">{exam.level}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Số câu hỏi:</span>
                      <span className="font-medium">{exam.actualQuestionCount || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Thời gian:</span>
                      <span className="font-medium">{exam.durationMinutes} phút</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Mã truy cập:</span>
                      <span className="font-mono text-purple-600 font-bold">{exam.accessCode}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {exam.status === 'DRAFT' && (
                      <button
                        onClick={() => router.push(`/teacher/exam-online/edit/${exam.id}`)}
                        className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 text-sm"
                      >
                        Thêm câu hỏi
                      </button>
                    )}
                    {exam.status === 'WAITING' && (
                      <button
                        onClick={() => router.push(`/teacher/waiting-room/${exam.accessCode}`)}
                        className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 text-sm"
                      >
                        Xem phòng chờ
                      </button>
                    )}
                    {exam.status === 'IN_PROGRESS' && (
                      <button
                        onClick={() => router.push(`/teacher/exam-online/${exam.id}/monitor`)}
                        className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 text-sm"
                      >
                        Giám sát
                      </button>
                    )}
                    {exam.status === 'FINISHED' && (
                      <button
                        onClick={() => router.push(`/teacher/exam-online/${exam.id}/results`)}
                        className="flex-1 bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 text-sm"
                      >
                        Xem kết quả
                      </button>
                    )}
                  </div>
                      </div>
                    ))}
                  </div>
                  {items.length > LIMIT && (
                    <div className="mt-3">
                      <button
                        onClick={() => toggleGroup(`onlineActive:${catName}`)}
                        className="px-4 py-2 rounded-full text-sm font-medium border-2 hover:bg-gray-50"
                        style={{ borderColor: '#A53AEC', color: '#A53AEC' }}
                      >
                        {isExpanded(`onlineActive:${catName}`) ? 'Thu gọn' : `Xem thêm (${items.length - LIMIT})`}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* FINISHED EXAMS SECTION */}
        <div className="mt-12">
          <h2 className="text-xl font-semibold mb-6">Bài thi đã kết thúc</h2>

          {/* Finished Offline Exams */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Bài thi ({finishedOfflineExams.length})</h3>
            {finishedOfflineExams.length === 0 ? (
              <p className="text-gray-500">Chưa có bài thi nào kết thúc</p>
            ) : (
              <div className="space-y-6">
                {Array.from(groupByCategory(finishedOfflineExams as any)).map(([catName, items]) => (
                  <div key={`finished-offline-${catName}`}>
                    {catName !== 'Không có danh mục' && (
                      <h4 className="font-semibold mb-2">{catName}</h4>
                    )}
                    <div className="flex flex-wrap gap-6">
                      {items.map((exam: any) => (
                        <div
                          key={`offline-${exam.examId}`}
                          className="w-64 bg-white rounded-lg shadow p-4 relative border border-gray-300 opacity-75"
                        >
                          <p className="font-semibold text-lg mb-2 truncate" title={exam.title}>{exam.title}</p>

                          <div className="text-sm space-y-1">
                            <p className="flex items-center gap-2">
                              <ClockIcon /> Bắt đầu: {exam.startTime ? new Date(exam.startTime).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }) : 'N/A'}
                            </p>
                            <p className="flex items-center gap-2">
                              <ClockIcon /> Kết thúc: {exam.endTime ? new Date(exam.endTime).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }) : 'N/A'}
                            </p>
                            <p>⏳ Thời gian: {exam.durationMinutes} phút</p>
                            <p>📘 Câu hỏi: {exam.questionCount}</p>
                            <p>🏷 Danh mục: {exam.category?.name || "N/A"}</p>
                            <p>📊 Độ khó: <span className="font-medium">{getDifficultyLabel(exam.examLevel)}</span></p>
                            <p className="text-red-600 font-medium">❌ Đã hết hạn</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Finished Online Exams */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Bài thi Online ({finishedOnlineExams.length})</h3>
            {finishedOnlineExams.length === 0 ? (
              <p className="text-gray-500">Chưa có bài thi online nào kết thúc</p>
            ) : (
              <div className="space-y-6">
                {Array.from(groupAnyByCategory(finishedOnlineExams)).map(([catName, items]) => (
                  <div key={`finished-online-${catName}`}>
                    {catName !== 'Không có danh mục' && (
                      <h4 className="font-semibold mb-2">{catName}</h4>
                    )}
                    <div className="flex flex-wrap gap-6">
                      {items.map((exam: any) => (
                        <div
                          key={`online-${exam.id}`}
                          className="w-64 bg-white rounded-lg shadow p-4 relative border border-gray-300 opacity-75"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <h3 className="text-lg font-semibold line-clamp-2 pr-2">{exam.name}</h3>
                            <span className="px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap bg-gray-100 text-gray-700">
                              Kết thúc
                            </span>
                          </div>

                          <div className="space-y-2 text-sm mb-4">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Độ khó:</span>
                              <span className="font-medium">{exam.level}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Số câu hỏi:</span>
                              <span className="font-medium">{exam.actualQuestionCount || 0}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Thời gian:</span>
                              <span className="font-medium">{exam.durationMinutes} phút</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Mã truy cập:</span>
                              <span className="font-mono text-purple-600 font-bold">{exam.accessCode}</span>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => router.push(`/teacher/exam-online/${exam.id}/results`)}
                              className="flex-1 bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 text-sm"
                            >
                              Xem kết quả
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {openShare && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white w-[520px] rounded-xl p-6 relative">

              {/* Nút đóng */}
              <button
                onClick={() => setOpenShare(false)}
                className="absolute top-3 right-4 text-gray-500 hover:text-black text-lg"
              >
                x
              </button>

              {/* Tiêu đề */}
              <h2 className="text-xl font-semibold text-center mb-4">
                Chia sẻ
              </h2>

              {/* Tabs */}
              <div className="flex border-b mb-4">
                <button
                  onClick={() => setActiveTab("link")}
                  className={`flex-1 py-2 ${activeTab === "link"
                    ? "border-b-2 border-black font-semibold"
                    : "text-gray-400"
                    }`}
                >
                  Link
                </button>

                <button
                  onClick={() => setActiveTab("qr")}
                  className={`flex-1 py-2 ${activeTab === "qr"
                    ? "border-b-2 border-black font-semibold"
                    : "text-gray-400"
                    }`}
                >
                  Mã QR
                </button>
              </div>

              {/* TAB LINK */}
              {activeTab === "link" && (
                <div className="space-y-3 mt-3">
                  <p className="text-sm">Sao chép link</p>

                  <div className="flex gap-2">
                    <input
                      value={shareLink}
                      readOnly
                      className="flex-1 border px-3 py-2 rounded-md text-sm"
                    />

                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(shareLink);
                        toastSuccess("Đã sao chép liên kết!");
                      }}
                      className="bg-[#A53AEC] text-white px-4 py-2 rounded-md"
                    >
                      Sao chép
                    </button>
                  </div>
                </div>
              )}

              {/* TAB QR */}
              {activeTab === "qr" && (
                <div className="flex flex-col items-center gap-4 mt-4">

                  {/* Chưa dùng dữ liệu cứng - chỉ khung */}
                  <div className="w-44 h-44 border-2 border-dashed text-gray-400 flex items-center justify-center">
                    QR CODE
                  </div>

                  <button className="bg-[#A53AEC] text-white px-4 py-2 rounded-md">
                    Tải xuống
                  </button>

                </div>
              )}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
