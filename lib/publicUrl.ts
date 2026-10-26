import type { NextRequest } from 'next/server';

// Derrière le proxy de l'hébergeur (Render), request.url pointe vers l'adresse
// interne (localhost:10000) : une redirection construite dessus est injoignable
// depuis le navigateur. On reconstruit l'origine publique depuis les en-têtes
// du proxy ; APP_BASE_URL, s'il est défini, reste prioritaire.
export function publicUrl(request: NextRequest, path: string): URL {
  if (process.env.APP_BASE_URL) return new URL(path, process.env.APP_BASE_URL);
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  if (!host) return new URL(path, request.url);
  const proto =
    request.headers.get('x-forwarded-proto')?.split(',')[0].trim() ??
    request.nextUrl.protocol.replace(':', '');
  return new URL(path, `${proto}://${host}`);
}
