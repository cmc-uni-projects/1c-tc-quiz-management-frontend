"use client";

import React, { useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";
import { useUser } from "@/lib/user";
import { fetchApi } from "@/lib/apiClient";

const AdminHome: React.FC = () => {
    const { user } = useUser();
    const username = user?.username;

    const displayName = (() => {
        if (!user) return '';

        const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
        if (fullName) return fullName;

        const rawUser = user.username || (user as any).email || '';
        if (typeof rawUser === 'string' && rawUser.includes('@')) {
            return rawUser.split('@')[0];
        }

        return rawUser;
    })();

    const [roomCode, setRoomCode] = useState("");
    const [stats, setStats] = useState({ users: 0, pendingTeachers: 0, exams: 0 });
    const [recentExams, setRecentExams] = useState<any[]>([]);
    const [allOfflineExams, setAllOfflineExams] = useState<any[]>([]);
    const [activeOnlineExams, setActiveOnlineExams] = useState<any[]>([]);
    const [allOnlineExams, setAllOnlineExams] = useState<any[]>([]);
    const toastRef = useRef<string | null>(null);
    const activeWrapRef = useRef<HTMLDivElement | null>(null);
    const recentWrapRef = useRef<HTMLDivElement | null>(null);
    const [activeLimit, setActiveLimit] = useState<number>(3);
    const [recentLimit, setRecentLimit] = useState<number>(3);

    const showError = (message: string) => {
        if (toastRef.current) toast.dismiss(toastRef.current);
        toastRef.current = toast.error(message);
    };

    const [statsLoading, setStatsLoading] = useState(false);

    useEffect(() => {
        const getCountFromResponse = (res: any) => {
            if (!res) return 0;
            if (Array.isArray(res)) return res.length;
            if (typeof res === 'number') return res;
            if (res.total && typeof res.total === 'number') return res.total;
            if (Array.isArray(res.content)) return res.content.length;
            if (Array.isArray(res.data)) return res.data.length;
            // fallback: try to count keys if object of items
            if (res && typeof res === 'object') return Object.keys(res).length;
            return 0;
        };

        const fetchStats = async () => {
            setStatsLoading(true);
            try {
                const [studentsRes, teachersRes, pendingTeachersRes, examsRes] = await Promise.all([
                    fetchApi('/admin/accounts/students'),
                    fetchApi('/admin/accounts/teachers'),
                    fetchApi('/admin/teachers/pending'),
                    fetchApi('/exams/all'),
                ]);

                const studentsCount = getCountFromResponse(studentsRes);
                const teachersCount = getCountFromResponse(teachersRes);
                const usersCount = studentsCount + teachersCount;

                const pendingCount = getCountFromResponse(pendingTeachersRes);
                const examsCount = getCountFromResponse(examsRes);

                setStats({ users: usersCount, pendingTeachers: pendingCount, exams: examsCount });
            } catch (err: any) {
                console.error("AdminHome: failed to load stats", err);
                showError(err?.message || "Không thể tải thống kê.");
            } finally {
                setStatsLoading(false);
            }
        };

        fetchStats();
    }, []);

    // Recalculate when datasets change (after fetch)
    useEffect(() => {
        const evt = new Event('resize');
        window.dispatchEvent(evt);
    }, [activeOnlineExams, recentExams]);

    // Compute how many cards fit in one row for each section using fixed card width
    useEffect(() => {
        const CARD_TOTAL = 292; // w-64 (256) + p-4 (32) + border (approx 4)
        const GAP = 16; // gap-4
        const calc = (el: HTMLDivElement | null) => {
            if (!el) return 3;
            const width = el.clientWidth;
            if (!width) return 3;
            // compute max columns n so that n*CARD_WIDTH + (n-1)*GAP <= width
            let n = Math.max(1, Math.floor((width + GAP) / (CARD_TOTAL + GAP)));
            while ((n + 1) * CARD_TOTAL + n * GAP <= width) n += 1;
            while (n > 1 && n * CARD_TOTAL + (n - 1) * GAP > width) n -= 1;
            return n;
        };

        const update = () => {
            const a = calc(activeWrapRef.current);
            const r = calc(recentWrapRef.current);
            setActiveLimit(a + 1);
            setRecentLimit(r + 1);
        };

        update();
        const ro = new ResizeObserver(update);
        if (activeWrapRef.current) ro.observe(activeWrapRef.current);
        if (recentWrapRef.current) ro.observe(recentWrapRef.current);
        window.addEventListener('resize', update);
        return () => {
            window.removeEventListener('resize', update);
            try { if (activeWrapRef.current) ro.unobserve(activeWrapRef.current); } catch {}
            try { if (recentWrapRef.current) ro.unobserve(recentWrapRef.current); } catch {}
            ro.disconnect();
        };
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const examsRes = await fetchApi('/exams/all');
                const examsArray: any[] = Array.isArray(examsRes) ? examsRes : (examsRes?.content || []);

                setAllOfflineExams(examsArray);
                const sortedExams = [...examsArray]
                    .sort((a: any, b: any) => new Date(b.startTime || 0).getTime() - new Date(a.startTime || 0).getTime())
                    .slice(0, 6);
                setRecentExams(sortedExams);

                try {
                    const onlineRes = await fetchApi('/online-exams/all');
                    const list: any[] = Array.isArray(onlineRes) ? onlineRes : (onlineRes || []);
                    const active = list.filter((e: any) => ['WAITING','IN_PROGRESS','DRAFT'].includes(e?.status));
                    setAllOnlineExams(list);
                    setActiveOnlineExams(active);
                } catch (err) {
                    console.error('AdminHome: failed to load online exams', err);
                }
            } catch (error: any) {
                console.error('AdminHome: failed to load exams', error);
            }
        };

        fetchData();
    }, []);

    // Build one-row list for active online exams: fill with other exams if not enough
    const displayActiveOnline = React.useMemo(() => {
        let list = [...activeOnlineExams];
        if (list.length < activeLimit) {
            const extras = allOnlineExams.filter((e: any) => !list.some((x: any) => x.id === e.id));
            list = list.concat(extras);
        }
        return list.slice(0, activeLimit);
    }, [activeOnlineExams, allOnlineExams, activeLimit]);

    // Build one-row list for recent offline exams: fill with older exams if not enough
    const displayRecentOffline = React.useMemo(() => {
        let list = [...recentExams];
        if (list.length < recentLimit) {
            const extras = allOfflineExams
                .filter((e: any) => !list.some((x: any) => x.examId === e.examId))
                .sort((a: any, b: any) => new Date(b.startTime || 0).getTime() - new Date(a.startTime || 0).getTime());
            list = list.concat(extras);
        }
        return list.slice(0, recentLimit);
    }, [recentExams, allOfflineExams, recentLimit]);

    const handleJoinRoom = () => {
        if (roomCode.trim()) {
            console.log("Admin joining room:", roomCode);
            toast.success(`Đang điều hướng tới phòng ${roomCode}`);
        } else {
            showError("Vui lòng nhập mã phòng.");
        }
    };

    return (
        <div className="bg-gray-50 flex flex-col min-h-full">
            <main className="pb-10 bg-gray-50 w-full">
                <section
                    className="shadow-lg overflow-hidden text-white min-h-[220px] sm:min-h-[260px] lg:min-h-[300px]"
                    style={{
                        backgroundImage: "url('/roles/home.jpg')",
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                    }}
                >
                    <div className="flex flex-col lg:flex-row bg-black/10 px-4 sm:px-6 py-2 sm:py-3 items-start">
                        <div className="flex-1 flex flex-col gap-3">
                            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-2">
                                {displayName ? `Chào mừng, ${displayName}!` : "Chào mừng, Quản trị viên!"}
                            </h1>

                            <p className="text-sm sm:text-base text-purple-100 max-w-xl">
                                Quản lý hệ thống: duyệt giáo viên, quản lý danh mục và theo dõi hoạt động.
                            </p>

                            <div className="mt-4 max-w-xl">
                                <div className="flex items-stretch rounded-xl px-3 py-2 shadow-md" style={{ backgroundColor: "#f1eff3ff" }}>
                                    <input
                                        type="text"
                                        placeholder="Nhập mã phòng....."
                                        value={roomCode}
                                        onChange={(e) => setRoomCode(e.target.value)}
                                        className="flex-1 bg-transparent border-none px-2 sm:px-4 py-1 sm:py-2 text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-0"
                                    />

                                    <button
                                        onClick={handleJoinRoom}
                                        className="ml-2 rounded-full px-6 sm:px-8 py-2 text-sm sm:text-base font-semibold text-white shadow-md hover:brightness-110"
                                        style={{ backgroundImage: "linear-gradient(90deg,#A53AEC)" }}
                                    >
                                        Tham gia
                                    </button>
                                </div>
                            </div>

                            <div className="mt-4 bg-white/95 rounded-xl px-4 sm:px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 max-w-xl">
                                <div className="flex-1 text-center">
                                    <div className="text-xs sm:text-sm font-semibold text-zinc-700">Người dùng:</div>
                                    <div className="text-2xl sm:text-3xl font-extrabold" style={{ color: "#E33AEC" }}>
                                        {statsLoading ? <svg className="animate-spin inline-block h-6 w-6 text-pink-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg> : stats.users}
                                    </div>
                                </div>

                                <div className="flex-1 text-center">
                                    <div className="text-xs sm:text-sm font-semibold text-zinc-700">Giáo viên chờ duyệt:</div>
                                    <div className="text-2xl sm:text-3xl font-extrabold" style={{ color: "#E33AEC" }}>
                                        {statsLoading ? <svg className="animate-spin inline-block h-6 w-6 text-pink-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg> : stats.pendingTeachers}
                                    </div>
                                </div>

                                <div className="flex-1 text-center">
                                    <div className="text-xs sm:text-sm font-semibold text-zinc-700">Tổng bài thi:</div>
                                    <div className="text-2xl sm:text-3xl font-extrabold" style={{ color: "#E33AEC" }}>
                                        {statsLoading ? <svg className="animate-spin inline-block h-6 w-6 text-pink-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg> : stats.exams}
                                    </div>
                                </div>
                            </div>
                        </div>

                                {/* Right column removed to make content flush with header/navbar */}
                    </div>
                </section>

            </main>
            {/* ACTIVE ONLINE EXAMS */}
            {(allOnlineExams.length > 0) && (
                <section className="px-4 sm:px-6 mt-4 pb-8">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-800">Bài thi online đang hoạt động ({activeOnlineExams.length})</h2>
                        <a href="/admin/list-exam" className="text-sm font-medium hover:underline" style={{ color: '#A53AEC' }}>Xem tất cả →</a>
                    </div>
                    <div className="flex flex-wrap gap-4 w-full" ref={activeWrapRef}>
                        {/* marker class for measuring width */}
                        <div className="hidden exam-card w-64 p-4" />
                        {displayActiveOnline.map((exam) => (
                            <div
                                key={exam.id}
                                className={`exam-card w-64 bg-white rounded-xl p-4 shadow-md border-l-4 ${exam.status === 'IN_PROGRESS' ? 'border-l-green-500' : exam.status === 'WAITING' ? 'border-l-blue-500' : exam.status === 'DRAFT' ? 'border-l-yellow-500' : 'border-l-gray-300'}`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-semibold text-gray-800 truncate flex-1">{exam.name}</h3>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${exam.status === 'IN_PROGRESS' ? 'bg-green-100 text-green-700' : exam.status === 'WAITING' ? 'bg-blue-100 text-blue-700' : exam.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>
                                        {exam.status === 'IN_PROGRESS' ? 'Đang thi' : exam.status === 'WAITING' ? 'Phòng chờ' : exam.status === 'DRAFT' ? 'Nháp' : 'Kết thúc'}
                                    </span>
                                </div>
                                <div className="text-sm text-gray-600 space-y-1 mb-3">
                                    <p>⏳ {exam.durationMinutes} phút</p>
                                    <p>📝 {exam.actualQuestionCount || 0} câu hỏi</p>
                                    <p className="font-mono text-purple-600">Mã: {exam.accessCode}</p>
                                </div>
                                <button
                                    onClick={() => {
                                        if (exam.status === 'IN_PROGRESS') {
                                            window.location.href = `/admin/exam-online/${exam.id}/monitor`;
                                        } else if (exam.status === 'WAITING') {
                                            window.location.href = `/admin/waiting-room/${exam.accessCode}`;
                                        } else if (exam.status === 'DRAFT') {
                                            window.location.href = `/admin/exam-online/update/${exam.id}`;
                                        } else {
                                            window.location.href = `/admin/exam-online/${exam.id}/results`;
                                        }
                                    }}
                                    className="w-full py-2 rounded-lg text-white text-sm font-medium"
                                    style={{ backgroundColor: '#A53AEC' }}
                                >
                                    {exam.status === 'IN_PROGRESS' ? 'Giám sát' : exam.status === 'WAITING' ? 'Vào phòng chờ' : exam.status === 'DRAFT' ? 'Chỉnh sửa' : 'Kết quả'}
                                </button>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* RECENT EXAMS */}
            <section className="px-4 sm:px-6 pb-8">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">Bài thi gần đây</h2>
                    <a href="/admin/list-exam" className="text-sm font-medium hover:underline" style={{ color: '#A53AEC' }}>Xem tất cả →</a>
                </div>

                {recentExams.length === 0 ? (
                    <div className="bg-white rounded-xl p-8 text-center text-gray-500 shadow-sm">
                        <p>Chưa có bài thi nào.</p>
                        <a href="/admin/update-exam/create" className="inline-block mt-4 px-6 py-2 rounded-full text-white font-medium" style={{ backgroundColor: '#A53AEC' }}>Tạo bài thi đầu tiên</a>
                    </div>
                ) : (
                    <div className="flex flex-wrap gap-4 w-full" ref={recentWrapRef}>
                        {displayRecentOffline.map((exam) => (
                            <div key={exam.examId} className={`w-64 bg-white rounded-xl p-4 shadow-md border-l-4 ${exam.status === 'PUBLISHED' ? 'border-l-green-500' : 'border-l-yellow-400'}`}>
                                {/* marker class for measuring width */}
                                <div className="hidden exam-card" />
                                <p className="font-semibold text-lg mb-2 truncate" title={exam.title}>{exam.title}</p>
                                <div className="text-sm space-y-1 text-gray-600">
                                    <p className="flex items-center gap-2">Bắt đầu: {exam.startTime ? new Date(exam.startTime).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }) : 'N/A'}</p>
                                    <p className="flex items-center gap-2">Kết thúc: {exam.endTime ? new Date(exam.endTime).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }) : 'N/A'}</p>
                                    <p>⏳ Thời gian: {exam.durationMinutes} phút</p>
                                    {exam.status !== 'PUBLISHED' && (<p className="text-yellow-600 font-medium">⚠ Bản nháp</p>)}
                                </div>
                                <div className="flex items-center justify-between mt-3">
                                    {exam.status !== 'PUBLISHED' ? (
                                        <a href={`/admin/update-exam/${exam.examId}`} className="text-sm bg-yellow-100 text-yellow-700 px-3 py-1 rounded hover:bg-yellow-200">Tiếp tục chỉnh sửa</a>
                                    ) : (
                                        <a href={`/admin/detail-exam/${exam.examId}`} className="text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded hover:bg-purple-200">Xem chi tiết</a>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};

export default AdminHome;
