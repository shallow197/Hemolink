// =====================================================================
// Landing.jsx — Page d'accueil publique (vitrine de HemoLink)
// =====================================================================

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchJson } from '../../api';
import { SectionHeading } from '../../components/ui.jsx';

export default function Landing() {
  const [kpis, setKpis] = useState(null);

  useEffect(() => {
    fetchJson('/api/dashboard/kpis').then(setKpis).catch(() => {});
  }, []);

  return (
    <div className="space-y-20 md:space-y-28">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-hero-gradient px-6 py-12 text-white shadow-card md:px-12 md:py-16">
        <div className="pointer-events-none absolute inset-0 hl-hero-shine" aria-hidden />
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blood/20 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-accent-teal/15 blur-3xl" aria-hidden />

        <div className="relative grid items-center gap-10 lg:grid-cols-2">
          <div>
            <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden />
              Plateforme officielle · Urgences transfusionnelles au Sénégal
            </span>
            <h1 className="font-display text-4xl font-extrabold leading-[1.1] tracking-tight md:text-5xl lg:text-[3.25rem]">
              Chaque minute compte.
              <span className="mt-2 block text-red-200">HemoLink connecte donneurs et hôpitaux.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-300">
              Lorsqu&apos;un patient a besoin d&apos;une transfusion d&apos;urgence, HemoLink localise les donneurs
              compatibles à proximité — groupe sanguin, disponibilité et géolocalisation — et les alerte en un clic.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/register" className="hl-btn-primary bg-white text-brand-navy shadow-lg hover:bg-slate-100 hover:text-brand-navy focus-visible:ring-white">
                Devenir donneur
              </Link>
              <Link
                to="/login"
                className="hl-btn border border-white/30 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 focus-visible:ring-white"
              >
                Espace hôpital / CNTS
              </Link>
            </div>
            <p className="mt-5 text-sm text-slate-400">
              <span className="font-semibold text-white">Un don peut sauver trois vies</span> — plaquettes, globules rouges, plasma.
            </p>
          </div>

          <div className="hl-card border-0 bg-white/95 p-6 shadow-card-hover backdrop-blur-sm">
            <p className="mb-4 text-center text-xs font-semibold uppercase tracking-widest text-slate-500">
              Indicateurs en direct
            </p>
            <div className="grid grid-cols-2 gap-3">
              <KpiTile label="Donneurs inscrits" value={kpis?.donneurs_inscrits} accent="border-l-blood" />
              <KpiTile label="Hôpitaux partenaires" value={kpis?.hopitaux_total} accent="border-l-brand-slate" />
              <KpiTile label="Alertes en cours" value={kpis?.alertes_actives} accent="border-l-accent-gold" />
              <KpiTile label="Dons facilités" value={kpis?.dons_total} accent="border-l-accent-teal" />
            </div>
          </div>
        </div>
      </section>

      {/* Partenaires / confiance */}
      <section className="flex flex-wrap items-center justify-center gap-6 rounded-2xl border border-slate-200/80 bg-white px-6 py-5 shadow-card">
        <TrustBadge label="CNTS Dakar" sub="Partenaire institutionnel" />
        <TrustBadge label="CHNU Fann" sub="Hôpital pilote" />
        <TrustBadge label="ESP / UCAD" sub="Projet académique PPP" />
        <TrustBadge label="Temps réel" sub="Alertes géolocalisées" />
      </section>

      {/* Comment ça marche */}
      <section>
        <SectionHeading label="Fonctionnement" title="Comment ça marche" className="mb-8" />
        <div className="grid gap-5 md:grid-cols-3">
          <Step
            num="1"
            title="Inscription rapide"
            text="Le donneur crée son profil (groupe sanguin, localisation, disponibilité). Validation par le CNTS pour garantir la qualité de la base."
          />
          <Step
            num="2"
            title="Alerte ciblée géolocalisée"
            text="Quand un hôpital lance une alerte, HemoLink contacte uniquement les donneurs compatibles dans le rayon défini."
          />
          <Step
            num="3"
            title="Réponse en un clic"
            text="Le donneur accepte ou refuse depuis son téléphone. L'hôpital suit en temps réel les engagements."
          />
        </div>
      </section>

      {/* Pour qui */}
      <section>
        <SectionHeading label="Utilisateurs" title="Une plateforme pour tous les acteurs" className="mb-8" />
        <div className="grid gap-5 md:grid-cols-3">
          <PersonaCard
            icon="🩸"
            title="Pour les donneurs"
            text="Application mobile-first, compte sécurisé, historique des dons et prochaine date d'éligibilité automatique."
            cta="Devenir donneur"
            href="/register"
            accent="from-blood/10 to-blood-light"
          />
          <PersonaCard
            icon="🏥"
            title="Pour les hôpitaux"
            text="Stocks en temps réel par groupe, alertes d'urgence en un clic, suivi des réponses et traçabilité complète."
            cta="Espace hôpital"
            href="/login"
            accent="from-brand-navy/5 to-slate-100"
          />
          <PersonaCard
            icon="📊"
            title="Pour le CNTS"
            text="Vue nationale des stocks et donneurs, validation des comptes, statistiques par région, audit complet."
            cta="Console CNTS"
            href="/login"
            accent="from-accent-teal/10 to-emerald-50"
          />
        </div>
      </section>

      {/* Pourquoi */}
      <section className="hl-card overflow-hidden">
        <div className="grid md:grid-cols-2">
          <div className="border-b border-slate-100 bg-gradient-to-br from-brand-navy to-brand-navy-light p-8 text-white md:border-b-0 md:border-r">
            <h2 className="font-display text-2xl font-bold">Pourquoi HemoLink ?</h2>
            <p className="mt-4 text-sm leading-relaxed text-slate-300">
              Aujourd&apos;hui, en rupture de sang, la recherche de donneurs passe par appels, WhatsApp ou réseaux sociaux —
              lent et peu structuré alors que chaque minute compte.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-slate-300">
              HemoLink numérise ce processus, avec une priorité aux{' '}
              <span className="font-semibold text-blood-muted">groupes rares (O-, A-, B-, AB-)</span> identifiés par le CNTS.
            </p>
          </div>
          <ul className="grid content-center gap-4 p-8">
            <Feature text="Alerte géolocalisée en moins de 30 secondes" />
            <Feature text="Compatibilité ABO + Rhésus calculée automatiquement" />
            <Feature text="Délai inter-dons respecté (3 mois hommes, 4 mois femmes)" />
            <Feature text="Assistant IA pour le staff (langage naturel)" />
            <Feature text="Traçabilité et audit log conformes CNTS" />
          </ul>
        </div>
      </section>
    </div>
  );
}

