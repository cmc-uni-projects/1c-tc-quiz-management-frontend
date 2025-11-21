'use client';

import React from "react";

// Định nghĩa các màu sắc chính dựa trên yêu cầu
const EXPLORE_BUTTON_COLOR = '#A53AEC'; // Màu cho nút "Khám phá ngay"

// Component Footer - Sao chép từ Footer trong app/page.jsx gốc
const Footer = () => (
    <footer className="w-full bg-white border-t border-zinc-100 text-center py-6">
        <p className="text-sm text-zinc-600">
            &copy; 2025 QuizzZone. Mọi quyền được bảo lưu.
        </p>
    </footer>
);

export default function PublicHome() {
    return (
        <>
            {/* Dùng Navbar toàn cục trong app/layout.tsx, KHÔNG render header riêng ở đây để tránh trùng lặp */}

            {/* Main Content Area - Đã thêm ảnh nền */}
            <main 
                className="min-h-[calc(100vh-140px)] flex flex-col items-center justify-center py-10 px-4 text-white bg-no-repeat bg-cover bg-center" 
                style={{ 
                    // Đặt ảnh nền
                    backgroundImage: `url('/roles/anhnen.jpg')`, 
                    // Thêm lớp phủ tối (overlay) để chữ trắng dễ đọc hơn trên ảnh
                    backgroundBlendMode: 'multiply', // Kết hợp màu nền và ảnh (tạo lớp phủ)
                }}
            >
                {/* Khối chính giữa màn hình */}
                <div className="w-full max-w-4xl flex flex-col items-center text-center z-10"> 
                    
                    {/* Tiêu đề */}
                    <h1 
                        className="text-6xl font-extrabold mb-6 leading-tight sm:text-7xl md:text-8xl" 
                        style={{ color: 'white' }}
                    >
                        Chào mừng đến với QuizzZone
                    </h1>
                    
                    {/* Mô tả */}
                    <p className="text-xl mb-12 text-white/90 max-w-2xl sm:text-2xl">
                        QuizzZone là nền tảng tạo và chơi quizz online giúp bạn học tập, kiểm tra kiến thức và giải trí cùng bạn bè.
                    </p>

                    {/* Nút Khám phá ngay */}
                    <a 
                        href="/register" 
                        className="px-12 py-4 rounded-full text-white font-bold transition duration-200 shadow-xl hover:shadow-2xl text-xl sm:text-2xl transform hover:scale-[1.05]"
                        style={{ backgroundColor: EXPLORE_BUTTON_COLOR }}
                    >
                        Khám phá ngay
                    </a>
                </div>
            </main>
            
            <Footer />
        </>
    );
}
