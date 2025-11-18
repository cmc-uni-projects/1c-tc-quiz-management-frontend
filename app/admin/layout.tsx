import Link from "next/link";
import Image from "next/image"; // Import Image
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/user"; // THAY ĐỔI: Import useUser
import toast from "react-hot-toast";
import React, { useState, useEffect } from "react";

// --- BẢO VỆ ROUTE ---
const AdminAuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading, error } = useUser(); // THAY ĐỔI: Sử dụng useUser
  const router = useRouter();

  useEffect(() => {
    if (isLoading) {
      return; // Đang tải, chưa làm gì cả
    }

    // Nếu có lỗi (ví dụ 401 từ /api/me) hoặc không có user, tức là chưa đăng nhập
    if (error || !user) {
      toast.error("Bạn cần đăng nhập để truy cập trang này.");
      router.push("/login");
      return;
    }

    // Nếu có user nhưng không phải ADMIN
    if (user.role !== "ADMIN") {
      toast.error("Bạn không có quyền truy cập vào khu vực quản trị.");
      router.push("/");
      return;
    }
  }, [user, isLoading, error, router]);

  // Giao diện loading trong khi chờ xác thực
  if (isLoading || !user || user.role !== "ADMIN") {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-purple-600"></div>
          <p className="mt-4 text-lg font-semibold text-gray-700">Đang xác thực quyền truy cập...</p>
        </div>
      </div>
    );
  }

  // Nếu mọi thứ OK, hiển thị nội dung
  return <>{children}</>;
};


// --- CÁC COMPONENT GIAO DIỆN (CẬP NHẬT ĐỂ DÙNG useUser) ---

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
  const [username, setUsername] = useState<string | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);

  React.useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await fetch('/api/profile');
        if (response.ok) {
          const data = await response.json();
          setRole(data.role);
          setUsername(data.username || null);
          setAvatar(data.avatar || null);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };
    fetchUserProfile();
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
      await fetch("/api/perform_logout", { 
        method: "POST", 
        credentials: "include" 
      });
      // Consider logout successful if request completes
      toast.success("Đăng xuất thành công");
      // Trigger SWR để fetch lại user (sẽ trả về lỗi 401) và tự động redirect
      mutate();
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
        {/* Avatar or fallback user icon */}
        <div className="w-8 h-8 rounded-full bg-purple-300 flex items-center justify-center text-purple-800 overflow-hidden">
          {avatar ? (
            <Image src={avatar} alt="avatar" width={32} height={32} className="w-full h-full object-cover" />
          ) : (
            <UserIcon />
          )}
        </div>
        {/* Greeting with username */}
        <span className="font-semibold text-purple-800 text-sm hidden sm:inline">
          {`Xin chào, ${username || 'Admin'}`}
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

// Types for navigation items
interface NavItem {
  name: string;
  href: string;
  submenu?: NavItem[];
}

// Navigation items with submenus
const adminNavItems: NavItem[] = [
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

// Sidebar component with TypeScript
const AdminSidebar: React.FC = () => {
  const navItems = adminNavItems; // Use the external constant

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
  }, [navItems]); // Added navItems to dependency array

  return (
    <>
      {/* Sidebar chính */}
      <aside className="w-64 bg-white border-r border-zinc-200 h-screen fixed top-0 left-0 z-50 shadow-xl overflow-y-auto">
        {/* Khu vực Logo */}
        <div className="flex items-center space-x-2 px-4 py-3 border-b border-zinc-200 bg-white">
          {/* Logo/Tên dự án */}
          <Link
            href="/"
            className="text-xl font-black"
            style={{ color: LOGO_TEXT_COLOR }}
          >
            QuizzZone
          </Link>
        </div>

        {/* Mục Điều hướng */}
        <nav className="px-4 py-4 text-sm font-medium text-zinc-700 space-y-1">
          {navItems.map((item) => {
            const hasSubmenu = !!item.submenu;
            const isOpen = openSubmenu === item.name;
            const isCurrentActive = isActive(item); // Kiểm tra xem mục cha (hoặc con) có active không

            if (hasSubmenu) {
              return (
                <div key={item.name}>
                  {/* Mục cha (có submenu) */}
                  <button
                    onClick={() => handleToggleSubmenu(item.name)}
                    className={`flex items-center w-full rounded-lg px-3 py-2 text-left transition-colors duration-150
                      ${isCurrentActive ? "bg-zinc-100 text-purple-700 font-semibold" : "hover:bg-zinc-50"}
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
                      const subIsActive = currentPathname.startsWith(subItem.href);
                      return (
                        <Link
                          key={subItem.name}
                          href={subItem.href}
                          className={`mt-1 ml-4 flex items-center w-full rounded-lg px-3 py-1.5 text-xs transition-colors duration-150
                            ${subIsActive ? "bg-zinc-100 text-purple-700 font-semibold" : "hover:bg-zinc-50"}
                          `}
                        >
                          <span>{subItem.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            }

            // Mục không có submenu
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`block rounded-lg px-3 py-2 transition-colors duration-150
                  ${isCurrentActive ? "bg-zinc-100 text-purple-700 font-semibold" : "hover:bg-zinc-50"}
                `}
              >
                {item.name}
              </Link>
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
          <Link
            href="/admin"
            className="text-2xl font-black tracking-tighter"
            style={{ color: LOGO_TEXT_COLOR }}
          >
            QuizzZone
          </Link>
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
};

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <AdminAuthGuard>
      <div className="flex flex-col min-h-screen bg-gray-50">
        {/* 1. Sidebar (Menu trái) */}
        <AdminSidebar />

        {/* 2. Top Bar (Header) */}
        <AdminTopBar />

        {/* Container cho Nội dung chính */}
        {/* Điều chỉnh margin-left dựa trên trạng thái Sidebar */}
        <div
          className="lg:ml-64 flex flex-col flex-1 transition-[margin-left] duration-300"
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
    </AdminAuthGuard>
  );
}