'use client';

import { ActionsCompte } from "@/components/ActionsCompte";
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from './AuthProvider';
import { PERMISSIONS } from '@/lib/permissions';
import { isTechnicienUser, isChefRole } from '@/lib/roles';
import ConfirmDialog from './ConfirmDialog';
import FloatingModal from './FloatingModal';

const ALL_NAVIGATION = [
  {
    name: 'Tableau de bord',
    href: '/dashboard',
    icon: 'dashboard',
    requiredPermission: PERMISSIONS.READ,
    allowedForMajor: true,
  },
  {
    name: 'Nouvelles demandes',
    href: '/demandes',
    icon: 'inbox',
    requiredPermission: PERMISSIONS.UPDATE,
    allowedForMajor: false,
    // Réservé au technicien/histotechnicien (acceptation/refus des prescriptions).
    technicienOnly: true,
  },
  {
    name: 'Fil de travail',
    href: '/worklist',
    icon: 'clinical_notes',
    // Lecture seule (READ) pour suivre les prélèvements (Histotechnicien,
    // Secrétaire) ; écriture avec UPDATE ou OBSERVATION_WRITE.
    requiredPermission: [PERMISSIONS.READ, PERMISSIONS.UPDATE, PERMISSIONS.OBSERVATION_WRITE],
    allowedForMajor: false,
  },
  {
    name: 'Archives',
    href: '/archives',
    icon: 'inventory_2',
    requiredPermission: PERMISSIONS.READ,
    allowedForMajor: true,
  },
  {
    name: 'Rapports',
    href: '/reports',
    icon: 'analytics',
    requiredPermission: PERMISSIONS.REPORT_EXPORT,
    allowedForMajor: true,
  },
];

interface PersonnelContact {
  id: string;
  name: string;
  role: string;
  phone: string;
}

const PERSONNEL_CONTACTS: PersonnelContact[] = [];

export default function Sidebar() {
  const pathname = usePathname();
  const { hasPermission, isMajor, logout, user } = useAuth();
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);
  const [showContacts, setShowContacts] = useState(false);

  const visibleNavigation = ALL_NAVIGATION.filter((item) => {
    // Le major et le chef de service sont des profils de « consultation » :
    // le flag allowedForMajor exprime les pages auxquelles ils accèdent.
    const isConsultationProfile =
      isMajor || isChefRole(user?.roleName);
    // Le chef de service valide : il accède en plus au Fil de travail.
    const ouvertAuChef = item.href === '/worklist' && isChefRole(user?.roleName);
    if (isConsultationProfile && !item.allowedForMajor && !ouvertAuChef) return false;
    if ('technicienOnly' in item && item.technicienOnly && !isTechnicienUser(user)) {
      return false;
    }
    const required = Array.isArray(item.requiredPermission)
      ? item.requiredPermission
      : [item.requiredPermission];
    // Le major et le chef de service accèdent aux Rapports (consultation /
    // téléchargement du rapport hebdomadaire) même sans anapath:report:export.
    if (isConsultationProfile && item.href === '/reports') return true;
    return required.some((p) => hasPermission(p));
  });

  return (
    // Menu blanc commun aux services (consultation externe, bloc, labo), sous la
    // barre du haut — le logo et le nom du service y sont désormais.
    <aside className="print:hidden sticky top-16 mt-2 flex h-[calc(100vh-4.5rem)] w-[260px] shrink-0 flex-col overflow-y-auto rounded-tr-[24px] border-r border-[#F1F5F9] bg-white shadow-[1px_0px_5px_rgba(0,0,0,0.01)] z-40">
      <nav className="flex-1 space-y-1.5 px-4 py-5">
        {visibleNavigation.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== '/dashboard' &&
              pathname.startsWith(item.href + '/'));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-4 rounded-[12px] px-4 py-3.5 transition-colors duration-200 ${
                active
                  ? 'bg-[#F0F7FF] font-bold text-[#006A8C]'
                  : 'font-medium text-[#475569] hover:bg-gray-50'
              }`}
            >
              <span className={`material-symbols-outlined text-[20px] ${active ? 'text-[#006A8C]' : 'text-[#64748B]'}`}>
                {item.icon}
              </span>
              <span className="text-[14px]">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-4 px-5 py-6">
        <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
            Numéro flotte personnel
          </p>
          <p className="mt-0.5 text-[11px] leading-tight text-[#94A3B8]">
            Liste de contact de personnel
          </p>
          <button
            onClick={() => setShowContacts(true)}
            className="mt-2 w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#006A8C]/10 hover:bg-[#006A8C]/20 transition-colors text-[#006A8C] text-xs font-semibold"
          >
            <span className="material-symbols-outlined text-sm">groups</span>
            voir
          </button>
        </div>
        <ActionsCompte className="flex w-full items-center gap-3 px-4 text-slate-500 transition-colors hover:text-slate-900" classeLibelle="text-[13px] font-bold" />
        <button
          onClick={() => setConfirmLogoutOpen(true)}
          className="flex w-full items-center gap-3 px-4 text-[#E11D48] transition-colors hover:text-red-700"
        >
          <span className="material-symbols-outlined text-[18px]">
            logout
          </span>
          <span className="text-[13px] font-bold">Déconnexion</span>
        </button>
      </div>

      <ConfirmDialog
        open={confirmLogoutOpen}
        title="Déconnexion"
        message="Voulez-vous vraiment vous déconnecter ?"
        confirmLabel="Se déconnecter"
        danger
        onConfirm={() => {
          setConfirmLogoutOpen(false);
          logout();
        }}
        onCancel={() => setConfirmLogoutOpen(false)}
      />

      {showContacts && (
        <FloatingModal
          open
          onClose={() => setShowContacts(false)}
          icon="contacts"
          title="Liste de contact de personnel"
          maxWidthPx={512}
          heightPct={0.8}
          bodyClassName="p-4"
        >
          {PERSONNEL_CONTACTS.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">
              Aucun numéro flotte disponible pour le moment.
            </p>
          ) : (
            <ul className="space-y-2">
              {PERSONNEL_CONTACTS.map((contact) => (
                <li
                  key={contact.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{contact.name}</p>
                    <p className="text-xs text-slate-500 truncate">{contact.role}</p>
                  </div>
                  <a
                    href={`tel:${contact.phone}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#006A8C]/10 text-[#006A8C] text-xs font-bold whitespace-nowrap hover:bg-[#006A8C]/20 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">call</span>
                    {contact.phone}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </FloatingModal>
      )}
    </aside>
  );
}
