// =====================================================================
// ActualitesCNTS.jsx — Widget "Actualités officielles CNTS"
// =====================================================================
// Simule un feed d'actualités du CNTS. En production, alimenté par une
// vraie table `actualites_cnts` et éditable par le rôle CNTS.
// =====================================================================

const ACTUALITES = [
  {
    id: 1,
    date: '2026-06-14',
    tag: 'Événement',
    tagColor: 'bg-red-100 text-red-700',
    titre: 'Journée mondiale du donneur de sang',
    resume: 'Le 14 juin, mobilisez-vous ! Collecte exceptionnelle au CNTS Dakar, à l\'Hôpital Fann et à l\'Hôpital Principal. Objectif : 500 poches supplémentaires.',
  },
  {
    id: 2,
    date: '2026-05-22',
    tag: 'Collecte mobile',
    tagColor: 'bg-blue-100 text-blue-700',
    titre: 'Collecte à Rufisque — Place de l\'Indépendance',
    resume: 'Le camion de collecte du CNTS sera présent le samedi 22 mai de 9h à 17h. Groupes recherchés : O-, B-, AB-. Bilan de santé gratuit inclus.',
  },
  {
    id: 3,
    date: '2026-05-10',
    tag: 'Campagne',
    tagColor: 'bg-amber-100 text-amber-700',
    titre: 'Alerte nationale — groupes sanguins rares',
    resume: 'Les stocks de O- et AB- restent sous seuil critique dans 4 régions. Les donneurs concernés sont invités à se manifester via HemoLink ou directement au CNTS.',
  },
  {
    id: 4,
    date: '2026-04-28',
    tag: 'Partenariat',
    tagColor: 'bg-emerald-100 text-emerald-700',
    titre: 'Signature d\'un accord CNTS × HemoLink',
    resume: 'Le CNTS et l\'équipe HemoLink formalisent leur collaboration pour l\'intégration progressive de la plateforme dans les 15 hôpitaux partenaires du pays.',
  },
];

function fmtDate(s) {
  const d = new Date(s);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function ActualitesCNTS({ compact = false, limit = 4 }) {
  const items = ACTUALITES.slice(0, limit);
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 bg-gradient-to-r from-brand-navy to-brand-navy/90 px-5 py-3 rounded-t-2xl">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
            Officiel CNTS
          </span>
          <h3 className="text-sm font-bold text-white">📢 Actualités du don de sang au Sénégal</h3>
        </div>
      </div>
      <ul className="divide-y divide-gray-100">
        {items.map((a) => (
          <li key={a.id} className="p-4 hover:bg-slate-50/60">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${a.tagColor}`}>
                {a.tag}
              </span>
              <span className="text-[11px] font-medium text-gray-500">{fmtDate(a.date)}</span>
            </div>
            <p className="mt-2 text-sm font-bold text-brand-navy">{a.titre}</p>
            {!compact && (
              <p className="mt-1 text-xs leading-relaxed text-gray-600">{a.resume}</p>
            )}
          </li>
        ))}
      </ul>
      <div className="border-t border-gray-100 bg-slate-50/60 px-4 py-2 text-center">
        <a href="https://www.cnts.sn" target="_blank" rel="noreferrer" className="text-[11px] font-semibold text-blood hover:underline">
          Voir toutes les actualités CNTS →
        </a>
      </div>
    </div>
  );
}
