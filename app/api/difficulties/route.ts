import { NextResponse } from 'next/server';

// Đọc biến môi trường (ví dụ: http://localhost:8082/api)
// Sử dụng biến môi trường bạn đã cung cấp: NEXT_PUBLIC_API_URL
const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Helper function để chuyển tiếp yêu cầu đến Backend
async function proxyRequest(request: Request, endpoint: string, method: string) {
    if (!API_URL) {
        return NextResponse.json({ message: 'Internal Server Error: API_URL is missing' }, { status: 500 });
    }

    // Xây dựng URL đầy đủ của Backend
    const backendUrl = `${API_URL}${endpoint}`;
    const authorization = request.headers.get('authorization');

    try {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };
        if (authorization) {
            headers['Authorization'] = authorization;
        }

        const response = await fetch(backendUrl, {
            method: method,
            headers: headers,
            cache: 'no-store',
        });
        
        // Trả về response từ Backend (bao gồm cả status, headers và body)
        return new NextResponse(response.body, {
            status: response.status,
            headers: response.headers,
        });

    } catch (error) {
        // Lỗi ECONNREFUSED xảy ra ở đây nếu Backend chưa chạy
        console.error(`Error proxying ${method} request to Backend at ${backendUrl}:`, error);
        return NextResponse.json({
            message: 'Internal Server Error: Failed to connect to Backend (ECONNREFUSED)',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}


// --- 1. GET (Danh sách) ---
export async function GET(request: Request) {
    // Lấy query parameters từ request của client
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();

    // Endpoint Backend: /api/difficulties?{queryString}
    const endpoint = `/questions/difficulties?${queryString}`;

    return proxyRequest(request, endpoint, 'GET');
}
