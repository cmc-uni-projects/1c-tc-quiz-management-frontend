"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/user";
import { toast } from "react-toastify";

const PRIMARY_COLOR = "#6A1B9A";
const LOGO_TEXT_COLOR = "#E33AEC";
const MAIN_CONTENT_BG = "#6D0446";
const contentPaddingClass = "ml-64";

/** @typedef {{ name: string, href: string, submenu?: NavItem[] }} NavItem */

/** @type {React.FC<{ children: React.ReactNode }>} */
const AdminAuthGuard = ({ children }) => {
  const { user, isLoading, isAuthenticated } = useUser();
  const router = useRouter();
  
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    console.log('[AdminAuthGuard] Checking auth state:', { isLoading, isAuthenticated, user });

    if (isLoading || isRedirecting) {
      console.log('[AdminAuthGuard] Still loading or already redirecting, skipping check.');
      return;
    }

    let redirectPath = null;
    let toastMessage = null;

    if (!isAuthenticated) {
      redirectPath = "/auth/login";
      toastMessage = "Bạn cần đăng nhập để truy cập trang này.";
    } else if (user?.role !== "ADMIN") {
      redirectPath = "/";
      toastMessage = "Bạn không có quyền truy cập vào khu vực quản trị.";
    }

    if (redirectPath) {
        setIsRedirecting(true);
        if (toastMessage) {
            toast.error(toastMessage);
        }
        router.push(redirectPath);
    }

  }, [user, isLoading, isAuthenticated, router, isRedirecting]);

  if (isLoading || isRedirecting || !isAuthenticated) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-purple-600"></div>
          <p className="mt-4 text-lg font-semibold text-gray-700">Đang xác thực quyền truy cập...</p>
        </div>
      </div>
    );
  }

  if (user?.role === "ADMIN") {
      return <>{children}</>;
  }

  return null;
};


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


