import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// URL của backend Spring Boot
const BACKEND_URL = process.env.SPRING_BOOT_API_URL || 'http://localhost:8082';

export async function GET() {
  // Lấy cookie từ request mà trình duyệt gửi đến Next.js
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get('JSESSIONID'); // Hoặc tên cookie session của bạn

  if (!sessionCookie) {
    // Nếu không có cookie session, chắc chắn người dùng chưa đăng nhập
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    // Gọi đến backend Spring Boot để lấy thông tin user
    // Giả sử backend có endpoint /api/profile để trả về thông tin user hiện tại
    const allCookies = cookieStore.getAll().map(cookie => `${cookie.name}=${cookie.value}`).join('; ');

    const response = await fetch(`${BACKEND_URL}/api/profile`, {
      headers: {
        'Cookie': allCookies,
      },
    });

    if (!response.ok) {
      // Nếu backend trả về lỗi (ví dụ: session hết hạn), trả về lỗi tương ứng
      return NextResponse.json({ error: 'Failed to fetch user from backend' }, { status: response.status });
    }

    // Nếu thành công, lấy dữ liệu user và trả về cho frontend
    const user = await response.json();
    return NextResponse.json(user);

  } catch (error) {
    console.error('Error in /api/me route:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
