"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/apiClient";
import { toastError } from "@/lib/toast";

interface Exam {
    examId: number;
    title: string;
    startTime: string;
    endTime: string;
    questionCount: number;
    examQuestions: {
        question: {
            difficulty: string;
        };
    }[];
    category?: {
        id: number;
        name: string;
    };
    status?: "PENDING" | "ONGOING" | "COMPLETED"; // Optional, derived or from backend if available
    durationMinutes: number;
    examLevel?: string;
}

// ===== SVG ICONS =====
const ClockIcon = () => (
    <svg
        width="16"
        height="16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        viewBox="0 0 24 24"
    >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
    </svg>
);

const CalendarIcon = () => (
    <svg
        width="16"
        height="16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        viewBox="0 0 24 24"
    >
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
);

const MoreIcon = () => (
    <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
        <circle cx="12" cy="6" r="2" />
        <circle cx="12" cy="12" r="2" />
        <circle cx="12" cy="18" r="2" />
    </svg>
);

// Helper to calculate difficulty
const getDifficultyLabel = (level?: string) => {
    switch (level) {
        case "EASY":
            return "Dễ";
        case "MEDIUM":
            return "Trung bình";
        case "HARD":
            return "Khó";
        default:
            return "Chưa xác định";
    }
};

export default function AdminExamListPage() {
    const [exams, setExams] = useState<Exam[]>([]);
    const [loading, setLoading] = useState(true);
    const [openMenu, setOpenMenu] = useState<number | null>(null);
    const [openShare, setOpenShare] = useState(false);
    const [shareLink, setShareLink] = useState("");
    const [activeTab, setActiveTab] = useState<"link" | "qr">("link");

    const router = useRouter();

    useEffect(() => {
        const fetchExams = async () => {
            try {
                const data = await fetchApi("/exams/my");
                setExams(data);
            } catch (error) {
                console.error("Failed to fetch exams:", error);
                toastError("Không thể tải danh sách bài thi.");
            } finally {
                setLoading(false);
            }
        };
        fetchExams();
    }, []);

    // Sắp xếp từ mới nhất → cũ nhất
    const sortedExams = [...exams].sort(
        (a, b) => Number(new Date(b.startTime || 0)) - Number(new Date(a.startTime || 0))
    );

    // Filter Logic
    // Draft: No questions (questionCount == 0)
    const draftExams = sortedExams.filter((x) => x.questionCount === 0);

    // Ready: Has questions (questionCount > 0)
    const readyExams = sortedExams.filter((x) => x.questionCount > 0);

    const deleteExam = async (id: number) => {
        if (!confirm("Bạn có chắc chắn muốn xóa bài thi này?")) return;
        try {
            await fetchApi(`/exams/delete/${id}`, { method: "DELETE" });
            setExams(exams.filter((e) => e.examId !== id));
            setOpenMenu(null);
        } catch (error: any) {
            toastError(error.message || "Không thể xóa bài thi.");
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString("vi-VN");
    };

    if (loading) return <div className="p-10">Đang tải...</div>;

    return (
        <div className="flex-1 flex flex-col bg-white rounded-xl shadow-lg overflow-hidden min-h-[80vh]">
            <div className="flex-1 px-10 py-8">
                {/* TAB DANH SÁCH BÀI THI / LỊCH SỬ */}
                <div className="border-b border-gray-200 mb-6 flex gap-6 text-sm">
                    <button className="pb-2 border-b-2 border-black font-medium">
                        Danh sách bài thi
                    </button>
                    <button
                        onClick={() => router.push("/admin/history-exam")}
                        className="pb-2 text-gray-500 hover:text-black"
                    >
                        Lịch sử
                    </button>
                </div>

                {/* ========== ĐANG TẠO (Draft - No Questions) ========== */}
                <h2 className="text-xl font-semibold mb-4">Đang tạo</h2>

                {draftExams.length === 0 ? (
                    <p className="text-gray-500 mb-8">Không có bài thi nháp.</p>
                ) : (
                    <div className="flex flex-wrap gap-6 mb-8">
                        {draftExams.map((exam) => (
                            <div
                                key={exam.examId}
                                className="w-64 bg-white rounded-lg shadow p-4 relative border border-gray-100 border-l-4 border-l-yellow-400"
                            >
                                <p className="font-semibold text-lg mb-2 truncate" title={exam.title}>{exam.title}</p>
                                <div className="text-sm space-y-1 text-gray-600">
                                    <p className="flex items-center gap-2">
                                        <ClockIcon /> Bắt đầu: {exam.startTime ? new Date(exam.startTime).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }) : 'N/A'}
                                    </p>
                                    <p className="flex items-center gap-2">
                                        <ClockIcon /> Kết thúc: {exam.endTime ? new Date(exam.endTime).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }) : 'N/A'}
                                    </p>
                                    <p>⏳ Thời gian: {exam.durationMinutes} phút</p>
                                    <p className="text-yellow-600 font-medium">⚠ Chưa có câu hỏi</p>
                                </div>

                                <div className="flex items-center justify-between mt-3">
                                    <button
                                        onClick={() => router.push(`/admin/update-exam/${exam.examId}`)} // Redirect to add questions
                                        className="text-sm bg-yellow-100 text-yellow-700 px-3 py-1 rounded hover:bg-yellow-200"
                                    >
                                        Tiếp tục tạo
                                    </button>
                                    <button
                                        onClick={() => deleteExam(exam.examId)}
                                        className="text-gray-400 hover:text-red-500"
                                        title="Xóa nháp"
                                    >
                                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" /></svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ========== DANH SÁCH BÀI THI (Ready - Has Questions) ========== */}
                <h2 className="text-xl font-semibold mb-4">
                    Danh sách bài thi
                </h2>

                {readyExams.length === 0 ? (
                    <p className="text-gray-500">Chưa có bài thi nào.</p>
                ) : (
                    <div className="flex flex-wrap gap-6">
                        {readyExams.map((exam) => (
                            <div
                                key={exam.examId}
                                className="w-64 bg-white rounded-lg shadow p-4 relative border border-gray-100"
                            >
                                <p className="font-semibold text-lg mb-2 truncate" title={exam.title}>{exam.title}</p>

                                <div className="text-sm space-y-1">
                                    <p className="flex items-center gap-2">
                                        <ClockIcon /> {exam.startTime ? new Date(exam.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                                    </p>
                                    <p className="flex items-center gap-2">
                                        <CalendarIcon /> {formatDate(exam.startTime)}
                                    </p>
                                    <p>⏳ {exam.durationMinutes} Phút</p>
                                    <p>📘 Câu hỏi: {exam.questionCount}</p>
                                    <p>🏷 Danh mục: {exam.category?.name || "N/A"}</p>
                                    <p>📊 Độ khó: <span className="font-medium">{getDifficultyLabel(exam.examLevel)}</span></p>
                                </div>
                                {/* Trạng thái + nút menu */}
                                <div className="flex items-center justify-between mt-3">
                                    <span className="flex-1 text-center text-green-600 font-medium">
                                        Sẵn sàng
                                    </span>
                                    <button
                                        onClick={() =>
                                            setOpenMenu(openMenu === exam.examId ? null : exam.examId)
                                        }
                                        className="ml-2 p-1 rounded hover:bg-gray-100"
                                    >
                                        <MoreIcon />
                                    </button>
                                </div>

                                {/* Dropdown menu */}
                                {openMenu === exam.examId && (
                                    <div className="absolute right-0 top-8 bg-white shadow-lg border rounded-md w-32 py-2 z-20">
                                        <button
                                            onClick={() => deleteExam(exam.examId)}
                                            className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600"
                                        >
                                            Xóa bài thi
                                        </button>
                                        <button
                                            onClick={() => router.push(`/admin/update-exam/${exam.examId}`)} // Assuming update route
                                            className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                                        >
                                            Cập nhật
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShareLink(`${window.location.origin}/teacher/exam/${exam.examId}`);
                                                setOpenShare(true);
                                                setOpenMenu(null);
                                            }}
                                            className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                                        >
                                            Chia sẻ
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
                {openShare && (
                    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                        <div className="bg-white w-[520px] rounded-xl p-6 relative">

                            {/* Nút đóng */}
                            <button
                                onClick={() => setOpenShare(false)}
                                className="absolute top-3 right-4 text-gray-500 hover:text-black text-lg"
                            >
                                x
                            </button>

                            {/* Tiêu đề */}
                            <h2 className="text-xl font-semibold text-center mb-4">
                                Chia sẻ
                            </h2>

                            {/* Tabs */}
                            <div className="flex border-b mb-4">
                                <button
                                    onClick={() => setActiveTab("link")}
                                    className={`flex-1 py-2 ${activeTab === "link"
                                        ? "border-b-2 border-black font-semibold"
                                        : "text-gray-400"
                                        }`}
                                >
                                    Link
                                </button>

                                <button
                                    onClick={() => setActiveTab("qr")}
                                    className={`flex-1 py-2 ${activeTab === "qr"
                                        ? "border-b-2 border-black font-semibold"
                                        : "text-gray-400"
                                        }`}
                                >
                                    Mã QR
                                </button>
                            </div>

                            {/* TAB LINK */}
                            {activeTab === "link" && (
                                <div className="space-y-3 mt-3">
                                    <p className="text-sm">Sao chép link</p>

                                    <div className="flex gap-2">
                                        <input
                                            value={shareLink}
                                            readOnly
                                            className="flex-1 border px-3 py-2 rounded-md text-sm"
                                        />

                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(shareLink);
                                                alert("Đã sao chép!");
                                            }}
                                            className="bg-[#A53AEC] text-white px-4 py-2 rounded-md"
                                        >
                                            Sao chép
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* TAB QR */}
                            {activeTab === "qr" && (
                                <div className="flex flex-col items-center gap-4 mt-4">

                                    {/* Chưa dùng dữ liệu cứng - chỉ khung */}
                                    <div className="w-44 h-44 border-2 border-dashed text-gray-400 flex items-center justify-center">
                                        QR CODE
                                    </div>

                                    <button className="bg-[#A53AEC] text-white px-4 py-2 rounded-md">
                                        Tải xuống
                                    </button>

                                </div>
                            )}
                        </div>
                    </div>
                )}

            </div>

            {/* ============ FOOTER ============ */}
            <footer className="bg-[#F5F5F5] border-t border-gray-200 py-4 text-center text-gray-500 text-sm">
                © 2025 QuizzZone. Mọi quyền được bảo lưu.
            </footer>
        </div>
    );
}
