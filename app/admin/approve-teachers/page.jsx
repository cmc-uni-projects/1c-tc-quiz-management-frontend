"use client";
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "/api";


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
    credentials: "include",
  };

  if (options.body) {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(url, config);
  const isJson = response.headers.get('content-type')?.includes('application/json');

  if (!response.ok) {
    let errorText = "Lỗi không xác định";
    try {
        errorText = isJson ? (await response.json()).message : await response.text();
    } catch {
    }
    const errorMessage = `Lỗi (${response.status}): ${errorText.substring(0, 100)}...`;
    throw new Error(errorMessage);
  }

  return isJson ? await response.json() : await response.text();
}

async function fetchTeachersFromBackend() {
    const data = await fetchApi(`${API_URL}/admin/teachers/pending`);

    const rawTeachers = Array.isArray(data) ? data : (data.content || data.data || []);


    return rawTeachers.map(t => ({
        id: t.teacherId,
        fullName: t.username,
        email: t.email,
        status: t.status ? t.status.toLowerCase() : 'pending',
        experience: 'Chưa có thông tin',
        phone: 'Chưa có thông tin',
        proofDocumentUrl: null,
        requestDate: t.createdAt ? new Date(t.createdAt).toLocaleDateString('vi-VN') : 'N/A',
        requestTimestamp: t.createdAt ? new Date(t.createdAt).getTime() : 0,
    }));
}

async function approveTeacherInBackend(id) {
    await fetchApi(`${API_URL}/admin/teachers/${id}/approve`, {
        method: "POST",
    });
}

async function rejectTeacherInBackend(id) {
    await fetchApi(`${API_URL}/admin/teachers/${id}/reject`, {
        method: "POST",
    });
}


const PAGE_BG = '#F4F2FF';
const HERO_GRADIENT = 'linear-gradient(135deg, #FFB6FF 0%, #8A46FF 100%)';
const TABLE_SHADOW = '0 25px 60px rgba(126, 62, 255, 0.18)';
const BUTTON_RED = '#F43F5E';
const BUTTON_BLUE = '#4C6FFF';

const RefreshCw = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M23 4v6h-6"/>
    <path d="M20.49 14a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
);

const UserCheck = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="m17 11 2 2 4-4"/>
  </svg>
);

const UserX = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <line x1="17" x2="22" y1="17" y2="22"/>
    <line x1="22" x2="17" y1="17" y2="22"/>
  </svg>
);

const Info = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10"/>
    <path d="M12 16v-4"/>
    <path d="M12 8h.01"/>
  </svg>
);

const XIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M18 6 6 18"/>
    <path d="m6 6 12 12"/>
  </svg>
);

const statusMap = {
    'pending': 'Chờ duyệt',
    'approved': 'Đã duyệt',
    'rejected': 'Đã từ chối',
};

