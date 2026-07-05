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

  // Si staff hôpital, on focalise sur son hôpital en haut
  const sorted = user?.role === 'hopital'
    ? [...list].sort((a, b) => (a.id === user.hopital_id ? -1 : b.id === user.hopital_id ? 1 : 0))
    : list;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-50">Hôpitaux & stocks</h2>
        <p className="text-sm text-zinc-400">Gestion des stocks par groupe sanguin et lancement d'alertes</p>
      </div>

      <div className="space-y-6">
        {sorted.map((h) => {
          const isMine = user?.role === 'hopital' && user.hopital_id === h.id;
          return (
            <article key={h.id} className={`rounded-2xl border bg-zinc-900 p-5 shadow-lg shadow-black/20 ${isMine ? 'border-red-700' : 'border-zinc-800'}`}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-zinc-50">{h.nom}</h3>
                    {isMine && <span className="rounded-full bg-red-950/50 px-2 py-0.5 text-[10px] font-bold uppercase text-red-300">Mon hôpital</span>}
                    {h.type === 'cnts' && <span className="rounded-full bg-emerald-950/50 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-300">CNTS</span>}
                  </div>
                  <p className="text-sm text-zinc-400">{h.ville}{h.region_nom && ` · ${h.region_nom}`} · {h.telephone}</p>
                </div>
                {canEdit(h) && (
                  <button
                    type="button"
                    onClick={() => {
                      setForm({ groupe_sanguin: 'O+', niveau_urgence: 'urgent', message: '', rayon_km: 25, poches_necessaires: 1 });
                      setModal(h);
                    }}
                    className="rounded-xl bg-blood px-4 py-2 text-sm font-semibold text-white shadow-md shadow-blood/25 hover:bg-blood-dark"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl shadow-black/60">
            <h3 className="text-lg font-bold text-zinc-50">Alerte — {modal.nom}</h3>
            <form className="mt-4 space-y-3" onSubmit={submitAlerte}>
              <Select label="Groupe sanguin recherché" value={form.groupe_sanguin} onChange={(v) => setForm({ ...form, groupe_sanguin: v })} options={GROUPES} />
              <Select label="Niveau d'urgence" value={form.niveau_urgence} onChange={(v) => setForm({ ...form, niveau_urgence: v })}
                options={[{v:'critique',l:'Critique (vital immédiat)'},{v:'urgent',l:'Urgent (24h)'},{v:'normal',l:'Normal (planifié)'}]} />
              <label className="block text-xs font-medium text-zinc-400">
                Message
                <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={3}
                  placeholder="Ex : Patient en césarienne d'urgence, besoin immédiat."
                  className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-red-800 focus:ring-2 focus:ring-red-900/40" />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <Select label="Rayon de recherche" value={form.rayon_km} onChange={(v) => setForm({ ...form, rayon_km: v })}
                  options={[{v:10,l:'10 km'},{v:25,l:'25 km'},{v:50,l:'50 km'},{v:100,l:'100 km'},{v:9999,l:'Tout le Sénégal'}]} />
                <label className="block text-xs font-medium text-zinc-400">
                  Poches nécessaires
                  <input type="number" min="1" value={form.poches_necessaires} onChange={(e) => setForm({ ...form, poches_necessaires: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100" />
                </label>
              </div>
              <p className="text-xs text-zinc-500">
                Les donneurs compatibles dans le rayon recevront une notification dans leur espace HemoLink.
                L'alerte se résout automatiquement quand le nombre d'acceptations atteint la cible.
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setModal(null)} className="rounded-lg border border-zinc-600 bg-zinc-800 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-700">Annuler</button>
                <button type="submit" className="rounded-lg bg-blood px-4 py-2 text-sm font-semibold text-white hover:bg-blood-dark">Déclencher l'alerte</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {stockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl shadow-black/60">
            <h3 className="text-lg font-bold text-zinc-50">Stock {stockModal.groupe} — {stockModal.hopital.nom}</h3>
            <form className="mt-4 space-y-3" onSubmit={submitStock}>
              <label className="block text-xs font-medium text-zinc-400">
                Poches en stock
                <input type="number" min="0" value={stockForm.quantite_poches} onChange={(e) => setStockForm({ ...stockForm, quantite_poches: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100" />
              </label>
              <label className="block text-xs font-medium text-zinc-400">
                Seuil critique (déclenche les alertes)
                <input type="number" min="0" value={stockForm.seuil_critique} onChange={(e) => setStockForm({ ...stockForm, seuil_critique: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100" />
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setStockModal(null)} className="rounded-lg border border-zinc-600 bg-zinc-800 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-700">Annuler</button>
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
    <label className="block text-xs font-medium text-zinc-400">
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-red-800 focus:ring-2 focus:ring-red-900/40">
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
    <div className="rounded-xl border border-zinc-700 bg-zinc-950 p-3">
      <div className="flex items-center justify-between text-xs">
        <span className={`font-semibold ${stock.groupe_sanguin?.endsWith('-') ? 'text-red-300' : 'text-zinc-200'}`}>{stock.groupe_sanguin}</span>
        <span className={crit ? 'font-semibold text-red-400' : 'text-zinc-400'}>{stock.quantite_poches} poches</span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-zinc-800">
        <div className={`h-full ${bar}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-1 flex items-center justify-between">
        <p className="text-[10px] text-zinc-500">Seuil : {stock.seuil_critique}</p>
        {onEdit && (
          <button onClick={onEdit} className="text-[10px] text-red-300 hover:text-red-200">Modifier</button>
        )}
      </div>
    </div>
  );
}
