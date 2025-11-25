'use client';

import { useRouter } from 'next/navigation';
import { fetchApi } from '@/lib/apiClient';
import { toastError, toastSuccess } from '@/lib/toast';
import QuestionForm from '../../../admin/questions/components/QuestionForm';
import { useState } from 'react';
import { useUser } from '@/lib/user';

interface QuestionFormData {
  title: string;
  type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | '';
  difficulty: string;
  categoryId: string;
  answers: {
    tempId: number;
    content: string;
    isCorrect: boolean;
  }[];
}

export default function TeacherCreateQuestionPage() {
  const router = useRouter();
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateSubmit = async (formData: QuestionFormData) => {
    if (!user) {
      toastError("Bạn phải đăng nhập để thực hiện chức năng này.");
      return;
    }
    
    console.log("Submitting new question from teacher:", formData);
    setIsLoading(true);

    // Transform data from form state to backend DTO
    const typeMap: { [key: string]: string } = {
        'SINGLE_CHOICE': 'SINGLE',
        'MULTIPLE_CHOICE': 'MULTIPLE',
        'TRUE_FALSE': 'TRUE_FALSE'
    };
    
    const payload = {
      title: formData.title,
      type: typeMap[formData.type] || 'SINGLE',
      difficulty: formData.difficulty,
      categoryId: parseInt(formData.categoryId, 10),
      createdBy: user.username, // Thêm createdBy
      answers: formData.answers.map(ans => ({
        id: ans.tempId > 1_000_000_000 ? null : ans.tempId,
        text: ans.content,
        correct: ans.isCorrect,
      })),
    };

    console.log("Teacher submitting payload:", payload);

    try {
      await fetchApi('/questions/create', {
        method: 'POST',
        body: payload,
      });

      toastSuccess('Thêm câu hỏi thành công!');
      // Assuming teachers have a list of their questions at a similar path
      router.push('/teacher/questions'); 

    } catch (error) {
      console.error('API Error:', error);
      toastError(`Lỗi khi thêm câu hỏi: ${error instanceof Error ? error.message : 'Vui lòng kiểm tra lại dữ liệu.'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen flex items-start justify-center pt-10">
      <QuestionForm
        isEdit={false}
        onSubmit={handleCreateSubmit}
        isLoading={isLoading}
      />
    </div>
  );
}