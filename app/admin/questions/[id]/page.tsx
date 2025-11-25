'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { fetchApi } from '@/lib/apiClient';
import { toastError, toastSuccess } from '@/lib/toast';
import QuestionForm from '../components/QuestionForm';

// --- TYPE DEFINITIONS to match components ---
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

// Backend Question Entity structure
interface QuestionEntity {
    id: number;
    title: string;
    type: 'SINGLE' | 'MULTIPLE' | 'TRUE_FALSE';
    difficulty: string;
    category: { id: number; name: string; };
    answers: { id: number; text: string; correct: boolean; }[];
}


export default function EditQuestionPage() {
  const router = useRouter();
  const params = useParams();
  const questionId = params.id as string;

  const [initialData, setInitialData] = useState<QuestionFormData | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- DATA FETCHING (GET current question data) ---
  useEffect(() => {
    const fetchQuestionData = async () => {
      if (!questionId) return;

      setIsLoading(true);
      try {
        // 1. Fetch from the correct endpoint
        const data: QuestionEntity = await fetchApi(`/questions/get/${questionId}`);

        // 2. Transform backend entity to form data structure
        // Convert backend enum to frontend enum
        const typeMap: { [key: string]: string } = {
            'SINGLE': 'SINGLE_CHOICE',
            'MULTIPLE': 'MULTIPLE_CHOICE',
            'TRUE_FALSE': 'TRUE_FALSE'
        };
        
        const transformedData: QuestionFormData = {
          title: data.title,
          type: (typeMap[data.type] || data.type) as 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | '',
          difficulty: data.difficulty,
          categoryId: data.category.id.toString(),
          answers: data.answers.map(ans => ({
            tempId: ans.id, // Use real answer ID as tempId for keys
            content: ans.text, // Backend returns 'text' field
            isCorrect: ans.correct,
          })),
        };

        setInitialData(transformedData);
      } catch (error) {
        console.error('Fetch Error:', error);
        toastError(`Lỗi tải dữ liệu câu hỏi: ${error instanceof Error ? error.message : 'Lỗi kết nối.'}`);
        router.push('/admin/questions');
      } finally {
        setIsLoading(false);
      }
    };
    fetchQuestionData();
  }, [questionId, router]);

  // --- SUBMISSION HANDLER (PUT) ---
  const handleUpdateSubmit = async (formData: QuestionFormData) => {
    setIsSubmitting(true);
    
    // 1. Transform form data to backend DTO
    // Convert frontend enum to backend enum
    const typeMap: { [key: string]: string } = {
        'SINGLE_CHOICE': 'SINGLE',
        'MULTIPLE_CHOICE': 'MULTIPLE',
        'TRUE_FALSE': 'TRUE_FALSE'
    };
    
    const payload = {
        title: formData.title,
        type: typeMap[formData.type] || 'SINGLE', // Fallback value
        difficulty: formData.difficulty,
        categoryId: parseInt(formData.categoryId, 10),
        answers: formData.answers.map(ans => ({
            // The backend might need the original answer ID to update it
            // Sending it simplifies the backend logic (instead of deleting and recreating)
            id: ans.tempId > 1_000_000_000 ? null : ans.tempId, // New answers have large tempId from Date.now()
            text: ans.content,
            correct: ans.isCorrect,
        })),
    };

    console.log(`Submitting update for ID ${questionId}:`, payload);
    try {
      // 2. Call the correct backend endpoint - Use admin endpoint for admin users
      await fetchApi(`/admin/questions/${questionId}`, {
        method: 'PUT',
        body: payload,
      });

      toastSuccess('Cập nhật câu hỏi thành công!');
      router.push('/admin/questions');

    } catch (error) {
      console.error('API Error:', error);
      toastError(`Lỗi khi cập nhật: ${error instanceof Error ? error.message : 'Vui lòng kiểm tra lại dữ liệu.'}`);
      setIsSubmitting(false); // Re-enable form on error
    }
  };

  if (isLoading) {
    return <div className="p-6 text-center text-lg font-medium text-purple-600">Đang tải dữ liệu câu hỏi...</div>;
  }
  
  if (!initialData) {
      return <div className="p-6 text-center text-xl font-bold text-red-500">Lỗi: Không tìm thấy dữ liệu để cập nhật.</div>;
  }

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen flex items-start justify-center pt-10">
      <QuestionForm
        isEdit={true}
        initialData={initialData}
        onSubmit={handleUpdateSubmit}
        isLoading={isSubmitting}
      />
    </div>
  );
}