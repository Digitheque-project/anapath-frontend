import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME } from '@/lib/authCookie';
import { decodeJwtPayload } from '@/lib/jwt';
import { estServiceAnapath } from '@/lib/anapathService';


export async function GET(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const payload = decodeJwtPayload(token);
  const entry = payload?.services?.find(estServiceAnapath);
  if (!payload || !entry) {
    return NextResponse.json({ error: 'Session invalide' }, { status: 401 });
  }

  return NextResponse.json({
    name: payload.name,
    firstname: payload.firstname,
    email: payload.email,
    roleName: entry.roleName,
    permissions: entry.permissions,
    chu: entry.chu ?? null,
  });
}
