'use client'; 

import React, { useState } from "react";
// Đã loại bỏ import { useRouter } from "next/navigation"; để tránh lỗi biên dịch

// Màu tím chính và màu sắc theo yêu cầu
const PRIMARY_COLOR = '#6A1B9A';
const LOGO_TEXT_COLOR = '#E33AEC'; 
// Màu nền nội dung chính theo yêu cầu của user
const MAIN_CONTENT_BG = '#6D0446'; 

// Icon người dùng (Lucide/Inline SVG)
const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
    </svg>
);

// Icon Menu (Ba gạch ngang - dùng để Toggle Sidebar)
const MenuIcon = ({ color = 'currentColor', isRotated = false }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`w-6 h-6 transition-transform duration-300 ${isRotated ? 'rotate-90' : 'rotate-0'}`} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="3" y1="12" x2="21" y2="12"></line>
        <line x1="3" y1="6" x2="21" y2="6"></line>
        <line x1="3" y1="18" x2="21" y2="18"></line>
    </svg>
);


// Component ProfileDropdown được nhúng trực tiếp
const ProfileDropdown = () => {
    // Thay thế useRouter bằng chuyển hướng trực tiếp (hoặc fetch)
    const [isOpen, setIsOpen] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const handleLogoutClick = () => {
        setShowLogoutConfirm(true);
        setIsOpen(false);
    };

    const handleLogoutConfirm = async () => {
        // Giả lập hành động đăng xuất
        try {
            // Thay thế router.push('/') bằng window.location.href
            // Trong môi trường thực, đây sẽ là một cuộc gọi API tới backend để xóa session/token
            // await fetch('/logout', { method: 'POST', credentials: 'include' });
            window.location.href = '/'; 
        } catch (error) {
            console.error('Logout error:', error);
            window.location.href = '/'; 
        }
    };

    const handleLogoutCancel = () => {
        setShowLogoutConfirm(false);
    };
    
    // Style cho khối "Xin chào, Admin" màu tím nhạt
    const profileStyle = {
        backgroundColor: '#f3e8ff', // purple-100
    };
    
    return (
        <div className="relative">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center space-x-2 p-1 pr-3 rounded-full transition duration-200 hover:bg-purple-200/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-opacity-50"
                style={profileStyle}
                aria-expanded={isOpen}
            >
                {/* User Icon */}
                <div className="w-8 h-8 rounded-full bg-purple-300 flex items-center justify-center text-purple-800">
                    <UserIcon />
                </div>
                {/* Text "Xin chào, Admin" */}
                <span className="font-semibold text-purple-800 text-sm hidden sm:inline">Xin chào, Admin</span>
            </button>

            {isOpen && (
                <div 
                    className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-1 border border-zinc-200 z-10 origin-top-right animate-fade-in"
                >
                    <a 
                        href="/admin/profile" 
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-600"
                        onClick={() => setIsOpen(false)}
                    >
                        Cập nhật thông tin
                    </a>
                    <a 
                        href="/admin/settings" 
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-600"
                        onClick={() => setIsOpen(false)}
                    >
                        Đổi mật khẩu
                    </a>
                    <div className="border-t border-zinc-100 my-1"></div>
                    <button
                        onClick={handleLogoutClick}
                        className="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                        ← Đăng xuất
                    </button>
                </div>
            )}
            
            {/* Logout Confirmation Modal được render ở đây */}
            {showLogoutConfirm && (
                <LogoutConfirmationModal 
                    isOpen={showLogoutConfirm} 
                    onConfirm={handleLogoutConfirm} 
                    onCancel={handleLogoutCancel} 
                />
            )}
        </div>
    );
};

// Component Modal Xác nhận đăng xuất (Đã sửa lỗi định nghĩa trùng lặp)
const LogoutConfirmationModal = ({ isOpen, onConfirm, onCancel }) => {
    if (!isOpen) return null;
    
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[999]">
            <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl transform transition-all duration-300 scale-100 animate-zoom-in">
                <h3 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">Xác nhận Đăng xuất</h3>
                <p className="text-gray-600 mb-6">Bạn có chắc chắn muốn đăng xuất khỏi hệ thống quản trị QuizzZone?</p>
                <div className="flex gap-3 justify-end">
                    <button
                        onClick={onCancel}
                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition duration-150"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-6 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition duration-150 shadow-md"
                    >
                        Đăng xuất
                    </button>
                </div>
            </div>
        </div>
    );
};

