import { Link } from 'react-router-dom';

export default function DevenirDonneur() {
  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <header>
        <h1 className="text-3xl font-bold text-zinc-50">Pourquoi devenir donneur ?</h1>
        <p className="mt-2 text-zinc-400">
          Au Sénégal, chaque année, des centaines de patients meurent faute de sang disponible
          au bon moment. Vous pouvez littéralement <span className="text-red-300">sauver trois vies</span> en une heure.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <Stat big="3 vies"  label="sauvées par poche de sang (plaquettes, globules rouges, plasma)" />
        <Stat big="56 j"    label="entre 2 dons pour les hommes — 4 mois pour les femmes" />
        <Stat big="45 min"  label="environ pour faire un don (entretien + prélèvement + collation)" />
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="text-xl font-semibold text-zinc-100">Qui peut donner ?</h2>
        <ul className="mt-3 space-y-2 text-sm text-zinc-300">
          <li>• Âgé(e) de 18 à 65 ans</li>
          <li>• Pesant au moins 50 kg</li>
          <li>• En bonne santé générale (pas d'infection en cours, pas de traitement bloquant)</li>
          <li>• Délai minimum depuis le dernier don : 3 mois (hommes), 4 mois (femmes)</li>
          <li>• Ne pas être enceinte ou allaitante</li>
        </ul>
        <p className="mt-4 text-xs text-zinc-500">
          La consultation médicale finale est faite par le CNTS le jour du don pour confirmer votre aptitude.
        </p>
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="text-xl font-semibold text-zinc-100">Comment HemoLink protège vos données ?</h2>
        <ul className="mt-3 space-y-2 text-sm text-zinc-300">
          <li>• Vos coordonnées ne sont jamais visibles publiquement.</li>
          <li>• Seuls les hôpitaux partenaires validés par le CNTS peuvent envoyer des alertes.</li>
          <li>• Vous gardez le contrôle : vous pouvez refuser à tout moment ou passer en mode "indisponible".</li>
          <li>• Toutes les actions sensibles sont tracées (audit log) pour conformité CNTS.</li>
        </ul>
      </section>

      <div className="flex justify-center">
        <Link to="/register" className="rounded-xl bg-blood px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-blood/30 hover:bg-blood-dark">
          Je m'inscris maintenant
        </Link>
      </div>
    </div>
  );
}

function Stat({ big, label }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 text-center">
      <p className="text-2xl font-bold text-red-400">{big}</p>
      <p className="mt-1 text-xs text-zinc-400">{label}</p>
    </div>
  );
}
