// =====================================================================
// Landing.jsx — Page d'accueil publique (vitrine de HemoLink)
// =====================================================================
// Structure :
//   1. Hero (titre + boutons CTA + KPIs en direct)
//   2. "Comment ça marche" (3 étapes)
//   3. "Pour qui" (3 cartes : donneurs, hôpitaux, CNTS)
//   4. "Pourquoi HemoLink" (contexte + bénéfices)
// =====================================================================

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchJson } from '../../api';

export default function Landing() {
  // KPIs publics chargés au montage (donneurs, hôpitaux, alertes, dons)
  const [kpis, setKpis] = useState(null);

  useEffect(() => {
    // Endpoint public, pas besoin de token
    fetchJson('/api/dashboard/kpis').then(setKpis).catch(() => {});
  }, []);

  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="grid items-center gap-10 py-8 md:grid-cols-2">
        <div>
          <span className="mb-4 inline-flex rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-blood">
            Plateforme officielle pour les urgences transfusionnelles au Sénégal
          </span>
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-gray-900 md:text-5xl">
            Chaque minute compte.<br />
            <span className="text-blood">HemoLink</span> connecte donneurs et hôpitaux en temps réel.
          </h1>
          <p className="mt-5 max-w-xl text-base text-gray-600">
            Lorsqu'un patient sénégalais a besoin d'une transfusion d'urgence, HemoLink localise
            instantanément les donneurs compatibles à proximité de l'hôpital — par groupe sanguin,
            disponibilité et géolocalisation — et les alerte en un clic.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link to="/register" className="rounded-xl bg-blood px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-blood/20 hover:bg-blood-dark">
              Devenir donneur
            </Link>
            <Link to="/login" className="rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50">
              Espace hôpital / CNTS
            </Link>
          </div>
          <p className="mt-4 text-xs text-gray-500">
            <span className="font-medium text-blood">Un don peut sauver trois vies</span> · plaquettes, globules rouges, plasma.
          </p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-md">
          <div className="grid grid-cols-2 gap-3">
            <KpiTile label="Donneurs inscrits"    value={kpis?.donneurs_inscrits}  accent="border-l-4 border-blood" />
            <KpiTile label="Hôpitaux partenaires" value={kpis?.hopitaux_total}     accent="border-l-4 border-blue-500" />
            <KpiTile label="Alertes en cours"     value={kpis?.alertes_actives}    accent="border-l-4 border-amber-500" />
            <KpiTile label="Dons facilités"       value={kpis?.dons_total}         accent="border-l-4 border-emerald-500" />
          </div>
          <p className="mt-4 text-center text-[11px] text-gray-400">Chiffres en direct depuis la plateforme.</p>
        </div>
      </section>

      {/* Comment ça marche */}
      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-400">Fonctionnement</h2>
        <h3 className="mb-6 text-2xl font-bold text-gray-900">Comment ça marche</h3>
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
      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-400">Utilisateurs</h2>
        <h3 className="mb-6 text-2xl font-bold text-gray-900">Une plateforme pour tous les acteurs</h3>
        <div className="grid gap-4 md:grid-cols-3">
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
        </div>
      </section>

      {/* Pourquoi maintenant */}
      <section className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Pourquoi HemoLink ?</h2>
            <p className="mt-3 text-sm leading-relaxed text-gray-600">
              Aujourd'hui, quand un hôpital sénégalais est en rupture de sang, la recherche de donneurs se fait
              par appels téléphoniques, WhatsApp ou réseaux sociaux. C'est lent, peu structuré et peu fiable
              alors que chaque minute compte.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-gray-600">
              HemoLink numérise et automatise ce processus, avec une attention particulière aux{' '}
              <span className="font-medium text-blood">groupes sanguins rares (O-, A-, B-, AB-)</span>{' '}
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
    <div className={`rounded-xl border border-gray-100 bg-slate-50 p-4 ${accent}`}>
      <p className="text-3xl font-bold text-gray-900">{value ?? '—'}</p>
      <p className="mt-1 text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
    </div>
  );
}

function Step({ num, title, text }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-blood text-sm font-bold text-white">
        {num}
      </div>
      <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-gray-600">{text}</p>
    </div>
  );
}

function Card({ title, text, cta, href }) {
  return (
    <div className="flex flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-600">{text}</p>
      <Link to={href} className="mt-5 inline-flex w-fit items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-blood hover:bg-red-100">
        {cta} →
      </Link>
    </div>
  );
}

function Feature({ text }) {
  return (
    <li className="flex items-start gap-3 text-sm text-gray-700">
      <span className="mt-0.5 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">✓</span>
      {text}
    </li>
  );
}

// =====================================================================
// EXPLICATION POUR LA SOUTENANCE (15 secondes) :
// ---------------------------------------------------------------------
// C'est la première impression. On y montre IMMÉDIATEMENT 4 chiffres en
// direct (donneurs, hôpitaux, alertes, dons) — ils prouvent que l'app
// est connectée à des données réelles. La page raconte ensuite l'histoire
// en 3 étapes : Inscription → Alerte ciblée → Réponse en un clic. Puis
// elle présente les 3 personas (donneur, hôpital, CNTS) avec un bouton
// d'action vers leur espace. C'est notre meilleur outil de pitch : on
// peut la projeter au CNTS sans même se connecter.
// =====================================================================
