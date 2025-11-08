import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8082';

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('[forgot-password API] Request email:', body.email);
    
    const backendUrl = `${BACKEND_URL}/api/forgot-password`;
    console.log('[forgot-password API] Calling backend:', backendUrl);
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    console.log('[forgot-password API] Backend status:', response.status);
    
    const text = await response.text();
    console.log('[forgot-password API] Backend response (first 500 chars):', text.substring(0, 500));
    
    if (!text) {
      return NextResponse.json(
        { error: 'Empty response from backend' },
        { status: response.status }
      );
    }
    
    let data;
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      console.error('[forgot-password API] Parse error:', parseError);
      console.error('[forgot-password API] Response was:', text);
      return NextResponse.json(
        { error: `Backend returned invalid JSON: ${text.substring(0, 100)}` },
        { status: 502 }
      );
    }
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[forgot-password API] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
