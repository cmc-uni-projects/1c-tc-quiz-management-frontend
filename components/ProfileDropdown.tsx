"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

export default function ProfileDropdown() {
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

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full bg-[#E33AEC]/15 px-3 py-1.5 text-sm text-zinc-700 hover:bg-[#E33AEC]/25"
      >
        <span className="grid h-8 w-8 place-items-center rounded-full bg-[#E33AEC]/30 text-[#E33AEC]">👤</span>
        <span className="hidden sm:inline">Xin chào, Admin</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 overflow-hidden rounded-md border border-zinc-200 bg-white shadow-lg">
          <Link href="#" className="block px-3 py-2 text-sm hover:bg-zinc-50">
            Cập nhật thông tin
          </Link>
          <Link href="/admin/change-password" className="block px-3 py-2 text-sm hover:bg-zinc-50">
            Đổi mật khẩu
          </Link>
          <div className="border-t" />
          <button className="block w-full px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50">
            ← Đăng xuất
          </button>
        </div>
      )}
    </div>
  );
}
