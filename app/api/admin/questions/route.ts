import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

async function proxyAdminRequest(request: Request, endpoint: string, method: string) {
    if (!API_URL) return NextResponse.json({ message: 'API_URL missing' }, { status: 500 });

    // URL sẽ là: http://localhost:8082/api/admin/questions...
    const backendUrl = `${API_URL}${endpoint}`;
    const authorization = request.headers.get('authorization');

    let body: any = undefined;
    if (method === 'POST') {
        try { body = await request.json(); } catch (e) {}
    }

    try {
        const res = await fetch(backendUrl, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                ...(authorization ? { 'Authorization': authorization } : {})
            },
            body: body ? JSON.stringify(body) : undefined,
            cache: 'no-store',
        });

        // Đọc response an toàn
        let data = {};
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
             data = await res.json().catch(() => ({}));
        }

        return NextResponse.json(data, { status: res.status });
    } catch (error) {
        return NextResponse.json({ message: 'Failed to connect to Backend' }, { status: 500 });
    }
}

// --- 1. GET (Danh sách) ---
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    // Backend AdminController: @GetMapping("/questions")
    // Giữ nguyên query params (page, etc.)
    const endpoint = `/admin/questions?${searchParams.toString()}`;
    return proxyAdminRequest(request, endpoint, 'GET');
}

// --- 2. POST (Tạo mới) ---
export async function POST(request: Request) {
    // Backend AdminController: @PostMapping("/questions")
    const endpoint = `/admin/questions`;
    return proxyAdminRequest(request, endpoint, 'POST');
}