'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';

// Cadre commun aux services (modèle : consultation externe) : barre du haut
// sur toute la largeur, menu blanc dessous, contenu à droite sur fond #F8F9FB.
// Posé une seule fois : la cloche et ses notifications restent actives sur
// toutes les pages. Sur mobile, le menu devient un tiroir (bouton dans l'en-tête).
export default function EspaceLayout({ children }: { children: React.ReactNode }) {
  const [menuOuvert, setMenuOuvert] = useState(false);
  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      <TopBar onMenuClick={() => setMenuOuvert((o) => !o)} />
      <div className="flex min-w-0">
        <Sidebar isOpen={menuOuvert} onClose={() => setMenuOuvert(false)} />
        <div className="min-w-0 flex-1 bg-[#F8F9FB]">{children}</div>
      </div>
    </div>
  );
}
