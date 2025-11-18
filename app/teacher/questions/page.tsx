'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
// Import các component từ thư mục Admin để tái sử dụng
import QuestionFilters from '../../admin/questions/components/QuestionFilters';
import QuestionTable from '../../admin/questions/components/QuestionTable';

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

// --- DUMMY USER INFO (SỬ DỤNG VAI TRÒ TEACHER) ---
// Thay thế bằng logic lấy user thực tế (từ Auth Context)
const DUMMY_USER = {
    id: 201,
    role: 'TEACHER' as 'ADMIN' | 'TEACHER',
};

const ITEMS_PER_PAGE = 20; // 20 câu hỏi/trang

export default function TeacherQuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<Filters>({
    search: '',
    difficulty: '',
    type: '',
    category: '',
  });

  const router = useRouter();

  const currentUserId = DUMMY_USER.id;
  const currentUserRole = DUMMY_USER.role;

  // --- DATA FETCHING FUNCTION ---
  const fetchQuestions = async (page = 1, currentFilters: Filters) => {
    setLoading(true);

    // --- START: DUMMY DATA FOR DEMO ---
    const dummyQuestions: Question[] = [
        { id: 10, title: 'Question 10 - Tôi tạo', type: 'True/False', difficulty: 'Easy', answer: 'True', creator: 'Teacher X', creatorId: 201, category: 'Mathematics' },
        { id: 11, title: 'Question 11 - Admin tạo', type: 'Multiple Choice', difficulty: 'Medium', answer: 'B', creator: 'Admin', creatorId: 100, category: 'Physics' },
        { id: 12, title: 'Question 12 - Tôi tạo', type: 'Fill in the Blanks', difficulty: 'Hard', answer: 'Water', creator: 'Teacher X', creatorId: 201, category: 'Chemistry' },
    ];
    const TOTAL_COUNT_DUMMY = 45;

    const queryString = new URLSearchParams({
      page: page.toString(),
      limit: ITEMS_PER_PAGE.toString(),
      search: currentFilters.search,
      difficulty: currentFilters.difficulty,
      type: currentFilters.type,
      category: currentFilters.category,
    }).toString();

    try {
        // THỰC TẾ: Gọi API Backend, có thể thêm filter theo userId nếu muốn Giáo viên chỉ thấy câu hỏi của họ
        // const response = await fetch(`/api/questions?${queryString}`);
        // const data = await response.json();

        const data = {
            questions: dummyQuestions.slice(0, ITEMS_PER_PAGE),
            totalCount: TOTAL_COUNT_DUMMY,
        };

        setQuestions(data.questions);
        setTotalCount(data.totalCount);
        setCurrentPage(page);
    } catch (error) {
        console.error("Failed to fetch questions:", error);
    } finally {
        setLoading(false);
    }
    // --- END: DUMMY DATA ---
  };

  useEffect(() => {
    fetchQuestions(currentPage, filters);
  }, [currentPage, filters]);

  // --- HANDLERS ---
  const handleFilterChange = (newFilters: Filters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleAddQuestion = () => {
    // CHUYỂN HƯỚNG ĐẾN ROUTE TEACHER CREATE
    router.push('/teacher/questions/create');
  };

  const handleEdit = (id: number) => {
    // CHUYỂN HƯỚNG ĐẾN ROUTE TEACHER EDIT
    router.push(`/teacher/questions/${id}`);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Bạn có chắc chắn muốn xóa câu hỏi này?')) {
        // GỌI API DELETE (Backend sẽ kiểm tra quyền)
        console.log(`[API CALL] DELETE /api/questions/${id} by Teacher ${currentUserId}. Backend should authorize.`);

        // Sau khi xóa thành công, tải lại danh sách
        fetchQuestions(currentPage, filters);
    }
  };

  // --- PAGINATION LOGIC ---
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="p-6 bg-white min-h-screen rounded-xl shadow-lg">

      {/* Header and Add Button */}
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <h1 className="text-3xl font-extrabold text-purple-700">Quản lý Câu hỏi (Giáo viên)</h1>
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
        Hiển thị {questions.length} / {totalCount} câu hỏi
      </div>

      {/* Table */}
      <QuestionTable
        questions={questions}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        currentUserId={currentUserId}
        currentUserRole={currentUserRole}
      />

      {/* Pagination */}
      <div className="flex justify-center mt-8 space-x-2 items-center">
        {/* Pagination Controls (Giống Admin) */}
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
          {currentPage}
        </span>
        <button
          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
          disabled={currentPage === totalPages || totalPages === 0}
          className="px-3 py-1 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition"
        >
          &gt;
        </button>
        <button
          onClick={() => setCurrentPage(totalPages)}
          disabled={currentPage === totalPages || totalPages === 0}
          className="px-3 py-1 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition"
        >
          &gt;&gt;
        </button>
      </div>
      <div className='text-center text-sm mt-2 text-gray-500'>
        Trang {currentPage} trên tổng số {totalPages} trang
      </div>
    </div>
  );
}