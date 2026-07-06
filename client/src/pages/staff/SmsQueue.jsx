// =====================================================================
// SmsQueue.jsx — File d'attente SMS (simulation Sonatel/Orange)
// =====================================================================
// Affiche pour le CNTS tous les SMS générés par les alertes, avec leur
// statut (en_file / envoyé / échec). Permet de simuler l'envoi (batch
// ou individuel) en attendant l'intégration réelle de l'API Sonatel.
// =====================================================================

import { useCallback, useEffect, useState } from 'react';
import { fetchJson } from '../../api';
import { usePoll } from '../../hooks/usePoll.js';

export default function SmsQueue() {
  const [data, setData] = useState({ items: [], stats: null });
  const [filtre, setFiltre] = useState('en_file');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);

  const load = useCallback(async () => {
    try {
      const q = filtre ? `?statut=${filtre}` : '';
      const d = await fetchJson(`/api/sms/queue${q}`);
      setData(d);
    } catch (e) {
      setErr(e.message);
    }
  }, [filtre]);

  useEffect(() => { load(); }, [load]);
  usePoll(load, 15000, [load]);

  async function envoyerTout() {
    if (!confirm('Simuler l\'envoi de tous les SMS en file d\'attente ?')) return;
    setBusy(true); setErr(null); setMsg(null);
    try {
      const r = await fetchJson('/api/sms/envoyer-tout', { method: 'POST' });
      setMsg(`✓ ${r.envoyes} SMS marqués comme envoyés (via l'API Sonatel simulée).`);
      await load();
    } catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  }

  async function envoyerUn(id) {
    setBusy(true); setErr(null);
    try {
      await fetchJson(`/api/sms/${id}/envoyer`, { method: 'POST' });
      await load();
    } catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  }

  const s = data.stats || { en_file: 0, envoye: 0, echec: 0, total: 0 };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">File d'attente SMS</h2>
          <p className="text-sm text-gray-500">
            Canal secondaire pour les donneurs sans app — <strong>API Sonatel / Orange Sénégal</strong>.
            <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700">
              Mode démonstration
            </span>
          </p>
        </div>
        {s.en_file > 0 && (
          <button
            onClick={envoyerTout}
            disabled={busy}
            className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
          >
            📡 Envoyer tous ({s.en_file})
          </button>
        )}
      </div>

      {err && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{err}</div>}
      {msg && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{msg}</div>}

      <div className="grid gap-4 sm:grid-cols-4">
        <Stat label="En file d'attente"    value={s.en_file}    color="amber" active={filtre === 'en_file'} onClick={() => setFiltre('en_file')} />
        <Stat label="Envoyés"              value={s.envoye}     color="emerald" active={filtre === 'envoye'} onClick={() => setFiltre('envoye')} />
        <Stat label="En échec"             value={s.echec}      color="red" active={filtre === 'echec'} onClick={() => setFiltre('echec')} />
        <Stat label="Total SMS générés"    value={s.total}      color="slate" active={filtre === ''} onClick={() => setFiltre('')} />
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {data.items.length === 0 ? (
          <p className="p-8 text-center text-sm text-gray-400">Aucun SMS dans cette file.</p>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-gray-100 bg-slate-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Destinataire</th>
                <th className="px-4 py-3">Téléphone</th>
                <th className="px-4 py-3">Message (SMS 160 caractères)</th>
                <th className="px-4 py-3">Opérateur</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.items.map((it) => (
                <tr key={it.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {it.prenom} {it.donneur_nom}
                    <div className="text-[10px] uppercase text-gray-400">{it.hopital_nom} · {it.groupe_sanguin}</div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{it.telephone}</td>
                  <td className="px-4 py-3 text-xs text-gray-700 italic max-w-md">{it.message}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-md bg-orange-100 px-2 py-0.5 text-[10px] font-bold uppercase text-orange-700">
                      {it.operateur}
                    </span>
                  </td>
                  <td className="px-4 py-3"><StatutSms s={it.statut} /></td>
                  <td className="px-4 py-3">
                    {it.statut === 'en_file' && (
                      <button
                        onClick={() => envoyerUn(it.id)}
                        disabled={busy}
                        className="rounded-md bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                      >
                        📡 Envoyer
                      </button>
                    )}
                    {it.statut === 'envoye' && (
                      <span className="text-xs text-gray-400">
                        {it.date_envoi && new Date(it.date_envoi).toLocaleString('fr-FR')}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-800">
        <strong>ℹ️ Note technique :</strong> en production, un worker consomme cette file et appelle
        l'API HTTP de Sonatel/Orange Sénégal pour l'envoi effectif (coût ~15 FCFA/SMS). Le mode
        démonstration permet au jury de voir la génération et le contenu de chaque SMS.
      </div>
    </div>
  );
}

function Stat({ label, value, color, active, onClick }) {
  const map = {
    amber:   { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700' },
    emerald: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700' },
    red:     { bg: 'bg-red-50 border-red-200', text: 'text-red-700' },
    slate:   { bg: 'bg-slate-50 border-slate-200', text: 'text-slate-700' },
  }[color];
  return (
    <button
      onClick={onClick}
      className={`rounded-2xl border-2 p-4 text-left transition-all ${active ? `${map.bg} ring-2 ring-offset-2` : 'border-gray-100 bg-white hover:bg-slate-50'}`}
    >
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${map.text}`}>{value}</p>
    </button>
  );
}

function StatutSms({ s }) {
  const map = {
    en_file: { c: 'bg-amber-100 text-amber-700', l: '⏳ En file' },
    envoye:  { c: 'bg-emerald-100 text-emerald-700', l: '✓ Envoyé' },
    echec:   { c: 'bg-red-100 text-red-700', l: '✗ Échec' },
    annule:  { c: 'bg-gray-100 text-gray-600', l: 'Annulé' },
  };
  const v = map[s] || map.en_file;
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${v.c}`}>{v.l}</span>;
}
