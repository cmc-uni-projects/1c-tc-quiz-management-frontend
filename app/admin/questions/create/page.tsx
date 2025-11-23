'use client';

import { useRouter } from 'next/navigation';
import { fetchApi } from '@/lib/apiClient';
import { toastError, toastSuccess } from '@/lib/toast';
import QuestionForm from '../components/QuestionForm';

export default function CreateQuestionPage() {
  const router = useRouter();

  const handleCreateSubmit = async (data: any) => {
    console.log("Submitting new question:", data);

    try {
      await fetchApi('/api/questions', {
        method: 'POST',
        body: data,
      });

      toastSuccess('Thêm câu hỏi thành công!');
      router.push('/admin/questions');

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