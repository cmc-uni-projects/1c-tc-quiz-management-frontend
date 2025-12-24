import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    // Extract Authorization header (containing JWT)
    const authorization = req.headers.get('Authorization');

    const headers: Record<string, string> = {};

    // If Authorization header exists, forward it
    if (authorization) {
      headers['Authorization'] = authorization;
    }

    // Forward the file upload to the backend
    const response = await fetch('http://localhost:8082/api/profile/upload-avatar', {
      method: 'POST',
      headers: headers, // Use the new headers object with Authorization
      body: formData,
      // credentials: 'include', // Not needed when forwarding Authorization header
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
