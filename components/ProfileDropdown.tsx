"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";

export default function ProfileDropdown() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
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

  if (status !== "authenticated") {
    return null; // Or a login button
  }

  const user = session.user;
  const role = (user as any)?.role; // Cast to any to access custom role property

  const getProfileUrl = () => {
    switch (role) {
      case "ADMIN":
        return "/admin/profile";
      case "TEACHER":
        return "/teacher/profile";
      case "STUDENT":
        return "/student/profile";
      default:
        return "#";
    }
  };
  
  const getChangePasswordUrl = () => {
    switch (role) {
      case "ADMIN":
        return "/admin/change-password";
      case "TEACHER":
        return "/teacher/change-password";
      case "STUDENT":
        return "/student/change-password";
      default:
        return "#";
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full bg-gray-200/50 px-2 py-1.5 text-sm text-zinc-700 hover:bg-gray-200/80"
      >
        <span className="grid h-8 w-8 place-items-center rounded-full bg-gray-300 text-gray-700">
          {user.image ? (
            <Image src={user.image} alt="User Avatar" width={32} height={32} className="rounded-full" />
          ) : (
            '👤'
          )}
        </span>
        <span className="hidden sm:inline">Xin chào, {user.name || 'bạn'}</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 overflow-hidden rounded-md border border-zinc-200 bg-white shadow-lg z-10">
          <Link href={getProfileUrl()} className="block px-3 py-2 text-sm hover:bg-zinc-50">
            Cập nhật thông tin
          </Link>
          {/* <Link href="#" className="block px-3 py-2 text-sm hover:bg-zinc-50">
            Quản lý tài khoản
          </Link> */}
          <Link href={getChangePasswordUrl()} className="block px-3 py-2 text-sm hover:bg-zinc-50">
            Đổi mật khẩu
          </Link>
          <div className="border-t" />
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="block w-full px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50"
          >
            ← Đăng xuất
          </button>
        </div>
      )}
    </div>
  );
}
