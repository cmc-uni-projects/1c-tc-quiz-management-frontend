"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

// ===== ICON =====
const ClockIcon = () => <span>🕒</span>;
const CalendarIcon = () => <span>📅</span>;

const MoreIcon = () => (
  <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
    <circle cx="12" cy="6" r="2" />
    <circle cx="12" cy="12" r="2" />
    <circle cx="12" cy="18" r="2" />
  </svg>
);

// ===== DATA GIẢ (giống figma) =====
const historyExams = [
  {
    id: 1,
    title: "hii",
    startTime: "00:39 - 16/11/25",
    endTime: "01:39 - 16/11/25",
    duration: 10,
    questionCount: 10,
    status: "Đã kết thúc",
  },
];

export default function HistoryExamPage() {
  const router = useRouter();
  const [openMenu, setOpenMenu] = useState<number | null>(null);

  return (
  <div className="min-h-screen flex flex-col bg-[#F5F5F5]">


      {/* ================= CONTENT ================= */}
      <main className="flex-1 px-10 py-8">

        {/* ===== TAB ===== */}
        <div className="border-b border-gray-200 mb-6 flex gap-6 text-sm">
          <button
            onClick={() => router.push("/teacher/list-exam")}
            className="pb-2 text-gray-500 hover:text-black"
          >
            Danh sách bài thi
          </button>

          <button className="pb-2 border-b-2 border-black font-medium">
            Lịch sử
          </button>
        </div>

        {/* ===== FILTER ===== */}
      <div className="p-6 rounded-lg mb-8">


          <div className="flex flex-wrap items-end gap-4">

            <input
              placeholder="Nhập từ khóa tìm kiếm..."
              className="h-10 px-4 border border-gray-300 rounded-full bg-white w-[200px]"
            />

            <div className="flex flex-col">
              <label className="text-sm mb-1">Thời gian bắt đầu:</label>
              <input
                type="date"
                className="h-10 px-4 border border-gray-300 rounded-full bg-white w-[200px]"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-sm mb-1">Thời gian kết thúc:</label>
              <input
                type="date"
               className="h-10 px-4 border border-gray-300 rounded-full bg-white w-[200px]"
              />
            </div>

            <button className="bg-[#A53AEC] text-white px-6 py-2 rounded-full">
              Tìm kiếm
            </button>

          </div>

          {/* ===== CARD ===== */}
          {historyExams.map((exam) => (
            <div
              key={exam.id}
              className="mt-10 w-full max-w-xs bg-white border rounded-lg p-4 relative shadow"
            >
              <p className="font-semibold text-lg mb-2">{exam.title}</p>

              <div className="text-sm space-y-1">
                <p className="flex items-center gap-2">
                  <ClockIcon /> {exam.startTime}
                </p>

                <p className="flex items-center gap-2">
                  <CalendarIcon /> {exam.endTime}
                </p>

                <p>⏳ {exam.duration} Minutes</p>
                <p>📘 Questions: {exam.questionCount} Question</p>
              </div>

              {/* Trạng thái + xem chi tiết ở giữa */}
              <div className="flex flex-col items-center justify-center mt-4 gap-1">
                <span className="text-red-500 font-semibold flex items-center gap-1">
                  ● {exam.status}
                </span>

                <button
                onClick={() => router.push("/teacher/detail-exam")}
                className="text-sm text-blue-500 hover:underline"
                >
                Xem chi tiết
                </button>

              </div>

              {/* nút 3 chấm */}
              <button
                onClick={() =>
                  setOpenMenu(openMenu === exam.id ? null : exam.id)
                }
                className="absolute right-3 bottom-3"

              >
                <MoreIcon />
              </button>

              {/* MENU XÓA */}
              {openMenu === exam.id && (
  <div className="absolute right-3 bottom-12 bg-white border rounded-md shadow w-28 z-50">
    <button
      className="block w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
      onClick={() => setOpenMenu(null)}
    >
      Xóa bài thi
    </button>
  </div>
)}


            </div>
          ))}
        </div>
      </main>

      {/* ================= FOOTER ================= */}
      <footer className="bg-[#F5F5F5] border-t text-center text-sm text-gray-500 py-4">
        © 2025 QuizzZone. Mọi quyền được bảo lưu.
      </footer>

    </div>
  );
}
