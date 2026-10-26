import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME } from '@/lib/authCookie';
import { decodeJwtPayload } from '@/lib/jwt';
import { isTechnicienRole, isMajorRole, isChefRole } from '@/lib/roles';
import { estServiceAnapath } from '@/lib/anapathService';
import { publicUrl } from '@/lib/publicUrl';

const LOGIN_URL = process.env.NEXT_PUBLIC_LOGIN_URL || '';


const PROTECTED_ROUTES: Array<{
  path: string;
  // Une seule permission requise, ou une liste dont une seule suffit (ex. le
  // fil de travail : lecture seule pour Histotechnicien/Secrétaire avec juste
  // anapath:read, écriture pour anapath:update / anapath:observation:write).
  permission: string | string[];
  blockedForMajor?: boolean;
  // Réservé au technicien/histotechnicien (acceptation/refus des prescriptions).
  technicienOnly?: boolean;
}> = [
  { path: '/dashboard',  permission: 'anapath:read',         blockedForMajor: false },
  { path: '/demandes',   permission: 'anapath:update',       blockedForMajor: true, technicienOnly: true },
  { path: '/worklist',   permission: ['anapath:read', 'anapath:update', 'anapath:observation:write'], blockedForMajor: true },
  // Consultable par tout le monde (seuil minimal : anapath:read), y compris le major.
  { path: '/archives',   permission: 'anapath:read', blockedForMajor: false },
  { path: '/reports',    permission: 'anapath:report:export', blockedForMajor: false },
];

function isMajorService(permissions: string[]): boolean {
  // La secrétaire (observation:write sans validate) n'est pas « major »
  // même si elle a report:export — elle doit accéder au fil de travail.
  if (permissions.includes('anapath:observation:write')) return false;
  return (
    permissions.includes('anapath:report:export') &&
    !permissions.includes('anapath:update')
  );
}

export function middleware(request: NextRequest) {
  // Le portail d'authentification redirige vers la racine du front avec
  // ?accessToken=...&serviceId=... (son baseUrl configuré = la racine, pas
  // /auth/sso). On route ce token vers /auth/sso — exclu du middleware — qui
  // valide le jeton et pose le cookie de session. Sans ça : boucle de login.
  const incomingToken = request.nextUrl.searchParams.get('accessToken');
  if (incomingToken) {
    const ssoUrl = publicUrl(request, '/auth/sso');
    ssoUrl.search = request.nextUrl.search;
    return NextResponse.redirect(ssoUrl);
  }

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.redirect(LOGIN_URL);
  }

  const payload = decodeJwtPayload(token);

  if (
    !payload ||
    (payload.exp && payload.exp * 1000 < Date.now())
  ) {
    const res = NextResponse.redirect(LOGIN_URL);
    res.cookies.delete(AUTH_COOKIE_NAME);
    return res;
  }

  const entry = payload?.services?.find(estServiceAnapath);
  const userPermissions: string[] = entry?.permissions ?? [];
  // Profil « consultation » (major ou chef de service) : il ne traite ni les
  // nouvelles demandes ni le fil de travail, mais consulte archives et rapports.
  const isConsultationProfile =
    isMajorRole(entry?.roleName) ||
    isChefRole(entry?.roleName) ||
    isMajorService(userPermissions);
  const major = isMajorRole(entry?.roleName) || isChefRole(entry?.roleName);
  const technicien = isTechnicienRole(entry?.roleName, userPermissions);

  const pathname = request.nextUrl.pathname;

  for (const route of PROTECTED_ROUTES) {
    if (pathname.startsWith(route.path)) {
      if (isConsultationProfile && route.blockedForMajor) {
        return NextResponse.redirect(
          publicUrl(request, '/dashboard'),
        );
      }
      if (route.technicienOnly && !technicien) {
        // Les nouvelles demandes (acceptation/refus des prescriptions) sont
        // réservées au technicien/histotechnicien : un pathologiste ne peut
        // pas les traiter et n'a pas à les voir.
        return NextResponse.redirect(
          publicUrl(request, '/worklist'),
        );
      }
      const requiredPermissions = Array.isArray(route.permission)
        ? route.permission
        : [route.permission];
      // Le major et le chef de service accèdent aux Rapports (consulter /
      // télécharger le rapport hebdomadaire) même sans anapath:report:export.
      if (major && pathname.startsWith('/reports')) {
        break;
      }
      if (!requiredPermissions.some((p) => userPermissions.includes(p))) {
        return NextResponse.redirect(
          publicUrl(request, '/dashboard'),
        );
      }
      break;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Exclus aussi docs/docs-json + les chemins « bruts » du contrat résultats
    // (rewrites next.config.ts vers le backend) : ils doivent rester publics
    // pour l'agrégateur dossier-patient et les vérificateurs d'écosystème.
    '/((?!auth/sso|api|_next/static|_next/image|favicon.ico|assets|docs|docs-json|anapath/resultats|resultats/patient).*)',
  ],
};
