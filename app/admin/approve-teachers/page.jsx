"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';

// --- MOCK API & FIRESTORE SETUP (GIỮ NGUYÊN) ---
// VUI LÒNG KHÔNG XÓA PHẦN NÀY
const __initializeApp = (config) => { console.log("Initializing Firebase with config:", config); return { name: 'mock_app' } };
const collection = (db, path) => ({ db, path });
const query = (colRef, ...constraints) => ({ colRef, constraints });
const where = (field, op, value) => ({ type: 'where', field, op, value });
const doc = (db, path, id) => ({ db, path, id });
const updateDoc = async (docRef, data) => { console.log(`[MOCK DB] Updating ${docRef.path}/${docRef.id} with`, data); return true; };
const signInWithCustomToken = async () => { console.log("[MOCK AUTH] Signed in with custom token."); return { user: { uid: 'mock-admin-uid' } }; };
const signInAnonymously = async () => { console.log("[MOCK AUTH] Signed in anonymously."); return { user: { uid: 'mock-anon-uid' } }; };
const MOCK_AUTH = { currentUser: { uid: 'mock-admin-uid' } }; 

// Hàm xây dựng đường dẫn Firestore
const getPublicCollectionPath = (collectionName) => `/artifacts/${(typeof __app_id !== 'undefined' ? __app_id : 'default-app-id')}/public/data/${collectionName}`;

// Dữ liệu giả lập, chỉ bao gồm 3 trạng thái: pending, active, blocked
const initialMockRequests = [
    // Yêu cầu MỚI CỦA BẠN ĐÃ ĐƯỢC THÊM VÀO ĐẦU DANH SÁCH
    { id: 'req_006', fullName: 'Teacher 6', email: 'Teacher6@gmail.com', status: 'pending', experience: 'Kinh nghiệm 2 năm dạy Tin học, đam mê công nghệ giáo dục.', proofDocumentUrl: '#', requestTimestamp: Date.now() - 1000, phone: '0906789012' }, 
    
    { id: 'req_001', fullName: 'Teacher 1', email: 'Teacher1@gmail.com', status: 'pending', experience: 'Kinh nghiệm 5 năm dạy Toán cấp 3, đã có bằng Thạc sĩ.', proofDocumentUrl: '#', requestTimestamp: Date.now() - 86400000 * 5, phone: '0901234567' },
    { id: 'req_002', fullName: 'Teacher 2', email: 'Teacher2@gmail.com', status: 'active', experience: 'Kinh nghiệm Anh Văn.', proofDocumentUrl: null, requestTimestamp: Date.now() - 86400000 * 4, phone: '0902345678' },
    { id: 'req_003', fullName: 'Teacher 3', email: 'Teacher3@gmail.com', status: 'blocked', experience: 'Kinh nghiệm Vật Lý.', proofDocumentUrl: '#', requestTimestamp: Date.now() - 86400000 * 3, phone: '0903456789' },
    { id: 'req_004', fullName: 'Teacher 4', email: 'Teacher4@gmail.com', status: 'pending', experience: 'Kinh nghiệm 3 năm dạy Hóa học, chứng chỉ sư phạm loại Giỏi.', proofDocumentUrl: '#', requestTimestamp: Date.now() - 86400000 * 2, phone: '0904567890' },
    { id: 'req_005', fullName: 'Teacher 5', email: 'Teacher5@gmail.com', status: 'active', experience: 'Kinh nghiệm Văn học.', proofDocumentUrl: null, requestTimestamp: Date.now() - 86400000 * 1, phone: '0905678901' },
];

const getDocs = async (q) => {
    console.log("[MOCK DB] Fetching documents...");
    await new Promise(resolve => setTimeout(resolve, 500)); 
    
    // Giả lập trả về tất cả docs
    const results = initialMockRequests
        .map(req => ({ 
            id: req.id, 
            data: () => ({ 
                ...req, 
                requestDate: { toDate: () => new Date(req.requestTimestamp) } // Giả lập Timestamp
            }),
            requestDate: { toDate: () => new Date(req.requestTimestamp) } 
        }));
        
    return { docs: results };
};


