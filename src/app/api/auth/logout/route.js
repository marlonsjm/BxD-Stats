// Logout: limpa o cookie de sessão. Aceita apenas POST (evita logout via
// link/imagem forjada — CSRF). O AuthNav envia um POST via fetch.

import { NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  const origin = new URL(request.url).origin;
  const response = NextResponse.redirect(`${origin}/`, 303);
  response.cookies.set(SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return response;
}
