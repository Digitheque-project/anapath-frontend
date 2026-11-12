import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME } from '@/lib/authCookie';
import { decodeJwtPayload } from '@/lib/jwt';
import { estServiceAnapath } from '@/lib/anapathService';
import { publicUrl } from '@/lib/publicUrl';

const LOGIN_URL =
  process.env.NEXT_PUBLIC_LOGIN_URL || '';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('accessToken');
  if (!token) {
    return NextResponse.redirect(LOGIN_URL);
  }

  const payload = decodeJwtPayload(token);
  const hasAnapathAccess = payload?.services?.some(estServiceAnapath);

  if (!payload || !hasAnapathAccess || (payload.exp && payload.exp * 1000 < Date.now())) {
    return NextResponse.redirect(LOGIN_URL);
  }

  const maxAge = payload.exp
    ? Math.max(0, payload.exp - Math.floor(Date.now() / 1000))
    : 60 * 60 * 24;

  // Domaine public (pas l'adresse interne vue derrière le proxy de Render).
  const response = NextResponse.redirect(publicUrl(request, '/dashboard'));
  response.cookies.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    // Cookie « Secure » seulement en HTTPS : au CHU (HTTP en réseau local) le
    // navigateur rejette un cookie Secure et la session ne tient jamais.
    secure: (request.headers.get("x-forwarded-proto") ?? new URL(request.url).protocol.replace(":", "")) === "https",
    sameSite: 'lax',
    path: '/',
    maxAge,
  });
  return response;
}
