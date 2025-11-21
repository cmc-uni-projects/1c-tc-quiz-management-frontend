"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';

// === CẤU HÌNH API BACKEND ===
// Để dùng Next.js rewrites (same-origin, có cookie), để trống sẽ gọi trực tiếp "/admin/..." hoặc "/teachers/..."
const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8082";

// --- HÀM GỌI API BACKEND ---

/**
 * Lấy danh sách giáo viên đang chờ duyệt từ Spring Boot Backend (role ADMIN)
 */
async function fetchTeachersFromBackend() {
    const res = await fetch(`${API_URL}/admin/teachers/pending`, {
        credentials: "include",
    });

    if (res.status === 401 || res.status === 403) {
        // Nếu chưa đăng nhập/không có quyền, chuyển hướng đăng nhập
        window.location.href = '/auth/login';
        throw new Error(`401/403: Quyền truy cập bị từ chối. Đã chuyển hướng đăng nhập.`);
    }

    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Lỗi (${res.status}): Không thể tải danh sách giảng viên. Chi tiết: ${errorText.substring(0, 100)}...`);
    }

    const data = await res.json();

    return data.map(t => ({
        id: t.teacherId,
        fullName: t.username,
        email: t.email,
        status: t.status ? t.status.toLowerCase() : 'pending',
        experience: 'Chưa có thông tin', // Teacher entity doesn't have experience field
        phone: 'Chưa có thông tin', // Teacher entity doesn't have phone field  
        proofDocumentUrl: null, // Teacher entity doesn't have proofDocumentUrl field
        requestDate: t.createdAt ? new Date(t.createdAt).toLocaleDateString('vi-VN') : 'N/A',
        requestTimestamp: t.createdAt ? new Date(t.createdAt).getTime() : 0,
    }));
}

/**
 * Duyệt (APPROVED)
 */
async function approveTeacherInBackend(id) {
    const res = await fetch(`${API_URL}/admin/teachers/${id}/approve`, {
        method: "POST",
        credentials: "include",
    });
    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Lỗi (${res.status}): Không thể duyệt giảng viên. Chi tiết: ${errorText.substring(0, 100)}...`);
    }
    return res.text();
}

/**
 * Từ chối (REJECTED)
 */
async function rejectTeacherInBackend(id) {
    const res = await fetch(`${API_URL}/admin/teachers/${id}/reject`, {
        method: "POST",
        credentials: "include",
    });
    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Lỗi (${res.status}): Không thể từ chối giảng viên. Chi tiết: ${errorText.substring(0, 100)}...`);
    }
    return res.text();
}


// === MÀU SẮC CHỦ ĐẠO ===
const PRIMARY_PURPLE_BG = '#E33AEC7A'; 
const BUTTON_RED = '#f04040';
const BUTTON_BLUE = '#1e90ff';

// --- ICON SVG (Giữ nguyên) ---
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
// --- Hết ICON SVG ---

// Component Toast Notification (Giữ nguyên)
const Toast = ({ message, type, onClose }) => {
  const baseClasses = "fixed bottom-5 right-5 p-4 rounded-xl shadow-2xl z-50 flex items-center";
  let typeClasses = "";

  switch (type) {
    case 'success':
      typeClasses = "bg-green-500 text-white";
      break;
    case 'error':
      typeClasses = "bg-red-500 text-white";
      break;
    default:
      typeClasses = "bg-gray-700 text-white";
  }

  return (
    <div className={`${baseClasses} ${typeClasses} animate-slide-in-up`}>
      <style jsx global>{`
        @keyframes slide-in-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
      <p className="mr-4 font-semibold">{message}</p>
      <button onClick={onClose} className="ml-4 opacity-75 hover:opacity-100 transition">
        <XIcon className="w-5 h-5" />
      </button>
    </div>
  );
};


// Component Modal Chi tiết Giáo viên (Giữ nguyên)
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
        </div>
      </div>
    </div>
  );
};


