"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function ProfileDropdown() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("click", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("click", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
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
        return '/student/profile';
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
        return '/student/change-password';
    }
  };

  const handleProfileClick = () => {
    setOpen(false);
    router.push(getProfileUrl());
  };

  const handleChangePasswordClick = () => {
    setOpen(false);
    router.push(getChangePasswordUrl());
  };

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/perform_logout', {
        method: 'POST',
        credentials: 'include',
      });
      setOpen(false);
      // Consider logout successful if the request completes; API already attempts multiple endpoints
      toast.success('Đăng xuất thành công');
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      setOpen(false);
      toast.error('Có lỗi khi đăng xuất');
      router.push('/login');
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full bg-gray-200/50 px-2 py-1.5 text-sm text-zinc-700 hover:bg-gray-200/80"
      >
        <span className="grid h-8 w-8 place-items-center rounded-full bg-gray-300 text-gray-700">
          👤
        </span>
        <span className="hidden sm:inline">Menu</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 overflow-hidden rounded-md border border-zinc-200 bg-white shadow-lg z-10">
          <button
            onClick={handleProfileClick}
            className="block w-full px-3 py-2 text-left text-sm hover:bg-zinc-50"
          >
            Cập nhật thông tin
          </button>
          <button
            onClick={handleChangePasswordClick}
            className="block w-full px-3 py-2 text-left text-sm hover:bg-zinc-50"
          >
            Đổi mật khẩu
          </button>
          <div className="border-t" />
          <button
            onClick={handleLogout}
            className="block w-full px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50"
          >
            ← Đăng xuất
          </button>
        </div>
      )}
    </div>
  );
}
