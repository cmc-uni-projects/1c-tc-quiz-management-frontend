// This auth route is a placeholder
// Authentication is handled by the backend Spring Boot server
// The backend will manage login/logout and session via cookies

import { NextResponse } from 'next/server';

export const authOptions = {
  providers: [],
  pages: {
    signIn: '/login',
    error: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

// Placeholder handlers - actual auth is handled by backend
export async function GET() {
  return new NextResponse('Auth handler - use backend auth', { status: 200 });
}

export async function POST() {
  return new NextResponse('Auth handler - use backend auth', { status: 200 });
}
