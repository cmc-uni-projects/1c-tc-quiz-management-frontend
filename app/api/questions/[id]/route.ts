import { NextResponse } from 'next/server';

// Đọc biến môi trường (ví dụ: http://localhost:8082/api)
const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Helper function để chuyển tiếp yêu cầu đến Backend
async function proxyRequestWithId(request: Request, id: string, method: string) {
    if (!API_URL) {
        return NextResponse.json({ message: 'Internal Server Error: API_URL is missing' }, { status: 500 });
    }

    // Xây dựng URL đầy đủ: http://localhost:8082/api/questions/{id}
    const backendUrl = `${API_URL}/questions/${id}`;
    const cookies = request.headers.get('cookie');

    // Lấy body nếu phương thức là PUT
    let bodyData: any = undefined;
    if (method === 'PUT') {
         try {
             // Cố gắng đọc body, chỉ cần cho PUT
             bodyData = await request.json();
         } catch (e) {
             console.warn(`Could not parse body for PUT request.`, e);
         }
    }


    try {
        const response = await fetch(backendUrl, {
            method: method,
            headers: {
                'Cookie': cookies || '',
                'Content-Type': 'application/json',
            },
            body: bodyData ? JSON.stringify(bodyData) : undefined,
            cache: 'no-store',
        });

        // Trả về response từ Backend cho Client
        return new NextResponse(response.body, {
            status: response.status,
            headers: response.headers,
        });

    } catch (error) {
        console.error(`Error proxying ${method} request for question ${id}:`, error);
        return NextResponse.json({
            message: 'Internal Server Error: Failed to connect to Backend.',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}


// Tham số route động được lấy từ params
interface RouteContext {
    params: { id: string };
}

// --- 1. GET (Chi tiết câu hỏi, giải quyết lỗi 500 khi nhấn Sửa) ---
export async function GET(request: Request, context: RouteContext) {
    return proxyRequestWithId(request, context.params.id, 'GET');
}


// --- 2. PUT (Cập nhật câu hỏi) ---
export async function PUT(request: Request, context: RouteContext) {
    return proxyRequestWithId(request, context.params.id, 'PUT');
}


// --- 3. DELETE (Xóa câu hỏi) ---
export async function DELETE(request: Request, context: RouteContext) {
    return proxyRequestWithId(request, context.params.id, 'DELETE');
}