"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

// ===== SVG ICONS =====
const ClockIcon = () => (
  <svg
    width="16"
    height="16"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    viewBox="0 0 24 24"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>
);

const CalendarIcon = () => (
  <svg
    width="16"
    height="16"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    viewBox="0 0 24 24"
  >
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const MoreIcon = () => (
  <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
    <circle cx="12" cy="6" r="2" />
    <circle cx="12" cy="12" r="2" />
    <circle cx="12" cy="18" r="2" />
  </svg>
);

// ===== MOCK DATA (chỉ 1 bài thi ĐANG CHỜ như figma) =====
const mockExams = [
  {
    id: 1,
    title: "hii",
    startTime: "00:39 - 16/11/25",
    endTime: "01:39 - 16/11/25",
    duration: 10,
    questionCount: 10,
    status: "PENDING",
  },
];

export default function TeacherExamListPage() {
  const [exams, setExams] = useState(mockExams);
  const [openMenu, setOpenMenu] = useState<number | null>(null);
  const router = useRouter();
  // Sắp xếp từ mới nhất → cũ nhất (để sau này em có nhiều bài thi)
  const sortedExams = [...exams].sort(
    (a, b) => Number(new Date(b.startTime)) - Number(new Date(a.startTime))
  );
  const pendingExams = sortedExams.filter((x) => x.status === "PENDING");

  const deleteExam = (id: number) => {
    setExams(exams.filter((e) => e.id !== id));
    setOpenMenu(null);
  };

  return (
    <div className="flex min-h-screen bg-[#F5F5F5] text-gray-900">
      {/* ============ SIDEBAR ============ */}
      <aside className="w-56 bg-[#F8F5FB] border-r border-gray-200 px-6 py-8">
        {/* Không còn chữ QuizzZone ở đây theo figma */}
        <ul className="space-y-4 text-sm">
          <li className="cursor-pointer">Trang chủ</li>
          <li className="cursor-pointer">Danh mục câu hỏi</li>
          <li className="cursor-pointer">Quản lý câu hỏi</li>
          <li className="font-semibold text-[#6D0446] cursor-pointer">
            Quản lý bài thi
          </li>
        </ul>
      </aside>

      {/* ============ MAIN ============ */}
      <div className="flex-1 flex flex-col bg-white">
        <main className="flex-1 px-10 py-8">
          {/* TAB DANH SÁCH BÀI THI / LỊCH SỬ */}
          <div className="border-b border-gray-200 mb-6 flex gap-6 text-sm">
            <button className="pb-2 border-b-2 border-black font-medium">
              Danh sách bài thi
            </button>
            <button className="pb-2 text-gray-500 hover:text-black">
              Lịch sử
            </button>
          </div>

          {/* ========== ĐANG CHỜ ========== */}
          <h2 className="text-xl font-semibold mb-4">Đang chờ</h2>

          <div className="flex flex-wrap gap-6">
            {pendingExams.map((exam) => (
              <div
                key={exam.id}
                className="w-64 bg-white rounded-lg shadow p-4 relative border border-gray-100"
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
                  <p>📘 Questions: {exam.questionCount}</p>
                </div>
                {/* Trạng thái + nút menu */}
                  <div className="flex items-center justify-between mt-3">
                  <span className="flex-1 text-center text-green-600 font-medium">
                   Đang chờ
                  </span>
                  <button
                  onClick={() =>
                  setOpenMenu(openMenu === exam.id ? null : exam.id)
                }
                  className="ml-2 p-1 rounded hover:bg-gray-100"
                >
                  <MoreIcon />
                  </button>
                  </div>

                {/* Dropdown menu */}
                {openMenu === exam.id && (
                  <div className="absolute right-0 top-8 bg-white shadow-lg border rounded-md w-32 py-2 z-20">
                    <button
                      onClick={() => deleteExam(exam.id)}
                      className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                    >
                      Xóa bài thi
                    </button>
                   <button
                   onClick={() => router.push("/teacher/update-exam")}
                   className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                   >
                   Cập nhật
                   </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* ========== ĐANG TẠO ========== */}
          <h2 className="text-xl font-semibold mt-10 mb-4">Đang tạo</h2>
          <div className="w-64 h-40 bg-white border border-gray-200 rounded-lg shadow-sm"></div>

          {/* ========== DANH SÁCH BÀI THI (TIÊU ĐỀ THÔI, CHƯA CÓ CARD) ========== */}
          <h2 className="text-xl font-semibold mt-10 mb-4">
            Danh sách bài thi
          </h2>
          {/* Hiện tại chưa hiển thị card nào ở phần này theo figma */}
        </main>

        {/* ============ FOOTER ============ */}
        <footer className="bg-[#F5F5F5] border-t border-gray-200 py-4 text-center text-gray-500 text-sm">
          © 2025 QuizzZone. Mọi quyền được bảo lưu.
        </footer>
      </div>
    </div>
  );
}
