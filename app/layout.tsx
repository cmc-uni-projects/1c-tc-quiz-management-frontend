import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import Footer from "../components/Footer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "QuizzZone",
  description: "Hãy thử thách trí tuệ cùng QuizzZone",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white text-zinc-900`}>
        <header className="sticky top-0 z-50 w-full border-b bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
            <Link href="/" className="text-xl font-extrabold tracking-tight text-[#E33AEC]">QuizzZone</Link>
            <nav className="flex items-center gap-6 text-sm text-zinc-600">
              <span className="select-none">Trang chủ</span>
            </nav>
            <div className="flex items-center gap-2">
              <button className="rounded-md bg-zinc-100 px-4 py-2 text-zinc-900 hover:bg-zinc-200">Đăng nhập</button>
              <button className="rounded-md border border-[#E33AEC] px-4 py-2 font-medium text-[#E33AEC] hover:bg-[#E33AEC]/10">Đăng ký</button>
            </div>
          </div>
        </header>
        <main className="min-h-[calc(100vh-140px)]">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
