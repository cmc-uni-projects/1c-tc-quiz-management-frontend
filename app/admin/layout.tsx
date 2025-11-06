"use client";
import Link from "next/link";
import ProfileDropdown from "../../components/ProfileDropdown";
import { useEffect } from "react";

// Giữ nguyên logic ban đầu của bạn để ẩn Global Header
// ... (các import khác)
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // Logic cũ của bạn: Ẩn Global Header bằng DOM manipulation
  useEffect(() => {
    const el = document.querySelector<HTMLElement>('header[data-global="true"]');
    if (!el) return;
    const prev = el.style.display;
    el.style.display = "none";
    return () => {
      el.style.display = prev;
    };
  }, []);

  return (
    <div className="min-h-screen">
      {/* Header riêng cho Admin */}
      <header className="sticky top-0 z-40 w-full border-b bg-[#F5F5F5]">
        <div className="flex w-full items-center justify-between gap-6 px-0 py-3">
          {/* Tên dự án: sử dụng màu tím đậm */}
          <Link 
              href="/" 
              className="shrink-0 text-2xl font-black tracking-tighter"
              style={{ color: '#E33AEC' }}
          >
              QuizzZone
          </Link>
          <nav className="flex flex-1 items-center justify-center text-sm text-zinc-600" />
          <ProfileDropdown />
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}