"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/apiClient";
import { toastError, toastSuccess } from "@/lib/toast";

interface Category {
  id: number;
  name: string;
}

export default function CreateOnlineExamPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  // Form fields
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [level, setLevel] = useState("");
  const [durationMinutes, setDurationMinutes] = useState<number | "">("");
  const [maxParticipants, setMaxParticipants] = useState<number | "">("");

  useEffect(() => {
    fetchApi("/categories/all")
      .then(setCategories)
      .catch((err) => {
        console.error("Failed to fetch categories:", err);
        toastError("Không thể tải danh mục");
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!name.trim()) {
      toastError("Vui lòng nhập tên bài thi");
      return;
    }
    if (!categoryId) {
      toastError("Vui lòng chọn danh mục");
      return;
    }
    if (!level) {
      toastError("Vui lòng chọn độ khó");
      return;
    }
    if (!durationMinutes || durationMinutes <= 0) {
      toastError("Thời gian làm bài phải lớn hơn 0");
      return;
    }
    if (!maxParticipants || maxParticipants <= 0) {
      toastError("Số người tham gia phải lớn hơn 0");
      return;
    }

    const payload = {
      name: name.trim(),
      categoryId: parseInt(categoryId),
      level: level,
      durationMinutes: Number(durationMinutes),
      passingScore: 5, // Default passing score
      maxParticipants: Number(maxParticipants),
    };

    try {
      setLoading(true);
      const response = await fetchApi("/online-exams/create", {
        method: "POST",
        body: payload,
      });

      toastSuccess("Tạo bài thi thành công!");
      // Redirect to add questions page
      router.push(`/teacher/exam-online/edit/${response.id}`);
    } catch (error: any) {
      console.error("Failed to create exam:", error);
      toastError(error.message || "Không thể tạo bài thi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 px-10 py-8">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow p-8">
        <h1 className="text-2xl font-semibold text-center mb-8">
          Tạo bài thi Online
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tên bài thi */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Tên bài thi <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
              placeholder="Nhập tên bài thi..."
            />
          </div>

          {/* Row 1: Category + Level */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Danh mục */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Danh mục <span className="text-red-500">*</span>
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white"
              >
                <option value="">Chọn danh mục</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Độ khó */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Độ khó <span className="text-red-500">*</span>
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white"
              >
                <option value="">Chọn độ khó</option>
                <option value="EASY">Dễ</option>
                <option value="MEDIUM">Trung bình</option>
                <option value="HARD">Khó</option>
              </select>
            </div>
          </div>

          {/* Thời gian làm bài */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Thời gian làm bài (phút) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              value={durationMinutes}
              onChange={(e) =>
                setDurationMinutes(e.target.value === "" ? "" : Number(e.target.value))
              }
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
              placeholder="Nhập thời gian (ví dụ: 60)"
            />
          </div>

          {/* Số người tham gia */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Số người tham gia tối đa <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              value={maxParticipants}
              onChange={(e) =>
                setMaxParticipants(e.target.value === "" ? "" : Number(e.target.value))
              }
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
              placeholder="Nhập số người (ví dụ: 30)"
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={loading}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-[#A53AEC] text-white rounded-lg hover:bg-[#8B2FC9] disabled:opacity-50"
            >
              {loading ? "Đang tạo..." : "Tạo bài thi"}
            </button>
          </div>
        </form>

        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Lưu ý:</strong> Sau khi tạo bài thi, bạn sẽ được chuyển đến trang thêm câu hỏi.
            Bài thi sẽ ở trạng thái <strong>DRAFT</strong> cho đến khi bạn thêm câu hỏi và sẵn sàng bắt đầu.
          </p>
        </div>
      </div>
    </div>
  );
}