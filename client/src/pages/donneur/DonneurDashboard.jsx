import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/ui.jsx';
import { fetchJson } from '../../api';
import { useAuth } from '../../contexts/AuthContext.jsx';

export default function DonneurDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [mes, setMes] = useState([]);
  const [err, setErr] = useState(null);

  useEffect(() => {
    Promise.all([
      fetchJson('/api/donneurs/me'),
      fetchJson('/api/alertes/mes'),
    ])
      .then(([d, a]) => { setData(d); setMes(a); })
      .catch((e) => setErr(e.message));
  }, []);

  const alertesEnAttente = mes.filter((a) => a.reponse === 'pas_repondu' && a.statut === 'en_cours');

  return (
    <div className="hl-page pb-12">
      <PageHeader
        title={`Bienvenue, ${data?.donneur?.prenom || user?.email}`}
        subtitle="Votre tableau de bord donneur HemoLink"
      />

      {err && <p className="hl-alert-error">{err}</p>}

      {alertesEnAttente.length > 0 && (
        <div className="hl-alert-urgent p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-blood"></div>
          <div className="flex items-start justify-between gap-6 relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 mb-3">
                <span className="h-2 w-2 rounded-full bg-blood animate-pulse shadow-glow"></span>
                <p className="text-xs font-bold uppercase tracking-widest text-blood">Alerte Critique à Proximité</p>
              </div>
              <h3 className="text-2xl font-display font-extrabold text-white">
                {alertesEnAttente.length} appel{alertesEnAttente.length > 1 ? 's' : ''} au don en attente de réponse
              </h3>
              <p className="mt-2 text-base font-medium text-slate-300">
                Un hôpital cherche d'urgence du sang <span className="font-bold text-blood px-1">{alertesEnAttente[0].groupe_sanguin}</span>. 
                Votre profil correspond parfaitement à cette urgence.
              </p>
            </div>
            <Link to="/mon-espace/alertes" className="hl-btn-primary flex-shrink-0 text-base py-3 px-8 shadow-glow mt-4">
              Agir maintenant →
            </Link>
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <Card title="Groupe Sanguin" value={data?.donneur?.groupe_sanguin ?? '—'} sub={
          data?.donneur?.groupe_sanguin?.endsWith('-')
            ? <span className="inline-flex items-center gap-1.5 font-bold text-blood bg-blood/10 px-2 py-0.5 rounded-md mt-1"><span className="text-lg leading-none">♦</span> Sang Rare</span>
            : 'Groupe Standard'
        } />
        <Card
          title="Statut d'Éligibilité"
          value={data?.eligibilite?.eligible ? 'Éligible au don' : 'Indisponible'}
          accent={data?.eligibilite?.eligible ? 'text-accent-teal' : 'text-amber-500'}
          sub={data?.eligibilite?.prochaineDateDon ? `Prochain don possible : ${data.eligibilite.prochaineDateDon}` : 'Aucun historique de don'}
        />
        <Card
          title="Impact Vital"
          value={data?.donneur?.nombre_dons ?? 0}
          sub={`${(data?.donneur?.nombre_dons ?? 0) * 3} vies potentiellement sauvées`}
        />
      </div>

      {data && !data.eligibilite.eligible && data.eligibilite.raisons?.length > 0 && (
        <div className="hl-alert-warning p-6 shadow-sm border border-amber-500/30">
          <p className="text-sm font-bold text-amber-300 mb-2">Motif d'indisponibilité temporaire :</p>
          <ul className="space-y-1.5 text-sm font-medium text-amber-200">
            {data.eligibilite.raisons.map((r, i) => <li key={i} className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> {r}</li>)}
          </ul>
        </div>
      )}

      <section className="hl-panel">
        <div className="hl-panel-header flex items-center justify-between border-b border-slate-100 bg-white/40">
          <div>
            <h3 className="hl-panel-title">Historique des Alertes</h3>
            <p className="text-xs font-medium text-slate-500 mt-1">Vos dernières sollicitations</p>
          </div>
          <Link to="/mon-espace/alertes" className="text-sm font-bold text-blood hover:text-blood-dark transition-colors bg-blood/5 px-4 py-2 rounded-xl">Voir tout l'historique →</Link>
        </div>
        <div className="hl-panel-body p-0">
          {mes.length === 0 ? (
            <div className="p-12 text-center">
              <span className="inline-block p-4 rounded-full bg-slate-50 text-3xl mb-4">🔔</span>
              <p className="text-base font-medium text-slate-500">Aucune alerte reçue pour le moment.</p>
              <p className="text-sm text-slate-400 mt-1">Nous vous notifierons en cas d'urgence dans votre zone.</p>
            </div>
          ) : (
            <ul className="divide-y divide-white/10">
              {mes.slice(0, 5).map((a) => (
                <li key={a.reponse_id} className="flex items-center justify-between p-6 hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-xl shadow-inner border border-white/10">
                      🏥
                    </div>
                    <div>
                      <p className="text-base font-bold text-white">
                        {a.hopital_nom} <span className="text-slate-400 font-medium ml-1">· {a.groupe_sanguin}</span>
                      </p>
                      <p className="text-sm font-medium text-slate-400 mt-1 flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${a.niveau_urgence === 'critique' ? 'bg-blood shadow-glow' : 'bg-amber-500'}`}></span>
                        <span className="capitalize">{a.niveau_urgence}</span>
                        <span>·</span>
                        <span>{Number(a.distance_km || 0).toFixed(1)} km</span>
                        <span>·</span>
                        <span>{new Date(a.date_notification).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}</span>
                      </p>
                    </div>
                  </div>
                  <ReponseBadge reponse={a.reponse} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

function Card({ title, value, sub, accent = 'text-brand-navy' }) {
  return (
    <div className="hl-card relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-1 h-full bg-white/20 transition-colors group-hover:bg-blood/50"></div>
      <div className="p-8 relative z-10">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-2">{title}</p>
        <p className={`font-display text-4xl font-extrabold tracking-tight ${accent === 'text-brand-navy' ? 'text-white' : accent}`}>{value}</p>
        {sub && <p className="mt-3 text-sm font-medium text-slate-400">{sub}</p>}
      </div>
    </div>
  );
}

function ReponseBadge({ reponse }) {
  const map = {
    accepte:     { c: 'bg-accent-teal/20 text-accent-teal border-accent-teal/30', l: 'Accepté' },
    refuse:      { c: 'bg-white/10 text-slate-300 border-white/20', l: 'Refusé' },
    pas_repondu: { c: 'bg-amber-500/20 text-amber-300 border-amber-500/30', l: 'En attente' },
  };
  const v = map[reponse] || map.pas_repondu;
  return <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold border shadow-sm ${v.c}`}>{v.l}</span>;
}
