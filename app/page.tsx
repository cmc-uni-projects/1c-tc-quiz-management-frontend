'use client';

import React from "react";
// Đã loại bỏ import Link từ 'next/link' và sử dụng thẻ <a> thuần
// Đã loại bỏ import DefaultLayout để tránh lỗi phân giải

// Component Môn học - Giả định đã có đầy đủ logic
const SubjectCard = ({ title, color, image }: { title: string, color: string, image: string }) => (
    <div 
        className="w-full flex flex-col rounded-xl overflow-hidden shadow-2xl transition duration-300 transform hover:scale-[1.02] cursor-pointer"
        style={{ 
            backgroundColor: color, 
            height: '350px',
            borderColor: color, // Thêm border color cho rõ ràng
            borderWidth: '2px',
        }}
    >
        {/* Phần ảnh Môn học */}
        <div 
            className="h-2/3 flex items-center justify-center bg-white p-4"
            style={{ 
                backgroundImage: `url(${image})`, 
                backgroundSize: 'cover', 
                backgroundPosition: 'center' 
            }}
        >
            {/* Nội dung ảnh (hoặc placeholder nếu ảnh không load) */}
            <div className="text-gray-800 text-3xl font-bold bg-white/70 p-2 rounded-lg backdrop-blur-sm">
                {/* [Hình ảnh placeholder cho Môn học] */}
            </div>
        </div>
        
        {/* Phần tên Môn học */}
        <div 
            className="h-1/3 flex items-center justify-center text-3xl font-bold text-white p-4"
            style={{ backgroundColor: color }} // Dùng màu chủ đạo cho nền
        >
            {title}
        </div>
    </div>
);

// Component Header (Navbar) - Lấy từ DefaultLayout
const PublicHeader = () => {
    return (
        <header data-global="true" className="sticky top-0 z-50 w-full border-b border-zinc-100 bg-white/95 backdrop-blur">
            <div className="mx-auto flex w-full max-w-full items-center justify-between gap-2 px-4 py-3 md:px-6"> 
                
                {/* 1. Logo/Tên dự án */}
                <a 
                    href="/" 
                    className="shrink-0 text-4xl font-black tracking-tighter" 
                    style={{ color: '#E33AEC' }} 
                >
                    QuizzZone
                </a>
                
                {/* 2. Mục Điều hướng Chính */}
                <nav className="flex flex-1 items-center justify-center text-lg font-medium text-zinc-600"> 
                    <a href="/" className="hover:text-zinc-900 transition duration-150">Trang chủ</a>
                </nav>
                
                {/* 3. Nút Hành động */}
                <div className="flex shrink-0 items-center gap-2">
                    <a 
                        href="/login" 
                        className="rounded-lg px-4 py-2 font-medium shadow-md hover:shadow-lg transition duration-200 text-lg" 
                        style={{ backgroundColor: '#0000002E', color: 'black' }} 
                    >
                        Đăng nhập
                    </a>
                    
                    <a 
                        href="/register" 
                        className="rounded-lg px-4 py-2 font-bold shadow-md hover:shadow-lg transition duration-200 text-lg border-2"
                        style={{ 
                            backgroundColor: 'white', 
                            color: '#E33AEC', 
                            borderColor: '#E33AEC', 
                        }} 
                    >
                        Đăng ký
                    </a>
                </div>
            </div>
        </header>
    );
};

// Component Footer - Lấy từ DefaultLayout
const Footer = () => (
    <footer className="w-full bg-white border-t border-zinc-100 text-center py-6">
        <p className="text-sm text-zinc-600">
            &copy; 2025 QuizzZone. Mọi quyền được bảo lưu.
        </p>
    </footer>
);


export default function Home() {
    
    // Dữ liệu 3 môn học
    const subjects = [
        { title: "Toán học", color: "#FBC02D", image: "/roles/Math.jpg" }, // Vàng/Đỏ cam
        { title: "Tiếng Anh", color: "#689F38", image: "/roles/English.jpg" }, // Xanh lá cây
        { title: "Vật lý", color: "#7B1FA2", image: "/roles/Physics.jpg" }, // Tím đậm
    ];
    
  return (
    <>
        {/* NHÚNG TRỰC TIẾP HEADER VÀO ĐÂY */}
        <PublicHeader />
        
        {/* Màu nền toàn trang: #6D0446 (Màu tím/đỏ chủ đạo) */}
        <main className="min-h-[calc(100vh-140px)] flex flex-col items-center justify-start py-10 px-4" style={{ backgroundColor: '#6D0446' }}>
            
            {/* Khối chính giữa màn hình */}
            <div className="w-full max-w-6xl flex flex-col items-center"> 
            
            {/* Phần Title và Slogan */}
            <h1 className="text-6xl font-extrabold mb-4 text-center" style={{ color: '#E33AEC' }}>
                Quizz ngay bây giờ với QuizzZone
            </h1>
            <p className="text-2xl mb-12 text-center text-white/90">
                Hãy thử thách trí tuệ, khám phá kiến thức và học tập thú vị cùng mọi người.
            </p>

            {/* Thanh Nhập Mã Phòng - Nổi bật */}
            <div className="w-full max-w-xl bg-white p-6 rounded-2xl shadow-2xl mb-16 border-4" style={{ borderColor: '#E33AEC' }}>
                <h3 className="text-xl font-semibold mb-3 text-gray-700">Tham gia một phòng học / trò chơi</h3>
                <div className="flex gap-3">
                    <input 
                        type="text" 
                        placeholder="Nhập mã phòng (Ví dụ: 123 456)" 
                        className="flex-1 p-3 rounded-lg border-2 focus:ring-2 focus:ring-purple-400 outline-none text-lg"
                    />
                    <button 
                        className="px-6 py-3 rounded-lg text-white font-bold transition duration-200 shadow-md hover:shadow-lg text-lg"
                        style={{ backgroundColor: '#58CC02' }} // Màu xanh lá nổi bật
                    >
                        Tham gia
                    </button>
                </div>
            </div>

            {/* Nút Tạo trò chơi */}
            <div className="flex flex-col items-center mb-20">
                <p className="text-3xl font-medium text-white/90 mb-4">
                    Tạo trò chơi đố vui của riêng bạn, miễn phí!
                </p>
                <a 
                    href="/create-quiz" 
                    className="px-10 py-4 rounded-full text-white font-extrabold transition duration-200 shadow-xl hover:shadow-2xl text-2xl"
                    style={{ backgroundColor: '#6A1B9A' }} // Tím đậm
                >
                    Bắt đầu ngay
                </a>
            </div>
            
            {/* PHẦN THƯ VIỆN/MÔN HỌC */}
            <h2 className="text-5xl font-extrabold mb-10 text-center text-white">
                Khám phá Thư viện
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
                {subjects.map((subject) => (
                    <SubjectCard 
                        key={subject.title} 
                        title={subject.title} 
                        color={subject.color} 
                        image={subject.image} 
                    />
                ))}
            </div>
            
            </div>
        </main>
        
        {/* NHÚNG TRỰC TIẾP FOOTER VÀO ĐÂY */}
        <Footer />
    </>
  );
}