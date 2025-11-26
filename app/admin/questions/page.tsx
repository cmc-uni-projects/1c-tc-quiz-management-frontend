'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { fetchApi } from '@/lib/apiClient';
import { toastError, toastSuccess } from '@/lib/toast';
import { useUser } from '@/lib/user';
import QuestionFilters from './components/QuestionFilters';
import QuestionTable from './components/QuestionTable';
import QuestionForm from './components/QuestionForm';

// Color constants matching other admin pages
const PRIMARY_COLOR = "#6A1B9A";
const LOGO_TEXT_COLOR = "#E33AEC";
const MAIN_CONTENT_BG = "#6D0446";
const SEARCH_BAR_BG = "#E33AEC";
const BUTTON_COLOR = "#9453C9";
const PAGE_BG = "#F4F2FF";
const HERO_GRADIENT = "linear-gradient(135deg, #FFB6FF 0%, #8A46FF 100%)";
const TABLE_SHADOW = "0 25px 60px rgba(126, 62, 255, 0.18)";

// --- TYPE DEFINITIONS ---
interface Category {
  id: number;
  name: string;
}

interface Question {
  id: number;
  title: string;
  type: string;
  difficulty: string;
  category: Category;
  createdBy: string;
  answers: { id: number; text: string; correct: boolean }[];
}


interface Filters {
  search: string;
  difficulty: string;
  type: string;
  category: string;
}

interface ApiResponse {
  content: Question[];
  totalElements: number;
  totalPages: number;
  number: number;
}

// --- CONSTANTS ---
const ITEMS_PER_PAGE = 10; // Match backend's hardcoded page size

