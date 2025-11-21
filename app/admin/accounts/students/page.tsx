"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { MagnifyingGlassIcon, ChevronLeftIcon, ChevronRightIcon, UserIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

// =========================================================
// API CLIENT UTILITIES (Copied from CategoriesPage for completeness)
// =========================================================

/** Custom error class for API errors */
class ApiError extends Error {
  constructor(message, status, payload) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

/**
 * Utility function to retrieve the JWT token from localStorage.
 * Assumes the token is stored under the key 'jwtToken'.
 * @returns {string | null} The JWT token or null if not found.
 */
const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('jwt');
  }
  return null;
};

/**
 * A wrapper around the global fetch function for handling JSON requests/responses
 * and error handling in a structured way.
 * * FIX: Added logic to retrieve JWT and attach it to the Authorization header.
 * * @param {string} url The API endpoint URL.
 * @param {object} options Fetch options including method, headers, and body.
 * @returns {Promise<any>} The parsed JSON data from the successful response.
 */
async function fetchApi(url, options = {}) {
  const token = getAuthToken();

  const defaultHeaders = {
    'Content-Type': 'application/json',
    // Đính kèm token JWT vào header
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };

  const config = {
    method: options.method || 'GET',
    headers: {
      ...defaultHeaders,
      ...(options.headers || {}),
    },
  };

  if (options.body) {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(url, config);
  const isJson = response.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const errorPayload = isJson ? data : { message: data };
    const errorMessage = errorPayload.message || response.statusText;
    throw new ApiError(errorMessage, response.status, errorPayload);
  }

  return data;
}

// =========================================================
// CONSTANTS AND UTILITIES
// =========================================================

// Màu sắc theo layout
const PRIMARY_COLOR = "#6A1B9A";
const LOGO_TEXT_COLOR = "#E33AEC";
const MAIN_CONTENT_BG = "#6D0446";
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
  status?: string; // 'ACTIVE', 'LOCKED', hoặc undefined/null
  page?: number;
  size?: number;
}) {
  const queryParams = new URLSearchParams();
  if (params.email) queryParams.append('email', params.email);
  if (params.username) queryParams.append('username', params.username);
  if (params.status && params.status !== 'all') queryParams.append('status', params.status);

  queryParams.append('page', String(params.page || 0));
  queryParams.append('size', String(params.size || 20));
  queryParams.append('sort', 'createdAt,desc');

  // URL đã đúng: /api/admin/accounts/students
  const url = `/api/admin/accounts/students?${queryParams.toString()}`;
  const data = await fetchApi(url);
  return data;
}

// Hàm xóa học sinh
async function deleteStudentInBackend(id: number) {
  // URL đã đúng: /api/admin/accounts/students/{id}
  await fetchApi(`/api/admin/accounts/students/${id}`, {
    method: 'DELETE',
  });
}

