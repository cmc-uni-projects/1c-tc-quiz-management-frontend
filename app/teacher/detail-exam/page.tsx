"use client";

import React from "react";
import { useRouter } from "next/navigation";

// ICON
const ClockIcon = () => <span>🕒</span>;
const CalendarIcon = () => <span>📅</span>;

export default function DetailExamPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col">

      <main className="flex-1 px-10 py-8">

        {/* ============= 2 TAB PHÍA TRÊN ============ */}
        <div className="border-b border-gray-300 mb-6 flex gap-8 text-sm font-medium">
          <button className="pb-2 border-b-2 border-black">
            Bài thi
          </button>

          <button
            onClick={() => router.push("/teacher/list-history-exam")}
            className="pb-2 text-gray-500 hover:text-black"
          >
            Danh sách lịch sử thi
          </button>
        </div>

        {/* ============ FORM THÔNG TIN BÀI THI ============ */}
     <div className="bg-white rounded-xl p-8 mb-8 max-w-6xl shadow-sm w-full">


          {/* Tên bài thi */}
          <div className="mb-5">
            <label className="block text-sm mb-1 text-gray-600">
              Tên bài thi
            </label>
            <input
              value="ABC"
              readOnly
              className="w-full border border-gray-300 rounded-md px-4 py-2 bg-[#F9FAFB]"
            />
          </div>

          {/* Số lượng + loại đề */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm mb-1 text-gray-600">
                Số lượng câu hỏi
              </label>
              <input
                value="20"
                readOnly
                className="w-full border border-gray-300 rounded-md px-4 py-2 bg-[#F9FAFB]"
              />
            </div>

            <div>
              <label className="block text-sm mb-1 text-gray-600">
                Loại đề thi
              </label>
              <input
                value="Khó"
                readOnly
                className="w-full border border-gray-300 rounded-md px-4 py-2 bg-[#F9FAFB]"
              />
            </div>
          </div>

          {/* Thời gian nộp bài */}
          <h3 className="font-semibold mb-3">Thời gian nộp bài</h3>

          {/* Khoảng thời gian */}
          <div className="flex items-center gap-3 mb-6">
            <span className="text-sm">Khoảng thời gian:</span>
            <input
              value="30"
              readOnly
              className="w-20 border border-gray-300 rounded-md px-3 py-1 bg-[#F9FAFB] text-center"
            />
            <span className="text-sm">Minute</span>
          </div>

          {/* Thời gian bắt đầu + kết thúc */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm mb-1 text-gray-600">
                Thời gian bắt đầu
              </label>
              <div className="flex gap-2">
                <input
                  value="12:00 AM"
                  readOnly
                  className="border px-3 py-2 rounded-md bg-[#F9FAFB] w-28"
                />
                <input
                  value="16/11/2025"
                  readOnly
                  className="border px-3 py-2 rounded-md bg-[#F9FAFB] w-36"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm mb-1 text-gray-600">
                Thời gian kết thúc
              </label>
              <div className="flex gap-2">
                <input
                  value="02:00 AM"
                  readOnly
                  className="border px-3 py-2 rounded-md bg-[#F9FAFB] w-28"
                />
                <input
                  value="16/11/2025"
                  readOnly
                  className="border px-3 py-2 rounded-md bg-[#F9FAFB] w-36"
                />
              </div>
            </div>
          </div>

        </div>

        {/* ============ DANH MỤC + CÂU HỎI ============ */}
     <div className="bg-white p-8 rounded-xl shadow max-w-6xl w-full">


          <p className="font-semibold mb-4">
            Danh mục: abc
          </p>

          <div>
            <p className="mb-3 font-medium">
              Câu 1: Hãy chọn đáp án đúng
              <span className="text-red-500 ml-2 font-semibold">
                Khó
              </span>
            </p>

            <div className="space-y-3">
              <label className="flex items-center gap-3 text-gray-700">
                <input type="radio" disabled />
                <span>Đáp án 1</span>
              </label>

              <label className="flex items-center gap-3 text-[#A53AEC] font-semibold">
                <input type="radio" checked readOnly />
                <span>Đáp án 2</span>
              </label>
            </div>
          </div>

        </div>

      </main>

      {/* FOOTER */}
      <footer className="bg-[#F5F5F5] border-t border-gray-200 text-center text-sm text-gray-500 py-6">
        © 2025 QuizzZone. Mọi quyền được bảo lưu.
      </footer>

    </div>
  );
}
