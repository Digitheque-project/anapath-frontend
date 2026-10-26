// Accès Anapath reconnu par le NOM du service dans le jeton (« Anatomie
// pathologique (Anapath) »), sans identifiant écrit en dur : chaque CHU a son
// propre identifiant de service. AUTH_ANAPATH_SERVICE_ID reste accepté s'il est fourni.
const ANAPATH_SERVICE_ID = process.env.AUTH_ANAPATH_SERVICE_ID || '';

export function estServiceAnapath(s: { serviceId?: string; serviceName?: string }): boolean {
  return (
    (!!ANAPATH_SERVICE_ID && s.serviceId === ANAPATH_SERVICE_ID) ||
    (s.serviceName ?? '').toLowerCase().includes('anapath')
  );
}
