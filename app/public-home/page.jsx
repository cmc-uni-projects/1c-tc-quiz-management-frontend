'use client';

import React from "react";

// Định nghĩa các màu sắc chính dựa trên yêu cầu
const PRIMARY_PURPLE = '#E33AEC';
const BACKGROUND_COLOR = '#6D0446'; // Màu nền tối toàn cục
const EXPLORE_BUTTON_COLOR = '#A53AEC'; // Màu cho nút "Khám phá ngay"

// Component Header (Navbar) - Sao chép từ PublicHeader trong app/page.jsx gốc
const PublicHeader = () => {
    return (
        <header data-global="true" className="sticky top-0 z-50 w-full border-b border-zinc-100 bg-white/95 backdrop-blur">
            <div className="mx-auto flex w-full max-w-full items-center justify-between gap-2 px-4 py-3 md:px-6"> 
                
                {/* 1. Logo/Tên dự án */}
                <a 
                    href="/" 
                    className="shrink-0 text-4xl font-black tracking-tighter" 
                    style={{ color: PRIMARY_PURPLE }} 
                >
                    QuizzZone
                </a>
                
                {/* 3. Nút Hành động Đăng nhập/Đăng ký */}
                <div className="flex shrink-0 items-center gap-2">
                    <a 
                        href="/login" 
                        className="rounded-full px-5 py-2 font-medium shadow-md transition duration-200 text-base" 
                        style={{ backgroundColor: '#0000002E', color: 'black' }} 
                    >
                        Đăng nhập
                    </a>
                    
                    <a 
                        href="/register" 
                        className="rounded-full px-5 py-2 font-bold shadow-md transition duration-200 text-base border-2"
                        style={{ 
                            backgroundColor: 'white', 
                            color: PRIMARY_PURPLE, 
                            borderColor: PRIMARY_PURPLE, 
                        }} 
                    >
                        Đăng ký
                    </a>
                </div>
            </div>
        </header>
    );
};

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
            <PublicHeader />
            
            {/* Main Content Area - Giống hệt mẫu bạn gửi */}
            <main 
                className="min-h-[calc(100vh-140px)] flex flex-col items-center justify-center py-10 px-4 text-white" 
                style={{ backgroundColor: BACKGROUND_COLOR }}
            >
                {/* Khối chính giữa màn hình */}
                <div className="w-full max-w-4xl flex flex-col items-center text-center"> 
                    
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