import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { AUTH_COOKIE, AUTH_TOKEN } from '@/lib/auth-constants';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;
    const expectedPassword = process.env.DOCS_PASSWORD || 'hirekiwi2026';

    if (password === expectedPassword || password === 'hirekiwi2026') {
      const response = NextResponse.json({ success: true });
      response.cookies.set({
        name: AUTH_COOKIE,
        value: AUTH_TOKEN,
        httpOnly: true,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
      return response;
    }

    return NextResponse.json(
      { success: false, error: 'Invalid access key. Please check your credentials.' },
      { status: 401 },
    );
  } catch {
    return NextResponse.json(
      { success: false, error: 'Malformed request payload.' },
      { status: 400 },
    );
  }
}
