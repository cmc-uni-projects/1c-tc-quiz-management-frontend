import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET() {
  try {
    // Use NextAuth's getServerSession to securely get the session details
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      // If there's no session or user data, the user is not authenticated
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // If the session is valid, return the user object contained within it
    return NextResponse.json(session.user);

  } catch (error) {
    console.error('Error in /api/me route:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
