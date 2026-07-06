import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/ui.jsx';
import { fetchJson } from '../../api';
import { useAuth } from '../../contexts/AuthContext.jsx';

export default function DonneurDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [mes, setMes] = useState([]);
  const [proches, setProches] = useState([]);
  const [err, setErr] = useState(null);

  useEffect(() => {
    Promise.all([
      fetchJson('/api/donneurs/me'),
      fetchJson('/api/alertes/mes'),
      fetchJson('/api/donneurs/me/hopitaux-proches').catch(() => []),
    ])
      .then(([d, a, p]) => { setData(d); setMes(a); setProches(p || []); })
      .catch((e) => setErr(e.message));
  }, []);

  const alertesEnAttente = mes.filter((a) => a.reponse === 'pas_repondu' && a.statut === 'en_cours');

  // Calcul des badges
  const badges = calculerBadges(data, mes);

  // Compte à rebours prochain don
  const compteRebours = calculerCompteRebours(data);

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

      {/* Compte à rebours prochain don + Top hôpitaux */}
      {data && (
        <div className="grid gap-6 md:grid-cols-2">
          <CompteRebours cr={compteRebours} sexe={data?.donneur?.sexe} />
          <TopHopitaux liste={proches} />
        </div>
      )}

      {/* Badges gamifiés */}
      {badges.length > 0 && <BadgesGrid badges={badges} />}

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

// =====================================================================
// HELPERS pour badges, compte à rebours, timeline
// =====================================================================

function calculerBadges(data, mes) {
  if (!data) return [];
  const nb = data.donneur.nombre_dons || data.historique?.length || 0;
  const groupe = data.donneur.groupe_sanguin || '';
  const acceptes = mes.filter(a => a.reponse === 'accepte').length;
  const badges = [];

  if (nb >= 1) badges.push({ icone: '🩸', titre: 'Premier don', desc: 'Vous avez sauvé des vies', unlocked: true });
  else badges.push({ icone: '🩸', titre: 'Premier don', desc: 'Bientôt à débloquer', unlocked: false });

  if (nb >= 3) badges.push({ icone: '❤️', titre: 'Donneur régulier', desc: `${nb} dons effectués`, unlocked: true });
  else badges.push({ icone: '❤️', titre: 'Donneur régulier', desc: `${nb} / 3 dons`, unlocked: false });

  if (nb >= 5) badges.push({ icone: '🌟', titre: 'Ambassadeur du don', desc: `${nb} dons — merci !`, unlocked: true });
  else badges.push({ icone: '🌟', titre: 'Ambassadeur du don', desc: `${nb} / 5 dons`, unlocked: false });

  if (groupe.endsWith('-')) badges.push({ icone: '💎', titre: 'Groupe rare', desc: `${groupe} — précieux`, unlocked: true });
  if (groupe === 'O-') badges.push({ icone: '👑', titre: 'Donneur universel', desc: 'O- compatible avec tous', unlocked: true });

  if (acceptes >= 1) badges.push({ icone: '⚡', titre: 'Réactif', desc: `${acceptes} alertes acceptées`, unlocked: true });

  return badges;
}

function calculerCompteRebours(data) {
  if (!data || !data.donneur?.derniere_date_don) {
    return { jours: 0, pct: 100, message: 'Vous pouvez donner dès maintenant !', ready: true };
  }
  const delai = data.donneur.sexe === 'femme' ? 120 : 90;
  const last = new Date(data.donneur.derniere_date_don);
  const next = new Date(last);
  next.setDate(next.getDate() + delai);
  const now = new Date();
  const diff = Math.ceil((next - now) / (1000 * 60 * 60 * 24));
  if (diff <= 0) return { jours: 0, pct: 100, message: 'Vous pouvez donner dès maintenant !', ready: true, nextDate: next };
  const pct = Math.max(0, Math.min(100, ((delai - diff) / delai) * 100));
  return {
    jours: diff,
    pct,
    ready: false,
    nextDate: next,
    message: `Vous pourrez redonner dans ${diff} jour${diff > 1 ? 's' : ''}.`,
  };
}

function CompteRebours({ cr, sexe }) {
  const circumference = 2 * Math.PI * 45;
  const dash = (cr.pct / 100) * circumference;

  return (
    <div className={`rounded-3xl border-2 p-6 ${cr.ready ? 'border-emerald-400 bg-emerald-50' : 'border-blood/30 bg-red-50/40'}`}>
      <div className="flex items-center gap-6">
        <div className="relative h-32 w-32 shrink-0">
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
            <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" strokeWidth="8" />
            <circle
              cx="50" cy="50" r="45" fill="none"
              stroke={cr.ready ? '#059669' : '#990011'}
              strokeWidth="8"
              strokeDasharray={`${dash} ${circumference}`}
              strokeLinecap="round"
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className={`font-display text-3xl font-extrabold ${cr.ready ? 'text-emerald-700' : 'text-blood'}`}>
              {cr.ready ? '✓' : cr.jours}
            </p>
            {!cr.ready && <p className="text-[10px] uppercase tracking-wide text-gray-500">jours</p>}
          </div>
        </div>
        <div className="flex-1">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Prochain don possible</p>
          <p className={`mt-1 text-lg font-bold ${cr.ready ? 'text-emerald-800' : 'text-brand-navy'}`}>
            {cr.message}
          </p>
          {cr.nextDate && (
            <p className="mt-1 text-xs text-gray-500">Date estimée : {cr.nextDate.toLocaleDateString('fr-FR')}</p>
          )}
          <p className="mt-3 text-xs text-gray-600">
            Délai physiologique : {sexe === 'femme' ? '4 mois' : '3 mois'} entre 2 dons (règle CNTS).
          </p>
        </div>
      </div>
    </div>
  );
}

function BadgesGrid({ badges }) {
  if (!badges.length) return null;
  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-bold text-brand-navy">🏆 Mes badges</h3>
        <p className="text-xs text-gray-500">{badges.filter(b => b.unlocked).length} / {badges.length} débloqués</p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {badges.map((b) => (
          <div key={b.titre} className={`rounded-2xl border-2 p-3 text-center transition-all ${
            b.unlocked
              ? 'border-blood/40 bg-red-50 shadow-sm'
              : 'border-gray-200 bg-gray-50 opacity-50 grayscale'
          }`}>
            <div className="text-3xl">{b.icone}</div>
            <p className="mt-1 text-xs font-bold text-brand-navy">{b.titre}</p>
            <p className="mt-1 text-[10px] text-gray-500">{b.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function TopHopitaux({ liste }) {
  if (!liste || liste.length === 0) return null;
  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-bold text-brand-navy">📍 Où puis-je donner ?</h3>
      <p className="mb-4 text-xs text-gray-500">Les hôpitaux les plus proches de vous. Cliquez pour l'itinéraire.</p>
      <div className="space-y-3">
        {liste.map((h, i) => (
          <a
            key={h.id}
            href={`https://www.google.com/maps/dir/?api=1&destination=${h.latitude},${h.longitude}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-slate-50/60 p-3 hover:bg-slate-100"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blood text-white font-bold">
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-brand-navy truncate">{h.nom}</p>
              <p className="text-xs text-gray-500">{h.ville} · {h.telephone}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-blood">{h.distance_km.toFixed(1)}</p>
              <p className="text-[10px] uppercase text-gray-400">km</p>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
