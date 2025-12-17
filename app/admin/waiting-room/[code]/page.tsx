"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchApi } from "@/lib/apiClient";
import { toastError, toastSuccess } from "@/lib/toast";
import { QRCodeSVG } from "qrcode.react";
import { Play, Copy, Users, LogOut, Loader2 } from "lucide-react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

interface Participant {
    userId: number;
    displayName: string;
    avatarUrl: string;
}

interface ExamInfo {
    id: number;
    name: string;
    accessCode: string;
    status: string;
    maxParticipants: number;
    participants: number;
}

export default function TeacherWaitingRoomPage() {
    const params = useParams();
    const router = useRouter();
    const accessCode = params.code as string;

    const [loading, setLoading] = useState(true);
    const [exam, setExam] = useState<ExamInfo | null>(null);
    const [participants, setParticipants] = useState<Participant[]>([]);
    const stompClientRef = useRef<any>(null);

    // Fetch Exam Info
    useEffect(() => {
        if (!accessCode) return;

        const fetchInfo = async () => {
            try {
                setLoading(true);
                // Get exam info by access code
                const examData = await fetchApi(`/online-exams/info/${accessCode}`);
                setExam(examData);

                // Get current participants
                const participantsData = await fetchApi(`/waiting-room/${accessCode}/participants`);
                setParticipants(Array.isArray(participantsData) ? participantsData : []);
            } catch (error: any) {
                console.error("Failed to load waiting room:", error);
                toastError(error.message || "Không thể tải thông tin phòng chờ");
                router.push("/admin/list-exam");
            } finally {
                setLoading(false);
            }
        };

        fetchInfo();
    }, [accessCode, router]);

    // WebSocket Connection
    useEffect(() => {
        if (!accessCode) return;

        const client = new Client({
            webSocketFactory: () => new SockJS("http://localhost:8082/ws"),
            debug: function (str) {
                console.log(str);
            },
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
        });

        client.onConnect = function (frame) {
            console.log("Connected: " + frame);
            client.subscribe(`/topic/waiting-room/${accessCode}`, (message) => {
                if (message.body) {
                    const notification = JSON.parse(message.body);
                    if (notification.participants) {
                        setParticipants(notification.participants);
                    }
                }
            });
        };

        client.onStompError = function (frame) {
            console.log('Broker reported error: ' + frame.headers['message']);
            console.log('Additional details: ' + frame.body);
        };

        client.activate();

        return () => {
            client.deactivate();
        };
    }, [accessCode]);

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        toastSuccess("Đã sao chép!");
    };

    const handleStartExam = async () => {
        if (!exam) return;

        // Validate participants
        if (participants.length === 0) {
            if (!confirm("Chưa có học sinh nào tham gia. Bạn có chắc chắn muốn bắt đầu không?")) {
                return;
            }
        }

        try {
            await fetchApi(`/online-exams/${exam.id}/begin`, { method: "POST" });
            toastSuccess("Bắt đầu bài thi thành công!");
            router.push(`/admin/exam-online/${exam.id}/monitor`);
        } catch (error: any) {
            toastError(error.message || "Không thể bắt đầu bài thi");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex items-center gap-2 text-purple-600">
                    <Loader2 className="animate-spin" />
                    <span>Đang tải phòng chờ...</span>
                </div>
            </div>
        );
    }

    if (!exam) return null;

    const joinUrl = `${window.location.origin}/student/join/${exam.accessCode}`;

    return (
        <div className="min-h-screen bg-white text-gray-800 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center px-6 py-4 bg-white border border-gray-200 rounded-xl mb-6 shadow-lg">
                    <div>
                        <h1 className="text-xl font-bold text-gray-800">Phòng chờ: {exam.name}</h1>
                        <p className="text-sm text-gray-600">Trạng thái: {exam.status}</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => router.push("/admin/list-exam")}
                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition flex items-center gap-2"
                        >
                            <LogOut size={18} /> Thoát
                        </button>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Left Column: Info & Controls */}
                    <div className="w-full lg:w-3/5 space-y-6">
                        {/* Join Info */}
                        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xl">
                            <div className="flex flex-col md:flex-row gap-6">
                                <div className="flex-1 space-y-4">
                                    {/* Join Link */}
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                        <div className="text-sm text-gray-600 mb-1">Link tham gia:</div>
                                        <div className="flex items-center justify-between gap-4">
                                            <code className="text-purple-600 truncate">{joinUrl}</code>
                                            <button
                                                onClick={() => handleCopy(joinUrl)}
                                                className="p-2 hover:bg-gray-200 rounded-lg transition"
                                            >
                                                <Copy size={20} className="text-gray-600 hover:text-gray-800" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Access Code */}
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                        <div className="text-sm text-gray-600 mb-1">Mã truy cập:</div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-4xl font-extrabold tracking-wider text-gray-800">
                                                {exam.accessCode}
                                            </span>
                                            <button
                                                onClick={() => handleCopy(exam.accessCode)}
                                                className="p-2 hover:bg-gray-200 rounded-lg transition"
                                            >
                                                <Copy size={20} className="text-gray-600 hover:text-gray-800" />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* QR Code */}
                                <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl">
                                    <QRCodeSVG value={joinUrl} size={150} />
                                    <span className="text-gray-900 text-xs mt-2 font-medium">Quét để tham gia</span>
                                </div>
                            </div>
                        </div>

                        {/* Start Button */}
                        <div className="flex justify-center pt-4">
                            <button
                                onClick={handleStartExam}
                                className="px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xl shadow-lg shadow-purple-900/50 flex items-center gap-3 transition transform hover:scale-105"
                            >
                                <Play size={24} fill="currentColor" />
                                BẮT ĐẦU BÀI THI
                            </button>
                        </div>

                        <div className="flex justify-center">
                            <div className="bg-gray-100 text-gray-600 px-6 py-2 rounded-full flex items-center gap-2 text-sm border border-gray-200">
                                <Users size={16} /> Đang chờ học sinh tham gia...
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Participants */}
                    <div className="w-full lg:w-2/5 bg-white border border-gray-200 rounded-2xl p-6 shadow-xl flex flex-col h-[600px]">
                        <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
                            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <Users className="text-purple-400" />
                                Danh sách tham gia
                            </h3>
                            <span className="bg-purple-100 text-purple-600 px-3 py-1 rounded-full text-sm font-medium">
                                {participants.length} / {exam.maxParticipants}
                            </span>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                            {participants.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-500">
                                    <Users size={48} className="mb-4 opacity-50" />
                                    <p>Chưa có học sinh nào</p>
                                </div>
                            ) : (
                                participants.map((p) => (
                                    <div key={p.userId} className="bg-gray-50 border border-gray-200 p-3 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
                                        <img
                                            src={p.avatarUrl || "https://ui-avatars.com/api/?name=" + p.displayName}
                                            alt={p.displayName}
                                            className="w-10 h-10 rounded-full bg-gray-600 object-cover"
                                        />
                                        <span className="font-medium text-gray-800">{p.displayName}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
