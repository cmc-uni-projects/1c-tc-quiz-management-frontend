import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface RouteContext {
    params: { id: string };
}

export async function GET(request: Request, context: RouteContext) {
    if (!API_URL) {
        return NextResponse.json({ message: 'Internal Server Error: API_URL is missing' }, { status: 500 });
    }

    const backendUrl = `${API_URL}/questions/get/${context.params.id}`;
    const authorization = request.headers.get('authorization');

    try {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };
        if (authorization) {
            headers['Authorization'] = authorization;
        }

        const response = await fetch(backendUrl, {
            method: 'GET',
            headers: headers,
            cache: 'no-store',
        });

        return new NextResponse(response.body, {
            status: response.status,
            headers: response.headers,
        });

    } catch (error) {
        console.error(`Error proxying GET request for question ${context.params.id}:`, error);
        return NextResponse.json({
            message: 'Internal Server Error: Failed to connect to Backend.',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
