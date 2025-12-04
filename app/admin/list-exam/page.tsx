"use client";
import React, { useState, useEffect } from "react";
import { fetchApi } from "@/lib/apiClient";
import { toastError, toastSuccess } from "@/lib/toast";
import Swal from 'sweetalert2';
import Link from 'next/link';
import { useRouter } from "next/navigation";

// Type definition for an exam
interface Exam {
  id: number;
  title: string;
  description: string;
  categoryName: string; 
  durationMinutes: number;
  startTime: string;
  endTime: string;
}

export default function AdminListExamPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Admin fetches all exams
  const fetchExams = async () => {
    setLoading(true);
    try {
        // The /my endpoint returns all exams for an admin user
      const res = await fetchApi("/exams/my");
      setExams(res);
    } catch (error) {
      toastError("Không thể tải danh sách bài thi.");
      console.error("Fetch exams error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const handleDelete = (examId: number) => {
    Swal.fire({
      title: 'Bạn có chắc không?',
      text: "Bạn sẽ không thể hoàn tác hành động này!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Vâng, xóa nó!',
      cancelButtonText: 'Hủy bỏ'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await fetchApi(`/exams/delete/${examId}`, { method: 'DELETE' });
          toastSuccess('Bài thi đã được xóa thành công!');
          fetchExams(); // Refresh list
        } catch (error: any) {
          toastError(error.message || 'Có lỗi xảy ra khi xóa bài thi.');
          console.error(`Deletion error for exam ${examId}:`, error);
        }
      }
    });
  };

  const handleEdit = (examId: number) => {
    router.push(`/admin/update-exam/${examId}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Đang tải danh sách bài thi...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] text-gray-900">
      <main className="flex-1 overflow-y-auto px-10 py-8">
        <section className="bg-white rounded-2xl shadow p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">Quản lý tất cả bài thi</h2>
            <Link href="/admin/exam-offline" legacyBehavior>
              <a className="px-6 py-2 bg-purple-700 text-white rounded-md hover:bg-purple-800">
                Tạo bài thi mới
              </a>
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-2 px-4 border-b text-left">STT</th>
                  <th className="py-2 px-4 border-b text-left">Tên bài thi</th>
                  <th className="py-2 px-4 border-b text-left">Danh mục</th>
                  <th className="py-2 px-4 border-b text-left">Thời gian (phút)</th>
                  <th className="py-2 px-4 border-b text-center">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {exams.length > 0 ? (
                  exams.map((exam, index) => (
                    <tr key={exam.id}>
                      <td className="py-2 px-4 border-b">{index + 1}</td>
                      <td className="py-2 px-4 border-b">{exam.title}</td>
                      <td className="py-2 px-4 border-b">{exam.categoryName}</td>
                      <td className="py-2 px-4 border-b">{exam.durationMinutes}</td>
                      <td className="py-2 px-4 border-b text-center">
                        <button
                          onClick={() => handleEdit(exam.id)}
                          className="text-blue-600 hover:underline mr-4"
                        >
                          Chỉnh sửa
                        </button>
                        <button
                          onClick={() => handleDelete(exam.id)}
                          className="text-red-600 hover:underline"
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-4 px-4 text-center text-gray-500">
                      Chưa có bài thi nào được tạo.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}