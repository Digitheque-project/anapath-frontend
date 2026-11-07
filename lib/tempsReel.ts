'use client';

import { useEffect, useRef } from 'react';

// Temps réel des écrans : la cloche (montée une fois dans le cadre commun)
// reçoit du serveur « anapath:maj » à chaque changement d'un examen ou d'une
// demande, et le relaie aux pages, qui rechargent leurs données sans F5.
export type MiseAJour = { type: 'examen' | 'demande' | 'notification' | 'reconnexion'; id?: string | null; statut?: string | null };

const EVENEMENT = 'anapath:maj';

export function signalerMiseAJour(info: MiseAJour): void {
  window.dispatchEvent(new CustomEvent<MiseAJour>(EVENEMENT, { detail: info }));
}

/** Appelle `recharger` après chaque changement (regroupés sur 400 ms). */
export function useMiseAJour(recharger: (info: MiseAJour) => void): void {
  const rappel = useRef(recharger);
  useEffect(() => {
    rappel.current = recharger;
  });
  useEffect(() => {
    let minuterie: ReturnType<typeof setTimeout> | undefined;
    const surMiseAJour = (e: Event) => {
      const info = (e as CustomEvent<MiseAJour>).detail;
      clearTimeout(minuterie);
      minuterie = setTimeout(() => rappel.current(info), 400);
    };
    window.addEventListener(EVENEMENT, surMiseAJour);
    return () => {
      window.removeEventListener(EVENEMENT, surMiseAJour);
      clearTimeout(minuterie);
    };
  }, []);
}
