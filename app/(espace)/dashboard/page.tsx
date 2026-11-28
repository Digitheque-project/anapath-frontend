'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PrescriptionDetails from '@/components/PrescriptionDetails';
import PatientHistoriqueButton from '@/components/PatientHistoriqueButton';
import { PatientInfo } from '@/components/PatientIdentitySection';
import { useSearch } from '@/components/SearchContext';
import { useAuth } from '@/components/AuthProvider';
import { isSecretaireUser, isPathologisteUser } from '@/lib/roles';
import axios from 'axios';
import { API_BASE, getPatientForExamen } from '@/lib/api';
import { filterAndSortAnapathRequests } from '@/lib/searchAnapath';
import { formatDateTime, formatDateLong, formatRelativeTime } from '@/lib/dateFormat';
import { statusLabel, statusColors, PENDING_STATUSES, typeExamenLabel, prescripteurLabel } from '@/lib/statusLabels';
import FloatingModal from '@/components/FloatingModal';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useMiseAJour } from '@/lib/tempsReel';

interface AnapathRequest {
  id: string;
  anapathId: string;
  patientId: string;
  typeExamen: string;
  statut: string;
  createdAt: string;
  isExtemporane?: boolean;
  prelevement?: {
    site?: string;
    description?: string;
    clinicalData?: { treatmentType?: string; suspicion?: string; clinicalNotes?: string };
  } | null;
  resultat?: { conclusion?: string; details?: string } | null;
  validatedByUserId?: string | null;
  validatedByName?: string | null;
  validatedAt?: string | null;
  metadata?: Record<string, unknown> | null;
  patientInfo?: PatientInfo | null;
}

const STATUTS_TERMINES = ['VALIDE', 'ARCHIVE'];

/** Nom affichable du patient : nom complet enrichi (Accueil), sinon nom+prénom, sinon tiret. */
function patientDisplayName(req: { patientInfo?: PatientInfo | null }): string {
  const info = req.patientInfo;
  const complet = info?.nomComplet?.trim();
  if (complet) return complet;
  const assemble = [info?.nom, info?.prenom].filter(Boolean).join(' ').trim();
  return assemble || '—';
}

