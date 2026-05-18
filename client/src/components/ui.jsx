/** Composants UI partages ? identite visuelle HemoLink */

export function PageHeader({ title, subtitle, badge, actions, className = '' }) {
  return (
    <div className={`flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between ${className}`}>
      <div>
        <h1 className="hl-page-title">{title}</h1>
        {subtitle && <p className="hl-page-subtitle">{subtitle}</p>}
      </div>
      {(badge || actions) && (
        <div className="flex flex-wrap items-center gap-2">
          {badge}
          {actions}
        </div>
      )}
    </div>
  );
}

export function SectionHeading({ label, title, className = '' }) {
  return (
    <div className={className}>
      {label && <p className="hl-section-label">{label}</p>}
      <h2 className="hl-section-title mt-1">{title}</h2>
    </div>
  );
}

export function KpiCard({ label, value, accent = 'border-l-blood', className = '' }) {
  return (
    <div className={`hl-kpi ${accent} ${className}`}>
      <p className="hl-kpi-label">{label}</p>
      <p className="hl-kpi-value">{value ?? '?'}</p>
    </div>
  );
}

export function Card({ children, className = '', hover = false }) {
  return <div className={`${hover ? 'hl-card-hover' : 'hl-card'} hl-card-body ${className}`}>{children}</div>;
}

export function Panel({ title, subtitle, children, className = '' }) {
  return (
    <section className={`hl-panel ${className}`}>
      {(title || subtitle) && (
        <div className="hl-panel-header">
          {title && <h3 className="hl-panel-title">{title}</h3>}
          {subtitle && <p className="mt-0.5">{subtitle}</p>}
        </div>
      )}
      <div className="hl-panel-body">{children}</div>
    </section>
  );
}

export function FilterBar({ children, className = '' }) {
  return <div className={`hl-filter-bar ${className}`}>{children}</div>;
}

export function DataTable({ children, empty, emptyMessage = 'Aucune donnee' }) {
  return (
    <div className="hl-table-shell">
      <div className="hl-table-wrap">{children}</div>
      {empty && <p className="border-0 bg-transparent px-4 pb-6 text-center text-sm text-slate-500">{emptyMessage}</p>}
    </div>
  );
}

export function EmptyState({ children }) {
  return <div className="hl-empty">{children}</div>;
}

export function FilterChip({ active, onClick, children, variant = 'default' }) {
  const variantCls = variant === 'amber' ? 'hl-chip-amber' : variant === 'emerald' ? 'hl-chip-emerald' : '';
  return (
    <button type="button" onClick={onClick} className={`hl-chip ${variantCls} ${active ? 'hl-chip-active' : ''}`}>
      {children}
    </button>
  );
}

export function BloodGroupBadge({ group }) {
  const rare = group?.endsWith('-');
  return <span className={`hl-blood-badge ${rare ? 'hl-blood-badge-rare' : ''}`}>{group}</span>;
}

export function UrgenceBadge({ niveau }) {
  const map = { critique: 'hl-urgence-critique', urgent: 'hl-urgence-urgent', normal: 'hl-urgence-normal' };
  return <span className={map[niveau] || map.normal}>{niveau}</span>;
}

const STATUT_CLASS = {
  en_cours: 'hl-statut-en_cours',
  resolue: 'hl-statut-resolue',
  expiree: 'hl-statut-expiree',
  annulee: 'hl-statut-annulee',
};

export function AlerteStatutBadge({ statut }) {
  const labels = { en_cours: 'En cours', resolue: 'R?solue', expiree: 'Expir?e', annulee: 'Annul?e' };
  return <span className={`hl-badge ${STATUT_CLASS[statut] || 'hl-statut-expiree'}`}>{labels[statut] || statut}</span>;
}

export function ReponseBadge({ reponse }) {
  const map = {
    accepte: 'bg-emerald-100 text-emerald-900 ring-1 ring-emerald-200/80',
    refuse: 'bg-slate-100 text-slate-600',
    pas_repondu: 'bg-amber-100 text-amber-900 ring-1 ring-amber-200/80',
  };
  const labels = { accepte: 'Accept?', refuse: 'Refus?', pas_repondu: 'En attente' };
  return <span className={`hl-badge ${map[reponse] || map.pas_repondu}`}>{labels[reponse] || reponse}</span>;
}

export function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="hl-modal-backdrop" role="dialog" aria-modal="true">
      <div className="hl-modal-box">
        <div className="hl-modal-header flex items-center justify-between gap-3">
          <h3>{title}</h3>
          <button type="button" onClick={onClose} className="rounded-lg border border-white/20 px-2 py-1 text-xs text-white hover:bg-white/10">
            x
          </button>
        </div>
        <div className="hl-modal-body">{children}</div>
      </div>
    </div>
  );
}
