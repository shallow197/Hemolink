import { useCallback, useEffect, useState } from 'react';
import {
  PageHeader,
  SectionHeading,
  DataTable,
  UrgenceBadge,
  ReponseBadge,
  EmptyState,
} from '../../components/ui.jsx';
import { fetchJson } from '../../api';
import { usePoll } from '../../hooks/usePoll.js';

export default function MesAlertes() {
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(null);

  const load = useCallback(async () => {
    try {
      const data = await fetchJson('/api/alertes/mes');
      setRows(data);
    } catch (e) {
      setErr(e.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);
  usePoll(load, 20000, [load]);

  async function repondre(alerteId, reponse) {
    setBusy(alerteId);
    try {
      await fetchJson(`/api/alertes/${alerteId}/repondre`, {
        method: 'POST',
        body: JSON.stringify({ reponse }),
      });
      await load();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(null);
    }
  }

  const enAttente = rows.filter((a) => a.type === 'alerte' && a.reponse === 'pas_repondu' && a.statut === 'en_cours');
  const historique = rows.filter((a) => a.type !== 'alerte' || a.reponse !== 'pas_repondu' || a.statut !== 'en_cours');

  return (
    <div className="hl-page">
      <PageHeader title="Mes alertes" subtitle="Appels au don reçus dans votre zone" />

      {err && <p className="hl-alert-error">{err}</p>}

      <section>
        <SectionHeading label="Action requise" title={`Réponses attendues (${enAttente.length})`} className="mb-5" />
        {enAttente.length === 0 ? (
          <EmptyState>Aucune alerte ne vous attend. Merci de rester disponible.</EmptyState>
        ) : (
          <div className="space-y-4">
            {enAttente.map((a) => (
              <article key={a.reponse_id} className="hl-alert-urgent">
                <div className="hl-alert-urgent-bar" />
                <div className="p-5 md:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <UrgenceBadge niveau={a.niveau_urgence} />
                      <h4 className="mt-3 font-display text-xl font-bold text-brand-navy">
                        {a.hopital_nom} — {a.groupe_sanguin}
                      </h4>
                      <p className="mt-1 text-sm text-slate-600">
                        {a.hopital_ville} · {Number(a.distance_km || 0).toFixed(1)} km
                      </p>
                      {a.message && (
                        <p className="mt-4 rounded-xl border border-slate-200/80 bg-white/80 px-4 py-3 text-sm italic text-slate-700">
                          « {a.message} »
                        </p>
                      )}
                      <p className="mt-3 text-xs text-slate-500">
                        Reçue {new Date(a.date_notification).toLocaleString('fr-FR')} ·{' '}
                        <a href={`tel:${a.hopital_tel}`} className="font-semibold text-blood hover:underline">
                          {a.hopital_tel}
                        </a>
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <button
                        type="button"
                        onClick={() => repondre(a.alerte_id, 'accepte')}
                        disabled={busy === a.alerte_id}
                        className="hl-btn-success px-6"
                      >
                        J&apos;accepte
                      </button>
                      <button
                        type="button"
                        onClick={() => repondre(a.alerte_id, 'refuse')}
                        disabled={busy === a.alerte_id}
                        className="hl-btn-danger-ghost px-6"
                      >
                        Pas cette fois
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionHeading label="Archives" title={`Notifications (${historique.length})`} className="mb-5" />
        {historique.length === 0 ? (
          <EmptyState>Aucune notification archivée.</EmptyState>
        ) : (
          <div className="space-y-4">
            {historique.map((n) => {
              if (n.type === 'don_reussi') {
                return (
                  <article key={n.id} className="hl-card hl-card-body border border-emerald-500/20 bg-emerald-50/20 p-5 md:p-6 shadow-sm flex items-start gap-4 transition-all hover:bg-emerald-50/40">
                    <span className="text-3xl">🎉</span>
                    <div>
                      <h4 className="font-display text-lg font-bold text-emerald-800">
                        Don de sang réussi !
                      </h4>
                      <p className="mt-2 text-sm text-slate-700 font-medium">
                        Votre don de <strong>{n.details.poches_prelevees} poche(s)</strong> ({n.details.type_prelevement === 'sang_total' ? 'sang total' : n.details.type_prelevement}) à l'établissement <strong>{n.details.hopital_nom}</strong> ({n.details.hopital_ville}) a été enregistré.
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Date de prélèvement : {new Date(n.date).toLocaleDateString('fr-FR')}
                      </p>
                      <p className="mt-2 text-xs font-semibold text-emerald-700">
                        Merci infiniment ! Votre geste désintéressé contribue à sauver des vies au Sénégal.
                      </p>
                    </div>
                  </article>
                );
              }
              if (n.type === 'rappel') {
                return (
                  <article key={n.id} className="hl-card hl-card-body border border-amber-500/20 bg-amber-50/30 p-5 md:p-6 shadow-sm flex items-start gap-4 transition-all hover:bg-amber-50/50">
                    <span className="text-3xl">📅</span>
                    <div>
                      <h4 className="font-display text-lg font-bold text-amber-800">
                        Rappel d'éligibilité
                      </h4>
                      <p className="mt-2 text-sm text-slate-700 font-medium">
                        Bonne nouvelle ! Le délai légal depuis votre dernier don ({n.details.derniere_date_don ? new Date(n.details.derniere_date_don).toLocaleDateString('fr-FR') : '—'}) est écoulé. Vous êtes à nouveau éligible pour donner votre sang (Groupe <strong>{n.details.groupe_sanguin}</strong>).
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Éligible depuis le : {new Date(n.date).toLocaleDateString('fr-FR')}
                      </p>
                      <p className="mt-2 text-xs font-semibold text-amber-700">
                        N'hésitez pas à vous rendre au CNTS ou dans le centre de transfusion le plus proche pour votre prochain don.
                      </p>
                    </div>
                  </article>
                );
              }
              
              // Standard alert responses ('alerte')
              const isResolved = n.statut === 'resolue';
              const isExpired = n.statut === 'expiree' || n.statut === 'annulee';
              
              let badgeColor = 'bg-slate-100 text-slate-600';
              if (isResolved) badgeColor = 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200/50';
              if (n.statut === 'en_cours') badgeColor = 'bg-amber-100 text-amber-800 ring-1 ring-amber-200/50';

              return (
                <article key={n.id} className="hl-card hl-card-body border border-slate-200 bg-white p-5 md:p-6 shadow-sm flex items-start gap-4 hover:border-slate-300 hover:bg-slate-50/50 transition-all">
                  <span className="text-3xl">🏥</span>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h4 className="font-display text-lg font-bold text-slate-800">
                        {n.hopital_nom} — Groupe {n.groupe_sanguin}
                      </h4>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center rounded-lg px-2.5 py-0.5 text-xs font-semibold uppercase ${badgeColor}`}>
                          {n.statut === 'en_cours' ? 'Active' : n.statut === 'resolue' ? 'Résolue' : n.statut === 'expiree' ? 'Expirée' : 'Annulée'}
                        </span>
                        <ReponseBadge reponse={n.reponse} />
                      </div>
                    </div>
                    
                    <p className="mt-1.5 text-xs font-semibold text-slate-500">
                      {n.hopital_ville} · {Number(n.distance_km || 0).toFixed(1)} km · Tél : <a href={`tel:${n.hopital_tel}`} className="text-blood hover:underline">{n.hopital_tel}</a>
                    </p>
                    
                    {n.message && (
                      <p className="mt-3 rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-2.5 text-xs italic text-slate-600">
                        « {n.message} »
                      </p>
                    )}
                    
                    <p className="mt-3 text-xs text-slate-400">
                      Reçue le {new Date(n.date_notification).toLocaleString('fr-FR')} 
                      {n.date_reponse && ` · Répondu le ${new Date(n.date_reponse).toLocaleString('fr-FR')}`}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
