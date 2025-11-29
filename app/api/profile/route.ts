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
    return new NextResponse('Internal server error', { status: 500 });
  }
}

// PATCH - Update user profile
export async function PATCH(req: Request) {
  try {
    console.log('PATCH /api/profile - Request received');
    
    // Extract Authorization header (containing JWT)
    const authorization = req.headers.get('Authorization');
    console.log('Authorization header:', authorization ? 'Present' : 'Missing');

    // Get the request body
    let body;
    try {
      body = await req.json();
      console.log('Request body:', body);
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return new NextResponse('Invalid JSON body', { status: 400 });
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // If Authorization header exists, forward it
    if (authorization) {
      headers['Authorization'] = authorization;
    }

    console.log('Forwarding to backend: http://localhost:8082/api/profile/update');
    
    const response = await fetch('http://localhost:8082/api/profile/update', {
      method: 'PATCH',
      headers: headers,
      body: JSON.stringify(body),
      // credentials: 'include', // Not needed when forwarding Authorization header
    });

    console.log('Backend response status:', response.status);

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Backend error response:', errorData);
      return new NextResponse(errorData, { status: response.status });
    }

    // Handle both JSON and text responses from backend
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
      console.log('Backend success response (JSON):', data);
    } else {
      data = await response.text();
      console.log('Backend success response (Text):', data);
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in PATCH /api/profile:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new NextResponse(`Internal server error: ${errorMessage}`, { status: 500 });
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