const TeacherDetailModal = ({ teacher, onClose }) => {
  if (!teacher) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl p-8 max-w-lg w-full shadow-2xl transform transition-all duration-300 scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start border-b pb-3 mb-4">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <Info className="w-6 h-6 mr-2 text-purple-600"/>
            Chi tiết Yêu cầu
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <XIcon className="w-6 h-6"/>
          </button>
        </div>

        <div className="space-y-4 text-gray-700">
          <div>
            <p className="font-medium text-sm text-gray-500">Họ tên</p>
            <p className="text-lg font-semibold">{teacher.fullName}</p>
          </div>
          <div>
            <p className="font-medium text-sm text-gray-500">Email</p>
            <p className="text-lg">{teacher.email}</p>
          </div>
          <div>
            <p className="font-medium text-sm text-gray-500">Trạng thái</p>
            <p className="text-lg capitalize">{statusMap[teacher.status] || teacher.status}</p>
          </div>
          <div>
            <p className="font-medium text-sm text-gray-500">Ngày đăng ký</p>
            <p className="text-base">{teacher.requestDate}</p>
          </div>
          <div>
            <p className="font-medium text-sm text-gray-500">Kinh nghiệm</p>
            <p className="text-base">{teacher.experience}</p>
          </div>
          <div>
            <p className="font-medium text-sm text-gray-500">Điện thoại</p>
            <p className="text-base">{teacher.phone}</p>
          </div>
          {teacher.proofDocumentUrl && (
            <div>
              <p className="font-medium text-sm text-gray-500">Tài liệu đính kèm</p>
              <a
                href={teacher.proofDocumentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline text-base"
              >
                Xem tài liệu
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


export default function AdminReviewTeachersPage() {
    const [allTeachers, setAllTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [selectedTeacher, setSelectedTeacher] = useState(null);

    const fetchTeachers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            let fetchedTeachers = await fetchTeachersFromBackend();

            fetchedTeachers.sort((a, b) => (b.requestTimestamp || 0) - (a.requestTimestamp || 0));

            setAllTeachers(fetchedTeachers);
        } catch (e) {
            console.error("Error fetching teachers:", e);
            setError(`Lỗi khi tải danh sách: ${e.message}`);
            toast.error(e.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTeachers();
    }, [fetchTeachers]);


    const handleReview = async (teacherId, newStatus) => {
        const teacher = allTeachers.find(t => t.id === teacherId);
        if (!teacher) return;

        setLoading(true);

        try {
            if (newStatus === 'approved') {
                await approveTeacherInBackend(teacherId);
            } else {
                await rejectTeacherInBackend(teacherId);
            }

            setAllTeachers(prev => prev.filter(t => t.id !== teacherId));

            let toastMessage = (newStatus === 'approved')
                ? `Đã duyệt thành công: ${teacher.fullName} (${teacher.email})`
                : `Đã từ chối thành công: ${teacher.fullName} (${teacher.email})`;

            toast.success(toastMessage);

            setSelectedTeacher(null);

        } catch (e) {
            console.error(`Error updating status for ${teacherId}:`, e);
            toast.error(`Lỗi khi cập nhật trạng thái: ${e.message}.`);
        } finally {
             setLoading(false);
        }
    };

    const handleApprove = (e, teacherId) => {
        if (e && typeof e.stopPropagation === 'function') {
            e.stopPropagation();
        }
        handleReview(teacherId, 'approved');
    };
    const handleReject = (e, teacherId) => {
        if (e && typeof e.stopPropagation === 'function') {
            e.stopPropagation();
        }
        handleReview(teacherId, 'rejected');
    };

    const statusColorMap = (status) => {
        switch (status) {
            case 'pending':
                return 'bg-amber-100 text-amber-700 border border-amber-200 shadow-sm';
            case 'approved':
                return 'bg-emerald-100 text-emerald-700 border border-emerald-200 shadow-sm';
            case 'rejected':
                return 'bg-rose-100 text-rose-700 border border-rose-200 shadow-sm';
            default:
                return 'bg-gray-100 text-gray-700 border border-gray-200 shadow-sm';
        }
    };

    const filteredTeachers = useMemo(() => {
        return allTeachers.filter(t => t.status === 'pending');
    }, [allTeachers]);

    if (loading && filteredTeachers.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[50vh] text-gray-800">
                <RefreshCw className="animate-spin -ml-1 mr-3 h-6 w-6 text-purple-600" />
                <span className="text-lg">Đang tải danh sách giáo viên...</span>
            </div>
        );
    }

    if (error && filteredTeachers.length === 0) {
        return (
            <div className="w-full min-h-screen py-6 sm:py-10 px-4 sm:px-8" style={{ backgroundColor: PAGE_BG }}>
                <div className="max-w-6xl mx-auto">
                    <div className="bg-red-500/15 text-red-700 p-6 rounded-2xl border border-red-200 shadow-lg">
                        <h3 className="font-bold text-xl mb-2">Lỗi Kết nối API</h3>
                        <p className="mb-4">{error}</p>
                        <button
                            onClick={fetchTeachers}
                            className="px-4 py-2 rounded-xl bg-red-500 text-white font-semibold shadow hover:bg-red-600 transition"
                        >
                            Thử tải lại
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen py-6 sm:py-10 px-4 sm:px-8" style={{ backgroundColor: PAGE_BG }}>
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Hero section */}
                <div
                    className="rounded-2xl shadow-2xl p-6 sm:p-8 text-white relative overflow-hidden"
                    style={{ background: HERO_GRADIENT }}
                >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-extrabold drop-shadow">Duyệt tài khoản giáo viên</h1>
                            <p className="text-white/80 mt-1 text-sm">
                                Danh sách yêu cầu tạo tài khoản giáo viên đang chờ xử lý.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-3 text-sm font-semibold">
                            <span className="px-4 py-2 rounded-full bg-white/25 backdrop-blur">
                                {filteredTeachers.length} yêu cầu đang chờ
                            </span>
                            <button
                                onClick={fetchTeachers}
                                className="px-4 py-2 rounded-full bg-white/20 hover:bg-white/30 transition flex items-center gap-2"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Tải lại
                            </button>
                        </div>
                    </div>
                </div>

                {/* Pending list */}
                <div
                    className="bg-white rounded-2xl border border-white/60 shadow-[0_25px_60px_rgba(131,56,236,0.12)] overflow-hidden"
                    style={{ boxShadow: TABLE_SHADOW }}
                >
                    {filteredTeachers.length === 0 ? (
                        <div className="text-center p-12">
                            <UserCheck className="w-12 h-12 mx-auto text-emerald-500 mb-4" />
                            <p className="text-xl font-semibold text-gray-600">
                                Tuyệt vời! Không có yêu cầu nào đang chờ duyệt.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[760px] text-sm text-gray-700">
                                <thead className="bg-[#F7F4FF] border-b border-gray-100 uppercase text-[0.65rem] tracking-wide text-gray-600">
                                    <tr>
                                        <th className="px-4 py-3 text-left w-16">STT</th>
                                        <th className="px-4 py-3 text-left">Email</th>
                                        <th className="px-4 py-3 text-left">Họ tên</th>
                                        <th className="px-4 py-3 text-left">Ngày đăng ký</th>
                                        <th className="px-4 py-3 text-left">Trạng thái</th>
                                        <th className="px-4 py-3 text-center">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredTeachers.map((teacher, index) => (
                                        <tr
                                            key={teacher.id}
                                            className="hover:bg-purple-50/50 transition cursor-pointer"
                                            onClick={() => setSelectedTeacher(teacher)}
                                        >
                                            <td className="px-4 py-3 font-medium">{index + 1}</td>
                                            <td className="px-4 py-3 font-medium break-all">{teacher.email}</td>
                                            <td className="px-4 py-3">{teacher.fullName}</td>
                                            <td className="px-4 py-3">{teacher.requestDate}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-3 py-1.5 rounded-full text-[0.7rem] font-semibold inline-flex items-center justify-center ${statusColorMap(teacher.status)}`}>
                                                    {statusMap[teacher.status]}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-wrap items-center justify-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => handleReject(e, teacher.id)}
                                                        className="px-4 py-1.5 rounded-full text-xs font-semibold text-white shadow hover:brightness-110 transition flex items-center gap-1 inline-flex"
                                                        style={{ backgroundColor: BUTTON_RED }}
                                                        disabled={loading}
                                                    >
                                                        <UserX className="w-4 h-4" /> Từ chối
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => handleApprove(e, teacher.id)}
                                                        className="px-4 py-1.5 rounded-full text-xs font-semibold text-white shadow hover:brightness-110 transition flex items-center gap-1 inline-flex"
                                                        style={{ backgroundColor: BUTTON_BLUE }}
                                                        disabled={loading}
                                                    >
                                                        <UserCheck className="w-4 h-4" /> Đồng ý
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {selectedTeacher && (
                    <TeacherDetailModal teacher={selectedTeacher} onClose={() => setSelectedTeacher(null)} />
                )}

            </div>

            {/* Loading overlay khi đang xử lý action */}
            {loading && filteredTeachers.length > 0 && (
                <div className="fixed inset-0 bg-black/10 flex items-center justify-center z-40">
                    <div className="bg-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-2 text-sm font-medium text-gray-700">
                        <RefreshCw className="animate-spin h-5 w-5 text-purple-600" />
                        Đang xử lý...
                    </div>
                </div>
            )}
        </div>
    );
}