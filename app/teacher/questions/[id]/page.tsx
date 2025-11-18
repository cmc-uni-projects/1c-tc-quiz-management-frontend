'use client';

import { useEffect, useState } from 'react';
import QuestionForm from '../../../admin/questions/components/QuestionForm';
import { useRouter, useParams } from 'next/navigation';

// Định nghĩa kiểu dữ liệu cho QuestionData
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

  // --- DATA FETCHING (GET current question data) ---
  useEffect(() => {
    const fetchQuestionData = async () => {
      if (!questionId) return;

      try {
        // THỰC TẾ: GỌI API GET để lấy dữ liệu câu hỏi hiện tại
        /*
        const response = await fetch(`/api/questions/${questionId}`);
        if (response.ok) {
          const data: QuestionData = await response.json();
          setInitialData(data);
        } else {
          alert('Không tìm thấy câu hỏi này.');
          router.push('/teacher/questions');
        }
        */

        // Giả lập dữ liệu thành công cho Frontend demo
        await new Promise(resolve => setTimeout(resolve, 500));
        setInitialData({
            title: `[Teacher] Tiêu đề câu hỏi số ${questionId}`,
            type: 'True/False',
            difficulty: 'Easy',
            answer: 'Đúng',
            category: 'Mathematics',
        });

      } catch (error) {
        console.error('Fetch Error:', error);
        alert('Lỗi tải dữ liệu.');
      } finally {
        setLoading(false);
      }
    };
    fetchQuestionData();
  }, [questionId, router]);

  // --- SUBMISSION HANDLER (PUT/PATCH) ---
  const handleUpdateSubmit = async (data: QuestionData) => {
    console.log(`Submitting update for ID ${questionId} (Teacher):`, data);
    try {
      // THỰC TẾ: GỌI API PUT/PATCH để cập nhật câu hỏi (Backend sẽ kiểm tra quyền)
      /*
      const response = await fetch(`/api/questions/${questionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        alert('Cập nhật câu hỏi thành công!');
        router.push('/teacher/questions');
      } else {
        alert('Lỗi khi cập nhật câu hỏi.');
      }
      */

      // Giả lập thành công
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('Cập nhật câu hỏi thành công! (Dữ liệu giả lập)');
      router.push('/teacher/questions');

    } catch (error) {
      console.error('API Error:', error);
      alert('Có lỗi xảy ra, vui lòng thử lại.');
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