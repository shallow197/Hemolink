// =====================================================================
// NotificationBell.jsx — Cloche de notifications dans le header
// =====================================================================
// Polling toutes les 30s. Badge rouge avec le compteur. Clic = dropdown.
// =====================================================================

import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchJson } from '../api';

export default function NotificationBell() {
  const [data, setData] = useState({ total: 0, items: [] });
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  async function load() {
    try {
      const d = await fetchJson('/api/notifications/count');
      setData(d);
    } catch {
      /* silencieux */
    }
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-lg border border-gray-200 bg-white p-2 text-gray-700 hover:bg-gray-50"
        title="Notifications"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {data.total > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white ring-2 ring-white">
            {data.total > 99 ? '99+' : data.total}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-2xl border border-gray-200 bg-white shadow-xl">
          <div className="border-b border-gray-100 px-4 py-3">
            <p className="text-sm font-bold text-gray-900">Notifications</p>
            <p className="text-xs text-gray-500">{data.total === 0 ? 'Aucune notification' : `${data.total} nouvelle${data.total > 1 ? 's' : ''}`}</p>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {data.items.length === 0 ? (
              <p className="p-6 text-center text-sm text-gray-400">Rien à signaler.</p>
            ) : (
              data.items.map((it) => (
                <Link
                  key={it.id}
                  to={it.lien}
                  onClick={() => setOpen(false)}
                  className="flex items-start gap-3 border-b border-gray-50 px-4 py-3 hover:bg-slate-50"
                >
                  <span className="text-xl">{it.icone}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{it.titre}</p>
                    <p className="text-xs text-gray-500 truncate">{it.desc}</p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
