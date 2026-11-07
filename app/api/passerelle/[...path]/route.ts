import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME } from '@/lib/authCookie';

// Relais en LECTURE SEULE vers la passerelle du CHU, pour le dossier patient
// (observations, diagnostics, suivi, résultats et historique de tous les
// services) : le jeton de session vit dans le cookie httpOnly de l'anapath,
// illisible côté navigateur. Seuls les services nécessaires sont relayés.
const GATEWAY_URL = (process.env.NEXT_PUBLIC_GATEWAY_URL || '').replace(/\/$/, '');
const SERVICES_AUTORISES = new Set(['dossier-patient', 'accueil', 'users', 'services']);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ message: 'Non authentifié' }, { status: 401 });
  }
  const { path } = await params;
  if (!GATEWAY_URL || !SERVICES_AUTORISES.has(path[0] ?? '')) {
    return NextResponse.json({ message: 'Service non relayé' }, { status: 404 });
  }

  try {
    const reponse = await fetch(
      `${GATEWAY_URL}/${path.map(encodeURIComponent).join('/')}${request.nextUrl.search}`,
      { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' },
    );
    return new NextResponse(await reponse.text(), {
      status: reponse.status,
      headers: { 'Content-Type': reponse.headers.get('content-type') || 'application/json' },
    });
  } catch {
    return NextResponse.json({ message: 'Passerelle indisponible' }, { status: 502 });
  }
}
