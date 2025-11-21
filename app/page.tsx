'use client';

import React from "react";

const SubjectCard = ({ title, color, image }: { title: string, color: string, image: string }) => (
    <div 
        className="w-full flex flex-col rounded-xl overflow-hidden shadow-2xl transition duration-300 transform hover:scale-[1.02] cursor-pointer"
        style={{ 
            backgroundColor: color, 
            height: '350px',
            borderColor: color,
            borderWidth: '2px',
        }}
    >
        <div
            className="h-2/3 flex items-center justify-center bg-white p-4"
            style={{ 
                backgroundImage: `url(${image})`, 
                backgroundSize: 'cover', 
                backgroundPosition: 'center' 
            }}
        >
            <div className="text-gray-800 text-3xl font-bold bg-white/70 p-2 rounded-lg backdrop-blur-sm">
            </div>
        </div>
        
        <div
            className="h-1/3 flex items-center justify-center text-3xl font-bold text-white p-4"
            style={{ backgroundColor: color }}
        >
            {title}
        </div>
    </div>
);


const Footer = () => (
    <footer className="w-full bg-white border-t border-zinc-100 text-center py-6">
        <p className="text-sm text-zinc-600">
            &copy; 2025 QuizzZone. Mọi quyền được bảo lưu.
        </p>
    </footer>
);


export default function Home() {
    
    const subjects = [
        { title: "Toán học", color: "#FBC02D", image: "/roles/Math.jpg" }, // Vàng/Đỏ cam
        { title: "Tiếng Anh", color: "#689F38", image: "/roles/English.jpg" }, // Xanh lá cây
        { title: "Vật lý", color: "#7B1FA2", image: "/roles/Physics.jpg" }, // Tím đậm
    ];
    
  return (
    <>
        <main className="min-h-[calc(100vh-140px)] flex flex-col items-center justify-start py-10 px-4" style={{ backgroundColor: '#6D0446' }}>
            
            <div className="w-full max-w-6xl flex flex-col items-center">
            
            <h1 className="text-6xl font-extrabold mb-4 text-center" style={{ color: '#E33AEC' }}>
                Quizz ngay bây giờ với QuizzZone
            </h1>
            <p className="text-2xl mb-12 text-center text-white/90">
                Hãy thử thách trí tuệ, khám phá kiến thức và học tập thú vị cùng mọi người.
            </p>

            <div className="w-full max-w-xl bg-white p-6 rounded-2xl shadow-2xl mb-16 border-4" style={{ borderColor: '#E33AEC' }}>
                <h3 className="text-xl font-semibold mb-3 text-gray-700"></h3>
                <div className="flex gap-3">
                    <input 
                        type="text" 
                        placeholder="Nhập mã phòng" 
                        className="flex-1 p-3 rounded-lg border-2 focus:ring-2 focus:ring-purple-400 outline-none text-lg"
                    />
                    <button 
                        className="px-6 py-3 rounded-lg text-white font-bold transition duration-200 shadow-md hover:shadow-lg text-lg"
                        style={{ backgroundColor: ' #A53AEC' }} // Màu xanh lá nổi bật
                    >
                        Tham gia
                    </button>
                </div>
            </div>

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
        
        <Footer />
    </>
  );
}