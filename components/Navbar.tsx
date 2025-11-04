import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="flex items-center justify-center gap-6 text-sm text-zinc-600">
      <Link href="/" className="hover:text-zinc-900">
        Trang chủ
      </Link>
    </nav>
  );
}
