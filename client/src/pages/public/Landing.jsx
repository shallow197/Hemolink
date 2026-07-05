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
    <div className="space-y-24 md:space-y-32 pb-20">
      {/* Hero Section with Premium Generated Image Background */}
      <section 
        className="relative overflow-hidden rounded-[2.5rem] px-6 py-16 text-white shadow-2xl md:px-16 md:py-24 border border-white/10"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(10, 17, 40, 0.95) 0%, rgba(10, 17, 40, 0.6) 100%), url('/hero-bg.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="pointer-events-none absolute inset-0 hl-hero-shine" aria-hidden />

        <div className="relative grid items-center gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-blood/40 bg-blood/10 px-4 py-2 text-xs font-bold tracking-wide backdrop-blur-md shadow-[0_0_15px_rgba(217,4,41,0.2)]">
              <span className="h-2 w-2 rounded-full bg-blood shadow-[0_0_8px_rgba(217,4,41,0.8)] animate-pulse" aria-hidden />
              Plateforme officielle · Urgences transfusionnelles
            </span>
            <h1 className="font-display text-5xl font-extrabold leading-[1.1] tracking-tight md:text-6xl lg:text-[4rem] text-white">
              Chaque minute <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blood-muted to-blood">compte.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-300 font-medium">
              Lorsqu&apos;un patient a besoin d&apos;une transfusion d&apos;urgence, HemoLink localise instantanément les donneurs compatibles à proximité et les alerte en un clic.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link to="/register" className="hl-btn-primary shadow-glow-teal px-8 py-4 text-base">
                Devenir donneur
              </Link>
              <Link
                to="/login"
                className="hl-btn border border-white/20 bg-white/5 text-white backdrop-blur-lg hover:bg-white/10 hover:border-white/40 focus-visible:ring-white px-8 py-4 text-base"
              >
                Accès Hôpital / CNTS
              </Link>
            </div>
            <p className="mt-6 text-sm text-slate-400 flex items-center gap-2">
              <svg className="w-4 h-4 text-blood" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"></path></svg>
              <span className="font-bold text-white">Un don sauve 3 vies</span>
            </p>
          </div>

          <div className="lg:col-span-5 relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-blood/20 to-accent-teal/20 blur-2xl rounded-full opacity-50"></div>
            <div className="relative rounded-3xl border border-white/20 bg-brand-navy/60 p-8 shadow-2xl backdrop-blur-xl">
              <p className="mb-6 text-center text-xs font-bold uppercase tracking-[0.2em] text-slate-300">
                Indicateurs en temps réel
              </p>
              <div className="grid grid-cols-2 gap-4">
                <KpiTile label="Donneurs" value={kpis?.donneurs_inscrits} color="text-blood" />
                <KpiTile label="Hôpitaux" value={kpis?.hopitaux_total} color="text-accent-teal" />
                <KpiTile label="Alertes" value={kpis?.alertes_actives} color="text-accent-gold" />
                <KpiTile label="Dons" value={kpis?.dons_total} color="text-white" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Partenaires / confiance */}
      <section className="flex flex-wrap items-center justify-center gap-10 rounded-3xl border border-white/10 bg-[#0F172A]/70 px-10 py-8 shadow-sm backdrop-blur-xl">
        <TrustBadge label="CNTS Dakar" sub="Partenaire institutionnel" />
        <div className="h-8 w-px bg-white/10 hidden md:block"></div>
        <TrustBadge label="CHNU Fann" sub="Hôpital pilote" />
        <div className="h-8 w-px bg-white/10 hidden md:block"></div>
        <TrustBadge label="ESP / UCAD" sub="Projet académique PPP" />
        <div className="h-8 w-px bg-white/10 hidden md:block"></div>
        <TrustBadge label="Temps réel" sub="Alertes géolocalisées" />
      </section>

      {/* Chiffres OMS / CNTS — pourquoi HemoLink est urgent */}
      <section className="relative">
        <SectionHeading
          label="Le contexte sénégalais"
          title="Un enjeu vital, mesurable et urgent"
          className="mb-10 text-center"
        />
        <div className="grid gap-4 md:grid-cols-4">
          <FactCard
            num="10"
            unit="dons /1000 hab."
            label="Objectif OMS"
            detail="Sénégal en dessous du seuil recommandé par l'OMS (10 dons pour 1000 habitants/an)."
            source="OMS · Rapport mondial sur la sécurité transfusionnelle"
          />
          <FactCard
            num="≈ 40%"
            unit="des besoins"
            label="Déficit national"
            detail="Environ 40 % des besoins nationaux en poches de sang restent non couverts chaque année au Sénégal."
            source="CNTS · Rapport d'activité"
            highlight
          />
          <FactCard
            num="+35%"
            unit="besoins /an"
            label="Croissance urgences"
            detail="La demande augmente avec l'accroissement démographique et les traumatismes routiers."
            source="Ministère de la Santé du Sénégal"
          />
          <FactCard
            num="< 15 min"
            unit="fenêtre critique"
            label="Urgence vitale"
            detail="En hémorragie post-partum ou trauma, chaque minute perdue augmente la mortalité."
            source="Standards OMS / CNTS"
          />
        </div>
        <p className="mt-6 text-center text-xs italic text-slate-500">
          Chiffres illustratifs à valider avec les publications officielles CNTS pour la version finale.
        </p>
      </section>

      {/* Partenaires & institutions */}
      <section className="rounded-3xl border border-slate-100 bg-white/70 p-8 shadow-sm md:p-12">
        <SectionHeading
          label="Notre écosystème"
          title="Portés par un réseau d'institutions"
          className="mb-8 text-center"
        />
        <div className="grid gap-6 md:grid-cols-4">
          <PartnerCard icon="🏥" nom="CNTS Dakar" role="Partenaire terrain" statut="visite réalisée" />
          <PartnerCard icon="🎓" nom="ESP / UCAD" role="Encadrement académique" statut="Projet PPP DIC1" />
          <PartnerCard icon="🏛️" nom="Ministère de la Santé" role="Tutelle nationale" statut="Perspective V2" />
          <PartnerCard icon="🌍" nom="OMS Sénégal" role="Cadre normatif" statut="Standards suivis" />
        </div>
        <div className="mt-8 rounded-2xl border-2 border-dashed border-blood/30 bg-blood/5 p-6 text-center">
          <p className="text-sm font-semibold text-brand-navy">
            🤝 Lettre d'intention CNTS en cours d'obtention
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Suite à notre rencontre avec M. Serigne Kote (CNTS Dakar), une demande officielle de collaboration
            est en cours. HemoLink est conçu dès son architecture pour être <strong>adopté par le CNTS</strong>.
          </p>
        </div>
      </section>

      {/* Comment ça marche */}
      <section className="relative">
        <div className="absolute -left-10 top-20 h-64 w-64 rounded-full bg-accent-teal/5 blur-3xl" aria-hidden />
        <SectionHeading label="Fonctionnement" title="La puissance de l'immédiateté" className="mb-12 text-center" />
        <div className="grid gap-6 md:grid-cols-3 relative z-10">
          <Step
            num="1"
            title="Inscription certifiée"
            text="Créez votre profil avec votre groupe sanguin. Validation stricte par le CNTS pour garantir une base de données fiable à 100%."
          />
          <Step
            num="2"
            title="Alerte géolocalisée"
            text="Lors d'une urgence, notre algorithme cible uniquement les donneurs compatibles présents dans un rayon optimal autour de l'hôpital."
          />
          <Step
            num="3"
            title="Action instantanée"
            text="Recevez une notification push, acceptez en un clic. L'hôpital suit votre arrivée en temps réel sur son tableau de bord."
          />
        </div>
      </section>

      {/* Pour qui */}
      <section className="relative">
        <div className="absolute -right-10 top-20 h-64 w-64 rounded-full bg-blood/5 blur-3xl" aria-hidden />
        <SectionHeading label="Écosystème" title="Une plateforme unifiée pour tous" className="mb-12 text-center" />
        <div className="grid gap-8 md:grid-cols-3 relative z-10">
          <PersonaCard
            icon="🩸"
            title="Espace Donneur"
            text="Interface mobile-first fluide. Suivez votre historique, visualisez votre impact et recevez des alertes pertinentes sans spam."
            cta="Créer mon compte"
            href="/register"
            accent="bg-[#1E293B]/60 border-blood/40 shadow-glow"
            btnClass="hl-btn-primary"
          />
          <PersonaCard
            icon="🏥"
            title="Console Hôpital"
            text="Déclenchez des alertes critiques en 3 clics. Tableau de bord complet des stocks et suivi d'engagement des donneurs en approche."
            cta="Accès Hôpital"
            href="/login"
            accent="bg-[#0F172A]/80 border-white/10"
            btnClass="hl-btn-secondary"
          />
          <PersonaCard
            icon="🛡️"
            title="Supervision CNTS"
            text="Tour de contrôle nationale. Vue macroscopique des stocks par région, audits de conformité et validation des donneurs."
            cta="Accès CNTS"
            href="/login"
            accent="bg-[#0F172A]/80 border-accent-teal/30"
            btnClass="hl-btn-secondary"
          />
        </div>
      </section>

      {/* Pourquoi */}
      <section className="hl-card overflow-hidden rounded-[2.5rem] border-0 shadow-2xl relative">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-navy to-brand-navy-light z-0"></div>
        <div className="absolute top-0 right-0 p-32 opacity-10 pointer-events-none z-0">
          <svg viewBox="0 0 200 200" className="w-96 h-96" fill="currentColor"><path d="M45.7,-77.4C58.9,-70.5,68.9,-56.6,76.5,-42.6C84.1,-28.6,89.3,-14.3,88.7,-0.3C88,-13.7,81.5,-27.4,73.9,-38.7C66.3,-50,57.5,-59,45.3,-64.7C33,-70.4,16.5,-72.8,0.7,-73.9C-15.1,-75,-30.2,-74.8,-43.3,-69.3C-56.4,-63.8,-67.4,-53,-74.8,-40.1C-82.2,-27.2,-86,-13.6,-85.4,-0.3C-84.8,-13.7,-79.8,-27.4,-72,-38.4C-64.2,-49.4,-53.6,-57.8,-41.2,-63.7C-28.8,-69.6,-14.4,-73.1,1.1,-74.8C16.6,-76.5,33.2,-76.5,45.7,-77.4Z" transform="translate(100 100)" /></svg>
        </div>
        
        <div className="grid md:grid-cols-2 relative z-10">
          <div className="p-12 md:p-16 flex flex-col justify-center">
            <h2 className="font-display text-3xl md:text-4xl font-extrabold text-white leading-tight">
              L'innovation au service <br/><span className="text-blood-muted">de la vie.</span>
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-slate-300 font-medium">
              Les ruptures de sang requièrent aujourd'hui des appels désespérés sur WhatsApp ou les réseaux sociaux. HemoLink numérise et accélère ce processus.
            </p>
            <div className="mt-8">
              <Link to="/register" className="hl-btn border border-white/20 bg-white/10 text-white backdrop-blur-md hover:bg-white/20 px-6 py-3">
                Rejoindre le mouvement →
              </Link>
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm p-12 md:p-16 border-l border-white/10">
            <ul className="grid gap-6">
              <Feature text="Algorithme d'alerte ciblé en moins de 30 secondes" />
              <Feature text="Vérification instantanée ABO + Rhésus" />
              <Feature text="Respect strict des délais physiologiques (3 mois H / 4 mois F)" />
              <Feature text="Traçabilité cryptographique conforme aux normes CNTS" />
              <Feature text="Tableaux de bord analytiques pour les décideurs" />
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

