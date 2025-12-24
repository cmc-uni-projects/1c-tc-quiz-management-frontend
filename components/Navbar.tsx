'use client';
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@/lib/user";

export default function Navbar() {
  const pathname = usePathname();
  const { isAuthenticated } = useUser();

  // Hide navbar on pages that render their own header to prevent duplicates
  const hideOnRoutes = [
    "/admin",
    "/register",      // Admin area has its own layout/header
    "/student",       // All student pages have their own layout/header
    "/teacher",       // All teacher pages have their own layout/header
  ];
  if (pathname && hideOnRoutes.some((p) => pathname.startsWith(p))) return null;

  return (
    <header data-global="true" className="sticky top-0 z-50 w-full border-b border-zinc-100 bg-white/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-full items-center justify-between gap-2 px-4 py-3 md:px-6">
        {/* Logo */}
        <Link href="/" className="shrink-0 text-4xl font-black tracking-tighter" style={{ color: '#E33AEC' }}>
          QuizzZone
        </Link>

        {/* Center nav removed as requested */}
        <div className="flex-1" />

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-2">
          {!isAuthenticated && (
            <>
              <Link
                href="/auth/login"
                className="rounded-lg px-4 py-2 text-lg font-medium shadow-md transition duration-200 hover:shadow-lg"
                style={{ backgroundColor: '#0000002E', color: 'black' }}
              >
                Đăng nhập
              </Link>
              <Link
                href="/register"
                className="rounded-lg border-2 px-4 py-2 text-lg font-bold shadow-md transition duration-200 hover:shadow-lg"
                style={{ backgroundColor: 'white', color: '#E33AEC', borderColor: '#E33AEC' }}
              >
                Đăng ký
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