// Component Sidebar
const AdminSidebar = ({ isSidebarOpen, toggleSidebar }) => {
    const navItems = [
        { name: "Trang chủ Admin", href: "/admin" },
        { name: "Trang chủ Web", href: "/" },
        { name: "Quản lý tài khoản", href: "/admin/accounts" },
        { name: "Duyệt tài khoản giáo viên", href: "/admin/approve-teachers" },
        { name: "Danh mục", href: "/admin/categories" },
    ];
    
    const [currentPathname, setCurrentPathname] = useState('/');
    
    // Lấy pathname an toàn
    React.useEffect(() => {
        if (typeof window !== 'undefined') {
            setCurrentPathname(window.location.pathname);
        }
    }, []);

    return (
        <>
            {/* Lớp phủ cho mobile */}
            {isSidebarOpen && (
                <div 
                    className="md:hidden fixed inset-0 bg-black/50 z-40" 
                    onClick={toggleSidebar}
                ></div>
            )}
            
            {/* Sidebar chính */}
            <aside 
                className={`w-80 bg-white border-r border-zinc-200 h-screen fixed top-0 left-0 z-50 transform transition-transform duration-300 shadow-2xl md:translate-x-0
                    ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                
                {/* Khu vực Logo */}
                <div 
                    className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 bg-white" 
                >
                    {/* Logo/Tên dự án */}
                    <a 
                        href="/admin" 
                        className="text-2xl font-black tracking-tighter" 
                        style={{ color: LOGO_TEXT_COLOR }} 
                    >
                        QuizzZone
                    </a>
                    {/* Nút đóng trên mobile */}
                    <button 
                        onClick={toggleSidebar} 
                        className="md:hidden text-zinc-600 hover:text-purple-600 p-1 rounded transition duration-150"
                    >
                        <MenuIcon color={PRIMARY_COLOR} isRotated={true} />
                    </button>
                </div>

                {/* Mục Điều hướng */}
                <nav className="text-sm font-medium text-zinc-700 h-[calc(100vh-68px)] overflow-y-auto">
                    <div className="text-xs text-zinc-500 uppercase px-6 py-3 font-bold" style={{ backgroundColor: '#f5f5f5' }}>
                        Điều hướng
                    </div>
                    {navItems.map((item) => {
                        // Logic Active Path (chỉ dùng window.location.pathname)
                        const isHomeWeb = item.href === '/';
                        const isHomeAdmin = item.href === '/admin';
                        
                        let shouldBeActive = false;
                        
                        if (isHomeWeb) {
                            shouldBeActive = currentPathname === '/';
                        } else if (isHomeAdmin) {
                            // Chỉ active khi đúng trang /admin, KHÔNG áp dụng cho các trang con
                            shouldBeActive = currentPathname === '/admin'; 
                        } else {
                            shouldBeActive = currentPathname.startsWith(item.href);
                        }

                        return (
                            <a
                                key={item.name}
                                href={item.href}
                                className={`flex items-center w-full px-6 py-3 transition duration-150 border-b border-zinc-100 
                                    ${shouldBeActive 
                                        ? 'bg-purple-50 font-semibold text-purple-700 border-l-4 border-purple-600' 
                                        : 'hover:bg-zinc-50 border-l-4 border-transparent'
                                    }
                                `}
                                onClick={toggleSidebar} // Đóng sidebar sau khi click trên mobile
                            >
                                <span>{item.name}</span>
                            </a>
                        );
                    })}
                </nav>
            </aside>
        </>
    );
};


// Component Header chứa Logo, Tên trang và Profile
const AdminTopBar = ({ toggleSidebar, isSidebarOpen }) => {
    const [currentPath, setCurrentPath] = useState("Trang chủ");

    // Lấy tên trang hiện tại cho Header
    React.useEffect(() => {
        if (typeof window !== 'undefined') {
            const path = window.location.pathname;
            const titleMap = {
                '/': 'Trang chủ Website', 
                '/admin': 'Trang chủ Admin',
                '/admin/accounts': 'Quản lý tài khoản',
                '/admin/approve-teachers': 'Duyệt tài khoản giáo viên',
                '/admin/categories': 'Danh mục',
            };
            const mappedTitle = titleMap[path];
            if (mappedTitle) {
                setCurrentPath(mappedTitle);
            } else if (path.startsWith('/admin')) {
                setCurrentPath('Khu vực Quản trị');
            } else {
                setCurrentPath('Trang chủ');
            }
        }
    }, []);

    return (
        <header className="w-full border-b border-zinc-200 bg-white sticky top-0 z-40 shadow-md">
            <div className="flex items-center justify-between px-4 py-3 md:py-2">
                
                <div className="flex items-center space-x-4">
                    {/* Menu Toggle (Ẩn trên desktop, chỉ hiện khi Sidebar bị đóng) */}
                    <button 
                        onClick={toggleSidebar} 
                        // Chỉ hiển thị trên mobile
                        className="md:hidden text-zinc-600 hover:text-purple-600 p-1 rounded transition duration-150"
                    >
                        <MenuIcon isRotated={isSidebarOpen} />
                    </button>
                    
                    {/* Nút Toggle Sidebar (Chỉ hiển thị trên Desktop) */}
                    <button 
                        onClick={toggleSidebar} 
                        className="hidden md:inline-block text-zinc-600 hover:text-purple-600 p-1 rounded transition duration-150"
                    >
                        <MenuIcon isRotated={isSidebarOpen} />
                    </button>
                    
                    {/* Tên trang hiện tại */}
                    <span className="text-lg font-semibold text-zinc-700">
                        {currentPath}
                    </span>
                </div>

                {/* Profile/Xin chào Admin ở góc phải */}
                <ProfileDropdown />
            </div>
        </header>
    );
}


export default function AdminLayout({
    children,
}) {
    // Ban đầu sidebar mở trên desktop (md trở lên), đóng trên mobile
    const [isSidebarOpen, setIsSidebarOpen] = useState(typeof window !== 'undefined' ? window.innerWidth >= 768 : true); 
    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
    
    // Đồng bộ trạng thái sidebar khi resize màn hình
    React.useEffect(() => {
        const handleResize = () => {
            // Giữ sidebar mở trên desktop, đóng trên mobile
            setIsSidebarOpen(window.innerWidth >= 768);
        };

        if (typeof window !== 'undefined') {
            window.addEventListener('resize', handleResize);
            return () => window.removeEventListener('resize', handleResize);
        }
    }, []);

    // Tính toán độ rộng cần lề cho content dựa trên trạng thái Sidebar
    // Chỉ áp dụng margin-left cho desktop (md trở lên)
    const contentMarginClass = isSidebarOpen ? 'md:ml-80' : 'md:ml-0'; 

    return (
        // Dùng nền xám nhạt cho toàn bộ trang
        <div className="min-h-screen flex flex-col font-sans" style={{ backgroundColor: '#F3F4F6', minHeight: '100vh' }}> 
            
            {/* 1. Sidebar (Menu trái) */}
            <AdminSidebar 
                isSidebarOpen={isSidebarOpen} 
                toggleSidebar={toggleSidebar} 
            />
            
            {/* Container cho TopBar và Nội dung chính (phần phải của màn hình) */}
            <div 
                className={`${contentMarginClass} flex flex-col flex-1 transition-[margin] duration-300`}
                style={{ transitionProperty: 'margin-left' }}
            >
                {/* 2. Top Bar (Header) */}
                <AdminTopBar toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
            
                {/* 3. Nội dung Admin Page: Màu nền #6D0446 theo yêu cầu */}
                <main className="flex-1 p-4 md:p-8 overflow-y-auto" style={{ backgroundColor: MAIN_CONTENT_BG }}> 
                    {children}
                </main>
                
            </div>
            {/* Thêm CSS cho Animation */}
            <style jsx global>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fadeIn 0.2s ease-out;
                }
                @keyframes zoomIn {
                    from { opacity: 0; transform: scale(0.9); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-zoom-in {
                    animation: zoomIn 0.2s ease-out;
                }
                /* Font Inter (Tailwind mặc định) đã được tải */
                body {
                    font-family: 'Inter', sans-serif;
                }
            `}</style>
        </div>
    );
}