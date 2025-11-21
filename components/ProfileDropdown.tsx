import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useSession, signOut } from "next-auth/react";

export default function ProfileDropdown() {
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user;
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

  const getProfileUrl = () => {
    switch (user?.role?.toUpperCase()) {
      case 'ADMIN':
        return '/admin/profile';
      case 'TEACHER':
        return '/teacher/profile';
      case 'STUDENT':
        return '/student/profile';
      default:
        // Fallback URL if role is not defined, though this shouldn't happen for an authenticated user.
        return '/'; 
    }
  };

  const getChangePasswordUrl = () => {
    switch (user?.role?.toUpperCase()) {
      case 'ADMIN':
        return '/admin/change-password';
      case 'TEACHER':
        return '/teacher/change-password';
      case 'STUDENT':
        return '/student/change-password';
      default:
        return '/';
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
    setOpen(false);
    await signOut({ callbackUrl: '/login' });
    toast.success('Đăng xuất thành công');
  };

  // Don't render the dropdown if the user is not authenticated
  if (!user) {
    return null;
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full bg-gray-200/50 px-2 py-1.5 text-sm text-zinc-700 hover:bg-gray-200/80"
      >
        <span className="grid h-8 w-8 place-items-center rounded-full bg-gray-300 text-gray-700">
          👤
        </span>
        <span className="hidden sm:inline">{user.name || 'Menu'}</span>
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
