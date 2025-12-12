"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Play, Loader2, AlertTriangle } from 'lucide-react';

// --- INTERFACE (Cấu trúc dữ liệu) ---
interface ExamData {
  student: { name: string; avatar_url: string; };
  exam_details: { title: string; level: string; category: string; total_questions: number; duration_minutes: number; participants_count: number; allow_to_do_exam: boolean; };
}

// --- CẤU HÌNH API ---
const WAITING_ROOM_ENDPOINT = 'http://localhost:8082/api/waiting-room';

const WaitingRoomWithToken = () => {
  const [data, setData] = useState<ExamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // --- LOGIC LẤY DỮ LIỆU (Được bọc trong useCallback để tối ưu) ---
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const authToken = localStorage.getItem('authToken');

    if (!authToken) {
      setError("Lỗi: Không tìm thấy Token xác thực. Vui lòng đăng nhập lại.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(WAITING_ROOM_ENDPOINT, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
      });

      if (response.status === 401) {
           throw new Error("Token hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.");
      }

      if (!response.ok) {
        throw new Error(`Lỗi HTTP: ${response.status} - ${response.statusText}`);
      }

      const result: ExamData = await response.json();
      setData(result);
    } catch (err) {
      console.error("Lỗi lấy dữ liệu API:", err);
      setError(`Không thể tải thông tin phòng chờ: ${err instanceof Error ? err.message : 'Lỗi không xác định'}`);
    } finally {
      setLoading(false);
    }
  }, []); // Không phụ thuộc vào biến ngoài nào

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (data?.exam_details.allow_to_do_exam) {
      router.push('/student/do-exam');
    }
  }, [data, router]);

  // --- RENDERING CÁC TRẠNG THÁI ---

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={fetchData} />;
  }

  // Dữ liệu thành công, render Component chính
  return <WaitingRoomContent data={data} />;
};

export default WaitingRoomWithToken;

// --- COMPONENT CON CHO CÁC TRẠNG THÁI ---

// Component 1: Trạng thái Đang tải (Loading State)
const LoadingState: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-100">
    <div className="flex items-center space-x-3 text-purple-600">
      <Loader2 className="animate-spin" size={24} />
      <span className="text-lg font-medium">Đang chờ tín hiệu từ phòng thi...</span>
    </div>
  </div>
);

// Component 2: Trạng thái Lỗi (Error State)
interface ErrorProps {
  error: string;
  onRetry: () => void;
}
const ErrorState: React.FC<ErrorProps> = ({ error, onRetry }) => (
  <div className="flex items-center justify-center min-h-screen bg-red-50 p-4">
    <div className="text-center p-8 bg-white rounded-xl shadow-lg border border-red-300">
      <AlertTriangle className="mx-auto h-8 w-8 text-red-500" />
      <h3 className="text-xl font-bold text-red-600 mt-3">Không vào được phòng chờ</h3>
      <p className="mt-2 text-gray-700">{error}</p>
      {/* Nút thử lại */}
      <button
        onClick={onRetry}
        className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
      >
        Thử lại
      </button>
    </div>
  </div>
);

// Component 3: Hiển thị Nội dung Phòng chờ (Success State)
interface ContentProps {
  data: ExamData | null;
}
const WaitingRoomContent: React.FC<ContentProps> = ({ data }) => {
  const studentName = data?.student.name || 'Học sinh';
  const examDetails = data?.exam_details;

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-2xl w-full flex flex-col md:flex-row gap-8">

        {/* Phần bên trái: Avatar & Tên */}
        <div className="flex flex-col items-center flex-shrink-0">
          <div className="w-48 h-48 rounded-full bg-purple-100 flex items-center justify-center border-4 border-white shadow-inner overflow-hidden">
            <img
               src={data?.student.avatar_url || 'https://via.placeholder.com/150/805ad5/ffffff?text=AVATAR'}
               alt={studentName}
               className="w-full h-full object-cover"
            />
          </div>
          <h2 className="mt-4 text-2xl font-bold text-gray-800 tracking-tight">
            {studentName}
          </h2>
        </div>

        {/* Phần bên phải: Thông tin chi tiết */}
        <div className="flex-1 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-2xl font-semibold text-purple-700">
              {examDetails?.title || 'Tên bài thi'}
            </h3>

            <div className="grid grid-cols-1 gap-3 text-lg">
              <p>
                <strong className="text-gray-700">Loại bài thi:</strong> <span className="font-medium text-gray-600">{examDetails?.level}</span>
              </p>
              <p>
                <strong className="text-gray-700">Danh mục bài thi:</strong> <span className="font-medium text-gray-600">{examDetails?.category}</span>
              </p>
              <p>
                <strong className="text-gray-700">Số lượng câu hỏi:</strong> <span className="font-medium text-gray-600">{examDetails?.total_questions}</span>
              </p>
              <p>
                <strong className="text-gray-700">Thời gian làm bài:</strong> <span className="font-medium text-gray-600">{examDetails?.duration_minutes} phút</span>
              </p>
              <p>
                <strong className="text-gray-700">Người tham gia:</strong> <span className="font-medium text-gray-600">{examDetails?.participants_count} học sinh</span>
              </p>
            </div>
          </div>

          {/* Nhóm nút bấm */}
          <div className="mt-8 flex gap-4 justify-end">
            <button className="px-6 py-2.5 bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold rounded-xl transition-all duration-200 flex items-center gap-2">
              <LogOut size={18} />
              Thoát
            </button>
            <button className="px-8 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl shadow-md shadow-purple-200 transition-all duration-200 flex items-center gap-2">
              <Play size={18} fill="white" />
              Vào thi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
