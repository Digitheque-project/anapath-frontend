// Dossier patient dans l'anapath : appels via le relais /api/passerelle (même origine),
// qui ajoute le jeton de session de l'anapath (cookie httpOnly) vers la passerelle du CHU.
const GATEWAY_URL = '/api/passerelle'

export const API_URL = `${GATEWAY_URL}/bloc/api`
export const ACCUEIL_API_URL = `${GATEWAY_URL}/accueil`
export const USER_SERVICE_API_URL = `${GATEWAY_URL}/users`
export const HOSPITALISATION_API_URL = `${GATEWAY_URL}/clinique`
export const DOSSIER_PATIENT_API_URL = `${GATEWAY_URL}/dossier-patient`
export const PRESCRIPTION_API_URL = GATEWAY_URL
export const PRISE_EN_CHARGE_API_URL = `${GATEWAY_URL}/prise-en-charge`
export const UPLOAD_API_URL = GATEWAY_URL
export const SERVICE_CHU_API_BASE_URL = `${GATEWAY_URL}/services`
export const NOTIFICATION_WS_URL = GATEWAY_URL
