'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { fetchApi } from '@/lib/apiClient';

// --- TYPE DEFINITIONS ---
interface AnswerField {
  tempId: number; // For React key prop
  content: string; // FE dùng 'content' để hiển thị
  isCorrect: boolean; // FE dùng 'isCorrect' để hiển thị
}

interface QuestionFormData {
  title: string;
  type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | '';
  difficulty: string;
  categoryId: string;
  answers: AnswerField[];
}

interface Option {
  id: number | string;
  name: string;
}

interface QuestionFormProps {
  initialData?: QuestionFormData;
  isEdit: boolean;
  onSubmit: (data: any) => Promise<void>; // Chấp nhận any vì cấu trúc gửi đi khác cấu trúc state
  isLoading: boolean;
}

export default function QuestionForm({ initialData, isEdit, onSubmit, isLoading }: QuestionFormProps) {
  const [formData, setFormData] = useState<QuestionFormData>(initialData || {
    title: '',
    type: '', // Sẽ lưu ID từ Backend (ví dụ: "SINGLE")
    difficulty: '',
    categoryId: '',
    answers: [{ tempId: 1, content: '', isCorrect: true }],
  });

  const [options, setOptions] = useState<{
    types: Option[];
    difficulties: Option[];
    categories: Option[];
  }>({
    types: [],
    difficulties: [],
    categories: [],
  });
  const [optionsLoading, setOptionsLoading] = useState(true);
  const router = useRouter();

  // --- DATA FETCHING for dropdowns ---
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const [typesRes, difficultiesRes, categoriesRes] = await Promise.all([
          fetchApi('/questions/question-types'),
          fetchApi('/questions/difficulties'),
          fetchApi('/categories'),
        ]);

        // Backend trả về: ["SINGLE", "MULTIPLE", "TRUE_FALSE"]
        // Frontend hiển thị đẹp hơn nhưng GIỮ NGUYÊN ID để gửi lại Backend
        const formattedTypes = typesRes.map((t: string) => {
            const nameMap: { [key: string]: string } = {
                'SINGLE': 'Single Choice (Chọn 1)',
                'MULTIPLE': 'Multiple Choice (Chọn nhiều)',
                'TRUE_FALSE': 'True / False'
            };
            return { id: t, name: nameMap[t] || t.replace('_', ' ') };
        });

        const formattedDifficulties = difficultiesRes.map((d: string) => ({ id: d, name: d }));

        // --- SỬA LỖI: Map categoriesRes thành formattedCategories ---
        const formattedCategories = categoriesRes.map((c: any) => ({
             id: c.id,
             name: c.name
        }));
        // -------------------------------------------------------------

        setOptions({
          types: formattedTypes,
          difficulties: formattedDifficulties,
          categories: formattedCategories, // Biến này giờ đã tồn tại
        });
      } catch (error) {
        toast.error('Không thể tải các tùy chọn cho form.');
        console.error("Failed to fetch form options", error);
      } finally {
        setOptionsLoading(false);
      }
    };
    fetchDropdownData();
  }, []);

  // --- FORM HANDLERS ---
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    // Tự động set đáp án cho TRUE_FALSE
    if (formData.type === 'TRUE_FALSE') {
      setFormData(prev => ({
        ...prev,
        answers: [
          { tempId: 1, content: 'True', isCorrect: true },
          { tempId: 2, content: 'False', isCorrect: false },
        ],
      }));
    } else if (formData.answers.length === 2 && formData.answers[0].content === 'True' && formData.answers[1].content === 'False') {
      // Reset khi chuyển từ TRUE_FALSE sang dạng khác
      setFormData(prev => ({
        ...prev,
        answers: [{ tempId: 1, content: '', isCorrect: true }],
      }));
    }
  }, [formData.type]);

  const handleAnswerChange = (tempId: number, field: 'content' | 'isCorrect', value: string | boolean) => {
    setFormData(prev => {
      let newAnswers = [...prev.answers];

      // Nếu là Single Choice hoặc True/False, chọn 1 cái đúng thì các cái khác thành sai
      if ((prev.type === 'SINGLE' || prev.type === 'TRUE_FALSE') && field === 'isCorrect' && value === true) {
        newAnswers = newAnswers.map(ans => ({ ...ans, isCorrect: false }));
      }

      const answerIndex = newAnswers.findIndex(a => a.tempId === tempId);
      if (answerIndex > -1) {
        if (field === 'content') {
          newAnswers[answerIndex].content = value as string;
        } else if (field === 'isCorrect') {
          newAnswers[answerIndex].isCorrect = value as boolean;
        }
      }
      return { ...prev, answers: newAnswers };
    });
  };

  const addAnswer = () => {
    setFormData(prev => ({
      ...prev,
      answers: [...prev.answers, { tempId: Date.now(), content: '', isCorrect: false }],
    }));
  };

  const removeAnswer = (tempId: number) => {
    if (formData.answers.length <= 1) {
      toast.error('Câu hỏi phải có ít nhất một đáp án.');
      return;
    }
    setFormData(prev => ({
      ...prev,
      answers: prev.answers.filter(a => a.tempId !== tempId),
    }));
  };

