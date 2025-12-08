// app/student/studenthome/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useUser } from '@/lib/user';
import StudentLayout from '@/components/StudentLayout'; // Import layout mới
import { apiClient } from '@/lib/apiClient'; // Giả định bạn có apiClient để gọi API

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
        if (!window.firebase) {
            console.error("Firebase chưa load từ CDN!");
            return false;
        }

        const firebase = window.firebase;

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


    /* JOIN ROOM (GIỮ NGUYÊN) */
    const handleJoinRoom = async () => {
        if (!roomCode.trim()) return toast.error("Vui lòng nhập mã phòng.");
        if (!isFirebaseReady || !db) return toast.error("Dịch vụ chưa sẵn sàng.");

        setIsJoining(true);

        try {
            const code = roomCode.trim();
            const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
            const docPath = `/artifacts/${appId}/public/data/quiz_rooms/${code}`;

            const roomRef = doc(db, docPath);
            const snapshot = await getDoc(roomRef);

            if (snapshot.exists()) {
                toast.success(`Tham gia phòng ${code} thành công!`);
                router.push(`/student/quiz-room/${code}`);
            } else {
                toast.error("Mã phòng không hợp lệ.");
            }
        } catch (e) {
            console.error(e);
            toast.error("Đã xảy ra lỗi khi tham gia phòng.");
        }

        setIsJoining(false);
    };

    /* SUBJECT CLICK (GIỮ NGUYÊN) */
    const handleSubjectClick = (id: number, title: string) => {
        // Tốt hơn là chuyển đến list-exams với query subjectId, nhưng giữ nguyên theo cấu trúc cũ
        router.push(`/student/startexam?subjectId=${id}&title=${title}`);
    };

    return (
        <div className="bg-gray-50">

            {/* Hero Banner */}
            <div className="w-full p-8 text-white flex flex-col items-center" style={{ backgroundColor: '#6D0446' }}>
                <h1 className="mb-2 text-4xl font-extrabold">QuizzZone</h1>
                <p className="mb-6 text-lg">Hãy thử thách trí tuệ cùng QuizzZone.</p>

                <div className="flex gap-3 w-full max-w-xl">
                    <input
                        type="text"
                        placeholder="Nhập mã phòng"
                        value={roomCode}
                        onChange={(e) => setRoomCode(e.target.value)}
                        disabled={!isFirebaseReady || isJoining}
                        className="flex-1 rounded-full border-0 px-5 py-3 bg-white text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-purple-400 outline-none"
                    />

                    <button
                        onClick={handleJoinRoom}
                        disabled={!isFirebaseReady || isJoining || !roomCode.trim()}
                        className="rounded-full px-8 py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                        style={{ backgroundColor: '#E33AEC' }}
                    >
                        {isJoining ? "Đang tham gia..." : "Tham gia"}
                    </button>
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