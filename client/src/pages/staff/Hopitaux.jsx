import { useCallback, useEffect, useState } from 'react';
import { fetchJson } from '../../api';
import { usePoll } from '../../hooks/usePoll.js';
import { useAuth } from '../../contexts/AuthContext.jsx';

const GROUPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function Hopitaux() {
  const { user } = useAuth();
  const [list, setList] = useState([]);
  const [modal, setModal] = useState(null);
  const [stockModal, setStockModal] = useState(null);
  const [form, setForm] = useState({
    groupe_sanguin: 'O+', niveau_urgence: 'urgent', message: '',
    rayon_km: 25, poches_necessaires: 1,
  });
  const [stockForm, setStockForm] = useState({ quantite_poches: 0, seuil_critique: 5 });

  const load = useCallback(async () => {
    const data = await fetchJson('/api/hopitaux');
    setList(data);
  }, []);

  useEffect(() => { load().catch(() => {}); }, [load]);
  usePoll(load, 30000, [load]);

  function canEdit(h) {
    return user?.role === 'cnts' || user?.role === 'admin' ||
      (user?.role === 'hopital' && user?.hopital_id === h.id);
  }

  async function submitAlerte(e) {
    e.preventDefault();
    if (!modal) return;
    await fetchJson('/api/hopitaux/alerte', {
      method: 'POST',
      body: JSON.stringify({
        hopital_id: modal.id,
        groupe_sanguin: form.groupe_sanguin,
        niveau_urgence: form.niveau_urgence,
        message: form.message,
        rayon_km: Number(form.rayon_km),
        poches_necessaires: Number(form.poches_necessaires),
      }),
    });
    setModal(null);
    await load();
  }

  async function submitStock(e) {
    e.preventDefault();
    if (!stockModal) return;
    await fetchJson(`/api/hopitaux/${stockModal.hopital.id}/stocks/${stockModal.groupe}`, {
      method: 'PUT',
      body: JSON.stringify({
        groupe_sanguin: stockModal.groupe,
        quantite_poches: Number(stockForm.quantite_poches),
        seuil_critique: Number(stockForm.seuil_critique),
      }),
    });
    setStockModal(null);
    await load();
  }

  const sorted = user?.role === 'hopital'
    ? [...list].sort((a, b) => (a.id === user.hopital_id ? -1 : b.id === user.hopital_id ? 1 : 0))
    : list;

  return (
    <div className="hl-page">
      <div>
        <h1 className="hl-page-title">Hôpitaux & stocks</h1>
        <p className="hl-page-subtitle">Gestion des stocks par groupe sanguin et lancement d&apos;alertes</p>
      </div>

      <div className="space-y-4">
        {sorted.map((h) => {
          const isMine = user?.role === 'hopital' && user.hopital_id === h.id;
          return (
            <article key={h.id} className={`hl-hopital-card hl-card-body ${isMine ? 'hl-hopital-card-mine' : ''}`}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold text-gray-900">{h.nom}</h3>
                    {isMine && <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold uppercase text-blood">Mon hôpital</span>}
                    {h.type === 'cnts' && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700">CNTS</span>}
                  </div>
                  <p className="text-sm text-gray-500">{h.ville}{h.region_nom && ` · ${h.region_nom}`} · {h.telephone}</p>
                </div>
                {canEdit(h) && (
                  <button
                    type="button"
                    onClick={() => {
                      setForm({ groupe_sanguin: 'O+', niveau_urgence: 'urgent', message: '', rayon_km: 25, poches_necessaires: 1 });
                      setModal(h);
                    }}
                    className="hl-btn-primary"
                  >
                    Lancer une alerte
                  </button>
                )}
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {h.stocks?.map((s) => (
                  <StockGauge
                    key={s.groupe_sanguin}
                    stock={s}
                    onEdit={canEdit(h) ? () => {
                      setStockForm({ quantite_poches: s.quantite_poches, seuil_critique: s.seuil_critique });
                      setStockModal({ hopital: h, groupe: s.groupe_sanguin });
                    } : null}
                  />
                ))}
              </div>
            </article>
          );
        })}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900">Alerte — {modal.nom}</h3>
            <form className="mt-4 space-y-3" onSubmit={submitAlerte}>
              <Select label="Groupe sanguin recherché" value={form.groupe_sanguin} onChange={(v) => setForm({ ...form, groupe_sanguin: v })} options={GROUPES} />
              <Select label="Niveau d'urgence" value={form.niveau_urgence} onChange={(v) => setForm({ ...form, niveau_urgence: v })}
                options={[{v:'critique',l:'Critique (vital immédiat)'},{v:'urgent',l:'Urgent (24h)'},{v:'normal',l:'Normal (planifié)'}]} />
              <label className="block text-sm font-medium text-gray-700">
                Message
                <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={3}
                  placeholder="Ex : Patient en césarienne d'urgence, besoin immédiat."
                  className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blood focus:ring-2 focus:ring-blood/10" />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <Select label="Rayon de recherche" value={form.rayon_km} onChange={(v) => setForm({ ...form, rayon_km: v })}
                  options={[{v:10,l:'10 km'},{v:25,l:'25 km'},{v:50,l:'50 km'},{v:100,l:'100 km'},{v:9999,l:'Tout le Sénégal'}]} />
                <label className="block text-sm font-medium text-gray-700">
                  Poches nécessaires
                  <input type="number" min="1" value={form.poches_necessaires} onChange={(e) => setForm({ ...form, poches_necessaires: e.target.value })}
                    className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900" />
                </label>
              </div>
              <p className="text-xs text-gray-500">
                Les donneurs compatibles dans le rayon recevront une notification dans leur espace HemoLink.
                L'alerte se résout automatiquement quand le nombre d'acceptations atteint la cible.
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setModal(null)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Annuler</button>
                <button type="submit" className="rounded-lg bg-blood px-4 py-2 text-sm font-semibold text-white hover:bg-blood-dark">Déclencher l'alerte</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {stockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-gray-100 bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900">Stock {stockModal.groupe} — {stockModal.hopital.nom}</h3>
            <form className="mt-4 space-y-3" onSubmit={submitStock}>
              <label className="block text-sm font-medium text-gray-700">
                Poches en stock
                <input type="number" min="0" value={stockForm.quantite_poches} onChange={(e) => setStockForm({ ...stockForm, quantite_poches: e.target.value })}
                  className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900" />
              </label>
              <label className="block text-sm font-medium text-gray-700">
                Seuil critique (déclenche les alertes)
                <input type="number" min="0" value={stockForm.seuil_critique} onChange={(e) => setStockForm({ ...stockForm, seuil_critique: e.target.value })}
                  className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900" />
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setStockModal(null)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Annuler</button>
                <button type="submit" className="rounded-lg bg-blood px-4 py-2 text-sm font-semibold text-white hover:bg-blood-dark">Mettre à jour</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  const items = options.map((o) => (typeof o === 'string' ? { v: o, l: o } : o));
  return (
    <label className="block text-sm font-medium text-gray-700">
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)} className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blood focus:ring-2 focus:ring-blood/10">
        {items.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </label>
  );
}

function StockGauge({ stock, onEdit }) {
  const max = Math.max(stock.seuil_critique * 4, stock.quantite_poches, 1);
  const pct = Math.min(100, (stock.quantite_poches / max) * 100);
  const crit = stock.quantite_poches < stock.seuil_critique;
  const bar = crit ? 'bg-red-500' : stock.quantite_poches < stock.seuil_critique * 2 ? 'bg-amber-400' : 'bg-emerald-500';
  return (
    <div className="rounded-xl border border-gray-100 bg-slate-50 p-3">
      <div className="flex items-center justify-between text-xs">
        <span className={`font-bold ${stock.groupe_sanguin?.endsWith('-') ? 'text-blood' : 'text-gray-800'}`}>{stock.groupe_sanguin}</span>
        <span className={crit ? 'font-semibold text-red-600' : 'text-gray-500'}>{stock.quantite_poches} poches</span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200">
        <div className={`h-full transition-all ${bar}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-1 flex items-center justify-between">
        <p className="text-[10px] text-gray-400">Seuil : {stock.seuil_critique}</p>
        {onEdit && (
          <button onClick={onEdit} className="text-[10px] font-medium text-blood hover:underline">Modifier</button>
        )}
      </div>
    </div>
  );
}
