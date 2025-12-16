// app/student/studenthome/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useUser } from '@/lib/user';
import StudentLayout from '@/components/StudentLayout'; // Import layout mới
import { fetchApi } from '@/lib/apiClient'; // Fix apiClient import to import fetchApi instead

// --- FIREBASE DYNAMIC LOADING & CONFIG (GIỮ NGUYÊN) ---
let initializeApp: any;
let getAuth: any;
let signInWithCustomToken: any;
let signInAnonymously: any;
let getFirestore: any;
let doc: any;
let getDoc: any;

// Load Firebase từ CDN
const loadFirebase = async () => {
    try {
        if (!(window as any).firebase) {
            console.error("Firebase chưa load từ CDN!");
            return false;
        }

        const firebase = (window as any).firebase;

        initializeApp = firebase.initializeApp;
        getAuth = () => firebase.auth();
        signInWithCustomToken = (auth: { signInWithCustomToken: (arg0: any) => any; }, token: any) => auth.signInWithCustomToken(token);
        signInAnonymously = (auth: { signInAnonymously: () => any; }) => auth.signInAnonymously();
        getFirestore = () => firebase.firestore();
        doc = (path: any) => firebase.firestore().doc(path);
        getDoc = async (ref: { get: () => any; }) => ref.get();

        return true;
    } catch (e) {
        console.error("Firebase load failed:", e);
        return false;
    }
};

/* ===========================================================
    MAIN HOME CONTENT
=========================================================== */

interface Subject {
    id: number;
    title: string;
    subtitle: string;
    color: string;
    image: string;
}

