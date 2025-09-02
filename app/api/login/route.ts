import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { password } = await request.json().catch(() => ({ password: '' }));

  const adminPassword = process.env.ADMIN_PASSWORD || 'change-me';
  if (!password || password !== adminPassword) {
    return NextResponse.json({ ok: false, error: 'Invalid password' }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set('admin', '1', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24h
    path: '/',
  });
  return response;
}


