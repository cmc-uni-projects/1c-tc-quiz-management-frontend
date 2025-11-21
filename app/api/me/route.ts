import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8082/api';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Forward the request to the backend's profile endpoint
    const backendResponse = await fetch(`${BACKEND_URL}/profile`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
      },
    });

    if (!backendResponse.ok) {
      // Pass through backend errors (e.g., 401 if token is invalid/expired)
      const errorData = await backendResponse.json().catch(() => ({ message: 'Failed to fetch user profile from backend' }));
      return NextResponse.json(errorData, { status: backendResponse.status });
    }

    const userProfile = await backendResponse.json();
    return NextResponse.json(userProfile);

  } catch (error) {
    console.error('Error in /api/me route:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
