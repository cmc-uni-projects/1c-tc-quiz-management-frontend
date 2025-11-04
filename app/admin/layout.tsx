"use client";
import { useEffect } from "react";
import Link from "next/link";
import ProfileDropdown from "../../components/ProfileDropdown";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // Hide the global header while on admin pages
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
      <header className="sticky top-0 z-40 w-full border-b bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-6 px-6 py-3 md:px-8">
          <Link href="/" className="text-xl font-extrabold tracking-tight text-[#E33AEC]">QuizzZone</Link>
          <nav className="flex flex-1 items-center justify-center text-sm text-zinc-600">
            <span className="select-none">Trang chủ</span>
          </nav>
          <ProfileDropdown />
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
