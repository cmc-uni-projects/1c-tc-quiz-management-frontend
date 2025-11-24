'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchApi } from '@/lib/apiClient';
import { toastError, toastSuccess } from '@/lib/toast';
import { useUser } from '@/lib/user';
import QuestionForm from '../components/QuestionForm';

// Match the form data structure from the updated QuestionForm
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


export default function CreateQuestionPage() {
  const router = useRouter();
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateSubmit = async (formData: QuestionFormData) => {
    if (!user) {
      toastError("Bạn phải đăng nhập để thực hiện chức năng này.");
      return;
    }
    
    setIsLoading(true);

    // 1. Transform data from form state to backend DTO
    // Convert frontend enum to backend enum
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
      createdBy: user.username,
      answers: formData.answers.map(ans => ({
        id: ans.tempId > 1_000_000_000 ? null : ans.tempId,
        text: ans.content,
        correct: ans.isCorrect,
      })),
    };

    console.log("Submitting new question with payload:", payload);

    try {
      // 2. Call the correct backend endpoint
      await fetchApi('/questions/create', {
        method: 'POST',
        body: payload,
      });

      toastSuccess('Thêm câu hỏi thành công!');
      router.push('/admin/questions');

    } catch (error) {
      console.error('API Error:', error);
      toastError(`Lỗi khi thêm câu hỏi: ${error instanceof Error ? error.message : 'Vui lòng kiểm tra lại dữ liệu.'}`);
      setIsLoading(false); // Re-enable form on error
    }
    // No need to set isLoading to false on success as we are navigating away
  };

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen flex items-start justify-center pt-10">
      <QuestionForm
        isEdit={false}
        onSubmit={handleCreateSubmit}
        isLoading={isLoading}
      />
    </div>
  );
}