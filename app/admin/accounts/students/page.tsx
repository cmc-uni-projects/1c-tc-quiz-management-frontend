"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { MagnifyingGlassIcon, ChevronLeftIcon, ChevronRightIcon, UserIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

const TrashIcon = (props: React.SVGAttributes<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
    <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
  </svg>
);

const LockIcon = (props: React.SVGAttributes<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const UnlockIcon = (props: React.SVGAttributes<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 9.9-1" />
  </svg>
);

class ApiError extends Error {
  status: number;
  payload: any;

  constructor(message: string, status: number, payload: any) {
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
 * * @param {string} url The API endpoint URL.
 * @param {object} options Fetch options including method, headers, and body.
 * @returns {Promise<any>} The parsed JSON data from the successful response.
 */
async function fetchApi(url: string, options: any = {}) {
  const token = getAuthToken();

  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };

  const config: any = {
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
const BUTTON_COLOR = "#9453C9";
const PAGE_BG = "#F4F2FF";
const HERO_GRADIENT = "linear-gradient(135deg, #FFB6FF 0%, #8A46FF 100%)";
const TABLE_SHADOW = "0 25px 60px rgba(126, 62, 255, 0.18)";

interface Student {
  studentId: number;
  username: string;
  email: string;
  createdAt: string;
  lastVisit: string | null;
  status: 'ACTIVE' | 'LOCKED';
}

async function fetchStudentsFromBackend(params: {
  email?: string;
  username?: string;
  status?: string;
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

  const url = `/api/admin/accounts/students?${queryParams.toString()}`;
  const data = await fetchApi(url);
  return data;
}

async function deleteStudentInBackend(id: number) {
  await fetchApi(`/api/admin/accounts/students/${id}`, {
    method: 'DELETE',
  });
}

async function toggleStudentLockStatusInBackend(id: number, currentStatus: Student['status']) {
  if (currentStatus === 'ACTIVE') {
    await fetchApi(`/api/admin/accounts/students/${id}/lock`, { method: 'POST' });
  } else if (currentStatus === 'LOCKED') {
    await fetchApi(`/api/admin/accounts/students/${id}/unlock`, { method: 'POST' });
  }
}

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

const getStatusDisplay = (status: string) => {
  const statusMap: Record<string, string> = {
    'ACTIVE': 'Hoạt động',
    'LOCKED': 'Tạm khóa',
  };
  return statusMap[status] || status;
};

const getStatusColor = (status: string) => {
  const colorMap: Record<string, string> = {
    'ACTIVE': 'bg-emerald-100 text-emerald-700 border border-emerald-200 shadow-sm',
    'LOCKED': 'bg-amber-50 text-amber-700 border border-amber-200 shadow-sm',
  };
  return colorMap[status] || 'bg-gray-100 text-gray-700 border border-gray-200 shadow-sm';
};

const StudentAccountsPage = () => {
  const [searchEmail, setSearchEmail] = useState('');
  const [searchName, setSearchName] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [appliedEmail, setAppliedEmail] = useState('');
  const [appliedName, setAppliedName] = useState('');
  const [appliedStatus, setAppliedStatus] = useState('all');

  const [currentPage, setCurrentPage] = useState(0);
  const [students, setStudents] = useState<Student[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  const itemsPerPage = 20;

  const [loading, setLoading] = useState(false);

  const getApiStatus = (displayStatus: string) => {
    switch (displayStatus) {
      case 'Hoạt động': return 'ACTIVE';
      case 'Tạm khóa': return 'LOCKED';
      default: return 'all';
    }
  }

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

      const content = Array.isArray(data?.content) ? data.content : Array.isArray(data) ? data : [];

      // Sort by newest first (createdAt or lastVisit)
      content.sort((a: Student, b: Student) => {
        const dateA = new Date(a.createdAt || a.lastVisit || 0).getTime();
        const dateB = new Date(b.createdAt || b.lastVisit || 0).getTime();
        return dateB - dateA; // Newest first
      });

      setStudents(content);

      if (typeof data.totalPages === "number") setTotalPages(data.totalPages || 1);
      if (typeof data.totalElements === "number") setTotalElements(data.totalElements || content.length);
      else if (content.length > 0 && totalElements === 0) {
        setTotalPages(1);
        setTotalElements(content.length);
      }

    } catch (error: any) {
      console.error('Error fetching students:', error);
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

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleSearch = () => {
    setAppliedEmail(searchEmail);
    setAppliedName(searchName);
    setAppliedStatus(getApiStatus(statusFilter));
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

  const handleDelete = (id: number) => {
    const student = students.find((s: Student) => s.studentId === id);
    if (!student) return;

    Swal.fire({
      title: 'Xác nhận xóa',
      text: `Bạn có chắc chắn muốn xóa Học sinh "${student.username}" với email "${student.email}"?`,
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
    }).then((result) => {
      if (result.isConfirmed) {
        deleteStudentInBackend(id).then(() => {
          toast.success('Đã xóa học sinh thành công!');
          if (students.length === 1 && currentPage > 0) {
            setCurrentPage(p => p - 1);
          } else {
            fetchStudents();
          }
        }).catch((error: any) => {
          console.error('Error deleting student:', error);
          if (error.status === 403 || error.status === 401) {
            toast.error("Truy cập bị từ chối. Vui lòng đăng nhập lại hoặc kiểm tra quyền Admin.");
          } else {
            toast.error(error.message || 'Không thể xóa học sinh');
          }
        });
      }
    });
  };

  const handleToggleLock = async (student: Student) => {
    if (student.status !== 'ACTIVE' && student.status !== 'LOCKED') {
      toast.error('Chỉ có thể đổi trạng thái giữa Hoạt động và Tạm khóa.');
      return;
    }

    const isLocking = student.status === 'ACTIVE';
    const actionText = isLocking ? 'tạm khóa' : 'mở khóa';

    const result = await Swal.fire({
      title: `Xác nhận ${isLocking ? 'tạm khóa' : 'mở khóa'} tài khoản`,
      text: `Bạn có chắc chắn muốn ${actionText} tài khoản học sinh "${student.username}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Xác nhận',
      cancelButtonText: 'Hủy',
      background: '#fff',
      customClass: {
        confirmButton: 'px-4 py-2 rounded-md',
        cancelButton: 'px-4 py-2 rounded-md',
      },
    });

    if (!result.isConfirmed) return;

    try {
      setLoading(true);
      await toggleStudentLockStatusInBackend(student.studentId, student.status);
      toast.success(isLocking ? 'Đã tạm khóa tài khoản học sinh.' : 'Đã mở khóa tài khoản học sinh.');
      await fetchStudents();
    } catch (error: any) {
      console.error('Error toggling student lock status:', error);
      if (error.status === 403 || error.status === 401) {
        toast.error('Truy cập bị từ chối. Vui lòng đăng nhập lại hoặc kiểm tra quyền Admin.');
      } else {
        toast.error(error.message || 'Không thể cập nhật trạng thái học sinh');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading && students.length === 0) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center min-h-screen" style={{ backgroundColor: PAGE_BG }}>
        <div className="text-gray-800 text-xl font-semibold">Đang tải danh sách học sinh...</div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen py-6 sm:py-10 px-4 sm:px-8" style={{ backgroundColor: PAGE_BG }}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Hero + tìm kiếm */}
        <div
          className="rounded-2xl shadow-2xl p-6 sm:p-8 text-white relative overflow-hidden"
          style={{ background: HERO_GRADIENT }}
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold drop-shadow">Quản lý tài khoản học sinh</h1>
              <p className="text-white/80 mt-1 text-sm">Theo dõi, tìm kiếm và kiểm soát tình trạng hoạt động của học sinh.</p>
            </div>
            <div className="flex items-center gap-2 text-sm font-semibold">
              <span className="px-4 py-1 rounded-full bg-white/25 backdrop-blur">Tổng {totalElements} học sinh</span>
            </div>
          </div>

          <div className="mt-6 bg-white/95 rounded-2xl p-4 shadow-inner">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              {/* Tìm kiếm Email */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Email</label>
                <input
                  type="text"
                  placeholder="Nhập email..."
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-800 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>

              {/* Tìm kiếm Tên */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Tên hiển thị</label>
                <input
                  type="text"
                  placeholder="Nhập tên hiển thị..."
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-800 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>

              {/* Chọn trạng thái */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Trạng thái</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-800 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
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
                  className="px-4 py-2 rounded-xl bg-white text-purple-700 text-sm font-semibold shadow-sm hover:bg-purple-50 transition whitespace-nowrap"
                  disabled={loading}
                >
                  Xóa bộ lọc
                </button>
                <button
                  onClick={handleSearch}
                  className="px-6 py-2 rounded-xl text-white text-sm font-semibold shadow-lg hover:brightness-110 transition whitespace-nowrap disabled:opacity-50"
                  style={{ backgroundColor: BUTTON_COLOR }}
                  disabled={loading}
                >
                  Tìm kiếm
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bảng danh sách */}
        <div
          className="bg-white rounded-2xl border border-white/60 shadow-[0_25px_60px_rgba(131,56,236,0.12)] overflow-hidden"
          style={{ boxShadow: TABLE_SHADOW }}
        >
          {/* Tiêu đề bảng */}
          <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-white to-purple-50/60">
            <p className="text-sm text-gray-600 font-medium flex flex-wrap items-center gap-2">
              <span className="text-xs px-3 py-1 rounded-full bg-white shadow-inner">
                Trang {currentPage + 1}/{totalPages}
              </span>
            </p>
          </div>

          {/* Bảng */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm text-gray-700">
              <thead className="bg-[#F7F4FF] border-b border-gray-100 uppercase text-[0.65rem] tracking-wide text-gray-600">
                <tr>
                  <th className="px-4 py-3 text-left">STT</th>
                  <th className="px-4 py-3 text-left">ID</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Tên hiển thị</th>
                  <th className="px-4 py-3 text-left">Ngày tạo TK</th>
                  <th className="px-4 py-3 text-left">Truy cập cuối</th>
                  <th className="px-4 py-3 text-left">Trạng thái</th>
                  <th className="px-4 py-3 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {students.length === 0 && !loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-gray-500">
                      Không tìm thấy học sinh nào
                    </td>
                  </tr>
                ) : (
                  students.map((student: Student, index: number) => (
                    <tr key={student.studentId} className="hover:bg-purple-50/50 transition">
                      <td className="px-4 py-3">{currentPage * itemsPerPage + index + 1}</td>
                      <td className="px-4 py-3">{student.studentId}</td>
                      <td className="px-4 py-3 font-medium">{student.email}</td>
                      <td className="px-4 py-3">{student.username}</td>
                      <td className="px-4 py-3">{formatDate(student.createdAt)}</td>
                      <td className="px-4 py-3">{formatDate(student.lastVisit)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-3 py-1.5 rounded-full text-[0.7rem] font-semibold inline-flex items-center justify-center ${getStatusColor(student.status)}`}>
                          {getStatusDisplay(student.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center justify-center gap-2">
                          <button
                            onClick={() => handleToggleLock(student)}
                            className="px-4 py-1.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200 hover:bg-amber-200 transition disabled:opacity-50 flex items-center gap-1"
                            disabled={loading || (student.status !== 'ACTIVE' && student.status !== 'LOCKED')}
                          >
                            {student.status === 'LOCKED' ? (
                              <>
                                <UnlockIcon className="w-3 h-3 flex-shrink-0" /> Mở khóa
                              </>
                            ) : (
                              <>
                                <LockIcon className="w-3 h-3 flex-shrink-0" /> Tạm khóa
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleDelete(student.studentId)}
                            className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-100 rounded-full transition disabled:opacity-50 flex items-center gap-1"
                            disabled={loading}
                          >
                            <TrashIcon className="w-5 h-5 flex-shrink-0" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Phân trang */}
          <div className="p-5 border-t border-gray-100 flex justify-center items-center gap-2 text-sm text-gray-500 bg-white">
            <button
              onClick={() => setCurrentPage(0)}
              disabled={currentPage === 0 || loading}
              className="px-3 py-1 rounded-full text-gray-400 hover:text-purple-700 hover:bg-purple-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              «
            </button>

            <button
              onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
              disabled={currentPage === 0 || loading}
              className="px-3 py-1 rounded-full text-gray-400 hover:text-purple-700 hover:bg-purple-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              ‹
            </button>

            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i)}
                disabled={loading}
                className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-semibold transition-colors
                  ${currentPage === i
                    ? 'bg-purple-700 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-purple-50'
                  }
                `}
              >
                {i + 1}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
              disabled={currentPage === totalPages - 1 || loading}
              className="px-3 py-1 rounded-full text-gray-400 hover:text-purple-700 hover:bg-purple-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              ›
            </button>

            <button
              onClick={() => setCurrentPage(totalPages - 1)}
              disabled={currentPage === totalPages - 1 || loading}
              className="px-3 py-1 rounded-full text-gray-400 hover:text-purple-700 hover:bg-purple-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              »
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentAccountsPage;