"use client";

import { useRouter } from "next/navigation";

export default function ListHistoryExamPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col">

      {/* ========== CONTENT ========== */}
      <main className="flex-1 px-10 py-8">

        {/* ===== TAB ===== */}
        <div className="border-b border-gray-300 mb-6 flex gap-8 text-sm font-medium">
          
          <button
            onClick={() => router.push("/teacher/detail-exam")}
            className="pb-2 text-gray-500 hover:text-black"
          >
            Bài thi
          </button>

          <button className="pb-2 border-b-2 border-black">
            Danh sách lịch sử thi
          </button>

        </div>

        {/* ===== BOX ===== */}
        <div className="bg-white rounded-xl p-6 shadow">

          {/* ===== SEARCH ===== */}
          <div className="flex items-center gap-4 mb-6">
            <input
              placeholder="Nhập từ khóa tìm kiếm..."
              className="h-10 px-4 border border-gray-300 rounded-full w-64"
            />

            <button className="bg-[#A53AEC] text-white px-6 py-2 rounded-full">
              Tìm kiếm
            </button>
          </div>

          {/* ===== TABLE ===== */}
          <div className="border border-gray-200 rounded-lg overflow-hidden min-h-[300px]">

            <table className="w-full text-sm text-center border-collapse">
              <thead className="pb-2 border-b-2 border-black">
                <tr className="bg-white font-semibold">

                  <th className="py-3 border">STT</th>
                  <th className="border">Tên sinh viên</th>
                  <th className="border">Thời gian thi</th>
                  <th className="border">Lượt thi</th>
                  <th className="border">Số câu đúng</th>
                  <th className="border">Điểm</th>
                  <th className="border">Thao tác</th>

                </tr>
              </thead>

              <tbody>
                {/* Vùng trống như figma */}
                <tr>
                  <td colSpan={7} className="h-52"></td>
                </tr>
              </tbody>
            </table>

          </div>

          {/* ===== PAGINATION ===== */}
          <div className="flex justify-center items-center gap-2 mt-6">
            <button className="border border-blue-500 text-blue-500 px-2 py-1">«</button>
            <button className="border border-blue-500 text-blue-500 px-2 py-1">‹</button>

            <button className="border-2 border-black px-4 py-1">1</button>

            <button className="border border-blue-500 text-blue-500 px-2 py-1">›</button>
            <button className="border border-blue-500 text-blue-500 px-2 py-1">»</button>
          </div>

        </div>

      </main>

      {/* ========== FOOTER ========== */}
      <footer className="bg-[#F5F5F5] border-t border-gray-200 text-center text-sm text-gray-500 py-6 mt-10">
        © 2025 QuizzZone. Mọi quyền được bảo lưu.
      </footer>

    </div>
  );
}