/** @type {React.FC<ChevronDownIconProps>} */
const ChevronDownIcon = ({ isOpen }) => (
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


/** @type {React.FC} */
const ProfileDropdown = () => {
  const router = useRouter();
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const username = user?.name || 'Admin';
  const avatar = user?.avatarUrl || null; // Using 'avatarUrl' from custom user hook

  const getProfileUrl = () => {
    return '/admin/profile';
  };

  const getChangePasswordUrl = () => {
    return '/admin/change-password';
  };

  const handleProfileClick = () => {
    setIsOpen(false);
    router.push(getProfileUrl());
  };

  const handleChangePasswordClick = () => {
    setIsOpen(false);
    router.push(getChangePasswordUrl());
  };

  const handleLogoutClick = (e) => {
    e.preventDefault();
    setShowLogoutConfirm(true);
    setIsOpen(false);
  };

  const handleLogoutConfirm = async () => {
    setShowLogoutConfirm(false);
    localStorage.removeItem('jwt'); // Clear JWT from localStorage
    router.push('/auth/login'); // Redirect to login page
    toast.success("Đăng xuất thành công");
  };

  const handleLogoutCancel = () => {
    setShowLogoutConfirm(false);
  };

  const profileStyle = {
    backgroundColor: "#f3e8ff",
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-1 pr-3 rounded-full transition duration-200 hover:bg-purple-200/50"
        style={profileStyle}
        aria-expanded={isOpen}
      >
        <div className="w-8 h-8 rounded-full bg-purple-300 flex items-center justify-center text-purple-800 overflow-hidden">
          {avatar ? (
            <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
          ) : (
            <UserIcon />
          )}
        </div>
        <span className="font-semibold text-purple-800 text-sm hidden sm:inline">
          {`Xin chào, ${username}`}
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
      <LogoutConfirmationModal
        isOpen={showLogoutConfirm}
        onConfirm={handleLogoutConfirm}
        onCancel={handleLogoutCancel}
      />
    </div>
  );
};


/** @type {React.FC<LogoutConfirmationModalProps>} */
const LogoutConfirmationModal = ({ isOpen, onConfirm, onCancel }) => {
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

/** @type {React.FC} */
const AdminSidebar = () => {
  const router = useRouter();
  const currentPathname = router.pathname;

  const navItems = [
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
    {
      name: "Cài đặt",
      href: "/admin/settings",
      submenu: [
        { name: "Thông tin cá nhân", href: "/admin/profile" },
        { name: "Đổi mật khẩu", href: "/admin/change-password" },
      ],
    },
  ];

  const [openSubmenu, setOpenSubmenu] = useState(null);

  const handleToggleSubmenu = (name) => {
    setOpenSubmenu(openSubmenu === name ? null : name);
  };

  const isActive = (item) => {
    if (!item) return false;

    if (item.href === "/admin") {
      return currentPathname === "/admin";
    }

    let shouldBeActive = currentPathname.startsWith(item.href);

    if (item.submenu && Array.isArray(item.submenu)) {
      shouldBeActive = item.submenu.some(subItem =>
        subItem && currentPathname.startsWith(subItem.href)
      ) || shouldBeActive;
    }

    return shouldBeActive;
  };

  useEffect(() => {
    let shouldOpen = false;
    navItems.forEach((item) => {
      if (item.submenu) {
        if (item.submenu.some(subItem => currentPathname.startsWith(subItem.href))) {
          setOpenSubmenu(item.name);
          shouldOpen = true;
        }
      }
    });

    if (!shouldOpen && openSubmenu) {
      const isParentActive = navItems.some(item => isActive(item));
      if (!isParentActive) {
         setOpenSubmenu(null);
      }
    }

  }, [currentPathname]);

  const handleNavigation = (href, e) => {
    e.preventDefault();
    router.push(href);
  }

  return (
    <>
      <aside className="w-64 bg-white border-r border-zinc-200 h-screen fixed top-0 left-0 z-50 shadow-xl overflow-y-auto">
        <div className="flex items-center space-x-2 px-4 py-3 border-b border-zinc-200 bg-white">
          <a
            href="/"
            onClick={(e) => handleNavigation("/admin", e)}
            className="text-xl font-black"
            style={{ color: LOGO_TEXT_COLOR }}
          >
            QuizzZone
          </a>
        </div>

        <nav className="px-4 py-4 text-sm font-medium text-zinc-700 space-y-1">
          {navItems.map((item) => {
            const hasSubmenu = !!item.submenu;
            const isCurrentActive = isActive(item);
            const isOpen = openSubmenu === item.name || (hasSubmenu && isCurrentActive);

            if (hasSubmenu) {
              return (
                <div key={item.name}>
                  <button
                    onClick={() => handleToggleSubmenu(item.name)}
                    className={`flex items-center w-full rounded-lg px-3 py-2 text-left transition-colors duration-150
                      ${isCurrentActive ? "bg-zinc-100 text-purple-700 font-semibold" : "hover:bg-zinc-50"}
                    `}
                  >
                    <span>{item.name}</span>
                    <ChevronDownIcon isOpen={isOpen} />
                  </button>

                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      isOpen ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
                    }`}
                  >
                    {item.submenu && item.submenu.map((subItem) => {
                      const subIsActive = currentPathname.startsWith(subItem.href);
                      return (
                        <a
                          key={subItem.name}
                          href={subItem.href}
                          onClick={(e) => handleNavigation(subItem.href, e)}
                          className={`mt-1 ml-4 flex items-center w-full rounded-lg px-3 py-1.5 text-xs transition-colors duration-150
                            ${subIsActive ? "bg-zinc-100 text-purple-700 font-semibold" : "hover:bg-zinc-50"}
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

            return (
              <a
                key={item.name}
                href={item.href}
                onClick={(e) => handleNavigation(item.href, e)}
                className={`block rounded-lg px-3 py-2 transition-colors duration-150
                  ${isCurrentActive ? "bg-zinc-100 text-purple-700 font-semibold" : "hover:bg-zinc-50"}
                `}
              >
                {item.name}
              </a>
            );
          })}
        </nav>
      </aside>
    </>
  );
};

/** @type {React.FC} */
const AdminTopBar = () => {
  return (
    <header className="w-full border-b border-zinc-200 bg-white shadow-sm">
      <div className="flex items-center justify-between px-4 py-2 md:py-3">
        <div className="flex items-center">
            <h1 className="text-xl font-semibold text-zinc-800">Bảng điều khiển Admin</h1>
        </div>

        <div className="flex-1"></div>

        <ProfileDropdown />
      </div>
    </header>
  );
};




export default function AdminLayout({ children }) {
  return (
    <>
      <AdminAuthGuard>
        <div className="flex flex-col min-h-screen bg-gray-50">
          <AdminSidebar />
          <div
            className={`${contentPaddingClass} flex flex-col flex-1 transition-[margin-left] duration-300 w-[calc(100%-16rem)]`}
          >
            <AdminTopBar />
            <main
              className="flex-1 p-4 md:p-8 shadow-inner"
              style={{ backgroundColor: MAIN_CONTENT_BG }}
            >
              {children}
            </main>
          </div>
        </div>
      </AdminAuthGuard>
    </>
  );
}