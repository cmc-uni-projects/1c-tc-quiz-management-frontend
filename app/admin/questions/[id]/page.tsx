'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { fetchApi } from '@/lib/apiClient';
import { toastError, toastSuccess } from '@/lib/toast';
import QuestionForm from '../components/QuestionForm';

export default function EditQuestionPage() {
  const router = useRouter();
  const params = useParams();
  // questionId là ID của câu hỏi từ URL (ví dụ: '123')
  const questionId = params.id as string;

  const [initialData, setInitialData] = useState<QuestionData | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- DATA FETCHING (GET current question data) ---
  useEffect(() => {
    const fetchQuestionData = async () => {
      if (!questionId) return;

      try {
        const data = await fetchApi(`/questions/${questionId}`);
        setInitialData(data);
      } catch (error) {
        console.error('Fetch Error:', error);
        toastError(`Lỗi tải dữ liệu: ${error instanceof Error ? error.message : 'Lỗi kết nối.'}`);
        router.push('/admin/questions');
      } finally {
        setLoading(false);
      }
    };
    fetchQuestionData();
  }, [questionId, router]);

  // --- SUBMISSION HANDLER (PUT/PATCH) ---
  const handleUpdateSubmit = async (data: QuestionData) => {
    console.log(`Submitting update for ID ${questionId}:`, data);
    try {
      await fetchApi(`/questions/${questionId}`, {
        method: 'PUT',
        body: data,
      });

      toastSuccess('Cập nhật câu hỏi thành công!');
      router.push('/admin/questions');

    } catch (error) {
      console.error('API Error:', error);
      toastError(`Lỗi khi cập nhật: ${error instanceof Error ? error.message : 'Vui lòng kiểm tra lại dữ liệu.'}`);
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-lg font-medium text-purple-600">Đang tải dữ liệu câu hỏi...</div>;
  }

  if (error) {
       return <div className="p-6 text-center text-xl font-bold text-red-500">{error}</div>;
  }

  if (!initialData) {
      // Trường hợp này chỉ xảy ra nếu fetch thất bại và chuyển hướng không hoạt động
      return <div className="p-6 text-center text-xl font-bold text-red-500">Lỗi: Không tìm thấy dữ liệu để cập nhật.</div>;
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen flex items-start justify-center pt-10">
      <QuestionForm
        isEdit={true}
        initialData={initialData}
        onSubmit={handleUpdateSubmit}
      />
    </div>
  );
}