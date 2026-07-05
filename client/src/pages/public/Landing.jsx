import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchJson } from '../../api';

export default function Landing() {
  const [kpis, setKpis] = useState(null);

  useEffect(() => {
    fetchJson('/api/dashboard/kpis').then(setKpis).catch(() => {});
  }, []);

  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="grid items-center gap-8 py-8 md:grid-cols-2">
        <div>
          <span className="mb-3 inline-flex rounded-full border border-red-900/50 bg-red-950/40 px-3 py-1 text-xs font-medium text-red-300">
            ★ Plateforme officielle pour les urgences transfusionnelles au Sénégal
          </span>
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-zinc-50 md:text-5xl">
            Chaque minute compte.<br />
            <span className="text-blood">HemoLink</span> connecte donneurs et hôpitaux en temps réel.
          </h1>
          <p className="mt-5 max-w-xl text-base text-zinc-400">
            Lorsqu'un patient sénégalais a besoin d'une transfusion d'urgence, HemoLink localise
            instantanément les donneurs compatibles à proximité de l'hôpital — par groupe sanguin,
            disponibilité et géolocalisation — et les alerte en un clic.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link to="/register" className="rounded-xl bg-blood px-6 py-3 text-sm font-semibold text-white shadow-md shadow-blood/30 hover:bg-blood-dark">
              Devenir donneur
            </Link>
            <Link to="/login" className="rounded-xl border border-zinc-700 bg-zinc-900 px-6 py-3 text-sm font-semibold text-zinc-100 hover:bg-zinc-800">
              Espace hôpital / CNTS
            </Link>
          </div>
          <p className="mt-4 text-xs text-zinc-500">
            <span className="text-red-300">Un don peut sauver trois vies</span> · plaquettes, globules rouges, plasma.
          </p>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950 p-6 shadow-2xl shadow-black/40">
          <div className="grid grid-cols-2 gap-3">
            <KpiTile label="Donneurs inscrits"    value={kpis?.donneurs_inscrits}  accent="bg-blood/10 text-red-300" />
            <KpiTile label="Hôpitaux partenaires" value={kpis?.hopitaux_total}     accent="bg-blue-500/10 text-blue-300" />
            <KpiTile label="Alertes en cours"     value={kpis?.alertes_actives}    accent="bg-amber-500/10 text-amber-300" />
            <KpiTile label="Dons facilités"       value={kpis?.dons_total}         accent="bg-emerald-500/10 text-emerald-300" />
          </div>
          <p className="mt-4 text-center text-[11px] text-zinc-500">Chiffres en direct depuis la plateforme.</p>
        </div>
      </section>

      {/* Comment ça marche */}
      <section>
        <h2 className="mb-6 text-2xl font-bold text-zinc-50">Comment ça marche</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Step
            num="1"
            title="Inscription rapide"
            text="Le donneur crée son profil (groupe sanguin, localisation, disponibilité). Validation par le CNTS pour garantir la qualité de la base."
          />
          <Step
            num="2"
            title="Alerte ciblée géolocalisée"
            text="Quand un hôpital lance une alerte, HemoLink contacte uniquement les donneurs compatibles dans le rayon défini — pas de spam, juste les bonnes personnes."
          />
          <Step
            num="3"
            title="Réponse en un clic"
            text="Le donneur accepte ou refuse depuis son téléphone. L'hôpital suit en temps réel le nombre d'engagements et son plan de transfusion."
          />
        </div>
      </section>

      {/* Pour qui */}
      <section className="grid gap-4 md:grid-cols-3">
        <Card
          title="Pour les donneurs"
          text="Une appli mobile-first, un compte sécurisé, l'historique de vos dons, votre prochaine date d'éligibilité automatique."
          cta="Devenir donneur"
          href="/register"
        />
        <Card
          title="Pour les hôpitaux"
          text="Stocks de sang en temps réel par groupe, alertes d'urgence en un clic, suivi des réponses et traçabilité complète."
          cta="Espace hôpital"
          href="/login"
        />
        <Card
          title="Pour le CNTS"
          text="Vue nationale agrégée des stocks et des donneurs, validation des comptes, statistiques par région, audit complet."
          cta="Console CNTS"
          href="/login"
        />
      </section>

      {/* Pourquoi maintenant */}
      <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8">
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold text-zinc-50">Pourquoi HemoLink ?</h2>
            <p className="mt-3 text-sm text-zinc-400">
              Aujourd'hui, quand un hôpital sénégalais est en rupture de sang, la recherche de donneurs se fait
              par appels téléphoniques, WhatsApp ou réseaux sociaux. C'est lent, peu structuré et peu fiable
              alors que chaque minute compte.
            </p>
            <p className="mt-3 text-sm text-zinc-400">
              HemoLink numérise et automatise ce processus, avec une attention particulière aux
              <span className="font-medium text-red-300"> groupes sanguins rares (O-, A-, B-, AB-) </span>
              identifiés comme priorité absolue par le CNTS lors de notre visite terrain.
            </p>
          </div>
          <ul className="grid gap-3">
            <Feature text="Alerte géolocalisée multi-canal en moins de 30 secondes" />
            <Feature text="Compatibilité ABO + Rhésus calculée automatiquement" />
            <Feature text="Délai inter-dons respecté (3 mois hommes, 4 mois femmes)" />
            <Feature text="Assistant IA pour le staff médical (questions en langage naturel)" />
            <Feature text="Conforme aux exigences de traçabilité du CNTS (audit log)" />
          </ul>
        </div>
      </section>
    </div>
  );
}

function KpiTile({ label, value, accent }) {
  return (
    <div className={`rounded-2xl border border-zinc-800 bg-zinc-950 p-4 ${accent}`}>
      <p className="text-3xl font-bold">{value ?? '—'}</p>
      <p className="mt-1 text-xs uppercase tracking-wide opacity-80">{label}</p>
    </div>
  );
}

function Step({ num, title, text }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 shadow-md shadow-black/20">
      <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-blood text-sm font-bold text-white">
        {num}
      </div>
      <h3 className="text-base font-semibold text-zinc-100">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-zinc-400">{text}</p>
    </div>
  );
}

function Card({ title, text, cta, href }) {
  return (
    <div className="flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
      <h3 className="text-lg font-semibold text-zinc-100">{title}</h3>
      <p className="mt-2 flex-1 text-sm text-zinc-400">{text}</p>
      <Link to={href} className="mt-4 inline-flex w-fit rounded-lg border border-red-900/40 bg-zinc-950 px-4 py-2 text-sm font-medium text-red-300 hover:bg-red-950/30">
        {cta} →
      </Link>
    </div>
  );
}

function Feature({ text }) {
  return (
    <li className="flex items-start gap-3 text-sm text-zinc-300">
      <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300">✓</span>
      {text}
    </li>
  );
}
