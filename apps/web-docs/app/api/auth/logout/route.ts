import { NextResponse } from 'next/server';
import { AUTH_COOKIE } from '@/lib/auth-constants';

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set({
    name: AUTH_COOKIE,
    value: '',
    httpOnly: true,
    path: '/',
    maxAge: 0,
  });
  return response;
}
