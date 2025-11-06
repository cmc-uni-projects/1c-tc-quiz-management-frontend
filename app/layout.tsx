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
      <body className="min-h-screen flex flex-col overflow-hidden">
        {/* Header toàn cục: Chữ rất lớn, sát lề */}
        <header data-global="true" className="sticky top-0 z-50 w-full border-b border-zinc-100 bg-white/95 backdrop-blur flex-none">
          {/* Căn sát lề với px-4 và max-w-full */}
          <div className="mx-auto flex w-full max-w-full items-center justify-between gap-2 px-4 py-6 md:px-6"> 
            
            {/* 1. Logo/Tên dự án: Màu #E33AEC, cỡ text-4xl */}
            <Link 
                href="/" 
                className="shrink-0 text-4xl font-black tracking-tighter" 
                style={{ color: '#E33AEC' }} 
            >
                QuizzZone
            </Link>
            
            {/* 2. Mục Điều hướng Chính: Chỉ có Trang chủ, cỡ text-2xl */}
            <nav className="flex flex-1 items-center justify-center text-2xl font-medium text-zinc-600"> 
              <Link href="#" className="hover:text-zinc-900 transition duration-150">Trang chủ</Link>
            </nav>
            
            {/* 3. Nút Hành động */}
            <div className="flex shrink-0 items-center gap-2">
              {/* Nút Đăng nhập: Màu nền #0000002E, chữ đen, cỡ text-2xl */}
              <Link 
                  href="/login" 
                  className="rounded-lg px-6 py-3 font-medium shadow-md hover:shadow-lg transition duration-200 text-2xl" 
                  style={{ backgroundColor: '#0000002E', color: 'black' }} 
              >
                Đăng nhập
              </Link>
              
              {/* Nút Đăng ký: Theo mẫu (Viền/chữ #E33AEC, nền trắng), cỡ text-2xl */}
              <Link 
                  href="/register" 
                  className="rounded-lg px-6 py-3 font-bold shadow-md hover:shadow-lg transition duration-200 text-2xl border-2"
                  style={{ 
                      backgroundColor: 'white', 
                      color: '#E33AEC', 
                      borderColor: '#E33AEC', 
                  }} 
              >
                Đăng ký
              </Link>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto">{children}</main>
        <div className="mt-auto w-full">
          <Footer />
        </div>
      </body>
    </html>
  );
}