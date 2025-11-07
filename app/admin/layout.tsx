// app/admin/layout.tsx
'use client'; 

import React, { useState } from "react";
import { useRouter } from "next/navigation";

// Màu tím chính và màu sắc theo yêu cầu
const PRIMARY_COLOR = '#6A1B9A';
const LOGO_TEXT_COLOR = '#E33AEC'; 
// Màu nền nội dung chính theo yêu cầu của user
const MAIN_CONTENT_BG = '#6D0446'; 

// Icon người dùng
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
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const handleLogoutClick = () => {
        setShowLogoutConfirm(true);
        setIsOpen(false);
    };

    const handleLogoutConfirm = async () => {
        try {
            await fetch('/logout', { method: 'POST', credentials: 'include' });
            router.push('/');
        } catch (error) {
            console.error('Logout error:', error);
            router.push('/');
        }
    };

    const handleLogoutCancel = () => {
        setShowLogoutConfirm(false);
    };

    const handleLogout = async () => {
        try {
            await fetch('/logout', { method: 'POST', credentials: 'include' });
            router.push('/');
        } catch (error) {
            console.error('Logout error:', error);
            router.push('/');
        }
    };

    // Style cho khối "Xin chào, Admin" màu tím nhạt
    const profileStyle = {
        backgroundColor: '#f3e8ff', // purple-100
    };
    
    return (
        <div className="relative">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center space-x-2 p-1 pr-3 rounded-full transition duration-200 hover:bg-purple-200/50"
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
                    className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-1 border border-zinc-200 z-10"
                >
                    <a href="/admin/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-600">
                        Cập nhật thông tin
                    </a>
                    <a href="/admin/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-600">
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
            
            {/* Logout Confirmation Modal */}
            {showLogoutConfirm && (
                <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Xác nhận đăng xuất</h3>
                        <p className="text-gray-600 mb-6">Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?</p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={handleLogoutCancel}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleLogoutConfirm}
                                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition"
                            >
                                Đăng xuất
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Render the modal outside the ProfileDropdown component
const LogoutConfirmationModal = ({ isOpen, onConfirm, onCancel }) => {
    if (!isOpen) return null;
    
    return (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Xác nhận đăng xuất</h3>
                <p className="text-gray-600 mb-6">Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?</p>
                <div className="flex gap-3 justify-end">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800 transition"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition"
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
    ];
    
    const [currentPathname, setCurrentPathname] = useState('/');
    
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
                    className="fixed inset-0 bg-black/50 z-40" 
                    onClick={toggleSidebar}
                ></div>
            )}
            
            {/* Sidebar chính */}
            <aside 
                className={`w-80 bg-white border-r border-zinc-200 h-screen fixed top-0 left-0 z-50 transform transition-transform duration-300 shadow-xl
                    ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                
                {/* Khu vực Logo */}
                <div 
                    className="flex items-center space-x-2 px-6 py-4 border-b border-zinc-200 bg-white" 
                >
                    {/* Logo/Tên dự án */}
                    <a 
                        href="/" 
                        className="text-2xl font-black tracking-tighter" 
                        style={{ color: LOGO_TEXT_COLOR }} 
                    >
                        QuizzZone
                    </a>
                </div>

                {/* Mục Điều hướng */}
                <nav className="text-sm font-medium text-zinc-700">
                    <div className="text-xs text-zinc-500 uppercase px-6 py-2 border-b border-zinc-200" style={{ backgroundColor: '#eee' }}>
                        Menu
                    </div>
                    {navItems.map((item) => {
                        const isHomeWeb = item.href === '/';
                        const isHomeAdmin = item.href === '/admin';
                        
                        let shouldBeActive = false;
                        
                        if (isHomeWeb) {
                            shouldBeActive = currentPathname === '/';
                        } else if (isHomeAdmin) {
                            shouldBeActive = currentPathname === '/admin' || currentPathname.startsWith('/admin/');
                        } else {
                            shouldBeActive = currentPathname.startsWith(item.href);
                        }

                        return (
                            <a
                                key={item.name}
                                href={item.href}
                                className={`flex items-center w-full px-6 py-3 transition duration-150 border-b border-zinc-200 
                                    ${shouldBeActive 
                                        ? 'bg-zinc-100 font-semibold text-purple-700' 
                                        : 'hover:bg-zinc-50'
                                    }
                                `}
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
        // Header không còn padding cố định, padding sẽ điều chỉnh bằng main content
        <header className="w-full border-b border-zinc-200 bg-white sticky top-0 z-40 shadow-sm">
            <div className="flex items-center justify-between px-4 py-2 md:py-3">
                
                <div className="flex items-center space-x-4">
                    {/* Menu Toggle (Luôn hiển thị trên cả desktop và mobile) */}
                    <button 
                        onClick={toggleSidebar} 
                        className="text-zinc-600 hover:text-purple-600 p-1 rounded transition duration-150"
                    >
                        <MenuIcon isRotated={isSidebarOpen} />
                    </button>
                    
                    {/* Logo QuizzZone (nhỏ, cạnh Menu Icon) */}
                    <a 
                        href="/admin" 
                        className="text-2xl font-black tracking-tighter" 
                        style={{ color: LOGO_TEXT_COLOR }} 
                    >
                        QuizzZone
                    </a>
                </div>

                {/* Tên trang hiện tại */}
                <span className="text-lg font-semibold text-zinc-700 flex-grow text-center">
                    {currentPath}
                </span>

                {/* Profile/Xin chào Admin ở góc phải */}
                <ProfileDropdown />
            </div>
        </header>
    );
}

// Component Footer (Giữ nguyên)
const Footer = () => {
    return (
        // Footer không còn padding cố định
        <footer className="w-full bg-white border-t border-zinc-100 text-center py-4 mt-auto">
            <p className="text-sm text-zinc-600">
                &copy; 2025 QuizzZone. Mọi quyền được bảo lưu.
            </p>
        </footer>
    );
}


export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Dùng để Toggle Sidebar
    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
    
    // Tính toán độ rộng cần lề cho content dựa trên trạng thái Sidebar
    const contentPaddingClass = isSidebarOpen ? 'lg:ml-80' : 'lg:ml-0'; // Sidebar rộng 80px

  return (
    // Dùng nền xám nhạt cho toàn bộ trang
    <div className="flex flex-col min-h-screen bg-gray-50"> 
      
      {/* 1. Sidebar (Menu trái) */}
      <AdminSidebar 
        isSidebarOpen={isSidebarOpen} 
        toggleSidebar={toggleSidebar} 
      />
      
      {/* 2. Top Bar (Header) */}
      <AdminTopBar toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />

      {/* Container cho Nội dung chính */}
      {/* Điều chỉnh margin-left dựa trên trạng thái Sidebar */}
      <div className={`${contentPaddingClass} flex flex-col flex-1 transition-[margin-left] duration-300`}>
          
          {/* 3. Nội dung Admin Page: Màu nền #6D0446 theo yêu cầu */}
          <main className="flex-1 p-4 md:p-8 shadow-inner" style={{backgroundColor: MAIN_CONTENT_BG}}> 
             {children}
          </main>
          
          {/* Footer */}
          <Footer />
      </div>
    </div>
  );
}