const StudentHomeContent = () => {
    const router = useRouter();
    const { user } = useUser();

    const [roomCode, setRoomCode] = useState('');
    const [isJoining, setIsJoining] = useState(false);
    const [db, setDb] = useState<any>(null);
    const [isFirebaseReady, setIsFirebaseReady] = useState(false);
    const [subjects, setSubjects] = useState<Subject[]>([]); // Dữ liệu môn học
    const [completedExams, setCompletedExams] = useState<number | null>(null);
    const [averageScore, setAverageScore] = useState<number | null>(null);

    const displayName = (() => {
        if (!user) return '';

        const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
        if (fullName) return fullName;

        const rawUser = user.username || user.email || '';
        if (typeof rawUser === 'string' && rawUser.includes('@')) {
            return rawUser.split('@')[0];
        }

        return rawUser;
    })();

    // Init Firebase (GIỮ NGUYÊN)
    useEffect(() => {
        const initFirebase = async () => {
            const loaded = await loadFirebase();
            if (!loaded) return setIsFirebaseReady(true);
            // ... (Phần khởi tạo Firebase giữ nguyên)
            try {
                const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');
                if (!firebaseConfig.apiKey) return setIsFirebaseReady(true);

                const app = initializeApp(firebaseConfig);
                const firestoreDb = getFirestore(app);
                const firebaseAuth = getAuth(app);

                if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                    await signInWithCustomToken(firebaseAuth, __initial_auth_token);
                } else {
                    await signInAnonymously(firebaseAuth);
                }

                setDb(firestoreDb);
                setIsFirebaseReady(true);
            } catch (err) {
                console.error("Firebase init failed:", err);
                toast.error("Không thể khởi tạo dịch vụ.");
            }
        };

        initFirebase();
    }, []);

    // Lấy dữ liệu Môn học từ API (THAY THẾ DỮ LIỆU CỨNG)
    useEffect(() => {
        const fetchSubjects = async () => {
            try {
                // Thay thế bằng endpoint API thực tế của bạn
                // const response = await apiClient.get('/api/subjects');
                // setSubjects(response.data);

                // Dữ liệu mẫu thay thế tạm thời cho API call
                const mockSubjects: Subject[] = [
                    { id: 1, title: 'Toán học', subtitle: 'Giải tích', color: '#FBC02D', image: '/roles/Math.jpg' },
                    { id: 2, title: 'Tiếng anh', subtitle: 'Tiếng anh cấp độ 1', color: '#FBC02D', image: '/roles/English.jpg' },
                    { id: 3, title: 'Vật lý', subtitle: 'Cơ học', color: '#7B1FA2', image: '/roles/Physics.jpg' },
                ];
                setSubjects(mockSubjects);

            } catch (error) {
                console.error("Failed to fetch subjects:", error);
                toast.error("Không thể tải danh sách môn học.");
            }
        };

        fetchSubjects();
    }, []);

    // Lấy thống kê thật cho thanh tổng kết từ lịch sử làm bài của sinh viên
    useEffect(() => {
        if (!user || typeof (user as any).id === 'undefined') return;

        const loadStats = async () => {
            try {
                const histories = await fetchApi(`/examHistory/student/${(user as any).id}`);

                if (Array.isArray(histories) && histories.length > 0) {
                    const examsDone = histories.length;
                    const totalScore = histories.reduce((sum: number, h: any) => {
                        const s = typeof h.score === 'number' ? h.score : 0;
                        return sum + s;
                    }, 0);

                    const avg = totalScore / examsDone;

                    setCompletedExams(examsDone);
                    setAverageScore(Number.isFinite(avg) ? parseFloat(avg.toFixed(1)) : 0);
                } else {
                    setCompletedExams(0);
                    setAverageScore(0);
                }
            } catch (error) {
                console.error('Không thể tải thống kê học viên:', error);
            }
        };

        loadStats();
    }, [user]);

    /* JOIN ROOM - Updated to use Online Exam API */
    const handleJoinRoom = async () => {
        if (!roomCode.trim()) {
            toast.error("Vui lòng nhập mã phòng.");
            return;
        }

        setIsJoining(true);

        try {
            const code = roomCode.trim();

            // Call API to join online exam
            const response = await fetchApi(`/online-exams/join/${code}`, {
                method: "POST",
            });

            if (response) {
                toast.success(`Tham gia phòng ${code} thành công!`);
                // Redirect to waiting room
                router.push(`/student/waiting-room/${code}`);
            }
        } catch (error: any) {
            console.error("Join room error:", error);
            if (error.message) {
                toast.error(error.message);
            } else {
                toast.error("Mã phòng không hợp lệ hoặc bài thi chưa bắt đầu.");
            }
        } finally {
            setIsJoining(false);
        }
    };

    /* SUBJECT CLICK (GIỮ NGUYÊN) */
    const handleSubjectClick = (id: number, title: string) => {
        // Tốt hơn là chuyển đến list-exams với query subjectId, nhưng giữ nguyên theo cấu trúc cũ
        router.push(`/student/startexam?subjectId=${id}&title=${title}`);
    };

    return (
        <div className="bg-gray-50">

            {/* Hero Banner */}
            <div
                className="w-full text-white bg-cover bg-center min-h-[220px] sm:min-h-[260px] lg:min-h-[300px]"
                style={{
                    backgroundImage: "url('/roles/home.jpg')",
                    backgroundPosition: 'center',
                }}
            >
                <div className="flex flex-col lg:flex-row bg-black/10 px-6 sm:px-8 py-6 sm:py-8">
                    <div className="flex-1 flex flex-col gap-4">
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-2">
                            {displayName ? `Chào mừng, ${displayName}!` : 'Chào mừng bạn!'}
                        </h1>

                        <p className="text-sm sm:text-base text-purple-100 max-w-xl">
                            Bạn đã sẵn sàng để chinh phục bài Quizz tiếp theo chưa?
                        </p>

                        {/* JOIN ROOM INSIDE BANNER (giữ logic, chỉnh lại hình dạng thanh) */}
                        <div className="mt-4 max-w-xl">
                            <div
                                className="flex items-stretch rounded-lg px-4 py-2 shadow-md bg-white/95"
                            >
                                <input
                                    type="text"
                                    placeholder="Nhập mã phòng"

                                    value={roomCode}
                                    onChange={(e) => setRoomCode(e.target.value)}
                                    className="flex-1 bg-transparent border-none px-3 sm:px-4 py-2 text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-0"
                                />

                                <button
                                    onClick={handleJoinRoom}
                                    className="ml-2 rounded-full px-6 sm:px-8 py-2 text-sm sm:text-base font-semibold text-white shadow-md hover:brightness-110"
                                    style={{ backgroundColor: '#A020F0' }}
                                >
                                    {isJoining ? "Đang tham gia..." : "Tham gia"}
                                </button>
                            </div>

                        </div>

                        <div className="mt-4 bg-white/95 rounded-xl px-4 sm:px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 max-w-xl">
                            <div className="flex-1 text-center">
                                <div className="text-xs sm:text-sm font-semibold text-zinc-700">Bài thi đã hoàn thành</div>
                                <div className="text-2xl sm:text-3xl font-extrabold" style={{ color: '#E33AEC' }}>
                                    {completedExams !== null ? completedExams : '-'}
                                </div>
                            </div>

                            <div className="flex-1 text-center">
                                <div className="text-xs sm:text-sm font-semibold text-zinc-700">Điểm trung bình</div>
                                <div className="text-2xl sm:text-3xl font-extrabold" style={{ color: '#E33AEC' }}>
                                    {averageScore !== null ? averageScore : '-'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Subjects Grid */}
            <div className="px-8 py-8 bg-white">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Khám phá các môn học</h2>

                <div className="flex flex-wrap gap-8">
                    {subjects.length === 0 ? (
                        <p className='text-gray-500'>Đang tải danh sách môn học...</p>
                    ) : (
                        subjects.map((s) => (
                            <div
                                key={s.id}
                                onClick={() => handleSubjectClick(s.id, s.title)}
                                className="flex flex-col cursor-pointer hover:scale-[1.03] transition"
                            >
                                <h3 className="text-base font-bold text-gray-900 mb-3">{s.title}</h3>

                                <div className="overflow-hidden rounded-sm shadow-sm">
                                    <div
                                        className="w-40 h-32 bg-cover bg-center"
                                        style={{ backgroundImage: `url(${s.image})`, backgroundColor: s.color }}
                                    />
                                    <div className="bg-gray-400 text-gray-700 px-4 py-2 text-sm text-center w-40">
                                        {s.subtitle}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

/* ===========================================================
    WRAPPER EXPORT (Sử dụng Layout mới)
=========================================================== */
export default StudentHomeContent;