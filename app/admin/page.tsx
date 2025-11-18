'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

// Định nghĩa màu sắc theo cấu trúc layout
const MAIN_BANNER_BG = '#6D0446'; // Màu tím sẫm (PRIMARY_COLOR từ layout)
const BUTTON_BG = '#9453C9'; // Màu tím cho nút Tìm
const INPUT_BG = 'white'; // Màu trắng cho ô nhập liệu

export default function AdminPage() {
    const router = useRouter();
    const [roomCode, setRoomCode] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);

    const handleLogout = async () => {
        try {
      const response = await fetch('/api/logout', {
                method: 'POST',
                credentials: 'include' 
            });
            
        // Treat as success if request completes; server API normalizes redirects
        toast.success('Đăng xuất thành công');
        router.push('/login');
    } catch (error) {
            console.error('Logout error:', error);
            toast.error('Có lỗi khi đăng xuất');
            router.push('/login');
        }
    };

    const handleSearch = () => {
        const cleanedCode = roomCode.trim().replace(/\s/g, ''); 
        
        if (cleanedCode.length >= 6) {
            setIsSearching(true);
            console.log(`Bắt đầu tìm kiếm phòng với mã: ${cleanedCode}`);
            
            // Giả lập thời gian tìm kiếm
            setTimeout(() => {
                setIsSearching(false);
                // Xử lý logic tìm kiếm
                console.log('Đã hoàn thành tìm kiếm.');
            }, 1500);
        } else {
            console.error('Mã phòng phải có ít nhất 6 ký tự.');
        }
    };
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    return (
        <div className="flex-grow flex flex-col" style={{ backgroundColor: MAIN_BANNER_BG }}>
            {/* Banner Lớn - Chứa Form Tìm Kiếm */}
            <div 
                className="w-full flex-grow flex flex-col items-center justify-center p-8" 
            >
                {/* 1. Tiêu đề Lớn QuizzZone */}
                <h1 
                    className="text-6xl md:text-8xl font-black tracking-tighter mb-4 text-white text-center" 
                >
                    QuizzZone
                </h1>
                
                {/* 2. Slogan (Màu trắng, căn giữa) */}
                <p className="text-xl font-medium text-white sm:text-3xl mt-2 mb-8 text-center max-w-2xl">
                    Hãy thử thách trí tuệ cùng QuizzZone.
                </p>

                {/* 3. Thanh Tìm Kiếm Phòng (Dưới Slogan, căn giữa) */}
                <div className="flex w-full max-w-lg items-center rounded-full shadow-xl">
                    
                    <input
                        type="text"
                        placeholder="Nhập mã phòng"
                        value={roomCode}
                        onChange={(e) => setRoomCode(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={isSearching}
                        className="flex-1 bg-white text-zinc-900 px-6 py-4 placeholder:text-zinc-500 focus:outline-none text-xl font-medium rounded-l-full shadow-inner h-16 border-r-0"
                        style={{ backgroundColor: INPUT_BG }}
                    />

                    <button 
                        onClick={handleSearch} 
                        disabled={isSearching}
                        className={`flex h-16 w-32 items-center justify-center rounded-r-full text-white text-xl font-bold transition duration-200 
                            ${isSearching 
                                ? 'bg-zinc-400 cursor-not-allowed' 
                                : 'hover:brightness-110'}`
                        }
                        style={{ backgroundColor: BUTTON_BG }}
                        aria-label="Tìm phòng"
                    >
                        {isSearching ? (
                            <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            <span className='tracking-wide'>Tìm</span>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