function KpiTile({ label, value, accent }) {
  return (
    <div className={`rounded-xl border border-slate-100 bg-slate-50/80 p-4 ${accent} border-l-[3px]`}>
      <p className="hl-kpi-value text-2xl md:text-3xl">{value ?? '—'}</p>
      <p className="hl-kpi-label mt-1">{label}</p>
    </div>
  );
}

function TrustBadge({ label, sub }) {
  return (
    <div className="text-center">
      <p className="font-display text-sm font-bold text-brand-navy">{label}</p>
      <p className="text-[11px] text-slate-500">{sub}</p>
    </div>
  );
}

function Step({ num, title, text }) {
  return (
    <div className="hl-card-hover hl-card-body group">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blood to-blood-dark font-display text-sm font-bold text-white shadow-glow">
        {num}
      </div>
      <h3 className="font-display text-lg font-bold text-brand-navy">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{text}</p>
    </div>
  );
}

function PersonaCard({ icon, title, text, cta, href, accent }) {
  return (
    <div className={`hl-card-hover flex flex-col overflow-hidden`}>
      <div className={`bg-gradient-to-br ${accent} px-6 pb-4 pt-6`}>
        <span className="text-3xl" aria-hidden>
          {icon}
        </span>
        <h3 className="mt-3 font-display text-lg font-bold text-brand-navy">{title}</h3>
      </div>
      <div className="flex flex-1 flex-col p-6 pt-4">
        <p className="flex-1 text-sm leading-relaxed text-slate-600">{text}</p>
        <Link to={href} className="hl-btn-secondary mt-6 w-fit border-blood/20 text-blood hover:bg-blood-light">
          {cta} →
        </Link>
      </div>
    </div>
  );
}

function Feature({ text }) {
  return (
    <li className="flex items-start gap-3 text-sm text-slate-700">
      <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-100 font-bold text-emerald-700">
        ✓
      </span>
      {text}
    </li>
  );
}
