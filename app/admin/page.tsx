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
    const toastRef = useRef<string | null>(null);

    const showError = (message: string) => {
        if (toastRef.current) toast.dismiss(toastRef.current);
        toastRef.current = toast.error(message);
    };

    const [statsLoading, setStatsLoading] = useState(false);

    useEffect(() => {
        const tryFetch = async (endpoint: string) => {
            try {
                const res = await fetchApi(endpoint);
                return res;
            } catch (e) {
                return null;
            }
        };

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
                // Try several possible endpoints used in the codebase/backend
                const usersEndpoints = ['/admin/users', '/users', '/accounts', '/admin/accounts'];
                const teachersPendingEndpoints = ['/admin/teachers/pending', '/teachers/pending', '/admin/teachers'];
                const examsEndpoints = ['/admin/exams', '/exams', '/exams/all'];

                let usersRes = null;
                for (const ep of usersEndpoints) {
                    usersRes = await tryFetch(ep);
                    if (usersRes) break;
                }

                let teachersRes = null;
                for (const ep of teachersPendingEndpoints) {
                    teachersRes = await tryFetch(ep);
                    if (teachersRes) break;
                }

                let examsRes = null;
                for (const ep of examsEndpoints) {
                    examsRes = await tryFetch(ep);
                    if (examsRes) break;
                }

                const usersCount = getCountFromResponse(usersRes);
                const pendingCount = getCountFromResponse(teachersRes);
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

    const handleJoinRoom = () => {
        if (roomCode.trim()) {
            console.log("Admin joining room:", roomCode);
            toast.success(`Đang điều hướng tới phòng ${roomCode}`);
        } else {
            showError("Vui lòng nhập mã phòng.");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-1 flex-col">
            <main className="flex-1 pb-10 bg-gray-50 w-full">
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

            <footer className="mt-auto border-t border-zinc-100 bg-white py-4 text-center text-sm text-zinc-600">&copy; 2025 QuizzZone. Mọi quyền được bảo lưu.</footer>
        </div>
    );
};

export default AdminHome;
