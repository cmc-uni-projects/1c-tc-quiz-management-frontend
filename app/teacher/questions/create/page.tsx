'use client';

import QuestionForm from '../../../admin/questions/components/QuestionForm';
import { useRouter } from 'next/navigation';

export default function TeacherCreateQuestionPage() {
  const router = useRouter();

  const handleCreateSubmit = async (data: any) => {
    console.log("Submitting new question (Teacher):", data);
    try {
      // THỰC TẾ: GỌI API POST để tạo câu hỏi mới
      /*
      const response = await fetch('/api/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        alert('Thêm câu hỏi thành công!');
        router.push('/teacher/questions'); // Quay lại trang danh sách Teacher
      } else {
        alert('Lỗi khi thêm câu hỏi. Vui lòng kiểm tra dữ liệu.');
      }
      */

      // Giả lập thành công
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('Thêm câu hỏi thành công! (Dữ liệu giả lập)');
      router.push('/teacher/questions');

    } catch (error) {
      console.error('API Error:', error);
      alert('Có lỗi xảy ra, vui lòng thử lại.');
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