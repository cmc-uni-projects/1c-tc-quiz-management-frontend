'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { MagnifyingGlassIcon, ChevronLeftIcon, ChevronRightIcon, UserIcon } from '@heroicons/react/24/outline';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';

// Cấu hình API
const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8082/api";

// Màu sắc theo layout
const PRIMARY_COLOR = "#6A1B9A";
const LOGO_TEXT_COLOR = "#E33AEC";
const MAIN_CONTENT_BG = "#6D0446";
const SEARCH_BAR_BG = "#E33AEC";
const BUTTON_COLOR = "#9453C9";

// Interface cho Student
interface Student {
  studentId: number;
  username: string;
  email: string;
  createdAt: string;
  lastVisit: string | null;
  status: 'ACTIVE' | 'LOCKED';
}

// Hàm lấy danh sách học sinh từ backend
async function fetchStudentsFromBackend(params: {
  email?: string;
  username?: string;
  page?: number;
  size?: number;
}) {
  const queryParams = new URLSearchParams();
  if (params.email) queryParams.append('email', params.email);
  if (params.username) queryParams.append('username', params.username);
  queryParams.append('page', String(params.page || 0));
  queryParams.append('size', String(params.size || 20));
  queryParams.append('sort', 'createdAt,desc');

  const res = await fetch(`${API_URL}/students?${queryParams.toString()}`, {
    credentials: 'include',
  });

  if (res.status === 401 || res.status === 403) {
    // Thông báo thân thiện khi chưa đăng nhập hoặc không có quyền
    throw new Error('Bạn chưa đăng nhập hoặc không có quyền truy cập. Vui lòng đăng nhập lại.');
  }

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Lỗi (${res.status}): ${errorText}`);
  }

  return await res.json();
}

// Hàm xóa học sinh
async function deleteStudentInBackend(id: number) {
  const res = await fetch(`${API_URL}/students/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Không thể xóa học sinh: ${errorText}`);
  }
}

// Hàm format ngày
const formatDate = (dateString: string | null) => {
  if (!dateString) return 'Chưa có';
  const date = new Date(dateString);
  return date.toLocaleString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Hàm format trạng thái
const getStatusDisplay = (status: string) => {
  const statusMap: Record<string, string> = {
    'ACTIVE': 'Hoạt động',
    'LOCKED': 'Tạm khóa',
  };
  return statusMap[status] || status;
};

// Hàm lấy màu trạng thái
const getStatusColor = (status: string) => {
  const colorMap: Record<string, string> = {
    'ACTIVE': 'bg-green-100 text-green-700',
    'LOCKED': 'bg-red-100 text-red-700',
  };
  return colorMap[status] || 'bg-gray-100 text-gray-700';
};

const StudentAccountsPage = () => {
  // Input states (giá trị trong ô input)
  const [searchEmail, setSearchEmail] = useState('');
  const [searchName, setSearchName] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Applied search states (giá trị thực tế dùng để tìm kiếm)
  const [appliedEmail, setAppliedEmail] = useState('');
  const [appliedName, setAppliedName] = useState('');
  const [appliedStatus, setAppliedStatus] = useState('all');
  
  const [currentPage, setCurrentPage] = useState(0);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  
  const itemsPerPage = 20;

  // Fetch học sinh từ backend
  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchStudentsFromBackend({
        email: appliedEmail || undefined,
        username: appliedName || undefined,
        page: currentPage,
        size: itemsPerPage,
      });

      // Filter by status if needed
      let filteredContent = data.content || [];
      if (appliedStatus !== 'all') {
        filteredContent = filteredContent.filter(
          (s: Student) => getStatusDisplay(s.status) === appliedStatus
        );
      }

      setStudents(filteredContent);
      setTotalPages(data.totalPages || 1);
      setTotalElements(data.totalElements || 0);
    } catch (error: any) {
      console.error('Error fetching students:', error);
      toast.error(error.message || 'Không thể tải danh sách học sinh');
    } finally {
      setLoading(false);
    }
  }, [appliedEmail, appliedName, appliedStatus, currentPage]);

  // Load data khi component mount hoặc khi currentPage thay đổi
  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Hàm xử lý khi ấn nút tìm kiếm
  const handleSearch = () => {
    setAppliedEmail(searchEmail);
    setAppliedName(searchName);
    setAppliedStatus(statusFilter);
    setCurrentPage(0);
  };

  // Hàm xử lý khi ấn Enter trong ô input
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Hàm xóa bộ lọc
  const handleClearFilter = () => {
    setSearchEmail('');
    setSearchName('');
    setStatusFilter('all');
    setAppliedEmail('');
    setAppliedName('');
    setAppliedStatus('all');
    setCurrentPage(0);
  };

  const handleDelete = async (id: number) => {
    const student = students.find(s => s.studentId === id);
    const result = await Swal.fire({
      title: 'Xác nhận xóa',
      text: `Bạn có chắc chắn muốn xóa học sinh "${student?.username}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy',
      background: '#fff',
      customClass: {
        confirmButton: 'px-4 py-2 rounded-md',
        cancelButton: 'px-4 py-2 rounded-md'
      }
    });

    if (result.isConfirmed) {
      try {
        await deleteStudentInBackend(id);
        toast.success('Đã xóa học sinh thành công!');
        fetchStudents();
      } catch (error: any) {
        console.error('Error deleting student:', error);
        toast.error(error.message || 'Không thể xóa học sinh');
      }
    }
  };

  if (loading && students.length === 0) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center" style={{ backgroundColor: MAIN_CONTENT_BG }}>
        <div className="text-white text-xl">Đang tải danh sách học sinh...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6" style={{ backgroundColor: MAIN_CONTENT_BG }}>
      {/* Thanh tìm kiếm */}
      <div className="bg-white rounded-lg p-6 mb-6 shadow">
        <h2 className="text-gray-800 text-xl font-bold mb-4">Tìm kiếm học sinh</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          {/* Tìm kiếm Email */}
          <div>
            <input
              type="text"
              placeholder="Nhập email..."
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full px-4 py-2 rounded-full border border-gray-300 bg-white text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>

          {/* Tìm kiếm Tên */}
          <div>
            <input
              type="text"
              placeholder="Nhập tên hiển thị..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              onKeyPress={handleKeyPress}
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

          {/* Nút tìm kiếm và xóa bộ lọc */}
          <div className="flex justify-end gap-2">
            <button
              onClick={handleClearFilter}
              className="px-4 py-1.5 rounded-full text-gray-700 bg-gray-200 text-sm font-semibold hover:bg-gray-300 transition whitespace-nowrap"
            >
              Xóa bộ lọc
            </button>
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
            Hiển thị {students.length} học sinh / Tổng: {totalElements} (Trang {currentPage + 1}/{totalPages})
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
              {students.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    Không tìm thấy học sinh nào
                  </td>
                </tr>
              ) : (
                students.map((student, index) => (
                  <tr key={student.studentId} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 text-sm text-gray-700">{currentPage * itemsPerPage + index + 1}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{student.studentId}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{student.email}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{student.username}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{formatDate(student.createdAt)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{formatDate(student.lastVisit)}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(student.status)}`}>
                        {getStatusDisplay(student.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <button
                        onClick={() => handleDelete(student.studentId)}
                        className="px-3 py-1 bg-red-500 text-white rounded text-xs font-semibold hover:bg-red-600 transition"
                        disabled={loading}
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Phân trang */}
        <div className="p-4 border-t border-gray-200 flex justify-center items-center gap-2 text-xs text-gray-500">
          {/* Nút về trang đầu */}
          <button
            onClick={() => setCurrentPage(0)}
            disabled={currentPage === 0 || loading}
className="px-2 py-1 rounded-full text-gray-400 hover:text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            «
          </button>

          {/* Nút trang trước */}
          <button
            onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
            disabled={currentPage === 0 || loading}
            className="px-2 py-1 rounded-full text-gray-300 hover:text-gray-500 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            ‹
          </button>

          {/* Các nút số trang */}
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i)}
              disabled={loading}
              className={`mx-1 w-8 h-8 flex items-center justify-center rounded-full text-sm font-semibold transition-colors
                ${
                  currentPage === i
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }
              `}
            >
              {i + 1}
            </button>
          ))}

          {/* Nút trang sau */}
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
            disabled={currentPage === totalPages - 1 || loading}
            className="px-2 py-1 rounded-full text-gray-300 hover:text-gray-500 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            ›
          </button>

          {/* Nút về trang cuối */}
          <button
            onClick={() => setCurrentPage(totalPages - 1)}
            disabled={currentPage === totalPages - 1 || loading}
            className="px-2 py-1 rounded-full text-gray-300 hover:text-gray-500 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            »
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentAccountsPage;