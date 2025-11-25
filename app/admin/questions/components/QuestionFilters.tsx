'use client';

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { fetchApi } from '@/lib/apiClient';

interface Filters {
  search: string;
  difficulty: string;
  type: string;
  category: string;
}

interface QuestionFiltersProps {
  initialFilters: Filters;
  onFilter: (filters: Filters) => void;
}

// Định nghĩa kiểu dữ liệu cho Tùy chọn
interface Option {
  id: number | string;
  name: string;
}

// Các Endpoint API - gọi trực tiếp backend endpoints
const ENDPOINTS = {
    types: '/questions/question-types',       // API lấy danh sách loại câu hỏi
    difficulties: '/questions/difficulties',  // API lấy danh sách độ khó
    categories: '/categories',      // API lấy danh sách danh mục
};

export default function QuestionFilters({ initialFilters, onFilter }: QuestionFiltersProps) {
  const [localFilters, setLocalFilters] = useState(initialFilters);

  // State lưu trữ các tùy chọn tải từ API
  const [typeOptions, setTypeOptions] = useState<Option[]>([]);
  const [difficultyOptions, setDifficultyOptions] = useState<Option[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(true);

  // Hàm helper để fetch dữ liệu từ backend
  const fetchOptions = async (url: string): Promise<Option[]> => {
    try {
      // Gọi API backend với JWT token
      const data = await fetchApi(url);
      // Giả định API trả về một mảng các đối tượng Option
      if (!Array.isArray(data)) return [];

      // Format categories từ backend response
      if (url === ENDPOINTS.categories) {
        return data.map((c: { id: number | string; name: string }) => ({ id: c.id, name: c.name }));
      }

      return data;
    } catch (error) {
      console.warn(`Lỗi khi gọi API ${url}:`, error);
      return [];
    }
  };

  // useEffect để tải dữ liệu khi component được mount
  useEffect(() => {
    const loadAllOptions = async () => {
      setLoading(true);

      // Gọi song song 3 API để tiết kiệm thời gian
      const [types, difficulties, cats] = await Promise.all([
        fetchOptions(ENDPOINTS.types),
        fetchOptions(ENDPOINTS.difficulties),
        fetchOptions(ENDPOINTS.categories),
      ]);

      setTypeOptions(types);
      setDifficultyOptions(difficulties);
      setCategoryOptions(cats);

      setLoading(false);
    };

    loadAllOptions();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setLocalFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onFilter(localFilters); // Gửi dữ liệu lọc lên component cha (page.tsx)
  };

  return (
    <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-4 p-4 bg-purple-50 rounded-xl shadow-inner mb-6">

      {/* 1. Tìm kiếm theo từ khóa */}
      <div className="flex-grow min-w-[200px]">
        <input
          type="text"
          name="search"
          value={localFilters.search}
          onChange={handleChange}
          placeholder="Nhập tiêu đề/ đáp án..."
          className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
        />
      </div>

      {/* 2. Chọn Độ khó */}
      <div className="min-w-[150px]">
        <select
          name="difficulty"
          value={localFilters.difficulty}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-lg p-2.5 bg-white focus:ring-purple-500 focus:border-purple-500 outline-none cursor-pointer"
        >
          <option value="">{loading ? "Đang tải..." : "Chọn độ khó"}</option>
          {difficultyOptions.map(opt => (
            <option key={opt.id} value={opt.id}>{opt.name}</option>
          ))}
        </select>
      </div>

      {/* 3. Chọn Loại câu hỏi */}
      <div className="min-w-[150px]">
        <select
          name="type"
          value={localFilters.type}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-lg p-2.5 bg-white focus:ring-purple-500 focus:border-purple-500 outline-none cursor-pointer"
        >
          <option value="">{loading ? "Đang tải..." : "Chọn loại câu hỏi"}</option>
          {typeOptions.map(opt => (
            <option key={opt.id} value={opt.id}>{opt.name}</option>
          ))}
        </select>
      </div>

      {/* 4. Chọn Danh mục */}
      <div className="min-w-[150px]">
        <select
          name="category"
          value={localFilters.category}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-lg p-2.5 bg-white focus:ring-purple-500 focus:border-purple-500 outline-none cursor-pointer"
        >
          <option value="">{loading ? "Đang tải..." : "Chọn danh mục"}</option>
          {categoryOptions.map(opt => (
            <option key={opt.id} value={opt.id}>{opt.name}</option>
          ))}
        </select>
      </div>

      {/* 5. Nút Tìm kiếm */}
      <button
        type="submit"
        className="px-6 py-2.5 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition duration-150 shadow-md active:transform active:scale-95"
      >
        Tìm kiếm
      </button>
    </form>
  );
}