import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { Providers } from "./providers";
import Navbar from '@/components/Navbar';
import AuthRedirect from '@/components/AuthRedirect';

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
        {/*  */}
        <Providers>
          <AuthRedirect />
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1">
              {children}
            </main>
          </div>
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