import React from 'react';

// Icon components matching categories page
interface IconProps {
  className?: string;
  [key: string]: any;
}

const EditIcon = (props: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 20h9"/>
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/>
  </svg>
);

const TrashIcon = (props: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
    <path d="M10 11v6"/>
    <path d="M14 11v6"/>
    <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/>
  </svg>
);

// Corrected type definitions to match backend and parent component
interface Category {
  id: number;
  name: string;
}

interface Answer {
  id: number;
  text: string;
  correct: boolean;
}

interface Question {
  id: number;
  title: string;
  type: string;
  difficulty: string;
  category: Category;
  createdBy: string;
  answers: Answer[];
}

interface QuestionTableProps {
  questions: Question[];
  loading: boolean;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  // User info for authorization check - Changed to pass name
  currentUserName: string | undefined;
  currentUserRole: 'ADMIN' | 'TEACHER' | 'STUDENT' | 'UNKNOWN' | undefined;
}

export default function QuestionTable({
  questions,
  loading,
  onEdit,
  onDelete,
  currentUserName,
  currentUserRole
}: QuestionTableProps) {

  if (loading) {
    return <div className="text-center py-8 text-lg font-medium text-purple-600">Đang tải danh sách câu hỏi...</div>;
  }

  // Function to find and display the correct answer
  const getCorrectAnswerDisplay = (answers: Answer[]): string => {
    const correctAnswers = answers.filter(a => a.correct);
    if (correctAnswers.length === 0) return 'N/A';
    // Join multiple correct answers if they exist
    return correctAnswers.map(a => a.text).join('; ');
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-x-auto border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider w-16">STT</th>
            <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Tiêu đề</th>
            <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Loại câu hỏi</th>
            <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Độ khó</th>
            <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Đáp án đúng</th>
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
              // Authorization check: Admin OR (creator is current user)
              const canEditOrDelete = currentUserRole === 'ADMIN' || 
                                     (currentUserRole === 'TEACHER' && question.createdBy === currentUserName);

              return (
                <tr key={question.id} className="hover:bg-purple-50 transition duration-100">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 truncate max-w-xs">{question.title}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{question.type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{question.difficulty}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 truncate max-w-xs">{getCorrectAnswerDisplay(question.answers)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{question.createdBy}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{question.category.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {canEditOrDelete ? (
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => onEdit(question.id)}
                          className="px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200 hover:bg-blue-200 transition disabled:opacity-50 flex items-center gap-1"
                          disabled={loading}
                        >
                          <EditIcon className="w-3 h-3 flex-shrink-0" /> Sửa
                        </button>
                        <button
                          onClick={() => onDelete(question.id)}
                          className="px-3 py-1.5 rounded-full text-xs font-semibold bg-rose-500 text-white shadow hover:bg-rose-600 transition disabled:opacity-50 flex items-center gap-1"
                          disabled={loading}
                        >
                          <TrashIcon className="w-3 h-3 flex-shrink-0" /> Xóa
                        </button>
                      </div>
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