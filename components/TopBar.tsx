'use client';

import { PastilleAutresServices } from "@/components/ActionsCompte";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import NotificationBell from './NotificationBell';
import { useSearch } from './SearchContext';
import { useAuth } from './AuthProvider';
import PointServeur from "@/components/PointServeur";

const DATE_FMT = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' } as const;
const TIME_FMT = { hour: '2-digit', minute: '2-digit' } as const;

function capitalize(text: string): string {
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : text;
}

type TopBarProps = {
  onMenuClick?: () => void;
};

// Barre du haut commune aux services (modèle : consultation externe) : logo du
// CHU et nom du service, salutation et recherche, cloche, utilisateur.
export default function TopBar({ onMenuClick }: TopBarProps) {
  const { searchQuery, setSearchQuery } = useSearch();
  const { user, loading } = useAuth();
  const [now, setNow] = useState(() => new Date());
  const [logoEnErreur, setLogoEnErreur] = useState(false);
  const displayName = loading
    ? '…'
    : user
      ? `${user.firstname} ${user.name}`.trim()
      : 'Utilisateur';
  const initiales =
    `${user?.firstname?.charAt(0) ?? ''}${user?.name?.charAt(0) ?? ''}`.toUpperCase() || '?';
  // Le logo du CHU vient de la session (jeton) : jamais figé en dur.
  const logo = user?.chu?.logo && !logoEnErreur
    ? `/api/anapath/files/${encodeURIComponent(user.chu.logo)}`
    : null;

  // Horloge en direct.
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const dateLabel = capitalize(now.toLocaleDateString('fr-FR', DATE_FMT));
  const timeLabel = now.toLocaleTimeString('fr-FR', TIME_FMT);

  return (
    <header className="print:hidden sticky top-0 z-50 flex items-center justify-between gap-4 border-b border-[#F1F5F9] bg-white px-4 py-2.5 shadow-[0px_4px_10px_rgba(0,0,0,0.015)] sm:px-6 sm:py-3 lg:px-7">
      {/* Gauche : menu mobile, logo du CHU, nom du service */}
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition-colors hover:border-gray-300 hover:text-gray-900 md:hidden"
          aria-label="Ouvrir la navigation"
        >
          <span className="material-symbols-outlined text-[20px]">menu</span>
        </button>
        {logo ? (
          <img
            src={logo}
            alt={user?.chu?.name ? `Logo ${user.chu.name}` : 'Logo CHU'}
            onError={() => setLogoEnErreur(true)}
            className="h-8 w-8 shrink-0 rounded-full border border-[#CFE9EF] bg-white object-cover sm:h-9 sm:w-9"
          />
        ) : null}
        <div className="truncate text-[16px] font-black tracking-tight text-[#004A66] sm:text-[18px] lg:text-[20px]">
          Anatomie pathologique
        </div>
      </div>

      {/* Centre : salutation + recherche */}
      <div className="hidden min-w-0 flex-1 items-center justify-center gap-4 md:flex">
        <span className="truncate text-[13px] font-semibold text-gray-500">
          Bonjour{user?.firstname ? ` ${user.firstname}` : ''}
        </span>
        <div className="relative w-56 lg:w-72" title="Rechercher">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[#94A3B8]">search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8F9FB] py-2 pl-10 pr-4 text-sm outline-none transition-all focus:border-[#006A8C] focus:ring-2 focus:ring-[#006A8C]/20"
            placeholder="Rechercher (patient, type…)"
            title="Rechercher"
          />
        </div>
      </div>

      {/* Droite : date, autres services, cloche, utilisateur */}
      <div className="flex shrink-0 items-center gap-4 pr-0 sm:gap-5 sm:pr-2 lg:gap-8">
        <div className="hidden text-right leading-tight xl:block">
          <div className="text-[12px] font-semibold text-[#475569]">{dateLabel}</div>
          <div className="text-[11px] font-bold tabular-nums text-[#94A3B8]">{timeLabel}</div>
        </div>

        <PastilleAutresServices />
        <NotificationBell />

        <Link href="/profile" title="Mon profil" className="flex min-w-0 items-center gap-2 sm:gap-3">
          <div className="flex min-w-0 flex-col text-right">
            <span className="max-w-[140px] truncate text-[12px] font-extrabold leading-tight text-gray-900 sm:max-w-[180px] sm:text-[12.5px] lg:max-w-none lg:text-[13px]">
              {displayName}
            </span>
            <span className="mt-0.5 hidden truncate text-[10px] font-bold uppercase leading-tight tracking-widest text-gray-400 sm:block">
              {user?.roleName ?? ''}
            </span>
          </div>
          <div className="relative h-8 w-8 shrink-0 sm:h-10 sm:w-10">
            <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full border-2 border-[#CFE9EF] bg-[#F0F7FF] text-xs font-bold text-[#006A8C] sm:text-sm">
              {initiales}
            </div>
            <PointServeur className="absolute bottom-0 right-0" style={{ marginRight: 0, width: 10, height: 10 }} />
          </div>
        </Link>
      </div>
    </header>
  );
}