export default function AdminQuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  // State bộ lọc
  const [filters, setFilters] = useState<Filters>({
    search: '',
    difficulty: '',
    type: '',
    category: '',
  });

  const router = useRouter();
  const { user } = useUser(); // Lấy user thực tế

  // --- DATA FETCHING FUNCTION ---
  // Sử dụng useCallback để tránh tạo lại hàm không cần thiết khi render
  const fetchQuestions = useCallback(async () => {
    setLoading(true);

    // Backend returns pages starting from 0, so we adjust
    const pageIndex = currentPage - 1;

    // 1. Xây dựng Query String -
    // NOTE: Backend's /all endpoint currently does not support filtering.
    // These filters are kept for UI purposes but not sent in the API call.
    const queryString = new URLSearchParams({
      page: pageIndex.toString(),
    }).toString();

    try {
      // 2. Gọi API thực tế - Sử dụng admin endpoint
      const data: ApiResponse = await fetchApi(`/admin/questions?page=${pageIndex}`);

      // 3. Cập nhật State từ dữ liệu trả về của Backend (Spring Page object)
      setQuestions(data.content || []);
      setTotalCount(data.totalElements || 0);
      setTotalPages(data.totalPages || 0);

    } catch (error) {
      console.error("Failed to fetch questions:", error);
      toastError("Không thể tải danh sách câu hỏi. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, [currentPage]); // Dependency array: Chỉ chạy lại khi trang thay đổi

  // Gọi API khi component mount và khi fetchQuestions thay đổi (chủ yếu là khi currentPage đổi)
  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  // --- HANDLERS ---
  const handleFilterChange = (newFilters: Filters) => {
    setFilters(newFilters);
    setCurrentPage(1);
    // Note: Calling fetchQuestions() here won't apply filters until backend supports them.
    // We still reset the page.
    fetchQuestions();
  };


  const handleAddQuestion = () => {
    router.push('/admin/questions/create');
  };

  const handleEdit = (id: number) => {
    router.push(`/admin/questions/${id}`);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa câu hỏi này? Hành động này không thể hoàn tác.')) {
      return;
    }
    if (!user || !user.username) {
      toastError("Không thể xác định người dùng. Vui lòng đăng nhập lại.");
      return;
    }


    try {
      // 1. Gọi API Xóa - Sử dụng admin endpoint
      await fetchApi(`/admin/questions/${id}`, {
        method: 'DELETE',
      });

      // 2. Thông báo thành công
      toastSuccess("Đã xóa câu hỏi thành công!");

      // 3. Refresh lại danh sách
      if (questions.length === 1 && currentPage > 1) {
        setCurrentPage(prev => prev - 1);
      } else {
        fetchQuestions(); // Reload trang hiện tại
      }

    } catch (error: any) {
      console.error("Delete error:", error);
      toastError(`Lỗi: ${error.message}`);
    }
  };

  return (
    <div className="w-full min-h-screen py-6 sm:py-10 px-4 sm:px-8" style={{ backgroundColor: PAGE_BG }}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Hero + tìm kiếm */}
        <div
          className="rounded-2xl shadow-2xl p-6 sm:p-8 text-white relative overflow-hidden"
          style={{ background: HERO_GRADIENT }}
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold drop-shadow">Quản lý Câu hỏi</h1>
              <p className="text-white/80 mt-1 text-sm">Quản lý tất cả câu hỏi trong hệ thống</p>
            </div>

            <div className="flex items-center gap-2 text-sm font-semibold">
              <span className="px-4 py-1 rounded-full bg-white/25 backdrop-blur">Tổng {totalCount} câu hỏi</span>
            </div>
          </div>

          <div className="mt-6 bg-white/95 rounded-2xl p-4 shadow-inner">
            <div className="space-y-4">
              {/* Tìm kiếm theo từ khóa */}
              <div className="flex items-end gap-2">
                <div className="flex-grow">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Tìm kiếm câu hỏi</label>
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    placeholder="Nhập tiêu đề/đáp án... (Lọc chưa hoạt động)"
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-800 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                    onKeyDown={(e) => e.key === 'Enter' && handleFilterChange(filters)}
                  />
                </div>
                <button
                  onClick={() => handleFilterChange(filters)}
                  className="px-6 py-2.5 rounded-xl text-white text-sm font-semibold shadow-lg hover:brightness-110 transition whitespace-nowrap"
                  style={{ backgroundColor: SEARCH_BAR_BG }}
                  disabled={loading}
                >
                  Tìm kiếm
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Độ khó */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Độ khó</label>
                  <select
                    value={filters.difficulty}
                    onChange={(e) => setFilters(prev => ({ ...prev, difficulty: e.target.value }))}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-800 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-400 cursor-pointer"
                  >
                    <option value="">Chọn độ khó</option>
                    <option value="EASY">Dễ</option>
                    <option value="MEDIUM">Trung bình</option>
                    <option value="HARD">Khó</option>
                  </select>
                </div>

                {/* Loại câu hỏi */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Loại câu hỏi</label>
                  <select
                    value={filters.type}
                    onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-800 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-400 cursor-pointer"
                  >
                    <option value="">Chọn loại câu hỏi</option>
                    <option value="MULTIPLE_CHOICE">Lựa chọn nhiều đáp án</option>
                    <option value="TRUE_FALSE">Đúng/Sai</option>
                    <option value="FILL_IN_BLANK">Điền vào chỗ trống</option>
                  </select>
                </div>

                {/* Danh mục */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Danh mục</label>
                  <select
                    value={filters.category}
                    onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-800 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-400 cursor-pointer"
                  >
                    <option value="">Chọn danh mục</option>
                    <option value="1">Toán</option>
                    <option value="2">Văn</option>
                    <option value="3">Anh</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={handleAddQuestion}
                  className="px-6 py-2 rounded-xl text-white text-sm font-semibold shadow-lg hover:brightness-110 transition whitespace-nowrap flex items-center gap-2"
                  style={{ backgroundColor: BUTTON_COLOR }}
                  disabled={loading}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Thêm câu hỏi
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Bảng danh sách */}
        <div
          className="bg-white rounded-2xl border border-white/60 shadow-[0_25px_60px_rgba(131,56,236,0.12)] overflow-hidden"
          style={{ boxShadow: TABLE_SHADOW }}
        >
          {/* Tiêu đề bảng */}
          <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-white to-purple-50/60">
            <p className="text-sm text-gray-600 font-medium flex flex-wrap items-center gap-2">
              <span className="text-xs px-3 py-1 rounded-full bg-white shadow-inner">
                Trang {currentPage} / {totalPages}
              </span>
            </p>
          </div>

          {/* Bảng */}
          <div className="overflow-x-auto">
            {!loading && user && (
              <QuestionTable
                questions={questions}
                loading={loading}
                onEdit={handleEdit}
                onDelete={handleDelete}
                currentUserName={user?.username}
                currentUserRole={user?.role}
              />
            )}
          </div>

          {/* Phân trang */}
          {!loading && totalPages > 0 && (
            <div className="p-5 border-t border-gray-100 flex justify-center items-center gap-2 text-sm text-gray-500 bg-white">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition"
              >
                &lt;&lt;
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition"
              >
                &lt;
              </button>
              <span className="px-4 py-1 bg-purple-600 text-white font-bold rounded-md shadow-md">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition"
              >
                &gt;
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition"
              >
                &gt;&gt;
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}