// Định nghĩa màu sắc theo hình ảnh
const PRIMARY_PURPLE_BG = '#E33AEC7A'; 
const BUTTON_RED = '#f04040';
const BUTTON_BLUE = '#1e90ff';

// --- Helper Components (Inline SVGs) ---

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
// --- Hết Helper Components ---

// Component Toast Notification (Giả lập)
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


// Component Modal Chi tiết Giáo viên
const TeacherDetailModal = ({ teacher, onClose }) => {
  if (!teacher) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl p-8 max-w-lg w-full shadow-2xl transform transition-all duration-300 scale-100"
        onClick={(e) => e.stopPropagation()} // Ngăn chặn đóng modal khi click bên trong
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
            <p className="font-medium text-sm text-gray-500">Điện thoại</p>
            <p className="text-lg">{teacher.phone || 'Chưa cung cấp'}</p>
          </div>
          <div>
            <p className="font-medium text-sm text-gray-500">Kinh nghiệm</p>
            <p className="text-base italic bg-gray-50 p-3 rounded-lg border">{teacher.experience}</p>
          </div>
          {teacher.proofDocumentUrl && (
            <div>
              <p className="font-medium text-sm text-gray-500">Tài liệu đính kèm</p>
              <a 
                href={teacher.proofDocumentUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline transition"
              >
                Xem tài liệu minh chứng
              </a>
            </div>
          )}
          <div>
            <p className="font-medium text-sm text-gray-500">Ngày gửi yêu cầu</p>
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
    const [isAuthReady, setIsAuthReady] = useState(false);
    
    // ĐẶT TRẠNG THÁI LỌC MẶC ĐỊNH LÀ 'pending' VÀ KHÔNG THAY ĐỔI
    const filter = 'pending'; 
    
    const [toast, setToast] = useState(null); // Quản lý thông báo Toast
    const [selectedTeacher, setSelectedTeacher] = useState(null); // Quản lý Modal chi tiết

    let realUserId = MOCK_AUTH.currentUser?.uid || 'anonymous';
    let db = { isMock: true }; 

    // Giả lập Khởi tạo và Xác thực
    useEffect(() => {
        const initializeAuth = async () => {
            try {
                if (typeof __initial_auth_token !== 'undefined') {
                    await signInWithCustomToken();
                } else {
                    await signInAnonymously();
                }
                setIsAuthReady(true);
            } catch (e) {
                console.error("Auth Error:", e);
                setError("Lỗi xác thực Firebase.");
                setIsAuthReady(true); 
            }
        };
        initializeAuth();
    }, []);

    // Tải danh sách Giáo viên
    const fetchTeachers = useCallback(async () => {
        if (!isAuthReady) return;

        setLoading(true);
        setError(null);
        try {
            const teachersCollectionRef = collection(db, getPublicCollectionPath('teacher_requests'));
            const querySnapshot = await getDocs(query(teachersCollectionRef)); 
            
            let fetchedTeachers = querySnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    // Giả lập chuyển Timestamp sang Date string
                    requestDate: data.requestDate?.toDate ? data.requestDate.toDate().toLocaleDateString('vi-VN') : 'N/A', 
                    status: data.status === 'approved' ? 'active' : (data.status || 'pending') 
                };
            });
            
            // Sắp xếp theo timestamp giảm dần (để yêu cầu mới nhất lên đầu)
            fetchedTeachers.sort((a, b) => (b.requestTimestamp || 0) - (a.requestTimestamp || 0));

            setAllTeachers(fetchedTeachers);
        } catch (e) {
            console.error("Error fetching teachers:", e);
            setError(`Lỗi khi tải danh sách: ${e.message}`);
        } finally {
            setLoading(false);
        }
    }, [isAuthReady]);

    useEffect(() => {
        if (isAuthReady) {
            fetchTeachers();
        }
    }, [isAuthReady, fetchTeachers]);


    // Xử lý Cập nhật trạng thái và Thông báo Email (Giả lập)
    const handleReview = async (teacherId, newStatus) => {
        const teacher = allTeachers.find(t => t.id === teacherId);
        if (!teacher) return;
        
        if (!db || !realUserId || !isAuthReady) {
            setToast({ message: "Hệ thống chưa sẵn sàng. Vui lòng thử lại sau.", type: 'error' });
            return;
        }

        try {
            const teacherDocRef = doc(db, getPublicCollectionPath('teacher_requests'), teacherId);
            
            await updateDoc(teacherDocRef, {
                status: newStatus, // 'active' or 'blocked'
                reviewedBy: realUserId,
                reviewedAt: new Date(),
            });

            // Cập nhật trạng thái trong state local
            // Khi trạng thái thay đổi, giáo viên sẽ tự động biến mất khỏi danh sách hiển thị
            setAllTeachers(prev => prev.map(t => 
                t.id === teacherId ? { ...t, status: newStatus } : t
            ));
            
            // --- GIẢ LẬP GỬI EMAIL THÔNG BÁO ---
            let toastMessage = '';
            if (newStatus === 'active') {
                toastMessage = `Đã duyệt và gửi email thông báo: ${teacher.email} đã được chấp nhận.`;
            } else {
                toastMessage = `Đã từ chối và gửi email thông báo: ${teacher.email} đã bị từ chối.`;
            }
            setToast({ message: toastMessage, type: 'success' });
            
            // Đóng modal nếu nó đang mở
            setSelectedTeacher(null);

        } catch (e) {
            console.error(`Error updating status for ${teacherId}:`, e);
            setToast({ message: `Lỗi khi cập nhật trạng thái: ${e.message}.`, type: 'error' });
        }
    };

    // Hành động: Đồng ý -> active, Từ chối -> blocked
    const handleApprove = (e, teacherId) => {
        if (e && typeof e.stopPropagation === 'function') {
            e.stopPropagation(); 
        }
        handleReview(teacherId, 'active');
    };
    const handleReject = (e, teacherId) => {
        if (e && typeof e.stopPropagation === 'function') {
            e.stopPropagation(); 
        }
        handleReview(teacherId, 'blocked');
    };
    
    // Ánh xạ Trạng thái
    const statusMap = {
        'pending': 'Chờ duyệt',
        'active': 'Đã duyệt', // Đổi tên hiển thị cho rõ ràng
        'blocked': 'Đã từ chối', // Đổi tên hiển thị cho rõ ràng
    };
    
    // Ánh xạ màu sắc cho Trạng thái (chỉ dùng cho mục đích hiển thị trong modal/danh sách)
    const statusColorMap = (status) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'active': return 'bg-green-100 text-green-800';
            case 'blocked': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }
    

    // Lọc danh sách giáo viên: CHỈ GIỮ LẠI PENDING
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
            <div className="bg-red-500/20 text-red-700 p-6 rounded-xl my-4 border border-red-500 shadow-xl">
                <h3 className="font-bold text-xl mb-2">Lỗi Hệ thống</h3>
                <p className="mb-4">{error}</p>
                <button 
                    onClick={fetchTeachers} 
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold"
                >
                    Thử tải lại
                </button>
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
                    Danh sách các yêu cầu đang chờ xử lý ({filteredTeachers.length} yêu cầu)
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
                            // Thêm onClick để mở modal chi tiết
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
                                {/* Trạng thái (luôn là Chờ duyệt trong danh sách này) */}
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
            
            <div className="mt-8 text-center text-gray-500 text-sm">
                
            </div>
        </div>
    );
}