function KpiTile({ label, value, color }) {
  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-5 backdrop-blur-sm transition-transform hover:scale-105">
      <p className={`font-display text-4xl font-extrabold tabular-nums tracking-tight ${color}`}>{value ?? '—'}</p>
      <p className="mt-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
    </div>
  );
}

function TrustBadge({ label, sub }) {
  return (
    <div className="text-center group">
      <p className="font-display text-lg font-bold text-white transition-colors group-hover:text-blood">{label}</p>
      <p className="text-xs font-medium text-slate-400 mt-1">{sub}</p>
    </div>
  );
}

function Step({ num, title, text }) {
  return (
    <div className="hl-card hl-card-body group relative overflow-hidden">
      <div className="absolute -right-6 -top-6 text-[120px] font-extrabold text-slate-50/50 pointer-events-none transition-transform group-hover:scale-110">
        {num}
      </div>
      <div className="relative z-10">
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blood to-blood-dark font-display text-xl font-bold text-white shadow-glow">
          {num}
        </div>
        <h3 className="font-display text-xl font-bold text-white">{title}</h3>
        <p className="mt-3 text-base leading-relaxed text-slate-300 font-medium">{text}</p>
      </div>
    </div>
  );
}

function PersonaCard({ icon, title, text, cta, href, accent, btnClass }) {
  return (
    <div className={`hl-card flex flex-col overflow-hidden border ${accent} transition-transform hover:-translate-y-2`}>
      <div className="px-8 pt-8">
        <span className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#1E293B] shadow-inner text-3xl mb-6" aria-hidden>
          {icon}
        </span>
        <h3 className="font-display text-2xl font-bold text-white">{title}</h3>
      </div>
      <div className="flex flex-1 flex-col px-8 pb-8 pt-4">
        <p className="flex-1 text-base leading-relaxed text-slate-300 font-medium">{text}</p>
        <Link to={href} className={`${btnClass} mt-8 w-full justify-center py-3`}>
          {cta}
        </Link>
      </div>
    </div>
  );
}

