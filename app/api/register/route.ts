import { NextRequest, NextResponse } from 'next/server';
import { fetchApi } from '@/lib/apiClient';

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

    // fetchApi throws on error, so if we get here, it was successful.
    // The backend might return a simple text response on success.
    const responseData = data instanceof Response ? await data.text() : data;

    return new NextResponse(responseData || 'Registration successful', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  } catch (error: unknown) {
    console.error('Registration error:', error);
    // The error from fetchApi should have a meaningful message
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 } // Or a more specific error code if available
    );
  }
}
