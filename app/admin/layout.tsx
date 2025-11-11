// app/admin/layout.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

// Màu tím chính và màu sắc theo yêu cầu
const PRIMARY_COLOR = "#6A1B9A";
const LOGO_TEXT_COLOR = "#E33AEC";
// Màu nền nội dung chính theo yêu cầu của user
const MAIN_CONTENT_BG = "#6D0446";

// Icon người dùng
const UserIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="w-6 h-6"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);


// Icon mũi tên (dùng cho Submenu)
interface ChevronDownIconProps {
  isOpen: boolean;
}

const ChevronDownIcon = ({ isOpen }: ChevronDownIconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={`w-4 h-4 ml-auto transition-transform duration-200 ${
      isOpen ? "rotate-180" : "rotate-0"
    }`}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);

// ProfileDropdown component with TypeScript types
const ProfileDropdown: React.FC = () => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState<boolean>(false);
  const [role, setRole] = useState<string | null>(null);

  React.useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const response = await fetch('/api/profile');
        if (response.ok) {
          const data = await response.json();
          setRole(data.role);
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
      }
    };
    fetchUserRole();
  }, []);

  const getProfileUrl = () => {
    switch (role?.toUpperCase()) {
      case 'ADMIN':
        return '/admin/profile';
      case 'TEACHER':
        return '/teacher/profile';
      case 'STUDENT':
        return '/student/profile';
      default:
        return '/admin/profile';
    }
  };

  const getChangePasswordUrl = () => {
    switch (role?.toUpperCase()) {
      case 'ADMIN':
        return '/admin/change-password';
      case 'TEACHER':
        return '/teacher/change-password';
      case 'STUDENT':
        return '/student/change-password';
      default:
        return '/admin/change-password';
    }
  };

  const handleProfileClick = () => {
    setIsOpen(false);
    router.push(getProfileUrl());
  };

  const handleChangePasswordClick = () => {
    setIsOpen(false);
    router.push(getChangePasswordUrl());
  };

  const handleLogoutClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowLogoutConfirm(true);
    setIsOpen(false);
  };

  const handleLogoutConfirm = async (): Promise<void> => {
    try {
      const res = await fetch("/api/perform_logout", { 
        method: "POST", 
        credentials: "include" 
      });
      // Consider logout successful if request completes
      toast.success("Đăng xuất thành công");
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Có lỗi khi đăng xuất");
      router.push("/");
    }
  };

  const handleLogoutCancel = (): void => {
    setShowLogoutConfirm(false);
  };

  // Style for the profile button
  const profileStyle = {
    backgroundColor: "#f3e8ff", // purple-100
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
        <span className="font-semibold text-purple-800 text-sm hidden sm:inline">
          Xin chào, Admin
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-1 border border-zinc-200 z-10">
          <button
            onClick={handleProfileClick}
            className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-600"
          >
            Cập nhật thông tin
          </button>
          <button
            onClick={handleChangePasswordClick}
            className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-600"
          >
            Đổi mật khẩu
          </button>
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
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Xác nhận đăng xuất
            </h3>
            <p className="text-gray-600 mb-6">
              Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?
            </p>
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

// Props for LogoutConfirmationModal component
interface LogoutConfirmationModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

// Logout Confirmation Modal Component
const LogoutConfirmationModal: React.FC<LogoutConfirmationModalProps> = ({ 
  isOpen, 
  onConfirm, 
  onCancel 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Xác nhận đăng xuất
        </h3>
        <p className="text-gray-600 mb-6">
          Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?
        </p>
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition"
          >
            Hủy
          </button>
          <button
            type="button"
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

// Types for navigation items
interface NavItem {
  name: string;
  href: string;
  submenu?: NavItem[];
}

// Sidebar component with TypeScript
const AdminSidebar: React.FC = () => {
  // Navigation items with submenus
  const navItems: NavItem[] = [
    { name: "Trang chủ", href: "/admin" },
    {
      name: "Quản lý tài khoản",
      href: "/admin/accounts",
      submenu: [
        { name: "Giáo viên", href: "/admin/accounts/teachers" },
        { name: "Học sinh", href: "/admin/accounts/students" },
      ],
    },
    { name: "Duyệt tài khoản giáo viên", href: "/admin/approve-teachers" },
    { name: "Danh mục", href: "/admin/categories" },
  ];

  const [currentPathname, setCurrentPathname] = useState<string>("/");
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

  // Toggle submenu open/close
  const handleToggleSubmenu = (name: string) => {
    setOpenSubmenu(openSubmenu === name ? null : name);
  };

  // Check if an item or any of its subitems is active
  const isActive = (item: NavItem): boolean => {
    if (!item) return false;
    
    if (item.href === "/") {
      return currentPathname === "/";
    }
    if (item.href === "/admin") {
      // Chỉ active khi đúng trang /admin, KHÔNG active cho các trang con
      return currentPathname === "/admin";
    }

    let shouldBeActive = currentPathname.startsWith(item.href);

    // Check submenu items if they exist
    if (item.submenu && Array.isArray(item.submenu)) {
      shouldBeActive = item.submenu.some(subItem => 
        subItem && currentPathname.startsWith(subItem.href)
      ) || shouldBeActive;
    }
    
    return shouldBeActive;
  };

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const pathname = window.location.pathname;
      setCurrentPathname(pathname);

      // Tự động mở submenu nếu một mục con đang active
      navItems.forEach((item) => {
        if (item.submenu) {
          item.submenu.forEach((subItem) => {
            if (pathname.startsWith(subItem.href)) {
              setOpenSubmenu(item.name);
            }
          });
        }
      });
    }
  }, []);

  return (
    <>
      {/* Sidebar chính */}
      <aside className="w-64 bg-white border-r border-zinc-200 h-screen fixed top-0 left-0 z-50 shadow-xl overflow-y-auto">
        {/* Khu vực Logo */}
        <div className="flex items-center space-x-2 px-4 py-3 border-b border-zinc-200 bg-white">
          {/* Logo/Tên dự án */}
          <a
            href="/"
            className="text-xl font-black"
            style={{ color: LOGO_TEXT_COLOR }}
          >
            QuizzZone
          </a>
        </div>

        {/* Mục Điều hướng */}
        <nav className="text-xs font-medium text-zinc-700">
          <div 
            className="h-1 border-b border-zinc-200"
            style={{ backgroundColor: "#eee" }}
          ></div>
          {navItems.map((item) => {
            const hasSubmenu = !!item.submenu;
            const isOpen = openSubmenu === item.name;
            const isCurrentActive = isActive(item); // Kiểm tra xem mục cha (hoặc con) có active không

            if (hasSubmenu) {
              return (
                <div key={item.name} className="border-b border-zinc-200">
                  {/* Mục cha (có submenu) */}
                  <button
                    onClick={() => handleToggleSubmenu(item.name)}
                    className={`flex items-center w-full px-4 py-2 text-xs transition duration-150 text-left 
                                            ${
                                              isCurrentActive
                                                ? "bg-zinc-100 font-semibold text-purple-700"
                                                : "hover:bg-zinc-50"
                                            }
                                        `}
                  >
                    <span>{item.name}</span>
                    <ChevronDownIcon isOpen={isOpen} />
                  </button>

                  {/* Submenu */}
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      isOpen ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
                    }`}
                  >
                    {item.submenu && item.submenu.map((subItem) => {
                      const subIsActive = currentPathname.startsWith(
                        subItem.href
                      );
                      return (
                        <a
                          key={subItem.name}
                          href={subItem.href}
                          className={`flex items-center w-full pl-6 pr-4 py-1.5 text-xs transition duration-150 
                                                        ${
                                                          subIsActive
                                                            ? "bg-zinc-200 font-semibold text-purple-700"
                                                            : "hover:bg-zinc-100"
                                                        }
                                                    `}
                        >
                          <span>{subItem.name}</span>
                        </a>
                      );
                    })}
                  </div>
                </div>
              );
            }

            // Mục không có submenu (giữ nguyên)
            return (
              <a
                key={item.name}
                href={item.href}
                className={`flex items-center w-full px-4 py-2 text-xs transition duration-150 border-b border-zinc-200 
                                    ${
                                      isCurrentActive
                                        ? "bg-zinc-100 font-semibold text-purple-700"
                                        : "hover:bg-zinc-50"
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

// Component Header chứa Logo và Profile
const AdminTopBar = () => {
  return (
    <header className="w-full border-b border-zinc-200 bg-white sticky top-0 z-40 shadow-sm">
      <div className="flex items-center justify-between px-4 py-2 md:py-3">
        <div className="flex items-center">
          {/* Logo QuizzZone */}
          <a
            href="/admin"
            className="text-2xl font-black tracking-tighter"
            style={{ color: LOGO_TEXT_COLOR }}
          >
            QuizzZone
          </a>
        </div>
        
        <div className="flex-1"></div>
        
        <ProfileDropdown />
      </div>
    </header>
  );
};


interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  // Sidebar is always visible now, no need for state
  const contentPaddingClass = "lg:ml-64"; // Adjusted margin to match the sidebar width

  return (
    // Dùng nền xám nhạt cho toàn bộ trang
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* 1. Sidebar (Menu trái) */}
      <AdminSidebar />

      {/* 2. Top Bar (Header) */}
      <AdminTopBar />

      {/* Container cho Nội dung chính */}
      {/* Điều chỉnh margin-left dựa trên trạng thái Sidebar */}
      <div
        className={`${contentPaddingClass} flex flex-col flex-1 transition-[margin-left] duration-300`}
      >
        {/* 3. Nội dung Admin Page: Màu nền #6D0446 theo yêu cầu */}
        <main
          className="flex-1 p-4 md:p-8 shadow-inner"
          style={{ backgroundColor: MAIN_CONTENT_BG }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
