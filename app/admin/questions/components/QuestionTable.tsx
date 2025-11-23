import React from 'react';

interface Question {
  id: number;
  title: string;
  type: string;
  difficulty: string;
  answer: string;
  creator: string;
  creatorId: number;
  category: string;
}

interface QuestionTableProps {
  questions: Question[];
  loading: boolean;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  // User info for authorization check
  currentUserId: number;
  currentUserRole: 'ADMIN' | 'TEACHER' | 'STUDENT' | 'UNKNOWN';
}

export default function QuestionTable({
  questions,
  loading,
  onEdit,
  onDelete,
  currentUserId,
  currentUserRole
}: QuestionTableProps) {

  if (loading) {
    return <div className="text-center py-8 text-lg font-medium text-purple-600">Đang tải danh sách câu hỏi...</div>;
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-x-auto border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider w-16">STT</th>
            <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Tiêu đề</th>
            <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Loại câu hỏi</th>
            <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Độ khó</th>
            <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Đáp án</th>
            <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Người tạo</th>
            <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Danh mục</th>
            <th className="px-6 py-3 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">Thao tác</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {questions.length === 0 ? (
            <tr>
              <td colSpan={8} className="px-6 py-8 text-center text-gray-500 italic">
                Không tìm thấy câu hỏi nào. Vui lòng thử tìm kiếm khác hoặc thêm mới.
              </td>
            </tr>
          ) : (
            questions.map((question, index) => {
              // Authorization check: Admin OR (Teacher AND creator is current user)
              const canEditOrDelete = currentUserRole === 'ADMIN' || question.creatorId === currentUserId;

              return (
                <tr key={question.id} className="hover:bg-purple-50 transition duration-100">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 truncate max-w-xs">{question.title}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{question.type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{question.difficulty}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 truncate max-w-xs">{question.answer}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{question.creator}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{question.category}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    {canEditOrDelete ? (
                      <>
                        <button
                          onClick={() => onEdit(question.id)}
                          className="text-indigo-600 hover:text-indigo-800 font-semibold"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => onDelete(question.id)}
                          className="text-red-600 hover:text-red-800 font-semibold ml-2"
                        >
                          Xóa
                        </button>
                      </>
                    ) : (
                      <span className="text-gray-400 italic">Không có quyền</span>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}