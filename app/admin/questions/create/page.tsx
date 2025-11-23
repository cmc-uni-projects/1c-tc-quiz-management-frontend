'use client';

import QuestionForm from '../components/QuestionForm';
import { useRouter } from 'next/navigation';

export default function CreateQuestionPage() {
  const router = useRouter();

  const handleCreateSubmit = async (data: any) => {
    console.log("Submitting new question:", data);

    // Khởi tạo trạng thái loading trước khi gọi API (được quản lý trong QuestionForm)
    // Tuy nhiên, chúng ta cần đảm bảo onSubmit trong QuestionForm không reset loading

    try {
      // THỰC TẾ: GỌI API POST để tạo câu hỏi mới
      // API Route proxy: /api/questions (Sẽ được xử lý bởi app/api/questions/route.ts)
      const response = await fetch('/api/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Quan trọng để gửi cookies xác thực
        body: JSON.stringify(data),
      });

      if (response.ok) {
        alert('Thêm câu hỏi thành công!');
        router.push('/admin/questions');
      } else {
        // Nếu Backend trả về lỗi (ví dụ: 400 Bad Request, 403 Forbidden)
        const errorText = await response.text();
        alert(`Lỗi khi thêm câu hỏi. Vui lòng kiểm tra dữ liệu: ${errorText}`);
      }

    } catch (error) {
      console.error('API Error:', error);
      // Lỗi kết nối (ví dụ: ECONNREFUSED)
      alert('Có lỗi xảy ra, không thể kết nối tới máy chủ. Vui lòng thử lại.');
    }
    // Không cần gọi setLoading(false) ở đây vì component Form đã chuyển sang trạng thái disabled
    // và chúng ta chuyển hướng ngay sau khi thành công.
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