import { NextRequest, NextResponse } from 'next/server';
import { fetchApi, ApiError } from '@/lib/apiClient';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log('Registration request received:', body);

    // Forward the request to the backend Spring Boot server using fetchApi
    const data = await fetchApi('/register', {
      method: 'POST',
      body: body,
    });

    console.log('Backend response:', data);

    // ... (Phần còn lại của code giữ nguyên)
    const responseData = data instanceof Response ? await data.text() : data;

    return new NextResponse(responseData || 'Registration successful', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    const status = error instanceof ApiError ? error.status : 500;
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: status }
    );
  }
}