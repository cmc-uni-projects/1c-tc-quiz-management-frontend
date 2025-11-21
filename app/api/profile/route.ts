import { NextResponse } from 'next/server';

// GET - Fetch user profile from backend
export async function GET(req: Request) {
  try {
    const cookies = req.headers.get('cookie');
    const response = await fetch('http://localhost:8082/api/profile', {
      method: 'GET',
      headers: {
        'Cookie': cookies || '',
        'Content-Type': 'application/json',
      },
      credentials: 'include',
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
    const cookies = req.headers.get('cookie');

    const response = await fetch('http://localhost:8082/api/profile/update', {
      method: 'PUT',
      headers: {
        'Cookie': cookies || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      credentials: 'include',
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
    const cookies = req.headers.get('cookie');

    const response = await fetch('http://localhost:8082/api/profile/delete-avatar', {
      method: 'DELETE',
      headers: {
        'Cookie': cookies || '',
        'Content-Type': 'application/json',
      },
      credentials: 'include',
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
