'use client';

import { useState, useEffect, useCallback } from 'react';
import QuestionFilters from './components/QuestionFilters';
import QuestionTable from './components/QuestionTable';
import QuestionForm from './components/QuestionForm';np
import { useRouter } from 'next/navigation';

// --- TYPE DEFINITIONS ---
interface Question {
  id: number;
  title: string;
  type: string;
  difficulty: string;
  answer: string;
  creator: string;
  creatorId: number;
  category: string;
}

interface Filters {
  search: string;
  difficulty: string;
  type: string;
  category: string;
}

interface ApiResponse {
  data: Question[];
  meta: {
    total: number;
    page: number;
    last_page: number;
  };
}

// --- AUTH CONTEXT (Giả lập hoặc thay thế bằng hook thật như useSession) ---
// Trong thực tế, bạn nên dùng useSession() từ next-auth hoặc context của bạn
const useAuth = () => {
  // Ví dụ giả lập trả về user hiện tại
  return {
    user: { id: 101, role: 'TEACHER' as 'ADMIN' | 'TEACHER' }
  };
};

const ITEMS_PER_PAGE = 20;

export default function AdminQuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  // State bộ lọc
  const [filters, setFilters] = useState<Filters>({
    search: '',
    difficulty: '',
    type: '',
    category: '',
  });

  const router = useRouter();
  const { user } = useAuth(); // Lấy user thực tế

  // --- DATA FETCHING FUNCTION ---
  // Sử dụng useCallback để tránh tạo lại hàm không cần thiết khi render
  const fetchQuestions = useCallback(async () => {
    setLoading(true);

    // 1. Xây dựng Query String
    const queryString = new URLSearchParams({
      page: currentPage.toString(),
      limit: ITEMS_PER_PAGE.toString(),
      // Chỉ thêm các param nếu chúng có giá trị để URL gọn gàng
      ...(filters.search && { search: filters.search }),
      ...(filters.difficulty && { difficulty: filters.difficulty }),
      ...(filters.type && { type: filters.type }),
      ...(filters.category && { category: filters.category }),
    }).toString();

    try {
      // 2. Gọi API thực tế
      // Đảm bảo bạn đã tạo file route: app/api/questions/route.ts
      const response = await fetch(`/api/questions?${queryString}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Thêm Authorization header nếu cần (thường Next.js xử lý qua cookie)
        },
      });

      if (!response.ok) {
        throw new Error(`Lỗi tải dữ liệu: ${response.statusText}`);
      }

      const data = await response.json();

      // 3. Cập nhật State từ dữ liệu trả về của Backend
      // Giả sử Backend trả về format: { questions: [], totalCount: 100 }
      // hoặc { data: [], meta: { total: 100 } } -> Tùy chỉnh dòng dưới theo API của bạn
      setQuestions(data.questions || data.data || []);
      setTotalCount(data.totalCount || data.meta?.total || 0);

    } catch (error) {
      console.error("Failed to fetch questions:", error);
      alert("Không thể tải danh sách câu hỏi. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters]); // Dependency array: Chạy lại khi trang hoặc bộ lọc đổi

  // Gọi API khi currentPage hoặc filters thay đổi
  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  // --- HANDLERS ---
  const handleFilterChange = (newFilters: Filters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset về trang 1 khi filter thay đổi
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

    try {
        // 1. Gọi API Xóa
        const response = await fetch(`/api/questions/${id}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Xóa thất bại');
        }

        // 2. Thông báo thành công
        alert("Đã xóa câu hỏi thành công!");

        // 3. Refresh lại danh sách
        // Nếu trang hiện tại chỉ còn 1 item và ta xóa nó, nên lùi lại 1 trang
        if (questions.length === 1 && currentPage > 1) {
            setCurrentPage(prev => prev - 1);
        } else {
            fetchQuestions(); // Reload trang hiện tại
        }

    } catch (error: any) {
        console.error("Delete error:", error);
        alert(`Lỗi: ${error.message}`);
    }
  };

  // --- PAGINATION LOGIC ---
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">

      {/* Header and Add Button */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold text-gray-800">Quản lý Câu hỏi</h1>
        <button
          onClick={handleAddQuestion}
          className="px-6 py-3 bg-purple-600 text-white font-medium rounded-lg shadow-md hover:bg-purple-700 transition"
        >
          Thêm câu hỏi
        </button>
      </div>

      {/* Filters */}
      <QuestionFilters
        onFilter={handleFilterChange}
        initialFilters={filters}
      />

      {/* Count Info */}
      <div className="mb-4 text-gray-600 font-medium">
        {loading ? 'Đang tải...' : `Hiển thị ${questions.length} / ${totalCount} câu hỏi`}
      </div>

      {/* Table */}
      <QuestionTable
        questions={questions}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        currentUserId={user.id}
        currentUserRole={user.role}
      />

      {/* Pagination */}
      {!loading && totalPages > 0 && (
        <div className="flex justify-center mt-8 space-x-2 items-center">
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
  );
}