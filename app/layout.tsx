// app/layout.tsx (ĐÃ SỬA)

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { Providers } from "./providers";
import Navbar from '@/components/Navbar';

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
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {/* Bắt đầu Providers, bọc toàn bộ nội dung ứng dụng */}
        <Providers>
          <Navbar />
          <main className="flex min-h-screen flex-col items-center justify-between">
             {children}
          </main>
        </Providers>

        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              borderRadius: "10px",
              background: "#111827",
              color: "#F9FAFB",
              fontSize: "0.9rem",
            },
            success: {
              iconTheme: {
                primary: "#22C55E",
                secondary: "#ECFDF3",
              },
            },
            error: {
              iconTheme: {
                primary: "#EF4444",
                secondary: "#FEF2F2",
              },
            },
          }}
        />
      </body>
    </html>
  );
}