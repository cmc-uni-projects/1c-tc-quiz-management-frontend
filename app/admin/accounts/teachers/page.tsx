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
 * @param {string} url The API endpoint URL.
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
const SEARCH_BAR_BG = "#E33AEC";
const BUTTON_COLOR = "#9453C9";
const PAGE_BG = "#F4F2FF";
const HERO_GRADIENT = "linear-gradient(135deg, #FFB6FF 0%, #8A46FF 100%)";
const TABLE_SHADOW = "0 25px 60px rgba(126, 62, 255, 0.18)";

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

  const urlBase = '/api/admin/accounts/teachers';
  const url = queryParams.toString()
    ? `${urlBase}?${queryParams.toString()}`
    : urlBase;

  const data = await fetchApi(url);
  return data;
}

async function deleteTeacherInBackend(id: number) {
  await fetchApi(`/api/admin/accounts/teachers/${id}`, {
    method: 'DELETE',
  });
}

async function toggleTeacherLockStatusInBackend(id: number, currentStatus: Teacher['status']) {
  if (currentStatus === 'APPROVED') {
    await fetchApi(`/api/admin/accounts/teachers/${id}/lock`, { method: 'POST' });
  } else if (currentStatus === 'LOCKED') {
    await fetchApi(`/api/admin/accounts/teachers/${id}/unlock`, { method: 'POST' });
  }
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
    'PENDING': 'bg-amber-100 text-amber-700 border border-amber-200 shadow-sm',
    'APPROVED': 'bg-emerald-100 text-emerald-700 border border-emerald-200 shadow-sm',
    'REJECTED': 'bg-rose-100 text-rose-700 border border-rose-200 shadow-sm',
    'LOCKED': 'bg-slate-100 text-slate-700 border border-slate-200 shadow-sm',
  };
  return colorMap[status] || 'bg-gray-100 text-gray-700 border border-gray-200 shadow-sm';
};