// Hàm format ngày
const formatDate = (dateString: string | null) => {
  if (!dateString) return 'Chưa có';
  try {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (e) {
    return 'Lỗi định dạng';
  }
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
  const [statusFilter, setStatusFilter] = useState('all'); // Giá trị hiển thị: all, Hoạt động, Tạm khóa

  // Applied search states (giá trị thực tế dùng để tìm kiếm - 'ACTIVE', 'LOCKED', 'all')
  const [appliedEmail, setAppliedEmail] = useState('');
  const [appliedName, setAppliedName] = useState('');
  const [appliedStatus, setAppliedStatus] = useState('all');

  const [currentPage, setCurrentPage] = useState(0);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  const itemsPerPage = 20;

  // State cho custom confirmation modal
  const [confirmDeleteStudent, setConfirmDeleteStudent] = useState<Student | null>(null);

  // Hàm chuyển đổi trạng thái hiển thị sang giá trị API
  const getApiStatus = (displayStatus: string) => {
      switch(displayStatus) {
          case 'Hoạt động': return 'ACTIVE';
          case 'Tạm khóa': return 'LOCKED';
          default: return 'all';
      }
  }

  // Fetch học sinh từ backend
  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchStudentsFromBackend({
        email: appliedEmail || undefined,
        username: appliedName || undefined,
        status: appliedStatus !== 'all' ? appliedStatus : undefined,
        page: currentPage,
        size: itemsPerPage,
      });

      // Lấy data từ content hoặc sử dụng data nếu API trả về mảng trực tiếp
      const content = Array.isArray(data?.content) ? data.content : Array.isArray(data) ? data : [];

      setStudents(content);

      // Xử lý thông tin phân trang từ response
      if (typeof data.totalPages === "number") setTotalPages(data.totalPages || 1);
      if (typeof data.totalElements === "number") setTotalElements(data.totalElements || content.length);
      else if (content.length > 0 && totalElements === 0) {
        // Fallback nếu API không trả về totalPages/totalElements
        setTotalPages(1);
        setTotalElements(content.length);
      }

    } catch (error: any) {
      console.error('Error fetching students:', error);
      // Hiển thị toast.error cho các lỗi 403/401/404 cụ thể hơn
      if (error.status === 403 || error.status === 401) {
          toast.error("Truy cập bị từ chối. Vui lòng đăng nhập lại hoặc kiểm tra quyền Admin.");
      } else {
          toast.error(error.message || 'Không thể tải danh sách học sinh');
      }
      setStudents([]);
      setTotalPages(1);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  }, [appliedEmail, appliedName, appliedStatus, currentPage, totalElements]);

  // Load data khi component mount hoặc khi currentPage thay đổi
  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Hàm xử lý khi ấn nút tìm kiếm
  const handleSearch = () => {
    setAppliedEmail(searchEmail);
    setAppliedName(searchName);
    // Chuyển giá trị hiển thị sang giá trị API
    setAppliedStatus(getApiStatus(statusFilter));
    setCurrentPage(0); // Reset về trang đầu tiên
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

  // Mở modal xác nhận xóa
  const handleDelete = (id: number) => {
    const student = students.find(s => s.studentId === id);
    if (student) {
      setConfirmDeleteStudent(student);
    }
  };

  // Đóng modal xác nhận xóa
  const cancelDelete = () => {
    setConfirmDeleteStudent(null);
  };

  // Xác nhận và thực hiện xóa
  const confirmDelete = async () => {
    if (!confirmDeleteStudent) return;

    const idToDelete = confirmDeleteStudent.studentId;
    setConfirmDeleteStudent(null); // Đóng modal ngay lập tức

    try {
      setLoading(true);
      await deleteStudentInBackend(idToDelete);
      toast.success('Đã xóa học sinh thành công!');

      // Sau khi xóa, fetch lại data, nếu trang hiện tại hết học sinh thì quay lại trang trước
      if (students.length === 1 && currentPage > 0) {
        setCurrentPage(p => p - 1);
      } else {
        await fetchStudents();
      }
    } catch (error: any) {
      console.error('Error deleting student:', error);
      if (error.status === 403 || error.status === 401) {
          toast.error("Truy cập bị từ chối. Vui lòng đăng nhập lại hoặc kiểm tra quyền Admin.");
      } else {
          toast.error(error.message || 'Không thể xóa học sinh');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading && students.length === 0) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center min-h-screen" style={{ backgroundColor: MAIN_CONTENT_BG }}>
        <div className="text-white text-xl">Đang tải danh sách học sinh...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 min-h-screen" style={{ backgroundColor: MAIN_CONTENT_BG }}>
      {/* Thanh tìm kiếm */}
      <div className="bg-white rounded-xl p-6 mb-6 shadow-2xl">
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
              <option value="all">Tất cả trạng thái</option>
              <option value="Hoạt động">Hoạt động</option>
              <option value="Tạm khóa">Tạm khóa</option>
            </select>
          </div>

          {/* Nút tìm kiếm và xóa bộ lọc */}
          <div className="flex justify-end gap-2">
            <button
              onClick={handleClearFilter}
              className="px-4 py-1.5 rounded-full text-gray-700 bg-gray-200 text-sm font-semibold hover:bg-gray-300 transition whitespace-nowrap"
              disabled={loading}
            >
              Xóa bộ lọc
            </button>
            <button
              onClick={handleSearch}
              className="px-6 py-1.5 rounded-full text-white text-sm font-semibold hover:brightness-110 transition whitespace-nowrap disabled:opacity-50"
              style={{ backgroundColor: BUTTON_COLOR }}
              disabled={loading}
            >
              Tìm kiếm
            </button>
          </div>
        </div>
      </div>

      {/* Bảng danh sách */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Tiêu đề bảng */}
        <div className="p-4 border-b border-gray-200">
          <p className="text-sm text-gray-600 font-medium">
            Hiển thị {students.length} học sinh / Tổng: {totalElements} (Trang {currentPage + 1}/{totalPages})
          </p>
        </div>

        {/* Bảng */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">STT</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Tên hiển thị</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Ngày tạo TK</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Truy cập cuối</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Trạng thái</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {students.length === 0 && !loading ? (
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
                    <td className="px-4 py-3 text-sm text-gray-700 font-medium">{student.email}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{student.username}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{formatDate(student.createdAt)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{formatDate(student.lastVisit)}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(student.status)}`}>
                        {getStatusDisplay(student.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-sm">
                      <button
                        onClick={() => handleDelete(student.studentId)}
                        className="px-3 py-1 bg-red-500 text-white rounded-lg text-xs font-semibold hover:bg-red-600 transition disabled:opacity-50"
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
            className="px-2 py-1 rounded-full text-gray-400 hover:text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            ‹
          </button>

          {/* Các nút số trang */}
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i)}
              disabled={loading}
              className={`mx-1 w-8 h-8 flex items-center justify-center rounded-full text-sm font-semibold transition-colors
                ${
                  currentPage === i
                    ? 'bg-purple-700 text-white shadow-md'
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
            className="px-2 py-1 rounded-full text-gray-400 hover:text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            ›
          </button>

          {/* Nút về trang cuối */}
          <button
            onClick={() => setCurrentPage(totalPages - 1)}
            disabled={currentPage === totalPages - 1 || loading}
            className="px-2 py-1 rounded-full text-gray-400 hover:text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            »
          </button>
        </div>
      </div>

      {/* Custom Confirmation Modal Xóa */}
      {confirmDeleteStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 transition-opacity duration-300" onClick={cancelDelete}>
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl scale-100 transition-transform duration-300" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-xl font-bold text-red-600 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 stroke-red-600"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a2 2 0 0 1 2-2h2a2 0 0 1 2 2v2"/></svg>
                 Xác nhận xóa
              </h2>
              <button onClick={cancelDelete} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>

            <p className="text-gray-700 mb-6">
              Bạn có chắc chắn muốn xóa tài khoản học sinh
              <span className="font-semibold text-gray-900 mx-1">"{confirmDeleteStudent.username}"</span>
              với email
              <span className="font-semibold text-gray-900 mx-1">"{confirmDeleteStudent.email}"</span>?
              Hành động này không thể hoàn tác.
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition duration-150"
                disabled={loading}
              >
                Hủy
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-semibold transition duration-150 disabled:bg-red-300"
                disabled={loading}
              >
                {loading ? "Đang xóa..." : "Xóa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentAccountsPage;