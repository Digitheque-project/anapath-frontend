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
    chu: avecNomDuLogo(entry.chu),
  });
}

// Le jeton allégé ne porte plus chu.logo (nom du fichier), seulement chu.logoUrl :
// on en déduit le nom du fichier, servi ensuite par /api/anapath/files/<nom>.
function avecNomDuLogo(chu: unknown) {
  if (!chu || typeof chu !== 'object') return null;
  const c = chu as { logo?: string | null; logoUrl?: string | null };
  if (c.logo || !c.logoUrl) return c;
  const nom = c.logoUrl.split('?')[0].split('/').filter(Boolean).pop();
  return nom ? { ...c, logo: decodeURIComponent(nom) } : c;
}