const mapDisplayToApiStatus = (display: string) => {
  if (display === 'Chờ duyệt') return 'PENDING';
  if (display === 'Hoạt động') return 'APPROVED';
  if (display === 'Bị từ chối') return 'REJECTED';
  if (display === 'Tạm khóa') return 'LOCKED';
  return null;
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
      });

      const content = Array.isArray((data as any)?.content)
        ? (data as any).content
        : Array.isArray(data)
          ? data
          : [];

      let filteredContent = content;
      if (appliedStatus !== 'all') {
        const apiStatus = mapDisplayToApiStatus(appliedStatus);
        if (apiStatus) {
          filteredContent = content.filter(
            (t: Teacher) => t.status === apiStatus
          );
        }
      }

      // Sort by newest first (createdAt or lastVisit)
      filteredContent.sort((a: Teacher, b: Teacher) => {
        const dateA = new Date(a.createdAt || a.lastVisit || 0).getTime();
        const dateB = new Date(b.createdAt || b.lastVisit || 0).getTime();
        return dateB - dateA; // Newest first
      });

      setTeachers(filteredContent);

      if (typeof (data as any)?.totalPages === 'number') {
        setTotalPages((data as any).totalPages || 1);
      } else {
        setTotalPages(1);
      }

      if (typeof (data as any)?.totalElements === 'number') {
        setTotalElements((data as any).totalElements || filteredContent.length);
      } else {
        setTotalElements(filteredContent.length);
      }
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
      text: `Bạn có chắc chắn muốn xóa giáo viên "${teacher?.username} với email "${teacher?.email}"?`,
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

  const handleToggleLock = async (teacher: Teacher) => {
    if (teacher.status !== 'APPROVED' && teacher.status !== 'LOCKED') {
      toast.error('Chỉ có thể đổi trạng thái giữa Hoạt động và Tạm khóa.');
      return;
    }

    const isLocking = teacher.status === 'APPROVED';
    const actionText = isLocking ? 'tạm khóa' : 'mở khóa';

    const result = await Swal.fire({
      title: `Xác nhận ${isLocking ? 'tạm khóa' : 'mở khóa'} tài khoản`,
      text: `Bạn có chắc chắn muốn ${actionText} tài khoản giáo viên "${teacher.username}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Xác nhận',
      cancelButtonText: 'Hủy',
    });

    if (!result.isConfirmed) return;

    try {
      setLoading(true);
      await toggleTeacherLockStatusInBackend(teacher.teacherId, teacher.status);
      toast.success(isLocking ? 'Đã tạm khóa tài khoản giáo viên.' : 'Đã mở khóa tài khoản giáo viên.');
      await fetchTeachers();
    } catch (error: any) {
      console.error('Error toggling lock status:', error);
      if (error.status === 403 || error.status === 401) {
        toast.error('Truy cập bị từ chối. Vui lòng đăng nhập lại với tài khoản Admin.');
      } else {
        toast.error(error.message || 'Không thể cập nhật trạng thái giáo viên');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading && teachers.length === 0) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center" style={{ backgroundColor: PAGE_BG }}>
        <div className="text-gray-800 text-xl font-semibold">Đang tải danh sách giáo viên...</div>
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
              <h1 className="text-3xl font-extrabold drop-shadow">Quản lý tài khoản giáo viên</h1>
              <p className="text-white/80 mt-1 text-sm">Theo dõi, tìm kiếm và kiểm soát tình trạng hoạt động của giáo viên.</p>
            </div>
            <div className="flex items-center gap-2 text-sm font-semibold">
              <span className="px-4 py-1 rounded-full bg-white/25 backdrop-blur">Tổng {totalElements} giáo viên</span>
            </div>
          </div>

          <div className="mt-6 bg-white/95 rounded-2xl p-4 shadow-inner">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              {/* Tìm Email */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Email</label>
                <input
                  type="text"
                  placeholder="Nhập Email..."
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-800 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>

              {/* Tìm Tên */}
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
                  className="px-4 py-2 rounded-xl bg-white text-purple-700 text-sm font-semibold shadow-sm hover:bg-purple-50 transition whitespace-nowrap"
                  disabled={loading}
                >
                  Xóa bộ lọc
                </button>
                <button
                  onClick={handleSearch}
                  className="px-6 py-2 rounded-xl text-white text-sm font-semibold shadow-lg hover:brightness-110 transition whitespace-nowrap"
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
                  <th className="px-4 py-3 text-left">Ngày tạo tài khoản</th>
                  <th className="px-4 py-3 text-left">Lượt truy cập cuối</th>
                  <th className="px-4 py-3 text-left">Trạng thái</th>
                  <th className="px-4 py-3 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {teachers.length === 0 && !loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-gray-500">
                      Không tìm thấy giáo viên nào
                    </td>
                  </tr>
                ) : (
                  teachers.map((teacher, index) => (
                    <tr key={teacher.teacherId} className="hover:bg-purple-50/50 transition">
                      <td className="px-4 py-3">{currentPage * itemsPerPage + index + 1}</td>
                      <td className="px-4 py-3">{teacher.teacherId}</td>
                      <td className="px-4 py-3 font-medium">{teacher.email}</td>
                      <td className="px-4 py-3">{teacher.username}</td>
                      <td className="px-4 py-3">{formatDate(teacher.createdAt)}</td>
                      <td className="px-4 py-3">{formatDate(teacher.lastVisit)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-3 py-1.5 rounded-full text-[0.7rem] font-semibold inline-flex items-center justify-center ${getStatusColor(teacher.status)}`}>
                          {getStatusDisplay(teacher.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center justify-center gap-2">
                          <button
                            onClick={() => handleToggleLock(teacher)}
                            className="px-4 py-1.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200 hover:bg-amber-200 transition disabled:opacity-50 flex items-center gap-1"
                            disabled={loading || (teacher.status !== 'APPROVED' && teacher.status !== 'LOCKED')}
                          >
                            {teacher.status === 'LOCKED' ? (
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
                            onClick={() => handleDelete(teacher.teacherId)}
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

export default TeacherAccountsPage;