import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';

// Cadre commun aux services (consultation externe, bloc, labo) : barre du haut
// sur toute la largeur, menu blanc dessous, contenu à droite. Posé une seule
// fois : la cloche et ses notifications restent actives sur toutes les pages.
export default function EspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      <TopBar />
      <div className="flex">
        <Sidebar />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
