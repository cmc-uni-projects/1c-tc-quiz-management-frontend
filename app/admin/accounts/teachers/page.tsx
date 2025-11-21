"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { MagnifyingGlassIcon, ChevronLeftIcon, ChevronRightIcon, UserIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

class ApiError extends Error {
  constructor(message, status, payload) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

/**
 * @returns {string | null}
 */
const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('jwt');
  }
  return null;
};

/**
 * @param {string} url The API endpoint URL.
 * @param {object} options Fetch options including method, headers, and body.
 * @returns {Promise<any>} The parsed JSON data from the successful response.
 */
async function fetchApi(url, options = {}) {
  const token = getAuthToken();

  const defaultHeaders = {
    'Content-Type': 'application/json',
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

const PRIMARY_COLOR = "#6A1B9A";
const LOGO_TEXT_COLOR = "#E33AEC";
const MAIN_CONTENT_BG = "#6D0446";
const SEARCH_BAR_BG = "#E33AEC";
const BUTTON_COLOR = "#9453C9";

interface Teacher {
  teacherId: number;
  username: string;
  email: string;
  createdAt: string;
  lastVisit: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'LOCKED';
}

async function fetchTeachersFromBackend(params: {
  username?: string;
  email?: string;
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

     const url = `/api/admin/accounts/teachers?${queryParams.toString()}`;
       const data = await fetchApi(url);
       return data;
   }

async function deleteTeacherInBackend(id: number) {
  await fetchApi(`/api/admin/accounts/teachers/${id}`, {
    method: 'DELETE',
  });
}

const formatDate = (dateString: string | null | undefined) => {
  if (dateString === undefined) {
    console.warn('Trường lastVisit không tồn tại trong dữ liệu trả về');
    return 'Chưa kích hoạt';
  }

  if (dateString === null) {
    console.log('Giáo viên chưa đăng nhập lần nào hoặc hệ thống chưa cập nhật');
    return 'Chưa đăng nhập lần nào';
  }

  if (dateString.trim() === '') {
    return 'Chưa cập nhật';
  }

  try {
    let date: Date;

    if (/^\d+$/.test(dateString)) {
      date = new Date(parseInt(dateString));
    }
    else if (dateString.includes('T')) {
      date = new Date(dateString);
    }
    else {
      date = new Date(dateString);
    }

    if (isNaN(date.getTime())) {
      console.warn('Chuỗi ngày không hợp lệ:', dateString);
      return 'Ngày không hợp lệ';
    }

    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  } catch (error) {
    console.error('Lỗi khi định dạng ngày:', error, 'Chuỗi ngày:', dateString);
    return 'Lỗi định dạng';
  }
};

const getStatusDisplay = (status: string) => {
  const statusMap: Record<string, string> = {
    'PENDING': 'Chờ duyệt',
    'APPROVED': 'Hoạt động',
    'REJECTED': 'Bị từ chối',
    'LOCKED': 'Tạm khóa',
  };
  return statusMap[status] || status;
};

const getStatusColor = (status: string) => {
  const colorMap: Record<string, string> = {
    'PENDING': 'bg-yellow-100 text-yellow-700',
    'APPROVED': 'bg-green-100 text-green-700',
    'REJECTED': 'bg-red-100 text-red-700',
    'LOCKED': 'bg-gray-100 text-gray-700',
  };
  return colorMap[status] || 'bg-gray-100 text-gray-700';
};

const TeacherAccountsPage = () => {
  const [searchEmail, setSearchEmail] = useState('');
  const [searchName, setSearchName] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [appliedEmail, setAppliedEmail] = useState('');
  const [appliedName, setAppliedName] = useState('');
  const [appliedStatus, setAppliedStatus] = useState('all');

  const [currentPage, setCurrentPage] = useState(0);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  const itemsPerPage = 20;

  const fetchTeachers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchTeachersFromBackend({
        username: appliedName || undefined,
        email: appliedEmail || undefined,
        page: currentPage,
        size: itemsPerPage,
      });

      console.log('API Response:', data);

      let filteredContent = data.content || [];
      if (appliedStatus !== 'all') {
        const apiStatus = Object.keys(getStatusDisplay).find(key => getStatusDisplay[key as keyof typeof getStatusDisplay] === appliedStatus);

        filteredContent = filteredContent.filter(
          (t: Teacher) => t.status === apiStatus
        );
      }

      setTeachers(filteredContent);
      setTotalPages(data.totalPages || 1);
      setTotalElements(data.totalElements || 0);
    } catch (error: any) {
      console.error('Error fetching teachers:', error);
      if (error.status === 403 || error.status === 401) {
          toast.error("Truy cập bị từ chối. Vui lòng đăng nhập lại với tài khoản Admin.");
      } else {
          toast.error(error.message || 'Không thể tải danh sách giáo viên');
      }
      setTeachers([]);
      setTotalPages(1);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  }, [appliedEmail, appliedName, appliedStatus, currentPage]);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  const handleSearch = () => {
    setAppliedEmail(searchEmail);
    setAppliedName(searchName);
    setAppliedStatus(statusFilter);
    setCurrentPage(0);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

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
    const teacher = teachers.find(t => t.teacherId === id);
    const result = await Swal.fire({
      title: 'Xác nhận xóa',
      text: `Bạn có chắc chắn muốn xóa giáo viên "${teacher?.username}"?`,
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
        setLoading(true);
        await deleteTeacherInBackend(id);
        toast.success('Đã xóa giáo viên thành công!');
        if (teachers.length === 1 && currentPage > 0) {
            setCurrentPage(p => p - 1);
        } else {
            await fetchTeachers();
        }
      } catch (error: any) {
        console.error('Error deleting teacher:', error);
        if (error.status === 403 || error.status === 401) {
            toast.error("Truy cập bị từ chối. Vui lòng đăng nhập lại với tài khoản Admin.");
        } else {
            toast.error(error.message || 'Không thể xóa giáo viên');
        }
      } finally {
        setLoading(false);
      }
    }
  };

  if (loading && teachers.length === 0) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center" style={{ backgroundColor: MAIN_CONTENT_BG }}>
        <div className="text-white text-xl">Đang tải danh sách giáo viên...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 min-h-screen" style={{ backgroundColor: MAIN_CONTENT_BG }}>
      {/* Thanh tìm kiếm */}
      <div className="bg-white rounded-xl p-6 mb-6 shadow-2xl">
        <h2 className="text-gray-800 text-xl font-bold mb-4">Tìm kiếm giáo viên</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          {/* Tìm Email */}
          <div>
            <input
              type="text"
              placeholder="Nhập Email..."
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              onKeyPress={handleKeyPress}
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
              <option value="Chờ duyệt">Chờ duyệt</option>
              <option value="Hoạt động">Hoạt động</option>
              <option value="Bị từ chối">Bị từ chối</option>
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
              className="px-6 py-1.5 rounded-full text-white text-sm font-semibold hover:brightness-110 transition whitespace-nowrap"
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
            Hiển thị {teachers.length} giáo viên / Tổng: {totalElements} (Trang {currentPage + 1}/{totalPages})
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
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Ngày tạo tài khoản</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Lượt truy cập cuối</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Trạng thái</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {teachers.length === 0 && !loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    Không tìm thấy giáo viên nào
                  </td>
                </tr>
              ) : (
                teachers.map((teacher, index) => (
                  <tr key={teacher.teacherId} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 text-sm text-gray-700">{currentPage * itemsPerPage + index + 1}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{teacher.teacherId}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 font-medium">{teacher.email}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{teacher.username}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{formatDate(teacher.createdAt)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{formatDate(teacher.lastVisit)}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(teacher.status)}`}>
                        {getStatusDisplay(teacher.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-sm">
                      <button
                        onClick={() => handleDelete(teacher.teacherId)}
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
    </div>
  );
};

export default TeacherAccountsPage;