// --- Component Chính ---
export default function AdminReviewTeachersPage() {
    const [allTeachers, setAllTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const [toast, setToast] = useState(null); 
    const [selectedTeacher, setSelectedTeacher] = useState(null); 
    
    // Lấy danh sách Giáo viên
    const fetchTeachers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // GỌI HÀM LẤY DỮ LIỆU THẬT (ĐÃ CÓ THÊM HEADER XÁC THỰC)
            let fetchedTeachers = await fetchTeachersFromBackend(); 
            
            // Sắp xếp theo timestamp giảm dần (để yêu cầu mới nhất lên đầu)
            fetchedTeachers.sort((a, b) => (b.requestTimestamp || 0) - (a.requestTimestamp || 0));

            setAllTeachers(fetchedTeachers);
        } catch (e) {
            console.error("Error fetching teachers:", e);
            // Xử lý nếu hàm fetchTeachersFromBackend ném lỗi (kể cả lỗi 401/403)
            setError(`Lỗi khi tải danh sách: ${e.message}`); 
            setToast({ message: e.message, type: 'error' });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // Bắt đầu tải ngay khi component mount
        fetchTeachers(); 
    }, [fetchTeachers]);


    // Xử lý Cập nhật trạng thái
    const handleReview = async (teacherId, newStatus) => {
        const teacher = allTeachers.find(t => t.id === teacherId);
        if (!teacher) return;
        
        // Thêm một lớp bảo vệ UI (ngăn người dùng click liên tục)
        setLoading(true); 

        try {
            if (newStatus === 'approved') {
                await approveTeacherInBackend(teacherId);
            } else {
                await rejectTeacherInBackend(teacherId);
            }

            // Cập nhật trạng thái trong state local và xóa khỏi danh sách đang hiển thị
            setAllTeachers(prev => prev.filter(t => t.id !== teacherId));
            
            let toastMessage = (newStatus === 'approved') 
                ? `Đã duyệt thành công: ${teacher.fullName} (${teacher.email})`
                : `Đã từ chối thành công: ${teacher.fullName} (${teacher.email})`;
                
            setToast({ message: toastMessage, type: 'success' });
            
            setSelectedTeacher(null);

        } catch (e) {
            console.error(`Error updating status for ${teacherId}:`, e);
            setToast({ message: `Lỗi khi cập nhật trạng thái: ${e.message}.`, type: 'error' });
        } finally {
             setLoading(false); // Kết thúc trạng thái loading (sau khi fetch lại)
        }
    };

    // Hành động: Đồng ý -> approved, Từ chối -> rejected
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
    
    // Ánh xạ Trạng thái (căn chỉnh với backend TeacherStatus enum)
    const statusMap = {
        'pending': 'Chờ duyệt',
        'approved': 'Đã duyệt', 
        'rejected': 'Đã từ chối',
    };
    
    // Ánh xạ màu sắc cho Trạng thái
    const statusColorMap = (status) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'approved': return 'bg-green-100 text-green-800';
            case 'rejected': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }
    

    // Lọc danh sách giáo viên: CHỈ GIỮ LẠI PENDING (Giữ nguyên)
    const filteredTeachers = useMemo(() => {
        return allTeachers.filter(t => t.status === 'pending');
    }, [allTeachers]);
    
    // --- UI Rendering ---

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh] text-gray-800">
                <RefreshCw className="animate-spin -ml-1 mr-3 h-6 w-6 text-purple-600" />
                <span className="text-lg">Đang tải danh sách giáo viên...</span>
            </div>
        );
    }

    if (error) {
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
                                >
                                    <UserX className="w-4 h-4 mr-1"/> Từ chối
                                </button>
                                <button
                                    type="button"
                                    onClick={(e) => handleApprove(e, teacher.id)}
                                    style={{ backgroundColor: BUTTON_BLUE }}
                                    className="px-5 py-2 text-white font-semibold rounded-lg shadow-sm hover:opacity-90 transition flex items-center"
                                >
                                    <UserCheck className="w-4 h-4 mr-1"/> Đồng ý
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Component Modal Chi tiết */}
            {selectedTeacher && (
                <TeacherDetailModal teacher={selectedTeacher} onClose={() => setSelectedTeacher(null)} />
            )}

            {/* Component Toast Notification */}
            {toast && (
                <Toast 
                    message={toast.message} 
                    type={toast.type} 
                    onClose={() => setToast(null)} 
                />
            )}
        </div>
    );
}