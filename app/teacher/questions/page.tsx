'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { fetchApi } from '@/lib/apiClient';
import { toastError, toastSuccess } from '@/lib/toast';
import { useUser } from '@/lib/user';
import QuestionFilters from '../../admin/questions/components/QuestionFilters';
import QuestionTable from '../../admin/questions/components/QuestionTable';

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

const ITEMS_PER_PAGE = 20;

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
  const { user } = useUser();

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    const queryString = new URLSearchParams({
      page: currentPage.toString(),
      limit: ITEMS_PER_PAGE.toString(),
      ...(filters.search && { search: filters.search }),
      ...(filters.difficulty && { difficulty: filters.difficulty }),
      ...(filters.type && { type: filters.type }),
      ...(filters.category && { category: filters.category }),
      // Optionally, you could add a filter for the user's own questions
      // ...(user && { creatorId: user.id.toString() }),
    }).toString();

    try {
      const data = await fetchApi(`/api/questions?${queryString}`);
      setQuestions(data.questions || data.data || []);
      setTotalCount(data.totalCount || data.meta?.total || 0);
    } catch (error) {
      console.error("Failed to fetch questions:", error);
      toastError("Không thể tải danh sách câu hỏi.");
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const handleFilterChange = (newFilters: Filters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleAddQuestion = () => {
    router.push('/teacher/questions/create');
  };

  const handleEdit = (id: number) => {
    router.push(`/teacher/questions/${id}`);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa câu hỏi này?')) {
      return;
    }

    try {
      await fetchApi(`/api/questions/${id}`, { method: 'DELETE' });
      toastSuccess("Đã xóa câu hỏi thành công!");
      if (questions.length === 1 && currentPage > 1) {
        setCurrentPage(prev => prev - 1);
      } else {
        fetchQuestions();
      }
    } catch (error: any) {
      console.error("Delete error:", error);
      toastError(`Lỗi: ${error.message}`);
    }
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold text-gray-800">Câu hỏi của tôi</h1>
        <button
          onClick={handleAddQuestion}
          className="px-6 py-3 bg-purple-600 text-white font-medium rounded-lg shadow-md hover:bg-purple-700 transition"
        >
          Thêm câu hỏi
        </button>
      </div>

      <QuestionFilters
        onFilter={handleFilterChange}
        initialFilters={filters}
      />

      <div className="mb-4 text-gray-600 font-medium">
        {loading ? 'Đang tải...' : `Hiển thị ${questions.length} / ${totalCount} câu hỏi`}
      </div>

      {!loading && user && (
        <QuestionTable
          questions={questions}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          currentUserId={user?.id}
          currentUserRole={user?.role}
        />
      )}

      {!loading && totalPages > 0 && (
        <div className="flex justify-center mt-8 space-x-2 items-center">
          <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>&lt;&lt;</button>
          <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1}>&lt;</button>
          <span>{currentPage} / {totalPages}</span>
          <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages}>&gt;</button>
          <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>&gt;&gt;</button>
        </div>
      )}
    </div>
  );
}
