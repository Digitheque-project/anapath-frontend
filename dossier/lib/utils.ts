// Repris du dossier patient du Bloc (Anesthesie-Reanimation_frontend) — lecture seule
// dans l'anapath : la session et les appels passent par le relais /api/passerelle.
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Aligné sur la validation côté API hospitalisation (UUID v4 uniquement). */
export function isUuidV4(value: string | null | undefined): boolean {
  return typeof value === "string" && UUID_V4_REGEX.test(value.trim());
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
