import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const cookies = req.headers.get('cookie');

    // Forward the file upload to the backend
    const response = await fetch('http://localhost:8082/api/profile/upload-avatar', {
      method: 'POST',
      headers: {
        'Cookie': cookies || '',
      },
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.text();
      return new NextResponse(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error uploading avatar:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
