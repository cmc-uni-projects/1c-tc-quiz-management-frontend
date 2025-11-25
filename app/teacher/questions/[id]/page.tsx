'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { fetchApi } from '@/lib/apiClient';
import { toastError, toastSuccess } from '@/lib/toast';
import QuestionForm from '../../../admin/questions/components/QuestionForm';

interface QuestionData {
  title: string;
  type: '' | 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE';
  difficulty: string;
  answer?: string;
  category?: string;
  categoryId: string;
  answers: Array<{
    tempId: number;
    content: string;
    isCorrect: boolean;
  }>;
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
        const data = await fetchApi(`/questions/get/${questionId}`);
        
        // Transform backend data to frontend format
        const transformedData: QuestionData = {
          title: data.title,
          type: (data.type === 'SINGLE' ? 'SINGLE_CHOICE' : 
                data.type === 'MULTIPLE' ? 'MULTIPLE_CHOICE' : 'TRUE_FALSE') as 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE',
          difficulty: data.difficulty,
          categoryId: data.category?.id?.toString() || '',
          answers: data.answers?.map((ans: any) => ({
            tempId: ans.id || Date.now() + Math.random(),
            content: ans.text,
            isCorrect: ans.correct
          })) || [],
          answer: data.correctAnswer
        };
        
        setInitialData(transformedData);
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
    try {
      // Transform frontend data to backend format
      const backendData = {
        title: data.title,
        type: data.type === 'SINGLE_CHOICE' ? 'SINGLE' : 
              data.type === 'MULTIPLE_CHOICE' ? 'MULTIPLE' : 'TRUE_FALSE',
        difficulty: data.difficulty,
        categoryId: parseInt(data.categoryId || '0'),
        correctAnswer: data.type === 'TRUE_FALSE' ? data.answer : undefined,
        answers: data.type === 'TRUE_FALSE' ? [] : data.answers?.map((ans: any) => ({
          text: ans.content,
          correct: ans.isCorrect
        })) || []
      };

      await fetchApi(`/questions/edit/${questionId}`, {
        method: 'PUT',
        body: backendData,
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
        isLoading={false}
      />
    </div>
  );
}