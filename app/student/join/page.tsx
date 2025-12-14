"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toastError } from "@/lib/toast";
import { LogIn } from "lucide-react";

export default function StudentJoinPage() {
    const [code, setCode] = useState("");
    const router = useRouter();

    const handleJoin = (e: React.FormEvent) => {
        e.preventDefault();
        if (!code.trim()) {
            toastError("Vui lòng nhập mã truy cập");
            return;
        }
        // Redirect to waiting room (which will handle the joining logic via API)
        router.push(`/student/waiting-room/${code.trim()}`);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-8 transform transition-all hover:scale-[1.01]">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Tham gia bài thi</h1>
                    <p className="text-gray-500">Nhập mã truy cập được cung cấp bởi giáo viên</p>
                </div>

                <form onSubmit={handleJoin} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Mã truy cập
                        </label>
                        <input
                            type="text"
                            value={code}
                            onChange={(e) => setCode(e.target.value.toUpperCase())}
                            placeholder="Ví dụ: A1B2C3"
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition text-center text-lg font-mono tracking-widest uppercase"
                            autoFocus
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-bold text-lg shadow-lg shadow-purple-200 transition flex items-center justify-center gap-2"
                    >
                        <LogIn size={20} />
                        Vào phòng chờ
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-400">
                    hoặc quét mã QR từ màn hình giáo viên
                </div>
            </div>
        </div>
    );
}
