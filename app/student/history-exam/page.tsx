"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/apiClient";
import toast from "react-hot-toast";

interface ExamHistory {
    id: number;
    examTitle: string;
    submittedAt: string;
    attemptNumber: number;
    score: number;
}

export default function StudentHistoryPage() {
    const router = useRouter();
    const [histories, setHistories] = useState<ExamHistory[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTitle, setSearchTitle] = useState("");
    const [searchDate, setSearchDate] = useState("");

    useEffect(() => {
        const loadHistory = async () => {
            try {
                // 1. Get current user profile to find ID
                const profile = await fetchApi('/me');
                if (!profile || !profile.id) {
                    toast.error("Không xác định được danh tính người dùng.");
                    return;
                }

                // 2. Fetch history
                const data = await fetchApi(`/examHistory/student/${profile.id}`);

                // 3. Map to state
                if (Array.isArray(data)) {
                    setHistories(data);
                }
            } catch (error) {
                console.error("Load history error:", error);
                toast.error("Không thể tải lịch sử thi.");
            } finally {
                setLoading(false);
            }
        };
        loadHistory();
    }, []);

    // Filter
    const filteredHistories = histories.filter(h => {
        const matchTitle = h.examTitle ? h.examTitle.toLowerCase().includes(searchTitle.toLowerCase()) : false;
        const dateStr = h.submittedAt ? new Date(h.submittedAt).toISOString().split('T')[0] : '';
        const matchDate = searchDate ? dateStr === searchDate : true;
        return matchTitle && matchDate;
    });

    const formatDate = (isoString: string) => {
        if (!isoString) return "";
        const date = new Date(isoString);
        // MM-DD-YYYY as in mockup? Or Vietnamese format DD/MM/YYYY? 
        // Mockup shows: 12-19-2005. Let's try to match standard Vietnamese or just DD/MM/YYYY.
        return date.toLocaleDateString('vi-VN');
    };

    const formatTime = (isoString: string) => {
        if (!isoString) return "";
        const date = new Date(isoString);
        return date.toLocaleTimeString('en-US', { hour12: true }); // 10:47:20 A.M
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8 font-sans">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Lịch sử thi</h2>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">

                {/* SEARCH & FILTER */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            placeholder="Nhập tiêu đề..."
                            className="w-full pl-4 pr-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:border-purple-500"
                            value={searchTitle}
                            onChange={(e) => setSearchTitle(e.target.value)}
                        />
                    </div>
                    <div className="relative w-full md:w-64">
                        <input
                            type="date"
                            className="w-full px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:border-purple-500 text-gray-600"
                            value={searchDate}
                            onChange={(e) => setSearchDate(e.target.value)}
                        />
                    </div>
                    <button className="bg-[#D900FF] hover:bg-purple-700 text-white px-8 py-2 rounded-full font-medium transition-colors">
                        Tìm kiếm
                    </button>
                </div>

                <p className="mb-4 text-sm font-semibold text-gray-700">Trang 1/1</p>

                {/* TABLE */}
                <div className="overflow-x-auto border border-gray-300 rounded-lg">
                    <table className="w-full text-center text-sm">
                        <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-300">
                            <tr>
                                <th className="py-3 px-4 border-r border-gray-300 w-16">STT</th>
                                <th className="py-3 px-4 border-r border-gray-300">Tên bài thi</th>
                                <th className="py-3 px-4 border-r border-gray-300">Thời gian thi</th>
                                <th className="py-3 px-4 border-r border-gray-300">Thời gian nộp bài</th>
                                <th className="py-3 px-4 border-r border-gray-300">Lượt thi</th>
                                <th className="py-3 px-4 border-r border-gray-300">Điểm</th>
                                <th className="py-3 px-4 w-32">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="py-8 text-gray-500">Đang tải dữ liệu...</td>
                                </tr>
                            ) : filteredHistories.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-8 text-gray-500">Không tìm thấy lịch sử thi nào.</td>
                                </tr>
                            ) : (
                                filteredHistories.map((item, index) => (
                                    <tr key={item.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                                        <td className="py-3 px-4 border-r border-gray-200">{index + 1}</td>
                                        <td className="py-3 px-4 border-r border-gray-200 font-medium text-gray-800">{item.examTitle || "---"}</td>
                                        <td className="py-3 px-4 border-r border-gray-200">{formatDate(item.submittedAt)}</td>
                                        <td className="py-3 px-4 border-r border-gray-200">{formatTime(item.submittedAt)}</td>
                                        <td className="py-3 px-4 border-r border-gray-200">{item.attemptNumber}</td>
                                        <td className="py-3 px-4 border-r border-gray-200 font-bold text-gray-800">{item.score !== undefined ? item.score : "-"}</td>
                                        <td className="py-3 px-4">
                                            <button
                                                onClick={() => router.push(`/student/history-exam/${item.id}`)}
                                                className="bg-[#5C7CFA] hover:bg-blue-600 text-white px-4 py-1 rounded-full text-xs font-medium"
                                            >
                                                Xem
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* PAGINATION (Simple mock for now as backend paging not fully utilized in basic fetch) */}
                <div className="flex justify-center items-center gap-2 mt-6">
                    <button className="w-8 h-8 flex items-center justify-center border border-blue-200 text-blue-500 rounded hover:bg-blue-50">«</button>
                    <button className="w-8 h-8 flex items-center justify-center border border-blue-200 text-blue-500 rounded hover:bg-blue-50">‹</button>
                    <button className="w-8 h-8 flex items-center justify-center border border-blue-500 bg-blue-50 text-blue-600 font-bold rounded">1</button>
                    <button className="w-8 h-8 flex items-center justify-center border border-blue-200 text-blue-500 rounded hover:bg-blue-50">›</button>
                    <button className="w-8 h-8 flex items-center justify-center border border-blue-200 text-blue-500 rounded hover:bg-blue-50">»</button>
                </div>

            </div>

            <footer className="mt-8 text-center text-gray-400 text-sm">
                © 2025 QuizzZone. Mọi quyền được bảo lưu.
            </footer>
        </div>
    );
}
