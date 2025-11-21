// app/default-layout.tsx
import Link from "next/link";
import Footer from "@/components/Footer"; // Giả định đường dẫn

export default function DefaultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
    // Hành động mặc định (Đăng nhập/Đăng ký)
    const DefaultActions = (
        <>
            <Link 
                href="/auth/login" 
                className="rounded-lg px-4 py-2 font-medium shadow-md hover:shadow-lg transition duration-200 text-lg" 
                style={{ backgroundColor: '#0000002E', color: 'black' }} 
            >
                Đăng nhập
            </Link>
            <Link 
                href="/register" 
                className="rounded-lg px-4 py-2 font-bold shadow-md hover:shadow-lg transition duration-200 text-lg border-2"
                style={{ 
                    backgroundColor: 'white', 
                    color: '#E33AEC', 
                    borderColor: '#E33AEC', 
                }} 
            >
                Đăng ký
            </Link>
        </>
    );

    return (
        <>
            {/* Header toàn cục: Có Đăng nhập/Đăng ký */}
            <header data-global="true" className="sticky top-0 z-50 w-full border-b border-zinc-100 bg-white/95 backdrop-blur">
                <div className="mx-auto flex w-full max-w-full items-center justify-between gap-2 px-4 py-3 md:px-6"> 
                    
                    {/* 1. Logo/Tên dự án */}
                    <Link 
                        href="/" 
                        className="shrink-0 text-4xl font-black tracking-tighter" 
                        style={{ color: '#E33AEC' }} 
                    >
                        QuizzZone
                    </Link>
                    
                    {/* 2. Mục Điều hướng Chính */}
                    <nav className="flex flex-1 items-center justify-center text-lg font-medium text-zinc-600"> 
                        <Link href="/" className="hover:text-zinc-900 transition duration-150">Trang chủ</Link>
                    </nav>
                    
                    {/* 3. Nút Hành động */}
                    <div className="flex shrink-0 items-center gap-2">
                        {DefaultActions}
                    </div>
                </div>
            </header>

            <main className="min-h-[calc(100vh-140px)]">{children}</main>
            <Footer />
        </>
    );
}

