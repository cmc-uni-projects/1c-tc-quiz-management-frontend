'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

// Định nghĩa kiểu dữ liệu cho Question Data
interface QuestionData {
  title: string;
  type: string;
  difficulty: string;
  answer: string;
  category: string;
}

interface QuestionFormProps {
  initialData?: QuestionData;
  isEdit: boolean;
  onSubmit: (data: QuestionData) => void;
}

// Định nghĩa kiểu dữ liệu cho Tùy chọn (để đồng nhất với QuestionFilters)
interface Option {
  id: number | string;
  name: string;
}

// Các Endpoint API (Sử dụng chung với QuestionFilters)
const ENDPOINTS = {
    types: '/api/questions/question-types',
    difficulties: '/api/questions/difficulties',
    categories: '/api/categories',
};

export default function QuestionForm({ initialData, isEdit, onSubmit }: QuestionFormProps) {
  const [formData, setFormData] = useState<QuestionData>(initialData || {
    title: '',
    type: '',
    difficulty: '',
    answer: '',
    category: '',
  });

  const [loading, setLoading] = useState(false);

  // State lưu trữ các tùy chọn tải từ API
  const [typeOptions, setTypeOptions] = useState<Option[]>([]);
  const [difficultyOptions, setDifficultyOptions] = useState<Option[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<Option[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(true);

  // Hàm helper để fetch dữ liệu
  const fetchOptions = async (url: string, fallback: Option[]) => {
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        return Array.isArray(data) ? data : fallback;
      }
    } catch (error) {
      console.warn(`Lỗi khi gọi API ${url}, sử dụng dữ liệu mặc định.`, error);
      toast.error(`Không thể tải tùy chọn từ ${url.split('/').pop()}.`);
    }
    return fallback;
  };

  // useEffect để tải dữ liệu khi component được mount
  useEffect(() => {
    const loadAllOptions = async () => {
      setOptionsLoading(true);

      const [types, difficulties, cats] = await Promise.all([
        fetchOptions(ENDPOINTS.types, FALLBACK_OPTIONS.types),
        fetchOptions(ENDPOINTS.difficulties, FALLBACK_OPTIONS.difficulties),
        fetchOptions(ENDPOINTS.categories, FALLBACK_OPTIONS.categories),
      ]);

      setTypeOptions(types);
      setDifficultyOptions(difficulties);
      setCategoryOptions(cats);
      setOptionsLoading(false);
    };

    loadAllOptions();
  }, []);

  // Đồng bộ dữ liệu ban đầu khi có initialData (dùng cho chế độ Sửa)
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Call onSubmit passed from parent page (chứa logic gọi API POST/PUT)
    onSubmit(formData);

    // Note: setLoading(false) should ideally be called after the parent page's submission logic completes
    // Giữ loading = true cho đến khi parent component xử lý xong
  };

  const buttonText = isEdit ? 'Cập nhật câu hỏi' : 'Thêm câu hỏi';
  const titleText = isEdit ? 'Cập nhật thông tin câu hỏi' : 'Thêm câu hỏi mới';
  const isDisabled = loading || optionsLoading;

  return (
    <div className="max-w-xl mx-auto p-8 bg-white shadow-xl rounded-xl border border-gray-100">
      <h1 className="text-3xl font-extrabold mb-8 text-purple-700 text-center">{titleText}</h1>
      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Tiêu đề */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Tiêu đề</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            disabled={isDisabled}
            className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-purple-500 focus:border-purple-500 transition duration-150 disabled:bg-gray-50"
            placeholder="Nhập tiêu đề câu hỏi"
          />
        </div>

        {/* Loại câu hỏi (Dropdown) */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Loại câu hỏi</label>
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            required
            disabled={isDisabled}
            className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-3 bg-white focus:ring-purple-500 focus:border-purple-500 transition duration-150 disabled:bg-gray-50"
          >
            <option value="">{optionsLoading ? "Đang tải tùy chọn..." : "Chọn loại câu hỏi"}</option>
            {typeOptions.map(opt => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
          </select>
        </div>

        {/* Độ khó (Dropdown) */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Độ khó</label>
          <select
            name="difficulty"
            value={formData.difficulty}
            onChange={handleChange}
            required
            disabled={isDisabled}
            className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-3 bg-white focus:ring-purple-500 focus:border-purple-500 transition duration-150 disabled:bg-gray-50"
          >
            <option value="">{optionsLoading ? "Đang tải tùy chọn..." : "Chọn độ khó"}</option>
            {difficultyOptions.map(opt => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
          </select>
        </div>

        {/* Đáp án */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Đáp án</label>
          <input
            type="text"
            name="answer"
            value={formData.answer}
            onChange={handleChange}
            required
            disabled={isDisabled}
            className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-purple-500 focus:border-purple-500 transition duration-150 disabled:bg-gray-50"
            placeholder="Nhập đáp án đúng"
          />
        </div>

        {/* Danh mục (Dropdown) */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Danh mục câu hỏi</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
            disabled={isDisabled}
            className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-3 bg-white focus:ring-purple-500 focus:border-purple-500 transition duration-150 disabled:bg-gray-50"
          >
            <option value="">{optionsLoading ? "Đang tải tùy chọn..." : "Chọn danh mục"}</option>
            {categoryOptions.map(opt => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
          </select>
        </div>

        {/* Nút Submit */}
        <button
          type="submit"
          disabled={isDisabled}
          className="w-full py-3 px-4 border border-transparent rounded-lg shadow-md text-base font-medium text-white bg-purple-600 hover:bg-purple-700 transition duration-150 disabled:opacity-50"
        >
          {isDisabled ? 'Đang tải...' : buttonText}
        </button>
      </form>
    </div>
  );
}