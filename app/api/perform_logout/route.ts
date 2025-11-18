import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8082';

export async function POST(req: NextRequest) {
  try {
    const cookies = req.headers.get('cookie') || '';

    // Try multiple possible backend endpoints; succeed if any returns < 400
    const candidates = [
      '/logout',
      '/api/auth/logout',
      '/api/logout',
    ];

    let ok = false;
    let lastStatus: number | undefined = undefined;
    for (const path of candidates) {
      try {
        const res = await fetch(`${BACKEND_URL}${path}`, {
          method: 'POST',
          headers: { Cookie: cookies },
          credentials: 'include',
          redirect: 'manual',
        });
        lastStatus = res.status;
        if (res.status < 400) { ok = true; break; }
      } catch {
        // try next
        lastStatus = undefined;
      }
    }

    // Always return 200 so clients don't misinterpret redirects as failure
    return NextResponse.json({ success: ok, backendStatus: lastStatus }, { status: 200 });
  } catch (err) {
    console.error('[perform_logout] error:', err);
    // Still return 200 to avoid UI false-negatives; flag success=false
    return NextResponse.json({ success: false, error: 'Logout error' }, { status: 200 });
  }
}
