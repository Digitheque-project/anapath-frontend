'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import NotificationBell from './NotificationBell';
import { useSearch } from './SearchContext';
import { useAuth } from './AuthProvider';
import PointServeur from "@/components/PointServeur";

function getGreeting(name: string): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return `Bonjour, ${name}`;
  if (hour >= 12 && hour < 18) return `Bon après-midi, ${name}`;
  return `Bonsoir, ${name}`;
}

const DATE_FMT = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' } as const;
const TIME_FMT = { hour: '2-digit', minute: '2-digit', second: '2-digit' } as const;

function capitalize(text: string): string {
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : text;
}

// Barre du haut commune aux services (consultation externe, bloc, labo) : logo et
// nom du service, salutation et recherche, date et heure, cloche, utilisateur.
export default function TopBar() {
  const { searchQuery, setSearchQuery } = useSearch();
  const { user, loading } = useAuth();
  const [now, setNow] = useState(() => new Date());
  const displayName = loading
    ? '…'
    : user
      ? `${user.firstname} ${user.name}`.trim()
      : 'Utilisateur';
  const initiales =
    `${user?.firstname?.charAt(0) ?? ''}${user?.name?.charAt(0) ?? ''}`.toUpperCase() || '?';

  // Horloge en direct (mise à jour chaque seconde).
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const dateLabel = capitalize(now.toLocaleDateString('fr-FR', DATE_FMT));
  const timeLabel = now.toLocaleTimeString('fr-FR', TIME_FMT);

  return (
    <header className="print:hidden sticky top-0 z-50 flex h-16 items-center justify-between gap-4 border-b border-[#F1F5F9] bg-white px-4 shadow-[0px_4px_10px_rgba(0,0,0,0.015)] sm:px-6 lg:px-7">
      <div className="flex min-w-0 items-center gap-3">
        <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full border border-[#CFE9EF] bg-white">
          <img
            src={user?.chu?.logo ? `/api/anapath/files/${encodeURIComponent(user.chu.logo)}` : '/assets/logo-chu.png'}
            alt={user?.chu?.name ? `Logo ${user.chu.name}` : 'Logo CHU'}
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/assets/logo-chu.png'; }}
            className="h-full w-full object-contain"
          />
        </div>
        <div className="truncate text-[18px] font-black tracking-tight text-[#004A66] lg:text-[20px]">
          Anatomie Pathologique
        </div>
      </div>

      <div className="hidden min-w-0 flex-1 items-center justify-center gap-4 md:flex">
        <span className="truncate text-[13px] font-semibold text-gray-500">{getGreeting(displayName)}</span>
        <div className="relative w-56 lg:w-72" title="Rechercher">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-full border border-slate-200 bg-[#F8F9FB] py-2 pl-10 pr-4 text-sm transition-all focus:ring-2 focus:ring-primary/20"
            placeholder="Rechercher (patient, ID, type…)"
            title="Rechercher"
          />
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-4">
        <div className="hidden text-right leading-tight lg:block">
          <div className="text-[12px] font-semibold text-[#006A8C]">{dateLabel}</div>
          <div className="text-xs font-bold tabular-nums text-sky-500">{timeLabel}</div>
        </div>

        <NotificationBell />

        <Link href="/profile" title="Mon profil" className="flex min-w-0 items-center gap-3">
          <div className="flex min-w-0 flex-col text-right">
            <span className="truncate text-[13px] font-extrabold leading-tight text-gray-900">
              <PointServeur />
              {displayName}
            </span>
            <span className="mt-0.5 hidden truncate text-[10px] font-bold uppercase leading-tight tracking-widest text-gray-400 sm:block">
              {user?.roleName ?? ''}
            </span>
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-[#CFE9EF] bg-[#F0F7FF] text-sm font-bold text-[#006A8C] transition-colors hover:bg-[#E0EFFA]">
            {initiales}
          </div>
        </Link>
      </div>
    </header>
  );
}
