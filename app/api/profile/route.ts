import { NextResponse } from 'next/server';

// GET - Fetch user profile from backend
export async function GET(req: Request) {
  try {
    // Extract Authorization header (containing JWT)
    const authorization = req.headers.get('Authorization');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // If Authorization header exists, forward it
    if (authorization) {
      headers['Authorization'] = authorization;
    }

    const response = await fetch('http://localhost:8082/api/profile', {
      method: 'GET',
      headers: headers,
      // credentials: 'include', // Not needed when forwarding Authorization header
    });

    if (!response.ok) {
      return new NextResponse('Failed to fetch profile', { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching profile:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// PUT - Update user profile on backend
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    // Extract Authorization header (containing JWT)
    const authorization = req.headers.get('Authorization');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // If Authorization header exists, forward it
    if (authorization) {
      headers['Authorization'] = authorization;
    }

    const response = await fetch('http://localhost:8082/api/profile/update', {
      method: 'PUT',
      headers: headers, // Use the new headers object with Authorization
      body: JSON.stringify(body),
      // credentials: 'include', // Not needed when forwarding Authorization header
    });

    if (!response.ok) {
      const errorData = await response.text();
      return new NextResponse(errorData, { status: response.status });
    }

    return new NextResponse('Profile updated successfully', { status: 200 });
  } catch (error) {
    console.error('Error updating profile:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// DELETE - Delete user avatar
export async function DELETE(req: Request) {
  try {
    // Extract Authorization header (containing JWT)
    const authorization = req.headers.get('Authorization');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // If Authorization header exists, forward it
    if (authorization) {
      headers['Authorization'] = authorization;
    }

    const response = await fetch('http://localhost:8082/api/profile/delete-avatar', {
      method: 'DELETE',
      headers: headers,
      // credentials: 'include', // Not needed when forwarding Authorization header
    });

    if (!response.ok) {
      const errorData = await response.text();
      return new NextResponse(errorData, { status: response.status });
    }

    return new NextResponse('Avatar deleted successfully', { status: 200 });
  } catch (error) {
    console.error('Error deleting avatar:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
