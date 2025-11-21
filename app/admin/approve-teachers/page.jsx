"use client";
import React, { useState, useEffect, useCallback, useMemo } from 'react';
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


const PRIMARY_PURPLE_BG = '#E33AEC7A';
const BUTTON_RED = '#f04040';
const BUTTON_BLUE = '#1e90ff';

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

const Toast = ({ message, type, onClose }) => {
  const baseClasses = "fixed bottom-5 right-5 p-4 rounded-xl shadow-2xl z-50 flex items-center";
  let typeClasses = "";

  switch (type) {
    case 'success':
      typeClasses = "bg-green-600 text-white";
      break;
    case 'error':
      typeClasses = "bg-red-600 text-white";
      break;
    default:
      typeClasses = "bg-gray-700 text-white";
  }

  return (
    <div className={`${baseClasses} ${typeClasses} transition-all duration-300 transform translate-y-0 opacity-100`}>
      <p className="mr-4 font-semibold">{message}</p>
      <button onClick={onClose} className="ml-4 opacity-75 hover:opacity-100 transition">
        <XIcon className="w-5 h-5" />
      </button>
    </div>
  );
};

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

    const [toastState, setToastState] = useState(null);
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
            setToastState({ message: e.message, type: 'error' });
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

            setToastState({ message: toastMessage, type: 'success' });

            setSelectedTeacher(null);

        } catch (e) {
            console.error(`Error updating status for ${teacherId}:`, e);
            setToastState({ message: `Lỗi khi cập nhật trạng thái: ${e.message}.`, type: 'error' });
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
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'approved': return 'bg-green-100 text-green-800';
            case 'rejected': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }


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
            <div className="p-4 sm:p-8 font-sans">
                <div className="bg-red-500/20 text-red-700 p-6 rounded-xl my-4 border border-red-500 shadow-xl">
                    <h3 className="font-bold text-xl mb-2">Lỗi Kết nối API</h3>
                    <p className="mb-4">{error}</p>
                    <button
                        onClick={fetchTeachers}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold"
                    >
                        Thử tải lại
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-8 font-sans">
            <style jsx global>{`
                body {
                    background-color: #f0f0f0;
                }
            `}</style>

            {/* Thanh tiêu đề Duyệt giáo viên */}
            <div
                className="p-4 sm:p-6 mb-8 rounded-xl shadow-lg"
                style={{ backgroundColor: PRIMARY_PURPLE_BG }}
            >
                <h1 className="text-3xl font-extrabold text-white">
                    Duyệt giáo viên
                </h1>
                <p className="text-white/80 mt-1 text-sm">
                    Danh sách giáo viên chờ duyệt ({filteredTeachers.length} tài khoản)
                </p>
            </div>

            {/* Hiển thị danh sách giáo viên */}
            {filteredTeachers.length === 0 ? (
                <div className="text-center p-10 bg-white rounded-xl shadow-md border border-gray-200">
                    <p className="text-xl font-semibold text-gray-600">
                        <UserCheck className="w-10 h-10 mx-auto text-green-500 mb-4"/>
                        Tuyệt vời! Không có yêu cầu nào đang chờ duyệt.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredTeachers.map((teacher) => (
                        <div
                            key={teacher.id}
                            onClick={() => setSelectedTeacher(teacher)}
                            className="bg-white rounded-xl p-4 shadow-md flex flex-col md:flex-row justify-between items-center transition duration-300 hover:shadow-lg border border-gray-100 cursor-pointer"
                        >
                            {/* Thông tin giáo viên */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-1 sm:space-y-0 sm:space-x-6 w-full md:w-auto mb-3 md:mb-0">
                                <p className="text-lg font-medium text-gray-800 break-all w-full sm:w-60">
                                    {teacher.email}
                                </p>
                                <p className="text-gray-600 font-semibold w-full sm:w-40">
                                    {teacher.fullName}
                                </p>
                                {/* Trạng thái */}
                                <div className={`text-sm font-bold px-3 py-1 rounded-full w-full sm:w-40 text-center ${statusColorMap(teacher.status)}`}>
                                    {statusMap[teacher.status]}
                                </div>
                            </div>

                            {/* Nút hành động */}
                            <div className="flex space-x-3 mt-3 md:mt-0">
                                <button
                                    type="button"
                                    onClick={(e) => handleReject(e, teacher.id)}
                                    style={{ backgroundColor: BUTTON_RED }}
                                    className="px-5 py-2 text-white font-semibold rounded-lg shadow-sm hover:opacity-90 transition flex items-center"
                                    disabled={loading}
                                >
                                    <UserX className="w-4 h-4 mr-1"/> Từ chối
                                </button>
                                <button
                                    type="button"
                                    onClick={(e) => handleApprove(e, teacher.id)}
                                    style={{ backgroundColor: BUTTON_BLUE }}
                                    className="px-5 py-2 text-white font-semibold rounded-lg shadow-sm hover:opacity-90 transition flex items-center"
                                    disabled={loading}
                                >
                                    <UserCheck className="w-4 h-4 mr-1"/> Đồng ý
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {selectedTeacher && (
                <TeacherDetailModal teacher={selectedTeacher} onClose={() => setSelectedTeacher(null)} />
            )}

            {/* Component Toast Notification */}
            {toastState && (
                <Toast
                    message={toastState.message}
                    type={toastState.type}
                    onClose={() => setToastState(null)}
                />
            )}

            {/* Loading overlay khi đang xử lý action */}
            {loading && filteredTeachers.length > 0 && (
                <div className="fixed inset-0 bg-black bg-opacity-10 flex items-center justify-center z-40">
                    <div className="bg-white p-4 rounded-lg shadow-xl flex items-center">
                        <RefreshCw className="animate-spin -ml-1 mr-3 h-5 w-5 text-purple-600" />
                        Đang xử lý...
                    </div>
                </div>
            )}
        </div>
    );
}