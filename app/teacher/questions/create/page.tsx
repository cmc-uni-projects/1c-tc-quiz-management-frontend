'use client';

import { useRouter } from 'next/navigation';
import { fetchApi } from '@/lib/apiClient';
import { toastError, toastSuccess } from '@/lib/toast';
import QuestionForm from '../../../admin/questions/components/QuestionForm';

export default function TeacherCreateQuestionPage() {
  const router = useRouter();

  const handleCreateSubmit = async (data: any) => {
    console.log("Submitting new question from teacher:", data);

    try {
      await fetchApi('/api/questions', {
        method: 'POST',
        body: data,
      });

      toastSuccess('Thêm câu hỏi thành công!');
      // Assuming teachers have a list of their questions at a similar path
      router.push('/teacher/questions'); 

    } catch (error) {
      console.error('API Error:', error);
      toastError(`Lỗi khi thêm câu hỏi: ${error instanceof Error ? error.message : 'Vui lòng kiểm tra lại dữ liệu.'}`);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen flex items-start justify-center pt-10">
      <QuestionForm
        isEdit={false}
        onSubmit={handleCreateSubmit}
      />
    </div>
  );
}