"use client";
import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useUser } from "@/lib/user";
import toast from "react-hot-toast";
import ProfileDropdown from "@/components/ProfileDropdown";
import {
  HomeIcon,
  UsersIcon,
  CheckBadgeIcon,
  FolderIcon,
  ChevronDownIcon,
  AcademicCapIcon,
  UserIcon
} from "@heroicons/react/24/outline";

interface NavItem {
  name: string;
  href: string;
  submenu?: NavItem[];
}

interface AdminAuthGuardProps {
  children: React.ReactNode;
}

interface AdminLayoutProps {
  children: React.ReactNode;
}

const PRIMARY_COLOR = "#6A1B9A";
const LOGO_TEXT_COLOR = "#E33AEC";
const MAIN_CONTENT_BG = "#6D0446";
const contentPaddingClass = "ml-64";

/** @type {React.FC<AdminAuthGuardProps>} */
const AdminAuthGuard = ({ children }: AdminAuthGuardProps) => {
  const { user, isLoading, isAuthenticated } = useUser();
  const router = useRouter();

  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    // console.log('AdminAuthGuard: useEffect triggered.');
    // console.log('AdminAuthGuard: User:', user, 'isLoading:', isLoading, 'isAuthenticated:', isAuthenticated, 'isRedirecting:', isRedirecting);

    if (isLoading || isRedirecting) {
      return;
    }

    if (!isLoading && !isRedirecting) {
      console.log('AdminAuthGuard: Loading finished. Final state: User:', user, 'isAuthenticated:', isAuthenticated);
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

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-purple-600 border-b-2"></div>
          <p className="mt-4 text-lg font-semibold text-gray-700">Đang tải dữ liệu người dùng...</p>
        </div>
      </div>
    );
  }

  console.log('AdminAuthGuard: Rendering decision: isAuthenticated:', isAuthenticated, 'user.role:', user?.role);

  if (!isAuthenticated || user?.role !== "ADMIN") {
    return null;
  }

  return <>{children}</>;
};

/** @type {React.FC} */
const AdminSidebar = () => {
  const router = useRouter();
  const currentPathname = usePathname();

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
    { name: "Câu hỏi", href: "/admin/questions" },
  ];

  // Icon mapping for menu items
  const getIcon = (name: string) => {
    switch (name) {
      case "Trang chủ":
        return <HomeIcon className="w-5 h-5" />;
      case "Quản lý tài khoản":
        return <UsersIcon className="w-5 h-5" />;
      case "Duyệt tài khoản giáo viên":
        return <CheckBadgeIcon className="w-5 h-5" />;
      case "Danh mục":
        return <FolderIcon className="w-5 h-5" />;
      default:
        return null;
    }
  };

  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

  const handleToggleSubmenu = (name: string) => {
    setOpenSubmenu(openSubmenu === name ? null : name);
  };

  /**
   * @param {NavItem} item
   * @returns {boolean}
   */
  const isActive = (item: NavItem): boolean => {
    if (!item || typeof currentPathname !== 'string' || !item.href || typeof item.href !== 'string') {
        return false;
    }

    if (item.href === "/admin") {
      return currentPathname === "/admin";
    }

    let shouldBeActive = currentPathname.startsWith(item.href);

    if (item.submenu && Array.isArray(item.submenu)) {
      shouldBeActive = item.submenu.some((subItem: NavItem) =>
        subItem && subItem.href && currentPathname.startsWith(subItem.href)
      ) || shouldBeActive;
    }

    return shouldBeActive;
  };

  useEffect(() => {
    let shouldOpen = false;
    if (typeof currentPathname !== 'string') return; // Guard for pathname loading

    navItems.forEach((item) => {
      if (item.submenu) {
        if (item.submenu.some(subItem => subItem && subItem.href && currentPathname.startsWith(subItem.href))) {
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

  const handleNavigation = (href: string, e: React.MouseEvent) => {
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

            if (!item.href) return null;

            if (hasSubmenu) {
              return (
                <div key={item.name}>
                  <button
                    onClick={() => handleToggleSubmenu(item.name)}
                    className={`flex items-center w-full rounded-lg px-3 py-2 text-left transition-colors duration-150
                      ${isCurrentActive ? "bg-zinc-100 text-purple-700 font-semibold" : "hover:bg-zinc-50"}
                    `}
                  >
                    {getIcon(item.name)}
                    <span className="ml-3">{item.name}</span>
                    <ChevronDownIcon className={`w-4 h-4 ml-auto transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      isOpen ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
                    }`}
                  >
                    {item.submenu && item.submenu.map((subItem) => {
                      // Kiểm tra an toàn cho subItem.href
                      if (!subItem || !subItem.href) return null;

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
                          <span className="w-5 h-5 mr-3 flex items-center justify-center">
                            {subItem.name === "Giáo viên" ? (
                              <AcademicCapIcon className="w-4 h-4" />
                            ) : (
                              <UserIcon className="w-4 h-4" />
                            )}
                          </span>
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
                className={`flex items-center rounded-lg px-3 py-2 transition-colors duration-150
                  ${isCurrentActive ? "bg-zinc-100 text-purple-700 font-semibold" : "hover:bg-zinc-50"}
                `}
              >
                {getIcon(item.name)}
                <span className="ml-3">{item.name}</span>
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




export default function AdminLayout({ children }: AdminLayoutProps) {
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