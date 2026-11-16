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

type SidebarProps = {
  isOpen?: boolean;
  onClose?: () => void;
};

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
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
    <>
      {isOpen ? (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px] md:hidden print:hidden"
          onClick={onClose}
          aria-hidden
        />
      ) : null}
    {/* Menu blanc commun aux services (modèle : consultation externe), sous la
        barre du haut ; tiroir sur mobile. */}
    <aside
      className={`print:hidden z-50 flex shrink-0 flex-col overflow-y-auto border-r border-[#F1F5F9] bg-white shadow-[1px_0px_5px_rgba(0,0,0,0.01)] transition-transform duration-200 fixed inset-y-0 left-0 w-[82vw] max-w-[280px] md:sticky md:top-[73px] md:bottom-auto md:mt-2 md:h-[calc(100vh-73px)] md:w-[220px] md:max-w-none md:translate-x-0 md:rounded-tr-[24px] lg:w-[260px] ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="flex items-center justify-between px-4 pb-2 pt-4 md:hidden">
        <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-gray-400">
          Navigation
        </span>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-gray-500 transition-colors hover:border-gray-300 hover:text-gray-900"
          aria-label="Fermer la navigation"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>
      <nav className="flex-1 space-y-1.5 px-4 py-4 sm:py-5">
        {visibleNavigation.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== '/dashboard' &&
              pathname.startsWith(item.href + '/'));
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 rounded-[12px] px-4 py-3 transition-colors duration-200 sm:gap-4 sm:py-3.5 ${
                active
                  ? 'bg-[#F0F7FF] font-bold text-[#006A8C]'
                  : 'font-medium text-[#475569] hover:bg-gray-50'
              }`}
            >
              <span className={`material-symbols-outlined shrink-0 text-[20px] ${active ? 'text-[#006A8C]' : 'text-[#64748B]'}`}>
                {item.icon}
              </span>
              <span className="text-[13px] sm:text-[14px]">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-4 pb-5 sm:px-5">
        <div className="relative overflow-hidden rounded-[20px] bg-[#F5F8FA] p-4 sm:rounded-[24px] sm:p-5">
          <p className="mb-2 text-[9px] font-extrabold uppercase tracking-[0.1em] text-[#006A8C] sm:text-[10px]">
            Numéro flotte personnel
          </p>
          <p className="mb-4 text-[12px] font-bold leading-snug text-gray-900 sm:text-[13px]">
            Liste des contacts du personnel
          </p>
          <button
            type="button"
            onClick={() => setShowContacts(true)}
            className="w-full rounded-xl bg-[#006A8C] py-2 text-[11px] font-bold text-white transition-colors hover:bg-[#005a76] sm:py-2.5 sm:text-[12px]"
          >
            voir
          </button>
        </div>
      </div>

      <div className="space-y-5 px-4 py-5 sm:px-5 sm:py-6">
        <Link
          href="/profile"
          onClick={onClose}
          className="flex w-full items-center gap-3 px-4 text-gray-500 transition-colors hover:text-gray-900"
        >
          <span className="material-symbols-outlined text-[18px]">settings</span>
          <span className="text-[12px] font-bold sm:text-[13px]">Paramètres</span>
        </Link>
        <ActionsCompte className="flex w-full items-center gap-3 px-4 text-slate-500 transition-colors hover:text-slate-900" classeLibelle="text-[12px] sm:text-[13px] font-bold" />
        <button
          type="button"
          onClick={() => setConfirmLogoutOpen(true)}
          className="flex w-full items-center gap-3 px-4 text-[#E11D48] transition-colors hover:text-red-700"
        >
          <span className="material-symbols-outlined text-[18px]">
            logout
          </span>
          <span className="text-[12px] font-bold sm:text-[13px]">Déconnexion</span>
        </button>
      </div>

    </aside>
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
                  className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[#F8FAFC] border border-[#F1F5F9]"
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
    </>
  );
}
