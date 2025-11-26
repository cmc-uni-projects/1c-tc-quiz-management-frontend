import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

async function proxyRequestWithId(request: Request, endpoint: string, method: string) {
    if (!API_URL) return NextResponse.json({ message: 'API_URL missing' }, { status: 500 });

    const backendUrl = `${API_URL}${endpoint}`;
    const authorization = request.headers.get('authorization');

    let body: any = undefined;
    if (method === 'PUT') {
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

        let data = {};
        if (res.status !== 204) {
             const contentType = res.headers.get("content-type");
             if (contentType && contentType.includes("application/json")) {
                data = await res.json().catch(() => ({}));
             }
        }
        return NextResponse.json(data, { status: res.status });
    } catch (error) {
        return NextResponse.json({ message: 'Failed to connect' }, { status: 500 });
    }
}

interface RouteContext { params: { id: string }; }

// --- 1. GET (Chi tiết) ---
// Lưu ý: AdminController chưa có API lấy chi tiết 1 câu hỏi (/questions/{id}).
// Nên ở đây ta dùng tạm endpoint chung của User thường để lấy dữ liệu hiển thị form sửa.
export async function GET(request: Request, context: RouteContext) {
    //  Trỏ vào API Admin vừa tạo
    const endpoint = `/admin/questions/${context.params.id}`;
    return proxyAdminRequestWithId(request, endpoint, 'GET');
}

// --- 2. PUT (Cập nhật - Admin) ---
export async function PUT(request: Request, context: RouteContext) {
    // Backend AdminController: @PutMapping("/questions/{id}")
    const endpoint = `/admin/questions/${context.params.id}`;
    return proxyRequestWithId(request, endpoint, 'PUT');
}

// --- 3. DELETE (Xóa - Admin) ---
export async function DELETE(request: Request, context: RouteContext) {
    // Backend AdminController: @DeleteMapping("/questions/{id}")
    const endpoint = `/admin/questions/${context.params.id}`;
    return proxyRequestWithId(request, endpoint, 'DELETE');
}