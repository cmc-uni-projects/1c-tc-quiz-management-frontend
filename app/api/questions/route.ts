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

    // Lấy body nếu phương thức là POST
    let body: any = undefined;
    if (method === 'POST' || method === 'PUT') { // Also handle PUT for updates
        try {
            body = await request.json();
        } catch (e) {
            console.warn(`Could not parse body for ${method} request.`, e);
        }
    }

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
            body: body ? JSON.stringify(body) : undefined,
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


// --- 1. GET (Danh sách và tìm kiếm) ---
export async function GET(request: Request) {
    // Lấy query parameters từ request của client
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();

    // Endpoint Backend: /api/questions/search?...
    const endpoint = `/questions/all?${queryString}`;

    return proxyRequest(request, endpoint, 'GET');
}


// --- 2. POST (Tạo mới) ---
export async function POST(request: Request) {
    // Endpoint Backend: /api/questions
    const endpoint = `/questions`;

    return proxyRequest(request, endpoint, 'POST');
}