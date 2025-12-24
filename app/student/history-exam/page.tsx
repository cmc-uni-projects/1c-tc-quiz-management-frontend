"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/apiClient";
import toast from "react-hot-toast";
import StudentLayout from "@/components/StudentLayout";

interface ExamHistory {
    id: number;
    examTitle: string;
    submittedAt: string;
    attemptNumber: number;
    score: number;
    examId?: number;
    examOnlineId?: number;
}

export default function StudentHistoryPage() {
    const router = useRouter();
    const [histories, setHistories] = useState<ExamHistory[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTitle, setSearchTitle] = useState("");
    const [searchDate, setSearchDate] = useState("");
    const [currentPage, setCurrentPage] = useState(0);

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
        <div className="min-h-screen bg-gray-50 p-8">
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
                <div className="overflow-hidden rounded-xl border border-gray-100">
                    <table className="w-full text-center text-sm">
                        <thead className="bg-[#F3EBFD] text-[#4D1597] uppercase text-xs font-bold tracking-wider">
                            <tr>
                                <th className="py-4 px-6 font-semibold">STT</th>
                                <th className="py-4 px-6 text-left font-semibold">Tên bài thi</th>
                                <th className="py-4 px-6 font-semibold">Thời gian thi</th>
                                <th className="py-4 px-6 font-semibold">Thời gian nộp bài</th>
                                <th className="py-4 px-6 font-semibold">Lượt thi</th>
                                <th className="py-4 px-6 font-semibold">Điểm</th>
                                <th className="py-4 px-6 font-semibold">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center text-gray-500">
                                        <div className="flex justify-center items-center gap-2">
                                            <div className="w-5 h-5 border-2 border-[#A53AEC] border-t-transparent rounded-full animate-spin"></div>
                                            <span>Đang tải dữ liệu...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredHistories.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center text-gray-500">
                                        Không tìm thấy lịch sử thi nào.
                                    </td>
                                </tr>
                            ) : (
                                (() => {
                                    const ITEMS_PER_PAGE = 10;
                                    const startIndex = currentPage * ITEMS_PER_PAGE;
                                    const currentData = filteredHistories.slice(startIndex, startIndex + ITEMS_PER_PAGE);

                                    return currentData.map((item, index) => (
                                        <tr key={item.id} className="hover:bg-purple-50/30 transition-colors duration-150">
                                            <td className="py-4 px-6 text-gray-500">#{startIndex + index + 1}</td>
                                            <td className="py-4 px-6 text-left font-semibold text-gray-800">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-[#A53AEC] font-bold text-xs shrink-0">
                                                        {(item.examTitle || "E").charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="line-clamp-1" title={item.examTitle}>{item.examTitle || "---"}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-gray-600">{formatDate(item.submittedAt)}</td>
                                            <td className="py-4 px-6 text-gray-600 font-mono text-xs">{formatTime(item.submittedAt)}</td>
                                            <td className="py-4 px-6">
                                                <span className="bg-gray-100 text-gray-600 py-1 px-3 rounded-full text-xs font-bold">
                                                    Lần {item.attemptNumber}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className="text-[#A53AEC] font-bold text-base">
                                                    {item.score !== undefined ? item.score : "-"}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <button
                                                    onClick={() => {
                                                        // Online exam -> redirect to results page
                                                        // Offline exam -> redirect to detail page
                                                        const targetPath = item.examOnlineId
                                                            ? `/student/exam-result/${item.id}`
                                                            : `/student/history-exam/${item.id}`;
                                                        router.push(targetPath);
                                                    }}
                                                    className="group flex items-center justify-center gap-1 mx-auto text-[#A53AEC] hover:text-white hover:bg-[#A53AEC] border border-[#A53AEC] px-3 py-1.5 rounded-lg transition-all duration-200 text-xs font-bold uppercase tracking-wide"
                                                >
                                                    <span>Chi tiết</span>
                                                    <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                                    </svg>
                                                </button>
                                            </td>
                                        </tr>
                                    ));
                                })()
                            )}
                        </tbody>
                    </table>
                </div>

                {/* PAGINATION */}
                {filteredHistories.length > 0 && (() => {
                    const ITEMS_PER_PAGE = 10;
                    const totalPages = Math.ceil(filteredHistories.length / ITEMS_PER_PAGE);

                    return (
                        <div className="flex justify-center items-center gap-2 mt-8">
                            {/* First Page */}
                            <button
                                onClick={() => setCurrentPage(0)}
                                disabled={currentPage === 0}
                                className="px-3 py-1 rounded-full text-gray-400 hover:text-purple-700 hover:bg-purple-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                «
                            </button>

                            {/* Previous Page */}
                            <button
                                onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                                disabled={currentPage === 0}
                                className="px-3 py-1 rounded-full text-gray-400 hover:text-purple-700 hover:bg-purple-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                ‹
                            </button>

                            {/* Page Numbers */}
                            {Array.from({ length: totalPages }, (_, i) => i).slice(Math.max(0, currentPage - 2), Math.min(totalPages, currentPage + 3)).map(i => (
                                <button
                                    key={i}
                                    onClick={() => setCurrentPage(i)}
                                    className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-semibold transition-colors ${currentPage === i
                                        ? 'bg-purple-700 text-white shadow-lg'
                                        : 'text-gray-600 hover:bg-purple-50'
                                        }`}
                                >
                                    {i + 1}
                                </button>
                            ))}

                            {/* Next Page */}
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                                disabled={currentPage === totalPages - 1}
                                className="px-3 py-1 rounded-full text-gray-400 hover:text-purple-700 hover:bg-purple-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                ›
                            </button>

                            {/* Last Page */}
                            <button
                                onClick={() => setCurrentPage(totalPages - 1)}
                                disabled={currentPage === totalPages - 1}
                                className="px-3 py-1 rounded-full text-gray-400 hover:text-purple-700 hover:bg-purple-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                »
                            </button>
                        </div>
                    );
                })()}

            </div>
        </div>
    );
}
