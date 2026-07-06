// =====================================================================
// AiSidebar.jsx — Sidebar de l'assistant IA HemoLink
// =====================================================================
// Interface de chat slide-in à droite. L'utilisateur tape une question,
// elle est envoyée à /api/ai/chat qui interroge Groq (Llama 3.3 70B).
// Quatre suggestions rapides en haut pour gagner du temps en démo.
// =====================================================================

import { useState } from 'react';
import { fetchJson } from '../api';

// --- Suggestions rapides cliquables (gain de temps en démo) ---
const SUGGESTIONS = [
  'Donneurs O+ disponibles à Dakar',
  'Hôpitaux en stock critique',
  'Alertes actives ce soir',
  'Statistiques du mois',
];

export default function AiSidebar({ open, onToggle }) {
  // Historique de la conversation (initialisé avec un message d'accueil)
  const [messages, setMessages] = useState([
    { role: 'assistant', text: "Bonjour, je suis l'assistant HemoLink. Posez-moi une question sur les donneurs, les stocks ou les alertes." },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // --- Envoi d'un message à l'API IA ---
  // 1. On ajoute immédiatement le message user dans la liste (UX réactif)
  // 2. On appelle /api/ai/chat avec le texte
  // 3. La réponse de l'assistant est ajoutée à la liste
  async function send(text) {
    const t = text.trim();
    if (!t) return;
    setMessages((m) => [...m, { role: 'user', text: t }]);
    setInput('');
    setLoading(true);
    try {
      const data = await fetchJson('/api/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ lastUserMessage: t }),
      });
      setMessages((m) => [...m, { role: 'assistant', text: data.reply }]);
    } catch (e) {
      setMessages((m) => [...m, { role: 'assistant', text: `Erreur : ${e.message}` }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <aside
      className={`fixed right-0 top-0 z-40 flex h-full flex-col border-l border-slate-200/80 bg-white shadow-2xl transition-all duration-300 ${
        open ? 'w-full sm:w-[400px]' : 'w-0 overflow-hidden border-0'
      }`}
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-brand-navy to-brand-navy-light px-4 py-4 text-white">
          <div>
            <p className="font-display text-sm font-bold">Assistant IA HemoLink</p>
            <p className="text-xs text-slate-300">Groq · données en direct</p>
          </div>
          <button
            type="button"
            onClick={onToggle}
            className="rounded-lg border border-white/20 bg-white/10 px-2.5 py-1 text-xs hover:bg-white/20"
          >
            Fermer
          </button>
        </div>

        <div className="flex flex-wrap gap-2 border-b border-slate-100 bg-slate-50/80 px-3 py-3">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => send(s)}
              disabled={loading}
              className="rounded-full border border-blood/20 bg-blood-light px-2.5 py-1 text-[11px] font-medium text-blood hover:bg-blood/10 disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-3 text-sm">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`rounded-xl px-3 py-2 ${
                msg.role === 'user'
                  ? 'ml-6 bg-blood text-white shadow-sm'
                  : 'mr-4 border border-gray-100 bg-slate-50 text-gray-800'
              }`}
            >
              <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
            </div>
          ))}
          {loading && <p className="text-xs text-gray-400">Réflexion en cours…</p>}
        </div>

        <form
          className="border-t border-gray-100 bg-white p-3"
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
        >
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="hl-input flex-1"
              placeholder="Votre question…"
            />
            <button
              type="submit"
              disabled={loading}
              className="hl-btn-primary shrink-0 px-4 disabled:opacity-50"
            >
              Envoyer
            </button>
          </div>
        </form>
      </div>
    </aside>
  );
}

// =====================================================================
// EXPLICATION POUR LA SOUTENANCE (20 secondes) :
// ---------------------------------------------------------------------
// La sidebar IA est notre élément différenciant. Quand le médecin de Fann
// veut savoir "combien de O- disponibles à Dakar ?", il n'a pas besoin de
// connaître SQL ni de cliquer dans 5 menus : il pose la question en
// français, l'IA (Llama 3.3 70B via Groq) génère la requête SELECT,
// notre garde de sécurité (sqlGuard.js) vérifie qu'elle est inoffensive,
// on l'exécute en lecture seule, puis on RE-DEMANDE à l'IA de reformuler
// les résultats bruts en phrase naturelle. L'utilisateur ne voit jamais
// ni le SQL ni le JSON brut. Les suggestions cliquables en haut permettent
// de démontrer la fonctionnalité en 2 secondes pendant la soutenance.
// =====================================================================
