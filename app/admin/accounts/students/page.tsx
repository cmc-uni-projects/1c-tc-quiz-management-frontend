'use client';

import React, { useState } from 'react';
import { MagnifyingGlassIcon, ChevronLeftIcon, ChevronRightIcon, UserIcon } from '@heroicons/react/24/outline';
import Swal from 'sweetalert2';

// Màu sắc theo layout
const PRIMARY_COLOR = "#6A1B9A";
const LOGO_TEXT_COLOR = "#E33AEC";
const MAIN_CONTENT_BG = "#6D0446";
const SEARCH_BAR_BG = "#E33AEC";
const BUTTON_COLOR = "#9453C9";

// Dữ liệu mẫu học sinh
const mockStudents = [
  { id: 1, email: "hocsinh1@example.com", name: "Nguyễn Văn X", createdDate: "01/01/2025", lastLogin: "09/11/2025 10:30", status: "Hoạt động" },
  { id: 2, email: "hocsinh2@example.com", name: "Trần Thị Y", createdDate: "05/01/2025", lastLogin: "08/11/2025 15:20", status: "Hoạt động" },
  { id: 3, email: "hocsinh3@example.com", name: "Lê Văn Z", createdDate: "10/01/2025", lastLogin: "07/11/2025 09:15", status: "Hoạt động" },
  { id: 4, email: "hocsinh4@example.com", name: "Phạm Thị W", createdDate: "15/01/2025", lastLogin: "06/11/2025 14:45", status: "Tạm khóa" },
  { id: 5, email: "hocsinh5@example.com", name: "Hoàng Văn V", createdDate: "20/01/2025", lastLogin: "05/11/2025 11:00", status: "Hoạt động" },
];

const StudentAccountsPage = () => {
  const [searchEmail, setSearchEmail] = useState('');
  const [searchName, setSearchName] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [students] = useState(mockStudents);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  
  const itemsPerPage = 20;
  const totalPages = Math.ceil(students.length / itemsPerPage);

  // Lọc học sinh
  const filteredStudents = students.filter(student => {
    const emailMatch = student.email.toLowerCase().includes(searchEmail.toLowerCase());
    const nameMatch = student.name.toLowerCase().includes(searchName.toLowerCase());
    const statusMatch = statusFilter === 'all' || student.status === statusFilter;
    return emailMatch && nameMatch && statusMatch;
  });

  const handleSearch = () => {
    console.log('Tìm kiếm:', { searchEmail, searchName, statusFilter });
  };

  const handleDelete = (id: number) => {
    Swal.fire({
      title: 'Xác nhận xóa',
      text: 'Bạn có chắc chắn muốn xóa học sinh này?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy'
    }).then((result) => {
      if (result.isConfirmed) {
        console.log('Xóa học sinh:', id);
        Swal.fire(
          'Đã xóa!',
          'Học sinh đã được xóa thành công.',
          'success'
        );
      }
    });
  };

  return (
    <div className="flex-1 p-6" style={{ backgroundColor: MAIN_CONTENT_BG }}>
        {/* Thanh tìm kiếm */}
        <div className="bg-white rounded-lg p-6 mb-6 shadow">
          <h2 className="text-gray-800 text-xl font-bold mb-4">Tìm kiếm học sinh</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            {/* Tìm Email */}
            <div>
              <input
                type="text"
                placeholder="Nhập Email..."
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                className="w-full px-4 py-2 rounded-full border border-gray-300 bg-white text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>

            {/* Tìm Tên */}
            <div>
              <input
                type="text"
                placeholder="Nhập tên hiển thị..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className="w-full px-4 py-2 rounded-full border border-gray-300 bg-white text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>

            {/* Chọn trạng thái */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 rounded-full border border-gray-300 bg-white text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
              >
                <option value="all">Chọn trạng thái</option>
                <option value="Hoạt động">Hoạt động</option>
                <option value="Tạm khóa">Tạm khóa</option>
              </select>
            </div>

            {/* Nút tìm kiếm */}
            <div className="flex justify-end">
              <button
                onClick={handleSearch}
                className="px-6 py-1.5 rounded-full text-white text-sm font-semibold hover:brightness-110 transition whitespace-nowrap"
                style={{ backgroundColor: BUTTON_COLOR }}
              >
                Tìm kiếm
              </button>
            </div>
          </div>
        </div>

        {/* Bảng danh sách */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Tiêu đề bảng */}
          <div className="p-4 border-b border-gray-200">
            <p className="text-sm text-gray-600">
              Hiển thị {filteredStudents.length}/50 học sinh (Trang {currentPage}/1)
            </p>
          </div>

          {/* Bảng */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">STT</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Tên hiển thị</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Ngày tạo tài khoản</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Lượt truy cập cuối</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Trạng thái</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredStudents.map((student, index) => (
                  <tr key={student.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 text-sm text-gray-700">{index + 1}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{student.id}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{student.email}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{student.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{student.createdDate}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{student.lastLogin}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        student.status === 'Hoạt động' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {student.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <button
                        onClick={() => handleDelete(student.id)}
                        className="px-3 py-1 bg-red-500 text-white rounded text-xs font-semibold hover:bg-red-600 transition"
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Phân trang */}
          <div className="p-4 border-t border-gray-200 flex justify-center items-center gap-1">
            {/* Nút về trang đầu */}
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-3 py-2 border border-gray-300 bg-white text-gray-700 text-sm hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              «
            </button>
            
            {/* Nút trang trước */}
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 border border-gray-300 bg-white text-gray-700 text-sm hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              ‹
            </button>
            
            {/* Các nút số trang */}
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i + 1}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-4 py-2 border text-sm transition ${
                  currentPage === i + 1
                    ? 'bg-white text-blue-600 border-blue-500 font-semibold'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {i + 1}
              </button>
            ))}

            {/* Nút trang sau */}
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 border border-gray-300 bg-white text-gray-700 text-sm hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              ›
            </button>
            
            {/* Nút về trang cuối */}
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-3 py-2 border border-gray-300 bg-white text-gray-700 text-sm hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              »
            </button>
          </div>
        </div>
    </div>
  );
};

export default StudentAccountsPage;