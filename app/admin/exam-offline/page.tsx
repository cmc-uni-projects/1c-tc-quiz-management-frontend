"use client";

import React, { useState, useEffect } from "react";
import { fetchApi } from "@/lib/apiClient";
import { toastError, toastSuccess } from "@/lib/toast";
import { useRouter } from 'next/navigation';

// TYPES

interface Option {
  id: number | string;
  name: string;
}

type ExamStatus = 'DRAFT' | 'PUBLISHED';

interface Category {
  id: number;
  name: string;
}

interface Exam {
  title: string;
  description: string;
  durationMinutes: number;
  categoryId: number;
  examLevel: string;
  status: ExamStatus;
}

// API Endpoints
const ENDPOINTS = {
  types: '/questions/question-types',
  difficulties: '/questions/difficulties',
  categories: '/categories/all',
};

// Helper function to fetch data
const fetchOptions = async (url: string, fallback: Option[] = []) => {
  try {
    const res = await fetchApi(url);
    // Assuming the API returns an array of objects with 'id' and 'name'
    const data = Array.isArray(res) ? res.map((item: any) => {
      if (typeof item === 'string') {
        return { id: item, name: item };
      }
      return { id: item.id || item.name, name: item.name };
    }) : fallback;
    return data;
  } catch (error) {
    console.error(`Error fetching options from ${url}:`, error);
    toastError(`Failed to load options from ${url.split('/').pop()}.`);
    return fallback;
  }
};


  const handleCreateExam = async (status: ExamStatus) => {
    // Helper to format local date and time for payload
    const formatLocal = (date: Date) => {
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const seconds = date.getSeconds().toString().padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    };

    // 1. Validation
    if (!examTitle.trim()) {
      toastError("Vui lòng nhập tên bài thi");
      return;
    }
    if (!examCategory) {
      toastError("Vui lòng chọn danh mục");
      return;
    }

    if (!examType) {
      toastError("Vui lòng chọn độ khó");
      return;
    }
    if (!duration || Number(duration) <= 0) {
      toastError("Thời gian làm bài phải lớn hơn 0");
      return;
    }

    if (!startDate || !startTime) {
      toastError("Vui lòng chọn ngày và giờ bắt đầu");
      return;
    }
    const now = new Date();
    const startDateTime = new Date(`${startDate}T${startTime}:00`);
    if (isNaN(startDateTime.getTime())) {
      toastError("Thời gian bắt đầu không hợp lệ");
      return;
    }

    // Check if start time is in the past, accounting for local timezone differences
    // Convert current time to a comparable format for local date comparison
    const nowLocalString = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}T${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    const nowLocal = new Date(nowLocalString);

    if (startDateTime < nowLocal) { // Compare local times
      toastError("Thời gian bắt đầu phải lớn hơn hoặc bằng thời gian hiện tại");
      return;
    }

    if (!endDate || !endTime) {
      toastError("Vui lòng chọn ngày và giờ kết thúc");
      return;
    }
    const endDateTime = new Date(`${endDate}T${endTime}:00`);
    if (isNaN(endDateTime.getTime())) {
      toastError("Thời gian kết thúc không hợp lệ");
      return;
    }
    if (endDateTime <= startDateTime) {
      toastError("Thời gian kết thúc phải sau thời gian bắt đầu");
      return;
    }

    setIsSubmitting(true);
    try {
      // 2. Prepare question IDs
      const questionIds: number[] = []; // Empty initially

      // 3. Create Exam
      const examPayload = {
        title: examTitle,
        categoryId: examCategory,
        durationMinutes: Number(duration),
        startTime: formatLocal(startDateTime), // Use local formatted string
        endTime: formatLocal(endDateTime),     // Use local formatted string
        questionIds: questionIds,
        description: `Bài thi ${examType}`,
        examLevel: examType.toUpperCase(),
        status: status
      };

      await fetchApi('/exams/create', {
        method: 'POST',
        body: examPayload
      });

      toastSuccess("Tạo bài thi thành công! (Đã lưu nháp)");
      router.push('/admin/list-exam');

    } catch (error: any) {
      console.error("Error creating exam:", error);
      toastError(error.message || "Có lỗi xảy ra khi tạo bài thi");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#F5F5F5] text-gray-900">
      <div className="flex-1 flex flex-col">
        <main className="flex-1 overflow-y-auto px-10 py-8">
          <section className="bg-white rounded-2xl shadow p-8 mb-6">
            <h2 className="text-2xl font-semibold text-center mb-8">
              Tạo bài thi offline - Admin
            </h2>

            {/* Các input đầu */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm mb-1">Tên bài thi</label>
                <input
                  type="text"
                  value={examTitle}
                  onChange={(e) => setExamTitle(e.target.value)}
                  className="w-full border px-3 py-2 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Loại đề thi</label>
                <select
                  value={examType}
                  onChange={(e) => setExamType(e.target.value)}
                  className="w-full border px-3 py-2 rounded-md bg-white"
                  disabled={loadingOptions}
                >
                  <option value="">{loadingOptions ? "Đang tải..." : "Chọn độ khó"}</option>
                  {difficultyOptions.map(opt => (
                    <option key={opt.id} value={opt.id}>{opt.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm mb-1">Danh mục bài thi</label>
                <select
                  value={examCategory}
                  onChange={(e) => setExamCategory(e.target.value)}
                  className="w-full border px-3 py-2 rounded-md bg-white"
                  disabled={loadingOptions}
                >
                  <option value="">{loadingOptions ? "Đang tải..." : "Chọn danh mục"}</option>
                  {categoryOptions.map(opt => (
                    <option key={opt.id} value={opt.id}>{opt.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Thời gian nộp bài */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Thời gian nộp bài
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-sm">Khoảng thời gian:</span>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) =>
                      setDuration(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    className="w-20 border px-2 py-1 rounded-md"
                    min="1"
                  />
                  <span>Phút</span>
                </div>
              </div>

              {/* Bắt đầu */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm mb-1">Thời gian bắt đầu:</p>
                  <div className="flex gap-2">
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-32 border px-2 py-1 rounded-md"
                    />
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="border px-2 py-1 rounded-md"
                    />
                  </div>
                </div>

                {/* Kết thúc */}
                <div>
                  <p className="text-sm mb-1">Thời gian kết thúc:</p>
                  <div className="flex gap-2">
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-32 border px-2 py-1 rounded-md"
                    />
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="border px-2 py-1 rounded-md"
                    />
                  </div>
              </div>


        {/* NÚT LƯU – ĐĂNG BÀI */}
        <div className="mt-6 flex justify-end gap-4">
          <button
            onClick={() => router.back()}
            className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Hủy
          </button>

          <button
            onClick={() => handleCreateExam('DRAFT')}
            disabled={isSubmitting}
            className="px-6 py-2 bg-purple-700 text-white rounded-md hover:bg-purple-800 disabled:opacity-50"
          >
            {isSubmitting ? "Đang xử lý..." : "Tạo bài thi"}
          </button>
        </div>
      </main>
    </div>
  </div>
);
}