const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validation cơ bản
    if (formData.answers.every(a => !a.isCorrect)) {
      toast.error('Phải có ít nhất một đáp án đúng.');
      return;
    }

    // Gửi dữ liệu thô ra ngoài để component cha xử lý
    onSubmit(formData);
  };

  const isDisabled = isLoading || optionsLoading;
  const isTrueFalse = formData.type === 'TRUE_FALSE';

  return (
    <div className="w-full max-w-3xl mx-auto p-6 sm:p-8 bg-white shadow-2xl rounded-2xl border border-gray-100">
      <button onClick={() => router.back()} className="text-sm text-purple-600 hover:underline mb-6">
        &larr; Quay lại danh sách
      </button>
      <h1 className="text-3xl font-extrabold mb-8 text-purple-800 text-center">
        {isEdit ? 'Cập nhật câu hỏi' : 'Tạo câu hỏi mới'}
      </h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Tiêu đề</label>
          <textarea
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            disabled={isDisabled}
            className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-purple-500 focus:border-purple-500 transition duration-150 disabled:bg-gray-50 min-h-[100px]"
            placeholder="Nhập nội dung câu hỏi..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Question Type */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Loại câu hỏi</label>
              <select name="type" value={formData.type} onChange={handleChange} required disabled={isDisabled} className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-3 bg-white focus:ring-purple-500 focus:border-purple-500 transition">
                <option value="">{optionsLoading ? "Tải..." : "Chọn loại"}</option>
                {options.types.map(opt => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
              </select>
            </div>
            {/* Difficulty */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Độ khó</label>
                <select name="difficulty" value={formData.difficulty} onChange={handleChange} required disabled={isDisabled} className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-3 bg-white focus:ring-purple-500 focus:border-purple-500 transition">
                    <option value="">{optionsLoading ? "Tải..." : "Chọn độ khó"}</option>
                    {options.difficulties.map(opt => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
                </select>
            </div>
            {/* Category */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Danh mục</label>
                <select name="categoryId" value={formData.categoryId} onChange={handleChange} required disabled={isDisabled} className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-3 bg-white focus:ring-purple-500 focus:border-purple-500 transition">
                    <option value="">{optionsLoading ? "Tải..." : "Chọn danh mục"}</option>
                    {options.categories.map(opt => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
                </select>
            </div>
        </div>

        {/* Answers Section */}
        <div className="space-y-4 rounded-lg border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-800">Đáp án</h3>
            {formData.answers.map((answer, index) => (
            <div key={answer.tempId} className="flex items-center gap-3 p-2 rounded-md bg-gray-50">
                {/* Lưu ý: Check type là "SINGLE" thay vì "SINGLE_CHOICE" để khớp với value select */}
                {formData.type === 'SINGLE' || isTrueFalse ? (
                     <input type="radio" name="correctAnswerRadio" checked={answer.isCorrect} onChange={(e) => handleAnswerChange(answer.tempId, 'isCorrect', e.target.checked)} className="h-5 w-5 text-purple-600 focus:ring-purple-500 border-gray-300"/>
                ) : (
                    <input type="checkbox" checked={answer.isCorrect} onChange={(e) => handleAnswerChange(answer.tempId, 'isCorrect', e.target.checked)} className="h-5 w-5 rounded text-purple-600 focus:ring-purple-500 border-gray-300"/>
                )}
                <input
                    type="text"
                    value={answer.content}
                    onChange={(e) => handleAnswerChange(answer.tempId, 'content', e.target.value)}
                    placeholder={`Nội dung đáp án ${index + 1}`}
                    required
                    disabled={isTrueFalse}
                    className="flex-grow border border-gray-300 rounded-md shadow-sm p-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-100"
                />
                {!isTrueFalse && (
                    <button type="button" onClick={() => removeAnswer(answer.tempId)} className="text-red-500 hover:text-red-700 font-semibold p-1">Xóa</button>
                )}
            </div>
            ))}
            {!isTrueFalse && (
                <button type="button" onClick={addAnswer} className="mt-2 text-sm font-semibold text-purple-600 hover:text-purple-800">
                    + Thêm đáp án
                </button>
            )}
        </div>
        
        {/* Submit Button */}
        <button type="submit" disabled={isDisabled} className="w-full py-3 px-4 border border-transparent rounded-lg shadow-lg text-base font-medium text-white bg-purple-600 hover:bg-purple-700 transition duration-150 disabled:opacity-50 disabled:bg-purple-400">
          {isDisabled ? 'Đang xử lý...' : (isEdit ? 'Cập nhật câu hỏi' : 'Tạo câu hỏi')}
        </button>
      </form>
    </div>
  );
}