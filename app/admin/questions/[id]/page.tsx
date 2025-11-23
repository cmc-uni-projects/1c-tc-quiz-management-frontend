'use client';

import { useEffect, useState } from 'react';
import QuestionForm from '../components/QuestionForm';
import { useRouter, useParams } from 'next/navigation';

// Định nghĩa kiểu dữ liệu cho QuestionData
interface QuestionData {
  title: string;
  type: string;
  difficulty: string;
  answer: string;
  category: string;
}

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
        // GỌI API GET đã được proxy (File 2: app/api/questions/[id]/route.ts)
        const response = await fetch(`/api/questions/${questionId}`, {
            credentials: 'include', // Quan trọng để gửi cookies xác thực
            cache: 'no-store'
        });

        if (response.ok) {
          const data = await response.json();
          setInitialData(data);
        } else {
          // Bắt lỗi 404, 403, 401 từ Backend
          const errorText = await response.text();
          throw new Error(`Lỗi ${response.status}: ${errorText || 'Không tìm thấy câu hỏi hoặc không có quyền.'}`);
        }

      } catch (error) {
        console.error('Fetch Error:', error);
        setError(`Lỗi tải dữ liệu: ${error instanceof Error ? error.message : 'Lỗi kết nối.'}`);
        // Chuyển hướng sau khi thất bại
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
      // GỌI API PUT (File 2: app/api/questions/[id]/route.ts)
      const response = await fetch(`/api/questions/${questionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (response.ok) {
        alert('Cập nhật câu hỏi thành công!');
        router.push('/admin/questions');
      } else {
        const errorText = await response.text();
        alert(`Lỗi khi cập nhật: ${errorText || 'Vui lòng kiểm tra lại dữ liệu.'}`);
      }

    } catch (error) {
      console.error('API Error:', error);
      alert('Có lỗi xảy ra trong quá trình kết nối.');
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