export default function DashboardPage() {
  const router = useRouter();
  const { searchQuery } = useSearch();
  const [requests, setRequests] = useState<AnapathRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<AnapathRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<AnapathRequest | null>(null);
  const [modalPatient, setModalPatient] = useState<PatientInfo | null>(null);
  const [modalPatientLoading, setModalPatientLoading] = useState(false);
  const { hasPermission, isMajor, user } = useAuth();
  // Même règle que la page de saisie : sinon le bouton paraissait actif et ne
  // menait nulle part (chef de service, 28/11/2026).
  const peutSaisir = isSecretaireUser(user) || isPathologisteUser(user);

  const canClickWorklist = hasPermission('anapath:update') || hasPermission('anapath:observation:write');

  useEffect(() => {
    fetchData();
  }, []);

  // Temps réel : rechargée sans écran de chargement à chaque changement.
  useMiseAJour(() => { void fetchData(true); });

  useEffect(() => {
    setFilteredRequests(filterAndSortAnapathRequests(requests, searchQuery));
  }, [searchQuery, requests]);

  useEffect(() => {
    if (!selectedRequest?.id) return;
    setModalPatientLoading(true);
    if (selectedRequest.patientInfo?.nomComplet) {
      setModalPatient(selectedRequest.patientInfo);
      setModalPatientLoading(false);
      return;
    }
    getPatientForExamen(selectedRequest.id)
      .then((p) => setModalPatient(p))
      .catch(() => setModalPatient(null))
      .finally(() => setModalPatientLoading(false));
  }, [selectedRequest?.id, selectedRequest?.patientInfo]);

  const fetchData = async (silencieux = false) => {
    try {
      if (silencieux !== true) setLoading(true);
      const response = await axios.get(`${API_BASE}/anapath`);
      setRequests(response.data);
      setFilteredRequests(response.data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalExamens = filteredRequests.length;
  const arrivesAujourdhui = filteredRequests.filter((r) => {
    const d = new Date(r.createdAt);
    const now = new Date();
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  }).length;
  const enAttenteSTAT = filteredRequests.filter((r) => PENDING_STATUSES.includes(r.statut)).length;
  const valides = filteredRequests.filter(r => r.statut === 'VALIDE').length;
  const autres = totalExamens - enAttenteSTAT - valides;

  const repartitionData = [
    { name: 'En attente', value: enAttenteSTAT, color: '#f59e0b' },
    { name: 'Validés', value: valides, color: '#10b981' },
    { name: 'Autres', value: autres, color: '#94a3b8' },
  ].filter((d) => d.value > 0);

  const getTypeLabel = (type: string) => typeExamenLabel(type);

  const handleSaisirResultat = (id: string) => {
    router.push(`/worklist/${id}`);
  };

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] bg-transparent">
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#006A8C]"></div>
        </main>
      </div>
    );
  }

  const isTerminee = (statut: string) => STATUTS_TERMINES.includes(statut);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-transparent text-[#0F172A]">
      <main className="flex-1 min-h-[calc(100vh-4rem)] flex flex-col w-full">
        <div className="flex-1 p-6 w-full">
          <div className="mb-6">
            <h2 className="text-2xl font-black text-[#004A66] tracking-tight">Tableau de bord</h2>
            <p className="text-[#64748B] text-sm mt-1">Vue d'ensemble de l'activité du laboratoire</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
            <div className="relative overflow-hidden bg-[#006A8C] p-6 rounded-2xl shadow-sm flex justify-between items-center text-white">
              <div className="relative z-10">
                <p className="text-xs font-bold uppercase tracking-wider text-white/80">Total examens</p>
                <p className="text-5xl font-extrabold mt-1">{totalExamens}</p>
                <p className="text-xs font-semibold text-white/70 mt-2 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">today</span>
                  {arrivesAujourdhui} arrivé{arrivesAujourdhui > 1 ? 's' : ''} aujourd&apos;hui
                </p>
              </div>
              <span className="material-symbols-outlined text-white/15 text-8xl absolute -right-3 -bottom-4">biotech</span>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-[0_1px_3px_rgba(15,23,42,0.04)] border border-[#F1F5F9] flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">En attente</p>
                <p className="text-3xl font-extrabold text-tertiary mt-1">{enAttenteSTAT}</p>
                {!isMajor && (
                  <Link
                    href="/worklist"
                    className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-tertiary/10 text-tertiary text-[11px] font-bold hover:bg-tertiary/20 transition-colors"
                  >
                    Traiter maintenant
                  </Link>
                )}
              </div>
              <span className="material-symbols-outlined text-tertiary bg-tertiary/10 rounded-full p-2 text-xl">schedule</span>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-[0_1px_3px_rgba(15,23,42,0.04)] border border-[#F1F5F9] flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Validés</p>
                <p className="text-3xl font-extrabold text-primary mt-1">{valides}</p>
                {isMajor ? (
                  <Link
                    href="/reports"
                    className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-bold hover:bg-primary/20 transition-colors"
                  >
                    Voir le rapport
                  </Link>
                ) : (
                  <Link
                    href="/archives"
                    className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-bold hover:bg-primary/20 transition-colors"
                  >
                    Consulter
                  </Link>
                )}
              </div>
              <span className="material-symbols-outlined text-primary bg-primary/10 rounded-full p-2 text-xl">verified</span>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-[0_1px_3px_rgba(15,23,42,0.04)] overflow-hidden border border-[#F1F5F9]">
              <div className="p-5 border-b border-[#F1F5F9] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary bg-primary/10 rounded-full p-1.5 text-lg">history</span>
                  <h3 className="font-bold text-lg text-[#0F172A]">Dernières demandes</h3>
                </div>
                {canClickWorklist && (
                  <Link href="/worklist" className="text-xs font-bold text-primary hover:underline">
                    Voir le fil de travail
                  </Link>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[#F8FAFC] text-[11px] font-bold text-[#64748B] uppercase tracking-wider border-b border-[#F1F5F9]">
                    <tr><th className="px-4 py-3 text-left">Patient</th><th className="px-4 py-3 text-left">Type examen</th><th className="px-4 py-3 text-left">Statut</th><th className="px-4 py-3 text-left">Date</th></tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9]">
                    {filteredRequests.filter((r) => !isTerminee(r.statut)).slice(0, 10).map((req) => (
                      <tr
                        key={req.id}
                        className={`transition-colors ${
                          canClickWorklist
                            ? 'hover:bg-[#006A8C]/5 cursor-pointer'
                            : 'cursor-default'
                        } ${req.isExtemporane && !isTerminee(req.statut) ? 'bg-red-50' : ''}`}
                        onClick={() => {
                          if (canClickWorklist) setSelectedRequest(req);
                        }}
                      >
                        <td className="px-4 py-3.5 font-medium">{patientDisplayName(req)}</td>
                        <td className="px-4 py-3.5">
                          <span className="px-2 py-0.5 rounded-full bg-[#F0F7FF] text-[#006A8C] text-[10px] font-bold inline-flex items-center gap-1">
                            {getTypeLabel(req.typeExamen)}
                            {req.isExtemporane && !isTerminee(req.statut) && (
                              <span className="px-1 py-px rounded-full bg-red-600 text-white text-[7px] leading-normal font-bold stat-pulse">TRES URGENT</span>
                            )}
                          </span>
                          {prescripteurLabel(req.metadata) && (
                            <span className="block mt-1 text-[10px] font-semibold text-slate-500">{prescripteurLabel(req.metadata)}</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5"><span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${statusColors[req.statut] || 'bg-gray-100 text-gray-700'}`}>{statusLabel(req.statut)}</span></td>
                        <td className="px-4 py-3.5 text-slate-500 text-xs">
                          <div>{formatDateTime(req.createdAt)}</div>
                          <div className="text-[10px] text-slate-400">{formatRelativeTime(req.createdAt)}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(15,23,42,0.04)] border border-[#F1F5F9] p-5">
              <h3 className="font-bold text-lg text-[#0F172A] mb-1">Répartition des examens</h3>
              <p className="text-xs text-slate-400 mb-2">Par statut, sur {totalExamens} examen(s)</p>
              {repartitionData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={repartitionData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={2}
                      >
                        {repartitionData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-2 space-y-2">
                    {repartitionData.map((entry) => {
                      const percentage = totalExamens > 0 ? Math.round((entry.value / totalExamens) * 100) : 0;
                      return (
                        <div key={entry.name} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }}></span>
                            <span className="text-slate-600">{entry.name}</span>
                          </div>
                          <span className="font-bold text-[#0F172A]">{entry.value} <span className="text-slate-400 font-normal">({percentage}%)</span></span>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <p className="text-sm text-slate-400 text-center py-12">Aucune donnée disponible</p>
              )}
            </div>
          </div>
        </div>
      </main>

      {selectedRequest && (
        <FloatingModal
          open
          onClose={() => setSelectedRequest(null)}
          icon="description"
          title={isTerminee(selectedRequest.statut) ? "Détails de l'examen" : 'Détail de la prescription'}
        >
          <PrescriptionDetails
            request={selectedRequest}
            patient={modalPatient}
            patientLoading={modalPatientLoading}
            historiqueButton={
              <PatientHistoriqueButton
                entries={requests.filter((r) => r.patientId === selectedRequest.patientId && r.id !== selectedRequest.id)}
              />
            }
          />

              {isTerminee(selectedRequest.statut) ? (
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 mt-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="material-symbols-outlined text-emerald-700">verified</span>
                    <h4 className="font-bold text-emerald-800">Résultat d'examen</h4>
                  </div>
                  <div className="mb-3">
                    <p className="text-xs text-slate-500">Conclusion</p>
                    <p className="font-medium text-on-surface">{selectedRequest.resultat?.conclusion || '—'}</p>
                  </div>
                  <div className="mb-3">
                    <p className="text-xs text-slate-500">Détails</p>
                    <p className="font-medium text-on-surface whitespace-pre-wrap">{selectedRequest.resultat?.details || '—'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-500">Validé par</p>
                       <p className="font-medium text-on-surface">{selectedRequest.validatedByName || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Date de validation</p>
                      <p className="font-medium text-on-surface">
                        {selectedRequest.validatedAt ? formatDateLong(selectedRequest.validatedAt) : '—'}
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-center mt-4">
                    <Link
                      href={`/archives/${selectedRequest.id}`}
                      className="px-6 py-2.5 bg-[#006A8C] hover:bg-[#005a76] text-white font-bold rounded-xl shadow-sm hover:opacity-90 transition-colors flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-base">description</span>
                      Voir le compte-rendu complet
                    </Link>
                  </div>
                </div>
              ) : (
                canClickWorklist ? (
                  <div className="flex justify-center mt-6">
                    <div className="flex flex-col items-center gap-1.5">
                      <button
                        onClick={() => handleSaisirResultat(selectedRequest.id)}
                        disabled={!peutSaisir}
                        title={peutSaisir ? undefined : 'Réservé au secrétariat et au pathologiste'}
                        className="px-8 py-3 bg-[#006A8C] text-white font-bold rounded-xl shadow-sm hover:bg-[#005a76] transition-colors flex items-center gap-2 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none"
                      >
                        <span className="material-symbols-outlined">{peutSaisir ? 'edit_note' : 'lock'}</span>
                        Saisir le résultat d&apos;examen
                      </button>
                      {!peutSaisir && (
                        <p className="text-xs text-slate-500">Réservé au secrétariat et au pathologiste : vous êtes en consultation seule.</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-center mt-6">
                    <p className="text-xs text-slate-400">
                      Consultation en lecture seule
                    </p>
                  </div>
                )
               )}
        </FloatingModal>
      )}
    </div>
  );
}
