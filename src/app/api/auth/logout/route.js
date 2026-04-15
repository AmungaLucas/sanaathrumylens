// src/app/api/auth/logout/route.js
import { NextResponse } from 'next/server';
import { createClearCookie } from '@/lib/auth';

export async function POST() {
  try {
    const cookie = createClearCookie();
    const response = NextResponse.json({ success: true });

    response.cookies.set(cookie.name, cookie.value, cookie.options);
    return response;

  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