function Feature({ text }) {
  return (
    <li className="flex items-start gap-4 text-base font-medium text-slate-200">
      <span className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blood/20 text-blood-muted ring-1 ring-blood/30">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
      </span>
      {text}
    </li>
  );
}

function FactCard({ num, unit, label, detail, source, highlight }) {
  return (
    <article
      className={`rounded-3xl border p-6 shadow-sm transition-transform hover:-translate-y-1 ${
        highlight ? 'border-blood/40 bg-gradient-to-br from-blood/5 to-white' : 'border-slate-100 bg-white'
      }`}
    >
      <div className="flex items-baseline gap-1">
        <span className={`font-display text-5xl font-extrabold tabular-nums ${highlight ? 'text-blood' : 'text-brand-navy'}`}>
          {num}
        </span>
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{unit}</span>
      </div>
      <p className={`mt-2 text-sm font-bold uppercase tracking-wider ${highlight ? 'text-blood' : 'text-brand-navy'}`}>
        {label}
      </p>
      <p className="mt-3 text-sm leading-relaxed text-slate-600">{detail}</p>
      <p className="mt-4 border-t border-slate-100 pt-3 text-[10px] italic text-slate-400">
        Source : {source}
      </p>
    </article>
  );
}

function PartnerCard({ icon, nom, role, statut }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 text-center shadow-sm transition-transform hover:-translate-y-1">
      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-50 text-3xl">
        {icon}
      </div>
      <p className="font-display text-base font-bold text-brand-navy">{nom}</p>
      <p className="mt-1 text-xs font-medium text-slate-500">{role}</p>
      <p className="mt-2 inline-block rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
        {statut}
      </p>
    </div>
  );
}
