import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { Providers } from "./providers";
import Navbar from "@/components/Navbar";
import AuthRedirect from "@/components/AuthRedirect";

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <head>
        <Script
          src="https://www.gstatic.com/firebasejs/11.0.1/firebase-app-compat.js"
          strategy="beforeInteractive"
        />
        <Script
          src="https://www.gstatic.com/firebasejs/11.0.1/firebase-auth-compat.js"
          strategy="beforeInteractive"
        />
        <Script
          src="https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore-compat.js"
          strategy="beforeInteractive"
        />
      </head>

      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <Providers>
          <AuthRedirect />
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1">{children}</main>
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
          }}
        />
      </body>
    </html>
  );
}
