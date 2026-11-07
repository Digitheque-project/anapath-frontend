'use client'
// Repris du dossier patient du Bloc (Anesthesie-Reanimation_frontend) — lecture seule
// dans l'anapath : la session et les appels passent par le relais /api/passerelle.

import { useMemo } from 'react'
import { obtenirSessionValide } from '@/dossier/lib/auth/central-session'

export interface CurrentMedecin {
  id: string
  nom: string
  prenom: string
  email: string
}

// Équivalent de front-clinique/src/hooks/use-current-medecin.ts — dérive l'identité du
// soignant connecté depuis la session centrale (pas de second système d'auth "local" à
// gérer côté blocope-front, contrairement à front-clinique).
export function useCurrentMedecin(): CurrentMedecin | null {
  return useMemo(() => {
    if (typeof window === 'undefined') return null
    const session = obtenirSessionValide()
    if (!session) return null
    const { payload } = session
    return {
      id: payload.userId,
      nom: payload.name ?? '',
      prenom: payload.firstname ?? '',
      email: payload.email ?? '',
    }
  }, [])
}
