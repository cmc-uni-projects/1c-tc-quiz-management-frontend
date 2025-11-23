'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { fetchApi } from '@/lib/apiClient';
import { toastError, toastSuccess } from '@/lib/toast';
import QuestionForm from '../../../admin/questions/components/QuestionForm';

interface QuestionData {
  title: string;
  type: string;
  difficulty: string;
  answer: string;
  category: string;
}

export default function TeacherEditQuestionPage() {
  const router = useRouter();
  const params = useParams();
  const questionId = params.id as string;

  const [initialData, setInitialData] = useState<QuestionData | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuestionData = async () => {
      if (!questionId) return;

      try {
        const data = await fetchApi(`/api/questions/${questionId}`);
        setInitialData(data);
      } catch (error) {
        console.error('Fetch Error:', error);
        toastError('Lỗi tải dữ liệu.');
        router.push('/teacher/questions');
      } finally {
        setLoading(false);
      }
    };
    fetchQuestionData();
  }, [questionId, router]);

  const handleUpdateSubmit = async (data: QuestionData) => {
    console.log(`Submitting update for ID ${questionId} (Teacher):`, data);
    try {
      await fetchApi(`/api/questions/${questionId}`, {
        method: 'PUT',
        body: data,
      });
      toastSuccess('Cập nhật câu hỏi thành công!');
      router.push('/teacher/questions');
    } catch (error) {
      console.error('API Error:', error);
      toastError('Có lỗi xảy ra, vui lòng thử lại.');
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-lg font-medium text-purple-600">Đang tải dữ liệu câu hỏi...</div>;
  }

  if (!initialData) {
      return <div className="p-6 text-center text-xl font-bold text-red-500">Lỗi: Không có dữ liệu để cập nhật.</div>;
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