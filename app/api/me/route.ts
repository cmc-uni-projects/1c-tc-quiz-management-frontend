import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_URL = process.env.SPRING_BOOT_API_URL || 'http://localhost:8082';

export async function GET() {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get('JSESSIONID'); // Hoặc tên cookie session

  if (!sessionCookie) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const response = await fetch(`${BACKEND_URL}/api/profile`, {
      headers: {
        'Cookie': `${sessionCookie.name}=${sessionCookie.value}`,
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch user from backend' }, { status: response.status });
    }

    const user = await response.json();
    return NextResponse.json(user);

  } catch (error) {
    console.error('Error in /api/me route:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
