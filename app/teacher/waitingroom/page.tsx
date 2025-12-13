"use client";

import React from 'react';
import { Play, Copy, QrCode, Share2, Users, Settings, Zap, Clock, ListChecks, User } from 'lucide-react';

// Cấu hình Placeholder
const EMPTY_DATA = {
    joinUrl: "_______",
    joinCode: "_______", //
    participants: 0, //
};

const TeacherWaitingRoomEmpty = () => {
    // Giả định các hàm xử lý
    const handleCopy = (text: string) => {
        // alert(`Chức năng copy cho ${text} chưa sẵn sàng.`);
    };

    return (
        // Nền tối với hiệu ứng
        <div className="min-h-screen bg-[#1F2937] text-white p-6 relative overflow-hidden">
                    <div className="flex justify-between items-center px-4 py-3 bg-[#2D3748] rounded-xl mb-6 shadow-lg">
                        <h1 className="text-xl font-bold text-gray-200">Teacher Waiting Room</h1>
                        <div className="flex space-x-3">
                            <button className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition"><Settings size={20} /></button>
                            <button className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition">End</button>
                        </div>
                    </div>

            {/* Container Chính - Bố cục 2 cột */}
            <div className="flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto">
                {/* Cột 1: Thông tin Mã Tham gia và Controls */}
                <div className="w-full lg:w-3/5">
                    {/* Khối Mã Tham gia Lớn */}
                    <div className="bg-[#2D3748] rounded-2xl p-6 shadow-2xl">
                        <div className="flex gap-4">
                            {/* Phần Mã & URL */}
                            <div className="flex-1 space-y-4">

                                {/* 1. Join URL */}
                                <div className="bg-[#1A202C] p-4 rounded-xl flex items-center justify-between">
                                    <div className="text-sm text-gray-400 mr-4">1. Join using any device</div>
                                    <h3 className="text-2xl font-bold text-teal-400">{EMPTY_DATA.joinUrl}</h3>
                                    <button onClick={() => handleCopy(EMPTY_DATA.joinUrl)} className="ml-4 p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-600"><Copy size={20} /></button>
                                </div>

                                {/* 2. Join Code */}
                                <div className="bg-[#1A202C] p-4 rounded-xl flex items-center justify-between">
                                    <div className="text-sm text-gray-400 mr-4">2. Enter the join code</div>
                                    <h3 className="text-5xl font-extrabold text-white tracking-widest">{EMPTY_DATA.joinCode}</h3>
                                    <button onClick={() => handleCopy(EMPTY_DATA.joinCode)} className="ml-4 p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-600"><Copy size={20} /></button>
                                </div>
                            </div>

                            {/* QR Code & Share */}
                            <div className="flex flex-col items-center justify-between space-y-3 p-2 bg-[#1A202C] rounded-xl">
                                <div className="bg-white p-2 rounded-lg">
                                    {/* Placeholder QR Code */}
                                    <QrCode size={80} className="text-gray-800" />
                                </div>
                                <div className="text-xs text-gray-400">Share via</div>
                                <div className="flex gap-1 text-gray-400">
                                    <Share2 size={16} className="cursor-pointer hover:text-teal-400" />
                                    <Copy size={16} className="cursor-pointer hover:text-teal-400" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Nhóm nút Start và Auto Start */}
                    <div className="mt-6 flex justify-center space-x-4">
                        <button className="px-6 py-3 bg-gray-600 rounded-xl flex items-center gap-2 font-semibold opacity-50 cursor-not-allowed">
                            <Clock size={20} /> Auto start your quiz
                        </button>
                        <button className="px-10 py-3 bg-purple-600 rounded-xl font-bold text-lg shadow-lg shadow-purple-900 opacity-50 cursor-not-allowed flex items-center gap-2">
                            <Play size={20} fill="white" /> START
                        </button>
                    </div>

                    {/* Waiting for participants... */}
                    <div className="mt-8 flex justify-center">
                        <div className="bg-[#1A202C] text-gray-300 px-6 py-3 rounded-full flex items-center gap-2 font-semibold shadow-md">
                            <Users size={20} /> Waiting for participants...
                        </div>
                    </div>

                </div> {/* End Cột 1 */}

                {/* Cột 2: Danh sách Học sinh tham gia (Hiển thị trống) */}
                <div className="w-full lg:w-2/5 bg-[#2D3748] rounded-2xl p-6 shadow-xl">
                    <h3 className="text-xl font-bold text-gray-200 mb-4 flex items-center justify-between border-b border-gray-600 pb-3">
                        <span>Danh sách Học sinh</span>
                        <span className="text-base text-purple-400 font-normal">0 người</span>
                    </h3>

                    {/* Hiển thị thông báo trống */}
                    <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 flex flex-col items-center justify-center h-full text-center py-12">
                        <Users size={32} className="text-gray-500" />
                        <p className="text-gray-400 mt-2">Chưa có học sinh nào tham gia.</p>
                        <p className="text-sm text-gray-500">Mã: {EMPTY_DATA.joinCode}</p>
                    </div>
                </div> {/* End Cột 2 */}

            </div>
        </div>
    );
};

export default TeacherWaitingRoomEmpty;