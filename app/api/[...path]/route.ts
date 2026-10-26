import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME } from '@/lib/authCookie';

// Backend Anapath joint par la passerelle du CHU (routes sous /anapath/api).
// Aucune adresse de repli dans le code : NEXT_PUBLIC_GATEWAY_URL uniquement.
const BACKEND_URL = `${(process.env.NEXT_PUBLIC_GATEWAY_URL || '').replace(/\/$/, '')}/anapath`;

// Documentation de l'API servie publiquement par le backend : les outils
// externes (vérificateur d'écosystème) sondent {baseUrl}/api/docs sans session.
const PUBLIC_DOC_PATHS = new Set(['docs', 'docs-json', 'docs-yaml', 'json']);

async function handler(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const isPublicDoc = PUBLIC_DOC_PATHS.has((await params).path[0] ?? '');
  if (!token && !isPublicDoc) {
    return NextResponse.json({ message: 'Non authentifié' }, { status: 401 });
  }

  const { path } = await params;
  const search = request.nextUrl.search;
  const targetUrl = `${BACKEND_URL}/api/${path.join('/')}${search}`;

  const hasBody = !['GET', 'HEAD'].includes(request.method);
  const body = hasBody ? await request.text() : undefined;

  try {
    const headers: Record<string, string> = {
      'Content-Type': request.headers.get('content-type') || 'application/json',
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    const backendRes = await fetch(targetUrl, {
      method: request.method,
      headers,
      body,
      cache: 'no-store',
    });

    const responseBody = await backendRes.text();
    return new NextResponse(responseBody, {
      status: backendRes.status,
      headers: {
        'Content-Type': backendRes.headers.get('content-type') || 'application/json',
      },
    });
  } catch {
    return NextResponse.json({ message: 'Backend indisponible' }, { status: 502 });
  }
}

export {
  handler as GET,
  handler as POST,
  handler as PATCH,
  handler as PUT,
  handler as DELETE,
};
