import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log('Registration request received:', body);

    // Forward the request to the backend Spring Boot server
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8082';
    
    const response = await fetch(`${backendUrl}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.text();

    console.log('Backend response:', response.status, data);

    if (!response.ok) {
      return new NextResponse(data || 'Registration failed', {
        status: response.status,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    return new NextResponse(data || 'Registration successful', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
